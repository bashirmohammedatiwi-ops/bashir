import axios, { AxiosInstance, isAxiosError } from "axios";
import { SyncItem } from "./pricing";

export type ApiConfig = {
  baseUrl: string;
};

export function createApiClient(config: ApiConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl.replace(/\/$/, ""),
    timeout: 300_000,
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
  const { data } = await client.post("/sync/inventory/bulk", { items });
  const payload = data?.data ?? data;
  return payload;
}

export async function pingApi(client: AxiosInstance): Promise<boolean> {
  try {
    await client.get("/health", { baseURL: client.defaults.baseURL?.replace("/api/v1", "") });
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export type BulkSyncResult = {
  synced: number;
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

export type BatchUploadProgress = (done: number, total: number) => void;

export type BatchUploadResult = {
  synced: number;
  failed: number;
  pushed: SyncItem[];
  failedItems: SyncItem[];
  lastError?: string;
};

function collectFailedItems(batch: SyncItem[], result: BulkSyncResult): SyncItem[] {
  const failedBarcodes = new Set(
    (result.items ?? [])
      .filter((item) => item.error)
      .map((item) => String(item.barcode ?? "").trim())
      .filter(Boolean),
  );

  if (failedBarcodes.size === 0) return [];
  return batch.filter((item) => failedBarcodes.has(item.barcode.trim()));
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
        synced += result.synced ?? batch.length;
        failed += result.failed ?? 0;

        const batchFailed = collectFailedItems(batch, result);
        if (batchFailed.length > 0) {
          failedItems.push(...batchFailed);
          pushed.push(...batch.filter((item) => !batchFailed.some((f) => f.barcode === item.barcode)));
        } else {
          pushed.push(...batch);
        }
      } catch (err) {
        failed += batch.length;
        failedItems.push(...batch);
        lastError = formatApiError(err);
      } finally {
        completed += 1;
        onProgress?.(completed, total);
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));

  return { synced, failed, pushed, failedItems, lastError };
}

export async function retryFailedItems(
  client: AxiosInstance,
  items: SyncItem[],
  batchSize = 50,
): Promise<BatchUploadResult> {
  if (!items.length) {
    return { synced: 0, failed: 0, pushed: [], failedItems: [] };
  }

  const batches = chunkItems(items, batchSize);
  return pushBatchesParallel(client, batches, 1);
}
