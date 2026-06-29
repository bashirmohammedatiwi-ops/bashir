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
  swatchUrl?: string;
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

const CATALOG_STORES = ["niceone", "elryan", "vanilla", "miraaya", "faces", "amazon", "miswag", "orisdi"] as const;

function isLikelyAmazonBundle(opt: CatalogImportOption) {
  const t = `${opt.nameAr || ""} ${opt.nameEn || ""}`.toLowerCase();
  return /\b(pack of|عبوة|قطعتين|قطعة\s*2|2\s*قطع|bundle|مجموعة)\b/i.test(t);
}

function filterCatalogOptions(options: CatalogImportOption[]) {
  return options.filter((o) => !(o.store === "amazon" && isLikelyAmazonBundle(o)));
}

const CLIENT_SEARCH_CACHE_MS = 5 * 60 * 1000;
const clientSearchCache = new Map<
  string,
  { at: number; data: CatalogSearchCacheEntry }
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

async function catalogFetch<T>(path: string, timeoutMs = 45_000): Promise<T> {
  const url = `${CATALOG_HUB_URL}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(
        catalogApiErrorMessage(json?.error, res.statusText || "فشل الاتصال بكتالوج المتاجر"),
      );
    }
    return json as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("انتهت مهلة البحث — جرّب مرة أخرى");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

type CatalogSearchResponse = {
  barcode: string;
  options: CatalogImportOption[];
  errors?: { store: string; message: string }[];
  byStore?: Record<string, number>;
  fast?: boolean;
};

type CatalogSearchCacheEntry = {
  barcode: string;
  options: CatalogImportOption[];
  byStore: Record<string, number>;
};

function normalizeSearchResult(result: CatalogSearchResponse): CatalogSearchCacheEntry {
  return {
    barcode: result.barcode,
    options: result.options,
    byStore: result.byStore ?? {},
  };
}

export type CatalogStoreSearchStatus = {
  store: string;
  status: "pending" | "searching" | "done" | "error";
  label?: string;
  count?: number;
  message?: string;
  fromIndex?: boolean;
};

export type CatalogSearchStreamEvent =
  | { type: "start"; barcode: string; cached?: boolean }
  | { type: "store-status"; store: string; status: CatalogStoreSearchStatus["status"]; label?: string; count?: number; message?: string; fromIndex?: boolean }
  | { type: "results"; barcode: string; options: CatalogImportOption[]; byStore?: Record<string, number>; source?: string }
  | { type: "error"; error: string }
  | { type: "done"; barcode: string; options: CatalogImportOption[]; byStore?: Record<string, number>; errors?: { store: string; message: string }[] };

async function consumeSseStream(
  url: string,
  onEvent: (event: CatalogSearchStreamEvent) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(url, {
    headers: { Accept: "text/event-stream" },
    signal,
  });
  if (!res.ok) {
    let message = res.statusText || "فشل الاتصال بكتالوج المتاجر";
    try {
      const json = await res.json();
      message = catalogApiErrorMessage(json?.error, message);
    } catch {
      /* SSE error body */
    }
    throw new Error(message);
  }
  if (!res.body) throw new Error("لا يوجد تدفّق من الخادم");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  const flush = () => {
    if (!dataLines.length) {
      eventName = "message";
      return;
    }
    const raw = dataLines.join("\n");
    dataLines = [];
    const name = eventName;
    eventName = "message";
    if (!raw || raw.startsWith(":")) return;
    try {
      const payload = JSON.parse(raw) as Record<string, unknown>;
      onEvent({ type: name, ...payload } as CatalogSearchStreamEvent);
    } catch {
      /* ignore malformed chunk */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        flush();
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      } else if (line.trim() === "") {
        flush();
      }
    }
  }
  flush();
}

export async function searchCatalogByBarcodeStream(
  barcode: string,
  onEvent?: (event: CatalogSearchStreamEvent) => void,
  signal?: AbortSignal,
): Promise<CatalogSearchResponse> {
  const digits = barcode.replace(/\D/g, "");
  const cached = clientSearchCache.get(digits);
  if (cached && Date.now() - cached.at < CLIENT_SEARCH_CACHE_MS) {
    onEvent?.({ type: "start", barcode: digits, cached: true });
    onEvent?.({ type: "results", barcode: digits, options: cached.data.options, byStore: cached.data.byStore, source: "cache" });
    onEvent?.({ type: "done", barcode: digits, options: cached.data.options, byStore: cached.data.byStore });
    return cached.data;
  }

  const q = encodeURIComponent(digits);
  let finalResult: CatalogSearchResponse = { barcode: digits, options: [], byStore: {} };

  await consumeSseStream(
    `${CATALOG_HUB_URL}/api/import/search/stream?q=${q}`,
    (event) => {
      onEvent?.(event);
      if (event.type === "results") {
        finalResult = {
          barcode: event.barcode || digits,
          options: filterCatalogOptions(event.options || []),
          byStore: event.byStore ?? {},
        };
      }
      if (event.type === "done") {
        finalResult = {
          barcode: event.barcode || digits,
          options: filterCatalogOptions(event.options || []),
          byStore: event.byStore ?? {},
          errors: event.errors,
        };
      }
    },
    signal,
  );

  if (finalResult.options.length) {
    clientSearchCache.set(digits, { at: Date.now(), data: normalizeSearchResult(finalResult) });
  }
  return finalResult;
}

export async function searchCatalogByBarcode(
  barcode: string,
  options: { fast?: boolean; store?: string; hints?: CatalogImportOption[] } = {},
) {
  const q = encodeURIComponent(barcode.trim());
  const params = new URLSearchParams({ q });
  if (options.fast) params.set("fast", "1");
  if (options.store) params.set("store", options.store);
  if (options.hints?.length) {
    const hints = options.hints.map((h) => ({
      name: h.nameAr,
      nameEn: h.nameEn,
      manufacturer: h.brandAr,
      manufacturerEn: h.brandEn,
      brand: h.brandAr,
    }));
    params.set("hints", encodeURIComponent(JSON.stringify(hints)));
  }
  const timeoutMs = options.fast ? 8_000 : 50_000;
  return catalogFetch<CatalogSearchResponse>(`/api/import/search?${params}`, timeoutMs);
}

/**
 * بحث متدفّق — كل متجر يرسل نتائجه فوراً عبر SSE.
 */
export async function searchCatalogByBarcodeProgressive(
  barcode: string,
  onPartial?: (options: CatalogImportOption[]) => void,
  onEvent?: (event: CatalogSearchStreamEvent) => void,
  signal?: AbortSignal,
) {
  return searchCatalogByBarcodeStream(
    barcode,
    (event) => {
      onEvent?.(event);
      if (event.type === "results" && event.options?.length) {
        onPartial?.(filterCatalogOptions(event.options));
      }
      if (event.type === "done" && event.options?.length) {
        onPartial?.(filterCatalogOptions(event.options));
      }
    },
    signal,
  );
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
