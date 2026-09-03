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

func TestPublicGuestSessionsEnforceCookieCSRFAndJobOwnership(t *testing.T) {
	handler, manager := newPublicTestHandler(t, instantEngine{}, Config{})
	aliceCookie, aliceCSRF := createGuestSession(t, handler)
	bobCookie, bobCSRF := createGuestSession(t, handler)
	if aliceCookie.Value == bobCookie.Value {
		t.Fatal("two visitors received the same guest session")
	}

	publicRequest := validMigrationRequest()
	publicRequest.Source.Host = "8.8.8.8"
	publicRequest.Destination.Host = "1.1.1.1"
	payload, err := json.Marshal(publicRequest)
	if err != nil {
		t.Fatal(err)
	}
	create := httptest.NewRequest(http.MethodPost, "/api/jobs", strings.NewReader(string(payload)))
	create.Header.Set("Content-Type", "application/json")
	create.Header.Set("X-CSRF-Token", aliceCSRF)
	create.AddCookie(aliceCookie)
	created := httptest.NewRecorder()
	handler.ServeHTTP(created, create)
	if created.Code != http.StatusAccepted {
		t.Fatalf("create status = %d; body=%s", created.Code, created.Body.String())
	}
	createdBody := created.Body.String()
	var job jobs.View
	if err := json.NewDecoder(strings.NewReader(createdBody)).Decode(&job); err != nil {
		t.Fatal(err)
	}
	ownerID := strings.SplitN(aliceCookie.Value, ".", 2)[0]
	if strings.Contains(createdBody, ownerID) {
		t.Fatal("public job response leaked its internal owner ID")
	}
	waitForAPIJobStatus(t, manager, job.ID, jobs.StatusCompleted)

	bobList := httptest.NewRequest(http.MethodGet, "/api/jobs", nil)
	bobList.AddCookie(bobCookie)
	bobListResponse := httptest.NewRecorder()
	handler.ServeHTTP(bobListResponse, bobList)
	if bobListResponse.Code != http.StatusOK || strings.TrimSpace(bobListResponse.Body.String()) != "[]" {
		t.Fatalf("bob list status=%d body=%s", bobListResponse.Code, bobListResponse.Body.String())
	}

	for _, endpoint := range []string{"/api/jobs/" + job.ID, "/api/jobs/" + job.ID + "/events"} {
		request := httptest.NewRequest(http.MethodGet, endpoint, nil)
		request.AddCookie(bobCookie)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != http.StatusNotFound {
			t.Fatalf("bob GET %s status = %d, want 404", endpoint, response.Code)
		}
	}

	cancel := httptest.NewRequest(http.MethodPost, "/api/jobs/"+job.ID+"/cancel", strings.NewReader(`{}`))
	cancel.Header.Set("Content-Type", "application/json")
	cancel.Header.Set("X-CSRF-Token", bobCSRF)
	cancel.AddCookie(bobCookie)
	cancelResponse := httptest.NewRecorder()
	handler.ServeHTTP(cancelResponse, cancel)
	if cancelResponse.Code != http.StatusNotFound {
		t.Fatalf("bob cancel status = %d, want 404", cancelResponse.Code)
	}
}

func TestPublicModeRejectsMissingCSRFAndRateLimitsSessions(t *testing.T) {
	handler, _ := newPublicTestHandler(t, migrator.DemoEngine{}, Config{SessionRequestsPerMinute: 2})
	cookie, _ := createGuestSession(t, handler)

	request := httptest.NewRequest(http.MethodPost, "/api/jobs/missing/cancel", strings.NewReader(`{}`))
	request.Header.Set("Content-Type", "application/json")
	request.AddCookie(cookie)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusForbidden || !strings.Contains(response.Body.String(), "request.csrf.invalid") {
		t.Fatalf("missing CSRF status=%d body=%s", response.Code, response.Body.String())
	}

	limited := httptest.NewRequest(http.MethodGet, "/api/jobs", nil)
	limited.AddCookie(cookie)
	limitedResponse := httptest.NewRecorder()
	handler.ServeHTTP(limitedResponse, limited)
	if limitedResponse.Code != http.StatusTooManyRequests || limitedResponse.Header().Get("Retry-After") == "" {
		t.Fatalf("rate limit status=%d retry=%q body=%s", limitedResponse.Code, limitedResponse.Header().Get("Retry-After"), limitedResponse.Body.String())
	}
}

func TestPublicModeRequiresStrongSessionSecret(t *testing.T) {
	if err := (Config{PublicMode: true, SessionSecret: "too-short"}).Validate(); err == nil {
		t.Fatal("public config accepted a weak session secret")
	}
}

func TestPublicModeRejectsPrivateIMAPTargets(t *testing.T) {
	handler, _ := newPublicTestHandler(t, migrator.DemoEngine{}, Config{})
	cookie, csrf := createGuestSession(t, handler)
	request := httptest.NewRequest(http.MethodPost, "/api/connections/test", strings.NewReader(`{
		"host":"169.254.169.254","port":993,"security":"tls","username":"source@example.test","password":"one"
	}`))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-CSRF-Token", csrf)
	request.AddCookie(cookie)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusForbidden || !strings.Contains(response.Body.String(), "connection.target.denied") {
		t.Fatalf("private target status=%d body=%s", response.Code, response.Body.String())
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

func newPublicTestHandler(t *testing.T, engine migrator.Engine, overrides Config) (http.Handler, *jobs.Manager) {
	t.Helper()
	manager := jobs.NewManagerWithConfig(engine, jobs.Config{MaxConcurrent: 2, MaxActivePerOwner: 1, CompletedTTL: -1})
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = manager.Shutdown(ctx)
	})
	overrides.AllowedHosts = []string{"example.com"}
	overrides.PublicMode = true
	overrides.SessionSecret = strings.Repeat("s", 48)
	if overrides.IPRequestsPerMinute == 0 {
		overrides.IPRequestsPerMinute = 1000
	}
	return New(engine, manager, overrides), manager
}

func createGuestSession(t *testing.T, handler http.Handler) (*http.Cookie, string) {
	t.Helper()
	request := httptest.NewRequest(http.MethodGet, "/api/session", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("session status = %d; body=%s", response.Code, response.Body.String())
	}
	cookies := response.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("session cookies = %d, want 1", len(cookies))
	}
	cookie := cookies[0]
	if cookie.Name != guestCookieName || !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/" {
		t.Fatalf("insecure guest cookie: %+v", cookie)
	}
	var payload struct {
		Mode      string `json:"mode"`
		CSRFToken string `json:"csrfToken"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if payload.Mode != "guest" || payload.CSRFToken == "" {
		t.Fatalf("unexpected session payload: %+v", payload)
	}
	return cookie, payload.CSRFToken
}
