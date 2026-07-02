import {
  fetchCategoryTree as fetchOrisdiCategoryTree,
  fetchCategoryProducts as fetchOrisdiCategoryProducts,
  searchProducts as searchOrisdiProducts,
  fetchProductDetail as fetchOrisdiProductDetail,
  normalizeProductSummary as normalizeOrisdiProductSummary,
  sortProductsClient as sortOrisdiProductsClient,
} from '../../orisdi-api.js';
import { createCategoryCache } from '../cache.js';
import { createCatalogHandler } from '../create-catalog-handler.js';

const cache = createCategoryCache(fetchOrisdiCategoryTree);

export const handleOrisdiApi = createCatalogHandler({
  storeId: 'orisdi',
  label: 'Orisdi',
  health: { source: 'orisdi.com', scope: 'beauty-perfumes-makeup', bilingual: true },
  cache,
  fetchCategoryProducts: fetchOrisdiCategoryProducts,
  searchProducts: searchOrisdiProducts,
  fetchProductDetail: fetchOrisdiProductDetail,
  normalizeProductSummary: normalizeOrisdiProductSummary,
  sortProductsClient: sortOrisdiProductsClient,
  productDetailOptions: (q) => ({ barcode: q.barcode || '' }),
  wrapProductDetail: (raw) => raw,
});
