import { Injectable, NotFoundException } from "@nestjs/common";
import { CmsPageKey } from "@prisma/client";
import { CmsBilingualService } from "../../common/cms-bilingual.service";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";
import { withPlaceholderImages, hasRealProductImagesWhere } from "../../common/product-placeholder.util";
import { rewriteMediaRecord } from "../../common/media-url.util";
import { BrandsService } from "../catalog/brands.service";
import { CategoriesService } from "../catalog/categories.service";
import { WorldScope, worldProductMatch } from "../catalog/products.service";
import { SettingsService } from "../settings/settings.service";
import { HomeSectionResolver } from "./home-section.resolver";
import { isPackageLive, packageInclude, publicPackage, worldScope } from "../cms/packages.service";
import { publicConcern } from "../cms/skin-concerns.service";
import { loyaltyRules } from "../loyalty/loyalty.rules";

const productInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, include: { media: true } },
  shades: true,
  variants: true,
};

function activeBannerWhere(worldId: string | null) {
  const now = new Date();
  return {
    isActive: true,
    worldId,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly sectionResolver: HomeSectionResolver,
    private readonly homeFeedCache: HomeFeedCacheService,
    private readonly categories: CategoriesService,
    private readonly brands: BrandsService,
    private readonly cmsBilingual: CmsBilingualService,
  ) {}

  async feed(options?: { skipCache?: boolean; worldSlug?: string }) {
    const settings = await this.settings.getAll();
    const world = options?.worldSlug
      ? await this.prisma.world.findFirst({
          where: { slug: options.worldSlug, isActive: true },
          include: {
            categories: {
              orderBy: { position: "asc" },
              include: { category: { select: { id: true, parentId: true } } },
            },
          },
        })
      : null;
    if (options?.worldSlug && !world) throw new NotFoundException("World not found");
    const worldId = world?.id ?? null;
    const selected = world?.categories.map((link) => link.category) ?? [];
    const subIds = selected.filter((category) => category.parentId).map((category) => category.id);
    const legacyRootIds = selected.filter((category) => !category.parentId).map((category) => category.id);
    const cacheKey =
      this.homeFeedCache.buildKey(settings as Record<string, unknown>) +
      (world ? `:world:${world.slug}` : "");

    if (!options?.skipCache) {
      const cached = await this.homeFeedCache.get<Record<string, unknown>>(cacheKey);
      if (cached) return cached;
    }

    const payload = await this.buildFeed(settings, worldId, { subIds, legacyRootIds }, world);
    if (!options?.skipCache) {
      await this.homeFeedCache.set(cacheKey, payload);
    }
    return payload;
  }

  async offersFeed(options?: { skipCache?: boolean }) {
    const settings = await this.settings.getAll();
    const cacheKey = this.homeFeedCache.buildOffersKey(settings as Record<string, unknown>);

    if (!options?.skipCache) {
      const cached = await this.homeFeedCache.get<Record<string, unknown>>(cacheKey);
      if (cached) return cached;
    }

    const payload = await this.buildOffersFeed(settings);
    if (!options?.skipCache) {
      await this.homeFeedCache.set(cacheKey, payload);
    }
    return payload;
  }

  /** الباقات الصالحة بشكلها العام (أسعار وتوفير)، ودليل البشرة مع عدد المنتجات. */
  private async beautyBlocks(
    packageRows: Parameters<typeof publicPackage>[0][],
    concernRows: Parameters<typeof publicConcern>[0][],
  ) {
    const now = new Date();
    const packages = packageRows
      .filter((p) => isPackageLive(p, now))
      .map(publicPackage)
      .filter((p) => p.stepCount > 0);
    const counts = concernRows.length
      ? await this.prisma.productSkinConcern.groupBy({
          by: ["concernId"],
          _count: { concernId: true },
          where: { product: { isActive: true }, concernId: { in: concernRows.map((c) => c.id) } },
        })
      : [];
    const countMap = new Map(counts.map((c) => [c.concernId, c._count.concernId]));
    return { packages, skinConcerns: concernRows.map((c) => publicConcern(c, countMap.get(c.id) ?? 0)) };
  }

  private async buildFeed(
    settings: Record<string, unknown>,
    worldId: string | null = null,
    scope: WorldScope = { subIds: [], legacyRootIds: [] },
    world: { id: string; slug: string; nameAr: string; nameEn: string | null; taglineAr: string | null; taglineEn: string | null; accentColor: string; canvasColor: string; inkColor: string; surfaceColor: string } | null = null,
  ) {
    const flashEndsAt = (settings as any).flashSaleEndsAt ?? null;
    const s = settings as Record<string, unknown>;
    // نفس شرط «عرض الكل» (/products?world=) حتى تطابق رفوف العالم قوائمها الكاملة.
    const worldMatch = worldProductMatch(scope);
    const worldProductScope = worldMatch ? { OR: worldMatch } : {};
    const productVisibility = {
      ...(s.hideOutOfStock ? { stock: { gt: 0 } } : {}),
      ...(s.hideProductsWithoutImages ? hasRealProductImagesWhere() : {}),
      ...worldProductScope,
    };
    const promotedCategories = worldId ? await this.promotedWorldCategories(scope) : null;

    const [
      banners,
      categories,
      brands,
      packageRows,
      skinConcernRows,
      homeBlocks,
      newArrivals,
      bestSellers,
      featuredProducts,
      promoProducts,
    ] = await Promise.all([
      this.prisma.banner.findMany({
        where: activeBannerWhere(worldId),
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      promotedCategories ? Promise.resolve(promotedCategories) : this.categories.list(false, true, true),
      worldMatch
        ? this.prisma.brand.findMany({
            where: {
              isActive: true,
              products: { some: { isActive: true, OR: worldMatch } },
            },
            orderBy: { position: "asc" },
            include: { logo: true },
          })
        : this.brands.list({ featuredOnly: true, storefront: true }),
      // الباقات والروتينات ودليل البشرة: العامة + المخصصة لهذا العالم.
      this.prisma.package.findMany({
        where: { isActive: true, ...worldScope(world?.slug) },
        orderBy: [{ isFeatured: "desc" }, { position: "asc" }],
        include: packageInclude,
      }),
      this.prisma.skinConcern.findMany({
        where: { isActive: true, ...worldScope(world?.slug) },
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.prisma.homeBlock.findMany({
        where: { isActive: true, pageKey: CmsPageKey.HOME, worldId },
        orderBy: { position: "asc" },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isNew: true, ...productVisibility },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: productInclude,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isBestSeller: true, ...productVisibility },
        orderBy: { soldCount: "desc" },
        take: 20,
        include: productInclude,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isFeatured: true, ...productVisibility },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: productInclude,
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isPromo: true, ...productVisibility },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: productInclude,
      }),
    ]);

    const { packages, skinConcerns } = await this.beautyBlocks(packageRows, skinConcernRows);

    const productBuckets = {
      new: newArrivals.map((p) => withPlaceholderImages(p)),
      bestSeller: bestSellers.map((p) => withPlaceholderImages(p)),
      featured: featuredProducts.map((p) => withPlaceholderImages(p)),
      promo: promoProducts.map((p) => withPlaceholderImages(p)),
    };

    const cmsBlocks = homeBlocks.filter((b) => b.type !== "HERO_BANNER");
    const resolvedSections = await this.sectionResolver.resolve(cmsBlocks, {
      flashEndsAt,
      defaultCategories: categories,
      defaultBrands: brands,
      defaultPackages: packages,
      productBuckets,
      allBanners: banners,
      skinConcerns,
      worldSlug: world?.slug ?? null,
    });
    const sections = await this.cmsBilingual.enrichSections(resolvedSections);
    const enrichedBanners = await this.cmsBilingual.enrichBanners(
      banners.map((b) => ({ ...b })) as Record<string, unknown>[],
    );

    return {
      world: world
        ? {
            id: world.id,
            slug: world.slug,
            nameAr: world.nameAr,
            nameEn: world.nameEn,
            taglineAr: world.taglineAr,
            taglineEn: world.taglineEn,
            accentColor: world.accentColor,
            canvasColor: world.canvasColor,
            inkColor: world.inkColor,
            surfaceColor: world.surfaceColor,
          }
        : null,
      sections,
      banners: enrichedBanners.map((b) => ({
        ...b,
        image: rewriteMediaRecord(b.image as Record<string, unknown> | null | undefined),
      })),
      categories,
      brands,
      packages,
      skinConcerns,
      homeBlocks,
      flashSale: {
        endsAt: flashEndsAt,
        products: promoProducts.map((p) => withPlaceholderImages(p)),
      },
      newArrivals: newArrivals.map((p) => withPlaceholderImages(p)),
      bestSellers: bestSellers.map((p) => withPlaceholderImages(p)),
      featuredProducts: featuredProducts.map((p) => withPlaceholderImages(p)),
      settings: {
        storeName: (settings as any).storeName,
        whatsapp: (settings as any).whatsapp,
        supportPhone: (settings as any).supportPhone ?? (settings as any).whatsapp,
        pickupEnabled: (settings as any).pickupEnabled ?? true,
        // قواعد النقاط للتطبيق (كل نقطة = 1 د.ع افتراضياً).
        loyalty: loyaltyRules(settings as Record<string, unknown>),
        pickupAddress: (settings as any).pickupAddress ?? "",
        pickupHours: (settings as any).pickupHours ?? "",
        freeShippingThreshold: (settings as any).freeShippingThreshold ?? 50000,
      },
    };
  }

  private async buildOffersFeed(settings: Record<string, unknown>) {
    const flashEndsAt = (settings as any).flashSaleEndsAt ?? null;
    const s = settings as Record<string, unknown>;
    const productVisibility = {
      ...(s.hideOutOfStock ? { stock: { gt: 0 } } : {}),
      ...(s.hideProductsWithoutImages ? hasRealProductImagesWhere() : {}),
    };

    const [banners, brands, packageRows, skinConcernRows, offersBlocks, promoProducts] = await Promise.all([
      this.prisma.banner.findMany({
        where: activeBannerWhere(null),
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.prisma.brand.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { position: "asc" },
        include: { logo: true },
      }),
      this.prisma.package.findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { position: "asc" }],
        include: packageInclude,
      }),
      this.prisma.skinConcern.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.prisma.homeBlock.findMany({
        where: { isActive: true, pageKey: CmsPageKey.OFFERS },
        orderBy: { position: "asc" },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, isPromo: true, ...productVisibility },
        orderBy: { createdAt: "desc" },
        take: 24,
        include: productInclude,
      }),
    ]);

    const { packages, skinConcerns } = await this.beautyBlocks(packageRows, skinConcernRows);

    const productBuckets = {
      new: [],
      bestSeller: [],
      featured: [],
      promo: promoProducts.map((p) => withPlaceholderImages(p)),
    };

    const resolvedSections = await this.sectionResolver.resolve(offersBlocks, {
      flashEndsAt,
      defaultCategories: [],
      defaultBrands: brands,
      defaultPackages: packages,
      productBuckets,
      allBanners: banners,
      skinConcerns,
    });
    const sections = await this.cmsBilingual.enrichSections(resolvedSections);

    return {
      sections,
      flashSale: {
        endsAt: flashEndsAt,
        products: promoProducts.map((p) => withPlaceholderImages(p)),
      },
      promoProducts: promoProducts.map((p) => withPlaceholderImages(p)),
      settings: {
        storeName: (settings as any).storeName,
        whatsapp: (settings as any).whatsapp,
        supportPhone: (settings as any).supportPhone ?? (settings as any).whatsapp,
        pickupEnabled: (settings as any).pickupEnabled ?? true,
        // قواعد النقاط للتطبيق (كل نقطة = 1 د.ع افتراضياً).
        loyalty: loyaltyRules(settings as Record<string, unknown>),
        pickupAddress: (settings as any).pickupAddress ?? "",
        pickupHours: (settings as any).pickupHours ?? "",
        freeShippingThreshold: (settings as any).freeShippingThreshold ?? 50000,
      },
    };
  }

  /**
   * الأقسام الفرعية المختارة تظهر في رئيسية العالم. نُرجع parentId ونوع القائمة (listingKind)
   * حتى يبني categoryDefaultLink رابط القسم الفرعي/الدقيق الصحيح — لا رابط قسم رئيسي يفتح قائمة فارغة.
   */
  private async promotedWorldCategories(scope: WorldScope) {
    const ids = [...scope.subIds];
    if (scope.legacyRootIds.length) {
      const children = await this.prisma.category.findMany({
        where: { parentId: { in: scope.legacyRootIds }, isActive: true },
        select: { id: true },
        orderBy: { position: "asc" },
      });
      ids.push(...children.map((child) => child.id));
    }
    if (!ids.length) return [];
    const rows = await this.prisma.category.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { image: true, parent: { select: { parentId: true } } },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap((id) => {
      const node = byId.get(id);
      if (!node) return [];
      return [{
        id: node.id,
        name: node.nameAr || node.name,
        nameAr: node.nameAr || node.name,
        nameEn: node.nameEn,
        slug: node.slug,
        icon: node.icon,
        position: node.position,
        isActive: node.isActive,
        image: node.image,
        parentId: node.parentId,
        listingKind: node.parent?.parentId ? "tertiary" : "subcategory",
        children: [] as unknown[],
      }];
    });
  }
}
