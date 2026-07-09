import {
  isMiswagCatalogWarm,
  queryMiswagIndex,
  findMiswagByBarcode,
  findMiswagById,
  stubToBarcodeHit,
} from './catalog-index.js';
import { isMiswagInternalId } from './ids.js';

export function isWarm() {
  return isMiswagCatalogWarm(30);
}

export function searchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  return queryMiswagIndex({ query, categoryId, page, limit });
}

export function listCategoryProducts(categoryAlias, { page = 1, limit = 30 } = {}) {
  return queryMiswagIndex({ query: '', categoryId: categoryAlias, page, limit });
}

export function searchBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits) return [];

  if (isMiswagInternalId(digits)) {
    const hit = findMiswagById(digits);
    if (hit) return [stubToBarcodeHit(hit, { digits, matchType: 'miswag_id' })];
    return [];
  }

  if (/^\d{8,14}$/.test(digits)) {
    const hit = findMiswagByBarcode(digits);
    if (hit) return [stubToBarcodeHit(hit, { digits, matchType: 'index' })];
    return [];
  }

  return [];
}
