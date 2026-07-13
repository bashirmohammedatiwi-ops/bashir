import {
  absImage,
  barcodeFromImageUrl,
  extractBarcode,
  formatSarPrice,
  parseNuxtPayload,
  revivePayloadNode,
  findProductNodeIndex,
  slugFromUrl,
} from './client.js';

function parseJsonLdBlocks(html = '') {
  const blocks = [];
  for (const match of String(html || '').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      /* skip */
    }
  }
  return blocks;
}

export function parseItemListJsonLd(html = '') {
  for (const block of parseJsonLdBlocks(html)) {
    if (block?.['@type'] === 'ItemList' && Array.isArray(block.itemListElement)) {
      return {
        total: Number(block.numberOfItems || block.itemListElement.length || 0),
        items: block.itemListElement.map((entry) => {
          const product = entry.item || entry;
          const url = product.url || product.offers?.url || entry.url || '';
          const slug = slugFromUrl(url);
          const idMatch = slug.match(/-n(\d+)$/i);
          const thumb = absImage(Array.isArray(product.image) ? product.image[0] : product.image);
          return {
            id: idMatch?.[1] || slug,
            slug,
            name: String(product.name || '').trim(),
            brand: String(product.brand?.name || product.manufacturer || '').trim(),
            thumb,
            barcode: barcodeFromImageUrl(thumb) || extractBarcode(product.gtin13 || product.gtin || product.sku || ''),
            price: formatSarPrice(product.offers?.price || product.price || ''),
            productUrl: url,
            inStock: !/OutOfStock/i.test(String(product.offers?.availability || product.availability || '')),
          };
        }),
      };
    }
  }
  return { total: 0, items: [] };
}

export function parseProductJsonLd(html = '', { lang = 'ar' } = {}) {
  for (const block of parseJsonLdBlocks(html)) {
    if (block?.['@type'] !== 'Product') continue;
    const images = (Array.isArray(block.image) ? block.image : [block.image])
      .map((u) => absImage(u))
      .filter(Boolean);
    const price = block.offers?.price ?? block.offers?.[0]?.price;
    return {
      lang,
      name: String(block.name || '').trim(),
      brand: String(block.brand?.name || block.manufacturer || '').trim(),
      description: String(block.description || '').trim(),
      sku: String(block.sku || '').trim(),
      barcode: extractBarcode(block.isbn || block.gtin13 || block.gtin || block.sku || ''),
      images,
      thumb: images[0] || '',
      price: formatSarPrice(price),
      inStock: !/OutOfStock/i.test(String(block.offers?.availability || '')),
      rating: Number(block.aggregateRating?.ratingValue || 0),
      reviewCount: Number(block.aggregateRating?.reviewCount || 0),
      category: String(block.category?.name || '').trim(),
      productUrl: String(block.offers?.url || '').trim(),
    };
  }
  return null;
}

function resolveBarcode(...sources) {
  for (const src of sources) {
    const fromText = extractBarcode(src);
    if (fromText) return fromText;
    const fromImg = barcodeFromImageUrl(src);
    if (fromImg && fromImg.length >= 12) return fromImg;
  }
  for (const src of sources) {
    const fromImg = barcodeFromImageUrl(src);
    if (fromImg) return fromImg;
  }
  return '';
}

function mapShadeValue(shade = {}, { groupAr = '', groupEn = '' } = {}) {
  const images = [
    shade.image,
    ...(Array.isArray(shade.additional_images) ? shade.additional_images : []),
  ].map((u) => absImage(u)).filter(Boolean);
  const barcode = resolveBarcode(
    shade.isbn,
    shade.barcode,
    shade.ean,
    shade.upc,
    shade.gtin,
    ...images,
  );

  return {
    id: String(shade.product_option_variant_id || shade.product_option_value_id || ''),
    nameAr: String(shade.name || '').trim(),
    nameEn: String(shade.en_name || shade.name || '').trim(),
    sku: String(shade.sku || '').trim(),
    barcode,
    image: images[0] || '',
    price: formatSarPrice(shade.price_formated || shade.event_price || shade.price || ''),
    inStock: shade.has_stock !== false,
    hexColor: String(shade.hex_color || shade.hexColor || '').trim(),
    optionGroupAr: groupAr,
    optionGroupEn: groupEn,
  };
}

export function parseNuxtProduct(html = '', productId = '') {
  const payload = parseNuxtPayload(html);
  if (!payload) return null;
  const index = findProductNodeIndex(payload, productId);
  if (index < 0) return null;

  const product = revivePayloadNode(payload, index);
  if (!product?.id) return null;

  const images = [
    product.thumb,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.catalog_images) ? product.catalog_images : []),
  ].map((u) => absImage(u)).filter(Boolean);

  const shades = [];
  for (const opt of product.options || []) {
    const groupAr = String(opt?.name || '').trim();
    const groupEn = String(opt?.en_name || opt?.name || '').trim();
    for (const value of opt?.option_value || []) {
      const shade = mapShadeValue(value, { groupAr, groupEn });
      if (shade.id || shade.nameAr || shade.sku) shades.push(shade);
    }
  }

  const barcode = extractBarcode(product.isbn || product.sku || '')
    || barcodeFromImageUrl(images[0] || '')
    || shades.find((s) => s.barcode)?.barcode
    || '';

  return {
    id: String(product.id || productId),
    slug: slugFromUrl(product.seo_url || product.href || ''),
    nameAr: String(product.name || '').trim(),
    nameEn: String(product.en_name || product.name || '').trim(),
    brandAr: String(product.manufacturer_ar || product.manufacturer || '').trim(),
    brandEn: String(product.manufacturer || product.manufacturer_en || '').trim(),
    descriptionAr: String(product.description || product.meta_description || '').trim(),
    descriptionEn: String(product.en_description || '').trim(),
    sku: String(product.sku || '').trim(),
    barcode,
    thumb: images[0] || '',
    images: [...new Set(images)],
    price: formatSarPrice(product.price_formated || product.price || product.event_price || ''),
    inStock: product.has_stock !== false,
    hasOptions: Boolean(product.has_option || shades.length > 0),
    shades,
    shadeCount: shades.length,
    categoryId: String(product.category_id || '').trim(),
    manufacturerId: String(product.manufacturer_id || '').trim(),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviews_total || 0),
    productUrl: String(product.seo_url || '').trim(),
  };
}

export function parseProductPage(html = '', { lang = 'ar', productId = '' } = {}) {
  const jsonLd = parseProductJsonLd(html, { lang });
  const nuxt = parseNuxtProduct(html, productId);
  if (!jsonLd && !nuxt) return null;

  const isAr = lang === 'ar';
  return {
    id: nuxt?.id || productId,
    slug: nuxt?.slug || '',
    nameAr: isAr ? (nuxt?.nameAr || jsonLd?.name || '') : (nuxt?.nameAr || ''),
    nameEn: !isAr ? (nuxt?.nameEn || jsonLd?.name || '') : (nuxt?.nameEn || ''),
    brandAr: isAr ? (nuxt?.brandAr || jsonLd?.brand || '') : (nuxt?.brandAr || ''),
    brandEn: !isAr ? (nuxt?.brandEn || jsonLd?.brand || '') : (nuxt?.brandEn || ''),
    descriptionAr: isAr ? (nuxt?.descriptionAr || jsonLd?.description || '') : (nuxt?.descriptionAr || ''),
    descriptionEn: !isAr ? (nuxt?.descriptionEn || jsonLd?.description || '') : (nuxt?.descriptionEn || ''),
    sku: nuxt?.sku || jsonLd?.sku || '',
    barcode: extractBarcode(jsonLd?.barcode || '') || extractBarcode(nuxt?.barcode || ''),
    thumb: nuxt?.thumb || jsonLd?.thumb || '',
    images: nuxt?.images?.length ? nuxt.images : (jsonLd?.images || []),
    price: nuxt?.price || jsonLd?.price || '',
    inStock: nuxt?.inStock ?? jsonLd?.inStock ?? true,
    hasOptions: nuxt?.hasOptions || (nuxt?.shades?.length || 0) > 0,
    shades: nuxt?.shades || [],
    shadeCount: nuxt?.shadeCount || 0,
    rating: nuxt?.rating || jsonLd?.rating || 0,
    reviewCount: nuxt?.reviewCount || jsonLd?.reviewCount || 0,
    category: jsonLd?.category || '',
    productUrl: jsonLd?.productUrl || nuxt?.productUrl || '',
    lang,
  };
}
