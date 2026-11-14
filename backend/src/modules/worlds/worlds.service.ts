import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { invalidateCache } from "../../common/memory-cache.util";
import { PrismaService } from "../../common/prisma.service";
import { WORLD_SEEDS } from "./worlds.defaults";
import { worldTiles } from "./world-tiles.util";
import { HOME_SHELF_KEYS, HomeShelfKey, UpdateWorldDto } from "./dto/update-world.dto";

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
          // جدّ القسم: القسم المربوط من المستوى الثالث يُعرف به (listingKind = tertiary).
          parent: { select: { parentId: true } },
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

    const { categoryIds, bannerIds, galleryMediaIds, budgetTiers, homeShelves, ...rest } = dto;
    const data: Prisma.WorldUpdateInput = { ...rest };
    if (budgetTiers !== undefined) {
      const tiers = cleanBudgetTiers(budgetTiers);
      data.budgetTiers = tiers.length ? tiers : Prisma.DbNull;
    }
    if (homeShelves !== undefined) {
      data.homeShelves = cleanHomeShelves(homeShelves) ?? Prisma.DbNull;
    }
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
    // نطاق العالم (/products?world=، بحث «ديما» داخل العالم) يُحسب من أقسامه — لا ننتظر انتهاء الكاش.
    invalidateCache("world:");
    return updated;
  }

  /**
   * كل قسم مربوط بالعالم بلاطة واحدة (worldTiles): الفرعي والدقيق كما هما،
   * والرئيسي (مثل «عدسات») بلاطة واحدة تفتح كل منتجاته بدل بلاطة لكل قسم فرعي.
   */
  toStorefront(world: Prisma.WorldGetPayload<{ include: typeof worldInclude }>) {
    const linked = world.categories.map((link) => link.category);
    const categories = worldTiles(linked);
    const rootCategoryIds = [
      ...new Set(
        linked.map((node) => node.parent?.parentId || node.parentId || node.id),
      ),
    ];
    return { ...world, rootCategoryIds, categories };
  }
}

/** نطاقات ميزانية سليمة: أرقام صحيحة موجبة، «من» أقل من «إلى»، حتى 4، مرتبة تصاعدياً. */
export function cleanBudgetTiers(raw: unknown): { min: number | null; max: number | null }[] {
  if (!Array.isArray(raw)) return [];
  const num = (v: unknown) => {
    const n = Math.round(Number(v));
    return v === null || v === undefined || v === "" || !Number.isFinite(n) || n <= 0 ? null : n;
  };
  return raw
    .map((t) => ({ min: num((t as { min?: unknown })?.min), max: num((t as { max?: unknown })?.max) }))
    .filter((t) => (t.min != null || t.max != null) && (t.min == null || t.max == null || t.min < t.max))
    .slice(0, 4)
    .sort((a, b) => (a.min ?? 0) - (b.min ?? 0) || (a.max ?? Infinity) - (b.max ?? Infinity));
}

export type HomeShelvesConfig = { hide?: HomeShelfKey[]; startAfter?: number; every?: number };

/**
 * إعداد الرفوف الشخصية بعد التنظيف: مفاتيح معروفة بلا تكرار، startAfter بين 0 و30، every بين 1 و6.
 * لا شيء يُغيّر الافتراضي = null (العمود فارغ والتطبيق يعرض السلوك الحالي).
 */
export function cleanHomeShelves(raw: unknown): HomeShelvesConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const src = raw as { hide?: unknown; startAfter?: unknown; every?: unknown };
  const out: HomeShelvesConfig = {};
  if (Array.isArray(src.hide)) {
    const known = new Set<string>(HOME_SHELF_KEYS);
    const hide = [...new Set(src.hide.map(String).filter((k) => known.has(k)))] as HomeShelfKey[];
    if (hide.length) out.hide = hide;
  }
  const int = (v: unknown, min: number, max: number) => {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
  };
  const startAfter = int(src.startAfter, 0, 30);
  const every = int(src.every, 1, 6);
  if (startAfter !== undefined) out.startAfter = startAfter;
  if (every !== undefined) out.every = every;
  return Object.keys(out).length ? out : null;
}
