package worker

import (
	"context"
	"errors"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
)

func TestEventPersistenceFailureCannotReportSuccess(t *testing.T) {
	public, private, token := remoteTestSecrets(t)
	engine := &remoteTestEngine{}
	service := newRemoteTestService(t, filepath.Join(t.TempDir(), "worker.db"), private, token, engine)
	// Inject a real SQLite write error, not an engine/network error. Other writes
	// remain available so terminal failure and credential deletion can commit.
	_, err := service.jobs.db.Exec(`CREATE TRIGGER reject_test_event BEFORE INSERT ON worker_events BEGIN SELECT RAISE(ABORT, 'injected event write failure'); END`)
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, public, token)
	defer runner.Close()
	if err := runner.Prepare(context.Background(), "write-failure", workerTestRequest()); err != nil {
		t.Fatal(err)
	}
	if _, err := runner.Run(context.Background(), "write-failure", nil); err == nil {
		t.Fatal("event write failure reported as successful migration")
	}
	snapshot, exists, err := service.jobs.get(context.Background(), "write-failure", 0)
	if err != nil || !exists || snapshot.Status != remoteStatusFailed || snapshot.Attempts != 1 || !strings.Contains(snapshot.Error, "progress could not be persisted") {
		t.Fatalf("unexpected terminal state: %+v %v", snapshot, err)
	}
	_, err = service.envelopes.Lease(context.Background(), "write-failure", "check", time.Now(), time.Second)
	if !errors.Is(err, credentials.ErrNotFound) {
		t.Fatalf("terminal envelope not removed: %v", err)
	}
	if _, err := service.jobs.db.Exec(`DROP TRIGGER reject_test_event`); err != nil {
		t.Fatal(err)
	}
	if err := runner.Prepare(context.Background(), "after-repair", workerTestRequest()); err != nil {
		t.Fatal(err)
	}
	if _, err := runner.Run(context.Background(), "after-repair", nil); err != nil {
		t.Fatalf("new migration after storage repair failed: %v", err)
	}
}
