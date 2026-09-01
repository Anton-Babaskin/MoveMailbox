package migrator

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

type SecurityMode string

const (
	SecurityTLS      SecurityMode = "tls"
	SecurityStartTLS SecurityMode = "starttls"
	SecurityPlain    SecurityMode = "plain"
)

type Endpoint struct {
	Host     string       `json:"host"`
	Port     int          `json:"port"`
	Security SecurityMode `json:"security"`
	Username string       `json:"username"`
	Password string       `json:"password"`
}

func (e Endpoint) Validate() error {
	if strings.TrimSpace(e.Host) == "" {
		return errors.New("укажите IMAP-сервер")
	}
	if e.Port < 1 || e.Port > 65535 {
		return errors.New("порт должен быть от 1 до 65535")
	}
	if strings.TrimSpace(e.Username) == "" {
		return errors.New("укажите логин")
	}
	if e.Password == "" {
		return errors.New("укажите пароль или пароль приложения")
	}
	switch e.Security {
	case SecurityTLS, SecurityStartTLS, SecurityPlain:
	default:
		return fmt.Errorf("неподдерживаемый режим защиты %q", e.Security)
	}
	return nil
}

type Options struct {
	SyncFlags             bool     `json:"syncFlags"`
	PreserveDates         bool     `json:"preserveDates"`
	DryRun                bool     `json:"dryRun"`
	Folders               []string `json:"folders,omitempty"`
	DestinationSubfolder  string   `json:"destinationSubfolder,omitempty"`
	StrictMirror          bool     `json:"strictMirror"`
	StrictMirrorConfirmed bool     `json:"strictMirrorConfirmed"`
}

type Request struct {
	Source      Endpoint `json:"source"`
	Destination Endpoint `json:"destination"`
	Options     Options  `json:"options"`
}

func (r Request) Validate() error {
	if err := r.Source.Validate(); err != nil {
		return fmt.Errorf("источник: %w", err)
	}
	if err := r.Destination.Validate(); err != nil {
		return fmt.Errorf("назначение: %w", err)
	}
	if sameMailbox(r.Source, r.Destination) {
		return errors.New("источник и назначение совпадают; укажите другой почтовый ящик назначения")
	}
	if len(r.Options.Folders) > 500 {
		return errors.New("можно выбрать не более 500 папок за один запуск")
	}
	seenFolders := make(map[string]struct{}, len(r.Options.Folders))
	for _, folder := range r.Options.Folders {
		if strings.TrimSpace(folder) == "" {
			return errors.New("имя выбранной папки не может быть пустым")
		}
		if strings.ContainsRune(folder, '\x00') {
			return errors.New("имя выбранной папки содержит недопустимый символ")
		}
		if _, duplicate := seenFolders[folder]; duplicate {
			return fmt.Errorf("папка %q выбрана дважды", folder)
		}
		seenFolders[folder] = struct{}{}
	}
	if strings.ContainsRune(r.Options.DestinationSubfolder, '\x00') {
		return errors.New("имя подпапки назначения содержит недопустимый символ")
	}
	if len(r.Options.DestinationSubfolder) > 512 {
		return errors.New("имя подпапки назначения слишком длинное")
	}
	if r.Options.StrictMirror && !r.Options.StrictMirrorConfirmed {
		return errors.New("строгое зеркало требует отдельного подтверждения удаления лишних писем в назначении")
	}
	return nil
}

func sameMailbox(source, destination Endpoint) bool {
	return strings.EqualFold(strings.TrimSpace(source.Host), strings.TrimSpace(destination.Host)) &&
		strings.EqualFold(strings.TrimSpace(source.Username), strings.TrimSpace(destination.Username))
}

type Event struct {
	Type          string    `json:"type"`
	Message       string    `json:"message,omitempty"`
	Phase         string    `json:"phase,omitempty"`
	CurrentFolder string    `json:"currentFolder,omitempty"`
	Progress      int       `json:"progress,omitempty"`
	Indeterminate bool      `json:"indeterminate,omitempty"`
	Transferred   int64     `json:"transferred,omitempty"`
	Skipped       int64     `json:"skipped,omitempty"`
	Bytes         int64     `json:"bytes,omitempty"`
	Timestamp     time.Time `json:"timestamp"`
}

type Result struct {
	Transferred int64 `json:"transferred"`
	Skipped     int64 `json:"skipped"`
	Bytes       int64 `json:"bytes"`
}

type Folder struct {
	Name      string `json:"name"`
	Delimiter string `json:"delimiter,omitempty"`
}

type FolderLister interface {
	ListFolders(ctx context.Context, endpoint Endpoint) ([]Folder, error)
}

type Engine interface {
	Name() string
	Available() bool
	TestConnection(ctx context.Context, endpoint Endpoint, emit func(Event)) error
	Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error)
}
