import {
  absImage,
  extractBarcodeFromSku,
  formatKhatonPrice,
  productUrl,
} from './client.js';
import { collectImageUrls } from '../../core/images.js';

const ARABIC_RE = /[\u0600-\u06FF]/;

function variantPrice(variant = {}) {
  const pd = variant.price_detail || {};
  const finalPrice = pd.final_price ?? variant.unit_price;
  const original = pd.original_price ?? variant.unit_price;
  return formatKhatonPrice(finalPrice, { original });
}

function shadeNameFromAttributes(attributes = []) {
  const parts = [];
  for (const attr of attributes || []) {
    const value = String(attr?.value || '').trim();
    const attrName = String(attr?.attribute?.name || '').trim();
    if (value) parts.push(value);
    else if (attrName) parts.push(attrName);
  }
  return parts.join(' · ');
}

function mapVariantShade(variant = {}, index = 0, productTitle = '') {
  const attrs = variant.attributes || [];
  const shadeLabel = shadeNameFromAttributes(attrs) || String(variant.title || productTitle || '').trim();
  const sku = String(variant.sku || variant.id || index).trim();
  const barcode = extractBarcodeFromSku(sku);
  const attrAr = attrs.map((a) => String(a?.attribute?.name || '').trim()).find((n) => ARABIC_RE.test(n)) || '';
  const attrEn = attrs.map((a) => String(a?.value || '').trim()).find((n) => /[A-Za-z]/.test(n)) || '';

  return {
    id: String(variant.id || index),
    nameAr: attrAr || (ARABIC_RE.test(shadeLabel) ? shadeLabel : shadeLabel),
    nameEn: attrEn || shadeLabel,
    sku,
    barcode,
    image: absImage(variant.thumbnail_image),
    price: variantPrice(variant),
    inStock: Number(variant.total_quantity || 0) > 0,
    optionGroup: String(attrs[0]?.attribute?.name || '').trim(),
  };
}

export function mapListProduct(raw = {}) {
  const id = String(raw.id || '').trim();
  const title = String(raw.title || '').trim();
  const brand = String(raw.brand?.name || '').trim();
  const variant = raw.selected_variant || {};
  const sku = String(variant.sku || id).trim();
  const barcode = extractBarcodeFromSku(sku);
  const price = variantPrice(variant) || formatKhatonPrice(raw.unit_price);
  const variants = raw.has_variants ? 2 : 1;

  return {
    id,
    nameAr: title,
    nameEn: title,
    brandAr: brand,
    brandEn: brand,
    thumb: absImage(raw.thumbnail_image || variant.thumbnail_image),
    price,
    shadeCount: variants,
    hasOptions: Boolean(raw.has_variants),
    category: String(raw.category_name || raw.category || '').trim(),
    sku,
    barcode,
    productUrl: productUrl(id),
    inStock: Number(variant.total_quantity ?? 1) > 0,
  };
}

export function mapDetailProduct(raw = {}, { light = false } = {}) {
  const base = mapListProduct(raw);
  if (light) return base;

  const description = String(raw.description || '').replace(/\r\n/g, '\n').trim();
  const images = collectImageUrls(
    raw.thumbnail_image,
    raw.images,
    ...(raw.variants || []).map((v) => v.thumbnail_image),
  );

  const variants = Array.isArray(raw.variants) && raw.variants.length
    ? raw.variants
    : [raw.selected_variant].filter(Boolean);

  const shades = variants.map((v, i) => mapVariantShade(v, i, base.nameEn));
  const primary = shades[0] || {
    id: '0',
    nameAr: base.nameAr,
    nameEn: base.nameEn,
    sku: base.sku,
    barcode: base.barcode,
    image: images[0] || base.thumb,
    price: base.price,
    inStock: base.inStock,
    optionGroup: '',
  };

  return {
    ...base,
    descriptionAr: description,
    descriptionEn: description,
    images: images.length ? images : [base.thumb].filter(Boolean),
    barcode: primary.barcode || base.barcode,
    shades: shades.length ? shades : [primary],
    shadeCount: shades.length || 1,
    hasOptions: shades.length > 1 || base.hasOptions,
    manufacturer: base.brandAr,
    manufacturerEn: base.brandEn,
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
