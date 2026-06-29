import { CATALOG_HUB_URL } from "./config";

export type CatalogImportOption = {
  store: string;
  storeLabel: string;
  sourceId: string;
  nameAr: string;
  nameEn?: string;
  brandAr?: string;
  brandEn?: string;
  thumb?: string;
  barcode?: string;
  shadeName?: string;
  matchType?: string;
};

export type CatalogImportShade = {
  name: string;
  nameEn?: string;
  barcode?: string;
  colorHex?: string;
  colorHexEnd?: string;
  isGradient?: boolean;
  imageUrl?: string;
  sku?: string;
};

export type CatalogImportProduct = {
  store: string;
  storeLabel: string;
  sourceId: string;
  nameAr: string;
  nameEn: string;
  brandAr: string;
  brandEn: string;
  descriptionAr: string;
  descriptionEn: string;
  barcode?: string;
  sku: string;
  images: { url: string; isPrimary?: boolean }[];
  shades: CatalogImportShade[];
  hasShades: boolean;
  sourceUrl?: string;
  priceHint?: string;
  categoryHint?: string;
  categoryHintEn?: string;
};

async function catalogFetch<T>(path: string): Promise<T> {
  const url = `${CATALOG_HUB_URL}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || res.statusText || "فشل الاتصال بكتالوج المتاجر");
  }
  return json as T;
}

export async function searchCatalogByBarcode(barcode: string) {
  const q = encodeURIComponent(barcode.trim());
  return catalogFetch<{
    barcode: string;
    options: CatalogImportOption[];
    errors?: { store: string; message: string }[];
    byStore?: Record<string, number>;
  }>(`/api/import/search?q=${q}`);
}

export async function fetchCatalogProduct(store: string, sourceId: string) {
  const params = new URLSearchParams({
    store,
    id: sourceId,
    hubOrigin: CATALOG_HUB_URL,
  });
  const data = await catalogFetch<{ product: CatalogImportProduct }>(
    `/api/import/product?${params}`,
  );
  return data.product;
}
