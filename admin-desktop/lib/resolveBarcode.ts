import type { FormInstance } from "antd";

export function resolveBarcodeFromForm(form: FormInstance): string {
  const productBarcode = String(form.getFieldValue("barcode") ?? "").trim();
  if (productBarcode) return productBarcode;

  const sku = String(form.getFieldValue("sku") ?? "").trim();
  if (sku) return sku;

  const shades = form.getFieldValue("shades") ?? [];
  for (const shade of shades) {
    const bc = String(shade?.barcode ?? "").trim();
    if (bc) return bc;
  }
  return "";
}
