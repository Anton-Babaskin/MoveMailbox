package api

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/jobs"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type readinessEngine struct {
	instantEngine
	unavailable atomic.Bool
}

func (e *readinessEngine) Available() bool { return !e.unavailable.Load() }

func TestReadinessIsIndependentOfLivenessAndGuestSessions(t *testing.T) {
	engine := &readinessEngine{}
	handler, manager := newPublicTestHandler(t, engine, Config{})
	check := func(path string, want int) {
		t.Helper()
		r := httptest.NewRequest(http.MethodGet, path, nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("%s returned %d: %s", path, w.Code, w.Body.String())
		}
		if len(w.Result().Cookies()) != 0 {
			t.Fatal("probe created a guest session")
		}
		if path == "/api/ready" && w.Header().Get("Cache-Control") != "no-store" {
			t.Fatal("readiness must not be cached")
		}
	}
	check("/api/ready", http.StatusOK)
	engine.unavailable.Store(true)
	check("/api/ready", http.StatusServiceUnavailable)
	check("/api/health", http.StatusOK)
	engine.unavailable.Store(false)
	check("/api/ready", http.StatusOK)
	if err := manager.Shutdown(context.Background()); err != nil {
		t.Fatal(err)
	}
	check("/api/ready", http.StatusServiceUnavailable)
	check("/api/health", http.StatusOK)
	request := httptest.NewRequest(http.MethodGet, "http://untrusted.example/api/ready", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusMisdirectedRequest {
		t.Fatalf("readiness bypassed Host guard: %d", response.Code)
	}
}

func TestSSEGapResynchronizesOwnedSnapshot(t *testing.T) {
	for _, cursor := range []string{"0", "18446744073709551615"} {
		t.Run(cursor, func(t *testing.T) {
			engine := instantEngine{}
			manager := jobs.NewManagerWithConfig(engine, jobs.Config{EventHistoryLimit: 1})
			t.Cleanup(func() { _ = manager.Shutdown(context.Background()) })
			view, err := manager.StartFor("owner", validMigrationRequest())
			if err != nil {
				t.Fatal(err)
			}
			view = waitForAPIJobStatus(t, manager, view.ID, jobs.StatusCompleted)
			server := &Server{engine: engine, manager: manager, publicMode: true}
			for _, owner := range []string{"stranger", "owner"} {
				request := httptest.NewRequest(http.MethodGet, "/api/jobs/"+view.ID+"/events", nil)
				request.SetPathValue("id", view.ID)
				request.Header.Set("Last-Event-ID", cursor)
				request = request.WithContext(context.WithValue(request.Context(), principalContextKey{}, guestPrincipal{id: owner}))
				response := httptest.NewRecorder()
				server.jobEvents(response, request)
				body := response.Body.String()
				if owner == "stranger" {
					if response.Code != 404 || strings.Contains(body, view.ID) {
						t.Fatal("gap replay leaked owned job")
					}
					continue
				}
				if response.Code != 200 || strings.Count(body, "event: snapshot") != 1 || !strings.Contains(body, `"type":"gap"`) || !strings.Contains(body, `"status":"completed"`) {
					t.Fatalf("missing gap recovery: %s", body)
				}
				if strings.Contains(body, `"password"`) || !strings.Contains(body, fmt.Sprintf("id: %d\nevent: snapshot", view.Sequence)) {
					t.Fatalf("invalid snapshot cursor or payload: %s", body)
				}
				if strings.Count(body, "event: migration") != 1 {
					t.Fatalf("snapshot replay duplicated events: %s", body)
				}
			}
		})
	}
}

type silentStreamEngine struct {
	instantEngine
	started chan struct{}
}

func (e silentStreamEngine) Migrate(ctx context.Context, _ migrator.Request, _ func(migrator.Event)) (migrator.Result, error) {
	close(e.started)
	<-ctx.Done()
	return migrator.Result{}, ctx.Err()
}

func TestSSEReconnectFlushesHeadersWithoutWaitingForEvents(t *testing.T) {
	engine := silentStreamEngine{started: make(chan struct{})}
	manager := jobs.NewManager(engine, 1)
	t.Cleanup(func() { _ = manager.Shutdown(context.Background()) })
	view, err := manager.Start(validMigrationRequest())
	if err != nil {
		t.Fatal(err)
	}
	select {
	case <-engine.started:
	case <-time.After(time.Second):
		t.Fatal("engine did not start")
	}
	view, _ = manager.Get(view.ID)
	server := httptest.NewServer(New(engine, manager, Config{AllowedHosts: []string{"example.com"}}))
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	request, _ := http.NewRequestWithContext(ctx, http.MethodGet, server.URL+"/api/jobs/"+view.ID+"/events", nil)
	request.Host = "example.com"
	request.Header.Set("Last-Event-ID", strconv.FormatUint(view.Sequence, 10))
	response, err := server.Client().Do(request)
	if err != nil {
		t.Fatalf("reconnect headers blocked without new events: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != 200 || response.Header.Get("Content-Type") != "text/event-stream" {
		t.Fatalf("unexpected reconnect: %v", response.Status)
	}
}
