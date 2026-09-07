package credentials

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"testing"
	"time"
)

func TestRecipientEnvelopeRoundTripAndPublicKeyCannotDecrypt(t *testing.T) {
	publicKey, privateKey, err := GenerateRecipientKeyPair()
	if err != nil {
		t.Fatal(err)
	}
	sealer, err := NewRecipientSealer(publicKey, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	opener, err := NewRecipientOpener(privateKey)
	if err != nil {
		t.Fatal(err)
	}
	defer opener.Destroy()
	request := credentialTestRequest()
	envelope, err := sealer.Seal("recipient-job", request)
	if err != nil {
		t.Fatal(err)
	}
	serialized, err := json.Marshal(envelope)
	if err != nil {
		t.Fatal(err)
	}
	for _, secret := range []string{request.Source.Password, request.Destination.Password} {
		if bytes.Contains(serialized, []byte(secret)) {
			t.Fatalf("recipient envelope contains plaintext secret %q", secret)
		}
	}
	opened, err := opener.Open("recipient-job", envelope)
	if err != nil {
		t.Fatal(err)
	}
	if opened.Source.Password != request.Source.Password || opened.Destination.Password != request.Destination.Password {
		t.Fatal("recipient envelope round trip changed credentials")
	}
	if wrongOpener, err := NewRecipientOpener(publicKey); err == nil {
		defer wrongOpener.Destroy()
		if _, openErr := wrongOpener.Open("recipient-job", envelope); openErr == nil {
			t.Fatal("public key bytes unexpectedly decrypted recipient envelope")
		}
	}
}

func TestRecipientEnvelopeRejectsWrongKeyTamperingAndExpiry(t *testing.T) {
	publicKey, privateKey, err := GenerateRecipientKeyPair()
	if err != nil {
		t.Fatal(err)
	}
	sealer, _ := NewRecipientSealer(publicKey, time.Hour)
	opener, _ := NewRecipientOpener(privateKey)
	defer opener.Destroy()
	envelope, err := sealer.Seal("recipient-job", credentialTestRequest())
	if err != nil {
		t.Fatal(err)
	}
	_, wrongPrivate, _ := GenerateRecipientKeyPair()
	wrongOpener, _ := NewRecipientOpener(wrongPrivate)
	defer wrongOpener.Destroy()
	if _, err := wrongOpener.Open("recipient-job", envelope); err == nil {
		t.Fatal("wrong recipient key was accepted")
	}
	tampered := envelope.Clone()
	tampered.Ciphertext[0] ^= 0xff
	if _, err := opener.Open("recipient-job", tampered); err == nil {
		t.Fatal("tampered recipient envelope was accepted")
	}
	for _, mutate := range []func(*Envelope){
		func(value *Envelope) { value.ExpiresAt = value.ExpiresAt.Add(time.Nanosecond) },
		func(value *Envelope) { value.CreatedAt = value.CreatedAt.Add(time.Nanosecond) },
		func(value *Envelope) { value.EphemeralPublicKey[0] ^= 0xff },
		func(value *Envelope) { value.Nonce[0] ^= 0xff },
		func(value *Envelope) { value.JobID = "another-job" },
	} {
		altered := envelope.Clone()
		mutate(&altered)
		if _, err := opener.Open(altered.JobID, altered); err == nil {
			t.Fatal("authenticated metadata tamper accepted")
		}
	}
	opener.now = func() time.Time { return envelope.ExpiresAt }
	if _, err := opener.Open("recipient-job", envelope); err != ErrExpired {
		t.Fatalf("expired envelope error = %v, want ErrExpired", err)
	}
}

func TestRecipientKeyParsers(t *testing.T) {
	publicKey, privateKey, err := GenerateRecipientKeyPair()
	if err != nil {
		t.Fatal(err)
	}
	encodedPublic := base64.StdEncoding.EncodeToString(publicKey)
	encodedPrivate := base64.StdEncoding.EncodeToString(privateKey)
	if parsed, err := ParseRecipientPublicKey(encodedPublic); err != nil || !bytes.Equal(parsed, publicKey) {
		t.Fatalf("public parser returned %x, %v", parsed, err)
	}
	if parsed, err := ParseRecipientPrivateKey(encodedPrivate); err != nil || !bytes.Equal(parsed, privateKey) {
		t.Fatalf("private parser returned %x, %v", parsed, err)
	}
	if _, err := ParseRecipientPublicKey("short"); err == nil {
		t.Fatal("invalid recipient public key was accepted")
	}
}
