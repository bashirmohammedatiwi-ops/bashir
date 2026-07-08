import { sendJson, parseQuery } from '../http.js';
import { getStoreAdapter } from '../../stores/registry.js';
import { normalizeProduct, toImportPayload } from '../../core/product.js';
import { isMiswagInternalId } from '../../stores/miswag/id-lookup.js';

function storeOr404(res, storeId) {
  const adapter = getStoreAdapter(storeId);
  if (!adapter) {
    sendJson(res, 404, { error: `متجر غير معروف: ${storeId}` });
    return null;
  }
  return adapter;
}

export async function handleStoreApi(req, res, url) {
  const q = parseQuery(url);

  if (url.pathname === '/api/catalog/stores') {
    const { listStores } = await import('../../stores/registry.js');
    return sendJson(res, 200, { stores: listStores() });
  }

  const storeMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/health$/);
  if (storeMatch) {
    const adapter = storeOr404(res, storeMatch[1]);
    if (!adapter) return;
    try {
      const status = await adapter.health();
      return sendJson(res, 200, { store: adapter.id, ...status });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const catMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/categories$/);
  if (catMatch) {
    const adapter = storeOr404(res, catMatch[1]);
    if (!adapter) return;
    try {
      const tree = await adapter.fetchCategoryTree();
      return sendJson(res, 200, { ...tree, totalLeaves: tree.leaves?.length || 0 });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const catProdMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/categories\/([^/]+)\/products$/);
  if (catProdMatch) {
    const adapter = storeOr404(res, catProdMatch[1]);
    if (!adapter) return;
    const categoryId = decodeURIComponent(catProdMatch[2]);
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 30, 60);
    const sort = q.sort || 'default';
    try {
      const data = await adapter.listCategoryProducts(categoryId, { page, limit, sort });
      return sendJson(res, 200, {
        meta: { categoryId, page, limit, sort },
        products: data.items,
        page: data.page,
        limit: data.pageSize,
        hasMore: data.hasMore,
        total: data.total,
      });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const searchMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/search$/);
  if (searchMatch) {
    const adapter = storeOr404(res, searchMatch[1]);
    if (!adapter) return;
    const query = q.q || q.query || '';
    if (!query.trim()) return sendJson(res, 400, { error: 'q required' });
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 30, 60);
    const categoryId = q.category || q.categoryId || '';
    try {
      const data = await adapter.searchProducts(query, { page, limit, categoryId });
      let products = data.items;
      const sort = q.sort || 'default';
      if (sort !== 'default' && adapter.sortProductsClient) {
        products = adapter.sortProductsClient(products, sort);
      }
      return sendJson(res, 200, {
        meta: { query, page, limit, categoryId: categoryId || undefined },
        products,
        page: data.page,
        limit: data.pageSize,
        hasMore: data.hasMore,
        total: data.total,
      });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const productMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/products\/(\d+)$/);
  if (productMatch) {
    const adapter = storeOr404(res, productMatch[1]);
    if (!adapter) return;
    const id = productMatch[2];
    const light = q.light === '1' || q.light === 'true';
    try {
      const raw = await adapter.fetchProductDetail(id, { light });
      if (!raw?.id) return sendJson(res, 404, { error: 'Product not found' });
      const product = normalizeProduct({ ...raw, store: adapter.id, storeLabel: adapter.label });
      return sendJson(res, 200, { product });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  return false;
}

export async function handleImportApi(req, res, url) {
  const q = parseQuery(url);

  const productMatch = url.pathname.match(/^\/api\/import\/([^/]+)\/products\/(\d+)$/);
  if (productMatch) {
    const adapter = getStoreAdapter(productMatch[1]);
    if (!adapter) return sendJson(res, 404, { error: 'متجر غير معروف' });
    const id = productMatch[2];
    const light = q.light === '1' || q.light === 'true';
    try {
      const raw = await adapter.fetchProductDetail(id, { light: false });
      if (!raw?.id) return sendJson(res, 404, { error: 'لم يُعثر على المنتج' });
      const product = toImportPayload({ ...raw, store: adapter.id, storeLabel: adapter.label });
      return sendJson(res, 200, { product });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  const searchMatch = url.pathname === '/api/import/search';
  if (searchMatch) {
    const query = q.q || q.barcode || '';
    const storeId = q.store || 'miswag';
    if (!query.trim()) return sendJson(res, 400, { error: 'أدخل نص بحث أو رقم مسواگ' });
    const adapter = getStoreAdapter(storeId);
    if (!adapter) return sendJson(res, 404, { error: 'متجر غير معروف' });

    const digits = query.replace(/\D/g, '');
    try {
      let results = [];
      const useMiswagId = storeId === 'miswag' && isMiswagInternalId(digits);
      if (useMiswagId && adapter.searchBarcode) {
        results = await adapter.searchBarcode(digits);
      } else if (digits.length >= 8 && adapter.searchBarcode && storeId !== 'miswag') {
        results = await adapter.searchBarcode(digits);
      }
      if (!results.length) {
        const data = await adapter.searchProducts(query, { page: 1, limit: 20 });
        results = data.items.map((item) => ({
          store: adapter.id,
          storeLabel: adapter.label,
          id: item.id,
          sourceId: item.id,
          name: item.nameAr,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          brandAr: item.brandAr,
          manufacturer: item.brandAr,
          thumb: item.thumb,
          price: item.price,
          matchType: 'text',
        }));
      } else {
        results = results.map((item) => ({
          store: adapter.id,
          storeLabel: adapter.label,
          id: item.id,
          sourceId: item.id,
          name: item.nameAr,
          nameEn: item.nameEn,
          brandAr: item.brandAr,
          manufacturer: item.brandAr,
          thumb: item.thumb,
          price: item.price,
          shadeCount: item.shadeCount,
          shadeName: item.shadeName,
          miswagId: item.miswagId || digits,
          barcode: item.barcode || digits,
          matchType: item.matchType || 'miswag_id',
        }));
      }
      return sendJson(res, 200, { query, results, stores: [{ id: adapter.id, count: results.length }] });
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  return false;
}
