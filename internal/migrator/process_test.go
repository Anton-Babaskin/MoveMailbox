package migrator

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"
)

func TestRunImapsyncProcessDrainsOutputTailBeforeWait(t *testing.T) {
	request := testRequest()
	cmd := helperProcessCommand(context.Background(), "tail")
	cmd.Env = imapsyncEnvironment(cmd.Env, request.Source.Password, request.Destination.Password)

	var messages []string
	result, err := runImapsyncProcess(context.Background(), cmd, request, func(event Event) {
		messages = append(messages, event.Message)
	})
	if err != nil {
		t.Fatalf("runImapsyncProcess failed: %v", err)
	}
	if result != (Result{Transferred: 42, Skipped: 7, Bytes: 1048576}) {
		t.Fatalf("unexpected result: %+v", result)
	}
	if !containsString(messages, "stdout-tail-sentinel") || !containsString(messages, "stderr-tail-sentinel") {
		t.Fatalf("output tail was lost; got %d messages, tail=%v", len(messages), messages[max(0, len(messages)-5):])
	}
}

func TestRunImapsyncProcessScrubsChildEnvironmentSecrets(t *testing.T) {
	request := testRequest()
	cmd := helperProcessCommand(context.Background(), "secrets")
	cmd.Env = imapsyncEnvironment(cmd.Env, request.Source.Password, request.Destination.Password)

	var output strings.Builder
	_, err := runImapsyncProcess(context.Background(), cmd, request, func(event Event) {
		output.WriteString(event.Message)
		output.WriteByte('\n')
	})
	if err != nil {
		t.Fatalf("runImapsyncProcess failed: %v", err)
	}
	if strings.Contains(output.String(), request.Source.Password) || strings.Contains(output.String(), request.Destination.Password) {
		t.Fatalf("password leaked into emitted log: %q", output.String())
	}
	if got := strings.Count(output.String(), "••••••••"); got < 2 {
		t.Fatalf("expected both passwords to be scrubbed, got %q", output.String())
	}
}

func TestRunImapsyncProcessCancellationIsBounded(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cmd := helperProcessCommand(ctx, "hang")

	started := time.Now()
	_, err := runImapsyncProcess(ctx, cmd, testRequest(), func(event Event) {
		if event.Message == "ready-to-cancel" {
			cancel()
		}
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context cancellation, got %v", err)
	}
	if elapsed := time.Since(started); elapsed > processWaitDelay+2*time.Second {
		t.Fatalf("cancellation took too long: %v", elapsed)
	}
}

func TestScanReadersReportsScannerErrorAfterBufferedLine(t *testing.T) {
	wantErr := errors.New("synthetic reader failure")
	reader := &readerWithTerminalError{data: []byte("complete line\n"), err: wantErr}

	var lines []string
	var gotErr error
	for record := range scanReaders(reader) {
		if record.err != nil {
			gotErr = record.err
		} else {
			lines = append(lines, record.line)
		}
	}
	if len(lines) != 1 || lines[0] != "complete line" {
		t.Fatalf("buffered line was not delivered: %v", lines)
	}
	if !errors.Is(gotErr, wantErr) {
		t.Fatalf("scanner error = %v, want %v", gotErr, wantErr)
	}
}

type readerWithTerminalError struct {
	data []byte
	err  error
}

func (reader *readerWithTerminalError) Read(buffer []byte) (int, error) {
	if len(reader.data) > 0 {
		n := copy(buffer, reader.data)
		reader.data = reader.data[n:]
		return n, nil
	}
	if reader.err != nil {
		err := reader.err
		reader.err = nil
		return 0, err
	}
	return 0, io.EOF
}

func helperProcessCommand(ctx context.Context, scenario string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, os.Args[0], "-test.run=^TestImapsyncHelperProcess$", "--", scenario)
	cmd.Env = append(os.Environ(), "MOVEMAILBOX_HELPER_PROCESS=1")
	return cmd
}

func TestImapsyncHelperProcess(t *testing.T) {
	if os.Getenv("MOVEMAILBOX_HELPER_PROCESS") != "1" {
		return
	}
	scenario := os.Args[len(os.Args)-1]
	switch scenario {
	case "tail":
		for index := 0; index < 5000; index++ {
			fmt.Fprintf(os.Stdout, "log line %d\n", index)
		}
		fmt.Fprintln(os.Stdout, "Messages transferred : 42")
		fmt.Fprintln(os.Stdout, "Messages skipped : 7")
		fmt.Fprintln(os.Stdout, "Total bytes transferred : 1048576")
		fmt.Fprintln(os.Stdout, "stdout-tail-sentinel")
		fmt.Fprintln(os.Stderr, "stderr-tail-sentinel")
	case "secrets":
		fmt.Fprintln(os.Stdout, os.Getenv("IMAPSYNC_PASSWORD1"))
		fmt.Fprintln(os.Stderr, os.Getenv("IMAPSYNC_PASSWORD2"))
	case "hang":
		fmt.Fprintln(os.Stdout, "ready-to-cancel")
		for {
			time.Sleep(time.Second)
		}
	default:
		fmt.Fprintln(os.Stderr, "unknown helper scenario")
		os.Exit(2)
	}
	os.Exit(0)
}

func containsString(values []string, wanted string) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}
	return false
}
