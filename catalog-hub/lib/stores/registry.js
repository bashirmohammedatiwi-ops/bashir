import { miswagAdapter, MISWAG_META } from './miswag/index.js';
import { najdalatheyahAdapter, NAJD_META } from './najdalatheyah/index.js';

/** سجل المتاجر */
const ADAPTERS = {
  miswag: miswagAdapter,
  najdalatheyah: najdalatheyahAdapter,
};

export const STORE_LIST = [MISWAG_META, NAJD_META];

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

/** تحليل قائمة متاجر من query param: all | miswag,najdalatheyah */
export function parseStoreIds(raw, { defaultAll = false } = {}) {
  const val = String(raw || '').trim();
  if (!val) {
    return defaultAll ? listStores().map((s) => s.id) : [];
  }
  if (val === 'all' || val === '*') {
    return listStores().map((s) => s.id);
  }
  return [...new Set(val.split(/[,|]/).map((s) => s.trim()).filter(Boolean))];
}

export function resolveStoreAdapters(storeIds = []) {
  const ids = storeIds.length ? storeIds : listStores().map((s) => s.id);
  return ids
    .map((id) => getStoreAdapter(id))
    .filter(Boolean);
}
