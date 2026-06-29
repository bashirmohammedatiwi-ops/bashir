import {
  buildBarcodeRamIndex,
  searchRamBarcodeIndex,
  saveProductToIndex,
} from './barcodes.js';
import {
  buildUnifiedBarcodeIndex,
  searchUnifiedBarcodeIndex,
  searchUnifiedByStore,
  rememberBarcodeSearchHits,
  isUsableCatalogHit,
} from './unified-barcode-index.js';
import {
  fetchProductDetail,
  fetchCategoryProducts,
  extractBarcode,
  extractBarcodeFromImage,
  enrichShades,
  normalizeProductSummary,
  searchProducts,
} from './api.js';
import { elryanAr, absImage, fetchBeautyCategoriesBilingual } from './elryan-api.js';
import {
  normalizeProductSummary as normalizeMiraayaSummary,
  fixProductImageUrl,
  resolveProductByBarcode,
  normalizeProductDetail as normalizeMiraayaDetail,
} from './miraaya-api.js';
import {
  searchProductsByBarcode,
  proxyFacesImage,
  loadFacesBarcodeIndex,
  expandFacesBarcodeIndex,
  lookupFacesBarcodeIndex,
} from './faces-api.js';
import {
  searchProducts as vanillaSearchProducts,
  normalizeProductSummary as normalizeVanillaSummary,
  parseVanillaBarcode,
} from './vanilla-api.js';
import {
  searchProductsByBarcode as searchAmazonProductsByBarcode,
  normalizeProductSummary as normalizeAmazonSummary,
  isUsableAmazonProduct,
  isAmazonBundleListing,
} from './amazon-api.js';
import { lookupUpcByBarcode } from './barcodes.js';

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
  vanilla: { id: 'vanilla', label: 'Vanilla Cosmetics', path: '/vanilla/', domain: 'vanillacosmetics.com' },
  elryan: { id: 'elryan', label: 'الريان Elryan', path: '/elryan/', domain: 'elryan.com' },
  miraaya: { id: 'miraaya', label: 'ميرايا Miraaya', path: '/miraaya/', domain: 'miraaya.com' },
  faces: { id: 'faces', label: 'وجوه FACES', path: '/faces/', domain: 'faces.ae' },
  amazon: { id: 'amazon', label: 'Amazon Cosmetics', path: '/amazon/', domain: 'amazon.com' },
};

let elryanBeautyIdsPromise = null;
const searchResultCache = new Map();
const SEARCH_CACHE_MS = 15 * 60 * 1000;
const SEARCH_NEGATIVE_CACHE_MS = 3 * 60 * 1000;
const STORE_SEARCH_RANK = { niceone: 0, elryan: 1, vanilla: 2, miraaya: 3, amazon: 4, faces: 5 };
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
    const ra = STORE_SEARCH_RANK[a.store] ?? 99;
    const rb = STORE_SEARCH_RANK[b.store] ?? 99;
    if (ra !== rb) return ra - rb;
    const idCmp = String(a.id || a.sku || '').localeCompare(String(b.id || b.sku || ''));
    if (idCmp !== 0) return idCmp;
    return String(a.shadeName || '').localeCompare(String(b.shadeName || ''));
  });
}

function getCachedSearch(cacheKey) {
  const cached = searchResultCache.get(cacheKey);
  if (!cached) return null;
  const age = Date.now() - cached.at;
  const ttl = cached.data?.results?.length ? SEARCH_CACHE_MS : SEARCH_NEGATIVE_CACHE_MS;
  return age < ttl ? cached.data : null;
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

async function searchNiceOneByBarcode(barcode) {
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

  // ⚡ توقّف فوراً إذا وُجد المنتج في الفهرس المحلي — لا حاجة للبحث الحي ولا مسح الكتالوج
  const indexedNiceOne = dedupeHits(results.filter(isUsableCatalogHit));
  if (indexedNiceOne.length) return indexedNiceOne;

  try {
    const live = await searchNiceOneLiveByBarcode(barcode);
    results.push(...live);
  } catch {
    /* optional */
  }

  // مسح الكتالوج فقط عند فشل البحث الحي (الأبطأ — يُترك أخيراً)
  if (!results.some(isUsableCatalogHit)) {
    const catalog = await searchNiceOneCatalogScan(barcode);
    results.push(...catalog);
  }

  return dedupeHits(results.filter(isUsableCatalogHit));
}

async function searchElryanByBarcode(barcode) {
  const unified = searchUnifiedByStore(barcode, 'elryan');
  if (unified.length) return dedupeHits(unified);

  const beautyIds = await getElryanBeautyIds();
  const data = await elryanAr.searchProducts(barcode, 1, 24, beautyIds);
  const results = [];
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

async function searchMiraayaByBarcode(barcode) {
  // ⚡ الفهرس المحلي أولاً — تجنّب طلبات GraphQL/REST للباركودات المعروفة
  const unifiedFirst = searchUnifiedByStore(barcode, 'miraaya');
  if (unifiedFirst.length) return dedupeHits(unifiedFirst);

  const product = await resolveProductByBarcode(barcode);
  if (product) {
    const summary = normalizeMiraayaSummary(product, {});
    const detail = normalizeMiraayaDetail(product);
    const matchingShade = (detail.shades || []).find(
      (s) => barcodeMatches(s.barcode, barcode) || barcodeMatches(s.sku, barcode),
    );
    return dedupeHits([hit('miraaya', {
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
    })]);
  }

  const unified = searchUnifiedByStore(barcode, 'miraaya');
  if (unified.length) return dedupeHits(unified);

  return [];
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

async function searchFacesByBarcode(barcode, hintHits = []) {
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

async function searchVanillaByBarcode(barcode) {
  const unified = searchUnifiedByStore(barcode, 'vanilla');
  if (unified.length) return dedupeHits(unified);

  const results = [];
  for (const q of barcodeQueryVariants(barcode)) {
    const data = await vanillaSearchProducts(q, 1, 30);
    const items = data.items || [];
    // منتجات طابقت على مستوى المنتج مباشرة
    const variationCandidates = [];
    for (const p of items) {
      const bc = parseVanillaBarcode(p.barcode);
      if (barcodeMatches(bc.barcode, barcode) || barcodeMatches(p.sku, barcode)) {
        const n = normalizeVanillaSummary(p, {});
        results.push(hit('vanilla', {
          id: n.id,
          name: n.name,
          manufacturer: n.manufacturer,
          price: n.price,
          thumb: n.thumb,
          barcode: bc.barcode || barcode,
          sku: n.sku,
          matchType: 'product',
        }));
        continue; // ⚡ طابق على مستوى المنتج — لا حاجة لجلب المتغيّرات
      }
      if (p.hasVariations || p.listingUsesVariation) variationCandidates.push(p);
    }

    // ⚡ جلب متغيّرات المرشّحين بالتوازي (حد أقصى 8) بدل التسلسل
    if (variationCandidates.length) {
      const { fetchProductVariations } = await import('./vanilla-api.js');
      const limited = variationCandidates.slice(0, 8);
      const varResults = await Promise.allSettled(
        limited.map((p) => fetchProductVariations(p.id)),
      );
      varResults.forEach((outcome, idx) => {
        if (outcome.status !== 'fulfilled') return;
        const p = limited[idx];
        const n = normalizeVanillaSummary(p, {});
        for (const v of outcome.value) {
          const vbc = parseVanillaBarcode(v.barcode);
          if (!barcodeMatches(vbc.barcode, barcode) && !barcodeMatches(v.sku, barcode)) continue;
          results.push(hit('vanilla', {
            id: String(p.id),
            name: p.name,
            manufacturer: p.brandName || '',
            price: n.price,
            thumb: n.thumb,
            barcode: vbc.barcode || v.sku,
            shadeName: v.shortDescription || v.displayName || String(v.id),
            sku: v.sku,
            matchType: 'shade',
          }));
        }
      });
    }
    if (results.length) break;
  }
  return dedupeHits(results);
}

async function searchAmazonByBarcode(barcode) {
  const products = await searchAmazonProductsByBarcode(barcode);
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
          thumb: n.thumb,
          barcode: n.barcode || barcode,
          matchType: 'product',
          shadeCount: n.shadeCount || 0,
          openUrl: `/amazon/?product=${n.id}`,
        });
      }),
  );
}

const SEARCHERS = [
  { store: 'niceone', fn: searchNiceOneByBarcode, timeoutMs: 7_000 },
  { store: 'elryan', fn: searchElryanByBarcode, timeoutMs: 5_000 },
  { store: 'vanilla', fn: searchVanillaByBarcode, timeoutMs: 5_000 },
  { store: 'miraaya', fn: searchMiraayaByBarcode, timeoutMs: 5_000 },
  { store: 'amazon', fn: searchAmazonByBarcode, timeoutMs: 10_000 },
  { store: 'faces', fn: searchFacesByBarcode, timeoutMs: 30_000 },
];

function withStoreTimeout(promise, ms, store) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`انتهت مهلة ${STORE_META[store]?.label || store}`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function searchBarcodeAllStores(rawQuery, { stores = null, fast = false, hintHits = [] } = {}) {
  const barcode = normalizeBarcodeQuery(rawQuery);
  if (!barcode) {
    return { barcode: null, error: 'أدخل باركوداً صالحاً (8–14 رقم)', results: [], byStore: {}, errors: [] };
  }

  const storeKey = stores?.length ? [...stores].sort().join(',') : 'all';
  const cacheKey = `${fast ? 'fast:' : 'full:'}${storeKey}:${barcode}`;
  const cached = getCachedSearch(cacheKey);
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

  const enabled = stores?.length
    ? SEARCHERS.filter((s) => stores.includes(s.store))
    : SEARCHERS;

  const localByStore = {};
  for (const h of localHits) {
    if (!localByStore[h.store]) localByStore[h.store] = [];
    localByStore[h.store].push(h);
  }

  const others = enabled.filter((s) => s.store !== 'faces');
  const facesSearcher = enabled.find((s) => s.store === 'faces');

  const results = [];
  const errors = [];
  const byStore = {};

  for (const [store, hits] of Object.entries(localByStore)) {
    if (hits.length) {
      byStore[store] = hits;
      results.push(...hits);
    }
  }

  // ⚡ مسار سريع جداً: إذا الفهرس المحلي غطّى كل المتاجر المطلوبة، أرجع فوراً (<1s)
  // ولا تلمس الشبكة. تحديث المتاجر يجري في الخلفية لإبقاء الفهرس حديثاً.
  const coveredStores = new Set(Object.keys(byStore).filter((s) => (byStore[s] || []).length));
  const allCovered = enabled.every(({ store }) => coveredStores.has(store));
  if (allCovered && results.length) {
    const payload = {
      barcode,
      results: sortHitsStable(dedupeHits(results)),
      byStore,
      errors,
      fromIndex: true,
      stores: [...new Set(enabled.map(({ store }) => store))].map((store) => ({
        ...STORE_META[store],
        count: (byStore[store] || []).length,
      })),
    };
    searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
    return payload;
  }

  if (others.length) {
    const settled = await Promise.allSettled(
      others.map(({ store, fn, timeoutMs }) => {
        const local = localByStore[store] || [];
        return withStoreTimeout(fn(barcode), timeoutMs, store).then((live) => {
          if (!live?.length) return local;
          if (!local.length) return live;
          return dedupeHits([...live, ...local]);
        });
      }),
    );
    settled.forEach((outcome, i) => {
      const { store } = others[i];
      if (outcome.status === 'fulfilled') {
        byStore[store] = outcome.value;
        results.push(...outcome.value);
      } else {
        errors.push({ store, message: outcome.reason?.message || 'فشل البحث' });
        byStore[store] = localByStore[store] || [];
        if (byStore[store].length) results.push(...byStore[store]);
      }
    });
  }

  // ⚡ جلب بيانات UPC مسبقاً لاستخدامها كتلميح لوجوه (سريع — مخزّن بعد أول طلب)
  const upcData = await lookupUpcByBarcode(barcode).catch(() => null);
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

  // وجوه: فهرس محلي فوري + بحث حي مع تلميحات المتاجر الأخرى وبيانات UPC (بالتوازي مع مهلة منفصلة)
  if (facesSearcher) {
    const localFaces = buildFacesLocalHits(barcode);
    if (localFaces.length) {
      byStore.faces = dedupeHits([...(byStore.faces || []), ...localFaces]);
      results.push(...localFaces.filter((h) => !results.some((r) => r.store === 'faces' && r.id === h.id)));
    }

    const combinedHints = [
      ...hintHits,
      ...upcHints,
      ...sortHitsStable(dedupeHits(results))
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

    // زيادة المهلة تلقائياً عندما يكون لدينا تلميح ماركة من UPC (بحث موجّه أسرع بكثير)
    const facesDynamicTimeout = combinedHints.length > 0
      ? Math.max(facesSearcher.timeoutMs, 60_000)
      : facesSearcher.timeoutMs;

    const facesPromise = withStoreTimeout(
      searchFacesByBarcode(barcode, combinedHints),
      facesDynamicTimeout,
      'faces',
    );

    // إذا وُجدت نتائج من متاجر أخرى — أرجع فوراً وابحث وجوه بالخلفية
    const hasOtherResults = results.some((r) => r.store !== 'faces');
    if (hasOtherResults) {
      void facesPromise.then((facesLive) => {
        if (!facesLive?.length) return;
        rememberBarcodeSearchHits(facesLive);
      }).catch(() => {});
    } else {
      try {
        const facesLive = await facesPromise;
        const mergedFaces = dedupeHits([...(facesLive || []), ...(byStore.faces || []), ...(localByStore.faces || [])]);
        const nonFaces = results.filter((r) => r.store !== 'faces');
        results.length = 0;
        results.push(...nonFaces, ...mergedFaces);
        byStore.faces = mergedFaces;
      } catch (err) {
        errors.push({ store: 'faces', message: err?.message || 'فشل البحث' });
        byStore.faces = dedupeHits([...(byStore.faces || []), ...(localByStore.faces || [])]);
        const nonFaces = results.filter((r) => r.store !== 'faces');
        results.length = 0;
        results.push(...nonFaces, ...byStore.faces);
      }
    }
  }

  const storeList = enabled.map(({ store }) => store);
  const uniqueStores = [...new Set(storeList)];

  const payload = {
    barcode,
    results: sortHitsStable(dedupeHits(results)),
    byStore,
    errors,
    stores: uniqueStores.map((store) => ({
      ...STORE_META[store],
      count: (byStore[store] || []).length,
    })),
  };

  const hadTimeout = errors.some((e) => e.message?.includes('انتهت مهلة'));

  if (payload.results.length) {
    rememberBarcodeSearchHits(payload.results);
    searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
    if (storeKey === 'all') {
      searchResultCache.set(`fast:all:${barcode}`, { at: Date.now(), data: { ...payload, fast: true } });
    }
  } else if (!hadTimeout) {
    // لا نتائج ولا توقف مهلة → المنتج غير موجود فعلاً → خزّن 3 دقائق
    searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
  }
  // عند وجود توقف مهلة + لا نتائج → لا تخزّن → يُعاد المحاولة فوراً في الطلب التالي

  return payload;
}
