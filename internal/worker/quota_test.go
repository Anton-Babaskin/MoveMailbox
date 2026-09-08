package worker

import (
	"context"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type quotaTestEngine struct{ remoteTestEngine }

func (*quotaTestEngine) EstimateMailbox(context.Context, migrator.Endpoint) (migrator.MailboxEstimate, error) {
	return migrator.MailboxEstimate{Bytes: 5000000001, Messages: 2, Folders: 2}, nil
}

func TestRemoteWorkerQuotaIsTerminalBeforeCopy(t *testing.T) {
	public, private, token := remoteTestSecrets(t)
	engine := &quotaTestEngine{}
	service := newRemoteTestService(t, filepath.Join(t.TempDir(), "worker.db"), private, token, migrator.QuotaEngine{Engine: engine, MaxMailboxBytes: 5000000000})
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, public, token)
	defer runner.Close()
	request := workerTestRequest()
	request.Options.Folders = []string{"Tiny"}
	if err := runner.Prepare(context.Background(), "quota-job", request); err != nil {
		t.Fatal(err)
	}
	if _, err := runner.Run(context.Background(), "quota-job", nil); err == nil {
		t.Fatal("expected rejection")
	}
	snapshot, exists, err := service.jobs.get(context.Background(), "quota-job", 0)
	if err != nil || !exists || snapshot.Status != remoteStatusFailed || snapshot.Attempts != 1 {
		t.Fatalf("unexpected terminal job: %+v %v", snapshot, err)
	}
	engine.mu.Lock()
	calls := engine.attempts
	engine.mu.Unlock()
	if calls != 0 {
		t.Fatal("copy engine was invoked")
	}
	_, err = service.envelopes.Lease(context.Background(), "quota-job", "check", time.Now(), time.Second)
	if err == nil {
		t.Fatal("terminal credential envelope still available")
	}
}
