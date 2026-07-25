/**
 * نموذج منتج موحّد — كل المتاجر تُحوَّل إليه قبل الاستيراد.
 */

import { collectImageUrls, upgradeImageUrl, THUMB_SIZE } from './images.js';

/** مفتاح ترتيب رقم التدرج تصاعدياً (2 قبل 10 قبل 160) */
export function shadeNumberSortKey(shade = {}, fallbackIndex = 0) {
  const raw = String(
    shade.shadeNumber || shade.shadeCode || shade.name || shade.nameEn || shade.nameAr || '',
  ).trim();
  const digits = raw.match(/\d+/);
  if (digits) {
    const num = Number(digits[0]);
    if (Number.isFinite(num)) return [0, num, raw.toLowerCase(), fallbackIndex];
  }
  return [1, raw.toLowerCase(), fallbackIndex];
}

/** يرتّب التدرجات تصاعدياً حسب رقم الدرجة ويحدّث position */
export function sortShadesByNumber(shades = []) {
  return [...shades]
    .map((shade, index) => ({
      ...shade,
      position: Number.isFinite(Number(shade.position)) ? Number(shade.position) : index,
    }))
    .sort((a, b) => {
      const ka = shadeNumberSortKey(a, a.position ?? 0);
      const kb = shadeNumberSortKey(b, b.position ?? 0);
      for (let i = 0; i < ka.length; i += 1) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    })
    .map((shade, index) => ({ ...shade, position: index }));
}

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
    shadeNumber: '',
    shadeCode: '',
    shadeTitleEn: '',
    shadeTitleAr: '',
    position: i,
  };
}

export function normalizeShade(raw = {}, index = 0) {
  const hex = String(raw.hex || raw.colorHex || raw.hexColor || raw.color || '').trim();
  const barcode = String(raw.barcode || raw.ean || '').replace(/\D/g, '');
  const position = Number.isFinite(Number(raw.position)) ? Number(raw.position) : index;
  const shadeNumber = String(raw.shadeNumber || raw.shadeCode || '').trim();
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
    shadeNumber: shadeNumber || String(position + 1).padStart(2, '0'),
    shadeCode: String(raw.shadeCode || shadeNumber || '').trim(),
    shadeTitleEn: String(raw.shadeTitleEn || '').trim(),
    shadeTitleAr: String(raw.shadeTitleAr || '').trim(),
    position,
  };
}

export function normalizeProduct(raw = {}) {
  const shades = sortShadesByNumber((raw.shades || []).map((s, i) => normalizeShade(s, i)));
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
      name: s.shadeNumber || s.nameEn || s.nameAr,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      shadeTitleEn: s.shadeTitleEn,
      shadeTitleAr: s.shadeTitleAr,
      sku: s.sku || s.miswagId,
      miswagId: s.miswagId || s.sku,
      barcode: s.barcode,
      colorHex: s.hex || '',
      imageUrl: s.image,
      swatchUrl: s.swatchImage || s.image,
      price: s.price,
      inStock: s.inStock,
      optionGroup: s.optionGroup,
      shadeNumber: s.shadeNumber,
      shadeCode: s.shadeCode,
      position: s.position,
    })),
    shadeCount: p.shadeCount,
    hasOptions: p.hasOptions,
  };
}
