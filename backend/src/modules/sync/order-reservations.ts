import { barcodeLookupCandidates, resolveBarcodeMapKey } from "../../common/barcode.util";

export interface ReservedRow {
  barcode: string | null;
  qty: number;
}

/**
 * يجمع الكميات المحجوزة بكل صيغ الباركود (أصفار البداية، EAN-13/UPC-12) فيلتقطها باركود الكاشير بأي صيغة.
 * كل الصيغ تشير للعدّاد نفسه فلا يُطرح الحجز مرتين.
 */
export function reservationMap(rows: ReservedRow[]): Map<string, { qty: number }> {
  const map = new Map<string, { qty: number }>();
  for (const r of rows) {
    const qty = Math.max(0, Math.round(Number(r.qty) || 0));
    if (!r.barcode || !qty) continue;
    const keys = barcodeLookupCandidates(r.barcode);
    if (!keys.length) continue;
    const entry = resolveBarcodeMapKey(map, r.barcode) ?? { qty: 0 };
    entry.qty += qty;
    for (const k of keys) map.set(k, entry);
  }
  return map;
}

/**
 * مخزون الموقع = مخزون الكاشير − كميات الطلبات المفتوحة التي لم تُفوتر بعد في الكاشير.
 * لا يقل عن صفر، ولا يغيّر الأصناف غير المحجوزة.
 */
export function applyReservations<T extends { barcode: string; productNum?: string | null; stock: number }>(
  items: T[],
  reserved: Map<string, { qty: number }>,
): { items: T[]; adjusted: number } {
  if (!reserved.size) return { items, adjusted: 0 };
  let adjusted = 0;
  const out = items.map((item) => {
    const hit = resolveBarcodeMapKey(reserved, item.barcode) ?? resolveBarcodeMapKey(reserved, item.productNum ?? null);
    if (!hit || !hit.qty) return item;
    adjusted++;
    return { ...item, stock: Math.max(0, item.stock - hit.qty) };
  });
  return { items: out, adjusted };
}
