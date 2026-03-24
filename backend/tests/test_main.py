import io
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from app.main import app
from app.db.database import get_session
import app.models as _models  # noqa: F401


@pytest.fixture(name="client")
def client_fixture(tmp_path):
    """Function-scoped client with isolated in-memory DB."""
    db_path = tmp_path / "test.db"
    db_url = f"sqlite:///{db_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine)


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_list_media_empty(client):
    response = client.get("/api/v1/media")
    assert response.status_code == 200
    assert response.json() == []


def test_upload_media(client, tmp_path):
    fake_audio = io.BytesIO(b"fake audio content")
    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("test.mp3", fake_audio, "audio/mpeg")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["original_name"] == "test.mp3"
    assert data["mime_type"] == "audio/mpeg"
    assert data["status"] == "pending"
    assert "id" in data


def test_get_media(client):
    fake_audio = io.BytesIO(b"fake audio content")
    create_resp = client.post(
        "/api/v1/media/upload",
        files={"file": ("audio.wav", fake_audio, "audio/wav")},
    )
    media_id = create_resp.json()["id"]

    response = client.get(f"/api/v1/media/{media_id}")
    assert response.status_code == 200
    assert response.json()["id"] == media_id


def test_delete_media(client):
    fake_audio = io.BytesIO(b"fake audio content")
    create_resp = client.post(
        "/api/v1/media/upload",
        files={"file": ("to_delete.mp3", fake_audio, "audio/mpeg")},
    )
    media_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/media/{media_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/v1/media/{media_id}")
    assert get_resp.status_code == 404


def test_create_job(client):
    fake_audio = io.BytesIO(b"fake audio content")
    media_resp = client.post(
        "/api/v1/media/upload",
        files={"file": ("interview.mp3", fake_audio, "audio/mpeg")},
    )
    media_id = media_resp.json()["id"]

    job_resp = client.post("/api/v1/jobs", json={"media_file_id": media_id, "language": "en"})
    assert job_resp.status_code == 201
    data = job_resp.json()
    assert data["media_file_id"] == media_id
    assert data["status"] in ("pending", "processing", "done")


def test_list_jobs(client):
    response = client.get("/api/v1/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_transcripts(client):
    response = client.get("/api/v1/transcripts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_404_on_missing_media(client):
    response = client.get("/api/v1/media/99999")
    assert response.status_code == 404


def test_404_on_missing_job(client):
    response = client.get("/api/v1/jobs/99999")
    assert response.status_code == 404
