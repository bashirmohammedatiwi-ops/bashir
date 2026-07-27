import { Injectable, NotFoundException } from "@nestjs/common";
import { CmsBilingualService } from "../../common/cms-bilingual.service";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
    private readonly cmsBilingual: CmsBilingualService,
  ) {}

  list(activeOnly = false) {
    return this.prisma.banner.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
      include: { image: true },
    });
  }

  async create(data: any) {
    const enriched = await this.cmsBilingual.enrichBannerData(data);
    const result = await this.prisma.banner.create({ data: enriched as any });
    await this.homeFeedCache.invalidateAll();
    return result;
  }

  async update(id: string, data: any) {
    const existing = await this.ensure(id);
    const enriched = await this.cmsBilingual.enrichBannerData({ ...existing, ...data });
    const patch: Record<string, unknown> = { ...data };
    for (const field of ["title", "subtitle", "tag", "ctaLabel", "discountText"] as const) {
      const enKey = `${field}En`;
      if (enriched[enKey] !== undefined) patch[enKey] = enriched[enKey];
    }
    const result = await this.prisma.banner.update({ where: { id }, data: patch });
    await this.homeFeedCache.invalidateAll();
    return result;
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.banner.delete({ where: { id } });
    await this.homeFeedCache.invalidateAll();
    return { success: true };
  }

  private async ensure(id: string) {
    const b = await this.prisma.banner.findUnique({ where: { id } });
    if (!b) throw new NotFoundException("Banner not found");
    return b;
  }
}
