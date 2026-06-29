"use client";

import { message } from "antd";
import type { FormInstance } from "antd";
import { useCallback, useRef, useState } from "react";
import { fetchInventoryByBarcode, normalizeBarcodeInput } from "@/lib/inventorySync";
import { normalizeBarcode } from "@/lib/barcode";
import { resolveBarcodeFromForm } from "@/lib/resolveBarcode";

type ApplyOptions = {
  silent?: boolean;
};

function aggregateProductPricingFromShades(form: FormInstance) {
  const shades = form.getFieldValue("shades") ?? [];
  if (!shades.length) return;

  const synced = shades.filter(
    (shade: { stock?: number; price?: number }) =>
      (shade?.stock ?? 0) > 0 || shade?.price != null,
  );
  if (!synced.length) return;

  const totalStock = shades.reduce(
    (sum: number, shade: { stock?: number }) => sum + Number(shade?.stock ?? 0),
    0,
  );
  const lead = synced[0];

  form.setFieldsValue({
    stock: totalStock,
    price: lead.price ?? form.getFieldValue("price"),
    originalPrice: lead.originalPrice ?? form.getFieldValue("originalPrice"),
    discountPercent: lead.discountPercent ?? form.getFieldValue("discountPercent"),
  });
}

export function useBarcodeInventorySync(form: FormInstance) {
  const [syncLoading, setSyncLoading] = useState(false);
  const [shadeSyncLoading, setShadeSyncLoading] = useState<Record<number, boolean>>({});
  const [hasSyncData, setHasSyncData] = useState(false);
  const [syncMeta, setSyncMeta] = useState<{ offerName?: string; syncedAt?: string } | null>(
    null,
  );
  const lastPricingRef = useRef<string>("");

  const applyBarcode = useCallback(
    async (rawBarcode?: string, options?: ApplyOptions) => {
      const silent = options?.silent ?? false;
      const barcode = normalizeBarcodeInput(rawBarcode ?? resolveBarcodeFromForm(form));
      if (!barcode) {
        setHasSyncData(false);
        setSyncMeta(null);
        return false;
      }

      if (!silent) setSyncLoading(true);
      try {
        const data = await fetchInventoryByBarcode(barcode);
        if (!data) {
          setHasSyncData(false);
          setSyncMeta(null);
          if (!silent) {
            message.warning("لا توجد بيانات مزامنة لهذا الباركود — شغّل تطبيق POS Sync");
          }
          return false;
        }

        const pricingKey = `${data.price}|${data.originalPrice}|${data.discountPercent}|${data.stock}`;
        const changed = pricingKey !== lastPricingRef.current;
        lastPricingRef.current = pricingKey;

        form.setFieldsValue({
          barcode: normalizeBarcode(form.getFieldValue("barcode")) || data.barcode || barcode,
          price: data.price,
          originalPrice: data.originalPrice,
          discountPercent: data.discountPercent,
          stock: data.stock,
        });

        setHasSyncData(true);
        setSyncMeta({
          offerName: data.offerName ?? undefined,
          syncedAt: data.syncedAt,
        });

        if (!silent && changed) {
          message.success("تم تحديث السعر والكمية من POS");
        }
        return true;
      } finally {
        if (!silent) setSyncLoading(false);
      }
    },
    [form],
  );

  const applyShadeBarcode = useCallback(
    async (shadeIndex: number, rawBarcode?: string, options?: ApplyOptions) => {
      const silent = options?.silent ?? false;
      const barcode = normalizeBarcodeInput(rawBarcode ?? "");
      if (!barcode) return false;

      if (!silent) {
        setShadeSyncLoading((current) => ({ ...current, [shadeIndex]: true }));
      }

      try {
        const data = await fetchInventoryByBarcode(barcode);
        if (!data) {
          if (!silent) {
            message.warning("لا توجد بيانات مزامنة لهذا الباركود — شغّل تطبيق POS Sync");
          }
          return false;
        }

        const shades = [...(form.getFieldValue("shades") ?? [])];
        if (!shades[shadeIndex]) return false;

        shades[shadeIndex] = {
          ...shades[shadeIndex],
          barcode:
            normalizeBarcode(shades[shadeIndex]?.barcode) || data.barcode || barcode,
          price: data.price,
          originalPrice: data.originalPrice,
          discountPercent: data.discountPercent,
          stock: data.stock,
        };

        form.setFieldsValue({ shades });
        aggregateProductPricingFromShades(form);
        setHasSyncData(true);
        setSyncMeta({
          offerName: data.offerName ?? undefined,
          syncedAt: data.syncedAt,
        });

        if (!silent) {
          message.success("تم جلب السعر والكمية لهذه الدرجة من POS");
        }
        return true;
      } finally {
        if (!silent) {
          setShadeSyncLoading((current) => ({ ...current, [shadeIndex]: false }));
        }
      }
    },
    [form],
  );

  const refreshPricing = useCallback(async () => {
    const shades = form.getFieldValue("shades") ?? [];
    let updated = false;

    for (let index = 0; index < shades.length; index += 1) {
      const barcode = shades[index]?.barcode;
      if (!barcode) continue;
      const ok = await applyShadeBarcode(index, barcode, { silent: true });
      updated = updated || ok;
    }

    if (!updated) {
      return applyBarcode(undefined, { silent: true });
    }

    return updated;
  }, [applyBarcode, applyShadeBarcode, form]);

  const resetSync = useCallback(() => {
    lastPricingRef.current = "";
    setHasSyncData(false);
    setSyncMeta(null);
    setShadeSyncLoading({});
  }, []);

  return {
    hasSyncData,
    syncLoading,
    shadeSyncLoading,
    syncMeta,
    applyBarcode,
    applyShadeBarcode,
    refreshPricing,
    resetSync,
    resolveBarcode: () => resolveBarcodeFromForm(form),
  };
}
