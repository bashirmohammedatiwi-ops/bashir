/**
 * استيراد منتجات موحّد من متاجر الكتالوج — للربط مع تطبيق Alhayaa
 */
import { searchBarcodeAllStores, searchBarcodeAllStoresStreaming, STORE_META } from './barcode-search.js';
import {
  fetchProductDetail,
  normalizeProductDetail,
  extractBarcode,
} from './api.js';
import { enrichShadesFromDatabase, enrichShadesForImport } from './barcodes.js';
import { fetchProductDetail as fetchVanillaDetail, normalizeProductDetail as normalizeVanillaDetail } from './vanilla-api.js';
import { fetchProductByIdBilingual } from './elryan-api.js';
import { fetchProductBySku, fetchProductById as fetchMiraayaById, normalizeProductDetail as normalizeMiraayaDetail, resolveProductByBarcode } from './miraaya-api.js';
import { fetchProductById as fetchFacesById, normalizeProductDetailFromRaw as normalizeFacesDetail } from './faces-api.js';
import { fetchProductByAsin as fetchAmazonByAsin, searchProductsByBarcode as searchAmazonByBarcode, isAmazonBundleListing, enrichAmazonShadeBarcodes } from './amazon-api.js';
import { fetchProductDetail as fetchMiswagDetail, normalizeProductDetail as normalizeMiswagDetail } from './miswag-api.js';
import { fetchProductDetail as fetchOrisdiDetail } from './orisdi-api.js';
import { fetchProductDetail as fetchBeautywayDetail } from './beautyway-api.js';
import { fetchProductDetail as fetchVaneersaDetail } from './vaneersa-api.js';
import { fetchProductDetail as fetchNajdDetail } from './najd-api.js';

function hasArabicText(text = '') {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function normalizeHubOrigin(hubOrigin = '') {
  const base = String(hubOrigin || '').trim().replace(/\/$/, '');
  if (!base) return '';
  if (base.endsWith('/catalog-hub')) return base.slice(0, -'/catalog-hub'.length);
  return base;
}

function absImageUrl(url = '', hubOrigin = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) {
    return u.replace(/\/catalog-hub\/catalog-hub\//g, '/catalog-hub/');
  }
  const origin = normalizeHubOrigin(hubOrigin);
  const catalogBase = origin ? `${origin}/catalog-hub` : '';
  if (u.startsWith('/api/')) {
    return catalogBase ? `${catalogBase}${u}` : u;
  }
  if (u.startsWith('/catalog-hub/')) {
    return origin ? `${origin}${u}` : u;
  }
  if (u.startsWith('/') && origin) return `${origin}${u}`;
  return u;
}

function mapShades(shades = [], hubOrigin = '') {
  return shades.map((s, i) => ({
    name: String(s.name || s.nameAr || s.nameEn || s.sku || `درجة ${i + 1}`).trim(),
    nameEn: String(s.nameEn || '').trim() || undefined,
    barcode: String(s.barcode || s.ean || '').replace(/\D/g, '') || undefined,
    colorHex: s.hex || s.colorHex || undefined,
    colorHexEnd: s.colorHexEnd || s.hexEnd || undefined,
    isGradient: !!s.isGradient,
    imageUrl: absImageUrl(s.image || s.thumb || s.rawImage || '', hubOrigin),
    // صورة السواتش (مربّع اللون) — أدقّ لاستخراج قيمة اللون من صورة المنتج الكاملة
    swatchUrl: absImageUrl(s.swatchImage || s.colorSourceImage || s.image || s.thumb || '', hubOrigin) || undefined,
    sku: s.sku || s.optionId || undefined,
  })).filter((s) => s.name || s.barcode || s.imageUrl);
}

function buildImportPayload(store, product, { hubOrigin = '' } = {}) {
  const meta = STORE_META[store] || {};
  const images = [];
  const addImg = (url, isPrimary = false) => {
    const abs = absImageUrl(url, hubOrigin);
    if (!abs || images.some((x) => x.url === abs)) return;
    images.push({ url: abs, isPrimary });
  };

  addImg(product.thumb, true);
  for (const url of product.images || []) addImg(url);

  const shades = mapShades(product.shades || [], hubOrigin);
  for (const shade of shades) {
    if (shade.imageUrl) addImg(shade.imageUrl);
  }

  return {
    store,
    storeLabel: meta.label || store,
    sourceId: String(product.id || product.sku || ''),
    nameAr: String(product.name || product.nameAr || '').trim(),
    nameEn: String(product.nameEn || '').trim(),
    brandAr: String(product.manufacturer || product.brandAr || '').trim(),
    brandEn: String(product.manufacturerEn || product.brandEn || product.manufacturer || '').trim(),
    descriptionAr: String(product.description || '').trim(),
    descriptionEn: String(product.descriptionEn || '').trim(),
    barcode: String(product.barcode || extractBarcode(product) || '').replace(/\D/g, '') || undefined,
    sku: String(product.sku || product.id || '').trim(),
    images,
    shades,
    hasShades: shades.length > 0,
    sourceUrl: product.productUrl || product.slug || '',
    priceHint: product.price || '',
    categoryHint: product.category || '',
    categoryHintEn: product.categoryEn || '',
  };
}

function hitsToImportOptions(data) {
  return (data.results || [])
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
      storeLabel: r.storeLabel,
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

/**
 * بحث استيراد متدفّق — يرسل نتائج كل متجر فور جاهزيتها.
 */
export async function searchImportByBarcodeStream(rawBarcode, onEvent, { stores = null, hintHits = [] } = {}) {
  const emit = (type, data = {}) => {
    try {
      onEvent?.({ type, ...data });
    } catch { /* client */ }
  };

  let lastPayload = null;

  await searchBarcodeAllStoresStreaming(rawBarcode, (event) => {
    if (event.type === 'start') {
      emit('start', { barcode: event.barcode, stores: event.stores, cached: event.cached });
      return;
    }
    if (event.type === 'store-status') {
      emit('store-status', event);
      return;
    }
    if (event.type === 'results' && event.payload) {
      lastPayload = event.payload;
      const partial = importPayloadFromSearch(event.payload);
      emit('results', { ...partial, source: event.source });
      return;
    }
    if (event.type === 'error') {
      emit('error', { error: event.error });
      return;
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

async function fetchNiceOneImport(id, hubOrigin, { light = false } = {}) {
  const [detail, detailEn] = await Promise.all([
    fetchProductDetail(id),
    fetchProductDetail(id, null, { lang: 'en' }),
  ]);
  if (!detail?.id) return null;
  let normalized = normalizeProductDetail(detail, detailEn);
  if (!light && normalized.shades?.length) {
    const enriched = await enrichShadesFromDatabase(detail);
    normalized.shades = enriched;
    normalized.shadeCount = enriched.length;
  }
  normalized.barcode = extractBarcode(detail) || normalized.barcode;
  return buildImportPayload('niceone', normalized, { hubOrigin });
}

async function fetchFacesImport(id, hubOrigin, { light = false } = {}) {
  const raw = await fetchFacesById(id, { enrichShades: !light });
  if (!raw?.id) return null;
  const normalized = normalizeFacesDetail(raw);
  return buildImportPayload('faces', normalized, { hubOrigin });
}

async function fetchElryanImport(id, hubOrigin) {
  const product = await fetchProductByIdBilingual(id);
  if (!product?.id) return null;
  return buildImportPayload('elryan', product, { hubOrigin });
}

async function fetchMiraayaImport(id, hubOrigin, barcodeHint = '') {
  const key = String(id || '').trim();
  let product = null;

  if (barcodeHint) product = await resolveProductByBarcode(barcodeHint);
  if (!product && key.includes('-')) product = await fetchProductBySku(key);
  if (!product && /^\d+$/.test(key) && key.length <= 7) product = await fetchMiraayaById(key);
  if (!product) product = await fetchProductBySku(key);
  if (!product) product = await resolveProductByBarcode(key);
  if (!product?.id && !product?.sku) return null;
  const normalized = normalizeMiraayaDetail(product);
  return buildImportPayload('miraaya', normalized, { hubOrigin });
}

async function fetchVanillaImport(id, hubOrigin) {
  const detail = await fetchVanillaDetail(id);
  if (!detail?.id) return null;
  const normalized = await normalizeVanillaDetail(detail);
  return buildImportPayload('vanilla', normalized, { hubOrigin });
}

async function fetchAmazonImport(id, hubOrigin, barcodeHint = '', { light = false } = {}) {
  const asin = String(id || '').trim().toUpperCase();
  if (!asin) return null;

  const product = await fetchAmazonByAsin(asin);
  if (!product?.id || isAmazonBundleListing(product.nameEn, product.nameAr)) return null;

  const hint = String(barcodeHint || '').replace(/\D/g, '');
  if (hint) product.barcode = hint;

  if (!light && product.shades?.length) {
    product.shades = await enrichAmazonShadeBarcodes(product, {
      light: false,
      barcodeHint: hint,
      maxLookups: product.shades.length,
      timeoutMs: 45_000,
    });
    product.shadeCount = product.shades.length;
  }

  if (!product.barcode && product.shades?.length === 1) {
    product.barcode = product.shades[0]?.barcode || hint || '';
  }

  return buildImportPayload('amazon', product, { hubOrigin });
}

async function fetchMiswagImport(id, hubOrigin, { light = false, barcode = '' } = {}) {
  const detail = await fetchMiswagDetail(id);
  if (!detail?.id) return null;
  const normalized = normalizeMiswagDetail(detail);
  if (!light && normalized.shades?.length) {
    normalized.shades = await enrichShadesForImport(normalized, {
      maxLookups: normalized.shades.length,
      barcodeHint: String(barcode || '').replace(/\D/g, ''),
    });
    normalized.shadeCount = normalized.shades.length;
    if (!normalized.barcode && normalized.shades.length === 1) {
      normalized.barcode = normalized.shades[0]?.barcode || '';
    }
  }
  return buildImportPayload('miswag', normalized, { hubOrigin });
}

async function fetchOrisdiImport(id, hubOrigin, barcodeHint = '') {
  const normalized = await fetchOrisdiDetail(id, { barcode: barcodeHint });
  if (!normalized?.id) return null;
  return buildImportPayload('orisdi', normalized, { hubOrigin });
}

async function fetchBeautywayImport(id, hubOrigin, barcodeHint = '') {
  const normalized = await fetchBeautywayDetail(id, { slug: '' });
  if (!normalized?.id) return null;
  if (barcodeHint && !normalized.barcode) normalized.barcode = barcodeHint;
  return buildImportPayload('beautyway', normalized, { hubOrigin });
}

async function fetchVaneersaImport(id, hubOrigin, barcodeHint = '') {
  const normalized = await fetchVaneersaDetail(id, { barcode: barcodeHint });
  if (!normalized?.id) return null;
  if (barcodeHint && !normalized.barcode) normalized.barcode = barcodeHint;
  return buildImportPayload('vaneersa', normalized, { hubOrigin });
}

async function fetchNajdImport(id, hubOrigin, barcodeHint = '') {
  const normalized = await fetchNajdDetail(id, { barcode: barcodeHint });
  if (!normalized?.id) return null;
  if (barcodeHint && !normalized.barcode) normalized.barcode = barcodeHint;
  return buildImportPayload('najd', normalized, { hubOrigin });
}

export async function fetchImportProduct(store, sourceId, { hubOrigin = '', barcode = '', light = false } = {}) {
  const id = String(sourceId || '').trim();
  if (!id || !store) return { error: 'المتجر ومعرّف المنتج مطلوبان' };

  let payload = null;
  switch (store) {
    case 'niceone':
      payload = await fetchNiceOneImport(id, hubOrigin, { light });
      break;
    case 'faces':
      payload = await fetchFacesImport(id, hubOrigin, { light });
      break;
    case 'elryan':
      payload = await fetchElryanImport(id, hubOrigin);
      break;
    case 'miraaya':
      payload = await fetchMiraayaImport(id, hubOrigin, barcode);
      break;
    case 'vanilla':
      payload = await fetchVanillaImport(id, hubOrigin);
      break;
    case 'amazon':
      payload = await fetchAmazonImport(id, hubOrigin, barcode, { light });
      break;
    case 'miswag':
      payload = await fetchMiswagImport(id, hubOrigin, { light, barcode });
      break;
    case 'orisdi':
      payload = await fetchOrisdiImport(id, hubOrigin, barcode);
      break;
    case 'beautyway':
      payload = await fetchBeautywayImport(id, hubOrigin, barcode);
      break;
    case 'vaneersa':
      payload = await fetchVaneersaImport(id, hubOrigin, barcode);
      break;
    case 'najd':
      payload = await fetchNajdImport(id, hubOrigin, barcode);
      break;
    default:
      return { error: `متجر غير معروف: ${store}` };
  }

  if (!payload) return { error: 'لم يُعثر على المنتج في الكتالوج' };
  return { product: payload };
}

function toImportSummary(payload) {
  if (!payload) return null;
  const primaryThumb = payload.images?.find((i) => i.isPrimary)?.url || payload.images?.[0]?.url || '';
  return {
    imageCount: payload.images?.length ?? 0,
    shadeCount: payload.shades?.length ?? 0,
    hasShades: !!payload.hasShades,
    categoryHint: payload.categoryHint || '',
    categoryHintEn: payload.categoryHintEn || '',
    thumb: primaryThumb,
    priceHint: payload.priceHint || '',
    brandAr: payload.brandAr || '',
    brandEn: payload.brandEn || '',
    nameAr: payload.nameAr || '',
    nameEn: payload.nameEn || '',
  };
}

export async function fetchImportSummary(store, sourceId, { hubOrigin = '', barcode = '' } = {}) {
  const result = await fetchImportProduct(store, sourceId, { hubOrigin, barcode, light: true });
  if (result.error) return { error: result.error };
  return { summary: toImportSummary(result.product) };
}
