import { fetchCategoryTree } from './categories.js';
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

  async health() {
    const creds = amazonCredentials();
    const tree = await fetchCategoryTree();
    if (!creds.configured) {
      return {
        ok: false,
        configured: false,
        categories: tree.tree?.[0]?.children?.length || 0,
        message: 'أضف AMAZON_ACCESS_KEY و AMAZON_SECRET_KEY و AMAZON_PARTNER_TAG لتفعيل جلب المنتجات',
      };
    }
    try {
      const sample = await searchProducts('makeup', { page: 1, limit: 1 });
      return {
        ok: true,
        configured: true,
        categories: tree.leaves?.length || 0,
        sampleProducts: sample.total,
      };
    } catch (err) {
      return {
        ok: false,
        configured: true,
        categories: tree.leaves?.length || 0,
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
};
