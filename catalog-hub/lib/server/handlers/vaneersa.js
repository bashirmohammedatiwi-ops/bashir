import {
  fetchCategoryTree as fetchVaneersaCategoryTree,
  fetchCategoryProducts as fetchVaneersaCategoryProducts,
  searchProducts as searchVaneersaProducts,
  fetchProductDetail as fetchVaneersaProductDetail,
  normalizeProductSummary as normalizeVaneersaProductSummary,
  normalizeProductDetail as normalizeVaneersaProductDetail,
  sortProductsClient as sortVaneersaProductsClient,
} from '../../vaneersa-api.js';
import { createCategoryCache } from '../cache.js';
import { createCatalogHandler } from '../create-catalog-handler.js';

const cache = createCategoryCache(fetchVaneersaCategoryTree);

export const handleVaneersaApi = createCatalogHandler({
  storeId: 'vaneersa',
  label: 'Vaneersa',
  health: { source: 'vaneersa.com', scope: 'beauty-skincare-makeup', bilingual: true },
  cache,
  fetchCategoryProducts: fetchVaneersaCategoryProducts,
  searchProducts: searchVaneersaProducts,
  fetchProductDetail: fetchVaneersaProductDetail,
  normalizeProductSummary: normalizeVaneersaProductSummary,
  normalizeProductDetail: normalizeVaneersaProductDetail,
  sortProductsClient: sortVaneersaProductsClient,
  productDetailOptions: (q) => ({ barcode: q.barcode || '' }),
  wrapProductDetail: (raw) => normalizeVaneersaProductDetail(raw),
});
