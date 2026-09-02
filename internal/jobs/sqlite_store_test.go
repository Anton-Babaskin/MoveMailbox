package jobs

import (
	"bytes"
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func TestSQLiteStoreRoundTripAndDelete(t *testing.T) {
	path := filepath.Join(t.TempDir(), "history", "movemailbox.db")
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC().Truncate(time.Millisecond)
	snapshot := Snapshot{
		View: View{
			ID: "job-round-trip", Status: StatusCompleted, Engine: "demo",
			Source: "source@example.test @ source.example", Destination: "destination@example.test @ destination.example",
			Phase: PhaseCompleted, Progress: 100, Transferred: 42, CreatedAt: now, FinishedAt: &now, Sequence: 1,
			RecentEvents: []migrator.Event{{Type: "finished", Phase: PhaseCompleted, Progress: 100, Timestamp: now}},
		},
		History: []StreamEvent{{Sequence: 1, Event: migrator.Event{Type: "finished", Phase: PhaseCompleted, Progress: 100, Timestamp: now}}},
	}
	if err := store.Save(context.Background(), snapshot); err != nil {
		t.Fatal(err)
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	store, err = OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	loaded, err := store.Load(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(loaded) != 1 || loaded[0].View.ID != snapshot.View.ID || loaded[0].View.Transferred != 42 {
		t.Fatalf("loaded snapshots = %+v", loaded)
	}
	if len(loaded[0].History) != 1 || loaded[0].History[0].Event.Type != "finished" {
		t.Fatalf("loaded history = %+v", loaded[0].History)
	}
	if err := store.Delete(context.Background(), snapshot.View.ID); err != nil {
		t.Fatal(err)
	}
	loaded, err = store.Load(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(loaded) != 0 {
		t.Fatalf("deleted snapshot remained: %+v", loaded)
	}
}

func TestManagerRestoresHistoryAndNeverPersistsPasswords(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "movemailbox.db")
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	request := validRequest()
	request.Source.Password = "source-password-must-never-reach-sqlite"
	request.Destination.Password = "destination-password-must-never-reach-sqlite"
	engine := &controlledEngine{
		available:    true,
		events:       1,
		eventMessage: "source-password-must-never-reach-sqlite in engine output",
		migrationErr: errors.New("destination-password-must-never-reach-sqlite rejected"),
	}
	manager, err := NewManagerWithStore(engine, Config{MaxConcurrent: 1, CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	view, err := manager.Start(request)
	if err != nil {
		t.Fatal(err)
	}
	failed := waitForStatus(t, manager, view.ID, StatusFailed)
	if !strings.Contains(failed.Error, "[REDACTED]") {
		t.Fatalf("expected a redacted error, got %q", failed.Error)
	}
	shutdownManager(t, manager)

	for _, suffix := range []string{"", "-wal", "-shm"} {
		payload, readErr := os.ReadFile(path + suffix)
		if readErr != nil {
			if errors.Is(readErr, os.ErrNotExist) {
				continue
			}
			t.Fatal(readErr)
		}
		for _, secret := range []string{request.Source.Password, request.Destination.Password} {
			if bytes.Contains(payload, []byte(secret)) {
				t.Fatalf("credential %q was found in SQLite file %s", secret, filepath.Base(path+suffix))
			}
		}
	}

	reopened, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	restoredManager, err := NewManagerWithStore(&controlledEngine{available: true}, Config{MaxConcurrent: 1, CompletedTTL: -1}, reopened)
	if err != nil {
		t.Fatal(err)
	}
	restored, ok := restoredManager.Get(view.ID)
	if !ok || restored.Status != StatusFailed || restored.Sequence != failed.Sequence {
		t.Fatalf("restored view = %+v, exists=%v", restored, ok)
	}
	shutdownManager(t, restoredManager)
}

func TestManagerMarksInterruptedSnapshotAsFailed(t *testing.T) {
	path := filepath.Join(t.TempDir(), "movemailbox.db")
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	created := time.Now().Add(-time.Minute).UTC()
	if err := store.Save(context.Background(), Snapshot{View: View{
		ID: "interrupted", Status: StatusRunning, Engine: "imapsync", Source: "old", Destination: "new",
		Phase: PhaseCopying, Progress: 37, CreatedAt: created, Sequence: 4,
	}}); err != nil {
		t.Fatal(err)
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}

	store, err = OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	manager, err := NewManagerWithStore(&controlledEngine{available: true}, Config{MaxConcurrent: 1, CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	restored, ok := manager.Get("interrupted")
	if !ok || restored.Status != StatusFailed || restored.Phase != PhaseFailed || restored.FinishedAt == nil {
		t.Fatalf("restored interrupted job = %+v, exists=%v", restored, ok)
	}
	if !strings.Contains(restored.Error, "перезапуском") || restored.Sequence != 5 {
		t.Fatalf("restored interruption details = %+v", restored)
	}
	shutdownManager(t, manager)
}

func TestSQLiteHistoryEvictionDeletesPersistentSnapshot(t *testing.T) {
	path := filepath.Join(t.TempDir(), "movemailbox.db")
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	manager, err := NewManagerWithStore(&controlledEngine{available: true}, Config{
		MaxConcurrent: 1, CompletedTTL: 15 * time.Millisecond, CleanupInterval: 2 * time.Millisecond,
	}, store)
	if err != nil {
		t.Fatal(err)
	}
	view, err := manager.Start(validRequest())
	if err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, view.ID, StatusCompleted)
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if _, ok := manager.Get(view.ID); !ok {
			break
		}
		time.Sleep(2 * time.Millisecond)
	}
	if _, ok := manager.Get(view.ID); ok {
		t.Fatal("expired job remained in manager")
	}
	shutdownManager(t, manager)

	reopened, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	snapshots, err := reopened.Load(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(snapshots) != 0 {
		t.Fatalf("expired snapshot remained in SQLite: %+v", snapshots)
	}
}

func TestManagerRejectsNewJobWhenDurableSaveFails(t *testing.T) {
	store := &saveFailingStore{}
	manager, err := NewManagerWithStore(&controlledEngine{available: true}, Config{MaxConcurrent: 1}, store)
	if err != nil {
		t.Fatal(err)
	}
	defer shutdownManager(t, manager)
	if _, err := manager.Start(validRequest()); !errors.Is(err, ErrPersistenceUnavailable) {
		t.Fatalf("Start() error = %v, want ErrPersistenceUnavailable", err)
	}
	if kind, healthy := manager.StorageStatus(); kind != "failing-test" || healthy {
		t.Fatalf("StorageStatus() = %q, %v", kind, healthy)
	}
}

type saveFailingStore struct{ memoryStore }

func (*saveFailingStore) Kind() string { return "failing-test" }
func (*saveFailingStore) Save(context.Context, Snapshot) error {
	return errors.New("test storage failure")
}

func shutdownManager(t *testing.T, manager *Manager) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := manager.Shutdown(ctx); err != nil {
		t.Fatalf("Shutdown() error = %v", err)
	}
}
