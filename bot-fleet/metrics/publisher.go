package metrics

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
	"trading-platform/bot-fleet/bot"
)

const TopicBotMetrics = "bot-metrics"

type Publisher struct {
	writer *kafka.Writer
}

func NewPublisher(brokerAddr string) *Publisher {
	return &Publisher{
		writer: &kafka.Writer{
			Addr:         kafka.TCP(brokerAddr),
			Topic:        TopicBotMetrics,
			Balancer:     &kafka.LeastBytes{},
			BatchTimeout: 10 * time.Millisecond,
		},
	}
}

func (p *Publisher) Publish(metric *bot.BotMetric) error {
	data, err := json.Marshal(metric)
	if err != nil {
		return err
	}
	return p.writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(metric.SubmissionID),
			Value: data,
		},
	)
}

// DrainChannel reads metrics from channel and publishes to Redpanda
func (p *Publisher) DrainChannel(metrics <-chan *bot.BotMetric) {
	total := 0
	for metric := range metrics {
		if err := p.Publish(metric); err != nil {
			fmt.Printf("[Publisher] Error: %v\n", err)
		}
		total++
		if total%100 == 0 {
			fmt.Printf("[Publisher] Published %d metrics\n", total)
		}
	}
	fmt.Printf("[Publisher] Done. Total published: %d\n", total)
	p.writer.Close()
}
