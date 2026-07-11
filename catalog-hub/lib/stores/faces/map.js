import {
  absUrl,
  extractBarcode,
  fetchProductVariation,
  fetchVariationUrl,
  formatAedPrice,
  galleryFromProduct,
  imageFromProduct,
  normalizePid,
  productPageUrl,
  resolveProductPid,
  stripHtml,
} from './client.js';

function swatchImage(value = {}) {
  const sw = value?.images?.swatch;
  if (Array.isArray(sw) && sw.length) return absUrl(sw[0]?.absUrl || sw[0]?.url || '');
  return '';
}


async function addLeaf(map, product, meta = {}) {
  if (!product?.id) return;
  const id = String(product.id);
  if (map.has(id)) return;
  map.set(id, { product, meta });
}

/**
 * يجلب كل التدرجات/الأحجام عبر SFCC Product-Variation.
 * يدعم لون + مقاس وكل تركيباتهما.
 */
export async function collectAllVariants(pid, { lang = 'ar', concurrency = 6 } = {}) {
  const initial = await fetchProductVariation(pid, { lang });
  if (!initial) return [];

  const rootPid = initial.masterId
    ? normalizePid(initial.masterId)
    : (initial.productType === 'master' ? normalizePid(initial.id) : normalizePid(initial.id));

  const root = initial.masterId
    ? await fetchProductVariation(rootPid, { lang })
    : initial;
  if (!root) return [];

  const attrs = root.variationAttributes || [];
  if (!attrs.length) return [{ product: initial, meta: {} }];

  const leaves = new Map();
  const queue = [];

  for (const attr of attrs) {
    for (const val of attr.values || []) {
      if (!val?.url || val.selectable === false) continue;
      queue.push({ url: val.url, meta: { attrId: attr.id, attrName: attr.displayName, value: val } });
    }
  }

  let idx = 0;
  async function worker() {
    while (idx < queue.length) {
      const current = queue[idx];
      idx += 1;
      const product = await fetchVariationUrl(current.url, { lang });
      if (!product) continue;

      const subAttrs = (product.variationAttributes || []).filter(
        (a) => (a.values || []).filter((v) => v.selectable !== false && v.url).length > 1,
      );

      const needsMore = subAttrs.some((a) => {
        const selectable = (a.values || []).filter((v) => v.selectable !== false && v.url);
        return selectable.some((v) => !v.selected);
      });

      if (extractBarcode(product) || !needsMore) {
        await addLeaf(leaves, product, current.meta);
        continue;
      }

      for (const sub of subAttrs) {
        for (const val of sub.values || []) {
          if (!val?.url || val.selectable === false || val.selected) continue;
          queue.push({
            url: val.url,
            meta: {
              ...current.meta,
              subAttrId: sub.id,
              subAttrName: sub.displayName,
              subValue: val,
            },
          });
        }
      }

      if (!extractBarcode(product)) {
        await addLeaf(leaves, product, current.meta);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker()));

  if (!leaves.size) {
    await addLeaf(leaves, root, {});
  }

  return [...leaves.values()];
}

export async function collectBilingualVariants(pid) {
  const [arRows, enRows] = await Promise.all([
    collectAllVariants(pid, { lang: 'ar' }),
    collectAllVariants(pid, { lang: 'en' }),
  ]);

  const byId = new Map();
  for (const row of arRows) {
    byId.set(String(row.product.id), { ar: row.product, arMeta: row.meta, en: null, enMeta: {} });
  }
  for (const row of enRows) {
    const prev = byId.get(String(row.product.id)) || { ar: null, arMeta: {}, en: null, enMeta: {} };
    prev.en = row.product;
    prev.enMeta = row.meta;
    byId.set(String(row.product.id), prev);
  }

  if (!byId.size && arRows.length) {
    for (const row of arRows) byId.set(String(row.product.id), { ar: row.product, arMeta: row.meta, en: null, enMeta: {} });
  }

  return [...byId.entries()].map(([id, row]) => ({ id, ...row }));
}

export function mapShade(row = {}, index = 0) {
  const ar = row.ar || row.en || {};
  const en = row.en || row.ar || {};
  const meta = row.arMeta || row.enMeta || {};
  const value = meta.value || meta.subValue || {};
  const subValue = meta.subValue || {};
  const colorAr = stripHtml(value.displayValue || subValue.displayValue || '');
  const colorEn = stripHtml(
    (row.enMeta?.value || row.enMeta?.subValue || value).displayValue || value.displayValue || '',
  );
  const nameAr = colorAr || stripHtml(ar.productName || '');
  const nameEn = colorEn || stripHtml(en.productName || '');
  const swatch = swatchImage(value) || swatchImage(subValue) || swatchImage(row.enMeta?.value);
  const image = imageFromProduct(ar) || imageFromProduct(en) || swatch;

  return {
    id: String(ar.id || en.id || index),
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    sku: String(ar.id || en.id || ''),
    barcode: extractBarcode(ar) || extractBarcode(en),
    image,
    swatchImage: swatch,
    price: formatAedPrice(ar) || formatAedPrice(en),
    inStock: ar.available !== false && en.available !== false,
    colorHex: '',
    optionGroup: meta.attrName || meta.subAttrName || 'التدرج',
  };
}

export function mapDetailFromRows(rows = [], { arBase = null, enBase = null } = {}) {
  const ar = arBase || rows[0]?.ar || {};
  const en = enBase || rows[0]?.en || ar;
  const shades = rows.map((row, i) => mapShade(row, i)).filter((s) => s.id);
  const images = [
    ...galleryFromProduct(ar),
    ...galleryFromProduct(en),
    ...shades.map((s) => s.image).filter(Boolean),
  ];

  const nameAr = stripHtml(ar.productName || '');
  const nameEn = stripHtml(en.productName || '');
  const brandAr = stripHtml(ar.brand || '');
  const brandEn = stripHtml(en.brand || '');

  return {
    id: normalizePid(ar.masterId || en.masterId || ar.id || en.id),
    sku: normalizePid(ar.id || en.id),
    barcode: extractBarcode(ar) || extractBarcode(en) || shades.find((s) => s.barcode)?.barcode || '',
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    brandAr: brandAr || brandEn,
    brandEn: brandEn || brandAr,
    descriptionAr: stripHtml(ar.longDescription || ar.shortDescription || ''),
    descriptionEn: stripHtml(en.longDescription || en.shortDescription || ''),
    thumb: images[0] || imageFromProduct(ar) || imageFromProduct(en),
    images: [...new Set(images.filter(Boolean))],
    price: formatAedPrice(ar) || formatAedPrice(en) || shades.find((s) => s.price)?.price || '',
    category: stripHtml(ar.familyGroup?.[0]?.displayValue || en.familyGroup?.[0]?.displayValue || ''),
    productUrl: productPageUrl(ar.selectedProductUrl || en.selectedProductUrl, 'ar'),
    productUrlEn: productPageUrl(en.selectedProductUrl || ar.selectedProductUrl, 'en'),
    shades: shades.length ? shades : [{
      id: String(ar.id || en.id || '0'),
      nameAr: nameAr || nameEn,
      nameEn: nameEn || nameAr,
      sku: String(ar.id || en.id || ''),
      barcode: extractBarcode(ar) || extractBarcode(en),
      image: images[0] || '',
      price: formatAedPrice(ar) || formatAedPrice(en),
      inStock: true,
      colorHex: '',
      optionGroup: '',
    }],
    shadeCount: shades.length || 1,
    hasOptions: shades.length > 1,
    inStock: ar.available !== false,
    manufacturer: brandAr || brandEn,
    manufacturerEn: brandEn || brandAr,
  };
}

function shadesFromVariationAttributes(ar = {}, en = {}) {
  const attrs = ar.variationAttributes || en.variationAttributes || [];
  const shades = [];
  const colorAttr = attrs.find((a) => a.id === 'color') || attrs.find((a) => (a.values || []).length > 1);
  if (!colorAttr) return shades;

  for (const val of colorAttr.values || []) {
    if (val.selectable === false) continue;
    const swatch = swatchImage(val);
    shades.push({
      id: String(val.id || val.value || val.displayValue || shades.length),
      nameAr: stripHtml(val.displayValue || ''),
      nameEn: stripHtml(val.displayValue || ''),
      sku: '',
      barcode: '',
      image: swatch,
      swatchImage: swatch,
      price: formatAedPrice(ar) || formatAedPrice(en),
      inStock: val.isAvailable !== false,
      colorHex: '',
      optionGroup: colorAttr.displayName || 'اللون',
    });
  }
  return shades;
}

export async function mapDetailProduct(pid, { light = false } = {}) {
  const resolved = await resolveProductPid(pid);
  if (!resolved) return null;

  if (light) {
    const [ar, en] = await Promise.all([
      fetchProductVariation(resolved, { lang: 'ar' }),
      fetchProductVariation(resolved, { lang: 'en' }),
    ]);
    if (!ar && !en) return null;
    const previewShades = shadesFromVariationAttributes(ar || {}, en || {});
    const rows = [{ id: ar?.id || en?.id, ar, en, arMeta: {}, enMeta: {} }];
    const detail = mapDetailFromRows(rows, { arBase: ar, enBase: en });
    if (previewShades.length > 1) {
      detail.shades = previewShades;
      detail.shadeCount = previewShades.length;
      detail.hasOptions = true;
    }
    return detail;
  }

  const rows = await collectBilingualVariants(resolved);
  if (!rows.length) return null;
  return mapDetailFromRows(rows);
}
