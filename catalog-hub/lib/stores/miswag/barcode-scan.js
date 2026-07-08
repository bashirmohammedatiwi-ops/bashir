import { miswagFetch, typesenseMultiSearch } from './client.js';
import { fetchV2Barcode, isValidEan } from './v2-barcode.js';

function barcodeEquals(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  return x.length >= 8 && x === y;
}

/** مطابقة باركود EAN على منتج مسواگ عبر API v2 (الطريقة الأدق — كالتطبيق الأصلي) */
export async function matchBarcodeOnMiswagProduct(productId, digits) {
  const pid = String(productId || '').trim();
  if (!pid || !isValidEan(digits)) return null;

  const parentBc = await fetchV2Barcode(pid);
  if (barcodeEquals(parentBc, digits)) {
    return { productId: pid, shadeId: null, shadeName: '' };
  }

  let cursor = null;
  let pages = 0;
  do {
    const chunk = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`, {
      params: cursor ? { cursor } : {},
    }).catch(() => null);
    if (!chunk) break;

    const info = chunk.info || chunk;
    for (const v of info.variations || []) {
      const vid = String(v.id || '').trim();
      if (!vid) continue;
      const bc = await fetchV2Barcode(vid);
      if (barcodeEquals(bc, digits)) {
        return {
          productId: pid,
          shadeId: vid,
          shadeName: String(v.title || '').trim(),
        };
      }
    }

    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 30);

  return null;
}

/** مسح عدة منتجات مرشّحة والتحقق من باركود كل تدرج */
export async function scanMiswagProductsForBarcode(productIds = [], digits, { limit = 12 } = {}) {
  const unique = [...new Set(productIds.map((id) => String(id || '').trim()).filter(Boolean))];
  for (const pid of unique.slice(0, limit)) {
    const match = await matchBarcodeOnMiswagProduct(pid, digits);
    if (match) return match;
  }
  return null;
}

/** بحث Typesense داخل حقل variations ثم التحقق عبر v2 */
export async function searchTypesenseByVariationBarcode(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(d)) return [];

  try {
    const [result = {}] = await typesenseMultiSearch([{
      q: d,
      query_by: 'variations,alias,title_AR,title_EN,brand',
      per_page: 20,
      page: 1,
    }]);

    return (result.hits || []).filter((hit) => {
      const hay = JSON.stringify(hit.document || {}).replace(/\D/g, '');
      return hay.includes(d);
    });
  } catch {
    return [];
  }
}
