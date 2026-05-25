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

export function setCached(key: string, value: unknown, ttlMs: number) {
  store.set(key, { expires: Date.now() + ttlMs, value });
}

export function invalidateCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
