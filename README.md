# Voxora

A local-first transcription platform built with FastAPI and Next.js. Upload audio or video files, run transcription jobs, and browse timestamped transcripts — all from a clean, dark-mode-capable web UI.

---

## Current Status

**Phase 2 complete.** The following is fully implemented and working:

- Structured FastAPI backend with versioned API routes under `/api/v1`
- Real multipart file upload with local disk storage
- `MediaFile` persistence with list, detail, and delete endpoints
- `TranscriptionJob` creation with background processing
- `Transcript` and `TranscriptSegment` persistence (stub ASR engine in place)
- Full transcript detail view with timestamped segments
- Next.js App Router frontend with `/media`, `/transcripts`, and `/dashboard` routes
- Mantine-based UI with dark mode default and color scheme toggle
- Live dashboard panels showing real counts, active queue, and recent files

**Not yet implemented (planned for future phases):**

- Real ASR engine integration (Whisper or equivalent)
- GPU-backed transcription via CUDA
- Speaker diarization
- Transcript editing
- Export formats (SRT, VTT, plain text)
- Job status polling / real-time updates
- PostgreSQL migration
- Authentication

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Backend language | Python 3.11+ |
| Backend package manager | [uv](https://github.com/astral-sh/uv) |
| ORM | [SQLModel](https://sqlmodel.tiangolo.com/) + SQLAlchemy |
| Database | SQLite (PostgreSQL-ready) |
| File handling | python-multipart, aiofiles |
| Config | pydantic-settings |
| Backend tests | pytest + FastAPI TestClient + httpx |
| Frontend framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Frontend language | JavaScript only — no TypeScript |
| UI library | [Mantine v8](https://mantine.dev/) |
| Frontend package manager | npm |
| GPU environment | NVIDIA GPU + drivers available; CUDA transcription wired in a future phase |

---

## Project Structure

```
voxora/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, lifespan
│   │   ├── dependencies.py          # Shared FastAPI dependencies (SessionDep)
│   │   ├── core/
│   │   │   ├── config.py            # pydantic-settings Settings
│   │   │   └── security.py          # Auth stub (future phase)
│   │   ├── db/
│   │   │   ├── database.py          # SQLModel engine + get_session
│   │   │   ├── init_db.py           # create_all tables
│   │   │   └── migrations/          # Alembic placeholder (future phase)
│   │   ├── models/
│   │   │   ├── media_file.py
│   │   │   ├── transcription_job.py
│   │   │   ├── transcript.py
│   │   │   └── transcript_segment.py
│   │   ├── schemas/
│   │   │   ├── media_file.py
│   │   │   ├── transcription_job.py
│   │   │   ├── transcript.py
│   │   │   └── transcript_segment.py
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   └── v1/
│   │   │       ├── api.py           # Aggregates all v1 routers
│   │   │       ├── media.py
│   │   │       ├── jobs.py
│   │   │       └── transcripts.py
│   │   └── services/
│   │       ├── file_service.py      # Upload storage, filename generation
│   │       └── transcription_service.py  # Job lifecycle + ASR engine boundary
│   ├── storage/
│   │   └── uploads/                 # Uploaded media files (local)
│   ├── tests/
│   │   └── test_main.py
│   ├── .env.example
│   ├── pyproject.toml
│   └── README.md
│
└── frontend/
    ├── app/
    │   ├── layout.js                # Root layout (Providers, Mantine)
    │   ├── page.js                  # Landing page
    │   ├── loading.js
    │   ├── dashboard/
    │   │   ├── layout.js            # AppShell + parallel slot rendering
    │   │   ├── page.js
    │   │   ├── @queue/              # Active job queue slot
    │   │   ├── @recent/             # Recent files slot
    │   │   └── @stats/              # Live counts slot
    │   ├── media/
    │   │   ├── page.js              # Upload form + media list
    │   │   └── [mediaId]/
    │   │       └── page.js          # Media detail + job management
    │   ├── transcripts/
    │   │   ├── page.js              # Transcript list
    │   │   └── [transcriptId]/
    │   │       └── page.js          # Transcript detail + segments
    │   └── api/health/route.js      # Local health route (proxies backend)
    ├── components/
    │   ├── providers.js             # MantineProvider + Notifications
    │   ├── dashboard/               # Stats, queue, recent panels
    │   ├── media/                   # UploadForm, MediaList, MediaDetail
    │   ├── jobs/                    # JobStatusCard
    │   └── transcripts/             # TranscriptList, TranscriptDetail, SegmentList
    └── lib/
        ├── api.js                   # All backend API calls
        └── env.js                   # Centralised env variable access
```

---

## Architecture Notes

- **Backend lives in `/backend`, frontend lives in `/frontend`.** They are separate projects with their own dependency management and dev servers.
- **All API routes are versioned** under `/api/v1/`. Do not add unversioned production endpoints.
- **Service layer.** Business logic lives in `app/services/`, not in route handlers. Routers validate input, call services, and return schema responses.
- **SQLModel + SQLite.** The engine URL is controlled by `DATABASE_URL` in `.env`. Swapping to PostgreSQL requires only a connection string change — no ORM changes needed.
- **Local file storage.** Uploaded files are written to `backend/storage/uploads/` (configurable via `STORAGE_DIR`). Cloud storage is a future concern.
- **Next.js App Router.** All frontend routes use App Router conventions (`layout.js`, `page.js`, `loading.js`). No Pages Router.
- **Parallel routes are used only on `/dashboard`** (`@queue`, `@recent`, `@stats`). Do not add parallel routes elsewhere without a clear architectural reason.
- **JavaScript only.** The frontend contains no TypeScript. Do not introduce `.ts` or `.tsx` files.
- **Mantine is the sole UI library.** Do not add other component libraries.

---

## Requirements

- **Python 3.11+**
- **[uv](https://github.com/astral-sh/uv)** — install with `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Node.js 18+** with `npm`
- **SQLite** — bundled with Python, no separate install needed
- **NVIDIA GPU** with drivers installed (`nvidia-smi` should work) — not yet used by the application, but the environment is assumed present for the transcription phase

---

## Backend Setup

```bash
cd backend

# Create virtual environment
uv venv

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local development)

# Run the development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

The database (`voxora.db`) and upload storage (`storage/uploads/`) are created automatically on first run.

### Running backend tests

```bash
cd backend
uv run pytest tests/ -v
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies (only needed once or after package changes)
npm install

# Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL if your backend runs on a non-default port

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `Voxora` | Application name used in API responses |
| `APP_ENV` | `development` | Enables SQLAlchemy echo logging in dev |
| `DATABASE_URL` | `sqlite:///./voxora.db` | SQLAlchemy connection string |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins (JSON array) |
| `STORAGE_DIR` | `storage/uploads` | Directory for uploaded media files |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

All frontend components access the backend URL through `lib/env.js`. Do not read `process.env` directly in components.

---

## API Overview

The full interactive reference is available at `http://localhost:8000/docs` when the backend is running.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/media` | List all media files (newest first) |
| `POST` | `/api/v1/media/upload` | Upload a media file (multipart/form-data) |
| `GET` | `/api/v1/media/{id}` | Get a single media file |
| `DELETE` | `/api/v1/media/{id}` | Delete a media file and its stored data |
| `GET` | `/api/v1/jobs` | List transcription jobs |
| `POST` | `/api/v1/jobs` | Create a transcription job for a media file |
| `GET` | `/api/v1/jobs/{id}` | Get a single job |
| `GET` | `/api/v1/transcripts` | List all transcripts |
| `GET` | `/api/v1/transcripts/{id}` | Get transcript with full text |
| `GET` | `/api/v1/transcripts/{id}/segments` | Get timestamped segments for a transcript |

---

## Current Workflow

1. **Visit `/media`** — drop an audio or video file onto the upload zone
2. **File is stored** on disk under `storage/uploads/` and a `MediaFile` record is created
3. **Click the filename** to open the media detail page
4. **Click "Start Transcription"** — a `TranscriptionJob` is created and processed in the background
5. **The job runs the transcription service**, which produces a `Transcript` record and associated `TranscriptSegment` rows
6. **Visit `/transcripts`** to see completed transcripts; click one to read the full text and timestamped segments
7. The **dashboard** at `/dashboard` shows live stats, the active job queue, and recent files

> **Note:** The current transcription engine is a stub that returns placeholder text. Real ASR (e.g., Whisper) will be wired in during a future phase using the `_run_engine()` extension point in `app/services/transcription_service.py`.

---

## Development Notes

### Backend

- **Add a new API resource:** create a model in `app/models/`, a schema in `app/schemas/`, a router in `app/routers/v1/`, and register it in `app/routers/v1/api.py`.
- **Add business logic** in `app/services/`, not inside route handlers. Keep routers thin.
- **All new endpoints go under `/api/v1/`.** If breaking changes are needed, introduce `/api/v2/` rather than changing existing routes.
- **Models must be imported** in `app/models/__init__.py` for `SQLModel.metadata.create_all()` to pick them up.

### Frontend

- **Add a new page** by creating `app/<route>/page.js`. Add `loading.js` alongside it for Suspense fallback behaviour.
- **Add shared components** under `components/<domain>/`.
- **All backend calls go through `lib/api.js`.** Do not call `fetch()` directly in components.
- **Stay JavaScript.** No TypeScript, no `.ts` or `.tsx` files.
- **Parallel routes are for `/dashboard` only.** Do not create `@slot` directories in other routes.
- **`'use client'`** is required only in components that use React hooks or browser APIs. Server components must not have it.

---

## Roadmap

The following items are planned for future phases and are **not yet implemented**:

- **Real ASR integration** — plug Whisper (or another model) into `_run_engine()` in `transcription_service.py`
- **GPU-backed transcription** — load model onto CUDA device; the `_run_engine()` boundary is already in place
- **Speaker diarization** — `speaker_label` field already exists on `TranscriptSegment`
- **Real-time job status** — SSE or WebSocket endpoint for live progress updates in the UI
- **Transcript editing** — inline correction of transcript text and segments
- **Export formats** — download transcripts as SRT, VTT, or plain text
- **PostgreSQL migration** — change `DATABASE_URL`; no ORM changes required
- **Authentication** — JWT-based auth; `app/core/security.py` stub is ready
- **Job orchestration** — task queue (e.g., ARQ or Celery) for long-running jobs and retry logic
