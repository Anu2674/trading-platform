package bot

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// Bot personalities — each simulates a different market participant
const (
	PersonalityMarketMaker      = "market_maker"
	PersonalityAggressiveBuyer  = "aggressive_buyer"
	PersonalityAggressiveSeller = "aggressive_seller"
	PersonalityCanceller        = "canceller"
)

type Bot struct {
	ID           int
	Personality  string
	TargetURL    string
	SubmissionID string
	client       *http.Client
}

func NewBot(id int, targetURL, submissionID string) *Bot {
	personality := assignPersonality(id)
	return &Bot{
		ID:           id,
		Personality:  personality,
		TargetURL:    targetURL,
		SubmissionID: submissionID,
		client:       &http.Client{Timeout: 5 * time.Second},
	}
}

// SendOrder sends one order and returns the metric (latency + result)
func (b *Bot) SendOrder() (*BotMetric, error) {
	order := b.generateOrder()

	body, _ := json.Marshal(order)

	start := time.Now()
	resp, err := b.client.Post(
		b.TargetURL+"/order",
		"application/json",
		bytes.NewBuffer(body),
	)
	latency := float64(time.Since(start).Microseconds()) / 1000.0 // ms

	status := "error"
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode == 200 {
			status = "accepted"
		} else {
			status = fmt.Sprintf("http_%d", resp.StatusCode)
		}
	}

	metric := &BotMetric{
		SubmissionID: b.SubmissionID,
		BotID:        b.ID,
		OrderID:      order.OrderID,
		OrderType:    order.Type,
		Side:         order.Side,
		Price:        order.Price,
		Quantity:     order.Quantity,
		LatencyMs:    latency,
		Status:       status,
		Timestamp:    time.Now().UnixMilli(),
	}

	return metric, nil
}

func (b *Bot) generateOrder() Order {
	basePrice := 100.0 + rand.Float64()*50.0

	switch b.Personality {
	case PersonalityMarketMaker:
		// Places limit orders near market price
		side := "buy"
		if rand.Intn(2) == 0 {
			side = "sell"
		}
		return Order{
			OrderID:   uuid.New().String(),
			Type:      "limit",
			Side:      side,
			Price:     round(basePrice+rand.Float64()*2-1, 2),
			Quantity:  rand.Intn(50) + 1,
			Timestamp: time.Now().UnixMilli(),
			BotID:     b.ID,
		}

	case PersonalityAggressiveBuyer:
		// Buys at market price — wants to fill immediately
		return Order{
			OrderID:   uuid.New().String(),
			Type:      "market",
			Side:      "buy",
			Price:     round(basePrice+5, 2),
			Quantity:  rand.Intn(100) + 10,
			Timestamp: time.Now().UnixMilli(),
			BotID:     b.ID,
		}

	case PersonalityAggressiveSeller:
		return Order{
			OrderID:   uuid.New().String(),
			Type:      "market",
			Side:      "sell",
			Price:     round(basePrice-5, 2),
			Quantity:  rand.Intn(100) + 10,
			Timestamp: time.Now().UnixMilli(),
			BotID:     b.ID,
		}

	default: // canceller
		return Order{
			OrderID:   uuid.New().String(),
			Type:      "cancel",
			Side:      "buy",
			Price:     0,
			Quantity:  0,
			Timestamp: time.Now().UnixMilli(),
			BotID:     b.ID,
		}
	}
}

func assignPersonality(botID int) string {
	switch {
	case botID < 200:
		return PersonalityMarketMaker
	case botID < 500:
		return PersonalityAggressiveBuyer
	case botID < 800:
		return PersonalityAggressiveSeller
	default:
		return PersonalityCanceller
	}
}

func round(val float64, decimals int) float64 {
	p := 1.0
	for i := 0; i < decimals; i++ {
		p *= 10
	}
	return float64(int(val*p+0.5)) / p
}
