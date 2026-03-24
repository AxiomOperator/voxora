"""
FileService — handles all file I/O for uploaded media.
Keeps file operations out of route handlers.
"""

import os
import uuid
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings


class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.STORAGE_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def safe_stored_name(self, original_name: str) -> str:
        """Generate a collision-free stored filename preserving extension."""
        suffix = Path(original_name).suffix.lower()
        return f"{uuid.uuid4().hex}{suffix}"

    async def save_upload(self, upload: UploadFile) -> dict:
        """
        Persist an uploaded file to disk.
        Returns a dict with stored_name, file_path, size_bytes.
        """
        stored_name = self.safe_stored_name(upload.filename or "upload")
        file_path = self.upload_dir / stored_name

        content = await upload.read()
        file_path.write_bytes(content)

        return {
            "stored_name": stored_name,
            "file_path": str(file_path),
            "size_bytes": len(content),
        }

    def delete_file(self, file_path: str) -> None:
        """Delete a stored file if it exists."""
        path = Path(file_path)
        if path.exists():
            path.unlink()


file_service = FileService()
