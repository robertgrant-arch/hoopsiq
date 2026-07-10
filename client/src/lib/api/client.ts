// Typed fetch wrapper. Reads auth token from Clerk if available,
// falls back to demo mode when VITE_DEMO_MODE=true or ?demo=true in URL.

// VITE_API_BASE: set to the Render server URL (e.g. https://hoopsiq.onrender.com)
// when the frontend (Vercel) and backend (Render) are hosted separately.
// Defaults to "/api" so relative calls work in the monorepo / local dev.
const RAW_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
// Always end with /api so callers can use paths like "/film-analysis/sessions".
const BASE: string = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;
/** Resolve the current first-party session token (Clerk is the parked fallback). */
export async function getApiToken(): Promise<string | null> {
  let token: string | null =
    typeof window !== "undefined" ? window.localStorage.getItem("hoopsiq.authToken") : null;
  if (!token) {
    try {
      const { Clerk } = window as any;
      if (Clerk?.session) token = await Clerk.session.getToken();
    } catch {
      // Clerk not loaded — demo mode
    }
  }
  return token;
}

/** The resolved API base (VITE_API_BASE-aware). Use for raw fetches to our API. */
export function apiBase(): string {
  return BASE;
}

/**
 * Authenticated fetch that returns the raw Response (no JSON parse / throw).
 * For call sites that need custom response handling — file uploads, polling,
 * non-JSON bodies — while still getting the bearer token + base URL that
 * apiFetch provides. Path is relative to the API base ("/film-analysis/...").
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getApiToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${BASE}${path}`, { ...options, headers });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getApiToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete(path: string) {
  return apiFetch<{ ok: boolean }>(path, { method: "DELETE" });
}
