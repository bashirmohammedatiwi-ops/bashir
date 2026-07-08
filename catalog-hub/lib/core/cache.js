/** TTL cache بسيط وسريع — مشترك بين كل المتاجر */
const stores = new Map();

export function cacheGet(key, ttlMs) {
  const entry = stores.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ttlMs) {
    stores.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key, data) {
  stores.set(key, { at: Date.now(), data });
  return data;
}

export function cacheDel(prefix = '') {
  if (!prefix) {
    stores.clear();
    return;
  }
  for (const key of [...stores.keys()]) {
    if (key.startsWith(prefix)) stores.delete(key);
  }
}
