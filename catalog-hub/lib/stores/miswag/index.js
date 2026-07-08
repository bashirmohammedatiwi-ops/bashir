import { fetchCategoryTree, listCategoryProducts, searchProducts, sortProductsClient } from './categories.js';
import { fetchProductDetail } from './products.js';
import { searchByMiswagId } from './id-lookup.js';

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

  /** بحث برقم مسواگ الداخلي (ليس باركود EAN) */
  async searchBarcode(code) {
    return searchByMiswagId(code);
  },
};
