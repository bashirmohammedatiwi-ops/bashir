"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useAuth } from "../stores/auth";
import type { Address, ShippingZone } from "../types";

export const useZones = () =>
  useQuery({ queryKey: ["zones"], queryFn: () => api<ShippingZone[]>("/shipping/zones", { auth: false }), staleTime: 3600_000 });

export function useAddresses() {
  const user = useAuth((s) => s.user);
  return useQuery({ queryKey: ["addresses", user?.id], enabled: !!user, queryFn: () => api<Address[]>("/addresses") });
}

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** يوم عمل بعد n أيام — الجمعة عطلة التوصيل تُتخطّى (نفس التطبيق). */
function addWorkDays(from: Date, n: number) {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 5) left--;
  }
  return d;
}

export function deliveryLabel(z: Pick<ShippingZone, "governorate" | "deliveryDaysMin" | "deliveryDaysMax">, withPlace = true) {
  const min = z.deliveryDaysMin ?? 1;
  const max = Math.max(min, z.deliveryDaysMax ?? min);
  const now = new Date();
  const a = addWorkDays(now, min);
  const b = addWorkDays(now, max);
  const place = withPlace ? ` إلى ${z.governorate}` : "";
  if (a.toDateString() === b.toDateString()) {
    const tomorrow = addWorkDays(now, 1).toDateString() === a.toDateString() && min === 1;
    return `يصلكِ${place} ${tomorrow ? "غداً" : DAYS[a.getDay()]}`;
  }
  return `يصلكِ${place} بين ${DAYS[a.getDay()]} و${DAYS[b.getDay()]}`;
}

/** لصفحة المنتج: محافظة العنوان الافتراضي، وإلا مدى كل المحافظات. */
export function useDeliveryHint(): string | null {
  const zones = useZones().data;
  const addresses = useAddresses().data;
  if (!zones?.length) return null;
  const main = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const z = zones.find((x) => x.governorate === main?.governorate);
  if (z) return deliveryLabel(z);
  const min = Math.min(...zones.map((x) => x.deliveryDaysMin ?? 1));
  const max = Math.max(...zones.map((x) => x.deliveryDaysMax ?? 3));
  return `التوصيل لكل المحافظات خلال ${min === max ? min : `${min}–${max}`} ${max <= 2 ? "يوم" : "أيام"}`;
}
