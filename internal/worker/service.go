package worker

import (
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

const (
	maxServiceRequestBytes = 64 << 10
	defaultServicePoll     = 250 * time.Millisecond
	defaultServiceRetry    = 5 * time.Second
	defaultServiceAttempts = 3
)

type ServiceConfig struct {
	DatabasePath      string
	PrivateKey        string
	Token             string
	Engine            migrator.Engine
	MaxConcurrent     int
	MaxAttempts       int
	LeaseTTL          time.Duration
	PollInterval      time.Duration
	RetryBase         time.Duration
	MaxJobs           int
	JobTimeout        time.Duration
	OperationTimeout  time.Duration
	ResumeInterrupted bool // Enable only when a supervisor kills the entire process tree.
}

// Service is the independently deployable credential boundary. Its private
// recipient key never needs to enter the API process or API database.
type Service struct {
	config    ServiceConfig
	opener    *credentials.RecipientOpener
	envelopes *credentials.SQLiteStore
	jobs      *serviceStore
	tokenHash [32]byte

	mu           sync.Mutex
	running      map[string]context.CancelFunc
	ctx          context.Context
	cancel       context.CancelFunc
	wake         chan struct{}
	slots        chan struct{}
	wg           sync.WaitGroup
	shutdownOnce sync.Once
	shutdownDone chan struct{}
	shutdownErr  error
	ready        bool
	stopping     bool
}

func NewService(config ServiceConfig) (*Service, error) {
	if config.Engine == nil {
		return nil, errors.New("worker service engine is required")
	}
	if config.MaxConcurrent < 1 {
		config.MaxConcurrent = 1
	}
	if config.MaxAttempts < 1 {
		config.MaxAttempts = defaultServiceAttempts
	}
	if config.MaxAttempts > 10 || config.MaxConcurrent > 64 {
		return nil, errors.New("worker concurrency or retry limit is too large")
	}
	if config.MaxJobs <= 0 {
		config.MaxJobs = 1024
	}
	if config.JobTimeout <= 0 {
		config.JobTimeout = 24 * time.Hour
	}
	if config.OperationTimeout <= 0 {
		config.OperationTimeout = 30 * time.Second
	}
	if config.LeaseTTL <= 0 {
		config.LeaseTTL = 30 * time.Second
	}
	if config.PollInterval <= 0 {
		config.PollInterval = defaultServicePoll
	}
	if config.RetryBase <= 0 {
		config.RetryBase = defaultServiceRetry
	}
	privateKey, err := credentials.ParseRecipientPrivateKey(strings.TrimSpace(config.PrivateKey))
	if err != nil {
		return nil, err
	}
	defer clearBytes(privateKey)
	opener, err := credentials.NewRecipientOpener(privateKey)
	if err != nil {
		return nil, err
	}
	token, err := parseWorkerToken(config.Token)
	if err != nil {
		opener.Destroy()
		return nil, err
	}
	defer clearBytes(token)
	jobStore, err := openServiceStore(config.DatabasePath)
	if err != nil {
		opener.Destroy()
		return nil, err
	}
	envelopeStore, err := credentials.OpenSQLiteStore(config.DatabasePath)
	if err != nil {
		_ = jobStore.close()
		opener.Destroy()
		return nil, err
	}
	config.PrivateKey = ""
	config.Token = ""
	return &Service{
		config:       config,
		opener:       opener,
		envelopes:    envelopeStore,
		jobs:         jobStore,
		tokenHash:    sha256.Sum256(token),
		running:      make(map[string]context.CancelFunc),
		wake:         make(chan struct{}, 1),
		slots:        make(chan struct{}, config.MaxConcurrent),
		shutdownDone: make(chan struct{}),
	}, nil
}

func (service *Service) Start(parent context.Context) error {
	service.mu.Lock()
	if service.ctx != nil || service.stopping {
		service.mu.Unlock()
		return errors.New("worker service is already started")
	}
	service.ctx, service.cancel = context.WithCancel(parent)
	if err := service.jobs.recoverInterrupted(service.ctx, time.Now(), service.config.MaxAttempts, service.config.ResumeInterrupted); err != nil {
		service.cancel()
		service.mu.Unlock()
		return err
	}
	service.wg.Add(1)
	service.ready = true
	service.mu.Unlock()
	go service.coordinator()
	service.signal()
	return nil
}

func (service *Service) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", service.health)
	mux.HandleFunc("/v1/jobs/", service.jobsEndpoint)
	mux.HandleFunc("/v1/operations/", service.operationEndpoint)
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("X-Content-Type-Options", "nosniff")
		response.Header().Set("Cache-Control", "no-store")
		service.mu.Lock()
		if !service.ready || service.stopping {
			service.mu.Unlock()
			response.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		service.wg.Add(1)
		service.mu.Unlock()
		defer service.wg.Done()
		ctx, cancel := context.WithCancel(request.Context())
		stop := context.AfterFunc(service.ctx, cancel)
		defer stop()
		defer cancel()
		request = request.WithContext(ctx)
		mux.ServeHTTP(response, request)
	})
}

func (service *Service) Shutdown(ctx context.Context) error {
	service.shutdownOnce.Do(func() {
		service.mu.Lock()
		service.stopping = true
		if service.cancel != nil {
			service.cancel()
		}
		for _, cancel := range service.running {
			cancel()
		}
		service.mu.Unlock()
		go func() {
			service.wg.Wait()
			service.opener.Destroy()
			service.shutdownErr = errors.Join(service.envelopes.Close(), service.jobs.close())
			close(service.shutdownDone)
		}()
	})
	select {
	case <-service.shutdownDone:
		return service.shutdownErr
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (service *Service) coordinator() {
	defer service.wg.Done()
	ticker := time.NewTicker(service.config.PollInterval)
	defer ticker.Stop()
	cleanupTicker := time.NewTicker(time.Minute)
	defer cleanupTicker.Stop()
	for {
		select {
		case <-service.ctx.Done():
			return
		case <-ticker.C:
		case <-service.wake:
		case <-cleanupTicker.C:
			cleanupContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			err := service.jobs.maintain(cleanupContext, time.Now())
			cancel()
			if err != nil {
				log.Printf("worker envelope cleanup failed: %v", err)
			}
		}
		service.launchAvailable()
	}
}

func (service *Service) launchAvailable() {
	for {
		select {
		case service.slots <- struct{}{}:
		case <-service.ctx.Done():
			return
		default:
			return
		}
		jobID, ok, err := service.jobs.claimNext(service.ctx, time.Now(), service.config.MaxAttempts)
		if err != nil || !ok {
			<-service.slots
			if err != nil && service.ctx.Err() == nil {
				log.Printf("worker queue claim failed: %v", err)
			}
			return
		}
		service.wg.Add(1)
		go service.runJob(jobID)
	}
}

func (service *Service) runJob(jobID string) {
	defer service.wg.Done()
	defer func() {
		<-service.slots
		service.signal()
	}()
	migrationContext, cancelMigration := context.WithTimeout(service.ctx, service.config.JobTimeout)
	service.mu.Lock()
	snapshot, exists, stateErr := service.jobs.get(migrationContext, jobID, 0)
	if stateErr == nil && exists && snapshot.Status == remoteStatusRunning {
		service.running[jobID] = cancelMigration
	}
	service.mu.Unlock()
	defer func() {
		cancelMigration()
		service.mu.Lock()
		delete(service.running, jobID)
		service.mu.Unlock()
	}()
	if stateErr != nil || !exists || snapshot.Status != remoteStatusRunning {
		return
	}
	workerID, err := randomWorkerID()
	if err != nil {
		service.retryOrFail(jobID, err, false)
		return
	}
	envelope, err := service.envelopes.Lease(migrationContext, jobID, workerID, time.Now(), service.config.LeaseTTL)
	if err != nil {
		if errors.Is(err, credentials.ErrLeased) {
			_ = service.jobs.requeue(context.Background(), jobID, time.Now().Add(service.config.LeaseTTL), true)
			return
		}
		service.retryOrFail(jobID, err, false)
		return
	}
	defer clearEnvelope(&envelope)
	request, err := service.opener.Open(jobID, envelope)
	if err != nil {
		service.finishFailure(jobID, "protected credential envelope could not be opened")
		return
	}
	defer clearRequest(&request)
	if request.Options.StrictMirror {
		if err := service.jobs.disableRetry(migrationContext, jobID); err != nil {
			service.finishFailure(jobID, "could not persist destructive operation guard")
			return
		}
	}
	// Never let a migration outlive the credential envelope, even if renewal is delayed.
	migrationContext, cancelExpiry := context.WithDeadline(migrationContext, envelope.ExpiresAt)
	defer cancelExpiry()
	if migrationContext.Err() != nil {
		service.finishFailure(jobID, "migration expired or cancelled before execution")
		return
	}
	leaseErrors := make(chan error, 1)
	go keepLease(migrationContext, service.envelopes, jobID, workerID, service.config.LeaseTTL, leaseErrors, cancelMigration)
	result, migrationErr := service.config.Engine.Migrate(migrationContext, request, func(event migrator.Event) {
		event = sanitizeServiceEvent(event, request)
		if event.Timestamp.IsZero() {
			event.Timestamp = time.Now().UTC()
		}
		writeContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := service.jobs.appendEvent(writeContext, jobID, event, time.Now())
		cancel()
		if err != nil {
			cancelMigration()
		}
	})
	cancelMigration()
	leaseErr := <-leaseErrors
	// The engine and its lease-renewal goroutine have stopped before releasing ownership.
	if err := service.envelopes.ReleaseLease(context.Background(), jobID, workerID); err != nil {
		service.finishFailure(jobID, "credential lease could not be released")
		return
	}
	if service.ctx.Err() != nil {
		if request.Options.StrictMirror {
			service.finishFailure(jobID, "strict mirror interrupted; manual review required")
		} else {
			service.requeueIfPresent(jobID, time.Now(), true)
		}
		return
	}
	if current, exists, _ := service.jobs.get(context.Background(), jobID, 0); !exists || current.Status != remoteStatusRunning {
		return
	}
	if leaseErr != nil {
		service.retryOrFail(jobID, errors.New("credential lease was lost"), false)
		return
	}
	if migrationErr != nil {
		if errors.Is(migrationErr, migrator.ErrMailboxPolicy) {
			service.finishFailure(jobID, scrubSecrets(migrationErr.Error(), request))
			return
		}
		if request.Options.StrictMirror {
			service.finishFailure(jobID, "strict mirror stopped; review destination before a new confirmed run: "+scrubSecrets(migrationErr.Error(), request))
			return
		}
		service.retryOrFail(jobID, errors.New(scrubSecrets(migrationErr.Error(), request)), false)
		return
	}
	finishContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	err = service.jobs.complete(finishContext, jobID, remoteStatusCompleted, result, "", time.Now())
	cancel()
	if err != nil {
		log.Printf("worker job %s completion failed: %v", jobID, err)
	}
}

func (service *Service) retryOrFail(jobID string, failure error, undoAttempt bool) {
	snapshot, exists, err := service.jobs.get(context.Background(), jobID, 0)
	if err != nil || !exists || snapshot.Status != remoteStatusRunning {
		return
	}
	if service.ctx.Err() != nil && !snapshot.NoRetry {
		service.requeueIfPresent(jobID, time.Now(), true)
		return
	}
	if !snapshot.NoRetry && snapshot.Attempts < service.config.MaxAttempts && service.ctx.Err() == nil {
		delay := service.config.RetryBase * time.Duration(1<<maxInt(0, snapshot.Attempts-1))
		_ = service.jobs.requeue(context.Background(), jobID, time.Now().Add(delay), undoAttempt)
		service.signal()
		return
	}
	service.finishFailure(jobID, failure.Error())
}

func (service *Service) finishFailure(jobID, message string) {
	message = truncateServiceError(message)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := service.jobs.complete(ctx, jobID, remoteStatusFailed, migrator.Result{}, message, time.Now()); err != nil {
		log.Printf("worker job %s failure state could not be stored: %v", jobID, err)
		return
	}
	_ = service.envelopes.Delete(ctx, jobID)
}

func (service *Service) requeueIfPresent(jobID string, available time.Time, undoAttempt bool) {
	if _, exists, _ := service.jobs.get(context.Background(), jobID, 0); exists {
		_ = service.jobs.requeue(context.Background(), jobID, available, undoAttempt)
	}
}

func (service *Service) signal() {
	select {
	case service.wake <- struct{}{}:
	default:
	}
}

func (service *Service) health(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		response.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	writeServiceJSON(response, http.StatusOK, map[string]any{
		"status": "ok", "engine": service.config.Engine.Name(), "available": service.config.Engine.Available(),
	})
}

func (service *Service) jobsEndpoint(response http.ResponseWriter, request *http.Request) {
	if !service.authorized(request) {
		writeServiceJSON(response, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	jobID := strings.TrimPrefix(request.URL.Path, "/v1/jobs/")
	if !validRemoteJobID(jobID) {
		writeServiceJSON(response, http.StatusBadRequest, map[string]string{"error": "invalid job ID"})
		return
	}
	switch request.Method {
	case http.MethodPut:
		service.acceptJob(response, request, jobID)
	case http.MethodPost:
		_, exists, err := service.jobs.get(request.Context(), jobID, 0)
		if err != nil {
			response.WriteHeader(http.StatusInternalServerError)
			return
		}
		if !exists {
			response.WriteHeader(http.StatusNotFound)
			return
		}
		if err := service.jobs.activate(request.Context(), jobID, time.Now()); err != nil {
			response.WriteHeader(http.StatusInternalServerError)
			return
		}
		service.signal()
		response.WriteHeader(http.StatusAccepted)
	case http.MethodGet:
		after, err := strconv.ParseUint(request.URL.Query().Get("after"), 10, 64)
		if request.URL.Query().Get("after") == "" {
			after, err = 0, nil
		}
		if err != nil {
			writeServiceJSON(response, http.StatusBadRequest, map[string]string{"error": "invalid event cursor"})
			return
		}
		snapshot, exists, err := service.jobs.get(request.Context(), jobID, after)
		if err != nil {
			writeServiceJSON(response, http.StatusInternalServerError, map[string]string{"error": "worker state unavailable"})
			return
		}
		if !exists {
			writeServiceJSON(response, http.StatusNotFound, map[string]string{"error": "job not found"})
			return
		}
		writeServiceJSON(response, http.StatusOK, snapshot)
	case http.MethodDelete:
		service.mu.Lock()
		cancel := service.running[jobID]
		if cancel != nil {
			cancel()
		}
		ctx, stop := context.WithTimeout(context.Background(), 5*time.Second)
		err := service.jobs.complete(ctx, jobID, remoteStatusCancelled, migrator.Result{}, "", time.Now())
		stop()
		service.mu.Unlock()
		if err != nil {
			writeServiceJSON(response, http.StatusInternalServerError, map[string]string{"error": "job deletion failed"})
			return
		}
		response.WriteHeader(http.StatusNoContent)
	default:
		response.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (service *Service) acceptJob(response http.ResponseWriter, request *http.Request, jobID string) {
	var envelope credentials.Envelope
	if err := decodeServiceJSON(request.Body, &envelope); err != nil || envelope.JobID != jobID || envelope.Version != credentials.RecipientEnvelopeVersion {
		writeServiceJSON(response, http.StatusBadRequest, map[string]string{"error": "invalid credential envelope"})
		return
	}
	defer clearEnvelope(&envelope)
	if err := service.opener.ValidateEnvelope(jobID, envelope); err != nil {
		writeServiceJSON(response, http.StatusBadRequest, map[string]string{"error": "credential envelope authentication failed"})
		return
	}
	ctx, cancel := context.WithTimeout(request.Context(), 5*time.Second)
	defer cancel()
	reserved, err := service.jobs.admit(ctx, envelope, time.Now(), service.config.MaxJobs)
	if errors.Is(err, errQueueFull) {
		response.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	if err != nil {
		writeServiceJSON(response, http.StatusInternalServerError, map[string]string{"error": "worker job could not be reserved"})
		return
	}
	if !reserved {
		writeServiceJSON(response, http.StatusConflict, map[string]string{"error": "job already exists"})
		return
	}
	response.WriteHeader(http.StatusAccepted)
}

func (service *Service) operationEndpoint(response http.ResponseWriter, request *http.Request) {
	if !service.authorized(request) {
		writeServiceJSON(response, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	if request.Method != http.MethodPost {
		response.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	operation := strings.TrimPrefix(request.URL.Path, "/v1/operations/")
	if operation != operationTestConnection && operation != operationListFolders {
		writeServiceJSON(response, http.StatusNotFound, map[string]string{"error": "operation not found"})
		return
	}
	// A finishing response or an empty queue scan can briefly own a slot.
	// Give it a bounded chance to release instead of reporting false saturation.
	slotWait := time.NewTimer(250 * time.Millisecond)
	defer slotWait.Stop()
	select {
	case service.slots <- struct{}{}:
		defer func() { <-service.slots; service.signal() }()
	case <-request.Context().Done():
		return
	case <-slotWait.C:
		response.Header().Set("Retry-After", "1")
		response.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(request.Context(), service.config.OperationTimeout)
	defer cancel()
	var envelope credentials.Envelope
	if err := decodeServiceJSON(request.Body, &envelope); err != nil || envelope.Version != credentials.RecipientEnvelopeVersion {
		writeServiceJSON(response, http.StatusBadRequest, map[string]string{"error": "invalid credential envelope"})
		return
	}
	defer clearEnvelope(&envelope)
	var payload transientPayload
	defer func() { payload.Endpoint.Password = "" }()
	if err := service.opener.OpenJSON(envelope.JobID, envelope, &payload); err != nil || payload.Operation != operation || payload.Endpoint.Validate() != nil {
		writeServiceJSON(response, http.StatusBadRequest, map[string]string{"error": "credential envelope authentication failed"})
		return
	}
	response.Header().Set("Content-Type", "application/x-ndjson")
	encoder := &protocolEncoder{encoder: json.NewEncoder(response)}
	switch operation {
	case operationTestConnection:
		err := service.config.Engine.TestConnection(ctx, payload.Endpoint, func(event migrator.Event) {
			event = sanitizeServiceEvent(event, migrator.Request{Source: payload.Endpoint})
			_ = encoder.write(protocolMessage{Type: messageEvent, Event: &event})
		})
		if err != nil {
			_ = encoder.write(protocolMessage{Type: messageError, Error: scrubEndpointSecret(err.Error(), payload.Endpoint)})
			return
		}
		_ = encoder.write(protocolMessage{Type: messageResult, Result: &migrator.Result{}})
	case operationListFolders:
		lister, ok := service.config.Engine.(migrator.FolderLister)
		if !ok {
			_ = encoder.write(protocolMessage{Type: messageError, Error: "folder listing is unavailable"})
			return
		}
		folders, err := lister.ListFolders(ctx, payload.Endpoint)
		if err != nil {
			_ = encoder.write(protocolMessage{Type: messageError, Error: scrubEndpointSecret(err.Error(), payload.Endpoint)})
			return
		}
		if len(folders) > 5000 {
			_ = encoder.write(protocolMessage{Type: messageError, Error: "too many folders"})
			return
		}
		for index := range folders {
			folders[index].Name = scrubEndpointSecret(folders[index].Name, payload.Endpoint)
			folders[index].Delimiter = scrubEndpointSecret(folders[index].Delimiter, payload.Endpoint)
			if len(folders[index].Name) > 1024 || len(folders[index].Delimiter) > 16 {
				_ = encoder.write(protocolMessage{Type: messageError, Error: "invalid folder metadata"})
				return
			}
		}
		encodedFolders, err := json.Marshal(folders)
		if err != nil || len(encodedFolders) > maxRemoteResponseBytes/2 {
			_ = encoder.write(protocolMessage{Type: messageError, Error: "folder response too large"})
			return
		}
		_ = encoder.write(protocolMessage{Type: messageFolders, Folders: folders})
	}
}

func (service *Service) authorized(request *http.Request) bool {
	const prefix = "Bearer "
	value := request.Header.Get("Authorization")
	if !strings.HasPrefix(value, prefix) || len(value) > 512 {
		return false
	}
	token, err := parseWorkerToken(strings.TrimSpace(strings.TrimPrefix(value, prefix)))
	if err != nil {
		return false
	}
	defer clearBytes(token)
	digest := sha256.Sum256(token)
	return subtle.ConstantTimeCompare(digest[:], service.tokenHash[:]) == 1
}

func parseWorkerToken(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(value)
	}
	if err != nil || len(decoded) < 32 || len(decoded) > 128 {
		clearBytes(decoded)
		return nil, errors.New("MOVEMAILBOX_WORKER_TOKEN must be base64 for 32 to 128 random bytes")
	}
	return decoded, nil
}

func decodeServiceJSON(reader io.Reader, target any) error {
	payload, err := io.ReadAll(io.LimitReader(reader, maxServiceRequestBytes+1))
	if err != nil || len(payload) == 0 || len(payload) > maxServiceRequestBytes {
		clearBytes(payload)
		return errors.New("request JSON exceeds the allowed size")
	}
	defer clearBytes(payload)
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return errors.New("request must contain one JSON value")
	}
	return nil
}

func writeServiceJSON(response http.ResponseWriter, status int, value any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	_ = json.NewEncoder(response).Encode(value)
}

func truncateServiceError(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "migration failed"
	}
	if len(value) > 4096 {
		return value[:4096]
	}
	return value
}

func maxInt(left, right int) int {
	if left > right {
		return left
	}
	return right
}

func sanitizeServiceEvent(event migrator.Event, request migrator.Request) migrator.Event {
	bound := func(value string, limit int) string {
		value = scrubSecrets(value, request)
		if len(value) > limit {
			value = value[:limit]
		}
		return value
	}
	event.Message = bound(event.Message, 4096)
	event.CurrentFolder = bound(event.CurrentFolder, 1024)
	event.Type = bound(event.Type, 64)
	event.Phase = bound(event.Phase, 64)
	return event
}
