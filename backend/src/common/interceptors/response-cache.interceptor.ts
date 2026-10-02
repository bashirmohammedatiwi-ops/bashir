import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { RedisCacheService } from "../redis-cache.service";

export const RESPONSE_CACHE_TTL = "response_cache:ttl";
export const RESPONSE_CACHE_KEY = "response_cache:key";

/** Route metadata: cache this GET response for N seconds (default 30). */
export function CacheResponse(ttlSec = 30, keyPrefix?: string) {
  return (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RESPONSE_CACHE_TTL, ttlSec, descriptor.value);
      if (keyPrefix) Reflect.defineMetadata(RESPONSE_CACHE_KEY, keyPrefix, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(RESPONSE_CACHE_TTL, ttlSec, target);
    if (keyPrefix) Reflect.defineMetadata(RESPONSE_CACHE_KEY, keyPrefix, target);
    return target;
  };
}

/**
 * Response cache for PUBLIC GET reads (categories tree, brands, CMS blocks…).
 * - Key = route prefix + sorted query.
 * - Skips any request carrying an Authorization header (personalized data).
 * - Two layers: Redis (multi-replica) → bounded in-process map (free fallback).
 * Invalidate on admin writes via `cache.invalidatePrefix("rc:<prefix>")`.
 */
@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseCacheInterceptor.name);

  constructor(
    private readonly cache: RedisCacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { method?: string }>();
    const response = http.getResponse<Response>();
    const handler = context.getHandler();

    const ttl = this.reflector.get<number>(RESPONSE_CACHE_TTL, handler) ?? 0;
    if (ttl <= 0) return next.handle();
    if ((request.method ?? "GET").toUpperCase() !== "GET") return next.handle();
    if (request.headers.authorization) return next.handle();

    const prefix = this.reflector.get<string>(RESPONSE_CACHE_KEY, handler) ?? request.path ?? "route";
    const query = Object.keys((request.query as Record<string, unknown>) ?? {})
      .sort()
      .map((k) => `${k}=${String((request.query as Record<string, unknown>)[k])}`)
      .join("&");
    const key = `rc:${prefix}:${query}`;

    const cached = await this.cache.get<unknown>(key);
    if (cached !== null && cached !== undefined) {
      response.setHeader("X-Cache", "HIT");
      return of(cached);
    }
    return next.handle().pipe(
      tap((value) => {
        response.setHeader("X-Cache", "MISS");
        void this.cache.set(key, value, ttl);
      }),
    );
  }
}
