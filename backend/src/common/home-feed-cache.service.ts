import { Injectable } from "@nestjs/common";
import { RedisCacheService } from "./redis-cache.service";

export const HOME_FEED_CACHE_PREFIX = "home:feed:v2:";

@Injectable()
export class HomeFeedCacheService {
  constructor(private readonly redis: RedisCacheService) {}

  ttlSec(): number {
    const n = Number(process.env.HOME_FEED_CACHE_TTL_SEC ?? 90);
    return Number.isFinite(n) && n > 0 ? n : 90;
  }

  buildKey(settings: Record<string, unknown>): string {
    const flags = [
      settings.hideOutOfStock ? "1" : "0",
      settings.hideEmptyBrands ? "1" : "0",
      settings.hideEmptyCategories ? "1" : "0",
      settings.hideEmptySubcategories ? "1" : "0",
      settings.hideEmptyTertiary ? "1" : "0",
      settings.hideProductsWithoutImages ? "1" : "0",
      String(settings.flashSaleEndsAt ?? ""),
    ].join(":");
    return `${HOME_FEED_CACHE_PREFIX}${flags}`;
  }

  get<T>(key: string) {
    return this.redis.get<T>(key);
  }

  set(key: string, value: unknown) {
    return this.redis.set(key, value, this.ttlSec());
  }

  invalidateAll() {
    return this.redis.invalidatePrefix(HOME_FEED_CACHE_PREFIX);
  }
}
