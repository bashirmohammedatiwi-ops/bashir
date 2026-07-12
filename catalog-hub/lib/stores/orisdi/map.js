import {
  absImage,
  formatOrisdiPrice,
  productUrl,
  rememberHandle,
  stripHtml,
  variantBarcode,
} from './client.js';
import { resolveBilingualDescription, resolveBilingualName, splitBilingualText } from '../../core/bilingual.js';
import { collectImageUrls } from '../../core/images.js';

const HEX_RE = /^#?[0-9a-f]{3,8}$/i;

function pickLargestShopifySrc(images = [], variantId = 0) {
  const vid = Number(variantId);
  const matched = images.filter((img) => (img.variant_ids || []).includes(vid));
  const pool = matched.length ? matched : images;
  let best = '';
  let bestScore = 0;
  for (const img of pool) {
    const src = String(img.src || '').trim();
    if (!src) continue;
    const w = Number(src.match(/[?&]width=(\d+)/i)?.[1] || src.match(/_(\d+)x(\d+)\./i)?.[1] || 0);
    const score = w || src.length;
    if (score >= bestScore) {
      bestScore = score;
      best = src;
    }
  }
  return absImage(best);
}

function variantImage(variant = {}, images = []) {
  const fi = variant.featured_image;
  if (typeof fi === 'string' && fi) return absImage(fi);
  if (fi && typeof fi === 'object' && fi.src) return absImage(fi.src);
  return pickLargestShopifySrc(images, variant.id);
}

function optionHex(value = '') {
  const v = String(value || '').trim();
  if (HEX_RE.test(v) && v.length >= 4 && !/^#\d+$/.test(v)) {
    return v.startsWith('#') ? v : `#${v}`;
  }
  return '';
}

function mapVariantShade(variant = {}, index = 0, { options = [], images = [], productTitle = '' } = {}) {
  const attrs = [variant.option1, variant.option2, variant.option3].filter(Boolean);
  const shadeLabel = String(variant.title || variant.public_title || attrs.join(' / ') || productTitle || '').trim();
  const { ar, en } = splitBilingualText(shadeLabel, { mode: 'name' });
  const sku = String(variant.sku || variant.id || index).trim();
  const barcode = variantBarcode(variant);
  const price = formatOrisdiPrice(variant.price, { compareAt: variant.compare_at_price });
  const optionGroup = String(options[0]?.name || '').trim();
  let hex = '';
  for (const val of attrs) {
    const h = optionHex(val);
    if (h) { hex = h; break; }
  }

  return {
    id: String(variant.id || index),
    nameAr: ar || shadeLabel,
    nameEn: en || shadeLabel,
    sku,
    barcode,
    hex,
    image: variantImage(variant, images),
    swatchImage: variantImage(variant, images),
    price,
    inStock: variant.available !== false,
    optionGroup,
  };
}

function lowestVariantPrice(variants = []) {
  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const variant = variants.find((v) => Number(v.price) === min);
  return formatOrisdiPrice(min, { compareAt: variant?.compare_at_price });
}

export function mapListProduct(product = {}) {
  const id = String(product.id || '').trim();
  const handle = String(product.handle || '').trim();
  if (id && handle) rememberHandle(id, handle);

  const names = resolveBilingualName(product.title);
  const brand = String(product.vendor || '').trim();
  const variants = product.variants || [];
  const primary = variants[0] || {};
  const barcode = variantBarcode(primary);
  const images = product.images || [];
  const thumb = pickLargestShopifySrc(images) || absImage(images[0]?.src || product.image?.src || product.featured_image);

  return {
    id,
    handle,
    nameAr: names.ar || names.en,
    nameEn: names.en || names.ar,
    brandAr: brand,
    brandEn: brand,
    thumb,
    price: lowestVariantPrice(variants),
    shadeCount: variants.length,
    hasOptions: variants.length > 1,
    category: String(product.product_type || '').trim(),
    sku: String(primary.sku || id).trim(),
    barcode,
    productUrl: productUrl(handle),
    inStock: variants.some((v) => v.available !== false),
  };
}

export function mapDetailProduct(arProduct = {}, enProduct = null, { light = false } = {}) {
  const base = mapListProduct(arProduct);
  if (light) return base;

  const descAr = stripHtml(arProduct.body_html || arProduct.description || '');
  const descEn = stripHtml(enProduct?.body_html || enProduct?.description || '');
  const descriptions = resolveBilingualDescription(descAr, descEn);

  const images = collectImageUrls(
    ...(arProduct.images || []).map((img) => img.src),
    ...(enProduct?.images || []).map((img) => img.src),
    enProduct?.featured_image,
    arProduct.featured_image,
  );

  const options = arProduct.options || [];
  const variants = arProduct.variants || [];
  const shades = variants.map((v, i) => mapVariantShade(v, i, {
    options,
    images: arProduct.images || [],
    productTitle: base.nameEn || base.nameAr,
  }));

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
    nameAr: resolveBilingualName(arProduct.title, enProduct?.title).ar || base.nameAr,
    nameEn: resolveBilingualName(arProduct.title, enProduct?.title).en || base.nameEn,
    descriptionAr: descriptions.ar || descAr,
    descriptionEn: descriptions.en || descEn,
    images: images.length ? images : [base.thumb].filter(Boolean),
    barcode: primary.barcode || base.barcode,
    shades: shades.length ? shades : [primary],
    shadeCount: shades.length || 1,
    hasOptions: shades.length > 1,
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
