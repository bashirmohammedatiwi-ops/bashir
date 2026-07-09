import { fetchCategoryTree, mapTypesenseHit } from './categories.js';
import { typesenseSearch } from './client.js';
import {
  enrichMiswagCatalogFromBarcodeIndex,
  getMiswagCrawlCursor,
  getMiswagIndexStats,
  setMiswagCrawlCursor,
  setMiswagCrawlMeta,
  upsertMiswagProducts,
} from './catalog-index.js';

let crawlPromise = null;
let stopRequested = false;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** مهام زحف: كل قسم L1 رئيسي × صفحات Typesense — الجمال أولاً */
async function buildJobs() {
  const { tree = [] } = await fetchCategoryTree();
  let l1Ids = tree.map((n) => String(n.id || '')).filter(Boolean);
  // أولوية الجمال — يُستخدم غالباً في الاستيراد
  l1Ids = [
    ...l1Ids.filter((id) => id === 'beauty'),
    ...l1Ids.filter((id) => id !== 'beauty'),
  ];
  const jobs = [];

  for (const categoryId of l1Ids) {
    let found = 0;
    try {
      const probe = await typesenseSearch('*', {
        page: 1,
        perPage: 1,
        filterBy: `l1_division_alias:=\`${categoryId.replace(/`/g, '')}\``,
      });
      found = Number(probe.found || 0);
    } catch {
      found = 0;
    }
    const pages = Math.max(1, Math.min(200, Math.ceil(found / 250) || 1));
    for (let page = 1; page <= pages; page += 1) {
      jobs.push({ categoryId, page, pages });
    }
  }

  return jobs;
}

async function fetchCategoryPage({ categoryId, page }) {
  const filterBy = `l1_division_alias:=\`${String(categoryId).replace(/`/g, '')}\``;
  const { hits = [] } = await typesenseSearch('*', {
    page,
    perPage: 250,
    filterBy,
    sortBy: 'rating_count:desc',
  });

  return hits.map((h) => {
    const item = mapTypesenseHit(h.document || h);
    const doc = h.document || {};
    return {
      ...item,
      l1_alias: String(doc.l1_division_alias || categoryId || ''),
      l2_alias: String(doc.l2_division_alias || ''),
      l3_alias: String(doc.l3_division_alias || ''),
      categoryIds: [
        categoryId,
        doc.l1_division_alias,
        doc.l2_division_alias,
        doc.l3_division_alias,
        doc.l4_division_alias,
      ].filter(Boolean),
    };
  });
}

async function runCrawlLoop({ resume = true } = {}) {
  stopRequested = false;
  const jobs = await buildJobs();
  let cursor = resume ? getMiswagCrawlCursor() : 0;
  if (!resume) setMiswagCrawlCursor(0);

  setMiswagCrawlMeta({
    status: 'running',
    message: `تحميل بيانات مسواگ — ${jobs.length} صفحة`,
    progress: {
      done: cursor,
      total: jobs.length,
      category: '',
      page: 0,
      added: 0,
      errors: 0,
    },
  });

  let errors = 0;
  let addedTotal = 0;
  const delayMs = Math.max(150, Number(process.env.MISWAG_CRAWL_DELAY_MS) || 250);

  for (let i = cursor; i < jobs.length; i += 1) {
    if (stopRequested) {
      setMiswagCrawlMeta({
        status: 'paused',
        message: 'توقف التحميل مؤقتاً',
        progress: { done: i, total: jobs.length, errors, added: addedTotal },
      });
      setMiswagCrawlCursor(i);
      return getMiswagIndexStats();
    }

    const job = jobs[i];
    try {
      const items = await fetchCategoryPage(job);
      const added = upsertMiswagProducts(items, { categoryId: job.categoryId });
      addedTotal += added;
      setMiswagCrawlMeta({
        progress: {
          done: i + 1,
          total: jobs.length,
          category: job.categoryId,
          page: job.page,
          added: addedTotal,
          errors,
        },
      });
    } catch (err) {
      errors += 1;
      setMiswagCrawlMeta({
        progress: {
          done: i + 1,
          total: jobs.length,
          category: job.categoryId,
          page: job.page,
          added: addedTotal,
          errors,
        },
        message: `تحذير: ${err.message || 'خطأ Typesense'}`,
      });
    }

    setMiswagCrawlCursor(i + 1);
    await sleep(delayMs);
  }

  const enriched = enrichMiswagCatalogFromBarcodeIndex();

  setMiswagCrawlMeta({
    status: 'done',
    crawledAt: Date.now(),
    message: `اكتمل — ${getMiswagIndexStats().productCount.toLocaleString('ar-IQ')} منتج محفوظ محلياً${enriched ? ` · ${enriched} باركود` : ''}`,
    progress: {
      done: jobs.length,
      total: jobs.length,
      errors,
      added: addedTotal,
    },
  });
  setMiswagCrawlCursor(0);
  return getMiswagIndexStats();
}

/** بدء تحميل/تحديث الفهرس المحلي */
export function startMiswagCatalogCrawl({ resume = true, force = false } = {}) {
  const stats = getMiswagIndexStats();
  if (crawlPromise && !force) {
    return { started: false, reason: 'already_running', ...stats };
  }

  if (force) {
    setMiswagCrawlCursor(0);
    resume = false;
  }

  crawlPromise = runCrawlLoop({ resume })
    .catch((err) => {
      setMiswagCrawlMeta({ status: 'error', message: err.message || 'فشل التحميل' });
      return getMiswagIndexStats();
    })
    .finally(() => {
      crawlPromise = null;
    });

  return { started: true, ...getMiswagIndexStats() };
}

export function stopMiswagCatalogCrawl() {
  stopRequested = true;
  return getMiswagIndexStats();
}

export function getMiswagCrawlStatus() {
  return {
    ...getMiswagIndexStats(),
    running: Boolean(crawlPromise),
  };
}
