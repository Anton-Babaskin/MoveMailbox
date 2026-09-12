package worker

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func TestPreExecutionCancellationPolicy(t *testing.T) {
	for _, test := range []struct {
		name                        string
		shutdown, mirror, cancelled bool
		want                        string
	}{
		{"service shutdown", true, false, false, remoteStatusQueued},
		{"strict mirror shutdown", true, true, false, remoteStatusFailed},
		{"attempt deadline", false, false, false, remoteStatusFailed},
		{"user cancellation during shutdown", true, false, true, remoteStatusCancelled},
	} {
		t.Run(test.name, func(t *testing.T) {
			public, private, token := remoteTestSecrets(t)
			service, err := NewService(ServiceConfig{DatabasePath: filepath.Join(t.TempDir(), "worker.db"), PrivateKey: private, Token: token, Engine: &remoteTestEngine{}})
			if err != nil {
				t.Fatal(err)
			}
			// No coordinator: deterministically hold the claimed, leased state
			// immediately before the pre-execution cancellation branch.
			service.ctx, service.cancel = context.WithCancel(context.Background())
			defer shutdownRemoteTestService(t, service)
			runner := newRemoteTestRunner(t, "http://127.0.0.1:1", public, token)
			defer runner.Close()
			request := workerTestRequest()
			request.Options.StrictMirror = test.mirror
			request.Options.StrictMirrorConfirmed = test.mirror
			envelope, err := runner.sealer.Seal("before-execution", request)
			if err != nil {
				t.Fatal(err)
			}
			ctx := context.Background()
			if _, err := service.jobs.admit(ctx, envelope, time.Now(), 10); err != nil {
				t.Fatal(err)
			}
			if err := service.jobs.activate(ctx, envelope.JobID, time.Now()); err != nil {
				t.Fatal(err)
			}
			if _, ok, err := service.jobs.claimNext(ctx, time.Now(), 3); err != nil || !ok {
				t.Fatalf("claim: %v %v", ok, err)
			}
			if _, err := service.envelopes.Lease(ctx, envelope.JobID, "old-worker", time.Now(), time.Minute); err != nil {
				t.Fatal(err)
			}
			if test.mirror {
				if err := service.jobs.disableRetry(ctx, envelope.JobID); err != nil {
					t.Fatal(err)
				}
			}
			if test.cancelled {
				if err := service.jobs.complete(ctx, envelope.JobID, remoteStatusCancelled, migrator.Result{}, "cancelled", time.Now()); err != nil {
					t.Fatal(err)
				}
			}
			if test.shutdown {
				service.cancel()
			}
			service.cancelBeforeExecution(envelope.JobID, "old-worker", test.mirror)
			snapshot, ok, err := service.jobs.get(ctx, envelope.JobID, 0)
			if err != nil || !ok || snapshot.Status != test.want {
				t.Fatalf("state=%+v exists=%v error=%v", snapshot, ok, err)
			}
			if test.want == remoteStatusQueued {
				if snapshot.Attempts != 0 {
					t.Fatal("unstarted shutdown attempt consumed retry budget")
				}
				if _, err := service.envelopes.Lease(ctx, envelope.JobID, "new-worker", time.Now(), time.Minute); err != nil {
					t.Fatalf("recovery lease unavailable: %v", err)
				}
			} else {
				var count int
				if err := service.jobs.db.QueryRowContext(ctx, "SELECT count(*) FROM credential_envelopes").Scan(&count); err != nil || count != 0 {
					t.Fatalf("terminal envelope count=%d error=%v", count, err)
				}
			}
		})
	}
}
