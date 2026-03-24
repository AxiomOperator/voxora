# Voxora

A local-first transcription platform built with FastAPI and Next.js. Upload audio or video files, run real ASR transcription jobs powered by `faster-whisper`, and browse, edit, and export timestamped transcripts — all from a clean, dark-mode-capable web UI.

---

## Current Status

**Phase 10 complete.** The following is fully implemented and working:

- Structured FastAPI backend with versioned API routes under `/api/v1`
- uv-managed Python project
- SQLite database via SQLModel; new columns auto-migrated at startup
- Media upload (multipart, multiple files), listing, and deletion
  - Upload hardening: empty file uploads rejected (400); MIME type validation (audio/mpeg, audio/wav, audio/x-wav, audio/mp4, audio/ogg, audio/flac, video/mp4, video/quicktime, video/webm); filenames sanitized (leading dots stripped, special chars replaced, length truncated); collision-safe storage (_1, _2 suffix)
  - Graceful delete: missing files log warning, still clean up DB row
- **Audio streaming** — `GET /api/v1/media/{id}/stream` serves uploaded files; media detail page renders an HTML5 audio player
- **GPU-first real ASR transcription** via `faster-whisper` (WhisperModel) with lazy loading
  - Attempts CUDA GPU execution by default; automatic CPU fallback on failure (never faked)
  - Single-GPU semaphore (`threading.Semaphore(1)`) prevents concurrent GPU jobs on a single machine
  - Device selection configured via `TRANSCRIPTION_COMPUTE_DEVICE` env var (`auto` [default], `cuda`, `cpu`)
  - Beam width configured via `TRANSCRIPTION_BEAM_SIZE` env var (default: 5)
  - Model size configured via `TRANSCRIPTION_MODEL` env var (default: `base`; supports `small`, `medium`, `large-v2`)
  - Optional default language hint via `TRANSCRIPTION_LANGUAGE` env var (default: auto-detect)
- **Non-blocking transcription jobs** — run via FastAPI `BackgroundTasks`; HTTP response returns immediately
- Job lifecycle: `pending → processing → completed / failed`; error messages persisted on failure
- `TranscriptionJob` model carries a `runtime_metadata` JSON field populated on completion with:
  - `compute_device` (cuda / cpu)
  - `model_name` (e.g. "base")
  - `compute_type` (float16 / int8 / etc.)
  - `fallback_used` (true if GPU job fell back to CPU)
  - `fallback_reason` (error message if fallback occurred)
  - `processing_seconds` (elapsed time in seconds)
- **Job status filtering** — `GET /api/v1/jobs?status=` filters job list by status
- **Batch job creation** — `POST /api/v1/jobs/batch` creates jobs for multiple media files in one request
- **Job retry** — `POST /api/v1/jobs/{id}/retry` resets a failed job to `pending` and re-enqueues it
- **Diarization** — heuristic silence-gap speaker diarizer integrated post-ASR; optionally upgrade to pyannote.audio when HF token is available
  - Enable per-job via `POST /api/v1/jobs/batch` with `diarization_enabled: true`
  - Or set `DIARIZATION_ENABLED=true` in `.env` to enable by default
  - Diarization status recorded in `runtime_metadata`: `diarization_status`, `diarization_backend`, `diarization_error`
  - Configurable backend via `DIARIZATION_BACKEND` env var (`heuristic` [default] or `pyannote` when token available)
  - Maps speaker turns onto transcript segments by timestamp overlap
  - Never blocks transcript on diarization failure — ASR output always preserved
- Transcript persistence with full text, detected language, and ordered segments with timestamps
- **Transcript search/filtering** — `GET /api/v1/transcripts?q=&media_name=&status=` filters by text, source filename, or review status
- **Review workflow** — transcripts carry a `review_status` field (`draft → in_review → reviewed → exported`); status badge shown in list; `PATCH /api/v1/transcripts/{id}` updates status
- **Projects** — group media files and transcripts into named projects; full CRUD via `/api/v1/projects`; media and transcripts can be filtered by project
- **Notes** — attach free-text notes to any transcript, optionally pinned to a specific segment; full CRUD via `GET/POST/PATCH/DELETE /api/v1/transcripts/{id}/notes`
- Speaker model — segments carry `speaker_label`; `Speaker` rows are auto-synced from segments on job completion
- Speaker workflow — `GET /api/v1/transcripts/{id}/speakers` lists speakers; `PATCH /api/v1/transcripts/{id}/speakers/{speaker_id}` renames a speaker across all segments
- Transcript segment inline editing (`PATCH /api/v1/transcripts/{id}/segments/{seg_id}`)
- Transcript export in TXT, SRT, VTT, and JSON formats (`GET /api/v1/transcripts/{id}/export?format=txt|srt|vtt|json`)
- **Settings API** — `GET /api/v1/settings` returns app config; `PATCH /api/v1/settings` updates default language and model size
- **Runtime diagnostics API**
  - `GET /api/v1/runtime` returns runtime environment info plus `diarization_available` and `diarization_backend`
  - `GET /api/v1/runtime/transcription` returns GPU/CPU capabilities (device, model, compute type, available devices)
- **Prometheus metrics** — `GET /metrics` (at app root) exposes request counts and latencies in Prometheus format; ready for external scrapers
- **Diagnostics API** — `GET /api/v1/diagnostics/status` returns structured system status: DB connectivity, storage path availability, GPU detection, diarization availability, and transcription runtime info
- **Enriched health endpoint** — `GET /api/v1/health` returns `status`, `database`, `storage`, and `timestamp`
- Next.js App Router frontend, JavaScript-only, Mantine v7 UI
- **Shared `(app)` route group** — all main pages share a single AppShell layout via `app/(app)/layout.js`; root `app/layout.js` provides only html/body + Providers
- **Navigation** — AppShell nav links: Home · Media · Transcripts · Jobs · Projects · Dashboard · Settings
- **Breadcrumbs** on every page (pathname-based)
- **Improved error/empty states** — all list pages show an alert on fetch failure; empty states with contextual prompts
- `/dashboard` with parallel routes (`@queue`, `@recent`, `@stats`) — live job queue, recently reviewed transcripts, stats panel, and a compact `SystemStatusCard` health widget
- `/media` — list page with client-side search and batch upload form; each file links to its detail page
- `/media/[id]` — detail page with HTML5 audio player and "Start Transcription" action; shows linked project
- `/transcripts` — list page with search and filter by review status; status badge per transcript
- **Transcript detail — tabbed workspace:**
  - **Workspace tab** — HTML5 audio player synced to segments (`PlaybackSyncPanel` highlights the active segment; clicking a segment seeks the player) + timeline view; review status control
  - **Segments tab** — in-page text search filters segments in real-time; inline text and speaker editing with save notification
  - **Speakers tab** — rename speaker labels across all segments
  - **Notes tab** — create, edit, and delete notes; optionally pin a note to a specific segment
  - **Export tab** — download transcript as TXT, SRT, VTT, or JSON; skeleton loading state and empty state when no notes exist
- `/jobs` — list page with status filter; `/jobs/[jobId]` detail page with `JobRuntimePanel` showing error details, timestamps, media/transcript links, and a Retry button
- `/projects` — list, create, edit, and delete projects; `/projects/[projectId]` detail shows assigned media and transcripts
- `/settings` — Mantine Tabs layout with five tabs:
  - **General** — app configuration (default language, model size)
  - **Diarization** — speaker diarization settings (enable/disable, backend selection, HF token, pyannote setup)
  - **Transcription** — GPU/CPU capabilities and status (from runtime endpoints); `TranscriptionRuntimePanel` component displays 6-card grid (GPU availability, compute device, model, beam size, available devices, fallback behavior) + GPU status badge
  - **Runtime** — live system status badges for DB, storage, GPU, and transcription runtime (from diagnostics endpoint)
  - **Metrics** — shows whether `GET /metrics` is reachable (for operators)
- **Diarization panel** — `DiarizationRuntimePanel` shows diarization status, backend, and HF token guidance
- **Diarization status badge** — `DiarizationStatusBadge` reusable component on transcript detail, job detail, and runtime panel (green = success, orange = heuristic, red = error)
- **Batch upload diarization toggle** — "Start Transcription for All" button includes optional diarization flag
- **Transcript segment grouping** — segments grouped by speaker in detail view; active-segment highlighting; click-to-seek player sync
- **Batch job creation with diarization** — `POST /api/v1/jobs/batch` supports optional `diarization_enabled` flag per file
- **Job detail page** — shows GPU/CPU badge and fallback alert when `fallback_used=true`
- **Dashboard system status card** — includes "GPU Active / Not Available" line
- Backend: 69 tests (pytest + httpx TestClient)
- Frontend: 13 routes build cleanly

---

## GPU-First Transcription

Voxora prioritizes GPU acceleration for transcription while maintaining robust CPU fallback.

**Default Behavior (TRANSCRIPTION_COMPUTE_DEVICE=auto)**

- On startup, the backend detects NVIDIA CUDA availability
- When a transcription job starts, it attempts GPU execution if CUDA is available
- If a GPU job fails (out of memory, driver error, etc.), the job automatically retries on CPU
- Fallback is **truthful** — the job's `runtime_metadata` records `fallback_used: true` and the fallback reason
- A `threading.Semaphore(1)` prevents multiple concurrent GPU jobs on a single machine, serializing GPU workload

**GPU Job Isolation**

- Only one transcription job can use the GPU at a time (single-threaded GPU queue)
- When jobs exceed GPU capacity, they are queued and wait for the GPU to free up
- This prevents GPU memory collisions and ensures predictable performance

**Configuration**

- `TRANSCRIPTION_COMPUTE_DEVICE`: `auto` (default, GPU with CPU fallback) | `cuda` (force GPU, fail if unavailable) | `cpu` (force CPU only)
- `TRANSCRIPTION_BEAM_SIZE`: Decoding beam width (default: 5; higher = slower but potentially better quality)
- For CPU-only deployments or GPU-limited environments, set `TRANSCRIPTION_COMPUTE_DEVICE=cpu`

**Observability**

- Each completed job logs its compute device in `runtime_metadata`: device, model, compute type (float16/int8), and fallback status
- `/api/v1/runtime/transcription` endpoint reports available GPUs and current device capability
- `/settings` → **Transcription** tab displays GPU status, available devices, and fallback behavior
- Job detail page shows GPU/CPU badge and alerts on fallback

---

## Speaker Diarization

Voxora includes automatic speaker diarization to segment transcript audio by speaker turns and map them onto transcript segments.

**Default Behavior**

- By default, diarization is **disabled** (`DIARIZATION_ENABLED=false`)
- The heuristic diarizer uses silence gaps to identify speaker boundaries — no ML model required
- Enable diarization per-job via the batch upload form or `POST /api/v1/jobs/batch` with `diarization_enabled: true`
- Or enable globally by setting `DIARIZATION_ENABLED=true` in `.env`

**How It Works**

- After ASR transcription completes, if diarization is enabled, the diarization service analyzes the audio
- The heuristic diarizer identifies silence gaps (pauses) and assigns speaker turns
- Speaker turns are mapped onto transcript segments by timestamp overlap
- Segment `speaker_label` fields are populated with speaker identifiers (e.g., "Speaker 0", "Speaker 1")
- Diarization results in the segment list are automatically grouped by speaker for easy review

**Configuration**

- `DIARIZATION_ENABLED`: `true` or `false` (default: false); enables diarization for all jobs
- `DIARIZATION_BACKEND`: `heuristic` (default) | `pyannote` (requires Hugging Face token)
- `DIARIZATION_HF_TOKEN`: *(optional)* Hugging Face token for pyannote.audio model access (future)

**Upgrade Path: Pyannote**

- When ready to upgrade from heuristic to pyannote.audio diarization:
  1. Set `DIARIZATION_BACKEND=pyannote` in `.env`
  2. Provide `DIARIZATION_HF_TOKEN` (obtain from Hugging Face and accept pyannote model terms)
  3. First job will download and cache the pyannote model
  4. Pyannote provides much higher accuracy for speaker turns
- For now, the heuristic backend works without any external dependencies or tokens

**Failure Handling**

- If diarization fails for any reason (timeout, model error, etc.), the job does **not** fail
- ASR transcript is always preserved and marked as complete
- Diarization status is recorded in `runtime_metadata`: `diarization_status` (success | failed), `diarization_backend`, and `diarization_error` (if failed)
- Segments without speaker assignment retain empty `speaker_label` fields
- The `/api/v1/runtime` and `/api/v1/diagnostics/status` endpoints report diarization availability and backend

**Frontend**

- `/settings` → **Diarization** tab: enable/disable, backend selection, HF token guidance
- Job detail page: `DiarizationStatusBadge` shows diarization status (green = success, orange = heuristic, red = error)
- Transcript detail: segments grouped by speaker; click a segment to seek the audio player
- Batch upload form: "Start Transcription for All" button includes an optional diarization checkbox

---

## Runtime Diagnostics

Voxora provides two comprehensive runtime diagnostics endpoints:

- `GET /api/v1/runtime` — returns system runtime environment (Python version, library versions, OS info)
- `GET /api/v1/runtime/transcription` — returns transcription capabilities (current device, available GPUs, model info, compute type, beam size config)
- `GET /api/v1/diagnostics/status` — returns full system health (database connectivity, storage availability, GPU detection, transcription runtime info)

All three are consumed by the `/settings` UI and are suitable for external monitoring.

---

## Tech Stack

| Layer | Technology |
| Backend framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Backend language | Python 3.11+ |
| Backend package manager | [uv](https://github.com/astral-sh/uv) |
| ASR engine | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| ORM | [SQLModel](https://sqlmodel.tiangolo.com/) + SQLAlchemy |
| Database | SQLite (local file) |
| Config | pydantic-settings |
| Observability | [prometheus_client](https://github.com/prometheus/client_python) |
| Backend tests | pytest + httpx (TestClient) — 69 tests |
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
│   │   ├── dependencies.py
│   │   ├── core/              (config.py, security.py)
│   │   ├── db/                (database.py, init_db.py)
│   │   ├── models/            (media_file, transcription_job, transcript,
│   │   │                       transcript_segment, speaker, project, note)
│   │   ├── schemas/           (matching schemas + update schemas per model)
│   │   └── routers/
│   │       ├── health.py
│   │       └── v1/            (api, media, jobs, transcripts, speakers,
│   │                           settings, projects, notes, diagnostics)
│   │   └── services/          (file, transcription [faster-whisper],
│   │                           transcript, export, job, settings,
│   │                           project, note, diagnostics)
│   └── tests/                 (57 tests)
│       └── test_main.py
└── frontend/
    ├── app/
    │   ├── layout.js          (root: html/body + MantineProvider)
    │   ├── loading.js
    │   └── (app)/
    │       ├── layout.js      (AppShell with nav — shared by all pages)
    │       ├── page.js        (landing)
    │       ├── media/         (list + [mediaId] detail)
    │       ├── transcripts/   (list + [transcriptId] detail)
    │       ├── jobs/          (list + [jobId] detail)
    │       ├── projects/      (list + [projectId] detail)
    │       ├── settings/      (Tabs: General / Runtime / Metrics)
    │       └── dashboard/     (parallel routes: @queue, @recent, @stats)
    ├── components/
    │   ├── app-shell.js, app-nav.js, app-header.js, breadcrumbs.js
    │   ├── dashboard/         (queue-panel, recent-panel, stats-panel,
    │   │                       system-status-card)
    │   ├── media/             (upload-form, batch-upload-form, media-list,
    │   │                       media-detail, media-audio-player)
    │   ├── jobs/              (job-list, job-detail, job-status-card,
    │   │                       retry-job-button, job-filters, job-runtime-panel)
    │   ├── transcripts/       (transcript-list, transcript-detail,
    │   │                       transcript-segment-list,
    │   │                       transcript-segment-editor, speaker-editor,
    │   │                       export-actions, review-status-control,
    │   │                       note-list, note-editor)
    │   ├── projects/          (project-list, project-form, project-selector)
    │   └── settings/          (settings-form, runtime-info, system-status,
    │                           metrics-status)
    └── lib/
        ├── api.js             (all backend API calls)
        └── env.js
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (`pip install uv` or see uv docs)
- Node.js 18+ and npm
- *(Optional)* NVIDIA GPU with CUDA for accelerated transcription

### Backend

```bash
cd backend
uv venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"
cp .env.example .env            # edit as needed
uvicorn app.main:app --reload --port 8000
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Frontend

```bash
cd frontend
npm install
# create .env.local with: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev                     # runs on port 3000
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration

### Backend `.env` (copy from `.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `Voxora` | Application name |
| `APP_ENV` | `development` | Environment |
| `DATABASE_URL` | `sqlite:///./voxora.db` | SQLite database path |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
| `STORAGE_DIR` | `storage/uploads` | File upload directory |
| `TRANSCRIPTION_MODEL` | `base` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large-v2`) |
| `TRANSCRIPTION_LANGUAGE` | *(empty)* | Default language hint; empty = auto-detect |
| `TRANSCRIPTION_COMPUTE_DEVICE` | `auto` | Compute device (`auto`, `cuda`, `cpu`); `auto` attempts GPU with CPU fallback |
| `TRANSCRIPTION_BEAM_SIZE` | `5` | Beam width for decoding |
| `DIARIZATION_ENABLED` | `false` | Enable speaker diarization by default |
| `DIARIZATION_BACKEND` | `heuristic` | Diarization backend (`heuristic`, `pyannote`) |
| `DIARIZATION_HF_TOKEN` | *(empty)* | Hugging Face token for pyannote.audio (future) |

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (e.g. `http://localhost:8000`) |

---

## API Reference

`GET /metrics` is mounted at the app root. All other routes are versioned under `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/metrics` | Prometheus-format metrics (request counts, latencies) |
| `GET` | `/api/v1/health` | Health check — returns `status`, `database`, `storage`, `timestamp` |
| `GET` | `/api/v1/runtime` | Runtime environment info (includes diarization availability and backend) |
| `GET` | `/api/v1/runtime/transcription` | Transcription capabilities (GPU/CPU, available devices, model) |
| `GET` | `/api/v1/diagnostics/status` | Full system status: DB, storage, GPU, diarization, transcription runtime |
| `GET` `POST` | `/api/v1/media` | List / create media records |
| `POST` | `/api/v1/media/upload` | Upload one or more files (multipart) |
| `GET` `PATCH` `DELETE` | `/api/v1/media/{id}` | Get / update / delete a media file |
| `GET` | `/api/v1/media/{id}/stream` | Stream uploaded audio/video |
| `GET` `POST` | `/api/v1/jobs` | List / create transcription jobs |
| `POST` | `/api/v1/jobs/batch` | Create jobs for multiple media files (supports diarization_enabled flag) |
| `POST` | `/api/v1/jobs/{id}/retry` | Retry a failed job |
| `GET` | `/api/v1/jobs/{id}` | Get job detail |
| `GET` `POST` | `/api/v1/transcripts` | List / create transcripts |
| `GET` `PATCH` | `/api/v1/transcripts/{id}` | Get / update a transcript (incl. review_status) |
| `GET` | `/api/v1/transcripts/{id}/export` | Export transcript (`?format=txt\|srt\|vtt\|json`) |
| `GET` | `/api/v1/transcripts/{id}/speakers` | List speakers for a transcript |
| `PATCH` | `/api/v1/transcripts/{id}/speakers/{speaker_id}` | Rename a speaker |
| `GET` `POST` | `/api/v1/transcripts/{id}/notes` | List / create notes |
| `PATCH` `DELETE` | `/api/v1/transcripts/{id}/notes/{note_id}` | Update / delete a note |
| `GET` `POST` | `/api/v1/projects` | List / create projects |
| `GET` `PATCH` `DELETE` | `/api/v1/projects/{id}` | Get / update / delete a project |
| `GET` `PATCH` | `/api/v1/settings` | Get / update app settings |

---

## Typical Workflow

1. Upload one or more audio/video files via `/media`
2. Optionally group files into a project via `/projects`
3. Start transcription jobs from the media detail page
4. Monitor job queue on `/jobs` or `/dashboard`
5. Check system health at `/settings` → Runtime tab
6. When jobs complete, open a transcript on `/transcripts`
7. Edit segment text and speaker labels
8. Add notes to flag interesting moments
9. Advance review status (`draft → in_review → reviewed`)
10. Export the final transcript (TXT, SRT, VTT, or JSON)
11. Filter past work by project, review status, or text search
12. External monitoring can scrape `GET /metrics`

---

## Observability

- `GET /metrics` returns Prometheus-format metrics (request counts, latencies) — ready for external scrapers; no Prometheus server or Grafana required
- `GET /api/v1/diagnostics/status` provides structured health data: DB connectivity, storage availability, GPU detection, and transcription runtime info
- `/settings` → **Runtime** tab surfaces live system status badges in the UI
- `/settings` → **Metrics** tab shows whether `GET /metrics` is reachable (for operators)

---

## Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

69 tests covering health, diagnostics, runtime, media, jobs, transcripts, speakers, projects, notes, settings, export, diarization, and batch operations.

---

## Known Limitations

- **Single-user, local-only** — no authentication or multi-user support
- **SQLite only** — no PostgreSQL support yet
- **Polling only** — no real-time job progress (frontend polls on a timer)
- **Heuristic diarization by default** — silence-gap based; pyannote.audio integration available when HF token provided (future)
- **No waveform editor** — the timeline panel is a lightweight placeholder; full waveform editing is not implemented
- **No Prometheus server included** — `GET /metrics` exposes the endpoint; running Prometheus or Grafana is left to the operator
- **No Docker or cloud deployment** — local development only

---

## Roadmap

- Pyannote.audio speaker diarization (upgrade path, requires HF token)
- PostgreSQL support
- Multi-user authentication
- WebSocket job progress (replace polling)
- Grafana dashboard configuration
- Advanced waveform editing
- Cloud storage (S3 / GCS)
