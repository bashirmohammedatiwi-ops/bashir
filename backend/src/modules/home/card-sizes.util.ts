/** أحجام البطاقات — يُستخدم في الـ resolver والتطبيق */
export type CardSizeId = "xs" | "sm" | "md" | "lg" | "xl" | "wide" | "tall" | "hero";

export const CARD_SIZE_DIMS: Record<
  CardSizeId,
  { w: number; h: number; bannerAspect?: number; productW?: number }
> = {
  xs: { w: 88, h: 108, bannerAspect: 1.15, productW: 136 },
  sm: { w: 104, h: 128, bannerAspect: 1.25, productW: 148 },
  md: { w: 116, h: 142, bannerAspect: 1.35, productW: 158 },
  lg: { w: 132, h: 158, bannerAspect: 1.45, productW: 168 },
  xl: { w: 148, h: 172, bannerAspect: 1.55, productW: 178 },
  wide: { w: 168, h: 112, bannerAspect: 2.35, productW: 158 },
  tall: { w: 108, h: 176, bannerAspect: 0.72, productW: 148 },
  hero: { w: 0, h: 200, bannerAspect: 2.35, productW: 158 },
};

const VARIED_CYCLE: CardSizeId[] = ["sm", "lg", "md", "xl", "md", "tall"];

export function resolveCardSize(
  payload: Record<string, unknown>,
  entityId?: string,
  index?: number,
  itemCardSize?: string,
): CardSizeId {
  if (itemCardSize) return itemCardSize as CardSizeId;
  const map = (payload.cardSizes as Record<string, string>) ?? {};
  if (entityId && map[entityId]) return map[entityId] as CardSizeId;
  const def = (payload.cardSize as CardSizeId) ?? "md";
  if (payload.sectionLayout === "varied" && index != null) {
    return VARIED_CYCLE[index % VARIED_CYCLE.length];
  }
  return def;
}

export function withCardSize<T extends Record<string, unknown>>(
  item: T,
  cardSize: CardSizeId,
): T & { cardSize: CardSizeId } {
  return { ...item, cardSize };
}

export function sectionStyleFromPayload(payload: Payload) {
  return {
    sectionLayout: (payload.sectionLayout as string) ?? undefined,
    cardSize: (payload.cardSize as string) ?? undefined,
    showTitle: payload.showTitle === true,
    paddingTop: typeof payload.paddingTop === "number" ? payload.paddingTop : undefined,
    paddingBottom: typeof payload.paddingBottom === "number" ? payload.paddingBottom : undefined,
    productCardSize: (payload.productCardSize as string) ?? undefined,
  };
}

type Payload = Record<string, unknown>;
