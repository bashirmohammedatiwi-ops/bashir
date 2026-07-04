/**
 * Store adapters — unified interface for barcode search + full product fetch.
 * Each adapter wraps the store's native API and returns unified CatalogProduct.
 */
import { fromLegacyProduct } from '../core/product.js';
import { verifyBarcodeOnProduct, filterStrictHits, MATCH } from '../core/match.js';
import { normalizeBarcodeQuery } from '../core/gtin.js';
import { STORES } from '../stores/registry.js';

// ── Nice One ──
import {
  fetchProductDetail as fetchNiceOneDetail,
  searchProducts as searchNiceOneProducts,
} from '../api.js';
import { enrichShadesFromDatabase } from '../barcodes.js';
import { searchUnifiedByStore } from '../unified-barcode-index.js';

// ── Elryan ──
import { fetchProductByIdBilingual } from '../elryan-api.js';

// ── Miraaya ──
import {
  resolveProductByBarcode,
  fetchProductBySku,
  fetchProductById as fetchMiraayaById,
  normalizeProductDetail as normalizeMiraayaDetail,
} from '../miraaya-api.js';

// ── Faces ──
import {
  fetchProductById as fetchFacesById,
  searchProductsByBarcode as searchFacesByBarcode,
  normalizeProductDetailFromRaw as normalizeFacesDetail,
} from '../faces-api.js';

// ── Amazon ──
import {
  fetchProductByAsin,
  searchProductsByBarcode as searchAmazonByBarcode,
  enrichAmazonShadeBarcodes,
  isAmazonBundleListing,
} from '../amazon-api.js';

// ── Miswag ──
import {
  fetchProductDetail as fetchMiswagDetail,
  searchProductsByBarcode as searchMiswagByBarcode,
  normalizeProductSummary as normalizeMiswagSummary,
} from '../miswag-api.js';

// ── Orisdi / Beautyway / Salla ──
import {
  fetchProductDetail as fetchOrisdiDetail,
  searchProductsByBarcode as searchOrisdiByBarcode,
} from '../orisdi-api.js';
import {
  fetchProductDetail as fetchBeautywayDetail,
  searchProductsByBarcode as searchBeautywayByBarcode,
} from '../beautyway-api.js';
import {
  fetchProductDetail as fetchNajdDetail,
  searchProductsByBarcode as searchNajdByBarcode,
} from '../najd-api.js';
import {
  fetchProductDetail as fetchVaneersaDetail,
  searchProductsByBarcode as searchVaneersaByBarcode,
} from '../vaneersa-api.js';

import { enrichShadesForImport, lookupBarcodeProductMeta, scoreStoreHintMatch } from '../barcodes.js';

async function withTimeout(promise, ms, fallback = null) {
  if (!ms || ms <= 0) return promise;
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function toHit(storeId, raw, barcode, extra = {}) {
  const p = fromLegacyProduct(raw);
  return {
    store: storeId,
    id: p.id,
    sku: p.sku,
    name: p.nameAr,
    nameEn: p.nameEn,
    manufacturer: p.brandAr,
    manufacturerEn: p.brandEn,
    thumb: p.thumb,
    price: p.price,
    barcode: raw.barcode || barcode,
    shadeName: extra.shadeName || raw.shadeName || '',
    matchType: extra.matchType || raw.matchType || MATCH.PRODUCT,
    matchScore: extra.matchScore ?? raw.matchScore,
    shadeCount: p.shadeCount,
    categoryHint: p.categoryAr,
    categoryHintEn: p.categoryEn,
    source: extra.source || raw.source || 'live',
    ...extra,
  };
}

async function verifyMiswagHits(hits, barcode) {
  const digits = normalizeBarcodeQuery(barcode);
  if (!digits) return [];
  const meta = await lookupBarcodeProductMeta(digits).catch(() => null);
  const verified = [];
  for (const hit of hits.slice(0, 4)) {
    try {
      const detail = await fetchMiswagDetail(hit.id || hit.sku);
      if (!detail?.id) continue;
      const unified = fromLegacyProduct(detail);
      const check = verifyBarcodeOnProduct(unified, digits);
      if (check.ok) {
        verified.push(toHit('miswag', detail, digits, {
          shadeName: check.shadeName,
          matchType: check.matchType,
          matchScore: 30,
          source: 'verified',
        }));
        continue;
      }
      const hay = JSON.stringify(detail.raw?.variations || detail).replace(/\D/g, '');
      const stripped = digits.replace(/^0+/, '');
      if (hay.includes(digits) || (stripped.length >= 8 && hay.includes(stripped))) {
        verified.push(toHit('miswag', detail, digits, {
          matchType: MATCH.PRODUCT,
          matchScore: 22,
          source: 'verified-raw',
        }));
        continue;
      }
      if (meta) {
        const score = scoreStoreHintMatch({
          name: detail.name,
          nameEn: detail.nameEn,
          manufacturer: detail.manufacturer,
          manufacturerEn: detail.manufacturerEn,
        }, meta);
        if (score >= 18) {
          verified.push(toHit('miswag', detail, digits, {
            matchType: MATCH.HINT,
            matchScore: score,
            source: 'verified-hint',
          }));
        }
      }
    } catch { /* skip bad hit */ }
  }
  return verified;
}

function createAdapter(storeId, config) {
  const meta = STORES.find((s) => s.id === storeId) || { id: storeId, label: storeId };
  return {
    id: storeId,
    label: meta.label,
    searchBarcode: config.searchBarcode,
    fetchProduct: config.fetchProduct,
  };
}

// ─────────────────────────────────────────────
// NICE ONE
// ─────────────────────────────────────────────
const niceone = createAdapter('niceone', {
  async searchBarcode(barcode, { fast = false } = {}) {
    const digits = normalizeBarcodeQuery(barcode);
    if (!digits) return [];

    const indexed = searchUnifiedByStore(digits, 'niceone');
    if (indexed.length) {
      return indexed.map((r) => toHit('niceone', r, digits, {
        matchType: r.matchType || MATCH.INDEX,
        source: 'barcode-index',
      }));
    }
    if (fast) return [];

    const results = await searchNiceOneProducts(digits, 1, 8).catch(() => ({ items: [] }));
    return filterStrictHits(
      (results.items || []).map((p) => toHit('niceone', p, digits)),
      digits,
    );
  },

  async fetchProduct(id, { barcodeHint = '', light = false } = {}) {
    const { enrichShades, normalizeProductDetail, extractBarcode } = await import('../api.js');
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
  },
});

// ─────────────────────────────────────────────
// ELRYAN
// ─────────────────────────────────────────────
const elryan = createAdapter('elryan', {
  async searchBarcode(barcode, { getMeta } = {}) {
    const { elryanAr } = await import('../elryan-api.js');
    const digits = normalizeBarcodeQuery(barcode);
    if (!digits) return [];

    const indexed = searchUnifiedByStore(digits, 'elryan');
    if (indexed.length) {
      return indexed.map((r) => toHit('elryan', r, digits, { matchType: MATCH.INDEX }));
    }

    const data = await elryanAr.searchProducts(digits, 1, 8).catch(() => ({ items: [] }));
    return filterStrictHits(
      (data.items || []).map((p) => toHit('elryan', p, digits)),
      digits,
    );
  },

  async fetchProduct(id) {
    const raw = await fetchProductByIdBilingual(id);
    if (!raw?.id) return null;
    return fromLegacyProduct(raw);
  },
});

// ─────────────────────────────────────────────
// MIRAAYA
// ─────────────────────────────────────────────
const miraaya = createAdapter('miraaya', {
  async searchBarcode(barcode) {
    const digits = normalizeBarcodeQuery(barcode);
    if (!digits) return [];

    const indexed = searchUnifiedByStore(digits, 'miraaya');
    if (indexed.length) {
      return indexed.map((r) => toHit('miraaya', r, digits, { matchType: MATCH.INDEX }));
    }

    const resolved = await resolveProductByBarcode(digits).catch(() => null);
    if (resolved?.id) {
      return [toHit('miraaya', resolved, digits, { matchType: MATCH.PRODUCT, matchScore: 25 })];
    }
    return [];
  },

  async fetchProduct(id, { barcodeHint = '' } = {}) {
    const key = String(id || '').trim();
    let raw = null;
    if (barcodeHint) raw = await resolveProductByBarcode(barcodeHint).catch(() => null);
    if (!raw && key.includes('-')) raw = await fetchProductBySku(key);
    if (!raw && /^\d+$/.test(key) && key.length <= 7) raw = await fetchMiraayaById(key);
    if (!raw) raw = await fetchProductBySku(key);
    if (!raw) raw = await resolveProductByBarcode(key).catch(() => null);
    if (!raw?.id && !raw?.sku) return null;
    return fromLegacyProduct(normalizeMiraayaDetail(raw));
  },
});

// ─────────────────────────────────────────────
// FACES
// ─────────────────────────────────────────────
const faces = createAdapter('faces', {
  async searchBarcode(barcode, { hints = [] } = {}) {
    const digits = normalizeBarcodeQuery(barcode);
    if (!digits) return [];

    const indexed = searchUnifiedByStore(digits, 'faces');
    if (indexed.length) {
      return indexed.map((r) => toHit('faces', r, digits, { matchType: MATCH.INDEX }));
    }

    const results = await searchFacesByBarcode(digits, hints).catch(() => []);
    return filterStrictHits(
      results.map((p) => toHit('faces', p, digits)),
      digits,
      { strict: false },
    );
  },

  async fetchProduct(id, { light = false } = {}) {
    const raw = await fetchFacesById(id, { enrichShades: !light });
    if (!raw?.id) return null;
    return fromLegacyProduct(normalizeFacesDetail(raw));
  },
});

// ─────────────────────────────────────────────
// AMAZON
// ─────────────────────────────────────────────
const amazon = createAdapter('amazon', {
  async searchBarcode(barcode, { getMeta } = {}) {
    const digits = normalizeBarcodeQuery(barcode);
    if (!digits) return [];

    const results = await searchAmazonByBarcode(digits, { getMeta }).catch(() => []);
    return filterStrictHits(
      results
        .filter((p) => !isAmazonBundleListing(p.nameEn, p.nameAr))
        .map((p) => toHit('amazon', p, digits, {
          thumb: p.thumb || p.images?.[0] || '',
        })),
      digits,
      { strict: false },
    );
  },

  async fetchProduct(id, { barcodeHint = '', light = false } = {}) {
    const asin = String(id || '').trim().toUpperCase();
    const raw = await withTimeout(fetchProductByAsin(asin), light ? 18_000 : 30_000, null);
    if (!raw?.id || isAmazonBundleListing(raw.nameEn, raw.nameAr)) return null;

    const hint = String(barcodeHint || '').replace(/\D/g, '');
    if (hint) raw.barcode = hint;

    if (!light && raw.shades?.length) {
      raw.shades = await enrichAmazonShadeBarcodes(raw, {
        barcodeHint: hint,
        maxLookups: raw.shades.length,
        timeoutMs: 55_000,
      });
    }

    return fromLegacyProduct(raw);
  },
});

// ─────────────────────────────────────────────
// MISWAG — strict verification on every hit
// ─────────────────────────────────────────────
const miswag = createAdapter('miswag', {
  async searchBarcode(barcode, { getMeta } = {}) {
    const digits = normalizeBarcodeQuery(barcode);
    if (!digits) return [];

    const indexed = searchUnifiedByStore(digits, 'miswag');
    if (indexed.length) {
      const verified = await verifyMiswagHits(
        indexed.map((r) => ({ id: r.id || r.productId, ...r })),
        digits,
      );
      if (verified.length) return verified;
    }

    const raw = await searchMiswagByBarcode(digits, { getMeta }).catch(() => []);
    if (!raw.length) return [];

    const verified = await verifyMiswagHits(
      raw.map((p) => ({ id: p.id, ...p })),
      digits,
    );
    return verified.slice(0, 2);
  },

  async fetchProduct(id, { barcodeHint = '', light = false } = {}) {
    const detail = await withTimeout(fetchMiswagDetail(id), light ? 15_000 : 30_000, null);
    if (!detail?.id) return null;

    let product = fromLegacyProduct(detail);
    const hint = String(barcodeHint || '').replace(/\D/g, '');

    if (!light && product.shades.length) {
      const enriched = await enrichShadesForImport(
        { ...detail, shades: product.shades },
        { maxLookups: product.shades.length, barcodeHint: hint, timeoutMs: 45_000 },
      );
      product = fromLegacyProduct({ ...detail, shades: enriched });
    }

    if (hint && !product.barcode) product.barcode = hint;
    return product;
  },
});

// ─────────────────────────────────────────────
// ORISDI / BEAUTYWAY / NAJD / VANEERSA
// ─────────────────────────────────────────────
function sallaLikeAdapter(storeId, searchFn, fetchFn) {
  return createAdapter(storeId, {
    async searchBarcode(barcode, { getMeta } = {}) {
      const digits = normalizeBarcodeQuery(barcode);
      if (!digits) return [];

      const indexed = searchUnifiedByStore(digits, storeId);
      if (indexed.length) {
        return indexed.map((r) => toHit(storeId, r, digits, { matchType: MATCH.INDEX }));
      }

      const results = await searchFn(digits, { getMeta }).catch(() => []);
      const strict = filterStrictHits(
        results.map((p) => toHit(storeId, p, digits)),
        digits,
      );

      const verified = [];
      for (const hit of strict.slice(0, 3)) {
        if (hit.matchType === MATCH.INDEX || hit.source === 'barcode-index' || hit.source === 'barcode-lookup') {
          verified.push(hit);
          continue;
        }
        try {
          const raw = await fetchFn(hit.id, storeId === 'orisdi' ? { barcode: digits } : {});
          if (!raw?.id) continue;
          const check = verifyBarcodeOnProduct(fromLegacyProduct(raw), digits);
          if (check.ok) {
            verified.push({ ...hit, shadeName: check.shadeName, matchType: check.matchType, matchScore: 25 });
          }
        } catch { /* skip unverified */ }
      }
      return verified.slice(0, 2);
    },

    async fetchProduct(id, { barcodeHint = '' } = {}) {
      const raw = await fetchFn(id, storeId === 'orisdi' ? { barcode: barcodeHint } : {});
      if (!raw?.id) return null;
      const product = fromLegacyProduct(raw);
      if (barcodeHint && !product.barcode) product.barcode = barcodeHint;
      return product;
    },
  });
}

const orisdi = sallaLikeAdapter('orisdi', searchOrisdiByBarcode, fetchOrisdiDetail);
const beautyway = sallaLikeAdapter('beautyway', searchBeautywayByBarcode, fetchBeautywayDetail);
const najd = sallaLikeAdapter('najd', searchNajdByBarcode, fetchNajdDetail);
const vaneersa = sallaLikeAdapter('vaneersa', searchVaneersaByBarcode, fetchVaneersaDetail);

// ─────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────
export const ADAPTERS = {
  niceone,
  elryan,
  miraaya,
  faces,
  amazon,
  miswag,
  orisdi,
  beautyway,
  vaneersa,
  najd,
};

export const ADAPTER_LIST = Object.values(ADAPTERS);

export function getAdapter(storeId) {
  return ADAPTERS[storeId] || null;
}

export async function searchStoreBarcode(storeId, barcode, opts = {}) {
  const adapter = getAdapter(storeId);
  if (!adapter) return [];
  const hits = await adapter.searchBarcode(barcode, opts);
  return hits.map((h) => ({ ...h, store: storeId, storeLabel: adapter.label }));
}

export async function fetchStoreProduct(storeId, id, opts = {}) {
  const adapter = getAdapter(storeId);
  if (!adapter) return null;
  return adapter.fetchProduct(id, opts);
}
