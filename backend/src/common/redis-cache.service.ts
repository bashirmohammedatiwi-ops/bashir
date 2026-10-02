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
    if (!redis) return this.memoryGet<T>(key);
    try {
      const raw = await redis.get(key);
      if (!raw) return this.memoryGet<T>(key);
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Redis get failed for ${key}: ${err instanceof Error ? err.message : err}`);
      return this.memoryGet<T>(key);
    }
  }

  async set(key: string, value: unknown, ttlSec: number): Promise<void> {
    if (ttlSec <= 0) return;
    // Write-through to the in-process fallback so Redis-less nodes stay fast.
    this.memorySet(key, value, ttlSec);
    const redis = await this.ensureConnected();
    if (!redis) return;
    try {
      const payload = JSON.stringify(value);
      await redis.set(key, payload, "EX", ttlSec);
    } catch (err) {
      this.logger.warn(`Redis set failed for ${key}: ${err instanceof Error ? err.message : err}`);
    }
  }

  async invalidatePrefix(prefix: string): Promise<number> {
    const redis = await this.ensureConnected();
    if (!redis) return this.memoryInvalidatePrefix(prefix);
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
    return removed + this.memoryInvalidatePrefix(prefix);
  }

  // ---------------------- in-process fallback ----------------------
  // Keeps hot reads fast (and free) even without Redis — single-node deploys,
  // Redis restarts, or REDIS_DISABLED=1. Bounded to MEMORY_MAX_KEYS with
  // approximate LRU eviction so the process never grows unbounded.

  private readonly memory = new Map<string, { value: string; expiresAt: number }>();
  private readonly memoryMaxKeys = Number(process.env.CACHE_MEMORY_MAX_KEYS ?? 500);

  private memoryGet<T>(key: string): T | null {
    const hit = this.memory.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    // Map preserves insertion order — re-insert to approximate LRU.
    this.memory.delete(key);
    this.memory.set(key, hit);
    try {
      return JSON.parse(hit.value) as T;
    } catch {
      return null;
    }
  }

  private memorySet(key: string, value: unknown, ttlSec: number): void {
    if (this.memoryMaxKeys <= 0) return;
    // Cap fallback TTL — memory is only a hot-read buffer, not a source of truth.
    const ttl = Math.min(ttlSec, 120);
    if (this.memory.size >= this.memoryMaxKeys) {
      const oldest = this.memory.keys().next().value;
      if (oldest !== undefined) this.memory.delete(oldest);
    }
    this.memory.set(key, { value: JSON.stringify(value), expiresAt: Date.now() + ttl * 1000 });
  }

  private memoryInvalidatePrefix(prefix: string): number {
    let removed = 0;
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) {
        this.memory.delete(key);
        removed += 1;
      }
    }
    return removed;
  }
}
