package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func TestStagedAdmissionIsAtomicIdempotentAndDoesNotExecute(t *testing.T) {
	public, private, token := remoteTestSecrets(t)
	engine := &remoteTestEngine{}
	service := newRemoteTestService(t, filepath.Join(t.TempDir(), "worker.db"), private, token, engine)
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, public, token)
	defer runner.Close()
	envelope, err := runner.sealer.Seal("staged", workerTestRequest())
	if err != nil {
		t.Fatal(err)
	}
	payload, err := json.Marshal(envelope)
	if err != nil {
		t.Fatal(err)
	}
	put := func(want int) {
		t.Helper()
		response, err := runner.do(context.Background(), http.MethodPut, "/v1/jobs/staged", bytes.NewReader(payload), "application/json")
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode != want {
			t.Fatalf("PUT status = %d, want %d", response.StatusCode, want)
		}
	}
	put(http.StatusAccepted)
	put(http.StatusAccepted)
	// A changed ciphertext cannot replace credentials of an existing job.
	if err := runner.Prepare(context.Background(), "staged", workerTestRequest()); err == nil {
		t.Fatal("accepted replacement envelope")
	}
	time.Sleep(30 * time.Millisecond)
	waitRemoteStatus(t, runner, "staged", remoteStatusAccepting)
	engine.mu.Lock()
	attempts := engine.attempts
	engine.mu.Unlock()
	if attempts != 0 {
		t.Fatal("staged job executed before API activation")
	}
	if err := runner.Delete(context.Background(), "staged"); err != nil {
		t.Fatal(err)
	}
	// A captured accepted payload must not resurrect a cancelled migration.
	put(http.StatusAccepted)
	if err := runner.activate(context.Background(), "staged"); err != nil {
		t.Fatal(err)
	}
	waitRemoteStatus(t, runner, "staged", remoteStatusCancelled)
	var envelopes int
	if err := service.jobs.db.QueryRow("SELECT count(*) FROM credential_envelopes").Scan(&envelopes); err != nil {
		t.Fatal(err)
	}
	if envelopes != 0 {
		t.Fatal("cancelled envelope remains in active storage")
	}
}

func TestWorkerDatabaseHasOneServiceOwner(t *testing.T) {
	_, private, token := remoteTestSecrets(t)
	path := filepath.Join(t.TempDir(), "worker.db")
	first := newRemoteTestService(t, path, private, token, &remoteTestEngine{})
	second, err := NewService(ServiceConfig{DatabasePath: path, PrivateKey: private, Token: token, Engine: &remoteTestEngine{}})
	if err == nil {
		shutdownRemoteTestService(t, second)
		t.Fatal("second service acquired the same database")
	}
	shutdownRemoteTestService(t, first)
	third := newRemoteTestService(t, path, private, token, &remoteTestEngine{})
	shutdownRemoteTestService(t, third)
}

func TestStrictMirrorNeverAutomaticallyRetries(t *testing.T) {
	public, private, token := remoteTestSecrets(t)
	engine := &remoteTestEngine{failUntil: 10}
	service := newRemoteTestService(t, filepath.Join(t.TempDir(), "worker.db"), private, token, engine)
	server := httptest.NewServer(service.Handler())
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, public, token)
	defer runner.Close()
	request := workerTestRequest()
	request.Options.StrictMirror, request.Options.StrictMirrorConfirmed = true, true
	if err := runner.Prepare(context.Background(), "mirror", request); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err := runner.Run(ctx, "mirror", nil)
	if err == nil || !strings.Contains(err.Error(), "review") {
		t.Fatalf("mirror error = %v", err)
	}
	engine.mu.Lock()
	attempts := engine.attempts
	engine.mu.Unlock()
	if attempts != 1 {
		t.Fatalf("mirror ran %d times", attempts)
	}
}

func TestRemotePollingSurvivesTemporaryWorkerOutage(t *testing.T) {
	public, private, token := remoteTestSecrets(t)
	engine := &remoteTestEngine{steps: 30, stepDelay: time.Millisecond}
	service := newRemoteTestService(t, filepath.Join(t.TempDir(), "worker.db"), private, token, engine)
	handler := service.Handler()
	var attempts atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut && attempts.Add(1) <= 3 {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		handler.ServeHTTP(w, r)
	}))
	defer server.Close()
	runner := newRemoteTestRunner(t, server.URL, public, token)
	defer runner.Close()
	if err := runner.Prepare(context.Background(), "outage", workerTestRequest()); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	result, err := runner.Run(ctx, "outage", nil)
	if err != nil || result.Transferred != 11 {
		t.Fatalf("result = %+v, err = %v", result, err)
	}
	engine.mu.Lock()
	runs := engine.attempts
	engine.mu.Unlock()
	if runs != 1 {
		t.Fatalf("network outage duplicated migration: %d runs", runs)
	}
}

func TestRemoteTransportRejectsRedirectsAndUnsafeIDs(t *testing.T) {
	public, _, token := remoteTestSecrets(t)
	var leaked atomic.Bool
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { leaked.Store(true) }))
	defer target.Close()
	redirect := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target.URL, http.StatusTemporaryRedirect)
	}))
	defer redirect.Close()
	runner := newRemoteTestRunner(t, redirect.URL, public, token)
	defer runner.Close()
	if err := runner.Prepare(context.Background(), "redirect", workerTestRequest()); err == nil {
		t.Fatal("redirect accepted")
	}
	if leaked.Load() {
		t.Fatal("redirect forwarded a worker request")
	}
	for _, id := range []string{"../healthz", "x?after=0", "a/b", "x#y", "a b"} {
		if err := runner.Delete(context.Background(), id); err == nil {
			t.Fatalf("unsafe id accepted: %q", id)
		}
	}
	if _, err := NewRemoteRunner(RemoteConfig{URL: "http://worker.example:8090", PublicKey: public, Token: token}); err == nil {
		t.Fatal("HTTP allowed without explicit private-network opt-in")
	}
}

func TestSanitizeAllWorkerEventTextAndBoundSize(t *testing.T) {
	request := workerTestRequest()
	request.Source.Password = "secret"
	request.Destination.Password = "secret-long"
	value := "secret-long secret " + strings.Repeat("x", 10000)
	event := sanitizeServiceEvent(migrator.Event{Type: value, Phase: value, Message: value, CurrentFolder: value}, request)
	for _, text := range []string{event.Type, event.Phase, event.Message, event.CurrentFolder} {
		if strings.Contains(text, "secret") || strings.Contains(text, "-long") {
			t.Fatal("part of overlapping secret survived redaction")
		}
	}
	if len(event.Type) > 64 || len(event.Phase) > 64 || len(event.Message) > 4096 || len(event.CurrentFolder) > 1024 {
		t.Fatal("event not bounded")
	}
}

func TestQueueCapacityExpiryAndCrashRecoveryPolicies(t *testing.T) {
	public, private, token := remoteTestSecrets(t)
	service, err := NewService(ServiceConfig{DatabasePath: filepath.Join(t.TempDir(), "worker.db"), PrivateKey: private, Token: token, Engine: &remoteTestEngine{}})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { shutdownRemoteTestService(t, service) })
	runner := newRemoteTestRunner(t, "http://127.0.0.1:1", public, token)
	defer runner.Close()
	ctx := context.Background()
	envelope, err := runner.sealer.Seal("expiry", workerTestRequest())
	if err != nil {
		t.Fatal(err)
	}
	if ok, err := service.jobs.admit(ctx, envelope, time.Now(), 1); err != nil || !ok {
		t.Fatalf("admission=%v %v", ok, err)
	}
	other, err := runner.sealer.Seal("overflow", workerTestRequest())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.jobs.admit(ctx, other, time.Now(), 1); err != errQueueFull {
		t.Fatalf("capacity error=%v", err)
	}
	// Staged orphan jobs expire without ever being decrypted or activated.
	if err := service.jobs.maintain(ctx, time.Now().Add(2*time.Hour)); err != nil {
		t.Fatal(err)
	}
	snapshot, _, err := service.jobs.get(ctx, "expiry", 0)
	if err != nil || snapshot.Status != remoteStatusFailed {
		t.Fatalf("expired status=%+v %v", snapshot, err)
	}
	var count int
	if err := service.jobs.db.QueryRow("SELECT count(*) FROM credential_envelopes").Scan(&count); err != nil || count != 0 {
		t.Fatal("expired envelope retained")
	}
	for _, test := range []struct {
		id             string
		resume, mirror bool
		attempts       int
		want           string
	}{
		{"native", false, false, 1, remoteStatusFailed},
		{"supervised", true, false, 1, remoteStatusQueued},
		{"destructive", true, true, 1, remoteStatusFailed},
		{"exhausted", true, false, 3, remoteStatusFailed},
	} {
		envelope, err := runner.sealer.Seal(test.id, workerTestRequest())
		if err != nil {
			t.Fatal(err)
		}
		if _, err := service.jobs.admit(ctx, envelope, time.Now(), 10); err != nil {
			t.Fatal(err)
		}
		if _, err := service.jobs.db.Exec("UPDATE worker_jobs SET status = 'running', attempts = ?, no_retry = ? WHERE job_id = ?", test.attempts, test.mirror, test.id); err != nil {
			t.Fatal(err)
		}
		if err := service.jobs.recoverInterrupted(ctx, time.Now(), 3, test.resume); err != nil {
			t.Fatal(err)
		}
		snapshot, _, err := service.jobs.get(ctx, test.id, 0)
		if err != nil || snapshot.Status != test.want {
			t.Fatalf("%s recovery = %s, err=%v", test.id, snapshot.Status, err)
		}
		// Keep the coordinator from claiming the synthetic queue fixture.
		if err := service.jobs.complete(ctx, test.id, remoteStatusCancelled, migrator.Result{}, "", time.Now()); err != nil {
			t.Fatal(err)
		}
	}
}
