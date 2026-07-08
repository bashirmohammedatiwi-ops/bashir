/**
 * Catalog import — rebuilt on store adapters.
 * Search + fetch full product with ALL shades.
 */
import {
  searchBarcodeAllStores,
  searchBarcodeAllStoresStreaming,
  STORE_META,
} from './barcode-engine.js';
import { fetchStoreProduct } from './adapters/index.js';
import { buildImportPayload, toImportSummary } from './core/import-payload.js';
import { pickBestHitPerStore } from './core/hit-filter.js';
import { isAmazonBundleListing } from './amazon-api.js';

function hasArabicText(text = '') {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function hitsToImportOptions(data) {
  const filtered = pickBestHitPerStore(data.results || []);
  return filtered
    .filter((r) => r.id || r.sku)
    .filter((r) => {
      if (r.store !== 'amazon') return true;
      return Boolean(r.name || r.nameEn || r.thumb);
    })
    .filter((r) => {
      if (r.store !== 'amazon') return true;
      return !isAmazonBundleListing(r.nameEn || '', r.name || '');
    })
    .filter((r, _i, arr) => {
      if (r.store !== 'amazon') return true;
      const amazonRows = arr.filter((x) => x.store === 'amazon');
      if (amazonRows.length <= 1) return true;
      const best = [...amazonRows].sort((a, b) => {
        const score = (x) =>
          (hasArabicText(x.name) ? 5 : 0) +
          (x.nameEn ? 2 : 0) +
          (x.thumb ? 3 : 0) +
          (x.shadeCount || 0);
        return score(b) - score(a);
      })[0];
      return (r.id || r.sku) === (best.id || best.sku);
    })
    .map((r) => ({
      store: r.store,
      storeLabel: r.storeLabel || STORE_META[r.store]?.label || r.store,
      sourceId: r.id || r.sku,
      sku: r.sku || r.id,
      nameAr: r.name,
      nameEn: r.nameEn,
      brandAr: r.manufacturer,
      brandEn: r.manufacturerEn,
      thumb: r.thumb,
      barcode: r.barcode,
      shadeName: r.shadeName,
      matchType: r.matchType || 'product',
      shadeCount: r.shadeCount,
      imageCount: r.imageCount,
      categoryHint: r.categoryHint,
      categoryHintEn: r.categoryHintEn,
    }));
}

function importPayloadFromSearch(data) {
  const options = hitsToImportOptions(data);
  return {
    barcode: data.barcode,
    options,
    errors: data.errors || [],
    byStore: Object.fromEntries(
      Object.entries(data.byStore || {}).map(([k, v]) => [k, (v || []).length]),
    ),
  };
}

export async function searchImportByBarcode(rawBarcode, { fast = false, stores = null, hintHits = [] } = {}) {
  const data = await searchBarcodeAllStores(rawBarcode, { fast, stores, hintHits });
  if (data.error) {
    return { barcode: null, error: data.error, options: [], errors: [] };
  }
  return importPayloadFromSearch(data);
}

export async function searchImportByBarcodeStream(rawBarcode, onEvent, { stores = null, hintHits = [] } = {}) {
  const emit = (type, data = {}) => {
    try { onEvent?.({ type, ...data }); } catch { /* client */ }
  };

  let lastPayload = null;

  await searchBarcodeAllStoresStreaming(rawBarcode, (event) => {
    if (event.type === 'start') {
      emit('start', { barcode: event.barcode, stores: event.stores, cached: event.cached });
    }
    if (event.type === 'store-status') {
      emit('store-status', event);
    }
    if (event.type === 'results' && event.payload) {
      lastPayload = event.payload;
      const partial = importPayloadFromSearch(event.payload);
      emit('results', { ...partial, errors: event.payload.errors || partial.errors });
    }
    if (event.type === 'error') {
      emit('error', event);
    }
    if (event.type === 'done') {
      lastPayload = event.payload || lastPayload;
      const finalResult = lastPayload?.error
        ? { barcode: null, error: lastPayload.error, options: [], errors: [] }
        : importPayloadFromSearch(lastPayload || { barcode: null, results: [], byStore: {}, errors: [] });
      emit('done', finalResult);
    }
  }, { stores, hintHits });

  if (lastPayload?.error) {
    return { barcode: null, error: lastPayload.error, options: [], errors: [] };
  }
  return importPayloadFromSearch(lastPayload || { barcode: null, results: [], byStore: {}, errors: [] });
}

export async function fetchImportProduct(store, sourceId, { hubOrigin = '', barcode = '', light = false } = {}) {
  const id = String(sourceId || '').trim();
  if (!id || !store) return { error: 'المتجر ومعرّف المنتج مطلوبان' };

  const product = await fetchStoreProduct(store, id, {
    barcodeHint: barcode,
    light,
  });

  if (!product) return { error: 'لم يُعثر على المنتج في الكتالوج' };
  return { product: buildImportPayload(store, product, { hubOrigin }) };
}

export async function fetchImportSummary(store, sourceId, { hubOrigin = '', barcode = '' } = {}) {
  const result = await fetchImportProduct(store, sourceId, { hubOrigin, barcode, light: true });
  if (result.error) return { error: result.error };
  return { summary: toImportSummary(result.product) };
}

// Re-export for backward compatibility
export { STORE_META };
