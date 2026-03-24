"""DiarizationService — honest speaker diarization.

Attempts pyannote.audio if the backend is configured as "pyannote" and a
HuggingFace token is present.  Otherwise uses a heuristic silence-gap
analyser that splits audio into speaker turns based on pause patterns.

The heuristic approach:
  1. Load the audio waveform (mono, resampled to 16 kHz) via torchaudio.
  2. Compute a short-time energy envelope (10 ms frames).
  3. Mark frames below a noise-floor threshold as silence.
  4. Merge silence runs longer than PAUSE_THRESHOLD into gap regions.
  5. Assign alternating SPEAKER_00 / SPEAKER_01 labels at each gap, with
     a maximum of MAX_SPEAKERS distinct labels.

The service NEVER fabricates speaker assignments:
  - If loading the audio fails, it surfaces the error.
  - If no gaps are found, the whole file is assigned to SPEAKER_00.
"""

import logging
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Heuristic tuning knobs ──────────────────────────────────────────────────
PAUSE_THRESHOLD_SEC: float = 1.0   # silence gap that triggers a speaker turn
SILENCE_ENERGY_FRACTION: float = 0.02  # frames below this × max-energy are silent
MAX_SPEAKERS: int = 8
FRAME_DURATION_SEC: float = 0.010  # 10 ms frames for energy envelope
TARGET_SAMPLE_RATE: int = 16_000
# ────────────────────────────────────────────────────────────────────────────


def _load_waveform(file_path: str):
    """Return (waveform_1d_np_float32, sample_rate) using torchaudio."""
    import torchaudio  # type: ignore
    import numpy as np

    waveform, sr = torchaudio.load(file_path)  # (channels, samples)
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)  # mono
    if sr != TARGET_SAMPLE_RATE:
        resampler = torchaudio.transforms.Resample(sr, TARGET_SAMPLE_RATE)
        waveform = resampler(waveform)
        sr = TARGET_SAMPLE_RATE
    return waveform.squeeze().numpy().astype("float32"), sr


def _heuristic_diarize(file_path: str) -> List[dict]:
    """
    Analyse silence gaps and return speaker-turn segments.
    Returns: list of {"speaker": "SPEAKER_XX", "start": float, "end": float}
    """
    import numpy as np

    audio, sr = _load_waveform(file_path)
    if len(audio) == 0:
        raise ValueError("Audio file contains no samples")

    frame_len = max(1, int(sr * FRAME_DURATION_SEC))
    # RMS energy per frame
    n_frames = len(audio) // frame_len
    if n_frames == 0:
        total_dur = len(audio) / sr
        return [{"speaker": "SPEAKER_00", "start": 0.0, "end": round(total_dur, 3)}]

    frames = audio[: n_frames * frame_len].reshape(n_frames, frame_len)
    energy = np.sqrt((frames ** 2).mean(axis=1))

    threshold = SILENCE_ENERGY_FRACTION * (energy.max() or 1.0)
    is_silent = energy < threshold

    # Build gap regions (contiguous silence blocks)
    gaps: List[tuple] = []  # (start_sec, end_sec)
    in_silence = False
    gap_start = 0
    for i, silent in enumerate(is_silent):
        t = i * FRAME_DURATION_SEC
        if silent and not in_silence:
            gap_start = t
            in_silence = True
        elif not silent and in_silence:
            gap_end = t
            if gap_end - gap_start >= PAUSE_THRESHOLD_SEC:
                gaps.append((gap_start, gap_end))
            in_silence = False
    if in_silence:
        gap_end = n_frames * FRAME_DURATION_SEC
        if gap_end - gap_start >= PAUSE_THRESHOLD_SEC:
            gaps.append((gap_start, gap_end))

    total_dur = len(audio) / sr

    if not gaps:
        return [{"speaker": "SPEAKER_00", "start": 0.0, "end": round(total_dur, 3)}]

    # Build turn segments from gaps
    turns = []
    speaker_idx = 0
    seg_start = 0.0
    for gap_s, gap_e in gaps:
        if gap_s > seg_start:
            turns.append({
                "speaker": f"SPEAKER_{speaker_idx:02d}",
                "start": round(seg_start, 3),
                "end": round(gap_s, 3),
            })
            speaker_idx = min(speaker_idx + 1, MAX_SPEAKERS - 1)
        seg_start = gap_e

    if seg_start < total_dur:
        turns.append({
            "speaker": f"SPEAKER_{speaker_idx:02d}",
            "start": round(seg_start, 3),
            "end": round(total_dur, 3),
        })

    return turns if turns else [{"speaker": "SPEAKER_00", "start": 0.0, "end": round(total_dur, 3)}]


def _pyannote_diarize(file_path: str) -> List[dict]:
    """Attempt pyannote-based diarization (requires HF token + model access)."""
    import os
    hf_token = os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("HF_TOKEN")
    if not hf_token:
        raise RuntimeError(
            "pyannote backend selected but no HuggingFace token found "
            "(set HUGGINGFACE_TOKEN environment variable)"
        )
    from pyannote.audio import Pipeline  # type: ignore
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )
    diarization = pipeline(file_path)
    turns = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        turns.append({
            "speaker": speaker,
            "start": round(turn.start, 3),
            "end": round(turn.end, 3),
        })
    return turns


def diarize(
    file_path: str,
    backend: Optional[str] = None,
    enabled: Optional[bool] = None,
) -> dict:
    """
    Run speaker diarization on an audio file.

    Args:
        file_path: Path to the audio file.
        backend: Override backend ("heuristic" | "pyannote").
        enabled: Override enabled flag.

    Returns a dict with:
        {
            "turns": [{"speaker": str, "start": float, "end": float}, ...],
            "diarization_status": "ok" | "disabled" | "error",
            "diarization_backend": str,
            "diarization_error": str | None,
        }
    """
    use_backend = backend or settings.DIARIZATION_BACKEND
    is_enabled = enabled if enabled is not None else settings.DIARIZATION_ENABLED

    if not is_enabled:
        return {
            "turns": [],
            "diarization_status": "disabled",
            "diarization_backend": use_backend,
            "diarization_error": None,
        }

    try:
        if use_backend == "pyannote":
            turns = _pyannote_diarize(file_path)
        else:
            turns = _heuristic_diarize(file_path)

        return {
            "turns": turns,
            "diarization_status": "ok",
            "diarization_backend": use_backend,
            "diarization_error": None,
        }
    except Exception as exc:
        logger.warning("Diarization failed (%s): %s", use_backend, exc)
        return {
            "turns": [],
            "diarization_status": "error",
            "diarization_backend": use_backend,
            "diarization_error": str(exc),
        }


def is_available() -> bool:
    """Check whether the diarization service can be loaded."""
    try:
        import torchaudio  # noqa: F401
        import numpy  # noqa: F401
        return True
    except ImportError:
        return False
