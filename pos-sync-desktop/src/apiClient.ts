import axios, { AxiosInstance, isAxiosError } from "axios";
import { SyncItem } from "./pricing";

export type ApiConfig = {
  baseUrl: string;
};

export function createApiClient(config: ApiConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl.replace(/\/$/, ""),
    timeout: 300_000,
    headers: { "Content-Type": "application/json" },
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
): Promise<{ synced: number; failed?: number; items: Array<{ barcode: string; error?: string }> }> {
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

export async function pushBulkWithRetry(
  client: AxiosInstance,
  items: SyncItem[],
  retries = 3,
): Promise<{ synced: number; failed?: number }> {
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
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
}
