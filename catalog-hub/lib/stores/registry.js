import { miswagAdapter } from './miswag/index.js';
import { elryanAdapter } from './elryan/index.js';
import { amazonAdapter } from './amazon/index.js';
import { createSallaAdapter } from './salla/adapter.js';

/**
 * ═══════════════════════════════════════════════════════════
 *  سجل المتاجر — كل متجر في مجلد منفصل بالكامل:
 *
 *    lib/stores/miswag/   ← مسواگ (Typesense + v2 مباشر)
 *    lib/stores/elryan/   ← الريان
 *    lib/stores/amazon/   ← أمازون (لا يشارك منطق مسواگ)
 *    lib/stores/salla/    ← نجد وغيرها
 *
 *  إضافة متجر:
 *  1) Salla: سطر في SALLA_STORES.
 *  2) غيره: مجلد lib/stores/{id}/ + تسجيل في CUSTOM_ADAPTERS.
 *
 *  مهم: زحف أمازون لا يعمل عند الإقلاع افتراضياً.
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
const CUSTOM_ADAPTERS = [miswagAdapter, elryanAdapter, amazonAdapter];

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
