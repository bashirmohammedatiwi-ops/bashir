import { fetchCategoryTree } from './categories.js';
import {
  countProducts,
  fetchProductDetail,
  listCategoryProducts,
  orisdiBarcodeIndexStats,
  searchBarcode,
  searchProducts,
  sortProductsClient,
} from './products.js';

export const ORISDI_META = {
  id: 'orisdi',
  label: 'أورزدي Orisdi',
  domain: 'orisdi.com',
  siteUrl: 'https://orisdi.com/',
};

export const orisdiAdapter = {
  ...ORISDI_META,

  async health() {
    const [products, categories, barcodes] = await Promise.all([
      countProducts().catch(() => 0),
      fetchCategoryTree().catch(() => ({ leaves: [] })),
      Promise.resolve(orisdiBarcodeIndexStats()),
    ]);
    return {
      ok: products > 0,
      products,
      categories: categories.leaves?.length || 0,
      barcodes: barcodes.barcodes || 0,
    };
  },

  fetchCategoryTree,
  listCategoryProducts,
  searchProducts,
  fetchProductDetail,
  searchBarcode,
  sortProductsClient,
};
