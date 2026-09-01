package migrator

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type ImapsyncEngine struct {
	Binary string

	// TLSConfig is primarily useful for deployments with a private CA. A clone
	// is made for every connection, so callers may safely reuse the engine.
	TLSConfig *tls.Config
}

func (e ImapsyncEngine) Name() string { return "imapsync" }

func (e ImapsyncEngine) binary() string {
	if strings.TrimSpace(e.Binary) == "" {
		return "imapsync"
	}
	return e.Binary
}

func (e ImapsyncEngine) Available() bool {
	_, err := e.resolveBinary()
	return err == nil
}

func (e ImapsyncEngine) resolveBinary() (string, error) {
	name := e.binary()
	if resolved, err := exec.LookPath(name); err == nil {
		return resolved, nil
	}

	if filepath.Base(name) == name {
		if executable, err := os.Executable(); err == nil {
			candidates := []string{name}
			if runtime.GOOS == "windows" && filepath.Ext(name) == "" {
				candidates = append(candidates, name+".exe")
			}
			for _, candidateName := range candidates {
				candidate := filepath.Join(filepath.Dir(executable), candidateName)
				if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
					return candidate, nil
				}
			}
		}
	}

	return "", fmt.Errorf("исполняемый файл %q не найден", name)
}

func (e ImapsyncEngine) TestConnection(ctx context.Context, endpoint Endpoint, emit func(Event)) error {
	if err := endpoint.Validate(); err != nil {
		return err
	}
	if err := testIMAPConnection(ctx, endpoint, e.TLSConfig); err != nil {
		return err
	}
	if emit != nil {
		emit(Event{
			Type:      "log",
			Message:   fmt.Sprintf("Соединение с %s:%d установлено, авторизация успешна", endpoint.Host, endpoint.Port),
			Timestamp: time.Now(),
		})
	}
	return nil
}

func (e ImapsyncEngine) ListFolders(ctx context.Context, endpoint Endpoint) ([]Folder, error) {
	if err := endpoint.Validate(); err != nil {
		return nil, err
	}
	return listIMAPFolders(ctx, endpoint, e.TLSConfig)
}

func (e ImapsyncEngine) Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error) {
	binary, err := e.resolveBinary()
	if err != nil {
		return Result{}, errors.New("imapsync не найден; установите его или запустите приложение в Docker")
	}

	cmd := exec.CommandContext(ctx, binary, buildArgs(request)...)
	cmd.Env = imapsyncEnvironment(os.Environ(), request.Source.Password, request.Destination.Password)
	return runImapsyncProcess(ctx, cmd, request, emit)
}

func buildArgs(request Request) []string {
	args := []string{
		"--host1", request.Source.Host,
		"--port1", strconv.Itoa(request.Source.Port),
		"--user1", request.Source.Username,
		"--host2", request.Destination.Host,
		"--port2", strconv.Itoa(request.Destination.Port),
		"--user2", request.Destination.Username,
		"--noreleasecheck",
		"--nolog",
	}
	args = append(args, securityArgs("1", request.Source.Security)...)
	args = append(args, securityArgs("2", request.Destination.Security)...)
	if request.Options.DryRun {
		args = append(args, "--dry")
	}
	if request.Options.PreserveDates {
		args = append(args, "--syncinternaldates")
	}
	if !request.Options.SyncFlags {
		args = append(args, "--noresyncflags")
	}
	for _, folder := range request.Options.Folders {
		args = append(args, "--folder", folder)
	}
	if subfolder := strings.TrimSpace(request.Options.DestinationSubfolder); subfolder != "" {
		args = append(args, "--subfolder2", subfolder)
	}
	if request.Options.StrictMirror {
		args = append(args, "--delete2")
	}
	return args
}

func securityArgs(side string, mode SecurityMode) []string {
	switch mode {
	case SecurityTLS:
		return []string{"--ssl" + side, "--notls" + side}
	case SecurityStartTLS:
		return []string{"--nossl" + side, "--tls" + side}
	case SecurityPlain:
		return []string{"--nossl" + side, "--notls" + side}
	default:
		return nil
	}
}

func scrub(line string, secrets ...string) string {
	for _, secret := range secrets {
		if secret != "" {
			line = strings.ReplaceAll(line, secret, "••••••••")
		}
	}
	return line
}

func exitMessage(code int) string {
	switch code {
	case 10, 101, 102:
		return "не удалось подключиться к IMAP-серверу"
	case 12:
		return "ошибка TLS"
	case 16, 161, 162:
		return "ошибка авторизации"
	case 113:
		return "на сервере назначения закончилась квота"
	case 114:
		return "сервер назначения отклонил добавление письма"
	case 115:
		return "не удалось прочитать письмо с источника"
	default:
		return "подробности доступны в журнале задания"
	}
}
