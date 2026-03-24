import { getApiBaseUrl } from "@/lib/env";

export async function GET() {
  const local = { status: "ok", service: "voxora-frontend" };

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/health`, { cache: "no-store" });
    if (res.ok) {
      const backend = await res.json();
      return Response.json({ ...local, backend });
    }
  } catch {
    // Backend unreachable — return local health only
  }

  return Response.json(local);
}
