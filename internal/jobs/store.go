package jobs

import (
	"context"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

// Snapshot is the credential-free state persisted for one migration job.
// Requests are intentionally absent: IMAP passwords must remain runtime-only.
type Snapshot struct {
	OwnerID string        `json:"ownerId,omitempty"`
	View    View          `json:"view"`
	History []StreamEvent `json:"history,omitempty"`
}

// Store persists credential-free job snapshots. Implementations must make
// Save atomic for one job ID and tolerate repeated saves and deletes.
type Store interface {
	Kind() string
	Load(context.Context) ([]Snapshot, error)
	Save(context.Context, Snapshot) error
	Delete(context.Context, string) error
	Close() error
}

type memoryStore struct{}

func (memoryStore) Kind() string                             { return "memory" }
func (memoryStore) Load(context.Context) ([]Snapshot, error) { return nil, nil }
func (memoryStore) Save(context.Context, Snapshot) error     { return nil }
func (memoryStore) Delete(context.Context, string) error     { return nil }
func (memoryStore) Close() error                             { return nil }

func cloneSnapshot(ownerID string, view View, history []StreamEvent) Snapshot {
	clonedHistory := make([]StreamEvent, len(history))
	copy(clonedHistory, history)
	for index := range clonedHistory {
		clonedHistory[index].Event = cloneEvent(clonedHistory[index].Event)
	}
	return Snapshot{OwnerID: ownerID, View: cloneView(view), History: clonedHistory}
}

func cloneEvent(event migrator.Event) migrator.Event { return event }
