package credentials

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func TestEnvelopeRoundTripUsesPerJobAuthenticatedCiphertext(t *testing.T) {
	master := bytes.Repeat([]byte{0x42}, 32)
	sealer, err := NewSealer(master, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	defer sealer.Destroy()
	fixed := time.Date(2026, 9, 3, 12, 0, 0, 0, time.UTC)
	sealer.now = func() time.Time { return fixed }
	request := credentialTestRequest()
	envelope, err := sealer.Seal("job-one", request)
	if err != nil {
		t.Fatal(err)
	}
	serialized, err := json.Marshal(envelope)
	if err != nil {
		t.Fatal(err)
	}
	for _, secret := range []string{request.Source.Password, request.Destination.Password} {
		if bytes.Contains(serialized, []byte(secret)) {
			t.Fatalf("envelope contains plaintext secret %q", secret)
		}
	}
	opened, err := sealer.Open("job-one", envelope)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(opened, request) {
		t.Fatalf("opened request = %+v, want %+v", opened, request)
	}

	other, err := sealer.Seal("job-two", request)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Equal(envelope.Ciphertext, other.Ciphertext) {
		t.Fatal("different jobs received identical ciphertext")
	}
	if _, err := sealer.Open("job-two", envelope); !errors.Is(err, ErrInvalidEnvelope) {
		t.Fatalf("cross-job Open() error = %v", err)
	}
}

func TestEnvelopeRejectsTamperingWrongKeyAndExpiry(t *testing.T) {
	sealer, err := NewSealer(bytes.Repeat([]byte{0x11}, 32), time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	defer sealer.Destroy()
	now := time.Now().UTC()
	sealer.now = func() time.Time { return now }
	envelope, err := sealer.Seal("job-tamper", credentialTestRequest())
	if err != nil {
		t.Fatal(err)
	}

	tampered := envelope.Clone()
	tampered.Ciphertext[len(tampered.Ciphertext)-1] ^= 0xff
	if _, err := sealer.Open("job-tamper", tampered); !errors.Is(err, ErrInvalidEnvelope) {
		t.Fatalf("tampered Open() error = %v", err)
	}
	wrong, err := NewSealer(bytes.Repeat([]byte{0x22}, 32), time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	defer wrong.Destroy()
	if _, err := wrong.Open("job-tamper", envelope); !errors.Is(err, ErrInvalidEnvelope) {
		t.Fatalf("wrong-key Open() error = %v", err)
	}
	sealer.now = func() time.Time { return envelope.ExpiresAt }
	if _, err := sealer.Open("job-tamper", envelope); !errors.Is(err, ErrExpired) {
		t.Fatalf("expired Open() error = %v", err)
	}
}

func TestParseMasterKeyRequiresRandomBase64(t *testing.T) {
	encoded := base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0x7a}, 32))
	parsed, err := ParseMasterKey(encoded)
	if err != nil || len(parsed) != 32 {
		t.Fatalf("ParseMasterKey() = %d bytes, %v", len(parsed), err)
	}
	if _, err := ParseMasterKey("human-password"); err == nil {
		t.Fatal("short human password was accepted as a master key")
	}
}

func credentialTestRequest() migrator.Request {
	return migrator.Request{
		Source:      migrator.Endpoint{Host: "source.example", Port: 993, Security: migrator.SecurityTLS, Username: "source@example.test", Password: "source-secret"},
		Destination: migrator.Endpoint{Host: "destination.example", Port: 993, Security: migrator.SecurityTLS, Username: "destination@example.test", Password: "destination-secret"},
		Options:     migrator.Options{SyncFlags: true, PreserveDates: true},
	}
}
