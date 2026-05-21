import axios from "axios";
import { API_BASE } from "./config";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 30_000,
});

let inMemoryAccessToken: string | null = null;

function readPersistedToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("alhayaa-auth");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
      if (parsed.state?.accessToken) return parsed.state.accessToken;
    }
  } catch {
    /* ignore */
  }
  return null;
}

if (typeof window !== "undefined") {
  inMemoryAccessToken = readPersistedToken();
}

api.interceptors.request.use((config) => {
  const token = inMemoryAccessToken ?? readPersistedToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.includes("/login")) {
        localStorage.removeItem("alhayaa-auth");
        inMemoryAccessToken = null;
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
