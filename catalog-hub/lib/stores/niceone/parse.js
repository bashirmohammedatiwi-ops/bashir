import {
  absImage,
  extractBarcode,
  formatSarPrice,
  parseNuxtPayload,
  revivePayloadNode,
  findProductNodeIndex,
  slugFromUrl,
} from './client.js';
import {
  barcodeFromImageUrl,
  collectBarcodeFromSources,
  pickProductBarcode,
} from './barcodes.js';

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

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlaceholderDescription(text = '') {
  const t = String(text || '').trim();
  return !t || t === '-' || t === '—' || t.length < 2;
}

function descriptionsFromNuxt(product = {}, { lang = 'ar' } = {}) {
  const rows = Array.isArray(product?.descriptions) ? product.descriptions : [];
  const preferred = lang === 'en'
    ? [/description/i]
    : [/الوصف/i, /وصف/i];
  const hit = rows.find((r) => preferred.some((re) => re.test(String(r?.title || '')))) || rows[0];
  const text = stripHtml(hit?.description || '');
  return isPlaceholderDescription(text) ? '' : text;
}

function mapShadeValue(shade = {}, { groupAr = '', groupEn = '' } = {}) {
  const images = [
    shade.image,
    ...(Array.isArray(shade.additional_images) ? shade.additional_images : []),
  ].map((u) => absImage(u)).filter(Boolean);
  const barcode = collectBarcodeFromSources({
    isbn: shade.isbn,
    barcode: shade.barcode,
    ean: shade.ean,
    upc: shade.upc,
    gtin: shade.gtin,
    sku: shade.sku,
    images,
  });

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

export function parseNuxtProduct(html = '', productId = '', { lang = 'ar' } = {}) {
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

  const barcode = pickProductBarcode({
    barcode: extractBarcode(product.isbn || product.sku || ''),
    images,
    shades,
  });

  const descFromBlocks = descriptionsFromNuxt(product, { lang });
  const plainDesc = String(product.description || product.meta_description || '').trim();
  const plainEnDesc = String(product.en_description || '').trim();

  return {
    id: String(product.id || productId),
    slug: slugFromUrl(product.seo_url || product.href || ''),
    nameAr: String(product.name || '').trim(),
    nameEn: String(product.en_name || product.name || '').trim(),
    brandAr: String(product.manufacturer_ar || product.manufacturer || '').trim(),
    brandEn: String(product.manufacturer || product.manufacturer_en || '').trim(),
    descriptionAr: lang === 'ar'
      ? (descFromBlocks || (!isPlaceholderDescription(plainDesc) ? plainDesc : ''))
      : '',
    descriptionEn: lang === 'en'
      ? (descFromBlocks || (!isPlaceholderDescription(plainEnDesc) ? plainEnDesc : ''))
      : (!isPlaceholderDescription(plainEnDesc) ? plainEnDesc : ''),
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

function pickDescription(...candidates) {
  for (const text of candidates) {
    const t = String(text || '').trim();
    if (!isPlaceholderDescription(t)) return t;
  }
  return '';
}

export function parseProductPage(html = '', { lang = 'ar', productId = '' } = {}) {
  const jsonLd = parseProductJsonLd(html, { lang });
  const nuxt = parseNuxtProduct(html, productId, { lang });
  if (!jsonLd && !nuxt) return null;

  const isAr = lang === 'ar';
  return {
    id: nuxt?.id || productId,
    slug: nuxt?.slug || '',
    nameAr: isAr ? (nuxt?.nameAr || jsonLd?.name || '') : (nuxt?.nameAr || ''),
    nameEn: !isAr ? (nuxt?.nameEn || jsonLd?.name || '') : (nuxt?.nameEn || ''),
    brandAr: isAr ? (nuxt?.brandAr || jsonLd?.brand || '') : (nuxt?.brandAr || ''),
    brandEn: !isAr ? (nuxt?.brandEn || jsonLd?.brand || '') : (nuxt?.brandEn || ''),
    descriptionAr: pickDescription(
      isAr ? nuxt?.descriptionAr : '',
      isAr ? jsonLd?.description : '',
      nuxt?.descriptionAr,
    ),
    descriptionEn: pickDescription(
      !isAr ? nuxt?.descriptionEn : '',
      !isAr ? jsonLd?.description : '',
      nuxt?.descriptionEn,
    ),
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
