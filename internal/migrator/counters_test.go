package migrator

import (
	"encoding/json"
	"math"
	"strings"
	"testing"
)

func TestNativeCounterObservations(t *testing.T) {
	var tracker imapsyncProgress
	var result Result
	tracker.consume("Host1 Nb messages: 100 messages", &result)
	tracker.consume("Host1 Total size: 2048 bytes (2.000 KiB)", &result)
	tracker.consume("Host2 Total size: 99999 bytes (97.7 KiB)", &result)
	tracker.consume("msg INBOX/7 {42} copied to INBOX/7 ETA: Sun Sep 13 14:00:00 2026  120 s  60/100 msgs left", &result)
	c := tracker.counters
	if c.TotalMessages == nil || *c.TotalMessages != 100 || c.TotalBytes == nil || *c.TotalBytes != 2048 || c.RemainingMessages == nil || *c.RemainingMessages != 60 || c.ETASeconds == nil || *c.ETASeconds != 120 {
		t.Fatalf("incorrect native observations: %+v", c)
	}
	// Legacy versions can report counts without a seconds estimate.
	tracker.consume("ETA: Sun Sep 13 14:00:00 2026  0/100 msgs left", &result)
	if tracker.counters.ETASeconds != nil || *tracker.counters.RemainingMessages != 0 {
		t.Fatal("legacy ETA retained a stale prediction or lost an observed zero")
	}
	tracker.consume("++++ End looping on each folder", &result)
	event, _ := tracker.consume("Host1 Nb messages: 100 messages", &result)
	if event.Phase == "preparing" || tracker.counters.ETASeconds != nil {
		t.Fatal("final inventory regressed the phase or restored ETA")
	}
}

func TestNativeCountersRejectMalformedAndOverflowingNumbers(t *testing.T) {
	for _, line := range []string{
		"Host1 Total size: -2 bytes", "Host1 Total size: 9223372036854775808 bytes",
		"log Host1 Total size: 10 bytes", "Host1 Nb messages: 9223372036854775808 messages",
		"ETA: date 10 s 2/1 msgs left", "ETA: date 10 s 0/9223372036854775808 msgs left",
	} {
		var tracker imapsyncProgress
		tracker.consume(line, &Result{})
		c := tracker.counters
		if c.TotalBytes != nil || c.TotalMessages != nil || c.RemainingMessages != nil || c.ETASeconds != nil {
			t.Fatalf("malformed observation accepted: %q", line)
		}
	}
	if got := boundedProgress(math.MaxInt64, math.MaxInt64); got != 95 {
		t.Fatalf("large counter overflow: %d", got)
	}
	for _, seconds := range []string{"-1", "unknown", "9223372036854775808"} {
		var tracker imapsyncProgress
		tracker.consume("ETA: date "+seconds+" s 0/1 msgs left", &Result{})
		if tracker.counters.ETASeconds != nil || tracker.counters.RemainingMessages == nil {
			t.Fatal("invalid ETA seconds should preserve valid counts only")
		}
	}
}

func TestCounterJSONUnknownZeroAndClone(t *testing.T) {
	var tracker imapsyncProgress
	tracker.consume("Host1 Total size: 0 bytes (0 B)", &Result{})
	tracker.consume("ETA: date  0 s  0/0 msgs left", &Result{})
	data, err := json.Marshal(Event{ProgressCounters: tracker.counters, CountersUpdated: true})
	if err != nil {
		t.Fatal(err)
	}
	for _, field := range []string{"totalMessages", "remainingMessages", "totalBytes", "etaSeconds"} {
		if !strings.Contains(string(data), `"`+field+`":0`) {
			t.Fatalf("observed zero absent: %s", data)
		}
	}
	data, _ = json.Marshal(Event{CountersUpdated: true})
	if strings.Contains(string(data), "totalMessages") {
		t.Fatal("unknown counter was invented")
	}
	cloned := tracker.counters.Clone()
	*cloned.TotalMessages = 5
	if *tracker.counters.TotalMessages != 0 {
		t.Fatal("clone aliases producer state")
	}
}
