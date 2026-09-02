package jobs

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

const (
	sqliteSchemaVersion   = 1
	maxSnapshotJSONLength = 4 << 20
)

// SQLiteStore keeps local migration history across application restarts.
// Only Snapshot values are accepted, so credentials cannot enter this layer.
type SQLiteStore struct {
	db *sql.DB
}

func OpenSQLiteStore(path string) (*SQLiteStore, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil, errors.New("путь к базе данных не указан")
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("не удалось определить путь к базе данных: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(absolute), 0o700); err != nil {
		return nil, fmt.Errorf("не удалось создать каталог базы данных: %w", err)
	}

	database, err := sql.Open("sqlite", absolute)
	if err != nil {
		return nil, fmt.Errorf("не удалось открыть SQLite: %w", err)
	}
	database.SetMaxOpenConns(1)
	store := &SQLiteStore{db: database}
	if err := store.initialize(context.Background()); err != nil {
		_ = database.Close()
		return nil, err
	}
	if err := os.Chmod(absolute, 0o600); err != nil && !errors.Is(err, os.ErrNotExist) {
		_ = database.Close()
		return nil, fmt.Errorf("не удалось ограничить доступ к базе данных: %w", err)
	}
	return store, nil
}

func (store *SQLiteStore) Kind() string { return "sqlite" }

func (store *SQLiteStore) initialize(ctx context.Context) error {
	for _, statement := range []string{
		"PRAGMA busy_timeout = 5000",
		"PRAGMA journal_mode = WAL",
		"PRAGMA synchronous = FULL",
	} {
		if _, err := store.db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("не удалось настроить SQLite: %w", err)
		}
	}

	var version int
	if err := store.db.QueryRowContext(ctx, "PRAGMA user_version").Scan(&version); err != nil {
		return fmt.Errorf("не удалось прочитать версию схемы SQLite: %w", err)
	}
	if version > sqliteSchemaVersion {
		return fmt.Errorf("база данных использует более новую схему %d", version)
	}
	if version == sqliteSchemaVersion {
		return nil
	}

	transaction, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("не удалось начать миграцию SQLite: %w", err)
	}
	defer transaction.Rollback()
	if _, err := transaction.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS job_snapshots (
			id TEXT PRIMARY KEY NOT NULL,
			created_at INTEGER NOT NULL,
			finished_at INTEGER,
			snapshot_json BLOB NOT NULL
		);
		CREATE INDEX IF NOT EXISTS job_snapshots_created_at
			ON job_snapshots(created_at DESC);
	`); err != nil {
		return fmt.Errorf("не удалось создать схему SQLite: %w", err)
	}
	if _, err := transaction.ExecContext(ctx, fmt.Sprintf("PRAGMA user_version = %d", sqliteSchemaVersion)); err != nil {
		return fmt.Errorf("не удалось записать версию схемы SQLite: %w", err)
	}
	if err := transaction.Commit(); err != nil {
		return fmt.Errorf("не удалось сохранить схему SQLite: %w", err)
	}
	return nil
}

func (store *SQLiteStore) Load(ctx context.Context) ([]Snapshot, error) {
	rows, err := store.db.QueryContext(ctx, "SELECT id, snapshot_json FROM job_snapshots ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать историю заданий: %w", err)
	}
	defer rows.Close()

	var snapshots []Snapshot
	for rows.Next() {
		var id string
		var payload []byte
		if err := rows.Scan(&id, &payload); err != nil {
			return nil, fmt.Errorf("не удалось прочитать запись истории: %w", err)
		}
		if len(payload) == 0 || len(payload) > maxSnapshotJSONLength {
			return nil, fmt.Errorf("запись задания %q имеет недопустимый размер", id)
		}
		var snapshot Snapshot
		if err := json.Unmarshal(payload, &snapshot); err != nil {
			return nil, fmt.Errorf("запись задания %q повреждена: %w", id, err)
		}
		if snapshot.View.ID == "" || snapshot.View.ID != id {
			return nil, fmt.Errorf("запись задания %q содержит неверный идентификатор", id)
		}
		snapshots = append(snapshots, snapshot)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("не удалось завершить чтение истории: %w", err)
	}
	return snapshots, nil
}

func (store *SQLiteStore) Save(ctx context.Context, snapshot Snapshot) error {
	if strings.TrimSpace(snapshot.View.ID) == "" {
		return errors.New("нельзя сохранить задание без идентификатора")
	}
	payload, err := json.Marshal(snapshot)
	if err != nil {
		return fmt.Errorf("не удалось сериализовать задание: %w", err)
	}
	if len(payload) > maxSnapshotJSONLength {
		return fmt.Errorf("история задания превышает лимит %d байт", maxSnapshotJSONLength)
	}
	var finishedAt any
	if snapshot.View.FinishedAt != nil {
		finishedAt = snapshot.View.FinishedAt.UnixMilli()
	}
	_, err = store.db.ExecContext(ctx, `
		INSERT INTO job_snapshots(id, created_at, finished_at, snapshot_json)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			created_at = excluded.created_at,
			finished_at = excluded.finished_at,
			snapshot_json = excluded.snapshot_json
	`, snapshot.View.ID, snapshot.View.CreatedAt.UnixMilli(), finishedAt, payload)
	if err != nil {
		return fmt.Errorf("не удалось сохранить историю задания: %w", err)
	}
	return nil
}

func (store *SQLiteStore) Delete(ctx context.Context, id string) error {
	if _, err := store.db.ExecContext(ctx, "DELETE FROM job_snapshots WHERE id = ?", id); err != nil {
		return fmt.Errorf("не удалось удалить историю задания: %w", err)
	}
	return nil
}

func (store *SQLiteStore) Close() error {
	if err := store.db.Close(); err != nil {
		return fmt.Errorf("не удалось закрыть SQLite: %w", err)
	}
	return nil
}
