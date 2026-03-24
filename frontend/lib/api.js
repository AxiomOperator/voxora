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

  return res.json();
}

export function getMedia() {
  return apiFetch("/api/v1/media");
}

export function createMedia(payload) {
  return apiFetch("/api/v1/media", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBackendHealth() {
  return apiFetch("/api/v1/health");
}
