import { findCategoryNode } from '../category-scope.js';
import { sendJson, parseQuery, pageLimit, pageNum } from './http.js';

/**
 * Standard catalog routes: health, categories, category products, search, product detail.
 */
export function createCatalogHandler({
  storeId,
  label,
  health,
  cache,
  fetchCategoryProducts,
  searchProducts,
  fetchProductDetail,
  normalizeProductSummary,
  normalizeProductDetail,
  sortProductsClient,
  categoryIdPattern = '[^/]+',
  productIdPattern = '\\d+',
  includeAllInCategories = false,
  enrichCategoryMeta = false,
  productDetailOptions = (q) => ({}),
  wrapProductDetail = null,
  searchExtraMeta = () => ({}),
}) {
  const prefix = `/api/${storeId}`;

  return async function handle(req, res, url) {
    try {
      const q = parseQuery(url);

      if (url.pathname === `${prefix}/health`) {
        return sendJson(res, 200, { ok: true, ...health });
      }

      if (url.pathname === `${prefix}/categories`) {
        const data = await cache.get();
        const payload = {
          tree: data.tree,
          leaves: data.leaves,
          totalLeaves: data.leaves?.length || 0,
        };
        if (includeAllInCategories && data.all) payload.all = data.all;
        return sendJson(res, 200, payload);
      }

      const catMatch = url.pathname.match(new RegExp(`^${prefix}/categories/(${categoryIdPattern})/products$`));
      if (catMatch) {
        const categoryId = decodeURIComponent(catMatch[1]);
        const page = pageNum(q);
        const limit = pageLimit(q);
        const sort = q.sort || 'default';
        const data = await fetchCategoryProducts(categoryId, { page, limit, sort });

        let node = null;
        if (enrichCategoryMeta) {
          const { tree, leaves } = await cache.get();
          node = findCategoryNode(tree, categoryId) || leaves?.find((c) => c.id === categoryId);
        }

        let products = (data.items || []).map((p) =>
          normalizeProductSummary(p, node ? { name: node.name, nameEn: node.nameEn, path: node.path } : {}),
        );
        if (sort !== 'default' && sortProductsClient) {
          products = sortProductsClient(products, sort);
        }

        return sendJson(res, 200, {
          meta: {
            categoryId,
            path: node?.path || categoryId,
            name: node?.name || categoryId,
            nameEn: node?.nameEn || '',
          },
          products,
          page: data.page || page,
          limit: data.pageSize || limit,
          hasMore: !!data.hasMore,
          total: data.total ?? null,
        });
      }

      if (url.pathname === `${prefix}/search`) {
        const query = q.q || q.search || '';
        if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
        const page = pageNum(q);
        const limit = pageLimit(q);
        const sort = q.sort || 'default';
        const data = await searchProducts(query, page, limit);
        let products = (data.items || []).map((p) =>
          normalizeProductSummary(p, { path: `بحث: ${query}` }),
        );
        if (sort !== 'default' && sortProductsClient) {
          products = sortProductsClient(products, sort);
        }
        return sendJson(res, 200, {
          meta: { query, path: `بحث: ${query}`, ...searchExtraMeta(data) },
          products,
          page: data.page || page,
          limit: data.pageSize || limit,
          hasMore: !!data.hasMore,
          total: data.total ?? null,
        });
      }

      const productMatch = url.pathname.match(new RegExp(`^${prefix}/products/(${productIdPattern})$`));
      if (productMatch) {
        const id = productMatch[1];
        const raw = await fetchProductDetail(id, productDetailOptions(q));
        if (!raw?.id) return sendJson(res, 404, { error: 'Product not found' });
        const product = wrapProductDetail
          ? wrapProductDetail(raw)
          : normalizeProductDetail
            ? normalizeProductDetail(raw)
            : raw;
        return sendJson(res, 200, { product });
      }

      return sendJson(res, 404, { error: `Unknown ${label} API route` });
    } catch (err) {
      console.error(`${label} API error:`, err.message);
      return sendJson(res, 502, { error: err.message });
    }
  };
}
