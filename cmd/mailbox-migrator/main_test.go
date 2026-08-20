package main

import (
	"net"
	"testing"
)

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
		t.Fatal("unrelated listener must not be treated as Mailbox Migrator")
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
