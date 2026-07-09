/**
 * تجميع براندات المتاجر الأربعة مع إزالة التكرار.
 * الشعار: شعار المتجر إن وُجد، وإلا صورة منتج عيّنة.
 */

import { typesenseMultiSearch } from '../stores/miswag/client.js';
import { createSallaClient, absImage as sallaAbs } from '../stores/salla/client.js';
import { searchIndex, absImage as elryanAbs } from '../stores/elryan/client.js';
import { loadAmazonIndex } from '../stores/amazon/catalog-index.js';
import { normalizeAmazonImageUrl } from '../stores/amazon/scrape.js';
import { getStoreAdapter } from '../stores/registry.js';
import { cacheGet, cacheSet } from './cache.js';

const CACHE_KEY = 'catalog:brands:v1';
const CACHE_TTL = 30 * 60 * 1000;

export function normalizeBrandKey(name = '') {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '') // تشكيل عربي
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function preferName(a = '', b = '') {
  const x = String(a || '').trim();
  const y = String(b || '').trim();
  if (x && y) {
    // فضّل الاسم اللاتيني للعرض إن وُجد مع العربي كـ label
    if (/[A-Za-z]/.test(x) && !/[A-Za-z]/.test(y)) return x;
    if (/[A-Za-z]/.test(y) && !/[A-Za-z]/.test(x)) return y;
    return x.length >= y.length ? x : y;
  }
  return x || y;
}

function mergeBrand(map, row) {
  const key = normalizeBrandKey(row.name || row.nameEn || row.nameAr);
  if (!key || key === 'no brand' || key === 'nobrand' || key === 'unknown') return;

  const prev = map.get(key) || {
    key,
    name: '',
    nameAr: '',
    nameEn: '',
    logoUrl: '',
    logoIsProductImage: false,
    productImageUrl: '',
    productCount: 0,
    stores: [],
  };

  const name = preferName(row.name, preferName(row.nameEn, row.nameAr));
  const logoUrl = String(row.logoUrl || '').trim();
  const productImageUrl = String(row.productImageUrl || '').trim();
  const stores = new Set([...(prev.stores || []), ...(row.stores || [])].filter(Boolean));

  let nextLogo = prev.logoUrl;
  let nextLogoIsProduct = prev.logoIsProductImage;
  if (logoUrl) {
    nextLogo = logoUrl;
    nextLogoIsProduct = false;
  } else if (!nextLogo && productImageUrl) {
    nextLogo = productImageUrl;
    nextLogoIsProduct = true;
  } else if (!nextLogo && prev.productImageUrl) {
    nextLogo = prev.productImageUrl;
    nextLogoIsProduct = true;
  }

  map.set(key, {
    key,
    name: preferName(prev.name, name) || name,
    nameAr: preferName(prev.nameAr, row.nameAr) || '',
    nameEn: preferName(prev.nameEn, row.nameEn) || '',
    logoUrl: nextLogo || '',
    logoIsProductImage: Boolean(nextLogo && nextLogoIsProduct),
    productImageUrl: productImageUrl || prev.productImageUrl || '',
    productCount: Math.max(prev.productCount || 0, Number(row.productCount || 0) || 0),
    stores: [...stores],
  });
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

    // عيّنة صور لأهم البراندات على دفعات
    const top = counts.slice(0, 120);
    for (let i = 0; i < top.length; i += 12) {
      const chunk = top.slice(i, i + 12);
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

    for (const c of counts.slice(120)) {
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
          terms: { field: 'brand', size: 400 },
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
    }, { ttl: 10 * 60 * 1000, cacheKey: 'elryan:brand-aggs:v1' });

    for (const bucket of es.aggregations?.brands?.buckets || []) {
      const src = bucket.sample?.hits?.hits?.[0]?._source || {};
      const title = String(src.brand_details?.title || '').trim();
      if (!title || /^no\s*brand$/i.test(title)) continue;
      mergeBrand(map, {
        name: title,
        nameEn: title,
        nameAr: title,
        productImageUrl: elryanAbs(src.image || ''),
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
      const name = String(p.brandEn || p.brandAr || '').trim();
      const key = normalizeBrandKey(name);
      if (!key) continue;
      const prev = byKey.get(key) || { name, count: 0, thumb: '' };
      prev.count += 1;
      if (!prev.thumb && p.thumb) prev.thumb = normalizeAmazonImageUrl(p.thumb, 500);
      if (/[A-Za-z]/.test(name)) prev.name = name;
      byKey.set(key, prev);
    }
    for (const row of byKey.values()) {
      mergeBrand(map, {
        name: row.name,
        nameEn: row.name,
        productImageUrl: row.thumb,
        productCount: row.count,
        stores: ['amazon'],
      });
    }
  } catch (err) {
    console.warn('amazon brands:', err.message);
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
  ]);

  const brands = [...map.values()]
    .map((b) => ({
      key: b.key,
      name: b.name,
      nameAr: b.nameAr || b.name,
      nameEn: b.nameEn || b.name,
      logoUrl: b.logoUrl || '',
      logoIsProductImage: Boolean(b.logoIsProductImage && b.logoUrl),
      productCount: b.productCount || 0,
      stores: b.stores || [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const result = {
    total: brands.length,
    withLogo: brands.filter((b) => b.logoUrl).length,
    brands,
    updatedAt: Date.now(),
  };
  cacheSet(CACHE_KEY, result);
  return result;
}
