/**
 * تجميع براندات المتاجر مع إزالة التكرار ودمج الشعارات.
 * الأولوية: شعار حقيقي من المتجر > صورة منتج عيّنة من أي متجر.
 */

import { typesenseMultiSearch } from '../stores/miswag/client.js';
import { createSallaClient, absImage as sallaAbs } from '../stores/salla/client.js';
import { searchIndex, absImage as elryanAbs, elryanBrandLogoUrl } from '../stores/elryan/client.js';
import { loadAmazonIndex } from '../stores/amazon/catalog-index.js';
import { normalizeAmazonImageUrl } from '../stores/amazon/scrape.js';
import { fetchListingHtml } from '../stores/faces/client.js';
import { parseListingHtml as parseFacesListingHtml } from '../stores/faces/parse.js';
import { algoliaSearch, algoliaBrandFacets, algoliaBrandFilter, normalizeMiraayaImageUrl } from '../stores/miraaya/client.js';
import { fetchShopHtml } from '../stores/beautyway/client.js';
import { parseListingHtml as parseBeautywayListingHtml } from '../stores/beautyway/parse.js';
import { khatonFetch, absImage as khatonAbs } from '../stores/khaton/client.js';
import { shopifyFetch } from '../stores/orisdi/client.js';
import { waheteterFetch } from '../stores/waheteter/client.js';
import { fetchPageHtml, parseNuxtPayload, revivePayloadNode, findCategoriesArrayIndex } from '../stores/niceone/client.js';
import { getStoreAdapter, listStores } from '../stores/registry.js';
import { cacheGet, cacheSet } from './cache.js';
import { brandMatchKeys, normalizeBrandKey, preferBrandDisplayName } from './brand-normalize.js';

const CACHE_KEY = 'catalog:brands:v3';
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
    const pageSize = 500;
    let from = 0;
    let guard = 0;

    while (guard < 15) {
      const [arRes, enRes] = await Promise.all([
        searchIndex('ar', 'brand', {
          from,
          size: pageSize,
          query: { match_all: {} },
          _source: ['title', 'image', 'slider_image', 'url_alias', 'value'],
        }, { ttl: 10 * 60 * 1000, cacheKey: `elryan:brands:ar:${from}` }),
        searchIndex('en', 'brand', {
          from,
          size: pageSize,
          query: { match_all: {} },
          _source: ['title', 'image', 'slider_image', 'url_alias', 'value'],
        }, { ttl: 10 * 60 * 1000, cacheKey: `elryan:brands:en:${from}` }).catch(() => ({ hits: { hits: [] } })),
      ]);

      const enByValue = new Map();
      for (const hit of enRes.hits?.hits || []) {
        const src = hit._source || {};
        enByValue.set(String(src.value || src.url_alias || ''), src);
      }

      const hits = arRes.hits?.hits || [];
      for (const hit of hits) {
        const src = hit._source || {};
        const titleAr = String(src.title || '').trim();
        const en = enByValue.get(String(src.value || src.url_alias || '')) || {};
        const titleEn = String(en.title || titleAr).trim();
        if (!titleAr || /^no\s*brand$/i.test(titleAr)) continue;

        const logoFile = String(src.slider_image || src.image || en.slider_image || en.image || '').trim();
        mergeBrand(map, {
          name: titleEn || titleAr,
          nameAr: titleAr,
          nameEn: titleEn,
          logoUrl: elryanBrandLogoUrl(logoFile),
          logoIsProductImage: false,
          productCount: 0,
          stores: ['elryan'],
        });
      }

      from += hits.length;
      const total = typeof arRes.hits?.total === 'number'
        ? arRes.hits.total
        : arRes.hits?.total?.value || 0;
      if (!hits.length || from >= total) break;
      guard += 1;
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
        const items = parseFacesListingHtml(html, { lang: 'ar' });
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
    const facets = await algoliaBrandFacets({ lang: 'ar' });
    const ranked = Object.entries(facets)
      .map(([name, count]) => ({ name: String(name).trim(), count: Number(count || 0) }))
      .filter((row) => row.name && row.name !== 'No Brand')
      .sort((a, b) => b.count - a.count);

    for (let i = 0; i < ranked.length; i += 15) {
      const chunk = ranked.slice(i, i + 15);
      const samples = await Promise.all(
        chunk.map(async (row) => {
          try {
            const res = await algoliaSearch('', {
              lang: 'ar',
              page: 0,
              limit: 1,
              filters: algoliaBrandFilter(row.name),
              ttl: 15 * 60 * 1000,
            });
            const hit = res.hits?.[0];
            const facetName = row.name;
            const nameAr = /[\u0600-\u06FF]/.test(facetName)
              ? facetName
              : String(hit?.arabic_brand || facetName).trim();
            const nameEn = /[A-Za-z]/.test(facetName) && !/[\u0600-\u06FF]/.test(facetName)
              ? facetName
              : String(hit?.brand || '').trim();
            const thumb = normalizeMiraayaImageUrl(hit?.image_url || hit?.thumbnail_url || '');
            return {
              name: preferBrandDisplayName(nameAr, nameEn) || facetName,
              nameAr: nameAr || facetName,
              nameEn: nameEn || nameAr || facetName,
              productImageUrl: thumb,
              logoIsProductImage: true,
              productCount: row.count,
              stores: ['miraaya'],
            };
          } catch {
            return {
              name: row.name,
              nameAr: row.name,
              nameEn: row.name,
              productCount: row.count,
              stores: ['miraaya'],
            };
          }
        }),
      );
      for (const row of samples.filter(Boolean)) mergeBrand(map, row);
    }
  } catch (err) {
    console.warn('miraaya brands:', err.message);
  }
}

function parseBeautywayBrandLinks(html = '', lang = 'ar') {
  const rows = new Map();
  for (const m of String(html || '').matchAll(/shop\?[^"']*brand=(\d+)[^"']*"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const id = String(m[1] || '').trim();
    const name = String(m[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!id || id === '0' || !name || /^(all|الكل)$/i.test(name)) continue;
    const prev = rows.get(id) || { id, nameAr: '', nameEn: '' };
    if (lang === 'en') prev.nameEn = preferName(prev.nameEn, name);
    else prev.nameAr = preferName(prev.nameAr, name);
    rows.set(id, prev);
  }
  return rows;
}

async function collectBeautywayBrands(map) {
  try {
    const [arHtml, enHtml] = await Promise.all([
      fetchShopHtml({ lang: 'ar', page: 1 }),
      fetchShopHtml({ lang: 'en', page: 1 }).catch(() => ''),
    ]);

    const brands = parseBeautywayBrandLinks(arHtml, 'ar');
    for (const [id, row] of parseBeautywayBrandLinks(enHtml, 'en')) {
      const prev = brands.get(id) || { id, nameAr: '', nameEn: '' };
      prev.nameEn = preferName(prev.nameEn, row.nameEn);
      if (!prev.nameAr) prev.nameAr = row.nameAr;
      brands.set(id, prev);
    }

    const list = [...brands.values()];
    for (let i = 0; i < list.length; i += 12) {
      const chunk = list.slice(i, i + 12);
      await Promise.all(chunk.map(async (row) => {
        try {
          const html = await fetchShopHtml({ lang: 'ar', brand: row.id, page: 1 });
          row.thumb = parseBeautywayListingHtml(html)[0]?.thumb || '';
        } catch {
          /* skip */
        }
      }));
    }

    for (const row of list) {
      const nameAr = row.nameAr || row.nameEn;
      const nameEn = row.nameEn || row.nameAr;
      if (!nameAr && !nameEn) continue;
      mergeBrand(map, {
        name: nameEn || nameAr,
        nameAr,
        nameEn,
        productImageUrl: String(row.thumb || '').trim(),
        logoIsProductImage: true,
        productCount: 0,
        stores: ['beautyway'],
      });
    }
  } catch (err) {
    console.warn('beautyway brands:', err.message);
  }
}

async function collectOrisdiBrands(map) {
  try {
    const vendors = new Map();
    for (let page = 1; page <= 12; page += 1) {
      const data = await shopifyFetch('/products.json', {
        params: { limit: 250, page },
        ttl: 15 * 60 * 1000,
        cacheKey: `orisdi:brands-scan:${page}`,
      });
      const products = data.products || [];
      if (!products.length) break;
      for (const p of products) {
        const name = String(p.vendor || '').trim();
        if (!name || name.toLowerCase() === 'orisdi') continue;
        const prev = vendors.get(name) || { name, thumb: '', count: 0 };
        prev.count += 1;
        if (!prev.thumb) prev.thumb = String(p.images?.[0]?.src || '').trim();
        vendors.set(name, prev);
      }
      if (products.length < 250) break;
    }

    for (const row of vendors.values()) {
      mergeBrand(map, {
        name: row.name,
        nameEn: row.name,
        nameAr: row.name,
        logoUrl: '',
        productImageUrl: row.thumb,
        logoIsProductImage: Boolean(row.thumb),
        productCount: row.count,
        stores: ['orisdi'],
      });
    }
  } catch (err) {
    console.warn('orisdi brands:', err.message);
  }
}

async function collectKhatonBrands(map) {
  try {
    let page = 1;
    while (page <= 50) {
      const data = await khatonFetch('/brands', {
        params: { page, per_page: 60 },
        ttl: 10 * 60 * 1000,
        cacheKey: `khaton:brands:${page}`,
      });
      const rows = data.data || [];
      for (const b of rows) {
        const name = String(b.name || '').trim();
        mergeBrand(map, {
          name,
          nameEn: name,
          nameAr: name,
          logoUrl: khatonAbs(b.logo || ''),
          logoIsProductImage: false,
          productCount: Number(b.products_count || 0),
          stores: ['khaton'],
        });
      }
      if (rows.length < 60) break;
      page += 1;
    }
  } catch (err) {
    console.warn('khaton brands:', err.message);
  }
}

async function collectNiceoneBrands(map) {
  try {
    const html = await fetchPageHtml('', { lang: 'ar', ttl: 15 * 60 * 1000, cacheKey: 'niceone:brands:home' });
    const payload = parseNuxtPayload(html);
    const catsIndex = findCategoriesArrayIndex(payload);
    if (catsIndex < 0) return;
    const categories = revivePayloadNode(payload, catsIndex) || [];
    const vendors = new Map();
    for (const cat of categories) {
      for (const brand of cat.recommended_manufacturers || []) {
        const nameEn = String(brand.name || '').trim();
        const nameAr = String(brand.ar_name || brand.name || '').trim();
        if (!nameEn && !nameAr) continue;
        const key = (nameEn || nameAr).toLowerCase();
        if (vendors.has(key)) continue;
        vendors.set(key, {
          name: nameEn || nameAr,
          nameAr,
          nameEn,
          logoUrl: String(brand.image || '').trim(),
        });
      }
    }
    for (const row of vendors.values()) {
      mergeBrand(map, {
        name: row.name,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        logoUrl: row.logoUrl,
        logoIsProductImage: false,
        productCount: 0,
        stores: ['niceone'],
      });
    }
  } catch (err) {
    console.warn('niceone brands:', err.message);
  }
}

async function collectWaheteterBrands(map) {
  try {
    const seen = new Set();
    for (let page = 1; page <= 30; page += 1) {
      const { data } = await waheteterFetch('/products', {
        params: { page, per_page: 100 },
        ttl: 10 * 60 * 1000,
        cacheKey: `waheteter:brands-scan:${page}`,
      });
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) break;
      for (const product of rows) {
        const brandAttr = (product.attributes || []).find((a) => a.taxonomy === 'pa_brand');
        const name = String(brandAttr?.terms?.[0]?.name || '').trim();
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        mergeBrand(map, {
          name,
          nameEn: name,
          nameAr: name,
          logoUrl: '',
          logoIsProductImage: false,
          productCount: 1,
          stores: ['waheteter'],
        });
      }
      if (rows.length < 100) break;
    }
  } catch (err) {
    console.warn('waheteter brands:', err.message);
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
    collectSallaBrands(map, 'alkhabeer'),
    collectElryanBrands(map),
    collectAmazonBrands(map),
    collectFacesBrands(map),
    collectMiraayaBrands(map),
    collectBeautywayBrands(map),
    collectKhatonBrands(map),
    collectOrisdiBrands(map),
    collectWaheteterBrands(map),
    collectNiceoneBrands(map),
  ]);

  const seenObjects = new Set();
  const uniqueKeys = new Set();
  const brands = [];
  for (const b of map.values()) {
    if (seenObjects.has(b)) continue;

    const keys = [...(b.keys || new Set())];
    const canonical = keys[0] || normalizeBrandKey(b.name || b.nameEn || b.nameAr);
    if (!canonical) continue;
    if (keys.some((k) => uniqueKeys.has(k)) || uniqueKeys.has(canonical)) continue;

    keys.forEach((k) => uniqueKeys.add(k));
    uniqueKeys.add(canonical);
    seenObjects.add(b);

    const realLogo = String(b.logoUrl || '').trim();
    const productImage = String(b.productImageUrl || '').trim();
    const effectiveLogo = realLogo || productImage;

    brands.push({
      key: canonical,
      name: b.name || preferBrandDisplayName(b.nameAr, b.nameEn),
      nameAr: b.nameAr || b.name,
      nameEn: b.nameEn || b.name,
      logoUrl: effectiveLogo,
      logoIsProductImage: realLogo
        ? Boolean(b.logoIsProductImage)
        : Boolean(productImage),
      productImageUrl: productImage,
      productCount: b.productCount || 0,
      stores: b.stores || [],
    });
  }

  brands.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const result = {
    total: brands.length,
    withLogo: brands.filter((b) => b.logoUrl).length,
    withRealLogo: brands.filter((b) => b.logoUrl && !b.logoIsProductImage).length,
    stores: listStores().map((s) => s.id),
    brands,
    updatedAt: Date.now(),
  };
  cacheSet(CACHE_KEY, result);
  return result;
}
