package worker

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
	_ "modernc.org/sqlite"
)

const (
	remoteStatusAccepting = "accepting"
	remoteStatusQueued    = "queued"
	remoteStatusRunning   = "running"
	remoteStatusCompleted = "completed"
	remoteStatusFailed    = "failed"
	remoteStatusCancelled = "cancelled"
	// Worst-case JSON escaping of all bounded event fields must still fit
	// within the remote response limit.
	remoteEventLimit = 128
	maxRemotePayload = 4 << 20
)

type remoteEvent struct {
	Sequence uint64         `json:"sequence"`
	Event    migrator.Event `json:"event"`
}

type remoteJobSnapshot struct {
	ID       string           `json:"id"`
	Status   string           `json:"status"`
	Sequence uint64           `json:"sequence"`
	Attempts int              `json:"attempts"`
	Events   []remoteEvent    `json:"events,omitempty"`
	Result   *migrator.Result `json:"result,omitempty"`
	Error    string           `json:"error,omitempty"`
	Updated  time.Time        `json:"updatedAt"`
	NoRetry  bool             `json:"-"`
}

type serviceStore struct {
	db   *sql.DB
	lock *os.File
}

func openServiceStore(path string) (*serviceStore, error) {
	path = strings.TrimSpace(path)
	if path == "" || strings.EqualFold(path, "off") {
		return nil, errors.New("worker service database path is required")
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("resolve worker service database path: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(absolute), 0o700); err != nil {
		return nil, fmt.Errorf("create worker service database directory: %w", err)
	}
	lock, err := lockServiceFile(absolute + ".lock")
	if err != nil {
		return nil, fmt.Errorf("worker database already in use or cannot be locked: %w", err)
	}
	database, err := sql.Open("sqlite", absolute)
	if err != nil {
		_ = lock.Close()
		return nil, fmt.Errorf("open worker service SQLite: %w", err)
	}
	database.SetMaxOpenConns(1)
	store := &serviceStore{db: database, lock: lock}
	if err := store.initialize(context.Background()); err != nil {
		_ = database.Close()
		_ = lock.Close()
		return nil, err
	}
	if err := os.Chmod(absolute, 0o600); err != nil && !errors.Is(err, os.ErrNotExist) {
		_ = database.Close()
		_ = lock.Close()
		return nil, fmt.Errorf("restrict worker service database permissions: %w", err)
	}
	return store, nil
}

func (store *serviceStore) initialize(ctx context.Context) error {
	statements := []string{
		"PRAGMA busy_timeout = 5000",
		"PRAGMA journal_mode = WAL",
		"PRAGMA synchronous = FULL",
		`CREATE TABLE IF NOT EXISTS worker_jobs (
			job_id TEXT PRIMARY KEY NOT NULL,
			status TEXT NOT NULL,
			sequence INTEGER NOT NULL DEFAULT 0,
			attempts INTEGER NOT NULL DEFAULT 0,
			available_at INTEGER NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			expires_at INTEGER NOT NULL,
			envelope_hash BLOB NOT NULL,
			no_retry INTEGER NOT NULL DEFAULT 0,
			result_json BLOB,
			error_message TEXT
		)`,
		"CREATE INDEX IF NOT EXISTS worker_jobs_queue ON worker_jobs(status, available_at, created_at)",
		`CREATE TABLE IF NOT EXISTS worker_events (
			job_id TEXT NOT NULL,
			sequence INTEGER NOT NULL,
			event_json BLOB NOT NULL,
			PRIMARY KEY(job_id, sequence),
			FOREIGN KEY(job_id) REFERENCES worker_jobs(job_id) ON DELETE CASCADE
		)`,
	}
	for _, statement := range statements {
		if _, err := store.db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("initialize worker service SQLite: %w", err)
		}
	}
	return nil
}

var errQueueFull = errors.New("worker queue capacity reached")

// admit stores the staged job and ciphertext atomically. Activation happens
// only after the API has persisted the corresponding owner/job snapshot.
func (store *serviceStore) admit(ctx context.Context, envelope credentials.Envelope, now time.Time, capacity int) (bool, error) {
	jobID := envelope.JobID
	if !validRemoteJobID(jobID) {
		return false, errors.New("invalid remote worker job ID")
	}
	payload, err := json.Marshal(envelope)
	if err != nil || len(payload) > maxServiceRequestBytes {
		return false, credentials.ErrInvalidEnvelope
	}
	digest := sha256.Sum256(payload)
	tx, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()
	var previous []byte
	err = tx.QueryRowContext(ctx, "SELECT envelope_hash FROM worker_jobs WHERE job_id = ?", jobID).Scan(&previous)
	if err == nil {
		return string(previous) == string(digest[:]), nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return false, err
	}
	var count int
	if err := tx.QueryRowContext(ctx, "SELECT count(*) FROM worker_jobs").Scan(&count); err != nil {
		return false, err
	}
	if count >= capacity {
		return false, errQueueFull
	}
	_, err = tx.ExecContext(ctx, `
		INSERT INTO worker_jobs(job_id, status, sequence, attempts, available_at, created_at, updated_at, expires_at, envelope_hash)
		VALUES (?, ?, 0, 0, ?, ?, ?, ?, ?)
	`, jobID, remoteStatusAccepting, now.UnixMilli(), now.UnixMilli(), now.UnixMilli(), envelope.ExpiresAt.UnixMilli(), digest[:])
	if err != nil {
		return false, err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO credential_envelopes(job_id, expires_at, envelope_json) VALUES (?, ?, ?)`, jobID, envelope.ExpiresAt.UnixMilli(), payload)
	if err != nil {
		return false, err
	}
	return true, tx.Commit()
}

func (store *serviceStore) activate(ctx context.Context, jobID string, now time.Time) error {
	_, err := store.db.ExecContext(ctx, `
		UPDATE worker_jobs SET status = ?, available_at = ?, updated_at = ?
		WHERE job_id = ? AND status = ?
	`, remoteStatusQueued, now.UnixMilli(), now.UnixMilli(), jobID, remoteStatusAccepting)
	if err != nil {
		return fmt.Errorf("activate remote worker job: %w", err)
	}
	return nil
}

func (store *serviceStore) claimNext(ctx context.Context, now time.Time, maxAttempts int) (string, bool, error) {
	transaction, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return "", false, fmt.Errorf("begin remote job claim: %w", err)
	}
	defer transaction.Rollback()
	var jobID string
	err = transaction.QueryRowContext(ctx, `
		SELECT job_id FROM worker_jobs
		WHERE status = ? AND available_at <= ? AND attempts < ? AND expires_at > ?
		ORDER BY created_at ASC LIMIT 1
	`, remoteStatusQueued, now.UnixMilli(), maxAttempts, now.UnixMilli()).Scan(&jobID)
	if errors.Is(err, sql.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, fmt.Errorf("select remote worker job: %w", err)
	}
	result, err := transaction.ExecContext(ctx, `
		UPDATE worker_jobs SET status = ?, attempts = attempts + 1, updated_at = ?
		WHERE job_id = ? AND status = ?
	`, remoteStatusRunning, now.UnixMilli(), jobID, remoteStatusQueued)
	if err != nil {
		return "", false, fmt.Errorf("claim remote worker job: %w", err)
	}
	count, err := result.RowsAffected()
	if err != nil {
		return "", false, fmt.Errorf("inspect remote worker claim: %w", err)
	}
	if count != 1 {
		return "", false, nil
	}
	if err := transaction.Commit(); err != nil {
		return "", false, fmt.Errorf("commit remote worker claim: %w", err)
	}
	return jobID, true, nil
}

func (store *serviceStore) appendEvent(ctx context.Context, jobID string, event migrator.Event, now time.Time) error {
	payload, err := json.Marshal(event)
	if err != nil || len(payload) > maxRemotePayload {
		return errors.New("invalid remote worker event")
	}
	transaction, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin remote event: %w", err)
	}
	defer transaction.Rollback()
	result, err := transaction.ExecContext(ctx, `
		UPDATE worker_jobs SET sequence = sequence + 1, updated_at = ?
		WHERE job_id = ? AND status = ?
	`, now.UnixMilli(), jobID, remoteStatusRunning)
	if err != nil {
		return fmt.Errorf("advance remote event sequence: %w", err)
	}
	count, err := result.RowsAffected()
	if err != nil || count != 1 {
		return errors.New("remote worker job is no longer running")
	}
	var sequence uint64
	if err := transaction.QueryRowContext(ctx, "SELECT sequence FROM worker_jobs WHERE job_id = ?", jobID).Scan(&sequence); err != nil {
		return fmt.Errorf("read remote event sequence: %w", err)
	}
	if _, err := transaction.ExecContext(ctx, "INSERT INTO worker_events(job_id, sequence, event_json) VALUES (?, ?, ?)", jobID, sequence, payload); err != nil {
		return fmt.Errorf("store remote worker event: %w", err)
	}
	if _, err := transaction.ExecContext(ctx, `
		DELETE FROM worker_events WHERE job_id = ? AND sequence <= ?
	`, jobID, maxInt64(0, int64(sequence)-remoteEventLimit)); err != nil {
		return fmt.Errorf("trim remote worker events: %w", err)
	}
	if err := transaction.Commit(); err != nil {
		return fmt.Errorf("commit remote worker event: %w", err)
	}
	return nil
}

func (store *serviceStore) complete(ctx context.Context, jobID, status string, result migrator.Result, errorMessage string, now time.Time) error {
	if status != remoteStatusCompleted && status != remoteStatusFailed && status != remoteStatusCancelled {
		return errors.New("invalid remote terminal status")
	}
	var resultJSON []byte
	if status == remoteStatusCompleted {
		var err error
		resultJSON, err = json.Marshal(result)
		if err != nil {
			return fmt.Errorf("encode remote worker result: %w", err)
		}
	}
	resultValue, errorValue := any(nil), any(nil)
	if len(resultJSON) > 0 {
		resultValue = resultJSON
	}
	if errorMessage != "" {
		errorValue = errorMessage
	}
	tx, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, `
		UPDATE worker_jobs SET status = ?, result_json = ?, error_message = ?, updated_at = ?
		WHERE job_id = ? AND status IN ('running', 'queued', 'accepting')
	`, status, resultValue, errorValue, now.UnixMilli(), jobID)
	if err != nil {
		return fmt.Errorf("complete remote worker job: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM credential_envelopes WHERE job_id = ?", jobID); err != nil {
		return err
	}
	return tx.Commit()
}

func (store *serviceStore) requeue(ctx context.Context, jobID string, available time.Time, undoAttempt bool) error {
	attemptExpression := "attempts"
	if undoAttempt {
		attemptExpression = "CASE WHEN attempts > 0 THEN attempts - 1 ELSE 0 END"
	}
	_, err := store.db.ExecContext(ctx, `UPDATE worker_jobs SET status = ?, available_at = ?, updated_at = ?, attempts = `+attemptExpression+` WHERE job_id = ? AND status = 'running'`, remoteStatusQueued, available.UnixMilli(), time.Now().UnixMilli(), jobID)
	if err != nil {
		return fmt.Errorf("requeue remote worker job: %w", err)
	}
	return nil
}

func (store *serviceStore) recoverInterrupted(ctx context.Context, now time.Time, maxAttempts int, resume bool) error {
	if !resume {
		if _, err := store.db.ExecContext(ctx, `UPDATE worker_jobs SET status = 'failed', error_message = 'worker interrupted; verify child processes and destination before a new run', updated_at = ? WHERE status = 'running'`, now.UnixMilli()); err != nil {
			return err
		}
	}
	if _, err := store.db.ExecContext(ctx, `
		UPDATE worker_jobs SET status = ?, available_at = ?, updated_at = ?
		WHERE status = ? AND attempts < ? AND no_retry = 0
	`, remoteStatusQueued, now.UnixMilli(), now.UnixMilli(), remoteStatusRunning, maxAttempts); err != nil {
		return fmt.Errorf("recover interrupted remote jobs: %w", err)
	}
	if _, err := store.db.ExecContext(ctx, `
		UPDATE worker_jobs SET status = ?, error_message = ?, updated_at = ?
		WHERE status IN ('running','queued') AND (attempts >= ? OR no_retry = 1)
	`, remoteStatusFailed, "worker interrupted; retry limit reached or destructive mirror requires manual review", now.UnixMilli(), maxAttempts); err != nil {
		return fmt.Errorf("fail exhausted remote jobs: %w", err)
	}
	return store.maintain(ctx, now)
}

func (store *serviceStore) get(ctx context.Context, jobID string, after uint64) (remoteJobSnapshot, bool, error) {
	tx, err := store.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return remoteJobSnapshot{}, false, err
	}
	defer tx.Rollback()
	var snapshot remoteJobSnapshot
	var updatedMillis int64
	var resultJSON []byte
	var errorMessage sql.NullString
	err = tx.QueryRowContext(ctx, `
		SELECT job_id, status, sequence, attempts, result_json, error_message, updated_at, no_retry
		FROM worker_jobs WHERE job_id = ?
	`, jobID).Scan(&snapshot.ID, &snapshot.Status, &snapshot.Sequence, &snapshot.Attempts, &resultJSON, &errorMessage, &updatedMillis, &snapshot.NoRetry)
	if errors.Is(err, sql.ErrNoRows) {
		return remoteJobSnapshot{}, false, nil
	}
	if err != nil {
		return remoteJobSnapshot{}, false, fmt.Errorf("read remote worker job: %w", err)
	}
	snapshot.Updated = time.UnixMilli(updatedMillis).UTC()
	if errorMessage.Valid {
		snapshot.Error = errorMessage.String
	}
	if len(resultJSON) > 0 {
		var result migrator.Result
		if len(resultJSON) > maxRemotePayload || json.Unmarshal(resultJSON, &result) != nil {
			return remoteJobSnapshot{}, false, errors.New("invalid stored remote worker result")
		}
		snapshot.Result = &result
	}
	rows, err := tx.QueryContext(ctx, "SELECT sequence, event_json FROM worker_events WHERE job_id = ? AND sequence > ? ORDER BY sequence ASC", jobID, after)
	if err != nil {
		return remoteJobSnapshot{}, false, fmt.Errorf("read remote worker events: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var item remoteEvent
		var payload []byte
		if err := rows.Scan(&item.Sequence, &payload); err != nil {
			return remoteJobSnapshot{}, false, err
		}
		if len(payload) > maxRemotePayload || json.Unmarshal(payload, &item.Event) != nil {
			return remoteJobSnapshot{}, false, errors.New("invalid stored remote worker event")
		}
		snapshot.Events = append(snapshot.Events, item)
	}
	if err := rows.Err(); err != nil {
		return remoteJobSnapshot{}, false, err
	}
	return snapshot, true, nil
}

func (store *serviceStore) delete(ctx context.Context, jobID string) error {
	transaction, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer transaction.Rollback()
	if _, err := transaction.ExecContext(ctx, "DELETE FROM worker_events WHERE job_id = ?", jobID); err != nil {
		return err
	}
	if _, err := transaction.ExecContext(ctx, "DELETE FROM worker_jobs WHERE job_id = ?", jobID); err != nil {
		return err
	}
	return transaction.Commit()
}

func (store *serviceStore) close() error { return errors.Join(store.db.Close(), store.lock.Close()) }

func validRemoteJobID(jobID string) bool {
	if len(jobID) < 1 || len(jobID) > 128 {
		return false
	}
	for _, ch := range jobID {
		if !(ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' || ch == '-' || ch == '_') {
			return false
		}
	}
	return true
}

func (store *serviceStore) disableRetry(ctx context.Context, id string) error {
	_, err := store.db.ExecContext(ctx, "UPDATE worker_jobs SET no_retry = 1 WHERE job_id = ?", id)
	return err
}

func (store *serviceStore) maintain(ctx context.Context, now time.Time) error {
	tx, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, `UPDATE worker_jobs SET status = 'failed', error_message = 'credential envelope expired', updated_at = ? WHERE status IN ('accepting','queued') AND expires_at <= ?`, now.UnixMilli(), now.UnixMilli())
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `DELETE FROM credential_envelopes WHERE expires_at <= ? OR job_id IN (SELECT job_id FROM worker_jobs WHERE status IN ('completed','failed','cancelled'))`, now.UnixMilli())
	if err != nil {
		return err
	}
	// Retain terminal tombstones for at least the maximum envelope TTL. Replays
	// cannot recreate a cancelled or completed job while its envelope is valid.
	cutoff := now.Add(-48 * time.Hour).UnixMilli()
	_, err = tx.ExecContext(ctx, `DELETE FROM worker_events WHERE job_id IN (SELECT job_id FROM worker_jobs WHERE status IN ('completed','failed','cancelled') AND updated_at < ?)`, cutoff)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `DELETE FROM worker_jobs WHERE status IN ('completed','failed','cancelled') AND updated_at < ?`, cutoff)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func maxInt64(left, right int64) int64 {
	if left > right {
		return left
	}
	return right
}
