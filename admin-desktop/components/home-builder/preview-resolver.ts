import { mediaThumb } from "@/lib/mediaUrl";
import type { EditorEntities } from "./SectionPayloadEditor";
import { filterBuilderBlocks, pickHeroCategories } from "./fixed-hero";

type Block = {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
};

type MediaMap = Map<string, unknown>;

function pickByIds<T extends { id: string }>(items: T[], ids?: unknown): T[] {
  const list = Array.isArray(ids) ? (ids as string[]) : [];
  if (!list.length) return items.slice(0, 12);
  const map = new Map(items.map((i) => [i.id, i]));
  return list.map((id) => map.get(id)).filter(Boolean) as T[];
}

function pickOne<T extends { id: string }>(items: T[], id?: unknown): T | undefined {
  if (!id || typeof id !== "string") return items[0];
  return items.find((i) => i.id === id) ?? items[0];
}

function buildMediaMap(entities: EditorEntities): MediaMap {
  const map = new Map<string, unknown>();
  const add = (obj: any) => {
    if (!obj) return;
    const media = obj.image ?? obj.logo ?? obj.coverImage ?? obj.media;
    if (media?.id) map.set(media.id, media);
    if (typeof obj.imageId === "string") map.set(obj.imageId, media);
  };
  for (const b of entities.banners ?? []) add(b);
  for (const c of entities.categories ?? []) add(c);
  for (const c of entities.skinConcerns ?? []) add(c);
  for (const b of entities.brands ?? []) add(b);
  for (const p of entities.packages ?? []) add(p);
  for (const p of entities.products ?? []) {
    const imgs = p?.images;
    if (Array.isArray(imgs)) for (const im of imgs) if (im?.media?.id) map.set(im.media.id, im.media);
  }
  return map;
}

function resolveItems(items: unknown[], mediaMap: MediaMap) {
  return items.map((raw) => {
    const item = { ...(raw as Record<string, unknown>) };
    const imageId = item.imageId as string | undefined;
    if (imageId) {
      const media = mediaMap.get(imageId);
      const url = media ? mediaThumb(media as any) : null;
      if (url) item.imageUrl = url;
    }
    return item;
  });
}

function resolveInlineBanner(p: Record<string, unknown>, mediaMap: MediaMap) {
  const imageId = p.imageId as string | undefined;
  if (!imageId) return [];
  const media = mediaMap.get(imageId);
  const url = media ? mediaThumb(media as any) : null;
  return [
    {
      id: "inline",
      title: p.title,
      discountText: p.discountText,
      image: media,
      imageUrl: url,
      linkType: p.linkType,
      linkValue: p.linkValue,
    },
  ];
}

/** يملأ معاينة الأقسام المخفية أو غير المحلّاة من بيانات الكيانات المحلية */
export function resolveBlockPreview(
  block: Block,
  entities: EditorEntities,
  apiResolved?: Record<string, unknown> | null,
): Record<string, unknown> | undefined {
  if (apiResolved) return apiResolved;

  const p = block.payload ?? {};
  const mediaMap = buildMediaMap(entities);

  switch (block.type) {
    case "HERO_BANNER":
      return {
        banners: pickByIds(entities.banners ?? [], p.bannerIds),
        categories: pickByIds(entities.categories ?? [], p.categoryIds),
      };
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      if (Array.isArray(p.productIds) && p.productIds.length) {
        return {
          products: pickByIds(entities.products ?? [], p.productIds),
          endsAt: p.endsAt ?? null,
        };
      }
      return {
        products: (entities.products ?? []).slice(0, Number(p.limit) || 4),
        endsAt: p.endsAt ?? null,
      };
    case "PACKAGES":
      return { packages: pickByIds(entities.packages ?? [], p.packageIds) };
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return { brands: pickByIds(entities.brands ?? [], p.brandIds) };
    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
    case "MAKEUP_CATEGORIES":
      return { categories: pickByIds(entities.categories ?? [], p.categoryIds) };
    case "SKIN_CONCERNS":
      return { skinConcerns: pickByIds(entities.skinConcerns ?? [], p.concernIds) };
    case "BANNER_FULL":
    case "CUSTOM_BANNER": {
      if (p.source === "inline" && p.imageId) {
        return { banners: resolveInlineBanner(p, mediaMap) };
      }
      const b = pickOne(entities.banners ?? [], p.bannerId);
      return { banners: b ? [b] : [] };
    }
    case "BANNER_GRID_2":
    case "BANNER_GRID_3":
    case "BANNER_CAROUSEL":
      return { banners: pickByIds(entities.banners ?? [], p.bannerIds) };
    case "IMAGE_TILES":
      return { items: resolveItems(Array.isArray(p.items) ? p.items : [], mediaMap) };
    case "IMAGE_MARQUEE":
      return { items: resolveItems(Array.isArray(p.items) ? p.items : [], mediaMap) };
    case "CIRCLE_TILES":
      return { items: resolveItems(Array.isArray(p.items) ? p.items : [], mediaMap) };
    case "ROUTINE_CAROUSEL":
      return { packages: pickByIds(entities.packages ?? [], p.packageIds).slice(0, Number(p.limit) || 4) };
    case "CARE_HUB":
      return {
        skinConcerns: pickByIds(entities.skinConcerns ?? [], p.concernIds).slice(0, 6),
        categories: pickByIds(entities.categories ?? [], p.categoryIds).slice(0, 4),
        packages: (entities.packages ?? []).slice(0, 4),
        products: (entities.products ?? []).slice(0, Number(p.productLimit) || 4),
      };
    case "PROMO_STRIP":
      return {
        promoStrip: {
          text: p.text ?? "",
          items: Array.isArray(p.items) ? p.items : [],
          backgroundColor: p.backgroundColor,
          linkType: p.linkType,
          linkValue: p.linkValue,
        },
      };
    default:
      return undefined;
  }
}

export function formatCountdown(endsAt?: string | null): string | undefined {
  if (!endsAt) return undefined;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return undefined;
  const diff = Math.max(0, end - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** أقسام الفئات تُخفى في التطبيق إذا كان الهيرو الثابت يعرض فئات */
export function filterPreviewBlocks<T extends { type: string; isActive?: boolean; payload?: Record<string, unknown> }>(
  blocks: T[],
  options?: { showInactive?: boolean; hideHeroDupCategories?: boolean; heroCategoryCount?: number },
): T[] {
  const sorted = [...blocks].sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0));
  const withoutFixed = filterBuilderBlocks(sorted);
  const activeOnly = options?.showInactive ? withoutFixed : withoutFixed.filter((b) => b.isActive !== false);

  if (options?.hideHeroDupCategories === false) return activeOnly;

  const heroHasCats = (options?.heroCategoryCount ?? 0) > 0;

  if (!heroHasCats) return activeOnly;

  return activeOnly.filter(
    (b) => !["CATEGORY_GRID", "CATEGORY_TILES", "MAKEUP_CATEGORIES"].includes(b.type),
  );
}
