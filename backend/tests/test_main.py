import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from app.main import app
from app.db.database import get_session
import app.models as _models  # noqa: F401 — ensure models are registered with metadata

TEST_DATABASE_URL = "sqlite:///file::memory:?cache=shared&uri=true"


@pytest.fixture(name="client", scope="module")
def client_fixture():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine)


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_list_media_empty(client: TestClient):
    response = client.get("/api/v1/media")
    assert response.status_code == 200
    assert response.json() == []


def test_create_media(client: TestClient):
    payload = {
        "original_name": "interview.mp3",
        "stored_name": "2024_interview.mp3",
        "file_path": "/uploads/2024_interview.mp3",
        "mime_type": "audio/mpeg",
        "size_bytes": 5242880,
        "status": "pending",
    }
    response = client.post("/api/v1/media", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["original_name"] == "interview.mp3"
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data
