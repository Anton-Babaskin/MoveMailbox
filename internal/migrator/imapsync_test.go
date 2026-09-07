package migrator

import (
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"testing"
)

func testRequest() Request {
	return Request{
		Source:      Endpoint{Host: "source.example", Port: 993, Security: SecurityTLS, Username: "source-user", Password: "source-secret"},
		Destination: Endpoint{Host: "destination.example", Port: 143, Security: SecurityStartTLS, Username: "destination-user", Password: "destination-secret"},
		Options:     Options{SyncFlags: true, PreserveDates: true},
	}
}

func TestBuildArgsDoesNotExposePasswordsOrPasswordFiles(t *testing.T) {
	request := testRequest()
	args := buildArgs(request)
	joined := strings.Join(args, " ")
	if strings.Contains(joined, request.Source.Password) || strings.Contains(joined, request.Destination.Password) {
		t.Fatal("password leaked into command-line arguments")
	}
	for _, forbidden := range []string{"--password1", "--password2", "--passfile1", "--passfile2", "source.pass", "destination.pass"} {
		if slices.Contains(args, forbidden) || strings.Contains(joined, forbidden) {
			t.Fatalf("credential argument %q must not be present in %v", forbidden, args)
		}
	}
	for _, expected := range []string{"--host1", "source.example", "--host2", "destination.example", "--ssl1", "--tls2"} {
		if !slices.Contains(args, expected) {
			t.Fatalf("expected argument %q in %v", expected, args)
		}
	}
}

func TestBuildArgsIncludesFolderAndDestructiveOptions(t *testing.T) {
	request := testRequest()
	request.Options.Folders = []string{"INBOX", "Projects/Active"}
	request.Options.DestinationSubfolder = "Imported mail"
	request.Options.StrictMirror = true
	request.Options.StrictMirrorConfirmed = true

	args := buildArgs(request)
	wantPairs := [][2]string{
		{"--folder", "INBOX"},
		{"--folder", "Projects/Active"},
		{"--subfolder2", "Imported mail"},
	}
	for _, pair := range wantPairs {
		found := false
		for index := 0; index+1 < len(args); index++ {
			if args[index] == pair[0] && args[index+1] == pair[1] {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("expected argument pair %q %q in %v", pair[0], pair[1], args)
		}
	}
	if !slices.Contains(args, "--delete2") {
		t.Fatalf("expected --delete2 in %v", args)
	}
}

func TestBuildArgsIncludesAdvancedImapsyncModes(t *testing.T) {
	for _, tc := range []struct {
		options Options
		flag    string
	}{
		{Options{DryRun: true}, "--dry"},
		{Options{JustVerbose: true}, "--dry"},
		{Options{DryRun: true, JustVerbose: true}, "--dry"},
		{Options{JustLogin: true}, "--justlogin"},
		{Options{JustFolderSizes: true}, "--justfoldersizes"},
		{Options{JustFolders: true}, "--justfolders"},
	} {
		request := testRequest()
		request.Options = tc.options
		if err := request.Validate(); err != nil {
			t.Fatal(err)
		}
		args := buildArgs(request)
		count := 0
		for _, arg := range args {
			if arg == tc.flag {
				count++
			}
		}
		if count != 1 || slices.Contains(args, "--justverbose") || slices.Contains(args, "--delete2") {
			t.Fatalf("incorrect preflight arguments: %v", args)
		}
	}
}

func TestSecurityArgsRequireCertificateAndPeerVerification(t *testing.T) {
	for _, side := range []string{"1", "2"} {
		for _, host := range []string{"imap.example.com", "203.0.113.10", "2001:db8::10"} {
			for _, mode := range []SecurityMode{SecurityTLS, SecurityStartTLS} {
				args := securityArgs(side, Endpoint{Host: host, Security: mode})
				for _, value := range []string{"SSL_verify_mode=1", "SSL_verifycn_scheme=imap", "SSL_verifycn_name=" + host} {
					index := slices.Index(args, value)
					if index < 1 || args[index-1] != "--sslargs"+side {
						t.Fatalf("missing enforced TLS parameter %s: %v", value, args)
					}
				}
			}
		}
		args := securityArgs(side, Endpoint{Security: SecurityPlain})
		if slices.Contains(args, "--sslargs"+side) {
			t.Fatalf("plain mode must not claim TLS verification: %v", args)
		}
	}
}

func TestImapsyncEnvironmentReplacesInheritedPasswords(t *testing.T) {
	environment := imapsyncEnvironment([]string{
		"PATH=/usr/bin",
		"IMAPSYNC_PASSWORD1=old-source",
		"imapsync_password2=old-destination",
	}, "new-source", "new-destination")

	if got := countEnvironmentName(environment, "IMAPSYNC_PASSWORD1"); got != 1 {
		t.Fatalf("IMAPSYNC_PASSWORD1 occurs %d times, want 1: %v", got, environment)
	}
	if got := countEnvironmentName(environment, "IMAPSYNC_PASSWORD2"); got != 1 {
		t.Fatalf("IMAPSYNC_PASSWORD2 occurs %d times, want 1: %v", got, environment)
	}
	if !slices.Contains(environment, "IMAPSYNC_PASSWORD1=new-source") || !slices.Contains(environment, "IMAPSYNC_PASSWORD2=new-destination") {
		t.Fatalf("new child-only credentials are missing: %v", environment)
	}
	for _, item := range environment {
		if strings.Contains(item, "old-source") || strings.Contains(item, "old-destination") {
			t.Fatalf("inherited credential was not removed: %q", item)
		}
	}
}

func countEnvironmentName(environment []string, wanted string) int {
	count := 0
	for _, item := range environment {
		name, _, found := strings.Cut(item, "=")
		if found && strings.EqualFold(name, wanted) {
			count++
		}
	}
	return count
}

func TestResolveImapsyncBinaryFromPath(t *testing.T) {
	directory := t.TempDir()
	filename := "imapsync"
	if runtime.GOOS == "windows" {
		filename += ".exe"
		t.Setenv("PATHEXT", ".EXE")
	}
	binary := filepath.Join(directory, filename)
	if err := os.WriteFile(binary, []byte("test binary"), 0o755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", directory)

	resolved, err := (ImapsyncEngine{Binary: "imapsync"}).resolveBinary()
	if err != nil {
		t.Fatalf("expected imapsync to resolve from PATH: %v", err)
	}
	if filepath.Clean(resolved) != filepath.Clean(binary) {
		t.Fatalf("resolved %q, want %q", resolved, binary)
	}
}

func TestUpdateResult(t *testing.T) {
	result := Result{}
	updateResult("Messages transferred : 42", &result)
	updateResult("Messages skipped     : 7", &result)
	updateResult("Total bytes transferred : 1048576 (1.000 MiB)", &result)
	if result.Transferred != 42 || result.Skipped != 7 || result.Bytes != 1048576 {
		t.Fatalf("unexpected result: %+v", result)
	}
}

func TestUpdateResultRequiresStatisticsLine(t *testing.T) {
	result := Result{Transferred: 3, Skipped: 2, Bytes: 1}
	updateResult("debug Messages transferred: 999", &result)
	updateResult("Total bytes transferred soon: 999", &result)
	if result != (Result{Transferred: 3, Skipped: 2, Bytes: 1}) {
		t.Fatalf("unrelated log line changed result: %+v", result)
	}
}
