package worker

import (
	"context"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type counterEngine struct{ remoteTestEngine }

func (*counterEngine) Migrate(_ context.Context, _ migrator.Request, emit func(migrator.Event)) (migrator.Result, error) {
	total, remaining, size, eta := int64(10), int64(0), int64(2048), int64(0)
	for index := 0; index < remoteEventLimit+20; index++ {
		emit(migrator.Event{
			Type: "log", Message: "synthetic native observation", CountersUpdated: true,
			ProgressCounters: migrator.ProgressCounters{TotalMessages: &total, RemainingMessages: &remaining, TotalBytes: &size, ETASeconds: &eta},
		})
	}
	return migrator.Result{Transferred: 10, Bytes: 2048}, nil
}

func TestCountersCrossEncryptedWorkerAndSurviveEventTrimmingAndRestart(t *testing.T) {
	publicKey, privateKey, token := remoteTestSecrets(t)
	path := filepath.Join(t.TempDir(), "worker.db")
	service := newRemoteTestService(t, path, privateKey, token, &counterEngine{})
	server := httptest.NewServer(service.Handler())
	runner := newRemoteTestRunner(t, server.URL, publicKey, token)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	defer func() { runner.Close(); server.Close(); shutdownRemoteTestService(t, service) }()
	if err := runner.Prepare(ctx, "counter-job", workerTestRequest()); err != nil {
		t.Fatal(err)
	}
	var last migrator.Event
	if _, err := runner.Run(ctx, "counter-job", func(event migrator.Event) { last = event }); err != nil {
		t.Fatal(err)
	}
	check := func(event migrator.Event) {
		t.Helper()
		if !event.CountersUpdated || event.TotalMessages == nil || *event.TotalMessages != 10 || event.TotalBytes == nil || *event.TotalBytes != 2048 || event.RemainingMessages == nil || *event.RemainingMessages != 0 || event.ETASeconds == nil || *event.ETASeconds != 0 {
			t.Fatalf("counter observation lost in worker protocol: %+v", event)
		}
	}
	check(last)
	runner.Close()
	server.Close()
	shutdownRemoteTestService(t, service)
	service = newRemoteTestService(t, path, privateKey, token, &counterEngine{})
	server = httptest.NewServer(service.Handler())
	runner = newRemoteTestRunner(t, server.URL, publicKey, token)
	snapshot, exists, err := runner.snapshot(ctx, "counter-job", 0)
	if err != nil || !exists || snapshot.Status != remoteStatusCompleted || len(snapshot.Events) != remoteEventLimit || snapshot.Events[0].Sequence <= 1 {
		t.Fatalf("persisted trimmed snapshot: exists=%v status=%s events=%d err=%v", exists, snapshot.Status, len(snapshot.Events), err)
	}
	check(snapshot.Events[len(snapshot.Events)-1].Event)
}
