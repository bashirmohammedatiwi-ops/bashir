import { Injectable, NotFoundException } from "@nestjs/common";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  list(activeOnly = false) {
    return this.prisma.banner.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
      include: { image: true },
    });
  }

  async create(data: any) {
    const result = await this.prisma.banner.create({ data });
    await this.homeFeedCache.invalidateAll();
    return result;
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    const result = await this.prisma.banner.update({ where: { id }, data });
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
  }
}
