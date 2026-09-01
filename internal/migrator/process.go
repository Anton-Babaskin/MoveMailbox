package migrator

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

const processWaitDelay = 3 * time.Second

type scanRecord struct {
	line string
	err  error
}

func runImapsyncProcess(ctx context.Context, cmd *exec.Cmd, request Request, emit func(Event)) (Result, error) {
	configureProcess(cmd)
	cmd.WaitDelay = processWaitDelay

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return Result{}, fmt.Errorf("подготовка stdout imapsync: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return Result{}, fmt.Errorf("подготовка stderr imapsync: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cmd.Env = nil
		return Result{}, fmt.Errorf("запуск imapsync: %w", err)
	}
	// Start has copied the child environment. Drop our extra reference to the
	// password-bearing slice immediately instead of retaining it for the job.
	cmd.Env = nil

	if emit != nil {
		emit(Event{
			Type:          "progress",
			Phase:         "preparing",
			Indeterminate: true,
			Message:       "imapsync готовит список папок и сообщений",
			Timestamp:     time.Now(),
		})
	}

	stopPipeGuard := closePipesAfterCancellation(ctx, stdout, stderr)
	defer stopPipeGuard()

	records := scanReaders(stdout, stderr)
	result := Result{}
	progress := imapsyncProgress{}
	var scanErrs []error

	for record := range records {
		if record.err != nil {
			scanErrs = append(scanErrs, record.err)
			continue
		}

		line := scrub(record.line, request.Source.Password, request.Destination.Password)
		if strings.TrimSpace(line) == "" {
			continue
		}

		updateResult(line, &result)
		event, isProgress := progress.consume(line, &result)
		if !isProgress {
			event = Event{Type: "log"}
		}
		event.Message = line
		event.Transferred = result.Transferred
		event.Skipped = result.Skipped
		event.Bytes = result.Bytes
		event.Timestamp = time.Now()
		if emit != nil {
			emit(event)
		}
	}

	// StdoutPipe/StderrPipe require all reads to complete before Wait. Calling
	// Wait first can close a pipe while a scanner still has buffered tail data.
	waitErr := cmd.Wait()
	if ctx.Err() != nil {
		return result, ctx.Err()
	}
	if len(scanErrs) > 0 {
		return result, fmt.Errorf("чтение вывода imapsync: %w", errors.Join(scanErrs...))
	}
	if waitErr == nil {
		return result, nil
	}

	var exitErr *exec.ExitError
	if errors.As(waitErr, &exitErr) {
		return result, fmt.Errorf("imapsync завершился с кодом %d: %s", exitErr.ExitCode(), exitMessage(exitErr.ExitCode()))
	}
	return result, waitErr
}

func scanReaders(readers ...io.Reader) <-chan scanRecord {
	records := make(chan scanRecord, 128)
	var scanners sync.WaitGroup
	scanners.Add(len(readers))

	for _, reader := range readers {
		go func(reader io.Reader) {
			defer scanners.Done()
			scanner := bufio.NewScanner(reader)
			scanner.Buffer(make([]byte, 64*1024), 1024*1024)
			for scanner.Scan() {
				records <- scanRecord{line: scanner.Text()}
			}
			if err := scanner.Err(); err != nil {
				records <- scanRecord{err: err}
			}
		}(reader)
	}

	go func() {
		scanners.Wait()
		close(records)
	}()
	return records
}

func closePipesAfterCancellation(ctx context.Context, pipes ...io.Closer) func() {
	stopped := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			timer := time.NewTimer(processWaitDelay)
			defer timer.Stop()
			select {
			case <-timer.C:
				for _, pipe := range pipes {
					_ = pipe.Close()
				}
			case <-stopped:
			}
		case <-stopped:
		}
	}()

	var once sync.Once
	return func() { once.Do(func() { close(stopped) }) }
}

func imapsyncEnvironment(base []string, password1, password2 string) []string {
	const (
		password1Name = "IMAPSYNC_PASSWORD1"
		password2Name = "IMAPSYNC_PASSWORD2"
	)

	environment := make([]string, 0, len(base)+2)
	for _, item := range base {
		name, _, found := strings.Cut(item, "=")
		if found && (strings.EqualFold(name, password1Name) || strings.EqualFold(name, password2Name)) {
			continue
		}
		environment = append(environment, item)
	}
	return append(environment, password1Name+"="+password1, password2Name+"="+password2)
}

// os.ErrProcessDone is returned by Process.Signal after a process has already
// exited. Keeping this helper in the common file makes platform callbacks
// consistent with exec.Cmd.Cancel's contract.
func processAlreadyDone(err error) error {
	if errors.Is(err, os.ErrProcessDone) {
		return os.ErrProcessDone
	}
	return err
}
