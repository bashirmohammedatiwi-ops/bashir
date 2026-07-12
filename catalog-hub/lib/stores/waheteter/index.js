import { fetchCategoryTree } from './categories.js';
import {
  countProducts,
  fetchProductDetail,
  listCategoryProducts,
  searchBarcode,
  searchProducts,
  sortProductsClient,
  waheteterBarcodeIndexStats,
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
    const [products, categories, index] = await Promise.all([
      countProducts(),
      fetchCategoryTree().catch(() => ({ leaves: [] })),
      Promise.resolve(waheteterBarcodeIndexStats()),
    ]);
    return {
      ok: products > 0 || index.barcodes > 0,
      products: products || index.products,
      categories: categories.leaves?.length || 0,
      barcodes: index.barcodes,
      indexBuiltAt: index.builtAt || 0,
    };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
