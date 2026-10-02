import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";
import { WORLD_SEEDS } from "./worlds.defaults";
import { UpdateWorldDto } from "./dto/update-world.dto";

const worldInclude = {
  coverImage: true,
  gallery: {
    orderBy: { position: "asc" as const },
    include: { media: true },
  },
  categories: {
    orderBy: { position: "asc" as const },
    include: {
      category: {
        include: {
          image: true,
          children: {
            where: { isActive: true },
            orderBy: { position: "asc" as const },
            include: {
              image: true,
              children: {
                where: { isActive: true },
                orderBy: { position: "asc" as const },
                include: { image: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.WorldInclude;

@Injectable()
export class WorldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  async ensureDefaults() {
    for (const seed of WORLD_SEEDS) {
      await this.prisma.world.upsert({
        where: { slug: seed.slug },
        update: {},
        create: seed,
      });
    }
  }

  async list(includeInactive = false) {
    await this.ensureDefaults();
    if (!includeInactive) {
      return this.prisma.world.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          taglineAr: true,
          taglineEn: true,
          accentColor: true,
          canvasColor: true,
          inkColor: true,
          surfaceColor: true,
          position: true,
          isActive: true,
        },
      });
    }
    return this.prisma.world.findMany({
      where: undefined,
      orderBy: { position: "asc" },
      include: worldInclude,
    });
  }

  async findBySlug(slug: string) {
    await this.ensureDefaults();
    const world = await this.prisma.world.findUnique({
      where: { slug },
      include: worldInclude,
    });
    if (!world || !world.isActive) throw new NotFoundException("World not found");
    return this.toStorefront(world);
  }

  async update(id: string, dto: UpdateWorldDto) {
    await this.ensureDefaults();
    const exists = await this.prisma.world.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("World not found");

    const { categoryIds, bannerIds, galleryMediaIds, ...data } = dto;
    await this.prisma.world.update({ where: { id }, data });

    if (categoryIds) {
      await this.prisma.worldCategory.deleteMany({ where: { worldId: id } });
      if (categoryIds.length) {
        await this.prisma.worldCategory.createMany({
          data: categoryIds.map((categoryId, position) => ({ worldId: id, categoryId, position })),
        });
      }
    }

    if (galleryMediaIds) {
      await this.prisma.worldGalleryImage.deleteMany({ where: { worldId: id } });
      const mediaIds = [...new Set(galleryMediaIds.filter((mediaId) => mediaId.trim().length > 0))];
      if (mediaIds.length) {
        await this.prisma.worldGalleryImage.createMany({
          data: mediaIds.map((mediaId, position) => ({ worldId: id, mediaId, position })),
        });
      }
    }

    if (bannerIds) {
      await this.prisma.banner.updateMany({
        where: {
          worldId: id,
          ...(bannerIds.length ? { id: { notIn: bannerIds } } : {}),
        },
        data: { worldId: null },
      });
      if (bannerIds.length) {
        await this.prisma.banner.updateMany({
          where: { id: { in: bannerIds } },
          data: { worldId: id },
        });
      }
    }

    const updated = await this.prisma.world.findUnique({ where: { id }, include: worldInclude });
    await this.homeFeedCache.invalidateAll();
    return updated;
  }

  /**
   * الأقسام الفرعية المختارة تظهر كأقسام العالم.
   * الربط القديم بقسم رئيسي يُوسَّع إلى كل أقسامه الفرعية.
   */
  toStorefront(world: Prisma.WorldGetPayload<{ include: typeof worldInclude }>) {
    const linked = world.categories.map((link) => link.category);
    const categories = linked.flatMap((node) => {
      if (node.parentId) {
        return [{ ...node, parentId: null, listingKind: "subcategory" }];
      }
      const subs = node.children ?? [];
      if (!subs.length) return [{ ...node, parentId: null, listingKind: "category" }];
      return subs.map((sub) => ({ ...sub, parentId: null, listingKind: "subcategory" }));
    });
    const rootCategoryIds = [
      ...new Set(
        linked.map((node) => node.parentId || node.id),
      ),
    ];
    return { ...world, rootCategoryIds, categories };
  }
}
