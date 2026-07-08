import { miswagAdapter, MISWAG_META } from './miswag/index.js';

/** سجل المتاجر — أضف متجراً جديداً هنا مستقبلاً */
const ADAPTERS = {
  miswag: miswagAdapter,
};

export const STORE_LIST = [MISWAG_META];

export function getStoreAdapter(storeId) {
  return ADAPTERS[storeId] || null;
}

export function listStores() {
  return STORE_LIST.map((s) => ({
    id: s.id,
    label: s.label,
    domain: s.domain,
    siteUrl: s.siteUrl,
  }));
}
