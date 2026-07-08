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

function extractVariationBarcode(v = {}) {
  for (const key of ['barcode', 'ean', 'upc', 'gtin', 'isbn']) {
    const val = String(v?.[key] || '').replace(/\D/g, '');
    if (/^\d{8,14}$/.test(val)) return val;
  }
  const sku = String(v?.sku || v?.alias || v?.id || '').replace(/\D/g, '');
  if (/^\d{8,14}$/.test(sku)) return sku;
  return '';
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
  const bc = extractVariationBarcode(v);
  const hex = parseColorValue(v.color || v.hex);
  return {
    name: String(v.title || '').trim(),
    nameAr: String(v.title || '').trim(),
    nameEn: String(v.title || '').trim(),
    sku: String(v.id || ''),
    optionId: String(v.id || ''),
    barcode: bc,
    ean: bc,
    hex,
    image: absImage(v.image),
    price: formatPrice(v.price),
    optionGroup,
    inStock: v.is_available !== false,
  };
}

/** جلب كل صفحات التدرجات بالتوازي */
async function fetchAllVariations(pid) {
  const cacheKey = `miswag:vars:${pid}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const first = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`).catch(() => null);
  if (!first) return { variations: [], sizes: [], variation_title: 'الألوان', size_title: 'الحجم' };

  const info = first.info || first;
  const allVariations = [...(info.variations || [])];
  const sizeMap = new Map((info.sizes || []).map((s) => [String(s.id), s]));
  let cursor = first.pagination?.cursor || null;
  const cursors = [];

  while (cursor) {
    cursors.push(cursor);
    if (cursors.length >= 11) break;
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, {
      params: { cursor },
    }).catch(() => null);
    if (!chunk) break;
    const ci = chunk.info || chunk;
    for (const v of ci.variations || []) allVariations.push(v);
    for (const s of ci.sizes || []) sizeMap.set(String(s.id), s);
    cursor = chunk.pagination?.cursor || null;
  }

  const out = {
    variation_title: info.variation_title || 'الألوان',
    size_title: info.size_title || 'الحجم',
    variations: allVariations,
    sizes: [...sizeMap.values()],
  };
  cacheSet(cacheKey, out);
  return out;
}

function buildShadesFromVarInfo(varInfo = {}) {
  const optionGroup = String(varInfo.variation_title || 'الألوان').trim();
  const colors = (varInfo.variations || []).map((v) => mapVariation(v, optionGroup));
  const realColors = colors.filter((c) => !isDefaultTitle(c.name));

  if (realColors.length) return realColors;

  if (colors.length === 1 && (varInfo.sizes || []).length > 1) {
    const sizeGroup = String(varInfo.size_title || 'الحجم').trim();
    const base = colors[0];
    return (varInfo.sizes || []).map((s) => ({
      name: String(s.title || s.id || '').trim(),
      nameAr: String(s.title || s.id || '').trim(),
      nameEn: String(s.title || s.id || '').trim(),
      barcode: extractVariationBarcode(s),
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
    const bc = extractVariationBarcode(hit) || shade.barcode;
    const hex = parseColorValue(hit.color || hit.hex) || shade.hex;
    return {
      ...shade,
      barcode: bc,
      ean: bc,
      hex,
      name: shade.name && !/^\d+$/.test(shade.name) ? shade.name : String(hit.title || hit.name || shade.name || '').trim(),
      nameAr: shade.nameAr && !/^\d+$/.test(shade.nameAr) ? shade.nameAr : String(hit.title || hit.name || shade.nameAr || '').trim(),
      nameEn: shade.nameEn && !/^\d+$/.test(shade.nameEn) ? shade.nameEn : String(hit.title || hit.name || shade.nameEn || '').trim(),
      image: shade.image || absImage(hit.image),
    };
  });
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

  const shades = light ? [] : buildShadesFromVarInfo(varInfo);
  const enrichedShades = light ? [] : await enrichShadesFromTypesense(pid, shades);
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
    shades: enrichedShades,
    shadeCount: enrichedShades.length,
    hasOptions: enrichedShades.length > 1 || (varInfo.sizes?.length > 1),
    barcode: extractVariationBarcode(meta) || enrichedShades.find((s) => s.barcode)?.barcode || '',
    productUrl: meta.url || meta.share_link || `https://miswag.com/products/${meta.product_id || pid}`,
    category: String(meta.category || '').trim(),
    inStock: detail.info?.size?.is_available !== false,
  };

  cacheSet(cacheKey, product);
  return product;
}
