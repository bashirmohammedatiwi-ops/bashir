import type { FormInstance } from "antd";
import { normalizeBarcode } from "@/lib/barcode";

export function resolveBarcodeFromForm(form: FormInstance): string {
  const productBarcode = normalizeBarcode(String(form.getFieldValue("barcode") ?? ""));
  if (productBarcode) return productBarcode;

  const sku = normalizeBarcode(String(form.getFieldValue("sku") ?? ""));
  if (sku) return sku;

  const shades = form.getFieldValue("shades") ?? [];
  for (const shade of shades) {
    const bc = normalizeBarcode(String(shade?.barcode ?? ""));
    if (bc) return bc;
  }
  return "";
}
