import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import * as fs from "fs";
import { rewriteMediaUrl } from "../../common/media-url.util";

export type PushPayload = {
  title: string;
  body: string;
  imageUrl?: string | null;
  data: Record<string, string>;
};

export type PushSendResult = {
  sent: number;
  failed: number;
  skipped: boolean;
  invalidTokens: string[];
  error?: string;
};

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private messaging: admin.messaging.Messaging | null = null;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.initFirebase();
  }

  isEnabled() {
    return this.enabled;
  }

  private initFirebase() {
    try {
      const rawJson = this.config.get<string>("FIREBASE_SERVICE_ACCOUNT_JSON");
      const path = this.config.get<string>("FIREBASE_SERVICE_ACCOUNT_PATH");
      let credentials: admin.ServiceAccount | null = null;

      if (rawJson?.trim()) {
        credentials = JSON.parse(rawJson) as admin.ServiceAccount;
      } else if (path?.trim() && fs.existsSync(path)) {
        credentials = JSON.parse(fs.readFileSync(path, "utf8")) as admin.ServiceAccount;
      }

      if (!credentials) {
        this.logger.warn("Firebase not configured — push notifications will be saved in-app only");
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(credentials) });
      }
      this.messaging = admin.messaging();
      this.enabled = true;
      this.logger.log("Firebase Cloud Messaging initialized");
    } catch (err) {
      this.logger.warn(`Firebase init failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** FCM يحتاج رابط صورة مطلق https لعرض الصورة الكبيرة. */
  static toAbsoluteImageUrl(raw?: string | null): string | undefined {
    const rewritten = rewriteMediaUrl(raw?.trim() || null);
    if (!rewritten) return undefined;

    if (rewritten.startsWith("https://") || rewritten.startsWith("http://")) {
      return rewritten.replace(/^http:\/\//i, "https://");
    }

    const publicBase = (process.env.MEDIA_PUBLIC_BASE_URL || "https://deemaalhayat.com/media").replace(/\/$/, "");
    const origin = publicBase.replace(/\/media$/i, "") || "https://deemaalhayat.com";

    if (rewritten.startsWith("/media")) return `${origin}${rewritten}`;
    if (rewritten.startsWith("/")) return `${origin}${rewritten}`;
    if (rewritten.startsWith("media/")) return `${origin}/${rewritten}`;
    return `${publicBase}/${rewritten.replace(/^\//, "")}`;
  }

  private stringifyData(data: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value == null) continue;
      const s = String(value).trim();
      if (!s) continue;
      out[key] = s;
    }
    return out;
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushSendResult> {
    if (!tokens.length) {
      return { sent: 0, failed: 0, skipped: true, invalidTokens: [], error: "No device tokens" };
    }

    if (!this.enabled || !this.messaging) {
      return { sent: 0, failed: 0, skipped: true, invalidTokens: [], error: "Firebase not configured" };
    }

    const unique = [...new Set(tokens.filter(Boolean))];
    const CHUNK = 500;
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];
    const imageUrl = PushService.toAbsoluteImageUrl(payload.imageUrl);

    const data = this.stringifyData({
      ...payload.data,
      title: payload.title,
      body: payload.body,
      ...(imageUrl ? { imageUrl } : {}),
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    });

    for (let i = 0; i < unique.length; i += CHUNK) {
      const batch = unique.slice(i, i + CHUNK);
      try {
        const response = await this.messaging.sendEachForMulticast({
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            ...(imageUrl ? { imageUrl } : {}),
          },
          data,
          android: {
            priority: "high",
            notification: {
              channelId: "alhayaa_notifications",
              sound: "default",
              icon: "ic_notification",
              color: "#0B8F7A",
              ...(imageUrl ? { imageUrl } : {}),
              clickAction: "FLUTTER_NOTIFICATION_CLICK",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
                ...(imageUrl ? { mutableContent: true } : {}),
              },
            },
            fcmOptions: imageUrl ? { imageUrl } : undefined,
          },
        });
        sent += response.successCount;
        failed += response.failureCount;

        response.responses.forEach((res, idx) => {
          if (res.success) return;
          const code = res.error?.code ?? "";
          this.logger.warn(`FCM token fail: ${code} ${res.error?.message ?? ""}`);
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(batch[idx]);
          }
        });
      } catch (err) {
        failed += batch.length;
        this.logger.error(`FCM batch failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { sent, failed, skipped: false, invalidTokens };
  }
}
