"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { couponDiscount } from "../pricing";
import { useAuth } from "../stores/auth";
import { cartCount, cartSubtotal, packageStatus, useCart } from "../stores/cart";
import type { Coupon } from "../types";

export type CouponCheck = { ok: boolean; reason?: string; coupon?: Coupon };

export const checkCoupon = (code: string) => api<CouponCheck>(`/coupons/check/${encodeURIComponent(code.trim())}`);

/** الكوبون المطبّق في السلة (يُعاد التحقق منه مع حساب الزبونة: «لأول طلب فقط»…). */
export function useAppliedCoupon() {
  const code = useCart((s) => s.couponCode);
  const user = useAuth((s) => s.user);
  return useQuery({ queryKey: ["coupon", code, user?.id], enabled: !!code, queryFn: () => checkCoupon(code!), staleTime: 60_000 });
}

/** حساب السلة: المجموع، توفير الباقات، والكوبون — نفس ترتيب السيرفر. */
export function useCartMath() {
  const lines = useCart((s) => s.lines);
  const packages = useCart((s) => s.packages);
  const status = packageStatus(lines, packages);
  const packSaving = status.reduce((s, x) => s + x.saving, 0);
  const subtotal = cartSubtotal(lines);
  const couponBase = Math.max(0, subtotal - packSaving);
  const q = useAppliedCoupon();
  const coupon = q.data?.ok ? q.data.coupon ?? null : null;
  const c = couponDiscount(coupon, couponBase);
  const compareAt = lines.reduce((s, l) => s + Math.max(l.originalPrice, l.price) * l.quantity, 0);
  return {
    lines,
    status,
    count: cartCount(lines),
    subtotal,
    packSaving,
    couponBase,
    coupon,
    couponReason: q.data && !q.data.ok ? q.data.reason : null,
    couponDiscount: c.discount,
    couponEligible: c.eligible,
    couponMissing: c.missing,
    freeShippingCoupon: c.freeShipping,
    productSaving: Math.max(0, compareAt - subtotal),
  };
}
