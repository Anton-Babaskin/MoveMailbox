package api

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestLimiterBoundsDistinctClientsAndRecovers(t *testing.T) {
	limiter := newRequestLimiter()
	now := time.Date(2026, 9, 14, 12, 0, 0, 0, time.UTC)
	const capacity = 8192
	for i := 0; i < capacity; i++ {
		if ok, _ := limiter.allow(fmt.Sprint(i), 2, now); !ok {
			t.Fatal("premature capacity rejection")
		}
	}
	if ok, retry := limiter.allow("overflow", 2, now); ok || retry != time.Minute {
		t.Fatal("distinct client table must reject overflow with bounded retry")
	}
	if len(limiter.windows) != capacity {
		t.Fatal("client table exceeded memory bound")
	}
	if ok, _ := limiter.allow("0", 2, now); !ok {
		t.Fatal("capacity displaced existing client")
	}
	if ok, _ := limiter.allow("0", 2, now); ok {
		t.Fatal("existing client quota was reset")
	}
	if ok, _ := limiter.allow("overflow", 2, now.Add(time.Minute)); !ok {
		t.Fatal("capacity did not recover next minute")
	}
	if len(limiter.windows) != 1 {
		t.Fatal("expired windows were retained")
	}
}

func TestLimiterConcurrentAllowance(t *testing.T) {
	limiter := newRequestLimiter()
	now := time.Date(2026, 9, 14, 12, 0, 0, 0, time.UTC)
	var wg sync.WaitGroup
	var accepted atomic.Int32
	for i := 0; i < 256; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if ok, _ := limiter.allow("shared-peer", 32, now); ok {
				accepted.Add(1)
			}
		}()
	}
	wg.Wait()
	if accepted.Load() != 32 {
		t.Fatalf("accepted %d, want 32", accepted.Load())
	}
}

func TestLimiterDelayedRequestDoesNotResetNewWindow(t *testing.T) {
	limiter := newRequestLimiter()
	now := time.Date(2026, 9, 14, 12, 1, 0, 0, time.UTC)
	limiter.allow("peer", 1, now)
	if ok, _ := limiter.allow("peer", 1, now.Add(-time.Second)); ok {
		t.Fatal("delayed timestamp reset current quota")
	}
	if ok, _ := limiter.allow("peer", 1, now); ok {
		t.Fatal("quota was lost")
	}
}
