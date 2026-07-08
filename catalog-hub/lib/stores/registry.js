import { miswagAdapter } from './miswag/index.js';
import { elryanAdapter } from './elryan/index.js';
import { createSallaAdapter } from './salla/adapter.js';

/**
 * ═══════════════════════════════════════════════════════════
 *  سجل المتاجر — لإضافة متجر جديد:
 *
 *  1) متجر Salla: أضف سطراً في SALLA_STORES فقط.
 *  2) Vue Storefront / Magento (مثل الريان): انسخ نمط lib/stores/elryan.
 *  3) منصة أخرى: محوّل في lib/stores/{platform}/ يطبّق العقد ثم CUSTOM_ADAPTERS.
 * ═══════════════════════════════════════════════════════════
 */

/** متاجر Salla — إضافة متجر = سطر واحد */
const SALLA_STORES = [
  {
    id: 'najdalatheyah',
    label: 'نجد العذية Najd Alatheyah',
    domain: 'najdalatheyah.com',
    siteUrl: 'https://najdalatheyah.com',
    storeIdentifier: 'najdalatheyah.com',
  },
  // مثال لمتجر Salla إضافي مستقبلاً:
  // {
  //   id: 'storename',
  //   label: 'اسم المتجر',
  //   domain: 'storename.com',
  //   siteUrl: 'https://storename.com',
  //   storeIdentifier: 'storename.com',
  // },
];

/** محولات مخصصة (غير Salla) */
const CUSTOM_ADAPTERS = [miswagAdapter, elryanAdapter];

function buildRegistry() {
  const adapters = {};
  const metas = [];

  for (const adapter of CUSTOM_ADAPTERS) {
    adapters[adapter.id] = adapter;
    metas.push(adapter);
  }

  for (const meta of SALLA_STORES) {
    try {
      adapters[meta.id] = createSallaAdapter(meta);
      metas.push(meta);
    } catch (err) {
      console.error(`تعذّر تهيئة متجر ${meta.id}:`, err.message);
    }
  }

  return { adapters, metas };
}

const { adapters: ADAPTERS, metas } = buildRegistry();

export const STORE_LIST = metas;

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
