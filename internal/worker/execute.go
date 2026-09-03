package worker

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

type ExecuteConfig struct {
	JobID        string
	WorkerID     string
	DatabasePath string
	MasterKey    []byte
	LeaseTTL     time.Duration
	Engine       migrator.Engine
	Output       io.Writer
}

// Execute leases and opens one encrypted request, runs it, and emits a
// credential-free JSON-lines protocol to the API process.
func Execute(ctx context.Context, config ExecuteConfig) error {
	if strings.TrimSpace(config.JobID) == "" || strings.TrimSpace(config.WorkerID) == "" || config.Engine == nil || config.Output == nil {
		return errors.New("invalid worker configuration")
	}
	if config.LeaseTTL <= 0 {
		return errors.New("worker lease TTL must be positive")
	}
	store, err := credentials.OpenSQLiteStore(config.DatabasePath)
	if err != nil {
		return err
	}
	defer store.Close()
	envelope, err := store.Lease(ctx, config.JobID, config.WorkerID, time.Now(), config.LeaseTTL)
	if err != nil {
		return fmt.Errorf("lease credential envelope: %w", err)
	}
	defer clearEnvelope(&envelope)
	// Every normal terminal path deletes the envelope. A hard kill leaves only
	// ciphertext, which expires automatically and can be retried after its lease.
	defer func() {
		cleanupContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = store.Delete(cleanupContext, config.JobID)
	}()
	sealer, err := credentials.NewSealer(config.MasterKey, envelope.ExpiresAt.Sub(envelope.CreatedAt))
	if err != nil {
		return err
	}
	defer sealer.Destroy()
	request, err := sealer.Open(config.JobID, envelope)
	if err != nil {
		return fmt.Errorf("open credential envelope: %w", err)
	}
	defer clearRequest(&request)

	encoder := &protocolEncoder{encoder: json.NewEncoder(config.Output)}
	migrationContext, cancelMigration := context.WithCancel(ctx)
	leaseErrors := make(chan error, 1)
	go keepLease(migrationContext, store, config.JobID, config.WorkerID, config.LeaseTTL, leaseErrors, cancelMigration)
	result, migrationErr := config.Engine.Migrate(migrationContext, request, func(event migrator.Event) {
		event.Message = scrubSecrets(event.Message, request)
		if err := encoder.write(protocolMessage{Type: messageEvent, Event: &event}); err != nil {
			cancelMigration()
		}
	})
	cancelMigration()
	leaseErr := <-leaseErrors
	if leaseErr != nil {
		message := "credential lease was lost; migration stopped"
		_ = encoder.write(protocolMessage{Type: messageError, Error: message})
		return fmt.Errorf("%s: %w", message, leaseErr)
	}
	if outputErr := encoder.err(); outputErr != nil {
		return fmt.Errorf("write isolated worker protocol: %w", outputErr)
	}
	if migrationErr != nil {
		message := scrubSecrets(migrationErr.Error(), request)
		_ = encoder.write(protocolMessage{Type: messageError, Error: message})
		return fmt.Errorf("migration failed")
	}
	if err := encoder.write(protocolMessage{Type: messageResult, Result: &result}); err != nil {
		return err
	}
	return nil
}

func keepLease(ctx context.Context, store credentials.Store, jobID, workerID string, leaseTTL time.Duration, result chan<- error, cancel context.CancelFunc) {
	interval := leaseTTL / 3
	if interval < time.Second {
		interval = time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			result <- nil
			return
		case <-ticker.C:
			renewContext, renewCancel := context.WithTimeout(context.Background(), 5*time.Second)
			err := store.Renew(renewContext, jobID, workerID, time.Now(), leaseTTL)
			renewCancel()
			if err != nil {
				cancel()
				result <- err
				return
			}
		}
	}
}

type protocolEncoder struct {
	mu       sync.Mutex
	encoder  *json.Encoder
	writeErr error
}

func (encoder *protocolEncoder) write(message protocolMessage) error {
	encoder.mu.Lock()
	defer encoder.mu.Unlock()
	if encoder.writeErr != nil {
		return encoder.writeErr
	}
	encoder.writeErr = encoder.encoder.Encode(message)
	return encoder.writeErr
}

func (encoder *protocolEncoder) err() error {
	encoder.mu.Lock()
	defer encoder.mu.Unlock()
	return encoder.writeErr
}

func scrubSecrets(value string, request migrator.Request) string {
	for _, secret := range []string{request.Source.Password, request.Destination.Password} {
		if secret != "" {
			value = strings.ReplaceAll(value, secret, "[REDACTED]")
		}
	}
	return value
}

func clearRequest(request *migrator.Request) {
	request.Source.Password = ""
	request.Destination.Password = ""
}

func clearEnvelope(envelope *credentials.Envelope) {
	for index := range envelope.Nonce {
		envelope.Nonce[index] = 0
	}
	for index := range envelope.Ciphertext {
		envelope.Ciphertext[index] = 0
	}
	envelope.Nonce = nil
	envelope.Ciphertext = nil
}
