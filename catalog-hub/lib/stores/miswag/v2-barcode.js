import { miswagFetch, cacheGet, cacheSet, DETAIL_TTL } from './client.js';
import { isMiswagInternalId, isValidEan } from './ids.js';

export { isMiswagInternalId, isValidEan };

const V2_TTL = DETAIL_TTL;

function collectBarcodesFromV2Detail(detail) {
  const found = new Set();

  const consider = (raw) => {
    const d = String(raw || '').replace(/\D/g, '');
    if (isValidEan(d)) found.add(d);
  };

  function walk(blocks = []) {
    for (const block of blocks) {
      if (Array.isArray(block.content)) {
        for (const node of block.content) {
          if (node?.product_id) consider(node.product_id);
          if (/رمز المنتج|product code|barcode|الباركود/i.test(node?.title || '') && node?.action?.id) {
            consider(node.action.id);
          }
        }
        walk(block.content);
      }
      if (Array.isArray(block.items)) {
        for (const item of block.items) {
          if (/رمز المنتج|product code|barcode|الباركود/i.test(item?.title || '') && item?.action?.id) {
            consider(item.action.id);
          }
        }
      }
    }
  }

  walk(detail?.content || []);
  return [...found];
}

/** استخراج باركود EAN من صفحة المنتج v2 (حقل «رمز المنتج» في التطبيق) */
export function extractBarcodeFromV2Detail(detail) {
  return collectBarcodesFromV2Detail(detail)[0] || '';
}

/** كل باركودات EAN في صفحة v2 — للمنتج + درجات اللون */
export function extractAllBarcodesFromV2Detail(detail) {
  return collectBarcodesFromV2Detail(detail);
}

export async function fetchV2Detail(id) {
  const pid = String(id || '').trim();
  if (!pid) return null;
  const cacheKey = `miswag:v2:${pid}`;
  const cached = cacheGet(cacheKey, V2_TTL);
  if (cached) return cached;
  try {
    const detail = await miswagFetch(`/content/v2/items/${encodeURIComponent(pid)}`);
    cacheSet(cacheKey, detail);
    return detail;
  } catch (err) {
    // لا تُخفِ حظر المعدّل — وإلا يُعلَّم المنتج «بلا باركود» خطأً
    if (/Miswag 403 cooldown/.test(String(err?.message || ''))) throw err;
    return null;
  }
}

export async function fetchV2Barcode(id) {
  const detail = await fetchV2Detail(id);
  if (!detail) return '';
  return extractBarcodeFromV2Detail(detail);
}

/** جلب باركودات v2 لعدة تدرجات بالتوازي */
export async function fetchV2BarcodesForIds(ids = [], { concurrency = 10 } = {}) {
  const unique = [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];
  const map = new Map();

  for (let i = 0; i < unique.length; i += concurrency) {
    const chunk = unique.slice(i, i + concurrency);
    const parts = await Promise.all(
      chunk.map(async (id) => {
        const barcode = await fetchV2Barcode(id);
        return [id, barcode];
      }),
    );
    for (const [id, barcode] of parts) {
      if (barcode) map.set(id, barcode);
    }
  }

  return map;
}
