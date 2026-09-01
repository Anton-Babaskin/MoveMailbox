package migrator

import "testing"

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
	source := Endpoint{Host: " IMAP.EXAMPLE.COM ", Port: 993, Security: SecurityTLS, Username: "User@example.com", Password: "source-secret"}
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
}
