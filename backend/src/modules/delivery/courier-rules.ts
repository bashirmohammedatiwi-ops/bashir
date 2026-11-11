/**
 * قواعد ربط هاي إكسبريس (دوال نقية تُختبر وحدها): رقم الحالة ← مرحلتنا، الهاتف، المحافظة، ونص العنوان.
 * الربط بالرقم فقط — الأسماء عندهم نص عرض قد يتغير بلا إشعار.
 */

export type CourierStage =
  | "HANDED_OVER"
  | "OUT_FOR_DELIVERY"
  | "DELIVERY_ISSUE"
  | "DELIVERED"
  | "PARTIALLY_DELIVERED"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED";

export interface StatusRule {
  stage: CourierStage;
  /** حالة نهائية: لا تتغير بعدها الشحنة. */
  final: boolean;
  /** يحتاج قراراً أو انتباهاً من المدير. */
  alert: boolean;
  label: string;
}

/** كل أرقام حالات هاي إكسبريس (من GET /orders/statuses?all=1، 12 تشرين الثاني 2026). */
export const HI_STATUS: Record<number, StatusRule> = {
  0: { stage: "HANDED_OVER", final: false, alert: false, label: "سُلّم لهاي إكسبريس" },
  29: { stage: "HANDED_OVER", final: false, alert: false, label: "جاهز للشحن" },
  32: { stage: "HANDED_OVER", final: false, alert: false, label: "أُضيف لدفعة الاستلام" },
  38: { stage: "HANDED_OVER", final: false, alert: false, label: "تم المسح" },
  30: { stage: "HANDED_OVER", final: false, alert: false, label: "استلمه المندوب من المحل" },
  20: { stage: "HANDED_OVER", final: false, alert: false, label: "في مخزن هاي إكسبريس" },
  2: { stage: "HANDED_OVER", final: false, alert: false, label: "في مركز التوزيع" },
  8: { stage: "HANDED_OVER", final: false, alert: false, label: "في الطريق للمركز" },
  1: { stage: "OUT_FOR_DELIVERY", final: false, alert: false, label: "مع المندوب" },
  24: { stage: "OUT_FOR_DELIVERY", final: false, alert: false, label: "إعادة إرسال للزبونة" },
  3: { stage: "DELIVERED", final: true, alert: false, label: "تم التسليم" },
  9: { stage: "DELIVERED", final: true, alert: false, label: "تم التسليم (المندوب)" },
  21: { stage: "PARTIALLY_DELIVERED", final: true, alert: true, label: "تسليم جزئي" },
  4: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "فشلت محاولة التوصيل" },
  10: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "فشلت محاولة التوصيل (المندوب)" },
  11: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "تأجيل" },
  23: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "رفضته الزبونة" },
  35: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "تالف / مفقود" },
  5: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "إرجاع الطلب" },
  6: { stage: "DELIVERY_ISSUE", final: false, alert: true, label: "أُرجع للمركز" },
  25: { stage: "RETURNING", final: false, alert: true, label: "راجع في مخزن هاي إكسبريس" },
  26: { stage: "RETURNING", final: false, alert: true, label: "راجع من تسليم جزئي" },
  27: { stage: "RETURNING", final: false, alert: true, label: "قيد الإرجاع للمحل" },
  31: { stage: "RETURNING", final: false, alert: true, label: "جاهز للإرجاع للمحل" },
  7: { stage: "RETURNED", final: true, alert: true, label: "أُرجع للمحل" },
  28: { stage: "RETURNED", final: true, alert: true, label: "أُرجع للمحل" },
  34: { stage: "CANCELLED", final: true, alert: true, label: "ألغته هاي إكسبريس" },
};

/** قاعدة الرقم، أو null لرقم غير معروف (يُسجَّل ولا يغيّر حالة الطلب). */
export function statusRule(id: number | null | undefined): StatusRule | null {
  if (id == null || !Number.isFinite(Number(id))) return null;
  return HI_STATUS[Number(id)] ?? null;
}

/** ترتيب المراحل: رسالة متأخرة لا ترجع الطلب للخلف (إلا مشكلة توصيل بعد «مع المندوب» وإعادة الإرسال بعدها). */
const RANK: Record<CourierStage, number> = {
  HANDED_OVER: 1,
  OUT_FOR_DELIVERY: 2,
  DELIVERY_ISSUE: 2,
  RETURNING: 3,
  DELIVERED: 4,
  PARTIALLY_DELIVERED: 4,
  RETURNED: 4,
  CANCELLED: 4,
};

/** هل نطبّق الحالة الجديدة على الشحنة الحالية؟ */
export function shouldApply(
  current: { statusId: number | null; statusAt: Date | null; isFinal: boolean },
  next: { statusId: number; at: Date | null },
): boolean {
  if (current.isFinal) return false;
  const rule = statusRule(next.statusId);
  if (!rule) return false;
  if (current.statusId === next.statusId && (!next.at || !current.statusAt || next.at <= current.statusAt)) return false;
  if (current.statusAt && next.at && next.at < current.statusAt) return false;
  const cur = statusRule(current.statusId);
  if (cur && RANK[rule.stage] < RANK[cur.stage]) return false;
  return true;
}

/** هاتف عراقي بصيغة 07XXXXXXXXX (كما تقبله هاي إكسبريس)، أو null إن لم يكن صالحاً. */
export function courierPhone(raw: string | null | undefined): string | null {
  const digits = String(raw ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("00964")) local = local.slice(5);
  else if (local.startsWith("964")) local = local.slice(3);
  if (local.startsWith("0")) local = local.slice(1);
  return /^7\d{9}$/.test(local) ? `0${local}` : null;
}

/** أسماء محافظاتنا التي تختلف عن أسمائهم. */
const GOV_ALIASES: Record<string, string> = {
  القادسية: "الديوانية",
  الديوانية: "الديوانية",
  "ذي قار": "ذي قار",
  الناصرية: "ذي قار",
  الموصل: "نينوى",
  اربيل: "أربيل",
  الانبار: "الأنبار",
};

const plain = (s: string) =>
  s
    .trim()
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");

/** اقتراح رقم المحافظة لديهم من اسم محافظتنا (مطابقة الاسم بعد التطبيع + الأسماء البديلة). */
export function suggestGovernance(ourName: string, theirs: Array<{ id: number; name: string }>): number | null {
  const wanted = [ourName, GOV_ALIASES[ourName.trim()]].filter(Boolean).map((x) => plain(x!));
  const hit = theirs.find((g) => wanted.includes(plain(g.name)));
  return hit?.id ?? null;
}

/** نص العنوان للمندوب: المنطقة، الشارع، البيت، ثم أقرب نقطة دالة. */
export function courierAddress(o: { shipArea?: string | null; shipStreet?: string | null; shipHouse?: string | null; shipNotes?: string | null }): string {
  return [o.shipArea, o.shipStreet, o.shipHouse ? `بيت ${o.shipHouse}` : null, o.shipNotes]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(" — ")
    .slice(0, 500);
}
