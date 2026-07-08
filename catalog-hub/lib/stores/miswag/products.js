import {
  miswagFetch,
  typesenseSearch,
  formatPrice,
  absImage,
  parseTitle,
  DETAIL_TTL,
  cacheGet,
  cacheSet,
} from './client.js';
import { findBarcodesForProduct, upsertBarcodeIndex } from '../../core/barcode-index.js';
import {
  fetchV2BarcodesForIds,
  fetchV2Barcode,
  isMiswagInternalId,
  isValidEan,
} from './v2-barcode.js';

function extractEan(v = {}) {
  for (const key of ['barcode', 'ean', 'upc', 'gtin', 'isbn']) {
    const val = String(v?.[key] || '').replace(/\D/g, '');
    if (isValidEan(val)) return val;
  }
  return '';
}

/** رقم مسواگ للتدرج = معرّف variation.id (ليس باركود EAN) */
function extractMiswagShadeId(v = {}) {
  const id = String(v?.id || v?.variation_id || '').replace(/\D/g, '');
  return id || '';
}

function parseColorValue(raw = '') {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('#')) return s;
  if (/^[0-9a-fA-F]{3,8}$/.test(s)) return `#${s}`;
  return s;
}

function isDefaultTitle(title = '') {
  const s = String(title || '').trim().toLowerCase();
  return !s || s === 'default' || s === 'افتراضي';
}

function mapVariation(v, optionGroup = '') {
  const miswagId = extractMiswagShadeId(v);
  const ean = extractEan(v);
  const hex = parseColorValue(v.color || v.hex);
  return {
    name: String(v.title || '').trim(),
    nameAr: String(v.title || '').trim(),
    nameEn: String(v.title || '').trim(),
    sku: miswagId,
    optionId: miswagId,
    miswagId,
    barcode: ean,
    ean,
    hex,
    image: absImage(v.image),
    price: formatPrice(v.price),
    optionGroup,
    inStock: v.is_available !== false,
  };
}

/** جلب كل صفحات التدرجات */
async function fetchAllVariations(pid) {
  const cacheKey = `miswag:vars:${pid}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const allVariations = [];
  const sizeMap = new Map();
  let varInfo = {};
  let cursor = null;
  let pages = 0;

  do {
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, {
      params: cursor ? { cursor } : {},
    }).catch(() => null);
    if (!chunk) break;

    const info = chunk.info || chunk;
    varInfo = {
      ...varInfo,
      variation_title: info.variation_title || varInfo.variation_title || 'الألوان',
      size_title: info.size_title || varInfo.size_title || 'الحجم',
    };
    for (const v of info.variations || []) allVariations.push(v);
    for (const s of info.sizes || []) sizeMap.set(String(s.id), s);
    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 30);

  const out = {
    variation_title: varInfo.variation_title || 'الألوان',
    size_title: varInfo.size_title || 'الحجم',
    variations: allVariations,
    sizes: [...sizeMap.values()],
  };
  cacheSet(cacheKey, out);
  return out;
}

function shouldKeepVariation(shade = {}) {
  if (!isDefaultTitle(shade.name)) return true;
  return !!(shade.hex || shade.image || shade.miswagId);
}

function buildShadesFromVarInfo(varInfo = {}) {
  const optionGroup = String(varInfo.variation_title || 'الألوان').trim();
  const colors = (varInfo.variations || []).map((v) => mapVariation(v, optionGroup));
  const realColors = colors.filter(shouldKeepVariation);

  if (realColors.length) return realColors;

  if (colors.length === 1 && (varInfo.sizes || []).length > 1) {
    const sizeGroup = String(varInfo.size_title || 'الحجم').trim();
    const base = colors[0];
    return (varInfo.sizes || []).map((s) => ({
      name: String(s.title || s.id || '').trim(),
      nameAr: String(s.title || s.id || '').trim(),
      nameEn: String(s.title || s.id || '').trim(),
      barcode: extractEan(s),
      miswagId: extractMiswagShadeId(s) || base.miswagId,
      image: base.image,
      hex: base.hex,
      sku: String(s.id || ''),
      optionId: `${base.optionId}-${s.id}`,
      optionGroup: sizeGroup,
      price: base.price,
      inStock: s.is_available !== false,
    }));
  }
  return colors;
}

function collectBlocks(content = []) {
  const blocks = [];
  for (const block of content || []) {
    if (block?.type) blocks.push(block);
    if (block?.content) blocks.push(...collectBlocks(block.content));
  }
  return blocks;
}

function extractGalleryImages(blocks = []) {
  const urls = [];
  for (const b of blocks) {
    if (b.type === 'gallery' && Array.isArray(b.items)) {
      for (const it of b.items) {
        const u = absImage(it.url || it.image || it.src);
        if (u) urls.push(u);
      }
    }
    if (b.type === 'image') {
      const u = absImage(b.url || b.image);
      if (u) urls.push(u);
    }
  }
  return [...new Set(urls)];
}

async function fetchTypesenseDoc(pid) {
  try {
    const safeId = String(pid).replace(/`/g, '');
    const { hits } = await typesenseSearch('*', {
      perPage: 1,
      filterBy: `id:=\`${safeId}\` || product_id:=\`${safeId}\``,
    });
    return hits[0]?.document || null;
  } catch {
    return null;
  }
}

function parseTypesenseVariations(doc) {
  if (!doc) return [];
  try {
    const raw = typeof doc.variations === 'string' ? JSON.parse(doc.variations) : doc.variations;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function typesenseImageUrl(filename = '', fallback = '') {
  const f = String(filename || '').trim();
  if (!f) return fallback;
  if (f.startsWith('http')) return absImage(f);
  return absImage(`https://cdn.miswag.me/images/images/${f}`);
}

function mapTypesenseVariation(v, optionGroup = '', fallbackImage = '') {
  const miswagId = String(v.id || v.variation_id || '').trim();
  const name = String(v.color || v.title || v.name || miswagId).trim();
  const extra = Array.isArray(v.additional_images) ? v.additional_images[0] : '';
  return {
    name,
    nameAr: name,
    nameEn: name,
    sku: miswagId,
    optionId: miswagId,
    miswagId,
    barcode: extractEan(v),
    ean: extractEan(v),
    hex: parseColorValue(v.color_code || v.hex || v.color),
    image: typesenseImageUrl(extra, fallbackImage),
    price: '',
    optionGroup,
    inStock: true,
  };
}

/** إضافة تدرجات موجودة في Typesense وغير مُرجعة من API التدرجات */
function mergeShadesFromTypesense(shades = [], tsVars = [], optionGroup = '', fallbackImage = '') {
  if (!tsVars.length) return shades;

  const byId = new Map(shades.map((s) => [String(s.sku || s.miswagId || s.optionId || ''), s]));
  const merged = [...shades];

  for (const v of tsVars) {
    const id = String(v.id || v.variation_id || '');
    if (!id || byId.has(id)) continue;
    const shade = mapTypesenseVariation(v, optionGroup, fallbackImage);
    byId.set(id, shade);
    merged.push(shade);
  }

  return merged;
}

/** دمج باركود/لون من Typesense عند غيابها في API التفاصيل */
async function enrichShadesFromTypesense(pid, shades = []) {
  if (!shades.length) return shades;
  const doc = await fetchTypesenseDoc(pid);
  const tsVars = parseTypesenseVariations(doc);
  if (!tsVars.length) return shades;

  const byId = new Map(tsVars.map((v) => [String(v.id || v.variation_id || ''), v]));
  const byColor = new Map(
    tsVars
      .filter((v) => v.color || v.hex)
      .map((v) => [String(v.color || v.hex).toLowerCase(), v]),
  );

  return shades.map((shade) => {
    const hit =
      byId.get(String(shade.sku || shade.optionId || '')) ||
      (shade.hex ? byColor.get(shade.hex.toLowerCase()) : null);
    if (!hit) return shade;
    const ean = extractEan(hit) || shade.barcode;
    const miswagId = extractMiswagShadeId(hit) || shade.miswagId || shade.sku;
    const hex = parseColorValue(hit.color || hit.hex) || shade.hex;
    return {
      ...shade,
      barcode: ean,
      miswagId,
      sku: miswagId || shade.sku,
      optionId: miswagId || shade.optionId,
      ean,
      name: shade.name && !/^\d+$/.test(shade.name) ? shade.name : String(hit.title || hit.name || shade.name || '').trim(),
      nameAr: shade.nameAr && !/^\d+$/.test(shade.nameAr) ? shade.nameAr : String(hit.title || hit.name || shade.nameAr || '').trim(),
      nameEn: shade.nameEn && !/^\d+$/.test(shade.nameEn) ? shade.nameEn : String(hit.title || hit.name || shade.nameEn || '').trim(),
      image: shade.image || absImage(hit.image),
    };
  });
}

function shadeNamesMatch(a = '', b = '') {
  const na = String(a || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  const nb = String(b || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ').trim();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** ربط باركود EAN من الفهرس المحلي عند غيابه في API مسواگ */
function applyEanFromIndex(pid, product) {
  const entries = findBarcodesForProduct('miswag', pid);
  if (!entries.length) return product;

  const productLevel = entries.find((e) => !e.shadeName);
  if (productLevel?.barcode && !product.barcode) {
    product.barcode = String(productLevel.barcode).replace(/\D/g, '');
  }

  if (!product.shades?.length) return product;

  product.shades = product.shades.map((shade) => {
    if (shade.barcode) return shade;
    const byShade = entries.find((e) => e.shadeName && shadeNamesMatch(shade.nameAr || shade.name, e.shadeName));
    const ean = byShade?.barcode || (product.shades.length === 1 ? product.barcode : '');
    if (!ean) return shade;
    return { ...shade, barcode: String(ean).replace(/\D/g, ''), ean: String(ean).replace(/\D/g, '') };
  });

  if (!product.barcode) {
    const fromShade = product.shades.find((s) => s.barcode)?.barcode;
    if (fromShade) product.barcode = fromShade;
  }

  return product;
}

function learnShadeBarcode(productId, shade, barcode) {
  if (!productId || !shade || !isValidEan(barcode)) return;
  upsertBarcodeIndex(barcode, {
    store: 'miswag',
    productId: String(productId),
    name: shade.nameAr || shade.name || '',
    shadeName: shade.nameAr || shade.name || '',
    matchType: 'v2',
  });
}

/** جلب باركود EAN الحقيقي من API v2 (رمز المنتج في تطبيق مسواگ) */
async function enrichShadesWithV2Barcodes(productId, shades = []) {
  if (!shades.length) {
    const barcode = await fetchV2Barcode(productId);
    return barcode ? { shades, productBarcode: barcode } : { shades, productBarcode: '' };
  }

  const ids = shades.map((s) => String(s.miswagId || s.sku || s.optionId || '')).filter(Boolean);
  const barcodeMap = await fetchV2BarcodesForIds([...new Set([productId, ...ids])]);

  const productBarcode = barcodeMap.get(String(productId)) || '';
  const enriched = shades.map((shade) => {
    const vid = String(shade.miswagId || shade.sku || shade.optionId || '');
    const fromV2 = vid ? barcodeMap.get(vid) : '';
    const barcode = fromV2 || (shades.length === 1 ? productBarcode : '') || shade.barcode;
    if (!isValidEan(barcode)) {
      return { ...shade, barcode: '', ean: '' };
    }
    learnShadeBarcode(productId, shade, barcode);
    return { ...shade, barcode, ean: barcode };
  });

  const fromShade = enriched.find((s) => s.barcode)?.barcode || '';
  return { shades: enriched, productBarcode: productBarcode || fromShade };
}

async function fetchTypesenseFallback(pid) {
  try {
    const doc = await fetchTypesenseDoc(pid);
    if (!doc) return null;
    const { ar, en } = parseTitle({ AR: doc.title_AR, EN: doc.title_EN });
    const thumb = absImage(doc.image || doc.image_url);
    return {
      id: String(doc.id || pid),
      sku: String(doc.alias || pid),
      nameAr: ar || en,
      nameEn: en || ar,
      brandAr: String(doc.brand || '').trim(),
      brandEn: String(doc.brand || '').trim(),
      descriptionAr: '',
      descriptionEn: '',
      price: formatPrice({ value: doc.price_numeric_value, currency: doc.price_currency || 'IQD' }),
      thumb,
      images: thumb ? [thumb] : [],
      shades: [],
      shadeCount: 0,
      hasOptions: false,
      barcode: '',
      productUrl: doc.url || `https://miswag.com/products/${pid}`,
      category: [doc.l1_division_ar, doc.l2_division_ar, doc.l3_division_ar].filter(Boolean).join(' › '),
      inStock: true,
    };
  } catch {
    return null;
  }
}

/** تفاصيل منتج كاملة مع كل التدرجات */
export async function fetchProductDetail(id, { light = false } = {}) {
  const pid = String(id || '').trim();
  if (!pid) return null;

  const cacheKey = `miswag:detail:${pid}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  let detail;
  let varInfo = { variations: [], sizes: [] };

  try {
    [detail, varInfo] = await Promise.all([
      miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}`),
      light ? Promise.resolve({ variations: [], sizes: [] }) : fetchAllVariations(pid),
    ]);
  } catch {
    const fallback = await fetchTypesenseFallback(pid);
    if (fallback) return fallback;
    return null;
  }

  if (!detail?.info) {
    const fallback = await fetchTypesenseFallback(pid);
    if (fallback) return fallback;
    return null;
  }

  const meta = detail.info?.meta || {};
  const blocks = collectBlocks(detail.content || []);
  const images = extractGalleryImages(blocks);
  if (meta.image_url) {
    const main = absImage(meta.image_url);
    if (main && !images.includes(main)) images.unshift(main);
  }

  const thumb = absImage(meta.image_url);
  let shades = light ? [] : buildShadesFromVarInfo(varInfo);

  if (!light) {
    const doc = await fetchTypesenseDoc(String(meta.product_id || pid));
    const tsVars = parseTypesenseVariations(doc);
    const optionGroup = String(varInfo.variation_title || 'الألوان').trim();
    shades = mergeShadesFromTypesense(shades, tsVars, optionGroup, thumb);
    shades = await enrichShadesFromTypesense(pid, shades);
    const { shades: withBarcodes, productBarcode } = await enrichShadesWithV2Barcodes(
      String(meta.product_id || pid),
      shades,
    );
    shades = withBarcodes;
    if (productBarcode) {
      meta._v2ProductBarcode = productBarcode;
    }
  }

  const brand = String(meta.brand || '').trim();
  const { ar, en } = parseTitle(meta.name);

  const product = {
    id: String(meta.product_id || pid),
    sku: String(meta.product_id || pid),
    nameAr: ar || meta.name || '',
    nameEn: en || meta.name || '',
    brandAr: brand,
    brandEn: brand,
    descriptionAr: String(meta.description || '').trim(),
    descriptionEn: String(meta.description || '').trim(),
    price: formatPrice({ value: meta.price, original_value: meta.original_price, currency: meta.currency || 'IQD' }),
    thumb: images[0] || absImage(meta.image_url),
    images,
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1 || (varInfo.sizes?.length > 1),
    barcode: meta._v2ProductBarcode || extractEan(meta) || shades.find((s) => s.barcode)?.barcode || '',
    miswagId: String(meta.product_id || pid),
    productUrl: meta.url || meta.share_link || `https://miswag.com/products/${meta.product_id || pid}`,
    category: String(meta.category || '').trim(),
    inStock: detail.info?.size?.is_available !== false,
  };

  applyEanFromIndex(product.id, product);
  cacheSet(cacheKey, product);
  return product;
}
