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
  store?: string;
  storeLabel?: string;
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
  miswagId?: string;
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
  miswagId?: string;
  shadeCount?: number;
  shadeName?: string;
  price?: string;
  category?: string;
  matchType?: string;
};

export function catalogOptionKey(opt: Pick<CatalogImportOption, "store" | "sourceId">) {
  return `${opt.store}:${opt.sourceId}`;
}

/** رقم مسواگ الداخلي — ليس باركود EAN */
export function isMiswagInternalId(value = "") {
  const d = String(value || "").replace(/\D/g, "");
  return /^17\d{8}$/.test(d) || /^\d{9,10}$/.test(d);
}

/** باركود EAN/UPC عالمي (8–14 رقم وليس رقم مسواگ) */
export function isEanBarcode(value = "") {
  const d = String(value || "").replace(/\D/g, "");
  return /^\d{8,14}$/.test(d) && !isMiswagInternalId(d);
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
    name: s.nameAr || s.nameEn || s.name || "",
    nameAr: s.nameAr || "",
    nameEn: s.nameEn || "",
    barcode: s.barcode || "",
    miswagId: s.miswagId || s.sku || "",
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

export type CatalogBrandRow = {
  key: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  logoUrl?: string;
  logoIsProductImage?: boolean;
  productCount?: number;
  stores?: string[];
};

/** براندات موحّدة من المتاجر الأربعة (بدون تكرار) */
export async function fetchCatalogBrands(force = false): Promise<{
  total: number;
  withLogo: number;
  brands: CatalogBrandRow[];
  updatedAt?: number;
}> {
  const q = force ? "?force=1" : "";
  return catalogFetch(`/api/catalog/brands${q}`, 180_000);
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
    softBlocked?: boolean;
    message?: string;
  }>(`/api/catalog/${encodeURIComponent(storeId)}/categories/${encodeURIComponent(categoryId)}/products?${params}`);
}

type StoreSearchStat = { id: string; count: number; error?: string };

/** مهلة لكل متجر — الريان/نجد/أمازون سريعون، مسواگ أبطأ في الباركود */
function storeSearchTimeoutMs(storeId: string, kind: "text" | "barcode" = "text") {
  // مسواگ: مهلة قصيرة — السيرفر يقطع عند 16ث حتى لا يعلّق الواجهة
  if (storeId === "miswag") return kind === "barcode" ? 22_000 : 15_000;
  if (storeId === "elryan") return kind === "barcode" ? 8_000 : 8_000;
  // أمازون: بحث ثنائي اللغة (ae+com) يحتاج مهلة أوسع قليلاً
  if (storeId === "amazon") return kind === "barcode" ? 30_000 : 18_000;
  return kind === "barcode" ? 12_000 : 10_000;
}

async function searchSingleStore(
  storeId: string,
  query: string,
  page: number,
  limit: number,
  categoryId: string,
  timeoutMs = storeSearchTimeoutMs(storeId, "text"),
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
  }>(`/api/catalog/${encodeURIComponent(storeId)}/search?${params}`, timeoutMs);
}

/** دمج نتائج المتاجر بالتناوب حتى تظهر كل المتاجر في أعلى القائمة */
function interleaveByStore(lists: CatalogListProduct[][]): CatalogListProduct[] {
  const merged: CatalogListProduct[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (list[i]) merged.push(list[i]);
    }
  }
  return merged;
}

export type ProgressiveSearchPartial = {
  products: CatalogListProduct[];
  stores: StoreSearchStat[];
  done: boolean;
  hasMore: boolean;
};

/**
 * بحث نصي — متجر واحد أو عدة متاجر بالتوازي.
 * مع onPartial تظهر نتائج المتجر السريع فوراً دون انتظار الأبطأ.
 */
export async function searchCatalogProducts(
  storeIds: string | string[],
  query: string,
  page = 1,
  limit = 30,
  categoryId = "",
  onPartial?: (partial: ProgressiveSearchPartial) => void,
) {
  const stores = (Array.isArray(storeIds) ? storeIds : [storeIds]).filter(Boolean);
  if (!stores.length) return { products: [], hasMore: false, total: 0, stores: [] as StoreSearchStat[] };

  if (stores.length === 1) {
    const data = await searchSingleStore(stores[0], query, page, limit, categoryId);
    const products = (data.products || []).map((p) => ({ ...p, store: p.store || stores[0] }));
    const result = {
      products,
      hasMore: data.hasMore,
      total: data.total,
      stores: [{ id: stores[0], count: products.length }] as StoreSearchStat[],
    };
    onPartial?.({ products, stores: result.stores, done: true, hasMore: result.hasMore });
    return result;
  }

  const perStoreLimit = Math.max(10, Math.ceil(limit / stores.length));
  const lists: CatalogListProduct[][] = stores.map(() => []);
  const stats: StoreSearchStat[] = stores.map((id) => ({ id, count: 0 }));
  let pending = stores.length;

  const emit = (done: boolean) => {
    const products = interleaveByStore(lists).slice(0, limit);
    onPartial?.({
      products,
      stores: stats.map((s) => ({ ...s })),
      done,
      hasMore: lists.some((l) => l.length >= perStoreLimit),
    });
  };

  await Promise.all(
    stores.map(async (id, i) => {
      try {
        const data = await searchSingleStore(id, query, page, perStoreLimit, "");
        const items = (data.products || []).map((p) => ({ ...p, store: p.store || id }));
        lists[i] = items;
        stats[i] = { id, count: items.length };
      } catch (err) {
        lists[i] = [];
        stats[i] = {
          id,
          count: 0,
          error: err instanceof Error ? err.message : "فشل البحث",
        };
      } finally {
        pending -= 1;
        emit(pending === 0);
      }
    }),
  );

  const products = interleaveByStore(lists).slice(0, limit);
  return {
    products,
    hasMore: lists.some((l) => l.length >= perStoreLimit),
    total: products.length,
    stores: stats,
  };
}

function mapBarcodeResult(r: Record<string, unknown>, storeId: string): CatalogImportOption {
  return {
    store: String(r.store || storeId),
    storeLabel: String(r.storeLabel || r.store || storeId),
    sourceId: String(r.sourceId || r.id || ""),
    nameAr: String(r.nameAr || r.name || ""),
    nameEn: String(r.nameEn || ""),
    brandAr: String(r.brandAr || r.manufacturer || ""),
    thumb: String(r.thumb || ""),
    miswagId: String(r.miswagId || ""),
    barcode: String(r.barcode || ""),
    shadeCount: Number(r.shadeCount || 0),
    shadeName: String(r.shadeName || ""),
    price: String(r.price || ""),
    category: String(r.category || ""),
    matchType: String(r.matchType || "barcode"),
  };
}

/**
 * بحث بالباركود — كل متجر عبر طلب مستقل بالتوازي.
 * مع onPartial تظهر نتائج نجد فوراً دون انتظار مسواگ.
 */
export async function searchCatalogByBarcode(
  barcode: string,
  storeIds: string | string[] = "miswag",
  onPartial?: (partial: {
    options: CatalogImportOption[];
    stores: StoreSearchStat[];
    done: boolean;
  }) => void,
) {
  const stores = (Array.isArray(storeIds) ? storeIds : [storeIds]).filter(Boolean);
  const q = encodeURIComponent(barcode.trim());

  const optionsByStore: CatalogImportOption[][] = stores.map(() => []);
  const stats: StoreSearchStat[] = stores.map((id) => ({ id, count: 0 }));
  let pending = stores.length;

  const rank = (o: CatalogImportOption) => {
    const t = o.matchType || "";
    if (t === "text" || t === "keyword") return 2;
    return 1;
  };

  const emit = (done: boolean) => {
    const options = optionsByStore.flat().sort((a, b) => rank(a) - rank(b));
    onPartial?.({ options, stores: stats.map((s) => ({ ...s })), done });
  };

  await Promise.all(
    stores.map(async (id, i) => {
      try {
        // مسار الاستيراد الموثوق أولاً — يعمل على كل نسخ catalog-hub
        const data = await catalogFetch<{ query: string; results: Array<Record<string, unknown>> }>(
          `/api/import/search?q=${q}&store=${encodeURIComponent(id)}&stores=${encodeURIComponent(id)}`,
          storeSearchTimeoutMs(id, "barcode"),
        );
        const mapped = (data.results || []).map((r) => mapBarcodeResult(r, id));
        optionsByStore[i] = mapped;
        stats[i] = { id, count: mapped.length };
      } catch (err) {
        optionsByStore[i] = [];
        stats[i] = {
          id,
          count: 0,
          error: err instanceof Error ? err.message : "فشل البحث",
        };
      } finally {
        pending -= 1;
        emit(pending === 0);
      }
    }),
  );

  const options = optionsByStore.flat().sort((a, b) => rank(a) - rank(b));
  return { barcode: barcode.trim(), options, stores: stats };
}

export async function fetchCatalogProduct(storeId: string, sourceId: string, storeLabel = "") {
  // أمازون: إثراء باركود/لون كل التدرجات يحتاج وقتاً أطول
  const timeout = storeId === "amazon" ? 120_000 : 120_000;
  const data = await catalogFetch<{ product: Record<string, unknown> }>(
    `/api/import/${encodeURIComponent(storeId)}/products/${encodeURIComponent(sourceId)}`,
    timeout,
  );
  return mapImportProduct(data.product, storeLabel);
}

/**
 * أمازون: اجلب light أولاً (قائمة التدرجات سريعاً) ثم full (باركودات).
 * إن فشل full نُبقي light بدل درجة واحدة فارغة.
 */
export async function fetchCatalogProductSmart(
  storeId: string,
  sourceId: string,
  storeLabel = "",
  onPartial?: (product: CatalogImportProduct) => void,
) {
  if (storeId !== "amazon") {
    return fetchCatalogProduct(storeId, sourceId, storeLabel);
  }

  let lightProduct: CatalogImportProduct | null = null;
  try {
    const light = await catalogFetch<{ product: Record<string, unknown> }>(
      `/api/catalog/${encodeURIComponent(storeId)}/products/${encodeURIComponent(sourceId)}?light=1`,
      35_000,
    );
    lightProduct = mapImportProduct(light.product || {}, storeLabel);
    if (lightProduct.shades?.length) onPartial?.(lightProduct);
  } catch {
    lightProduct = null;
  }

  try {
    const full = await fetchCatalogProduct(storeId, sourceId, storeLabel);
    // إن أعاد full تدرجات أقل من light — ادمج
    if (lightProduct && (lightProduct.shades?.length || 0) > (full.shades?.length || 0)) {
      const bySku = new Map(full.shades.map((s) => [s.sku || s.miswagId || s.nameEn || s.nameAr, s]));
      const mergedShades = lightProduct.shades.map((s) => {
        const key = s.sku || s.miswagId || s.nameEn || s.nameAr;
        const enriched = bySku.get(key);
        return enriched
          ? {
              ...s,
              ...enriched,
              nameAr: s.nameAr || enriched.nameAr,
              nameEn: s.nameEn || enriched.nameEn,
              imageUrl: enriched.imageUrl || s.imageUrl,
              swatchUrl: enriched.swatchUrl || s.swatchUrl,
              barcode: enriched.barcode || s.barcode,
              colorHex: enriched.colorHex || s.colorHex,
            }
          : s;
      });
      return {
        ...full,
        descriptionAr: full.descriptionAr || lightProduct.descriptionAr,
        descriptionEn: full.descriptionEn || lightProduct.descriptionEn,
        shades: mergedShades,
        hasShades: mergedShades.length > 1,
      };
    }
    return full;
  } catch (err) {
    if (lightProduct) return lightProduct;
    throw err;
  }
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

/** حالة فهرس Amazon Beauty المحلي (الزحف الخلفي) */
export async function fetchAmazonCrawlStatus() {
  return catalogFetch<{
    store: string;
    productCount: number;
    status: string;
    running?: boolean;
    message?: string;
    progress?: { done?: number; total?: number; added?: number };
  }>("/api/catalog/amazon/crawl", 8_000);
}
