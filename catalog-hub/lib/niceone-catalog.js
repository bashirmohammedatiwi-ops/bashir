/**
 * Nice One — جلب كatalog كامل من api.niceonesa.com
 * https://niceonesa.com/en
 */
import {
  fetchHomeCategories,
  buildBilingualCategoryTree,
  fetchCategoryProducts,
  searchProducts,
} from './api.js';

export const ROOT_CATEGORIES = [
  'makeup', 'perfume', 'vitamins-supplements', 'care', 'devices',
  'premium', 'nails', 'gifts', 'lenses', 'home-scents',
];

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGES_PER_CATEGORY = 250;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** جلب كل صفحات تصنيف واحد */
export async function fetchAllCategoryProducts(slug, {
  limit = DEFAULT_PAGE_SIZE,
  maxPages = MAX_PAGES_PER_CATEGORY,
  sort = 'most_popular',
  onPage,
} = {}) {
  const all = [];
  const seen = new Set();
  let page = 1;
  let total = null;

  while (page <= maxPages) {
    const data = await fetchCategoryProducts(slug, { page, limit, sort });
    const items = data.products || [];
    if (!items.length) break;

    total = data.total ?? total;
    for (const p of items) {
      const id = String(p.id);
      if (!seen.has(id)) {
        seen.add(id);
        all.push(p);
      }
    }

    onPage?.({ slug, page, batch: items.length, fetched: all.length, total });

    const doneByTotal = total != null && page * limit >= total;
    const doneByShortPage = items.length < limit;
    if (doneByTotal || doneByShortPage) break;

    page += 1;
    await sleep(40);
  }

  return { products: all, total: total ?? all.length, pages: page, slug };
}

/** إحصائيات الكatalog — أعداد كل قسم رئيسي */
export async function fetchCatalogOverview() {
  const [rawAr, rawEn] = await Promise.all([
    fetchHomeCategories('ar'),
    fetchHomeCategories('en'),
  ]);
  const { tree, leaves } = buildBilingualCategoryTree(rawAr, rawEn);

  const roots = [];
  for (const node of tree) {
    try {
      const data = await fetchCategoryProducts(node.slug, { page: 1, limit: 1 });
      roots.push({
        slug: node.slug,
        name: node.name,
        nameEn: node.nameEn,
        path: node.path,
        pathEn: node.pathEn,
        total: data.total ?? 0,
      });
    } catch {
      roots.push({
        slug: node.slug,
        name: node.name,
        nameEn: node.nameEn,
        path: node.path,
        pathEn: node.pathEn,
        total: 0,
      });
    }
  }

  let searchTotal = null;
  try {
    const probe = await searchProducts('*', 1, 1);
    searchTotal = probe.total ?? null;
  } catch { /* optional */ }

  const sumRoots = roots.reduce((s, r) => s + (r.total || 0), 0);

  return {
    roots,
    leaves: leaves.length,
    searchTotal,
    sumRoots,
    estimatedUnique: searchTotal ?? sumRoots,
    tree,
  };
}

/** جلب كatalog فريد — كل الأقسام الرئيسية بدون تكرار */
export async function fetchEntireCatalogUnique({
  limit = DEFAULT_PAGE_SIZE,
  onProgress,
  categorySlugs = ROOT_CATEGORIES,
} = {}) {
  const byId = new Map();
  const stats = { categories: 0, pages: 0, duplicates: 0 };

  for (const slug of categorySlugs) {
    stats.categories += 1;
    await fetchAllCategoryProducts(slug, {
      limit,
      onPage: ({ page, fetched, total }) => {
        stats.pages += 1;
        onProgress?.({
          phase: 'category',
          slug,
          page,
          categoryFetched: fetched,
          categoryTotal: total,
          uniqueTotal: byId.size,
        });
      },
    }).then(({ products }) => {
      for (const p of products) {
        const id = String(p.id);
        if (byId.has(id)) stats.duplicates += 1;
        byId.set(id, p);
      }
    });
  }

  return {
    products: [...byId.values()],
    total: byId.size,
    stats,
  };
}

/** بث الكatalog عبر callback (لـ SSE) */
export async function streamEntireCatalog(onEvent, options = {}) {
  const batchSize = options.batchSize || 50;
  let buffer = [];
  let unique = 0;

  const result = await fetchEntireCatalogUnique({
    ...options,
    onProgress: (p) => {
      onEvent?.({ type: 'progress', ...p });
    },
  });

  for (let i = 0; i < result.products.length; i += batchSize) {
    const batch = result.products.slice(i, i + batchSize);
    unique += batch.length;
    onEvent?.({ type: 'batch', products: batch, offset: i, uniqueTotal: unique });
  }

  onEvent?.({
    type: 'done',
    total: result.total,
    stats: result.stats,
  });

  return result;
}

/** أعداد سريعة لتصنيفات الشجرة (leaves + roots) */
export async function enrichTreeWithCounts(tree, { maxLeaves = 40 } = {}) {
  const counts = new Map();

  async function countSlug(slug) {
    if (counts.has(slug)) return counts.get(slug);
    try {
      const d = await fetchCategoryProducts(slug, { page: 1, limit: 1 });
      const n = d.total ?? 0;
      counts.set(slug, n);
      return n;
    } catch {
      counts.set(slug, 0);
      return 0;
    }
  }

  async function walk(nodes) {
    for (const n of nodes) {
      n.productCount = await countSlug(n.slug);
      if (n.children?.length) await walk(n.children);
      await sleep(20);
    }
  }

  await walk(tree);
  return tree;
}
