package migrator

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	transferredPattern = regexp.MustCompile(`(?i)Messages transferred\s*:\s*([0-9]+)`)
	skippedPattern     = regexp.MustCompile(`(?i)Messages skipped\s*:\s*([0-9]+)`)
	bytesPattern       = regexp.MustCompile(`(?i)Total bytes transferred\s*:\s*([0-9]+)`)
	folderPattern      = regexp.MustCompile(`(?i)(?:Folder|Considering folder)\s+\[?([^\]]+)\]?`)
)

type ImapsyncEngine struct {
	Binary string
}

func (e ImapsyncEngine) Name() string { return "imapsync" }

func (e ImapsyncEngine) binary() string {
	if strings.TrimSpace(e.Binary) == "" {
		return "imapsync"
	}
	return e.Binary
}

func (e ImapsyncEngine) Available() bool {
	_, err := exec.LookPath(e.binary())
	return err == nil
}

func (e ImapsyncEngine) TestConnection(ctx context.Context, endpoint Endpoint, emit func(Event)) error {
	request := Request{Source: endpoint, Destination: endpoint}
	_, err := e.run(ctx, request, true, emit)
	return err
}

func (e ImapsyncEngine) Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error) {
	return e.run(ctx, request, false, emit)
}

func (e ImapsyncEngine) run(ctx context.Context, request Request, justLogin bool, emit func(Event)) (Result, error) {
	if !e.Available() {
		return Result{}, errors.New("imapsync не найден; установите его или запустите приложение в Docker")
	}

	tempDir, err := os.MkdirTemp("", "mailbox-migrator-")
	if err != nil {
		return Result{}, fmt.Errorf("создание защищённого каталога: %w", err)
	}
	defer os.RemoveAll(tempDir)
	if err := os.Chmod(tempDir, 0o700); err != nil {
		return Result{}, fmt.Errorf("защита временного каталога: %w", err)
	}

	pass1 := tempDir + string(os.PathSeparator) + "source.pass"
	pass2 := tempDir + string(os.PathSeparator) + "destination.pass"
	if err := os.WriteFile(pass1, []byte(request.Source.Password), 0o600); err != nil {
		return Result{}, fmt.Errorf("подготовка пароля источника: %w", err)
	}
	if err := os.WriteFile(pass2, []byte(request.Destination.Password), 0o600); err != nil {
		return Result{}, fmt.Errorf("подготовка пароля назначения: %w", err)
	}

	args := buildArgs(request, pass1, pass2, justLogin)
	cmd := exec.CommandContext(ctx, e.binary(), args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return Result{}, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return Result{}, err
	}

	if err := cmd.Start(); err != nil {
		return Result{}, fmt.Errorf("запуск imapsync: %w", err)
	}

	lines := make(chan string, 64)
	var scanners sync.WaitGroup
	scan := func(reader io.Reader) {
		defer scanners.Done()
		scanner := bufio.NewScanner(reader)
		scanner.Buffer(make([]byte, 64*1024), 1024*1024)
		for scanner.Scan() {
			lines <- scanner.Text()
		}
	}
	scanners.Add(2)
	go scan(stdout)
	go scan(stderr)

	result := Result{}
	done := make(chan error, 1)
	go func() {
		err := cmd.Wait()
		scanners.Wait()
		close(lines)
		done <- err
	}()

	for line := range lines {
		line = scrub(line, request.Source.Password, request.Destination.Password)
		if strings.TrimSpace(line) == "" {
			continue
		}
		updateResult(line, &result)
		event := Event{Type: "log", Message: line, Transferred: result.Transferred, Skipped: result.Skipped, Bytes: result.Bytes, Timestamp: time.Now()}
		if match := folderPattern.FindStringSubmatch(line); len(match) == 2 {
			event.Type = "progress"
			event.Phase = "Копирование"
			event.CurrentFolder = strings.TrimSpace(match[1])
		}
		emit(event)
	}
	err = <-done
	if err == nil {
		return result, nil
	}
	if ctx.Err() != nil {
		return result, ctx.Err()
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		return result, fmt.Errorf("imapsync завершился с кодом %d: %s", exitErr.ExitCode(), exitMessage(exitErr.ExitCode()))
	}
	return result, err
}

func buildArgs(request Request, pass1, pass2 string, justLogin bool) []string {
	args := []string{
		"--host1", request.Source.Host,
		"--port1", strconv.Itoa(request.Source.Port),
		"--user1", request.Source.Username,
		"--passfile1", pass1,
		"--host2", request.Destination.Host,
		"--port2", strconv.Itoa(request.Destination.Port),
		"--user2", request.Destination.Username,
		"--passfile2", pass2,
		"--noreleasecheck",
		"--nolog",
	}
	args = append(args, securityArgs("1", request.Source.Security)...)
	args = append(args, securityArgs("2", request.Destination.Security)...)
	if justLogin {
		args = append(args, "--justlogin")
	}
	if request.Options.DryRun {
		args = append(args, "--dry")
	}
	if request.Options.PreserveDates {
		args = append(args, "--syncinternaldates")
	}
	if !request.Options.SyncFlags {
		args = append(args, "--noresyncflags")
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

func updateResult(line string, result *Result) {
	if match := transferredPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Transferred, _ = strconv.ParseInt(match[1], 10, 64)
	}
	if match := skippedPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Skipped, _ = strconv.ParseInt(match[1], 10, 64)
	}
	if match := bytesPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Bytes, _ = strconv.ParseInt(match[1], 10, 64)
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
