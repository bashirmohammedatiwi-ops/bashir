import {
  absImage,
  extractBarcodeFromSku,
  formatKhatonPrice,
  productUrl,
} from './client.js';
import { collectImageUrls } from '../../core/images.js';

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

function mapVariantShade(variantAr = {}, variantEn = null, index = 0, { productTitleAr = '', productTitleEn = '' } = {}) {
  const attrsAr = variantAr.attributes || [];
  const attrsEn = (variantEn || variantAr).attributes || [];
  const shadeLabelAr = shadeNameFromAttributes(attrsAr)
    || String(variantAr.title || productTitleAr || '').trim();
  const shadeLabelEn = shadeNameFromAttributes(attrsEn)
    || String((variantEn || variantAr).title || productTitleEn || shadeLabelAr || '').trim();
  const sku = String(variantAr.sku || variantAr.id || index).trim();
  const barcode = extractBarcodeFromSku(sku);

  return {
    id: String(variantAr.id || index),
    nameAr: shadeLabelAr,
    nameEn: shadeLabelEn,
    sku,
    barcode,
    image: khatonImageUrl(variantAr.image || variantAr.thumbnail_image || variantEn?.image || variantEn?.thumbnail_image),
    price: variantPrice(variantAr),
    inStock: Number(variantAr.total_quantity || 0) > 0,
    optionGroup: String(attrsAr[0]?.attribute?.name || attrsEn[0]?.attribute?.name || '').trim(),
  };
}

function khatonImageUrl(value = '') {
  if (!value) return '';
  if (typeof value === 'string') return absImage(value);
  if (typeof value === 'object') {
    return absImage(
      value.url || value.src || value.image || value.thumbnail_image || value.thumbnail || value.original,
    );
  }
  return '';
}

function collectKhatonImages(raw = {}) {
  const variant = raw.selected_variant || {};
  return collectImageUrls(
    raw.image,
    raw.main_image,
    raw.images,
    raw.media,
    raw.gallery,
    variant.image,
    variant.images,
    variant.main_image,
    raw.thumbnail_image,
    variant.thumbnail_image,
    ...(raw.variants || []).flatMap((v) => [
      v.image,
      v.images,
      v.main_image,
      v.thumbnail_image,
    ]),
  );
}

export function mapListProduct(rawAr = {}, rawEn = null) {
  const raw = rawAr;
  const en = rawEn || rawAr;
  const id = String(raw.id || '').trim();
  const titleAr = String(raw.title || '').trim();
  const titleEn = String(en.title || raw.title || '').trim();
  const brandAr = String(raw.brand?.name || '').trim();
  const brandEn = String(en.brand?.name || raw.brand?.name || '').trim();
  const variant = raw.selected_variant || {};
  const sku = String(variant.sku || id).trim();
  const barcode = extractBarcodeFromSku(sku);
  const price = variantPrice(variant) || formatKhatonPrice(raw.unit_price);
  const variants = raw.has_variants ? 2 : 1;
  const images = collectKhatonImages(raw);

  return {
    id,
    nameAr: titleAr,
    nameEn: titleEn,
    brandAr,
    brandEn,
    thumb: images[0] || absImage(raw.thumbnail_image || variant.thumbnail_image || en.selected_variant?.thumbnail_image),
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

export function mapDetailProduct(rawAr = {}, { rawEn = null, light = false } = {}) {
  const rawEnSafe = rawEn || rawAr;
  const base = mapListProduct(rawAr, rawEnSafe);
  if (light) return base;

  const descriptionAr = String(rawAr.description || '').replace(/\r\n/g, '\n').trim();
  const descriptionEn = String(rawEnSafe.description || rawAr.description || '').replace(/\r\n/g, '\n').trim();
  const images = collectKhatonImages(rawAr);

  const variantsAr = Array.isArray(rawAr.variants) && rawAr.variants.length
    ? rawAr.variants
    : [rawAr.selected_variant].filter(Boolean);
  const variantsEn = Array.isArray(rawEnSafe.variants) && rawEnSafe.variants.length
    ? rawEnSafe.variants
    : [rawEnSafe.selected_variant].filter(Boolean);
  const enById = new Map(variantsEn.map((v) => [String(v.id), v]));

  const shades = variantsAr.map((v, i) => mapVariantShade(
    v,
    enById.get(String(v.id)) || variantsEn[i] || null,
    i,
    { productTitleAr: base.nameAr, productTitleEn: base.nameEn },
  ));
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
    descriptionAr,
    descriptionEn,
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
