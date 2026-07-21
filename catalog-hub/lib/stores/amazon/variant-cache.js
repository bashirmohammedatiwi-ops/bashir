import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', '..', '..', 'data', 'amazon-variant-cache.json');

let cache = null;
let persistTimer = null;
let cacheDirty = false;

function emptyCache() {
  return { version: 1, products: {} };
}

export function loadVariantCache({ force = false } = {}) {
  if (cache && !force) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    cache = {
      ...emptyCache(),
      ...raw,
      products: raw.products || {},
    };
  } catch {
    cache = emptyCache();
  }
  return cache;
}

function flushVariantCache() {
  if (!cacheDirty || !cache) return;
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  cacheDirty = false;
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      flushVariantCache();
    } catch { /* optional */ }
  }, 1200);
  persistTimer.unref?.();
}

process.once('beforeExit', () => {
  try {
    flushVariantCache();
  } catch { /* ignore */ }
});

function normAsin(v = '') {
  const id = String(v || '').trim().toUpperCase();
  return /^[A-Z0-9]{10}$/.test(id) ? id : '';
}

function normBarcode(v = '') {
  return String(v || '').replace(/\D/g, '');
}

function barcodeVariants(code = '') {
  const digits = normBarcode(code);
  if (digits.length < 8) return [];
  return [...new Set([
    digits,
    digits.replace(/^0+/, '') || digits,
    digits.length === 12 ? `0${digits}` : '',
    digits.length === 13 && digits.startsWith('0') ? digits.slice(1) : '',
  ].filter(Boolean))];
}

function serializeShade(s, index = 0) {
  return {
    id: normAsin(s.id || s.sku) || String(s.id || '').toUpperCase(),
    nameEn: s.nameEn || s.shadeNumber || '',
    nameAr: s.nameAr || '',
    shadeNumber: s.shadeNumber || s.shadeCode || String(index + 1).padStart(2, '0'),
    shadeCode: s.shadeCode || s.shadeNumber || '',
    shadeTitleEn: s.shadeTitleEn || '',
    shadeTitleAr: s.shadeTitleAr || '',
    barcode: s.barcode || '',
    colorHex: s.colorHex || '',
    image: s.image || '',
    swatchImage: s.swatchImage || s.image || '',
    price: s.price || '',
  };
}

function cloneShades(shades = []) {
  return shades.map((s, index) => ({
    ...serializeShade(s, index),
    sku: normAsin(s.id || s.sku) || String(s.sku || s.id || '').toUpperCase(),
    inStock: true,
    optionGroup: 'التدرج',
  }));
}

function mergeShadeRows(prev = {}, next = {}) {
  return {
    ...prev,
    ...next,
    barcode: next.barcode || prev.barcode || '',
    colorHex: next.colorHex || prev.colorHex || '',
    image: next.image || prev.image || '',
    swatchImage: next.swatchImage || prev.swatchImage || next.image || '',
    price: next.price || prev.price || '',
    nameEn: next.nameEn || prev.nameEn || '',
    nameAr: next.nameAr || prev.nameAr || '',
    shadeNumber: next.shadeNumber || prev.shadeNumber || '',
    shadeCode: next.shadeCode || prev.shadeCode || '',
    shadeTitleEn: next.shadeTitleEn || prev.shadeTitleEn || '',
    shadeTitleAr: next.shadeTitleAr || prev.shadeTitleAr || '',
  };
}

/** ابحث عن منتج أب — ASIN أب/ابن/تدرج/باركود */
export function lookupVariantProduct({ asin = '', barcode = '' } = {}) {
  const index = loadVariantCache();
  const id = normAsin(asin);
  const variants = barcodeVariants(barcode);

  if (id && index.products[id]) return index.products[id];

  for (const product of Object.values(index.products)) {
    const parent = normAsin(product.parentAsin);
    if (id && parent === id) return product;
    if (id && (product.childAsins || []).map(normAsin).includes(id)) return product;
    if (id && (product.shades || []).some((s) => normAsin(s.id || s.sku) === id)) return product;
    const pool = [
      ...(product.barcodes || []),
      ...(product.shades || []).map((s) => s.barcode),
    ].map(normBarcode).filter(Boolean);
    if (variants.some((v) => pool.includes(v))) return product;
  }
  return null;
}

export function resolveParentHint(asin = '') {
  const hit = lookupVariantProduct({ asin });
  return normAsin(hit?.parentAsin) || '';
}

/** يحفظ كatalog التدرجات بعد زحف ناجح — أي تدرج لاحقاً يجلب الباقي */
export function upsertVariantCache(detail, { listingAsin = '', barcode = '' } = {}) {
  const parent = normAsin(detail?.id || detail?.parentAsin);
  const shades = detail?.shades || [];
  if (!parent || shades.length < 3) return;

  const index = loadVariantCache();
  const prev = index.products[parent] || {};
  const byId = new Map((prev.shades || []).map((s) => [normAsin(s.id || s.sku), serializeShade(s)]));

  for (const s of shades) {
    const key = normAsin(s.id || s.sku);
    if (!key) continue;
    byId.set(key, mergeShadeRows(byId.get(key) || {}, serializeShade(s)));
  }

  const childAsins = new Set([
    ...(prev.childAsins || []).map(normAsin).filter(Boolean),
    normAsin(listingAsin),
    normAsin(detail.matchedChildAsin),
  ].filter((c) => c && c !== parent));
  for (const s of byId.values()) {
    const sid = normAsin(s.id);
    if (sid && sid !== parent) childAsins.add(sid);
  }

  const barcodes = new Set([
    ...(prev.barcodes || []).map(normBarcode).filter((b) => b.length >= 8),
    ...barcodeVariants(barcode),
    normBarcode(detail.barcode),
    normBarcode(detail.matchedShadeBarcode),
  ].filter((b) => b.length >= 8));
  for (const s of byId.values()) {
    const bc = normBarcode(s.barcode);
    if (bc.length >= 8) barcodes.add(bc);
  }

  index.products[parent] = {
    parentAsin: parent,
    nameEn: detail.nameEn || prev.nameEn || '',
    nameAr: detail.nameAr || prev.nameAr || '',
    brandEn: detail.brandEn || detail.brandAr || prev.brandEn || '',
    thumb: detail.thumb || prev.thumb || '',
    childAsins: [...childAsins],
    barcodes: [...barcodes],
    shadeCount: byId.size,
    shades: [...byId.values()],
    updatedAt: Date.now(),
  };
  cacheDirty = true;
  schedulePersist();
}

/** دمج تفاصيل أمازون مع الفهرس المحلي عند فشل/نقص الزحف الحي */
export function mergeDetailWithVariantCache(detail, {
  asin = '',
  matchedChildAsin = '',
  barcode = '',
} = {}) {
  if (!detail) return detail;

  const cached = lookupVariantProduct({
    asin: normAsin(detail.id || detail.parentAsin || asin),
    barcode: barcode || detail.barcode || detail.matchedShadeBarcode,
  }) || lookupVariantProduct({ asin: matchedChildAsin || asin, barcode });

  if (!cached?.shades?.length) return detail;

  const liveCount = detail.shades?.length || 0;
  if (liveCount >= cached.shades.length) return detail;

  const child = normAsin(matchedChildAsin || (liveCount === 1 ? detail.shades?.[0]?.id : ''));
  const cachedShades = cloneShades(cached.shades);
  const byId = new Map(cachedShades.map((s) => [normAsin(s.id), s]));
  for (const live of detail.shades || []) {
    const key = normAsin(live.id || live.sku);
    if (!key) continue;
    byId.set(key, mergeShadeRows(byId.get(key) || {}, live));
  }

  const shades = [...byId.values()];
  const matched = child ? shades.find((s) => normAsin(s.id) === child) : null;
  const knownBarcode = pickBarcode(barcode, detail, matched);

  const enrichedShades = knownBarcode && child
    ? shades.map((s) => (normAsin(s.id) === child
      ? { ...s, barcode: s.barcode || knownBarcode }
      : s))
    : shades;

  return {
    ...detail,
    id: normAsin(cached.parentAsin) || detail.id,
    parentAsin: normAsin(cached.parentAsin) || detail.parentAsin,
    sku: normAsin(cached.parentAsin) || detail.sku,
    nameEn: detail.nameEn || cached.nameEn || '',
    nameAr: detail.nameAr || cached.nameAr || '',
    brandEn: detail.brandEn || cached.brandEn || detail.brandAr || '',
    brandAr: detail.brandAr || cached.brandEn || detail.brandEn || '',
    thumb: detail.thumb || cached.thumb || '',
    shades: enrichedShades,
    shadeCount: enrichedShades.length,
    hasOptions: enrichedShades.length > 1,
    matchedChildAsin: child && child !== normAsin(cached.parentAsin) ? child : detail.matchedChildAsin,
    matchedShadeName: matched?.nameAr || matched?.nameEn || detail.matchedShadeName || '',
    matchedShadeBarcode: matched?.barcode || knownBarcode || detail.matchedShadeBarcode || '',
    barcode: knownBarcode || detail.barcode || matched?.barcode || '',
    source: detail.source ? `${detail.source}+cache` : 'cache',
  };
}

function pickBarcode(requested = '', detail = {}, matchedShade = null) {
  const variants = barcodeVariants(requested);
  if (variants.length) return variants[0];
  const fromMatched = normBarcode(matchedShade?.barcode);
  if (fromMatched.length >= 8) return fromMatched;
  const fromDetail = normBarcode(detail.barcode || detail.matchedShadeBarcode);
  if (fromDetail.length >= 8) return fromDetail;
  return '';
}
