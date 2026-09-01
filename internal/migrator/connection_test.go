package migrator

import (
	"bufio"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net"
	"strings"
	"testing"
	"time"
)

func TestNativeIMAPConnectionModes(t *testing.T) {
	certificate, roots := testCertificate(t)
	tests := []struct {
		name     string
		security SecurityMode
	}{
		{name: "plain", security: SecurityPlain},
		{name: "implicit TLS", security: SecurityTLS},
		{name: "STARTTLS", security: SecurityStartTLS},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			address := startIMAPTestServer(t, imapServerOptions{
				security:    test.security,
				certificate: certificate,
				acceptLogin: true,
			})
			host, port := splitTestAddress(t, address)
			endpoint := Endpoint{Host: host, Port: port, Security: test.security, Username: "user@example.test", Password: "correct-password"}

			var events []Event
			engine := ImapsyncEngine{TLSConfig: &tls.Config{RootCAs: roots, MinVersion: tls.VersionTLS12}}
			if err := engine.TestConnection(context.Background(), endpoint, func(event Event) { events = append(events, event) }); err != nil {
				t.Fatalf("TestConnection failed: %v", err)
			}
			if len(events) != 1 || events[0].Type != "log" || !strings.Contains(events[0].Message, "авторизация успешна") {
				t.Fatalf("unexpected success events: %+v", events)
			}
		})
	}
}

func TestNativeIMAPConnectionReturnsTypedAuthenticationError(t *testing.T) {
	address := startIMAPTestServer(t, imapServerOptions{security: SecurityPlain, acceptLogin: false})
	host, port := splitTestAddress(t, address)
	endpoint := Endpoint{Host: host, Port: port, Security: SecurityPlain, Username: "user", Password: "wrong-password"}

	err := (ImapsyncEngine{}).TestConnection(context.Background(), endpoint, nil)
	var connectionErr *ConnectionError
	if !errors.As(err, &connectionErr) {
		t.Fatalf("expected ConnectionError, got %T: %v", err, err)
	}
	if connectionErr.Code != ConnectionErrorAuthentication {
		t.Fatalf("error code = %q, want %q: %v", connectionErr.Code, ConnectionErrorAuthentication, err)
	}
	if strings.Contains(err.Error(), endpoint.Password) {
		t.Fatalf("password leaked into connection error: %v", err)
	}
}

func TestNativeIMAPConnectionReturnsTypedTLSError(t *testing.T) {
	certificate, _ := testCertificate(t)
	address := startIMAPTestServer(t, imapServerOptions{
		security:         SecurityTLS,
		certificate:      certificate,
		acceptLogin:      true,
		ignoreServeError: true,
	})
	host, port := splitTestAddress(t, address)
	endpoint := Endpoint{Host: host, Port: port, Security: SecurityTLS, Username: "user", Password: "password"}

	err := (ImapsyncEngine{}).TestConnection(context.Background(), endpoint, nil)
	var connectionErr *ConnectionError
	if !errors.As(err, &connectionErr) || connectionErr.Code != ConnectionErrorTLS {
		t.Fatalf("expected typed TLS error, got %T: %v", err, err)
	}
}

func TestNativeIMAPConnectionAllowsServerToCloseDuringLogout(t *testing.T) {
	address := startIMAPTestServer(t, imapServerOptions{
		security:      SecurityPlain,
		acceptLogin:   true,
		closeOnLogout: true,
	})
	host, port := splitTestAddress(t, address)
	endpoint := Endpoint{Host: host, Port: port, Security: SecurityPlain, Username: "user", Password: "password"}

	if err := (ImapsyncEngine{}).TestConnection(context.Background(), endpoint, nil); err != nil {
		t.Fatalf("successful authentication must not fail on a logout close race: %v", err)
	}
}

func TestNativeIMAPConnectionHonorsContextCancellation(t *testing.T) {
	address := startIMAPTestServer(t, imapServerOptions{security: SecurityPlain, acceptLogin: true, hangOnLogin: true})
	host, port := splitTestAddress(t, address)
	endpoint := Endpoint{Host: host, Port: port, Security: SecurityPlain, Username: "user", Password: "password"}
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	started := time.Now()
	err := (ImapsyncEngine{}).TestConnection(ctx, endpoint, nil)
	if time.Since(started) > 2*time.Second {
		t.Fatalf("cancellation was not prompt: %v", time.Since(started))
	}
	var connectionErr *ConnectionError
	if !errors.As(err, &connectionErr) || connectionErr.Code != ConnectionErrorCanceled {
		t.Fatalf("expected typed cancellation error, got %T: %v", err, err)
	}
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("expected context deadline in error chain, got %v", err)
	}
}

type imapServerOptions struct {
	security      SecurityMode
	certificate   tls.Certificate
	acceptLogin   bool
	hangOnLogin   bool
	closeOnLogout bool
	// Some negative client tests intentionally abort a TLS handshake.
	ignoreServeError bool
}

func startIMAPTestServer(t *testing.T, options imapServerOptions) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() {
		connection, err := listener.Accept()
		if err != nil {
			done <- err
			return
		}
		done <- serveIMAPTestConnection(connection, options)
	}()

	t.Cleanup(func() {
		_ = listener.Close()
		select {
		case err := <-done:
			if err != nil && !options.ignoreServeError && !errors.Is(err, net.ErrClosed) && !errors.Is(err, io.EOF) {
				t.Errorf("fake IMAP server failed: %v", err)
			}
		case <-time.After(2 * time.Second):
			t.Error("fake IMAP server did not stop")
		}
	})
	return listener.Addr().String()
}

func serveIMAPTestConnection(connection net.Conn, options imapServerOptions) error {
	defer connection.Close()
	tlsConfig := &tls.Config{Certificates: []tls.Certificate{options.certificate}, MinVersion: tls.VersionTLS12}
	if options.security == SecurityTLS {
		tlsConnection := tls.Server(connection, tlsConfig)
		if err := tlsConnection.Handshake(); err != nil {
			return err
		}
		connection = tlsConnection
	}

	reader := bufio.NewReader(connection)
	writer := bufio.NewWriter(connection)
	if _, err := writer.WriteString("* OK [CAPABILITY IMAP4rev1 STARTTLS] MoveMailbox test server ready\r\n"); err != nil {
		return err
	}
	if err := writer.Flush(); err != nil {
		return err
	}

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			return err
		}
		fields := strings.Fields(strings.TrimSpace(line))
		if len(fields) < 2 {
			return fmt.Errorf("malformed IMAP command: %q", line)
		}
		tag, command := fields[0], strings.ToUpper(fields[1])

		switch command {
		case "CAPABILITY":
			fmt.Fprintf(writer, "* CAPABILITY IMAP4rev1 STARTTLS\r\n%s OK CAPABILITY completed\r\n", tag)
		case "STARTTLS":
			if options.security != SecurityStartTLS {
				fmt.Fprintf(writer, "%s BAD STARTTLS unavailable\r\n", tag)
				break
			}
			fmt.Fprintf(writer, "%s OK Begin TLS negotiation\r\n", tag)
			if err := writer.Flush(); err != nil {
				return err
			}
			tlsConnection := tls.Server(connection, tlsConfig)
			if err := tlsConnection.Handshake(); err != nil {
				return err
			}
			connection = tlsConnection
			reader = bufio.NewReader(connection)
			writer = bufio.NewWriter(connection)
			continue
		case "LOGIN":
			if options.hangOnLogin {
				_, err := io.Copy(io.Discard, reader)
				return err
			}
			if options.acceptLogin {
				fmt.Fprintf(writer, "%s OK LOGIN completed\r\n", tag)
			} else {
				fmt.Fprintf(writer, "%s NO authentication failed\r\n", tag)
			}
		case "LOGOUT":
			if options.closeOnLogout {
				return nil
			}
			fmt.Fprintf(writer, "* BYE Logging out\r\n%s OK LOGOUT completed\r\n", tag)
			return writer.Flush()
		default:
			fmt.Fprintf(writer, "%s BAD unsupported command\r\n", tag)
		}
		if err := writer.Flush(); err != nil {
			return err
		}
	}
}

func testCertificate(t *testing.T) (tls.Certificate, *x509.CertPool) {
	t.Helper()
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{
		SerialNumber: serial,
		Subject:      pkix.Name{CommonName: "MoveMailbox test IMAP"},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	certificateDER, err := x509.CreateCertificate(rand.Reader, template, template, &privateKey.PublicKey, privateKey)
	if err != nil {
		t.Fatal(err)
	}
	privateKeyDER, err := x509.MarshalPKCS8PrivateKey(privateKey)
	if err != nil {
		t.Fatal(err)
	}
	certificatePEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certificateDER})
	privateKeyPEM := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privateKeyDER})
	certificate, err := tls.X509KeyPair(certificatePEM, privateKeyPEM)
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	if !roots.AppendCertsFromPEM(certificatePEM) {
		t.Fatal("failed to add test certificate to roots")
	}
	return certificate, roots
}

func splitTestAddress(t *testing.T, address string) (string, int) {
	t.Helper()
	host, portText, err := net.SplitHostPort(address)
	if err != nil {
		t.Fatal(err)
	}
	var port int
	if _, err := fmt.Sscanf(portText, "%d", &port); err != nil {
		t.Fatal(err)
	}
	return host, port
}
