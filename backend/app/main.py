from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, REGISTRY
from sqlalchemy import text, inspect as sa_inspect

from app.core.config import settings
from app.db.init_db import init_db
from app.db.database import engine
from app.routers.v1.api import api_router


def _migrate_db():
    """Apply incremental schema migrations at startup."""
    inspector = sa_inspect(engine)
    cols = [c["name"] for c in inspector.get_columns("transcription_jobs")]
    if "runtime_metadata" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE transcription_jobs ADD COLUMN runtime_metadata TEXT"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    _migrate_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/metrics", include_in_schema=False)
def metrics():
    return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)
