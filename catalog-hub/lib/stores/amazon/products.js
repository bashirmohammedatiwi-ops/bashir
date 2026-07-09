import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  BEAUTY_ROOT_NODE,
  DEFAULT_TTL,
  ITEM_RESOURCES,
  VARIATION_RESOURCES,
  amazonCredentials,
  paapiRequest,
} from './client.js';
import {
  findAmazonByBarcode,
  getAmazonIndexStats,
  loadAmazonIndex,
  queryAmazonIndex,
  upsertAmazonProducts,
} from './catalog-index.js';
import { mapDetailProduct, mapListProduct } from './map.js';
import {
  normalizeAmazonImageUrl,
  scrapeBarcode,
  scrapeProductDetail,
  scrapeSearchProducts,
} from './scrape.js';

/** احتياطي من الفهرس المحلي عندما يفشل scrape (كابتشا/حظر) */
function detailFromIndex(asin) {
  const row = loadAmazonIndex().products?.[String(asin || '').toUpperCase()];
  if (!row?.id) return null;
  const thumb = normalizeAmazonImageUrl(row.thumb || '', 500);
  return {
    id: row.id,
    parentAsin: row.id,
    sku: row.sku || row.id,
    barcode: row.barcode || '',
    nameAr: row.nameAr || row.nameEn || '',
    nameEn: row.nameEn || row.nameAr || '',
    brandAr: row.brandAr || '',
    brandEn: row.brandEn || row.brandAr || '',
    descriptionAr: '',
    descriptionEn: '',
    thumb,
    images: thumb ? [normalizeAmazonImageUrl(thumb, 1000)] : [],
    price: row.price || '',
    category: row.category || 'Beauty',
    productUrl: row.url || `https://www.amazon.com/dp/${row.id}`,
    inStock: true,
    shades: [{
      id: row.id,
      nameAr: row.nameAr || row.nameEn || '',
      nameEn: row.nameEn || row.nameAr || '',
      sku: row.id,
      barcode: row.barcode || '',
      image: thumb,
      price: row.price || '',
      inStock: true,
      colorHex: '',
      optionGroup: '',
    }],
    shadeCount: Number(row.shadeCount || 1),
    hasOptions: Number(row.shadeCount || 1) > 1,
    source: 'index',
    softDetail: true,
  };
}

function usePaapi() {
  return amazonCredentials().configured;
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

async function liveSearchPaapi(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const q = String(query || '').trim();
  const node = String(categoryId || BEAUTY_ROOT_NODE);
  const itemPage = Math.max(1, Math.min(10, page));
  const itemCount = Math.max(1, Math.min(10, limit));

  const body = {
    SearchIndex: 'Beauty',
    BrowseNodeId: node,
    ItemPage: itemPage,
    ItemCount: itemCount,
    Resources: ITEM_RESOURCES,
    LanguagesOfPreference: ['en_US'],
    Keywords: q || categoryBrowseKeyword(node),
  };

  const data = await paapiRequest('SearchItems', body, {
    ttl: DEFAULT_TTL / 2,
    cacheKey: `amazon:search:${node}:${body.Keywords}:${itemPage}:${itemCount}`,
  });

  const items = await enrichBilingual(itemsOf(data));
  upsertAmazonProducts(items, { categoryId: node });
  if (node !== BEAUTY_ROOT_NODE) {
    upsertAmazonProducts(items, { categoryId: BEAUTY_ROOT_NODE });
  }

  const total = totalOf(data);
  return {
    items,
    page: itemPage,
    pageSize: itemCount,
    total,
    hasMore: itemPage * itemCount < Math.min(total, 100),
    source: 'live',
  };
}

async function liveSearchScrape(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const data = await scrapeSearchProducts(query, { page, limit, categoryId });
  if (!data.softBlocked && data.items?.length) {
    upsertAmazonProducts(data.items, { categoryId: categoryId || BEAUTY_ROOT_NODE });
    if (categoryId && categoryId !== BEAUTY_ROOT_NODE) {
      upsertAmazonProducts(data.items, { categoryId: BEAUTY_ROOT_NODE });
    }
  }
  return data;
}

/**
 * مثل باقي المتاجر: التصفح/البحث من الفهرس المحلي،
 * مع جلب حيّ (PA-API إن وُجدت مفاتيح، وإلا scrape HTML).
 */
export async function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  // لا تبدأ زحفاً ثقيلاً من كل بحث — فقط عند التصفح الصريح أو POST /crawl
  const q = String(query || '').trim();
  const node = String(categoryId || BEAUTY_ROOT_NODE);
  const stats = getAmazonIndexStats();
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Math.min(60, Number(limit) || 30));

  const indexed = queryAmazonIndex({
    query: q,
    categoryId: node,
    page: pageNum,
    limit: pageSize,
  });

  if (indexed.total >= pageNum * pageSize || (indexed.total > 0 && pageNum > 1)) {
    return indexed;
  }

  const liveFn = usePaapi() ? liveSearchPaapi : liveSearchScrape;

  if (pageNum === 1) {
    try {
      const live = await liveFn(q, { page: 1, limit: Math.min(usePaapi() ? 10 : 30, pageSize), categoryId: node });
      // captcha ناعم — لا نرمي خطأ؛ نعرض الفهرس إن وُجد
      if (live.softBlocked) {
        return indexed.total > 0
          ? { ...indexed, softBlocked: true, message: live.message }
          : { ...live, items: [], total: 0, hasMore: false };
      }
      const merged = queryAmazonIndex({
        query: q,
        categoryId: node,
        page: 1,
        limit: pageSize,
      });
      if (merged.total > 0) {
        return {
          ...merged,
          hasMore: merged.hasMore || stats.status === 'running' || live.hasMore,
        };
      }
      return live;
    } catch (err) {
      // أي فشل حيّ → فهرس محلي بدل رسالة حمراء
      if (indexed.total > 0) return { ...indexed, softBlocked: true };
      return {
        items: [],
        page: 1,
        pageSize,
        total: 0,
        hasMore: false,
        source: 'index',
        softBlocked: true,
        message: err?.message || 'تعذّر جلب Amazon مؤقتاً',
      };
    }
  }

  if (pageNum <= 20) {
    try {
      const live = await liveFn(q, {
        page: pageNum,
        limit: Math.min(usePaapi() ? 10 : 30, pageSize),
        categoryId: node,
      });
      if (live.softBlocked) return indexed;
      const merged = queryAmazonIndex({
        query: q,
        categoryId: node,
        page: pageNum,
        limit: pageSize,
      });
      return merged.total >= live.items.length ? merged : live;
    } catch {
      return indexed;
    }
  }

  return indexed;
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  // تصفح أمازون فقط — لا يبدأ زحفاً خلفياً ثقيلاً (يحمي مسواگ)
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
  const asin = String(id || '').trim().toUpperCase();
  if (!asin) return null;

  // المسار الافتراضي النهائي: scrape ثنائي اللغة + كل التدرجات
  // PA-API يُستخدم فقط إن وُجدت مفاتيح وطلب صريح عبر AMAZON_FORCE_PAAPI=1
  if (!usePaapi() || process.env.AMAZON_FORCE_PAAPI !== '1') {
    let detail = null;
    try {
      detail = await scrapeProductDetail(asin, { light });
    } catch {
      detail = null;
    }
    if (!detail) {
      // البطاقة ظهرت من البحث — لا تُرجع 404؛ أعرض بيانات الفهرس/البحث
      detail = detailFromIndex(asin);
    }
    if (detail) {
      upsertAmazonProducts([{
        id: detail.id,
        nameAr: detail.nameAr,
        nameEn: detail.nameEn,
        brandAr: detail.brandAr,
        brandEn: detail.brandEn,
        thumb: normalizeAmazonImageUrl(detail.thumb || '', 500),
        price: detail.price,
        barcode: detail.barcode,
        sku: detail.sku,
        category: detail.category,
        shadeCount: detail.shadeCount,
        categoryIds: [BEAUTY_ROOT_NODE],
      }], { categoryId: BEAUTY_ROOT_NODE });
      detail.thumb = normalizeAmazonImageUrl(detail.thumb || '', 500);
      detail.images = (detail.images || []).map((u) => normalizeAmazonImageUrl(u, 1000)).filter(Boolean);
      if (Array.isArray(detail.shades)) {
        detail.shades = detail.shades.map((s) => ({
          ...s,
          image: normalizeAmazonImageUrl(s.image || '', 500),
        }));
      }
    }
    return detail;
  }

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
    if (!variations.length && parent !== asin) {
      variations = await fetchVariations(asin);
    }
  }

  const detail = mapDetailProduct(enItem, arItem, variations);
  if (detail) {
    upsertAmazonProducts([{
      ...detail,
      categoryIds: [BEAUTY_ROOT_NODE],
    }], { categoryId: BEAUTY_ROOT_NODE });
  }
  cacheSet(cacheKey, detail);
  return detail;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8 && !/^[A-Z0-9]{10}$/i.test(String(code || '').trim())) return [];

  if (/^[A-Z0-9]{10}$/i.test(String(code || '').trim())) {
    const detail = await fetchProductDetail(String(code).trim().toUpperCase(), { light: true }).catch(() => null);
    return detail ? [{
      ...detail,
      barcode: detail.barcode || digits,
      matchType: 'asin',
      shadeCount: detail.shadeCount,
    }] : [];
  }

  const indexed = findAmazonByBarcode(digits);
  if (indexed) {
    return [{
      ...indexed,
      barcode: digits,
      matchType: 'index',
      shadeCount: indexed.shadeCount || 1,
    }];
  }

  if (!usePaapi()) {
    const hits = await scrapeBarcode(digits);
    // احفظ في الفهرس حتى لا يفشل فتح التفاصيل لاحقاً عند الكابتشا
    if (hits.length) {
      upsertAmazonProducts(
        hits.map((h) => ({
          ...h,
          thumb: normalizeAmazonImageUrl(h.thumb || '', 500),
          categoryIds: [BEAUTY_ROOT_NODE],
        })),
        { categoryId: BEAUTY_ROOT_NODE },
      );
    }
    return hits.map((h) => ({
      ...h,
      thumb: normalizeAmazonImageUrl(h.thumb || '', 500),
    }));
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
  upsertAmazonProducts(items, { categoryId: BEAUTY_ROOT_NODE });
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
