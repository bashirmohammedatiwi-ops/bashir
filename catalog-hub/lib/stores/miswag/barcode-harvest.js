/**
 * حصاد شامل لكل باركود EAN لمنتج مسواگ — مصدر واحد للمسح ولتفاصيل المنتج
 */
import { miswagFetch } from './client.js';
import {
  fetchV2Detail,
  extractAllBarcodesFromV2Detail,
  extractShadeIdsFromV2Detail,
  fetchV2AllBarcodesForIds,
} from './v2-barcode.js';
import { isValidEan } from './ids.js';
import {
  bulkUpsertBarcodeIndex,
  isMiswagBarcodeHarvestDone,
  markMiswagBarcodeHarvestDone,
} from '../../core/barcode-index.js';

function extractEan(v = {}) {
  for (const key of ['barcode', 'ean', 'upc', 'gtin', 'isbn']) {
    const d = String(v?.[key] || '').replace(/\D/g, '');
    if (isValidEan(d)) return d;
  }
  return '';
}

function parseTypesenseVariations(doc = {}) {
  try {
    const raw = typeof doc.variations === 'string' ? JSON.parse(doc.variations) : doc.variations;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function shadeLabel(v = {}) {
  return String(v.title || v.color || v.name || v.nameAr || '').trim();
}

/** كل صفحات تدرجات v1 مع الأحجام */
async function fetchV1VariationsWithSizes(pid) {
  const variations = [];
  const sizes = new Map();
  let cursor = null;
  let pages = 0;

  do {
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, {
      params: cursor ? { cursor } : {},
    }).catch(() => null);
    if (!chunk) break;

    const info = chunk.info || chunk;
    for (const v of info.variations || []) variations.push(v);
    for (const s of info.sizes || []) sizes.set(String(s.id), s);
    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 40);

  return { variations, sizes: [...sizes.values()] };
}

/**
 * يجمع كل باركودات EAN المعروفة لمنتج واحد ويحفظها اختيارياً.
 * @returns {{ rows: Array, count: number, incomplete?: boolean, skipped?: boolean }}
 */
export async function harvestMiswagProductBarcodes(productId, {
  typesenseDoc = null,
  persist = true,
  force = false,
} = {}) {
  const id = String(productId || '').trim();
  if (!id) return { rows: [], count: 0 };

  if (!force && isMiswagBarcodeHarvestDone(id)) {
    const indexed = findBarcodesForProduct('miswag', id);
    if (indexed.length) return { rows: [], count: 0, skipped: true };
    // مُعلَّم «مكتمل» سابقاً لكن بلا باركود محفوظ — أعد الحصاد
  }

  const rows = [];
  const seen = new Set();

  const add = (barcode, shadeName = '') => {
    const digits = String(barcode || '').replace(/\D/g, '');
    if (!isValidEan(digits) || seen.has(digits)) return;
    seen.add(digits);
    rows.push({
      barcode: digits,
      store: 'miswag',
      productId: id,
      shadeName: String(shadeName || '').trim(),
    });
  };

  const shadeIds = new Set([id]);
  const shadeNames = new Map();

  const registerVariation = (v = {}) => {
    const sid = String(v.id || v.variation_id || '').trim();
    if (sid) {
      shadeIds.add(sid);
      if (!shadeNames.has(sid)) shadeNames.set(sid, shadeLabel(v));
    }
    const embedded = extractEan(v);
    if (embedded) add(embedded, shadeLabel(v));
  };

  const registerSize = (s = {}) => {
    const sid = String(s.id || '').trim();
    if (sid) {
      shadeIds.add(sid);
      if (!shadeNames.has(sid)) shadeNames.set(sid, shadeLabel(s));
    }
    const embedded = extractEan(s);
    if (embedded) add(embedded, shadeLabel(s));
  };

  for (const v of parseTypesenseVariations(typesenseDoc)) registerVariation(v);

  const { variations: v1Vars, sizes: v1Sizes } = await fetchV1VariationsWithSizes(id);
  for (const v of v1Vars) registerVariation(v);
  for (const s of v1Sizes) registerSize(s);

  let v1MetaOk = false;
  try {
    const v1 = await miswagFetch(`/content/v1/items/${encodeURIComponent(id)}`);
    v1MetaOk = Boolean(v1?.info);
    const meta = v1?.info?.meta || {};
    const fromMeta = extractEan(meta);
    if (fromMeta) add(fromMeta);
  } catch (err) {
    if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
  }

  let parentV2Ok = false;
  let parentDetail = null;
  try {
    parentDetail = await fetchV2Detail(id);
    if (parentDetail) {
      parentV2Ok = true;
      for (const bc of extractAllBarcodesFromV2Detail(parentDetail)) add(bc, '');
      for (const sid of extractShadeIdsFromV2Detail(parentDetail)) {
        shadeIds.add(sid);
      }
    }
  } catch (err) {
    if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
  }

  const childIds = [...shadeIds].filter((sid) => sid !== id);
  let v2ShadesOk = 0;

  if (childIds.length) {
    let barcodeMap = new Map();
    try {
      barcodeMap = await fetchV2AllBarcodesForIds(childIds, { concurrency: 8 });
      for (const sid of childIds) {
        if (!barcodeMap.has(sid)) continue;
        v2ShadesOk += 1;
        const barcodes = barcodeMap.get(sid) || [];
        const label = shadeNames.get(sid) || sid;
        for (const bc of barcodes) add(bc, label);
      }
    } catch (err) {
      if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
    }

    // احتياط — تفاصيل كاملة للتدرجات التي لم تُجرَ محاولة جلبها بعد (مثلاً بعد 403 جزئي)
    for (const sid of childIds) {
      if (barcodeMap.has(sid)) continue;
      try {
        const detail = await fetchV2Detail(sid);
        v2ShadesOk += 1;
        if (!detail) continue;
        const label = shadeNames.get(sid) || sid;
        for (const bc of extractAllBarcodesFromV2Detail(detail)) add(bc, label);
      } catch (err) {
        if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
      }
    }
  }

  const hasShades = childIds.length > 0;
  const allShadesChecked = !hasShades || v2ShadesOk >= childIds.length;
  const confirmed = rows.length > 0
    ? allShadesChecked
    : (!hasShades && (parentV2Ok || v1MetaOk));

  if (persist) {
    if (rows.length) bulkUpsertBarcodeIndex(rows);
    if (confirmed) {
      markMiswagBarcodeHarvestDone(id, { barcodeCount: rows.length });
    }
  }

  return {
    rows,
    count: rows.length,
    incomplete: !confirmed,
    shadeCount: childIds.length,
    v2ShadesOk,
  };
}
