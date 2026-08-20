package migrator

import (
	"slices"
	"strings"
	"testing"
)

func TestBuildArgsDoesNotExposePasswords(t *testing.T) {
	request := Request{
		Source:      Endpoint{Host: "source.example", Port: 993, Security: SecurityTLS, Username: "source-user", Password: "source-secret"},
		Destination: Endpoint{Host: "destination.example", Port: 143, Security: SecurityStartTLS, Username: "destination-user", Password: "destination-secret"},
		Options:     Options{SyncFlags: true, PreserveDates: true},
	}
	args := buildArgs(request, "/secure/source.pass", "/secure/destination.pass", false)
	joined := strings.Join(args, " ")
	if strings.Contains(joined, request.Source.Password) || strings.Contains(joined, request.Destination.Password) {
		t.Fatal("password leaked into command-line arguments")
	}
	for _, expected := range []string{"--passfile1", "/secure/source.pass", "--passfile2", "/secure/destination.pass", "--ssl1", "--tls2"} {
		if !slices.Contains(args, expected) {
			t.Fatalf("expected argument %q in %v", expected, args)
		}
	}
}

func TestUpdateResult(t *testing.T) {
	result := Result{}
	updateResult("Messages transferred : 42", &result)
	updateResult("Messages skipped     : 7", &result)
	updateResult("Total bytes transferred : 1048576", &result)
	if result.Transferred != 42 || result.Skipped != 7 || result.Bytes != 1048576 {
		t.Fatalf("unexpected result: %+v", result)
	}
}
