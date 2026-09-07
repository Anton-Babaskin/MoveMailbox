package credentials

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdh"
	"crypto/hkdf"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

const RecipientEnvelopeVersion = 2

// RecipientSealer contains only the worker's public key. It can encrypt jobs
// for the worker but cannot decrypt database contents or previously accepted
// envelopes.
type RecipientSealer struct {
	publicKey *ecdh.PublicKey
	keyID     string
	ttl       time.Duration
	now       func() time.Time
}

// RecipientOpener owns the worker-only private key.
type RecipientOpener struct {
	privateKey *ecdh.PrivateKey
	publicKey  []byte
	keyID      string
	now        func() time.Time
}

func GenerateRecipientKeyPair() (publicKey, privateKey []byte, err error) {
	private, err := ecdh.X25519().GenerateKey(rand.Reader)
	if err != nil {
		return nil, nil, fmt.Errorf("generate worker recipient key: %w", err)
	}
	return append([]byte(nil), private.PublicKey().Bytes()...), append([]byte(nil), private.Bytes()...), nil
}

func ParseRecipientPublicKey(value string) ([]byte, error) {
	return parseRecipientKey("MOVEMAILBOX_WORKER_PUBLIC_KEY", value)
}

func ParseRecipientPrivateKey(value string) ([]byte, error) {
	return parseRecipientKey("MOVEMAILBOX_WORKER_PRIVATE_KEY", value)
}

func parseRecipientKey(name, value string) ([]byte, error) {
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(value)
	}
	if err != nil || len(decoded) != 32 {
		clearBytes(decoded)
		return nil, fmt.Errorf("%s must be base64 for exactly 32 random bytes", name)
	}
	return decoded, nil
}

func NewRecipientSealer(publicKey []byte, ttl time.Duration) (*RecipientSealer, error) {
	if ttl < minimumTTL || ttl > maximumTTL {
		return nil, fmt.Errorf("credential TTL must be between %s and %s", minimumTTL, maximumTTL)
	}
	public, err := ecdh.X25519().NewPublicKey(publicKey)
	if err != nil {
		return nil, errors.New("invalid worker recipient public key")
	}
	return &RecipientSealer{
		publicKey: public,
		keyID:     recipientKeyID(public.Bytes()),
		ttl:       ttl,
		now:       time.Now,
	}, nil
}

func NewRecipientOpener(privateKey []byte) (*RecipientOpener, error) {
	private, err := ecdh.X25519().NewPrivateKey(privateKey)
	if err != nil {
		return nil, errors.New("invalid worker recipient private key")
	}
	public := append([]byte(nil), private.PublicKey().Bytes()...)
	return &RecipientOpener{
		privateKey: private,
		publicKey:  public,
		keyID:      recipientKeyID(public),
		now:        time.Now,
	}, nil
}

func (sealer *RecipientSealer) Seal(jobID string, request migrator.Request) (Envelope, error) {
	if err := request.Validate(); err != nil {
		return Envelope{}, err
	}
	return sealer.SealJSON(jobID, request)
}

func (sealer *RecipientSealer) SealJSON(jobID string, value any) (Envelope, error) {
	if err := validateJobID(jobID); err != nil {
		return Envelope{}, err
	}
	ephPrivate, err := ecdh.X25519().GenerateKey(rand.Reader)
	if err != nil {
		return Envelope{}, fmt.Errorf("generate ephemeral recipient key: %w", err)
	}
	shared, err := ephPrivate.ECDH(sealer.publicKey)
	if err != nil {
		return Envelope{}, errors.New("derive recipient envelope secret")
	}
	defer clearBytes(shared)
	now := sealer.now().UTC()
	envelope := Envelope{
		Version:            RecipientEnvelopeVersion,
		KeyID:              sealer.keyID,
		JobID:              jobID,
		CreatedAt:          now,
		ExpiresAt:          now.Add(sealer.ttl),
		EphemeralPublicKey: append([]byte(nil), ephPrivate.PublicKey().Bytes()...),
	}
	plaintext, err := json.Marshal(value)
	if err != nil {
		return Envelope{}, fmt.Errorf("encode recipient credential envelope: %w", err)
	}
	defer clearBytes(plaintext)
	aead, key, err := recipientAEAD(shared, envelope)
	if err != nil {
		return Envelope{}, err
	}
	defer clearBytes(key)
	envelope.Nonce = make([]byte, aead.NonceSize())
	if _, err := rand.Read(envelope.Nonce); err != nil {
		return Envelope{}, fmt.Errorf("create recipient credential nonce: %w", err)
	}
	envelope.Ciphertext = aead.Seal(nil, envelope.Nonce, plaintext, recipientAAD(envelope))
	return envelope, nil
}

func (opener *RecipientOpener) Open(jobID string, envelope Envelope) (migrator.Request, error) {
	var request migrator.Request
	if err := opener.OpenJSON(jobID, envelope, &request); err != nil {
		clearRequest(&request)
		return migrator.Request{}, err
	}
	if err := request.Validate(); err != nil {
		clearRequest(&request)
		return migrator.Request{}, ErrInvalidEnvelope
	}
	return request, nil
}

func (opener *RecipientOpener) OpenJSON(jobID string, envelope Envelope, target any) error {
	if err := opener.ValidateEnvelope(jobID, envelope); err != nil {
		return err
	}
	ephPublic, err := ecdh.X25519().NewPublicKey(envelope.EphemeralPublicKey)
	if err != nil {
		return ErrInvalidEnvelope
	}
	shared, err := opener.privateKey.ECDH(ephPublic)
	if err != nil {
		return ErrInvalidEnvelope
	}
	defer clearBytes(shared)
	aead, key, err := recipientAEAD(shared, envelope)
	if err != nil {
		return err
	}
	defer clearBytes(key)
	plaintext, err := aead.Open(nil, envelope.Nonce, envelope.Ciphertext, recipientAAD(envelope))
	if err != nil {
		return ErrInvalidEnvelope
	}
	defer clearBytes(plaintext)
	if err := json.Unmarshal(plaintext, target); err != nil {
		return ErrInvalidEnvelope
	}
	return nil
}

// ValidateEnvelope checks only public metadata and size. Authentication and
// decryption happen later, after the worker has obtained an exclusive lease.
func (opener *RecipientOpener) ValidateEnvelope(jobID string, envelope Envelope) error {
	if opener == nil || opener.privateKey == nil {
		return ErrInvalidEnvelope
	}
	if err := validateJobID(jobID); err != nil {
		return err
	}
	if envelope.Version != RecipientEnvelopeVersion || envelope.JobID != jobID || envelope.KeyID != opener.keyID || envelope.CreatedAt.IsZero() || envelope.ExpiresAt.IsZero() || !envelope.ExpiresAt.After(envelope.CreatedAt) {
		return ErrInvalidEnvelope
	}
	lifetime := envelope.ExpiresAt.Sub(envelope.CreatedAt)
	if lifetime < minimumTTL || lifetime > maximumTTL || envelope.CreatedAt.After(opener.now().Add(time.Minute)) {
		return ErrInvalidEnvelope
	}
	if !opener.now().Before(envelope.ExpiresAt) {
		return ErrExpired
	}
	if len(envelope.EphemeralPublicKey) != 32 || len(envelope.Nonce) != 12 || len(envelope.Ciphertext) < 16 || len(envelope.Ciphertext) > 1<<20 {
		return ErrInvalidEnvelope
	}
	return nil
}

func (opener *RecipientOpener) PublicKey() []byte {
	return append([]byte(nil), opener.publicKey...)
}

func (opener *RecipientOpener) Destroy() {
	if opener == nil {
		return
	}
	clearBytes(opener.publicKey)
	opener.publicKey = nil
	opener.privateKey = nil
}

func recipientAEAD(shared []byte, envelope Envelope) (cipher.AEAD, []byte, error) {
	info := "MoveMailbox recipient envelope v2\x00" + envelope.JobID + "\x00" + envelope.KeyID
	key, err := hkdf.Key(sha256.New, shared, nil, info, 32)
	if err != nil {
		return nil, nil, fmt.Errorf("derive recipient envelope key: %w", err)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		clearBytes(key)
		return nil, nil, fmt.Errorf("create recipient credential cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		clearBytes(key)
		return nil, nil, fmt.Errorf("create recipient credential AEAD: %w", err)
	}
	return aead, key, nil
}

func recipientKeyID(publicKey []byte) string {
	digest := sha256.Sum256(publicKey)
	return hex.EncodeToString(digest[:8])
}

func recipientAAD(envelope Envelope) []byte {
	return []byte(fmt.Sprintf("%d\x00%s\x00%s\x00%s\x00%s\x00%s", envelope.Version, envelope.KeyID, envelope.JobID, envelope.CreatedAt.UTC().Format(time.RFC3339Nano), envelope.ExpiresAt.UTC().Format(time.RFC3339Nano), base64.RawStdEncoding.EncodeToString(envelope.EphemeralPublicKey)))
}
