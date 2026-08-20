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
