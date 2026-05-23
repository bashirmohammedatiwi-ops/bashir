import axios, { AxiosInstance } from "axios";
import { SyncItem } from "./pricing";

export type ApiConfig = {
  baseUrl: string;
};

export function createApiClient(config: ApiConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl.replace(/\/$/, ""),
    timeout: 120_000,
    headers: { "Content-Type": "application/json" },
  });
}

export async function pushBulk(
  client: AxiosInstance,
  items: SyncItem[],
): Promise<{ synced: number; items: Array<{ barcode: string; updatedProduct: boolean }> }> {
  const { data } = await client.post("/sync/inventory/bulk", { items });
  return data?.data ?? data;
}

export async function pingApi(client: AxiosInstance): Promise<boolean> {
  try {
    await client.get("/health", { baseURL: client.defaults.baseURL?.replace("/api/v1", "") });
    return true;
  } catch {
    return false;
  }
}
