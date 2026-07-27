import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CmsPageKey, Prisma } from "@prisma/client";
import { CmsBilingualService } from "../../common/cms-bilingual.service";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class HomeBlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
    private readonly cmsBilingual: CmsBilingualService,
  ) {}

  list(activeOnly = true, pageKey: CmsPageKey = CmsPageKey.HOME) {
    return this.prisma.homeBlock.findMany({
      where: {
        pageKey,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { position: "asc" },
    });
  }

  async create(data: any) {
    try {
      const enriched = await this.cmsBilingual.enrichHomeBlockData(this.pickBilingualFields(data));
      const result = await this.prisma.homeBlock.create({ data: this.sanitize(enriched) as any });
      await this.homeFeedCache.invalidateAll();
      return result;
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async update(id: string, data: any) {
    const existing = await this.ensure(id);
    try {
      const merged = this.pickBilingualFields({
        ...existing,
        ...data,
        payload: data.payload !== undefined ? data.payload : existing.payload,
      });
      const enriched = await this.cmsBilingual.enrichHomeBlockData(merged);
      const result = await this.prisma.homeBlock.update({ where: { id }, data: this.sanitize(enriched, true) as any });
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
    return b;
  }

  private pickBilingualFields(data: any) {
    return {
      title: data.title,
      titleEn: data.titleEn,
      subtitle: data.subtitle,
      subtitleEn: data.subtitleEn,
      payload: (data.payload ?? {}) as Record<string, unknown>,
    };
  }

  private sanitize(data: any, partial = false) {
    const out: Record<string, unknown> = {};
    if (!partial || data.type !== undefined) out.type = data.type;
    if (!partial || data.title !== undefined) out.title = data.title?.trim?.() || data.title || null;
    if (!partial || data.titleEn !== undefined) out.titleEn = data.titleEn?.trim?.() || data.titleEn || null;
    if (!partial || data.subtitle !== undefined) out.subtitle = data.subtitle?.trim?.() || data.subtitle || null;
    if (!partial || data.subtitleEn !== undefined) out.subtitleEn = data.subtitleEn?.trim?.() || data.subtitleEn || null;
    if (!partial || data.position !== undefined) {
      out.position = Number.isFinite(Number(data.position)) ? Number(data.position) : 0;
    }
    if (!partial || data.isActive !== undefined) out.isActive = data.isActive !== false;
    if (!partial || data.payload !== undefined) out.payload = data.payload ?? {};
    if (!partial || data.pageKey !== undefined) {
      const raw = String(data.pageKey ?? CmsPageKey.HOME).toUpperCase();
      out.pageKey = raw === CmsPageKey.OFFERS ? CmsPageKey.OFFERS : CmsPageKey.HOME;
    }
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
