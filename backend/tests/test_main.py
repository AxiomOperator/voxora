import io
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session

from app.main import app
from app.db.database import get_session
import app.models as _models  # noqa: F401 — registers all tables


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(name="client")
def client_fixture(tmp_path):
    """Function-scoped TestClient with isolated SQLite DB and temp upload dir."""
    import app.services.file_service as fs_module
    from app.core.config import settings

    db_path = tmp_path / "test.db"
    db_url = f"sqlite:///{db_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)

    original_upload_dir = fs_module.file_service.upload_dir
    fs_module.file_service.upload_dir = tmp_path / "uploads"
    fs_module.file_service.upload_dir.mkdir()

    original_db_url = settings.DATABASE_URL
    settings.DATABASE_URL = db_url  # Make background tasks use test DB

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine)
    fs_module.file_service.upload_dir = original_upload_dir
    settings.DATABASE_URL = original_db_url


def _upload(client, filename="test.mp3", content=b"audio", mime="audio/mpeg"):
    return client.post(
        "/api/v1/media/upload",
        files={"files": (filename, io.BytesIO(content), mime)},
    )


def _upload_get_media(client, filename="test.mp3", content=b"audio", mime="audio/mpeg"):
    """Upload a single file and return the MediaFileRead dict."""
    return _upload(client, filename, content, mime).json()[0]


def _create_job_and_wait(client, media_id, language="en"):
    resp = client.post("/api/v1/jobs", json={"media_file_id": media_id, "language": language})
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health_check(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Media
# ---------------------------------------------------------------------------

def test_list_media_empty(client):
    assert client.get("/api/v1/media").json() == []


def test_upload_media(client):
    r = _upload(client)
    assert r.status_code == 201
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["original_name"] == "test.mp3"
    assert data[0]["status"] == "pending"


def test_get_media(client):
    media_id = _upload_get_media(client)["id"]
    r = client.get(f"/api/v1/media/{media_id}")
    assert r.status_code == 200
    assert r.json()["id"] == media_id


def test_delete_media(client):
    media_id = _upload_get_media(client)["id"]
    assert client.delete(f"/api/v1/media/{media_id}").status_code == 204
    assert client.get(f"/api/v1/media/{media_id}").status_code == 404


def test_404_on_missing_media(client):
    assert client.get("/api/v1/media/99999").status_code == 404


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

def test_create_job(client):
    media_id = _upload_get_media(client)["id"]
    job = _create_job_and_wait(client, media_id)
    assert job["media_file_id"] == media_id
    assert job["status"] in ("pending", "processing", "completed", "failed")


def test_list_jobs(client):
    assert isinstance(client.get("/api/v1/jobs").json(), list)


def test_404_on_missing_job(client):
    assert client.get("/api/v1/jobs/99999").status_code == 404


# ---------------------------------------------------------------------------
# Transcripts — list + detail
# ---------------------------------------------------------------------------

def test_list_transcripts(client):
    assert isinstance(client.get("/api/v1/transcripts").json(), list)


def test_transcript_created_after_job(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    # Give the background task time to complete (TestClient runs it synchronously)
    transcripts = client.get("/api/v1/transcripts").json()
    assert len(transcripts) >= 1


def test_get_transcript_segments(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if transcripts:
        tid = transcripts[0]["id"]
        segs = client.get(f"/api/v1/transcripts/{tid}/segments").json()
        assert isinstance(segs, list)


# ---------------------------------------------------------------------------
# Transcript editing
# ---------------------------------------------------------------------------

def test_patch_transcript(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    r = client.patch(f"/api/v1/transcripts/{tid}", json={"detected_language": "fr"})
    assert r.status_code == 200
    assert r.json()["detected_language"] == "fr"


def test_patch_segment(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    segs = client.get(f"/api/v1/transcripts/{tid}/segments").json()
    if not segs:
        pytest.skip("No segments available")
    seg_id = segs[0]["id"]
    r = client.patch(
        f"/api/v1/transcripts/{tid}/segments/{seg_id}",
        json={"text": "edited text", "speaker_label": "SPEAKER_01"},
    )
    assert r.status_code == 200
    assert r.json()["text"] == "edited text"
    assert r.json()["speaker_label"] == "SPEAKER_01"


# ---------------------------------------------------------------------------
# Speakers
# ---------------------------------------------------------------------------

def test_get_speakers(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    r = client.get(f"/api/v1/transcripts/{tid}/speakers")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_rename_speaker(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    # Patch a segment to have a speaker label first
    segs = client.get(f"/api/v1/transcripts/{tid}/segments").json()
    if segs:
        client.patch(
            f"/api/v1/transcripts/{tid}/segments/{segs[0]['id']}",
            json={"speaker_label": "SPEAKER_00"},
        )
    speakers = client.get(f"/api/v1/transcripts/{tid}/speakers").json()
    if not speakers:
        pytest.skip("No speakers to rename")
    sid = speakers[0]["id"]
    r = client.patch(
        f"/api/v1/transcripts/{tid}/speakers/{sid}",
        json={"name": "Alice"},
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Alice"


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def test_export_txt(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    r = client.get(f"/api/v1/transcripts/{tid}/export?format=txt")
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]


def test_export_srt(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    r = client.get(f"/api/v1/transcripts/{tid}/export?format=srt")
    assert r.status_code == 200


def test_export_vtt(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    r = client.get(f"/api/v1/transcripts/{tid}/export?format=vtt")
    assert r.status_code == 200
    assert b"WEBVTT" in r.content


def test_export_invalid_format(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    tid = transcripts[0]["id"]
    r = client.get(f"/api/v1/transcripts/{tid}/export?format=docx")
    assert r.status_code == 422  # Query param validation rejects it


# ---------------------------------------------------------------------------
# Phase 4: Media stream
# ---------------------------------------------------------------------------

def test_media_stream_not_found(client):
    r = client.get("/api/v1/media/99999/stream")
    assert r.status_code == 404


def test_media_stream_ok(client):
    # Minimal valid WAV: RIFF header + empty data chunk
    wav_bytes = (
        b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00"
        b"\x01\x00\x01\x00\x44\xac\x00\x00\x88X\x01\x00"
        b"\x02\x00\x10\x00data\x00\x00\x00\x00"
    )
    r = _upload(client, filename="test.wav", content=wav_bytes, mime="audio/wav")
    assert r.status_code == 201
    media_id = r.json()[0]["id"]
    sr = client.get(f"/api/v1/media/{media_id}/stream")
    assert sr.status_code == 200
    assert "audio/wav" in sr.headers["content-type"]


# ---------------------------------------------------------------------------
# Phase 4: Transcript list filtering
# ---------------------------------------------------------------------------

def test_transcript_list_filter_q(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    # Stub transcript contains the word "Stub"
    r = client.get("/api/v1/transcripts?q=Stub")
    assert r.status_code == 200
    results = r.json()
    assert isinstance(results, list)
    assert len(results) >= 1

    # Search for a word that won't appear
    r2 = client.get("/api/v1/transcripts?q=xyzzy_not_present_anywhere")
    assert r2.status_code == 200
    assert r2.json() == []


# ---------------------------------------------------------------------------
# Phase 4: Jobs list status filter
# ---------------------------------------------------------------------------

def test_jobs_list_status_filter(client):
    media_id = _upload_get_media(client)["id"]
    job = _create_job_and_wait(client, media_id)
    job_id = job["id"]

    # The background task runs synchronously in TestClient, so by now the job
    # is either completed or failed — filter for its actual status
    final_status = client.get(f"/api/v1/jobs/{job_id}").json()["status"]
    r = client.get(f"/api/v1/jobs?status={final_status}")
    assert r.status_code == 200
    ids = [j["id"] for j in r.json()]
    assert job_id in ids

    # pending filter should not include this completed/failed job
    r2 = client.get("/api/v1/jobs?status=pending")
    assert r2.status_code == 200
    ids2 = [j["id"] for j in r2.json()]
    assert job_id not in ids2


# ---------------------------------------------------------------------------
# Phase 4: Job includes media_file_id (and transcript_id)
# ---------------------------------------------------------------------------

def test_job_includes_media_file_id(client):
    media_id = _upload_get_media(client)["id"]
    job = _create_job_and_wait(client, media_id)
    assert "media_file_id" in job
    assert job["media_file_id"] == media_id
    assert "transcript_id" in job


# ---------------------------------------------------------------------------
# Phase 5: Multi-file upload
# ---------------------------------------------------------------------------

def test_multi_file_upload(client):
    r = client.post(
        "/api/v1/media/upload",
        files=[
            ("files", ("a.mp3", io.BytesIO(b"audio1"), "audio/mpeg")),
            ("files", ("b.mp3", io.BytesIO(b"audio2"), "audio/mpeg")),
        ],
    )
    assert r.status_code == 201
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2
    names = {d["original_name"] for d in data}
    assert names == {"a.mp3", "b.mp3"}


# ---------------------------------------------------------------------------
# Phase 5: Batch job creation
# ---------------------------------------------------------------------------

def test_batch_job_creation(client):
    m1 = _upload_get_media(client, filename="x.mp3")["id"]
    m2 = _upload_get_media(client, filename="y.mp3")["id"]
    r = client.post("/api/v1/jobs/batch", json={"media_file_ids": [m1, m2]})
    assert r.status_code == 201
    jobs = r.json()
    assert isinstance(jobs, list)
    assert len(jobs) == 2
    media_ids = {j["media_file_id"] for j in jobs}
    assert media_ids == {m1, m2}


# ---------------------------------------------------------------------------
# Phase 5: Job retry
# ---------------------------------------------------------------------------

def test_job_retry_success(client):
    from sqlmodel import Session, create_engine
    from app.core.config import settings

    media_id = _upload_get_media(client)["id"]
    job = _create_job_and_wait(client, media_id)
    job_id = job["id"]

    # Manually set job to failed via a direct DB update
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    with Session(engine) as session:
        from app.models.transcription_job import TranscriptionJob
        db_job = session.get(TranscriptionJob, job_id)
        db_job.status = "failed"
        db_job.error_message = "simulated failure"
        session.add(db_job)
        session.commit()

    r = client.post(f"/api/v1/jobs/{job_id}/retry")
    assert r.status_code == 200
    retried = r.json()
    assert retried["status"] in ("pending", "processing", "completed", "failed")


def test_job_retry_not_failed(client):
    media_id = _upload_get_media(client)["id"]
    # Create job but don't mark as failed
    r = client.post("/api/v1/jobs", json={"media_file_id": media_id})
    assert r.status_code == 201
    job_id = r.json()["id"]

    # The background task completes (completed or failed), only retry if not failed
    status = client.get(f"/api/v1/jobs/{job_id}").json()["status"]
    if status == "failed":
        pytest.skip("Job happened to fail — can't test non-failed retry path")

    r2 = client.post(f"/api/v1/jobs/{job_id}/retry")
    assert r2.status_code == 400


# ---------------------------------------------------------------------------
# Phase 5: Job detail
# ---------------------------------------------------------------------------

def test_get_job_detail(client):
    media_id = _upload_get_media(client)["id"]
    job = _create_job_and_wait(client, media_id)
    job_id = job["id"]
    r = client.get(f"/api/v1/jobs/{job_id}")
    assert r.status_code == 200
    detail = r.json()
    assert detail["id"] == job_id
    assert detail["media_file_id"] == media_id
    assert "status" in detail
    assert "created_at" in detail


# ---------------------------------------------------------------------------
# Phase 5: Chapters
# ---------------------------------------------------------------------------

def _get_transcript_id(client):
    media_id = _upload_get_media(client)["id"]
    _create_job_and_wait(client, media_id)
    transcripts = client.get("/api/v1/transcripts").json()
    if not transcripts:
        pytest.skip("No transcripts available")
    return transcripts[0]["id"]


def test_create_chapter(client):
    tid = _get_transcript_id(client)
    r = client.post(
        f"/api/v1/transcripts/{tid}/chapters",
        json={"title": "Intro", "start_seconds": 0.0, "end_seconds": 30.0},
    )
    assert r.status_code == 201
    ch = r.json()
    assert ch["title"] == "Intro"
    assert ch["transcript_id"] == tid
    assert ch["start_seconds"] == 0.0
    assert ch["end_seconds"] == 30.0


def test_list_chapters(client):
    tid = _get_transcript_id(client)
    client.post(
        f"/api/v1/transcripts/{tid}/chapters",
        json={"title": "Second", "start_seconds": 60.0, "end_seconds": 120.0},
    )
    client.post(
        f"/api/v1/transcripts/{tid}/chapters",
        json={"title": "First", "start_seconds": 0.0, "end_seconds": 60.0},
    )
    r = client.get(f"/api/v1/transcripts/{tid}/chapters")
    assert r.status_code == 200
    chapters = r.json()
    assert len(chapters) == 2
    assert chapters[0]["start_seconds"] <= chapters[1]["start_seconds"]


def test_update_chapter(client):
    tid = _get_transcript_id(client)
    ch = client.post(
        f"/api/v1/transcripts/{tid}/chapters",
        json={"title": "Old Title", "start_seconds": 0.0, "end_seconds": 10.0},
    ).json()
    ch_id = ch["id"]
    r = client.patch(
        f"/api/v1/transcripts/{tid}/chapters/{ch_id}",
        json={"title": "New Title"},
    )
    assert r.status_code == 200
    assert r.json()["title"] == "New Title"


def test_delete_chapter(client):
    tid = _get_transcript_id(client)
    ch = client.post(
        f"/api/v1/transcripts/{tid}/chapters",
        json={"title": "To Delete", "start_seconds": 0.0, "end_seconds": 5.0},
    ).json()
    ch_id = ch["id"]
    r = client.delete(f"/api/v1/transcripts/{tid}/chapters/{ch_id}")
    assert r.status_code == 204
    chapters = client.get(f"/api/v1/transcripts/{tid}/chapters").json()
    assert all(c["id"] != ch_id for c in chapters)


# ---------------------------------------------------------------------------
# Phase 5: Highlights
# ---------------------------------------------------------------------------

def test_create_highlight(client):
    tid = _get_transcript_id(client)
    r = client.post(
        f"/api/v1/transcripts/{tid}/highlights",
        json={"transcript_id": tid, "note": "Great point"},
    )
    assert r.status_code == 201
    hl = r.json()
    assert hl["transcript_id"] == tid
    assert hl["note"] == "Great point"


def test_delete_highlight(client):
    tid = _get_transcript_id(client)
    hl = client.post(
        f"/api/v1/transcripts/{tid}/highlights",
        json={"transcript_id": tid, "note": "To remove"},
    ).json()
    hl_id = hl["id"]
    r = client.delete(f"/api/v1/transcripts/{tid}/highlights/{hl_id}")
    assert r.status_code == 204
    highlights = client.get(f"/api/v1/transcripts/{tid}/highlights").json()
    assert all(h["id"] != hl_id for h in highlights)
