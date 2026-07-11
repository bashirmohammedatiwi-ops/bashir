import { fetchCategoryTree } from './categories.js';
import {
  getAmazonCrawlStatus,
  startAmazonBeautyCrawl,
  stopAmazonBeautyCrawl,
} from './crawl.js';
import { getAmazonIndexStats } from './catalog-index.js';
import {
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
import { amazonCredentials, BEAUTY_ROOT_NODE } from './client.js';

export const AMAZON_META = {
  id: 'amazon',
  label: 'أمازون بيوتي Amazon Beauty',
  domain: 'amazon.com',
  siteUrl: `https://www.amazon.com/b?node=${BEAUTY_ROOT_NODE}`,
};

export const amazonAdapter = {
  ...AMAZON_META,
  barcodeTextFallback: true,

  async health() {
    const creds = amazonCredentials();
    const tree = await fetchCategoryTree();
    const catalog = getAmazonCrawlStatus();
    const mode = creds.configured ? 'paapi' : 'scrape';

    try {
      const sample = await searchProducts('makeup', { page: 1, limit: 1 });
      return {
        ok: true,
        configured: creds.configured,
        mode,
        categories: tree.leaves?.length || 0,
        sampleProducts: sample.total,
        catalog,
        message: 'بحث ثنائي اللغة (عربي+إنجليزي) مع كل التدرجات عبر صفحات Amazon',
      };
    } catch (err) {
      return {
        ok: catalog.productCount > 0,
        configured: creds.configured,
        mode,
        categories: tree.leaves?.length || 0,
        catalog,
        message: err.message,
      };
    }
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,

  /** حالة فهرس Beauty المحلي */
  getCatalogStatus() {
    return getAmazonCrawlStatus();
  },

  startCatalogCrawl(opts = {}) {
    return startAmazonBeautyCrawl(opts);
  },

  stopCatalogCrawl() {
    return stopAmazonBeautyCrawl();
  },

  getIndexStats() {
    return getAmazonIndexStats();
  },
};
