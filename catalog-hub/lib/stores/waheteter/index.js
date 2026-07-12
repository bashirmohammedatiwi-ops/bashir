import { fetchCategoryTree } from './categories.js';
import {
  countProducts,
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';

export const WAHETETER_META = {
  id: 'waheteter',
  label: 'واحة عطر Wahet Eter',
  domain: 'waheteter.com',
  siteUrl: 'https://waheteter.com/',
};

export const waheteterAdapter = {
  ...WAHETETER_META,

  async health() {
    const [products, categories] = await Promise.all([
      countProducts(),
      fetchCategoryTree().catch(() => ({ leaves: [] })),
    ]);
    return {
      ok: products > 0,
      products,
      categories: categories.leaves?.length || 0,
    };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
