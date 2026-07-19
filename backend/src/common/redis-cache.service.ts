import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis | null;
  readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.REDIS_DISABLED !== "1";
    if (!this.enabled) {
      this.client = null;
      return;
    }
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? "redis",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    this.client.on("error", (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  private async ensureConnected(): Promise<Redis | null> {
    if (!this.client) return null;
    if (this.client.status === "wait") {
      try {
        await this.client.connect();
      } catch (err) {
        this.logger.warn(`Redis connect failed: ${err instanceof Error ? err.message : err}`);
        return null;
      }
    }
    if (this.client.status !== "ready") return null;
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = await this.ensureConnected();
    if (!redis) return null;
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Redis get failed for ${key}: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSec: number): Promise<void> {
    const redis = await this.ensureConnected();
    if (!redis || ttlSec <= 0) return;
    try {
      const payload = JSON.stringify(value);
      await redis.set(key, payload, "EX", ttlSec);
    } catch (err) {
      this.logger.warn(`Redis set failed for ${key}: ${err instanceof Error ? err.message : err}`);
    }
  }

  async invalidatePrefix(prefix: string): Promise<number> {
    const redis = await this.ensureConnected();
    if (!redis) return 0;
    let removed = 0;
    try {
      let cursor = "0";
      do {
        const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
        cursor = next;
        if (keys.length) {
          removed += await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      this.logger.warn(
        `Redis invalidatePrefix failed for ${prefix}: ${err instanceof Error ? err.message : err}`,
      );
    }
    return removed;
  }
}
