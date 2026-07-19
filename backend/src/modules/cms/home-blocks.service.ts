import { Injectable, NotFoundException } from "@nestjs/common";
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
    const result = await this.prisma.homeBlock.create({ data });
    await this.homeFeedCache.invalidateAll();
    return result;
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    const result = await this.prisma.homeBlock.update({ where: { id }, data });
    await this.homeFeedCache.invalidateAll();
    return result;
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
}
