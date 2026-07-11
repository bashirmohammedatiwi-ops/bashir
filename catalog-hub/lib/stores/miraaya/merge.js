/** دمج نتائج القوائم العربية والإنجليزية */
function listingKey(item = {}) {
  return String(item.id || item.sku || '').trim().toLowerCase();
}

export function mergeListingLocales(arItems = [], enItems = []) {
  const byId = new Map();

  for (const item of enItems) {
    byId.set(listingKey(item), {
      ...item,
      nameEn: item.nameEn || item.nameAr,
      brandEn: item.brandEn || item.brandAr,
    });
  }

  for (const item of arItems) {
    const key = listingKey(item);
    const prev = byId.get(key);
    byId.set(key, {
      ...(prev || {}),
      ...item,
      nameAr: item.nameAr || prev?.nameAr || item.nameEn,
      nameEn: prev?.nameEn || item.nameEn || item.nameAr,
      brandAr: item.brandAr || prev?.brandAr || item.brandEn,
      brandEn: prev?.brandEn || item.brandEn || item.brandAr,
      thumb: item.thumb || prev?.thumb,
      price: item.price || prev?.price,
      productUrl: item.productUrl || prev?.productUrl,
    });
  }

  return [...byId.values()];
}
