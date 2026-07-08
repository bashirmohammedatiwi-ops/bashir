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
      if (isMiswagInternalId(digits)) return searchByMiswagId(digits);
      if (/^\d{8,14}$/.test(digits)) return searchByEan(digits);
      return [];
    };

    try {
      // 16ث أقصى — الواجهة تنتظر 22ث؛ نترك هامشاً للاستجابة
      return await withHardTimeout(run(), 16_000, []);
    } catch {
      return [];
    }
  },
};
