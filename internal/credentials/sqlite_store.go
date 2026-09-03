package credentials

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const maxEnvelopeJSONLength = 64 << 10

// SQLiteStore is the first durable envelope backend. Hosted PostgreSQL will
// implement the same Store contract, while the master key remains external.
type SQLiteStore struct {
	db *sql.DB
}

func OpenSQLiteStore(path string) (*SQLiteStore, error) {
	path = strings.TrimSpace(path)
	if path == "" || strings.EqualFold(path, "off") {
		return nil, errors.New("credential envelope database path is required")
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("resolve credential database path: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(absolute), 0o700); err != nil {
		return nil, fmt.Errorf("create credential database directory: %w", err)
	}
	database, err := sql.Open("sqlite", absolute)
	if err != nil {
		return nil, fmt.Errorf("open credential SQLite: %w", err)
	}
	database.SetMaxOpenConns(4)
	store := &SQLiteStore{db: database}
	if err := store.initialize(context.Background()); err != nil {
		_ = database.Close()
		return nil, err
	}
	if err := os.Chmod(absolute, 0o600); err != nil && !errors.Is(err, os.ErrNotExist) {
		_ = database.Close()
		return nil, fmt.Errorf("restrict credential database permissions: %w", err)
	}
	return store, nil
}

func (store *SQLiteStore) initialize(ctx context.Context) error {
	for _, statement := range []string{
		"PRAGMA busy_timeout = 5000",
		"PRAGMA journal_mode = WAL",
		"PRAGMA synchronous = FULL",
		`CREATE TABLE IF NOT EXISTS credential_envelopes (
			job_id TEXT PRIMARY KEY NOT NULL,
			expires_at INTEGER NOT NULL,
			envelope_json BLOB NOT NULL,
			lease_owner TEXT,
			lease_until INTEGER,
			attempts INTEGER NOT NULL DEFAULT 0
		)`,
		"CREATE INDEX IF NOT EXISTS credential_envelopes_expires_at ON credential_envelopes(expires_at)",
	} {
		if _, err := store.db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("initialize credential SQLite: %w", err)
		}
	}
	return nil
}

func (store *SQLiteStore) Put(ctx context.Context, envelope Envelope) error {
	if err := validateJobID(envelope.JobID); err != nil {
		return err
	}
	if envelope.ExpiresAt.IsZero() || len(envelope.Ciphertext) == 0 {
		return ErrInvalidEnvelope
	}
	payload, err := json.Marshal(envelope)
	if err != nil {
		return fmt.Errorf("encode stored credential envelope: %w", err)
	}
	if len(payload) > maxEnvelopeJSONLength {
		return fmt.Errorf("credential envelope exceeds %d bytes", maxEnvelopeJSONLength)
	}
	_, err = store.db.ExecContext(ctx, `
		INSERT INTO credential_envelopes(job_id, expires_at, envelope_json, lease_owner, lease_until, attempts)
		VALUES (?, ?, ?, NULL, NULL, 0)
		ON CONFLICT(job_id) DO UPDATE SET
			expires_at = excluded.expires_at,
			envelope_json = excluded.envelope_json,
			lease_owner = NULL,
			lease_until = NULL,
			attempts = 0
	`, envelope.JobID, envelope.ExpiresAt.UnixMilli(), payload)
	if err != nil {
		return fmt.Errorf("store credential envelope: %w", err)
	}
	return nil
}

func (store *SQLiteStore) Lease(ctx context.Context, jobID, workerID string, now time.Time, duration time.Duration) (Envelope, error) {
	if err := validateJobID(jobID); err != nil {
		return Envelope{}, err
	}
	workerID = strings.TrimSpace(workerID)
	if workerID == "" || len(workerID) > 128 || duration <= 0 {
		return Envelope{}, errors.New("invalid credential lease")
	}
	nowMillis := now.UnixMilli()
	transaction, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return Envelope{}, fmt.Errorf("begin credential lease: %w", err)
	}
	defer transaction.Rollback()
	result, err := transaction.ExecContext(ctx, `
		UPDATE credential_envelopes
		SET lease_owner = ?, lease_until = ?, attempts = attempts + 1
		WHERE job_id = ? AND expires_at > ?
		  AND (lease_until IS NULL OR lease_until <= ? OR lease_owner = ?)
	`, workerID, now.Add(duration).UnixMilli(), jobID, nowMillis, nowMillis, workerID)
	if err != nil {
		return Envelope{}, fmt.Errorf("lease credential envelope: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return Envelope{}, fmt.Errorf("inspect credential lease: %w", err)
	}
	if affected != 1 {
		var expiresAt int64
		var leaseUntil sql.NullInt64
		err := transaction.QueryRowContext(ctx, "SELECT expires_at, lease_until FROM credential_envelopes WHERE job_id = ?", jobID).Scan(&expiresAt, &leaseUntil)
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return Envelope{}, ErrNotFound
		case err != nil:
			return Envelope{}, fmt.Errorf("inspect unavailable credential envelope: %w", err)
		case expiresAt <= nowMillis:
			return Envelope{}, ErrExpired
		default:
			return Envelope{}, ErrLeased
		}
	}
	var payload []byte
	if err := transaction.QueryRowContext(ctx, "SELECT envelope_json FROM credential_envelopes WHERE job_id = ?", jobID).Scan(&payload); err != nil {
		return Envelope{}, fmt.Errorf("read leased credential envelope: %w", err)
	}
	if len(payload) == 0 || len(payload) > maxEnvelopeJSONLength {
		return Envelope{}, ErrInvalidEnvelope
	}
	var envelope Envelope
	if err := json.Unmarshal(payload, &envelope); err != nil || envelope.JobID != jobID {
		return Envelope{}, ErrInvalidEnvelope
	}
	if err := transaction.Commit(); err != nil {
		return Envelope{}, fmt.Errorf("commit credential lease: %w", err)
	}
	return envelope, nil
}

func (store *SQLiteStore) Renew(ctx context.Context, jobID, workerID string, now time.Time, duration time.Duration) error {
	if err := validateJobID(jobID); err != nil {
		return err
	}
	workerID = strings.TrimSpace(workerID)
	if workerID == "" || len(workerID) > 128 || duration <= 0 {
		return errors.New("invalid credential lease renewal")
	}
	result, err := store.db.ExecContext(ctx, `
		UPDATE credential_envelopes
		SET lease_until = ?
		WHERE job_id = ? AND lease_owner = ? AND expires_at > ?
	`, now.Add(duration).UnixMilli(), jobID, workerID, now.UnixMilli())
	if err != nil {
		return fmt.Errorf("renew credential lease: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("inspect credential lease renewal: %w", err)
	}
	if affected != 1 {
		return ErrLeased
	}
	return nil
}

func (store *SQLiteStore) Exists(ctx context.Context, jobID string, now time.Time) (bool, error) {
	if err := validateJobID(jobID); err != nil {
		return false, err
	}
	var exists int
	err := store.db.QueryRowContext(ctx, "SELECT 1 FROM credential_envelopes WHERE job_id = ? AND expires_at > ?", jobID, now.UnixMilli()).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("check credential envelope: %w", err)
	}
	return true, nil
}

func (store *SQLiteStore) Delete(ctx context.Context, jobID string) error {
	if err := validateJobID(jobID); err != nil {
		return err
	}
	if _, err := store.db.ExecContext(ctx, "DELETE FROM credential_envelopes WHERE job_id = ?", jobID); err != nil {
		return fmt.Errorf("delete credential envelope: %w", err)
	}
	return nil
}

func (store *SQLiteStore) CleanupExpired(ctx context.Context, now time.Time) (int64, error) {
	result, err := store.db.ExecContext(ctx, "DELETE FROM credential_envelopes WHERE expires_at <= ?", now.UnixMilli())
	if err != nil {
		return 0, fmt.Errorf("delete expired credential envelopes: %w", err)
	}
	count, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("count expired credential envelopes: %w", err)
	}
	return count, nil
}

func (store *SQLiteStore) Close() error {
	if err := store.db.Close(); err != nil {
		return fmt.Errorf("close credential SQLite: %w", err)
	}
	return nil
}
