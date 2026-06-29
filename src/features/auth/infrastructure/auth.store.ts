import { create } from "zustand";
import { authApi, type UserResponse } from "@/features/auth/infrastructure/auth.service";
import { AUTH_LOGOUT_EVENT } from "@/lib/api";

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: UserResponse) => void;
}

// Listener instalado a nivel de módulo: si el token expira y la lib/api
// no logra refrescarlo, dispara el evento y el store se limpia. El
// AuthProvider detecta isAuthenticated=false y redirige a /login.
if (typeof window !== "undefined") {
  window.addEventListener(AUTH_LOGOUT_EVENT, () => {
    const store = useAuthStore.getState();
    store.logout();
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.login({ email, password });
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.register({ email, password, full_name: fullName });
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const tokens = await authApi.refresh(refreshToken);
          localStorage.setItem("access_token", tokens.access_token);
          localStorage.setItem("refresh_token", tokens.refresh_token);
          const user = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
