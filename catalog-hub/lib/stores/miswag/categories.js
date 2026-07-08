import {
  miswagFetch,
  typesenseMultiSearch,
  typesenseSearch,
  formatPrice,
  absImage,
  parseTitle,
  cacheGet,
  cacheSet,
} from './client.js';
import { resolveBilingualName, splitBilingualText } from '../../core/bilingual.js';

const TREE_TTL = 30 * 60 * 1000;
const DIVISION_FIELDS = ['l1_division_alias', 'l2_division_alias', 'l3_division_alias', 'l4_division_alias'];

/** مرشّح Typesense — يدعم أي قسم L1–L4 في كل المتجر */
export function buildCategoryFilter(alias) {
  const a = String(alias || '').trim().replace(/`/g, '');
  if (!a) return '';
  return `(${DIVISION_FIELDS.map((f) => `${f}:=\`${a}\``).join(' || ')})`;
}

function mapL2Node(l2, l1Alias) {
  return {
    id: l2.alias,
    slug: l2.alias,
    name: String(l2.name || l2.nameAr || '').trim(),
    nameEn: String(l2.nameEn || l2.alias).trim(),
    parentId: l1Alias,
    level: 2,
    isLeaf: false,
    children: [],
    productCount: null,
  };
}

function mapL3Node(doc, l2Alias) {
  const alias = String(doc.l3_division_alias || '').trim();
  const nameAr = String(doc.l3_division_ar || '').trim();
  if (!alias || !nameAr || /^\d+$/.test(alias)) return null;
  return {
    id: alias,
    slug: alias,
    name: nameAr,
    nameEn: String(doc.l3_division_en || alias).trim(),
    parentId: l2Alias,
    level: 3,
    isLeaf: true,
    children: [],
    productCount: null,
  };
}

/** شجرة كاملة — كل أقسام miswag.com (12 قسم رئيسي + L2 + L3) */
export async function fetchCategoryTree() {
  const cached = cacheGet('miswag:tree:v2', TREE_TTL);
  if (cached) return cached;

  const data = await miswagFetch('/content/v1/l1_categories/tree');
  const roots = data.content || [];

  const l1List = roots.filter((r) => r.alias).map((r) => ({
    id: r.alias,
    slug: r.alias,
    name: parseTitle(r.name).ar || r.alias,
    nameEn: parseTitle(r.name).en || r.alias,
    level: 1,
    isLeaf: false,
    children: [],
    productCount: null,
    l2Raw: r.l2_divisions || [],
  }));

  // جلب L3 لكل L2 دفعة واحدة (multi_search)
  const l2Flat = [];
  for (const l1 of l1List) {
    for (const l2 of l1.l2Raw) {
      if (l2.alias) l2Flat.push({ l1, l2 });
    }
  }

  let l3Results = [];
  const batchSize = 20;
  for (let i = 0; i < l2Flat.length; i += batchSize) {
    const batch = l2Flat.slice(i, i + batchSize);
    try {
      const part = await typesenseMultiSearch(
        batch.map(({ l1, l2 }) => ({
          q: '*',
          query_by: 'title_AR',
          filter_by: `l1_division_alias:=\`${l1.id}\` && l2_division_alias:=\`${l2.alias}\``,
          per_page: 80,
          group_by: 'l3_division_alias',
          group_limit: 1,
          include_fields: 'l2_division_ar,l3_division_alias,l3_division_ar,l3_division_en',
        })),
      );
      l3Results = l3Results.concat(part);
    } catch { /* L2 بدون L3 */ }
  }

  const tree = [];
  const leaves = [];
  let l3Idx = 0;

  for (const l1 of l1List) {
    const l1Node = {
      id: l1.id,
      slug: l1.slug,
      name: l1.name,
      nameEn: l1.nameEn,
      level: 1,
      isLeaf: false,
      children: [],
      productCount: null,
    };

    for (const l2 of l1.l2Raw) {
      if (!l2.alias) continue;
      const l2Node = mapL2Node(l2, l1.id);
      const result = l3Results[l3Idx++] || {};
      const groups = result.grouped_hits || [];
      const children = [];
      for (const g of groups) {
        const doc = g.hits?.[0]?.document || {};
        const l3 = mapL3Node(doc, l2.alias);
        if (l3) {
          l3.productCount = g.found || null;
          children.push(l3);
          leaves.push({ ...l3, path: `${l1.name} › ${l2Node.name} › ${l3.name}` });
        }
      }
      children.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
      l2Node.children = children;
      l2Node.isLeaf = children.length === 0;
      l2Node.productCount = children.reduce((s, c) => s + (c.productCount || 0), 0) || null;
      if (l2Node.isLeaf) {
        leaves.push({ ...l2Node, path: `${l1.name} › ${l2Node.name}` });
      }
      l1Node.children.push(l2Node);
    }

    l1Node.productCount = l1Node.children.reduce((s, c) => s + (c.productCount || 0), 0) || null;
    tree.push(l1Node);
    if (!l1Node.children.length) {
      leaves.push({ ...l1Node, path: l1.name });
    }
  }

  const out = { tree, leaves };
  cacheSet('miswag:tree:v2', out);
  return out;
}

const SORT_MAP = {
  default: 'rating_count:desc,rating:desc',
  price_asc: 'price_numeric_value:asc',
  price_desc: 'price_numeric_value:desc',
  newest: 'created_at:desc',
};

export function mapTypesenseHit(doc = {}) {
  const names = resolveBilingualName(doc.title_AR, doc.title_EN);
  const brand = splitBilingualText(doc.brand || doc.facet_brand || '');
  const id = String(doc.id || doc.product_id || '');
  let shadeCount = 0;
  try {
    const vars = typeof doc.variations === 'string' ? JSON.parse(doc.variations) : doc.variations;
    shadeCount = Array.isArray(vars) ? vars.length : 0;
  } catch { /* ignore */ }

  return {
    id,
    nameAr: names.ar || names.en,
    nameEn: names.en || names.ar,
    brandAr: brand.ar || String(doc.brand || doc.facet_brand || '').trim(),
    brandEn: brand.en || String(doc.brand || '').trim(),
    thumb: absImage(doc.image || doc.image_url),
    price: formatPrice({
      value: doc.price_numeric_value ?? doc.price_value,
      original_value: doc.price_original_value,
      currency: doc.price_currency || 'IQD',
    }),
    sku: String(doc.alias || id),
    productUrl: doc.url || (id ? `https://miswag.com/products/${id}` : ''),
    category: [doc.l1_division_ar, doc.l2_division_ar, doc.l3_division_ar].filter(Boolean).join(' › '),
    shadeCount,
    hasOptions: shadeCount > 1,
    inStock: doc.availability !== false,
  };
}

export async function listCategoryProducts(categoryAlias, { page = 1, limit = 30, sort = 'default' } = {}) {
  const filterBy = buildCategoryFilter(categoryAlias);
  if (!filterBy) throw new Error('Invalid category');
  const { hits, found } = await typesenseSearch('*', {
    page,
    perPage: Math.min(limit, 60),
    filterBy,
    sortBy: SORT_MAP[sort] || SORT_MAP.default,
  });
  return {
    items: hits.map((h) => mapTypesenseHit(h.document || h)),
    page,
    pageSize: limit,
    total: found,
    hasMore: hits.length >= limit,
  };
}

export async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  let filterBy = '';
  if (categoryId) filterBy = buildCategoryFilter(categoryId);
  const { hits, found } = await typesenseSearch(query, {
    page,
    perPage: Math.min(limit, 60),
    filterBy,
    strict: false,
  });
  return {
    items: hits.map((h) => mapTypesenseHit(h.document || h)),
    page,
    pageSize: limit,
    total: found,
    hasMore: hits.length >= limit,
  };
}

export function sortProductsClient(items = [], sort = 'default') {
  if (!sort || sort === 'default') return items;
  const priceOf = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
  const copy = [...items];
  if (sort === 'name_asc') return copy.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
  if (sort === 'name_desc') return copy.sort((a, b) => (b.nameAr || '').localeCompare(a.nameAr || '', 'ar'));
  if (sort === 'price_asc') return copy.sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === 'price_desc') return copy.sort((a, b) => priceOf(b) - priceOf(a));
  return copy;
}
