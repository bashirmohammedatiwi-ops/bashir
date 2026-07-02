import {
  fetchCategoryTree as fetchMiswagCategoryTree,
  fetchCategoryProducts as fetchMiswagCategoryProducts,
  searchProducts as searchMiswagProducts,
  fetchProductDetail as fetchMiswagProductDetail,
  normalizeProductSummary as normalizeMiswagProductSummary,
  normalizeProductDetail as normalizeMiswagProductDetail,
  sortProductsClient as sortMiswagProductsClient,
  fetchBrands as fetchMiswagBrands,
} from '../../miswag-api.js';
import { CACHE_MS, sendJson, parseQuery } from '../http.js';

let miswagCategoryCache = { tree: null, leaves: null, fetchedAt: 0 };

async function getMiswagCategoryTree() {
  if (miswagCategoryCache.tree && Date.now() - miswagCategoryCache.fetchedAt < CACHE_MS) {
    return miswagCategoryCache;
  }
  const { tree, leaves } = await fetchMiswagCategoryTree();
  miswagCategoryCache = { tree, leaves, fetchedAt: Date.now() };
  return miswagCategoryCache;
}

export async function handleMiswagApi(req, res, url) {
  try {
    const q = parseQuery(url);

    if (url.pathname === '/api/miswag/health') {
      return sendJson(res, 200, { ok: true, source: 'miswag.com', scope: 'beauty', bilingual: true });
    }

    if (url.pathname === '/api/miswag/categories') {
      const { tree, leaves } = await getMiswagCategoryTree();
      return sendJson(res, 200, { tree, leaves, totalLeaves: leaves.length });
    }

    if (url.pathname === '/api/miswag/brands') {
      const query = q.q || q.query || '';
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await fetchMiswagBrands({ query, cursor: q.cursor || '', limit });
      return sendJson(res, 200, data);
    }

    const catMatch = url.pathname.match(/^\/api\/miswag\/categories\/([^/]+)\/products$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const sort = q.sort || 'default';
      const data = await fetchMiswagCategoryProducts(categoryId, { page, limit, sort });
      const products = (data.items || []).map((p) => normalizeMiswagProductSummary(p));

      let name = categoryId;
      let path = categoryId;
      try {
        const { leaves, tree } = await getMiswagCategoryTree();
        const node = [...(leaves || []), ...(tree || [])].find((n) => n.slug === categoryId || n.id === categoryId);
        if (node) { name = node.name || categoryId; path = node.name || categoryId; }
      } catch { /* keep alias */ }

      return sendJson(res, 200, {
        meta: { categoryId, path, name },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: !!data.hasMore,
        total: data.total ?? null,
        cursor: data.cursor || null,
      });
    }

    if (url.pathname === '/api/miswag/search') {
      const query = q.q || q.search || '';
      if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
      const page = Number(q.page) || 1;
      const limit = Math.min(Number(q.limit) || 30, 60);
      const data = await searchMiswagProducts(query, page, limit);
      let products = (data.items || []).map((p) => normalizeMiswagProductSummary(p));
      const sort = q.sort || 'default';
      if (sort !== 'default') products = sortMiswagProductsClient(products, sort);
      return sendJson(res, 200, {
        meta: { query, path: `بحث: ${query}`, fallback: !!data.fallback },
        products,
        page: data.page || page,
        limit: data.pageSize || limit,
        hasMore: (data.items || []).length >= limit,
        total: data.total ?? null,
      });
    }

    const productMatch = url.pathname.match(/^\/api\/miswag\/products\/(\d+)$/);
    if (productMatch) {
      const id = productMatch[1];
      const detail = await fetchMiswagProductDetail(id);
      if (!detail?.id) return sendJson(res, 404, { error: 'Product not found' });
      const normalized = normalizeMiswagProductDetail(detail);
      return sendJson(res, 200, { product: normalized });
    }

    return sendJson(res, 404, { error: 'Unknown Miswag API route' });
  } catch (err) {
    console.error('Miswag API error:', err.message);
    return sendJson(res, 502, { error: err.message });
  }
}
