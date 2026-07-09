import {
  fetchCategoryTree,
  listCategoryProducts as listCategoryProductsLive,
  searchProducts as searchProductsLive,
  sortProductsClient,
} from './categories.js';
import { fetchProductDetail } from './products.js';
import { searchByMiswagId } from './id-lookup.js';
import { searchByEan } from './ean-search.js';
import { isMiswagInternalId } from './ids.js';
import * as local from './local.js';
import {
  getMiswagCrawlStatus,
  startMiswagCatalogCrawl,
  stopMiswagCatalogCrawl,
} from './crawl.js';
import { getMiswagIndexStats, isMiswagCatalogWarm } from './catalog-index.js';

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
    const catalog = getMiswagCrawlStatus();
    return {
      ok: true,
      categories: tree.length,
      catalog,
      localProducts: catalog.productCount || 0,
    };
  },

  fetchCategoryTree,
  sortProductsClient,
  fetchProductDetail,

  /** بحث نصي — من الفهرس المحلي إن وُجد، وإلا Typesense مباشرة */
  async searchProducts(query, opts = {}) {
    if (local.isWarm()) return local.searchProducts(query, opts);
    return searchProductsLive(query, opts);
  },

  /** تصفح قسم — من الفهرس المحلي إن وُجد */
  async listCategoryProducts(categoryAlias, opts = {}) {
    if (local.isWarm()) return local.listCategoryProducts(categoryAlias, opts);
    return listCategoryProductsLive(categoryAlias, opts);
  },

  /**
   * بحث بالباركود — الفهرس المحلي أولاً (فوري).
   * إن لم يُحمَّل الفهرس بعد، يُستخدم المسار الحي القديم.
   */
  async searchBarcode(code) {
    const digits = String(code || '').replace(/\D/g, '');
    if (!digits) return [];

    if (local.isWarm()) {
      const hits = local.searchBarcode(digits);
      if (hits.length) return hits;
      return [];
    }

    const run = async () => {
      if (isMiswagInternalId(digits)) {
        const byId = await searchByMiswagId(digits);
        if (byId.length) return byId;
      }
      if (/^\d{8,14}$/.test(digits)) return searchByEan(digits);
      return [];
    };

    try {
      return await withHardTimeout(run(), 22_000, []);
    } catch {
      return [];
    }
  },

  getCatalogStatus() {
    return getMiswagCrawlStatus();
  },

  startCatalogCrawl(opts = {}) {
    return startMiswagCatalogCrawl(opts);
  },

  stopCatalogCrawl() {
    return stopMiswagCatalogCrawl();
  },

  getIndexStats() {
    return getMiswagIndexStats();
  },

  isCatalogWarm() {
    return isMiswagCatalogWarm(30);
  },
};
