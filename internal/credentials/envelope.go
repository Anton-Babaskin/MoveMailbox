package credentials

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

const (
	EnvelopeVersion = 1
	minimumKeyBytes = 32
	maximumJobIDLen = 128
	minimumTTL      = 5 * time.Minute
	maximumTTL      = 48 * time.Hour
)

var (
	ErrExpired         = errors.New("credential envelope expired")
	ErrInvalidEnvelope = errors.New("invalid credential envelope")
)

// Envelope contains an authenticated encrypted migration request. The
// ciphertext is safe to persist, while the master key must remain outside the
// database and backups.
type Envelope struct {
	Version    int       `json:"version"`
	KeyID      string    `json:"keyId"`
	JobID      string    `json:"jobId"`
	CreatedAt  time.Time `json:"createdAt"`
	ExpiresAt  time.Time `json:"expiresAt"`
	Nonce      []byte    `json:"nonce"`
	Ciphertext []byte    `json:"ciphertext"`
}

func (envelope Envelope) Clone() Envelope {
	envelope.Nonce = append([]byte(nil), envelope.Nonce...)
	envelope.Ciphertext = append([]byte(nil), envelope.Ciphertext...)
	return envelope
}

// Sealer derives an independent AEAD key for every job. Keeping the master key
// out of the database means a database or backup leak is insufficient to open
// credential envelopes.
type Sealer struct {
	masterKey []byte
	keyID     string
	ttl       time.Duration
	now       func() time.Time
}

// Destroy removes the process-local copy of the master key. The caller still
// owns and must clear the original key material supplied to NewSealer.
func (sealer *Sealer) Destroy() {
	if sealer == nil {
		return
	}
	clearBytes(sealer.masterKey)
	sealer.masterKey = nil
}

func NewSealer(masterKey []byte, ttl time.Duration) (*Sealer, error) {
	if len(masterKey) < minimumKeyBytes {
		return nil, fmt.Errorf("credential master key must contain at least %d bytes", minimumKeyBytes)
	}
	if ttl < minimumTTL || ttl > maximumTTL {
		return nil, fmt.Errorf("credential TTL must be between %s and %s", minimumTTL, maximumTTL)
	}
	digest := sha256.Sum256(masterKey)
	return &Sealer{
		masterKey: append([]byte(nil), masterKey...),
		keyID:     hex.EncodeToString(digest[:8]),
		ttl:       ttl,
		now:       time.Now,
	}, nil
}

// ParseMasterKey accepts a base64-encoded external secret. Requiring an
// encoded random value avoids ambiguous human passwords being used as keys.
func ParseMasterKey(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, errors.New("MOVEMAILBOX_MASTER_KEY is required")
	}
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(value)
	}
	if err != nil || len(decoded) < minimumKeyBytes {
		clearBytes(decoded)
		return nil, fmt.Errorf("MOVEMAILBOX_MASTER_KEY must be base64 for at least %d random bytes", minimumKeyBytes)
	}
	return decoded, nil
}

func (sealer *Sealer) Seal(jobID string, request migrator.Request) (Envelope, error) {
	if err := request.Validate(); err != nil {
		return Envelope{}, err
	}
	return sealer.SealJSON(jobID, request)
}

// SealJSON supports short-lived worker operations such as connection tests in
// addition to durable migration requests. Callers must validate the payload
// before sealing it.
func (sealer *Sealer) SealJSON(jobID string, value any) (Envelope, error) {
	if err := validateJobID(jobID); err != nil {
		return Envelope{}, err
	}
	now := sealer.now().UTC()
	envelope := Envelope{
		Version:   EnvelopeVersion,
		KeyID:     sealer.keyID,
		JobID:     jobID,
		CreatedAt: now,
		ExpiresAt: now.Add(sealer.ttl),
	}
	plaintext, err := json.Marshal(value)
	if err != nil {
		return Envelope{}, fmt.Errorf("encode credential envelope: %w", err)
	}
	defer clearBytes(plaintext)
	aead, key, err := sealer.aead(jobID)
	if err != nil {
		return Envelope{}, err
	}
	defer clearBytes(key)
	envelope.Nonce = make([]byte, aead.NonceSize())
	if _, err := rand.Read(envelope.Nonce); err != nil {
		return Envelope{}, fmt.Errorf("create credential nonce: %w", err)
	}
	envelope.Ciphertext = aead.Seal(nil, envelope.Nonce, plaintext, envelopeAAD(envelope))
	return envelope, nil
}

func (sealer *Sealer) Open(jobID string, envelope Envelope) (migrator.Request, error) {
	var request migrator.Request
	if err := sealer.OpenJSON(jobID, envelope, &request); err != nil {
		return migrator.Request{}, err
	}
	if err := request.Validate(); err != nil {
		clearRequest(&request)
		return migrator.Request{}, ErrInvalidEnvelope
	}
	return request, nil
}

// OpenJSON authenticates and decrypts an envelope into target. target must be
// a non-nil pointer. Callers are responsible for clearing sensitive fields.
func (sealer *Sealer) OpenJSON(jobID string, envelope Envelope, target any) error {
	if err := validateJobID(jobID); err != nil {
		return err
	}
	if envelope.Version != EnvelopeVersion || envelope.JobID != jobID || envelope.KeyID != sealer.keyID || envelope.CreatedAt.IsZero() || envelope.ExpiresAt.IsZero() || !envelope.ExpiresAt.After(envelope.CreatedAt) {
		return ErrInvalidEnvelope
	}
	if !sealer.now().Before(envelope.ExpiresAt) {
		return ErrExpired
	}
	aead, key, err := sealer.aead(jobID)
	if err != nil {
		return err
	}
	defer clearBytes(key)
	if len(envelope.Nonce) != aead.NonceSize() || len(envelope.Ciphertext) < aead.Overhead() {
		return ErrInvalidEnvelope
	}
	plaintext, err := aead.Open(nil, envelope.Nonce, envelope.Ciphertext, envelopeAAD(envelope))
	if err != nil {
		return ErrInvalidEnvelope
	}
	defer clearBytes(plaintext)
	if err := json.Unmarshal(plaintext, target); err != nil {
		return ErrInvalidEnvelope
	}
	return nil
}

func (sealer *Sealer) aead(jobID string) (cipher.AEAD, []byte, error) {
	mac := hmac.New(sha256.New, sealer.masterKey)
	_, _ = mac.Write([]byte("MoveMailbox credential envelope v1\x00"))
	_, _ = mac.Write([]byte(jobID))
	key := mac.Sum(nil)
	block, err := aes.NewCipher(key)
	if err != nil {
		clearBytes(key)
		return nil, nil, fmt.Errorf("create credential cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		clearBytes(key)
		return nil, nil, fmt.Errorf("create credential AEAD: %w", err)
	}
	return aead, key, nil
}

func envelopeAAD(envelope Envelope) []byte {
	return []byte(fmt.Sprintf("%d\x00%s\x00%s\x00%d\x00%d", envelope.Version, envelope.KeyID, envelope.JobID, envelope.CreatedAt.UnixMilli(), envelope.ExpiresAt.UnixMilli()))
}

func validateJobID(jobID string) error {
	if strings.TrimSpace(jobID) == "" || len(jobID) > maximumJobIDLen || strings.ContainsAny(jobID, "\x00\r\n\t") {
		return errors.New("invalid credential job ID")
	}
	return nil
}

func clearRequest(request *migrator.Request) {
	request.Source.Password = ""
	request.Destination.Password = ""
}

func clearBytes(value []byte) {
	for index := range value {
		value[index] = 0
	}
}
