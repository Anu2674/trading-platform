from fastapi import APIRouter
import os, redis as redis_lib

router = APIRouter()

r = redis_lib.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6380"), decode_responses=True)


@router.get("/scores")
async def get_leaderboard():
    """
    Return all benchmark results sorted by total score.
    Reads from Redis (fast cache) — updated by telemetry engine.
    """
    keys = r.keys("benchmark:*")
    leaderboard = []

    for key in keys:
        data = r.hgetall(key)
        if data:
            leaderboard.append({
                "submission_id": data.get("submission_id", ""),
                "team_name":     data.get("team_name", "Unknown"),
                "status":        data.get("status", "unknown"),
                "p50_latency":   float(data.get("p50", 0)),
                "p90_latency":   float(data.get("p90", 0)),
                "p99_latency":   float(data.get("p99", 0)),
                "tps":           float(data.get("tps", 0)),
                "correctness":   float(data.get("correctness", 0)),
                "total_score":   float(data.get("score", 0)),
            })

    # Sort by total_score descending
    leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
    return {"leaderboard": leaderboard, "total_teams": len(leaderboard)}


@router.get("/scores/{submission_id}")
async def get_score(submission_id: str):
    """Get score for a specific submission."""
    data = r.hgetall(f"benchmark:{submission_id}")
    if not data:
        return {"error": "Submission not found or benchmark not started"}
    return data
