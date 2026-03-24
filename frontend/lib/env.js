/**
 * Centralised environment variable access for the frontend.
 * Never read process.env directly in components — use these helpers.
 */

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}
