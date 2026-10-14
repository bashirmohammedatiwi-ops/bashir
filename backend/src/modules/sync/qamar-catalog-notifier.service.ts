import { Injectable, Logger } from "@nestjs/common";

type CatalogEntity = "product" | "brand" | "category";
type CatalogAction = "created" | "updated";

@Injectable()
export class QamarCatalogNotifierService {
  private readonly logger = new Logger(QamarCatalogNotifierService.name);

  get enabled(): boolean {
    return Boolean(process.env.QAMAR_SYNC_WEBHOOK_URL?.trim());
  }

  notify(entity: CatalogEntity, action: CatalogAction, id: string) {
    if (!this.enabled || !id) return;
    void this.post({ entity, action, id }).catch((err) =>
      this.logger.warn(
        `Qamar sync notify ${entity}/${action}/${id}: ${err instanceof Error ? err.message : err}`,
      ),
    );
  }

  notifyProductsUpdated(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!this.enabled || !unique.length) return;
    void this.post({ entity: "product", action: "updated", ids: unique }).catch((err) =>
      this.logger.warn(
        `Qamar sync notify products batch (${unique.length}): ${err instanceof Error ? err.message : err}`,
      ),
    );
  }

  private async post(body: Record<string, unknown>) {
    const url = process.env.QAMAR_SYNC_WEBHOOK_URL!.trim();
    const secret = process.env.QAMAR_SYNC_WEBHOOK_SECRET?.trim();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(secret ? { "X-Alhayaa-Sync-Secret": secret } : {}),
      },
      body: JSON.stringify({ ...body, secret }),
      signal: AbortSignal.timeout(Number(process.env.QAMAR_SYNC_WEBHOOK_TIMEOUT_MS ?? 15_000)),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
  }
}
