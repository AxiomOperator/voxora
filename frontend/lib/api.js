import { getApiBaseUrl } from "./env";

async function apiFetch(path, options = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

function buildQuery(params) {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

// ── Media ──────────────────────────────────────────────────────────────────

export function getMedia(params) {
  return apiFetch(`/api/v1/media${buildQuery(params)}`);
}

export const getMediaList = getMedia;

export function getMediaItem(mediaId) {
  return apiFetch(`/api/v1/media/${mediaId}`);
}

export const getMediaDetail = getMediaItem;

export function getMediaStreamUrl(mediaId) {
  return `${getApiBaseUrl()}/api/v1/media/${mediaId}/stream`;
}

export async function uploadMedia(formDataOrFile) {
  const base = getApiBaseUrl();
  let formData;
  if (formDataOrFile instanceof FormData) {
    formData = formDataOrFile;
  } else {
    formData = new FormData();
    formData.append("files", formDataOrFile);
  }

  const res = await fetch(`${base}/api/v1/media/upload`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type header — browser sets it with boundary automatically
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload error ${res.status}: ${text}`);
  }

  // Backend returns a list; unwrap single-file uploads for convenience
  const data = await res.json();
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

export function deleteMedia(mediaId) {
  return apiFetch(`/api/v1/media/${mediaId}`, { method: "DELETE" });
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export function getJobs(params) {
  return apiFetch(`/api/v1/jobs${buildQuery(params)}`);
}

export function getJob(jobId) {
  return apiFetch(`/api/v1/jobs/${jobId}`);
}

export function createJob(mediaFileIdOrData, language = null) {
  const body =
    typeof mediaFileIdOrData === "object"
      ? mediaFileIdOrData
      : { media_file_id: mediaFileIdOrData, language };
  return apiFetch("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Transcripts ────────────────────────────────────────────────────────────

export function getTranscripts(params) {
  return apiFetch(`/api/v1/transcripts${buildQuery(params)}`);
}

export function getTranscript(transcriptId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}`);
}

export function getTranscriptSegments(transcriptId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/segments`);
}

export function updateTranscript(transcriptId, payload) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateSegment(transcriptId, segmentId, payload) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/segments/${segmentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ── Speakers ───────────────────────────────────────────────────────────────

export function getSpeakers(transcriptId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/speakers`);
}

export function updateSpeaker(transcriptId, speakerId, nameOrData) {
  const body =
    typeof nameOrData === "object" ? nameOrData : { name: nameOrData };
  return apiFetch(`/api/v1/transcripts/${transcriptId}/speakers/${speakerId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ── Export ─────────────────────────────────────────────────────────────────

export function getExportUrl(transcriptId, format) {
  const base = getApiBaseUrl();
  return `${base}/api/v1/transcripts/${transcriptId}/export?format=${format}`;
}

// ── Health ─────────────────────────────────────────────────────────────────

export function getBackendHealth() {
  return apiFetch("/api/v1/health");
}

// ── Batch Jobs ─────────────────────────────────────────────────────────────

export function createBatchJobs(mediaFileIds) {
  return apiFetch("/api/v1/jobs/batch", {
    method: "POST",
    body: JSON.stringify({ media_file_ids: mediaFileIds }),
  });
}

export function retryJob(id) {
  return apiFetch(`/api/v1/jobs/${id}/retry`, { method: "POST" });
}

// ── Chapters ───────────────────────────────────────────────────────────────

export function getChapters(transcriptId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/chapters`);
}

export function createChapter(transcriptId, data) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/chapters`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateChapter(transcriptId, chapterId, data) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteChapter(transcriptId, chapterId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/chapters/${chapterId}`, {
    method: "DELETE",
  });
}

// ── Highlights ─────────────────────────────────────────────────────────────

export function getHighlights(transcriptId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/highlights`);
}

export function createHighlight(transcriptId, data) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/highlights`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteHighlight(transcriptId, highlightId) {
  return apiFetch(
    `/api/v1/transcripts/${transcriptId}/highlights/${highlightId}`,
    { method: "DELETE" },
  );
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSettings() {
  return apiFetch("/api/v1/settings");
}

export function getRuntimeInfo() {
  return apiFetch("/api/v1/settings/runtime");
}

// ── Projects ───────────────────────────────────────────────────────────────

export function getProjects() {
  return apiFetch("/api/v1/projects");
}

export function getProject(id) {
  return apiFetch(`/api/v1/projects/${id}`);
}

export function createProject(data) {
  return apiFetch("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProject(id, data) {
  return apiFetch(`/api/v1/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id) {
  return apiFetch(`/api/v1/projects/${id}`, { method: "DELETE" });
}

// ── Notes ──────────────────────────────────────────────────────────────────

export function getNotes(transcriptId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/notes`);
}

export function createNote(transcriptId, data) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNote(transcriptId, noteId, data) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteNote(transcriptId, noteId) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

// ── Media update ───────────────────────────────────────────────────────────

export function updateMedia(id, data) {
  return apiFetch(`/api/v1/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Diagnostics ────────────────────────────────────────────────────────────

export function getDiagnostics() {
  return apiFetch("/api/v1/diagnostics/status");
}

export function getSystemHealth() {
  return apiFetch("/api/v1/health");
}

// Check metrics endpoint availability (may fail with CORS — handle gracefully)
export async function checkMetricsAvailability(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/metrics`, { method: "HEAD" });
    return { available: res.ok, status: res.status };
  } catch {
    return { available: false, status: null };
  }
}
