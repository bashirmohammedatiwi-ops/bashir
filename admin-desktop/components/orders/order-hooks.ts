"use client";

import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/ordersApi";
import { useAuth } from "@/store/auth";

/**
 * بيانات أقسام تفاصيل الطلب. بلا placeholderData حتى لا تظهر بيانات الطلب السابق
 * لحظة التبديل بين الطلبات (الافتراضي في Providers يُبقي البيانات السابقة).
 */
export const orderKeys = {
  pick: (id: string) => ["order-pick", id] as const,
  shipment: (id: string) => ["order-shipment", id] as const,
  timeline: (id: string) => ["order-timeline", id] as const,
};

export function useOrderPick(orderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: orderKeys.pick(orderId ?? ""),
    queryFn: () => ordersApi.pick(orderId!),
    enabled: !!orderId && enabled,
    placeholderData: undefined,
    staleTime: 30_000,
  });
}

export function useOrderShipment(orderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: orderKeys.shipment(orderId ?? ""),
    queryFn: () => ordersApi.shipment(orderId!),
    enabled: !!orderId && enabled,
    placeholderData: undefined,
    staleTime: 30_000,
  });
}

export function useOrderTimeline(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.timeline(orderId ?? ""),
    queryFn: () => ordersApi.timeline(orderId!),
    enabled: !!orderId,
    placeholderData: undefined,
    staleTime: 30_000,
  });
}

/** صلاحيات الموظف الحالي (الأدوار من الـJWT المحفوظ). */
export function useStaffRole() {
  const role = useAuth((s) => s.user?.role ?? "");
  return {
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
    isAdmin: role === "SUPER_ADMIN" || role === "ADMIN",
  };
}
