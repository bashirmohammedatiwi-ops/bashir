import { Injectable } from "@nestjs/common";
import { HomeBlock, HomeBlockType } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { SettingsService } from "../settings/settings.service";

import { buildAppLink, withResolvedLink } from "../../common/link-target.util";
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
  adSlot?: string;
  bannerAspect?: number;
  fullBleed?: boolean;
  marqueeSpeed?: number;
  marqueeGap?: number;
  imageHeight?: number;
  showTitle?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  productCardSize?: string;
  backgroundColor?: string;
  showViewAll?: boolean;
  viewAllQuery?: string;
  headerImageUrl?: string;
  endsAt?: string | null;
  banners?: unknown[];
  categories?: unknown[];
  products?: unknown[];
  brands?: unknown[];
  packages?: unknown[];
  promoStrip?: {
    text: string;
    items?: string[];
    link?: string;
    linkType?: string;
    linkValue?: string;
    backgroundColor?: string;
    textColor?: string;
    marquee?: boolean;
    marqueeSpeed?: number;
    icon?: string;
    variant?: string;
    label?: string;
    separator?: string;
    showIcon?: boolean;
  };
  items?: unknown[];
  skinConcerns?: unknown[];
  display?: string;
  shape?: string;
  kind?: string;
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
    const headerImageId = payload.headerImageId as string | undefined;
    let headerImageUrl: string | undefined;
    if (headerImageId) {
      const media = await this.prisma.media.findUnique({ where: { id: headerImageId } });
      if (media) headerImageUrl = this.mediaPublicUrl(media) ?? undefined;
    }

    const base = {
      id: block.id,
      type: block.type,
      title: block.title,
      subtitle: block.subtitle,
      position: block.position,
      headerImageUrl,
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
        const categories = await this.resolveCategories(
          { ...payload, maxItems: Math.min(8, (payload.maxItems as number) ?? 8) },
          ctx.defaultCategories,
        );
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
        if (payload.source === "inline" && payload.imageId) {
          const inline = await this.resolveInlineAd(payload);
          if (inline) {
            const sized = this.sizeBanners([inline], payload);
            return {
              ...base,
              layout: (payload.sectionLayout as string) ?? "full",
              banners: sized.slice(0, 1),
            };
          }
        }
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
          showViewAll: payload.showViewAll !== false,
          viewAllQuery: (payload.viewAllQuery as string) ?? undefined,
        };
      }

      case HomeBlockType.PACKAGES: {
        const packages = await this.resolvePackages(payload, ctx.defaultPackages);
        return {
          ...base,
          layout: (payload.sectionLayout as string) ?? "carousel",
          kind: (payload.kind as string) ?? undefined,
          packages,
          showViewAll: payload.showViewAll !== false,
          viewAllQuery:
            (payload.viewAllQuery as string) ??
            "isPromo=1&title=" + encodeURIComponent(block.title ?? "الباقات"),
        };
      }

      case HomeBlockType.PROMO_STRIP: {
        const linkType = payload.linkType as string | undefined;
        const linkValue = payload.linkValue as string | undefined;
        const legacyLink = payload.link as string | undefined;
        const rawItems = payload.items;
        const items = Array.isArray(rawItems)
          ? rawItems.map((x) => String(x)).filter((s) => s.trim())
          : [];
        return {
          ...base,
          layout: "strip",
          promoStrip: {
            text: (payload.text as string) ?? block.title ?? "",
            items,
            linkType,
            linkValue,
            link: buildAppLink(linkType, linkValue, legacyLink),
            backgroundColor: (payload.backgroundColor as string) ?? "#FCE4EC",
            textColor: (payload.textColor as string) ?? "",
            marquee: payload.marquee !== false,
            marqueeSpeed: Number(payload.marqueeSpeed) || 5,
            icon: (payload.icon as string) ?? "",
            variant: (payload.variant as string) ?? "strip",
            label: (payload.label as string) ?? "عاجل",
            separator: (payload.separator as string) ?? "   •   ",
            showIcon: payload.showIcon !== false,
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
          shape: (payload.shape as string) ?? "rect",
          items,
        };
      }

      case HomeBlockType.IMAGE_MARQUEE: {
        const items = await this.resolveImageTiles(payload);
        return {
          ...base,
          layout: "marquee",
          sectionLayout: (payload.sectionLayout as string) ?? "marquee",
          items,
        };
      }

      case HomeBlockType.SKIN_CONCERNS: {
        const concerns = await this.resolveSkinConcerns(payload, ctx.skinConcerns);
        return {
          ...base,
          layout: (payload.display as string) ?? "chips",
          display: (payload.display as string) ?? "chips",
          skinConcerns: concerns,
        };
      }

      case HomeBlockType.CIRCLE_TILES: {
        const items = await this.resolveCircleTiles(payload);
        return {
          ...base,
          layout: (payload.sectionLayout as string) ?? "row",
          sectionLayout: (payload.sectionLayout as string) ?? "row",
          items,
        };
      }

      case HomeBlockType.ROUTINE_CAROUSEL: {
        const packages = await this.resolveRoutinePackages(payload, ctx.defaultPackages);
        const kind = (payload.kind as string) ?? "ROUTINE_MORNING";
        return {
          ...base,
          layout: "carousel",
          kind,
          packages,
          viewAllQuery: kind === "both" ? "isPromo=1&title=روتين البشرة" : undefined,
        };
      }

      case HomeBlockType.CARE_HUB: {
        const concerns = await this.resolveSkinConcerns(
          { concernIds: payload.concernIds as string[], maxItems: payload.maxItems as number },
          ctx.skinConcerns,
        );
        const categories = await this.resolveCategories(
          { categoryIds: payload.categoryIds as string[], maxItems: 8 },
          ctx.defaultCategories,
        );
        const routineKinds = (payload.routineKinds as string[]) ?? ["ROUTINE_MORNING", "ROUTINE_EVENING"];
        const morningPkgs = await this.resolveRoutinePackages(
          { kind: "ROUTINE_MORNING", limit: 6, packageIds: payload.morningPackageIds as string[] },
          ctx.defaultPackages,
        );
        const eveningPkgs = await this.resolveRoutinePackages(
          { kind: "ROUTINE_EVENING", limit: 6, packageIds: payload.eveningPackageIds as string[] },
          ctx.defaultPackages,
        );
        const productFilter = (payload.productFilter as string) ?? "featured";
        const products = await this.resolveProducts(payload, productFilter, ctx.productBuckets);
        return {
          ...base,
          layout: (payload.layout as string) ?? "stacked",
          display: (payload.layout as string) ?? "stacked",
          skinConcerns: concerns,
          categories,
          packages: [...morningPkgs, ...eveningPkgs],
          products: products.slice(0, (payload.productLimit as number) ?? 8),
          items: routineKinds.map((k) => ({ kind: k })),
        };
      }

      default:
        return null;
    }
  }

  private pickBanners(all: unknown[], ids?: string[]): unknown[] {
    const picked = !ids?.length
      ? all
      : ids.map((id) => (all as { id: string }[]).find((b) => b.id === id)).filter(Boolean);
    return (picked as Record<string, unknown>[]).map((b) =>
      withResolvedLink({
        ...b,
        link: buildAppLink(b.linkType as string, b.linkValue as string, b.link as string),
      }),
    );
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
      linkType?: string;
      linkValue?: string;
      link?: string;
    }[]) ?? [];
    if (items.length) {
      const map = new Map((all as { id: string }[]).map((b) => [b.id, b]));
      return items
        .slice(0, max)
        .map((item, idx) => {
          const banner = item.bannerId ? map.get(item.bannerId) : null;
          if (!banner) return null;
          const b = banner as Record<string, unknown>;
          const sized = withResolvedLink({
            ...b,
            title: item.title ?? b.title,
            discountText: item.discountText ?? b.discountText,
            linkType: item.linkType ?? b.linkType,
            linkValue: item.linkValue ?? b.linkValue,
            link: buildAppLink(
              (item.linkType ?? b.linkType) as string,
              (item.linkValue ?? b.linkValue) as string,
              (item.link ?? b.link) as string,
            ),
          });
          const size = resolveCardSize(payload, item.bannerId, idx, item.cardSize);
          return withCardSize(sized, size);
        })
        .filter(Boolean);
    }
    const ids = payload.bannerIds as string[] | undefined;
    return this.sizeBanners(this.pickBanners(all, ids).slice(0, max), payload);
  }

  private categoryDefaultLink(cat: { id: string; parentId?: string | null }) {
    if (!cat.parentId) return buildAppLink("category", cat.id);
    return buildAppLink("subcategory", cat.id);
  }

  private async resolveCategories(payload: Payload, fallback: unknown[]) {
    const ids = payload.categoryIds as string[] | undefined;
    const overrides = (payload.categoryItems as { categoryId: string; linkType?: string; linkValue?: string }[]) ?? [];
    const overrideMap = new Map(overrides.map((o) => [o.categoryId, o]));
    const max = (payload.maxItems as number) ?? 16;
    if (!ids?.length) {
      return (fallback as { id: string; parentId?: string | null }[])
        .slice(0, max)
        .map((c, i) => {
          const ov = overrideMap.get(c.id);
          const link = ov?.linkType
            ? buildAppLink(ov.linkType, ov.linkValue)
            : this.categoryDefaultLink(c);
          return withCardSize(
            { ...c, linkType: ov?.linkType, linkValue: ov?.linkValue, link } as Record<string, unknown>,
            resolveCardSize(payload, c.id, i),
          );
        });
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
        const ov = overrideMap.get(id);
        const link = ov?.linkType
          ? buildAppLink(ov.linkType, ov.linkValue)
          : this.categoryDefaultLink(cat);
        return withCardSize(
          { ...cat, linkType: ov?.linkType, linkValue: ov?.linkValue, link } as Record<string, unknown>,
          resolveCardSize(payload, id, i),
        );
      })
      .filter(Boolean);
  }

  private async resolveBrands(payload: Payload, fallback: unknown[]) {
    const ids = payload.brandIds as string[] | undefined;
    const enrich = (b: Record<string, unknown>, id: string) =>
      withCardSize(
        { ...b, link: buildAppLink("brand", id) },
        resolveCardSize(payload, id, ids?.indexOf(id) ?? 0),
      );
    if (!ids?.length) {
      return (fallback as { id: string }[]).map((b, i) =>
        enrich(b as Record<string, unknown>, b.id),
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
        return enrich(brand as Record<string, unknown>, id);
      })
      .filter(Boolean);
  }

  private async resolvePackages(payload: Payload, fallback: unknown[]) {
    const ids = payload.packageIds as string[] | undefined;
    const kind = payload.kind as string | undefined;
    const enrich = (p: Record<string, unknown>) => {
      const slug = (p.slug as string) || (p.id as string);
      return withCardSize(
        { ...p, link: buildAppLink("package", slug) },
        resolveCardSize(payload, p.id as string, 0),
      );
    };
    if (!ids?.length) {
      let list = fallback as Record<string, unknown>[];
      if (kind && kind !== "all") {
        list = list.filter((p) => p.kind === kind);
      }
      return list.map((p) => enrich(p));
    }
    const where: Record<string, unknown> = { id: { in: ids }, isActive: true };
    if (kind && kind !== "all") where.kind = kind;
    const packages = await this.prisma.package.findMany({
      where,
      include: { coverImage: true, items: { include: { product: true } } },
    });
    const map = new Map(packages.map((p) => [p.id, p]));
    return ids
      .map((id, i) => {
        const pkg = map.get(id);
        if (!pkg) return null;
        return withCardSize(
          { ...pkg, link: buildAppLink("package", pkg.slug || pkg.id) } as Record<string, unknown>,
          resolveCardSize(payload, id, i),
        );
      })
      .filter(Boolean);
  }

  private async resolveRoutinePackages(payload: Payload, fallback: unknown[]) {
    const kind = (payload.kind as string) ?? "ROUTINE_MORNING";
    const limit = (payload.limit as number) ?? 8;
    if (kind === "both") {
      const morning = await this.resolveRoutinePackages({ ...payload, kind: "ROUTINE_MORNING", limit }, fallback);
      const evening = await this.resolveRoutinePackages({ ...payload, kind: "ROUTINE_EVENING", limit }, fallback);
      return [...morning, ...evening];
    }
    return this.resolvePackages({ ...payload, kind, packageIds: payload.packageIds as string[] }, fallback).then(
      (pkgs) => pkgs.slice(0, limit),
    );
  }

  private async resolveSkinConcerns(payload: Payload, fallback: unknown[]) {
    const ids = payload.concernIds as string[] | undefined;
    const max = (payload.maxItems as number) ?? 12;
    const enrich = (c: Record<string, unknown>) => ({
      ...c,
      link: buildAppLink("skinConcern", c.slug as string),
      imageUrl: this.concernImageUrl(c),
    });
    if (!ids?.length) {
      return (fallback as Record<string, unknown>[]).slice(0, max).map(enrich);
    }
    const concerns = await this.prisma.skinConcern.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { image: true },
    });
    const map = new Map(concerns.map((c) => [c.id, c]));
    return ids.map((id) => map.get(id)).filter(Boolean).map((c) => enrich(c as Record<string, unknown>));
  }

  private concernImageUrl(c: Record<string, unknown>): string | null {
    const image = c.image as { variants?: unknown; publicUrlBase?: string; filename?: string } | null | undefined;
    if (image) return this.mediaPublicUrl(image);
    return null;
  }

  private async resolveCircleTiles(payload: Payload) {
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
    const max = (payload.maxItems as number) ?? 12;

    return raw.slice(0, max).map((item, idx) => {
      const media = item.imageId ? mediaMap.get(item.imageId) : null;
      const imageUrl = media ? this.mediaPublicUrl(media) : null;
      const size = resolveCardSize(payload, `circle-${idx}`, idx, item.cardSize);
      return withCardSize(
        withResolvedLink({
          id: `circle-${idx}`,
          title: item.title ?? "",
          subtitle: item.subtitle ?? "",
          imageUrl,
          image: media,
          linkType: item.linkType,
          linkValue: item.linkValue,
          link: buildAppLink(item.linkType, item.linkValue),
        }),
        size,
      );
    });
  }

  private async resolveInlineAd(payload: Payload) {
    const imageId = payload.imageId as string | undefined;
    if (!imageId) return null;
    const media = await this.prisma.media.findUnique({ where: { id: imageId } });
    if (!media) return null;
    const linkType = payload.linkType as string | undefined;
    const linkValue = payload.linkValue as string | undefined;
    const legacyLink = payload.link as string | undefined;
    return {
      id: `inline-${imageId}`,
      title: (payload.title as string) ?? "",
      subtitle: (payload.subtitle as string) ?? "",
      discountText: (payload.discountText as string) ?? "",
      backgroundColor: (payload.backgroundColor as string) ?? "",
      linkType,
      linkValue,
      link: buildAppLink(linkType, linkValue, legacyLink),
      image: media,
    };
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

    // نطابق الحقل المفرد القديم وعلاقات التصنيفات المتعددة الجديدة معاً
    const scopeAnd: Record<string, unknown>[] = [];
    if (subcategoryId) {
      scopeAnd.push({
        OR: [{ subcategoryId }, { subcategories: { some: { id: subcategoryId } } }],
      });
    }
    if (tertiaryCategoryId) {
      scopeAnd.push({
        OR: [
          { tertiaryCategoryId },
          { tertiaryCategories: { some: { id: tertiaryCategoryId } } },
        ],
      });
    }

    const where: Record<string, unknown> = {
      isActive: true,
      ...(await this.productVisibilityWhere()),
      ...(categoryId ? { categoryId } : {}),
      ...(scopeAnd.length ? { AND: scopeAnd } : {}),
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
