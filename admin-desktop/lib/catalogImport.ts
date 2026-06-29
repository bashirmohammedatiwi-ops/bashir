import { CATALOG_HUB_URL, CATALOG_HUB_ORIGIN } from "./config";

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
  shadeCount?: number;
  imageCount?: number;
  categoryHint?: string | string[];
  categoryHintEn?: string | string[];
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
  categoryHint?: string | string[];
  categoryHintEn?: string | string[];
};

const CATALOG_STORES = ["niceone", "elryan", "vanilla", "miraaya", "faces"] as const;

const CLIENT_SEARCH_CACHE_MS = 5 * 60 * 1000;
const clientSearchCache = new Map<
  string,
  { at: number; data: { barcode: string; options: CatalogImportOption[]; byStore: Record<string, number> } }
>();

function catalogApiErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.reason === "string" && o.reason.trim()) return o.reason.trim();
  }
  return fallback;
}

async function catalogFetch<T>(path: string): Promise<T> {
  const url = `${CATALOG_HUB_URL}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      catalogApiErrorMessage(json?.error, res.statusText || "فشل الاتصال بكتالوج المتاجر"),
    );
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
 * بحث متدرّج: فهرس محلي فوري ثم تحديث المتاجر في الخلفية.
 */
export async function searchCatalogByBarcodeProgressive(
  barcode: string,
  onPartial?: (options: CatalogImportOption[]) => void,
) {
  const digits = barcode.replace(/\D/g, "");
  const cached = clientSearchCache.get(digits);
  if (cached && Date.now() - cached.at < CLIENT_SEARCH_CACHE_MS) {
    onPartial?.(cached.data.options);
    return cached.data;
  }

  const collected: CatalogImportOption[][] = [];

  const push = (options: CatalogImportOption[]) => {
    if (!options.length) return;
    collected.push(options);
    onPartial?.(mergeCatalogOptions(collected));
  };

  const buildResult = () => {
    const options = mergeCatalogOptions(collected);
    return {
      barcode: digits,
      options,
      byStore: Object.fromEntries(
        CATALOG_STORES.map((store) => [store, options.filter((o) => o.store === store).length]),
      ),
    };
  };

  try {
    const fastData = await searchCatalogByBarcode(barcode, { fast: true });
    push(fastData.options || []);
  } catch {
    /* local index optional */
  }

  const refreshStores = () =>
    Promise.allSettled(
      CATALOG_STORES.map(async (store) => {
        try {
          const data = await searchCatalogByBarcode(barcode, { store });
          push(data.options || []);
        } catch {
          /* store timeout — continue */
        }
      }),
    );

  const initial = buildResult();
  if (initial.options.length) {
    clientSearchCache.set(digits, { at: Date.now(), data: initial });
    void refreshStores().then(() => {
      const updated = buildResult();
      if (updated.options.length) {
        clientSearchCache.set(digits, { at: Date.now(), data: updated });
        onPartial?.(updated.options);
      }
    });
    return initial;
  }

  await refreshStores();
  const final = buildResult();
  if (final.options.length) {
    clientSearchCache.set(digits, { at: Date.now(), data: final });
  }
  return final;
}

export async function fetchCatalogProduct(store: string, sourceId: string, barcode = "") {
  const params = new URLSearchParams({
    store,
    id: sourceId,
    hubOrigin: CATALOG_HUB_ORIGIN,
  });
  if (barcode) params.set("barcode", barcode);
  const data = await catalogFetch<{ product: CatalogImportProduct }>(
    `/api/import/product?${params}`,
  );
  return data.product;
}

export async function fetchCatalogSummary(store: string, sourceId: string, barcode = "") {
  const params = new URLSearchParams({
    store,
    id: sourceId,
    hubOrigin: CATALOG_HUB_ORIGIN,
  });
  if (barcode) params.set("barcode", barcode);
  try {
    const data = await catalogFetch<{ summary: CatalogImportSummary }>(
      `/api/import/summary?${params}`,
    );
    return data.summary;
  } catch {
    return null;
  }
}

/** جلب ملخصات متوازية مع حد أقصى للتزامن */
export async function fetchCatalogSummariesBatch(
  items: Pick<CatalogImportOption, "store" | "sourceId" | "barcode">[],
  onItem?: (key: string, summary: CatalogImportSummary | null) => void,
  concurrency = 4,
) {
  const unique = new Map<string, Pick<CatalogImportOption, "store" | "sourceId" | "barcode">>();
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
        const summary = await fetchCatalogSummary(item.store, item.sourceId, item.barcode || "");
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
