"use client";

import { message } from "antd";
import type { FormInstance } from "antd";
import { useCallback, useState } from "react";
import { fetchInventoryByBarcode } from "@/lib/inventorySync";

export function useBarcodeInventorySync(form: FormInstance) {
  const [pricingFromSync, setPricingFromSync] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMeta, setSyncMeta] = useState<{ offerName?: string; syncedAt?: string } | null>(
    null,
  );

  const applyBarcode = useCallback(
    async (rawBarcode: string) => {
      const barcode = rawBarcode.trim();
      if (!barcode) {
        setPricingFromSync(false);
        setSyncMeta(null);
        return false;
      }

      setSyncLoading(true);
      try {
        const data = await fetchInventoryByBarcode(barcode);
        if (!data) {
          setPricingFromSync(false);
          setSyncMeta(null);
          message.warning("لا توجد بيانات مزامنة لهذا الباركود — شغّل تطبيق POS Sync أولاً");
          return false;
        }

        const currentName = form.getFieldValue("name");
        form.setFieldsValue({
          barcode,
          price: data.price,
          originalPrice: data.originalPrice,
          discountPercent: data.discountPercent,
          stock: data.stock,
          ...(currentName ? {} : data.name ? { name: data.name } : {}),
          ...(form.getFieldValue("sku") ? {} : data.productNum ? { sku: data.productNum } : {}),
        });

        setPricingFromSync(true);
        setSyncMeta({
          offerName: data.offerName ?? undefined,
          syncedAt: data.syncedAt,
        });
        message.success("تم جلب السعر والكمية من بيانات المزامنة");
        return true;
      } finally {
        setSyncLoading(false);
      }
    },
    [form],
  );

  const resetSync = useCallback(() => {
    setPricingFromSync(false);
    setSyncMeta(null);
  }, []);

  return {
    pricingFromSync,
    syncLoading,
    syncMeta,
    applyBarcode,
    resetSync,
  };
}
