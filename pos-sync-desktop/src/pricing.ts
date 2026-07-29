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

/** نفس calcPricing في Desktop\api\server.js — مع دعم SellPr5 بدون عرض نشط */
export function computePricing(row: PosArticleRow): Omit<
  SyncItem,
  "barcode" | "productCode" | "productNum" | "name"
> & { offerName?: string } {
  const original = Math.round(Number(row.originalPrice) || 0);
  const storedFinal = Math.round(Number(row.storedFinalPrice) || 0);
  const quantity = Math.max(0, Math.round(Number(row.quantity) || 0));
  const discountValue = row.discountValue != null ? Number(row.discountValue) : null;
  const discountType = row.discountType != null ? Number(row.discountType) : 0;
  const offerName = row.offerName?.trim() || undefined;

  const hasActiveOffer = discountValue != null && discountValue > 0;
  let finalPrice = original;

  if (hasActiveOffer) {
    if (storedFinal > 0 && storedFinal < original) {
      finalPrice = storedFinal;
    } else if (discountType === 0) {
      finalPrice = Math.round(original * (1 - discountValue / 100));
    } else {
      finalPrice = Math.max(0, Math.round(original - discountValue));
    }
  } else if (storedFinal > 0 && storedFinal < original) {
    finalPrice = storedFinal;
  }

  if (finalPrice >= original) {
    finalPrice = original;
  }

  const hasDiscount = original > 0 && finalPrice < original;
  const discountPercent = hasDiscount
    ? Math.round((1 - finalPrice / original) * 100)
    : 0;

  return {
    price: hasDiscount ? finalPrice : original,
    originalPrice: original,
    discountPercent,
    stock: quantity,
    offerName: hasActiveOffer ? offerName : undefined,
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
