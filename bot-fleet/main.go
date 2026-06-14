package main

import (
	"fmt"
	"os"
	"sync"
	"time"

	"trading-platform/bot-fleet/bot"
	"trading-platform/bot-fleet/metrics"
)

func main() {
	submissionID := getEnv("SUBMISSION_ID", "test-submission-001")
	targetURL    := getEnv("TARGET_URL", "http://localhost:9000")
	brokerAddr   := getEnv("REDPANDA_BROKER", "localhost:9092")
	totalBots    := 1000
	duration     := 60 * time.Second

	fmt.Printf("===========================================\n")
	fmt.Printf("  Trading Platform — Bot Fleet\n")
	fmt.Printf("  Target:       %s\n", targetURL)
	fmt.Printf("  Submission:   %s\n", submissionID)
	fmt.Printf("  Total bots:   %d\n", totalBots)
	fmt.Printf("  Duration:     %v\n", duration)
	fmt.Printf("===========================================\n\n")

	fleet     := bot.NewFleet(submissionID, targetURL, totalBots)
	publisher := metrics.NewPublisher(brokerAddr)

	var wg sync.WaitGroup

	// Publisher runs in background — reads from fleet's metrics channel
	wg.Add(1)
	go func() {
		defer wg.Done()
		publisher.DrainChannel(fleet.MetricsChan)
	}()

	// Fleet runs and closes MetricsChan when done
	fleet.Run(duration)

	// Wait for publisher to finish draining
	wg.Wait()
	fmt.Println("All done!")
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
