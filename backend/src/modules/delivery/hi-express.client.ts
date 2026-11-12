import { Injectable, Logger } from "@nestjs/common";
import { readFileSync } from "node:fs";

const BASE = (process.env.HIEXPRESS_BASE_URL || "https://api-client.hi-express.co/api/v2").replace(/\/+$/, "");
const KEY_FILE = process.env.HIEXPRESS_API_KEY_PATH || "/run/secrets/hiexpress_api_key";
const TIMEOUT_MS = Number(process.env.HIEXPRESS_TIMEOUT_MS || 10_000);

/** خطأ من هاي إكسبريس أو من الشبكة — retryable = يُعاد تلقائياً (شبكة، مهلة، 5xx، 429). */
export class HiExpressError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
    readonly details?: unknown,
  ) {
    super(message);
  }
  /** «رقم مكرر»: الطلب موجود لديهم أصلاً. */
  get duplicate() {
    return this.status === 422 && /client[_ ]identifier|unique|taken|مكرر|مستخدم/i.test(`${this.message} ${JSON.stringify(this.details ?? "")}`);
  }
}

/** أول نص يشبه PDF بصيغة base64 («JVBERi0» = «%PDF-») في أي مكان من الرد — شكل الرد غير موثّق بدقة. */
export function findPdfBase64(node: unknown, depth = 0): string | null {
  if (depth > 6 || node == null) return null;
  if (typeof node === "string") {
    const s = node.replace(/^data:application\/pdf;base64,/i, "");
    return s.startsWith("JVBERi0") ? s : null;
  }
  if (Array.isArray(node)) {
    for (const x of node) {
      const hit = findPdfBase64(x, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node === "object") {
    for (const v of Object.values(node as Record<string, unknown>)) {
      const hit = findPdfBase64(v, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

export interface HiCreateOrder {
  client_identifier: string;
  customer_phone: string;
  customer_secondary_phone?: string | null;
  customer_name?: string | null;
  governance_id: number;
  city_id?: number | null;
  order_value: number;
  hidden_order_value?: number;
  delivery_address?: string | null;
  notes?: string | null;
  order_type_id?: number | null;
  client_name?: string | null;
  client_phone1?: string | null;
  items?: Array<{ name: string; count?: number; notes?: string | null }>;
}

export interface HiOrderStatusEntry {
  status_type: number;
  status_msg?: string | null;
  created_at?: string;
  proof_of_status?: string | null;
}

export interface HiOrder {
  id: number;
  order_identifier: string;
  client_identifier: string;
  order_value: number;
  delivery_amount: number;
  return_cost: number;
  shipping_cost: number;
  last_status_type_id: number;
  last_status_type?: string;
  last_status_date?: string;
  driver_name?: string | null;
  delivery_attempts?: number | null;
  settlement_id?: number | string | null;
  governance_id?: number;
  city_id?: number | null;
  status?: HiOrderStatusEntry[];
}

export interface HiLiveStatus {
  client_identifier: string;
  status_id: number;
  last_status_type?: string;
  last_status_time?: string;
  is_delivered?: boolean | number;
  is_cancelled?: boolean | number;
}

/**
 * عميل واجهة Hi-Express v2. التوكن من بيئة السيرفر (HIEXPRESS_API_KEY) أو ملف الأسرار
 * /run/secrets/hiexpress_api_key — لا يُطبع ولا يُسجَّل أبداً.
 */
@Injectable()
export class HiExpressClient {
  private readonly logger = new Logger(HiExpressClient.name);
  private cachedKey: string | null | undefined;

  private key(): string | null {
    if (this.cachedKey !== undefined) return this.cachedKey;
    let k = process.env.HIEXPRESS_API_KEY?.trim() || null;
    if (!k) {
      try {
        k = readFileSync(KEY_FILE, "utf8").trim() || null;
      } catch {
        k = null;
      }
    }
    this.cachedKey = k;
    return k;
  }

  get configured() {
    return !!this.key();
  }

  private async call<T>(method: string, path: string, body?: unknown, query?: Record<string, string | string[]>): Promise<T> {
    const key = this.key();
    if (!key) throw new HiExpressError("رمز هاي إكسبريس غير مضبوط على السيرفر", null, false);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) {
      if (Array.isArray(v)) v.forEach((x) => qs.append(`${k}[]`, x));
      else qs.append(k, v);
    }
    const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ""}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          "Hi-Express-Api-Key": key,
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      const msg = (e as Error).name === "TimeoutError" ? "انتهت مهلة الاتصال بهاي إكسبريس" : "تعذر الاتصال بهاي إكسبريس";
      throw new HiExpressError(msg, null, true);
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* ليست JSON */
    }
    if (!res.ok || json?.success === false) {
      const errors = json?.errors ?? json?.data?.errors;
      const msg = [json?.message, Array.isArray(errors) ? errors.join(" — ") : errors && typeof errors === "object" ? Object.values(errors).flat().join(" — ") : null]
        .filter((x) => x && x !== "errors")
        .join(": ") || `HTTP ${res.status}`;
      const retryable = res.status >= 500 || res.status === 429;
      if (res.status === 401) this.cachedKey = undefined; // يُقرأ من جديد إن غُيّر الملف
      throw new HiExpressError(msg, res.status, retryable, errors ?? json);
    }
    return json as T;
  }

  async authorize() {
    await this.call("POST", "/authorizer");
    return true;
  }

  async governances(): Promise<Array<{ id: number; name: string; shipping_cost?: number }>> {
    const r = await this.call<any>("GET", "/governance", undefined, { withoutCities: "1" });
    return r?.data?.content ?? [];
  }

  async cities(governanceId: number): Promise<Array<{ id: number; name: string }>> {
    const r = await this.call<any>("GET", `/governance/cities/${governanceId}`);
    const c = r?.data?.content;
    return Array.isArray(c) ? c : Array.isArray(c?.cities) ? c.cities : [];
  }

  async statuses(): Promise<Array<{ id: number; name: string; name_ar: string; key: string }>> {
    const r = await this.call<any>("GET", "/orders/statuses", undefined, { all: "1" });
    return r?.data?.content ?? [];
  }

  /** إنشاء طلب واحد: يرجع رقم التتبع. */
  async createOrder(order: HiCreateOrder): Promise<{ orderIdentifier: string }> {
    const r = await this.call<any>("POST", "/orders", { orders: [order] });
    const row = (r?.data?.content ?? []).find((x: any) => x.client_identifier === order.client_identifier) ?? r?.data?.content?.[0];
    if (!row?.order_identifier) throw new HiExpressError("لم ترجع هاي إكسبريس رقم تتبع", 200, true, r);
    return { orderIdentifier: String(row.order_identifier) };
  }

  async showOrder(alias: string): Promise<HiOrder> {
    const r = await this.call<any>("GET", `/orders/${encodeURIComponent(alias)}`);
    return r?.data?.content as HiOrder;
  }

  async updateOrder(clientIdentifier: string, body: Partial<HiCreateOrder>) {
    await this.call("PUT", `/orders/${encodeURIComponent(clientIdentifier)}`, body);
  }

  async deleteOrder(alias: string) {
    await this.call("DELETE", `/orders/${encodeURIComponent(alias)}`);
  }

  async liveStatuses(clientIdentifiers: string[]): Promise<HiLiveStatus[]> {
    if (!clientIdentifiers.length) return [];
    const r = await this.call<any>("GET", "/orders/live-statuses", undefined, { client_identifiers: clientIdentifiers });
    const c = r?.data?.content;
    return Array.isArray(c) ? c : [];
  }

  /** ملصق الشحنة كما تصممه هاي إكسبريس (PDF بصيغة base64). */
  async labelBase64(alias: string): Promise<string> {
    const r = await this.call<any>("GET", `/orders/${encodeURIComponent(alias)}/label`, undefined, { format: "base64" });
    const direct = r?.pdf_base64 ?? r?.data?.pdf_base64 ?? r?.data?.content?.pdf_base64 ?? r?.data?.content?.label ?? r?.data?.label;
    const found = typeof direct === "string" && direct ? direct : findPdfBase64(r);
    if (!found) throw new HiExpressError("لم ترجع هاي إكسبريس ملف الملصق", 200, true, Object.keys(r ?? {}));
    return found.replace(/^data:application\/pdf;base64,/i, "");
  }

  async prepareDispatch(clientIdentifiers: string[], note?: string) {
    return this.call<any>("POST", "/orders/prepare-dispatch", { client_identifiers: clientIdentifiers, note: note ?? null });
  }

  async failedDecision(alias: string, decision: "accept" | "reject", note?: string) {
    return this.call<any>("POST", `/orders/${encodeURIComponent(alias)}/failed-decision`, { decision, note: note ?? null });
  }

  async holdDecision(alias: string, decision: "approve" | "resend" | "return", note?: string) {
    return this.call<any>("POST", `/orders/${encodeURIComponent(alias)}/hold-decision`, { decision, note: note ?? null });
  }

  /** تسجيل رابط استقبال الحالات (نرسل الاسمين الشائعين للحقل لأن الوثائق لم تحدده). */
  async setWebhook(url: string) {
    return this.call<any>("POST", "/set-webhook", { webhook_url: url, url });
  }

  async testWebhook(clientIdentifier: string, statusId: number) {
    return this.call<any>("POST", "/dispatch-webhook", { payload: { client_identifier: clientIdentifier, status_id: statusId } });
  }

  async settlements(): Promise<any[]> {
    const r = await this.call<any>("GET", "/settlements");
    const c = r?.data?.content;
    return Array.isArray(c) ? c : [];
  }
}
