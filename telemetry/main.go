package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"

	"trading-platform/telemetry/stats"
	"trading-platform/telemetry/validator"
)

// BotMetric consumed from Redpanda
type BotMetric struct {
	SubmissionID string  `json:"submission_id"`
	BotID        int     `json:"bot_id"`
	OrderID      string  `json:"order_id"`
	OrderType    string  `json:"order_type"`
	Side         string  `json:"side"`
	Price        float64 `json:"price"`
	Quantity     int     `json:"quantity"`
	LatencyMs    float64 `json:"latency_ms"`
	Status       string  `json:"status"`
	Timestamp    int64   `json:"timestamp"`
}

func main() {
	brokerAddr  := getEnv("REDPANDA_BROKER", "localhost:9092")
	redisURL    := getEnv("REDIS_URL", "redis://localhost:6380")
	postgresURL := getEnv("DATABASE_URL", "postgres://trading_user:trading_pass@localhost:5433/trading_db")

	fmt.Println("[Telemetry] Starting consumer...")

	// Connections
	rdb := redis.NewClient(&redis.Options{Addr: parseRedisAddr(redisURL)})
	db, err := pgx.Connect(context.Background(), postgresURL)
	if err != nil {
		fmt.Printf("[Telemetry] PostgreSQL connection failed: %v\n", err)
		os.Exit(1)
	}
	defer db.Close(context.Background())

	ensureTables(db)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{brokerAddr},
		Topic:    "bot-metrics",
		GroupID:  "telemetry-engine",
		MinBytes: 1,
		MaxBytes: 10e6,
		MaxWait:  500 * time.Millisecond,
	})
	defer reader.Close()

	// Accumulate metrics per submission in memory
	type window struct {
		latencies  []float64
		timestamps []int64
		orders     []validator.Order
	}
	windows := make(map[string]*window)

	// Flush every 5 seconds
	ticker := time.NewTicker(5 * time.Second)
	ctx := context.Background()

	fmt.Println("[Telemetry] Listening for metrics...")

	for {
		select {
		case <-ticker.C:
			for submissionID, w := range windows {
				if len(w.latencies) == 0 {
					continue
				}

				p50, p90, p99 := stats.Percentile(w.latencies)
				tps            := stats.TPS(w.timestamps)
				correctness    := validator.CheckPriceTimePriority(w.orders)

				// Score formula: TPS*0.4 + (1/p99)*0.3 + correctness*0.3
				score := (tps*0.4) + (1000.0/p99)*0.3 + (correctness*0.3)

				fmt.Printf("[%s] p50=%.2fms p90=%.2fms p99=%.2fms TPS=%.0f correct=%.1f%% score=%.2f\n",
					submissionID[:8], p50, p90, p99, tps, correctness, score)

				// Save to PostgreSQL
				saveResult(db, submissionID, p50, p90, p99, tps, correctness, score)

				// Push to Redis (live leaderboard)
				rdb.HSet(ctx, "benchmark:"+submissionID, map[string]interface{}{
					"submission_id": submissionID,
					"p50":           fmt.Sprintf("%.2f", p50),
					"p90":           fmt.Sprintf("%.2f", p90),
					"p99":           fmt.Sprintf("%.2f", p99),
					"tps":           fmt.Sprintf("%.0f", tps),
					"correctness":   fmt.Sprintf("%.1f", correctness),
					"score":         fmt.Sprintf("%.2f", score),
					"status":        "running",
				})
				rdb.Publish(ctx, "score_updates", fmt.Sprintf(
					`{"submission_id":"%s","score":%.2f,"tps":%.0f,"p99":%.2f}`,
					submissionID, score, tps, p99,
				))

				// Reset window
				windows[submissionID] = &window{}
			}

		default:
			msg, err := reader.FetchMessage(ctx)
			if err != nil {
				time.Sleep(100 * time.Millisecond)
				continue
			}

			var metric BotMetric
			if err := json.Unmarshal(msg.Value, &metric); err != nil {
				reader.CommitMessages(ctx, msg)
				continue
			}

			w, ok := windows[metric.SubmissionID]
			if !ok {
				w = &window{}
				windows[metric.SubmissionID] = w
			}

			w.latencies  = append(w.latencies, metric.LatencyMs)
			w.timestamps = append(w.timestamps, metric.Timestamp)
			w.orders = append(w.orders, validator.Order{
				OrderID:   metric.OrderID,
				Side:      metric.Side,
				Price:     metric.Price,
				Quantity:  metric.Quantity,
				Timestamp: metric.Timestamp,
				Filled:    metric.Status == "filled",
			})

			reader.CommitMessages(ctx, msg)
		}
	}
}

func saveResult(db *pgx.Conn, submissionID string, p50, p90, p99, tps, correctness, score float64) {
	_, err := db.Exec(context.Background(), `
		INSERT INTO benchmark_results
			(id, submission_id, team_name, p50_latency, p90_latency, p99_latency, tps, correctness, total_score)
		VALUES
			(gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT DO NOTHING
	`, submissionID, "team_"+submissionID[:8], p50, p90, p99, tps, correctness, score)
	if err != nil {
		fmt.Printf("[Telemetry] DB save error: %v\n", err)
	}
}

func ensureTables(db *pgx.Conn) {
	_, err := db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS benchmark_results (
			id            TEXT PRIMARY KEY,
			submission_id TEXT NOT NULL,
			team_name     TEXT,
			p50_latency   FLOAT,
			p90_latency   FLOAT,
			p99_latency   FLOAT,
			tps           FLOAT,
			correctness   FLOAT,
			total_score   FLOAT,
			created_at    TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		fmt.Printf("[Telemetry] Table creation error: %v\n", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseRedisAddr(url string) string {
	// redis://localhost:6380 → localhost:6380
	if len(url) > 8 {
		return url[8:]
	}
	return "localhost:6380"
}
