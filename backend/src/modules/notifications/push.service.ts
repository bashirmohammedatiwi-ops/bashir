import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import * as fs from "fs";

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

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushSendResult> {
    if (!tokens.length) {
      return { sent: 0, failed: 0, skipped: true, error: "No device tokens" };
    }

    if (!this.enabled || !this.messaging) {
      return { sent: 0, failed: 0, skipped: true, error: "Firebase not configured" };
    }

    const unique = [...new Set(tokens.filter(Boolean))];
    const CHUNK = 500;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < unique.length; i += CHUNK) {
      const batch = unique.slice(i, i + CHUNK);
      try {
        const response = await this.messaging.sendEachForMulticast({
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
          },
          data: payload.data,
          android: { priority: "high" },
          apns: {
            payload: { aps: { sound: "default" } },
          },
        });
        sent += response.successCount;
        failed += response.failureCount;
      } catch (err) {
        failed += batch.length;
        this.logger.error(`FCM batch failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { sent, failed, skipped: false };
  }
}
