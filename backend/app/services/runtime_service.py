"""Runtime service: reports GPU/compute capability for the transcription stack.

Uses ctranslate2 (the engine underlying faster-whisper) for accurate CUDA
detection. torch is NOT required — this project uses faster-whisper/ctranslate2.
"""
import subprocess
from app.core.config import settings


def _nvidia_smi_info() -> dict:
    """Return basic GPU info from nvidia-smi, or empty dict if unavailable."""
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,driver_version",
             "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0:
            parts = [p.strip() for p in result.stdout.strip().split(",")]
            return {
                "gpu_device_name": parts[0] if len(parts) > 0 else None,
                "gpu_memory_total": parts[1] if len(parts) > 1 else None,
                "driver_version": parts[2] if len(parts) > 2 else None,
            }
    except Exception:
        pass
    return {}


def get_runtime_info() -> dict:
    info = {
        "gpu_available": False,
        "gpu_device_name": None,
        "gpu_device_count": 0,
        "cuda_version": None,
        "torch_version": None,
        "compute_device": "cpu",
        "model_size": settings.TRANSCRIPTION_MODEL,
        "compute_type": "int8",
        "faster_whisper_available": False,
    }
    # Use ctranslate2 (faster-whisper's runtime) for accurate CUDA detection
    try:
        import ctranslate2  # type: ignore
        count = ctranslate2.get_cuda_device_count()
        if count > 0:
            info["gpu_available"] = True
            info["gpu_device_count"] = count
            info["compute_device"] = "cuda"
            info["compute_type"] = "float16"
            smi = _nvidia_smi_info()
            info["gpu_device_name"] = smi.get("gpu_device_name")
            info["cuda_version"] = smi.get("driver_version")
    except Exception:
        pass
    try:
        import faster_whisper  # noqa: F401
        info["faster_whisper_available"] = True
    except ImportError:
        pass

    # Diarization capability
    try:
        from app.services.diarization_service import is_available as dia_available
        info["diarization_available"] = dia_available()
    except Exception:
        info["diarization_available"] = False
    info["diarization_backend"] = settings.DIARIZATION_BACKEND

    return info


def get_transcription_capabilities() -> dict:
    runtime = get_runtime_info()
    return {
        "model_size": runtime["model_size"],
        "compute_device": runtime["compute_device"],
        "compute_type": runtime["compute_type"],
        "gpu_available": runtime["gpu_available"],
        "gpu_device_name": runtime["gpu_device_name"],
        "language": settings.TRANSCRIPTION_LANGUAGE or "auto",
        "beam_size": getattr(settings, "TRANSCRIPTION_BEAM_SIZE", 5),
        "faster_whisper_available": runtime["faster_whisper_available"],
    }
