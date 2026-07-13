/**
 * نموذج منتج موحّد — كل المتاجر تُحوَّل إليه قبل الاستيراد.
 */

import { collectImageUrls, upgradeImageUrl, THUMB_SIZE } from './images.js';

export function emptyShade(i = 0) {
  return {
    id: String(i),
    nameAr: '',
    nameEn: '',
    sku: '',
    barcode: '',
    hex: '',
    image: '',
    swatchImage: '',
    price: '',
    inStock: true,
    optionGroup: '',
  };
}

export function normalizeShade(raw = {}, index = 0) {
  const hex = String(raw.hex || raw.colorHex || raw.hexColor || raw.color || '').trim();
  const barcode = String(raw.barcode || raw.ean || '').replace(/\D/g, '');
  return {
    id: String(raw.id || raw.sku || raw.optionId || index),
    nameAr: String(raw.nameAr || raw.name || '').trim(),
    nameEn: String(raw.nameEn || raw.name || '').trim(),
    sku: String(raw.sku || raw.miswagId || raw.optionId || raw.id || '').trim(),
    barcode,
    miswagId: String(raw.miswagId || raw.sku || raw.optionId || '').trim(),
    hex: hex.startsWith('#') ? hex : (hex ? `#${hex.replace(/^#/, '')}` : ''),
    image: upgradeImageUrl(String(raw.image || raw.thumb || '').trim()),
    swatchImage: upgradeImageUrl(String(raw.swatchImage || '').trim()),
    price: String(raw.price || '').trim(),
    inStock: raw.inStock !== false,
    optionGroup: String(raw.optionGroup || '').trim(),
  };
}

export function normalizeProduct(raw = {}) {
  const shades = (raw.shades || []).map((s, i) => normalizeShade(s, i));
  const images = collectImageUrls(
    raw.thumb,
    raw.images,
    ...shades.map((s) => s.image),
    ...shades.map((s) => s.swatchImage),
  );
  const thumb = images[0] || upgradeImageUrl(String(raw.thumb || '').trim(), { size: THUMB_SIZE });

  return {
    store: raw.store || '',
    storeLabel: raw.storeLabel || '',
    id: String(raw.id || ''),
    sku: String(raw.sku || raw.id || ''),
    nameAr: String(raw.nameAr || raw.name || '').trim(),
    nameEn: String(raw.nameEn || '').trim(),
    brandAr: String(raw.brandAr || raw.manufacturer || '').trim(),
    brandEn: String(raw.brandEn || raw.manufacturerEn || '').trim(),
    descriptionAr: String(raw.descriptionAr || raw.description || '').trim(),
    descriptionEn: String(raw.descriptionEn || '').trim(),
    price: String(raw.price || '').trim(),
    thumb: thumb || '',
    images: images.length ? images : (thumb ? [thumb] : []),
    barcode: String(raw.barcode || '').replace(/\D/g, ''),
    category: String(raw.category || '').trim(),
    categoryEn: String(raw.categoryEn || '').trim(),
    productUrl: String(raw.productUrl || '').trim(),
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1 || raw.hasOptions === true,
    inStock: raw.inStock !== false,
  };
}

/** تحويل لصيغة استيراد لوحة التحكم */
export function toImportPayload(product) {
  const p = normalizeProduct(product);
  return {
    sourceStore: p.store,
    sourceId: p.id,
    sourceSku: p.sku,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    brandAr: p.brandAr,
    brandEn: p.brandEn,
    descriptionAr: p.descriptionAr,
    descriptionEn: p.descriptionEn,
    price: p.price,
    barcode: p.barcode,
    thumb: p.thumb,
    images: p.images.map((url) => ({ url })),
    productUrl: p.productUrl,
    category: p.category,
    shades: p.shades.map((s) => ({
      name: s.nameAr || s.nameEn,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      sku: s.sku || s.miswagId,
      miswagId: s.miswagId || s.sku,
      barcode: s.barcode,
      colorHex: s.hex || '',
      imageUrl: s.image,
      swatchUrl: s.swatchImage || s.image,
      price: s.price,
      inStock: s.inStock,
      optionGroup: s.optionGroup,
    })),
    shadeCount: p.shadeCount,
    hasOptions: p.hasOptions,
  };
}
