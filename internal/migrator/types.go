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
	SyncFlags     bool `json:"syncFlags"`
	PreserveDates bool `json:"preserveDates"`
	DryRun        bool `json:"dryRun"`
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
	return nil
}

type Event struct {
	Type          string    `json:"type"`
	Message       string    `json:"message,omitempty"`
	Phase         string    `json:"phase,omitempty"`
	CurrentFolder string    `json:"currentFolder,omitempty"`
	Progress      int       `json:"progress,omitempty"`
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

type Engine interface {
	Name() string
	Available() bool
	TestConnection(ctx context.Context, endpoint Endpoint, emit func(Event)) error
	Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error)
}
