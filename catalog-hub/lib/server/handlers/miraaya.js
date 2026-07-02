import {
  fetchCategoryTreeRaw as fetchMiraayaCategoriesRaw,
  buildCategoryTree as buildMiraayaCategoryTree,
  fetchCategoryProducts as fetchMiraayaCategoryProducts,
  searchProducts as searchMiraayaProducts,
  fetchProductById as fetchMiraayaProductById,
  fetchProductBySku as fetchMiraayaProductBySku,
  normalizeProductSummary as normalizeMiraayaProductSummary,
  normalizeProductDetail as normalizeMiraayaProductDetail,
  sortProductsClient as sortMiraayaProductsClient,
  fetchBrandsCatalog as fetchMiraayaBrands,
  fetchBrandProducts as fetchMiraayaBrandProducts,
} from '../../miraaya-api.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

let miraayaCategoryCache = { tree: null, leaves: null, all: null, fetchedAt: 0 };
let miraayaBrandsCache = { brands: null, fetchedAt: 0 };

async function getMiraayaCategoryTree() {
  if (miraayaCategoryCache.tree && Date.now() - miraayaCategoryCache.fetchedAt < CACHE_MS) {
    return miraayaCategoryCache;
  }
  const bilingualRoots = await fetchMiraayaCategoriesRaw();
  const { tree, leaves, all } = buildMiraayaCategoryTree(bilingualRoots);
  miraayaCategoryCache = { tree, leaves, all, fetchedAt: Date.now() };
  return miraayaCategoryCache;
}

export async function handleMiraayaApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/miraaya/health') {
      return sendJson(res, 200, { ok: true, source: 'miraaya.com', api: 'magadmin.miraaya.com/graphql' });
    }

    if (url.pathname === '/api/miraaya/categories') {
      const { tree, leaves, all } = await getMiraayaCategoryTree();
      return sendJson(res, 200, { tree, leaves, all, totalLeaves: leaves.length });
    }

    const catMatch = url.pathname.match(/^\/api\/miraaya\/categories\/(\d+)\/products$/);
    if (catMatch) {
      const categoryId = catMatch[1];
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';

      const data = await fetchMiraayaCategoryProducts(categoryId, { page, limit, sort });
      const { all } = await getMiraayaCategoryTree();
      const cat = all.find((c) => String(c.id) === String(categoryId));

      let products = (data.items || []).map((p) =>
        normalizeMiraayaProductSummary(p, {
          path: cat?.path,
          pathEn: cat?.pathEn,
          name: cat?.name,
          nameEn: cat?.nameEn,
        })
      );
      if (sort !== 'default') {
        products = sortMiraayaProductsClient(products, sort);
      }

      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;
      return sendJson(res, 200, {
        meta: {
          categoryId: Number(categoryId),
          path: cat?.path || categoryId,
          pathEn: cat?.pathEn || '',
          name: cat?.name || '',
          nameEn: cat?.nameEn || '',
          totalCount: data.total ?? null,
        },
        products,
        page: data.page || page,
        limit: pageLimit,
        hasMore: data.total != null ? page * pageLimit < data.total : itemsCount >= pageLimit,
      });
    }

    if (url.pathname === '/api/miraaya/brands') {
      const stale = Date.now() - miraayaBrandsCache.fetchedAt > CACHE_MS;
      if (miraayaBrandsCache.brands == null || stale || !miraayaBrandsCache.brands.length) {
        const brands = await fetchMiraayaBrands({ maxPages: 15, pageSize: 100 });
        miraayaBrandsCache = { brands, fetchedAt: Date.now() };
      }
      return sendJson(res, 200, { brands: miraayaBrandsCache.brands, total: miraayaBrandsCache.brands.length });
    }

    const miraayaBrandMatch = url.pathname.match(/^\/api\/miraaya\/brands\/([^/]+)\/products$/);
    if (miraayaBrandMatch) {
      const brandId = decodeURIComponent(miraayaBrandMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const brand = (miraayaBrandsCache.brands || []).find((b) => String(b.id) === String(brandId));
      const brandName = brand?.name || brandId;
      const data = await fetchMiraayaBrandProducts(brandName, { page, limit, sort });
      let products = (data.items || []).map((p) =>
        normalizeMiraayaProductSummary(p, { path: `علامة: ${brandName}`, pathEn: `Brand: ${brand?.nameEn || brandName}` })
      );
      if (sort !== 'default') products = sortMiraayaProductsClient(products, sort);
      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;
      return sendJson(res, 200, {
        meta: {
          brandId,
          path: `علامة: ${brandName}`,
          pathEn: `Brand: ${brand?.nameEn || brandName}`,
          name: brandName,
          nameEn: brand?.nameEn || '',
          totalCount: data.total ?? null,
        },
        products,
        page: data.page || page,
        limit: pageLimit,
        hasMore: data.total != null ? page * pageLimit < data.total : itemsCount >= pageLimit,
      });
    }

    if (url.pathname === '/api/miraaya/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchMiraayaProducts(query, page, limit);
      const products = (data.items || []).map((p) =>
        normalizeMiraayaProductSummary(p, { path: `بحث: ${query}`, pathEn: `Search: ${query}` })
      );
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}`, pathEn: `Search: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: itemsCount >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/miraaya\/products\/([^/]+)$/);
    if (productMatch) {
      const key = decodeURIComponent(productMatch[1]);
      let detail = null;
      if (/^\d+$/.test(key)) {
        detail = await fetchMiraayaProductById(key);
      } else {
        detail = await fetchMiraayaProductBySku(key);
      }
      if (!detail?.id && !detail?.sku) return sendJson(res, 404, { error: 'Product not found' });
      const normalized = normalizeMiraayaProductDetail(detail);
      return sendJson(res, 200, { product: normalized });
    }

    return sendJson(res, 404, { error: 'Unknown Miraaya API route' });
  } catch (err) {
    console.error('Miraaya API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}
