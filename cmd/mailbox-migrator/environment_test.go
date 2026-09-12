package main

import (
	"context"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"
)

func TestValidateEnvironment(t *testing.T) {
	for _, test := range []struct {
		name, value   string
		worker, valid bool
	}{
		{"MOVEMAILBOX_PUBLIC_MODE", "tru", false, false},
		{"MOVEMAILBOX_PUBLIC_MODE", "false", false, true},
		{"MOVEMAILBOX_PUBLIC_MODE", "true", false, true},
		{"MOVEMAILBOX_PUBLIC_MODE", " true ", false, true},
		{"MOVEMAILBOX_PUBLIC_MODE", "", false, true},
		{"MOVEMAILBOX_PUBLIC_MODE", " secret-value ", false, false},
		{"MOVEMAILBOX_WORKER_ALLOW_HTTP", "yes", false, false},
		{"MOVEMAILBOX_EMBEDDED_WORKER", "yes", false, false},
		{"MM_DEMO", "no", false, false},
		{"MM_MAX_CONCURRENT", "NaN", false, false},
		{"MOVEMAILBOX_MAX_ACTIVE_PER_SESSION", "0", false, false},
		{"MOVEMAILBOX_SESSION_REQUESTS_PER_MINUTE", "-1", false, false},
		{"MOVEMAILBOX_MAX_JOBS", "999999999999999999999999", false, false},
		{"MOVEMAILBOX_MAX_JOBS", "256", false, true},
		{"MOVEMAILBOX_CREDENTIAL_TTL", "24hours", false, false},
		{"MOVEMAILBOX_CREDENTIAL_TTL", "24h", false, true},
		{"MOVEMAILBOX_SESSION_TTL", "0s", false, false},
		{"MOVEMAILBOX_HISTORY_TTL", "-1s", false, false},
		{"MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED", "ture", true, false},
		{"MOVEMAILBOX_WORKER_MAX_ATTEMPTS", "0", true, false},
		{"MOVEMAILBOX_WORKER_JOB_TIMEOUT", "10m", true, true},
		{"MOVEMAILBOX_WORKER_LEASE_TTL", "bad", true, false},
		{"MOVEMAILBOX_WORKER_LEASE_TTL", "bad", false, false},
		// Unused settings belong to the other role, not this startup path.
		{"MOVEMAILBOX_PUBLIC_MODE", "bad", true, true},
		{"MOVEMAILBOX_WORKER_JOB_TIMEOUT", "bad", false, true},
	} {
		t.Run(test.name+"/"+test.value, func(t *testing.T) {
			err := validateEnvironment(test.worker, func(name string) string {
				if name == test.name {
					return test.value
				}
				return ""
			})
			if (err == nil) != test.valid {
				t.Fatalf("valid=%v, error=%v", test.valid, err)
			}
			if err != nil && (!strings.Contains(err.Error(), test.name) || strings.Contains(err.Error(), "secret-value")) {
				t.Fatalf("error must identify setting without disclosing value: %v", err)
			}
		})
	}
}

// Exercise the real entry points in a child process: invalid configuration must
// exit before binding a listener or creating runtime files. No live mail used.
func TestStartupRejectsInvalidEnvironment(t *testing.T) {
	if role := os.Getenv("MOVEMAILBOX_TEST_STARTUP_ROLE"); role != "" {
		os.Args = []string{"movemailbox"}
		if role == "worker" {
			os.Args = append(os.Args, "worker-service")
		}
		main()
		os.Exit(0)
	}
	for _, role := range []string{"api", "worker"} {
		t.Run(role, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			command := exec.CommandContext(ctx, os.Args[0], "-test.run=^TestStartupRejectsInvalidEnvironment$")
			command.Dir = t.TempDir()
			for _, entry := range os.Environ() {
				name := strings.ToUpper(strings.SplitN(entry, "=", 2)[0])
				if !strings.HasPrefix(name, "MOVEMAILBOX_") && !strings.HasPrefix(name, "MM_") {
					command.Env = append(command.Env, entry)
				}
			}
			setting := "MOVEMAILBOX_PUBLIC_MODE"
			if role == "worker" {
				setting = "MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED"
			}
			command.Env = append(command.Env, "MOVEMAILBOX_TEST_STARTUP_ROLE="+role, setting+"=secret-value")
			output, err := command.CombinedOutput()
			if err == nil || !strings.Contains(string(output), "invalid "+setting) || strings.Contains(string(output), "secret-value") {
				t.Fatalf("startup did not reject safely: error=%v output=%s", err, output)
			}
			entries, err := os.ReadDir(command.Dir)
			if err != nil || len(entries) != 0 {
				t.Fatalf("startup created files: %v, %v", entries, err)
			}
		})
	}
}
