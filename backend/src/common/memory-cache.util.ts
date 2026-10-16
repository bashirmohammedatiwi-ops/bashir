type CacheEntry = { expires: number; value: unknown };

const store = new Map<string, CacheEntry>();

export function getCached<T>(key: string): T | null {
  const row = store.get(key);
  if (!row || row.expires < Date.now()) {
    if (row) store.delete(key);
    return null;
  }
  return row.value as T;
}

/** حد أعلى للمفاتيح — يُنظَّف المنتهي ثم الأقدم، فلا تتضخم ذاكرة الخادم. */
const MAX_ENTRIES = 1500;

export function setCached(key: string, value: unknown, ttlMs: number) {
  store.delete(key);
  store.set(key, { expires: Date.now() + ttlMs, value });
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, row] of store) {
    if (row.expires < now) store.delete(k);
  }
  for (const k of store.keys()) {
    if (store.size <= MAX_ENTRIES) break;
    store.delete(k);
  }
}

export function invalidateCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
