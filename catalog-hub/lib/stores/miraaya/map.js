import {
  absMediaUrl,
  algoliaPrimarySku,
  algoliaSkus,
  extractBarcode,
  formatIqdPrice,
  priceFromRange,
  productPageUrl,
  restBrand,
  restGallery,
  restUrlKey,
} from './client.js';

function stripHtml(html = '') {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shadeLabelFromAttributes(attributes = [], options = []) {
  const color = attributes.find((a) => a.code === 'color')?.label;
  const size = attributes.find((a) => a.code === 'size')?.label;
  const shade = attributes.find((a) => a.code === 'shade')?.label;
  if (color && !/^#?[0-9a-f]{3,8}$/i.test(color)) return color;
  if (size) return size;
  if (shade && !/^#?[0-9a-f]{3,8}$/i.test(shade)) return shade;
  return color || size || shade || '';
}

function swatchFromOptions(options = [], attributes = []) {
  for (const attr of attributes) {
    const opt = options.find((o) => o.attribute_code === attr.code);
    const val = opt?.values?.find((v) => v.value_index === attr.value_index);
    const sw = val?.swatch_data?.value;
    if (sw && /^#?[0-9a-f]{3,8}$/i.test(sw)) {
      return sw.startsWith('#') ? sw : `#${sw}`;
    }
    if (attr.code === 'shade' && attr.label && /^#?[0-9a-f]{3,8}$/i.test(attr.label)) {
      return attr.label.startsWith('#') ? attr.label : `#${attr.label}`;
    }
  }
  return '';
}

export function mapListFromAlgolia(arHit = null, enHit = null) {
  const primary = arHit || enHit;
  if (!primary) return null;

  const sku = algoliaPrimarySku(primary);
  const urlKey = String(primary.url || '').replace(/\.html$/, '').split('/').pop()
    || primary.url_key
    || '';

  const nameAr = String(arHit?.arabic_name || arHit?.name || '').trim();
  const nameEn = String(enHit?.english_name || enHit?.name || enHit?.arabic_name || '').trim();
  const brandAr = String(arHit?.arabic_brand || arHit?.brand || '').trim();
  const brandEn = String(enHit?.brand || enHit?.arabic_brand || brandAr).trim();
  const price = formatIqdPrice(primary.price?.IQD?.default || primary.minimal_price || 0);

  return {
    id: sku || urlKey,
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    brandAr: brandAr || brandEn,
    brandEn: brandEn || brandAr,
    thumb: primary.image_url || primary.thumbnail_url || '',
    price,
    shadeCount: primary.type_id === 'configurable' ? Math.max(algoliaSkus(primary).length - 1, 1) : 1,
    hasOptions: primary.type_id === 'configurable',
    category: primary.categories?.level1?.[0] || primary.categories?.level0?.[0] || '',
    sku,
    barcode: extractBarcode(sku) || extractBarcode(algoliaSkus(primary).find((s) => extractBarcode(s)) || ''),
    productUrl: productPageUrl(urlKey, 'ar'),
    inStock: primary.in_stock !== false && primary.salable !== false,
  };
}

export function mapListFromGraphql(arItem = null, enItem = null, brand = {}) {
  const primary = arItem || enItem;
  if (!primary) return null;

  const sku = String(primary.sku || '');
  const nameAr = String(arItem?.name || '').trim();
  const nameEn = String(enItem?.name || '').trim();

  return {
    id: sku,
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    brandAr: brand.ar || brand.en || '',
    brandEn: brand.en || brand.ar || '',
    thumb: primary.image?.url || '',
    price: priceFromRange(primary.price_range),
    shadeCount: primary.__typename === 'ConfigurableProduct' ? null : 1,
    hasOptions: primary.__typename === 'ConfigurableProduct',
    category: primary.categories?.[0]?.name || '',
    sku,
    barcode: extractBarcode(sku),
    productUrl: productPageUrl(primary.url_key, 'ar'),
    inStock: primary.stock_status === 'IN_STOCK',
  };
}

export function mapDetailProduct(arItem = null, enItem = null, {
  restAr = null,
  restEn = null,
  highlightSku = '',
} = {}) {
  const primary = arItem || enItem;
  if (!primary) return null;

  const sku = String(primary.sku || '');
  const nameAr = String(arItem?.name || '').trim();
  const nameEn = String(enItem?.name || '').trim();
  const brandAr = restBrand(restAr || {}) || String(arItem?.name || '').split(' ')[0];
  const brandEn = restBrand(restEn || {}) || restBrand(restAr || {}) || brandAr;

  const images = [
    ...(arItem?.media_gallery || []).map((g) => g.url),
    ...(enItem?.media_gallery || []).map((g) => g.url),
    arItem?.image?.url,
    enItem?.image?.url,
    ...restGallery(restAr || {}),
    ...restGallery(restEn || {}),
  ].filter(Boolean);

  const thumb = images[0] || '';
  const price = priceFromRange(arItem?.price_range || enItem?.price_range);
  const descriptionAr = stripHtml(arItem?.description?.html || arItem?.short_description?.html || '');
  const descriptionEn = stripHtml(enItem?.description?.html || enItem?.short_description?.html || '');

  let shades = [];
  const variants = arItem?.variants || enItem?.variants || [];
  const options = arItem?.configurable_options || enItem?.configurable_options || [];
  const enVariants = enItem?.variants || [];

  if (variants.length) {
    shades = variants.map((row, index) => {
      const arVar = row;
      const enVar = enVariants[index] || enVariants.find((v) => v.product?.sku === row.product?.sku) || {};
      const product = arVar.product || enVar.product || {};
      const enProduct = enVar.product || product;
      const labelAr = shadeLabelFromAttributes(arVar.attributes, options) || stripHtml(product.name || '');
      const labelEn = shadeLabelFromAttributes(enVar.attributes, options) || stripHtml(enProduct.name || '');
      const varSku = String(product.sku || '');
      return {
        id: varSku || String(index),
        nameAr: labelAr || labelEn,
        nameEn: labelEn || labelAr,
        sku: varSku,
        barcode: extractBarcode(varSku),
        image: product.image?.url || thumb,
        swatchImage: product.image?.url || '',
        price: priceFromRange(product.price_range) || price,
        inStock: product.stock_status === 'IN_STOCK',
        colorHex: swatchFromOptions(options, arVar.attributes),
        optionGroup: options.find((o) => o.attribute_code === 'color')?.label || 'التدرج',
      };
    });
  }

  if (!shades.length) {
    shades = [{
      id: sku,
      nameAr: nameAr || nameEn,
      nameEn: nameEn || nameAr,
      sku,
      barcode: extractBarcode(sku),
      image: thumb,
      price,
      inStock: primary.stock_status === 'IN_STOCK',
      colorHex: '',
      optionGroup: '',
    }];
  }

  const highlight = highlightSku || sku;
  const allImages = [...new Set([
    ...images,
    ...shades.map((s) => s.image).filter(Boolean),
    ...shades.map((s) => s.swatchImage).filter(Boolean),
  ])];

  return {
    id: sku,
    sku,
    barcode: extractBarcode(highlight) || extractBarcode(sku) || shades.find((s) => s.barcode)?.barcode || '',
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    brandAr,
    brandEn,
    descriptionAr,
    descriptionEn,
    thumb: allImages[0] || thumb,
    images: allImages,
    price,
    category: primary.categories?.[0]?.name || '',
    productUrl: productPageUrl(primary.url_key || restUrlKey(restAr || {}), 'ar'),
    productUrlEn: productPageUrl(primary.url_key || restUrlKey(restEn || restAr || {}), 'en'),
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1,
    inStock: primary.stock_status === 'IN_STOCK',
    manufacturer: brandAr,
    manufacturerEn: brandEn,
  };
}

export function toBarcodeHit(detail, digits, shade) {
  return {
    id: detail.id,
    nameAr: detail.nameAr,
    nameEn: detail.nameEn,
    brandAr: detail.brandAr,
    brandEn: detail.brandEn,
    thumb: shade?.image || detail.thumb,
    price: shade?.price || detail.price,
    barcode: shade?.barcode || detail.barcode || digits,
    shadeName: shade?.nameAr || shade?.nameEn || '',
    matchType: 'ean',
  };
}
