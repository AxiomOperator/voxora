from fastapi import APIRouter
from app.services.runtime_service import get_runtime_info, get_transcription_capabilities

router = APIRouter()


@router.get("")
def runtime_info():
    """Current compute runtime capabilities."""
    return get_runtime_info()


@router.get("/transcription")
def transcription_runtime():
    """Transcription-specific runtime configuration."""
    return get_transcription_capabilities()
