import { API_BASE } from "./config";

/** Lightweight health ping — no auth headers, no interceptors. */
export async function pingServer(timeoutMs = 6000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
