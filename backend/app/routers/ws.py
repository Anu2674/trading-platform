from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import os, redis as redis_lib, asyncio, json

router = APIRouter()


@router.websocket("/ws/scores")
async def websocket_scores(websocket: WebSocket):
    """
    WebSocket endpoint — frontend connects here to get live score updates.
    Uses Redis PubSub: telemetry engine publishes → this pushes to browser.
    """
    await websocket.accept()

    r = redis_lib.Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6380"),
        decode_responses=True
    )
    pubsub = r.pubsub()
    pubsub.subscribe("score_updates")

    try:
        # Send current leaderboard immediately on connect
        keys = r.keys("benchmark:*")
        initial_data = []
        for key in keys:
            data = r.hgetall(key)
            if data:
                initial_data.append(data)
        await websocket.send_json({"type": "initial", "data": initial_data})

        # Listen for live updates
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message and message["type"] == "message":
                await websocket.send_json({
                    "type": "update",
                    "data": json.loads(message["data"])
                })
            await asyncio.sleep(0.1)   # poll every 100ms

    except WebSocketDisconnect:
        pubsub.unsubscribe("score_updates")
        pubsub.close()
