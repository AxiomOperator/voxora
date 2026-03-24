"""
ExportService — formats a transcript for download in various formats.

Supported formats: txt, srt, vtt
"""

from typing import List

from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment


class ExportService:
    def export(self, transcript: Transcript, segments: List[TranscriptSegment], fmt: str) -> tuple[str, str]:
        """
        Returns (content, media_type) for the requested format.
        Raises ValueError for unsupported formats.
        """
        fmt = fmt.lower().strip()
        if fmt == "txt":
            return self._to_txt(transcript, segments), "text/plain"
        if fmt == "srt":
            return self._to_srt(segments), "text/srt"
        if fmt == "vtt":
            return self._to_vtt(segments), "text/vtt"
        raise ValueError(f"Unsupported export format: {fmt}. Supported: txt, srt, vtt")

    # ------------------------------------------------------------------

    def _to_txt(self, transcript: Transcript, segments: List[TranscriptSegment]) -> str:
        if not segments:
            return transcript.full_text or ""
        lines = []
        for seg in sorted(segments, key=lambda s: s.segment_index):
            speaker = f"[{seg.speaker_label}] " if seg.speaker_label else ""
            lines.append(f"{speaker}{seg.text.strip()}")
        return "\n\n".join(lines)

    def _to_srt(self, segments: List[TranscriptSegment]) -> str:
        blocks = []
        for i, seg in enumerate(sorted(segments, key=lambda s: s.segment_index), start=1):
            start = _srt_time(seg.start_seconds)
            end = _srt_time(seg.end_seconds)
            speaker = f"[{seg.speaker_label}] " if seg.speaker_label else ""
            blocks.append(f"{i}\n{start} --> {end}\n{speaker}{seg.text.strip()}")
        return "\n\n".join(blocks)

    def _to_vtt(self, segments: List[TranscriptSegment]) -> str:
        lines = ["WEBVTT", ""]
        for seg in sorted(segments, key=lambda s: s.segment_index):
            start = _vtt_time(seg.start_seconds)
            end = _vtt_time(seg.end_seconds)
            speaker = f"<v {seg.speaker_label}>" if seg.speaker_label else ""
            lines.append(f"{start} --> {end}")
            lines.append(f"{speaker}{seg.text.strip()}")
            lines.append("")
        return "\n".join(lines)


def _srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _vtt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


export_service = ExportService()
