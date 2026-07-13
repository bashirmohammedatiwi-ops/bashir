import {
  AMAZON_ALL_CATEGORY,
  ITEM_RESOURCES,
  amazonCredentials,
  amazonSearchParams,
  paapiRequest,
} from './client.js';
import { fetchCategoryTree, AMAZON_SEED_TREE } from './categories.js';
import {
  getAmazonCrawlCursor,
  getAmazonIndexStats,
  setAmazonCrawlCursor,
  setAmazonCrawlMeta,
  upsertAmazonProducts,
} from './catalog-index.js';
import { mapListProduct } from './map.js';
import { scrapeSearchProducts } from './scrape.js';

/** كلمات تغطية لكل قسم — كل كلمة تفتح نافذة ~100 منتج مختلفة */
const NODE_KEYWORDS = {
  all: ['best sellers', 'laptop', 'phone', 'headphones', 'watch', 'shoes', 'kitchen', 'toys', 'book', 'camera'],
  '3760911': ['beauty', 'makeup', 'skincare', 'hair', 'perfume', 'cosmetic', 'serum', 'moisturizer'],
  '11058281': ['makeup', 'lipstick', 'foundation', 'mascara', 'concealer', 'blush', 'eyeliner', 'primer', 'bronzer', 'highlighter', 'setting spray', 'makeup palette'],
  '11060451': ['skincare', 'moisturizer', 'serum', 'cleanser', 'toner', 'sunscreen', 'retinol', 'vitamin c', 'face cream', 'eye cream', 'face mask', 'exfoliator'],
  '11057241': ['shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair serum', 'dry shampoo', 'hair spray', 'leave in', 'hair dye', 'scalp'],
  '11056381': ['perfume', 'cologne', 'eau de parfum', 'eau de toilette', 'fragrance mist', 'body mist', 'perfume set'],
  '3777891': ['makeup brush', 'beauty blender', 'eyelash curler', 'tweezers', 'mirror', 'makeup bag', 'facial roller'],
  '3778591': ['mens grooming', 'aftershave', 'beard oil', 'mens cologne', 'shaving cream', 'mens face wash'],
  '11062741': ['nail polish', 'gel nail', 'nail care', 'cuticle', 'nail art', 'base coat', 'top coat'],
  '10677469011': ['toothpaste', 'mouthwash', 'toothbrush', 'whitening', 'floss', 'oral care'],
  '3777331': ['body lotion', 'body wash', 'shower gel', 'hand cream', 'body scrub', 'bath bomb', 'deodorant'],
  '11058331': ['eyeshadow', 'mascara', 'eyeliner', 'eyebrow', 'false lashes', 'eye primer'],
  '11058691': ['lipstick', 'lip gloss', 'lip liner', 'lip balm', 'lip stain', 'lip oil'],
  '11059831': ['foundation', 'concealer', 'powder', 'primer', 'setting powder', 'bb cream', 'cc cream', 'contour'],
  '172282': ['laptop', 'tablet', 'headphones', 'speaker', 'camera', 'tv', 'monitor', 'smartwatch', 'router'],
  '2335752011': ['iphone', 'samsung galaxy', 'phone case', 'charger', 'wireless earbuds', 'screen protector'],
  '541966': ['laptop', 'desktop computer', 'monitor', 'keyboard', 'mouse', 'ssd', 'graphics card'],
  '1055398': ['kitchen', 'cookware', 'air fryer', 'vacuum', 'bedding', 'furniture', 'coffee maker'],
  '7141123011': ['dress', 'shoes', 'jeans', 'jacket', 'handbag', 'sneakers', 'activewear'],
  '3375251': ['fitness', 'camping', 'yoga', 'dumbbells', 'hiking', 'cycling', 'running shoes'],
  '165793011': ['lego', 'board games', 'action figures', 'puzzle', 'doll', 'remote control car'],
  '283155': ['fiction', 'cookbook', 'self help', 'children book', 'manga', 'textbook'],
  '16310101': ['snacks', 'coffee', 'tea', 'organic food', 'protein bar', 'spices'],
  '3760901': ['vitamins', 'supplements', 'cleaning supplies', 'paper towels', 'laundry detergent'],
  '2619533011': ['dog food', 'cat food', 'pet toys', 'cat litter', 'dog leash'],
  '15690151': ['car accessories', 'motor oil', 'tire', 'dash cam', 'car vacuum'],
  '228013': ['drill', 'power tools', 'screwdriver set', 'paint', 'light bulb', 'extension cord'],
  '1064954': ['printer paper', 'pen', 'notebook', 'desk organizer', 'stapler'],
  '165796011': ['diapers', 'baby formula', 'stroller', 'baby monitor', 'baby clothes'],
  '468642': ['playstation', 'xbox', 'nintendo switch', 'gaming headset', 'controller'],
  '11091801': ['guitar', 'keyboard piano', 'microphone', 'drum set', 'ukulele'],
  '2972638011': ['grill', 'patio furniture', 'garden tools', 'planter', 'outdoor lights'],
  '16310091': ['lab supplies', 'safety equipment', 'industrial tools', '3d printer filament'],
};

/** ماركات شائعة — نافذة بحث إضافية */
const POPULAR_BRANDS = [
  'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'LEGO', 'Instant Pot', 'Dyson',
  'Maybelline', 'LOreal', 'CeraVe', 'Neutrogena', 'The Ordinary', 'MAC', 'Dior',
  'KitchenAid', 'Philips', 'Bose', 'JBL', 'Anker', 'Logitech', 'HP', 'Dell',
];

/** ترتيب متنوع لفتح نوافذ نتائج مختلفة (حد PA-API ~100 لكل كلمة) */
const SORT_OPTIONS = [
  'Featured',
  'AvgCustomerReviews',
  'NewestArrivals',
];

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

let crawlPromise = null;
let stopRequested = false;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function itemsOf(result) {
  return result?.SearchResult?.Items || [];
}

function buildJobs(nodes = [], { scrapeMode = false } = {}) {
  const jobs = [];
  const nodeIds = nodes.length
    ? nodes.map((n) => String(n.id)).filter((id) => id !== AMAZON_ALL_CATEGORY)
    : AMAZON_SEED_TREE[0].children.map((c) => c.id);

  const crawlNodes = [...new Set([
    AMAZON_ALL_CATEGORY,
    ...nodeIds.slice(0, scrapeMode ? 16 : 50),
  ])];

  for (const node of crawlNodes) {
    const keywords = NODE_KEYWORDS[node] || NODE_KEYWORDS.all;
    const kwList = scrapeMode ? keywords.slice(0, 5) : keywords;
    const sorts = scrapeMode ? ['Featured'] : SORT_OPTIONS;
    for (const keyword of kwList) {
      for (const sort of sorts) {
        const maxPage = scrapeMode ? 6 : (sort === 'Featured' ? 8 : 4);
        for (let page = 1; page <= maxPage; page++) {
          jobs.push({ node, keyword, sort, page, kind: 'kw' });
        }
      }
    }
  }

  const brands = scrapeMode ? POPULAR_BRANDS.slice(0, 24) : POPULAR_BRANDS;
  for (const brand of brands) {
    for (let page = 1; page <= (scrapeMode ? 2 : 4); page++) {
      jobs.push({
        node: AMAZON_ALL_CATEGORY,
        keyword: brand,
        sort: 'Featured',
        page,
        kind: 'brand',
      });
    }
  }

  if (!scrapeMode) {
    for (const node of nodeIds.slice(0, 8)) {
      for (const letter of LETTERS.slice(0, 12)) {
        jobs.push({
          node,
          keyword: letter,
          sort: 'Featured',
          page: 1,
          kind: 'letter',
        });
      }
    }
  }

  return jobs;
}

async function fetchPagePaapi({ node, keyword, sort, page }) {
  const data = await paapiRequest('SearchItems', {
    ...amazonSearchParams(node),
    Keywords: keyword,
    ItemPage: page,
    ItemCount: 10,
    SortBy: sort,
    Resources: ITEM_RESOURCES,
    LanguagesOfPreference: ['en_US'],
  }, {
    ttl: 0,
    cacheKey: '',
  });

  return itemsOf(data).map((it) => mapListProduct(it, null)).filter(Boolean);
}

async function fetchPageScrape({ node, keyword, page }) {
  const data = await scrapeSearchProducts(keyword, {
    page,
    limit: 30,
    categoryId: node,
  });
  return data.items || [];
}

async function runCrawlLoop({ resume = true } = {}) {
  const scrapeMode = !amazonCredentials().configured;
  stopRequested = false;
  const tree = await fetchCategoryTree();
  const jobs = buildJobs(tree.leaves || [], { scrapeMode });
  let cursor = resume ? getAmazonCrawlCursor() : 0;
  if (!resume) setAmazonCrawlCursor(0);

  setAmazonCrawlMeta({
    status: 'running',
    message: scrapeMode
      ? `زحف أمازون (بدون مفاتيح): ${jobs.length} مهمة`
      : `زحف أمازون: ${jobs.length} مهمة`,
    progress: {
      done: cursor,
      total: jobs.length,
      errors: 0,
      added: 0,
      lastNode: '',
      lastKeyword: '',
      lastSort: '',
      lastPage: 0,
    },
  });

  let errors = 0;
  let addedTotal = 0;
  const delayMs = Math.max(
    scrapeMode ? 1800 : 900,
    Number(process.env.AMAZON_CRAWL_DELAY_MS) || (scrapeMode ? 2200 : 1100),
  );

  for (let i = cursor; i < jobs.length; i++) {
    if (stopRequested) {
      setAmazonCrawlMeta({
        status: 'paused',
        message: 'توقف الزحف مؤقتاً',
        progress: { done: i, total: jobs.length, errors, added: addedTotal },
      });
      setAmazonCrawlCursor(i);
      return getAmazonIndexStats();
    }

    const job = jobs[i];
    try {
      const items = scrapeMode
        ? await fetchPageScrape(job)
        : await fetchPagePaapi(job);
      const added = upsertAmazonProducts(items, { categoryId: job.node });
      addedTotal += added;

      if (job.node !== AMAZON_ALL_CATEGORY) {
        upsertAmazonProducts(items, { categoryId: AMAZON_ALL_CATEGORY });
      }
    } catch (err) {
      errors += 1;
      const msg = String(err?.message || err);
      if (/TooManyRequests|RequestThrottled|Quota|captcha|حظر/i.test(msg)) {
        await sleep(delayMs * 4);
      }
    }

    setAmazonCrawlCursor(i + 1);
    if (i % 3 === 0 || i === jobs.length - 1) {
      setAmazonCrawlMeta({
        status: 'running',
        message: `زحف أمازون… ${i + 1}/${jobs.length}`,
        progress: {
          done: i + 1,
          total: jobs.length,
          errors,
          added: addedTotal,
          lastNode: job.node,
          lastKeyword: job.keyword,
          lastSort: job.sort,
          lastPage: job.page,
        },
      });
    }

    await sleep(delayMs);
  }

  setAmazonCrawlMeta({
    status: 'done',
    crawledAt: Date.now(),
    message: `اكتمل الزحف — ${getAmazonIndexStats().productCount} منتج`,
    progress: {
      done: jobs.length,
      total: jobs.length,
      errors,
      added: addedTotal,
    },
  });
  setAmazonCrawlCursor(0);
  return getAmazonIndexStats();
}

/** بدء زحف خلفي (لا يُعاد تشغيله إن كان يعمل) */
export function startAmazonBeautyCrawl({ resume = true, force = false } = {}) {
  const stats = getAmazonIndexStats();
  if (crawlPromise && !force) {
    return { started: false, reason: 'already_running', ...stats };
  }
  if (!force && stats.status === 'done' && stats.productCount > 500 && Date.now() - (stats.crawledAt || 0) < 24 * 60 * 60 * 1000) {
    return { started: false, reason: 'fresh', ...stats };
  }

  crawlPromise = runCrawlLoop({ resume })
    .catch((err) => {
      setAmazonCrawlMeta({ status: 'error', message: err.message });
      return getAmazonIndexStats();
    })
    .finally(() => {
      crawlPromise = null;
    });

  return { started: true, ...getAmazonIndexStats() };
}

export function stopAmazonBeautyCrawl() {
  stopRequested = true;
  return getAmazonIndexStats();
}

export function getAmazonCrawlStatus() {
  return {
    ...getAmazonIndexStats(),
    running: Boolean(crawlPromise),
  };
}

/** إن كان الفهرس فارغاً — ابدأ الزحف (PA-API أو scrape بدون مفاتيح) */
export function ensureAmazonCatalogWarm() {
  const stats = getAmazonIndexStats();
  if (stats.productCount > 0 && (stats.status === 'running' || stats.status === 'done')) {
    if (stats.status !== 'running' && stats.productCount < 200) {
      return startAmazonBeautyCrawl({ resume: true });
    }
    return { started: false, reason: 'warm', ...stats };
  }
  return startAmazonBeautyCrawl({ resume: true });
}
