package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Validate before opening listeners, databases or log files. A misspelled
// protection flag must never silently select an unprotected default. Values are
// deliberately omitted from errors (a secret may have been pasted by mistake).
// An empty variable retains the existing unset/default behavior.
func validateEnvironment(workerService bool, lookup func(string) string) error {
	booleans := []string{"MOVEMAILBOX_DEMO"}
	integers := []string{}
	durations := []string{"MOVEMAILBOX_WORKER_LEASE_TTL"}
	if workerService {
		booleans = append(booleans, "MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED")
		integers = append(integers, "MOVEMAILBOX_WORKER_MAX_CONCURRENT", "MOVEMAILBOX_WORKER_MAX_ATTEMPTS", "MOVEMAILBOX_WORKER_MAX_JOBS")
		durations = append(durations, "MOVEMAILBOX_WORKER_JOB_TIMEOUT")
	} else {
		booleans = append(booleans, "MM_DEMO", "MOVEMAILBOX_OPEN_BROWSER", "MM_OPEN_BROWSER", "MOVEMAILBOX_PUBLIC_MODE", "MOVEMAILBOX_WORKER_ALLOW_HTTP", "MOVEMAILBOX_EMBEDDED_WORKER")
		integers = append(integers, "MOVEMAILBOX_MAX_CONCURRENT", "MM_MAX_CONCURRENT", "MOVEMAILBOX_MAX_JOBS", "MOVEMAILBOX_MAX_ACTIVE_PER_SESSION", "MOVEMAILBOX_SESSION_REQUESTS_PER_MINUTE", "MOVEMAILBOX_IP_REQUESTS_PER_MINUTE")
		durations = append(durations, "MOVEMAILBOX_HISTORY_TTL", "MOVEMAILBOX_SESSION_TTL", "MOVEMAILBOX_CREDENTIAL_TTL")
	}
	for _, name := range booleans {
		if value := strings.TrimSpace(lookup(name)); value != "" {
			if _, err := strconv.ParseBool(value); err != nil {
				return fmt.Errorf("invalid %s: expected a boolean", name)
			}
		}
	}
	for _, name := range integers {
		if value := strings.TrimSpace(lookup(name)); value != "" {
			if parsed, err := strconv.Atoi(value); err != nil || parsed <= 0 {
				return fmt.Errorf("invalid %s: expected a positive integer", name)
			}
		}
	}
	for _, name := range durations {
		if value := strings.TrimSpace(lookup(name)); value != "" {
			if parsed, err := time.ParseDuration(value); err != nil || parsed <= 0 {
				return fmt.Errorf("invalid %s: expected a positive duration", name)
			}
		}
	}
	return nil
}
