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

function withHardTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

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

  /** بحث برقم مسواگ الداخلي أو باركود EAN العالمي — مهلة صارمة حتى لا يعلّق الواجهة */
  async searchBarcode(code) {
    const digits = String(code || '').replace(/\D/g, '');
    if (!digits) return [];

    const run = async () => {
      // معرّف مسواگ (17…) أولاً؛ وإلا باركود EAN/UPC
      if (isMiswagInternalId(digits)) {
        const byId = await searchByMiswagId(digits);
        if (byId.length) return byId;
      }
      if (/^\d{8,14}$/.test(digits)) return searchByEan(digits);
      return [];
    };

    try {
      // 22ث — يتوافق مع مهلة الواجهة ومسار beauty/gulf sweeps
      return await withHardTimeout(run(), 22_000, []);
    } catch {
      return [];
    }
  },
};
