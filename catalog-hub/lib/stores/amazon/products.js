import { cacheGet, cacheSet } from '../../core/cache.js';
import { IMPORT_SIZE, normalizeAmazonImageUrl } from '../../core/images.js';
import {
  AMAZON_ALL_CATEGORY,
  DEFAULT_TTL,
  ITEM_RESOURCES,
  VARIATION_RESOURCES,
  amazonCredentials,
  amazonSearchParams,
  paapiRequest,
} from './client.js';
import {
  findAmazonByBarcode,
  getAmazonIndexStats,
  loadAmazonIndex,
  queryAmazonIndex,
  upsertAmazonProducts,
} from './catalog-index.js';
import { mapDetailProduct, mapListProduct, mapShadeFromVariation } from './map.js';
import { resolveRichestParentAsin, scrapeBarcode, scrapeProductDetail, scrapeSearchProducts } from './scrape.js';

/** احتياطي من الفهرس المحلي عندما يفشل scrape (كابتشا/حظر) */
function detailFromIndex(asin) {
  const row = loadAmazonIndex().products?.[String(asin || '').toUpperCase()];
  if (!row?.id) return null;
  const thumb = normalizeAmazonImageUrl(row.thumb || '', IMPORT_SIZE);
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
    images: thumb ? [normalizeAmazonImageUrl(thumb, IMPORT_SIZE)] : [],
    price: row.price || '',
    category: row.category || 'Amazon',
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

/** كلمات تصفح لكل قسم — أدق من كلمة عامة */
function categoryBrowseKeyword(categoryId = '') {
  const map = {
    all: 'best sellers',
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
    '172282': 'electronics',
    '2335752011': 'smartphone',
    '541966': 'laptop computer',
    '1055398': 'home kitchen',
    '7141123011': 'clothing fashion',
    '3375251': 'sports outdoors',
    '165793011': 'toys games',
    '283155': 'books',
    '16310101': 'grocery food',
    '3760901': 'health household',
    '2619533011': 'pet supplies',
    '15690151': 'automotive',
    '228013': 'tools home improvement',
    '1064954': 'office supplies',
    '165796011': 'baby products',
    '468642': 'video games',
    '11091801': 'musical instruments',
    '2972638011': 'patio garden',
    '16310091': 'industrial scientific',
  };
  return map[String(categoryId)] || 'best sellers';
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
  const node = String(categoryId || AMAZON_ALL_CATEGORY);
  const itemPage = Math.max(1, Math.min(10, page));
  const itemCount = Math.max(1, Math.min(10, limit));

  const body = {
    ...amazonSearchParams(node),
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
  if (node !== AMAZON_ALL_CATEGORY) {
    upsertAmazonProducts(items, { categoryId: AMAZON_ALL_CATEGORY });
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
    const node = categoryId || AMAZON_ALL_CATEGORY;
    upsertAmazonProducts(data.items, { categoryId: node });
    if (node !== AMAZON_ALL_CATEGORY) {
      upsertAmazonProducts(data.items, { categoryId: AMAZON_ALL_CATEGORY });
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
  const node = String(categoryId || AMAZON_ALL_CATEGORY);
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
  return searchProducts('', { page, limit, categoryId: categoryId || AMAZON_ALL_CATEGORY });
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

function normalizeDetailImages(detail) {
  if (!detail) return detail;
  detail.thumb = normalizeAmazonImageUrl(detail.thumb || '', IMPORT_SIZE);
  detail.images = (detail.images || []).map((u) => normalizeAmazonImageUrl(u, IMPORT_SIZE)).filter(Boolean);
  if (Array.isArray(detail.shades)) {
    detail.shades = detail.shades.map((s) => ({
      ...s,
      image: normalizeAmazonImageUrl(s.image || '', IMPORT_SIZE),
      swatchImage: normalizeAmazonImageUrl(s.swatchImage || '', IMPORT_SIZE),
    }));
  }
  return detail;
}

function mergePaapiShades(detail, asin) {
  if (!detail || !usePaapi()) return detail;
  const parent = detail.parentAsin || asin;
  return fetchVariations(parent)
    .catch(() => [])
    .then(async (variations) => {
      if (!variations.length && parent !== asin) {
        variations = await fetchVariations(asin).catch(() => []);
      }
      if (!variations.length) return detail;

      const paShades = variations.map((v, i) => mapShadeFromVariation(v, i));
      const byId = new Map((detail.shades || []).map((s) => [String(s.id || s.sku || '').toUpperCase(), s]));

      for (const pa of paShades) {
        const id = String(pa.id || pa.sku || '').toUpperCase();
        if (!id) continue;
        const prev = byId.get(id);
        if (prev) {
          byId.set(id, {
            ...prev,
            barcode: prev.barcode || pa.barcode,
            price: prev.price || pa.price,
            image: prev.image || pa.image,
            swatchImage: prev.swatchImage || pa.swatchImage || pa.image,
            colorHex: prev.colorHex || pa.colorHex,
            nameEn: prev.nameEn || pa.nameEn,
            nameAr: prev.nameAr || pa.nameAr,
            optionGroup: prev.optionGroup || pa.optionGroup,
          });
        } else {
          byId.set(id, pa);
        }
      }

      const shades = [...byId.values()].filter((s) => s.nameEn || s.nameAr || s.image || s.swatchImage);
      return {
        ...detail,
        shades,
        shadeCount: shades.length,
        hasOptions: shades.length > 1,
      };
    });
}

function rememberAmazonDetail(detail) {
  if (!detail?.id) return;
  upsertAmazonProducts([{
    id: detail.id,
    nameAr: detail.nameAr,
    nameEn: detail.nameEn,
    brandAr: detail.brandAr,
    brandEn: detail.brandEn,
    thumb: normalizeAmazonImageUrl(detail.thumb || '', IMPORT_SIZE),
    price: detail.price,
    barcode: detail.barcode,
    barcodes: detail.barcodes || [],
    sku: detail.sku,
    category: detail.category,
    shadeCount: detail.shadeCount || detail.shades?.length || 1,
    categoryIds: [AMAZON_ALL_CATEGORY],
  }], { categoryId: AMAZON_ALL_CATEGORY });
}

function mergeAmazonLightFull(base, full) {
  if (!base && !full) return null;
  if (!base) return full;
  if (!full) return base;
  const baseShades = base.shades?.length || 0;
  const fullShades = full.shades?.length || 0;
  if (baseShades <= fullShades) return full;
  const byId = new Map((full.shades || []).map((s) => [String(s.id || s.sku || '').toUpperCase(), s]));
  const shades = (base.shades || []).map((s) => {
    const key = String(s.id || s.sku || '').toUpperCase();
    const enriched = byId.get(key);
    return enriched ? {
      ...s,
      ...enriched,
      nameAr: s.nameAr || enriched.nameAr,
      nameEn: s.nameEn || enriched.nameEn,
      image: enriched.image || s.image,
      swatchImage: enriched.swatchImage || s.swatchImage,
      barcode: enriched.barcode || s.barcode,
      colorHex: enriched.colorHex || s.colorHex,
      price: enriched.price || s.price,
    } : s;
  });
  const seen = new Set(shades.map((s) => String(s.id || s.sku || '').toUpperCase()));
  for (const s of full.shades || []) {
    const key = String(s.id || s.sku || '').toUpperCase();
    if (key && !seen.has(key)) shades.push(s);
  }
  return {
    ...full,
    ...base,
    descriptionAr: full.descriptionAr || base.descriptionAr,
    descriptionEn: full.descriptionEn || base.descriptionEn,
    barcode: full.barcode || base.barcode,
    barcodes: [...new Set([...(full.barcodes || []), ...(base.barcodes || [])])],
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1,
  };
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const asin = String(id || '').trim().toUpperCase();
  if (!asin) return null;

  // المسار الافتراضي النهائي: scrape ثنائي اللغة + كل التدرجات
  // PA-API يُستخدم فقط إن وُجدت مفاتيح وطلب صريح عبر AMAZON_FORCE_PAAPI=1
  if (!usePaapi() || process.env.AMAZON_FORCE_PAAPI !== '1') {
    const canonical = await resolveRichestParentAsin(asin);
    const matchedChild = canonical !== asin ? asin : '';

    let detail = null;
    try {
      if (light) {
        detail = await scrapeProductDetail(canonical, {
          light: true,
          skipRedirect: true,
          matchedChildAsin: matchedChild,
        });
      } else {
        const [base, full] = await Promise.all([
          scrapeProductDetail(canonical, {
            light: true,
            skipRedirect: true,
            matchedChildAsin: matchedChild,
          }).catch(() => null),
          scrapeProductDetail(canonical, {
            light: false,
            skipRedirect: true,
            matchedChildAsin: matchedChild,
          }).catch(() => null),
        ]);
        detail = mergeAmazonLightFull(base, full) || full || base;
      }
    } catch {
      detail = null;
    }

    if (!detail) {
      detail = detailFromIndex(canonical) || detailFromIndex(asin);
    }

    if (detail) {
      detail.id = canonical;
      detail.parentAsin = canonical;
      detail.sku = canonical;
      detail = await mergePaapiShades(detail, canonical);
      normalizeDetailImages(detail);
      rememberAmazonDetail(detail);
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
      categoryIds: [AMAZON_ALL_CATEGORY],
    }], { categoryId: AMAZON_ALL_CATEGORY });
  }
  cacheSet(cacheKey, detail);
  return detail;
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8 && !/^[A-Z0-9]{10}$/i.test(String(code || '').trim())) return [];

  if (/^[A-Z0-9]{10}$/i.test(String(code || '').trim())) {
    const raw = String(code).trim().toUpperCase();
    const detail = await fetchProductDetail(raw, { light: true }).catch(() => null);
    if (!detail) return [];
    const parent = String(detail.id || detail.parentAsin || raw).toUpperCase();
    const shadeHit = (detail.shades || []).find(
      (s) => String(s.id || s.sku || '').toUpperCase() === raw,
    );
    return [{
      ...detail,
      id: parent,
      parentAsin: parent,
      sku: parent,
      listingAsin: raw !== parent ? raw : undefined,
      matchedChildAsin: raw !== parent ? raw : '',
      barcode: detail.barcode || shadeHit?.barcode || '',
      shadeName: shadeHit?.nameAr || shadeHit?.nameEn || detail.matchedShadeName || '',
      matchedShadeName: shadeHit?.nameAr || shadeHit?.nameEn || detail.matchedShadeName || '',
      matchType: 'asin',
      shadeCount: detail.shades?.length || detail.shadeCount || 1,
    }];
  }

  const indexed = findAmazonByBarcode(digits);

  if (!usePaapi()) {
    const hits = await scrapeBarcode(digits);
    // احفظ في الفهرس — ولا تعتمد على فهرس قديم بدرجة واحدة
    if (hits.length) {
      upsertAmazonProducts(
        hits.map((h) => ({
          ...h,
          barcode: h.barcode || digits,
          barcodes: [...new Set([...(h.barcodes || []), h.barcode, digits].filter(Boolean))],
          thumb: normalizeAmazonImageUrl(h.thumb || '', IMPORT_SIZE),
          shadeCount: h.shadeCount || h.shades?.length || 1,
          categoryIds: [AMAZON_ALL_CATEGORY],
        })),
        { categoryId: AMAZON_ALL_CATEGORY },
      );
      return hits.map((h) => ({
        ...h,
        id: String(h.parentAsin || h.id || '').toUpperCase(),
        parentAsin: String(h.parentAsin || h.id || '').toUpperCase(),
        thumb: normalizeAmazonImageUrl(h.thumb || '', IMPORT_SIZE),
        shadeCount: h.shadeCount || h.shades?.length || 1,
      }));
    }
  }

  if (indexed) {
    return [{
      ...indexed,
      barcode: digits,
      barcodes: [...new Set([...(indexed.barcodes || []), indexed.barcode, digits].filter(Boolean))],
      thumb: normalizeAmazonImageUrl(indexed.thumb || '', IMPORT_SIZE),
      matchType: 'index',
      shadeCount: indexed.shadeCount || 1,
    }];
  }

  if (!usePaapi()) {
    return [];
  }

  const data = await paapiRequest('SearchItems', {
    ...amazonSearchParams(AMAZON_ALL_CATEGORY),
    Keywords: digits,
    ItemCount: 10,
    ItemPage: 1,
    Resources: ITEM_RESOURCES,
    LanguagesOfPreference: ['en_US'],
  }, { ttl: DEFAULT_TTL, cacheKey: `amazon:barcode:${digits}` });

  const items = await enrichBilingual(itemsOf(data));
  upsertAmazonProducts(items, { categoryId: AMAZON_ALL_CATEGORY });
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
