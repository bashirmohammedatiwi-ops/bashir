import { fetchCategoryTree } from './categories.js';
import {
  countProducts,
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';
import { fetchPageHtml } from './client.js';
import { parseItemListJsonLd } from './parse.js';

export const NICEONE_META = {
  id: 'niceone',
  label: 'نايس ون Nice One',
  domain: 'niceonesa.com',
  siteUrl: 'https://niceonesa.com/ar/',
};

export const niceoneAdapter = {
  ...NICEONE_META,
  barcodeTextFallback: false,

  async health() {
    const [products, categories] = await Promise.all([
      countProducts().catch(() => 0),
      fetchCategoryTree().catch(() => ({ leaves: [] })),
    ]);
    const html = await fetchPageHtml('makeup', { lang: 'ar' }).catch(() => '');
    const sample = parseItemListJsonLd(html).items.length;
    return {
      ok: sample > 0,
      products: products || sample,
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
