import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  BEAUTY_ROOT_NODE,
  DEFAULT_TTL,
  ITEM_RESOURCES,
  VARIATION_RESOURCES,
  amazonCredentials,
  paapiRequest,
} from './client.js';
import { mapDetailProduct, mapListProduct } from './map.js';

function assertConfigured() {
  const creds = amazonCredentials();
  if (!creds.configured) {
    throw new Error(
      'Amazon Beauty يحتاج مفاتيح PA-API: AMAZON_ACCESS_KEY و AMAZON_SECRET_KEY و AMAZON_PARTNER_TAG',
    );
  }
  return creds;
}

/** كلمات تصفح لكل قسم Beauty — أدق من «beauty» العامة */
function categoryBrowseKeyword(categoryId = '') {
  const map = {
    '3760911': 'beauty',
    '11058281': 'makeup',
    '11060451': 'skincare',
    '11057241': 'hair care',
    '11056381': 'perfume',
    '3777891': 'beauty tools',
    '3778591': 'mens grooming',
    '11062741': 'nail polish',
    '10677469011': 'oral care',
    '3777331': 'bath body',
    '11058331': 'eyeshadow',
    '11058691': 'lipstick',
    '11059831': 'foundation',
  };
  return map[String(categoryId)] || 'beauty';
}

function itemsOf(result) {
  return result?.SearchResult?.Items
    || result?.ItemsResult?.Items
    || result?.VariationsResult?.Items
    || [];
}

function totalOf(result) {
  return Number(result?.SearchResult?.TotalResultCount || itemsOf(result).length || 0);
}

/** جلب عناوين عربية من سوق بديل (amazon.ae) إن وُجدت مفاتيحه */
async function fetchArabicTitles(asins = []) {
  const creds = amazonCredentials();
  const ids = [...new Set(asins.map(String).filter(Boolean))].slice(0, 10);
  if (!ids.length || !creds.partnerTagAr || !creds.marketplaceAr) return new Map();
  if (creds.marketplaceAr === creds.marketplace) return new Map();

  try {
    const data = await paapiRequest('GetItems', {
      ItemIds: ids,
      Resources: ['ItemInfo.Title', 'ItemInfo.ByLineInfo', 'ItemInfo.Features', 'Images.Primary.Large'],
      LanguagesOfPreference: ['ar_AE'],
    }, {
      marketplace: creds.marketplaceAr,
      ttl: DEFAULT_TTL,
      cacheKey: `amazon:ar-titles:${ids.join(',')}`,
    });
    return new Map(itemsOf(data).map((it) => [String(it.ASIN), it]));
  } catch {
    return new Map();
  }
}

async function enrichBilingual(enItems = []) {
  const arMap = await fetchArabicTitles(enItems.map((i) => i.ASIN));
  return enItems
    .map((en) => mapListProduct(en, arMap.get(String(en.ASIN)) || null))
    .filter(Boolean);
}

export async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  assertConfigured();
  const q = String(query || '').trim();
  const node = String(categoryId || BEAUTY_ROOT_NODE);
  const itemPage = Math.max(1, Math.min(10, page)); // PA-API: max 10 pages
  const itemCount = Math.max(1, Math.min(10, limit)); // PA-API: max 10 / request

  const body = {
    SearchIndex: 'Beauty',
    BrowseNodeId: node,
    ItemPage: itemPage,
    ItemCount: itemCount,
    Resources: ITEM_RESOURCES,
    LanguagesOfPreference: ['en_US'],
  };

  // SearchItems يتطلب Keywords أو Brand/Title — عند التصفح نستخدم كلمة عامة داخل القسم
  body.Keywords = q || categoryBrowseKeyword(node);

  const data = await paapiRequest('SearchItems', body, {
    ttl: DEFAULT_TTL / 2,
    cacheKey: `amazon:search:${node}:${body.Keywords}:${itemPage}:${itemCount}`,
  });

  const items = await enrichBilingual(itemsOf(data));
  const total = totalOf(data);
  return {
    items,
    page: itemPage,
    pageSize: itemCount,
    total,
    hasMore: itemPage * itemCount < Math.min(total, 100), // PA-API يحدّ النتائج بـ ~100
  };
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  return searchProducts('', { page, limit, categoryId: categoryId || BEAUTY_ROOT_NODE });
}

async function fetchVariations(asin) {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const data = await paapiRequest('GetVariations', {
        ASIN: String(asin),
        VariationCount: 10,
        VariationPage: page,
        Resources: VARIATION_RESOURCES,
        LanguagesOfPreference: ['en_US'],
      }, {
        ttl: DEFAULT_TTL,
        cacheKey: `amazon:vars:${asin}:${page}`,
      });
      const batch = itemsOf(data);
      if (!batch.length) break;
      all.push(...batch);
      const total = Number(data?.VariationsResult?.VariationCount || 0);
      if (all.length >= total || batch.length < 10) break;
    } catch {
      break;
    }
  }
  return all;
}

export async function fetchProductDetail(id, { light = false } = {}) {
  assertConfigured();
  const asin = String(id || '').trim().toUpperCase();
  if (!asin) return null;

  const cacheKey = `amazon:detail:${asin}:${light ? 'light' : 'full'}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const data = await paapiRequest('GetItems', {
    ItemIds: [asin],
    Resources: ITEM_RESOURCES,
    LanguagesOfPreference: ['en_US'],
  }, { ttl: DEFAULT_TTL, cacheKey: `amazon:item:${asin}` });

  const enItem = itemsOf(data)[0];
  if (!enItem) return null;

  const arMap = await fetchArabicTitles([asin]);
  const arItem = arMap.get(asin) || null;

  let variations = [];
  if (!light) {
    const parent = enItem.ParentASIN || asin;
    variations = await fetchVariations(parent);
    // إن لم تُرجع تدرجات للأب، جرّب ASIN نفسه
    if (!variations.length && parent !== asin) {
      variations = await fetchVariations(asin);
    }
  }

  const detail = mapDetailProduct(enItem, arItem, variations);
  cacheSet(cacheKey, detail);
  return detail;
}

export async function searchBarcode(code) {
  assertConfigured();
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  // ASIN مباشر؟
  if (/^[A-Z0-9]{10}$/i.test(String(code || '').trim())) {
    const detail = await fetchProductDetail(String(code).trim().toUpperCase(), { light: true }).catch(() => null);
    return detail ? [{
      ...detail,
      barcode: detail.barcode || digits,
      matchType: 'asin',
      shadeCount: detail.shadeCount,
    }] : [];
  }

  const data = await paapiRequest('SearchItems', {
    SearchIndex: 'Beauty',
    BrowseNodeId: BEAUTY_ROOT_NODE,
    Keywords: digits,
    ItemCount: 10,
    ItemPage: 1,
    Resources: ITEM_RESOURCES,
    LanguagesOfPreference: ['en_US'],
  }, { ttl: DEFAULT_TTL, cacheKey: `amazon:barcode:${digits}` });

  const items = await enrichBilingual(itemsOf(data));
  const exact = items.filter((p) => p.barcode === digits || p.sku === digits);
  const hits = exact.length ? exact : items.slice(0, 5);

  return hits.map((item) => ({
    ...item,
    barcode: digits,
    matchType: exact.some((e) => e.id === item.id) ? 'sku' : 'keyword',
  }));
}

export function sortProductsClient(items = [], sort = 'default') {
  const list = [...items];
  const priceOf = (p) => Number(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
  if (sort === 'price_asc') list.sort((a, b) => priceOf(a) - priceOf(b));
  else if (sort === 'price_desc') list.sort((a, b) => priceOf(b) - priceOf(a));
  else if (sort === 'name') list.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
  return list;
}
