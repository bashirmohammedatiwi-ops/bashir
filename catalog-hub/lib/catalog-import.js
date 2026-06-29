/**
 * استيراد منتجات موحّد من متاجر الكتالوج — للربط مع تطبيق Alhayaa
 */
import { searchBarcodeAllStores, STORE_META } from './barcode-search.js';
import {
  fetchProductDetail,
  normalizeProductDetail,
  extractBarcode,
} from './api.js';
import { enrichShadesFromDatabase } from './barcodes.js';
import { fetchProductDetail as fetchVanillaDetail, normalizeProductDetail as normalizeVanillaDetail } from './vanilla-api.js';
import { fetchProductByIdBilingual } from './elryan-api.js';
import { fetchProductBySku, fetchProductById as fetchMiraayaById, normalizeProductDetail as normalizeMiraayaDetail, resolveProductByBarcode } from './miraaya-api.js';
import { fetchProductById as fetchFacesById, normalizeProductDetailFromRaw as normalizeFacesDetail } from './faces-api.js';
import { fetchProductByAsin as fetchAmazonByAsin, searchProductsByBarcode as searchAmazonByBarcode, isAmazonBundleListing } from './amazon-api.js';

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

export async function searchImportByBarcode(rawBarcode, { fast = false, stores = null, hintHits = [] } = {}) {
  const data = await searchBarcodeAllStores(rawBarcode, { fast, stores, hintHits });
  if (data.error) {
    return { barcode: null, error: data.error, options: [], errors: [] };
  }

  const options = (data.results || [])
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

  return {
    barcode: data.barcode,
    options,
    errors: data.errors || [],
    byStore: Object.fromEntries(
      Object.entries(data.byStore || {}).map(([k, v]) => [k, (v || []).length]),
    ),
  };
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

async function fetchAmazonImport(id, hubOrigin, barcodeHint = '') {
  if (barcodeHint) {
    const results = await searchAmazonByBarcode(barcodeHint);
    const wantId = String(id || '').trim().toUpperCase();
    const product =
      results.find((p) => String(p.asin || p.id).toUpperCase() === wantId && !isAmazonBundleListing(p.nameEn, p.nameAr)) ||
      results.find((p) => !isAmazonBundleListing(p.nameEn, p.nameAr)) ||
      results[0];
    if (product?.id) return buildImportPayload('amazon', product, { hubOrigin });
  }

  let product = await fetchAmazonByAsin(id);
  if (!product?.id || isAmazonBundleListing(product.nameEn, product.nameAr)) return null;
  return buildImportPayload('amazon', product, { hubOrigin });
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
      payload = await fetchAmazonImport(id, hubOrigin, barcode);
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
