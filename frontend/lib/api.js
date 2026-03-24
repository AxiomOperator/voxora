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

// ── Media ──────────────────────────────────────────────────────────────────

export function getMedia() {
  return apiFetch("/api/v1/media");
}

export function getMediaItem(mediaId) {
  return apiFetch(`/api/v1/media/${mediaId}`);
}

export async function uploadMedia(file) {
  const base = getApiBaseUrl();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${base}/api/v1/media/upload`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type header — browser sets it with boundary automatically
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload error ${res.status}: ${text}`);
  }

  return res.json();
}

export function deleteMedia(mediaId) {
  return apiFetch(`/api/v1/media/${mediaId}`, { method: "DELETE" });
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export function getJobs() {
  return apiFetch("/api/v1/jobs");
}

export function getJob(jobId) {
  return apiFetch(`/api/v1/jobs/${jobId}`);
}

export function createJob(mediaFileId, language = null) {
  return apiFetch("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify({ media_file_id: mediaFileId, language }),
  });
}

// ── Transcripts ────────────────────────────────────────────────────────────

export function getTranscripts() {
  return apiFetch("/api/v1/transcripts");
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

export function updateSpeaker(transcriptId, speakerId, name) {
  return apiFetch(`/api/v1/transcripts/${transcriptId}/speakers/${speakerId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
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
