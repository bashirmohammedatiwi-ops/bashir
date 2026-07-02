import {
  buildBilingualCategoryTree as buildElryanCategoryTree,
  fetchBeautyCategoriesBilingual,
  enrichProductList,
  fetchProductByIdBilingual,
  sortProductsClientBilingual,
  elryanAr,
} from '../../elryan-api.js';
import { collectDescendantIds, findCategoryNode, applyProductCounts } from '../../category-scope.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

let elryanCategoryCache = { tree: null, leaves: null, all: null, ids: null, fetchedAt: 0 };
let elryanBrandsCache = { brands: null, fetchedAt: 0 };

async function getElryanCategoryTree() {
  if (elryanCategoryCache.tree && Date.now() - elryanCategoryCache.fetchedAt < CACHE_MS) {
    return elryanCategoryCache;
  }
  const { itemsAr, itemsEn } = await fetchBeautyCategoriesBilingual();
  const { tree, leaves, all, ids } = buildElryanCategoryTree(itemsAr, itemsEn);
  elryanCategoryCache = { tree, leaves, all, ids, fetchedAt: Date.now() };
  scheduleElryanCountEnrich();
  return elryanCategoryCache;
}

function scheduleElryanCountEnrich() {
  if (elryanCategoryCache.countsEnriching) return;
  elryanCategoryCache.countsEnriching = true;
  elryanAr.fetchCategoryProductCounts(elryanCategoryCache.all, elryanCategoryCache.ids)
    .then((countMap) => applyProductCounts(elryanCategoryCache.all, countMap))
    .catch((err) => console.warn('Elryan category counts:', err.message))
    .finally(() => { elryanCategoryCache.countsEnriching = false; });
}

export async function handleElryanApi(req, res, url) {
  try {
    const q = parseQuery(url);
    const { ids: beautyIds } = await getElryanCategoryTree();

    if (url.pathname === '/api/elryan/health') {
      return sendJson(res, 200, { ok: true, source: 'elryan.com', scope: 'beauty-fragrances', bilingual: true });
    }

    if (url.pathname === '/api/elryan/categories') {
      const { tree, leaves, all } = await getElryanCategoryTree();
      return sendJson(res, 200, { tree, leaves, all, totalLeaves: leaves.length });
    }

    if (url.pathname === '/api/elryan/brands') {
      if (elryanBrandsCache.brands == null || Date.now() - elryanBrandsCache.fetchedAt > CACHE_MS) {
        elryanBrandsCache = { brands: await elryanAr.fetchBeautyBrands(beautyIds), fetchedAt: Date.now() };
      }
      return sendJson(res, 200, { brands: elryanBrandsCache.brands, total: elryanBrandsCache.brands.length });
    }

    const elryanBrandMatch = url.pathname.match(/^\/api\/elryan\/brands\/([^/]+)\/products$/);
    if (elryanBrandMatch) {
      const brandId = decodeURIComponent(elryanBrandMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await elryanAr.fetchBrandProducts(brandId, { page, limit, sort, beautyIds });
      const brand = (elryanBrandsCache.brands || []).find((b) => String(b.id) === String(brandId));
      const meta = {
        path: brand ? `علامة: ${brand.name}` : `علامة: ${brandId}`,
        pathEn: brand ? `Brand: ${brand.nameEn || brand.name}` : `Brand: ${brandId}`,
        name: brand?.name || '',
        nameEn: brand?.nameEn || brand?.name || '',
      };
      let products = await enrichProductList(data.items || [], meta);
      if (sort !== 'default') products = sortProductsClientBilingual(products, sort);
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { brandId, ...meta, totalCount: data.total ?? null },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: data.total != null ? page * limit < data.total : itemsCount >= limit,
      });
    }

    const catMatch = url.pathname.match(/^\/api\/elryan\/categories\/(\d+)\/products$/);
    if (catMatch) {
      const categoryId = catMatch[1];
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';

      const { all } = await getElryanCategoryTree();
      const cat = findCategoryNode(all, categoryId);

      const data = await elryanAr.fetchCategoryProducts(categoryId, {
        page,
        limit,
        sort,
        beautyIds,
        scopeIds: collectDescendantIds(cat),
      });

      const meta = {
        path: cat?.path || categoryId,
        pathEn: cat?.pathEn || '',
        name: cat?.name || '',
        nameEn: cat?.nameEn || '',
      };
      let products = await enrichProductList(data.items || [], meta);
      if (sort !== 'default') products = sortProductsClientBilingual(products, sort);
      const itemsCount = (data.items || []).length;
      const pageLimit = data.pageSize || limit;

      return sendJson(res, 200, {
        meta: {
          categoryId: Number(categoryId),
          ...meta,
          totalCount: data.total ?? null,
        },
        products,
        page: data.page || page,
        limit: pageLimit,
        hasMore: data.total != null ? page * pageLimit < data.total : itemsCount >= pageLimit,
      });
    }

    if (url.pathname === '/api/elryan/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await elryanAr.searchProducts(query, page, limit, beautyIds);
      const meta = { path: `بحث: ${query}`, pathEn: `Search: ${query}` };
      let products = await enrichProductList(data.items || [], meta);
      if (sort !== 'default') products = sortProductsClientBilingual(products, sort);
      const itemsCount = (data.items || []).length;
      return sendJson(res, 200, {
        meta: { query, ...meta, pathEn: `Search: ${query}` },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: data.total != null ? page * limit < data.total : itemsCount >= limit,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/elryan\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await fetchProductByIdBilingual(id);
      if (!product?.id) return sendJson(res, 404, { error: 'Product not found' });
      return sendJson(res, 200, { product });
    }

    return sendJson(res, 404, { error: 'Unknown Elryan API route' });
  } catch (err) {
    console.error('Elryan API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}
