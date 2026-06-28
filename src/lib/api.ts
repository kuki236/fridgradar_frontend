const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Dispatched when the access token can't be refreshed and the user is
 * effectively logged out. `auth.store` listens for it, calls `logout()`,
 * and the AuthProvider redirects to /login.
 */
export const AUTH_LOGOUT_EVENT = "auth:logout";

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts. If 6 parallel requests all
  // get 401, they share a single /api/auth/refresh call.
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;
    if (!refresh) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token: string; refresh_token: string };
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function forceLogout(reason: "expired" | "no_token"): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("active_household_id");
  // Notify the auth store. The store clears React state, and the
  // AuthProvider's effect redirects to /login.
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT, { detail: { reason } }));
  // Belt-and-suspenders: if the store is not subscribed (e.g. SSR, or the
  // page is in a weird state), still force navigation.
  if (
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/register"
  ) {
    window.location.assign("/login");
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isAuthEndpoint = path.startsWith("/api/auth/");

  const buildHeaders = (token: string | null): Record<string, string> => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(getToken()),
  });

  // Only auto-refresh for non-auth endpoints, otherwise we'd recurse on
  // bad credentials (the login endpoint returns 401 for wrong password).
  if (res.status === 401 && !isAuthEndpoint) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: buildHeaders(newToken),
      });
    } else {
      forceLogout("expired");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
