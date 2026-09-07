package worker

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

const maxRemoteResponseBytes = 8 << 20

type RemoteConfig struct {
	URL           string
	PublicKey     string
	Token         string
	CredentialTTL time.Duration
	PollInterval  time.Duration
	HTTPClient    *http.Client
	AllowHTTP     bool // Explicit opt-in for a trusted private container network.
}

// RemoteRunner lets the API submit recipient-encrypted work without holding
// any key capable of decrypting it.
type RemoteRunner struct {
	baseURL      string
	token        []byte
	sealer       *credentials.RecipientSealer
	client       *http.Client
	pollInterval time.Duration
	mu           sync.Mutex
}

func NewRemoteRunner(config RemoteConfig) (*RemoteRunner, error) {
	parsedURL, err := url.Parse(strings.TrimSpace(config.URL))
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") || parsedURL.Host == "" || parsedURL.User != nil || parsedURL.RawQuery != "" || parsedURL.Fragment != "" {
		return nil, errors.New("MOVEMAILBOX_WORKER_URL must be an absolute http or https URL without credentials, query, or fragment")
	}
	if parsedURL.Scheme == "http" && !config.AllowHTTP {
		ip := net.ParseIP(parsedURL.Hostname())
		if parsedURL.Hostname() != "localhost" && (ip == nil || !ip.IsLoopback()) {
			return nil, errors.New("worker transport requires HTTPS; allow HTTP explicitly only on a trusted private network")
		}
	}
	publicKey, err := credentials.ParseRecipientPublicKey(strings.TrimSpace(config.PublicKey))
	if err != nil {
		return nil, err
	}
	defer clearBytes(publicKey)
	if config.CredentialTTL == 0 {
		config.CredentialTTL = defaultCredentialTTL
	}
	sealer, err := credentials.NewRecipientSealer(publicKey, config.CredentialTTL)
	if err != nil {
		return nil, err
	}
	token, err := parseWorkerToken(config.Token)
	if err != nil {
		return nil, err
	}
	if config.PollInterval <= 0 {
		config.PollInterval = defaultServicePoll
	}
	client := config.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 35 * time.Second}
	}
	clientCopy := *client
	clientCopy.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	return &RemoteRunner{
		baseURL:      strings.TrimRight(parsedURL.String(), "/"),
		token:        token,
		sealer:       sealer,
		client:       &clientCopy,
		pollInterval: config.PollInterval,
	}, nil
}

func (*RemoteRunner) Name() string { return "imapsync-remote-worker" }

func (*RemoteRunner) ExecutionMode() string { return "remote-worker" }

func (runner *RemoteRunner) Available() bool {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, runner.baseURL+"/healthz", nil)
	if err != nil {
		return false
	}
	response, err := runner.client.Do(request)
	if err != nil {
		return false
	}
	defer response.Body.Close()
	var health struct {
		Status    string `json:"status"`
		Available bool   `json:"available"`
	}
	return response.StatusCode == http.StatusOK && json.NewDecoder(io.LimitReader(response.Body, 64<<10)).Decode(&health) == nil && health.Status == "ok" && health.Available
}

func (runner *RemoteRunner) Prepare(ctx context.Context, jobID string, request migrator.Request) error {
	if !validRemoteJobID(jobID) {
		return errors.New("invalid remote worker job ID")
	}
	envelope, err := runner.sealer.Seal(jobID, request)
	if err != nil {
		return err
	}
	defer clearEnvelope(&envelope)
	payload, err := json.Marshal(envelope)
	if err != nil {
		return fmt.Errorf("encode remote credential envelope: %w", err)
	}
	defer clearBytes(payload)
	response, err := runner.do(ctx, http.MethodPut, "/v1/jobs/"+jobID, bytes.NewReader(payload), "application/json")
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusAccepted {
		return remoteHTTPError(response)
	}
	return nil
}

func (runner *RemoteRunner) Run(ctx context.Context, jobID string, emit func(migrator.Event)) (migrator.Result, error) {
	if !validRemoteJobID(jobID) {
		return migrator.Result{}, errors.New("invalid remote worker job ID")
	}
	after := uint64(0)
	ticker := time.NewTicker(runner.pollInterval)
	defer ticker.Stop()
	// Retrying this activation is safe: PUT only stages the encrypted payload;
	// POST transitions the same persisted job, never creates a second migration.
	for {
		err := runner.activate(ctx, jobID)
		if err == nil {
			break
		}
		if !retryableRemoteError(err) {
			return migrator.Result{}, err
		}
		select {
		case <-ctx.Done():
			return migrator.Result{}, ctx.Err()
		case <-ticker.C:
		}
	}
	for {
		snapshot, exists, err := runner.snapshot(ctx, jobID, after)
		if err != nil {
			if retryableRemoteError(err) {
				select {
				case <-ctx.Done():
					return migrator.Result{}, ctx.Err()
				case <-ticker.C:
					continue
				}
			}
			return migrator.Result{}, err
		}
		if !exists {
			return migrator.Result{}, errors.New("remote worker job not found")
		}
		for _, item := range snapshot.Events {
			if item.Sequence <= after || item.Sequence > snapshot.Sequence {
				return migrator.Result{}, fmt.Errorf("remote worker returned invalid event sequence %d after %d (snapshot %d)", item.Sequence, after, snapshot.Sequence)
			}
			after = item.Sequence
			if emit != nil {
				emit(item.Event)
			}
		}
		switch snapshot.Status {
		case remoteStatusQueued, remoteStatusRunning:
		case remoteStatusCompleted:
			if snapshot.Result == nil {
				return migrator.Result{}, errors.New("remote worker completed without a result")
			}
			return *snapshot.Result, nil
		case remoteStatusFailed:
			if strings.TrimSpace(snapshot.Error) == "" {
				return migrator.Result{}, errors.New("remote worker migration failed")
			}
			return migrator.Result{}, errors.New(snapshot.Error)
		case remoteStatusCancelled:
			return migrator.Result{}, context.Canceled
		default:
			return migrator.Result{}, errors.New("remote worker returned an unknown status")
		}
		select {
		case <-ctx.Done():
			return migrator.Result{}, ctx.Err()
		case <-ticker.C:
		}
	}
}

func (runner *RemoteRunner) Recoverable(ctx context.Context, jobID string) (bool, error) {
	_, exists, err := runner.snapshot(ctx, jobID, 0)
	// A temporary outage is not evidence that the durable job disappeared.
	// Run will reconnect without submitting new credentials or duplicating work.
	if retryableRemoteError(err) {
		return true, nil
	}
	return exists, err
}

func (runner *RemoteRunner) Delete(ctx context.Context, jobID string) error {
	if !validRemoteJobID(jobID) {
		return errors.New("invalid remote worker job ID")
	}
	response, err := runner.do(ctx, http.MethodDelete, "/v1/jobs/"+jobID, nil, "")
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNoContent || response.StatusCode == http.StatusNotFound {
		return nil
	}
	return remoteHTTPError(response)
}

func (*RemoteRunner) CleanupExpired(context.Context) (int64, error) { return 0, nil }

func (*RemoteRunner) SurvivesManagerShutdown() bool { return true }

func (runner *RemoteRunner) Close() error {
	runner.mu.Lock()
	defer runner.mu.Unlock()
	clearBytes(runner.token)
	runner.token = nil
	return nil
}

func (runner *RemoteRunner) TestConnection(ctx context.Context, endpoint migrator.Endpoint, emit func(migrator.Event)) error {
	if err := endpoint.Validate(); err != nil {
		return err
	}
	_, err := runner.runTransient(ctx, operationTestConnection, endpoint, emit)
	return err
}

func (runner *RemoteRunner) ListFolders(ctx context.Context, endpoint migrator.Endpoint) ([]migrator.Folder, error) {
	if err := endpoint.Validate(); err != nil {
		return nil, err
	}
	outcome, err := runner.runTransient(ctx, operationListFolders, endpoint, nil)
	if err != nil {
		return nil, err
	}
	return outcome.folders, nil
}

func (*RemoteRunner) Migrate(context.Context, migrator.Request, func(migrator.Event)) (migrator.Result, error) {
	return migrator.Result{}, errors.New("remote migrations require a prepared recipient envelope")
}

func (runner *RemoteRunner) runTransient(ctx context.Context, operation string, endpoint migrator.Endpoint, emit func(migrator.Event)) (protocolOutcome, error) {
	envelopeID, err := randomOperationID()
	if err != nil {
		return protocolOutcome{}, err
	}
	payload := transientPayload{Operation: operation, Endpoint: endpoint}
	envelope, err := runner.sealer.SealJSON(envelopeID, payload)
	payload.Endpoint.Password = ""
	if err != nil {
		return protocolOutcome{}, err
	}
	defer clearEnvelope(&envelope)
	encoded, err := json.Marshal(envelope)
	if err != nil {
		return protocolOutcome{}, err
	}
	defer clearBytes(encoded)
	response, err := runner.do(ctx, http.MethodPost, "/v1/operations/"+operation, bytes.NewReader(encoded), "application/json")
	if err != nil {
		return protocolOutcome{}, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return protocolOutcome{}, remoteHTTPError(response)
	}
	return consumeProtocol(io.LimitReader(response.Body, maxRemoteResponseBytes), emit)
}

func (runner *RemoteRunner) snapshot(ctx context.Context, jobID string, after uint64) (remoteJobSnapshot, bool, error) {
	if !validRemoteJobID(jobID) {
		return remoteJobSnapshot{}, false, errors.New("invalid remote worker job ID")
	}
	path := fmt.Sprintf("/v1/jobs/%s?after=%d", jobID, after)
	response, err := runner.do(ctx, http.MethodGet, path, nil, "")
	if err != nil {
		return remoteJobSnapshot{}, false, err
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusNotFound {
		return remoteJobSnapshot{}, false, nil
	}
	if response.StatusCode != http.StatusOK {
		return remoteJobSnapshot{}, false, remoteHTTPError(response)
	}
	var snapshot remoteJobSnapshot
	decoder := json.NewDecoder(io.LimitReader(response.Body, maxRemoteResponseBytes))
	if err := decoder.Decode(&snapshot); err != nil {
		return remoteJobSnapshot{}, false, &remoteRequestError{retryable: true, message: "remote worker returned incomplete state"}
	}
	if snapshot.ID != jobID {
		return remoteJobSnapshot{}, false, errors.New("remote worker returned a mismatched job")
	}
	return snapshot, true, nil
}

func (runner *RemoteRunner) do(ctx context.Context, method, path string, body io.Reader, contentType string) (*http.Response, error) {
	request, err := http.NewRequestWithContext(ctx, method, runner.baseURL+path, body)
	if err != nil {
		return nil, err
	}
	runner.mu.Lock()
	request.Header.Set("Authorization", "Bearer "+base64.StdEncoding.EncodeToString(runner.token))
	runner.mu.Unlock()
	if contentType != "" {
		request.Header.Set("Content-Type", contentType)
	}
	response, err := runner.client.Do(request)
	if err != nil {
		return nil, &remoteRequestError{retryable: true, message: "remote worker unavailable"}
	}
	return response, nil
}

func remoteHTTPError(response *http.Response) error {
	var payload struct {
		Error string `json:"error"`
	}
	_ = json.NewDecoder(io.LimitReader(response.Body, 64<<10)).Decode(&payload)
	if strings.TrimSpace(payload.Error) == "" {
		payload.Error = http.StatusText(response.StatusCode)
	}
	return &remoteRequestError{retryable: response.StatusCode >= 500 || response.StatusCode == 429, message: "remote worker rejected request: " + truncateServiceError(payload.Error)}
}

func (runner *RemoteRunner) activate(ctx context.Context, jobID string) error {
	response, err := runner.do(ctx, http.MethodPost, "/v1/jobs/"+jobID, nil, "")
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusAccepted {
		return remoteHTTPError(response)
	}
	return nil
}

type remoteRequestError struct {
	retryable bool
	message   string
}

func (err *remoteRequestError) Error() string { return err.message }
func retryableRemoteError(err error) bool {
	var requestErr *remoteRequestError
	return errors.As(err, &requestErr) && requestErr.retryable
}
