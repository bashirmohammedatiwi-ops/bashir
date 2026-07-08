import { getCatalogHubUrl } from "./config";

export type CatalogStore = {
  id: string;
  label: string;
  domain?: string;
  siteUrl?: string;
};

export type CatalogCategoryNode = {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  level: number;
  isLeaf: boolean;
  productCount?: number | null;
  children?: CatalogCategoryNode[];
  path?: string;
};

export type CatalogListProduct = {
  id: string;
  nameAr: string;
  nameEn?: string;
  brandAr?: string;
  thumb?: string;
  price?: string;
  shadeCount?: number;
  hasOptions?: boolean;
  category?: string;
};

export type CatalogImportShade = {
  name: string;
  nameAr?: string;
  nameEn?: string;
  barcode?: string;
  colorHex?: string;
  imageUrl?: string;
  swatchUrl?: string;
  sku?: string;
  price?: string;
  optionGroup?: string;
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
};

export type CatalogImportOption = {
  store: string;
  storeLabel: string;
  sourceId: string;
  nameAr: string;
  nameEn?: string;
  brandAr?: string;
  thumb?: string;
  barcode?: string;
  shadeCount?: number;
  price?: string;
  category?: string;
  matchType?: string;
};

export function catalogOptionKey(opt: Pick<CatalogImportOption, "store" | "sourceId">) {
  return `${opt.store}:${opt.sourceId}`;
}

async function catalogFetch<T>(path: string, timeoutMs = 60_000): Promise<T> {
  const url = `${getCatalogHubUrl()}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    const json = await res.json();
    if (!res.ok) {
      const msg =
        (typeof json?.error === "string" && json.error) ||
        json?.message ||
        res.statusText ||
        "فشل الاتصال بكتالوج المتاجر";
      throw new Error(msg);
    }
    return json as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("انتهت مهلة الطلب — جرّب مرة أخرى");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function mapImportProduct(raw: Record<string, unknown>, storeLabel = ""): CatalogImportProduct {
  const shades = ((raw.shades as CatalogImportShade[]) || []).map((s) => ({
    name: s.name || s.nameAr || s.nameEn || "",
    nameAr: s.nameAr || s.name || "",
    nameEn: s.nameEn || s.name || "",
    barcode: s.barcode || "",
    colorHex: s.colorHex || "",
    imageUrl: s.imageUrl || "",
    swatchUrl: s.swatchUrl || s.imageUrl || "",
    sku: s.sku || "",
    price: s.price || "",
    optionGroup: s.optionGroup || "",
  }));

  const images = ((raw.images as { url: string }[]) || []).map((img, i) => ({
    url: img.url,
    isPrimary: i === 0,
  }));
  if (!images.length && raw.thumb) {
    images.push({ url: String(raw.thumb), isPrimary: true });
  }

  return {
    store: String(raw.sourceStore || raw.store || ""),
    storeLabel: storeLabel || String(raw.storeLabel || ""),
    sourceId: String(raw.sourceId || raw.id || ""),
    nameAr: String(raw.nameAr || ""),
    nameEn: String(raw.nameEn || ""),
    brandAr: String(raw.brandAr || ""),
    brandEn: String(raw.brandEn || ""),
    descriptionAr: String(raw.descriptionAr || ""),
    descriptionEn: String(raw.descriptionEn || ""),
    barcode: String(raw.barcode || ""),
    sku: String(raw.sourceSku || raw.sku || raw.sourceId || ""),
    images,
    shades,
    hasShades: shades.length > 1 || raw.hasOptions === true,
    sourceUrl: String(raw.productUrl || raw.sourceUrl || ""),
    priceHint: String(raw.price || raw.priceHint || ""),
    categoryHint: String(raw.category || raw.categoryHint || ""),
  };
}

export async function fetchCatalogStores(): Promise<CatalogStore[]> {
  const data = await catalogFetch<{ stores: CatalogStore[] }>("/api/catalog/stores");
  return data.stores || [];
}

export async function fetchCategoryTree(storeId: string) {
  return catalogFetch<{ tree: CatalogCategoryNode[]; leaves: CatalogCategoryNode[] }>(
    `/api/catalog/${encodeURIComponent(storeId)}/categories`,
    90_000,
  );
}

export async function listCategoryProducts(
  storeId: string,
  categoryId: string,
  page = 1,
  limit = 30,
  sort = "default",
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  });
  return catalogFetch<{
    products: CatalogListProduct[];
    hasMore: boolean;
    total: number;
    page: number;
  }>(`/api/catalog/${encodeURIComponent(storeId)}/categories/${encodeURIComponent(categoryId)}/products?${params}`);
}

export async function searchCatalogProducts(
  storeId: string,
  query: string,
  page = 1,
  limit = 30,
  categoryId = "",
) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  if (categoryId) params.set("category", categoryId);
  return catalogFetch<{
    products: CatalogListProduct[];
    hasMore: boolean;
    total: number;
  }>(`/api/catalog/${encodeURIComponent(storeId)}/search?${params}`);
}

export async function searchCatalogByBarcode(barcode: string, storeId = "miswag") {
  const q = encodeURIComponent(barcode.trim());
  const data = await catalogFetch<{
    query: string;
    results: Array<Record<string, unknown>>;
  }>(`/api/import/search?q=${q}&store=${encodeURIComponent(storeId)}`, 90_000);

  const options: CatalogImportOption[] = (data.results || []).map((r) => ({
    store: String(r.store || storeId),
    storeLabel: String(r.storeLabel || storeId),
    sourceId: String(r.id || r.sourceId || ""),
    nameAr: String(r.nameAr || r.name || ""),
    nameEn: String(r.nameEn || ""),
    brandAr: String(r.brandAr || r.manufacturer || ""),
    thumb: String(r.thumb || ""),
    barcode: String(r.barcode || barcode),
    shadeCount: Number(r.shadeCount || 0),
    price: String(r.price || ""),
    category: String(r.category || ""),
    matchType: String(r.matchType || "barcode"),
  }));

  return { barcode: data.query || barcode, options };
}

export async function fetchCatalogProduct(storeId: string, sourceId: string, storeLabel = "") {
  const data = await catalogFetch<{ product: Record<string, unknown> }>(
    `/api/import/${encodeURIComponent(storeId)}/products/${encodeURIComponent(sourceId)}`,
    120_000,
  );
  return mapImportProduct(data.product, storeLabel);
}

export async function fetchCatalogPreview(storeId: string, sourceId: string) {
  const data = await catalogFetch<{ product: Record<string, unknown> }>(
    `/api/catalog/${encodeURIComponent(storeId)}/products/${encodeURIComponent(sourceId)}?light=1`,
    30_000,
  );
  const p = data.product || {};
  return {
    id: String(p.id || sourceId),
    nameAr: String(p.nameAr || ""),
    nameEn: String(p.nameEn || ""),
    brandAr: String(p.brandAr || ""),
    thumb: String(p.thumb || ""),
    price: String(p.price || ""),
    shadeCount: Number(p.shadeCount || 0),
    hasOptions: p.hasOptions === true,
  };
}
