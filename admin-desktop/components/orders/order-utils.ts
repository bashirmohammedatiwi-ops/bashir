import { mediaThumb } from "@/lib/mediaUrl";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار الدفع",
  PAID: "مدفوع",
  FAILED: "فشل الدفع",
  REFUNDED: "مسترد",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "الدفع عند الاستلام",
  CARD: "بطاقة",
  WALLET: "محفظة",
};

export const DELIVERY_LABELS: Record<string, string> = {
  STANDARD: "توصيل عادي",
  EXPRESS: "توصيل سريع",
  PICKUP: "استلام من المتجر",
};

export function formatIqd(n?: number | null) {
  if (n == null) return "—";
  return `${n.toLocaleString("ar-IQ")} د.ع`;
}

export function formatOrderDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));
  } catch {
    return d;
  }
}

export function orderItemImage(item: any): string | null {
  const product = item?.product;
  if (!product) return null;
  if (item.shadeId && Array.isArray(product.shades)) {
    const shade = product.shades.find((s: any) => s.id === item.shadeId);
    if (shade?.image) return mediaThumb(shade.image);
  }
  const imgs = product.images ?? [];
  if (imgs[0]?.media) return mediaThumb(imgs[0].media);
  return null;
}

export function orderItemVariantLabel(item: any): string | null {
  if (!item?.variantId || !Array.isArray(item.product?.variants)) return null;
  const v = item.product.variants.find((x: any) => x.id === item.variantId);
  if (!v) return null;
  return v.sizeLabel ?? v.label ?? null;
}

export function orderItemShadeLabel(item: any): string | null {
  if (!item?.shadeId || !Array.isArray(item.product?.shades)) return null;
  const s = item.product.shades.find((x: any) => x.id === item.shadeId);
  return s?.name ?? null;
}

export function orderItemShadeColor(item: any): string | null {
  if (!item?.shadeId || !Array.isArray(item.product?.shades)) return null;
  const s = item.product.shades.find((x: any) => x.id === item.shadeId);
  return s?.colorHex ?? null;
}

export function addressSummary(addr?: any): string {
  if (!addr) return "—";
  const parts = [addr.governorate, addr.city, addr.area, addr.street, addr.house].filter(Boolean);
  return parts.join("، ") || "—";
}

export function previewImages(order: any, max = 4): string[] {
  const items = order?.items ?? [];
  const urls: string[] = [];
  for (const it of items) {
    const url = orderItemImage(it);
    if (url && !urls.includes(url)) urls.push(url);
    if (urls.length >= max) break;
  }
  return urls;
}
