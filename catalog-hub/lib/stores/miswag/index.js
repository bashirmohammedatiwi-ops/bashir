import { fetchCategoryTree, listCategoryProducts, searchProducts, sortProductsClient } from './categories.js';
import { fetchProductDetail } from './products.js';

export const MISWAG_META = {
  id: 'miswag',
  label: 'مسواگ Miswag',
  domain: 'miswag.com',
  siteUrl: 'https://miswag.com',
};

export const miswagAdapter = {
  ...MISWAG_META,

  async health() {
    const { tree } = await fetchCategoryTree();
    return { ok: true, categories: tree.length };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  sortProductsClient,
  fetchProductDetail,

  async searchBarcode(barcode) {
    const digits = String(barcode || '').replace(/\D/g, '');
    if (!digits) return [];
    const { items } = await searchProducts(digits, { page: 1, limit: 10 });
    const hits = [];
    for (const item of items) {
      const detail = await fetchProductDetail(item.id, { light: true }).catch(() => null);
      if (detail) {
        hits.push({
          ...item,
          ...detail,
          matchType: 'product',
          barcode: digits,
        });
      }
    }
    return hits;
  },
};
