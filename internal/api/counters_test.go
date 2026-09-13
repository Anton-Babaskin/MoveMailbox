package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Anton-Babaskin/MoveMailbox/internal/jobs"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type observedCounterEngine struct{ instantEngine }

func (observedCounterEngine) Migrate(_ context.Context, _ migrator.Request, emit func(migrator.Event)) (migrator.Result, error) {
	total, remaining, size := int64(10), int64(0), int64(2048)
	emit(migrator.Event{Type: "progress", CountersUpdated: true, ProgressCounters: migrator.ProgressCounters{
		TotalMessages: &total, RemainingMessages: &remaining, TotalBytes: &size, ETASeconds: &remaining,
	}})
	return migrator.Result{Transferred: 10, Bytes: 2048}, nil
}

func TestOwnedCounterViewAndSSESnapshot(t *testing.T) {
	engine := observedCounterEngine{}
	manager := jobs.NewManager(engine, 1)
	t.Cleanup(func() { _ = manager.Shutdown(context.Background()) })
	view, err := manager.StartFor("owner", validMigrationRequest())
	if err != nil {
		t.Fatal(err)
	}
	waitForAPIJobStatus(t, manager, view.ID, jobs.StatusCompleted)
	server := &Server{engine: engine, manager: manager, publicMode: true}
	for _, owner := range []string{"owner", "stranger"} {
		for _, stream := range []bool{false, true} {
			req := httptest.NewRequest(http.MethodGet, "/api/jobs/"+view.ID, nil)
			req.SetPathValue("id", view.ID)
			req = req.WithContext(context.WithValue(req.Context(), principalContextKey{}, guestPrincipal{id: owner}))
			response := httptest.NewRecorder()
			if stream {
				server.jobEvents(response, req)
			} else {
				server.getJob(response, req)
			}
			body := response.Body.String()
			if owner == "stranger" {
				if response.Code != 404 || strings.Contains(body, "totalMessages") {
					t.Fatal("counter view bypassed ownership")
				}
				continue
			}
			if response.Code != 200 {
				t.Fatalf("counter response: %d", response.Code)
			}
			for _, field := range []string{`"totalMessages":10`, `"remainingMessages":0`, `"totalBytes":2048`} {
				if !strings.Contains(body, field) {
					t.Fatalf("missing %s in counter response", field)
				}
			}
			if stream && !strings.Contains(body, "event: snapshot") {
				t.Fatal("missing named SSE snapshot")
			}
		}
	}
}
