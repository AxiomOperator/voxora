import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Voxora"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./voxora.db"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    STORAGE_DIR: str = "storage/uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
