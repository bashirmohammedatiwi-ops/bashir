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

function searchTokens(query = '') {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF]+/)
    .filter((t) => t.length >= 2);
}

function looksLikeBeautyQuery(query = '') {
  // لا تُدخل «mac» وحدها — في مسواگ غالباً أجهزة وليست مستحضرات
  return /جمال|مكياج|عطر|عناية|بشرة|شفاه|أحمر|فاونديشن|ماسكارا|كونسيلر|سيروم|كريم|lipstick|mascara|foundation|serum|perfume|makeup|skincare|maybelline|loreal|l'?oreal|dior|chanel|nyx|clinique|nars|revlon|\belf\b|hudabeauty|ibraq|lattafa|ميبيلين|لوريال|ديور|شانيل/i.test(
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
  let filterBy = '';
  if (categoryId) filterBy = buildCategoryFilter(categoryId);

  const perPage = Math.min(Math.max(limit, 30), 60);
  const tokens = searchTokens(q);
  const beautyBias = !categoryId && looksLikeBeautyQuery(q);

  // بحث صريح بالحقول — أدق من preset مسواگ الذي يخلط «MAC» مع أجهزة/إلكترونيات
  const explicit = typesenseSearch(q, {
    page,
    perPage,
    filterBy: filterBy || (beautyBias ? 'l1_division_alias:=`beauty`' : ''),
    strict: false,
    usePreset: false,
  });

  // preset كاحتياط فقط (نتائج أوسع لكن أقل دقة)
  const preset = typesenseSearch(q, {
    page,
    perPage,
    filterBy,
    strict: false,
    usePreset: true,
  });

  const beautyExtra = beautyBias && !filterBy
    ? typesenseSearch(q, {
        page: 1,
        perPage,
        filterBy: 'l1_division_alias:=`beauty`',
        strict: false,
        usePreset: false,
      })
    : Promise.resolve({ hits: [], found: 0 });

  let [explicitRes, presetRes, beautyRes] = await Promise.all([explicit, preset, beautyExtra]);

  // إن ضيّق فلتر الجمال النتائج إلى صفر — أعد بدون فلتر
  if (beautyBias && !filterBy && !(explicitRes.hits || []).length) {
    explicitRes = await typesenseSearch(q, {
      page,
      perPage,
      filterBy: '',
      strict: false,
      usePreset: false,
    });
  }

  // إن ضيّق القسم النتائج إلى صفر — أعد البحث على كل الكتالوج
  if (!(explicitRes.hits || []).length && !(presetRes.hits || []).length && filterBy) {
    explicitRes = await typesenseSearch(q, {
      page,
      perPage,
      filterBy: '',
      strict: false,
      usePreset: false,
    });
    presetRes = { hits: [], found: 0 };
  }

  const seen = new Set();
  const scored = [];
  for (const pack of [beautyRes, explicitRes, presetRes]) {
    for (const hit of pack.hits || []) {
      const doc = hit.document || hit;
      const id = String(doc.id || '');
      if (!id || seen.has(id)) continue;
      // استعلامات التجميل: لا تخلط أجهزة منزلية/إلكترونيات من الـ preset
      if (beautyBias && String(doc.l1_division_alias || '') !== 'beauty') continue;
      seen.add(id);
      const score = scoreSearchHit(doc, tokens);
      scored.push({ hit, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  // أسقط النتائج الضعيفة جداً إن وُجدت نتائج جيدة
  const best = scored[0]?.score ?? 0;
  const filtered = scored.filter((s) => {
    if (tokens.length < 2) return true;
    if (best >= 50) return s.score >= Math.max(20, best * 0.35);
    return s.score >= 8;
  });
  let hits = (filtered.length ? filtered : scored).slice(0, perPage).map((s) => s.hit);
  let found = Math.max(
    explicitRes.found || 0,
    beautyRes.found || 0,
    presetRes.found || 0,
    hits.length,
  );

  // إن لم يبقَ شيء بعد فلتر الجمال — أعد نتائج البحث الصريح بدون فلتر قسم
  if (!hits.length && beautyBias) {
    const open = await typesenseSearch(q, {
      page,
      perPage,
      filterBy: filterBy || '',
      strict: false,
      usePreset: false,
    });
    hits = open.hits || [];
    found = Math.max(found, open.found || 0, hits.length);
  }

  return {
    items: hits.map((h) => mapTypesenseHit(h.document || h)),
    page,
    pageSize: limit,
    total: found,
    hasMore: hits.length >= limit || found > page * perPage,
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
