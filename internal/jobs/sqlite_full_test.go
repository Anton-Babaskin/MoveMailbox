package jobs

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestSQLiteFullRollsBackSnapshotAndRecoversAfterCapacityRestored(t *testing.T) {
	store, err := OpenSQLiteStore(filepath.Join(t.TempDir(), "full.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	ctx := context.Background()
	original := Snapshot{View: View{ID: "retained", Status: StatusRunning, CreatedAt: time.Now().UTC()}}
	if err := store.Save(ctx, original); err != nil {
		t.Fatal(err)
	}
	var pages int
	if err := store.db.QueryRow("PRAGMA page_count").Scan(&pages); err != nil {
		t.Fatal(err)
	}
	// Real SQLITE_FULL from SQLite's capacity limit without filling the host disk.
	if _, err := store.db.Exec(fmt.Sprintf("PRAGMA max_page_count = %d", pages)); err != nil {
		t.Fatal(err)
	}
	updated := original
	updated.View.Status = StatusFailed
	updated.View.Error = strings.Repeat("synthetic storage fixture ", 20000)
	err = store.Save(ctx, updated)
	var sqliteError interface{ Code() int }
	if !errors.As(err, &sqliteError) || sqliteError.Code() != 13 {
		t.Fatalf("expected SQLITE_FULL (13), got %v", err)
	}
	loaded, err := store.Load(ctx)
	if err != nil || len(loaded) != 1 || loaded[0].View.Status != original.View.Status || loaded[0].View.Error != "" {
		t.Fatalf("failed write damaged previous snapshot: count=%d err=%v", len(loaded), err)
	}
	if _, err := store.db.Exec(fmt.Sprintf("PRAGMA max_page_count = %d", pages+1024)); err != nil {
		t.Fatal(err)
	}
	if err := store.Save(ctx, updated); err != nil {
		t.Fatalf("save after capacity restored: %v", err)
	}
	loaded, err = store.Load(ctx)
	if err != nil || len(loaded) != 1 || loaded[0].View.Error != updated.View.Error || loaded[0].View.Status != StatusFailed {
		t.Fatalf("recovered write not persisted: count=%d err=%v", len(loaded), err)
	}
	var integrity string
	if err := store.db.QueryRow("PRAGMA integrity_check").Scan(&integrity); err != nil || integrity != "ok" {
		t.Fatalf("integrity=%q err=%v", integrity, err)
	}
}
