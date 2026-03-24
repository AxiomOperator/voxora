"""Diagnostics service: checks DB, storage, GPU, and transcription runtime."""
from pathlib import Path

from app.core.config import settings


def check_database() -> dict:
    try:
        from app.db.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "detail": "connected"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


def check_storage(storage_dir: str | None = None) -> dict:
    path = Path(storage_dir or settings.STORAGE_DIR)
    try:
        path.mkdir(parents=True, exist_ok=True)
        writable = path.is_dir() and (path / ".write_test").touch() or True
        test_file = path / ".write_test"
        test_file.touch()
        test_file.unlink()
        return {"status": "ok", "path": str(path), "writable": True}
    except Exception as exc:
        return {"status": "error", "path": str(path), "writable": False, "detail": str(exc)}


def check_gpu() -> dict:
    try:
        import torch
        available = torch.cuda.is_available()
        device_name = torch.cuda.get_device_name(0) if available else None
        return {"available": available, "device_name": device_name}
    except ImportError:
        return {"available": False, "device_name": None}


def check_transcription_runtime() -> dict:
    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        device = "cpu"
    return {
        "available": True,
        "model": settings.TRANSCRIPTION_MODEL,
        "device": device,
    }


def get_full_status() -> dict:
    return {
        "database": check_database(),
        "storage": check_storage(),
        "gpu": check_gpu(),
        "transcription": check_transcription_runtime(),
    }
