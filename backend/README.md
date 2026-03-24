# Voxora Backend

FastAPI backend for the Voxora transcription application.

## Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) installed globally

## Setup

### 1. Create virtual environment

```bash
uv venv
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env as needed
```

### 4. Run the development server

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

API docs: http://localhost:8000/docs

## Running tests

```bash
uv run pytest tests/ -v
```

## API versioning

All production endpoints live under `/api/v1/`.

| Method | Path              | Description          |
|--------|-------------------|----------------------|
| GET    | /api/v1/health    | Health check         |
| GET    | /api/v1/media     | List media files     |
| POST   | /api/v1/media     | Create media record  |
