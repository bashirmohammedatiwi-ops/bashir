import { api } from "./api";

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
  const code = barcode.trim();
  if (!code) return null;
  try {
    const { data } = await api.get(`/sync/inventory/by-barcode/${encodeURIComponent(code)}`);
    return (data?.data ?? data) as InventorySyncPreview;
  } catch {
    return null;
  }
}
