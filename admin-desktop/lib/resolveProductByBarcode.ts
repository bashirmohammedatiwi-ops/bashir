import { normalizeBarcode } from "./barcode";
import { fetchInventoryByBarcode } from "./inventorySync";
import { queries } from "./queries";

export type ResolvedPackageProduct = {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price?: number;
  stock?: number;
  brandName?: string;
  product?: any;
};

export async function resolveProductByBarcode(
  rawBarcode: string,
): Promise<{ ok: true; product: ResolvedPackageProduct } | { ok: false; reason: string }> {
  const barcode = normalizeBarcode(rawBarcode);
  if (!barcode) {
    return { ok: false, reason: "أدخل باركود صالح" };
  }

  const snapshot = await fetchInventoryByBarcode(barcode);
  if (!snapshot) {
    return { ok: false, reason: "لا توجد بيانات لهذا الباركود — تحقق من POS Sync" };
  }

  if (snapshot.productId) {
    try {
      const full = (await queries.product(snapshot.productId)) as any;
      return {
        ok: true,
        product: {
          id: full.id,
          name: full.name ?? snapshot.name ?? "—",
          sku: full.sku,
          barcode: full.barcode ?? snapshot.barcode ?? barcode,
          price: full.price ?? snapshot.price,
          stock: full.stock ?? snapshot.stock,
          brandName: full.brand?.name,
          product: full,
        },
      };
    } catch {
      return {
        ok: true,
        product: {
          id: snapshot.productId,
          name: snapshot.name ?? snapshot.productName ?? "—",
          barcode: snapshot.barcode ?? barcode,
          price: snapshot.price,
          stock: snapshot.stock,
        },
      };
    }
  }

  return {
    ok: false,
    reason: `الباركود موجود في POS (${snapshot.name ?? barcode}) لكن غير مربوط بمنتج — أنشئ/اربط المنتج أولاً`,
  };
}

export function packageProductFromItem(item: any): ResolvedPackageProduct | null {
  const product = item?.product;
  const id = item?.productId ?? product?.id;
  if (!id) return null;
  return {
    id,
    name: product?.name ?? item?.productName ?? "—",
    sku: product?.sku ?? item?.productSku,
    barcode: product?.barcode,
    price: product?.price,
    stock: product?.stock,
    brandName: product?.brand?.name,
    product,
  };
}
