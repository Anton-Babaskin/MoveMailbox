package jobs

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func TestCountersSurviveSnapshotsAndDoNotAliasSubscribers(t *testing.T) {
	path := filepath.Join(t.TempDir(), "jobs.db")
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	engine := &controlledEngine{available: true, release: make(chan struct{}), started: make(chan migrator.Request, 1)}
	manager, err := NewManagerWithStore(engine, Config{CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { shutdownManager(t, manager) })
	view, err := manager.StartFor("guest-counters", validRequest())
	if err != nil {
		t.Fatal(err)
	}
	waitForStatus(t, manager, view.ID, StatusRunning)
	<-engine.started
	total, remaining, size, eta := int64(10), int64(0), int64(2048), int64(0)
	event := migrator.Event{Type: "progress", CountersUpdated: true, ProgressCounters: migrator.ProgressCounters{TotalMessages: &total, RemainingMessages: &remaining, TotalBytes: &size, ETASeconds: &eta}}
	manager.publish(view.ID, event)
	total = 999 // The producer no longer owns the accepted observation.
	got, _ := manager.Get(view.ID)
	if got.TotalMessages == nil || *got.TotalMessages != 10 || *got.RemainingMessages != 0 || *got.ETASeconds != 0 {
		t.Fatalf("published counters lost or aliased: %+v", got)
	}
	*got.TotalMessages = 888
	*got.RecentEvents[len(got.RecentEvents)-1].TotalBytes = 777
	stream, _, _ := manager.eventsAfter(view.ID, 0)
	*stream[len(stream)-1].Event.TotalMessages = 666
	got, _ = manager.Get(view.ID)
	if *got.TotalMessages != 10 || *got.RecentEvents[len(got.RecentEvents)-1].TotalBytes != 2048 {
		t.Fatal("reader mutated manager state")
	}
	// Old engines and plain diagnostics do not erase known counters.
	manager.publish(view.ID, migrator.Event{Type: "log"})
	got, _ = manager.Get(view.ID)
	if got.TotalMessages == nil {
		t.Fatal("legacy event cleared counters")
	}
	manager.finish(view.ID, StatusFailed, migrator.Result{}, "synthetic failure")
	shutdownManager(t, manager)
	store, err = OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	manager, err = NewManagerWithStore(engine, Config{CompletedTTL: -1}, store)
	if err != nil {
		t.Fatal(err)
	}
	got, exists := manager.GetFor("guest-counters", view.ID)
	if !exists || got.TotalMessages == nil || *got.TotalMessages != 10 || *got.TotalBytes != 2048 || *got.RemainingMessages != 0 || got.ETASeconds != nil {
		t.Fatalf("reopened snapshot incorrect: %+v", got)
	}
}

func TestNewAttemptClearsCountersAndCompletedDoesNotInventRemaining(t *testing.T) {
	for _, status := range []Status{StatusCompleted, StatusFailed, StatusCancelled} {
		t.Run(string(status), func(t *testing.T) {
			manager := newTestManager(t, &controlledEngine{available: true, release: make(chan struct{})}, Config{})
			view, err := manager.Start(validRequest())
			if err != nil {
				t.Fatal(err)
			}
			waitForStatus(t, manager, view.ID, StatusRunning)
			total, remaining := int64(9), int64(3)
			manager.publish(view.ID, migrator.Event{CountersUpdated: true, ProgressCounters: migrator.ProgressCounters{TotalMessages: &total, RemainingMessages: &remaining, ETASeconds: &remaining}})
			manager.publish(view.ID, migrator.Event{Type: "progress", Phase: "preparing", CountersUpdated: true})
			got, _ := manager.Get(view.ID)
			if got.TotalMessages != nil || got.RemainingMessages != nil || got.ETASeconds != nil {
				t.Fatal("new attempt inherited previous counters")
			}
			manager.publish(view.ID, migrator.Event{CountersUpdated: true, ProgressCounters: migrator.ProgressCounters{TotalMessages: &total, RemainingMessages: &remaining, ETASeconds: &remaining}})
			manager.finish(view.ID, status, migrator.Result{}, "")
			got, _ = manager.Get(view.ID)
			if *got.RemainingMessages != 3 || got.ETASeconds != nil {
				t.Fatal("terminal status fabricated remaining count or retained ETA")
			}
			ctx, cancel := context.WithTimeout(context.Background(), time.Second)
			defer cancel()
			_ = manager.Shutdown(ctx)
		})
	}
}
