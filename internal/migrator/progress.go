package migrator

import (
	"regexp"
	"strconv"
	"strings"
)

var (
	transferredPattern = regexp.MustCompile(`(?i)^\s*Messages transferred\s*:\s*([0-9]+)(?:\s|$)`)
	skippedPattern     = regexp.MustCompile(`(?i)^\s*Messages skipped\s*:\s*([0-9]+)(?:\s|$)`)
	bytesPattern       = regexp.MustCompile(`(?i)^\s*Total bytes transferred\s*:\s*([0-9]+)(?:\s|$)`)
	host1TotalPattern  = regexp.MustCompile(`^Host1 Nb messages:\s*([0-9]+) messages\s*$`)
	etaPattern         = regexp.MustCompile(`\bETA:.*\s([0-9]+)/([0-9]+) msgs left(?:\s|$)`)
	copiedPattern      = regexp.MustCompile(`^msg .+/[0-9]+\s+\{([0-9]+)\}\s+copied to\s+`)
	skippedLinePattern = regexp.MustCompile(`^(?:-\s*)?msg .+\sskipped(?:\s|$)`)

	// Current imapsync emits "Folder 1/14 [source] -> [destination]".
	// Both source names may include a human-readable UTF-8 form after "=".
	folderProgressPattern = regexp.MustCompile(`^Folder\s+([0-9]+)/([0-9]+)\s+\[([^\]\r\n]*)\](?:\s*=\s*\[([^\]\r\n]*)\])?\s+->\s+\[[^\]\r\n]*\](?:\s*=\s*\[[^\]\r\n]*\])?\s*$`)
	legacyFolderPattern   = regexp.MustCompile(`^Considering folder\s+\[([^\]\r\n]+)\]\s*$`)
)

type imapsyncProgress struct {
	currentFolder string
	totalMessages int64
	lastProgress  int
}

func (progress *imapsyncProgress) consume(line string, result *Result) (Event, bool) {
	if line == "++++ End looping on each folder" {
		progress.lastProgress = max(progress.lastProgress, 98)
		return Event{Type: "progress", Phase: "verifying", Progress: progress.lastProgress}, true
	}

	if total, ok := parseHost1Total(line); ok && progress.totalMessages == 0 {
		progress.totalMessages = total
		progress.lastProgress = max(progress.lastProgress, 5)
		return Event{Type: "progress", Phase: "preparing", Progress: progress.lastProgress}, true
	}

	if folder, index, total, ok := parseFolderProgress(line); ok {
		progress.currentFolder = folder
		if total > 0 {
			progress.lastProgress = max(progress.lastProgress, boundedProgress(int64(index-1), int64(total)))
			return Event{
				Type:          "progress",
				Phase:         "copying",
				CurrentFolder: folder,
				Progress:      progress.lastProgress,
			}, true
		}
		return Event{Type: "progress", Phase: "copying", CurrentFolder: folder, Indeterminate: true}, true
	}

	if match := copiedPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Transferred++
		if size, err := strconv.ParseInt(match[1], 10, 64); err == nil {
			result.Bytes += size
		}
	}
	if skippedLinePattern.MatchString(line) {
		result.Skipped++
	}

	if remaining, total, ok := parseETA(line); ok && total > 0 {
		progress.totalMessages = total
		processed := total - remaining
		progress.lastProgress = max(progress.lastProgress, boundedProgress(processed, total))
		return Event{
			Type:          "progress",
			Phase:         "copying",
			CurrentFolder: progress.currentFolder,
			Progress:      progress.lastProgress,
		}, true
	}

	return Event{}, false
}

func parseFolderProgress(line string) (name string, index, total int, ok bool) {
	if match := folderProgressPattern.FindStringSubmatch(line); len(match) == 5 {
		index, indexErr := strconv.Atoi(match[1])
		total, totalErr := strconv.Atoi(match[2])
		if indexErr != nil || totalErr != nil || index < 1 || total < 1 || index > total {
			return "", 0, 0, false
		}
		name = strings.TrimSpace(match[3])
		if translated := strings.TrimSpace(match[4]); translated != "" {
			name = translated
		}
		if name == "" {
			return "", 0, 0, false
		}
		return name, index, total, true
	}

	if match := legacyFolderPattern.FindStringSubmatch(line); len(match) == 2 {
		name := strings.TrimSpace(match[1])
		if name != "" {
			return name, 0, 0, true
		}
	}
	return "", 0, 0, false
}

func parseHost1Total(line string) (int64, bool) {
	match := host1TotalPattern.FindStringSubmatch(line)
	if len(match) != 2 {
		return 0, false
	}
	total, err := strconv.ParseInt(match[1], 10, 64)
	return total, err == nil
}

func parseETA(line string) (remaining, total int64, ok bool) {
	match := etaPattern.FindStringSubmatch(line)
	if len(match) != 3 {
		return 0, 0, false
	}
	remaining, firstErr := strconv.ParseInt(match[1], 10, 64)
	total, secondErr := strconv.ParseInt(match[2], 10, 64)
	if firstErr != nil || secondErr != nil || remaining < 0 || total < 1 || remaining > total {
		return 0, 0, false
	}
	return remaining, total, true
}

func boundedProgress(done, total int64) int {
	if total <= 0 {
		return 0
	}
	if done < 0 {
		done = 0
	}
	if done > total {
		done = total
	}
	// Reserve 0-4% for startup and 96-100% for final verification.
	return 5 + int(done*90/total)
}

func updateResult(line string, result *Result) {
	if match := transferredPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Transferred, _ = strconv.ParseInt(match[1], 10, 64)
	}
	if match := skippedPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Skipped, _ = strconv.ParseInt(match[1], 10, 64)
	}
	if match := bytesPattern.FindStringSubmatch(line); len(match) == 2 {
		result.Bytes, _ = strconv.ParseInt(match[1], 10, 64)
	}
}
