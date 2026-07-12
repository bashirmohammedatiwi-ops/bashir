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
  productName?: string | null;
};

export type BarcodePosSnapshot = {
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  name: string | null;
  offerName: string | null;
  syncedAt?: string;
};

export type BarcodeInventoryLookup = {
  barcode: string;
  pos: BarcodePosSnapshot | null;
  inApp: { id: string; name: string | null } | null;
};

export async function lookupInventoryBarcodes(
  barcodes: string[],
): Promise<Record<string, BarcodeInventoryLookup>> {
  const normalized = [
    ...new Set(barcodes.flatMap((b) => barcodeLookupCandidates(b)).filter(Boolean)),
  ];
  if (!normalized.length) return {};

  const { data } = await api.post("/sync/inventory/lookup-barcodes", {
    barcodes: normalized,
  });
  const body = (data?.data ?? data) as { items?: Record<string, BarcodeInventoryLookup> };
  return body?.items ?? {};
}

export function resolveBarcodeLookup(
  raw: string,
  map: Record<string, BarcodeInventoryLookup>,
): BarcodeInventoryLookup | null {
  const candidates = barcodeLookupCandidates(raw);
  for (const code of candidates) {
    const hit = map[code];
    if (hit?.pos || hit?.inApp) return hit;
  }
  const primary = candidates[0] || normalizeBarcode(raw);
  return primary ? map[primary] ?? null : null;
}

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
