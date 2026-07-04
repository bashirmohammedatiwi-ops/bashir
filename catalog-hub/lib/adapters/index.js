/**
 * Store adapters — unified product fetch + barcode search via full native pipelines.
 */
import { fromLegacyProduct } from '../core/product.js';
import { STORES } from '../stores/registry.js';
import {
  searchNiceOneByBarcode,
  searchElryanByBarcode,
  searchMiraayaByBarcode,
  searchFacesByBarcode,
  searchAmazonByBarcode,
  searchMiswagByBarcode,
  searchOrisdiByBarcode,
  searchBeautywayByBarcode,
  searchVaneersaByBarcode,
  searchNajdByBarcode,
} from './store-barcode-search.js';

import {
  fetchProductDetail as fetchNiceOneDetail,
} from '../api.js';
import { enrichShadesFromDatabase } from '../barcodes.js';
import { fetchProductByIdBilingual } from '../elryan-api.js';
import {
  resolveProductByBarcode,
  fetchProductBySku,
  fetchProductById as fetchMiraayaById,
  normalizeProductDetail as normalizeMiraayaDetail,
} from '../miraaya-api.js';
import {
  fetchProductById as fetchFacesById,
  normalizeProductDetailFromRaw as normalizeFacesDetail,
} from '../faces-api.js';
import {
  fetchProductByAsin,
  enrichAmazonShadeBarcodes,
  isAmazonBundleListing,
} from '../amazon-api.js';
import { fetchProductDetail as fetchMiswagDetail } from '../miswag-api.js';
import { fetchProductDetail as fetchOrisdiDetail } from '../orisdi-api.js';
import { fetchProductDetail as fetchBeautywayDetail } from '../beautyway-api.js';
import { fetchProductDetail as fetchNajdDetail } from '../najd-api.js';
import { fetchProductDetail as fetchVaneersaDetail } from '../vaneersa-api.js';
import { enrichShadesForImport } from '../barcodes.js';

const STORE_SEARCH_FN = {
  niceone: searchNiceOneByBarcode,
  elryan: searchElryanByBarcode,
  miraaya: searchMiraayaByBarcode,
  faces: (barcode, opts) => searchFacesByBarcode(barcode, opts?.hints || []),
  amazon: searchAmazonByBarcode,
  miswag: searchMiswagByBarcode,
  orisdi: searchOrisdiByBarcode,
  beautyway: searchBeautywayByBarcode,
  vaneersa: searchVaneersaByBarcode,
  najd: searchNajdByBarcode,
};

async function withTimeout(promise, ms, fallback = null) {
  if (!ms || ms <= 0) return promise;
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function createAdapter(storeId, fetchProduct) {
  const meta = STORES.find((s) => s.id === storeId) || { id: storeId, label: storeId };
  const searchFn = STORE_SEARCH_FN[storeId];
  return {
    id: storeId,
    label: meta.label,
    async searchBarcode(barcode, opts = {}) {
      if (!searchFn) return [];
      const hits = await searchFn(barcode, opts);
      return (hits || []).map((h) => ({
        ...h,
        store: storeId,
        storeLabel: meta.label,
        name: h.name || h.nameAr,
        manufacturer: h.manufacturer || h.brandAr,
        manufacturerEn: h.manufacturerEn || h.brandEn,
      }));
    },
    fetchProduct,
  };
}

export const ADAPTERS = {
  niceone: createAdapter('niceone', async (id, { barcodeHint = '', light = false } = {}) => {
    const { normalizeProductDetail, extractBarcode } = await import('../api.js');
    const [detail, detailEn] = await Promise.all([
      fetchNiceOneDetail(id),
      fetchNiceOneDetail(id, null, { lang: 'en' }),
    ]);
    if (!detail?.id) return null;
    let normalized = normalizeProductDetail(detail, detailEn);
    if (!light && normalized.shades?.length) {
      normalized.shades = await enrichShadesFromDatabase(detail);
      normalized.shadeCount = normalized.shades.length;
    }
    normalized.barcode = extractBarcode(detail) || barcodeHint || normalized.barcode;
    return fromLegacyProduct(normalized);
  }),

  elryan: createAdapter('elryan', async (id) => {
    const raw = await fetchProductByIdBilingual(id);
    return raw?.id ? fromLegacyProduct(raw) : null;
  }),

  miraaya: createAdapter('miraaya', async (id, { barcodeHint = '' } = {}) => {
    const key = String(id || '').trim();
    let raw = null;
    if (barcodeHint) raw = await resolveProductByBarcode(barcodeHint).catch(() => null);
    if (!raw && key.includes('-')) raw = await fetchProductBySku(key);
    if (!raw && /^\d+$/.test(key) && key.length <= 7) raw = await fetchMiraayaById(key);
    if (!raw) raw = await fetchProductBySku(key);
    if (!raw) raw = await resolveProductByBarcode(key).catch(() => null);
    if (!raw?.id && !raw?.sku) return null;
    return fromLegacyProduct(normalizeMiraayaDetail(raw));
  }),

  faces: createAdapter('faces', async (id, { light = false } = {}) => {
    const raw = await fetchFacesById(id, { enrichShades: !light });
    return raw?.id ? fromLegacyProduct(normalizeFacesDetail(raw)) : null;
  }),

  amazon: createAdapter('amazon', async (id, { barcodeHint = '', light = false } = {}) => {
    const asin = String(id || '').trim().toUpperCase();
    const raw = await withTimeout(fetchProductByAsin(asin), light ? 18_000 : 35_000, null);
    if (!raw?.id || isAmazonBundleListing(raw.nameEn, raw.nameAr)) return null;
    const hint = String(barcodeHint || '').replace(/\D/g, '');
    if (hint) raw.barcode = hint;
    if (!light && raw.shades?.length) {
      raw.shades = await enrichAmazonShadeBarcodes(raw, {
        barcodeHint: hint,
        maxLookups: raw.shades.length,
        timeoutMs: 60_000,
      });
    }
    return fromLegacyProduct(raw);
  }),

  miswag: createAdapter('miswag', async (id, { barcodeHint = '', light = false } = {}) => {
    const detail = await withTimeout(fetchMiswagDetail(id), light ? 15_000 : 35_000, null);
    if (!detail?.id) return null;
    let product = fromLegacyProduct(detail);
    const hint = String(barcodeHint || '').replace(/\D/g, '');
    if (!light && product.shades.length) {
      const enriched = await enrichShadesForImport(
        { ...detail, shades: product.shades },
        { maxLookups: product.shades.length, barcodeHint: hint, timeoutMs: 50_000 },
      );
      product = fromLegacyProduct({ ...detail, shades: enriched });
    }
    if (hint && !product.barcode) product.barcode = hint;
    return product;
  }),

  orisdi: createAdapter('orisdi', async (id, { barcodeHint = '' } = {}) => {
    const raw = await fetchOrisdiDetail(id, { barcode: barcodeHint });
    if (!raw?.id) return null;
    const product = fromLegacyProduct(raw);
    if (barcodeHint && !product.barcode) product.barcode = barcodeHint;
    return product;
  }),

  beautyway: createAdapter('beautyway', async (id, { barcodeHint = '' } = {}) => {
    const raw = await fetchBeautywayDetail(id, { slug: '' });
    if (!raw?.id) return null;
    const product = fromLegacyProduct(raw);
    if (barcodeHint && !product.barcode) product.barcode = barcodeHint;
    return product;
  }),

  najd: createAdapter('najd', async (id, { barcodeHint = '' } = {}) => {
    const raw = await fetchNajdDetail(id);
    if (!raw?.id) return null;
    const product = fromLegacyProduct(raw);
    if (barcodeHint && !product.barcode) product.barcode = barcodeHint;
    return product;
  }),

  vaneersa: createAdapter('vaneersa', async (id, { barcodeHint = '' } = {}) => {
    const raw = await fetchVaneersaDetail(id);
    if (!raw?.id) return null;
    const product = fromLegacyProduct(raw);
    if (barcodeHint && !product.barcode) product.barcode = barcodeHint;
    return product;
  }),
};

export const ADAPTER_LIST = Object.values(ADAPTERS);

export function getAdapter(storeId) {
  return ADAPTERS[storeId] || null;
}

export async function searchStoreBarcode(storeId, barcode, opts = {}) {
  const adapter = getAdapter(storeId);
  if (!adapter) return [];
  return adapter.searchBarcode(barcode, opts);
}

export async function fetchStoreProduct(storeId, id, opts = {}) {
  const adapter = getAdapter(storeId);
  if (!adapter) return null;
  return adapter.fetchProduct(id, opts);
}
