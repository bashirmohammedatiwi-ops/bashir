/**
 * Build Alhayaa import payload from unified product.
 */
import { STORES } from '../stores/registry.js';

function normalizeHubOrigin(hubOrigin = '') {
  const base = String(hubOrigin || '').trim().replace(/\/$/, '');
  if (!base) return '';
  if (base.endsWith('/catalog-hub')) return base.slice(0, -'/catalog-hub'.length);
  return base;
}

export function absImageUrl(url = '', hubOrigin = '') {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http')) {
    return u.replace(/\/catalog-hub\/catalog-hub\//g, '/catalog-hub/');
  }
  const origin = normalizeHubOrigin(hubOrigin);
  const catalogBase = origin ? `${origin}/catalog-hub` : '';
  if (u.startsWith('/api/')) return catalogBase ? `${catalogBase}${u}` : u;
  if (u.startsWith('/catalog-hub/')) return origin ? `${origin}${u}` : u;
  if (u.startsWith('/') && origin) return `${origin}${u}`;
  return u;
}

function mapShades(shades = [], hubOrigin = '') {
  return shades.map((s, i) => ({
    name: String(s.nameAr || s.name || s.nameEn || s.sku || `درجة ${i + 1}`).trim(),
    nameEn: String(s.nameEn || '').trim() || undefined,
    barcode: String(s.barcode || '').replace(/\D/g, '') || undefined,
    colorHex: s.hex || undefined,
    colorHexEnd: s.colorHexEnd || undefined,
    isGradient: !!s.isGradient,
    imageUrl: absImageUrl(s.image || s.thumb || '', hubOrigin),
    swatchUrl: absImageUrl(s.swatchImage || s.image || '', hubOrigin) || undefined,
    sku: s.sku || undefined,
  })).filter((s) => s.name || s.barcode || s.imageUrl);
}

export function buildImportPayload(storeId, product, { hubOrigin = '' } = {}) {
  const meta = STORES.find((s) => s.id === storeId) || {};
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
    store: storeId,
    storeLabel: meta.label || storeId,
    sourceId: String(product.id || product.sku || ''),
    nameAr: product.nameAr || '',
    nameEn: product.nameEn || '',
    brandAr: product.brandAr || '',
    brandEn: product.brandEn || '',
    descriptionAr: product.descriptionAr || '',
    descriptionEn: product.descriptionEn || '',
    barcode: String(product.barcode || '').replace(/\D/g, '') || undefined,
    sku: String(product.sku || product.id || '').trim(),
    images,
    shades,
    hasShades: shades.length > 0,
    sourceUrl: product.productUrl || '',
    priceHint: product.price || '',
    categoryHint: product.categoryAr || '',
    categoryHintEn: product.categoryEn || '',
  };
}

export function toImportSummary(payload) {
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
