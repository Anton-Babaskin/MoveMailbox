package migrator

import "testing"

func TestParseFolderProgressStrict(t *testing.T) {
	tests := []struct {
		name       string
		line       string
		wantFolder string
		wantIndex  int
		wantTotal  int
		wantOK     bool
	}{
		{
			name:       "current format",
			line:       "Folder    3/14 [INBOX/Projects]                    -> [Projects]",
			wantFolder: "INBOX/Projects",
			wantIndex:  3,
			wantTotal:  14,
			wantOK:     true,
		},
		{
			name:       "translated UTF7 format",
			line:       "Folder 1/2 [&BB8EQAQ+BDUEOgRC-] = [Проект] -> [Project]",
			wantFolder: "Проект",
			wantIndex:  1,
			wantTotal:  2,
			wantOK:     true,
		},
		{
			name:       "legacy anchored format",
			line:       "Considering folder [Archive/2025]",
			wantFolder: "Archive/2025",
			wantOK:     true,
		},
		{name: "inventory is not current folder", line: "Host1 folder 3/14 [INBOX] Size: 42 Messages: 1", wantOK: false},
		{name: "prose is rejected", line: "Error while Considering folder [INBOX]", wantOK: false},
		{name: "missing destination", line: "Folder 1/2 [INBOX]", wantOK: false},
		{name: "invalid counter", line: "Folder 3/2 [INBOX] -> [INBOX]", wantOK: false},
		{name: "suffix is rejected", line: "Folder 1/2 [INBOX] -> [INBOX] unexpected", wantOK: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			folder, index, total, ok := parseFolderProgress(test.line)
			if ok != test.wantOK || folder != test.wantFolder || index != test.wantIndex || total != test.wantTotal {
				t.Fatalf("parseFolderProgress(%q) = (%q, %d, %d, %v), want (%q, %d, %d, %v)", test.line, folder, index, total, ok, test.wantFolder, test.wantIndex, test.wantTotal, test.wantOK)
			}
		})
	}
}

func TestImapsyncProgressFromInventoryFolderAndETA(t *testing.T) {
	tracker := imapsyncProgress{}
	result := Result{}

	event, ok := tracker.consume("Host1 Nb messages:                 100 messages", &result)
	if !ok || event.Phase != "preparing" || event.Progress != 5 {
		t.Fatalf("unexpected inventory event: %+v, ok=%v", event, ok)
	}

	event, ok = tracker.consume("Folder 2/4 [Sent] -> [Sent]", &result)
	if !ok || event.Phase != "copying" || event.CurrentFolder != "Sent" || event.Progress != 27 || event.Indeterminate {
		t.Fatalf("unexpected folder event: %+v, ok=%v", event, ok)
	}

	event, ok = tracker.consume("msg Sent/7 {2048} copied to Sent/10 1.00 msgs/s 2.00 KiB/s 2.00 KiB copied ETA: Wed 26 Aug 2026 12:00:00 +0300 60/100 msgs left", &result)
	if !ok || event.Progress != 41 || result.Transferred != 1 || result.Bytes != 2048 {
		t.Fatalf("unexpected copy event/result: event=%+v result=%+v ok=%v", event, result, ok)
	}

	event, ok = tracker.consume("++++ End looping on each folder", &result)
	if !ok || event.Phase != "verifying" || event.Progress != 98 {
		t.Fatalf("unexpected verifying event: %+v, ok=%v", event, ok)
	}
}

func TestLegacyFolderProgressIsExplicitlyIndeterminate(t *testing.T) {
	tracker := imapsyncProgress{}
	event, ok := tracker.consume("Considering folder [INBOX]", &Result{})
	if !ok || event.Phase != "copying" || event.CurrentFolder != "INBOX" || !event.Indeterminate || event.Progress != 0 {
		t.Fatalf("unexpected legacy event: %+v, ok=%v", event, ok)
	}
}

func TestProgressNeverMovesBackwards(t *testing.T) {
	tracker := imapsyncProgress{}
	result := Result{}
	first, _ := tracker.consume("ETA: Wed 26 Aug 2026 12:00:00 +0300 10/100 msgs left", &result)
	second, _ := tracker.consume("ETA: Wed 26 Aug 2026 12:00:01 +0300 80/100 msgs left", &result)
	if first.Progress != 86 || second.Progress != first.Progress {
		t.Fatalf("progress moved backwards: first=%d second=%d", first.Progress, second.Progress)
	}
}
