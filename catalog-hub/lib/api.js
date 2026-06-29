const API_BASE = 'https://api.niceonesa.com';
const LANG_AR = 'ar';
const LANG_EN = 'en';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  platform: 'web',
  versionnumber: '5.2.0',
  'x-oc-currency': 'SAR',
  'x-oc-merchant-id': '2afc3973-04a5-4913-83f8-d45b0156b5f1',
  'x-oc-restadmin-id': 'c15378d0-04f1-4d36-9af7-ab7e17da918b',
  'x-oc-merchant-language': LANG_AR,
  'web-layout': 'laptop',
};

export async function apiGet(route, params = {}, { lang = LANG_AR } = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set('route', route);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: { ...DEFAULT_HEADERS, 'x-oc-merchant-language': lang },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${route}`);
  }
  const json = await res.json();
  if (json.success !== 1) {
    throw new Error(`API error: ${JSON.stringify(json.error || json)}`);
  }
  return json.data;
}

export async function fetchCategoryProducts(seoSlug, { page = 1, limit = 30, sort = 'most_popular', search = '', manufacturerIds = '', attributeIds = '' } = {}) {
  return apiGet('rest/product_admin/products', {
    seo_url: seoSlug,
    sort,
    manufacturer_ids: manufacturerIds,
    attribute_ids: attributeIds,
    search,
    page,
    limit,
    first: false,
  });
}

export async function fetchProductDetail(productId, optionSelection = null, { lang = LANG_AR } = {}) {
  const params = { id: productId };
  if (optionSelection) {
    if (typeof optionSelection === 'object' && !Array.isArray(optionSelection)) {
      for (const [optionKey, valueId] of Object.entries(optionSelection)) {
        params[`option[${optionKey}]`] = valueId;
      }
    } else {
      params.option_id = optionSelection;
    }
  }
  return apiGet('rest/product_admin/products', params, { lang });
}

/** تحقق GTIN/EAN-8/12/13/14 بخوارزمية checksum */
export function isValidGtin(code) {
  const s = String(code || '').replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(s.length)) return false;
  const digits = s.split('').map(Number);
  const check = digits.pop();
  let sum = 0;
  const len = digits.length;
  for (let i = len - 1; i >= 0; i--) {
    const pos = len - i;
    sum += digits[i] * (pos % 2 === 1 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === check;
}

export function isValidBarcodeValue(value) {
  if (value === undefined || value === null) return false;
  const s = String(value).trim();
  if (!s || s === 'Array') return false;
  if (!/^\d{8,14}$/.test(s)) return false;
  return isValidGtin(s);
}

/** قائمة باركودات من نص مفصول بفواصل */
export function parseBarcodeList(raw) {
  if (!raw || raw === 'Array') return [];
  return String(raw)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => /^\d{8,14}$/.test(s));
}

/** استخراج EAN من رابط صورة Nice One (نمط: timestamp_productId_…_EAN_hex) */
export function extractBarcodeFromImage(url = '', productId = '') {
  if (!url) return '';
  const path = url.split('?')[0];
  const pid = String(productId || '').trim();
  const found = new Set();

  const consider = (digits) => {
    if (!/^\d{8,14}$/.test(digits)) return;
    if (pid && digits === pid) return;
    if (/^\d{10}$/.test(digits) && Number(digits) > 1_000_000_000) return;
    if (isValidGtin(digits)) found.add(digits);
  };

  for (const seg of path.split(/[-_./]/)) {
    consider(seg.replace(/\D/g, ''));
  }
  for (const m of path.matchAll(/(?<!\d)(\d{13})(?!\d)/g)) consider(m[1]);
  for (const m of path.matchAll(/(?<!\d)(\d{12})(?!\d)/g)) consider(m[1]);
  for (const m of path.matchAll(/(?<!\d)(\d{8})(?!\d)/g)) consider(m[1]);

  const list = [...found];
  return list.sort((a, b) => b.length - a.length)[0] || '';
}

/** جلب تفاصيل كل درجة عبر option[…] لاستخراج باركود إضافي من صور الدرجة فقط */
export async function augmentShadesFromOptionFetch(product, shades = [], { delayMs = 80 } = {}) {
  if (!product?.has_option || !product?.options?.length || !shades.length) return shades;
  const opt = product.options.find((o) => o.option_value?.length) || product.options[0];
  const productId = String(product.id);

  for (const shade of shades) {
    if (shade.ean) continue;
    try {
      const sel = await fetchProductDetail(productId, { [opt.product_option_id]: shade.optionId });
      const urls = new Set([shade.image, ...(shade.additionalImages || [])]);
      for (const o of sel.options || []) {
        for (const v of o.option_value || []) {
          if (String(v.product_option_value_id) !== String(shade.optionId)) continue;
          if (v.image) urls.add(v.image);
          for (const u of v.additional_images || []) urls.add(u);
        }
      }
      for (const url of urls) {
        const bc = extractBarcodeFromImage(url, productId);
        if (bc) {
          shade.ean = bc;
          shade.barcode = bc;
          shade.barcodeSource = 'option_fetch';
          break;
        }
      }
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    } catch {
      /* تجاهل فشل درجة واحدة */
    }
  }
  return shades;
}

/** مطابقة قائمة ISBN مفصولة بفواصل مع ترتيب الدرجات النشطة */
export function applyIsbnListToShades(shades = [], isbnList = []) {
  if (!isbnList.length || isbnList.length !== shades.length) return shades;
  shades.forEach((shade, i) => {
    if (shade.ean) return;
    const bc = String(isbnList[i] || '').trim();
    if (isValidBarcodeValue(bc)) {
      shade.ean = bc;
      shade.barcode = bc;
      shade.barcodeSource = 'list';
    }
  });
  return shades;
}

/**
 * حل باركود الدرجة اللونية — مصادر متعددة:
 * 1) حقل مباشر  2) صورة الدرجة  3) قائمة ISBN مفصولة بفواصل  4) SKU
 */
export function resolveShadeBarcode(shade, product, shadeIndex = 0, shadeCount = 1) {
  const direct = shade?.barcode || shade?.isbn || '';
  if (isValidBarcodeValue(direct)) {
    return { barcode: String(direct).trim(), barcodeSource: 'variant' };
  }

  for (const url of [shade?.image, ...(shade?.additionalImages || []), ...(shade?.images || [])]) {
    const fromImg = extractBarcodeFromImage(url, product?.id);
    if (fromImg) return { barcode: fromImg, barcodeSource: 'image' };
  }

  const list = collectBarcodeList(product);
  if (list.length === shadeCount && list[shadeIndex]) {
    return { barcode: list[shadeIndex], barcodeSource: 'list' };
  }

  const productBarcode = extractBarcode(product);
  if (productBarcode && shadeCount === 1) {
    return { barcode: productBarcode, barcodeSource: 'product' };
  }

  if (shade?.sku) return { barcode: shade.sku, barcodeSource: 'sku' };
  return { barcode: '', barcodeSource: 'none' };
}

/** قائمة باركودات المنتج (بدون تكرار من حقول متعددة) */
export function collectBarcodeList(product) {
  const fromIsbn = parseBarcodeList(product?.isbn);
  if (fromIsbn.length > 1) return fromIsbn;
  const attrs = normalizeAttributes(product?.product_attributes);
  const isbnAttr = attrs.find((a) => /^isbn$/i.test(String(a.name || '').trim()));
  const fromAttr = parseBarcodeList(isbnAttr?.value);
  if (fromAttr.length > 1) return fromAttr;
  return fromIsbn.length ? fromIsbn : fromAttr;
}

/** إثراء الدرجات بباركود EAN ومصدره */
export function enrichShades(product) {
  const shades = extractShades(product);
  const count = shades.length;
  const productEan = extractBarcode(product);

  return shades.map((shade, index) => {
    const resolved = resolveShadeBarcode(shade, product, index, count);
    const ean = ['variant', 'image', 'list', 'attributes'].includes(resolved.barcodeSource) &&
      isValidBarcodeValue(resolved.barcode)
      ? resolved.barcode
      : resolved.barcodeSource === 'product' && count === 1
        ? resolved.barcode
        : '';
    const barcode = ean || shade.sku || '';
    const barcodeSource = ean ? resolved.barcodeSource : shade.sku ? 'sku' : 'none';
    return {
      ...shade,
      ean,
      barcode,
      barcodeSource,
      productEan: productEan || '',
    };
  });
}

/** استخراج الباركود (ISBN/EAN) من حقول المنتج أو المواصفات */
export function extractBarcode(product) {
  const raw = product?.isbn;
  const fromField = parseBarcodeList(raw);
  if (fromField.length) return fromField[0];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed && trimmed !== 'Array' && isValidBarcodeValue(trimmed)) return trimmed;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);

  const attrs = normalizeAttributes(product?.product_attributes);
  const isbnAttr = attrs.find((a) => /^isbn$/i.test(String(a.name || '').trim()));
  const fromAttr = parseBarcodeList(isbnAttr?.value);
  if (fromAttr.length) return fromAttr[0];
  if (isbnAttr?.value) {
    const v = String(isbnAttr.value).trim();
    if (v && v !== 'Array' && isValidBarcodeValue(v)) return v;
  }
  return '';
}

export async function searchProducts(query, page = 1, limit = 30) {
  return fetchCategoryProducts('search', { page, limit, search: query });
}

const SORT_MAP = {
  default: 'most_popular',
  name_asc: 'name_asc',
  name_desc: 'name_desc',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
};

export function mapClientSort(sort = 'default') {
  return SORT_MAP[sort] || sort || 'most_popular';
}

function isUsableBrandName(name = '') {
  const n = String(name).trim();
  if (n.length < 2) return false;
  if (/^\d+$/.test(n)) return false;
  return true;
}

export async function fetchManufacturersCatalog({ maxPages = 15, pageSize = 100 } = {}) {
  const brands = [];
  for (let page = 1; page <= maxPages; page++) {
    const items = await apiGet('rest/manufacturer_admin/manufacturer', { page, limit: pageSize });
    if (!items?.length) break;
    for (const m of items) {
      const name = String(m.name || '').trim();
      if (!isUsableBrandName(name)) continue;
      brands.push({
        id: String(m.manufacturer_id),
        slug: String(m.manufacturer_id),
        name,
        nameEn: name,
        image: m.image || m.original_image || '',
        productCount: 0,
      });
    }
    if (items.length < pageSize) break;
  }
  brands.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  return brands;
}

export async function fetchManufacturerProducts(manufacturerId, { page = 1, limit = 30, sort = 'most_popular' } = {}) {
  return apiGet('rest/product_admin/products', {
    manufacturer_ids: String(manufacturerId),
    page,
    limit,
    sort: mapClientSort(sort),
    first: false,
  });
}

export function sortProductsClient(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (p) => (p.priceNumeric ?? Number(String(p.price || '').replace(/[^\d.]/g, ''))) || 0;
  const nameOf = (p) => (p.name || '').trim();
  return [...products].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const diff = priceOf(a) - priceOf(b);
      return sort === 'price_asc' ? diff : -diff;
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      const diff = nameOf(a).localeCompare(nameOf(b), 'en', { sensitivity: 'base' });
      return sort === 'name_asc' ? diff : -diff;
    }
    return 0;
  });
}

export async function fetchHomeCategories(locale = 'en') {
  const res = await fetch(`https://niceonesa.com/${locale}`, {
    headers: { 'User-Agent': 'niceone-catalog/2.0' },
  });
  const html = await res.text();
  const start = html.indexOf('__NUXT_DATA__');
  if (start < 0) throw new Error('Could not find category data on homepage');
  const jsonStart = html.indexOf('>', start) + 1;
  const jsonEnd = html.indexOf('</script>', jsonStart);
  const pool = JSON.parse(html.slice(jsonStart, jsonEnd));

  function revive(val, seen = new Set()) {
    if (typeof val === 'number' && val < pool.length) {
      if (seen.has(val)) return val;
      seen.add(val);
      return revive(pool[val], seen);
    }
    if (Array.isArray(val)) return val.map((x) => revive(x, new Set(seen)));
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) out[k] = revive(v, new Set(seen));
      return out;
    }
    return val;
  }

  const root = revive(pool[1]);

  function findCategories(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj.categories) && obj.categories[0]?.seo_url) {
      return obj.categories;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findCategories(item);
        if (found) return found;
      }
    } else {
      for (const v of Object.values(obj)) {
        const found = findCategories(v);
        if (found) return found;
      }
    }
    return null;
  }

  const tree = findCategories(root);
  if (!tree) throw new Error('Category tree not found');
  return tree;
}

export function slugFromSeoUrl(seoUrl = '') {
  return String(seoUrl).replace(/\/$/, '').split('/').pop() || '';
}

export function mapCategoryNode(cat, parentPath = '') {
  const name = String(cat.name || cat.en_name || '').trim();
  const path = parentPath ? `${parentPath} › ${name}` : name;
  const slug = slugFromSeoUrl(cat.seo_url);
  const children = (cat.categories || []).map((c) => mapCategoryNode(c, path));
  return {
    id: cat.category_id,
    name,
    slug,
    seo_url: cat.seo_url,
    image: cat.image || '',
    path,
    children,
    isLeaf: children.length === 0,
  };
}

function indexCategoriesById(nodes, map = new Map()) {
  for (const node of nodes || []) {
    if (node?.category_id != null) map.set(String(node.category_id), node);
    if (node.categories?.length) indexCategoriesById(node.categories, map);
  }
  return map;
}

export function buildBilingualCategoryTree(rootsAr = [], rootsEn = []) {
  const enMap = indexCategoriesById(rootsEn);
  function walk(catAr, parentPathAr = '', parentPathEn = '') {
    const id = String(catAr.category_id);
    const catEn = enMap.get(id) || {};
    const nameAr = String(catAr.name || catAr.en_name || '').trim();
    const nameEn = String(catEn.name || catEn.en_name || catAr.en_name || nameAr).trim();
    const path = parentPathAr ? `${parentPathAr} › ${nameAr}` : nameAr;
    const pathEn = parentPathEn ? `${parentPathEn} › ${nameEn}` : nameEn;
    const slug = slugFromSeoUrl(catAr.seo_url || catEn.seo_url);
    const childrenAr = catAr.categories || [];
    const children = childrenAr.map((c) => walk(c, path, pathEn));
    return {
      id: catAr.category_id,
      name: nameAr,
      nameEn,
      slug,
      seo_url: catAr.seo_url,
      image: catAr.image || '',
      path,
      pathEn,
      children,
      isLeaf: children.length === 0,
    };
  }
  const tree = rootsAr.map((r) => walk(r));
  const leaves = flattenLeaves(tree);
  return { tree, leaves };
}

export function flattenLeaves(nodes, out = []) {
  for (const n of nodes) {
    if (n.isLeaf && n.slug) out.push(n);
    else if (n.children?.length) flattenLeaves(n.children, out);
  }
  return out;
}

/** استخراج الدرجات / الألوان من تفاصيل المنتج */
export function extractShades(product) {
  if (!product?.options?.length) return [];
  const shades = [];
  for (const opt of product.options) {
    const groupNameAr = String(opt.name || opt.en_name || 'Option').trim();
    const groupNameEn = String(opt.en_name || opt.name || groupNameAr).trim();
    for (const v of opt.option_value || []) {
      if (!v.active && v.active !== 1) continue;
      shades.push({
        optionGroup: groupNameAr,
        optionGroupEn: groupNameEn,
        optionType: opt.type,
        productOptionId: opt.product_option_id != null ? String(opt.product_option_id) : '',
        optionId: String(v.product_option_value_id),
        variantId: v.product_option_variant_id,
        name: String(v.name || v.en_name || '').trim(),
        nameEn: String(v.en_name || v.name || '').trim(),
        sku: v.sku || '',
        barcode: v.isbn || v.barcode || v.ean || '',
        image: v.image || '',
        hex: v.hex_color ? (v.hex_color.startsWith('#') ? v.hex_color : `#${v.hex_color}`) : '',
        price: v.price_formated || (v.event_price ? `SAR ${v.event_price}` : ''),
        rawPrice: v.event_price || v.price,
        quantity: v.quantity,
        inStock: v.quantity === undefined || v.quantity === null || Number(v.quantity) > 0,
        additionalImages: v.additional_images || [],
        specials: v.specials || [],
      });
    }
  }
  return shades;
}

/** تحويل product_attributes من شكل Nice One إلى قائمة {name, value} */
export function normalizeAttributes(raw) {
  const list = [];
  if (!raw) return list;

  const items = Array.isArray(raw) ? raw : raw.attributes || [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    if (item.name || item.attribute_name) {
      list.push({
        name: item.name || item.attribute_name,
        value: item.text || item.attribute_value || '',
      });
      continue;
    }
    for (const [name, value] of Object.entries(item)) {
      list.push({ name, value: String(value ?? '') });
    }
  }
  return list;
}

export function normalizeDescription(p) {
  const { description } = extractDescriptions(p);
  return description;
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isArabicDescriptionHtml(html = '') {
  return /dir=['"]rtl/i.test(html) || /[\u0600-\u06FF]/.test(stripHtml(html));
}

function joinDescriptionBlocks(blocks = [], { arabic = true } = {}) {
  const parts = [];
  for (const block of blocks) {
    const html = block.description || block.text || '';
    if (!html) continue;
    const isAr = isArabicDescriptionHtml(html);
    if (arabic ? isAr : !isAr) parts.push(html);
  }
  return parts.join('');
}

export function extractDescriptions(p = {}, pEn = null) {
  let description = joinDescriptionBlocks(p.descriptions || [], { arabic: true });
  let descriptionEn = joinDescriptionBlocks(p.descriptions || [], { arabic: false });

  if (!description && p.description && p.description !== '-') description = p.description;
  if (!descriptionEn && p.en_description) descriptionEn = p.en_description;

  if (pEn) {
    const fromEn = joinDescriptionBlocks(pEn.descriptions || [], { arabic: false })
      || (pEn.description && pEn.description !== '-' ? pEn.description : '');
    if (fromEn) descriptionEn = fromEn;
  }

  if (descriptionEn && stripHtml(descriptionEn) === stripHtml(description)) {
    descriptionEn = '';
  }

  return { description, descriptionEn };
}

function productUrls(p = {}) {
  const share = String(p.share_url || '').trim();
  const ar = share || (p.seo_url_ar ? `https://niceonesa.com/ar/${String(p.seo_url_ar).replace(/^\//, '')}` : '');
  const en = share
    ? share.replace('/ar/', '/en/')
    : (p.seo_url_en ? `https://niceonesa.com/en/${String(p.seo_url_en).replace(/^\//, '')}` : ar);
  return { productUrl: ar, productUrlEn: en };
}

export function categoryLabel(category) {
  if (!category) return '';
  if (typeof category === 'string') return category;
  if (Array.isArray(category)) {
    const leaf = category[category.length - 1];
    if (leaf?.categories?.length) {
      const deep = leaf.categories[leaf.categories.length - 1];
      return deep?.name || leaf.name || '';
    }
    return leaf?.name || category[0]?.name || '';
  }
  return category.name || category.en_name || '';
}

export function normalizeProductSummary(p, categoryMeta = {}) {
  const nameAr = String(p.name || '').trim();
  const nameEn = String(p.en_name || p.name || '').trim();
  return {
    id: String(p.id),
    name: nameAr,
    nameEn,
    thumb: p.thumb || '',
    price: p.price_formated || (p.price ? `SAR ${p.price}` : ''),
    priceNumeric: Number(p.price) || 0,
    rawPrice: p.price,
    manufacturer: p.manufacturer || '',
    manufacturerEn: p.en_manufacturer || p.manufacturer || '',
    manufacturerId: p.manufacturer_id,
    sku: p.sku || '',
    barcode: extractBarcode(p),
    hasOptions: !!p.has_option,
    rating: p.rating,
    reviews: p.total_reviews || p.reviews,
    tag: p.tag,
    seoSlug: p.seo_url_en || p.seo_url_ar || '',
    categorySlug: categoryMeta.slug || '',
    categoryPath: categoryMeta.path || '',
    categoryPathEn: categoryMeta.pathEn || '',
  };
}

export function normalizeProductDetail(p, pEn = null) {
  const shades = enrichShades(p);
  const { description, descriptionEn } = extractDescriptions(p, pEn);
  const urls = productUrls(p);
  const nameAr = String(p.name || '').trim();
  const nameEn = String(p.en_name || p.name || '').trim();
  return {
    id: String(p.id),
    name: nameAr,
    nameEn,
    manufacturer: p.manufacturer || '',
    manufacturerEn: p.en_manufacturer || p.manufacturer || '',
    manufacturerId: p.manufacturer_id,
    manufacturerImage: p.manufacturer_image,
    description,
    descriptionEn,
    descriptions: p.descriptions || [],
    attributes: normalizeAttributes(p.product_attributes),
    images: p.images || [],
    thumb: p.thumb || '',
    catalogImages: p.catalog_images || [],
    images360: p.images360 || [],
    videoUrl: p.video_url || '',
    price: p.price_formated || '',
    rawPrice: p.price,
    sku: p.sku || '',
    barcode: extractBarcode(p),
    quantity: p.quantity,
    rating: p.rating,
    reviews: p.reviews,
    hasOptions: !!p.has_option,
    shades,
    shadeCount: shades.length,
    category: categoryLabel(p.category),
    categoryEn: categoryLabel(p.category),
    categoryId: p.category_id,
    seoSlug: p.seo_url_en || p.seo_url_ar || '',
    shareUrl: p.share_url || '',
    productUrl: urls.productUrl,
    productUrlEn: urls.productUrlEn,
    tag: p.tag,
    special: p.special,
    loyalty: p.loyalty_details,
    selectedOptionId: p.selected_option_id || null,
  };
}
