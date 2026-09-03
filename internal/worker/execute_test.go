package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type testEngine struct {
	errorMode bool
}

func (testEngine) Name() string    { return "test" }
func (testEngine) Available() bool { return true }
func (testEngine) TestConnection(context.Context, migrator.Endpoint, func(migrator.Event)) error {
	return nil
}
func (engine testEngine) Migrate(_ context.Context, request migrator.Request, emit func(migrator.Event)) (migrator.Result, error) {
	emit(migrator.Event{Type: "log", Message: "processing " + request.Source.Password, Timestamp: time.Now()})
	if engine.errorMode {
		return migrator.Result{}, errors.New("destination rejected " + request.Destination.Password)
	}
	return migrator.Result{Transferred: 7, Bytes: 42}, nil
}

func (testEngine) ListFolders(_ context.Context, endpoint migrator.Endpoint) ([]migrator.Folder, error) {
	if endpoint.Password == "" {
		return nil, errors.New("missing password")
	}
	return []migrator.Folder{{Name: "INBOX", Delimiter: "/"}, {Name: "Archive/2026", Delimiter: "/"}}, nil
}

func TestExecuteDecryptsOnlyInsideWorkerAndDeletesEnvelope(t *testing.T) {
	for _, errorMode := range []bool{false, true} {
		t.Run(map[bool]string{false: "success", true: "failure"}[errorMode], func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "movemailbox.db")
			key := bytes.Repeat([]byte{0x44}, 32)
			request := workerTestRequest()
			sealer, err := credentials.NewSealer(key, time.Hour)
			if err != nil {
				t.Fatal(err)
			}
			envelope, err := sealer.Seal("job-worker", request)
			sealer.Destroy()
			if err != nil {
				t.Fatal(err)
			}
			store, err := credentials.OpenSQLiteStore(path)
			if err != nil {
				t.Fatal(err)
			}
			if err := store.Put(context.Background(), envelope); err != nil {
				t.Fatal(err)
			}
			if err := store.Close(); err != nil {
				t.Fatal(err)
			}

			var output bytes.Buffer
			err = Execute(context.Background(), ExecuteConfig{
				JobID: "job-worker", WorkerID: "worker-test", DatabasePath: path,
				MasterKey: key, LeaseTTL: time.Minute, Engine: testEngine{errorMode: errorMode}, Output: &output,
			})
			if errorMode == (err == nil) {
				t.Fatalf("Execute() error = %v, errorMode=%v", err, errorMode)
			}
			for _, secret := range []string{request.Source.Password, request.Destination.Password} {
				if strings.Contains(output.String(), secret) {
					t.Fatalf("worker protocol leaked %q: %s", secret, output.String())
				}
			}
			decoder := json.NewDecoder(bytes.NewReader(output.Bytes()))
			var messages []protocolMessage
			for decoder.More() {
				var message protocolMessage
				if err := decoder.Decode(&message); err != nil {
					t.Fatal(err)
				}
				messages = append(messages, message)
			}
			if len(messages) != 2 || messages[0].Type != messageEvent {
				t.Fatalf("messages = %+v", messages)
			}
			store, err = credentials.OpenSQLiteStore(path)
			if err != nil {
				t.Fatal(err)
			}
			defer store.Close()
			if exists, err := store.Exists(context.Background(), "job-worker", time.Now()); err != nil || exists {
				t.Fatalf("terminal envelope exists=%v, error=%v", exists, err)
			}
		})
	}
}

func TestExecuteTransientAuthenticatesOperationAndHidesEndpointSecret(t *testing.T) {
	key := bytes.Repeat([]byte{0x55}, 32)
	sealer, err := credentials.NewSealer(key, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	endpoint := workerTestRequest().Source
	payload := transientPayload{Operation: operationListFolders, Endpoint: endpoint}
	envelope, err := sealer.SealJSON("operation-test", payload)
	sealer.Destroy()
	if err != nil {
		t.Fatal(err)
	}
	encoded, err := json.Marshal(envelope)
	if err != nil {
		t.Fatal(err)
	}
	var output bytes.Buffer
	if err := ExecuteTransient(context.Background(), TransientConfig{
		EnvelopeID: "operation-test", Operation: operationListFolders, MasterKey: key,
		Engine: testEngine{}, Input: bytes.NewReader(encoded), Output: &output,
	}); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(output.String(), endpoint.Password) {
		t.Fatalf("transient protocol leaked password: %s", output.String())
	}
	outcome, err := consumeProtocol(bytes.NewReader(output.Bytes()), nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(outcome.folders) != 2 || outcome.folders[1].Name != "Archive/2026" {
		t.Fatalf("folders = %+v", outcome.folders)
	}

	var mismatch bytes.Buffer
	if err := ExecuteTransient(context.Background(), TransientConfig{
		EnvelopeID: "operation-test", Operation: operationTestConnection, MasterKey: key,
		Engine: testEngine{}, Input: bytes.NewReader(encoded), Output: &mismatch,
	}); err == nil {
		t.Fatal("operation substitution was accepted")
	}
}

func workerTestRequest() migrator.Request {
	return migrator.Request{
		Source:      migrator.Endpoint{Host: "source.example", Port: 993, Security: migrator.SecurityTLS, Username: "source@example.test", Password: "source-worker-secret"},
		Destination: migrator.Endpoint{Host: "destination.example", Port: 993, Security: migrator.SecurityTLS, Username: "destination@example.test", Password: "destination-worker-secret"},
	}
}
