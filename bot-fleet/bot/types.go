package bot

// Order sent to contestant's trading engine
type Order struct {
	OrderID   string  `json:"order_id"`
	Type      string  `json:"type"`       // limit | market | cancel
	Side      string  `json:"side"`       // buy | sell
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
	Timestamp int64   `json:"timestamp"`
	BotID     int     `json:"bot_id"`
}

// Response from contestant's trading engine
type OrderResponse struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`  // accepted | filled | rejected
	Price   float64 `json:"price"`
	Message string `json:"message"`
}

// Metric published to Redpanda after each order
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
