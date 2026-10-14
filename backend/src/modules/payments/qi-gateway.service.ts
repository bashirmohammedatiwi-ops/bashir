import { Injectable, Logger } from "@nestjs/common";
import { createVerify, randomUUID } from "crypto";
import { existsSync, readFileSync } from "fs";

/** كائن الدفعة كما تعيده بوابة كي كارد. */
export interface QiPayment {
  requestId: string;
  paymentId: string;
  status: string;
  canceled?: boolean;
  amount?: number;
  confirmedAmount?: number;
  currency?: string;
  paymentType?: string;
  creationDate?: string;
  formUrl?: string;
  details?: {
    resultCode?: string;
    resultDescription?: string;
    rrn?: string;
    authId?: string;
    maskedPan?: string;
    paymentSystem?: string;
  };
  [key: string]: unknown;
}

export class QiGatewayError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly httpStatus?: number,
  ) {
    super(message);
  }
}

/**
 * عميل REST لبوابة كي كارد (QiCard Payment Gateway).
 *
 * بيانات الدخول (Basic Auth) لا تغادر السيرفر أبداً — التطبيق يستلم فقط
 * رقم الطرفية والمفتاح العام اللازمين لواجهة الدفع الأصلية (SDK).
 *
 * المتغيرات:
 * - QI_BASE_URL       مثل https://uat-sandbox-3ds-api.qi.iq/api/v1
 * - QI_TERMINAL_ID
 * - QI_USERNAME / QI_PASSWORD
 * - QI_PUBLIC_KEY (PEM) أو QI_PUBLIC_KEY_PATH (الافتراضي /run/secrets/qi_pubkey.pem)
 * - QI_CALLBACK_BASE_URL  أصل الموقع العام لروابط الإشعار والإنهاء
 */
@Injectable()
export class QiGatewayService {
  private readonly log = new Logger("QiGateway");
  private cachedKey: string | null | undefined;

  get baseUrl() {
    return (process.env.QI_BASE_URL ?? "").trim().replace(/\/+$/, "");
  }

  get terminalId() {
    return (process.env.QI_TERMINAL_ID ?? "").trim();
  }

  get callbackBase() {
    return (process.env.QI_CALLBACK_BASE_URL ?? "").trim().replace(/\/+$/, "");
  }

  get isSandbox() {
    return this.baseUrl.includes("sandbox");
  }

  get isConfigured() {
    return Boolean(
      this.baseUrl &&
        this.terminalId &&
        process.env.QI_USERNAME &&
        process.env.QI_PASSWORD &&
        this.callbackBase &&
        this.publicKeyPem,
    );
  }

  /** مفتاح البوابة العام بصيغة PEM (للتحقق من الإشعارات ولتشفير واجهة الدفع). */
  get publicKeyPem(): string | null {
    if (this.cachedKey !== undefined) return this.cachedKey;
    let pem = (process.env.QI_PUBLIC_KEY ?? "").replace(/\\n/g, "\n").trim();
    if (!pem) {
      const path = process.env.QI_PUBLIC_KEY_PATH || "/run/secrets/qi_pubkey.pem";
      if (existsSync(path)) pem = readFileSync(path, "utf8").trim();
    }
    this.cachedKey = pem || null;
    return this.cachedKey;
  }

  /** جسم المفتاح فقط (بلا ترويسة PEM) — الصيغة التي تتوقعها حزمة الهاتف. */
  get publicKeyBody(): string | null {
    const pem = this.publicKeyPem;
    if (!pem) return null;
    return pem
      .replace(/-----BEGIN [^-]+-----/g, "")
      .replace(/-----END [^-]+-----/g, "")
      .replace(/\s+/g, "");
  }

  /**
   * في بيئة الاختبار لا يرى الدفع بالبطاقة إلا الإدارة ومن في QI_SANDBOX_TESTERS
   * (بريد أو هاتف، مفصولة بفواصل) — حتى لا "تدفع" زبونة حقيقية ببطاقة تجريبية.
   */
  allowsUser(user?: { role?: string | null; email?: string | null; phone?: string | null } | null) {
    if (!this.isSandbox) return true;
    if (!user) return false;
    if (user.role && ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(user.role)) return true;
    const testers = (process.env.QI_SANDBOX_TESTERS ?? "")
      .split(",")
      .map((x) => x.trim().toLowerCase().replace(/[\s-]/g, ""))
      .filter(Boolean);
    const ids = [user.email, user.phone]
      .filter(Boolean)
      .map((x) => String(x).trim().toLowerCase().replace(/[\s-]/g, ""));
    return ids.some((id) => testers.includes(id) || testers.some((t) => t.endsWith(id.slice(-10)) && id.length >= 10));
  }

  get notificationUrl() {
    return `${this.callbackBase}/api/v1/payments/qi/webhook`;
  }

  get finishUrl() {
    return `${this.callbackBase}/api/v1/payments/qi/finish`;
  }

  newRequestId() {
    return randomUUID();
  }

  createPayment(input: {
    requestId: string;
    amount: number;
    locale?: string;
    customer?: { firstName?: string; phone?: string; email?: string; accountId?: string; city?: string; address?: string };
    additionalInfo?: Record<string, string>;
  }) {
    return this.request<QiPayment>("POST", "/payment", {
      requestId: input.requestId,
      amount: input.amount,
      currency: "IQD",
      locale: input.locale ?? "ar_IQ",
      finishPaymentUrl: this.finishUrl,
      notificationUrl: this.notificationUrl,
      appChannel: true,
      ...(input.customer ? { customerInfo: stripEmpty(input.customer) } : {}),
      ...(input.additionalInfo ? { additionalInfo: input.additionalInfo } : {}),
    });
  }

  getStatus(paymentId: string) {
    return this.request<QiPayment>("GET", `/payment/${encodeURIComponent(paymentId)}/status`);
  }

  refund(paymentId: string, requestId: string, amount: number, message?: string) {
    return this.request<QiPayment & { refundId?: string }>(
      "POST",
      `/payment/${encodeURIComponent(paymentId)}/refund`,
      { requestId, amount, ...(message ? { message } : {}) },
    );
  }

  cancel(paymentId: string, requestId: string) {
    return this.request<QiPayment>("POST", `/payment/${encodeURIComponent(paymentId)}/cancel`, {
      requestId,
    });
  }

  /**
   * يتحقق من توقيع X-Signature لإشعار البوابة:
   * paymentId|amount(3 منازل)|currency|creationDate|status — RSA-SHA256.
   */
  verifyWebhookSignature(payload: Record<string, unknown>, signature?: string | null) {
    const pem = this.publicKeyPem;
    if (!pem || !signature) return false;
    const amount = payload.amount;
    const fields = [
      (payload.paymentId as string) || "-",
      amount != null && amount !== "" ? Number(amount).toFixed(3) : "-",
      (payload.currency as string) || "-",
      (payload.creationDate as string) || "-",
      (payload.status as string) || "-",
    ];
    try {
      const verifier = createVerify("sha256");
      verifier.update(fields.join("|"));
      verifier.end();
      return verifier.verify(pem, Buffer.from(signature.replace(/\s+/g, ""), "base64"));
    } catch (e) {
      this.log.warn(`Signature verification error: ${(e as Error).message}`);
      return false;
    }
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    if (!this.isConfigured) {
      throw new QiGatewayError("Qi payment gateway is not configured");
    }
    const auth = Buffer.from(`${process.env.QI_USERNAME}:${process.env.QI_PASSWORD}`).toString(
      "base64",
    );
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          "X-Terminal-Id": this.terminalId,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok || json?.error) {
        const err = json?.error ?? {};
        this.log.warn(`${method} ${path} → ${res.status} ${err.code ?? ""} ${err.description ?? text.slice(0, 200)}`);
        throw new QiGatewayError(
          err.description || `Gateway HTTP ${res.status}`,
          typeof err.code === "number" ? err.code : undefined,
          res.status,
        );
      }
      return json as T;
    } catch (e) {
      if (e instanceof QiGatewayError) throw e;
      const msg = (e as Error).name === "AbortError" ? "Gateway timeout" : (e as Error).message;
      this.log.warn(`${method} ${path} failed: ${msg}`);
      throw new QiGatewayError(msg);
    } finally {
      clearTimeout(timer);
    }
  }
}

function stripEmpty<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null && String(v).trim() !== ""),
  ) as Partial<T>;
}
