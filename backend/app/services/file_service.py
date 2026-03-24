"""
FileService — handles all file I/O for uploaded media.
Keeps file operations out of route handlers.
"""

import logging
import os
import re
import uuid
from pathlib import Path
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES: frozenset = frozenset({
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/ogg",
    "audio/flac",
    "video/mp4",
    "video/quicktime",
    "video/webm",
})


class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.STORAGE_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, name: str) -> str:
        """
        Produce a safe filename:
          - strip leading dots
          - replace whitespace and special characters with underscores
          - truncate to 200 characters
        """
        name = name.lstrip(".")
        name = re.sub(r"[^\w.\-]", "_", name)
        if not name:
            name = "upload"
        return name[:200]

    def safe_stored_name(self, original_name: str) -> str:
        """Generate a collision-free stored filename preserving sanitized extension."""
        sanitized = self._sanitize_filename(original_name)
        suffix = Path(sanitized).suffix.lower()
        candidate = f"{uuid.uuid4().hex}{suffix}"
        # Ensure no collision in the upload dir (extremely unlikely but handle it)
        counter = 0
        while (self.upload_dir / candidate).exists():
            counter += 1
            stem = Path(candidate).stem
            candidate = f"{stem}_{counter}{suffix}"
        return candidate

    def validate_upload(self, filename: str, mime_type: str, size_bytes: int) -> None:
        """
        Raise ValueError with a descriptive message if the upload is invalid.
          - Empty file
          - Disallowed MIME type
        """
        if size_bytes == 0:
            raise ValueError(f"File '{filename}' is empty (0 bytes)")
        if mime_type not in ALLOWED_MIME_TYPES:
            allowed = ", ".join(sorted(ALLOWED_MIME_TYPES))
            raise ValueError(
                f"File '{filename}' has disallowed MIME type '{mime_type}'. "
                f"Allowed types: {allowed}"
            )

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
        Returns True if deleted, False if it didn't exist on disk.
        Logs a warning (not an error) for missing files.
        """
        path = Path(file_path)
        try:
            path.unlink()
            return True
        except FileNotFoundError:
            logger.warning("delete_file: file not found on disk: %s — skipping", file_path)
            return False


file_service = FileService()
