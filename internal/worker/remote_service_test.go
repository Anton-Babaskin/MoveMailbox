package worker

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type remoteTestEngine struct {
	mu        sync.Mutex
	attempts  int
	failUntil int
	block     bool
	steps     int
	stepDelay time.Duration
}

func (*remoteTestEngine) Name() string    { return "remote-test" }
func (*remoteTestEngine) Available() bool { return true }
func (*remoteTestEngine) TestConnection(_ context.Context, endpoint migrator.Endpoint, emit func(migrator.Event)) error {
	emit(migrator.Event{Type: "log", Message: "connected " + endpoint.Password, Timestamp: time.Now()})
	return nil
}
func (engine *remoteTestEngine) ListFolders(context.Context, migrator.Endpoint) ([]migrator.Folder, error) {
	return []migrator.Folder{{Name: "INBOX"}, {Name: "Projects/MoveMailbox", Delimiter: "/"}}, nil
}
func (engine *remoteTestEngine) Migrate(ctx context.Context, request migrator.Request, emit func(migrator.Event)) (migrator.Result, error) {
	engine.mu.Lock()
	engine.attempts++
	attempt := engine.attempts
	engine.mu.Unlock()
	emit(migrator.Event{Type: "log", Message: "copy with " + request.Source.Password, Timestamp: time.Now()})
	if engine.block {
		<-ctx.Done()
		return migrator.Result{}, ctx.Err()
	}
	for index := 0; index < engine.steps; index++ {
		select {
		case <-ctx.Done():
			return migrator.Result{}, ctx.Err()
		case <-time.After(engine.stepDelay):
		}
		emit(migrator.Event{Type: "progress", Message: "step", Progress: index + 1, Timestamp: time.Now()})
	}
	if attempt <= engine.failUntil {
		return migrator.Result{}, errors.New("temporary failure " + request.Destination.Password)
	}
	return migrator.Result{Transferred: 11, Bytes: 99}, nil
}

func TestRemoteWorkerRenewsLeaseDuringSlowMigration(t *testing.T) {
	publicKey, privateKey, token := remoteTestSecrets(t)
	service := newRemoteTestService(t, filepath.Join(t.TempDir(), "worker.db"), privateKey, token, &remoteTestEngine{steps: 10, stepDelay: 100 * time.Millisecond})
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, publicKey, token)
	defer runner.Close()
	if err := runner.Prepare(context.Background(), "slow-job", workerTestRequest()); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	result, err := runner.Run(ctx, "slow-job", nil)
	if err != nil {
		t.Fatal(err)
	}
	if result.Transferred != 11 {
		t.Fatalf("slow migration result = %+v", result)
	}
	shutdownRemoteTestService(t, service)
}

func TestRemoteWorkerServiceRoundTripRetriesAndLeavesNoPlaintext(t *testing.T) {
	publicKey, privateKey, token := remoteTestSecrets(t)
	databasePath := filepath.Join(t.TempDir(), "worker.db")
	engine := &remoteTestEngine{failUntil: 1}
	service := newRemoteTestService(t, databasePath, privateKey, token, engine)
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, publicKey, token)
	defer runner.Close()
	if !runner.Available() {
		t.Fatal("healthy remote worker was unavailable")
	}
	request := workerTestRequest()
	if err := runner.TestConnection(context.Background(), request.Source, func(event migrator.Event) {
		if strings.Contains(event.Message, request.Source.Password) {
			t.Fatal("connection event leaked the endpoint password")
		}
	}); err != nil {
		t.Fatal(err)
	}
	folders, err := runner.ListFolders(context.Background(), request.Source)
	if err != nil || len(folders) != 2 {
		t.Fatalf("folders = %+v, error=%v", folders, err)
	}
	if err := runner.Prepare(context.Background(), "remote-job", request); err != nil {
		t.Fatal(err)
	}
	var events []migrator.Event
	result, err := runner.Run(context.Background(), "remote-job", func(event migrator.Event) {
		events = append(events, event)
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Transferred != 11 || result.Bytes != 99 || len(events) < 2 {
		t.Fatalf("result=%+v events=%+v", result, events)
	}
	engine.mu.Lock()
	attempts := engine.attempts
	engine.mu.Unlock()
	if attempts != 2 {
		t.Fatalf("migration attempts = %d, want 2", attempts)
	}
	for _, event := range events {
		if strings.Contains(event.Message, request.Source.Password) || strings.Contains(event.Message, request.Destination.Password) {
			t.Fatalf("remote event leaked a password: %+v", event)
		}
	}
	if err := runner.Delete(context.Background(), "remote-job"); err != nil {
		t.Fatal(err)
	}
	shutdownRemoteTestService(t, service)
	for _, suffix := range []string{"", "-wal", "-shm"} {
		payload, err := os.ReadFile(databasePath + suffix)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			t.Fatal(err)
		}
		for _, secret := range []string{request.Source.Password, request.Destination.Password} {
			if bytes.Contains(payload, []byte(secret)) {
				t.Fatalf("worker SQLite %s contains plaintext secret %q", suffix, secret)
			}
		}
	}
}

func TestRemoteWorkerResumesAfterServiceRestart(t *testing.T) {
	publicKey, privateKey, token := remoteTestSecrets(t)
	databasePath := filepath.Join(t.TempDir(), "worker.db")
	blockingEngine := &remoteTestEngine{block: true}
	serviceOne := newRemoteTestService(t, databasePath, privateKey, token, blockingEngine)
	serverOne := httptest.NewServer(serviceOne.Handler())
	runnerOne := newRemoteTestRunner(t, serverOne.URL, publicKey, token)
	request := workerTestRequest()
	if err := runnerOne.Prepare(context.Background(), "restart-job", request); err != nil {
		t.Fatal(err)
	}
	if err := runnerOne.activate(context.Background(), "restart-job"); err != nil {
		t.Fatal(err)
	}
	waitRemoteStatus(t, runnerOne, "restart-job", remoteStatusRunning)
	shutdownRemoteTestService(t, serviceOne)
	serverOne.Close()
	_ = runnerOne.Close()

	completingEngine := &remoteTestEngine{}
	serviceTwo := newRemoteTestService(t, databasePath, privateKey, token, completingEngine)
	serverTwo := httptest.NewServer(serviceTwo.Handler())
	defer serverTwo.Close()
	runnerTwo := newRemoteTestRunner(t, serverTwo.URL, publicKey, token)
	defer runnerTwo.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	result, err := runnerTwo.Run(ctx, "restart-job", nil)
	if err != nil {
		t.Fatal(err)
	}
	if result.Transferred != 11 {
		t.Fatalf("resumed result = %+v", result)
	}
	shutdownRemoteTestService(t, serviceTwo)
}

func TestRemoteWorkerRejectsWrongInternalToken(t *testing.T) {
	publicKey, privateKey, token := remoteTestSecrets(t)
	databasePath := filepath.Join(t.TempDir(), "worker.db")
	service := newRemoteTestService(t, databasePath, privateKey, token, &remoteTestEngine{})
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	wrongToken := base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0x91}, 32))
	runner := newRemoteTestRunner(t, server.URL, publicKey, wrongToken)
	defer runner.Close()
	if err := runner.Prepare(context.Background(), "unauthorized-job", workerTestRequest()); err == nil || !strings.Contains(err.Error(), "unauthorized") {
		t.Fatalf("wrong-token Prepare error = %v", err)
	}
	shutdownRemoteTestService(t, service)
}

func newRemoteTestService(t *testing.T, path, privateKey, token string, engine migrator.Engine) *Service {
	t.Helper()
	service, err := NewService(ServiceConfig{
		DatabasePath: path, PrivateKey: privateKey, Token: token, Engine: engine,
		MaxConcurrent: 1, MaxAttempts: 3, LeaseTTL: time.Second,
		PollInterval: 5 * time.Millisecond, RetryBase: 10 * time.Millisecond,
		ResumeInterrupted: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := service.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = service.Shutdown(ctx)
	})
	return service
}

func newRemoteTestRunner(t *testing.T, serverURL, publicKey, token string) *RemoteRunner {
	t.Helper()
	runner, err := NewRemoteRunner(RemoteConfig{
		URL: serverURL, PublicKey: publicKey, Token: token, CredentialTTL: time.Hour,
		PollInterval: 5 * time.Millisecond,
	})
	if err != nil {
		t.Fatal(err)
	}
	return runner
}

func remoteTestSecrets(t *testing.T) (string, string, string) {
	t.Helper()
	public, private, err := credentials.GenerateRecipientKeyPair()
	if err != nil {
		t.Fatal(err)
	}
	return base64.StdEncoding.EncodeToString(public), base64.StdEncoding.EncodeToString(private), base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0x73}, 32))
}

func waitRemoteStatus(t *testing.T, runner *RemoteRunner, jobID, status string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		snapshot, exists, err := runner.snapshot(context.Background(), jobID, 0)
		if err == nil && exists && snapshot.Status == status {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("remote job %s did not reach %s", jobID, status)
}

func shutdownRemoteTestService(t *testing.T, service *Service) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := service.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
}
