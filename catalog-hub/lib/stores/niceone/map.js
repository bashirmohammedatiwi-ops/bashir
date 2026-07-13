import { productUrl } from './client.js';

export function mapListItem(raw = {}) {
  return {
    id: String(raw.id || ''),
    nameAr: raw.nameAr || raw.name || '',
    nameEn: raw.nameEn || raw.name || '',
    brandAr: raw.brandAr || raw.brand || '',
    brandEn: raw.brandEn || raw.brand || '',
    thumb: raw.thumb || '',
    price: raw.price || '',
    shadeCount: raw.shadeCount || 0,
    hasOptions: Boolean(raw.hasOptions),
    barcode: raw.barcode || '',
    productUrl: raw.productUrl || productUrl(raw.slug || raw.id),
    inStock: raw.inStock !== false,
  };
}

export function mapDetailProduct(raw = {}) {
  return {
    id: String(raw.id || ''),
    sku: raw.sku || String(raw.id || ''),
    nameAr: raw.nameAr || '',
    nameEn: raw.nameEn || '',
    brandAr: raw.brandAr || '',
    brandEn: raw.brandEn || '',
    descriptionAr: raw.descriptionAr || '',
    descriptionEn: raw.descriptionEn || '',
    price: raw.price || '',
    thumb: raw.thumb || raw.images?.[0] || '',
    images: raw.images || [],
    shades: raw.shades || [],
    shadeCount: raw.shadeCount || raw.shades?.length || 0,
    hasOptions: Boolean(raw.hasOptions || raw.shades?.length),
    barcode: raw.barcode || '',
    productUrl: raw.productUrl || productUrl(raw.slug || raw.id),
    productUrlEn: raw.productUrlEn || productUrl(raw.slug || raw.id, { lang: 'en' }),
    inStock: raw.inStock !== false,
    rating: raw.rating || 0,
    reviewCount: raw.reviewCount || 0,
    category: raw.category || '',
    manufacturer: raw.brandAr || raw.brandEn || '',
    manufacturerEn: raw.brandEn || raw.brandAr || '',
  };
}

export function toBarcodeHit(detail, digits, { shadeName = '' } = {}) {
  return {
    id: detail.id,
    nameAr: detail.nameAr,
    nameEn: detail.nameEn,
    brandAr: detail.brandAr,
    brandEn: detail.brandEn,
    thumb: detail.thumb,
    price: detail.price,
    shadeCount: detail.shadeCount || 0,
    hasOptions: detail.hasOptions || false,
    shadeName,
    barcode: digits,
    matchType: 'ean',
  };
}
