# Voxora

A local-first transcription platform built with FastAPI and Next.js. Upload audio or video files, run transcription jobs, and browse, edit, and export timestamped transcripts — all from a clean, dark-mode-capable web UI.

---

## Current Status

**Phase 4 complete.** The following is fully implemented and working:

- Structured FastAPI backend with versioned API routes under `/api/v1`
- uv-managed Python project
- SQLite database via SQLModel
- Media upload (multipart), listing, and deletion
- **Audio streaming** — `GET /api/v1/media/{id}/stream` serves uploaded files; media detail pages render an HTML5 audio player
- Transcription job creation and background execution with `pending → processing → completed/failed` lifecycle
- **Job status filtering** — `GET /api/v1/jobs?status=` filters the job list by status; jobs expose `transcript_id` for direct navigation to the output transcript
- Transcript persistence with full text and ordered segments with timestamps
- **Transcript search/filtering** — `GET /api/v1/transcripts?q=&media_name=` filters by transcript text or source media filename
- Speaker model — segments carry `speaker_label`; `Speaker` rows are auto-synced from segments on job completion
- Speaker renaming (`PATCH /api/v1/transcripts/{id}/speakers/{speaker_id}`)
- Transcript segment inline editing (`PATCH /api/v1/transcripts/{id}/segments/{seg_id}`)
- Transcript export in TXT, SRT, and VTT formats (`GET /api/v1/transcripts/{id}/export?format=txt|srt|vtt`)
- GPU-detection boundary in `transcription_service.py` — falls back to stub when no real ASR is installed
- Next.js App Router frontend, JavaScript-only, Mantine v7 UI
- **Shared `(app)` route group** — all main pages (`/`, `/media`, `/media/[id]`, `/transcripts`, `/transcripts/[id]`, `/dashboard`) share a single AppShell layout via `app/(app)/layout.js`; root `app/layout.js` provides only html/body + MantineProvider
- `/dashboard` with parallel routes (`@queue`, `@recent`, `@stats`) showing live counts, recent uploads, recent transcripts with links, and job queue with status badges
- `/media` list page with client-side search bar filtering by original filename
- `/media/[id]` detail page with HTML5 audio player and "Start Transcription" action
- `/transcripts` list page with search bar (filters by text content or media name)
- Transcript detail is a full tabbed workspace: Segments (inline editing + speaker labels), Full Text, Speakers (rename)
- **"View source media" link** on transcript detail navigates back to the originating media file
- Export actions (download as TXT, SRT, VTT) on transcript detail

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Backend language | Python 3.11+ |
| Backend package manager | [uv](https://github.com/astral-sh/uv) |
| ORM | [SQLModel](https://sqlmodel.tiangolo.com/) + SQLAlchemy |
| Database | SQLite (local file) |
| Config | pydantic-settings |
| Backend tests | pytest + httpx (TestClient) |
| Frontend framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Frontend language | JavaScript only — no TypeScript |
| UI library | [Mantine v7](https://mantine.dev/) |
| Frontend package manager | npm |
| GPU environment | NVIDIA GPU + drivers available; CUDA transcription planned for a future phase |

---

## Project Structure

```
voxora/
├── README.md
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   ├── storage/uploads/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/              (config, security)
│   │   ├── db/                (database, init_db)
│   │   ├── models/            (media_file, transcription_job, transcript,
│   │   │                       transcript_segment, speaker)
│   │   ├── schemas/           (matching schemas + update schemas per model)
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   └── v1/            (api, media, jobs, transcripts, speakers)
│   │   └── services/          (file, transcription, transcript, export)
│   └── tests/
└── frontend/
    ├── app/
    │   ├── layout.js          (root: html/body + MantineProvider)
    │   ├── loading.js
    │   └── (app)/
    │       ├── layout.js      (shared AppShell — wraps all app pages)
    │       ├── page.js
    │       ├── media/
    │       │   ├── page.js
    │       │   ├── loading.js
    │       │   └── [mediaId]/page.js
    │       ├── transcripts/
    │       │   ├── page.js
    │       │   ├── loading.js
    │       │   └── [transcriptId]/page.js
    │       └── dashboard/
    │           ├── layout.js
    │           ├── page.js
    │           ├── @queue/
    │           ├── @recent/
    │           └── @stats/
    ├── components/
    │   ├── providers.js
    │   ├── app-shell.js
    │   ├── dashboard/         (stats-panel, queue-panel, recent-panel)
    │   ├── jobs/              (job-list, job-status-card)
    │   ├── media/             (upload-form, media-list, media-detail,
    │   │                       media-audio-player, media-search-bar)
    │   └── transcripts/       (transcript-list, transcript-detail,
    │                           transcript-segment-list, transcript-segment-editor,
    │                           speaker-editor, export-actions, transcript-search-bar)
    └── lib/
        ├── api.js
        └── env.js
```

---

## Architecture Notes

- **Backend lives in `/backend`, frontend lives in `/frontend`.** They are separate projects with their own dependency management and dev servers.
- **All API routes are versioned** under `/api/v1/`. Do not add unversioned production endpoints.
- **Service layer.** Business logic lives in `app/services/`, not in route handlers. Routers validate input, call services, and return schema responses.
- **`transcription_service._run_engine()`** is the single extension point for plugging in a real ASR engine (Whisper, etc.). GPU detection runs at service startup and falls back cleanly when no GPU ASR library is present.
- **Speakers are auto-synced** from segment `speaker_label` values on job completion. `PATCH .../speakers/{id}` lets users assign a display name without altering the original label.
- **Export service** returns raw file content with `Content-Disposition: attachment`, triggering a browser download.
- **Stream endpoint** (`GET /api/v1/media/{id}/stream`) returns the stored file via `FileResponse` using the original MIME type. The frontend constructs the stream URL with `getMediaStreamUrl()` from `lib/api.js` and passes it directly to an `<audio>` element.
- **SQLModel + SQLite.** The engine URL is controlled by `DATABASE_URL` in `.env`. Swapping to PostgreSQL requires only a connection string change.
- **Local file storage.** Uploaded files are written to `backend/storage/uploads/` (configurable via `STORAGE_DIR`).
- **Next.js App Router with `(app)` route group.** Root `app/layout.js` provides only the html/body wrapper and MantineProvider. The `app/(app)/layout.js` layout renders the AppShell with navbar and is shared by every app page (`/`, `/media`, `/media/[id]`, `/transcripts`, `/transcripts/[id]`, `/dashboard`). The `(app)` segment is invisible in URLs.
- **Parallel routes are used only on `/dashboard`** (`@queue`, `@recent`, `@stats`), which live inside `(app)/dashboard/` and extend the shared layout without re-rendering AppShell. Do not add parallel routes elsewhere without a clear architectural reason.
- **JavaScript only.** The frontend contains no TypeScript. Do not introduce `.ts` or `.tsx` files.
- **All backend calls go through `lib/api.js`.** Do not call `fetch()` directly in components. The module exports named helpers for every resource, including `getMediaStreamUrl()` which returns a plain URL string (not a Promise) for use in `src` attributes.

---

## Requirements

- **Python 3.11+**
- **[uv](https://github.com/astral-sh/uv)** — install with `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Node.js 18+** with `npm`
- **SQLite** — bundled with Python, no separate install needed
- **NVIDIA GPU** with drivers installed (`nvidia-smi` should work) — not yet used by the application, but the environment is assumed present for the real ASR phase

---

## Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local development)

# Initialise the database
uv run python -m app.db.init_db

# Run the development server
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

### Running backend tests

```bash
cd backend
uv run pytest tests/ -v
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

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
| `GET` | `/api/v1/media/{id}/stream` | Stream media file for in-browser playback |
| `DELETE` | `/api/v1/media/{id}` | Delete a media file and its stored data |
| `GET` | `/api/v1/jobs` | List transcription jobs (optional `?status=` filter) |
| `POST` | `/api/v1/jobs` | Create a transcription job for a media file |
| `GET` | `/api/v1/jobs/{id}` | Get a single job (includes `transcript_id` when complete) |
| `GET` | `/api/v1/transcripts` | List transcripts (optional `?q=` and `?media_name=` filters) |
| `GET` | `/api/v1/transcripts/{id}` | Get transcript with full text |
| `PATCH` | `/api/v1/transcripts/{id}` | Update transcript metadata |
| `GET` | `/api/v1/transcripts/{id}/segments` | Get ordered timestamped segments |
| `PATCH` | `/api/v1/transcripts/{id}/segments/{segment_id}` | Edit a segment's text |
| `GET` | `/api/v1/transcripts/{id}/speakers` | List speakers (auto-synced from segments) |
| `PATCH` | `/api/v1/transcripts/{id}/speakers/{speaker_id}` | Rename a speaker |
| `GET` | `/api/v1/transcripts/{id}/export?format=txt\|srt\|vtt` | Download transcript as file |

---

## Current Workflow

1. **Visit `/media`** — use the search bar to filter existing files, or drop an audio/video file onto the upload zone
2. **File is stored** on disk under `storage/uploads/` and a `MediaFile` record is created
3. **Click the filename** to open the media detail page; the **audio player** lets you listen to the file immediately
4. **Click "Start Transcription"** — a `TranscriptionJob` is created and runs in the background
5. **Job progresses:** `pending → processing → completed` (or `failed`)
6. **On completion**, `Transcript` and `TranscriptSegment` rows are persisted; `Speaker` rows are synced from segment labels; the job record exposes `transcript_id` for direct linking
7. **Visit `/transcripts`** — use the search bar to filter by transcript text or media filename; click a transcript to open the tabbed workspace:
   - **Segments tab** — ordered segments with timestamps, speaker labels, and inline text editing
   - **Full Text tab** — complete transcript text
   - **Speakers tab** — rename speaker labels across all segments
8. **Click "View source media"** on the transcript detail page to jump back to the originating media file
9. **Export** the transcript as TXT, SRT, or VTT from the export menu on the transcript detail page
10. **Visit `/dashboard`** to see live stats counts, recent uploads, recent transcripts with direct links, and the job queue with status badges

> **Note:** The current transcription engine is a GPU-ready stub that returns placeholder text. Real ASR (e.g., Whisper) will be wired in during a future phase via the `_run_engine()` extension point in `app/services/transcription_service.py`.

---

## Current Limitations

- Transcription engine is a GPU-ready stub — real ASR (Whisper, etc.) is not yet wired in
- No user authentication
- Audio player is basic HTML5 controls — no waveform visualisation or playback-sync highlighting
- No batch job processing
- SQLite only (PostgreSQL path is planned)
- Speaker labels are placeholders until real diarization is added

---

## Development Notes

### Backend

- **Add a new API resource:** create a model in `app/models/`, a schema in `app/schemas/`, a router in `app/routers/v1/`, and register it in `app/routers/v1/api.py`.
- **Models must be imported** in `app/models/__init__.py` for `SQLModel.metadata.create_all()` to pick them up.
- **Add business logic** in `app/services/`, not inside route handlers. Keep routers thin.
- **All new endpoints go under `/api/v1/`.** Introduce `/api/v2/` for breaking changes rather than modifying existing routes.

### Frontend

- **Add a new app page** by creating `app/(app)/<route>/page.js`. It automatically inherits the shared AppShell from `app/(app)/layout.js`. Add `loading.js` alongside it for Suspense fallback behaviour.
- **Add shared components** under `components/<domain>/`.
- **All backend calls go through `lib/api.js`.** Do not call `fetch()` directly in components.
- **Stay JavaScript.** No TypeScript, no `.ts` or `.tsx` files.
- **Parallel routes are for `/dashboard` only.** Do not create `@slot` directories in other routes.
- **`'use client'`** is required only in components that use React hooks or browser APIs. Server components must not have it.

---

## Roadmap

The following items are planned for future phases and are **not yet implemented**:

- **Real ASR integration** — plug Whisper (or faster-whisper) into `_run_engine()` in `transcription_service.py`
- **GPU-backed transcription** — load model onto CUDA device; the `_run_engine()` boundary is already in place
- **Speaker diarization** — `speaker_label` field already exists on `TranscriptSegment`; pyannote.audio or similar
- **Waveform visualisation with playback sync** — replace basic HTML5 controls with a synced waveform view
- **Transcript rich-text editing**
- **Export to DOCX and JSON**
- **PostgreSQL migration** — change `DATABASE_URL`; no ORM changes required
- **Authentication and multi-user support** — JWT-based auth; `app/core/security.py` stub is ready
- **Batch processing and job queue** — ARQ or Celery for long-running jobs and retry logic
- **Confidence scores per segment**
