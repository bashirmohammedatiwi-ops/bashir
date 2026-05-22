import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_BASE } from "./config";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 30_000,
});

const refreshClient = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
});

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function readAuthStorage(): { accessToken?: string; refreshToken?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("alhayaa-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string; refreshToken?: string } };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function readPersistedToken(): string | null {
  return readAuthStorage()?.accessToken ?? null;
}

function readRefreshToken(): string | null {
  return readAuthStorage()?.refreshToken ?? null;
}

function persistTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("alhayaa-auth");
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = {
      ...(parsed.state ?? {}),
      accessToken,
      refreshToken,
    };
    localStorage.setItem("alhayaa-auth", JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
  inMemoryAccessToken = accessToken;
}

function clearAuthStorage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("alhayaa-auth");
  }
  inMemoryAccessToken = null;
}

if (typeof window !== "undefined") {
  inMemoryAccessToken = readPersistedToken();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = readRefreshToken();
    if (!refreshToken) return null;
    try {
      const resp = await refreshClient.post("/auth/refresh", { refreshToken });
      const data = (resp.data?.data ?? resp.data) as {
        accessToken: string;
        refreshToken: string;
      };
      persistTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = inMemoryAccessToken ?? readPersistedToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error?.response?.status;

    if (status === 401 && original && !original._retry && !original.url?.includes("/auth/login")) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    if (status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.includes("/login")) {
        clearAuthStorage();
        window.location.href = "/login/";
      }
    }

    return Promise.reject(error);
  },
);

export function setAuthToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryAccessToken ?? readPersistedToken();
}
