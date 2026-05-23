export type PosArticleRow = {
  Seq: number;
  Num: string | null;
  Name1: string | null;
  Barcode: string | null;
  SellPr4: number;
  SellPr5: number;
  CurTot1: number;
  discount: number | null;
  discount_type: number | null;
  offer_name: string | null;
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

export function computePricing(row: PosArticleRow): Omit<SyncItem, "barcode" | "productCode" | "productNum" | "name"> & {
  offerName?: string;
} {
  const originalPrice = Math.round(Number(row.SellPr4) || 0);
  let finalPrice = originalPrice;
  let discountPercent = 0;

  const hasOffer = row.discount != null && Number(row.discount) > 0;
  const sellPr5 = Math.round(Number(row.SellPr5) || 0);

  if (hasOffer && sellPr5 > 0 && sellPr5 < originalPrice) {
    finalPrice = sellPr5;
  } else if (hasOffer && Number(row.discount_type) === 0) {
    finalPrice = Math.round(originalPrice * (1 - Number(row.discount) / 100));
  }

  if (originalPrice > 0 && finalPrice < originalPrice) {
    discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  } else if (hasOffer && Number(row.discount_type) === 0) {
    discountPercent = Math.round(Number(row.discount));
  }

  return {
    price: finalPrice,
    originalPrice,
    discountPercent,
    stock: Math.max(0, Math.round(Number(row.CurTot1) || 0)),
    offerName: row.offer_name ?? undefined,
  };
}

export function rowToSyncItem(row: PosArticleRow): SyncItem | null {
  const barcode = String(row.Barcode ?? "").trim();
  if (!barcode) return null;

  const pricing = computePricing(row);
  return {
    barcode,
    productCode: String(row.Seq),
    productNum: row.Num ?? undefined,
    name: row.Name1 ?? undefined,
    ...pricing,
  };
}
