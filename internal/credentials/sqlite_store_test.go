package credentials

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestSQLiteEnvelopeStoreLeasesAtomicallyAndDeletesExpired(t *testing.T) {
	path := filepath.Join(t.TempDir(), "movemailbox.db")
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	now := time.Now().UTC().Truncate(time.Millisecond)
	envelope := Envelope{
		Version: EnvelopeVersion, KeyID: "key", JobID: "job-lease", CreatedAt: now,
		ExpiresAt: now.Add(time.Hour), Nonce: []byte("123456789012"), Ciphertext: []byte("ciphertext"),
	}
	if err := store.Put(context.Background(), envelope); err != nil {
		t.Fatal(err)
	}
	leased, err := store.Lease(context.Background(), envelope.JobID, "worker-one", now, time.Minute)
	if err != nil || leased.JobID != envelope.JobID {
		t.Fatalf("first Lease() = %+v, %v", leased, err)
	}
	if _, err := store.Lease(context.Background(), envelope.JobID, "worker-two", now, time.Minute); !errors.Is(err, ErrLeased) {
		t.Fatalf("concurrent Lease() error = %v", err)
	}
	if err := store.Renew(context.Background(), envelope.JobID, "worker-one", now.Add(30*time.Second), time.Minute); err != nil {
		t.Fatalf("lease renewal failed: %v", err)
	}
	if err := store.Renew(context.Background(), envelope.JobID, "worker-two", now.Add(30*time.Second), time.Minute); !errors.Is(err, ErrLeased) {
		t.Fatalf("foreign lease renewal error = %v", err)
	}
	if _, err := store.Lease(context.Background(), envelope.JobID, "worker-two", now.Add(3*time.Minute), time.Minute); err != nil {
		t.Fatalf("expired lease was not recoverable: %v", err)
	}

	expired := envelope.Clone()
	expired.JobID = "job-expired"
	expired.ExpiresAt = now.Add(-time.Second)
	if err := store.Put(context.Background(), expired); err != nil {
		t.Fatal(err)
	}
	removed, err := store.CleanupExpired(context.Background(), now)
	if err != nil || removed != 1 {
		t.Fatalf("CleanupExpired() = %d, %v", removed, err)
	}
	if exists, err := store.Exists(context.Background(), expired.JobID, now); err != nil || exists {
		t.Fatalf("expired envelope exists=%v, error=%v", exists, err)
	}
}

func TestSQLiteEnvelopeFileContainsNoPlaintextCredentials(t *testing.T) {
	path := filepath.Join(t.TempDir(), "movemailbox.db")
	master := bytes.Repeat([]byte{0x33}, 32)
	sealer, err := NewSealer(master, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	defer sealer.Destroy()
	request := credentialTestRequest()
	envelope, err := sealer.Seal("job-ciphertext", request)
	if err != nil {
		t.Fatal(err)
	}
	store, err := OpenSQLiteStore(path)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put(context.Background(), envelope); err != nil {
		t.Fatal(err)
	}
	if err := store.Close(); err != nil {
		t.Fatal(err)
	}
	for _, suffix := range []string{"", "-wal", "-shm"} {
		payload, err := os.ReadFile(path + suffix)
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		if err != nil {
			t.Fatal(err)
		}
		for _, secret := range []string{request.Source.Password, request.Destination.Password} {
			if bytes.Contains(payload, []byte(secret)) {
				t.Fatalf("SQLite %s contains plaintext credential %q", filepath.Base(path+suffix), secret)
			}
		}
	}
	serialized, _ := json.Marshal(envelope)
	if bytes.Contains(serialized, []byte(request.Source.Password)) {
		t.Fatal("serialized envelope contains plaintext")
	}
}
