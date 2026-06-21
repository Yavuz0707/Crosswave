import axios, { AxiosError } from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEY = "cw_token";

/**
 * Token store.
 *
 * NOTE (security): the JWT is kept in localStorage for MVP convenience so it
 * survives page reloads. localStorage is readable by any script, so it is
 * vulnerable to XSS. For production this should be moved to an httpOnly,
 * Secure, SameSite cookie set by the backend.
 */
export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

/** Fired when the API returns 401 so the app can drop the session. */
export const UNAUTHORIZED_EVENT = "cw:unauthorized";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Extract a human-friendly message from an axios/FastAPI error. */
export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation errors come back as an array of objects.
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first?.msg) return String(first.msg);
    }
    if (!error.response) {
      return "Cannot reach the server. Is the API running?";
    }
  }
  return fallback;
}
