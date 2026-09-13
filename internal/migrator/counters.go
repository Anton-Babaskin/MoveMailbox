package migrator

// ProgressCounters are observations from the current native imapsync run.
// Totals cover its source selection, not the whole-mailbox admission inventory
// or the number of bytes still to copy. ETA remains a native estimate.
// Pointers distinguish an observed zero from an unknown value.
type ProgressCounters struct {
	TotalMessages     *int64 `json:"totalMessages,omitempty"`
	RemainingMessages *int64 `json:"remainingMessages,omitempty"`
	TotalBytes        *int64 `json:"totalBytes,omitempty"`
	ETASeconds        *int64 `json:"etaSeconds,omitempty"`
}

// Clone also rejects negative values at protocol/storage boundaries.
func (c ProgressCounters) Clone() ProgressCounters {
	c.TotalMessages = cloneCounter(c.TotalMessages)
	c.RemainingMessages = cloneCounter(c.RemainingMessages)
	c.TotalBytes = cloneCounter(c.TotalBytes)
	c.ETASeconds = cloneCounter(c.ETASeconds)
	if c.TotalMessages == nil || (c.RemainingMessages != nil && *c.RemainingMessages > *c.TotalMessages) {
		c.RemainingMessages = nil
	}
	if c.RemainingMessages == nil {
		c.ETASeconds = nil
	}
	return c
}

func cloneCounter(value *int64) *int64 {
	if value == nil || *value < 0 {
		return nil
	}
	copy := *value
	return &copy
}
