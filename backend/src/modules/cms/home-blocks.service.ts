import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class HomeBlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  list(activeOnly = true) {
    return this.prisma.homeBlock.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
    });
  }

  async create(data: any) {
    try {
      const result = await this.prisma.homeBlock.create({ data: this.sanitize(data) as any });
      await this.homeFeedCache.invalidateAll();
      return result;
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    try {
      const result = await this.prisma.homeBlock.update({ where: { id }, data: this.sanitize(data, true) as any });
      await this.homeFeedCache.invalidateAll();
      return result;
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async reorder(ids: string[]) {
    const result = await this.prisma.$transaction(
      ids.map((id, position) => this.prisma.homeBlock.update({ where: { id }, data: { position } })),
    );
    await this.homeFeedCache.invalidateAll();
    return result;
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.homeBlock.delete({ where: { id } });
    await this.homeFeedCache.invalidateAll();
    return { success: true };
  }

  private async ensure(id: string) {
    const b = await this.prisma.homeBlock.findUnique({ where: { id } });
    if (!b) throw new NotFoundException("HomeBlock not found");
  }

  private sanitize(data: any, partial = false) {
    const out: Record<string, unknown> = {};
    if (!partial || data.type !== undefined) out.type = data.type;
    if (!partial || data.title !== undefined) out.title = data.title?.trim?.() || data.title || null;
    if (!partial || data.subtitle !== undefined) out.subtitle = data.subtitle?.trim?.() || data.subtitle || null;
    if (!partial || data.position !== undefined) {
      out.position = Number.isFinite(Number(data.position)) ? Number(data.position) : 0;
    }
    if (!partial || data.isActive !== undefined) out.isActive = data.isActive !== false;
    if (!partial || data.payload !== undefined) out.payload = data.payload ?? {};
    return out;
  }

  private mapWriteError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const msg = error.message ?? "";
      if (msg.includes("HomeBlockType") || error.code === "P2006") {
        return new BadRequestException(
          "نوع القسم غير مدعوم على السيرفر — نفّذ prisma migrate deploy على VPS ثم أعد تشغيل API",
        );
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new BadRequestException("بيانات القسم غير صالحة — راجع النوع والحقول");
    }
    return error;
  }
}
