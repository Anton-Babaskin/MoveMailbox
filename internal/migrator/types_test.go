package migrator

import (
	"context"
	"strings"
	"testing"
)

func TestPreflightCombinations(t *testing.T) {
	for mask := 0; mask < 32; mask++ {
		r := testRequest()
		r.Options = Options{JustLogin: mask&1 != 0, JustFolderSizes: mask&2 != 0, JustFolders: mask&4 != 0, DryRun: mask&8 != 0, StrictMirror: mask&16 != 0, StrictMirrorConfirmed: true}
		count := 0
		for bit := 0; bit < 3; bit++ {
			if mask&(1<<bit) != 0 {
				count++
			}
		}
		valid := count <= 1 && !(count > 0 && r.Options.StrictMirror)
		if (r.Validate() == nil) != valid {
			t.Fatalf("mask %d: unexpected validation result", mask)
		}
	}
}

func TestDemoPreflightDoesNotReportCopiedMail(t *testing.T) {
	for _, options := range []Options{{DryRun: true}, {JustVerbose: true}, {JustLogin: true}, {JustFolderSizes: true}, {JustFolders: true}} {
		r := testRequest()
		r.Options = options
		events := 0
		result, err := (DemoEngine{}).Migrate(context.Background(), r, func(e Event) {
			events++
			if e.Transferred != 0 || e.Bytes != 0 || e.Phase == "copying" {
				t.Fatalf("preflight claims a copy: %+v", e)
			}
		})
		if err != nil || result != (Result{}) || events == 0 {
			t.Fatalf("result=%+v err=%v events=%d", result, err, events)
		}
	}
}

func TestEndpointValidation(t *testing.T) {
	tests := []struct {
		name     string
		endpoint Endpoint
		valid    bool
	}{
		{"valid TLS", Endpoint{Host: "imap.example.com", Port: 993, Security: SecurityTLS, Username: "user", Password: "secret"}, true},
		{"missing host", Endpoint{Port: 993, Security: SecurityTLS, Username: "user", Password: "secret"}, false},
		{"invalid port", Endpoint{Host: "imap.example.com", Port: 70000, Security: SecurityTLS, Username: "user", Password: "secret"}, false},
		{"missing password", Endpoint{Host: "imap.example.com", Port: 993, Security: SecurityTLS, Username: "user"}, false},
		{"host with surrounding whitespace", Endpoint{Host: " imap.example.com ", Port: 993, Security: SecurityTLS, Username: "user", Password: "secret"}, false},
		{"host with control character", Endpoint{Host: "imap.example.com\nother", Port: 993, Security: SecurityTLS, Username: "user", Password: "secret"}, false},
		{"oversized username", Endpoint{Host: "imap.example.com", Port: 993, Security: SecurityTLS, Username: strings.Repeat("u", maxUsernameLength+1), Password: "secret"}, false},
		{"password with NUL", Endpoint{Host: "imap.example.com", Port: 993, Security: SecurityTLS, Username: "user", Password: "secret\x00value"}, false},
		{"unknown security", Endpoint{Host: "imap.example.com", Port: 993, Security: "auto", Username: "user", Password: "secret"}, false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.endpoint.Validate()
			if test.valid && err != nil {
				t.Fatalf("expected valid endpoint, got %v", err)
			}
			if !test.valid && err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestRequestRejectsSameMailbox(t *testing.T) {
	source := Endpoint{Host: "IMAP.EXAMPLE.COM", Port: 993, Security: SecurityTLS, Username: "User@example.com", Password: "source-secret"}
	destination := Endpoint{Host: "imap.example.com", Port: 993, Security: SecurityTLS, Username: "user@example.com", Password: "destination-secret"}

	if err := (Request{Source: source, Destination: destination}).Validate(); err == nil {
		t.Fatal("expected the same source and destination mailbox to be rejected")
	}

	destination.Username = "other@example.com"
	if err := (Request{Source: source, Destination: destination}).Validate(); err != nil {
		t.Fatalf("expected different mailboxes to be accepted, got %v", err)
	}
}

func TestRequestRequiresStrictMirrorConfirmation(t *testing.T) {
	request := testRequest()
	request.Options.StrictMirror = true
	request.Options.StrictMirrorConfirmed = false
	if err := request.Validate(); err == nil {
		t.Fatal("expected strict mirror without confirmation to be rejected")
	}

	request.Options.StrictMirrorConfirmed = true
	if err := request.Validate(); err != nil {
		t.Fatalf("expected confirmed strict mirror to be accepted, got %v", err)
	}
}

func TestRequestRejectsInvalidFolderSelection(t *testing.T) {
	request := testRequest()
	request.Options.Folders = []string{"INBOX", "INBOX"}
	if err := request.Validate(); err == nil {
		t.Fatal("expected duplicate folder selection to be rejected")
	}

	request.Options.Folders = []string{"INBOX", "Projects"}
	request.Options.DestinationSubfolder = "Imported mail"
	if err := request.Validate(); err != nil {
		t.Fatalf("expected valid folder options to be accepted, got %v", err)
	}

	request.Options.Folders = []string{strings.Repeat("f", maxFolderLength+1)}
	if err := request.Validate(); err == nil {
		t.Fatal("expected an oversized folder name to be rejected")
	}
}
