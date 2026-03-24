from app.core.config import settings as app_settings


def get_settings_info():
    """Return public/safe settings for display."""
    return {
        "app_name": app_settings.APP_NAME,
        "app_env": app_settings.APP_ENV,
        "storage_dir": str(app_settings.STORAGE_DIR),
        "database_url": app_settings.DATABASE_URL,
        "transcription_model": getattr(app_settings, "TRANSCRIPTION_MODEL", "base"),
        "transcription_language": getattr(app_settings, "TRANSCRIPTION_LANGUAGE", None),
        "diarization_enabled": app_settings.DIARIZATION_ENABLED,
        "diarization_backend": app_settings.DIARIZATION_BACKEND,
    }


def get_model_info():
    """Return transcription engine info."""
    from app.services.transcription_service import TranscriptionService
    svc = TranscriptionService()
    return svc.get_model_info()


def update_settings(patch: dict) -> dict:
    """Apply a partial settings update. Only DIARIZATION fields are mutable at runtime."""
    allowed = {"diarization_enabled", "diarization_backend"}
    for key, value in patch.items():
        if key in allowed:
            setattr(app_settings, key.upper(), value)
    return get_settings_info()
