import { CanActivate, ExecutionContext, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { checkFotSignature } from "../sync/fot-signature.guard";

/** مفتاح ربط كاشير الطلبات: منفصل عن مفتاح رفع المخزون لأنه يقرأ أسماء العملاء وهواتفهم. */
export function ordersLinkKey(): string | null {
  const env = process.env.FOT_ORDERS_LINK_KEY?.trim();
  if (env) return env;
  try {
    return readFileSync(process.env.FOT_ORDERS_LINK_KEY_PATH || "/run/secrets/fot_orders_link_key", "utf8").trim() || null;
  } catch {
    return null;
  }
}

/**
 * يقبل طلبات سيرفر المحل الموقّعة فقط: x-fot-timestamp + x-fot-signature =
 * "sha256=" + HMAC_SHA256(key, timestamp + "." + rawBody) — نفس صيغة رفع المخزون، بمفتاح آخر.
 */
@Injectable()
export class OrdersLinkGuard implements CanActivate {
  private readonly logger = new Logger(OrdersLinkGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const key = ordersLinkKey();
    if (!key) throw new ServiceUnavailableException("ربط كاشير الطلبات غير مضبوط على السيرفر");
    const req = context.switchToHttp().getRequest();
    const header = (name: string) => {
      const v = req.headers?.[name];
      return Array.isArray(v) ? v[0] : v;
    };
    const result = checkFotSignature({
      key,
      timestamp: header("x-fot-timestamp"),
      signature: header("x-fot-signature"),
      rawBody: req.rawBody ?? Buffer.from(""),
      nowSec: Math.floor(Date.now() / 1000),
    });
    if (result === "ok") return true;
    this.logger.warn(`orders link rejected (${result}) from ${req.ip ?? "unknown"}`);
    throw new UnauthorizedException(result === "stale" ? "Signature timestamp out of range" : "Invalid orders link signature");
  }
}
