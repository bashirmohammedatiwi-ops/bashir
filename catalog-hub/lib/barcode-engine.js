/**
 * Cross-store barcode search engine — rebuilt on store adapters.
 */
import { STORES } from './stores/registry.js';
import {
  buildUnifiedBarcodeIndex,
  searchUnifiedBarcodeIndex,
  rememberBarcodeSearchHits,
} from './unified-barcode-index.js';
import { buildBarcodeRamIndex } from './barcodes.js';
import { lookupUpcByBarcode, lookupBarcodeProductMeta } from './barcodes.js';
import { normalizeBarcodeQuery } from './core/gtin.js';
import { dedupeHits, sortHitsStable } from './core/match.js';
import { ADAPTER_LIST, searchStoreBarcode } from './adapters/index.js';

export const STORE_META = Object.fromEntries(
  STORES.map((s) => [s.id, { id: s.id, label: s.label, path: s.path, domain: s.domain }]),
);

const SEARCH_CACHE_MS = 15 * 60 * 1000;
const SEARCH_CACHE_NEG_MS = 3 * 60 * 1000;
const searchResultCache = new Map();

const STORE_TIMEOUTS = {
  niceone: 18_000,
  elryan: 12_000,
  miraaya: 12_000,
  najd: 16_000,
  orisdi: 14_000,
  beautyway: 16_000,
  vaneersa: 16_000,
  miswag: 35_000,
  amazon: 22_000,
  faces: 50_000,
};

export function warmupBarcodeSearch() {
  buildBarcodeRamIndex();
  buildUnifiedBarcodeIndex();
}

export { normalizeBarcodeQuery };
export { normalizeGtinCompare } from './core/gtin.js';

function getCachedSearch(key) {
  const entry = searchResultCache.get(key);
  if (!entry) return null;
  const ttl = entry.data?.results?.length ? SEARCH_CACHE_MS : SEARCH_CACHE_NEG_MS;
  if (Date.now() - entry.at > ttl) {
    searchResultCache.delete(key);
    return null;
  }
  return entry.data;
}

function withTimeout(promise, ms, store) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`انتهت مهلة ${STORE_META[store]?.label || store}`)),
        ms,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function finalizePayload(barcode, byStore, errors, enabled) {
  const results = sortHitsStable(dedupeHits(Object.values(byStore).flat()));
  return {
    barcode,
    results,
    byStore,
    errors,
    stores: enabled.map(({ id }) => ({
      ...STORE_META[id],
      count: (byStore[id] || []).length,
    })),
  };
}

function rememberCache(cacheKey, storeKey, barcode, payload) {
  const hadTimeout = payload.errors?.some((e) => e.message?.includes('انتهت مهلة'));
  if (payload.results?.length) {
    rememberBarcodeSearchHits(payload.results);
    searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
    if (storeKey === 'all') {
      searchResultCache.set(`fast:all:${barcode}`, { at: Date.now(), data: { ...payload, fast: true } });
    }
  } else if (!hadTimeout) {
    searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
  }
}

function buildFacesHints(hintHits = [], upcData = null, resultHits = []) {
  const upcHints = upcData?.brand
    ? [{
        manufacturer: upcData.brand,
        manufacturerEn: upcData.brand,
        nameEn: upcData.title || '',
        name: upcData.title || upcData.brand,
        brand: upcData.brand,
        source: 'upc',
      }]
    : [];
  return [
    ...hintHits,
    ...upcHints,
    ...sortHitsStable(dedupeHits(resultHits))
      .filter((h) => h.store !== 'faces')
      .map((h) => ({
        name: h.name,
        nameEn: h.nameEn,
        manufacturer: h.manufacturer,
        manufacturerEn: h.manufacturerEn,
        brand: h.manufacturer,
        store: h.store,
      })),
  ];
}

function getEnabledAdapters(stores = null, { fast = false } = {}) {
  let list = ADAPTER_LIST;
  if (stores?.length) list = list.filter((a) => stores.includes(a.id));
  if (fast) {
    return list.filter((a) => ['niceone', 'miraaya', 'miswag', 'amazon', 'najd', 'vaneersa', 'orisdi'].includes(a.id));
  }
  return list;
}

export async function searchBarcodeAllStoresStreaming(rawQuery, onEvent, { stores = null, hintHits = [], fast = false } = {}) {
  const emit = (type, data = {}) => {
    try { onEvent?.({ type, ...data }); } catch { /* client */ }
  };

  const barcode = normalizeBarcodeQuery(rawQuery);
  if (!barcode) {
    const errPayload = { barcode: null, error: 'أدخل باركوداً صالحاً (8–14 رقم)', results: [], byStore: {}, errors: [] };
    emit('error', { error: errPayload.error });
    emit('done', { payload: errPayload });
    return errPayload;
  }

  const storeKey = stores?.length ? [...stores].sort().join(',') : 'all';
  const cacheKey = `${fast ? 'fast' : 'full'}:${storeKey}:${barcode}`;
  const cached = getCachedSearch(cacheKey);
  if (cached) {
    emit('start', { barcode, cached: true });
    emit('results', { payload: cached, source: 'cache' });
    emit('done', { payload: cached });
    return cached;
  }

  const enabled = getEnabledAdapters(stores, { fast });
  const byStore = {};
  const errors = [];

  const localHits = searchUnifiedBarcodeIndex(barcode);
  for (const h of localHits) {
    if (!enabled.some((a) => a.id === h.store)) continue;
    if (!byStore[h.store]) byStore[h.store] = [];
    byStore[h.store].push(h);
  }

  const pushPayload = (source) => {
    const payload = finalizePayload(barcode, byStore, errors, enabled);
    emit('results', { payload, source });
    return payload;
  };

  emit('start', {
    barcode,
    stores: enabled.map(({ id }) => ({
      id,
      ...STORE_META[id],
      status: (byStore[id] || []).length ? 'done' : 'pending',
      count: (byStore[id] || []).length,
      fromIndex: !!(byStore[id] || []).length,
    })),
  });

  if (localHits.length) pushPayload('index');

  for (const { id } of enabled) {
    emit('store-status', {
      store: id,
      status: (byStore[id] || []).length ? 'done' : 'searching',
      label: STORE_META[id]?.label || id,
      count: (byStore[id] || []).length,
      fromIndex: !!(byStore[id] || []).length,
    });
  }

  let metaPromise = null;
  const getMeta = () => {
    if (!metaPromise) metaPromise = lookupBarcodeProductMeta(barcode).catch(() => null);
    return metaPromise;
  };

  const nonFaces = enabled.filter((a) => a.id !== 'faces');
  const facesAdapter = enabled.find((a) => a.id === 'faces');
  const upcPromise = fast ? Promise.resolve(null) : lookupUpcByBarcode(barcode).catch(() => null);

  let facesStarted = false;

  const runFaces = async () => {
    if (!facesAdapter || facesStarted) return;
    facesStarted = true;
    emit('store-status', { store: 'faces', status: 'searching', label: STORE_META.faces?.label });

    const upcData = await Promise.race([upcPromise, sleep(2000).then(() => null)]);
    const hints = buildFacesHints(hintHits, upcData, Object.values(byStore).flat());
    const timeout = hints.length ? Math.max(STORE_TIMEOUTS.faces, 60_000) : STORE_TIMEOUTS.faces;

    try {
      const live = await withTimeout(
        searchStoreBarcode('faces', barcode, { hints, getMeta }),
        timeout,
        'faces',
      );
      byStore.faces = dedupeHits([...(live || []), ...(byStore.faces || [])]);
      emit('store-status', { store: 'faces', status: 'done', count: (byStore.faces || []).length });
    } catch (err) {
      errors.push({ store: 'faces', message: err?.message || 'فشل البحث' });
      emit('store-status', { store: 'faces', status: 'error', message: err?.message });
    }
    pushPayload('faces');
  };

  const nonFacesPromises = nonFaces.map(({ id }) => {
    const timeout = STORE_TIMEOUTS[id] || 15_000;
    const local = byStore[id] || [];
    if (!local.length) {
      emit('store-status', { store: id, status: 'searching', label: STORE_META[id]?.label });
    }
    return withTimeout(
      searchStoreBarcode(id, barcode, { fast, getMeta }),
      timeout,
      id,
    )
      .then((live) => {
        byStore[id] = !live?.length ? local : !local.length ? live : dedupeHits([...local, ...live]);
        emit('store-status', { store: id, status: 'done', count: (byStore[id] || []).length });
        return pushPayload('store');
      })
      .catch((err) => {
        errors.push({ store: id, message: err?.message || 'فشل البحث' });
        byStore[id] = local;
        emit('store-status', { store: id, status: 'error', message: err?.message });
        return pushPayload('store');
      });
  });

  if (!fast && facesAdapter) {
    void Promise.race([Promise.allSettled(nonFacesPromises), sleep(3500)]).then(() => runFaces());
  }

  await Promise.allSettled(nonFacesPromises);
  if (facesAdapter && !facesStarted) await runFaces();

  const payload = finalizePayload(barcode, byStore, errors, enabled);
  rememberCache(cacheKey, storeKey, barcode, payload);
  emit('done', { payload });
  return payload;
}

export async function searchBarcodeAllStores(rawQuery, { stores = null, fast = false, hintHits = [] } = {}) {
  let lastPayload = null;
  await searchBarcodeAllStoresStreaming(rawQuery, (event) => {
    if (event.type === 'done') lastPayload = event.payload;
  }, { stores, hintHits, fast });
  return lastPayload || { barcode: null, error: 'فشل البحث', results: [], byStore: {}, errors: [] };
}
