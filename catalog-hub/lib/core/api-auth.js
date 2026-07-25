const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';

let token = null;
let tokenAt = 0;
const TOKEN_TTL_MS = 14 * 60 * 1000; // refresh before typical 15m expiry

function isAuthError(status, msg = '') {
  const m = String(msg).toLowerCase();
  return status === 401 || m.includes('unauthorized') || m.includes('jwt');
}

export async function login(retries = 3) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error?.message || json?.message || res.statusText;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
      }
      token = (json?.data ?? json).accessToken;
      tokenAt = Date.now();
      return token;
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function getToken(force = false) {
  if (!token || force || Date.now() - tokenAt > TOKEN_TTL_MS) {
    await login();
  }
  return token;
}

export async function api(pathname, { method = 'GET', body, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const t = await getToken(attempt > 0);
    const headers = { Accept: 'application/json', Authorization: `Bearer ${t}` };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${pathname}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json?.data ?? json;
    const msg = json?.error?.message || json?.message || res.statusText;
    const errMsg = Array.isArray(msg) ? msg.join(', ') : String(msg);
    if (isAuthError(res.status, errMsg) && attempt < retries) {
      console.log('↻ token expired — re-login');
      token = null;
      continue;
    }
    lastErr = new Error(errMsg);
  }
  throw lastErr;
}

export { API_BASE };
