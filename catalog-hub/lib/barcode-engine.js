/**
 * Cross-store barcode search engine — delegates to full per-store pipelines.
 */
export {
  STORE_META,
  warmupBarcodeSearch,
  normalizeBarcodeQuery,
  normalizeGtinCompare,
  searchBarcodeAllStores,
  searchBarcodeAllStoresStreaming,
  clearBarcodeSearchCache,
  SEARCHERS,
} from './adapters/store-barcode-search.js';
