package main

import (
	"bytes"
	"encoding/base64"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
)

func TestKeygenProducesMatchingWorkerSecrets(t *testing.T) {
	var output bytes.Buffer
	if code := runKeygen(&output); code != 0 {
		t.Fatalf("runKeygen code = %d", code)
	}
	values := make(map[string]string)
	for _, line := range bytes.Split(bytes.TrimSpace(output.Bytes()), []byte{'\n'}) {
		parts := bytes.SplitN(line, []byte{'='}, 2)
		if len(parts) != 2 {
			t.Fatalf("invalid keygen line %q", line)
		}
		values[string(parts[0])] = string(parts[1])
	}
	publicKey, err := credentials.ParseRecipientPublicKey(values["MOVEMAILBOX_WORKER_PUBLIC_KEY"])
	if err != nil {
		t.Fatal(err)
	}
	privateKey, err := credentials.ParseRecipientPrivateKey(values["MOVEMAILBOX_WORKER_PRIVATE_KEY"])
	if err != nil {
		t.Fatal(err)
	}
	opener, err := credentials.NewRecipientOpener(privateKey)
	if err != nil {
		t.Fatal(err)
	}
	defer opener.Destroy()
	if !bytes.Equal(publicKey, opener.PublicKey()) {
		t.Fatal("keygen public key does not match private key")
	}
	token, err := base64.StdEncoding.DecodeString(values["MOVEMAILBOX_WORKER_TOKEN"])
	if err != nil || len(token) != 32 {
		t.Fatalf("worker token length=%d error=%v", len(token), err)
	}
}

func TestDefaultDatabasePathUsesPrivateApplicationDirectory(t *testing.T) {
	configDirectory, err := os.UserConfigDir()
	if err != nil {
		t.Skipf("user config directory unavailable: %v", err)
	}
	want := filepath.Join(configDirectory, "MoveMailbox", "movemailbox.db")
	if path := defaultDatabasePath(); path != want {
		t.Fatalf("defaultDatabasePath() = %q, want %q", path, want)
	}
}

func TestBrowserAddress(t *testing.T) {
	tests := map[string]string{
		"127.0.0.1:8080": "127.0.0.1:8080",
		"0.0.0.0:8080":   "127.0.0.1:8080",
		":8080":          "127.0.0.1:8080",
	}
	for input, expected := range tests {
		if actual := browserAddress(input); actual != expected {
			t.Fatalf("browserAddress(%q) = %q, want %q", input, actual, expected)
		}
	}
}

func TestEnvDuration(t *testing.T) {
	t.Setenv("MOVEMAILBOX_TEST_TTL", "45m")
	if got := envDuration("MOVEMAILBOX_TEST_TTL", time.Hour); got != 45*time.Minute {
		t.Fatalf("envDuration() = %v, want 45m", got)
	}
	t.Setenv("MOVEMAILBOX_TEST_TTL", "invalid")
	if got := envDuration("MOVEMAILBOX_TEST_TTL", time.Hour); got != time.Hour {
		t.Fatalf("invalid envDuration() = %v, want fallback", got)
	}
}

func TestAcquireListenerFallsBackWhenPortIsBusy(t *testing.T) {
	occupied, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer occupied.Close()

	listener, publicURL, reused, err := acquireListener(occupied.Addr().String(), true)
	if err != nil {
		t.Fatalf("expected fallback listener, got %v", err)
	}
	defer listener.Close()
	if reused {
		t.Fatal("unrelated listener must not be treated as MoveMailbox")
	}
	if listener.Addr().String() == occupied.Addr().String() {
		t.Fatal("fallback reused the occupied address")
	}
	if publicURL == "" {
		t.Fatal("expected public URL")
	}
}

func TestIsLoopbackAddress(t *testing.T) {
	for _, address := range []string{"127.0.0.1:8080", "localhost:8080", "[::1]:8080"} {
		if !isLoopbackAddress(address) {
			t.Fatalf("expected %s to be loopback", address)
		}
	}
	if isLoopbackAddress("0.0.0.0:8080") {
		t.Fatal("0.0.0.0 must not be treated as loopback")
	}
}

func TestAllowedHostsIncludesLoopbackAndConfiguredHost(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()

	allowed := allowedHosts(listener, "app.movemailbox.com, migration.internal:8443")
	set := make(map[string]bool, len(allowed))
	for _, host := range allowed {
		set[host] = true
	}
	_, port, _ := net.SplitHostPort(listener.Addr().String())
	for _, expected := range []string{
		net.JoinHostPort("127.0.0.1", port),
		net.JoinHostPort("localhost", port),
		net.JoinHostPort("::1", port),
		"app.movemailbox.com",
		"migration.internal:8443",
	} {
		if !set[expected] {
			t.Fatalf("allowed hosts %v do not include %q", allowed, expected)
		}
	}
}
