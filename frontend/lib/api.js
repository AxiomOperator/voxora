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
