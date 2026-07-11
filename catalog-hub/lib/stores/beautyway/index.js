import { fetchCategoryTree } from './categories.js';
import {
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
import { fetchShopHtml } from './client.js';
import { parseListingHtml } from './parse.js';

export const BEAUTYWAY_META = {
  id: 'beautyway',
  label: 'بيوتي وي Beauty Way',
  domain: 'beautyway-iq.com',
  siteUrl: 'https://www.beautyway-iq.com/',
};

export const beautywayAdapter = {
  ...BEAUTYWAY_META,

  async health() {
    const html = await fetchShopHtml({ lang: 'ar', page: 1 });
    const items = parseListingHtml(html);
    return { ok: true, productsSample: items.length };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
