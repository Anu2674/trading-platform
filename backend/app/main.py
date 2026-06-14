from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, upload, run, scores, ws

app = FastAPI(
    title="Trading Platform API",
    description="Distributed Benchmarking Platform for Trading Engines",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,  tags=["Health"])
app.include_router(upload.router,  tags=["Submissions"])
app.include_router(run.router,     tags=["Benchmark"])
app.include_router(scores.router,  tags=["Leaderboard"])
app.include_router(ws.router,      tags=["WebSocket"])


@app.get("/")
async def root():
    return {"message": "Trading Platform API is running"}
