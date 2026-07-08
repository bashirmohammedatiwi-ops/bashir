import {
  buildBarcodeRamIndex,
  searchRamBarcodeIndex,
  saveProductToIndex,
} from '../barcodes.js';
import {
  buildUnifiedBarcodeIndex,
  searchUnifiedBarcodeIndex,
  searchUnifiedByStore,
  rememberBarcodeSearchHits,
  isUsableCatalogHit,
} from '../unified-barcode-index.js';
import {
  fetchProductDetail,
  fetchCategoryProducts,
  extractBarcode,
  extractBarcodeFromImage,
  enrichShades,
  normalizeProductSummary,
  searchProducts,
} from '../api.js';
import { elryanAr, absImage, fetchBeautyCategoriesBilingual } from '../elryan-api.js';
import {
  normalizeProductSummary as normalizeMiraayaSummary,
  fixProductImageUrl,
  resolveProductByBarcode,
  normalizeProductDetail as normalizeMiraayaDetail,
  searchProducts as searchMiraayaProducts,
} from '../miraaya-api.js';
import {
  searchProductsByBarcode,
  proxyFacesImage,
  loadFacesBarcodeIndex,
  expandFacesBarcodeIndex,
  lookupFacesBarcodeIndex,
} from '../faces-api.js';
import {
  searchProductsByBarcode as searchAmazonProductsByBarcode,
  normalizeProductSummary as normalizeAmazonSummary,
  isUsableAmazonProduct,
  isAmazonBundleListing,
  proxyAmazonImage,
} from '../amazon-api.js';
import {
  searchProductsByBarcode as searchMiswagProductsByBarcode,
  normalizeProductSummary as normalizeMiswagSummary,
} from '../miswag-api.js';
import {
  searchProductsByBarcode as searchOrisdiProductsByBarcode,
  normalizeProductSummary as normalizeOrisdiSummary,
} from '../orisdi-api.js';
import {
  searchProductsByBarcode as searchBeautywayProductsByBarcode,
  normalizeProductSummary as normalizeBeautywaySummary,
} from '../beautyway-api.js';
import {
  searchProductsByBarcode as searchVaneersaProductsByBarcode,
  normalizeProductSummary as normalizeVaneersaSummary,
} from '../vaneersa-api.js';
import {
  searchProductsByBarcode as searchNajdProductsByBarcode,
  normalizeProductSummary as normalizeNajdSummary,
} from '../najd-api.js';
import { lookupUpcByBarcode, lookupBarcodeProductMeta, lookupBarcodeFromWebSearch, buildMetaFromSearchHits, findBarcodeLookup, normalizeBarcodeMeta, resolveStoreHintMatches } from '../barcodes.js';
import { pickBestHitPerStore } from '../core/hit-filter.js';
import { filterStrictHits } from '../core/match.js';

function barcodeQueryVariants(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  const out = new Set([digits]);
  const stripped = digits.replace(/^0+/, '') || digits;
  out.add(stripped);
  if (digits.length === 13 && digits.startsWith('0')) out.add(digits.slice(1));
  if (stripped.length <= 12) out.add(stripped.padStart(12, '0'));
  if (stripped.length <= 13) out.add(stripped.padStart(13, '0'));
  return [...out].filter((v) => v.length >= 8 && v.length <= 14);
}

export const STORE_META = {
  niceone: { id: 'niceone', label: 'Nice One', path: '/niceone/', domain: 'niceonesa.com' },
  elryan: { id: 'elryan', label: 'الريان Elryan', path: '/elryan/', domain: 'elryan.com' },
  miraaya: { id: 'miraaya', label: 'ميرايا Miraaya', path: '/miraaya/', domain: 'miraaya.com' },
  faces: { id: 'faces', label: 'وجوه FACES', path: '/faces/', domain: 'faces.ae' },
  amazon: { id: 'amazon', label: 'Amazon Cosmetics', path: '/amazon/', domain: 'amazon.com' },
  miswag: { id: 'miswag', label: 'مسواگ Miswag', path: '/miswag/', domain: 'miswag.com' },
  orisdi: { id: 'orisdi', label: 'أورزدي Orisdi', path: '/orisdi/', domain: 'orisdi.com' },
  beautyway: { id: 'beautyway', label: 'بيوتي وي Beauty Way', path: '/beautyway/', domain: 'beautyway-iq.com' },
  vaneersa: { id: 'vaneersa', label: 'ڤانير Vaneersa', path: '/vaneersa/', domain: 'vaneersa.com' },
  najd: { id: 'najd', label: 'نجد العذية Najd', path: '/najd/', domain: 'najdalatheyah.com' },
};

let elryanBeautyIdsPromise = null;
const searchResultCache = new Map();
const SEARCH_CACHE_MS = 15 * 60 * 1000;
const SEARCH_NEGATIVE_CACHE_MS = 45 * 1000;

export function clearBarcodeSearchCache(barcode = null) {
  if (!barcode) {
    searchResultCache.clear();
    return;
  }
  const digits = String(barcode).replace(/\D/g, '');
  for (const key of [...searchResultCache.keys()]) {
    if (key.includes(digits)) searchResultCache.delete(key);
  }
}

function storesWithHits(results = []) {
  return new Set((results || []).map((h) => h.store).filter(Boolean)).size;
}
const STORE_SEARCH_RANK = { niceone: 0, elryan: 1, miraaya: 2, najd: 3, orisdi: 4, beautyway: 5, vaneersa: 6, miswag: 7, amazon: 8, faces: 9 };
const foundationCache = { products: [], at: 0 };
const FOUNDATION_CACHE_MS = 10 * 60 * 1000;

export function warmupBarcodeSearch() {
  buildUnifiedBarcodeIndex();
  buildBarcodeRamIndex();
  getFoundationProductsCached().catch(() => {});
  try { loadFacesBarcodeIndex(); } catch { /* optional */ }
  // التوسيع التلقائي للفهرس معطّل — يُشغَّل يدوياً أو عبر FACES_AUTO_EXPAND_INDEX=1
}

async function getFoundationProductsCached() {
  if (foundationCache.products.length && Date.now() - foundationCache.at < FOUNDATION_CACHE_MS) {
    return foundationCache.products;
  }
  const data = await fetchCategoryProducts('foundation', { page: 1, limit: 60 });
  foundationCache.products = data?.products || [];
  foundationCache.at = Date.now();
  return foundationCache.products;
}

function getElryanBeautyIds() {
  if (!elryanBeautyIdsPromise) {
    elryanBeautyIdsPromise = fetchBeautyCategoriesBilingual().then((t) => t.beautyIds || []);
  }
  return elryanBeautyIdsPromise;
}

export function normalizeBarcodeQuery(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  return digits;
}

/** توحيد GTIN للمقارنة (يدعم UPC-12 و EAN-13 بأصفار بادئة مختلفة) */
export function normalizeGtinCompare(digits = '') {
  let d = String(digits).replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 12) d = `0${d}`;
  if (d.length <= 14) return d.padStart(14, '0');
  return d;
}

function barcodeEquals(a, b) {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  return normalizeGtinCompare(sa) === normalizeGtinCompare(sb);
}

function barcodeMatches(value, barcode) {
  return barcodeEquals(value, barcode);
}

function hit(store, fields = {}) {
  const meta = STORE_META[store];
  return {
    store,
    storeLabel: meta?.label || store,
    storePath: meta?.path || `/${store}/`,
    openUrl: `${meta?.path || `/${store}/`}?product=${encodeURIComponent(fields.id || '')}`,
    ...fields,
  };
}

function dedupeHits(list = []) {
  const map = new Map();
  for (const item of list) {
    const key = `${item.store}:${item.id || item.sku}:${item.shadeName || ''}:${item.barcode}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, item);
      continue;
    }
    const prefer =
      item.source === 'live' ||
      (item.source !== 'faces-index' && item.source !== 'unified-index' && item.source !== 'local-index' && prev.source !== 'live') ||
      (item.shadeCount ?? 0) > (prev.shadeCount ?? 0)
        ? item
        : prev;
    const other = prefer === item ? prev : item;
    map.set(key, {
      ...other,
      ...prefer,
      shadeCount: Math.max(prefer.shadeCount ?? 0, other.shadeCount ?? 0) || undefined,
      imageCount: Math.max(prefer.imageCount ?? 0, other.imageCount ?? 0) || undefined,
      thumb: prefer.thumb || other.thumb,
      categoryHint: prefer.categoryHint || other.categoryHint,
      categoryHintEn: prefer.categoryHintEn || other.categoryHintEn,
    });
  }
  return [...map.values()];
}

function sortHitsStable(list = []) {
  return [...list].sort((a, b) => {
    const sa = Number(a.matchScore ?? 0);
    const sb = Number(b.matchScore ?? 0);
    if (sa !== sb) return sb - sa;
    const ma = a.matchType === 'shade' ? 1 : 0;
    const mb = b.matchType === 'shade' ? 1 : 0;
    if (ma !== mb) return mb - ma;
    const ra = STORE_SEARCH_RANK[a.store] ?? 99;
    const rb = STORE_SEARCH_RANK[b.store] ?? 99;
    if (ra !== rb) return ra - rb;
    const idCmp = String(a.id || a.sku || '').localeCompare(String(b.id || b.sku || ''));
    if (idCmp !== 0) return idCmp;
    return String(a.shadeName || '').localeCompare(String(b.shadeName || ''));
  });
}

function getCachedSearch(cacheKey, { refresh = false } = {}) {
  if (refresh) return null;
  const cached = searchResultCache.get(cacheKey);
  if (!cached) return null;
  const age = Date.now() - cached.at;
  const hitCount = cached.data?.results?.length || 0;
  const ttl = hitCount ? SEARCH_CACHE_MS : SEARCH_NEGATIVE_CACHE_MS;
  if (age >= ttl) return null;
  // لا تُعدّ نتيجة فارغة صالحة للإرجاع
  if (!hitCount) return null;
  return cached.data;
}

function catalogThumbPriority(p, barcode) {
  const thumb = String(p.thumb || '');
  const digits = String(barcode).replace(/\D/g, '');
  if (!digits) return 0;
  if (thumb.includes(digits)) return 100;
  if (digits.length >= 6 && thumb.includes(digits.slice(-6))) return 60;
  if (extractBarcodeFromImage(thumb, p.id)) return 40;
  return p.has_option ? 5 : 0;
}

async function matchNiceOneProductFast(p, barcode) {
  const fromThumb = extractBarcodeFromImage(p.thumb, p.id);
  if (barcodeMatches(fromThumb, barcode)) {
    const n = normalizeProductSummary(p, {});
    return hit('niceone', {
      id: n.id,
      name: n.name,
      manufacturer: n.manufacturer,
      price: n.price,
      thumb: n.thumb,
      barcode: fromThumb,
      matchType: 'product',
      source: 'catalog-thumb',
    });
  }
  if (!p.has_option) return null;
  const detail = await fetchProductDetail(p.id);
  const shades = enrichShades(detail);
  setImmediate(() => { try { saveProductToIndex(detail.id, detail, shades); } catch { /* disk */ } });
  const productBc = extractBarcode(detail);
  if (barcodeMatches(productBc, barcode)) {
    return enrichNiceOneHit(detail, { barcode: productBc, matchType: 'product', source: 'catalog-scan' });
  }
  for (const shade of shades) {
    const sBc = shade.ean || shade.barcode;
    if (!barcodeMatches(sBc, barcode)) continue;
    return enrichNiceOneHit(detail, {
      barcode: sBc,
      shadeName: shade.name,
      sku: shade.sku,
      price: shade.price || detail.price_formated,
      thumb: shade.image || detail.thumb,
      matchType: 'shade',
      source: 'catalog-scan',
    });
  }
  return null;
}

async function searchNiceOneCatalogScan(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  const products = [...(await getFoundationProductsCached())].sort(
    (a, b) => catalogThumbPriority(b, digits) - catalogThumbPriority(a, digits),
  );
  const withOptions = products.filter((p) => p.has_option);
  const batchSize = 8;
  for (let i = 0; i < Math.min(withOptions.length, 12); i += batchSize) {
    const batch = withOptions.slice(i, i + batchSize);
    const matches = await Promise.all(batch.map((p) => matchNiceOneProductFast(p, barcode)));
    const found = matches.find(Boolean);
    if (found) return [found];
  }
  return [];
}

async function enrichNiceOneHit(detail, fields = {}) {
  const n = normalizeProductSummary(detail, {});
  return hit('niceone', {
    id: String(detail.id),
    name: n.name || detail.name,
    nameEn: n.nameEn || detail.en_name,
    manufacturer: n.manufacturer || detail.manufacturer || '',
    price: fields.price || detail.price_formated || n.price,
    thumb: fields.thumb || detail.thumb || n.thumb,
    sku: fields.sku || detail.sku || n.sku,
    ...fields,
  });
}

async function searchNiceOneLiveByBarcode(barcode) {
  const results = [];
  for (const q of barcodeQueryVariants(barcode)) {
    const data = await searchProducts(q, 1, 24);
    for (const p of data.products || []) {
      const productBc = extractBarcode(p);
      if (barcodeMatches(productBc, barcode)) {
        results.push(await enrichNiceOneHit(p, {
          barcode: productBc,
          matchType: 'product',
          source: 'live',
        }));
        continue;
      }
      if (!p.has_option) continue;
      const shades = enrichShades(p);
      for (const shade of shades) {
        const sBc = shade.ean || shade.barcode;
        if (!barcodeMatches(sBc, barcode)) continue;
        results.push(await enrichNiceOneHit(p, {
          barcode: sBc,
          shadeName: shade.name,
          sku: shade.sku,
          price: shade.price || p.price_formated,
          thumb: shade.image || p.thumb,
          matchType: 'shade',
          source: 'live',
        }));
      }
      if (!shades.length) {
        const detail = await fetchProductDetail(p.id);
        const detailShades = enrichShades(detail);
        for (const shade of detailShades) {
          const sBc = shade.ean || shade.barcode;
          if (!barcodeMatches(sBc, barcode)) continue;
          results.push(await enrichNiceOneHit(detail, {
            barcode: sBc,
            shadeName: shade.name,
            sku: shade.sku,
            price: shade.price || detail.price_formated,
            thumb: shade.image || detail.thumb,
            matchType: 'shade',
            source: 'live-detail',
          }));
        }
      }
    }
    if (results.length) break;
  }
  return dedupeHits(results.filter(isUsableCatalogHit));
}

export async function searchNiceOneByBarcode(barcode, { getMeta, hintHits = [], upcMeta = null } = {}) {
  const results = [];

  const instant = searchRamBarcodeIndex(barcode).filter((h) => (h.store || 'niceone') === 'niceone');
  if (instant.length) {
    const seen = new Set();
    results.push(...instant.map((h) => {
      const key = `${h.productId}:${h.shadeName || ''}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return hit('niceone', {
        id: h.productId || '',
        name: h.name,
        manufacturer: h.manufacturer || '',
        thumb: h.thumb || '',
        barcode: h.barcode || barcode,
        shadeName: h.shadeName,
        sku: h.sku,
        matchType: h.matchType || 'product',
        source: h.source,
      });
    }).filter(Boolean).filter(isUsableCatalogHit));
  }

  results.push(...searchUnifiedByStore(barcode, 'niceone').filter(isUsableCatalogHit));

  try {
    const live = await searchNiceOneLiveByBarcode(barcode);
    results.push(...live);
  } catch {
    /* optional */
  }

  let merged = dedupeHits(results.filter(isUsableCatalogHit));
  if (merged.length) return merged;

  // مسح الكتالوج فقط عند فشل البحث الحي (الأبطأ — يُترك أخيراً)
  const catalog = await searchNiceOneCatalogScan(barcode);
  merged = dedupeHits([...catalog].filter(isUsableCatalogHit));
  if (merged.length) return merged;

  const meta = await resolveStoreMeta(barcode, { getMeta, hintHits, upcMeta });
  if (meta?.brand || meta?.title) {
    const hinted = await resolveStoreHintMatches({
      meta,
      searchFn: async (q) => (await searchProducts(q, 1, 20)).products || [],
      fetchDetailFn: async (p) => fetchProductDetail(p.id),
      toShadeHit: async (p, detail, shade) => enrichNiceOneHit(detail || p, {
        barcode,
        shadeName: shade.name || shade.nameEn,
        sku: shade.sku,
        price: shade.price || detail?.price_formated,
        thumb: shade.image || detail?.thumb || p.thumb,
        matchType: 'shade',
        matchScore: 40,
        source: meta.source || 'meta-hint',
      }),
      toHit: async (p, score) => enrichNiceOneHit(p, {
        barcode,
        matchType: 'hint',
        matchScore: score,
        source: meta.source || 'meta-hint',
      }),
      minScore: 18,
    });
    for (const h of hinted) results.push(h);
  }

  return dedupeHits(results.filter(isUsableCatalogHit));
}

export async function searchElryanByBarcode(barcode, { getMeta, hintHits = [], upcMeta = null } = {}) {
  const unified = searchUnifiedByStore(barcode, 'elryan');
  const beautyIds = await getElryanBeautyIds();
  const data = await elryanAr.searchProducts(barcode, 1, 24, beautyIds);
  const results = [...unified];
  for (const p of data.items || []) {
    if (barcodeMatches(p.barcode, barcode)) {
      const n = elryanAr.normalizeProductSummary(p, {});
      results.push(hit('elryan', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        price: n.price,
        thumb: n.thumb,
        barcode: String(p.barcode),
        sku: n.sku,
        matchType: 'product',
      }));
    }
    for (const child of p.configurable_children || []) {
      if (!barcodeMatches(child.barcode, barcode)) continue;
      const n = elryanAr.normalizeProductSummary(p, {});
      results.push(hit('elryan', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        price: child.iqd_price || n.price,
        thumb: absImage(child.image) || n.thumb,
        barcode: String(child.barcode),
        shadeName: child.name || child.perfumes_size || '',
        sku: n.sku,
        variantSku: child.sku,
        matchType: 'shade',
      }));
    }
  }

  const merged = dedupeElryanHits(dedupeHits(results));
  if (merged.length) return merged;

  const meta = await resolveStoreMeta(barcode, { getMeta, hintHits, upcMeta });
  if (meta?.brand || meta?.title) {
    const hinted = await resolveStoreHintMatches({
      meta,
      searchFn: async (q) => (await elryanAr.searchProducts(q, 1, 24, beautyIds)).items || [],
      toShadeHit: (p, _detail, shade) => {
        const n = elryanAr.normalizeProductSummary(p, {});
        return hit('elryan', {
          id: n.id,
          name: n.name,
          nameEn: n.nameEn,
          manufacturer: n.manufacturer,
          price: shade.price || n.price,
          thumb: absImage(shade.image) || n.thumb,
          barcode,
          shadeName: shade.name || shade.nameEn,
          sku: n.sku,
          variantSku: shade.sku,
          matchType: 'shade',
          matchScore: 40,
          source: meta.source || 'meta-hint',
        });
      },
      toHit: (p, score) => {
        const n = elryanAr.normalizeProductSummary(p, {});
        return hit('elryan', {
          id: n.id,
          name: n.name,
          nameEn: n.nameEn,
          manufacturer: n.manufacturer,
          price: n.price,
          thumb: n.thumb,
          barcode,
          sku: n.sku,
          matchType: 'hint',
          matchScore: score,
          source: meta.source || 'meta-hint',
        });
      },
      minScore: 18,
    });
    results.push(...hinted);
  }

  return dedupeElryanHits(dedupeHits(results));
}

function dedupeElryanHits(list = []) {
  const map = new Map();
  for (const item of list) {
    const key = `${item.id || item.sku}:${item.barcode || ''}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, item);
      continue;
    }
    const prefer =
      (item.shadeName && !prev.shadeName) ||
      (item.thumb && !prev.thumb) ||
      item.matchType === 'shade'
        ? item
        : prev;
    map.set(key, { ...prev, ...prefer, thumb: prefer.thumb || prev.thumb });
  }
  return [...map.values()];
}

export async function searchMiraayaByBarcode(barcode, { getMeta, hintHits = [], upcMeta = null } = {}) {
  const unifiedFirst = searchUnifiedByStore(barcode, 'miraaya');
  const results = [...unifiedFirst];

  const product = await resolveProductByBarcode(barcode);
  if (product) {
    const summary = normalizeMiraayaSummary(product, {});
    const detail = normalizeMiraayaDetail(product);
    const matchingShade = (detail.shades || []).find(
      (s) => barcodeMatches(s.barcode, barcode) || barcodeMatches(s.sku, barcode),
    );
    results.push(hit('miraaya', {
      id: summary.sku || String(product.sku),
      name: summary.name,
      nameEn: summary.nameEn,
      manufacturer: summary.manufacturer,
      manufacturerEn: summary.manufacturerEn,
      price: summary.price,
      thumb: summary.thumb,
      barcode: matchingShade?.barcode || summary.barcode || barcode,
      shadeName: matchingShade?.name || '',
      sku: summary.sku,
      matchType: matchingShade ? 'shade' : 'product',
      shadeCount: detail.shades?.length || 0,
      imageCount: detail.images?.length || (summary.thumb ? 1 : 0),
      categoryHint: summary.category || '',
      categoryHintEn: summary.categoryEn || '',
      source: 'live',
    }));
  }

  const merged = dedupeHits(results.filter(isUsableCatalogHit));
  if (merged.length) return merged;

  const meta = await resolveStoreMeta(barcode, { getMeta, hintHits, upcMeta });
  if (meta?.brand || meta?.title) {
    const hinted = await resolveStoreHintMatches({
      meta,
      searchFn: async (q) => (await searchMiraayaProducts(q, 1, 20)).items || [],
      fetchDetailFn: async (item) => normalizeMiraayaDetail(item),
      toShadeHit: (item, detail, shade) => {
        const summary = normalizeMiraayaSummary(item, {});
        return hit('miraaya', {
          id: summary.sku || String(item.sku),
          name: summary.name,
          nameEn: summary.nameEn,
          manufacturer: summary.manufacturer,
          price: shade.price || summary.price,
          thumb: fixProductImageUrl(shade.image || summary.thumb),
          barcode,
          shadeName: shade.name || shade.nameEn,
          sku: summary.sku,
          matchType: 'shade',
          matchScore: 40,
          source: meta.source || 'meta-hint',
        });
      },
      toHit: (item, score) => {
        const summary = normalizeMiraayaSummary(item, {});
        return hit('miraaya', {
          id: summary.sku || String(item.sku),
          name: summary.name,
          nameEn: summary.nameEn,
          manufacturer: summary.manufacturer,
          price: summary.price,
          thumb: summary.thumb,
          barcode,
          sku: summary.sku,
          matchType: 'hint',
          matchScore: score,
          source: meta.source || 'meta-hint',
        });
      },
      minScore: 18,
    });
    results.push(...hinted);
  }

  return dedupeHits(results.filter(isUsableCatalogHit));
}

function buildFacesLocalHits(barcode) {
  const localHits = [];
  const indexed = lookupFacesBarcodeIndex(barcode);
  if (indexed?.pid && (indexed.nameAr || indexed.nameEn || indexed.thumb)) {
    localHits.push(hit('faces', {
      id: indexed.pid,
      name: indexed.nameAr || indexed.nameEn,
      nameEn: indexed.nameEn,
      manufacturer: indexed.brandAr || indexed.brandEn,
      manufacturerEn: indexed.brandEn,
      price: indexed.price ? String(indexed.price) : '',
      thumb: proxyFacesImage(indexed.thumb),
      barcode: indexed.ean || barcode,
      shadeName: indexed.shadeName || undefined,
      matchType: indexed.shadeName ? 'shade' : 'product',
      source: 'faces-index',
    }));
  }
  for (const u of searchUnifiedByStore(barcode, 'faces')) {
    const dup = localHits.some(
      (h) => h.id === u.id && (h.shadeName || '') === (u.shadeName || ''),
    );
    if (!dup) localHits.push({ ...u, source: u.source || 'unified-index' });
  }
  return dedupeHits(localHits);
}

export async function searchFacesByBarcode(barcode, hintHits = []) {
  const localHits = buildFacesLocalHits(barcode);
  const indexed = lookupFacesBarcodeIndex(barcode);

  const indexFresh = indexed?.updatedAt && Date.now() - indexed.updatedAt < 24 * 60 * 60 * 1000;
  const shouldLive = hintHits.length > 0 || !localHits.length || !indexFresh;

  if (!shouldLive) return localHits;

  try {
    const matches = await searchProductsByBarcode(barcode, {
      limit: 10,
      hintHits,
      light: false,
    });
    const liveHits = matches.map((m) => {
    const tile = m.tile;
    if (m.matchType === 'shade' && m.shade) {
      return hit('faces', {
        id: tile.pid,
        name: tile.nameAr || tile.nameEn,
        nameEn: tile.nameEn,
        manufacturer: tile.brandAr || tile.brandEn,
        price: m.shade.price || (tile.price ? `${tile.price} درهم` : ''),
        thumb: proxyFacesImage(m.shade.image || tile.thumb),
        barcode: m.barcode,
        shadeName: m.shade.name,
        matchType: 'shade',
        source: 'live',
      });
    }
    return hit('faces', {
      id: tile.pid,
      name: tile.nameAr || tile.nameEn,
      nameEn: tile.nameEn,
      manufacturer: tile.brandAr || tile.brandEn,
      price: tile.price ? `${tile.price} درهم` : '',
      thumb: proxyFacesImage(tile.thumb),
      barcode: m.barcode || tile.ean || barcode,
      shadeName: tile.shadeName || undefined,
      matchType: tile.shadeName ? 'shade' : 'product',
      source: 'live',
    });
  });

  if (liveHits.length) return dedupeHits([...liveHits, ...localHits]);
  return localHits;
  } catch {
    return localHits;
  }
}

export async function searchMiswagByBarcode(barcode, { getMeta, hintHits = [], upcMeta = null, webMeta = null } = {}) {
  const products = await searchMiswagProductsByBarcode(barcode, { getMeta, hintHits, upcMeta, webMeta });
  return dedupeHits(
    products.map((p) => {
      const n = normalizeMiswagSummary(p);
      const src = p.source || 'live';
      const mt = p.matchType === 'shade' ? 'shade'
        : (p.matchType === 'hint' ? 'hint'
          : (src === 'lookup' || src === 'barcode-lookup' || src === 'verified' || src === 'meta-verified') ? 'product'
          : 'product');
      return hit('miswag', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        manufacturerEn: n.manufacturerEn,
        price: n.price,
        thumb: n.thumb,
        barcode: n.barcode || barcode,
        sku: n.sku,
        matchType: mt,
        matchScore: p.matchScore,
        shadeName: p.shadeName,
        shadeCount: p.shadeCount ?? n.shadeCount ?? 0,
        categoryHint: n.category || '',
        categoryHintEn: n.categoryEn || '',
        source: src,
      });
    }),
  );
}

export async function searchOrisdiByBarcode(barcode, { getMeta } = {}) {
  const products = await searchOrisdiProductsByBarcode(barcode, { getMeta });
  return dedupeHits(
    products.map((p) => {
      const n = normalizeOrisdiSummary(p);
      return hit('orisdi', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        manufacturerEn: n.manufacturerEn,
        price: n.price,
        thumb: n.thumb,
        barcode: p.barcode || n.barcode || barcode,
        sku: n.sku,
        shadeName: p.shadeName || '',
        matchType: p.matchType === 'hint' ? 'hint' : (p.matchType === 'shade' ? 'shade' : 'product'),
        matchScore: p.matchScore,
        shadeCount: n.shadeCount || 0,
        categoryHint: n.category || n.productType || '',
        categoryHintEn: n.categoryEn || n.productType || '',
        source: p.source || 'live',
      });
    }),
  );
}

export async function searchAmazonByBarcode(barcode, { getMeta } = {}) {
  const products = await searchAmazonProductsByBarcode(barcode, { getMeta });
  return dedupeHits(
    products
      .filter((p) => isUsableAmazonProduct(p))
      .filter((p) => !isAmazonBundleListing(p.nameEn, p.nameAr))
      .map((p) => {
        const n = normalizeAmazonSummary(p);
        return hit('amazon', {
          id: n.id,
          name: n.nameAr || n.name,
          nameEn: n.nameEn,
          manufacturer: n.brandAr || n.manufacturer,
          manufacturerEn: n.brandEn || n.manufacturerEn,
          price: n.price,
          thumb: n.thumb || proxyAmazonImage(p.thumb || ''),
          barcode: n.barcode || barcode,
          matchType: p.matchType === 'hint' ? 'hint' : 'product',
          matchScore: p.matchScore,
          shadeCount: n.shadeCount || 0,
          openUrl: `/amazon/?product=${n.id}`,
        });
      }),
  );
}

export async function searchBeautywayByBarcode(barcode, { getMeta } = {}) {
  const products = await searchBeautywayProductsByBarcode(barcode, { getMeta });
  return dedupeHits(
    products.map((p) => {
      const n = normalizeBeautywaySummary(p);
      return hit('beautyway', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        manufacturerEn: n.manufacturerEn,
        price: n.price,
        thumb: n.thumb,
        barcode: p.barcode || n.barcode || barcode,
        sku: n.sku,
        shadeName: p.shadeName || '',
        matchType: p.matchType === 'shade' ? 'shade' : (p.matchType === 'hint' ? 'hint' : 'product'),
        matchScore: p.matchScore,
        shadeCount: n.shadeCount || 0,
        categoryHint: n.category || '',
        categoryHintEn: n.categoryEn || '',
        source: p.source || 'live',
      });
    }),
  );
}

export async function searchVaneersaByBarcode(barcode, { getMeta } = {}) {
  const products = await searchVaneersaProductsByBarcode(barcode, { getMeta });
  return dedupeHits(
    products.map((p) => {
      const n = normalizeVaneersaSummary(p);
      return hit('vaneersa', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        manufacturerEn: n.manufacturerEn,
        price: n.price,
        thumb: n.thumb,
        barcode: p.barcode || n.barcode || barcode,
        sku: n.sku,
        shadeName: p.shadeName || '',
        matchType: p.matchType === 'shade' ? 'shade' : (p.matchType === 'hint' ? 'hint' : 'product'),
        matchScore: p.matchScore,
        shadeCount: n.hasOptions ? 1 : 0,
        categoryHint: n.category || '',
        source: p.source || 'live',
      });
    }),
  );
}

export async function searchNajdByBarcode(barcode, { getMeta } = {}) {
  const products = await searchNajdProductsByBarcode(barcode, { getMeta });
  return dedupeHits(
    products.map((p) => {
      const n = normalizeNajdSummary(p);
      return hit('najd', {
        id: n.id,
        name: n.name,
        nameEn: n.nameEn,
        manufacturer: n.manufacturer,
        manufacturerEn: n.manufacturerEn,
        price: n.price,
        thumb: n.thumb,
        barcode: p.barcode || n.barcode || barcode,
        sku: n.sku,
        shadeName: p.shadeName || '',
        matchType: p.matchType === 'shade' ? 'shade' : (p.matchType === 'hint' ? 'hint' : 'product'),
        matchScore: p.matchScore,
        shadeCount: n.hasOptions ? 1 : 0,
        categoryHint: n.category || '',
        source: p.source || 'live',
      });
    }),
  );
}

const SEARCHERS = [
  { store: 'niceone', fn: searchNiceOneByBarcode, timeoutMs: 12_000 },
  { store: 'elryan', fn: searchElryanByBarcode, timeoutMs: 10_000 },
  { store: 'miraaya', fn: searchMiraayaByBarcode, timeoutMs: 10_000 },
  { store: 'najd', fn: searchNajdByBarcode, timeoutMs: 10_000 },
  { store: 'orisdi', fn: searchOrisdiByBarcode, timeoutMs: 10_000 },
  { store: 'beautyway', fn: searchBeautywayByBarcode, timeoutMs: 12_000 },
  { store: 'vaneersa', fn: searchVaneersaByBarcode, timeoutMs: 10_000 },
  { store: 'miswag', fn: searchMiswagByBarcode, timeoutMs: 18_000 },
  { store: 'amazon', fn: searchAmazonByBarcode, timeoutMs: 14_000 },
  { store: 'faces', fn: searchFacesByBarcode, timeoutMs: 8_000 },
];

const SEARCH_WAVE1 = new Set(['niceone', 'elryan', 'miraaya', 'najd']);
const SEARCH_WAVE2A = new Set(['orisdi', 'beautyway', 'vaneersa']);
const SEARCH_WAVE2B = new Set(['miswag', 'amazon']);

export { SEARCHERS };

function withStoreTimeout(promise, ms, store) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`انتهت مهلة ${STORE_META[store]?.label || store}`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function isStoreTimeoutError(err) {
  return String(err?.message || '').startsWith('انتهت مهلة ');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function resolveStoreMeta(barcode, { getMeta, hintHits = [], upcMeta = null } = {}) {
  const fromHints = buildMetaFromSearchHits(hintHits, upcMeta);
  if (fromHints?.brand || fromHints?.title) return fromHints;
  if (getMeta) {
    const shared = await getMeta().catch(() => null);
    if (shared?.brand || shared?.title) return shared;
  }
  return lookupBarcodeProductMeta(barcode).catch(() => null);
}

function buildFacesHintList(hintHits = [], upcData = null, resultHits = []) {
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
  ].filter((h) => {
    const name = String(h.nameEn || h.name || '').trim();
    const brand = String(h.manufacturerEn || h.manufacturer || h.brand || '').trim();
    return name.length >= 4 || brand.length >= 3;
  }).slice(0, 8);
}

function buildStoreStatusList(enabled, byStore = {}, errors = []) {
  const errorByStore = new Map((errors || []).map((e) => [e.store, e.message]));
  return enabled.map(({ store }) => {
    const count = (byStore[store] || []).length;
    const errMsg = errorByStore.get(store);
    return {
      id: store,
      store,
      ...STORE_META[store],
      status: errMsg ? 'error' : 'done',
      count,
      message: errMsg,
      fromIndex: false,
    };
  });
}

function finalizeSearchPayload(barcode, byStore, errors, enabled) {
  const storeList = enabled.map(({ store }) => store);
  const uniqueStores = [...new Set(storeList)];
  const rawResults = sortHitsStable(dedupeHits(Object.values(byStore).flat()));
  const verified = filterStrictHits(rawResults, barcode);
  const results = pickBestHitPerStore(verified);
  const filteredByStore = {};
  for (const h of results) {
    if (!filteredByStore[h.store]) filteredByStore[h.store] = [];
    filteredByStore[h.store].push(h);
  }
  const hitStores = new Set(results.map((h) => h.store).filter(Boolean));
  const cleanErrors = [];
  const seenErrors = new Set();
  for (const err of errors || []) {
    if (!err?.store || hitStores.has(err.store)) continue;
    const key = `${err.store}:${err.message || ''}`;
    if (seenErrors.has(key)) continue;
    seenErrors.add(key);
    cleanErrors.push(err);
  }
  return {
    barcode,
    results,
    byStore: filteredByStore,
    errors: cleanErrors,
    stores: uniqueStores.map((store) => ({
      ...STORE_META[store],
      count: (filteredByStore[store] || []).length,
    })),
  };
}

function rememberSearchCache(cacheKey, storeKey, barcode, payload, enabled) {
  const hitCount = payload.results?.length || 0;
  if (!hitCount) return;

  const prevEntry = searchResultCache.get(cacheKey);
  const prev = prevEntry?.data;
  if (prev?.results?.length) {
    const byStore = {};
    for (const h of [...prev.results, ...payload.results]) {
      if (!h?.store) continue;
      if (!byStore[h.store]) byStore[h.store] = [];
      byStore[h.store].push(h);
    }
    const merged = finalizeSearchPayload(barcode, byStore, payload.errors || prev.errors || [], enabled);
    if (
      storesWithHits(merged.results) >= storesWithHits(payload.results)
      || (merged.results?.length || 0) >= hitCount
    ) {
      payload = merged;
    }
  }

  rememberBarcodeSearchHits(payload.results);
  searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
  if (storeKey === 'all') {
    searchResultCache.set(`fast:all:${barcode}`, { at: Date.now(), data: { ...payload, fast: true } });
  }
}

/**
 * بحث متدفّق — كل متجر يُرسل نتائجه فور انتهائه دون انتظار الباقي.
 * onEvent({ type, ... }) — start | store-status | results | done | error
 */
export async function searchBarcodeAllStoresStreaming(rawQuery, onEvent, { stores = null, hintHits = [], refresh = false } = {}) {
  const emit = (type, data = {}) => {
    try {
      onEvent?.({ type, ...data });
    } catch { /* client callback */ }
  };

  const barcode = normalizeBarcodeQuery(rawQuery);
  if (!barcode) {
    const errPayload = { barcode: null, error: 'أدخل باركوداً صالحاً (8–14 رقم)', results: [], byStore: {}, errors: [] };
    emit('error', { error: errPayload.error });
    emit('done', { payload: errPayload });
    return errPayload;
  }

  const storeKey = stores?.length ? [...stores].sort().join(',') : 'all';
  const cacheKey = `full:${storeKey}:${barcode}`;
  const enabled = stores?.length
    ? SEARCHERS.filter((s) => stores.includes(s.store))
    : SEARCHERS;

  if (refresh) clearBarcodeSearchCache(barcode);

  const cached = getCachedSearch(cacheKey, { refresh });
  if (cached) {
    const cachedStores = buildStoreStatusList(enabled, cached.byStore || {}, cached.errors || []);
    emit('start', { barcode, cached: true, stores: cachedStores });
    emit('results', { payload: cached, source: 'cache' });
    emit('done', { payload: cached });
    return cached;
  }

  const localHits = searchUnifiedBarcodeIndex(barcode);
  const byStore = {};
  const errors = [];

  for (const h of localHits) {
    if (!byStore[h.store]) byStore[h.store] = [];
    byStore[h.store].push(h);
  }

  const pushPayload = (source) => {
    const payload = finalizeSearchPayload(barcode, byStore, errors, enabled);
    emit('results', { payload, source });
    return payload;
  };

  emit('start', {
    barcode,
    stores: enabled.map(({ store }) => ({
      id: store,
      ...STORE_META[store],
      status: (byStore[store] || []).length ? 'done' : 'pending',
      count: (byStore[store] || []).length,
      fromIndex: !!(byStore[store] || []).length,
    })),
  });

  if (localHits.length) {
    pushPayload('index');
  }

  for (const { store } of enabled) {
    if ((byStore[store] || []).length) {
      emit('store-status', {
        store,
        status: 'done',
        label: STORE_META[store]?.label || store,
        count: byStore[store].length,
        fromIndex: true,
      });
    } else {
      emit('store-status', {
        store,
        status: 'pending',
        label: STORE_META[store]?.label || store,
      });
    }
  }

  const upcPromise = lookupUpcByBarcode(barcode).catch(() => null);
  const metaPromise = lookupBarcodeProductMeta(barcode).catch(() => null);
  const webMetaPromise = lookupBarcodeFromWebSearch(barcode).catch(() => null);
  void metaPromise;

  const getMeta = async () => {
    const manual = findBarcodeLookup(barcode);
    if ((manual?.name || manual?.manufacturer) && manual.store && manual.store !== 'miswag') {
      return normalizeBarcodeMeta({
        brand: manual.manufacturer || '',
        title: manual.name || '',
        shade: manual.shadeName || '',
        source: 'barcode-lookup',
      });
    }
    // بحث ويب سريع أولاً — نفس طريقة Google لإيجاد منتجات مسواگ
    const web = await Promise.race([webMetaPromise, sleep(3000).then(() => null)]);
    if (web?.brand || web?.title) return web;
    const upc = await Promise.race([upcPromise, sleep(2500).then(() => null)]);
    if (upc?.brand || upc?.title) {
      return buildMetaFromSearchHits([], upc);
    }
    const meta = await metaPromise;
    if (meta?.brand || meta?.title) return meta;
    return null;
  };

  const nonFaces = enabled.filter((s) => s.store !== 'faces');
  const facesSearcher = enabled.find((s) => s.store === 'faces');

  const mergeStoreHits = (store, local, live) => {
    const verifiedLive = filterStrictHits(live || [], barcode);
    const verifiedLocal = filterStrictHits(local || [], barcode);
    if (!verifiedLive.length) return verifiedLocal;
    if (!verifiedLocal.length) return verifiedLive;
    return dedupeHits([...verifiedLive, ...verifiedLocal]);
  };

  const runStoreSearch = async ({ store, fn, timeoutMs }, { hintHits = [], upcMeta = null, webMeta = null } = {}) => {
    const local = byStore[store] || [];
    emit('store-status', {
      store,
      status: 'searching',
      label: STORE_META[store]?.label || store,
    });

    const attempt = (ms) => withStoreTimeout(
      fn(barcode, { getMeta, hintHits, upcMeta, webMeta }),
      ms,
      store,
    );

    try {
      const live = await attempt(timeoutMs);
      const merged = mergeStoreHits(store, local, live);
      byStore[store] = merged;
      emit('store-status', {
        store,
        status: 'done',
        label: STORE_META[store]?.label || store,
        count: merged.length,
      });
      pushPayload('store');
    } catch (err) {
      if (isStoreTimeoutError(err)) {
        const message = err?.message || 'فشل البحث';
        errors.push({ store, message });
        byStore[store] = local;
        emit('store-status', {
          store,
          status: 'error',
          label: STORE_META[store]?.label || store,
          message,
          count: local.length,
        });
        pushPayload('store');
        return;
      }
      try {
        const live = await attempt(Math.round(timeoutMs * 1.5));
        const merged = mergeStoreHits(store, local, live);
        byStore[store] = merged;
        emit('store-status', {
          store,
          status: 'done',
          label: STORE_META[store]?.label || store,
          count: merged.length,
        });
        pushPayload('store');
      } catch (retryErr) {
        const message = retryErr?.message || err?.message || 'فشل البحث';
        errors.push({ store, message });
        byStore[store] = local;
        emit('store-status', {
          store,
          status: 'error',
          label: STORE_META[store]?.label || store,
          message,
          count: local.length,
        });
        pushPayload('store');
      }
    }
  };

  const runFaces = async () => {
    if (!facesSearcher) return;

    const localFaces = buildFacesLocalHits(barcode);
    if (localFaces.length) {
      byStore.faces = dedupeHits([...(byStore.faces || []), ...localFaces]);
      pushPayload('faces-index');
    }

    emit('store-status', { store: 'faces', status: 'searching', label: STORE_META.faces?.label || 'faces' });

    const upcData = await Promise.race([upcPromise, sleep(2000).then(() => null)]);
    const combinedHints = buildFacesHintList(hintHits, upcData, Object.values(byStore).flat());
    const facesTimeout = combinedHints.length > 0
      ? Math.min(Math.max(facesSearcher.timeoutMs, 18_000), 22_000)
      : facesSearcher.timeoutMs;

    const local = byStore.faces || [];
    const attemptFaces = (ms) => withStoreTimeout(
      searchFacesByBarcode(barcode, combinedHints),
      ms,
      'faces',
    );

    try {
      const facesLive = await attemptFaces(facesTimeout);
      byStore.faces = mergeStoreHits('faces', local, facesLive);
      emit('store-status', {
        store: 'faces',
        status: 'done',
        label: STORE_META.faces?.label || 'faces',
        count: (byStore.faces || []).length,
      });
    } catch (err) {
      if (isStoreTimeoutError(err)) {
        const message = err?.message || 'فشل البحث';
        errors.push({ store: 'faces', message });
        byStore.faces = local;
        emit('store-status', {
          store: 'faces',
          status: 'error',
          label: STORE_META.faces?.label || 'faces',
          message,
          count: local.length,
        });
        pushPayload('faces');
        return;
      }
      try {
        const facesLive = await attemptFaces(Math.round(facesTimeout * 1.4));
        byStore.faces = mergeStoreHits('faces', local, facesLive);
        emit('store-status', {
          store: 'faces',
          status: 'done',
          label: STORE_META.faces?.label || 'faces',
          count: (byStore.faces || []).length,
        });
      } catch (retryErr) {
        const message = retryErr?.message || err?.message || 'فشل البحث';
        errors.push({ store: 'faces', message });
        byStore.faces = local;
        emit('store-status', {
          store: 'faces',
          status: 'error',
          label: STORE_META.faces?.label || 'faces',
          message,
          count: local.length,
        });
      }
    }
    pushPayload('faces');
  };

  let facesPromise = null;
  const wave1 = nonFaces.filter((s) => SEARCH_WAVE1.has(s.store));
  const wave2a = nonFaces.filter((s) => SEARCH_WAVE2A.has(s.store));
  const wave2b = nonFaces.filter((s) => SEARCH_WAVE2B.has(s.store));
  const amazonSearcher = wave2b.find((s) => s.store === 'amazon');
  const miswagSearcher = wave2b.find((s) => s.store === 'miswag');
  const webMetaEarlyPromise = Promise.race([webMetaPromise, sleep(2000).then(() => null)]);

  const wave1Work = Promise.all(wave1.map((searcher) => runStoreSearch(searcher)));
  const wave2aWork = Promise.all(wave2a.map((searcher) => runStoreSearch(searcher)));
  const wave2bWork = Promise.all([
    amazonSearcher
      ? webMetaEarlyPromise.then((webMetaEarly) => runStoreSearch(amazonSearcher, { webMeta: webMetaEarly }))
      : Promise.resolve(),
    miswagSearcher
      ? webMetaEarlyPromise.then((webMetaEarly) => runStoreSearch(miswagSearcher, { webMeta: webMetaEarly }))
      : Promise.resolve(),
  ]);
  const initialWork = Promise.all([wave1Work, wave2aWork, wave2bWork]);

  void Promise.race([initialWork, sleep(3500)]).then(() => {
    if (facesSearcher) facesPromise = runFaces();
  });

  await initialWork;
  const upcMeta = await Promise.race([upcPromise, sleep(1500).then(() => null)]);

  // موجة 3: إذا كانت النتائج قليلة فقط، أعد محاولة المتاجر المفقودة باستخدام تلميحات المتاجر الأخرى.
  const crossStoreHints3 = sortHitsStable(dedupeHits(Object.values(byStore).flat()));
  const timedOutStores = new Set(
    (errors || [])
      .filter((e) => isStoreTimeoutError(e))
      .map((e) => e.store)
      .filter(Boolean),
  );
  const wave3 = storesWithHits(crossStoreHints3) < 3
    ? nonFaces.filter((s) => !(byStore[s.store] || []).length && !timedOutStores.has(s.store))
    : [];
  if (wave3.length && crossStoreHints3.length) {
    await Promise.all(
      wave3.map((searcher) => runStoreSearch(searcher, { hintHits: crossStoreHints3, upcMeta })),
    );
  }

  const finalFaceBudget = storesWithHits(Object.values(byStore).flat()) >= 2 ? 2500 : 12_000;
  if (facesPromise) await Promise.race([facesPromise, sleep(finalFaceBudget)]);
  else if (facesSearcher) await Promise.race([runFaces(), sleep(finalFaceBudget)]);

  const finalPayload = pushPayload('final');
  rememberSearchCache(cacheKey, storeKey, barcode, finalPayload, enabled);
  emit('done', { payload: finalPayload });
  return finalPayload;
}

export async function searchBarcodeAllStores(rawQuery, { stores = null, fast = false, hintHits = [], refresh = false } = {}) {
  const barcode = normalizeBarcodeQuery(rawQuery);
  if (!barcode) {
    return { barcode: null, error: 'أدخل باركوداً صالحاً (8–14 رقم)', results: [], byStore: {}, errors: [] };
  }

  const storeKey = stores?.length ? [...stores].sort().join(',') : 'all';
  const cacheKey = `${fast ? 'fast:' : 'full:'}${storeKey}:${barcode}`;
  if (refresh) clearBarcodeSearchCache(barcode);
  const cached = getCachedSearch(cacheKey, { refresh });
  if (cached) return cached;

  const localHits = searchUnifiedBarcodeIndex(barcode);
  if (fast) {
    const localByStore = {};
    for (const h of localHits) {
      if (!localByStore[h.store]) localByStore[h.store] = [];
      localByStore[h.store].push(h);
    }
    const payload = {
      barcode,
      fast: true,
      results: dedupeHits(localHits),
      byStore: localByStore,
      errors: [],
      stores: Object.keys(STORE_META).map((store) => ({
        ...STORE_META[store],
        count: (localByStore[store] || []).length,
      })),
    };
    if (payload.results.length) {
      searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
    }
    return payload;
  }

  let finalPayload = null;
  await searchBarcodeAllStoresStreaming(rawQuery, (event) => {
    if (event.type === 'done') finalPayload = event.payload;
  }, { stores, hintHits, refresh });
  return finalPayload || {
    barcode,
    results: [],
    byStore: {},
    errors: [],
    stores: [],
  };
}
