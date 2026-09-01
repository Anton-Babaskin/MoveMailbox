package migrator

import (
	"context"
	"fmt"
	"time"
)

type DemoEngine struct{}

func (DemoEngine) Name() string    { return "demo" }
func (DemoEngine) Available() bool { return true }

func (DemoEngine) TestConnection(ctx context.Context, endpoint Endpoint, emit func(Event)) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(650 * time.Millisecond):
	}
	emit(Event{Type: "log", Message: fmt.Sprintf("Соединение с %s:%d установлено", endpoint.Host, endpoint.Port), Timestamp: time.Now()})
	return nil
}

func (DemoEngine) ListFolders(ctx context.Context, _ Endpoint) ([]Folder, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-time.After(350 * time.Millisecond):
	}
	return []Folder{
		{Name: "INBOX", Delimiter: "/"},
		{Name: "Sent", Delimiter: "/"},
		{Name: "Drafts", Delimiter: "/"},
		{Name: "Archive/2024", Delimiter: "/"},
		{Name: "Archive/2025", Delimiter: "/"},
		{Name: "Projects", Delimiter: "/"},
		{Name: "Trash", Delimiter: "/"},
	}, nil
}

func (DemoEngine) Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error) {
	folders := []struct {
		name     string
		messages int64
		bytes    int64
	}{
		{"INBOX", 184, 38_400_000},
		{"Sent", 96, 21_700_000},
		{"Drafts", 14, 2_900_000},
		{"Archive/2024", 242, 74_900_000},
		{"Archive/2025", 317, 96_200_000},
		{"Projects", 73, 18_800_000},
		{"Trash", 28, 5_600_000},
	}

	result := Result{}
	if len(request.Options.Folders) > 0 {
		selected := make(map[string]struct{}, len(request.Options.Folders))
		for _, name := range request.Options.Folders {
			selected[name] = struct{}{}
		}
		filtered := folders[:0]
		for _, folder := range folders {
			if _, ok := selected[folder.name]; ok {
				filtered = append(filtered, folder)
			}
		}
		folders = filtered
	}
	emit(Event{Type: "progress", Phase: "preparing", Progress: 3, Message: "Читаем структуру почтового ящика", Timestamp: time.Now()})

	for index, folder := range folders {
		select {
		case <-ctx.Done():
			return result, ctx.Err()
		case <-time.After(700 * time.Millisecond):
		}

		result.Transferred += folder.messages
		result.Bytes += folder.bytes
		progress := 12 + ((index + 1) * 84 / len(folders))
		emit(Event{
			Type:          "progress",
			Phase:         "copying",
			CurrentFolder: folder.name,
			Progress:      progress,
			Transferred:   result.Transferred,
			Skipped:       result.Skipped,
			Bytes:         result.Bytes,
			Message:       fmt.Sprintf("Папка %s перенесена", folder.name),
			Timestamp:     time.Now(),
		})
	}

	emit(Event{Type: "progress", Phase: "verifying", Progress: 100, Message: "Миграция проверена", Timestamp: time.Now()})
	return result, nil
}
