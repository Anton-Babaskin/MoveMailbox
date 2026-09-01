package jobs

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type Status string

const (
	StatusQueued    Status = "queued"
	StatusRunning   Status = "running"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
	StatusCancelled Status = "cancelled"

	PhaseQueued     = "queued"
	PhaseConnecting = "connecting"
	PhasePreparing  = "preparing"
	PhaseScanning   = "scanning"
	PhaseCopying    = "copying"
	PhaseVerifying  = "verifying"
	PhaseCompleted  = "completed"
	PhaseCancelled  = "cancelled"
	PhaseFailed     = "failed"
)

var (
	ErrJobNotFound         = errors.New("задание не найдено")
	ErrJobFinished         = errors.New("задание уже завершено")
	ErrManagerShuttingDown = errors.New("менеджер заданий завершает работу")
	ErrJobLimitReached     = errors.New("достигнут лимит заданий")
	ErrEngineUnavailable   = errors.New("движок миграции недоступен")
)

const (
	defaultMaxJobs           = 256
	defaultCompletedTTL      = 24 * time.Hour
	defaultEventHistoryLimit = 256
	defaultSubscriberBuffer  = 32
	viewEventHistoryLimit    = 160
)

// Config controls concurrency and bounded in-memory job history. Zero values
// select conservative defaults. A negative CompletedTTL disables TTL eviction.
type Config struct {
	MaxConcurrent     int
	MaxJobs           int
	CompletedTTL      time.Duration
	EventHistoryLimit int
	SubscriberBuffer  int
	CleanupInterval   time.Duration
}

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
	Sequence      uint64           `json:"sequence"`
	RecentEvents  []migrator.Event `json:"recentEvents,omitempty"`
}

// StreamEvent associates an event with a monotonically increasing per-job
// sequence. Clients can reconnect with SubscribeFrom and their Last-Event-ID.
// A gap is represented by Event.Type == "gap"; Sequence then identifies the
// last event which is no longer available for replay.
type StreamEvent struct {
	Sequence uint64         `json:"sequence"`
	Event    migrator.Event `json:"event"`
}

type record struct {
	view        View
	request     migrator.Request
	cancel      context.CancelFunc
	history     []StreamEvent
	subscribers map[*subscriber]struct{}
}

type subscriber struct {
	jobID  string
	after  uint64
	stream chan StreamEvent
	legacy chan migrator.Event
	notify chan struct{}
	done   chan struct{}
	once   sync.Once
}

type Manager struct {
	mu sync.RWMutex

	engine migrator.Engine
	jobs   map[string]*record
	queue  chan struct{}

	maxJobs           int
	completedTTL      time.Duration
	eventHistoryLimit int
	subscriberBuffer  int
	cleanupInterval   time.Duration

	ctx          context.Context
	cancel       context.CancelFunc
	shuttingDown bool
	wg           sync.WaitGroup
	now          func() time.Time
}

func NewManager(engine migrator.Engine, maxConcurrent int) *Manager {
	return NewManagerWithConfig(engine, Config{MaxConcurrent: maxConcurrent})
}

func NewManagerWithConfig(engine migrator.Engine, config Config) *Manager {
	if config.MaxConcurrent < 1 {
		config.MaxConcurrent = 1
	}
	if config.MaxJobs < 1 {
		config.MaxJobs = defaultMaxJobs
	}
	if config.CompletedTTL == 0 {
		config.CompletedTTL = defaultCompletedTTL
	}
	if config.EventHistoryLimit < 1 {
		config.EventHistoryLimit = defaultEventHistoryLimit
	}
	if config.SubscriberBuffer < 1 {
		config.SubscriberBuffer = defaultSubscriberBuffer
	}
	if config.CleanupInterval <= 0 {
		config.CleanupInterval = cleanupInterval(config.CompletedTTL)
	}

	ctx, cancel := context.WithCancel(context.Background())
	manager := &Manager{
		engine:            engine,
		jobs:              make(map[string]*record),
		queue:             make(chan struct{}, config.MaxConcurrent),
		maxJobs:           config.MaxJobs,
		completedTTL:      config.CompletedTTL,
		eventHistoryLimit: config.EventHistoryLimit,
		subscriberBuffer:  config.SubscriberBuffer,
		cleanupInterval:   config.CleanupInterval,
		ctx:               ctx,
		cancel:            cancel,
		now:               time.Now,
	}
	manager.wg.Add(1)
	go manager.cleanupLoop()
	return manager
}

func (m *Manager) Start(request migrator.Request) (View, error) {
	if err := request.Validate(); err != nil {
		return View{}, err
	}
	m.mu.RLock()
	shuttingDown := m.shuttingDown
	m.mu.RUnlock()
	if shuttingDown {
		return View{}, ErrManagerShuttingDown
	}
	if m.engine == nil || !m.engine.Available() {
		return View{}, ErrEngineUnavailable
	}

	m.mu.Lock()
	if m.shuttingDown {
		m.mu.Unlock()
		return View{}, ErrManagerShuttingDown
	}
	m.evictLocked(m.now(), true)
	if len(m.jobs) >= m.maxJobs {
		m.mu.Unlock()
		return View{}, ErrJobLimitReached
	}

	ctx, cancel := context.WithCancel(m.ctx)
	now := m.now()
	view := View{
		ID:          m.uniqueIDLocked(),
		Status:      StatusQueued,
		Engine:      m.engine.Name(),
		Source:      request.Source.Username + " @ " + request.Source.Host,
		Destination: request.Destination.Username + " @ " + request.Destination.Host,
		Phase:       PhaseQueued,
		CreatedAt:   now,
	}
	record := &record{
		view:        view,
		request:     request,
		cancel:      cancel,
		subscribers: make(map[*subscriber]struct{}),
	}
	m.jobs[view.ID] = record
	m.wg.Add(1)
	m.mu.Unlock()

	go m.run(ctx, view.ID)
	return view, nil
}

func (m *Manager) Get(id string) (View, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.evictLocked(m.now(), false)
	record, ok := m.jobs[id]
	if !ok {
		return View{}, false
	}
	return cloneView(record.view), true
}

func (m *Manager) List() []View {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.evictLocked(m.now(), false)
	views := make([]View, 0, len(m.jobs))
	for _, record := range m.jobs {
		views = append(views, cloneView(record.view))
	}
	sort.Slice(views, func(i, j int) bool { return views[i].CreatedAt.After(views[j].CreatedAt) })
	return views
}

func (m *Manager) Cancel(id string) error {
	m.mu.Lock()
	record, ok := m.jobs[id]
	if !ok {
		m.mu.Unlock()
		return ErrJobNotFound
	}
	if terminal(record.view.Status) {
		m.mu.Unlock()
		return ErrJobFinished
	}
	cancel := record.cancel
	m.finishLocked(record, StatusCancelled, migrator.Result{}, "Миграция отменена")
	m.mu.Unlock()
	cancel()
	return nil
}

// Subscribe is retained for compatibility. New SSE endpoints should use
// SubscribeFrom so they can expose sequence IDs and resume with Last-Event-ID.
// If a slow subscriber falls behind the bounded history, it receives an
// explicit event with Type "gap" instead of losing events silently.
func (m *Manager) Subscribe(id string) (<-chan migrator.Event, func(), bool) {
	subscriber, ok := m.addSubscriber(id, 0, false)
	if !ok {
		channel := make(chan migrator.Event)
		close(channel)
		return channel, func() {}, false
	}
	go m.deliver(subscriber)
	return subscriber.legacy, func() { m.removeSubscriber(subscriber) }, true
}

// SubscribeFrom replays retained events whose sequence is greater than
// afterSequence, then continues streaming live events. Event sequences are
// monotonically increasing within a job.
func (m *Manager) SubscribeFrom(id string, afterSequence uint64) (<-chan StreamEvent, func(), bool) {
	subscriber, ok := m.addSubscriber(id, afterSequence, true)
	if !ok {
		channel := make(chan StreamEvent)
		close(channel)
		return channel, func() {}, false
	}
	go m.deliver(subscriber)
	return subscriber.stream, func() { m.removeSubscriber(subscriber) }, true
}

// Shutdown rejects new work, cancels queued and active jobs, clears all stored
// credentials and waits for manager-owned goroutines. It is safe to call more
// than once. If an engine ignores cancellation, the supplied context bounds
// how long Shutdown waits.
func (m *Manager) Shutdown(ctx context.Context) error {
	m.mu.Lock()
	if !m.shuttingDown {
		m.shuttingDown = true
		for _, record := range m.jobs {
			if !terminal(record.view.Status) {
				record.cancel()
				m.finishLocked(record, StatusCancelled, migrator.Result{}, "Миграция отменена: приложение завершает работу")
			} else {
				clearRequest(&record.request)
			}
		}
		m.cancel()
	}
	m.mu.Unlock()

	done := make(chan struct{})
	go func() {
		m.wg.Wait()
		close(done)
	}()
	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (m *Manager) run(ctx context.Context, id string) {
	defer m.wg.Done()

	select {
	case m.queue <- struct{}{}:
		defer func() { <-m.queue }()
	case <-ctx.Done():
		m.finish(id, StatusCancelled, migrator.Result{}, "Миграция отменена")
		return
	}

	now := m.now()
	m.mu.Lock()
	record, ok := m.jobs[id]
	if !ok || terminal(record.view.Status) || ctx.Err() != nil {
		m.mu.Unlock()
		return
	}
	record.view.Status = StatusRunning
	record.view.Phase = PhasePreparing
	record.view.StartedAt = &now
	request := record.request
	clearRequest(&record.request)
	m.mu.Unlock()
	defer clearRequest(&request)

	m.publish(id, migrator.Event{Type: "status", Phase: PhasePreparing, Message: "Миграция запущена", Timestamp: now})
	result, err := m.engine.Migrate(ctx, request, func(event migrator.Event) {
		event.Message = scrubSecrets(event.Message, request)
		m.publish(id, event)
	})
	if err != nil {
		if errors.Is(err, context.Canceled) || ctx.Err() != nil {
			m.finish(id, StatusCancelled, result, "Миграция отменена")
			return
		}
		m.finish(id, StatusFailed, result, scrubSecrets(err.Error(), request))
		return
	}
	m.finish(id, StatusCompleted, result, "")
}

func (m *Manager) publish(id string, event migrator.Event) {
	if event.Timestamp.IsZero() {
		event.Timestamp = m.now()
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	record, ok := m.jobs[id]
	if !ok || terminal(record.view.Status) {
		return
	}
	event.Phase = normalizePhase(event.Phase, record.view.Status)
	if event.Phase != "" {
		record.view.Phase = event.Phase
	}
	if event.CurrentFolder != "" {
		record.view.CurrentFolder = event.CurrentFolder
	}
	if event.Progress > 0 {
		record.view.Progress = clampProgress(event.Progress)
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
	m.appendEventLocked(record, event)
}

func (m *Manager) finish(id string, status Status, result migrator.Result, errorMessage string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	record, ok := m.jobs[id]
	if !ok || terminal(record.view.Status) {
		return
	}
	m.finishLocked(record, status, result, errorMessage)
}

func (m *Manager) finishLocked(record *record, status Status, result migrator.Result, errorMessage string) {
	now := m.now()
	record.view.Status = status
	clearRequest(&record.request)
	record.view.FinishedAt = &now
	record.view.Transferred = result.Transferred
	record.view.Skipped = result.Skipped
	record.view.Bytes = result.Bytes
	record.view.Error = errorMessage
	switch status {
	case StatusCompleted:
		record.view.Progress = 100
		record.view.Phase = PhaseCompleted
	case StatusCancelled:
		record.view.Phase = PhaseCancelled
	case StatusFailed:
		record.view.Phase = PhaseFailed
	}
	event := migrator.Event{
		Type:        "finished",
		Phase:       record.view.Phase,
		Progress:    record.view.Progress,
		Transferred: result.Transferred,
		Skipped:     result.Skipped,
		Bytes:       result.Bytes,
		Message:     errorMessage,
		Timestamp:   now,
	}
	m.appendEventLocked(record, event)
}

func (m *Manager) appendEventLocked(record *record, event migrator.Event) {
	record.view.Sequence++
	envelope := StreamEvent{Sequence: record.view.Sequence, Event: event}
	record.history = append(record.history, envelope)
	if len(record.history) > m.eventHistoryLimit {
		record.history = append([]StreamEvent(nil), record.history[len(record.history)-m.eventHistoryLimit:]...)
	}
	record.view.RecentEvents = append(record.view.RecentEvents, event)
	if len(record.view.RecentEvents) > viewEventHistoryLimit {
		record.view.RecentEvents = append([]migrator.Event(nil), record.view.RecentEvents[len(record.view.RecentEvents)-viewEventHistoryLimit:]...)
	}
	for subscriber := range record.subscribers {
		select {
		case subscriber.notify <- struct{}{}:
		default:
		}
	}
}

func (m *Manager) addSubscriber(id string, after uint64, stream bool) (*subscriber, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.shuttingDown {
		return nil, false
	}
	record, ok := m.jobs[id]
	if !ok {
		return nil, false
	}
	subscriber := &subscriber{
		jobID:  id,
		after:  after,
		notify: make(chan struct{}, 1),
		done:   make(chan struct{}),
	}
	if stream {
		subscriber.stream = make(chan StreamEvent, m.subscriberBuffer)
	} else {
		subscriber.legacy = make(chan migrator.Event, m.subscriberBuffer)
	}
	record.subscribers[subscriber] = struct{}{}
	m.wg.Add(1)
	return subscriber, true
}

func (m *Manager) deliver(subscriber *subscriber) {
	defer m.wg.Done()
	defer func() {
		m.detachSubscriber(subscriber)
		if subscriber.stream != nil {
			close(subscriber.stream)
		}
		// Keep legacy channels open after the producer exits. The original
		// API never closed them and older consumers may omit receive-ok checks.
	}()

	cursor := subscriber.after
	for {
		events, finished, exists := m.eventsAfter(subscriber.jobID, cursor)
		if !exists {
			return
		}
		for _, event := range events {
			if !m.sendToSubscriber(subscriber, event) {
				return
			}
			cursor = event.Sequence
		}
		if finished {
			if subscriber.stream != nil {
				return
			}
			// The legacy API historically kept SSE connections open until the
			// caller unsubscribed. Preserve that behavior because older callers
			// may not check the channel's receive-ok value.
			select {
			case <-subscriber.done:
				return
			case <-m.ctx.Done():
				return
			}
		}
		select {
		case <-subscriber.notify:
		case <-subscriber.done:
			return
		case <-m.ctx.Done():
			return
		}
	}
}

func (m *Manager) eventsAfter(id string, after uint64) ([]StreamEvent, bool, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	record, ok := m.jobs[id]
	if !ok {
		return nil, true, false
	}
	finished := terminal(record.view.Status)
	if len(record.history) == 0 {
		return nil, finished, true
	}
	oldest := record.history[0].Sequence
	events := make([]StreamEvent, 0, len(record.history)+1)
	if after > record.view.Sequence {
		events = append(events, StreamEvent{
			Sequence: record.view.Sequence,
			Event: migrator.Event{
				Type:      "gap",
				Message:   "Указанная позиция потока недоступна; обновите состояние из snapshot",
				Timestamp: m.now(),
			},
		})
		after = record.view.Sequence
	}
	if after+1 < oldest {
		gapEnd := oldest - 1
		events = append(events, StreamEvent{
			Sequence: gapEnd,
			Event: migrator.Event{
				Type:      "gap",
				Message:   fmt.Sprintf("События %d–%d больше недоступны; обновите состояние из snapshot", after+1, gapEnd),
				Timestamp: m.now(),
			},
		})
		after = gapEnd
	}
	for _, event := range record.history {
		if event.Sequence > after {
			events = append(events, event)
		}
	}
	return events, finished, true
}

func (m *Manager) sendToSubscriber(subscriber *subscriber, event StreamEvent) bool {
	if subscriber.stream != nil {
		select {
		case subscriber.stream <- event:
			return true
		case <-subscriber.done:
			return false
		case <-m.ctx.Done():
			return false
		}
	}
	select {
	case subscriber.legacy <- event.Event:
		return true
	case <-subscriber.done:
		return false
	case <-m.ctx.Done():
		return false
	}
}

func (m *Manager) removeSubscriber(subscriber *subscriber) {
	subscriber.once.Do(func() { close(subscriber.done) })
	m.detachSubscriber(subscriber)
}

func (m *Manager) detachSubscriber(subscriber *subscriber) {
	m.mu.Lock()
	if record, ok := m.jobs[subscriber.jobID]; ok {
		delete(record.subscribers, subscriber)
	}
	m.mu.Unlock()
}

func (m *Manager) cleanupLoop() {
	defer m.wg.Done()
	ticker := time.NewTicker(m.cleanupInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			m.mu.Lock()
			m.evictLocked(m.now(), false)
			m.mu.Unlock()
		case <-m.ctx.Done():
			return
		}
	}
}

func (m *Manager) evictLocked(now time.Time, makeRoom bool) {
	type candidate struct {
		id       string
		finished time.Time
		expired  bool
	}
	candidates := make([]candidate, 0)
	for id, record := range m.jobs {
		if !terminal(record.view.Status) || record.view.FinishedAt == nil {
			continue
		}
		expired := m.completedTTL > 0 && !record.view.FinishedAt.Add(m.completedTTL).After(now)
		candidates = append(candidates, candidate{id: id, finished: *record.view.FinishedAt, expired: expired})
	}
	sort.Slice(candidates, func(i, j int) bool { return candidates[i].finished.Before(candidates[j].finished) })
	for _, candidate := range candidates {
		if candidate.expired || (makeRoom && len(m.jobs) >= m.maxJobs) {
			m.removeRecordLocked(candidate.id)
		}
	}
}

func (m *Manager) removeRecordLocked(id string) {
	record, ok := m.jobs[id]
	if !ok {
		return
	}
	clearRequest(&record.request)
	for subscriber := range record.subscribers {
		subscriber.once.Do(func() { close(subscriber.done) })
	}
	delete(m.jobs, id)
}

func (m *Manager) uniqueIDLocked() string {
	for {
		id := newID()
		if _, exists := m.jobs[id]; !exists {
			return id
		}
	}
}

func cloneView(view View) View {
	view.RecentEvents = append([]migrator.Event(nil), view.RecentEvents...)
	return view
}

func clearRequest(request *migrator.Request) {
	request.Source.Password = ""
	request.Destination.Password = ""
}

func scrubSecrets(value string, request migrator.Request) string {
	secrets := []string{request.Source.Password, request.Destination.Password}
	sort.Slice(secrets, func(i, j int) bool { return len(secrets[i]) > len(secrets[j]) })
	for _, secret := range secrets {
		if secret != "" {
			value = strings.ReplaceAll(value, secret, "[REDACTED]")
		}
	}
	return value
}

func terminal(status Status) bool {
	return status == StatusCompleted || status == StatusFailed || status == StatusCancelled
}

func normalizePhase(phase string, status Status) string {
	switch phase {
	case PhaseQueued, PhaseConnecting, PhasePreparing, PhaseScanning, PhaseCopying, PhaseVerifying, PhaseCompleted, PhaseCancelled, PhaseFailed:
		return phase
	case "Подключение":
		return PhaseConnecting
	case "Подготовка":
		return PhasePreparing
	case "Сканирование":
		return PhaseScanning
	case "Копирование", "Копирование папок":
		return PhaseCopying
	case "Проверка":
		return PhaseVerifying
	case "":
		return ""
	default:
		if status == StatusRunning {
			return PhasePreparing
		}
		return phase
	}
}

func clampProgress(progress int) int {
	if progress < 0 {
		return 0
	}
	if progress > 100 {
		return 100
	}
	return progress
}

func cleanupInterval(ttl time.Duration) time.Duration {
	if ttl <= 0 {
		return time.Hour
	}
	interval := ttl / 2
	if interval > time.Minute {
		return time.Minute
	}
	if interval < time.Millisecond {
		return time.Millisecond
	}
	return interval
}

func newID() string {
	data := make([]byte, 8)
	if _, err := rand.Read(data); err != nil {
		return time.Now().UTC().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(data)
}
