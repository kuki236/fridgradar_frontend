const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export const authApi = {
  register: (data: RegisterInput) =>
    apiRequest<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: LoginInput) =>
    apiRequest<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<TokenResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: () =>
    apiRequest<{ message: string; revoked: { access: boolean; refresh: boolean } }>(
      "/api/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({
          refresh_token:
            typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null,
        }),
      },
    ),

  me: () => apiRequest<UserResponse>("/api/auth/me"),

  // RF-AUT-001: edit the current user's profile (Settings page).
  updateMe: (data: Partial<Pick<UserResponse, "full_name">>) =>
    apiRequest<UserResponse>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
