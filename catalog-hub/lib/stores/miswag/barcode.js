import {
  typesenseSearch,
  miswagFetch,
  absImage,
  formatPrice,
} from './client.js';
import { fetchProductDetail } from './products.js';
import { mapTypesenseHit } from './categories.js';

function extractBarcode(v = {}) {
  for (const key of ['barcode', 'ean', 'upc', 'gtin', 'isbn']) {
    const val = String(v?.[key] || '').replace(/\D/g, '');
    if (/^\d{8,14}$/.test(val)) return val;
  }
  const sku = String(v?.sku || v?.alias || '').replace(/\D/g, '');
  if (/^\d{8,14}$/.test(sku)) return sku;
  return '';
}

async function fetchVariationsPage(pid) {
  const data = await miswagFetch(`/content/v1/items/${encodeURIComponent(pid)}/variations`).catch(() => null);
  if (!data) return [];
  const info = data.info || data;
  return info.variations || [];
}

/** مسح سريع لباركود التدرج عبر API التدرجات */
async function scanVariationBarcodes(digits, { maxProducts = 600, concurrency = 16, filterBy = '' } = {}) {
  const productIds = [];
  for (let page = 1; productIds.length < maxProducts; page++) {
    const { hits } = await typesenseSearch('*', {
      page,
      perPage: 100,
      filterBy: filterBy || undefined,
    });
    if (!hits.length) break;
    for (const h of hits) {
      const id = String(h.document?.id || '');
      if (id) productIds.push(id);
    }
    if (hits.length < 100) break;
  }

  const matches = [];
  for (let i = 0; i < productIds.length && matches.length < 5; i += concurrency) {
    const chunk = productIds.slice(i, i + concurrency);
    const parts = await Promise.all(
      chunk.map(async (pid) => {
        const vars = await fetchVariationsPage(pid);
        for (const v of vars) {
          const bc = extractBarcode(v);
          if (bc === digits || String(v.id) === digits) {
            return { pid, variation: v };
          }
        }
        return null;
      }),
    );
    for (const m of parts) if (m) matches.push(m);
  }
  return matches;
}

function hitToResult(hit, digits, matchType = 'barcode') {
  const doc = hit.document || hit;
  const mapped = mapTypesenseHit(doc);
  return {
    ...mapped,
    store: 'miswag',
    storeLabel: 'مسواگ Miswag',
    matchType,
    barcode: digits,
  };
}

/** بحث باركود — معرّف منتج Miswag أو EAN أو باركود التدرج */
export async function searchByBarcode(barcode) {
  const digits = String(barcode || '').replace(/\D/g, '');
  if (!digits) return [];

  // 1) معرّف منتج Miswag مباشرة
  const byId = await typesenseSearch('*', {
    perPage: 1,
    filterBy: `id:=\`${digits}\``,
  });
  if (byId.hits?.length) {
    return [hitToResult(byId.hits[0], digits, 'product_id')];
  }

  // 2) بحث نصي بالأرقام (SKU في العنوان)
  const byText = await typesenseSearch(digits, { perPage: 10 });
  if (byText.hits?.length) {
    return byText.hits.map((h) => hitToResult(h, digits, 'text'));
  }

  // 3) محاولة جلب المنتج مباشرة (variation id)
  const direct = await fetchProductDetail(digits, { light: true }).catch(() => null);
  if (direct?.id) {
    return [{
      id: direct.id,
      nameAr: direct.nameAr,
      nameEn: direct.nameEn,
      brandAr: direct.brandAr,
      thumb: direct.thumb,
      price: direct.price,
      shadeCount: direct.shadeCount,
      matchType: 'product_id',
      barcode: digits,
    }];
  }

  // 4) EAN / باركود التدرج — مسح API التدرجات
  if (digits.length >= 8) {
    let shadeHits = await scanVariationBarcodes(digits, {
      maxProducts: 500,
      filterBy: 'l1_division_alias:=`beauty`',
    });
    if (!shadeHits.length) {
      shadeHits = await scanVariationBarcodes(digits, { maxProducts: 300 });
    }
    const results = [];
    for (const { pid, variation } of shadeHits) {
      const detail = await fetchProductDetail(pid, { light: true }).catch(() => null);
      if (!detail) continue;
      results.push({
        id: pid,
        nameAr: detail.nameAr,
        nameEn: detail.nameEn,
        brandAr: detail.brandAr,
        thumb: absImage(variation.image) || detail.thumb,
        price: formatPrice(variation.price) || detail.price,
        shadeCount: detail.shadeCount,
        shadeName: String(variation.title || '').trim(),
        matchType: 'shade',
        barcode: digits,
      });
    }
    if (results.length) return results;
  }

  return [];
}
