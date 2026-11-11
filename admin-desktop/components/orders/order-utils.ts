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
  CARD: "بطاقة إلكترونية (كي كارد)",
  WALLET: "محفظة",
};

export const DELIVERY_LABELS: Record<string, string> = {
  STANDARD: "توصيل عادي",
  EXPRESS: "توصيل سريع",
  PICKUP: "استلام من المتجر",
};

/** مراحل تجهيز طلب التطبيق (Order.fulfillmentStage) — تسميات الموظفين. */
export const STAGE_LABELS: Record<string, string> = {
  NEW: "جديد",
  CONFIRMED: "مؤكد",
  PICKING: "قيد التجهيز",
  PICKED: "بانتظار الكاشير",
  READY_FOR_PICKUP: "جاهز للاستلام",
  INVOICED: "مُفوتر (بانتظار شركة التوصيل)",
  HANDED_OVER: "سُلّم للشحن",
  OUT_FOR_DELIVERY: "مع المندوب",
  DELIVERY_ISSUE: "مشكلة توصيل",
  DELIVERED: "تم التسليم",
  PARTIALLY_DELIVERED: "تسليم جزئي",
  RETURNING: "راجع للمحل",
  RETURNED: "مُرتجع",
  CANCELLED: "ملغي",
};

export const STAGE_COLORS: Record<string, string> = {
  NEW: "#64748b",
  CONFIRMED: "#3b82f6",
  PICKING: "#8b5cf6",
  PICKED: "#DB8B12",
  READY_FOR_PICKUP: "#0ea5e9",
  INVOICED: "#0891b2",
  HANDED_OVER: "#06b6d4",
  OUT_FOR_DELIVERY: "#2563eb",
  DELIVERY_ISSUE: "#D64545",
  DELIVERED: "#1F9D63",
  PARTIALLY_DELIVERED: "#ca8a04",
  RETURNING: "#ea580c",
  RETURNED: "#9a3412",
  CANCELLED: "#94a3b8",
};

/** مراحل لم يبدأ فيها التجهيز بعد. */
export const PRE_PICK_STAGES = ["NEW", "CONFIRMED"];

/** فلاتر المراحل السريعة في قائمة الطلبات (المفتاح = قيمة stage المرسلة). */
export const STAGE_QUICK_FILTERS: { key: string; label: string; stages: string[]; color: string }[] = [
  { key: "PICKING", label: "قيد التجهيز", stages: ["PICKING"], color: STAGE_COLORS.PICKING },
  { key: "PICKED", label: "بانتظار الكاشير", stages: ["PICKED"], color: STAGE_COLORS.PICKED },
  { key: "INVOICED", label: "بانتظار شركة التوصيل", stages: ["INVOICED"], color: STAGE_COLORS.INVOICED },
  { key: "OUT_FOR_DELIVERY", label: "مع المندوب", stages: ["OUT_FOR_DELIVERY"], color: STAGE_COLORS.OUT_FOR_DELIVERY },
  { key: "DELIVERY_ISSUE", label: "مشاكل توصيل", stages: ["DELIVERY_ISSUE"], color: STAGE_COLORS.DELIVERY_ISSUE },
  { key: "RETURNS", label: "مرتجعات", stages: ["RETURNING", "RETURNED"], color: STAGE_COLORS.RETURNING },
];

/** ألوان أسطر التجهيز (نفسها في كل التطبيقات). */
export const PICK_COLORS: Record<string, string> = {
  green: "#1F9D63",
  red: "#D64545",
  yellow: "#DB8B12",
  grey: "#94a3b8",
};

/**
 * الخطوات المنطقية التالية لحالة الطلب (بدون الإلغاء — له زر خاص).
 * الاستلام من المحل يُسلَّم مباشرة بعد التحضير.
 */
export function nextStatuses(status: string, deliveryOption?: string | null): string[] {
  switch (status) {
    case "PENDING":
      return ["CONFIRMED"];
    case "CONFIRMED":
      return ["PROCESSING"];
    case "PROCESSING":
      return deliveryOption === "PICKUP" ? ["DELIVERED"] : ["SHIPPED"];
    case "SHIPPED":
      return ["DELIVERED"];
    case "DELIVERED":
      return ["REFUNDED"];
    default:
      return [];
  }
}

/** نص زر الانتقال لكل حالة. */
export const STATUS_ACTION_LABELS: Record<string, string> = {
  CONFIRMED: "تأكيد الطلب",
  PROCESSING: "بدء التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  REFUNDED: "تسجيل كمسترد",
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
