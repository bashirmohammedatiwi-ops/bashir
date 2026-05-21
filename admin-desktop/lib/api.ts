import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/v1";

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
  return localStorage.getItem("accessToken");
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

export function setAuthToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
  }
}

export function getAuthToken(): string | null {
  return inMemoryAccessToken;
}
