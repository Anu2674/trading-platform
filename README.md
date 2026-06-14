# Trading Platform — IICPC Hackathon 2026

A distributed benchmarking system that stress-tests contestant-submitted trading engines using a fleet of 1000 concurrent bots, measures latency/throughput/correctness, and streams results to a live leaderboard.

## Architecture

```
Contestant Upload → Sandboxed Docker Container
                           ↓
              1000 Go Goroutines (Bot Fleet)
              [Market Makers | Buyers | Sellers | Cancellers]
                           ↓
              Redpanda (Kafka-compatible message queue)
                           ↓
              Telemetry Engine → p50/p90/p99 latency, TPS, correctness
                           ↓
              PostgreSQL (persistence) + Redis (live cache)
                           ↓
              React Frontend ← WebSocket live leaderboard
```

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python FastAPI |
| Bot Fleet | Go (1000 goroutines) |
| Telemetry | Go |
| Message Queue | Redpanda (Kafka-compatible) |
| Database | PostgreSQL + TimescaleDB |
| Cache / PubSub | Redis |
| Frontend | React + Vite |
| Containerization | Docker + Docker Compose |

## Scoring

```
Score = (TPS × 0.4) + (1000/p99_latency × 0.3) + (correctness% × 0.3)
```

- **TPS** — orders processed per second before failure
- **p99 latency** — worst-case response time (lower = better)
- **Correctness** — price-time priority validation (0-100%)

## Running Locally

```bash
# Start infrastructure
docker compose up -d

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Team

- Anu Kumari
- Ashutosh Singh
