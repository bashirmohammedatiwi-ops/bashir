import { resolveProductBarcode } from "./barcode";

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
    } else if (discountType === 0) {
      finalPrice = Math.round(original * (1 - discountValue / 100));
    } else {
      finalPrice = Math.max(0, Math.round(original - discountValue));
    }
  }

  if (hasOffer && original > 0 && finalPrice < original) {
    discountPercent = Math.round((1 - finalPrice / original) * 100);
  }

  return {
    price: hasOffer ? finalPrice : original,
    originalPrice: original,
    discountPercent: hasOffer ? discountPercent : 0,
    stock: quantity,
    offerName: hasOffer ? offerName : undefined,
  };
}

export function rowToSyncItem(row: PosArticleRow): SyncItem | null {
  const barcode = resolveProductBarcode({
    barcode: row.barcode,
    productNum: row.productNum,
    productCode: row.productCode,
  });
  if (!barcode) return null;

  const pricing = computePricing(row);
  const productNum = row.productNum?.trim() || undefined;

  return {
    barcode,
    productCode: String(row.productCode),
    productNum: productNum || barcode,
    name: row.name?.trim() || undefined,
    ...pricing,
  };
}
