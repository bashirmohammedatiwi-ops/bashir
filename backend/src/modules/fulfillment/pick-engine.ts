/**
 * محرّك «المطلوب مقابل المُجهَّز» — دوال نقية بلا قاعدة بيانات، يستعملها السيرفر وتُختبر وحدها.
 *
 * القواعد (خطة طلبات التطبيق، قسم «المخزون والأسعار والمبالغ»):
 * - المطابق بسعر الطلب، والناقص يُخصم بسعره في الطلب.
 * - الإضافي المدفوع بسعره الحالي؛ البديل عن سطر ناقص بسعر الأرخص منهما. الهدية/العينة بصفر.
 * - خصم الباقة يبقى بنسبة ما وصل من الأصناف المطلوبة.
 * - الكوبون: النسبة تُطبّق على ما وصل بنفس السقف، والمبلغ الثابت يبقى ما لم يتجاوز المجموع.
 *   لا يزيد خصم الكوبون أبداً عن خصمه الأصلي، ولا يُلغى بسبب نقص ليس من فعل العميل.
 * - التوصيل والتغليف ونقاط الولاء المستعملة كما حُسبت وقت الطلب.
 * - مبلغ الاستلام يُقرّب للأسفل لأقرب خطوة (250 د.ع) لصالح العميل.
 * - المدفوع مسبقاً: النقص يُسترجع، والإضافة تُحصّل عند الاستلام.
 */

export type PickLineKind = "ORDERED" | "EXTRA";
export type ExtraCharge = "PAID" | "FREE";

export interface PickLineInput {
  id: string;
  kind: PickLineKind;
  orderedQty: number;
  pickedQty: number;
  unitPrice: number;
  charge: ExtraCharge;
  reason?: string | null;
  substituteForLineId?: string | null;
}

/** حالة السطر ولونه في كل التطبيقات. */
export type LineState = "MATCHED" | "SHORT" | "PENDING" | "EXTRA";

export const LINE_COLOR: Record<LineState, "green" | "red" | "yellow" | "grey"> = {
  MATCHED: "green",
  SHORT: "red",
  EXTRA: "yellow",
  PENDING: "grey",
};

export const LINE_LABEL_AR: Record<LineState, string> = {
  MATCHED: "مطابق",
  SHORT: "ناقص",
  EXTRA: "إضافي",
  PENDING: "لم يُمسح بعد",
};

/**
 * @param finalized بعد «إنهاء التجهيز» كل نقص أحمر؛ أثناءه يبقى رمادياً «لم يُمسح بعد» ما لم يُسجَّل له سبب.
 */
export function lineState(line: PickLineInput, finalized: boolean): LineState {
  if (line.kind === "EXTRA") return "EXTRA";
  if (line.pickedQty >= line.orderedQty) return "MATCHED";
  if (finalized || (line.reason ?? "").trim()) return "SHORT";
  return "PENDING";
}

export interface PickCounts {
  matched: number;
  short: number;
  pending: number;
  extra: number;
  orderedUnits: number;
  pickedOrderedUnits: number;
  extraUnits: number;
}

export function pickCounts(lines: PickLineInput[], finalized: boolean): PickCounts {
  const c: PickCounts = { matched: 0, short: 0, pending: 0, extra: 0, orderedUnits: 0, pickedOrderedUnits: 0, extraUnits: 0 };
  for (const l of lines) {
    const s = lineState(l, finalized);
    if (s === "MATCHED") c.matched++;
    else if (s === "SHORT") c.short++;
    else if (s === "PENDING") c.pending++;
    else c.extra++;
    if (l.kind === "ORDERED") {
      c.orderedUnits += l.orderedQty;
      c.pickedOrderedUnits += Math.min(l.pickedQty, l.orderedQty);
    } else {
      c.extraUnits += l.pickedQty;
    }
  }
  return c;
}

export type CouponType = "PERCENT" | "AMOUNT" | "FREE_SHIPPING" | "FIRST_ORDER";

export interface OrderMoneyInput {
  subtotal: number;
  discountTotal: number;
  packageDiscount: number;
  shippingTotal: number;
  giftWrapFee: number;
  loyaltyDiscount: number;
  total: number;
  /** PAID = مدفوع مسبقاً (بطاقة، أو مغطّى بالنقاط/الكوبون). */
  paymentStatus: string;
  coupon?: { type: CouponType; value: number; maxDiscount: number | null } | null;
  /** خصم يدوي من كاشير الطلبات (بالدينار) — على الأصناف فقط، لا على التوصيل. */
  manualDiscount?: number;
}

export interface PickPolicy {
  /** خطوة تقريب مبلغ الاستلام (هاي إكسبريس تقرّب للأعلى لأقرب 250). */
  roundingStep: number;
  /** نقص أكبر من هذه النسبة من قيمة الأصناف المطلوبة يحتاج موافقة المدير. */
  approvalShortagePercent: number;
  /** إضافات مدفوعة أكبر من هذا المبلغ تحتاج موافقة المدير. */
  approvalExtraAmount: number;
}

export const DEFAULT_PICK_POLICY: PickPolicy = {
  roundingStep: 250,
  approvalShortagePercent: 50,
  approvalExtraAmount: 25_000,
};

export type ApprovalReason = "SHORTAGE_OVER_LIMIT" | "EXTRA_OVER_LIMIT";

export interface PickMoney {
  orderedSubtotal: number;
  deliveredValue: number;
  shortageValue: number;
  /** الإضافي المدفوع كما يُحسب على العميل (البديل بسعر الأرخص). */
  extrasValue: number;
  /** قيمة الهدايا والعينات بسعرها (لا تُحسب على العميل). */
  freeExtrasValue: number;
  finalSubtotal: number;
  packageDiscount: number;
  couponDiscount: number;
  finalDiscountTotal: number;
  /** فرق الخصم: الخصم الأصلي − الجديد (موجب = خصم أقل لأن ما وصل أقل). */
  discountRecalc: number;
  shippingTotal: number;
  giftWrapFee: number;
  loyaltyDiscount: number;
  /** خصم الكاشير اليدوي المطبّق فعلاً. */
  manualDiscount: number;
  /** المبلغ قبل التقريب. */
  totalBeforeRounding: number;
  prepaid: boolean;
  /** ما دفعه العميل مسبقاً (0 للدفع عند الاستلام). */
  paidAmount: number;
  roundingDiscount: number;
  /** ما يدفعه العميل عن الطلب كاملاً بعد التجهيز. */
  finalTotal: number;
  /** ما تحصّله شركة التوصيل. */
  codAmount: number;
  /** ما يُرجع للعميل (مدفوع مسبقاً ونقص). */
  refundAmount: number;
  /** finalTotal − total الأصلي. */
  adjustmentTotal: number;
  changed: boolean;
  allMissing: boolean;
  needsApproval: boolean;
  approvalReasons: ApprovalReason[];
}

const int = (n: number) => Math.round(Number.isFinite(n) ? n : 0);

export function computePickMoney(order: OrderMoneyInput, lines: PickLineInput[], policy: PickPolicy = DEFAULT_PICK_POLICY): PickMoney {
  const step = policy.roundingStep > 0 ? Math.round(policy.roundingStep) : 1;
  const ordered = lines.filter((l) => l.kind === "ORDERED");
  const byId = new Map(lines.map((l) => [l.id, l]));

  let orderedSubtotal = 0;
  let deliveredValue = 0;
  for (const l of ordered) {
    orderedSubtotal += l.orderedQty * l.unitPrice;
    deliveredValue += Math.min(Math.max(0, l.pickedQty), l.orderedQty) * l.unitPrice;
  }
  const shortageValue = orderedSubtotal - deliveredValue;

  let extrasValue = 0;
  let freeExtrasValue = 0;
  for (const l of lines) {
    if (l.kind !== "EXTRA" || l.pickedQty <= 0) continue;
    if (l.charge === "FREE") {
      freeExtrasValue += l.pickedQty * l.unitPrice;
      continue;
    }
    const sub = l.substituteForLineId ? byId.get(l.substituteForLineId) : undefined;
    const unit = sub ? Math.min(l.unitPrice, sub.unitPrice) : l.unitPrice;
    extrasValue += l.pickedQty * unit;
  }

  const ratio = orderedSubtotal > 0 ? deliveredValue / orderedSubtotal : 0;
  const packageDiscount = Math.min(int(order.packageDiscount * ratio), deliveredValue);
  const originalCoupon = Math.max(0, order.discountTotal - order.packageDiscount);
  const couponBase = Math.max(0, deliveredValue - packageDiscount);
  let couponDiscount: number;
  const c = order.coupon;
  if (originalCoupon === 0) {
    couponDiscount = 0;
  } else if (c && (c.type === "PERCENT" || c.type === "FIRST_ORDER")) {
    couponDiscount = int((couponBase * c.value) / 100);
    if (c.maxDiscount != null && c.maxDiscount > 0) couponDiscount = Math.min(couponDiscount, c.maxDiscount);
  } else if (c) {
    couponDiscount = originalCoupon;
  } else {
    // الكوبون حُذف: نسبة ما وصل.
    couponDiscount = int(originalCoupon * ratio);
  }
  couponDiscount = Math.max(0, Math.min(couponDiscount, originalCoupon, couponBase));

  const finalSubtotal = deliveredValue + extrasValue;
  const finalDiscountTotal = packageDiscount + couponDiscount;
  const loyaltyDiscount = Math.max(0, order.loyaltyDiscount);
  // خصم الكاشير لا يتجاوز قيمة الأصناف بعد خصومها (التوصيل يبقى كاملاً).
  const manualDiscount = Math.max(0, Math.min(int(order.manualDiscount ?? 0), Math.max(0, finalSubtotal - finalDiscountTotal - loyaltyDiscount)));
  const totalBeforeRounding = Math.max(
    0,
    finalSubtotal - finalDiscountTotal + order.shippingTotal + order.giftWrapFee - loyaltyDiscount - manualDiscount,
  );

  const prepaid = order.paymentStatus === "PAID";
  let paidAmount = 0;
  let codAmount: number;
  let roundingDiscount: number;
  let refundAmount = 0;
  let finalTotal: number;
  if (!prepaid) {
    codAmount = Math.floor(totalBeforeRounding / step) * step;
    roundingDiscount = totalBeforeRounding - codAmount;
    finalTotal = codAmount;
  } else {
    paidAmount = order.total;
    const diff = totalBeforeRounding - paidAmount;
    if (diff >= 0) {
      codAmount = Math.floor(diff / step) * step;
      roundingDiscount = diff - codAmount;
      finalTotal = paidAmount + codAmount;
    } else {
      codAmount = 0;
      roundingDiscount = 0;
      refundAmount = -diff;
      finalTotal = totalBeforeRounding;
    }
  }

  const allMissing = ordered.length > 0 && deliveredValue === 0 && extrasValue === 0;
  const approvalReasons: ApprovalReason[] = [];
  if (orderedSubtotal > 0 && shortageValue * 100 > orderedSubtotal * policy.approvalShortagePercent) {
    approvalReasons.push("SHORTAGE_OVER_LIMIT");
  }
  if (extrasValue > policy.approvalExtraAmount) approvalReasons.push("EXTRA_OVER_LIMIT");

  const changed =
    shortageValue > 0 ||
    manualDiscount > 0 ||
    lines.some((l) => l.kind === "EXTRA" && l.pickedQty > 0);

  return {
    orderedSubtotal,
    deliveredValue,
    shortageValue,
    extrasValue,
    freeExtrasValue,
    finalSubtotal,
    packageDiscount,
    couponDiscount,
    finalDiscountTotal,
    discountRecalc: order.discountTotal - finalDiscountTotal,
    shippingTotal: order.shippingTotal,
    giftWrapFee: order.giftWrapFee,
    loyaltyDiscount,
    manualDiscount,
    totalBeforeRounding,
    prepaid,
    paidAmount,
    roundingDiscount,
    finalTotal,
    codAmount,
    refundAmount,
    adjustmentTotal: finalTotal - order.total,
    changed,
    allMissing,
    needsApproval: approvalReasons.length > 0,
    approvalReasons,
  };
}

/** رمز الطلب في الـQR والباركود: رقم الطلب نفسه (حروف كبيرة وأرقام وشرطة — يقرأه ماسح الكاشير كما هو). */
export function orderCode(orderNumber: string): string {
  return orderNumber.trim().toUpperCase();
}

/**
 * يقرأ ما مسحه الموظف: «ORD-XXXX» (أو «ORDXXXX» إن أسقط الماسح الشرطة)، بأي حالة أحرف، مع مسافات أو رموز اتجاه عالقة.
 * البادئة إلزامية حتى لا يُفهم باركود منتج على أنه رقم طلب.
 * يرجع رقم الطلب بالصيغة المخزّنة، أو null إن لم يكن رمز طلب.
 */
export function parseOrderCode(raw: string | null | undefined): string | null {
  const clean = String(raw ?? "")
    .replace(/[‎‏‪-‮﻿\s]/g, "")
    .toUpperCase();
  if (!clean) return null;
  const m = /^ORD-?([A-Z0-9]{6,32})$/.exec(clean);
  if (!m) return null;
  return `ORD-${m[1]}`;
}
