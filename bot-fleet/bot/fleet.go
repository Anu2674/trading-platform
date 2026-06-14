package bot

import (
	"fmt"
	"sync"
	"time"
)

// Fleet manages all bots and coordinates the ramp-up
type Fleet struct {
	SubmissionID string
	TargetURL    string
	TotalBots    int
	MetricsChan  chan *BotMetric
}

func NewFleet(submissionID, targetURL string, totalBots int) *Fleet {
	return &Fleet{
		SubmissionID: submissionID,
		TargetURL:    targetURL,
		TotalBots:    totalBots,
		MetricsChan:  make(chan *BotMetric, totalBots*10),
	}
}

// Run starts bots with ramp-up: 10 → 100 → 1000
// Each bot sends orders continuously for `duration` seconds
func (f *Fleet) Run(duration time.Duration) {
	var wg sync.WaitGroup
	stopChan := make(chan struct{})

	stages := []struct {
		count int
		wait  time.Duration
		label string
	}{
		{10, 3 * time.Second, "Stage 1: 10 bots"},
		{100, 5 * time.Second, "Stage 2: 100 bots"},
		{f.TotalBots, 0, fmt.Sprintf("Stage 3: %d bots", f.TotalBots)},
	}

	spawnedSoFar := 0

	for _, stage := range stages {
		fmt.Printf("[Fleet] %s warming up...\n", stage.label)

		for i := spawnedSoFar; i < stage.count; i++ {
			wg.Add(1)
			b := NewBot(i, f.TargetURL, f.SubmissionID)
			go func(bot *Bot) {
				defer wg.Done()
				bot.runLoop(stopChan, f.MetricsChan)
			}(b)
		}
		spawnedSoFar = stage.count

		if stage.wait > 0 {
			time.Sleep(stage.wait)
		}
	}

	fmt.Printf("[Fleet] All %d bots running. Duration: %v\n", f.TotalBots, duration)
	time.Sleep(duration)

	close(stopChan)
	wg.Wait()
	close(f.MetricsChan)
	fmt.Println("[Fleet] Benchmark complete.")
}

// runLoop sends orders continuously until stop signal
func (b *Bot) runLoop(stop <-chan struct{}, metrics chan<- *BotMetric) {
	for {
		select {
		case <-stop:
			return
		default:
			metric, _ := b.SendOrder()
			if metric != nil {
				select {
				case metrics <- metric:
				default: // drop if channel full
				}
			}
			time.Sleep(10 * time.Millisecond) // 100 orders/sec per bot max
		}
	}
}
