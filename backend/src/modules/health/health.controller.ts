import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { statfs } from "fs/promises";
import * as path from "path";
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

    const disk = await this.mediaDiskUsage();
    const diskWarn = disk.usedPercent >= Number(process.env.DISK_WARN_PERCENT ?? 85);

    if (process.env.REDIS_DISABLED === "1") {
      return {
        ready: !diskWarn,
        db: "ok",
        redis: "disabled",
        disk,
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
        ready: !diskWarn,
        db: "ok",
        redis: "ok",
        disk,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        ready: false,
        db: "ok",
        redis: "error",
        disk,
        timestamp: new Date().toISOString(),
      };
    } finally {
      redis.disconnect();
    }
  }

  private async mediaDiskUsage() {
    const mediaRoot = path.resolve(process.env.MEDIA_ROOT ?? "./uploads");
    const warnPercent = Number(process.env.DISK_WARN_PERCENT ?? 85);
    try {
      const stats = await statfs(mediaRoot);
      const totalBytes = stats.bsize * stats.blocks;
      const freeBytes = stats.bsize * stats.bavail;
      const usedBytes = totalBytes - freeBytes;
      const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;
      return {
        path: mediaRoot,
        totalBytes,
        freeBytes,
        usedBytes,
        usedPercent,
        warn: usedPercent >= warnPercent,
      };
    } catch {
      return {
        path: mediaRoot,
        totalBytes: 0,
        freeBytes: 0,
        usedBytes: 0,
        usedPercent: 0,
        warn: false,
        error: "unavailable",
      };
    }
  }
}
