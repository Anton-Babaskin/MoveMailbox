package migrator

import (
	"context"
	"encoding/pem"
	"os"
	"os/exec"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"
)

// Runs against the pinned production imapsync in the Docker TLS-test stage.
// Every server and credential is disposable; no external mailbox is contacted.
func TestRealImapsyncTLSVerification(t *testing.T) {
	if os.Getenv("MOVEMAILBOX_TEST_REAL_IMAPSYNC") != "1" {
		t.Skip("requires the pinned imapsync runtime; run Docker target tls-test")
	}
	binary, err := exec.LookPath("imapsync")
	if err != nil {
		t.Fatal(err)
	}
	for _, mode := range []SecurityMode{SecurityTLS, SecurityStartTLS} {
		for _, trusted := range []bool{false, true} {
			name := string(mode) + "/untrusted"
			if trusted {
				name = string(mode) + "/trusted"
			}
			t.Run(name, func(t *testing.T) {
				cert, _ := testCertificate(t)
				var logins atomic.Int32
				options := imapServerOptions{security: mode, certificate: cert, acceptLogin: true, ignoreServeError: !trusted, onLogin: func() { logins.Add(1) }}
				source := startIMAPTestServer(t, options)
				destination := startIMAPTestServer(t, options)
				r := testRequest()
				r.Source.Host, r.Source.Port = splitTestAddress(t, source)
				r.Destination.Host, r.Destination.Port = splitTestAddress(t, destination)
				r.Source.Security, r.Destination.Security = mode, mode
				r.Options.JustLogin = true
				args := buildArgs(r)
				if trusted {
					caFile := filepath.Join(t.TempDir(), "test-ca.pem")
					if err := os.WriteFile(caFile, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Certificate[0]}), 0600); err != nil {
						t.Fatal(err)
					}
					args = append(args, "--sslargs1", "SSL_ca_file="+caFile, "--sslargs2", "SSL_ca_file="+caFile)
				}
				ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
				defer cancel()
				cmd := exec.CommandContext(ctx, binary, args...)
				cmd.Dir = t.TempDir()
				cmd.Env = imapsyncEnvironment(os.Environ(), r.Source.Password, r.Destination.Password)
				_, err := runImapsyncProcess(ctx, cmd, r, func(e Event) { t.Log(e.Message) })
				if ctx.Err() != nil {
					t.Fatalf("imapsync timed out instead of finishing: %v", ctx.Err())
				}
				if trusted {
					if err != nil || logins.Load() != 2 {
						t.Fatalf("trusted control failed: err=%v logins=%d", err, logins.Load())
					}
				} else if err == nil || logins.Load() != 0 {
					t.Fatalf("untrusted certificate must fail before LOGIN: err=%v logins=%d", err, logins.Load())
				}
			})
		}
	}
}
