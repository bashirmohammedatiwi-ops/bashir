import { Injectable } from "@nestjs/common";
import { HomeBlock, HomeBlockType } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";

import { buildAppLink } from "../../common/link-target.util";
import { withPlaceholderImages } from "../../common/product-placeholder.util";
import { resolveCardSize, sectionStyleFromPayload, withCardSize } from "./card-sizes.util";

const productInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, include: { media: true } },
  shades: true,
  variants: true,
};

type Payload = Record<string, unknown>;

export interface ResolvedHomeSection {
  id: string;
  type: HomeBlockType;
  title?: string | null;
  subtitle?: string | null;
  position: number;
  layout?: string;
  sectionLayout?: string;
  cardSize?: string;
  showTitle?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  productCardSize?: string;
  backgroundColor?: string;
  showViewAll?: boolean;
  viewAllQuery?: string;
  endsAt?: string | null;
  banners?: unknown[];
  categories?: unknown[];
  products?: unknown[];
  brands?: unknown[];
  packages?: unknown[];
  promoStrip?: {
    text: string;
    link?: string;
    linkType?: string;
    linkValue?: string;
    backgroundColor?: string;
  };
  items?: unknown[];
  skinConcerns?: unknown[];
}

@Injectable()
export class HomeSectionResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /// فلاتر ظهور المنتجات في واجهة المتجر (مخزون/صور) حسب الإعدادات.
  private async productVisibilityWhere(): Promise<Record<string, unknown>> {
    const s = (await this.settings.getAll()) as Record<string, unknown>;
    return {
      ...(s.hideOutOfStock ? { stock: { gt: 0 } } : {}),
      ...(s.hideProductsWithoutImages ? { images: { some: {} } } : {}),
    };
  }

  async resolve(
    blocks: HomeBlock[],
    ctx: {
      flashEndsAt: string | null;
      defaultCategories: unknown[];
      defaultBrands: unknown[];
      defaultPackages: unknown[];
      productBuckets: Record<string, unknown[]>;
      allBanners: unknown[];
      skinConcerns: unknown[];
    },
  ): Promise<ResolvedHomeSection[]> {
    const sections: ResolvedHomeSection[] = [];

    for (const block of blocks) {
      const payload = (block.payload ?? {}) as Payload;
      const section = await this.resolveBlock(block, payload, ctx);
      if (section && !this.isEmpty(section)) {
        sections.push(section);
      }
    }

    return sections;
  }

  private isEmpty(s: ResolvedHomeSection): boolean {
    if (s.promoStrip?.text) return false;
    const arrays = [s.banners, s.categories, s.products, s.brands, s.packages, s.items, s.skinConcerns];
    return !arrays.some((a) => Array.isArray(a) && a.length > 0);
  }

  private async resolveBlock(
    block: HomeBlock,
    payload: Payload,
    ctx: {
      flashEndsAt: string | null;
      defaultCategories: unknown[];
      defaultBrands: unknown[];
      defaultPackages: unknown[];
      productBuckets: Record<string, unknown[]>;
      allBanners: unknown[];
      skinConcerns: unknown[];
    },
  ): Promise<ResolvedHomeSection | null> {
    const base = {
      id: block.id,
      type: block.type,
      title: block.title,
      subtitle: block.subtitle,
      position: block.position,
      backgroundColor:
        (payload.backgroundColor as string) ??
        (payload.accentColor as string) ??
        undefined,
      showViewAll: payload.showViewAll !== false,
      ...sectionStyleFromPayload(payload),
      showTitle:
        block.type === HomeBlockType.FLASH_SALE
          ? payload.showTitle !== false
          : payload.showTitle === true,
    };

    switch (block.type) {
      case HomeBlockType.HERO_BANNER: {
        const bannerIds = payload.bannerIds as string[] | undefined;
        const banners = this.pickBanners(ctx.allBanners, bannerIds);
        const categories = await this.resolveCategories(payload, ctx.defaultCategories);
        return {
          ...base,
          layout: "overlap",
          banners,
          categories,
        };
      }

      case HomeBlockType.CATEGORY_GRID: {
        const categories = await this.resolveCategories(payload, ctx.defaultCategories);
        return {
          ...base,
          layout: (payload.layout as string) ?? (payload.sectionLayout as string) ?? "overlap",
          categories,
        };
      }

      case HomeBlockType.CATEGORY_TILES:
      case HomeBlockType.MAKEUP_CATEGORIES: {
        const categories = await this.resolveCategories(payload, ctx.defaultCategories);
        const sectionLayout = (payload.sectionLayout as string) ?? "tiles";
        return {
          ...base,
          layout: block.type === HomeBlockType.MAKEUP_CATEGORIES ? "makeup" : sectionLayout,
          sectionLayout,
          categories,
        };
      }

      case HomeBlockType.BANNER_FULL:
      case HomeBlockType.CUSTOM_BANNER: {
        const bannerId = (payload.bannerId as string) ?? (payload.bannerIds as string[])?.[0];
        const banners = bannerId
          ? this.pickBanners(ctx.allBanners, [bannerId])
          : this.pickBanners(ctx.allBanners, payload.bannerIds as string[]);
        const sized = this.sizeBanners(banners, payload);
        return {
          ...base,
          layout: (payload.sectionLayout as string) ?? "full",
          banners: sized.slice(0, 1),
        };
      }

      case HomeBlockType.BANNER_GRID_2: {
        const items = await this.resolveBannerItems(payload, ctx.allBanners, 2);
        return {
          ...base,
          layout: (payload.sectionLayout as string) ?? "grid2",
          sectionLayout: (payload.sectionLayout as string) ?? "asymmetric",
          items,
          banners: items,
        };
      }

      case HomeBlockType.BANNER_GRID_3: {
        const items = await this.resolveBannerItems(payload, ctx.allBanners, 3);
        return {
          ...base,
          layout: (payload.sectionLayout as string) ?? "grid3",
          sectionLayout: (payload.sectionLayout as string) ?? "asymmetric",
          items,
          banners: items,
        };
      }

      case HomeBlockType.BANNER_CAROUSEL: {
        const banners = this.pickBanners(ctx.allBanners, payload.bannerIds as string[]);
        const sized = this.sizeBanners(banners, payload);
        return {
          ...base,
          layout: (payload.sectionLayout as string) ?? "carousel",
          sectionLayout: (payload.sectionLayout as string) ?? "carousel",
          banners: sized,
        };
      }

      case HomeBlockType.PRODUCT_LIST:
      case HomeBlockType.FLASH_SALE: {
        const filter = (payload.filter as string) ?? (block.type === HomeBlockType.FLASH_SALE ? "promo" : "bestSeller");
        const products = await this.resolveProducts(payload, filter, ctx.productBuckets);
        const endsAt =
          block.type === HomeBlockType.FLASH_SALE
            ? ((payload.endsAt as string) ?? ctx.flashEndsAt)
            : undefined;
        return {
          ...base,
          layout: block.type === HomeBlockType.FLASH_SALE ? "flash" : "carousel",
          products,
          endsAt: endsAt ?? null,
          showViewAll: payload.showViewAll !== false,
          viewAllQuery: this.buildViewAllQuery(payload, filter, block.title),
        };
      }

      case HomeBlockType.FEATURED_BRANDS:
      case HomeBlockType.BRAND_SHOWCASE: {
        const brands = await this.resolveBrands(payload, ctx.defaultBrands);
        return {
          ...base,
          layout: (payload.layout as string) ?? (block.type === HomeBlockType.BRAND_SHOWCASE ? "cards" : "logos"),
          sectionLayout: (payload.sectionLayout as string) ?? "varied",
          brands,
        };
      }

      case HomeBlockType.PACKAGES: {
        const packages = await this.resolvePackages(payload, ctx.defaultPackages);
        return { ...base, layout: "carousel", packages };
      }

      case HomeBlockType.PROMO_STRIP: {
        const linkType = payload.linkType as string | undefined;
        const linkValue = payload.linkValue as string | undefined;
        const legacyLink = payload.link as string | undefined;
        return {
          ...base,
          layout: "strip",
          promoStrip: {
            text: (payload.text as string) ?? block.title ?? "",
            linkType,
            linkValue,
            link: buildAppLink(linkType, linkValue, legacyLink),
            backgroundColor: (payload.backgroundColor as string) ?? "#FCE4EC",
          },
        };
      }

      case HomeBlockType.IMAGE_TILES: {
        const items = await this.resolveImageTiles(payload);
        const cols = (payload.columns as number) ?? 2;
        const sectionLayout = (payload.sectionLayout as string) ?? "mosaic";
        return {
          ...base,
          layout: sectionLayout === "mosaic" ? "mosaic" : `grid${cols}`,
          sectionLayout,
          items,
        };
      }

      case HomeBlockType.SKIN_CONCERNS: {
        const concerns = await this.resolveSkinConcerns(payload, ctx.skinConcerns);
        return {
          ...base,
          layout: "chips",
          skinConcerns: concerns,
        };
      }

      default:
        return null;
    }
  }

  private pickBanners(all: unknown[], ids?: string[]): unknown[] {
    if (!ids?.length) return all;
    const map = new Map((all as { id: string }[]).map((b) => [b.id, b]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  private sizeBanners(banners: unknown[], payload: Payload): unknown[] {
    return (banners as { id: string }[]).map((b, i) =>
      withCardSize(b as Record<string, unknown>, resolveCardSize(payload, b.id, i)),
    );
  }

  private async resolveBannerItems(payload: Payload, all: unknown[], max: number) {
    const items = (payload.items as {
      bannerId?: string;
      title?: string;
      discountText?: string;
      cardSize?: string;
    }[]) ?? [];
    if (items.length) {
      const map = new Map((all as { id: string }[]).map((b) => [b.id, b]));
      return items
        .slice(0, max)
        .map((item, idx) => {
          const banner = item.bannerId ? map.get(item.bannerId) : null;
          if (!banner) return null;
          const sized = {
            ...(banner as Record<string, unknown>),
            title: item.title,
            discountText: item.discountText,
          };
          const size = resolveCardSize(payload, item.bannerId, idx, item.cardSize);
          return withCardSize(sized, size);
        })
        .filter(Boolean);
    }
    const ids = payload.bannerIds as string[] | undefined;
    return this.sizeBanners(this.pickBanners(all, ids).slice(0, max), payload);
  }

  private async resolveCategories(payload: Payload, fallback: unknown[]) {
    const ids = payload.categoryIds as string[] | undefined;
    const max = (payload.maxItems as number) ?? 8;
    if (!ids?.length) {
      return (fallback as { id: string }[])
        .slice(0, max)
        .map((c, i) =>
          withCardSize(
            c as Record<string, unknown>,
            resolveCardSize(payload, c.id, i),
          ),
        );
    }
    const cats = await this.prisma.category.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { image: true },
    });
    const map = new Map(cats.map((c) => [c.id, c]));
    return ids
      .map((id, i) => {
        const cat = map.get(id);
        if (!cat) return null;
        return withCardSize(cat as Record<string, unknown>, resolveCardSize(payload, id, i));
      })
      .filter(Boolean);
  }

  private async resolveBrands(payload: Payload, fallback: unknown[]) {
    const ids = payload.brandIds as string[] | undefined;
    if (!ids?.length) {
      return (fallback as { id: string }[]).map((b, i) =>
        withCardSize(b as Record<string, unknown>, resolveCardSize(payload, b.id, i)),
      );
    }
    const brands = await this.prisma.brand.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { logo: true },
    });
    const map = new Map(brands.map((b) => [b.id, b]));
    return ids
      .map((id, i) => {
        const brand = map.get(id);
        if (!brand) return null;
        return withCardSize(brand as Record<string, unknown>, resolveCardSize(payload, id, i));
      })
      .filter(Boolean);
  }

  private async resolvePackages(payload: Payload, fallback: unknown[]) {
    const ids = payload.packageIds as string[] | undefined;
    if (!ids?.length) {
      return (fallback as { id: string }[]).map((p, i) =>
        withCardSize(p as Record<string, unknown>, resolveCardSize(payload, p.id, i)),
      );
    }
    const packages = await this.prisma.package.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { coverImage: true, items: { include: { product: true } } },
    });
    const map = new Map(packages.map((p) => [p.id, p]));
    return ids
      .map((id, i) => {
        const pkg = map.get(id);
        if (!pkg) return null;
        return withCardSize(pkg as Record<string, unknown>, resolveCardSize(payload, id, i));
      })
      .filter(Boolean);
  }

  private async resolveSkinConcerns(payload: Payload, fallback: unknown[]) {
    const ids = payload.concernIds as string[] | undefined;
    const max = (payload.maxItems as number) ?? 12;
    if (!ids?.length) return (fallback as unknown[]).slice(0, max);
    const concerns = await this.prisma.skinConcern.findMany({
      where: { id: { in: ids }, isActive: true },
    });
    const map = new Map(concerns.map((c) => [c.id, c]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  private async resolveImageTiles(payload: Payload) {
    const raw = (payload.items as {
      imageId?: string;
      title?: string;
      subtitle?: string;
      linkType?: string;
      linkValue?: string;
      cardSize?: string;
    }[]) ?? [];
    if (!raw.length) return [];

    const mediaIds = raw.map((i) => i.imageId).filter(Boolean) as string[];
    const mediaList = mediaIds.length
      ? await this.prisma.media.findMany({ where: { id: { in: mediaIds } } })
      : [];
    const mediaMap = new Map(mediaList.map((m) => [m.id, m]));

    return raw.map((item, idx) => {
      const media = item.imageId ? mediaMap.get(item.imageId) : null;
      const imageUrl = media ? this.mediaPublicUrl(media) : null;
      const size = resolveCardSize(payload, `tile-${idx}`, idx, item.cardSize);
      return withCardSize(
        {
          id: `tile-${idx}`,
          title: item.title ?? "",
          subtitle: item.subtitle ?? "",
          imageUrl,
          image: media,
          linkType: item.linkType,
          linkValue: item.linkValue,
          link: buildAppLink(item.linkType, item.linkValue),
        },
        size,
      );
    });
  }

  private mediaPublicUrl(media: {
    publicUrlBase?: string | null;
    filename?: string | null;
    variants?: unknown;
  }): string | null {
    const variants = media.variants as Record<string, { formats?: Record<string, string> }> | undefined;
    const rel =
      variants?.medium?.formats?.webp ??
      variants?.medium?.formats?.jpg ??
      variants?.thumb?.formats?.webp ??
      null;
    if (rel) return rel;
    if (media.publicUrlBase && media.filename) {
      return `${media.publicUrlBase}/${media.filename}.webp`;
    }
    return null;
  }

  private async resolveProducts(
    payload: Payload,
    filter: string,
    buckets: Record<string, unknown[]>,
  ): Promise<unknown[]> {
    const productIds = payload.productIds as string[] | undefined;
    if (productIds?.length) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: productInclude,
      });
      const map = new Map(products.map((p) => [p.id, withPlaceholderImages(p)]));
      return productIds.map((id) => map.get(id)).filter(Boolean);
    }

    const scoped = await this.queryScopedProducts(payload, filter);
    if (scoped.length) return scoped;

    const limit = (payload.limit as number) ?? 10;
    return (buckets[filter] ?? buckets.bestSeller ?? [])
      .slice(0, limit)
      .map((p) => withPlaceholderImages(p as { images?: unknown[] }));
  }

  private async queryScopedProducts(payload: Payload, filter: string) {
    const categoryId = payload.categoryId as string | undefined;
    const subcategoryId = payload.subcategoryId as string | undefined;
    const tertiaryCategoryId = payload.tertiaryCategoryId as string | undefined;
    const brandId = payload.brandId as string | undefined;
    if (!categoryId && !subcategoryId && !tertiaryCategoryId && !brandId) return [];

    const where: Record<string, unknown> = {
      isActive: true,
      ...(await this.productVisibilityWhere()),
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(tertiaryCategoryId ? { tertiaryCategoryId } : {}),
      ...(brandId ? { brandId } : {}),
    };
    if (filter === "promo") where.isPromo = true;
    else if (filter === "new") where.isNew = true;
    else if (filter === "bestSeller") where.isBestSeller = true;
    else if (filter === "featured") where.isFeatured = true;

    const limit = (payload.limit as number) ?? 12;
    const orderBy =
      filter === "bestSeller"
        ? { soldCount: "desc" as const }
        : { createdAt: "desc" as const };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      include: productInclude,
    });
    return products.map((p) => withPlaceholderImages(p));
  }

  private buildViewAllQuery(payload: Payload, filter: string, title?: string | null): string {
    const parts: string[] = [];
    const categoryId = payload.categoryId as string | undefined;
    const subcategoryId = payload.subcategoryId as string | undefined;
    const tertiaryCategoryId = payload.tertiaryCategoryId as string | undefined;
    const brandId = payload.brandId as string | undefined;
    if (categoryId) parts.push(`categoryId=${encodeURIComponent(categoryId)}`);
    if (subcategoryId) parts.push(`subcategoryId=${encodeURIComponent(subcategoryId)}`);
    if (tertiaryCategoryId) parts.push(`tertiaryCategoryId=${encodeURIComponent(tertiaryCategoryId)}`);
    if (brandId) parts.push(`brandId=${encodeURIComponent(brandId)}`);
    const filterPart = this.filterToQuery(filter, title);
    if (parts.length) return `${parts.join("&")}&${filterPart}`;
    return filterPart;
  }

  private filterToQuery(filter: string, title?: string | null): string {
    const t = title ? `&title=${encodeURIComponent(title)}` : "";
    const map: Record<string, string> = {
      promo: `isPromo=1${t}`,
      new: `isNew=1${t}`,
      bestSeller: `isBestSeller=1${t}`,
      featured: `isFeatured=1${t}`,
    };
    return map[filter] ?? `isFeatured=1${t}`;
  }
}
