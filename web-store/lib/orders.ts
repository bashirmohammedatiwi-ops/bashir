export const STATUS: Record<string, { label: string; tone: string; icon: string }> = {
  PENDING: { label: "بانتظار التأكيد", tone: "bg-amber-50 text-amber-700", icon: "clock" },
  CONFIRMED: { label: "تم التأكيد", tone: "bg-sky-50 text-sky-700", icon: "check" },
  PROCESSING: { label: "قيد التجهيز", tone: "bg-indigo-50 text-indigo-700", icon: "box" },
  SHIPPED: { label: "في الطريق إليكِ", tone: "bg-violet-50 text-violet-700", icon: "truck" },
  DELIVERED: { label: "تم التسليم", tone: "bg-emerald-50 text-success", icon: "check" },
  CANCELLED: { label: "ملغى", tone: "bg-rose-soft text-sale", icon: "close" },
  REFUNDED: { label: "مُسترجع", tone: "bg-canvas text-ink-soft", icon: "cash" },
};
export const statusOf = (s: string) => STATUS[s] ?? { label: s, tone: "bg-canvas text-ink-soft", icon: "box" };

export const TIMELINE = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
export const timelineStep = (s: string) => TIMELINE.indexOf(s as (typeof TIMELINE)[number]);

export const PAYMENT: Record<string, string> = { COD: "الدفع عند الاستلام", CARD: "بطاقة إلكترونية", WALLET: "محفظة" };
export const PAY_STATUS: Record<string, string> = { PENDING: "بانتظار الدفع", PAID: "مدفوع", FAILED: "فشل الدفع", REFUNDED: "مُسترجع" };

export const canCancel = (s: string) => s === "PENDING" || s === "CONFIRMED";

// ─── التجهيز والشحن (`delivery` في GET /orders/:id) ─────────────────────────

/** صنف تغيّر أثناء التجهيز: ناقص (نفد) أو مُضاف. */
export type OrderChange = {
  name: string;
  shadeName: string | null;
  kind: "missing" | "extra";
  qty: number;
  ordered: number;
  picked: number;
  free: boolean;
  unitPrice: number;
};

export type OrderDelivery = {
  stage: string | null;
  /** تسمية المرحلة للزبونة بالعربية من السيرفر. */
  stageLabel: string | null;
  courier: string | null;
  trackingNumber: string | null;
  courierStatus: string | null;
  /** يرسله السيرفر فقط والطلب مع المندوب. */
  driverName: string | null;
  originalTotal: number | null;
  finalTotal: number | null;
  /** يُستلم عند الباب — null قبل انتهاء التجهيز. */
  codAmount: number | null;
  prepaid: boolean;
  adjusted: boolean;
  changes: OrderChange[];
};

/** ألوان التعديلات — نفس ألوان تطبيقات التجهيز والكاشير (أحمر = ناقص، أصفر = مُضاف). */
export const CHANGE_TONE = {
  missing: { box: "border-[#D64545]/25 bg-[#D64545]/[0.07]", text: "text-[#D64545]", icon: "minus" },
  extra: { box: "border-[#DB8B12]/25 bg-[#DB8B12]/[0.08]", text: "text-[#DB8B12]", icon: "plus" },
} as const;

const str = (v: unknown) => (v == null ? null : String(v).trim() || null);
const num = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: unknown) => v === true || v === 1 || v === "true" || v === "1";

/** `delivery` بشكل آمن: null في السيرفر القديم أو لقيمة غير كائن؛ الأسطر غير المفهومة تُترك. */
export function deliveryOf(raw: unknown): OrderDelivery | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  const changes: OrderChange[] = [];
  for (const c of Array.isArray(d.changes) ? d.changes : []) {
    if (!c || typeof c !== "object") continue;
    const r = c as Record<string, unknown>;
    const k = String(r.kind ?? "").toLowerCase();
    const color = String(r.color ?? "").toLowerCase();
    const kind = k === "missing" || k === "extra" ? k : color === "red" ? "missing" : color === "yellow" ? "extra" : null;
    const name = str(r.name);
    if (!kind || !name) continue;
    const qty = num(r.qty) ?? 0;
    changes.push({
      name,
      shadeName: str(r.shadeName),
      kind,
      qty: qty > 0 ? qty : 1,
      ordered: num(r.ordered) ?? 0,
      picked: num(r.picked) ?? 0,
      free: bool(r.free),
      unitPrice: num(r.unitPrice) ?? 0,
    });
  }
  return {
    stage: str(d.stage)?.toUpperCase() ?? null,
    stageLabel: str(d.stageLabel),
    courier: str(d.courier),
    trackingNumber: str(d.trackingNumber),
    courierStatus: str(d.courierStatus),
    driverName: str(d.driverName),
    originalTotal: num(d.originalTotal),
    finalTotal: num(d.finalTotal),
    codAmount: num(d.codAmount),
    prepaid: bool(d.prepaid),
    adjusted: bool(d.adjusted),
    changes,
  };
}

/** المندوب يظهر فقط والطلب معه. */
export const activeDriver = (d: OrderDelivery | null) => (d?.stage === "OUT_FOR_DELIVERY" ? d.driverName : null);

/** تغيّر المبلغ بعد التجهيز — المبلغ النهائي هو المطلوب. */
export const isAdjusted = (d: OrderDelivery | null): d is OrderDelivery & { finalTotal: number } => !!d?.adjusted && d.finalTotal != null;

/** مدفوع بالكامل مسبقاً — لا شيء يُدفع عند الباب. */
export const fullyPaid = (d: OrderDelivery) => d.prepaid && (d.codAmount ?? 0) <= 0;

/** «نفد: الاسم — اللون ×n» / «أُضيف: …». */
export const changeText = (c: OrderChange) => `${c.kind === "missing" ? "نفد" : "أُضيف"}: ${c.name}${c.shadeName ? ` — ${c.shadeName}` : ""} ×${c.qty}`;

export type SubStep = { step: (typeof TIMELINE)[number]; title: string; /** تحت عمود الخطوة. */ short: string; hint: string; tone: "accent" | "warning"; icon: string };

/** مرحلة فرعية داخل الخطوة الحالية حسب مرحلة التجهيز («جاهز للشحن»، «مع المندوب»، «تعذّر التوصيل مؤقتاً»). */
export function subStepOf(status: string, d: OrderDelivery | null, pickup: boolean): SubStep | null {
  if (!d?.stage) return null;
  const label = d.stageLabel;
  if (status === "PROCESSING" && (d.stage === "PICKED" || d.stage === "INVOICED"))
    return { step: "PROCESSING", title: label ?? "جاهز للشحن", short: label ?? "جاهز للشحن", hint: "جهّزنا طلبكِ وسنسلّمه لشركة التوصيل قريباً", tone: "accent", icon: "box" };
  if (status === "PROCESSING" && d.stage === "READY_FOR_PICKUP")
    return { step: "PROCESSING", title: label ?? "جاهز للاستلام من المحل", short: "جاهز للاستلام", hint: "طلبكِ ينتظركِ في الفرع — تفضّلي باستلامه", tone: "accent", icon: "bag" };
  if (status === "SHIPPED" && !pickup && d.stage === "OUT_FOR_DELIVERY") {
    const driver = activeDriver(d);
    const hint = "المندوب في طريقه إليكِ — أبقي هاتفكِ قريباً";
    return { step: "SHIPPED", title: label ?? "مع المندوب", short: label ?? "مع المندوب", hint: driver ? `المندوب: ${driver} — في طريقه إليكِ، أبقي هاتفكِ قريباً` : hint, tone: "accent", icon: "truck" };
  }
  if (status === "SHIPPED" && !pickup && d.stage === "DELIVERY_ISSUE")
    return { step: "SHIPPED", title: `${label ?? "تعذّر التوصيل مؤقتاً"} — تواصلي معنا`, short: label ?? "تعذّر التوصيل مؤقتاً", hint: "لم يتمكّن المندوب من التوصيل هذه المرة، نرتّب معكِ موعداً جديداً", tone: "warning", icon: "clock" };
  if (status === "DELIVERED" && d.stage === "PARTIALLY_DELIVERED")
    return { step: "DELIVERED", title: label ?? "تم التسليم جزئياً", short: label ?? "تم التسليم جزئياً", hint: "استلمتِ جزءاً من طلبكِ — لأي استفسار تواصلي معنا", tone: "warning", icon: "box" };
  return null;
}
