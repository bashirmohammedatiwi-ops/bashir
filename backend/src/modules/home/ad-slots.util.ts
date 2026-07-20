/** مقاسات الإعلانات — يطابق admin ad-slots.ts */
export type AdSlotId =
  | "fullBleed"
  | "stripUltra"
  | "ultraWide"
  | "wide169"
  | "wide21"
  | "hero"
  | "wide"
  | "standard43"
  | "square"
  | "portrait34"
  | "portrait23"
  | "tall"
  | "compact"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

type AdSlotDef = {
  id: AdSlotId;
  aspect: number;
  fullBleed?: boolean;
};

const AD_SLOTS: AdSlotDef[] = [
  { id: "fullBleed", aspect: 2.05, fullBleed: true },
  { id: "stripUltra", aspect: 3 },
  { id: "ultraWide", aspect: 2.33 },
  { id: "wide169", aspect: 1.78 },
  { id: "wide21", aspect: 2 },
  { id: "hero", aspect: 2.08 },
  { id: "wide", aspect: 2.35 },
  { id: "standard43", aspect: 1.33 },
  { id: "square", aspect: 1 },
  { id: "portrait34", aspect: 0.75 },
  { id: "portrait23", aspect: 0.67 },
  { id: "tall", aspect: 0.72 },
  { id: "compact", aspect: 1.05 },
  { id: "xs", aspect: 1.15 },
  { id: "sm", aspect: 1.25 },
  { id: "md", aspect: 1.35 },
  { id: "lg", aspect: 1.45 },
  { id: "xl", aspect: 1.55 },
];

const SLOT_MAP = new Map(AD_SLOTS.map((s) => [s.id, s]));

/** أبعاد البطاقات القديمة — للمنتجات والفئات */
export const CARD_SIZE_DIMS: Record<
  string,
  { w: number; h: number; bannerAspect?: number; productW?: number }
> = {
  xs: { w: 88, h: 108, bannerAspect: 1.15, productW: 136 },
  sm: { w: 104, h: 128, bannerAspect: 1.25, productW: 148 },
  md: { w: 116, h: 142, bannerAspect: 1.35, productW: 158 },
  lg: { w: 132, h: 158, bannerAspect: 1.45, productW: 168 },
  xl: { w: 148, h: 172, bannerAspect: 1.55, productW: 178 },
  wide: { w: 168, h: 112, bannerAspect: 2.35, productW: 158 },
  tall: { w: 108, h: 176, bannerAspect: 0.72, productW: 148 },
  hero: { w: 0, h: 200, bannerAspect: 2.08, productW: 158 },
  fullBleed: { w: 0, h: 0, bannerAspect: 2.05, productW: 158 },
  stripUltra: { w: 0, h: 0, bannerAspect: 3, productW: 158 },
  ultraWide: { w: 0, h: 0, bannerAspect: 2.33, productW: 158 },
  wide169: { w: 0, h: 0, bannerAspect: 1.78, productW: 158 },
  wide21: { w: 0, h: 0, bannerAspect: 2, productW: 158 },
  standard43: { w: 0, h: 0, bannerAspect: 1.33, productW: 158 },
  square: { w: 0, h: 0, bannerAspect: 1, productW: 158 },
  portrait34: { w: 0, h: 0, bannerAspect: 0.75, productW: 148 },
  portrait23: { w: 0, h: 0, bannerAspect: 0.67, productW: 148 },
  compact: { w: 0, h: 0, bannerAspect: 1.05, productW: 148 },
};

const VARIED_CYCLE: string[] = ["sm", "lg", "md", "xl", "md", "tall"];

export function resolveCardSize(
  payload: Record<string, unknown>,
  entityId?: string,
  index?: number,
  itemCardSize?: string,
): string {
  if (itemCardSize) return itemCardSize;
  const map = (payload.cardSizes as Record<string, string>) ?? {};
  if (entityId && map[entityId]) return map[entityId];
  const def = (payload.adSlot as string) ?? (payload.cardSize as string) ?? "md";
  if (payload.sectionLayout === "varied" && index != null) {
    return VARIED_CYCLE[index % VARIED_CYCLE.length];
  }
  return def;
}

export function resolveAdSlotFromPayload(payload: Record<string, unknown>) {
  const customAspect =
    typeof payload.bannerAspect === "number" && payload.bannerAspect > 0
      ? payload.bannerAspect
      : undefined;
  const slotId =
    (payload.adSlot as string) ??
    (payload.cardSize as string) ??
    "wide";
  const slot = SLOT_MAP.get(slotId as AdSlotId) ?? SLOT_MAP.get("wide")!;
  const fullBleed =
    payload.fullBleed === true || slot.fullBleed === true || slotId === "fullBleed";
  return {
    adSlot: slot.id,
    aspect: customAspect ?? slot.aspect,
    fullBleed,
  };
}

export function bannerAspectForSize(sizeId: string): number {
  const slot = SLOT_MAP.get(sizeId as AdSlotId);
  if (slot) return slot.aspect;
  return CARD_SIZE_DIMS[sizeId]?.bannerAspect ?? 1.35;
}

export function withCardSize<T extends Record<string, unknown>>(
  item: T,
  cardSize: string,
): T & { cardSize: string } {
  return { ...item, cardSize };
}

export function sectionStyleFromPayload(payload: Payload) {
  const ad = resolveAdSlotFromPayload(payload);
  return {
    sectionLayout: (payload.sectionLayout as string) ?? undefined,
    cardSize: (payload.cardSize as string) ?? undefined,
    adSlot: ad.adSlot,
    bannerAspect: ad.aspect,
    fullBleed: ad.fullBleed,
    showTitle: payload.showTitle === true,
    paddingTop: typeof payload.paddingTop === "number" ? payload.paddingTop : undefined,
    paddingBottom: typeof payload.paddingBottom === "number" ? payload.paddingBottom : undefined,
    productCardSize: (payload.productCardSize as string) ?? undefined,
    marqueeSpeed:
      typeof payload.marqueeSpeed === "number" ? payload.marqueeSpeed : undefined,
    marqueeGap: typeof payload.marqueeGap === "number" ? payload.marqueeGap : undefined,
    imageHeight: typeof payload.imageHeight === "number" ? payload.imageHeight : undefined,
  };
}

type Payload = Record<string, unknown>;
