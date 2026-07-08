import { fetchCategoryTree, listCategoryProducts, searchProducts, sortProductsClient } from './categories.js';
import { fetchProductDetail } from './products.js';
import { isMiswagInternalId, searchByMiswagId } from './id-lookup.js';
import { searchByEan } from './ean-search.js';

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

  /** بحث برقم مسواگ الداخلي أو باركود EAN العالمي */
  async searchBarcode(code) {
    const digits = String(code || '').replace(/\D/g, '');
    if (!digits) return [];
    if (isMiswagInternalId(digits)) return searchByMiswagId(digits);
    if (/^\d{8,14}$/.test(digits)) return searchByEan(digits);
    return [];
  },
};
