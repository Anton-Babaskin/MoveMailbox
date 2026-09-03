package worker

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

const (
	defaultCredentialTTL = 24 * time.Hour
	defaultLeaseTTL      = 2 * time.Hour
	workerWaitDelay      = 15 * time.Second
	maxWorkerOutputLine  = 1 << 20
	maxWorkerErrorBytes  = 16 << 10
)

type ProcessConfig struct {
	Executable     string
	DatabasePath   string
	ImapsyncBinary string
	MasterKey      string
	CredentialTTL  time.Duration
	LeaseTTL       time.Duration
	Demo           bool
}

// ProcessRunner persists only authenticated ciphertext and launches a fresh
// worker process for every migration job.
type ProcessRunner struct {
	config    ProcessConfig
	masterKey []byte
	sealer    *credentials.Sealer
	store     credentials.Store
}

func NewProcessRunner(config ProcessConfig) (*ProcessRunner, error) {
	if strings.TrimSpace(config.Executable) == "" {
		executable, err := os.Executable()
		if err != nil {
			return nil, fmt.Errorf("resolve worker executable: %w", err)
		}
		config.Executable = executable
	}
	if config.CredentialTTL == 0 {
		config.CredentialTTL = defaultCredentialTTL
	}
	if config.LeaseTTL == 0 {
		config.LeaseTTL = defaultLeaseTTL
	}
	masterKey, err := credentials.ParseMasterKey(config.MasterKey)
	if err != nil {
		return nil, err
	}
	defer clearBytes(masterKey)
	sealer, err := credentials.NewSealer(masterKey, config.CredentialTTL)
	if err != nil {
		return nil, err
	}
	store, err := credentials.OpenSQLiteStore(config.DatabasePath)
	if err != nil {
		sealer.Destroy()
		return nil, err
	}
	// Do not retain the caller's immutable base64 string. Keep a byte slice we
	// can explicitly clear when the runner closes.
	config.MasterKey = ""
	return &ProcessRunner{
		config:    config,
		masterKey: append([]byte(nil), masterKey...),
		sealer:    sealer,
		store:     store,
	}, nil
}

func (runner *ProcessRunner) Prepare(ctx context.Context, jobID string, request migrator.Request) error {
	envelope, err := runner.sealer.Seal(jobID, request)
	if err != nil {
		return err
	}
	defer clearEnvelope(&envelope)
	if err := runner.store.Put(ctx, envelope); err != nil {
		return fmt.Errorf("persist credential envelope: %w", err)
	}
	return nil
}

func (runner *ProcessRunner) Name() string {
	if runner.config.Demo {
		return "demo-isolated-worker"
	}
	return "imapsync-isolated-worker"
}

func (runner *ProcessRunner) Available() bool {
	if info, err := os.Stat(runner.config.Executable); err != nil || info.IsDir() {
		return false
	}
	if runner.config.Demo {
		return true
	}
	return (migrator.ImapsyncEngine{Binary: runner.config.ImapsyncBinary}).Available()
}

func (runner *ProcessRunner) TestConnection(ctx context.Context, endpoint migrator.Endpoint, emit func(migrator.Event)) error {
	if err := endpoint.Validate(); err != nil {
		return err
	}
	_, err := runner.runTransient(ctx, operationTestConnection, endpoint, emit)
	return err
}

func (runner *ProcessRunner) ListFolders(ctx context.Context, endpoint migrator.Endpoint) ([]migrator.Folder, error) {
	if err := endpoint.Validate(); err != nil {
		return nil, err
	}
	outcome, err := runner.runTransient(ctx, operationListFolders, endpoint, nil)
	if err != nil {
		return nil, err
	}
	return outcome.folders, nil
}

// Migrate is intentionally unavailable without a prepared job ID. Hosted job
// execution must go through Prepare and Run so no plaintext request can bypass
// the envelope store.
func (*ProcessRunner) Migrate(context.Context, migrator.Request, func(migrator.Event)) (migrator.Result, error) {
	return migrator.Result{}, errors.New("isolated migrations require a prepared credential envelope")
}

func (runner *ProcessRunner) Run(ctx context.Context, jobID string, emit func(migrator.Event)) (migrator.Result, error) {
	workerID, err := randomWorkerID()
	if err != nil {
		return migrator.Result{}, err
	}
	arguments := []string{
		"worker",
		"--job-id", jobID,
		"--worker-id", workerID,
		"--database", runner.config.DatabasePath,
		"--imapsync", runner.config.ImapsyncBinary,
		"--lease-ttl", runner.config.LeaseTTL.String(),
	}
	if runner.config.Demo {
		arguments = append(arguments, "--demo")
	}
	outcome, err := runner.executeCommand(ctx, arguments, nil, emit)
	return outcome.result, err
}

func (runner *ProcessRunner) runTransient(ctx context.Context, operation string, endpoint migrator.Endpoint, emit func(migrator.Event)) (protocolOutcome, error) {
	envelopeID, err := randomOperationID()
	if err != nil {
		return protocolOutcome{}, err
	}
	payload := transientPayload{Operation: operation, Endpoint: endpoint}
	envelope, err := runner.sealer.SealJSON(envelopeID, payload)
	payload.Endpoint.Password = ""
	if err != nil {
		return protocolOutcome{}, err
	}
	encoded, err := json.Marshal(envelope)
	clearEnvelope(&envelope)
	if err != nil {
		return protocolOutcome{}, fmt.Errorf("encode transient credential envelope: %w", err)
	}
	defer clearBytes(encoded)
	arguments := []string{
		"worker",
		"--operation", operation,
		"--envelope-id", envelopeID,
		"--imapsync", runner.config.ImapsyncBinary,
	}
	if runner.config.Demo {
		arguments = append(arguments, "--demo")
	}
	return runner.executeCommand(ctx, arguments, bytes.NewReader(encoded), emit)
}

func (runner *ProcessRunner) executeCommand(ctx context.Context, arguments []string, stdin io.Reader, emit func(migrator.Event)) (protocolOutcome, error) {
	workerContext, cancelWorker := context.WithCancel(ctx)
	defer cancelWorker()
	cmd := exec.CommandContext(workerContext, runner.config.Executable, arguments...)
	configureWorkerProcess(cmd)
	cmd.WaitDelay = workerWaitDelay
	encodedMasterKey := base64.StdEncoding.EncodeToString(runner.masterKey)
	cmd.Env = replaceEnvironment(os.Environ(), "MOVEMAILBOX_MASTER_KEY", encodedMasterKey)
	encodedMasterKey = ""
	cmd.Stdin = stdin
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return protocolOutcome{}, fmt.Errorf("prepare worker stdout: %w", err)
	}
	stderr := &limitedBuffer{limit: maxWorkerErrorBytes}
	cmd.Stderr = stderr
	if err := cmd.Start(); err != nil {
		cmd.Env = nil
		return protocolOutcome{}, fmt.Errorf("start isolated worker: %w", err)
	}
	cmd.Env = nil

	outcome, protocolErr := consumeProtocol(stdout, emit)
	if protocolErr != nil {
		// A malformed or truncated protocol must not leave a credential-bearing
		// worker running after the API can no longer account for its result.
		cancelWorker()
	}
	waitErr := cmd.Wait()
	if ctx.Err() != nil {
		return outcome, ctx.Err()
	}
	if protocolErr != nil {
		return outcome, protocolErr
	}
	if waitErr != nil {
		message := strings.TrimSpace(stderr.String())
		if message == "" {
			message = waitErr.Error()
		}
		return outcome, fmt.Errorf("isolated worker stopped: %s", message)
	}
	return outcome, nil
}

func (runner *ProcessRunner) Recoverable(ctx context.Context, jobID string) (bool, error) {
	return runner.store.Exists(ctx, jobID, time.Now())
}

func (runner *ProcessRunner) Delete(ctx context.Context, jobID string) error {
	return runner.store.Delete(ctx, jobID)
}

func (runner *ProcessRunner) CleanupExpired(ctx context.Context) (int64, error) {
	return runner.store.CleanupExpired(ctx, time.Now())
}

func (runner *ProcessRunner) Close() error {
	runner.sealer.Destroy()
	clearBytes(runner.masterKey)
	runner.masterKey = nil
	runner.config.MasterKey = ""
	return runner.store.Close()
}

type protocolOutcome struct {
	result  migrator.Result
	folders []migrator.Folder
}

func consumeProtocol(reader io.Reader, emit func(migrator.Event)) (protocolOutcome, error) {
	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 64*1024), maxWorkerOutputLine)
	var outcome protocolOutcome
	var terminal bool
	for scanner.Scan() {
		var message protocolMessage
		if err := json.Unmarshal(scanner.Bytes(), &message); err != nil {
			return outcome, errors.New("isolated worker returned an invalid message")
		}
		switch message.Type {
		case messageEvent:
			if message.Event == nil {
				return outcome, errors.New("isolated worker returned an empty event")
			}
			if emit != nil {
				emit(*message.Event)
			}
		case messageResult:
			if message.Result == nil || terminal {
				return outcome, errors.New("isolated worker returned an invalid result")
			}
			outcome.result = *message.Result
			terminal = true
		case messageFolders:
			if terminal {
				return outcome, errors.New("isolated worker returned invalid folders")
			}
			outcome.folders = append([]migrator.Folder(nil), message.Folders...)
			terminal = true
		case messageError:
			if terminal || strings.TrimSpace(message.Error) == "" {
				return outcome, errors.New("isolated worker returned an invalid error")
			}
			terminal = true
			return outcome, errors.New(message.Error)
		default:
			return outcome, errors.New("isolated worker returned an unknown message")
		}
	}
	if err := scanner.Err(); err != nil {
		return outcome, fmt.Errorf("read isolated worker output: %w", err)
	}
	if !terminal {
		return outcome, errors.New("isolated worker exited without a result")
	}
	return outcome, nil
}

func randomWorkerID() (string, error) {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		return "", fmt.Errorf("create worker ID: %w", err)
	}
	return "worker-" + hex.EncodeToString(value), nil
}

func randomOperationID() (string, error) {
	id, err := randomWorkerID()
	if err != nil {
		return "", err
	}
	return "operation-" + strings.TrimPrefix(id, "worker-"), nil
}

func replaceEnvironment(environment []string, name, value string) []string {
	prefix := strings.ToUpper(name) + "="
	result := make([]string, 0, len(environment)+1)
	for _, entry := range environment {
		if strings.HasPrefix(strings.ToUpper(entry), prefix) {
			continue
		}
		result = append(result, entry)
	}
	return append(result, name+"="+value)
}

type limitedBuffer struct {
	buffer bytes.Buffer
	limit  int
}

func (buffer *limitedBuffer) Write(value []byte) (int, error) {
	written := len(value)
	if buffer.limit > buffer.buffer.Len() {
		remaining := buffer.limit - buffer.buffer.Len()
		if len(value) > remaining {
			value = value[:remaining]
		}
		_, _ = buffer.buffer.Write(value)
	}
	return written, nil
}

func (buffer *limitedBuffer) String() string { return buffer.buffer.String() }

func clearBytes(value []byte) {
	for index := range value {
		value[index] = 0
	}
}
