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

export type CatalogImportSummary = {
  imageCount: number;
  shadeCount: number;
  hasShades: boolean;
  categoryHint: string;
  categoryHintEn: string;
  thumb: string;
  priceHint: string;
  brandAr: string;
  brandEn: string;
  nameAr: string;
  nameEn: string;
};

export function catalogOptionKey(opt: Pick<CatalogImportOption, "store" | "sourceId">) {
  return `${opt.store}:${opt.sourceId}`;
}

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

const CATALOG_STORES = ["niceone", "elryan", "vanilla", "miraaya", "faces"] as const;

async function catalogFetch<T>(path: string): Promise<T> {
  const url = `${CATALOG_HUB_URL}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || res.statusText || "فشل الاتصال بكتالوج المتاجر");
  }
  return json as T;
}

type CatalogSearchResponse = {
  barcode: string;
  options: CatalogImportOption[];
  errors?: { store: string; message: string }[];
  byStore?: Record<string, number>;
  fast?: boolean;
};

export async function searchCatalogByBarcode(
  barcode: string,
  options: { fast?: boolean; store?: string } = {},
) {
  const q = encodeURIComponent(barcode.trim());
  const params = new URLSearchParams({ q });
  if (options.fast) params.set("fast", "1");
  if (options.store) params.set("store", options.store);
  return catalogFetch<CatalogSearchResponse>(`/api/import/search?${params}`);
}

function mergeCatalogOptions(lists: CatalogImportOption[][]): CatalogImportOption[] {
  const seen = new Set<string>();
  const out: CatalogImportOption[] = [];
  for (const list of lists) {
    for (const opt of list) {
      const key = `${opt.store}:${opt.sourceId}:${opt.shadeName || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(opt);
    }
  }
  return out;
}

/**
 * بحث متدرّج: فهرس محلي فوري ثم كل متجر على حدة — تظهر النتائج بمجرد وصولها.
 */
export async function searchCatalogByBarcodeProgressive(
  barcode: string,
  onPartial?: (options: CatalogImportOption[]) => void,
) {
  const collected: CatalogImportOption[][] = [];

  const push = (options: CatalogImportOption[]) => {
    if (!options.length) return;
    collected.push(options);
    onPartial?.(mergeCatalogOptions(collected));
  };

  try {
    const fastData = await searchCatalogByBarcode(barcode, { fast: true });
    push(fastData.options || []);
  } catch {
    /* local index optional */
  }

  await Promise.all(
    CATALOG_STORES.map(async (store) => {
      try {
        const data = await searchCatalogByBarcode(barcode, { store });
        push(data.options || []);
      } catch {
        /* store timeout — continue */
      }
    }),
  );

  const options = mergeCatalogOptions(collected);
  return {
    barcode: barcode.replace(/\D/g, ""),
    options,
    byStore: Object.fromEntries(
      CATALOG_STORES.map((store) => [
        store,
        options.filter((o) => o.store === store).length,
      ]),
    ),
  };
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

export async function fetchCatalogSummary(store: string, sourceId: string) {
  const params = new URLSearchParams({
    store,
    id: sourceId,
    hubOrigin: CATALOG_HUB_URL,
  });
  const data = await catalogFetch<{ summary: CatalogImportSummary }>(
    `/api/import/summary?${params}`,
  );
  return data.summary;
}

/** جلب ملخصات متوازية مع حد أقصى للتزامن */
export async function fetchCatalogSummariesBatch(
  items: Pick<CatalogImportOption, "store" | "sourceId">[],
  onItem?: (key: string, summary: CatalogImportSummary | null) => void,
  concurrency = 4,
) {
  const unique = new Map<string, Pick<CatalogImportOption, "store" | "sourceId">>();
  for (const item of items) {
    const key = catalogOptionKey(item);
    if (!unique.has(key)) unique.set(key, item);
  }
  const queue = [...unique.values()];
  const results = new Map<string, CatalogImportSummary | null>();

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      const key = catalogOptionKey(item);
      try {
        const summary = await fetchCatalogSummary(item.store, item.sourceId);
        results.set(key, summary);
        onItem?.(key, summary);
      } catch {
        results.set(key, null);
        onItem?.(key, null);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker()));
  return results;
}
