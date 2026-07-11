import { fetchCategoryTree } from './categories.js';
import {
  countProducts,
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
export const KHATON_META = {
  id: 'khaton',
  label: 'خاتون بيوتي Khaton Beauty',
  domain: 'khaton.beauty',
  siteUrl: 'https://khaton.beauty/',
};

export const khatonAdapter = {
  ...KHATON_META,

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
