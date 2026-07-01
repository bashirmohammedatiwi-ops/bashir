import type { EditorEntities } from "./SectionPayloadEditor";

type Block = {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
};

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

/** يملأ معاينة الأقسام المخفية أو غير المحلّاة من بيانات الكيانات المحلية */
export function resolveBlockPreview(
  block: Block,
  entities: EditorEntities,
  apiResolved?: Record<string, unknown> | null,
): Record<string, unknown> | undefined {
  if (apiResolved) return apiResolved;

  const p = block.payload ?? {};

  switch (block.type) {
    case "HERO_BANNER":
      return {
        banners: pickByIds(entities.banners ?? [], p.bannerIds),
        categories: pickByIds(entities.categories ?? [], p.categoryIds),
      };
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      if (Array.isArray(p.productIds) && p.productIds.length) {
        return { products: pickByIds(entities.products ?? [], p.productIds) };
      }
      return { products: (entities.products ?? []).slice(0, Number(p.limit) || 4) };
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
      const b = pickOne(entities.banners ?? [], p.bannerId);
      return { banners: b ? [b] : [] };
    }
    case "BANNER_GRID_2":
    case "BANNER_GRID_3":
    case "BANNER_CAROUSEL":
      return { banners: pickByIds(entities.banners ?? [], p.bannerIds) };
    case "IMAGE_TILES":
      return { items: Array.isArray(p.items) ? p.items : [] };
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
