# Voxora

A local-first transcription platform built with FastAPI and Next.js. Upload audio or video files, run real ASR transcription jobs powered by `faster-whisper`, and browse, edit, and export timestamped transcripts — all from a clean, dark-mode-capable web UI.

---

## Current Status

**Phase 6 complete.** The following is fully implemented and working:

- Structured FastAPI backend with versioned API routes under `/api/v1`
- uv-managed Python project
- SQLite database via SQLModel
- Media upload (multipart, multiple files), listing, and deletion
  - **Upload hardening** — empty file uploads rejected (400); filenames sanitized (special chars replaced with underscores); delete keeps DB and disk in sync with clean success/not-found responses
- **Audio streaming** — `GET /api/v1/media/{id}/stream` serves uploaded files; media detail pages render an HTML5 audio player
- **Real ASR transcription** via `faster-whisper` (WhisperModel) with lazy loading
  - CUDA detected automatically via `torch.cuda.is_available()` — uses `float16` on GPU, `int8` on CPU
  - Model size configured via `TRANSCRIPTION_MODEL` env var (default: `base`; supports `small`, `medium`, `large-v2`)
  - Optional default language hint via `TRANSCRIPTION_LANGUAGE` env var (default: auto-detect)
  - `_run_engine()` is the single swap point for future model changes or diarization
- **Non-blocking transcription jobs** — run via FastAPI `BackgroundTasks`; HTTP response returns immediately
- Job lifecycle: `pending → processing → completed / failed`; error messages persisted on failure
- **Job status filtering** — `GET /api/v1/jobs?status=` filters job list by status; jobs expose `transcript_id` for direct navigation
- **Single job detail** — `GET /api/v1/jobs/{id}` returns full metadata including `transcript_id` and `error_message`
- **Batch job creation** — `POST /api/v1/jobs/batch` creates jobs for multiple media files in one request
- **Job retry** — `POST /api/v1/jobs/{id}/retry` resets a failed job to `pending` and re-enqueues it
- Transcript persistence with full text, detected language, and ordered segments with timestamps
- **Transcript search/filtering** — `GET /api/v1/transcripts?q=&media_name=` filters by transcript text or source media filename
- Speaker model — segments carry `speaker_label`; `Speaker` rows are auto-synced from segments on job completion
- Speaker renaming (`PATCH /api/v1/transcripts/{id}/speakers/{speaker_id}`)
- Transcript segment inline editing (`PATCH /api/v1/transcripts/{id}/segments/{seg_id}`)
- Transcript export in TXT, SRT, and VTT formats (`GET /api/v1/transcripts/{id}/export?format=txt|srt|vtt`)
- **Chapters** — create titled chapter markers with start/end timestamps on a transcript; full CRUD via `GET/POST /api/v1/transcripts/{id}/chapters` and `PATCH/DELETE .../chapters/{chapter_id}`
- **Highlights** — annotate segments with notes via `GET/POST /api/v1/transcripts/{id}/highlights` and `DELETE .../highlights/{highlight_id}`
- **Settings API** — `GET /api/v1/settings` returns app config; `GET /api/v1/settings/runtime` returns transcription engine info (model size, device, compute type); settings are read-only in Phase 6 (configured via `.env`)
- Next.js App Router frontend, JavaScript-only, Mantine v7 UI
- **Shared `(app)` route group** — all main pages share a single AppShell layout via `app/(app)/layout.js`; root `app/layout.js` provides only html/body + Providers
- **Navigation** — AppShell nav links: Home · Media · Transcripts · Jobs · Dashboard · Settings
- **Breadcrumbs** on every page (pathname-based)
- **Improved error/empty states** — all list pages show a red Alert on fetch failure; empty states with contextual prompts (e.g., "No jobs yet — upload media to start"); failed job detail shows error message prominently with a Retry button; segment editor shows success notification after save; batch upload shows per-file results summary
- `/dashboard` with parallel routes (`@queue`, `@recent`, `@stats`) showing live counts, recent uploads, recent transcripts, and job queue with status badges and retry actions
- `/media` list page with client-side search bar and **batch upload form** for uploading multiple files at once followed by one-click batch transcription start
- `/media/[id]` detail page with HTML5 audio player and "Start Transcription" action
- `/transcripts` list page with search bar (filters by text content or media name)
- **Transcript detail — tabbed workspace:**
  - **Workspace tab** — HTML5 audio player synced to segments (`PlaybackSyncPanel` highlights the active segment; clicking a segment seeks the player) + lightweight horizontal `TimelinePanel` with chapter markers and seekable playback position; chapter editor inline
  - **Segments tab** — in-page text search filters segments in real-time; click any segment to seek the audio; inline text and speaker editing with save success notification
  - **Speakers tab** — rename speaker labels across all segments
  - **Export tab** — download transcript as TXT, SRT, or VTT
- `/jobs` list page and `/jobs/[jobId]` detail page inside the shared AppShell; failed jobs show error message and a **Retry** button
- `/settings` page — shows app configuration and transcription engine info (model, device, compute type)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Backend language | Python 3.11+ |
| Backend package manager | [uv](https://github.com/astral-sh/uv) |
| ASR engine | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| ORM | [SQLModel](https://sqlmodel.tiangolo.com/) + SQLAlchemy |
| Database | SQLite (local file) |
| Config | pydantic-settings |
| Backend tests | pytest + httpx (TestClient) — 41 tests |
| Frontend framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Frontend language | JavaScript only — no TypeScript |
| UI library | [Mantine v7](https://mantine.dev/) |
| Frontend package manager | npm |
| GPU environment | NVIDIA GPU with CUDA — detected automatically; CPU fallback always available |

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
│   │   ├── core/              (config — includes TRANSCRIPTION_MODEL,
│   │   │                       TRANSCRIPTION_LANGUAGE; security)
│   │   ├── db/                (database, init_db)
│   │   ├── models/            (media_file, transcription_job, transcript,
│   │   │                       transcript_segment, speaker, chapter, highlight)
│   │   ├── schemas/           (matching schemas + update schemas per model)
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   └── v1/            (api, media, jobs, transcripts, speakers,
│   │   │                       chapters, highlights, settings)
│   │   └── services/          (file, transcription [faster-whisper],
│   │                           transcript, export, job, chapter,
│   │                           highlight, settings)
│   └── tests/                 (41 tests)
└── frontend/
    ├── app/
    │   ├── layout.js          (root: html/body + Providers)
    │   ├── loading.js
    │   └── (app)/
    │       ├── layout.js      (shared AppShell: Home, Media, Transcripts,
    │       │                   Jobs, Dashboard, Settings + Breadcrumbs)
    │       ├── page.js
    │       ├── media/
    │       │   ├── page.js
    │       │   ├── loading.js
    │       │   └── [mediaId]/page.js
    │       ├── transcripts/
    │       │   ├── page.js
    │       │   ├── loading.js
    │       │   └── [transcriptId]/page.js
    │       ├── jobs/
    │       │   ├── page.js
    │       │   ├── loading.js
    │       │   └── [jobId]/page.js
    │       ├── settings/
    │       │   ├── page.js
    │       │   └── loading.js
    │       └── dashboard/
    │           ├── layout.js
    │           ├── page.js
    │           ├── @queue/
    │           ├── @recent/
    │           └── @stats/
    ├── components/
    │   ├── providers.js
    │   ├── app-shell.js
    │   ├── breadcrumbs.js
    │   ├── settings/          (settings-form.js, runtime-info.js)
    │   ├── dashboard/         (stats-panel, queue-panel, recent-panel)
    │   ├── jobs/              (job-list, job-status-card, job-detail,
    │   │                       retry-job-button)
    │   ├── media/             (upload-form, batch-upload-form, media-list,
    │   │                       media-detail, media-audio-player,
    │   │                       media-search-bar)
    │   └── transcripts/       (transcript-list, transcript-detail,
    │                           segment-list, segment-editor,
    │                           speaker-editor, export-actions,
    │                           search-bar, playback-sync-panel,
    │                           timeline-panel, chapter-list, chapter-editor,
    │                           highlight-list, highlight-editor)
    └── lib/
        ├── api.js
        └── env.js
```

---

## Architecture Notes

- **Backend lives in `/backend`, frontend lives in `/frontend`.** They are separate projects with their own dependency management and dev servers.
- **All API routes are versioned** under `/api/v1/`. Do not add unversioned production endpoints.
- **Service layer.** Business logic lives in `app/services/`, not in route handlers. Routers validate input, call services, and return schema responses.
- **`transcription_service._run_engine()`** is the single extension point for swapping ASR models or adding diarization. The rest of the job lifecycle (`process_job`) is model-agnostic.
- **Lazy model loading.** `WhisperModel` is instantiated on the first transcription call, not at startup. `device` and `compute_type` are resolved at service init via `torch.cuda.is_available()`.
- **`job_service.retry_job()`** resets `status` to `pending`, clears `error_message`, and re-enqueues the background task. The router delegates entirely to this service function.
- **Settings service** reads from `Settings` (pydantic-settings) and the transcription service's `get_model_info()`. Settings are read-only in Phase 6; writing back to `.env` is planned.
- **Upload hardening.** `file_service` rejects empty uploads with a 400 error and sanitizes filenames by replacing special characters with underscores before writing to disk.
- **Chapters and highlights** each have their own model, schema, service, and router. Chapter routes carry `transcript_id` as a path parameter and are registered at the top-level router so they appear at `/api/v1/transcripts/{id}/chapters`. Highlight routes follow the same pattern.
- **Speakers are auto-synced** from segment `speaker_label` values on job completion. `PATCH .../speakers/{id}` lets users assign a display name without altering the original label.
- **Export service** returns raw file content with `Content-Disposition: attachment`, triggering a browser download.
- **Stream endpoint** (`GET /api/v1/media/{id}/stream`) returns the stored file via `FileResponse` using the original MIME type. The frontend constructs the stream URL with `getMediaStreamUrl()` from `lib/api.js` and passes it directly to an `<audio>` element.
- **PlaybackSyncPanel** listens to `timeupdate` events on the shared audio element and highlights the segment whose `[start, end]` window contains the current playback position. Clicking a segment sets `audio.currentTime` to seek the player.
- **TimelinePanel** renders a lightweight horizontal bar; chapter markers are drawn at proportional positions. Clicking anywhere on the bar seeks the audio to the corresponding timestamp.
- **Breadcrumbs** are rendered from the current pathname in the shared `(app)` layout — no per-page configuration required.
- **SQLModel + SQLite.** The engine URL is controlled by `DATABASE_URL` in `.env`. Swapping to PostgreSQL requires only a connection string change.
- **Local file storage.** Uploaded files are written to `backend/storage/uploads/` (configurable via `STORAGE_DIR`).
- **Next.js App Router with `(app)` route group.** Root `app/layout.js` provides only the html/body wrapper and Providers. The `app/(app)/layout.js` layout renders the AppShell with navbar and breadcrumbs and is shared by every app page. The `(app)` segment is invisible in URLs.
- **Parallel routes are used only on `/dashboard`** (`@queue`, `@recent`, `@stats`). Do not add parallel routes elsewhere without a clear architectural reason.
- **JavaScript only.** The frontend contains no TypeScript. Do not introduce `.ts` or `.tsx` files.
- **All backend calls go through `lib/api.js`.** Do not call `fetch()` directly in components. The module exports named helpers for every resource, including `getMediaStreamUrl()` which returns a plain URL string (not a Promise) for use in `src` attributes.

---

## Requirements

- **Python 3.11+**
- **[uv](https://github.com/astral-sh/uv)** — install with `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Node.js 18+** with `npm`
- **SQLite** — bundled with Python, no separate install needed
- **NVIDIA GPU** with drivers and CUDA installed (`nvidia-smi` should work) — strongly recommended for faster transcription; CPU-only mode works but is significantly slower

---

## Backend Setup

```bash
cd backend

# Install dependencies (includes faster-whisper)
uv sync

# Configure environment
cp .env.example .env
# Edit .env if needed — set TRANSCRIPTION_MODEL and TRANSCRIPTION_LANGUAGE as desired

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
| `TRANSCRIPTION_MODEL` | `base` | faster-whisper model size (`base`, `small`, `medium`, `large-v2`) |
| `TRANSCRIPTION_LANGUAGE` | *(auto-detect)* | Default language hint for transcription (e.g. `en`, `fr`) |

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
| `POST` | `/api/v1/media/upload` | Upload one or more media files (multipart/form-data); returns a list |
| `GET` | `/api/v1/media/{id}` | Get a single media file |
| `GET` | `/api/v1/media/{id}/stream` | Stream media file for in-browser playback |
| `DELETE` | `/api/v1/media/{id}` | Delete a media file and its stored data |
| `GET` | `/api/v1/jobs` | List transcription jobs (optional `?status=` filter) |
| `POST` | `/api/v1/jobs` | Create a transcription job for a media file |
| `GET` | `/api/v1/jobs/{id}` | Get a single job with full metadata including `transcript_id` and `error_message` |
| `POST` | `/api/v1/jobs/batch` | Create jobs for multiple `media_file_ids` in one request |
| `POST` | `/api/v1/jobs/{id}/retry` | Reset a failed job to `pending` and re-enqueue it |
| `GET` | `/api/v1/transcripts` | List transcripts (optional `?q=` and `?media_name=` filters) |
| `GET` | `/api/v1/transcripts/{id}` | Get transcript with full text and detected language |
| `PATCH` | `/api/v1/transcripts/{id}` | Update transcript metadata |
| `GET` | `/api/v1/transcripts/{id}/segments` | Get ordered timestamped segments |
| `PATCH` | `/api/v1/transcripts/{id}/segments/{segment_id}` | Edit a segment's text |
| `GET` | `/api/v1/transcripts/{id}/speakers` | List speakers (auto-synced from segments) |
| `PATCH` | `/api/v1/transcripts/{id}/speakers/{speaker_id}` | Rename a speaker |
| `GET` | `/api/v1/transcripts/{id}/export?format=txt\|srt\|vtt` | Download transcript as file |
| `GET` | `/api/v1/transcripts/{id}/chapters` | List chapters for a transcript |
| `POST` | `/api/v1/transcripts/{id}/chapters` | Create a chapter (title, start/end timestamps) |
| `PATCH` | `/api/v1/transcripts/{id}/chapters/{chapter_id}` | Update a chapter |
| `DELETE` | `/api/v1/transcripts/{id}/chapters/{chapter_id}` | Delete a chapter |
| `GET` | `/api/v1/transcripts/{id}/highlights` | List highlights for a transcript |
| `POST` | `/api/v1/transcripts/{id}/highlights` | Create a highlight (segment annotation with notes) |
| `DELETE` | `/api/v1/transcripts/{id}/highlights/{highlight_id}` | Delete a highlight |
| `GET` | `/api/v1/settings` | App configuration (name, env, storage dir, model, language) |
| `GET` | `/api/v1/settings/runtime` | Transcription engine info (model size, device, compute type) |

---

## Current Workflow

1. **Upload one or multiple media files** at `/media` — files are validated (empty uploads rejected), filenames sanitized, stored locally, and `MediaFile` records created; the batch upload form shows a per-file results summary and offers one-click **"Transcribe All"**
2. **Start transcription** — single job from the media detail page, or batch from the media list; HTTP response returns immediately (jobs run non-blocking in the background)
3. **Job runs via faster-whisper** — GPU (CUDA float16) automatically if available, CPU (int8) otherwise; model loaded lazily on first job
4. **Monitor at `/jobs`** — status badges (`pending`, `processing`, `completed`, `failed`); click a job for full detail; failed jobs show the error message prominently with a **Retry** button
5. **Completed job** produces a timestamped transcript with detected language and speaker placeholders ("Speaker 1")
6. **Review at `/transcripts/[id]`** — tabbed workspace:
   - **Workspace tab** — audio playback synced to segments (active segment highlighted; click to seek); horizontal timeline with chapter markers and current playback position; chapter editor inline
   - **Segments tab** — real-time text search; inline segment text and speaker editing with save success notification
   - **Speakers tab** — rename speaker labels across all segments
   - **Export tab** — download as TXT, SRT, or VTT
7. **Check engine configuration** at `/settings` — see app settings and transcription engine info (model size, device, compute type)
8. **Dashboard at `/dashboard`** — live stats, job queue with retry, recent media and transcripts

---

## Current Limitations

- Speaker diarization not yet implemented — all segments are labeled "Speaker 1"
- No waveform rendering — the timeline is a simple bar, not a detailed waveform
- Settings are read-only (env-var configured) — no in-app config changes yet
- SQLite only — no PostgreSQL support yet
- No user authentication
- Single-machine local deployment only

---

## Development Notes

### Backend

- **Add a new API resource:** create a model in `app/models/`, a schema in `app/schemas/`, a router in `app/routers/v1/`, and register it in `app/routers/v1/api.py`.
- **Models must be imported** in `app/models/__init__.py` for `SQLModel.metadata.create_all()` to pick them up.
- **Add business logic** in `app/services/`, not inside route handlers. Keep routers thin.
- **All new endpoints go under `/api/v1/`.** Introduce `/api/v2/` for breaking changes rather than modifying existing routes.
- **To swap the ASR engine**, override `_run_engine()` in `transcription_service.py`. Everything else (job lifecycle, persistence, speaker sync) remains unchanged.

### Frontend

- **Add a new app page** by creating `app/(app)/<route>/page.js`. It automatically inherits the shared AppShell and breadcrumbs from `app/(app)/layout.js`. Add `loading.js` alongside it for Suspense fallback behaviour.
- **Add shared components** under `components/<domain>/`.
- **All backend calls go through `lib/api.js`.** Do not call `fetch()` directly in components.
- **Stay JavaScript.** No TypeScript, no `.ts` or `.tsx` files.
- **Parallel routes are for `/dashboard` only.** Do not create `@slot` directories in other routes.
- **`'use client'`** is required only in components that use React hooks or browser APIs. Server components must not have it.

---

## Roadmap

The following items are planned for future phases and are **not yet implemented**:

- **Speaker diarization** — pyannote.audio or similar; `speaker_label` field already exists on `TranscriptSegment`
- **Detailed waveform rendering with playback sync** — replace the timeline bar with a full waveform visualisation
- **In-app settings editing** — write back to `.env` or DB-backed config; currently read-only
- **Export to DOCX and JSON**
- **PostgreSQL migration** — change `DATABASE_URL`; no ORM changes required
- **Authentication and multi-user support** — JWT-based auth; `app/core/security.py` stub is ready
- **Transcript confidence scores per segment**
- **Batch export**
