import axios, { AxiosInstance, isAxiosError } from "axios";
import { SyncItem } from "./pricing";

export type ApiConfig = {
  baseUrl: string;
};

const VPS_IP = "187.127.88.146";
const PRODUCTION_DOMAIN = "deemaalhayat.com";

/** السيرفر يفرض HTTPS + شهادة SSL للدومين فقط (ليس للـ IP) */
export function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host === VPS_IP) {
      parsed.hostname = PRODUCTION_DOMAIN;
      parsed.protocol = "https:";
      return parsed.toString().replace(/\/$/, "");
    }

    if (
      parsed.protocol === "http:" &&
      (host === PRODUCTION_DOMAIN || host.endsWith(`.${PRODUCTION_DOMAIN}`))
    ) {
      parsed.protocol = "https:";
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    /* keep as-is */
  }

  return trimmed;
}

export function createApiClient(config: ApiConfig): AxiosInstance {
  const baseURL = normalizeApiBaseUrl(config.baseUrl);
  return axios.create({
    baseURL,
    timeout: 600_000,
    maxRedirects: 0,
    headers: {
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
}

export function formatApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const body = err.response?.data as { error?: { message?: string }; message?: string } | undefined;
    const msg = body?.error?.message ?? body?.message ?? err.message;
    return status ? `HTTP ${status}: ${msg}` : msg;
  }
  return err instanceof Error ? err.message : String(err);
}

export async function pushBulk(
  client: AxiosInstance,
  items: SyncItem[],
): Promise<BulkSyncResult> {
  const { data, status } = await client.post("/sync/inventory/bulk", { items });
  if (status >= 300) {
    throw new Error(`HTTP ${status}: unexpected redirect — استخدم https:// في عنوان API`);
  }
  const payload = (data?.data ?? data) as BulkSyncResult | undefined;
  if (!payload || typeof payload !== "object") {
    throw new Error("استجابة غير صالحة من السيرفر — تحقق من عنوان API (https://)");
  }
  return payload;
}

export async function pingApi(client: AxiosInstance): Promise<boolean> {
  try {
    await client.get("/health");
    return true;
  } catch {
    return false;
  }
}

export async function testBulkApi(client: AxiosInstance): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await pushBulk(client, [
      {
        barcode: "__POS_SYNC_PING__",
        productCode: "0",
        price: 1,
        originalPrice: 1,
        discountPercent: 0,
        stock: 0,
      },
    ]);
    if ((result.synced ?? 0) >= 1) return { ok: true };
    return { ok: false, error: "السيرفر لم يقبل دفعة الاختبار" };
  } catch (err) {
    return { ok: false, error: formatApiError(err) };
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export type BulkSyncResult = {
  synced?: number;
  failed?: number;
  items?: Array<{ barcode: string; error?: string }>;
};

export async function pushBulkWithRetry(
  client: AxiosInstance,
  items: SyncItem[],
  retries = 3,
): Promise<BulkSyncResult> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pushBulk(client, items);
    } catch (err) {
      lastError = err;
      const retryable =
        isAxiosError(err) &&
        (!err.response || err.response.status >= 500 || err.response.status === 429);
      if (!retryable || attempt === retries) break;
      await sleep(1000 * attempt);
    }
  }
  throw lastError;
}

export async function reportSyncRun(
  client: AxiosInstance,
  payload: {
    manual: boolean;
    ok: boolean;
    totalItems: number;
    changedItems: number;
    syncedItems: number;
    failedItems: number;
    skippedItems: number;
    durationMs: number;
    errorMessage?: string;
    sourceHost?: string;
  },
): Promise<void> {
  try {
    await client.post("/sync/inventory/runs", payload);
  } catch {
    /* non-blocking */
  }
}

export function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export type BatchUploadProgress = (done: number, total: number, syncedSoFar: number) => void;

export type BatchUploadResult = {
  synced: number;
  failed: number;
  pushed: SyncItem[];
  failedItems: SyncItem[];
  lastError?: string;
};

/** يعتمد فقط على error صريح في items — لا يُعيد كل الدفعة كفاشلة */
function splitBatchResult(
  batch: SyncItem[],
  result: BulkSyncResult,
): { succeeded: SyncItem[]; failed: SyncItem[] } {
  const failedBarcodes = new Set(
    (result.items ?? [])
      .filter((item) => item.error)
      .map((item) => String(item.barcode ?? "").trim())
      .filter(Boolean),
  );

  if (failedBarcodes.size === 0) {
    return { succeeded: batch, failed: [] };
  }

  const failed = batch.filter((item) => failedBarcodes.has(item.barcode.trim()));
  const failedSet = new Set(failed.map((item) => item.barcode.trim()));
  const succeeded = batch.filter((item) => !failedSet.has(item.barcode.trim()));
  return { succeeded, failed };
}

export async function pushBatchesParallel(
  client: AxiosInstance,
  batches: SyncItem[][],
  concurrency: number,
  onProgress?: BatchUploadProgress,
): Promise<BatchUploadResult> {
  let synced = 0;
  let failed = 0;
  const pushed: SyncItem[] = [];
  const failedItems: SyncItem[] = [];
  let lastError: string | undefined;
  let completed = 0;
  const total = batches.length;
  const workers = Math.max(1, Math.min(concurrency, batches.length));

  let cursor = 0;

  async function worker() {
    while (cursor < batches.length) {
      const index = cursor++;
      const batch = batches[index];
      try {
        const result = await pushBulkWithRetry(client, batch);
        const { succeeded, failed: batchFailed } = splitBatchResult(batch, result);
        synced += succeeded.length;
        failed += batchFailed.length;
        pushed.push(...succeeded);
        if (batchFailed.length > 0) {
          failedItems.push(...batchFailed);
        }
      } catch (err) {
        failed += batch.length;
        failedItems.push(...batch);
        lastError = formatApiError(err);
      } finally {
        completed += 1;
        onProgress?.(completed, total, synced);
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));

  return { synced, failed, pushed, failedItems, lastError };
}

export async function retryFailedItems(
  client: AxiosInstance,
  items: SyncItem[],
  batchSize = 500,
  concurrency = 4,
): Promise<BatchUploadResult> {
  if (!items.length) {
    return { synced: 0, failed: 0, pushed: [], failedItems: [] };
  }

  const batches = chunkItems(items, batchSize);
  return pushBatchesParallel(client, batches, concurrency);
}
