"""
TranscriptionService — stub for Phase 1.

In a later phase this module will:
- Accept a file path and optional language hint
- Load a Whisper (or equivalent) model onto the NVIDIA GPU (nvidia-smi confirmed available)
- Run transcription and return a structured transcript with timestamps
- Emit progress events for the job queue

For now it exposes the interface that the media router will call,
so wiring it up later requires minimal changes.
"""


class TranscriptionService:
    def transcribe(self, file_path: str, language: str | None = None) -> dict:
        """Stub: returns a placeholder transcript dict."""
        raise NotImplementedError(
            "GPU transcription is not implemented in Phase 1. "
            "This method will be filled in a later phase."
        )


transcription_service = TranscriptionService()
