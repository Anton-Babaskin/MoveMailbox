package worker

import (
	"bytes"
	"encoding/base64"
	"testing"
	"time"
)

func TestProcessRunnerDoesNotRetainEncodedMasterKey(t *testing.T) {
	rawKey := bytes.Repeat([]byte{0x5a}, 32)
	encodedKey := base64.StdEncoding.EncodeToString(rawKey)
	runner, err := NewProcessRunner(ProcessConfig{
		DatabasePath:  t.TempDir() + "/jobs.db",
		MasterKey:     encodedKey,
		CredentialTTL: time.Hour,
		LeaseTTL:      time.Minute,
		Demo:          true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if runner.config.MasterKey != "" {
		t.Fatal("runner retained the encoded master key in its configuration")
	}
	if len(runner.masterKey) != len(rawKey) {
		t.Fatalf("runner master key length = %d, want %d", len(runner.masterKey), len(rawKey))
	}
	if err := runner.Close(); err != nil {
		t.Fatal(err)
	}
	if runner.masterKey != nil {
		t.Fatal("runner did not clear its master key on close")
	}
}
