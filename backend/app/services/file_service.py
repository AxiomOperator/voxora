"""
FileService — handles all file I/O for uploaded media.
Keeps file operations out of route handlers.
"""

import os
import re
import uuid
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings


class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.STORAGE_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, name: str) -> str:
        """Replace spaces and special characters with underscores, cap length."""
        name = re.sub(r'[^\w\.\-]', '_', name)
        return name[:200]

    def safe_stored_name(self, original_name: str) -> str:
        """Generate a collision-free stored filename preserving sanitized extension."""
        sanitized = self._sanitize_filename(original_name)
        suffix = Path(sanitized).suffix.lower()
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

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a stored file.
        Returns True if deleted, False if it didn't exist.
        """
        path = Path(file_path)
        try:
            path.unlink()
            return True
        except FileNotFoundError:
            return False


file_service = FileService()
