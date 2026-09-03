package credentials

import (
	"context"
	"errors"
	"time"
)

var (
	ErrNotFound = errors.New("credential envelope not found")
	ErrLeased   = errors.New("credential envelope is leased by another worker")
)

// Store persists ciphertext only. Lease must atomically prevent two workers
// from opening the same job during the lease window.
type Store interface {
	Put(context.Context, Envelope) error
	Lease(context.Context, string, string, time.Time, time.Duration) (Envelope, error)
	Renew(context.Context, string, string, time.Time, time.Duration) error
	Exists(context.Context, string, time.Time) (bool, error)
	Delete(context.Context, string) error
	CleanupExpired(context.Context, time.Time) (int64, error)
	Close() error
}
