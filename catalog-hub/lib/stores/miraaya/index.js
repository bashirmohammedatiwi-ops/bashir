import { fetchCategoryTree } from './categories.js';
import {
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
import { algoliaSearch } from './client.js';

export const MIRAAYA_META = {
  id: 'miraaya',
  label: 'ميرايا Miraaya',
  domain: 'miraaya.com',
  siteUrl: 'https://miraaya.com/ar/',
};

export const miraayaAdapter = {
  ...MIRAAYA_META,

  async health() {
    const [search, cats] = await Promise.all([
      algoliaSearch('serum', { lang: 'ar', limit: 1 }).catch(() => ({ total: 0, hits: [] })),
      fetchCategoryTree().catch(() => ({ leaves: [] })),
    ]);
    return {
      ok: search.total > 0 || search.hits?.length > 0,
      products: search.total || 0,
      categories: cats.leaves?.length || 0,
    };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
