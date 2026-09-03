package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/jobs"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func TestHealthIdentifiesMoveMailbox(t *testing.T) {
	engine := migrator.DemoEngine{}
	request := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	response := httptest.NewRecorder()

	newTestHandler(engine).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("health status = %d, want %d", response.Code, http.StatusOK)
	}
	var health struct {
		Product string `json:"product"`
		Name    string `json:"name"`
		Version string `json:"version"`
		Storage struct {
			Kind    string `json:"kind"`
			Healthy bool   `json:"healthy"`
		} `json:"storage"`
	}
	if err := json.NewDecoder(response.Body).Decode(&health); err != nil {
		t.Fatal(err)
	}
	if health.Product != ProductID || health.Name != ProductName || health.Version != Version {
		t.Fatalf("unexpected health identity: %+v", health)
	}
	if health.Storage.Kind != "memory" || !health.Storage.Healthy {
		t.Fatalf("unexpected storage health: %+v", health.Storage)
	}
}

func TestRequestGuardRejectsUntrustedHost(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	request.Host = "evil.example"
	response := httptest.NewRecorder()

	newTestHandler(migrator.DemoEngine{}).ServeHTTP(response, request)

	if response.Code != http.StatusMisdirectedRequest {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusMisdirectedRequest)
	}
}

func TestRequestGuardRejectsCrossSiteAndPlainTextPosts(t *testing.T) {
	tests := []struct {
		name        string
		origin      string
		fetchSite   string
		contentType string
		want        int
	}{
		{name: "cross site", origin: "https://evil.example", fetchSite: "cross-site", contentType: "application/json", want: http.StatusForbidden},
		{name: "plain text", contentType: "text/plain;charset=UTF-8", want: http.StatusUnsupportedMediaType},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/jobs/missing/cancel", nil)
			request.Header.Set("Content-Type", test.contentType)
			if test.origin != "" {
				request.Header.Set("Origin", test.origin)
			}
			if test.fetchSite != "" {
				request.Header.Set("Sec-Fetch-Site", test.fetchSite)
			}
			response := httptest.NewRecorder()

			newTestHandler(migrator.DemoEngine{}).ServeHTTP(response, request)

			if response.Code != test.want {
				t.Fatalf("status = %d, want %d", response.Code, test.want)
			}
		})
	}
}

func TestStaticAssetsUseETag(t *testing.T) {
	handler := newTestHandler(migrator.DemoEngine{})
	firstRequest := httptest.NewRequest(http.MethodGet, "/app.js", nil)
	firstResponse := httptest.NewRecorder()
	handler.ServeHTTP(firstResponse, firstRequest)
	if firstResponse.Code != http.StatusOK {
		t.Fatalf("first status = %d, want %d", firstResponse.Code, http.StatusOK)
	}
	etag := firstResponse.Header().Get("ETag")
	if etag == "" {
		t.Fatal("expected ETag")
	}

	secondRequest := httptest.NewRequest(http.MethodGet, "/app.js", nil)
	secondRequest.Header.Set("If-None-Match", etag)
	secondResponse := httptest.NewRecorder()
	handler.ServeHTTP(secondResponse, secondRequest)
	if secondResponse.Code != http.StatusNotModified {
		t.Fatalf("second status = %d, want %d", secondResponse.Code, http.StatusNotModified)
	}
}

func TestUnavailableEngineReturnsStructuredServiceUnavailable(t *testing.T) {
	engine := unavailableEngine{}
	request := httptest.NewRequest(http.MethodPost, "/api/jobs", strings.NewReader(`{
		"source":{"host":"source.example","port":993,"security":"tls","username":"source@example.test","password":"one"},
		"destination":{"host":"destination.example","port":993,"security":"tls","username":"destination@example.test","password":"two"},
		"options":{}
	}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	newTestHandler(engine).ServeHTTP(response, request)

	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusServiceUnavailable, response.Body.String())
	}
	var payload struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if payload.Error.Code != "engine.unavailable" {
		t.Fatalf("error code = %q, want engine.unavailable", payload.Error.Code)
	}
}

func TestFolderListingReturnsDemoFolders(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/connections/folders", strings.NewReader(`{
		"host":"source.example","port":993,"security":"tls","username":"source@example.test","password":"one"
	}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	newTestHandler(migrator.DemoEngine{}).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusOK, response.Body.String())
	}
	var payload struct {
		Folders []migrator.Folder `json:"folders"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if len(payload.Folders) == 0 || payload.Folders[0].Name != "INBOX" {
		t.Fatalf("unexpected folder response: %+v", payload.Folders)
	}
}

func TestSSEUsesSequenceIDsAndFinishes(t *testing.T) {
	engine := instantEngine{}
	manager := jobs.NewManager(engine, 1)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = manager.Shutdown(ctx)
	})
	handler := New(engine, manager, Config{AllowedHosts: []string{"example.com"}})
	view, err := manager.Start(validMigrationRequest())
	if err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		view, _ = manager.Get(view.ID)
		if view.Status == jobs.StatusCompleted {
			break
		}
		time.Sleep(time.Millisecond)
	}
	if view.Status != jobs.StatusCompleted || view.Sequence == 0 {
		t.Fatalf("job did not complete: %+v", view)
	}

	request := httptest.NewRequest(http.MethodGet, "/api/jobs/"+view.ID+"/events", nil)
	request.Header.Set("Last-Event-ID", "0")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	body, err := io.ReadAll(response.Result().Body)
	if err != nil {
		t.Fatal(err)
	}
	text := string(body)
	if !strings.Contains(text, "event: migration") || !strings.Contains(text, "id: ") || !strings.Contains(text, `"type":"finished"`) {
		t.Fatalf("unexpected SSE body: %s", text)
	}
}

func TestInitialSSESnapshotDoesNotReplayIncludedEvents(t *testing.T) {
	engine := instantEngine{}
	manager := jobs.NewManager(engine, 1)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = manager.Shutdown(ctx)
	})
	handler := New(engine, manager, Config{AllowedHosts: []string{"example.com"}})
	view, err := manager.Start(validMigrationRequest())
	if err != nil {
		t.Fatal(err)
	}
	view = waitForAPIJobStatus(t, manager, view.ID, jobs.StatusCompleted)

	request := httptest.NewRequest(http.MethodGet, "/api/jobs/"+view.ID+"/events", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	body := response.Body.String()
	if strings.Count(body, "event: snapshot") != 1 {
		t.Fatalf("expected one snapshot, body: %s", body)
	}
	if strings.Contains(body, "event: migration") {
		t.Fatalf("snapshot events were replayed and would duplicate UI logs: %s", body)
	}
}

func waitForAPIJobStatus(t *testing.T, manager *jobs.Manager, id string, status jobs.Status) jobs.View {
	t.Helper()
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		view, ok := manager.Get(id)
		if ok && view.Status == status {
			return view
		}
		time.Sleep(time.Millisecond)
	}
	view, _ := manager.Get(id)
	t.Fatalf("job did not reach %s: %+v", status, view)
	return jobs.View{}
}

type unavailableEngine struct{}

func (unavailableEngine) Name() string    { return "unavailable" }
func (unavailableEngine) Available() bool { return false }
func (unavailableEngine) TestConnection(context.Context, migrator.Endpoint, func(migrator.Event)) error {
	return nil
}
func (unavailableEngine) Migrate(context.Context, migrator.Request, func(migrator.Event)) (migrator.Result, error) {
	return migrator.Result{}, nil
}

type instantEngine struct{}

func (instantEngine) Name() string    { return "instant" }
func (instantEngine) Available() bool { return true }
func (instantEngine) TestConnection(context.Context, migrator.Endpoint, func(migrator.Event)) error {
	return nil
}
func (instantEngine) Migrate(_ context.Context, _ migrator.Request, emit func(migrator.Event)) (migrator.Result, error) {
	emit(migrator.Event{Type: "progress", Phase: jobs.PhaseCopying, Progress: 50, Transferred: 1})
	return migrator.Result{Transferred: 1}, nil
}

func validMigrationRequest() migrator.Request {
	return migrator.Request{
		Source:      migrator.Endpoint{Host: "source.example", Port: 993, Security: migrator.SecurityTLS, Username: "source@example.test", Password: "one"},
		Destination: migrator.Endpoint{Host: "destination.example", Port: 993, Security: migrator.SecurityTLS, Username: "destination@example.test", Password: "two"},
	}
}

func newTestHandler(engine migrator.Engine) http.Handler {
	return New(engine, jobs.NewManager(engine, 1), Config{AllowedHosts: []string{"example.com"}})
}
