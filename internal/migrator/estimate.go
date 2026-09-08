package migrator

import (
	"context"
	"errors"
	"fmt"
	"math"
	"slices"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
)

// MailboxEstimate counts every selectable folder, not the migration selection.
// It is a point-in-time inventory, not a lock against subsequent incoming mail.
type MailboxEstimate struct {
	Bytes    int64
	Messages int64
	Folders  int
}

type MailboxEstimator interface {
	EstimateMailbox(context.Context, Endpoint) (MailboxEstimate, error)
}

var ErrMailboxPolicy = errors.New("mailbox size policy rejected the job")

// QuotaEngine is a worker-owned admission policy. The client cannot override it.
// Zero disables the policy for explicitly unlimited self-hosted installations.
type QuotaEngine struct {
	Engine
	MaxMailboxBytes int64
}

func (e QuotaEngine) Migrate(ctx context.Context, request Request, emit func(Event)) (Result, error) {
	if err := request.Validate(); err != nil {
		return Result{}, err
	}
	if e.MaxMailboxBytes < 0 {
		return Result{}, fmt.Errorf("%w: invalid limit", ErrMailboxPolicy)
	}
	if e.MaxMailboxBytes > 0 {
		estimator, ok := e.Engine.(MailboxEstimator)
		if !ok {
			return Result{}, fmt.Errorf("%w: estimation unavailable", ErrMailboxPolicy)
		}
		if emit != nil {
			emit(Event{Type: "log", Phase: "estimating", Indeterminate: true, Message: "Estimating the entire source mailbox before transfer"})
		}
		estimate, err := estimator.EstimateMailbox(ctx, request.Source)
		if err != nil || estimate.Bytes < 0 || estimate.Messages < 0 || estimate.Folders < 0 {
			// Do not expose upstream errors which may contain mailbox credentials.
			return Result{}, fmt.Errorf("%w: complete mailbox size could not be verified; retry after checking the source", ErrMailboxPolicy)
		}
		if emit != nil {
			emit(Event{Type: "log", Phase: "estimating", Message: fmt.Sprintf("Entire source: %d bytes, %d messages, %d folders; limit: %d bytes", estimate.Bytes, estimate.Messages, estimate.Folders, e.MaxMailboxBytes)})
		}
		if estimate.Bytes > e.MaxMailboxBytes {
			return Result{}, fmt.Errorf("%w: source is %d bytes; limit is %d bytes", ErrMailboxPolicy, estimate.Bytes, e.MaxMailboxBytes)
		}
		// A mailbox can receive mail while the first inventory is running. Take a
		// second read-only inventory immediately before invoking imapsync; a growth
		// race is rejected instead of silently starting above the admission limit.
		latest, err := estimator.EstimateMailbox(ctx, request.Source)
		if err != nil || latest.Bytes < 0 || latest.Messages < 0 || latest.Folders < 0 {
			return Result{}, fmt.Errorf("%w: source changed and could not be re-verified", ErrMailboxPolicy)
		}
		if emit != nil && latest != estimate {
			emit(Event{Type: "log", Phase: "estimating", Message: fmt.Sprintf("Source changed during admission; rechecked at %d bytes, %d messages, %d folders", latest.Bytes, latest.Messages, latest.Folders)})
		}
		if latest.Bytes > e.MaxMailboxBytes {
			return Result{}, fmt.Errorf("%w: source grew to %d bytes; limit is %d bytes", ErrMailboxPolicy, latest.Bytes, e.MaxMailboxBytes)
		}
	}
	if err := ctx.Err(); err != nil {
		return Result{}, err
	}
	return e.Engine.Migrate(ctx, request, emit)
}

// Preserve optional folder discovery when wrapping an engine.
func (e QuotaEngine) ListFolders(ctx context.Context, endpoint Endpoint) ([]Folder, error) {
	if lister, ok := e.Engine.(FolderLister); ok {
		return lister.ListFolders(ctx, endpoint)
	}
	return nil, errors.New("folder listing unavailable")
}

func (e ImapsyncEngine) EstimateMailbox(ctx context.Context, endpoint Endpoint) (MailboxEstimate, error) {
	var total MailboxEstimate
	err := withIMAPTimeout(ctx, endpoint, e.TLSConfig, 2*time.Minute, func(client *imapclient.Client) error {
		list := client.List("", "*", nil)
		var names []string
		seenNames := make(map[string]bool)
		for mailbox := list.Next(); mailbox != nil; mailbox = list.Next() {
			if slices.Contains(mailbox.Attrs, imap.MailboxAttrNoSelect) {
				continue
			}
			if mailbox.Mailbox == "" || seenNames[mailbox.Mailbox] {
				return errors.New("invalid folder inventory")
			}
			seenNames[mailbox.Mailbox] = true
			names = append(names, mailbox.Mailbox)
			if len(names) > 5000 {
				return errors.New("folder inventory exceeds safety limit")
			}
		}
		if err := list.Close(); err != nil {
			return err
		}
		for _, name := range names {
			selected, err := client.Select(name, &imap.SelectOptions{ReadOnly: true}).Wait()
			if err != nil {
				return err
			}
			if total.Messages+int64(selected.NumMessages) > 1000000 {
				return errors.New("message inventory exceeds safety limit")
			}
			seenUIDs := make(map[imap.UID]bool)
			for first := uint32(1); first <= selected.NumMessages; first += 500 {
				last := min(first+499, selected.NumMessages)
				messages, err := client.Fetch(imap.SeqSet{{Start: first, Stop: last}}, &imap.FetchOptions{UID: true, RFC822Size: true}).Collect()
				if err != nil {
					return err
				}
				if len(messages) != int(last-first+1) {
					return errors.New("incomplete message inventory")
				}
				for _, message := range messages {
					if message.UID == 0 || seenUIDs[message.UID] || message.RFC822Size <= 0 || message.RFC822Size > math.MaxInt64-total.Bytes {
						return errors.New("invalid message size or UID inventory")
					}
					seenUIDs[message.UID] = true
					total.Bytes += message.RFC822Size
					total.Messages++
				}
			}
			verified, err := client.Select(name, &imap.SelectOptions{ReadOnly: true}).Wait()
			if err != nil {
				return err
			}
			if selected.NumMessages != verified.NumMessages || selected.UIDValidity != verified.UIDValidity || selected.UIDNext != verified.UIDNext {
				return errors.New("mailbox changed during inventory; retry required")
			}
			total.Folders++
		}
		return nil
	})
	if err != nil {
		return MailboxEstimate{}, err
	}
	return total, nil
}

func (DemoEngine) EstimateMailbox(ctx context.Context, _ Endpoint) (MailboxEstimate, error) {
	return MailboxEstimate{Bytes: 258000000, Messages: 954, Folders: 8}, ctx.Err()
}
