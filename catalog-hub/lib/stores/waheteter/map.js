import {
  absImage,
  formatWaheteterPrice,
  productUrl,
  stripHtml,
  variantBarcode,
} from './client.js';
import { collectImageUrls } from '../../core/images.js';
import { resolveBilingualDescription, resolveBilingualName } from '../../core/bilingual.js';

function extractBrand(product = {}) {
  const attrs = product.attributes || [];
  const brandAttr = attrs.find((a) => a.taxonomy === 'pa_brand' || String(a.name || '').includes('براند'));
  const term = brandAttr?.terms?.[0];
  return String(term?.name || product.brands?.[0]?.name || '').trim();
}

function primaryCategory(product = {}) {
  const cats = product.categories || [];
  return String(cats[0]?.name || '').trim();
}

function variationLabel(row = {}) {
  const attrs = row.attributes || [];
  if (attrs.length) {
    return attrs.map((a) => String(a.value || a.name || '').trim()).filter(Boolean).join(' · ');
  }
  return String(row.variation || '').trim();
}

function wooImage(img = {}) {
  if (!img) return '';
  if (typeof img === 'string') return absImage(img);
  return absImage(img.full_src || img.fullSrc || img.src || img.url || img.thumbnail);
}

function mapVariationShade(row = {}, index = 0, { productTitle = '', optionGroup = '' } = {}) {
  const label = variationLabel(row) || productTitle;
  const { ar, en } = resolveBilingualName(label);
  const sku = String(row.sku || row.id || index).trim();
  const images = row.images || [];
  const image = wooImage(images[0] || row.image);

  return {
    id: String(row.id || index),
    nameAr: ar || label,
    nameEn: en || label,
    sku,
    barcode: variantBarcode(row),
    image,
    price: formatWaheteterPrice(row.prices),
    inStock: row.is_in_stock !== false,
    optionGroup: optionGroup || String(row.variation || '').split(':')[0]?.trim(),
  };
}

export function mapListProduct(product = {}) {
  const id = String(product.id || '').trim();
  const slug = String(product.slug || '').trim();
  const names = resolveBilingualName(product.name, stripHtml(product.short_description));
  const brand = extractBrand(product);
  const images = product.images || [];
  const thumb = wooImage(images[0]);
  const variations = product.variations || [];
  const price = formatWaheteterPrice(product.prices);
  const parentId = Number(product.parent || 0);

  return {
    id: parentId > 0 ? String(parentId) : id,
    nameAr: names.ar || names.en || String(product.name || '').trim(),
    nameEn: names.en || names.ar || String(product.name || '').trim(),
    brandAr: brand,
    brandEn: brand,
    thumb,
    price,
    shadeCount: variations.length || (product.type === 'variable' ? 2 : 1),
    hasOptions: product.type === 'variable' || variations.length > 1,
    category: primaryCategory(product),
    sku: String(product.sku || id).trim(),
    barcode: variantBarcode(product),
    productUrl: productUrl(slug, id),
    inStock: product.is_in_stock !== false,
  };
}

export function mapDetailProduct(product = {}, variationRows = [], { light = false } = {}) {
  const base = mapListProduct(product);
  if (light) return base;

  const descAr = stripHtml(product.description || product.short_description || '');
  const descEn = stripHtml(product.short_description || '');
  const descriptions = resolveBilingualDescription(descAr, descEn);

  const images = collectImageUrls(
    ...(product.images || []).map((img) => wooImage(img)),
    ...variationRows.flatMap((v) => (v.images || []).map((img) => wooImage(img))),
  );

  const sizeAttr = (product.attributes || []).find((a) => a.taxonomy === 'pa_size' || String(a.name || '').includes('حجم'));
  const optionGroup = String(sizeAttr?.name || 'الحجم').trim();

  let shades = [];
  if (variationRows.length) {
    shades = variationRows.map((row, i) => mapVariationShade(row, i, {
      productTitle: base.nameAr,
      optionGroup,
    }));
  } else if (Array.isArray(product.variations) && product.variations.length) {
    shades = product.variations.map((v, i) => mapVariationShade({
      id: v.id,
      variation: (v.attributes || []).map((a) => `${a.name}: ${a.value}`).join(', '),
      attributes: v.attributes,
      sku: '',
      prices: product.prices,
      images: product.images,
      is_in_stock: product.is_in_stock,
    }, i, { productTitle: base.nameAr, optionGroup }));
  } else {
    shades = [mapVariationShade(product, 0, { productTitle: base.nameAr, optionGroup })];
  }

  const primary = shades.find((s) => s.barcode) || shades[0] || {
    id: '0',
    nameAr: base.nameAr,
    nameEn: base.nameEn,
    sku: base.sku,
    barcode: base.barcode,
    image: images[0] || base.thumb,
    price: base.price,
    inStock: base.inStock,
    optionGroup,
  };

  return {
    ...base,
    descriptionAr: descriptions.ar || descAr,
    descriptionEn: descriptions.en || descEn,
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
