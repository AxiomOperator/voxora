import os
from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Voxora"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./voxora.db"
    BACKEND_CORS_ORIGINS: List[str] = ["http://172.99.99.17:3000"]
    STORAGE_DIR: str = "storage/uploads"
    TRANSCRIPTION_MODEL: str = "base"
    TRANSCRIPTION_LANGUAGE: Optional[str] = None
    TRANSCRIPTION_BEAM_SIZE: int = 5
    TRANSCRIPTION_COMPUTE_DEVICE: str = "auto"  # "auto", "cuda", "cpu"
    DIARIZATION_ENABLED: bool = False
    DIARIZATION_BACKEND: str = "heuristic"  # "heuristic" or "pyannote"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
