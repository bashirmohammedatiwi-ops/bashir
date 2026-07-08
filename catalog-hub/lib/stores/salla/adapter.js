import { createSallaClient } from './client.js';
import { createSallaCategoriesApi } from './categories.js';
import { createSallaProductsApi } from './products.js';

export function createSallaAdapter(meta) {
  const client = createSallaClient(meta.storeIdentifier || meta.domain, {
    cachePrefix: meta.id,
  });
  const categories = createSallaCategoriesApi(client);
  const products = createSallaProductsApi(client);

  return {
    ...meta,
    async health() {
      const { data = [] } = await client.sallaFetch('/categories', { ttl: 60_000 });
      return { ok: true, categories: data.length };
    },
    fetchCategoryTree: categories.fetchCategoryTree,
    listCategoryProducts: products.listCategoryProducts,
    searchProducts: products.searchProducts,
    fetchProductDetail: products.fetchProductDetail,
    searchBarcode: products.searchBarcode,
    sortProductsClient: products.sortProductsClient,
  };
}
