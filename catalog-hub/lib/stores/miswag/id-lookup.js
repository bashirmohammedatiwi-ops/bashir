import { typesenseSearch } from './client.js';
import { mapTypesenseHit } from './categories.js';
import { fetchProductDetail } from './products.js';
import { isMiswagInternalId } from './ids.js';

export { isMiswagInternalId };

function formatHit(item, code, matchType, shade = null) {
  return {
    id: item.id,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    brandAr: item.brandAr,
    brandEn: item.brandEn,
    thumb: shade?.image || item.thumb,
    price: shade?.price || item.price,
    shadeCount: item.shadeCount,
    hasOptions: item.hasOptions,
    miswagId: code,
    shadeName: shade?.nameAr || shade?.name || '',
    matchType,
    barcode: shade?.barcode || '',
  };
}

/**
 * بحث برقم مسواگ — معرّف منتج أو معرّف تدرج (ليس باركود EAN).
 */
export async function searchByMiswagId(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (!digits || !isMiswagInternalId(digits)) return [];

  // 1) Typesense — معرّف منتج
  const byId = await typesenseSearch('*', {
    perPage: 1,
    filterBy: `id:=\`${digits}\``,
  });
  if (byId.hits?.length) {
    const mapped = mapTypesenseHit(byId.hits[0].document || {});
    const detail = await fetchProductDetail(mapped.id, { light: false }).catch(() => null);
    const base = detail || mapped;
    const shade = detail?.shades?.find(
      (s) => s.sku === digits || s.optionId === digits || s.miswagId === digits,
    );
    return [formatHit(base, digits, shade ? 'miswag_shade' : 'miswag_product', shade)];
  }

  // 2) API مباشر — قد يكون معرّف تدرج يُرجع المنتج الأب
  const detail = await fetchProductDetail(digits, { light: false }).catch(() => null);
  if (!detail?.id) return [];

  const shade = detail.shades?.find(
    (s) => s.sku === digits || s.optionId === digits || s.miswagId === digits,
  );
  if (shade) {
    return [formatHit(detail, digits, 'miswag_shade', shade)];
  }
  if (detail.id === digits) {
    return [formatHit(detail, digits, 'miswag_product', null)];
  }

  return [];
}
