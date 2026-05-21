import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import Redis from "ioredis";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../../common/prisma.service";

@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      return {
        ready: false,
        db: "error",
        timestamp: new Date().toISOString(),
      };
    }

    if (process.env.REDIS_DISABLED === "1") {
      return {
        ready: true,
        db: "ok",
        redis: "disabled",
        timestamp: new Date().toISOString(),
      };
    }

    const redis = new Redis({
      host: process.env.REDIS_HOST ?? "redis",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      await redis.ping();
      return {
        ready: true,
        db: "ok",
        redis: "ok",
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        ready: false,
        db: "ok",
        redis: "error",
        timestamp: new Date().toISOString(),
      };
    } finally {
      redis.disconnect();
    }
  }
}
