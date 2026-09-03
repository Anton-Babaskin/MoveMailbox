package jobs

import (
	"context"
	"errors"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type controlledEngine struct {
	available    bool
	started      chan migrator.Request
	release      chan struct{}
	ignoreCancel bool
	events       int
	eventMessage string
	migrationErr error
	calls        atomic.Int32
}

func (engine *controlledEngine) Name() string { return "controlled" }

func (engine *controlledEngine) Available() bool { return engine.available }

func (engine *controlledEngine) TestConnection(context.Context, migrator.Endpoint, func(migrator.Event)) error {
	return nil
}

func (engine *controlledEngine) Migrate(ctx context.Context, request migrator.Request, emit func(migrator.Event)) (migrator.Result, error) {
	engine.calls.Add(1)
	if engine.started != nil {
		engine.started <- request
	}
	if engine.release != nil {
		if engine.ignoreCancel {
			<-engine.release
		} else {
			select {
			case <-engine.release:
			case <-ctx.Done():
				return migrator.Result{}, ctx.Err()
			}
		}
	}
	for i := 1; i <= engine.events; i++ {
		emit(migrator.Event{
			Type:        "progress",
			Phase:       PhaseCopying,
			Progress:    i,
			Transferred: int64(i),
			Message:     engine.eventMessage,
		})
	}
	if engine.migrationErr != nil {
		return migrator.Result{}, engine.migrationErr
	}
	return migrator.Result{Transferred: int64(engine.events)}, nil
}

func validRequest() migrator.Request {
	return migrator.Request{
		Source: migrator.Endpoint{
			Host: "source.example", Port: 993, Security: migrator.SecurityTLS,
			Username: "source@example.test", Password: "source-secret",
		},
		Destination: migrator.Endpoint{
			Host: "destination.example", Port: 993, Security: migrator.SecurityTLS,
			Username: "destination@example.test", Password: "destination-secret",
		},
	}
}

func newTestManager(t *testing.T, engine migrator.Engine, config Config) *Manager {
	t.Helper()
	if config.CompletedTTL == 0 {
		config.CompletedTTL = -1
	}
	manager := NewManagerWithConfig(engine, config)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if err := manager.Shutdown(ctx); err != nil {
			t.Errorf("Shutdown() error = %v", err)
		}
	})
	return manager
}

func waitForStatus(t *testing.T, manager *Manager, id string, status Status) View {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		view, ok := manager.Get(id)
		if ok && view.Status == status {
			return view
		}
		time.Sleep(time.Millisecond)
	}
	view, ok := manager.Get(id)
	t.Fatalf("job %q did not reach %q; current=%+v exists=%v", id, status, view, ok)
	return View{}
}

func TestStartRejectsUnavailableEngine(t *testing.T) {
	manager := newTestManager(t, &controlledEngine{available: false}, Config{})
	if _, err := manager.Start(validRequest()); !errors.Is(err, ErrEngineUnavailable) {
		t.Fatalf("Start() error = %v, want ErrEngineUnavailable", err)
	}
}

func TestOwnedJobsAreIsolatedAndConcurrencyIsPerOwner(t *testing.T) {
	engine := &controlledEngine{
		available: true,
		started:   make(chan migrator.Request, 2),
		release:   make(chan struct{}),
	}
	manager := newTestManager(t, engine, Config{MaxConcurrent: 2, MaxActivePerOwner: 1})
	first, err := manager.StartFor("guest-alice", validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started
	if _, err := manager.StartFor("guest-alice", validRequest()); !errors.Is(err, ErrOwnerJobLimitReached) {
		t.Fatalf("second StartFor(alice) error = %v, want ErrOwnerJobLimitReached", err)
	}
	second, err := manager.StartFor("guest-bob", validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started

	if _, ok := manager.GetFor("guest-bob", first.ID); ok {
		t.Fatal("bob could read alice's job")
	}
	if views := manager.ListFor("guest-alice"); len(views) != 1 || views[0].ID != first.ID {
		t.Fatalf("alice list = %+v", views)
	}
	if err := manager.CancelFor("guest-bob", first.ID); !errors.Is(err, ErrJobNotFound) {
		t.Fatalf("bob CancelFor(alice job) error = %v, want ErrJobNotFound", err)
	}
	if _, _, ok := manager.SubscribeFromFor("guest-bob", first.ID, 0); ok {
		t.Fatal("bob could subscribe to alice's job")
	}
	if _, ok := manager.GetFor("guest-bob", second.ID); !ok {
		t.Fatal("bob could not read his own job")
	}
	close(engine.release)
}

func TestStartForRequiresOwner(t *testing.T) {
	manager := newTestManager(t, &controlledEngine{available: true}, Config{})
	if _, err := manager.StartFor("  ", validRequest()); !errors.Is(err, ErrOwnerRequired) {
		t.Fatalf("StartFor(empty) error = %v, want ErrOwnerRequired", err)
	}
}

func TestNormalizePhaseUsesStableCodes(t *testing.T) {
	tests := map[string]string{
		"Подключение":        PhaseConnecting,
		"Подготовка":         PhasePreparing,
		"Сканирование":       PhaseScanning,
		"Копирование":        PhaseCopying,
		"Копирование папок":  PhaseCopying,
		"Проверка":           PhaseVerifying,
		PhaseCompleted:       PhaseCompleted,
		"untranslated phase": PhasePreparing,
	}
	for input, want := range tests {
		if got := normalizePhase(input, StatusRunning); got != want {
			t.Errorf("normalizePhase(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestMigrationErrorAndEventsNeverExposePasswords(t *testing.T) {
	request := validRequest()
	engine := &controlledEngine{
		available:    true,
		events:       1,
		eventMessage: "destination-secret appeared in output",
		migrationErr: errors.New("source-secret failed; destination-secret rejected"),
	}
	manager := newTestManager(t, engine, Config{MaxConcurrent: 1})
	view, err := manager.Start(request)
	if err != nil {
		t.Fatal(err)
	}
	failed := waitForStatus(t, manager, view.ID, StatusFailed)
	for _, secret := range []string{request.Source.Password, request.Destination.Password} {
		if strings.Contains(failed.Error, secret) {
			t.Fatalf("View.Error leaked password %q: %q", secret, failed.Error)
		}
	}
	if got := strings.Count(failed.Error, "[REDACTED]"); got != 2 {
		t.Fatalf("redaction count = %d, error = %q", got, failed.Error)
	}
	for _, event := range failed.RecentEvents {
		if strings.Contains(event.Message, request.Source.Password) || strings.Contains(event.Message, request.Destination.Password) {
			t.Fatalf("event leaked a password: %+v", event)
		}
	}
}

func TestCancelIsRaceSafeAndUsesSentinelErrors(t *testing.T) {
	engine := &controlledEngine{available: true, started: make(chan migrator.Request, 1), release: make(chan struct{})}
	manager := newTestManager(t, engine, Config{MaxConcurrent: 1})
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started

	const callers = 32
	errorsSeen := make(chan error, callers)
	var wg sync.WaitGroup
	for i := 0; i < callers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 20; j++ {
				_, _ = manager.Get(view.ID)
			}
			errorsSeen <- manager.Cancel(view.ID)
		}()
	}
	wg.Wait()
	close(errorsSeen)

	successes := 0
	for err := range errorsSeen {
		if err == nil {
			successes++
			continue
		}
		if !errors.Is(err, ErrJobFinished) {
			t.Errorf("Cancel() error = %v, want ErrJobFinished", err)
		}
	}
	if successes != 1 {
		t.Fatalf("successful Cancel() calls = %d, want 1", successes)
	}
	waitForStatus(t, manager, view.ID, StatusCancelled)

	manager.mu.RLock()
	stored := manager.jobs[view.ID].request
	manager.mu.RUnlock()
	if stored.Source.Password != "" || stored.Destination.Password != "" {
		t.Fatal("credentials remained in cancelled job record")
	}
	if err := manager.Cancel("missing"); !errors.Is(err, ErrJobNotFound) {
		t.Fatalf("Cancel(missing) error = %v, want ErrJobNotFound", err)
	}
}

func TestQueuedCancellationClearsCredentialsAndDoesNotRun(t *testing.T) {
	engine := &controlledEngine{available: true, started: make(chan migrator.Request, 2), release: make(chan struct{})}
	manager := newTestManager(t, engine, Config{MaxConcurrent: 1})
	first, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started
	second, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	if err := manager.Cancel(second.ID); err != nil {
		t.Fatal(err)
	}

	manager.mu.RLock()
	stored := manager.jobs[second.ID].request
	manager.mu.RUnlock()
	if stored.Source.Password != "" || stored.Destination.Password != "" {
		t.Fatal("credentials remained in queued cancelled job record")
	}
	time.Sleep(10 * time.Millisecond)
	if got := engine.calls.Load(); got != 1 {
		t.Fatalf("Migrate() calls = %d, want 1", got)
	}
	close(engine.release)
	waitForStatus(t, manager, first.ID, StatusCompleted)
	waitForStatus(t, manager, second.ID, StatusCancelled)
}

func TestTotalJobLimitAndCompletedEviction(t *testing.T) {
	engine := &controlledEngine{available: true, started: make(chan migrator.Request, 4), release: make(chan struct{})}
	manager := newTestManager(t, engine, Config{MaxConcurrent: 1, MaxJobs: 2})
	first, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started
	second, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := manager.Start(validRequest()); !errors.Is(err, ErrJobLimitReached) {
		t.Fatalf("Start() error = %v, want ErrJobLimitReached", err)
	}
	if err := manager.Cancel(second.ID); err != nil {
		t.Fatal(err)
	}
	third, err := manager.Start(validRequest())
	if err != nil {
		t.Fatalf("Start() after terminal eviction error = %v", err)
	}
	if _, ok := manager.Get(second.ID); ok {
		t.Fatal("old terminal job was not evicted to make room")
	}
	if got := len(manager.List()); got != 2 {
		t.Fatalf("List() length = %d, want 2", got)
	}
	if err := manager.Cancel(third.ID); err != nil {
		t.Fatal(err)
	}
	close(engine.release)
	waitForStatus(t, manager, first.ID, StatusCompleted)
}

func TestCompletedJobsExpireByTTL(t *testing.T) {
	engine := &controlledEngine{available: true}
	manager := newTestManager(t, engine, Config{
		MaxConcurrent:   1,
		CompletedTTL:    15 * time.Millisecond,
		CleanupInterval: 2 * time.Millisecond,
	})
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, view.ID, StatusCompleted)
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if _, ok := manager.Get(view.ID); !ok {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatal("completed job was not evicted after TTL")
}

func TestShutdownCancelsJobsClearsSecretsAndRejectsNewWork(t *testing.T) {
	engine := &controlledEngine{available: true, started: make(chan migrator.Request, 2), release: make(chan struct{})}
	manager := NewManagerWithConfig(engine, Config{MaxConcurrent: 1, CompletedTTL: -1})
	first, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started
	second, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	if err := manager.Shutdown(ctx); err != nil {
		t.Fatalf("Shutdown() error = %v", err)
	}
	for _, id := range []string{first.ID, second.ID} {
		view, ok := manager.Get(id)
		if !ok || view.Status != StatusCancelled || view.Phase != PhaseCancelled {
			t.Errorf("job %s after shutdown = %+v, exists=%v", id, view, ok)
		}
		manager.mu.RLock()
		stored := manager.jobs[id].request
		manager.mu.RUnlock()
		if stored.Source.Password != "" || stored.Destination.Password != "" {
			t.Errorf("job %s retained credentials", id)
		}
	}
	if _, err := manager.Start(validRequest()); !errors.Is(err, ErrManagerShuttingDown) {
		t.Fatalf("Start() after shutdown error = %v, want ErrManagerShuttingDown", err)
	}
	if _, _, ok := manager.Subscribe(first.ID); ok {
		t.Fatal("Subscribe() succeeded after shutdown")
	}
	if err := manager.Shutdown(ctx); err != nil {
		t.Fatalf("second Shutdown() error = %v", err)
	}
}

func TestShutdownHonorsContextWhenEngineIgnoresCancellation(t *testing.T) {
	engine := &controlledEngine{
		available: true, started: make(chan migrator.Request, 1), release: make(chan struct{}), ignoreCancel: true,
	}
	manager := NewManagerWithConfig(engine, Config{MaxConcurrent: 1, CompletedTTL: -1})
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()
	if err := manager.Shutdown(ctx); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("Shutdown() error = %v, want context deadline", err)
	}
	if got := waitForStatus(t, manager, view.ID, StatusCancelled); got.Phase != PhaseCancelled {
		t.Fatalf("cancelled phase = %q", got.Phase)
	}
	close(engine.release)
	ctx2, cancel2 := context.WithTimeout(context.Background(), time.Second)
	defer cancel2()
	if err := manager.Shutdown(ctx2); err != nil {
		t.Fatalf("Shutdown() after engine release error = %v", err)
	}
}

func TestSubscribeFromReplaysSequenceAndReportsGap(t *testing.T) {
	engine := &controlledEngine{available: true, events: 6}
	manager := newTestManager(t, engine, Config{MaxConcurrent: 1, EventHistoryLimit: 3})
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	completed := waitForStatus(t, manager, view.ID, StatusCompleted)
	if completed.Sequence != 8 { // started + six progress events + finished
		t.Fatalf("sequence = %d, want 8", completed.Sequence)
	}

	events, unsubscribe, ok := manager.SubscribeFrom(view.ID, 0)
	if !ok {
		t.Fatal("SubscribeFrom() returned !ok")
	}
	defer unsubscribe()
	var replay []StreamEvent
	for event := range events {
		replay = append(replay, event)
	}
	if len(replay) != 4 {
		t.Fatalf("replay length = %d, want gap + 3 retained events; events=%+v", len(replay), replay)
	}
	if replay[0].Event.Type != "gap" || replay[0].Sequence != 5 {
		t.Fatalf("first replay event = %+v, want gap at sequence 5", replay[0])
	}
	for i := 1; i < len(replay); i++ {
		if replay[i].Sequence != replay[i-1].Sequence+1 {
			t.Fatalf("non-contiguous replay at %d: %+v", i, replay)
		}
	}
	if last := replay[len(replay)-1]; last.Sequence != completed.Sequence || last.Event.Type != "finished" || last.Event.Phase != PhaseCompleted {
		t.Fatalf("last replay event = %+v", last)
	}

	lastOnly, cancelLast, ok := manager.SubscribeFrom(view.ID, completed.Sequence-1)
	if !ok {
		t.Fatal("SubscribeFrom(last-1) returned !ok")
	}
	defer cancelLast()
	last := <-lastOnly
	if last.Sequence != completed.Sequence || last.Event.Type != "finished" {
		t.Fatalf("resumed event = %+v", last)
	}
	if _, open := <-lastOnly; open {
		t.Fatal("terminal replay channel remained open")
	}
}

func TestSlowSubscriberGetsExplicitGapWithoutBlockingMigration(t *testing.T) {
	engine := &controlledEngine{
		available: true, started: make(chan migrator.Request, 1), release: make(chan struct{}), events: 50,
	}
	manager := newTestManager(t, engine, Config{
		MaxConcurrent: 1, EventHistoryLimit: 3, SubscriberBuffer: 1,
	})
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	<-engine.started
	events, unsubscribe, ok := manager.SubscribeFrom(view.ID, 0)
	if !ok {
		t.Fatal("SubscribeFrom() returned !ok")
	}
	defer unsubscribe()
	close(engine.release)
	completed := waitForStatus(t, manager, view.ID, StatusCompleted)

	deadline := time.After(time.Second)
	gapSeen := false
	finishedSeen := false
	lastSequence := uint64(0)
	for !finishedSeen {
		select {
		case event, open := <-events:
			if !open {
				if !finishedSeen {
					t.Fatal("stream closed before finished event")
				}
				break
			}
			if event.Sequence <= lastSequence {
				t.Fatalf("non-monotonic sequence: previous=%d current=%d", lastSequence, event.Sequence)
			}
			lastSequence = event.Sequence
			gapSeen = gapSeen || event.Event.Type == "gap"
			finishedSeen = event.Event.Type == "finished"
		case <-deadline:
			t.Fatal("timed out draining slow subscriber")
		}
	}
	if !gapSeen {
		t.Fatal("slow subscriber lost events without an explicit gap")
	}
	if lastSequence != completed.Sequence {
		t.Fatalf("last sequence = %d, want %d", lastSequence, completed.Sequence)
	}
}
