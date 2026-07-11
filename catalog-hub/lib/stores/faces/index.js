import { fetchCategoryTree } from './categories.js';
import {
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
import { fetchListingHtml } from './client.js';
import { parseListingHtml } from './parse.js';

export const FACES_META = {
  id: 'faces',
  label: 'وجوه FACES',
  domain: 'faces.ae',
  siteUrl: 'https://www.faces.ae/ar/',
};

export const facesAdapter = {
  ...FACES_META,

  async health() {
    const html = await fetchListingHtml({ lang: 'ar', cgid: 'makeup', page: 1, limit: 12 }).catch(() => '');
    const items = parseListingHtml(html, { lang: 'ar' });
    return {
      ok: items.length > 0,
      products: items.length,
      categories: 8,
    };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
