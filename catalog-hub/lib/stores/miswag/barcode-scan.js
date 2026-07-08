import { miswagFetch, typesenseMultiSearch } from './client.js';
import { fetchV2Barcode, fetchV2BarcodesForIds, isValidEan } from './v2-barcode.js';

function barcodeEquals(a, b) {
  const x = String(a || '').replace(/\D/g, '');
  const y = String(b || '').replace(/\D/g, '');
  return x.length >= 8 && x === y;
}

async function listVariationIds(productId) {
  const pid = String(productId || '').trim();
  if (!pid) return [];

  const ids = [];
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
      if (vid) ids.push({ id: vid, name: String(v.title || '').trim() });
    }

    cursor = chunk.pagination?.cursor || null;
    pages += 1;
  } while (cursor && pages < 30);

  return ids;
}

/** مطابقة باركود EAN على منتج مسواگ عبر API v2 (الطريقة الأدق — كالتطبيق الأصلي) */
export async function matchBarcodeOnMiswagProduct(productId, digits) {
  const pid = String(productId || '').trim();
  if (!pid || !isValidEan(digits)) return null;

  const parentBc = await fetchV2Barcode(pid);
  if (barcodeEquals(parentBc, digits)) {
    return { productId: pid, shadeId: null, shadeName: '' };
  }

  const variations = await listVariationIds(pid).catch(() => []);
  if (!variations.length) return null;

  const barcodeMap = await fetchV2BarcodesForIds(
    variations.map((v) => v.id),
    { concurrency: 16 },
  );

  for (const variation of variations) {
    const bc = barcodeMap.get(String(variation.id)) || '';
    if (barcodeEquals(bc, digits)) {
      return {
        productId: pid,
        shadeId: variation.id,
        shadeName: variation.name,
      };
    }
  }

  return null;
}

/** مسح عدة منتجات مرشّحة والتحقق من باركود كل تدرج */
export async function scanMiswagProductsForBarcode(
  productIds = [],
  digits,
  { limit = 25, concurrency = 6 } = {},
) {
  const unique = [...new Set(productIds.map((id) => String(id || '').trim()).filter(Boolean))];
  const batch = unique.slice(0, limit);

  for (let i = 0; i < batch.length; i += concurrency) {
    const chunk = batch.slice(i, i + concurrency);
    const matches = await Promise.all(
      chunk.map((pid) => matchBarcodeOnMiswagProduct(pid, digits).catch(() => null)),
    );
    const hit = matches.find(Boolean);
    if (hit) return hit;
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
      query_by: 'variations,alias,title_AR,title_EN,brand,keywords,description',
      per_page: 30,
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
