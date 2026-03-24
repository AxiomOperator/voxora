from datetime import datetime, timezone

from fastapi import APIRouter
from sqlmodel import text

from app.db.database import engine
from app.services.diagnostics_service import get_full_status

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    status = get_full_status()
    db_status = status.get("database", {}).get("status", "error")
    storage_status = status.get("storage", {}).get("status", "error")
    return {
        "status": "ok",
        "service": "voxora-api",
        "database": db_status,
        "storage": storage_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
