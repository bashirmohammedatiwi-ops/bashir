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
import { barcodeFromIndex, enrichItemsWithBarcodes } from './barcode-enrich.js';
import {
  categorySearchPlan,
  mapWebSearchHit,
  miswagWebSearch,
} from './search-api.js';

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
    barcode: barcodeFromIndex(id),
  };
}

export async function listCategoryProducts(categoryAlias, { page = 1, limit = 30, sort = 'default' } = {}) {
  const alias = String(categoryAlias || '').trim();
  if (!alias) throw new Error('Invalid category');

  const { tree } = await fetchCategoryTree().catch(() => ({ tree: [] }));
  const { query, activeFilters } = categorySearchPlan(alias, tree);

  const perPage = Math.min(limit, 60);
  const { hits, found, hasMore, pagination } = await miswagWebSearch({
    query,
    activeFilters,
    page,
    perPage,
    sortKey: sort !== 'default' ? sort : '',
  });

  return {
    items: await enrichItemsWithBarcodes(
      hits.map(mapWebSearchHit),
      { maxV2: 24 },
    ),
    page,
    pageSize: limit,
    total: found || pagination?.total_hits || hits.length,
    hasMore: hasMore || hits.length >= limit,
  };
}

function searchTokens(query = '') {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF]+/)
    .filter((t) => t.length >= 2);
}

function looksLikeBeautyQuery(query = '') {
  // لا تُدخل «mac» وحدها — في مسواگ غالباً أجهزة وليست مستحضرات
  return /جمال|مكياج|عطر|عناية|بشرة|شفاه|أحمر|فاونديشن|ماسكارا|كونسيلر|سيروم|كريم|lipstick|mascara|foundation|serum|perfume|makeup|skincare|maybelline|loreal|l'?oreal|dior|chanel|nyx|clinique|nars|revlon|\belf\b|hudabeauty|ibraq|lattafa|ميبيلين|لوريال|ديور|شانيل|نارس/i.test(
    String(query || ''),
  );
}

function scoreSearchHit(doc = {}, tokens = []) {
  if (!tokens.length) return 1;
  const brand = String(doc.brand || '').toLowerCase();
  const title = `${doc.title_AR || ''} ${doc.title_EN || ''}`.toLowerCase();
  const hay = `${brand} ${title} ${doc.keywords || ''}`.toLowerCase();
  let score = 0;
  let matched = 0;
  for (const t of tokens) {
    let hit = false;
    if (brand === t || brand.includes(t)) {
      score += 40;
      hit = true;
    } else if (title.includes(t)) {
      score += 18;
      hit = true;
    } else if (hay.includes(t)) {
      score += 8;
      hit = true;
    }
    if (hit) matched += 1;
  }
  // كل الكلمات مهمة — منتج يطابق كلمة واحدة فقط يتراجع بقوة
  if (tokens.length >= 2) {
    score += matched * 25;
    if (matched < tokens.length) score -= (tokens.length - matched) * 35;
  }
  if (String(doc.l1_division_alias || '') === 'beauty') score += 10;
  return score;
}

export async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const q = String(query || '').trim();
  const perPage = Math.min(Math.max(limit, 1), 60);
  const beautyBias = !categoryId && looksLikeBeautyQuery(q);

  let activeFilters = {};
  let searchQuery = q;

  if (categoryId) {
    const { tree } = await fetchCategoryTree().catch(() => ({ tree: [] }));
    const plan = categorySearchPlan(categoryId, tree);
    searchQuery = q || plan.query;
    activeFilters = plan.activeFilters;
  } else if (beautyBias) {
    activeFilters = { l1_division: ['beauty'] };
  }

  let { hits, found, hasMore } = await miswagWebSearch({
    query: searchQuery,
    activeFilters,
    page,
    perPage,
  });

  // إن ضيّق فلتر الجمال النتائج — أعد بدون فلتر
  if (!hits.length && beautyBias && !categoryId) {
    ({ hits, found, hasMore } = await miswagWebSearch({
      query: q,
      activeFilters: {},
      page,
      perPage,
    }));
  }

  // إن ضيّق قسم التصفح النتائج — أعد على كل الكتالوج
  if (!hits.length && categoryId) {
    ({ hits, found, hasMore } = await miswagWebSearch({
      query: q,
      activeFilters: {},
      page,
      perPage,
    }));
  }

  const tokens = searchTokens(q);
  const scored = hits.map((hit) => {
    const doc = {
      title_AR: hit.title?.AR || hit.title,
      title_EN: hit.title?.EN || hit.title,
      brand: hit.brand,
      keywords: '',
      l1_division_alias: String(hit.category || '').split('>')[0]?.trim(),
    };
    return { hit, score: scoreSearchHit(doc, tokens) };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ?? 0;
  const filtered = scored.filter((s) => {
    if (beautyBias && !String(s.hit.category || '').toLowerCase().startsWith('beauty')) return false;
    if (tokens.length < 2) return true;
    if (best >= 50) return s.score >= Math.max(20, best * 0.35);
    return s.score >= 8;
  });
  let rankedHits = (filtered.length ? filtered : scored).map((s) => s.hit);

  if (!rankedHits.length && beautyBias) {
    ({ hits: rankedHits, found, hasMore } = await miswagWebSearch({
      query: q,
      activeFilters: {},
      page,
      perPage,
    }));
  }

  return {
    items: await enrichItemsWithBarcodes(
      rankedHits.slice(0, limit).map(mapWebSearchHit),
      { maxV2: 24 },
    ),
    page,
    pageSize: limit,
    total: found || rankedHits.length,
    hasMore: hasMore || rankedHits.length >= limit,
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
