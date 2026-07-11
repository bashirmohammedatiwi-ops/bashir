import { findBarcodesForProduct } from '../../core/barcode-index.js';
import { fetchV2BarcodesForIds } from './v2-barcode.js';
import { isValidEan } from './ids.js';

/** باركود من الفهرس المحلي — فوري */
export function barcodeFromIndex(productId) {
  const rows = findBarcodesForProduct('miswag', productId);
  const bc = rows.find((r) => isValidEan(r.barcode))?.barcode || '';
  return String(bc || '').replace(/\D/g, '');
}

/** إثراء قائمة منتجات بباركودات من الفهرس ثم v2 للناقص */
export async function enrichItemsWithBarcodes(items = [], { maxV2 = 20 } = {}) {
  if (!items?.length) return items;

  const out = items.map((item) => {
    const fromIndex = barcodeFromIndex(item.id);
    return fromIndex ? { ...item, barcode: fromIndex } : item;
  });

  const missing = out.filter((i) => !isValidEan(i.barcode)).slice(0, maxV2);
  if (!missing.length) return out;

  try {
    const map = await fetchV2BarcodesForIds(missing.map((i) => i.id), { concurrency: 8 });
    return out.map((item) => {
      if (isValidEan(item.barcode)) return item;
      const bc = map.get(String(item.id)) || '';
      return bc ? { ...item, barcode: bc } : item;
    });
  } catch {
    return out;
  }
}
