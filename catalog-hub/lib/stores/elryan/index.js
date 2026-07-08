import { fetchCategoryTree } from './categories.js';
import {
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
import { searchIndex, totalOf } from './client.js';

export const ELRYAN_META = {
  id: 'elryan',
  label: 'الريان Elryan',
  domain: 'elryan.com',
  siteUrl: 'https://www.elryan.com/ar/',
};

export const elryanAdapter = {
  ...ELRYAN_META,

  async health() {
    const [cats, products] = await Promise.all([
      searchIndex('ar', 'category', {
        size: 0,
        track_total_hits: true,
        query: { term: { is_active: true } },
      }),
      searchIndex('ar', 'product', {
        size: 0,
        track_total_hits: true,
        query: { bool: { filter: [{ term: { status: 1 } }] } },
      }),
    ]);
    return {
      ok: true,
      categories: totalOf(cats),
      products: totalOf(products),
    };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
