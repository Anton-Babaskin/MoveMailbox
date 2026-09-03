package worker

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

const maxTransientEnvelopeBytes = 128 << 10

const (
	operationTestConnection = "test-connection"
	operationListFolders    = "list-folders"
)

type transientPayload struct {
	Operation string            `json:"operation"`
	Endpoint  migrator.Endpoint `json:"endpoint"`
}

type TransientConfig struct {
	EnvelopeID string
	Operation  string
	MasterKey  []byte
	Engine     migrator.Engine
	Input      io.Reader
	Output     io.Writer
}

// ExecuteTransient handles short synchronous credential-bearing operations in
// the isolated worker without persisting their envelope.
func ExecuteTransient(ctx context.Context, config TransientConfig) error {
	if config.Engine == nil || config.Input == nil || config.Output == nil {
		return errors.New("invalid transient worker configuration")
	}
	payloadBytes, err := io.ReadAll(io.LimitReader(config.Input, maxTransientEnvelopeBytes+1))
	if err != nil || len(payloadBytes) == 0 || len(payloadBytes) > maxTransientEnvelopeBytes {
		return errors.New("invalid transient credential envelope")
	}
	defer clearBytes(payloadBytes)
	var envelope credentials.Envelope
	if err := json.Unmarshal(payloadBytes, &envelope); err != nil {
		return errors.New("invalid transient credential envelope")
	}
	defer clearEnvelope(&envelope)
	sealer, err := credentials.NewSealer(config.MasterKey, envelope.ExpiresAt.Sub(envelope.CreatedAt))
	if err != nil {
		return err
	}
	defer sealer.Destroy()
	var payload transientPayload
	if err := sealer.OpenJSON(config.EnvelopeID, envelope, &payload); err != nil {
		return fmt.Errorf("open transient credential envelope: %w", err)
	}
	defer func() { payload.Endpoint.Password = "" }()
	if payload.Operation != config.Operation {
		return errors.New("transient worker operation mismatch")
	}
	if err := payload.Endpoint.Validate(); err != nil {
		return err
	}
	encoder := &protocolEncoder{encoder: json.NewEncoder(config.Output)}
	switch config.Operation {
	case operationTestConnection:
		operationContext, cancelOperation := context.WithCancel(ctx)
		defer cancelOperation()
		err := config.Engine.TestConnection(operationContext, payload.Endpoint, func(event migrator.Event) {
			event.Message = scrubEndpointSecret(event.Message, payload.Endpoint)
			if writeErr := encoder.write(protocolMessage{Type: messageEvent, Event: &event}); writeErr != nil {
				cancelOperation()
			}
		})
		if outputErr := encoder.err(); outputErr != nil {
			return fmt.Errorf("write isolated worker protocol: %w", outputErr)
		}
		if err != nil {
			message := scrubEndpointSecret(err.Error(), payload.Endpoint)
			_ = encoder.write(protocolMessage{Type: messageError, Error: message})
			return errors.New("connection test failed")
		}
		return encoder.write(protocolMessage{Type: messageResult, Result: &migrator.Result{}})
	case operationListFolders:
		lister, ok := config.Engine.(migrator.FolderLister)
		if !ok {
			return errors.New("migration engine does not support folder listing")
		}
		folders, err := lister.ListFolders(ctx, payload.Endpoint)
		if err != nil {
			message := scrubEndpointSecret(err.Error(), payload.Endpoint)
			_ = encoder.write(protocolMessage{Type: messageError, Error: message})
			return errors.New("folder listing failed")
		}
		return encoder.write(protocolMessage{Type: messageFolders, Folders: folders})
	default:
		return errors.New("unsupported transient worker operation")
	}
}

func scrubEndpointSecret(value string, endpoint migrator.Endpoint) string {
	if endpoint.Password == "" {
		return value
	}
	return scrubSecrets(value, migrator.Request{Source: endpoint})
}
