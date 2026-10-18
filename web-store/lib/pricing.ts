import type { Coupon, LoyaltyRules } from "./types";

/** خصم الكوبون على المجموع بعد توفير الباقات — نفس حساب السيرفر. */
export function couponDiscount(c: Coupon | null | undefined, base: number) {
  if (!c) return { discount: 0, freeShipping: false, eligible: false, missing: 0 };
  const eligible = !c.minOrder || base >= c.minOrder;
  if (!eligible) return { discount: 0, freeShipping: false, eligible, missing: c.minOrder - base };
  if (c.type === "FREE_SHIPPING") return { discount: 0, freeShipping: true, eligible, missing: 0 };
  let d = c.type === "PERCENT" || c.type === "FIRST_ORDER" ? Math.round((base * c.value) / 100) : c.value;
  if (c.maxDiscount && c.maxDiscount > 0) d = Math.min(d, c.maxDiscount);
  return { discount: Math.min(d, base), freeShipping: false, eligible, missing: 0 };
}

export const redeemable = (balance: number, amount: number, r: LoyaltyRules) => {
  const cap = Math.min(balance, Math.floor(amount / r.pointValue));
  return Math.max(0, Math.floor(cap / r.redeemStep) * r.redeemStep);
};
export const pointsFor = (amount: number, r: LoyaltyRules) => Math.max(0, Math.floor((amount * r.earnPercent) / 100));
