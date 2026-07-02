import {
  fetchCategoryTree as fetchBeautywayCategoryTree,
  fetchCategoryProducts as fetchBeautywayCategoryProducts,
  searchProducts as searchBeautywayProducts,
  fetchProductDetail as fetchBeautywayProductDetail,
  normalizeProductSummary as normalizeBeautywayProductSummary,
  sortProductsClient as sortBeautywayProductsClient,
} from '../../beautyway-api.js';
import { createCategoryCache } from '../cache.js';
import { createCatalogHandler } from '../create-catalog-handler.js';

const cache = createCategoryCache(fetchBeautywayCategoryTree);

export const handleBeautywayApi = createCatalogHandler({
  storeId: 'beautyway',
  label: 'Beauty Way',
  health: { source: 'beautyway-iq.com', scope: 'beauty-perfumes-makeup', bilingual: true },
  cache,
  fetchCategoryProducts: fetchBeautywayCategoryProducts,
  searchProducts: searchBeautywayProducts,
  fetchProductDetail: fetchBeautywayProductDetail,
  normalizeProductSummary: normalizeBeautywayProductSummary,
  sortProductsClient: sortBeautywayProductsClient,
  productDetailOptions: (q) => ({ slug: q.slug || '' }),
  wrapProductDetail: (raw) => raw,
});
