export const STATUS: Record<string, { label: string; tone: string; icon: string }> = {
  PENDING: { label: "بانتظار التأكيد", tone: "bg-amber-50 text-amber-700", icon: "clock" },
  CONFIRMED: { label: "تم التأكيد", tone: "bg-sky-50 text-sky-700", icon: "check" },
  PROCESSING: { label: "قيد التجهيز", tone: "bg-indigo-50 text-indigo-700", icon: "box" },
  SHIPPED: { label: "في الطريق إليكِ", tone: "bg-violet-50 text-violet-700", icon: "truck" },
  DELIVERED: { label: "تم التوصيل", tone: "bg-emerald-50 text-success", icon: "check" },
  CANCELLED: { label: "ملغى", tone: "bg-rose-soft text-sale", icon: "close" },
  REFUNDED: { label: "مُسترجع", tone: "bg-canvas text-ink-soft", icon: "cash" },
};
export const statusOf = (s: string) => STATUS[s] ?? { label: s, tone: "bg-canvas text-ink-soft", icon: "box" };

export const TIMELINE = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
export const timelineStep = (s: string) => TIMELINE.indexOf(s as (typeof TIMELINE)[number]);

export const PAYMENT: Record<string, string> = { COD: "الدفع عند الاستلام", CARD: "بطاقة إلكترونية", WALLET: "محفظة" };
export const PAY_STATUS: Record<string, string> = { PENDING: "بانتظار الدفع", PAID: "مدفوع", FAILED: "فشل الدفع", REFUNDED: "مُسترجع" };

export const canCancel = (s: string) => s === "PENDING" || s === "CONFIRMED";
