import { fetchCategoryTree, listCategoryProducts, searchProducts, sortProductsClient } from './categories.js';
import { fetchProductDetail } from './products.js';
import { searchByBarcode } from './barcode.js';

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
    return searchByBarcode(barcode);
  },
};
