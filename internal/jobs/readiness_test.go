package jobs

import (
	"context"
	"errors"
	"testing"
)

func TestReadinessTracksPersistenceAndShutdown(t *testing.T) {
	manager := newTestManager(t, &controlledEngine{available: true}, Config{})
	if !manager.Ready() {
		t.Fatal("new manager is not ready")
	}
	manager.mu.Lock()
	manager.storeErr = errors.New("injected persistence failure")
	manager.mu.Unlock()
	if manager.Ready() {
		t.Fatal("failed persistence was ready")
	}
	manager.mu.Lock()
	manager.storeErr = nil
	manager.mu.Unlock()
	if !manager.Ready() {
		t.Fatal("recovered persistence was not ready")
	}
	if err := manager.Shutdown(context.Background()); err != nil {
		t.Fatal(err)
	}
	if manager.Ready() {
		t.Fatal("closed manager was ready")
	}
}
