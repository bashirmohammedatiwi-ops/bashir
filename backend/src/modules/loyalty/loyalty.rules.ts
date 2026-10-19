/**
 * قواعد نقاط الولاء — تُقرأ من إعدادات المتجر (لوحة التحكم ← الإعدادات ← الولاء والعروض).
 * الافتراضي: كل نقطة = 1 د.ع خصم، الزبونة تكسب 1% من قيمة طلبها نقاطاً (10 نقاط لكل 1,000 د.ع)،
 * وتستخدمها بمضاعفات 250 (أصغر فئة نقدية عراقية)، ومكافأة أول طلب 500 نقطة.
 */
export const LOYALTY_DEFAULTS = {
  pointValue: 1,
  earnPercent: 1,
  redeemStep: 250,
  firstOrderBonus: 500,
};

/** عناوين سجل النقاط — يُستدل بها على ما خُصم أو أضيف فعلاً لكل طلب (لا تُغيَّر: سجلات قديمة بها). */
export const LOYALTY_REDEEM_TITLE = "استخدام نقاط في الطلب";
export const LOYALTY_EARN_TITLE = "نقاط من الطلب";
export const LOYALTY_BONUS_TITLE = "مكافأة أول طلب";

export type LoyaltyRules = typeof LOYALTY_DEFAULTS;

const num = (v: unknown, d: number, min = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : d;
};

export function loyaltyRules(settings?: Record<string, unknown> | null): LoyaltyRules {
  const s = settings ?? {};
  return {
    pointValue: num(s.loyaltyPointValue, LOYALTY_DEFAULTS.pointValue, 0.01),
    earnPercent: num(s.loyaltyEarnPercent, LOYALTY_DEFAULTS.earnPercent),
    redeemStep: Math.max(1, Math.round(num(s.loyaltyRedeemStep, LOYALTY_DEFAULTS.redeemStep, 1))),
    firstOrderBonus: Math.round(num(s.firstOrderBonusPoints, LOYALTY_DEFAULTS.firstOrderBonus)),
  };
}

/** النقاط المكتسبة من مبلغ (النسبة مقرّبة للأسفل). */
export const pointsForAmount = (amount: number, r: LoyaltyRules = LOYALTY_DEFAULTS) =>
  Math.max(0, Math.floor((amount * r.earnPercent) / 100));

/** أكبر عدد نقاط يمكن استخدامه: لا يتجاوز الرصيد ولا قيمة الطلب، بمضاعفات الخطوة. */
export const redeemablePoints = (requested: number, balance: number, orderAmount: number, r: LoyaltyRules = LOYALTY_DEFAULTS) => {
  const cap = Math.min(requested, balance, Math.floor(orderAmount / r.pointValue));
  return Math.max(0, Math.floor(cap / r.redeemStep) * r.redeemStep);
};
