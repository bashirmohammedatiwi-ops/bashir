import { createHmac, timingSafeEqual } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

/** أقصى فرق مقبول بين ساعة سيرفر المحل وساعتنا */
export const FOT_MAX_SKEW_SEC = 300;

export type FotSignatureCheck = "ok" | "missing" | "stale" | "bad";

/** "sha256=" + hex(HMAC_SHA256(key, timestamp + "." + rawBody)) */
export function fotSignature(key: string, timestamp: string, rawBody: Buffer): string {
  const mac = createHmac("sha256", key).update(`${timestamp}.`).update(rawBody).digest("hex");
  return `sha256=${mac}`;
}

export function checkFotSignature(input: {
  key: string;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: Buffer | undefined;
  nowSec: number;
}): FotSignatureCheck {
  const { key, timestamp, signature, rawBody, nowSec } = input;
  if (!timestamp || !signature || !rawBody) return "missing";
  if (!/^\d{1,12}$/.test(timestamp)) return "bad";
  if (Math.abs(nowSec - Number(timestamp)) > FOT_MAX_SKEW_SEC) return "stale";

  const expected = Buffer.from(fotSignature(key, timestamp, rawBody));
  const given = Buffer.from(signature.trim().toLowerCase());
  if (given.length !== expected.length) return "bad";
  return timingSafeEqual(given, expected) ? "ok" : "bad";
}

/**
 * يقبل الطلب فقط إذا وقّعه سيرفر FOT في المحل بالمفتاح FOT_STORE_SYNC_KEY.
 * بلا مفتاح مضبوط يُرفض كل شيء: هذه المسارات تكتب أسعار المتجر ومخزونه.
 */
@Injectable()
export class FotSignatureGuard implements CanActivate {
  private readonly logger = new Logger(FotSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const key = process.env.FOT_STORE_SYNC_KEY?.trim();
    if (!key) {
      this.logger.error("FOT_STORE_SYNC_KEY is not set — rejecting POS sync request");
      throw new ServiceUnavailableException("POS sync is not configured");
    }

    const req = context.switchToHttp().getRequest();
    const header = (name: string) => {
      const value = req.headers?.[name];
      return Array.isArray(value) ? value[0] : value;
    };

    const result = checkFotSignature({
      key,
      timestamp: header("x-fot-timestamp"),
      signature: header("x-fot-signature"),
      rawBody: req.rawBody,
      nowSec: Math.floor(Date.now() / 1000),
    });
    if (result === "ok") return true;

    this.logger.warn(`POS sync rejected (${result}) from ${req.ip ?? "unknown"}`);
    throw new UnauthorizedException(
      result === "stale" ? "Signature timestamp out of range" : "Invalid POS sync signature",
    );
  }
}
