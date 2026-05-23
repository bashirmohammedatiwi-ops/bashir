export type PosArticleRow = {
  productCode: number;
  productNum: string | null;
  name: string | null;
  barcode: string | null;
  originalPrice: number;
  storedFinalPrice: number;
  quantity: number;
  discountValue: number | null;
  discountType: number | null;
  offerName: string | null;
};

export type SyncItem = {
  barcode: string;
  productCode: string;
  productNum?: string;
  name?: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  offerName?: string;
};

/** نفس calcPricing في Desktop\api\server.js */
export function computePricing(row: PosArticleRow): Omit<
  SyncItem,
  "barcode" | "productCode" | "productNum" | "name"
> & { offerName?: string } {
  const original = Math.round(Number(row.originalPrice) || 0);
  const storedFinal = Math.round(Number(row.storedFinalPrice) || 0);
  const quantity = Math.max(0, Math.round(Number(row.quantity) || 0));
  const discountValue = row.discountValue != null ? Number(row.discountValue) : null;
  const discountType = row.discountType != null ? Number(row.discountType) : 0;

  let hasOffer = false;
  let finalPrice = original;
  let discountPercent = 0;
  let offerName: string | undefined = row.offerName?.trim() || undefined;

  if (discountValue != null && discountValue > 0) {
    hasOffer = true;
    if (storedFinal > 0 && storedFinal < original) {
      finalPrice = storedFinal;
      discountPercent = Math.round((1 - finalPrice / original) * 1000) / 10;
    } else if (discountType === 0) {
      discountPercent = discountValue;
      finalPrice = Math.round(original * (1 - discountValue / 100));
    } else {
      finalPrice = Math.max(0, Math.round(original - discountValue));
      discountPercent = original > 0 ? Math.round((discountValue / original) * 1000) / 10 : 0;
    }
  }

  return {
    price: hasOffer ? finalPrice : original,
    originalPrice: original,
    discountPercent: hasOffer ? Math.round(discountPercent) : 0,
    stock: quantity,
    offerName: hasOffer ? offerName : undefined,
  };
}

export function resolveSyncBarcode(row: PosArticleRow): string | null {
  const barcode = String(row.barcode ?? "").trim();
  if (barcode) return barcode;

  const num = String(row.productNum ?? "").trim();
  if (num) return num;

  if (row.productCode) return String(row.productCode);
  return null;
}

export function rowToSyncItem(row: PosArticleRow): SyncItem | null {
  const barcode = resolveSyncBarcode(row);
  if (!barcode) return null;

  const pricing = computePricing(row);
  return {
    barcode,
    productCode: String(row.productCode),
    productNum: row.productNum?.trim() || undefined,
    name: row.name?.trim() || undefined,
    ...pricing,
  };
}
