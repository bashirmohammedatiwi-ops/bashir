import { CACHE_MS } from './http.js';

export function createCategoryCache(fetchTree, { ttlMs = CACHE_MS } = {}) {
  let cache = { tree: null, leaves: null, all: null, fetchedAt: 0 };

  async function get({ force = false } = {}) {
    if (!force && cache.tree && Date.now() - cache.fetchedAt < ttlMs) {
      return cache;
    }
    const result = await fetchTree();
    cache = { ...result, fetchedAt: Date.now() };
    return cache;
  }

  function set(partial) {
    cache = { ...cache, ...partial, fetchedAt: Date.now() };
    return cache;
  }

  function getState() {
    return cache;
  }

  return { get, set, getState };
}
