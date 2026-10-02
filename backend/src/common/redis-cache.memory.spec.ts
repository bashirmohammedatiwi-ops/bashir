import { afterEach, describe, expect, it, vi } from "vitest";
import { RedisCacheService } from "./redis-cache.service";

/** Redis معطّل → كل العمليات تخدم من الذاكرة الداخلية المحدودة. */
function memoryOnly(): RedisCacheService {
  process.env.REDIS_DISABLED = "1";
  return new RedisCacheService();
}

describe("RedisCacheService in-process fallback", () => {
  afterEach(() => {
    delete process.env.REDIS_DISABLED;
    delete process.env.CACHE_MEMORY_MAX_KEYS;
    vi.restoreAllMocks();
  });

  it("set then get returns the value without Redis", async () => {
    const cache = memoryOnly();
    await cache.set("k1", { a: 1 }, 30);
    expect(await cache.get<{ a: number }>("k1")).toEqual({ a: 1 });
  });

  it("expires entries after the (capped) TTL", async () => {
    const cache = memoryOnly();
    vi.useFakeTimers();
    await cache.set("k2", "v", 1);
    vi.advanceTimersByTime(1500);
    expect(await cache.get("k2")).toBeNull();
    vi.useRealTimers();
  });

  it("invalidatePrefix removes matching keys only", async () => {
    const cache = memoryOnly();
    await cache.set("prefix:a", 1, 60);
    await cache.set("prefix:b", 2, 60);
    await cache.set("other:c", 3, 60);
    const removed = await cache.invalidatePrefix("prefix:");
    expect(removed).toBeGreaterThanOrEqual(2);
    expect(await cache.get("prefix:a")).toBeNull();
    expect(await cache.get("other:c")).toBe(3);
  });

  it("bounds memory to CACHE_MEMORY_MAX_KEYS with approximate LRU", async () => {
    process.env.CACHE_MEMORY_MAX_KEYS = "2";
    const cache = memoryOnly();
    await cache.set("a", 1, 60);
    await cache.set("b", 2, 60);
    await cache.get("a"); // يجدد ترتيب a
    await cache.set("c", 3, 60); // يطرد الأقدم (b)
    expect(await cache.get("a")).toBe(1);
    expect(await cache.get("b")).toBeNull();
    expect(await cache.get("c")).toBe(3);
  });
});
