package migrator

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"slices"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
)

const connectionTestTimeout = 30 * time.Second

type ConnectionErrorCode string

const (
	ConnectionErrorNetwork        ConnectionErrorCode = "network"
	ConnectionErrorTLS            ConnectionErrorCode = "tls"
	ConnectionErrorAuthentication ConnectionErrorCode = "authentication"
	ConnectionErrorProtocol       ConnectionErrorCode = "protocol"
	ConnectionErrorCanceled       ConnectionErrorCode = "canceled"
)

// ConnectionError has a stable Code for API mapping while retaining the
// underlying error for diagnostics with errors.Is/errors.As.
type ConnectionError struct {
	Code     ConnectionErrorCode
	Endpoint string
	Err      error
}

func (err *ConnectionError) Error() string {
	switch err.Code {
	case ConnectionErrorTLS:
		return fmt.Sprintf("не удалось установить TLS-соединение с %s: %v", err.Endpoint, err.Err)
	case ConnectionErrorAuthentication:
		return fmt.Sprintf("сервер %s отклонил логин или пароль: %v", err.Endpoint, err.Err)
	case ConnectionErrorProtocol:
		return fmt.Sprintf("сервер %s вернул некорректный IMAP-ответ: %v", err.Endpoint, err.Err)
	case ConnectionErrorCanceled:
		return fmt.Sprintf("проверка соединения с %s отменена: %v", err.Endpoint, err.Err)
	default:
		return fmt.Sprintf("не удалось подключиться к IMAP-серверу %s: %v", err.Endpoint, err.Err)
	}
}

func (err *ConnectionError) Unwrap() error { return err.Err }

func testIMAPConnection(parent context.Context, endpoint Endpoint, baseTLSConfig *tls.Config) error {
	return withAuthenticatedIMAPClient(parent, endpoint, baseTLSConfig, nil)
}

func listIMAPFolders(parent context.Context, endpoint Endpoint, baseTLSConfig *tls.Config) ([]Folder, error) {
	folders := make([]Folder, 0, 32)
	err := withAuthenticatedIMAPClient(parent, endpoint, baseTLSConfig, func(client *imapclient.Client) error {
		mailboxes, err := client.List("", "*", nil).Collect()
		if err != nil {
			return err
		}
		for _, mailbox := range mailboxes {
			if mailbox == nil || strings.TrimSpace(mailbox.Mailbox) == "" || slices.Contains(mailbox.Attrs, imap.MailboxAttrNoSelect) {
				continue
			}
			folder := Folder{Name: mailbox.Mailbox}
			if mailbox.Delim != 0 {
				folder.Delimiter = string(mailbox.Delim)
			}
			folders = append(folders, folder)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.SliceStable(folders, func(i, j int) bool {
		left := strings.ToLower(folders[i].Name)
		right := strings.ToLower(folders[j].Name)
		if left == "inbox" {
			return right != "inbox"
		}
		if right == "inbox" {
			return false
		}
		return left < right
	})
	return folders, nil
}

func withAuthenticatedIMAPClient(parent context.Context, endpoint Endpoint, baseTLSConfig *tls.Config, use func(*imapclient.Client) error) error {
	ctx, cancel := context.WithTimeout(parent, connectionTestTimeout)
	defer cancel()

	address := net.JoinHostPort(endpoint.Host, strconv.Itoa(endpoint.Port))
	dialer := &net.Dialer{}
	connection, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return newConnectionError(ctx, ConnectionErrorNetwork, address, err)
	}
	defer connection.Close()

	if deadline, ok := ctx.Deadline(); ok {
		if err := connection.SetDeadline(deadline); err != nil {
			return newConnectionError(ctx, ConnectionErrorNetwork, address, err)
		}
	}

	stopCancellationWatch := closeConnectionOnCancellation(ctx, connection)
	defer stopCancellationWatch()

	tlsConfig := cloneTLSConfig(baseTLSConfig, endpoint.Host)
	options := &imapclient.Options{TLSConfig: tlsConfig}

	var client *imapclient.Client
	switch endpoint.Security {
	case SecurityTLS:
		tlsConnection := tls.Client(connection, tlsConfig)
		if err := tlsConnection.HandshakeContext(ctx); err != nil {
			return newConnectionError(ctx, ConnectionErrorTLS, address, err)
		}
		client = imapclient.New(tlsConnection, options)
	case SecurityStartTLS:
		client, err = imapclient.NewStartTLS(connection, options)
		if err != nil {
			return newConnectionError(ctx, ConnectionErrorTLS, address, err)
		}
	case SecurityPlain:
		client = imapclient.New(connection, options)
	default:
		return &ConnectionError{Code: ConnectionErrorProtocol, Endpoint: address, Err: fmt.Errorf("неподдерживаемый режим защиты %q", endpoint.Security)}
	}
	defer client.Close()

	if err := client.Login(endpoint.Username, endpoint.Password).Wait(); err != nil {
		return classifyLoginError(ctx, address, err)
	}
	if use != nil {
		if err := use(client); err != nil {
			return newConnectionError(ctx, ConnectionErrorProtocol, address, err)
		}
	}
	if err := client.Logout().Wait(); err != nil {
		return newConnectionError(ctx, ConnectionErrorProtocol, address, err)
	}
	return nil
}

func cloneTLSConfig(base *tls.Config, serverName string) *tls.Config {
	var config *tls.Config
	if base == nil {
		config = &tls.Config{}
	} else {
		config = base.Clone()
	}
	config.ServerName = serverName
	if config.MinVersion == 0 {
		config.MinVersion = tls.VersionTLS12
	}
	return config
}

func closeConnectionOnCancellation(ctx context.Context, connection net.Conn) func() {
	stopped := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			_ = connection.Close()
		case <-stopped:
		}
	}()
	return func() { close(stopped) }
}

func classifyLoginError(ctx context.Context, endpoint string, err error) error {
	if ctx.Err() != nil {
		return newConnectionError(ctx, ConnectionErrorCanceled, endpoint, err)
	}
	var imapErr *imap.Error
	if errors.As(err, &imapErr) {
		if imapErr.Type == imap.StatusResponseTypeNo {
			return &ConnectionError{Code: ConnectionErrorAuthentication, Endpoint: endpoint, Err: err}
		}
		return &ConnectionError{Code: ConnectionErrorProtocol, Endpoint: endpoint, Err: err}
	}
	var netErr net.Error
	if errors.As(err, &netErr) {
		return &ConnectionError{Code: ConnectionErrorNetwork, Endpoint: endpoint, Err: err}
	}
	return &ConnectionError{Code: ConnectionErrorProtocol, Endpoint: endpoint, Err: err}
}

func newConnectionError(ctx context.Context, fallback ConnectionErrorCode, endpoint string, err error) error {
	if ctx.Err() != nil {
		return &ConnectionError{Code: ConnectionErrorCanceled, Endpoint: endpoint, Err: ctx.Err()}
	}
	return &ConnectionError{Code: fallback, Endpoint: endpoint, Err: err}
}
