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
} from './unified-barcode-index.js';
import {
  fetchProductDetail,
  fetchCategoryProducts,
  extractBarcode,
  extractBarcodeFromImage,
  enrichShades,
  normalizeProductSummary,
} from './api.js';
import { elryanAr, fetchBeautyCategoriesBilingual } from './elryan-api.js';
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
} from './faces-api.js';
import {
  searchProducts as vanillaSearchProducts,
  normalizeProductSummary as normalizeVanillaSummary,
  parseVanillaBarcode,
} from './vanilla-api.js';

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
};

let elryanBeautyIdsPromise = null;
const searchResultCache = new Map();
const SEARCH_CACHE_MS = 24 * 60 * 60 * 1000;
const foundationCache = { products: [], at: 0 };
const FOUNDATION_CACHE_MS = 10 * 60 * 1000;

export function warmupBarcodeSearch() {
  buildUnifiedBarcodeIndex();
  buildBarcodeRamIndex();
  getFoundationProductsCached().catch(() => {});
  try { loadFacesBarcodeIndex(); } catch { /* optional */ }
  expandFacesBarcodeIndex().catch(() => {});
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
    const prefer = item.source === 'live' || (item.shadeCount ?? 0) > (prev.shadeCount ?? 0) ? item : prev;
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

async function searchNiceOneByBarcode(barcode) {
  const unified = searchUnifiedByStore(barcode, 'niceone');
  if (unified.length) return dedupeHits(unified);

  const instant = searchRamBarcodeIndex(barcode);
  if (instant.length) {
    const seen = new Set();
    return dedupeHits(instant.map((h) => {
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
    }).filter(Boolean));
  }

  const catalog = await searchNiceOneCatalogScan(barcode);
  return dedupeHits(catalog.filter((r) => r.id || r.name));
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
        thumb: child.image || n.thumb,
        barcode: String(child.barcode),
        shadeName: child.name || child.perfumes_size || '',
        sku: child.sku,
        matchType: 'shade',
      }));
    }
  }
  return dedupeHits(results);
}

async function searchMiraayaByBarcode(barcode) {
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

async function searchFacesByBarcode(barcode, hintHits = []) {
  const unified = searchUnifiedByStore(barcode, 'faces');
  if (unified.length) return dedupeHits(unified);

  const matches = await searchProductsByBarcode(barcode, { limit: 10, hintHits });
  return dedupeHits(matches.map((m) => {
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
    });
  }));
}

async function searchVanillaByBarcode(barcode) {
  const unified = searchUnifiedByStore(barcode, 'vanilla');
  if (unified.length) return dedupeHits(unified);

  const results = [];
  for (const q of barcodeQueryVariants(barcode)) {
    const data = await vanillaSearchProducts(q, 1, 30);
    for (const p of data.items || []) {
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
      }
      if (!p.hasVariations && !p.listingUsesVariation) continue;
      const n = normalizeVanillaSummary(p, {});
      try {
        const { fetchProductVariations } = await import('./vanilla-api.js');
        const vars = await fetchProductVariations(p.id);
        for (const v of vars) {
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
      } catch {
        /* skip */
      }
    }
    if (results.length) break;
  }
  return dedupeHits(results);
}

const SEARCHERS = [
  { store: 'niceone', fn: searchNiceOneByBarcode, timeoutMs: 10_000 },
  { store: 'elryan', fn: searchElryanByBarcode, timeoutMs: 6_000 },
  { store: 'vanilla', fn: searchVanillaByBarcode, timeoutMs: 6_000 },
  { store: 'miraaya', fn: searchMiraayaByBarcode, timeoutMs: 6_000 },
  { store: 'faces', fn: searchFacesByBarcode, timeoutMs: 35_000 },
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

export async function searchBarcodeAllStores(rawQuery, { stores = null, fast = false } = {}) {
  const barcode = normalizeBarcodeQuery(rawQuery);
  if (!barcode) {
    return { barcode: null, error: 'أدخل باركوداً صالحاً (8–14 رقم)', results: [], byStore: {}, errors: [] };
  }

  const storeKey = stores?.length ? [...stores].sort().join(',') : 'all';
  const cacheKey = `${fast ? 'fast:' : 'full:'}${storeKey}:${barcode}`;
  const cached = searchResultCache.get(cacheKey);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_MS) {
    return cached.data;
  }

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

  const settled = await Promise.allSettled(
    enabled.map(({ store, fn, timeoutMs }) => {
      const local = localByStore[store] || [];
      return withStoreTimeout(fn(barcode), timeoutMs, store).then((live) => {
        if (!live?.length) return local;
        if (!local.length) return live;
        return dedupeHits([...live, ...local]);
      });
    }),
  );
  const results = [];
  const errors = [];
  const byStore = {};

  settled.forEach((outcome, i) => {
    const { store } = enabled[i];
    if (outcome.status === 'fulfilled') {
      byStore[store] = outcome.value;
      results.push(...outcome.value);
    } else {
      errors.push({ store, message: outcome.reason?.message || 'فشل البحث' });
      byStore[store] = localByStore[store] || [];
      if (byStore[store].length) results.push(...byStore[store]);
    }
  });

  const facesEnabled = enabled.some((s) => s.store === 'faces');
  if (facesEnabled && !(byStore.faces || []).length) {
    const hintHits = dedupeHits(results).map((h) => ({
      name: h.name,
      nameEn: h.nameEn,
      manufacturer: h.manufacturer,
      manufacturerEn: h.manufacturerEn,
      brand: h.manufacturer,
    }));
    try {
      const facesRetry = await withStoreTimeout(
        searchFacesByBarcode(barcode, hintHits),
        25_000,
        'faces',
      );
      if (facesRetry?.length) {
        byStore.faces = facesRetry;
        results.push(...facesRetry);
      }
    } catch (err) {
      if (!errors.some((e) => e.store === 'faces')) {
        errors.push({ store: 'faces', message: err?.message || 'فشل البحث' });
      }
    }
  }

  const storeList = enabled.map(({ store }) => store);
  const uniqueStores = [...new Set(storeList)];

  const payload = {
    barcode,
    results: dedupeHits(results),
    byStore,
    errors,
    stores: uniqueStores.map((store) => ({
      ...STORE_META[store],
      count: (byStore[store] || []).length,
    })),
  };

  if (payload.results.length) {
    rememberBarcodeSearchHits(payload.results);
    searchResultCache.set(cacheKey, { at: Date.now(), data: payload });
    if (storeKey === 'all') {
      searchResultCache.set(`fast:all:${barcode}`, { at: Date.now(), data: { ...payload, fast: true } });
    }
  } else {
    searchResultCache.delete(cacheKey);
  }
  return payload;
}
