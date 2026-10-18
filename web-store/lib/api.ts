import { API_INTERNAL, API_PUBLIC } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function unwrap<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in (json as Record<string, unknown>)) {
    const j = json as Record<string, unknown>;
    // قوائم مقسّمة: نُبقي meta مع البيانات.
    if ("meta" in j) return j as T;
    return j.data as T;
  }
  return json as T;
}

function errorMessage(json: unknown, status: number) {
  const j = json as { error?: { message?: string | string[] }; message?: string | string[] } | null;
  const m = j?.error?.message ?? j?.message;
  const text = Array.isArray(m) ? m[0] : m;
  if (text && /[؀-ۿ]/.test(text)) return text;
  if (status === 401) return "انتهت الجلسة — سجّلي الدخول من جديد";
  if (status === 404) return "غير موجود";
  if (status >= 500) return "تعذّر الاتصال بالمتجر — حاولي بعد لحظات";
  return text || "حدث خطأ — حاولي مرة أخرى";
}

/** طلب من السيرفر (Server Components) — مع تخزين مؤقت قصير. */
export async function serverGet<T>(path: string, opts: { revalidate?: number; tags?: string[] } = {}): Promise<T> {
  const res = await fetch(`${API_INTERNAL}${path}`, {
    headers: { "X-Client": "deema-app", "X-SSR": "deema-web", Accept: "application/json" },
    next: { revalidate: opts.revalidate ?? 60, tags: opts.tags },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorMessage(json, res.status), res.status);
  return unwrap<T>(json);
}

/** نسخة لا ترمي خطأ: null عند الفشل (للأقسام الاختيارية). */
export async function serverTry<T>(path: string, opts?: { revalidate?: number }): Promise<T | null> {
  try {
    return await serverGet<T>(path, opts);
  } catch {
    return null;
  }
}

// ---- المتصفح ----
type TokenGetter = () => { access?: string | null; refresh?: string | null };
type TokenSetter = (t: { accessToken: string; refreshToken?: string } | null) => void;
let getTokens: TokenGetter = () => ({});
let setTokens: TokenSetter = () => {};
export function bindAuth(get: TokenGetter, set: TokenSetter) {
  getTokens = get;
  setTokens = set;
}

let refreshing: Promise<boolean> | null = null;
async function refreshToken(): Promise<boolean> {
  const { refresh } = getTokens();
  if (!refresh) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_PUBLIC}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const t = unwrap<{ accessToken: string; refreshToken?: string }>(await res.json());
      setTokens(t);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; query?: Record<string, unknown> } = {},
): Promise<T> {
  const qs = opts.query
    ? "?" +
      new URLSearchParams(
        Object.entries(opts.query)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  const send = async () => {
    const headers: Record<string, string> = { Accept: "application/json", "X-Client": "deema-app" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    const access = getTokens().access;
    if (access && opts.auth !== false) headers.Authorization = `Bearer ${access}`;
    return fetch(`${API_PUBLIC}${path}${qs === "?" ? "" : qs}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  };
  let res = await send();
  if (res.status === 401 && opts.auth !== false && getTokens().refresh) {
    if (await refreshToken()) res = await send();
    else setTokens(null);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorMessage(json, res.status), res.status);
  return unwrap<T>(json);
}
