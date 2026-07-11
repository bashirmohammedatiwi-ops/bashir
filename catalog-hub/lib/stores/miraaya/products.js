import { cacheGet, cacheSet } from '../../core/cache.js';
import {
  DEFAULT_TTL,
  DETAIL_TTL,
  algoliaSearch,
  extractBarcode,
  fetchProductRest,
  miraayaGraphql,
  normalizeSku,
} from './client.js';
import { mapDetailProduct, mapListFromAlgolia, mapListFromGraphql, toBarcodeHit } from './map.js';
import { mergeListingLocales } from './merge.js';

const DETAIL_QUERY = `
  query ProductDetail($sku: String!) {
    products(filter: { sku: { eq: $sku } }, pageSize: 1) {
      items {
        sku name url_key __typename
        description { html }
        short_description { html }
        image { url }
        media_gallery { url label }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
            discount { percent_off }
          }
        }
        stock_status
        categories { id name url_key }
        ... on ConfigurableProduct {
          configurable_options {
            attribute_code label
            values { label value_index swatch_data { value } }
          }
          variants {
            product {
              sku name url_key
              image { url }
              price_range { minimum_price { final_price { value currency } } }
              stock_status
            }
            attributes { code label value_index }
          }
        }
      }
    }
  }
`;

const LIST_QUERY = `
  query CategoryProducts($categoryId: String!, $pageSize: Int!, $currentPage: Int!) {
    products(
      filter: { category_id: { eq: $categoryId } }
      pageSize: $pageSize
      currentPage: $currentPage
      sort: { position: ASC }
    ) {
      total_count
      page_info { current_page total_pages page_size }
      items {
        sku name url_key __typename
        image { url }
        price_range { minimum_price { final_price { value currency } } }
        stock_status
        categories { name }
      }
    }
  }
`;

const SEARCH_PARENT_QUERY = `
  query SearchParent($q: String!) {
    products(search: $q, pageSize: 6) {
      items { sku name url_key __typename }
    }
  }
`;

function pageResult(items, { page, limit, total = 0 } = {}) {
  return {
    items: items.slice(0, limit),
    page,
    pageSize: limit,
    total: total || items.length,
    hasMore: page * limit < (total || items.length),
  };
}

async function fetchDetailBilingual(sku, { highlightSku = '' } = {}) {
  const id = normalizeSku(sku);
  if (!id) return null;

  const [arData, enData, restAr, restEn] = await Promise.all([
    miraayaGraphql(DETAIL_QUERY, { lang: 'ar', variables: { sku: id }, ttl: DETAIL_TTL, cacheKey: `miraaya:detail:ar:${id}` }),
    miraayaGraphql(DETAIL_QUERY, { lang: 'en', variables: { sku: id }, ttl: DETAIL_TTL, cacheKey: `miraaya:detail:en:${id}` }),
    fetchProductRest(id).catch(() => null),
    fetchProductRest(id).catch(() => null),
  ]);

  let arItem = arData?.products?.items?.[0] || null;
  let enItem = enData?.products?.items?.[0] || null;

  if (!arItem && !enItem && restAr) {
    const urlKey = restAr.custom_attributes?.find((a) => a.attribute_code === 'url_key')?.value;
    if (urlKey) {
      const search = await miraayaGraphql(SEARCH_PARENT_QUERY, {
        lang: 'ar',
        variables: { q: String(urlKey) },
        ttl: DETAIL_TTL,
        cacheKey: `miraaya:search-parent:${id}`,
      }).catch(() => null);
      const parent = (search?.products?.items || []).find((p) => p.__typename === 'ConfigurableProduct');
      if (parent?.sku) return fetchDetailBilingual(parent.sku, { highlightSku: id });
    }
  }

  if (!arItem && !enItem) return null;
  return mapDetailProduct(arItem, enItem, { restAr, restEn, highlightSku });
}

async function resolveParentSkuForVariant(sku) {
  const id = normalizeSku(sku);
  const search = await miraayaGraphql(SEARCH_PARENT_QUERY, {
    lang: 'ar',
    variables: { q: id },
    ttl: DETAIL_TTL,
    cacheKey: `miraaya:variant-parent:${id}`,
  }).catch(() => null);

  const items = search?.products?.items || [];
  const exact = items.find((p) => p.sku === id);
  if (exact?.__typename === 'ConfigurableProduct') return exact.sku;

  const parent = items.find((p) => p.__typename === 'ConfigurableProduct');
  if (parent?.sku) return parent.sku;

  return exact?.sku || id;
}

export async function searchProducts(query, { page = 1, limit = 30 } = {}) {
  const q = String(query || '').trim();
  if (!q) return pageResult([], { page, limit, total: 0 });

  const cacheKey = `miraaya:search:${q}:${page}:${limit}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const pageIndex = Math.max(0, page - 1);
  const [arRes, enRes] = await Promise.all([
    algoliaSearch(q, { lang: 'ar', page: pageIndex, limit }),
    algoliaSearch(q, { lang: 'en', page: pageIndex, limit }),
  ]);

  const items = mergeListingLocales(
    (arRes.hits || []).map((h) => mapListFromAlgolia(h, null)).filter(Boolean),
    (enRes.hits || []).map((h) => mapListFromAlgolia(null, h)).filter(Boolean),
  );

  const out = pageResult(items, { page, limit, total: Math.max(arRes.total, enRes.total) });
  cacheSet(cacheKey, out);
  return out;
}

export async function listCategoryProducts(categoryId, { page = 1, limit = 30 } = {}) {
  const cgid = String(categoryId || '').trim();
  if (!cgid || cgid === 'root') {
    return searchProducts('', { page, limit });
  }

  const cacheKey = `miraaya:cat:${cgid}:${page}:${limit}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const pageSize = Math.min(limit, 48);
  const [arData, enData] = await Promise.all([
    miraayaGraphql(LIST_QUERY, {
      lang: 'ar',
      variables: { categoryId: cgid, pageSize, currentPage: page },
      ttl: DEFAULT_TTL,
      cacheKey: `miraaya:cat:ar:${cgid}:${page}:${pageSize}`,
    }),
    miraayaGraphql(LIST_QUERY, {
      lang: 'en',
      variables: { categoryId: cgid, pageSize, currentPage: page },
      ttl: DEFAULT_TTL,
      cacheKey: `miraaya:cat:en:${cgid}:${page}:${pageSize}`,
    }),
  ]);

  const arItems = arData?.products?.items || [];
  const enItems = enData?.products?.items || [];
  const enBySku = new Map(enItems.map((i) => [String(i.sku), i]));

  const brandCache = new Map();
  async function brandFor(sku) {
    if (brandCache.has(sku)) return brandCache.get(sku);
    const rest = await fetchProductRest(sku).catch(() => null);
    const row = {
      ar: rest?.custom_attributes?.find((a) => a.attribute_code === 'brand')?.value || '',
      en: rest?.custom_attributes?.find((a) => a.attribute_code === 'brand')?.value || '',
    };
    brandCache.set(sku, row);
    return row;
  }

  const mapped = await Promise.all(arItems.map(async (arItem) => {
    const sku = String(arItem.sku || '');
    const brand = await brandFor(sku);
    return mapListFromGraphql(arItem, enBySku.get(sku), brand);
  }));
  const items = mapped.filter(Boolean);

  const total = Number(arData?.products?.total_count || enData?.products?.total_count || items.length);
  const out = pageResult(items, { page, limit, total });
  cacheSet(cacheKey, out);
  return out;
}

export async function fetchProductDetail(id, { light = false } = {}) {
  const sku = await resolveParentSkuForVariant(id);
  if (light) {
    const rest = await fetchProductRest(sku).catch(() => null);
    if (!rest) return fetchDetailBilingual(sku, { highlightSku: id });
    const search = await algoliaSearch(sku, { lang: 'ar', limit: 1 }).catch(() => ({ hits: [] }));
    const hit = search.hits?.[0];
    if (hit) {
      const list = mapListFromAlgolia(hit, hit);
      return {
        ...list,
        descriptionAr: '',
        descriptionEn: '',
        images: list.thumb ? [list.thumb] : [],
        shades: [{
          id: list.sku,
          nameAr: list.nameAr,
          nameEn: list.nameEn,
          sku: list.sku,
          barcode: list.barcode,
          image: list.thumb,
          price: list.price,
          inStock: list.inStock,
          colorHex: '',
          optionGroup: '',
        }],
        shadeCount: list.shadeCount || 1,
        hasOptions: list.hasOptions,
        manufacturer: list.brandAr,
        manufacturerEn: list.brandEn,
      };
    }
  }
  return fetchDetailBilingual(sku, { highlightSku: normalizeSku(id) });
}

export async function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits) return [];

  const trySkus = [...new Set([digits, digits.replace(/^0+/, '')].filter(Boolean))];

  for (const sku of trySkus) {
    const rest = await fetchProductRest(sku).catch(() => null);
    if (!rest) continue;

    const parentSku = await resolveParentSkuForVariant(sku);
    const detail = await fetchDetailBilingual(parentSku, { highlightSku: sku });
    if (!detail) continue;

    const shade = (detail.shades || []).find((s) => s.barcode === digits || s.sku === sku);
    if (shade || detail.barcode === digits || extractBarcode(rest.sku) === digits) {
      return [toBarcodeHit(detail, digits, shade)];
    }
  }

  for (const sku of trySkus) {
    const [arRes, enRes] = await Promise.all([
      algoliaSearch(sku, { lang: 'ar', limit: 6 }),
      algoliaSearch(sku, { lang: 'en', limit: 6 }),
    ]);

    for (const hit of [...(arRes.hits || []), ...(enRes.hits || [])]) {
      const skus = Array.isArray(hit.sku) ? hit.sku : [hit.sku];
      if (!skus.some((s) => String(s).includes(sku))) continue;

      const parentSku = hit.type_id === 'configurable'
        ? skus.find((s) => !/^\d{8,14}$/.test(String(s).replace(/\D/g, ''))) || skus[0]
        : skus.find((s) => extractBarcode(s) === digits) || skus[0];

      const detail = await fetchDetailBilingual(parentSku, { highlightSku: digits });
      if (!detail) continue;
      const shade = (detail.shades || []).find((s) => s.barcode === digits);
      if (shade || detail.barcode === digits) {
        return [toBarcodeHit(detail, digits, shade)];
      }
    }
  }

  return [];
}

export function sortProductsClient(items = [], sort = 'default') {
  const list = [...items];
  if (sort === 'price_asc') {
    list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  } else if (sort === 'name') {
    list.sort((a, b) => String(a.nameAr || a.nameEn).localeCompare(String(b.nameAr || b.nameEn), 'ar'));
  }
  return list;
}

function parsePrice(price = '') {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
