/**
 * حصاد شامل لكل باركود EAN لمنتج مسواگ — مصدر واحد للمسح ولتفاصيل المنتج
 */
import { miswagFetch } from './client.js';
import { fetchV2Detail, extractAllBarcodesFromV2Detail } from './v2-barcode.js';
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

/** كل صفحات تدرجات v1 — أدق من Typesense أحياناً */
async function fetchV1Variations(pid) {
  const all = [];
  let cursor = null;
  let pages = 0;

  do {
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, {
      params: cursor ? { cursor } : {},
    }).catch(() => null);
    if (!chunk) break;

    const info = chunk.info || chunk;
    for (const v of info.variations || []) all.push(v);
    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 30);

  return all;
}

/**
 * يجمع كل باركودات EAN المعروفة لمنتج واحد ويحفظها اختيارياً.
 * @returns {{ rows: Array, count: number }}
 */
export async function harvestMiswagProductBarcodes(productId, {
  typesenseDoc = null,
  persist = true,
  force = false,
} = {}) {
  const id = String(productId || '').trim();
  if (!id) return { rows: [], count: 0 };

  if (!force && isMiswagBarcodeHarvestDone(id)) {
    return { rows: [], count: 0, skipped: true };
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

  for (const v of parseTypesenseVariations(typesenseDoc)) registerVariation(v);

  const v1Vars = await fetchV1Variations(id);
  for (const v of v1Vars) registerVariation(v);

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
  try {
    const parentDetail = await fetchV2Detail(id);
    if (parentDetail) {
      parentV2Ok = true;
      for (const bc of extractAllBarcodesFromV2Detail(parentDetail)) add(bc, '');
    }
  } catch (err) {
    if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
  }

  for (const sid of shadeIds) {
    if (sid === id) continue;
    try {
      const detail = await fetchV2Detail(sid);
      if (!detail) continue;
      const label = shadeNames.get(sid) || sid;
      for (const bc of extractAllBarcodesFromV2Detail(detail)) add(bc, label);
    } catch (err) {
      if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
    }
  }

  // لا تُعلّم «مكتمل» إذا فشلت كل مصادر v2/v1 ولم يُعثر على باركود — يُعاد لاحقاً
  const confirmed = rows.length > 0 || parentV2Ok || v1MetaOk || v1Vars.length > 0;

  if (persist) {
    if (rows.length) bulkUpsertBarcodeIndex(rows);
    if (confirmed) {
      markMiswagBarcodeHarvestDone(id, { barcodeCount: rows.length });
    }
  }

  return { rows, count: rows.length, incomplete: !confirmed };
}
