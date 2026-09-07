package jobs

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type fakeMigrationWorker struct {
	mu          sync.Mutex
	prepared    map[string]migrator.Request
	recoverable map[string]bool
	deleted     map[string]bool
	closed      bool
	deleteErr   error
	survives    bool
	started     chan string
	release     chan struct{}
}

func newFakeMigrationWorker() *fakeMigrationWorker {
	return &fakeMigrationWorker{
		prepared:    make(map[string]migrator.Request),
		recoverable: make(map[string]bool),
		deleted:     make(map[string]bool),
	}
}

func (worker *fakeMigrationWorker) Prepare(_ context.Context, id string, request migrator.Request) error {
	worker.mu.Lock()
	defer worker.mu.Unlock()
	worker.prepared[id] = request
	worker.recoverable[id] = true
	return nil
}

func (worker *fakeMigrationWorker) Run(ctx context.Context, id string, emit func(migrator.Event)) (migrator.Result, error) {
	if worker.started != nil {
		worker.started <- id
	}
	if worker.release != nil {
		select {
		case <-worker.release:
		case <-ctx.Done():
			return migrator.Result{}, ctx.Err()
		}
	}
	emit(migrator.Event{Type: "progress", Phase: PhaseCopying, Progress: 50, Timestamp: time.Now()})
	return migrator.Result{Transferred: 3, Bytes: 12}, nil
}

func TestManagerShutdownDeletesRunningAndQueuedWorkerEnvelopes(t *testing.T) {
	worker := newFakeMigrationWorker()
	worker.started = make(chan string, 1)
	worker.release = make(chan struct{})
	manager, err := NewManagerWithWorker(&controlledEngine{available: true}, worker, Config{MaxConcurrent: 1, CompletedTTL: -1}, memoryStore{})
	if err != nil {
		t.Fatal(err)
	}
	first, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	second, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	select {
	case <-worker.started:
	case <-time.After(time.Second):
		t.Fatal("first worker did not start")
	}
	shutdownManager(t, manager)
	worker.mu.Lock()
	defer worker.mu.Unlock()
	for _, id := range []string{first.ID, second.ID} {
		if !worker.deleted[id] {
			t.Fatalf("credential envelope %s survived shutdown", id)
		}
	}
}

func (worker *fakeMigrationWorker) Recoverable(_ context.Context, id string) (bool, error) {
	worker.mu.Lock()
	defer worker.mu.Unlock()
	return worker.recoverable[id], nil
}

func (worker *fakeMigrationWorker) Delete(_ context.Context, id string) error {
	worker.mu.Lock()
	defer worker.mu.Unlock()
	if worker.deleteErr != nil {
		return worker.deleteErr
	}
	delete(worker.prepared, id)
	delete(worker.recoverable, id)
	worker.deleted[id] = true
	return nil
}

func (*fakeMigrationWorker) CleanupExpired(context.Context) (int64, error) { return 0, nil }

func (worker *fakeMigrationWorker) Close() error {
	worker.mu.Lock()
	defer worker.mu.Unlock()
	worker.closed = true
	return nil
}

func (worker *fakeMigrationWorker) SurvivesManagerShutdown() bool { return worker.survives }

func TestManagerWorkerPathClearsRequestBeforeExecution(t *testing.T) {
	worker := newFakeMigrationWorker()
	manager, err := NewManagerWithWorker(&controlledEngine{available: true}, worker, Config{MaxConcurrent: 1, CompletedTTL: -1}, memoryStore{})
	if err != nil {
		t.Fatal(err)
	}
	request := validRequest()
	view, err := manager.StartFor("guest-worker", request)
	if err != nil {
		t.Fatal(err)
	}
	manager.mu.RLock()
	stored := manager.jobs[view.ID].request
	manager.mu.RUnlock()
	if stored.Source.Password != "" || stored.Destination.Password != "" {
		t.Fatal("manager retained plaintext credentials in isolated-worker mode")
	}
	completed := waitForStatus(t, manager, view.ID, StatusCompleted)
	if completed.Transferred != 3 || completed.Bytes != 12 {
		t.Fatalf("completed view = %+v", completed)
	}
	worker.mu.Lock()
	prepared := worker.prepared[view.ID]
	deleted := worker.deleted[view.ID]
	worker.mu.Unlock()
	if prepared.Source.Password != "" || prepared.Destination.Password != "" {
		// Delete must remove the worker-side prepared request on terminal paths.
		t.Fatalf("worker retained prepared request: %+v", prepared)
	}
	if !deleted {
		t.Fatal("terminal worker envelope was not deleted")
	}
	shutdownManager(t, manager)
}

func TestManagerResumesNonTerminalJobWhenEncryptedEnvelopeExists(t *testing.T) {
	created := time.Now().Add(-time.Minute).UTC()
	snapshot := Snapshot{OwnerID: "guest-resume", View: View{
		ID: "job-resume", Status: StatusRunning, Engine: "imapsync", Source: "source", Destination: "destination",
		Phase: PhaseCopying, Progress: 40, CreatedAt: created, StartedAt: &created,
	}}
	store := &snapshotTestStore{snapshots: []Snapshot{snapshot}}
	worker := newFakeMigrationWorker()
	worker.recoverable[snapshot.View.ID] = true
	manager, err := NewManagerWithWorker(&controlledEngine{available: true}, worker, Config{MaxConcurrent: 1, CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	completed := waitForStatus(t, manager, snapshot.View.ID, StatusCompleted)
	if completed.Transferred != 3 || completed.Error != "" {
		t.Fatalf("resumed view = %+v", completed)
	}
	shutdownManager(t, manager)
	worker.mu.Lock()
	closed := worker.closed
	worker.mu.Unlock()
	if !closed {
		t.Fatal("worker store was not closed during shutdown")
	}
}

func TestManagerClosesWorkerWhenHistoryLoadFails(t *testing.T) {
	worker := newFakeMigrationWorker()
	_, err := NewManagerWithWorker(
		&controlledEngine{available: true},
		worker,
		Config{MaxConcurrent: 1},
		loadFailingWorkerStore{memoryStore: memoryStore{}},
	)
	if !errors.Is(err, ErrPersistenceUnavailable) {
		t.Fatalf("NewManagerWithWorker error = %v, want ErrPersistenceUnavailable", err)
	}
	worker.mu.Lock()
	closed := worker.closed
	worker.mu.Unlock()
	if !closed {
		t.Fatal("worker store was not closed after history load failed")
	}
}

func TestManagerDetachesDurableWorkerJobAcrossAPIRestart(t *testing.T) {
	store := &snapshotTestStore{}
	worker := newFakeMigrationWorker()
	worker.survives = true
	worker.started = make(chan string, 1)
	worker.release = make(chan struct{})
	manager, err := NewManagerWithWorker(&controlledEngine{available: true}, worker, Config{MaxConcurrent: 1, CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	select {
	case <-worker.started:
	case <-time.After(time.Second):
		t.Fatal("durable worker did not start")
	}
	shutdownManager(t, manager)
	worker.mu.Lock()
	deleted := worker.deleted[view.ID]
	worker.mu.Unlock()
	if deleted {
		t.Fatal("API shutdown deleted a durable remote worker job")
	}
	if len(store.snapshots) != 1 || terminal(store.snapshots[0].View.Status) {
		t.Fatalf("persisted durable job = %+v", store.snapshots)
	}

	resumedWorker := newFakeMigrationWorker()
	resumedWorker.survives = true
	resumedWorker.recoverable[view.ID] = true
	resumed, err := NewManagerWithWorker(&controlledEngine{available: true}, resumedWorker, Config{MaxConcurrent: 1, CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	completed := waitForStatus(t, resumed, view.ID, StatusCompleted)
	if completed.Transferred != 3 {
		t.Fatalf("resumed durable job = %+v", completed)
	}
	shutdownManager(t, resumed)
}

type snapshotTestStore struct {
	memoryStore
	snapshots []Snapshot
}

func TestRemoteStopIsNotReportedUntilWorkerConfirms(t *testing.T) {
	worker := newFakeMigrationWorker()
	worker.survives = true
	worker.started = make(chan string, 1)
	worker.release = make(chan struct{})
	worker.deleteErr = errors.New("network unavailable")
	manager, err := NewManagerWithWorker(&controlledEngine{available: true}, worker, Config{MaxConcurrent: 1, CompletedTTL: -1}, memoryStore{})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { shutdownManager(t, manager) })
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	select {
	case <-worker.started:
	case <-time.After(time.Second):
		t.Fatal("worker did not start")
	}
	if err := manager.Cancel(view.ID); !errors.Is(err, ErrStopUnconfirmed) {
		t.Fatalf("stop = %v", err)
	}
	current, _ := manager.Get(view.ID)
	if current.Status != StatusRunning {
		t.Fatal("reported cancellation without worker acknowledgement")
	}
	worker.mu.Lock()
	worker.deleteErr = nil
	worker.mu.Unlock()
	if err := manager.Cancel(view.ID); err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, view.ID, StatusCancelled)
}

type terminalFailingStore struct {
	memoryStore
	writes chan struct{}
}

func (store terminalFailingStore) Save(_ context.Context, snapshot Snapshot) error {
	if terminal(snapshot.View.Status) {
		store.writes <- struct{}{}
		return errors.New("disk unavailable")
	}
	return nil
}

func TestRemoteResultRemainsIfAPITerminalSnapshotCannotBeSaved(t *testing.T) {
	worker := newFakeMigrationWorker()
	worker.survives = true
	store := terminalFailingStore{writes: make(chan struct{}, 8)}
	manager, err := NewManagerWithWorker(&controlledEngine{available: true}, worker, Config{MaxConcurrent: 1, CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { shutdownManager(t, manager) })
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	for attempt := 0; attempt < 2; attempt++ {
		select {
		case <-store.writes:
		case <-time.After(time.Second):
			t.Fatal("terminal snapshot save was not attempted")
		}
	}
	worker.mu.Lock()
	deleted := worker.deleted[view.ID]
	worker.mu.Unlock()
	if deleted {
		t.Fatal("worker result removed before durable API acknowledgement")
	}
}

type loadFailingWorkerStore struct{ memoryStore }

func (loadFailingWorkerStore) Load(context.Context) ([]Snapshot, error) {
	return nil, errors.New("load failed")
}

func (store *snapshotTestStore) Load(context.Context) ([]Snapshot, error) {
	return append([]Snapshot(nil), store.snapshots...), nil
}

func (store *snapshotTestStore) Save(_ context.Context, snapshot Snapshot) error {
	for index := range store.snapshots {
		if store.snapshots[index].View.ID == snapshot.View.ID {
			store.snapshots[index] = snapshot
			return nil
		}
	}
	store.snapshots = append(store.snapshots, snapshot)
	return nil
}
