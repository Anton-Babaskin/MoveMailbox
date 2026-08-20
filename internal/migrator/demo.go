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

func (DemoEngine) Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error) {
	folders := []struct {
		name     string
		messages int64
		bytes    int64
	}{
		{"INBOX", 184, 38_400_000},
		{"Sent", 96, 21_700_000},
		{"Archive/2024", 242, 74_900_000},
		{"Archive/2025", 317, 96_200_000},
		{"Projects", 73, 18_800_000},
	}

	result := Result{}
	emit(Event{Type: "progress", Phase: "Подготовка", Progress: 3, Message: "Читаем структуру почтового ящика", Timestamp: time.Now()})

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
			Phase:         "Копирование",
			CurrentFolder: folder.name,
			Progress:      progress,
			Transferred:   result.Transferred,
			Skipped:       result.Skipped,
			Bytes:         result.Bytes,
			Message:       fmt.Sprintf("Папка %s перенесена", folder.name),
			Timestamp:     time.Now(),
		})
	}

	emit(Event{Type: "progress", Phase: "Проверка", Progress: 100, Message: "Миграция проверена", Timestamp: time.Now()})
	return result, nil
}
