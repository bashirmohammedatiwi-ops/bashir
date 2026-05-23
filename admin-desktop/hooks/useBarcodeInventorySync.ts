"use client";

import { message } from "antd";
import type { FormInstance } from "antd";
import { useCallback, useRef, useState } from "react";
import { fetchInventoryByBarcode } from "@/lib/inventorySync";
import { resolveBarcodeFromForm } from "@/lib/resolveBarcode";

type ApplyOptions = {
  silent?: boolean;
};

export function useBarcodeInventorySync(form: FormInstance) {
  const [syncLoading, setSyncLoading] = useState(false);
  const [hasSyncData, setHasSyncData] = useState(false);
  const [syncMeta, setSyncMeta] = useState<{ offerName?: string; syncedAt?: string } | null>(
    null,
  );
  const lastPricingRef = useRef<string>("");

  const applyBarcode = useCallback(
    async (rawBarcode?: string, options?: ApplyOptions) => {
      const silent = options?.silent ?? false;
      const barcode = (rawBarcode ?? resolveBarcodeFromForm(form)).trim();
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

        const currentName = form.getFieldValue("name");
        form.setFieldsValue({
          barcode: form.getFieldValue("barcode") || barcode,
          price: data.price,
          originalPrice: data.originalPrice,
          discountPercent: data.discountPercent,
          stock: data.stock,
          ...(currentName ? {} : data.name ? { name: data.name } : {}),
          ...(form.getFieldValue("sku") ? {} : data.productNum ? { sku: data.productNum } : {}),
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

  const refreshPricing = useCallback(async () => {
    return applyBarcode(undefined, { silent: true });
  }, [applyBarcode]);

  const resetSync = useCallback(() => {
    lastPricingRef.current = "";
    setHasSyncData(false);
    setSyncMeta(null);
  }, []);

  return {
    hasSyncData,
    syncLoading,
    syncMeta,
    applyBarcode,
    refreshPricing,
    resetSync,
    resolveBarcode: () => resolveBarcodeFromForm(form),
  };
}
