package jobs

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/Anton-Babaskin/mailbox-migrator/internal/migrator"
)

type Status string

const (
	StatusQueued    Status = "queued"
	StatusRunning   Status = "running"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
	StatusCancelled Status = "cancelled"
)

type View struct {
	ID            string           `json:"id"`
	Status        Status           `json:"status"`
	Engine        string           `json:"engine"`
	Source        string           `json:"source"`
	Destination   string           `json:"destination"`
	Phase         string           `json:"phase,omitempty"`
	CurrentFolder string           `json:"currentFolder,omitempty"`
	Progress      int              `json:"progress"`
	Transferred   int64            `json:"transferred"`
	Skipped       int64            `json:"skipped"`
	Bytes         int64            `json:"bytes"`
	Error         string           `json:"error,omitempty"`
	CreatedAt     time.Time        `json:"createdAt"`
	StartedAt     *time.Time       `json:"startedAt,omitempty"`
	FinishedAt    *time.Time       `json:"finishedAt,omitempty"`
	RecentEvents  []migrator.Event `json:"recentEvents,omitempty"`
}

type record struct {
	view        View
	request     migrator.Request
	cancel      context.CancelFunc
	subscribers map[chan migrator.Event]struct{}
}

type Manager struct {
	mu     sync.RWMutex
	engine migrator.Engine
	jobs   map[string]*record
	queue  chan struct{}
}

func NewManager(engine migrator.Engine, maxConcurrent int) *Manager {
	if maxConcurrent < 1 {
		maxConcurrent = 1
	}
	return &Manager{engine: engine, jobs: make(map[string]*record), queue: make(chan struct{}, maxConcurrent)}
}

func (m *Manager) Start(request migrator.Request) (View, error) {
	if err := request.Validate(); err != nil {
		return View{}, err
	}
	ctx, cancel := context.WithCancel(context.Background())
	now := time.Now()
	view := View{
		ID:          newID(),
		Status:      StatusQueued,
		Engine:      m.engine.Name(),
		Source:      request.Source.Username + " @ " + request.Source.Host,
		Destination: request.Destination.Username + " @ " + request.Destination.Host,
		Phase:       "В очереди",
		CreatedAt:   now,
	}
	record := &record{view: view, request: request, cancel: cancel, subscribers: make(map[chan migrator.Event]struct{})}
	m.mu.Lock()
	m.jobs[view.ID] = record
	m.mu.Unlock()
	go m.run(ctx, view.ID)
	return view, nil
}

func (m *Manager) Get(id string) (View, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	record, ok := m.jobs[id]
	if !ok {
		return View{}, false
	}
	return cloneView(record.view), true
}

func (m *Manager) List() []View {
	m.mu.RLock()
	defer m.mu.RUnlock()
	views := make([]View, 0, len(m.jobs))
	for _, record := range m.jobs {
		views = append(views, cloneView(record.view))
	}
	return views
}

func (m *Manager) Cancel(id string) error {
	m.mu.RLock()
	record, ok := m.jobs[id]
	m.mu.RUnlock()
	if !ok {
		return errors.New("задание не найдено")
	}
	if record.view.Status == StatusCompleted || record.view.Status == StatusFailed || record.view.Status == StatusCancelled {
		return errors.New("задание уже завершено")
	}
	record.cancel()
	return nil
}

func (m *Manager) Subscribe(id string) (<-chan migrator.Event, func(), bool) {
	channel := make(chan migrator.Event, 32)
	m.mu.Lock()
	record, ok := m.jobs[id]
	if ok {
		record.subscribers[channel] = struct{}{}
	}
	m.mu.Unlock()
	if !ok {
		close(channel)
		return channel, func() {}, false
	}
	cancel := func() {
		m.mu.Lock()
		if record, exists := m.jobs[id]; exists {
			delete(record.subscribers, channel)
		}
		m.mu.Unlock()
	}
	return channel, cancel, true
}

func (m *Manager) run(ctx context.Context, id string) {
	select {
	case m.queue <- struct{}{}:
		defer func() { <-m.queue }()
	case <-ctx.Done():
		m.finish(id, StatusCancelled, migrator.Result{}, "Миграция отменена")
		return
	}

	now := time.Now()
	m.mu.Lock()
	record := m.jobs[id]
	record.view.Status = StatusRunning
	record.view.Phase = "Подготовка"
	record.view.StartedAt = &now
	request := record.request
	record.request.Source.Password = ""
	record.request.Destination.Password = ""
	m.mu.Unlock()
	m.publish(id, migrator.Event{Type: "status", Phase: "Подготовка", Message: "Миграция запущена", Timestamp: now})

	result, err := m.engine.Migrate(ctx, request, func(event migrator.Event) { m.publish(id, event) })
	if err != nil {
		if errors.Is(err, context.Canceled) {
			m.finish(id, StatusCancelled, result, "Миграция отменена")
			return
		}
		m.finish(id, StatusFailed, result, err.Error())
		return
	}
	m.finish(id, StatusCompleted, result, "")
}

func (m *Manager) publish(id string, event migrator.Event) {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}
	m.mu.Lock()
	record, ok := m.jobs[id]
	if !ok {
		m.mu.Unlock()
		return
	}
	if event.Phase != "" {
		record.view.Phase = event.Phase
	}
	if event.CurrentFolder != "" {
		record.view.CurrentFolder = event.CurrentFolder
	}
	if event.Progress > 0 {
		record.view.Progress = event.Progress
	}
	if event.Transferred > 0 {
		record.view.Transferred = event.Transferred
	}
	if event.Skipped > 0 {
		record.view.Skipped = event.Skipped
	}
	if event.Bytes > 0 {
		record.view.Bytes = event.Bytes
	}
	record.view.RecentEvents = append(record.view.RecentEvents, event)
	if len(record.view.RecentEvents) > 160 {
		record.view.RecentEvents = append([]migrator.Event(nil), record.view.RecentEvents[len(record.view.RecentEvents)-160:]...)
	}
	for subscriber := range record.subscribers {
		select {
		case subscriber <- event:
		default:
		}
	}
	m.mu.Unlock()
}

func (m *Manager) finish(id string, status Status, result migrator.Result, errorMessage string) {
	now := time.Now()
	m.mu.Lock()
	record, ok := m.jobs[id]
	if !ok {
		m.mu.Unlock()
		return
	}
	record.view.Status = status
	record.request.Source.Password = ""
	record.request.Destination.Password = ""
	record.view.FinishedAt = &now
	record.view.Transferred = result.Transferred
	record.view.Skipped = result.Skipped
	record.view.Bytes = result.Bytes
	record.view.Error = errorMessage
	if status == StatusCompleted {
		record.view.Progress = 100
		record.view.Phase = "Готово"
	} else if status == StatusCancelled {
		record.view.Phase = "Отменено"
	} else {
		record.view.Phase = "Ошибка"
	}
	event := migrator.Event{Type: "finished", Phase: record.view.Phase, Progress: record.view.Progress, Transferred: result.Transferred, Skipped: result.Skipped, Bytes: result.Bytes, Message: errorMessage, Timestamp: now}
	record.view.RecentEvents = append(record.view.RecentEvents, event)
	for subscriber := range record.subscribers {
		select {
		case subscriber <- event:
		default:
		}
	}
	m.mu.Unlock()
}

func cloneView(view View) View {
	view.RecentEvents = append([]migrator.Event(nil), view.RecentEvents...)
	return view
}

func newID() string {
	data := make([]byte, 8)
	if _, err := rand.Read(data); err != nil {
		return time.Now().UTC().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(data)
}
