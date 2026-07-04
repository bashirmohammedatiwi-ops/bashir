/**
 * Unified catalog product model — every store normalizes to this shape.
 */

export function emptyProduct() {
  return {
    id: '',
    sku: '',
    nameAr: '',
    nameEn: '',
    brandAr: '',
    brandEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: '',
    thumb: '',
    images: [],
    shades: [],
    barcode: '',
    categoryAr: '',
    categoryEn: '',
    productUrl: '',
    shadeCount: 0,
    hasOptions: false,
  };
}

/** Map legacy store product → unified shape */
export function fromLegacyProduct(raw = {}) {
  const shades = (raw.shades || []).map((s, i) => ({
    id: String(s.id || s.sku || s.optionId || i),
    nameAr: String(s.name || s.nameAr || s.title || '').trim(),
    nameEn: String(s.nameEn || s.name || s.title || '').trim(),
    sku: String(s.sku || s.optionId || s.id || '').trim(),
    barcode: String(s.barcode || s.ean || '').replace(/\D/g, ''),
    hex: s.hex || s.colorHex || '',
    image: s.image || s.thumb || s.rawImage || s.imageUrl || '',
    swatchImage: s.swatchImage || s.colorSourceImage || '',
    inStock: s.inStock !== false,
    price: s.price || '',
  }));

  const images = [...new Set([
    raw.thumb,
    ...(raw.images || []),
    ...shades.map((s) => s.image).filter(Boolean),
  ].filter(Boolean))];

  return {
    id: String(raw.id || raw.asin || raw.sku || ''),
    sku: String(raw.sku || raw.id || raw.asin || ''),
    nameAr: String(raw.name || raw.nameAr || '').trim(),
    nameEn: String(raw.nameEn || raw.en_name || '').trim(),
    brandAr: String(raw.manufacturer || raw.brandAr || raw.brand || '').trim(),
    brandEn: String(raw.manufacturerEn || raw.brandEn || raw.brand || '').trim(),
    descriptionAr: String(raw.description || '').trim(),
    descriptionEn: String(raw.descriptionEn || raw.descriptionEn || '').trim(),
    price: String(raw.price || raw.priceHint || '').trim(),
    thumb: String(raw.thumb || images[0] || '').trim(),
    images,
    shades,
    barcode: String(raw.barcode || '').replace(/\D/g, ''),
    categoryAr: String(raw.category || raw.categoryHint || '').trim(),
    categoryEn: String(raw.categoryEn || raw.categoryHintEn || '').trim(),
    productUrl: String(raw.productUrl || raw.slug || raw.url || '').trim(),
    shadeCount: raw.shadeCount ?? shades.length,
    hasOptions: raw.hasOptions ?? shades.length > 1,
  };
}

export function productHasShade(product) {
  return (product?.shades?.length || 0) > 0;
}
