const SITE = 'https://www.faces.ae';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapPool } from './category-scope.js';
import { lookupUpcByBarcode } from './barcodes.js';
import { publicPath } from './public-prefix.js';
import { averageColorFromImageUrl } from './swatch-color.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACES_BARCODE_FILE = path.join(__dirname, '..', 'data', 'faces-barcode-index.json');
const STORE = 'Sites-Faces_AE-Site';
const LOCALE_AR = 'ar_AE';
const LOCALE_EN = 'en_AE';
const CNSTRC_API = 'https://ac.cnstrc.com';
const STAGING_HOST = 'sfcc-faces-stg.tech-chalhoub.com';

let cnstrcKeyCache = null;

const TOP_LEVEL_IDS = new Set([
  'perfume', 'k-beauty', 'all_brands', 'bestsellers', 'new-beauty-products',
  'skincare', 'makeup', 'haircare', 'bath-and-body', 'gifts', 'gift-sets',
  'tools-and-accessories', 'men', 'niche', 'services',
]);

function decodeHtml(s = '') {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2066;/g, '')
    .replace(/&#x2069;/g, '')
    .replace(/&nbsp;/g, ' ');
}

function absUrl(url = '') {
  if (!url) return '';
  let u = url;
  if (u.includes(STAGING_HOST)) {
    u = u.replace(`https://${STAGING_HOST}`, SITE);
  }
  if (u.startsWith('http')) return u;
  return `${SITE}${u.startsWith('/') ? '' : '/'}${u}`;
}

function fixImageUrl(url = '') {
  let u = absUrl(url);
  if (!u) return '';
  u = u.replace(/&amp;/g, '&');
  u = u.replace(/\/BJSM_STG\//g, '/BJSM_PRD/');
  return u.replace(/\?sw=\d+&sh=\d+/, '?sw=800&sh=800');
}

/** عرض الصور عبر السيرفر المحلي — faces.ae يحجب التحميل المباشر من localhost */
export function proxyFacesImage(url = '') {
  const u = fixImageUrl(url);
  if (!u) return '';
  if (u.startsWith('/api/faces/img')) return u;
  if (!u.includes('faces.ae')) return u;
  return publicPath(`/api/faces/img?u=${encodeURIComponent(u)}`);
}

async function getCnstrcKey() {
  if (cnstrcKeyCache) return cnstrcKeyCache;
  const { html } = await fetchText(`${SITE}/ar`);
  const match = html.match(/cnstrc\.indexKey\s*=\s*['"]([^'"]+)['"]/);
  if (!match?.[1]) throw new Error('Faces: Constructor.io key not found');
  cnstrcKeyCache = match[1];
  return cnstrcKeyCache;
}

async function fetchCnstrc(path, params = {}) {
  const key = await getCnstrcKey();
  const qs = new URLSearchParams({ key, ...params });
  const res = await fetch(`${CNSTRC_API}${path}?${qs}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/1.0)' },
  });
  if (!res.ok) throw new Error(`Faces Constructor ${res.status}`);
  const json = await res.json();
  return json.response || {};
}

function storePath(locale, controller, params = {}) {
  const qs = new URLSearchParams(params);
  return `${SITE}/on/demandware.store/${STORE}/${locale}/${controller}?${qs}`;
}

async function fetchText(url, { timeoutMs = 28000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/json,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/1.0)',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`Faces ${res.status}: ${url}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) {
      return { json: await res.json(), html: '' };
    }
    return { html: await res.text(), json: null };
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`انتهت مهلة الاتصال بـ faces.ae (${Math.round(timeoutMs / 1000)}ث)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const { json, html } = await fetchText(url);
  if (json) return json;
  throw new Error('Faces: expected JSON response');
}

function parseCategoryLinks(html, lang) {
  const map = new Map();
  const anchorRe = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(html))) {
    const attrs = match[1];
    const hrefMatch = attrs.match(new RegExp(`href="/${lang}/([^"#?]+)"`));
    const dataId = attrs.match(/data-id="([^"]+)"/)?.[1];
    if (!hrefMatch || !dataId) continue;
    const slug = hrefMatch[1];
    if (slug.startsWith('brands/') || slug.includes('.html')) continue;
    const inner = match[2];
    const name = inner.match(/nav-link-text[^>]*>\s*([^<]+)/)?.[1]?.trim()
      || inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!name || name.length > 120 || name === 'عرض الكل' || name === 'View All') continue;
    if (!map.has(dataId)) {
      map.set(dataId, { id: dataId, slug, name });
    }
  }
  return map;
}

function inferParentId(id, allIds) {
  if (TOP_LEVEL_IDS.has(id)) return null;
  const parts = id.split('-');
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = parts.slice(0, i).join('-');
    if (allIds.has(candidate)) return candidate;
  }
  for (const top of TOP_LEVEL_IDS) {
    if (id.startsWith(`${top}-`) || id.startsWith(`${top}_`)) return top;
  }
  return null;
}

export function buildCategoryTree(arMap, enMap) {
  const allIds = new Set([...arMap.keys(), ...enMap.keys()]);
  const nodes = new Map();

  for (const id of allIds) {
    const ar = arMap.get(id);
    const en = enMap.get(id);
    nodes.set(id, {
      id,
      slug: ar?.slug || en?.slug || id,
      name: ar?.name || en?.name || id,
      nameEn: en?.name || ar?.name || id,
      parentId: inferParentId(id, allIds),
      children: [],
    });
  }

  const roots = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list) => {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    for (const n of list) sortNodes(n.children);
  };
  sortNodes(roots);

  const leaves = [];
  const all = [];

  function walk(node, pathAr = '', pathEn = '') {
    const fullPathAr = pathAr ? `${pathAr} › ${node.name}` : node.name;
    const fullPathEn = pathEn ? `${pathEn} › ${node.nameEn}` : node.nameEn;
    const children = (node.children || []).map((c) => walk(c, fullPathAr, fullPathEn));
    const mapped = {
      id: node.id,
      slug: node.slug,
      name: node.name,
      nameEn: node.nameEn,
      path: fullPathAr,
      pathEn: fullPathEn,
      productCount: 0,
      level: fullPathAr.split('›').length,
      isLeaf: !children.length,
      children,
    };
    all.push(mapped);
    if (mapped.isLeaf) leaves.push(mapped);
    return mapped;
  }

  const tree = roots.map((r) => walk(r));
  return { tree, leaves, all, ids: all.map((c) => c.id) };
}

export async function fetchCategoryTreeRaw() {
  const [arPage, enPage] = await Promise.all([
    fetchText(`${SITE}/ar`),
    fetchText(`${SITE}/en`),
  ]);
  const arMap = parseCategoryLinks(arPage.html, 'ar');
  const enMap = parseCategoryLinks(enPage.html, 'en');
  return buildCategoryTree(arMap, enMap);
}

function parseGtmImpression(raw) {
  if (!raw) return {};
  try {
    const items = JSON.parse(decodeHtml(raw));
    return items?.[0] || {};
  } catch {
    return {};
  }
}

function plpHtmlOnly(html) {
  const gridStart = html.indexOf('product-grid product-grid');
  if (gridStart < 0) return '';
  const pagStart = html.indexOf('search-results-pagination', gridStart);
  return pagStart > gridStart ? html.slice(gridStart, pagStart) : html.slice(gridStart, gridStart + 500000);
}

function productPidFromCnstrc(item = {}) {
  const d = item.data || {};
  if (d.nativeProductType === 'variant' && /^PM_/i.test(d.id)) return d.id;
  return d.variation_id || d.id || '';
}

function mapCnstrcItem(item = {}) {
  const d = item.data || {};
  const pid = productPidFromCnstrc(item);
  const isMaster = /^PM_/i.test(d.id) && d.nativeProductType === 'variant';
  return {
    pid,
    masterId: d.id,
    ean: '',
    nameAr: (item.value || '').trim(),
    nameEn: '',
    brandAr: '',
    brandEn: '',
    price: d.price,
    inStock: true,
    thumb: fixImageUrl(d.image_url),
    productUrl: absUrl(d.url),
    hasOptions: isMaster,
  };
}

async function enrichTilesFromQuickView(tiles = [], concurrency = 8) {
  const queue = [...tiles];
  const workers = Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
    while (queue.length) {
      const tile = queue.shift();
      if (!tile?.pid) continue;
      try {
        const [ar, en] = await Promise.all([
          fetchQuickView(tile.pid, LOCALE_AR),
          fetchQuickView(tile.pid, LOCALE_EN),
        ]);
        if (ar?.EAN) tile.ean = ar.EAN;
        if (ar?.brand) tile.brandAr = ar.brand;
        if (en?.brand) tile.brandEn = en.brand;
        if (en?.productName) tile.nameEn = en.productName.trim();
        if (ar?.productName && !tile.nameAr) tile.nameAr = ar.productName.trim();
        if (ar?.selectedProductUrl) tile.productUrl = absUrl(ar.selectedProductUrl);
        const img = productImage(ar);
        if (img) tile.thumb = img;
        if (ar?.productType === 'master' || ar?.variationAttributes?.length) {
          tile.hasOptions = true;
        }
        if (ar?.available === false || ar?.sellable === false) tile.inStock = false;
      } catch {
        /* keep constructor data */
      }
    }
  });
  await Promise.all(workers);
  return tiles;
}

export function parseProductTiles(html, limit = 0) {
  const seen = new Set();
  const items = [];
  const chunks = plpHtmlOnly(html).split(/class="js-product-tile-container\b/);

  for (const chunk of chunks.slice(1)) {
    const pid = chunk.match(/data-pid="([^"]+)"/)?.[1];
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);

    const ean = chunk.match(/data-ean="([^"]*)"/)?.[1]?.trim() || '';
    const nameAr = chunk.match(/data-cnstrc-item-name="([^"]*)"/)?.[1]?.trim() || '';
    const gtm = parseGtmImpression(chunk.match(/data-gtm-enhancedecommerce-impression="([^"]+)"/)?.[1]);
    const brandAr = chunk.match(/product-tile-brand[^>]*>\s*([^<]+)/)?.[1]?.trim() || '';
    const priceVal = gtm.price ?? chunk.match(/data-cnstrc-item-price="([^"]*)"/)?.[1];
    const img = chunk.match(/src="(https:\/\/www\.faces\.ae\/dw\/image[^"]+)"/)?.[1]
      || chunk.match(/srcset="(https:\/\/www\.faces\.ae\/dw\/image[^"]+)"/)?.[1];
    const productUrl = chunk.match(/href="(\/ar\/p\/[^"]+\.html)"/)?.[1]
      || chunk.match(/href="(\/en\/p\/[^"]+\.html)"/)?.[1];

    items.push({
      pid,
      ean: ean || gtm.item_variant || '',
      nameAr: nameAr || gtm.item_name || '',
      nameEn: gtm.item_name || '',
      brandAr,
      brandEn: gtm.item_brand || '',
      price: priceVal,
      inStock: gtm.item_in_stock !== false,
      thumb: fixImageUrl(img),
      productUrl: absUrl(productUrl),
      hasOptions: /^pm/i.test(pid) || pid.startsWith('PM_'),
    });
    if (limit && items.length >= limit) break;
  }
  return items;
}

/** منتجات يظهر باركودها في صورة الدرجة داخل HTML القائمة (حتى لو data-ean فارغ) */
export function parseProductTilesContainingBarcode(html, barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return [];
  const variants = new Set([digits]);
  if (digits.length === 13 && digits.startsWith('0')) variants.add(digits.slice(1));
  if (digits.length <= 13) variants.add(digits.padStart(13, '0'));

  const seen = new Set();
  const items = [];
  const chunks = plpHtmlOnly(html).split(/class="js-product-tile-container\b/);

  for (const chunk of chunks.slice(1)) {
    const hasBarcode = [...variants].some((v) => chunk.includes(v));
    if (!hasBarcode) continue;
    const pid = chunk.match(/data-pid="([^"]+)"/)?.[1];
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);

    const ean = chunk.match(/data-ean="([^"]*)"/)?.[1]?.trim() || '';
    const nameAr = chunk.match(/data-cnstrc-item-name="([^"]*)"/)?.[1]?.trim() || '';
    const gtm = parseGtmImpression(chunk.match(/data-gtm-enhancedecommerce-impression="([^"]+)"/)?.[1]);
    const brandAr = chunk.match(/product-tile-brand[^>]*>\s*([^<]+)/)?.[1]?.trim() || '';
    const priceVal = gtm.price ?? chunk.match(/data-cnstrc-item-price="([^"]*)"/)?.[1];
    const img = chunk.match(/src="(https:\/\/www\.faces\.ae\/dw\/image[^"]+)"/)?.[1]
      || chunk.match(/srcset="(https:\/\/www\.faces\.ae\/dw\/image[^"]+)"/)?.[1];
    const productUrl = chunk.match(/href="(\/ar\/p\/[^"]+\.html)"/)?.[1]
      || chunk.match(/href="(\/en\/p\/[^"]+\.html)"/)?.[1];

    items.push({
      pid,
      ean: ean || '',
      nameAr: nameAr || gtm.item_name || '',
      nameEn: gtm.item_name || '',
      brandAr,
      brandEn: gtm.item_brand || '',
      price: priceVal,
      inStock: gtm.item_in_stock !== false,
      thumb: fixImageUrl(img),
      productUrl: absUrl(productUrl),
      hasOptions: true,
    });
  }
  return items;
}

const FACES_BARCODE_CATALOG_CATEGORIES = [
  'makeup', 'lipstick', 'foundation', 'skincare', 'perfume', 'bestsellers', 'haircare',
];

async function fetchCategoryHtml(categoryId, { page = 1, pageSize = 48 } = {}) {
  const start = (page - 1) * pageSize;
  const url = page <= 1
    ? `${SITE}/ar/search?cgid=${encodeURIComponent(categoryId)}&sz=${pageSize}`
    : `${SITE}/ar/search?cgid=${encodeURIComponent(categoryId)}&start=${start}&sz=${pageSize}`;
  const { html } = await fetchText(url, { timeoutMs: 12000 });
  return html;
}

/** مسح سريع لأقسام وجوه — يجد باركودات الدرجات المخفية في روابط الصور */
async function findFacesTilesByCatalogScan(barcode, { maxPages = 1 } = {}) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return [];

  const settled = await Promise.allSettled(
    FACES_BARCODE_CATALOG_CATEGORIES.map(async (categoryId) => {
      const tiles = [];
      for (let page = 1; page <= maxPages; page++) {
        const html = await fetchCategoryHtml(categoryId, { page });
        tiles.push(...parseProductTilesContainingBarcode(html, digits));
        if (tiles.length) break;
      }
      return tiles;
    }),
  );

  return mergeTilesByPid(
    settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])),
  );
}

function parseTotalCount(html) {
  const ar = html.match(/products-count[^>]*>\s*([0-9,]+)/);
  if (ar) return Number(ar[1].replace(/,/g, ''));
  const en = html.match(/of\s+([0-9,]+)/i);
  if (en) return Number(en[1].replace(/,/g, ''));
  return null;
}

function formatAed(value, formatted = '') {
  if (formatted) {
    const plain = decodeHtml(formatted).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (plain) return plain;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `${n.toLocaleString('en-AE')} درهم`;
}

function priceNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeProductSummary(tile, meta = {}) {
  const numeric = priceNumeric(tile.price);
  return {
    id: tile.pid,
    sku: tile.pid,
    name: tile.nameAr,
    nameEn: tile.nameEn,
    manufacturer: tile.brandAr,
    manufacturerEn: tile.brandEn,
    barcode: tile.ean,
    slug: tile.productUrl,
    price: formatAed(tile.price),
    priceNumeric: numeric,
    thumb: proxyFacesImage(tile.thumb),
    hasOptions: tile.hasOptions,
    inStock: tile.inStock,
    category: meta.path || meta.name || '',
    categoryEn: meta.pathEn || meta.nameEn || '',
    productUrl: tile.productUrl,
  };
}

function productImage(p = {}) {
  return p.images?.large?.[0]?.url
    || p.images?.medium?.[0]?.url
    || p.mediaGallery?.[0]?.url
    || '';
}

function normalizeHexColor(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s.toLowerCase()}`;
  const match = s.match(/#[0-9a-fA-F]{6}\b/);
  return match ? match[0].toLowerCase() : '';
}

function extractHexFromVariationValue(val = {}) {
  for (const field of [val.hex, val.hexColor, val.colorHex, val.swatchColor, val.description]) {
    const hex = normalizeHexColor(field);
    if (hex) return hex;
    const match = String(field || '').match(/#[0-9a-fA-F]{6}\b/);
    if (match) return match[0].toLowerCase();
  }
  for (const field of [val.displayValue, val.value, val.id]) {
    if (field && /^[0-9a-fA-F]{6}$/i.test(String(field).trim())) {
      return normalizeHexColor(field);
    }
  }
  return '';
}

function extractShades(p = {}, pEn = null) {
  const attrs = p.variationAttributes || [];
  if (!attrs.length) return [];

  const enAttrs = pEn?.variationAttributes || [];
  const enValues = new Map();
  for (const attr of enAttrs) {
    for (const val of attr.values || []) {
      enValues.set(`${attr.id}:${val.id}`, val.displayValue || val.value);
    }
  }

  const shades = [];
  for (const attr of attrs) {
    for (const val of attr.values || []) {
      const swatch = val.images?.swatch?.[0]?.absUrl || val.images?.swatch?.[0]?.url || '';
      const swatchRaw = absUrl(swatch);
      shades.push({
        optionId: `${attr.id}:${val.id}`,
        name: val.displayValue || val.value,
        nameEn: enValues.get(`${attr.id}:${val.id}`) || val.displayValue || val.value,
        hex: extractHexFromVariationValue(val),
        colorCode: val.value || val.id || '',
        sku: val.id,
        barcode: '',
        rawImage: swatchRaw,
        image: proxyFacesImage(swatchRaw),
        price: formatAed(val.price?.sales?.value, val.price?.sales?.formatted),
        inStock: val.isAvailable !== false && val.selectable !== false,
        variationUrl: val.url || '',
      });
    }
  }
  return shades;
}

export function normalizeProductDetail(p, pEn = null) {
  const images = [];
  for (const size of ['large', 'medium', 'small']) {
    for (const img of p.images?.[size] || []) {
      const url = absUrl(img.url || img.absUrl);
      if (url && !images.includes(url)) images.push(url);
    }
  }
  const rawThumb = productImage(p);
  if (rawThumb && !images.includes(rawThumb)) images.unshift(rawThumb);
  const thumb = proxyFacesImage(rawThumb);
  const proxiedImages = images.map((u) => proxyFacesImage(u)).filter(Boolean);

  const shades = extractShades(p, pEn);
  const descAr = p.longDescription || p.shortDescription || '';
  const descEn = pEn?.longDescription || pEn?.shortDescription || '';

  return {
    id: String(p.id),
    sku: p.id || '',
    name: (p.productName || '').trim(),
    nameEn: (pEn?.productName || '').trim(),
    manufacturer: p.brand || p.manufacturerName || '',
    manufacturerEn: pEn?.brand || pEn?.manufacturerName || '',
    barcode: p.EAN || p.VPN || '',
    slug: p.selectedProductUrl || '',
    price: formatAed(p.price?.sales?.value, p.price?.sales?.formatted) || shades[0]?.price || '',
    thumb,
    images: proxiedImages.length ? proxiedImages : (thumb ? [thumb] : []),
    description: descAr,
    descriptionEn: descEn,
    inStock: p.available !== false && p.sellable !== false,
    hasOptions: shades.length > 0 || p.productType === 'variant' || p.productType === 'master',
    shades,
    category: p.primaryCategoryNamePath || '',
    categoryEn: pEn?.primaryCategoryNamePath || '',
    productUrl: absUrl(p.selectedProductUrl),
    productUrlEn: absUrl(pEn?.selectedProductUrl),
    vpn: p.VPN || '',
    size: p.size || '',
  };
}

export async function fetchCategoryProductCounts(all = []) {
  return mapPool(all, async (node) => {
    try {
      const response = await fetchCnstrc(`/browse/group_id/${encodeURIComponent(node.id)}`, {
        page: '1',
        num_results_per_page: '1',
      });
      return response.total_num_results ?? 0;
    } catch {
      return 0;
    }
  }, 8);
}

export async function fetchCategoryProducts(categoryId, { page = 1, limit = 30, enrich = false } = {}) {
  try {
    const response = await fetchCnstrc(`/browse/group_id/${encodeURIComponent(categoryId)}`, {
      page: String(page),
      num_results_per_page: String(limit),
    });
    let tiles = (response.results || []).map(mapCnstrcItem).filter((t) => t.pid);
    if (enrich) tiles = await enrichTilesFromQuickView(tiles);
    return {
      items: tiles,
      total: response.total_num_results ?? null,
      page,
      pageSize: limit,
    };
  } catch (err) {
    console.error('Faces browse fallback:', err.message);
    const start = (page - 1) * limit;
    const url = `${SITE}/ar/search?cgid=${encodeURIComponent(categoryId)}&start=${start}&sz=${limit}`;
    const { html } = await fetchText(url);
    const tiles = parseProductTiles(html, limit);
    return {
      items: tiles,
      total: parseTotalCount(html),
      page,
      pageSize: limit,
    };
  }
}

export async function searchProducts(query, page = 1, limit = 30, { enrich = false } = {}) {
  try {
    const response = await fetchCnstrc(`/search/${encodeURIComponent(query)}`, {
      page: String(page),
      num_results_per_page: String(limit),
    });
    let tiles = (response.results || []).map(mapCnstrcItem).filter((t) => t.pid);
    if (enrich) tiles = await enrichTilesFromQuickView(tiles);
    return {
      items: tiles,
      total: response.total_num_results ?? null,
      page,
      pageSize: limit,
    };
  } catch (err) {
    console.error('Faces search fallback:', err.message);
    const start = (page - 1) * limit;
    const url = `${SITE}/ar/search?q=${encodeURIComponent(query)}&start=${start}&sz=${limit}`;
    const { html } = await fetchText(url);
    const tiles = parseProductTiles(html, limit);
    return {
      items: tiles,
      total: parseTotalCount(html),
      page,
      pageSize: limit,
    };
  }
}

async function fetchQuickView(pid, locale = LOCALE_AR) {
  const data = await fetchJson(storePath(locale, 'Product-ShowQuickView', { pid, format: 'ajax' }));
  return data?.product || null;
}

/** جلب باركود درجة واحدة فقط — للبحث السريع بدون enrich كامل */
async function findShadeByBarcodeLight(shades = [], barcode) {
  for (const shade of shades.slice(0, 40)) {
    if (!shade.variationUrl) continue;
    try {
      const url = shade.variationUrl.includes('format=')
        ? shade.variationUrl
        : `${shade.variationUrl}&format=ajax`;
      const data = await fetchJson(absUrl(url));
      const vp = data?.product;
      const bc = vp?.EAN;
      if (!bc || !gtinEqual(bc, barcode)) continue;
      shade.barcode = bc;
      if (vp?.id) shade.optionId = vp.id;
      if (vp?.price?.sales) shade.price = formatAed(vp.price.sales.value, vp.price.sales.formatted);
      return shade;
    } catch {
      /* next shade */
    }
  }
  return null;
}

function looksLikeGtinBarcode(barcode = '') {
  const digits = String(barcode).replace(/\D/g, '');
  return /^\d{12,14}$/.test(digits);
}

/** بحث سريع: جرّب الباركود كمعرّف منتج مباشرة في QuickView */
async function tryDirectBarcodeQuickView(barcode, { light = false } = {}) {
  if (looksLikeGtinBarcode(barcode)) return null;
  const variants = barcodeQueryVariants(barcode);
  for (const pid of variants) {
    try {
      const [ar, en] = await Promise.all([
        fetchQuickView(pid, LOCALE_AR),
        fetchQuickView(pid, LOCALE_EN),
      ]);
      if (!ar?.id) continue;

      const tile = {
        pid: ar.id,
        ean: ar.EAN || '',
        nameAr: (ar.productName || '').trim(),
        nameEn: (en?.productName || '').trim(),
        brandAr: ar.brand || '',
        brandEn: en?.brand || '',
        thumb: productImage(ar) || '',
        price: ar.price?.sales?.value,
        productUrl: absUrl(ar.selectedProductUrl),
        hasOptions: (ar.variationAttributes || []).length > 0,
        inStock: ar.available !== false,
      };

      if (gtinEqual(ar.EAN, barcode)) {
        return { tile, matchType: 'product', barcode: ar.EAN };
      }

      const shades = extractShades(ar, en);
      if (shades.length) {
        if (light) {
          const shade = await findShadeByBarcodeLight(shades, barcode);
          if (shade) return { tile, shade, matchType: 'shade', barcode: shade.barcode };
        } else {
          const enriched = await enrichShadeBarcodes(ar.id, shades, LOCALE_AR);
          for (const shade of enriched) {
            if (!gtinEqual(shade.barcode, barcode)) continue;
            return { tile, shade, matchType: 'shade', barcode: shade.barcode };
          }
        }
      }

      if (gtinEqual(ar.id, barcode) || gtinEqual(pid, barcode)) {
        return { tile, matchType: 'product', barcode: ar.EAN || barcode };
      }
    } catch {
      /* next variant */
    }
  }
  return null;
}

/** استخراج روابط منتجات من HTML البحث عندما يظهر الباركود في الرابط */
async function findTilesFromSearchSlug(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  if (!digits) return [];
  const url = `${SITE}/ar/search?q=${encodeURIComponent(digits)}&sz=48`;
  const { html } = await fetchText(url, { timeoutMs: 12000 });
  const links = [...html.matchAll(/href="(\/ar\/p\/[^"]+\.html)"/g)]
    .map((m) => m[1])
    .filter((href) => href.includes(digits));
  const tiles = [];
  const seen = new Set();
  for (const href of links) {
    const pidMatch = href.match(/-([A-Za-z0-9_]+)\.html$/) || href.match(/\/([A-Za-z0-9_]+)\.html$/);
    const pid = pidMatch?.[1];
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    try {
      const ar = await fetchQuickView(pid, LOCALE_AR);
      if (!ar?.id) continue;
      tiles.push({
        pid: ar.id,
        ean: ar.EAN || '',
        nameAr: (ar.productName || '').trim(),
        nameEn: '',
        brandAr: ar.brand || '',
        thumb: productImage(ar) || '',
        price: ar.price?.sales?.value,
        productUrl: absUrl(ar.selectedProductUrl || href),
        hasOptions: (ar.variationAttributes || []).length > 0,
      });
    } catch {
      /* skip */
    }
  }
  return tiles;
}

async function enrichShadeBarcodes(masterPid, shades = [], locale = LOCALE_AR, { light = false } = {}) {
  const limited = shades.slice(0, 40);
  if (light) return limited;
  await mapPool(limited, async (shade) => {
    if (!shade.hex && shade.rawImage) {
      const hex = await averageColorFromImageUrl(shade.rawImage);
      if (hex) shade.hex = hex;
    }
    if (!shade.variationUrl) return;
    try {
      const url = shade.variationUrl.includes('format=')
        ? shade.variationUrl
        : `${shade.variationUrl}&format=ajax`;
      const data = await fetchJson(absUrl(url));
      const vp = data?.product;
      if (vp?.EAN) shade.barcode = vp.EAN;
      if (vp?.id) shade.optionId = vp.id;
      if (vp?.price?.sales) shade.price = formatAed(vp.price.sales.value, vp.price.sales.formatted);
      const selectedVal = (vp?.variationAttributes || [])
        .flatMap((a) => a.values || [])
        .find((v) => v.id === shade.sku || v.value === shade.colorCode);
      const hex = extractHexFromVariationValue(selectedVal || vp?.variationAttributes?.[0]?.selectedValue || {});
      if (hex) shade.hex = hex;
      if (!shade.hex && shade.rawImage) {
        const sampled = await averageColorFromImageUrl(shade.rawImage);
        if (sampled) shade.hex = sampled;
      }
    } catch {
      /* skip */
    }
  }, 4);
  return shades;
}

export async function fetchProductById(pid, { enrichShades = true } = {}) {
  if (!pid) return null;
  const [pAr, pEn] = await Promise.all([
    fetchQuickView(pid, LOCALE_AR),
    fetchQuickView(pid, LOCALE_EN),
  ]);
  if (!pAr?.id) return null;

  let shades = extractShades(pAr, pEn);
  if (shades.length && enrichShades) {
    shades = await enrichShadeBarcodes(pid, shades, LOCALE_AR);
  }

  pAr._shades = shades;
  pAr._enProduct = pEn;
  return pAr;
}

export function normalizeProductDetailFromRaw(p) {
  const normalized = normalizeProductDetail(p, p._enProduct || null);
  if (p._shades?.length) normalized.shades = p._shades;
  return normalized;
}

function gtinKey(digits = '') {
  let d = String(digits).replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 12) d = `0${d}`;
  if (d.length <= 14) return d.padStart(14, '0');
  return d;
}

function gtinEqual(a, b) {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  return gtinKey(sa) === gtinKey(sb);
}

export function barcodeQueryVariants(barcode) {
  const digits = String(barcode).replace(/\D/g, '');
  const out = new Set([digits]);
  const stripped = digits.replace(/^0+/, '') || digits;
  out.add(stripped);
  if (digits.length === 13 && digits.startsWith('0')) out.add(digits.slice(1));
  if (stripped.length <= 12) out.add(stripped.padStart(12, '0'));
  if (stripped.length <= 13) out.add(stripped.padStart(13, '0'));
  return [...out].filter((v) => v.length >= 8 && v.length <= 14);
}

function mergeTilesByPid(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const t of list || []) {
      if (!t?.pid) continue;
      const prev = map.get(t.pid);
      map.set(t.pid, prev ? { ...prev, ...t, ean: t.ean || prev.ean } : { ...t });
    }
  }
  return [...map.values()];
}

async function fetchSearchHtmlTiles(query, limit = 20) {
  const url = `${SITE}/ar/search?q=${encodeURIComponent(query)}&sz=${limit}`;
  const { html } = await fetchText(url, { timeoutMs: 10000 });
  return parseProductTiles(html, limit);
}

/** يتحقق إن كان الباركود موجوداً في كتالوج صور وجوه (صور الدرجات) */
export async function probeFacesBarcodeInCatalog(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return false;
  const suffix = `${digits}_/${digits}_.jpg`;
  const prefixes = [
    'default/dw818e2fc9/product',
    'default/dwb7448fea/product',
    'default/dw545057dd/product',
    'default/dwf3958168/product',
    'default/product',
  ];
  const base = `${SITE}/dw/image/v2/BJSM_PRD/on/demandware.static/-/Sites-faces-master-catalog`;
  const checks = prefixes.map((p) => `${base}/${p}/${suffix}?sw=50&sh=50`);
  const results = await Promise.allSettled(
    checks.map((url) => fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) })),
  );
  return results.some((r) => r.status === 'fulfilled' && r.value.ok);
}

export function buildFacesHintQueries(hintHits = []) {
  const queries = new Set();
  for (const h of hintHits) {
    const brands = [h.manufacturer, h.manufacturerEn, h.brand, h.nameEn?.split(/\s+/)[0]]
      .map((s) => String(s || '').trim())
      .filter((s) => s.length >= 3);
    const names = [h.name, h.nameEn, h.title]
      .map((s) => String(s || '').replace(/\s*[-–].*$/, '').trim())
      .filter(Boolean);

    for (const b of brands) queries.add(b);
    for (const n of names) {
      const words = n.split(/\s+/).filter((w) => w.length > 2);
      if (words.length >= 2) queries.add(words.slice(0, 4).join(' '));
      if (words.length >= 2) queries.add(words.slice(0, 2).join(' '));
      for (const b of brands) {
        if (words.length) queries.add(`${b} ${words.slice(0, 3).join(' ')}`);
      }
    }
  }
  return [...queries].slice(0, 12);
}

export function buildFacesHintQueriesFromUpc(upc) {
  if (!upc) return [];
  const queries = new Set();
  const brand = String(upc.brand || '').trim();
  const title = String(upc.title || '').trim();
  if (brand) queries.add(brand);
  if (title) {
    const words = title
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !/^(the|and|for|with|fl|oz|ml)$/i.test(w));
    if (words.length >= 2) queries.add(words.slice(0, 5).join(' '));
    if (words.length >= 2) queries.add(words.slice(0, 2).join(' '));
    if (brand && words.length) queries.add(`${brand} ${words.slice(0, 3).join(' ')}`);
  }
  return [...queries].slice(0, 8);
}

let facesBarcodeIndex = null;
let facesBarcodeDirty = false;

export function loadFacesBarcodeIndex() {
  if (facesBarcodeIndex) return facesBarcodeIndex;
  try {
    if (fs.existsSync(FACES_BARCODE_FILE)) {
      facesBarcodeIndex = JSON.parse(fs.readFileSync(FACES_BARCODE_FILE, 'utf8'));
      return facesBarcodeIndex;
    }
  } catch {
    /* rebuild */
  }
  facesBarcodeIndex = { barcodes: {}, meta: { updatedAt: 0 } };
  return facesBarcodeIndex;
}

function saveFacesBarcodeIndex() {
  if (!facesBarcodeDirty || !facesBarcodeIndex) return;
  fs.mkdirSync(path.dirname(FACES_BARCODE_FILE), { recursive: true });
  facesBarcodeIndex.meta = { ...facesBarcodeIndex.meta, updatedAt: Date.now() };
  fs.writeFileSync(FACES_BARCODE_FILE, JSON.stringify(facesBarcodeIndex, null, 2));
  facesBarcodeDirty = false;
}

export function lookupFacesBarcodeIndex(barcode) {
  const index = loadFacesBarcodeIndex();
  const key = gtinKey(barcode);
  return index.barcodes[key] || index.barcodes[String(barcode).replace(/\D/g, '')] || null;
}

export function saveFacesBarcodeIndexEntry(barcode, tile = {}) {
  if (!tile?.pid) return;
  const index = loadFacesBarcodeIndex();
  const key = gtinKey(barcode);
  index.barcodes[key] = {
    pid: tile.pid,
    ean: tile.ean || barcode,
    nameAr: tile.nameAr || '',
    nameEn: tile.nameEn || '',
    brandAr: tile.brandAr || '',
    brandEn: tile.brandEn || '',
    thumb: tile.thumb || '',
    price: tile.price,
    shadeName: tile.shadeName || '',
    productUrl: tile.productUrl || '',
    updatedAt: Date.now(),
  };
  facesBarcodeDirty = true;
  saveFacesBarcodeIndex();
}

async function indexFacesProductBarcodes(pid, baseTile = {}) {
  if (!pid) return;
  try {
    const raw = await fetchProductById(pid);
    if (!raw) return;
    const tile = {
      pid,
      nameAr: raw.productName || baseTile.nameAr || '',
      nameEn: raw._enProduct?.productName || baseTile.nameEn || '',
      brandAr: raw.brand || baseTile.brandAr || '',
      brandEn: raw._enProduct?.brand || baseTile.brandEn || '',
      thumb: productImage(raw) || baseTile.thumb || '',
      productUrl: absUrl(raw.selectedProductUrl) || baseTile.productUrl || '',
      price: raw.price?.sales?.value || baseTile.price,
    };
    if (raw.EAN) {
      saveFacesBarcodeIndexEntry(raw.EAN, { ...tile, ean: raw.EAN });
    }
    for (const shade of raw._shades || []) {
      if (!shade.barcode) continue;
      saveFacesBarcodeIndexEntry(shade.barcode, {
        ...tile,
        ean: shade.barcode,
        price: shade.price || tile.price,
        shadeName: shade.name || '',
      });
    }
  } catch {
    /* optional index */
  }
}

export async function expandFacesBarcodeIndex() {
  const index = loadFacesBarcodeIndex();
  const pids = [...new Set(Object.values(index.barcodes || {}).map((e) => e.pid).filter(Boolean))];
  for (const pid of pids) {
    const sample = Object.values(index.barcodes).find((e) => e.pid === pid) || {};
    await indexFacesProductBarcodes(pid, sample);
  }
}

async function resolveFacesBarcodeOnProduct(pid, barcode, fallbackTile = {}) {
  try {
    const raw = await fetchProductById(pid);
    if (!raw) return null;
    const tile = {
      pid,
      nameAr: raw.productName || fallbackTile.nameAr || '',
      nameEn: raw._enProduct?.productName || fallbackTile.nameEn || '',
      brandAr: raw.brand || fallbackTile.brandAr || '',
      brandEn: raw._enProduct?.brand || fallbackTile.brandEn || '',
      thumb: productImage(raw) || fallbackTile.thumb || '',
      productUrl: absUrl(raw.selectedProductUrl) || fallbackTile.productUrl || '',
      hasOptions: (raw._shades?.length || 0) > 0,
      inStock: raw.available !== false,
      price: raw.price?.sales?.value || fallbackTile.price,
      ean: raw.EAN || '',
    };
    if (gtinEqual(raw.EAN, barcode)) {
      return { tile: { ...tile, ean: raw.EAN }, matchType: 'product', barcode: raw.EAN };
    }
    for (const shade of raw._shades || []) {
      if (!gtinEqual(shade.barcode, barcode)) continue;
      return { tile, shade, matchType: 'shade', barcode: shade.barcode };
    }
    return null;
  } catch {
    return null;
  }
}

function tileFromFacesIndex(entry = {}) {
  return {
    pid: entry.pid,
    ean: entry.ean,
    nameAr: entry.nameAr,
    nameEn: entry.nameEn,
    brandAr: entry.brandAr,
    brandEn: entry.brandEn,
    thumb: entry.thumb,
    price: entry.price,
    shadeName: entry.shadeName || '',
    productUrl: entry.productUrl,
    hasOptions: !!entry.shadeName,
    inStock: true,
  };
}

async function scanFacesHintQueries(barcode, queries, scanOpts, { maxPages = 4, pageSize = 40 } = {}) {
  const unique = [...new Set(queries.filter(Boolean))];
  for (const q of unique) {
    if (scanOpts.hits.length >= scanOpts.limit) break;
    for (let page = 1; page <= maxPages; page++) {
      if (scanOpts.hits.length >= scanOpts.limit) break;
      try {
        const data = await searchProducts(q, page, pageSize, { enrich: true });
        await scanTilesForBarcode(data.items || [], barcode, scanOpts);
        if (!data.items?.length || data.items.length < pageSize) break;
      } catch {
        break;
      }
    }
  }
}

async function scanFacesBrandCatalogs(barcode, brandNames, scanOpts) {
  const brands = [...new Set(brandNames.map((b) => String(b || '').trim()).filter(Boolean))].slice(0, 3);
  for (const brand of brands) {
    if (scanOpts.hits.length >= scanOpts.limit) break;
    for (let page = 1; page <= 4; page++) {
      if (scanOpts.hits.length >= scanOpts.limit) break;
      try {
        const data = await fetchBrandProducts(brand, { page, limit: 40, enrich: true });
        await scanTilesForBarcode(data.items || [], barcode, scanOpts, { deepLimit: 25 });
        if (!data.items?.length || data.items.length < 40) break;
      } catch {
        break;
      }
    }
  }
}

function collectBrandNames(hintHits = [], upc = null) {
  const brands = new Set();
  for (const h of hintHits) {
    for (const b of [h.manufacturer, h.manufacturerEn, h.brand]) {
      const s = String(b || '').trim();
      if (s.length >= 2) brands.add(s);
    }
    for (const title of [h.nameEn, h.name, h.title]) {
      const lead = String(title || '').match(/^([A-Z][A-Za-z0-9&.'-]+)/)?.[1];
      if (lead && lead.length >= 2) brands.add(lead);
      const arLead = String(title || '').match(/(?:من|من\s+)([\u0600-\u06FF]{2,12})/)?.[1];
      if (arLead) brands.add(arLead);
    }
  }
  if (upc?.brand) brands.add(upc.brand.trim());
  return [...brands];
}

/** مسار سريع لباركود GTIN عند توفر تلميح من متجر آخر (مثل Amazon) */
async function tryFacesGtinWithHints(barcode, hintHits = [], scanOpts) {
  if (!hintHits.length || !looksLikeGtinBarcode(barcode)) return false;

  for (const h of hintHits) {
    const title = String(h.nameEn || h.name || h.title || '')
      .replace(/\s*[-–#|].*$/, '')
      .replace(/\s+\d+\s*ml.*$/i, '')
      .trim();
    if (title.length < 6) continue;
    try {
      const data = await searchProducts(title, 1, 25, { enrich: true });
      await scanTilesForBarcode(data.items || [], barcode, scanOpts, { deepLimit: 20 });
      if (scanOpts.hits.length) return true;
    } catch {
      /* next hint */
    }
  }

  const upc = await lookupUpcByBarcode(barcode).catch(() => null);
  const brands = collectBrandNames(hintHits, upc);
  if (brands.length) {
    await scanFacesBrandCatalogs(barcode, brands, scanOpts);
    if (scanOpts.hits.length) return true;
  }
  const queries = [
    ...buildFacesHintQueries(hintHits),
    ...(upc ? buildFacesHintQueriesFromUpc(upc) : []),
  ];
  if (queries.length) {
    await scanFacesHintQueries(barcode, queries, scanOpts, {
      maxPages: scanOpts.light ? 2 : 3,
      pageSize: 30,
    });
  }
  return scanOpts.hits.length > 0;
}

async function scanTilesForBarcode(tiles, barcode, { pushProduct, pushShade, limit, hits, light = false }, { deepLimit = 12 } = {}) {
  const merged = mergeTilesByPid(tiles);
  const needsEan = merged.filter((t) => !t.ean);
  if (needsEan.length) await enrichTilesFromQuickView(needsEan, light ? 4 : 8);

  for (const tile of merged) {
    if (hits.length >= limit) break;
    if (gtinEqual(tile.ean, barcode)) pushProduct(tile);
  }

  const deepCandidates = merged.filter((t) => t.hasOptions || !t.ean).slice(0, light ? 6 : deepLimit);
  for (const tile of deepCandidates) {
    if (hits.length >= limit) break;
    if (gtinEqual(tile.ean, barcode)) continue;
    try {
      const raw = await fetchProductById(tile.pid, { enrichShades: !light });
      if (!raw) continue;
      if (gtinEqual(raw.EAN, barcode)) {
        pushProduct({ ...tile, ean: raw.EAN });
        continue;
      }
      if (light) {
        const shades = extractShades(raw, raw._enProduct);
        const shade = await findShadeByBarcodeLight(shades, barcode);
        if (shade) pushShade(tile, shade);
        continue;
      }
      for (const shade of raw._shades || []) {
        if (!gtinEqual(shade.barcode, barcode)) continue;
        pushShade(tile, shade);
      }
    } catch {
      /* next */
    }
  }
}

async function lookupObfByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  try {
    const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${digits}.json`, {
      headers: { 'User-Agent': 'niceone-catalog/2.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    return {
      ean: digits,
      brand: String(p.brands || p.brand_owner || '').split(',')[0].trim(),
      title: String(p.product_name || p.generic_name || '').trim(),
      description: '',
      source: 'openbeautyfacts_lookup',
    };
  } catch {
    return null;
  }
}

function hitsFromFacesIndex(barcode, indexed, { pushProduct, pushShade, limit, hits }) {
  const tile = tileFromFacesIndex(indexed);
  if (indexed.shadeName) {
    pushShade(tile, {
      name: indexed.shadeName,
      barcode: indexed.ean || barcode,
      image: proxyFacesImage(indexed.thumb),
      sku: indexed.shadeName,
    });
  } else {
    pushProduct(tile);
  }
  return hits.slice(0, limit);
}

const facesSearchCache = new Map();
const FACES_SEARCH_CACHE_MS = 30 * 60 * 1000;

function cacheFacesSearchHits(barcode, hits, limit) {
  const key = gtinKey(barcode);
  if (!key || !hits.length) return hits.slice(0, limit);
  facesSearchCache.set(key, { at: Date.now(), hits: [...hits] });
  return hits.slice(0, limit);
}

/** بحث باركود في وجوه: فهرس محلي + HTML + Constructor + UPC + تلميحات متاجر */
export async function searchProductsByBarcode(barcode, { limit = 12, hintHits = [], light = false } = {}) {
  const cacheKey = gtinKey(barcode);
  const cached = facesSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < FACES_SEARCH_CACHE_MS) {
    return cached.hits.slice(0, limit);
  }

  const hits = [];
  const seen = new Set();

  const pushProduct = (tile) => {
    const key = `p:${tile.pid}:${tile.shadeName || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({ tile, matchType: 'product', barcode: tile.ean || barcode });
    saveFacesBarcodeIndexEntry(barcode, tile);
    indexFacesProductBarcodes(tile.pid, tile).catch(() => {});
  };

  const pushShade = (tile, shade) => {
    const key = `s:${tile.pid}:${shade.optionId || shade.sku || shade.name || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({ tile, shade, matchType: 'shade', barcode: shade.barcode });
    saveFacesBarcodeIndexEntry(barcode, {
      ...tile,
      ean: shade.barcode,
      price: shade.price || tile.price,
      shadeName: shade.name || '',
    });
    indexFacesProductBarcodes(tile.pid, tile).catch(() => {});
  };

  const scanOpts = { pushProduct, pushShade, limit, hits, light };

  if (hintHits.length) {
    const hinted = await tryFacesGtinWithHints(barcode, hintHits, scanOpts);
    if (hinted) return cacheFacesSearchHits(barcode, hits, limit);
  }

  const indexed = lookupFacesBarcodeIndex(barcode);
  if (indexed?.pid && (indexed.nameAr || indexed.nameEn || indexed.thumb)) {
    return cacheFacesSearchHits(barcode, hitsFromFacesIndex(barcode, indexed, scanOpts), limit);
  }

  const direct = await tryDirectBarcodeQuickView(barcode, { light });
  if (direct) {
    if (direct.matchType === 'shade' && direct.shade) pushShade(direct.tile, direct.shade);
    else pushProduct(direct.tile);
    if (hits.length) return cacheFacesSearchHits(barcode, hits, limit);
  }

  if (indexed?.pid) {
    const resolved = await resolveFacesBarcodeOnProduct(indexed.pid, barcode, indexed);
    if (resolved?.matchType === 'shade') pushShade(resolved.tile, resolved.shade);
    else if (resolved) pushProduct({ ...resolved.tile, ean: resolved.barcode, shadeName: indexed.shadeName || '' });
    else pushProduct(tileFromFacesIndex(indexed));
    if (hits.length) return cacheFacesSearchHits(barcode, hits, limit);
  }

  const catalogTiles = await findFacesTilesByCatalogScan(barcode, { maxPages: light ? 1 : 2 });
  if (catalogTiles.length) {
    await scanTilesForBarcode(catalogTiles, barcode, scanOpts);
    if (hits.length) return cacheFacesSearchHits(barcode, hits, limit);
  }

  const earlyHints = [...hintHits];
  if (earlyHints.length) {
    const brands = collectBrandNames(earlyHints, null);
    if (brands.length) {
      await scanFacesBrandCatalogs(barcode, brands, scanOpts);
      if (hits.length) return hits.slice(0, limit);
    }
    const queries = buildFacesHintQueries(earlyHints);
    if (queries.length) {
      await scanFacesHintQueries(barcode, queries, scanOpts, { maxPages: 2, pageSize: 30 });
      if (hits.length) return hits.slice(0, limit);
    }
  }

  const index = loadFacesBarcodeIndex();
  const knownPids = [...new Set(Object.values(index.barcodes || {}).map((e) => e.pid).filter(Boolean))];
  for (const pid of knownPids.slice(0, light ? 3 : hintHits.length ? 5 : 8)) {
    if (hits.length >= limit) break;
    const resolved = await resolveFacesBarcodeOnProduct(pid, barcode);
    if (!resolved) continue;
    if (resolved.matchType === 'shade') pushShade(resolved.tile, resolved.shade);
    else pushProduct({ ...resolved.tile, ean: resolved.barcode });
    break;
  }
  if (hits.length) return cacheFacesSearchHits(barcode, hits, limit);

  const slugTiles = await findTilesFromSearchSlug(barcode);
  if (slugTiles.length) {
    await scanTilesForBarcode(slugTiles, barcode, scanOpts);
    if (hits.length) return hits.slice(0, limit);
  }

  const variants = barcodeQueryVariants(barcode);
  for (const q of variants) {
    if (hits.length >= limit) break;

    const [apiOut, htmlOut] = await Promise.allSettled([
      searchProducts(q, 1, 15, { enrich: !light }),
      fetchSearchHtmlTiles(q, 15),
    ]);

    const tiles = [
      ...(apiOut.status === 'fulfilled' ? apiOut.value.items : []),
      ...(htmlOut.status === 'fulfilled' ? htmlOut.value : []),
    ];
    await scanTilesForBarcode(tiles, barcode, scanOpts);
  }

  if (hits.length) return hits.slice(0, limit);

  const upc = await lookupUpcByBarcode(barcode);
  const obf = upc ? null : await lookupObfByBarcode(barcode);
  const external = upc || obf;
  const upcHints = external
    ? [{
      brand: external.brand,
      manufacturer: external.brand,
      name: external.title,
      nameEn: external.title,
      title: external.title,
    }]
    : [];
  const allHints = [...hintHits, ...upcHints];

  const queries = [
    ...buildFacesHintQueries(allHints),
    ...(external ? buildFacesHintQueriesFromUpc(external) : []),
  ];
  await scanFacesHintQueries(barcode, queries, scanOpts);

  if (!hits.length) {
    const brands = collectBrandNames(allHints, external);
    await scanFacesBrandCatalogs(barcode, brands, scanOpts);
  }

  if (!hits.length && (await probeFacesBarcodeInCatalog(barcode))) {
    const fallbackBrands = collectBrandNames(allHints, external);
    if (fallbackBrands.length) {
      await scanFacesBrandCatalogs(barcode, fallbackBrands, scanOpts);
    }
  }

  return cacheFacesSearchHits(barcode, hits, limit);
}

export function sortProductsClient(products = [], sort = 'default') {
  if (!sort || sort === 'default') return products;
  const priceOf = (item) => {
    const n = item.priceNumeric ?? Number(String(item.price || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const nameOf = (item) => (item.name || item.nameEn || '').trim();
  return [...products].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const diff = priceOf(a) - priceOf(b);
      return sort === 'price_asc' ? diff : -diff;
    }
    if (sort === 'name_asc' || sort === 'name_desc') {
      const diff = nameOf(a).localeCompare(nameOf(b), 'ar', { sensitivity: 'base' });
      return sort === 'name_asc' ? diff : -diff;
    }
    return 0;
  });
}

const BRAND_FACET_CATEGORIES = [
  'makeup', 'perfume', 'skincare', 'haircare', 'bath-and-body', 'men', 'niche', 'k-beauty', 'bestsellers',
];

function brandSlug(name = '') {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-').replace(/^-|-$/g, '');
}

export async function fetchBrandsCatalog() {
  const map = new Map();
  for (const catId of BRAND_FACET_CATEGORIES) {
    try {
      const response = await fetchCnstrc(`/browse/group_id/${encodeURIComponent(catId)}`, {
        page: '1',
        num_results_per_page: '1',
      });
      const facet = (response.facets || []).find((f) => f.name === 'brand');
      for (const opt of facet?.options || []) {
        const name = String(opt.display_name || opt.value || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const count = opt.count || 0;
        if (!map.has(key)) {
          map.set(key, {
            id: name,
            slug: brandSlug(name),
            name,
            nameEn: name,
            productCount: count,
            image: '',
          });
        } else {
          map.get(key).productCount = Math.max(map.get(key).productCount, count);
        }
      }
    } catch {
      /* skip category */
    }
  }

  const brands = [...map.values()];
  const top = brands.sort((a, b) => b.productCount - a.productCount).slice(0, 120);
  await Promise.all(top.map(async (brand) => {
    try {
      const response = await fetchCnstrc(`/browse/group_id/makeup`, {
        page: '1',
        num_results_per_page: '1',
        'filters[brand]': brand.name,
      });
      const item = response.results?.[0];
      const img = item?.data?.image_url;
      if (img) brand.image = proxyFacesImage(img);
    } catch {
      /* skip */
    }
  }));

  brands.sort((a, b) => {
    if (b.productCount !== a.productCount) return b.productCount - a.productCount;
    return a.name.localeCompare(b.name, 'ar');
  });
  return brands;
}

export async function fetchBrandProducts(brandName, { page = 1, limit = 30, enrich = false } = {}) {
  const name = String(brandName || '').trim();
  const response = await fetchCnstrc(`/search/${encodeURIComponent(name)}`, {
    page: String(page),
    num_results_per_page: String(limit),
  });
  let tiles = (response.results || []).map(mapCnstrcItem).filter((t) => t.pid);
  const key = name.toLowerCase();
  tiles = tiles.filter((t) => (t.brandAr || t.nameAr || '').toLowerCase().includes(key) || key.includes((t.brandAr || '').toLowerCase()));
  if (!tiles.length && page === 1) {
    const browse = await fetchCnstrc('/browse/group_id/makeup', {
      page: String(page),
      num_results_per_page: String(limit),
      'filters[brand]': name,
    });
    tiles = (browse.results || []).map(mapCnstrcItem).filter((t) => t.pid);
    if (enrich) tiles = await enrichTilesFromQuickView(tiles);
    return {
      items: tiles,
      total: browse.total_num_results ?? tiles.length,
      page,
      pageSize: limit,
    };
  }
  if (enrich) tiles = await enrichTilesFromQuickView(tiles);
  return {
    items: tiles,
    total: response.total_num_results ?? tiles.length,
    page,
    pageSize: limit,
  };
}
