import { Injectable } from "@nestjs/common";
import { CmsPageKey } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";
import { withPlaceholderImages } from "../../common/product-placeholder.util";
import { BrandsService } from "../catalog/brands.service";
import { CategoriesService } from "../catalog/categories.service";
import { SettingsService } from "../settings/settings.service";
import { HomeSectionResolver } from "./home-section.resolver";

const productInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, include: { media: true } },
  shades: true,
  variants: true,
};

function activeBannerWhere() {
  const now = new Date();
  return {
    isActive: true,
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
  ) {}

  async feed(options?: { skipCache?: boolean }) {
    const settings = await this.settings.getAll();
    const cacheKey = this.homeFeedCache.buildKey(settings as Record<string, unknown>);

    if (!options?.skipCache) {
      const cached = await this.homeFeedCache.get<Record<string, unknown>>(cacheKey);
      if (cached) return cached;
    }

    const payload = await this.buildFeed(settings);
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

  private async buildFeed(settings: Record<string, unknown>) {
    const flashEndsAt = (settings as any).flashSaleEndsAt ?? null;
    const s = settings as Record<string, unknown>;
    const productVisibility = {
      ...(s.hideOutOfStock ? { stock: { gt: 0 } } : {}),
      ...(s.hideProductsWithoutImages ? { images: { some: {} } } : {}),
    };

    const [
      banners,
      categories,
      brands,
      packages,
      skinConcerns,
      homeBlocks,
      newArrivals,
      bestSellers,
      featuredProducts,
      promoProducts,
    ] = await Promise.all([
      this.prisma.banner.findMany({
        where: activeBannerWhere(),
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.categories.list(false, true, true),
      this.brands.list({ featuredOnly: true, storefront: true }),
      this.prisma.package.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { coverImage: true, items: { include: { product: true } } },
      }),
      this.prisma.skinConcern.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { image: true },
      }),
      this.prisma.homeBlock.findMany({
        where: { isActive: true, pageKey: CmsPageKey.HOME },
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

    const productBuckets = {
      new: newArrivals.map((p) => withPlaceholderImages(p)),
      bestSeller: bestSellers.map((p) => withPlaceholderImages(p)),
      featured: featuredProducts.map((p) => withPlaceholderImages(p)),
      promo: promoProducts.map((p) => withPlaceholderImages(p)),
    };

    const cmsBlocks = homeBlocks.filter((b) => b.type !== "HERO_BANNER");
    const sections = await this.sectionResolver.resolve(cmsBlocks, {
      flashEndsAt,
      defaultCategories: categories,
      defaultBrands: brands,
      defaultPackages: packages,
      productBuckets,
      allBanners: banners,
      skinConcerns,
    });

    return {
      sections,
      banners,
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
      ...(s.hideProductsWithoutImages ? { images: { some: {} } } : {}),
    };

    const [banners, brands, packages, skinConcerns, offersBlocks, promoProducts] = await Promise.all([
      this.prisma.banner.findMany({
        where: activeBannerWhere(),
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
        orderBy: { position: "asc" },
        include: { coverImage: true, items: { include: { product: true } } },
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

    const productBuckets = {
      new: [],
      bestSeller: [],
      featured: [],
      promo: promoProducts.map((p) => withPlaceholderImages(p)),
    };

    const sections = await this.sectionResolver.resolve(offersBlocks, {
      flashEndsAt,
      defaultCategories: [],
      defaultBrands: brands,
      defaultPackages: packages,
      productBuckets,
      allBanners: banners,
      skinConcerns,
    });

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
        pickupAddress: (settings as any).pickupAddress ?? "",
        pickupHours: (settings as any).pickupHours ?? "",
        freeShippingThreshold: (settings as any).freeShippingThreshold ?? 50000,
      },
    };
  }
}
