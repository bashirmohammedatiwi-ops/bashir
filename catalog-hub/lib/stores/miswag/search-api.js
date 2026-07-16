/**
 * بحث مسواگ عبر واجهة الموقع الجديدة (POST /api/v1/search).
 * Typesense لم يعد مضمّناً في HTML — هذا المسار هو المصدر الموثوق للبحث والتصفح.
 */
import { resolveBilingualName, splitBilingualText } from '../../core/bilingual.js';
import { barcodeFromIndex } from './barcode-enrich.js';
import {
  SITE,
  absImage,
  cacheGet,
  cacheSet,
  formatPrice,
} from './client.js';

const WEB_SEARCH_URL = 'https://miswag.com/api/v1/search';
const LIST_TTL = 5 * 60 * 1000;

export function mapWebSearchHit(hit = {}) {
  const titleAr = typeof hit.title === 'object' ? hit.title.AR : hit.title;
  const titleEn = typeof hit.title === 'object' ? hit.title.EN : hit.title;
  const names = resolveBilingualName(titleAr, titleEn);
  const brand = splitBilingualText(hit.brand || '');
  const id = String(hit.id || hit.action?.id || '');

  return {
    id,
    nameAr: names.ar || names.en,
    nameEn: names.en || names.ar,
    brandAr: brand.ar || String(hit.brand || '').trim(),
    brandEn: brand.en || String(hit.brand || '').trim(),
    thumb: absImage(hit.image),
    price: formatPrice(hit.price || {}),
    sku: String(hit.slug || id),
    productUrl: hit.url || (id ? `${SITE}/products/${id}` : ''),
    category: String(hit.category || '').replace(/\s*>\s*/g, ' › ').trim(),
    shadeCount: Array.isArray(hit.colors) ? hit.colors.length : 0,
    hasOptions: Array.isArray(hit.colors) && hit.colors.length > 1,
    inStock: hit.is_available !== false,
    barcode: barcodeFromIndex(id),
  };
}

export async function miswagWebSearch({
  query = '',
  activeFilters = {},
  page = 1,
  perPage = 30,
  sortKey = '',
  currentFilter = '',
} = {}) {
  const body = {
    query: String(query || '').trim(),
    activeFilters: activeFilters || {},
    page: Math.max(1, Number(page) || 1),
    perPage: Math.min(Math.max(1, Number(perPage) || 30), 60),
  };
  if (sortKey) body.sortKey = sortKey;
  if (currentFilter) body.currentFilter = currentFilter;

  const cacheKey = `miswag:websearch:${JSON.stringify(body)}`;
  const cached = cacheGet(cacheKey, LIST_TTL);
  if (cached) return cached;

  const res = await fetch(WEB_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: SITE,
      Referer: `${SITE}/search`,
      'User-Agent': 'Mozilla/5.0 (compatible; CatalogHub/2.0)',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(18_000),
  });

  if (!res.ok) throw new Error(`Miswag web search ${res.status}`);

  const json = await res.json().catch(() => ({}));
  if (!json?.success || !json?.data) {
    throw new Error(json?.message || 'Miswag web search failed');
  }

  const pagination = json.data.pagination || {};
  const out = {
    hits: json.data.hits || [],
    found: Number(
      json.data.info?.result_count
      ?? pagination.total_hits
      ?? json.data.hits?.length
      ?? 0,
    ),
    pagination,
    hasMore: Boolean(
      pagination.has_more
      || (pagination.total_pages && body.page < pagination.total_pages),
    ),
  };

  cacheSet(cacheKey, out, LIST_TTL);
  return out;
}

/** بحث نصي بسيط — يُستخدم للباركود والماركات */
export async function miswagWebSearchItems(query, { page = 1, perPage = 30, activeFilters = {} } = {}) {
  const { hits, found, hasMore } = await miswagWebSearch({
    query,
    activeFilters,
    page,
    perPage,
  });
  return {
    items: hits.map(mapWebSearchHit).filter((p) => p.id),
    found,
    hasMore,
  };
}

function walkTree(nodes = [], visit) {
  for (const node of nodes) {
    visit(node);
    if (node.children?.length) walkTree(node.children, visit);
  }
}

function findTreeNode(tree = [], alias = '') {
  let hit = null;
  walkTree(tree, (node) => {
    if (!hit && node.id === alias) hit = node;
  });
  return hit;
}

function findL1Ancestor(tree = [], target = null) {
  if (!target) return null;
  if (target.level === 1) return target;

  let l1 = null;
  function walk(nodes, currentL1) {
    for (const node of nodes) {
      const nextL1 = node.level === 1 ? node : currentL1;
      if (node.id === target.id) {
        l1 = nextL1;
        return true;
      }
      if (node.children?.length && walk(node.children, nextL1)) return true;
    }
    return false;
  }
  walk(tree, null);
  return l1;
}

/**
 * يحوّل alias قسم (L1/L2/L3) إلى استعلام بحث الموقع.
 * L1: query=alias + فلتر l1_division
 * L2/L3: query=alias + فلتر L1 الأب
 */
export function categorySearchPlan(alias = '', tree = []) {
  const id = String(alias || '').trim();
  if (!id) return { query: '', activeFilters: {} };

  const node = findTreeNode(tree, id);
  if (!node) {
    return {
      query: id.replace(/-/g, ' '),
      activeFilters: {},
    };
  }

  const l1 = findL1Ancestor(tree, node);
  const activeFilters = l1 ? { l1_division: [l1.id] } : {};
  const query = node.level === 1 ? node.id : node.id.replace(/-/g, ' ');

  return { query, activeFilters };
}
