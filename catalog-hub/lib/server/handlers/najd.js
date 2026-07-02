import {
  fetchCategoryTree as fetchNajdCategoryTree,
  fetchCategoryProducts as fetchNajdCategoryProducts,
  searchProducts as searchNajdProducts,
  fetchProductDetail as fetchNajdProductDetail,
  normalizeProductSummary as normalizeNajdProductSummary,
  normalizeProductDetail as normalizeNajdProductDetail,
  sortProductsClient as sortNajdProductsClient,
} from '../../najd-api.js';
import { createCategoryCache } from '../cache.js';
import { createCatalogHandler } from '../create-catalog-handler.js';

const cache = createCategoryCache(fetchNajdCategoryTree);

export const handleNajdApi = createCatalogHandler({
  storeId: 'najd',
  label: 'Najd',
  health: { source: 'najdalatheyah.com', scope: 'perfumes-niche-global', bilingual: true },
  cache,
  fetchCategoryProducts: fetchNajdCategoryProducts,
  searchProducts: searchNajdProducts,
  fetchProductDetail: fetchNajdProductDetail,
  normalizeProductSummary: normalizeNajdProductSummary,
  normalizeProductDetail: normalizeNajdProductDetail,
  sortProductsClient: sortNajdProductsClient,
  enrichCategoryMeta: true,
  productDetailOptions: (q) => ({ barcode: q.barcode || '' }),
  wrapProductDetail: (raw) => normalizeNajdProductDetail(raw),
});
