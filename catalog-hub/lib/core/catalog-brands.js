/**
 * تجميع براندات المتاجر مع إزالة التكرار ودمج الشعارات.
 * الأولوية: شعار حقيقي من المتجر > صورة منتج عيّنة من أي متجر.
 */

import { typesenseMultiSearch } from '../stores/miswag/client.js';
import { createSallaClient, absImage as sallaAbs } from '../stores/salla/client.js';
import { searchIndex, absImage as elryanAbs } from '../stores/elryan/client.js';
import { loadAmazonIndex } from '../stores/amazon/catalog-index.js';
import { normalizeAmazonImageUrl } from '../stores/amazon/scrape.js';
import { fetchListingHtml } from '../stores/faces/client.js';
import { parseListingHtml } from '../stores/faces/parse.js';
import { algoliaSearch } from '../stores/miraaya/client.js';
import { getStoreAdapter } from '../stores/registry.js';
import { cacheGet, cacheSet } from './cache.js';
import { brandMatchKeys, normalizeBrandKey, preferBrandDisplayName } from './brand-normalize.js';

const CACHE_KEY = 'catalog:brands:v2';
const CACHE_TTL = 30 * 60 * 1000;

const FACES_BRAND_CATEGORIES = ['makeup', 'perfume', 'skincare', 'haircare', 'body-care', 'men-beauty-products'];

export { normalizeBrandKey };

function preferName(a = '', b = '') {
  const x = String(a || '').trim();
  const y = String(b || '').trim();
  if (x && y) {
    if (/[A-Za-z]/.test(x) && !/[A-Za-z]/.test(y)) return x;
    if (/[A-Za-z]/.test(y) && !/[A-Za-z]/.test(x)) return y;
    return x.length >= y.length ? x : y;
  }
  return x || y;
}

function logoPriority(logoUrl = '', isProductImage = false) {
  if (!logoUrl) return 0;
  return isProductImage ? 1 : 2;
}

function mergeBrand(map, row) {
  const keys = brandMatchKeys(row.name, row.nameEn, row.nameAr);
  if (!keys.length) return;

  let prev = null;
  for (const key of keys) {
    if (map.has(key)) {
      prev = map.get(key);
      break;
    }
  }

  if (!prev) {
    prev = {
      keys: new Set(),
      name: '',
      nameAr: '',
      nameEn: '',
      logoUrl: '',
      logoIsProductImage: false,
      productImageUrl: '',
      productCount: 0,
      stores: [],
    };
  }

  const name = preferName(row.name, preferName(row.nameEn, row.nameAr));
  const logoUrl = String(row.logoUrl || '').trim();
  const productImageUrl = String(row.productImageUrl || '').trim();
  const stores = new Set([...(prev.stores || []), ...(row.stores || [])].filter(Boolean));

  const incomingUrl = logoUrl || productImageUrl;
  const incomingIsProduct = logoUrl ? false : Boolean(productImageUrl);
  const incomingPriority = logoPriority(incomingUrl, incomingIsProduct);
  const currentPriority = logoPriority(prev.logoUrl, prev.logoIsProductImage);

  let nextLogo = prev.logoUrl;
  let nextLogoIsProduct = prev.logoIsProductImage;
  if (incomingUrl && incomingPriority >= currentPriority) {
    nextLogo = logoUrl || productImageUrl;
    nextLogoIsProduct = !logoUrl && Boolean(productImageUrl);
  }

  const merged = {
    keys: prev.keys,
    name: preferName(prev.name, name) || name,
    nameAr: preferName(prev.nameAr, row.nameAr) || '',
    nameEn: preferName(prev.nameEn, row.nameEn) || '',
    logoUrl: nextLogo || '',
    logoIsProductImage: Boolean(nextLogo && nextLogoIsProduct),
    productImageUrl: productImageUrl || prev.productImageUrl || '',
    productCount: Math.max(prev.productCount || 0, Number(row.productCount || 0) || 0),
    stores: [...stores],
  };

  for (const key of new Set([...keys, ...merged.keys])) {
    merged.keys.add(key);
    map.set(key, merged);
  }
}

async function collectMiswagBrands(map) {
  try {
    const [facetRes = {}] = await typesenseMultiSearch([{
      q: '*',
      query_by: 'title_AR',
      facet_by: 'brand',
      max_facet_values: 1000,
      per_page: 1,
    }]);
    const counts = facetRes.facet_counts?.[0]?.counts || [];

    const top = counts.slice(0, 300);
    for (let i = 0; i < top.length; i += 10) {
      const chunk = top.slice(i, i + 10);
      const samples = await Promise.all(
        chunk.map(async (c) => {
          const brand = String(c.value || '').trim();
          if (!brand) return null;
          try {
            const [hit = {}] = await typesenseMultiSearch([{
              q: '*',
              query_by: 'title_AR',
              filter_by: `brand:=\`${brand.replace(/`/g, '')}\``,
              per_page: 1,
              page: 1,
            }]);
            const doc = hit.hits?.[0]?.document || {};
            return {
              name: brand,
              nameEn: brand,
              nameAr: brand,
              productImageUrl: String(doc.image || doc.image_url || '').trim(),
              productCount: Number(c.count || 0),
              stores: ['miswag'],
            };
          } catch {
            return {
              name: brand,
              nameEn: brand,
              productCount: Number(c.count || 0),
              stores: ['miswag'],
            };
          }
        }),
      );
      for (const row of samples.filter(Boolean)) mergeBrand(map, row);
    }

    for (const c of counts.slice(300)) {
      mergeBrand(map, {
        name: c.value,
        nameEn: c.value,
        productCount: Number(c.count || 0),
        stores: ['miswag'],
      });
    }
  } catch (err) {
    console.warn('miswag brands:', err.message);
  }
}

async function collectSallaBrands(map, storeId = 'najdalatheyah') {
  try {
    const adapter = getStoreAdapter(storeId);
    const identifier = adapter?.storeIdentifier || adapter?.domain || 'najdalatheyah.com';
    const client = createSallaClient(identifier, { cachePrefix: storeId });
    let page = 1;
    while (page <= 30) {
      const data = await client.sallaFetch('/brands', {
        params: { page, per_page: 60 },
        ttl: 10 * 60 * 1000,
      });
      const rows = data.data || [];
      for (const b of rows) {
        const name = String(b.name || b.label || '').trim();
        mergeBrand(map, {
          name,
          nameEn: name,
          nameAr: String(b.label || b.name || '').trim(),
          logoUrl: sallaAbs(b.logo || ''),
          logoIsProductImage: false,
          productCount: 0,
          stores: [storeId],
        });
      }
      if (rows.length < 60) break;
      page += 1;
    }
  } catch (err) {
    console.warn('salla brands:', err.message);
  }
}

async function collectElryanBrands(map) {
  try {
    const es = await searchIndex('ar', 'product', {
      size: 0,
      aggs: {
        brands: {
          terms: { field: 'brand', size: 500 },
          aggs: {
            sample: {
              top_hits: {
                size: 1,
                _source: ['brand_details', 'image', 'name'],
              },
            },
          },
        },
      },
    }, { ttl: 10 * 60 * 1000, cacheKey: 'elryan:brand-aggs:v2' });

    for (const bucket of es.aggregations?.brands?.buckets || []) {
      const src = bucket.sample?.hits?.hits?.[0]?._source || {};
      const title = String(src.brand_details?.title || '').trim();
      if (!title || /^no\s*brand$/i.test(title)) continue;
      mergeBrand(map, {
        name: title,
        nameEn: title,
        nameAr: title,
        productImageUrl: elryanAbs(src.image || ''),
        logoIsProductImage: true,
        productCount: Number(bucket.doc_count || 0),
        stores: ['elryan'],
      });
    }
  } catch (err) {
    console.warn('elryan brands:', err.message);
  }
}

async function collectAmazonBrands(map) {
  try {
    const products = Object.values(loadAmazonIndex().products || {});
    const byKey = new Map();
    for (const p of products) {
      const nameAr = String(p.brandAr || '').trim();
      const nameEn = String(p.brandEn || '').trim();
      const keys = brandMatchKeys(nameEn, nameAr);
      if (!keys.length) continue;
      const key = keys[0];
      const prev = byKey.get(key) || { nameAr, nameEn, name: nameEn || nameAr, count: 0, thumb: '' };
      prev.count += 1;
      if (!prev.thumb && p.thumb) prev.thumb = normalizeAmazonImageUrl(p.thumb, 500);
      if (nameEn && /[A-Za-z]/.test(nameEn)) prev.name = nameEn;
      if (nameAr && !prev.nameAr) prev.nameAr = nameAr;
      byKey.set(key, prev);
    }
    for (const row of byKey.values()) {
      mergeBrand(map, {
        name: row.name,
        nameAr: row.nameAr,
        nameEn: row.nameEn || row.name,
        productImageUrl: row.thumb,
        logoIsProductImage: true,
        productCount: row.count,
        stores: ['amazon'],
      });
    }
  } catch (err) {
    console.warn('amazon brands:', err.message);
  }
}

async function collectFacesBrands(map) {
  try {
    const byKey = new Map();
    for (const cgid of FACES_BRAND_CATEGORIES) {
      for (let page = 1; page <= 4; page += 1) {
        const html = await fetchListingHtml({ lang: 'ar', cgid, page, limit: 48 }).catch(() => '');
        const items = parseListingHtml(html, { lang: 'ar' });
        if (!items.length) break;
        for (const item of items) {
          const nameAr = String(item.brandAr || '').trim();
          const nameEn = String(item.brandEn || '').trim();
          const keys = brandMatchKeys(nameEn, nameAr);
          if (!keys.length) continue;
          const key = keys[0];
          const prev = byKey.get(key) || {
            nameAr,
            nameEn,
            name: preferBrandDisplayName(nameAr, nameEn),
            count: 0,
            thumb: '',
          };
          prev.count += 1;
          if (!prev.thumb && item.thumb) prev.thumb = item.thumb;
          if (nameAr) prev.nameAr = preferName(prev.nameAr, nameAr);
          if (nameEn) prev.nameEn = preferName(prev.nameEn, nameEn);
          byKey.set(key, prev);
        }
      }
    }

    for (const row of byKey.values()) {
      mergeBrand(map, {
        name: row.name,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        productImageUrl: row.thumb,
        logoIsProductImage: true,
        productCount: row.count,
        stores: ['faces'],
      });
    }
  } catch (err) {
    console.warn('faces brands:', err.message);
  }
}

async function collectMiraayaBrands(map) {
  try {
    const byKey = new Map();
    for (const q of ['a', 'b', 'c', 'd', 'e', 'g', 'l', 'm', 'n', 's', 't']) {
      const res = await algoliaSearch(q, { lang: 'ar', page: 0, limit: 100, ttl: 15 * 60 * 1000 });
      for (const hit of res.hits || []) {
        const nameAr = String(hit.arabic_brand || hit.brand || '').trim();
        const nameEn = String(hit.brand || hit.arabic_brand || '').trim();
        const keys = brandMatchKeys(nameEn, nameAr);
        if (!keys.length) continue;
        const key = keys[0];
        const prev = byKey.get(key) || {
          nameAr,
          nameEn,
          name: nameEn || nameAr,
          count: 0,
          thumb: '',
        };
        prev.count += 1;
        if (!prev.thumb && (hit.image_url || hit.thumbnail_url)) {
          prev.thumb = hit.image_url || hit.thumbnail_url;
        }
        byKey.set(key, prev);
      }
    }

    for (const row of byKey.values()) {
      mergeBrand(map, {
        name: row.name,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        productImageUrl: row.thumb,
        logoIsProductImage: true,
        productCount: row.count,
        stores: ['miraaya'],
      });
    }
  } catch (err) {
    console.warn('miraaya brands:', err.message);
  }
}

/** قائمة براندات موحّدة من كل المتاجر */
export async function collectCatalogBrands({ force = false } = {}) {
  if (!force) {
    const cached = cacheGet(CACHE_KEY, CACHE_TTL);
    if (cached) return cached;
  }

  const map = new Map();
  await Promise.all([
    collectMiswagBrands(map),
    collectSallaBrands(map, 'najdalatheyah'),
    collectElryanBrands(map),
    collectAmazonBrands(map),
    collectFacesBrands(map),
    collectMiraayaBrands(map),
  ]);

  const unique = new Set();
  const brands = [];
  for (const b of map.values()) {
    const key = normalizeBrandKey(b.name || b.nameEn || b.nameAr);
    if (!key || unique.has(key)) continue;
    unique.add(key);
    brands.push({
      key,
      name: b.name || preferBrandDisplayName(b.nameAr, b.nameEn),
      nameAr: b.nameAr || b.name,
      nameEn: b.nameEn || b.name,
      logoUrl: b.logoUrl || '',
      logoIsProductImage: Boolean(b.logoIsProductImage && b.logoUrl),
      productImageUrl: b.productImageUrl || '',
      productCount: b.productCount || 0,
      stores: b.stores || [],
    });
  }

  brands.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const result = {
    total: brands.length,
    withLogo: brands.filter((b) => b.logoUrl).length,
    withRealLogo: brands.filter((b) => b.logoUrl && !b.logoIsProductImage).length,
    brands,
    updatedAt: Date.now(),
  };
  cacheSet(CACHE_KEY, result);
  return result;
}
