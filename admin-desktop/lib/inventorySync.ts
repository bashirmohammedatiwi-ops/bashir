import { api } from "./api";
import { barcodeLookupCandidates, normalizeBarcode } from "./barcode";

export type InventorySyncPreview = {
  barcode: string;
  productCode?: string | null;
  productNum?: string | null;
  name?: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  offerName?: string | null;
  syncedAt?: string;
  productId?: string | null;
};

export async function fetchInventoryByBarcode(
  barcode: string,
): Promise<InventorySyncPreview | null> {
  const candidates = barcodeLookupCandidates(barcode);
  if (!candidates.length) return null;

  for (const code of candidates) {
    try {
      const { data } = await api.get(`/sync/inventory/by-barcode/${encodeURIComponent(code)}`);
      return (data?.data ?? data) as InventorySyncPreview;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

export function normalizeBarcodeInput(raw: string): string {
  return normalizeBarcode(raw);
}
