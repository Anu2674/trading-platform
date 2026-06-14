from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from sqlalchemy.sql import func
from .database import Base
import uuid


class Submission(Base):
    __tablename__ = "submissions"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_name  = Column(String(100), nullable=False)
    filename   = Column(String(255), nullable=False)
    file_path  = Column(String(500), nullable=False)
    status     = Column(String(50), default="uploaded")   # uploaded | running | done | failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BenchmarkResult(Base):
    __tablename__ = "benchmark_results"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id  = Column(String, nullable=False)
    team_name      = Column(String(100), nullable=False)
    p50_latency    = Column(Float, default=0)
    p90_latency    = Column(Float, default=0)
    p99_latency    = Column(Float, default=0)
    tps            = Column(Float, default=0)
    correctness    = Column(Float, default=0)    # 0-100 score
    total_score    = Column(Float, default=0)    # final leaderboard score
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
