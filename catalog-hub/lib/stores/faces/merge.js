/** دمج نتائج القوائم العربية والإنجليزية */
function listingKey(item = {}) {
  return String(item.id || '').trim().toLowerCase();
}

function variantKey(item = {}) {
  const sku = String(item.sku || '').replace(/\D/g, '');
  return sku.length >= 8 ? sku : '';
}

export function mergeListingLocales(arItems = [], enItems = []) {
  const byId = new Map();
  const byVariant = new Map();

  for (const item of enItems) {
    const row = {
      ...item,
      nameEn: item.nameEn || item.nameAr,
      brandEn: item.brandEn || item.brandAr,
    };
    byId.set(listingKey(item), row);
    const vk = variantKey(item);
    if (vk) byVariant.set(vk, row);
  }

  const merged = [];
  const seen = new Set();

  for (const item of arItems) {
    const key = listingKey(item);
    if (seen.has(key)) continue;
    seen.add(key);

    const en = byId.get(key) || byVariant.get(variantKey(item));
    merged.push({
      ...(en || {}),
      ...item,
      nameAr: item.nameAr || en?.nameAr || item.nameEn,
      nameEn: en?.nameEn || item.nameEn || item.nameAr,
      brandAr: item.brandAr || en?.brandAr || item.brandEn,
      brandEn: en?.brandEn || item.brandEn || item.brandAr,
      thumb: item.thumb || en?.thumb,
      price: item.price || en?.price,
      productUrl: item.productUrl || en?.productUrl,
      productUrlEn: en?.productUrl || item.productUrl,
    });
  }

  return merged;
}
