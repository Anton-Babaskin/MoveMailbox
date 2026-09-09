package migrator

import (
	"context"
	"errors"
	"math"
	"slices"
	"testing"
)

func TestWorkerBudgetArgumentsAreInclusiveAndOverflowSafe(t *testing.T) {
	for _, tc := range []struct {
		limit int64
		want  string
	}{
		{0, ""}, {500, "501"}, {math.MaxInt64, "9223372036854775807"},
	} {
		ctx := context.WithValue(context.Background(), transferBudgetKey{}, tc.limit)
		args := buildExecutionArgs(ctx, testRequest())
		index := slices.Index(args, "--exitwhenover")
		if tc.want == "" {
			if index != -1 {
				t.Fatal("unlimited local execution unexpectedly capped")
			}
		} else if index == -1 || args[index+1] != tc.want {
			t.Fatalf("bad threshold: %v", args)
		}
	}
}

type runtimeGrowthEngine struct {
	DemoEngine
	limit int64
}

func (*runtimeGrowthEngine) EstimateMailbox(context.Context, Endpoint) (MailboxEstimate, error) {
	return MailboxEstimate{Bytes: 400, Messages: 1, Folders: 1}, nil
}
func (e *runtimeGrowthEngine) Migrate(ctx context.Context, _ Request, _ func(Event)) (Result, error) {
	e.limit = transferBudget(ctx)
	// Growth after both admission checks, reported by the executing engine.
	return Result{Transferred: 1, Bytes: 600}, nil
}
func TestGrowthDuringTransferCannotReportSuccess(t *testing.T) {
	engine := &runtimeGrowthEngine{}
	result, err := (QuotaEngine{Engine: engine, MaxMailboxBytes: 500}).Migrate(context.Background(), testRequest(), nil)
	if !errors.Is(err, ErrMailboxPolicy) || engine.limit != 500 || result.Bytes != 600 {
		t.Fatalf("result=%+v budget=%d err=%v", result, engine.limit, err)
	}
}
