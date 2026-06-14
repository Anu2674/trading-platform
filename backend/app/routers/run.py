from fastapi import APIRouter, HTTPException
from ..sandbox import run_sandbox, stop_sandbox, get_sandbox_status
import os, uuid, json, redis as redis_lib

router = APIRouter()

# Redis connection for publishing score updates
r = redis_lib.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6380"), decode_responses=True)


@router.post("/run/{submission_id}")
async def run_benchmark(submission_id: str):
    """
    Start benchmark for a submitted trading engine:
    1. Spin up sandbox container
    2. (Bot fleet will attack it — triggered separately in Go)
    3. Publish initial status to Redis
    """
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    submission_path = os.path.join(upload_dir, submission_id)

    if not os.path.exists(submission_path):
        raise HTTPException(status_code=404, detail="Submission not found")

    # Find the uploaded file
    files = os.listdir(submission_path)
    if not files:
        raise HTTPException(status_code=404, detail="No files in submission")

    file_path = os.path.join(submission_path, files[0])

    # Assign a unique port for this sandbox (avoid conflicts)
    host_port = 9000 + (hash(submission_id) % 1000)

    # Read team name saved during upload
    import json as _json
    meta_path = os.path.join(submission_path, "_meta.json")
    team_name = "Unknown"
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            team_name = _json.load(f).get("team_name", "Unknown")

    # Start sandbox container
    sandbox_info = run_sandbox(submission_id, file_path, host_port)

    if sandbox_info.get("status") == "error":
        raise HTTPException(status_code=500, detail=sandbox_info["detail"])

    # Publish to Redis so frontend knows benchmark started
    r.hset(f"benchmark:{submission_id}", mapping={
        "submission_id": submission_id,
        "team_name": team_name,
        "status": "running",
        "host_port": str(host_port),
        "p50": "0", "p90": "0", "p99": "0",
        "tps": "0", "correctness": "0", "score": "0"
    })
    r.publish("score_updates", json.dumps({
        "submission_id": submission_id,
        "status": "running",
        "message": "Benchmark started"
    }))

    return {
        "submission_id": submission_id,
        "sandbox": sandbox_info,
        "message": "Sandbox running. Bot fleet will start attacking now.",
        "bot_target": sandbox_info.get("endpoint")
    }


@router.delete("/run/{submission_id}")
async def stop_benchmark(submission_id: str):
    """Stop sandbox container for a submission."""
    stop_sandbox(submission_id)
    r.hset(f"benchmark:{submission_id}", "status", "stopped")
    return {"message": f"Sandbox {submission_id[:8]} stopped"}
