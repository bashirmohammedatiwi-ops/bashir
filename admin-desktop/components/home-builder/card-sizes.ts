/** أحجام البطاقات الموحّدة — تُستخدم في لوحة التحكم والتطبيق */
export type CardSizeId = "xs" | "sm" | "md" | "lg" | "xl" | "wide" | "tall" | "hero";

export type SectionLayoutId =
  | "auto"
  | "uniform"
  | "varied"
  | "asymmetric"
  | "mosaic"
  | "carousel"
  | "marquee";

export type CardSizeContext =
  | "category"
  | "brand"
  | "banner"
  | "image"
  | "product"
  | "package";

export type CardSizeDef = {
  value: CardSizeId;
  label: string;
  short: string;
  description: string;
  previewW: number;
  previewH: number;
  contexts: CardSizeContext[];
};

export const CARD_SIZES: CardSizeDef[] = [
  {
    value: "xs",
    label: "صغير جداً",
    short: "XS",
    description: "بلاطة مدمجة",
    previewW: 44,
    previewH: 54,
    contexts: ["category", "brand", "image", "product"],
  },
  {
    value: "sm",
    label: "صغير",
    short: "S",
    description: "مناسب للصفوف الكثيفة",
    previewW: 52,
    previewH: 64,
    contexts: ["category", "brand", "image", "product", "package"],
  },
  {
    value: "md",
    label: "متوسط",
    short: "M",
    description: "الحجم الافتراضي المتوازن",
    previewW: 58,
    previewH: 72,
    contexts: ["category", "brand", "image", "product", "package", "banner"],
  },
  {
    value: "lg",
    label: "كبير",
    short: "L",
    description: "لإبراز عنصر مهم",
    previewW: 66,
    previewH: 80,
    contexts: ["category", "brand", "image", "product", "package", "banner"],
  },
  {
    value: "xl",
    label: "كبير جداً",
    short: "XL",
    description: "بطاقة بارزة",
    previewW: 74,
    previewH: 88,
    contexts: ["category", "brand", "image", "product", "banner"],
  },
  {
    value: "wide",
    label: "عريض",
    short: "▬",
    description: "بانر أفقي أو بطاقة عريضة",
    previewW: 88,
    previewH: 48,
    contexts: ["banner", "image", "category"],
  },
  {
    value: "tall",
    label: "طويل",
    short: "▮",
    description: "بطاقة عمودية مميزة",
    previewW: 48,
    previewH: 88,
    contexts: ["category", "brand", "image", "banner"],
  },
  {
    value: "hero",
    label: "بطل",
    short: "★",
    description: "بانر كامل العرض",
    previewW: 96,
    previewH: 40,
    contexts: ["banner", "image"],
  },
];

export const SECTION_LAYOUTS: {
  value: SectionLayoutId;
  label: string;
  description: string;
  types: string[];
}[] = [
  {
    value: "auto",
    label: "تلقائي",
    description: "يختار التطبيق أفضل تخطيط حسب المحتوى",
    types: ["*"],
  },
  {
    value: "uniform",
    label: "موحّد",
    description: "كل البطاقات بنفس الحجم الافتراضي",
    types: ["CATEGORY_TILES", "MAKEUP_CATEGORIES", "FEATURED_BRANDS", "BRAND_SHOWCASE", "IMAGE_TILES", "BANNER_CAROUSEL"],
  },
  {
    value: "varied",
    label: "متنوع",
    description: "أحجام مختلفة تلقائياً (Nice One)",
    types: ["CATEGORY_TILES", "MAKEUP_CATEGORIES", "FEATURED_BRANDS", "BRAND_SHOWCASE", "BANNER_CAROUSEL"],
  },
  {
    value: "asymmetric",
    label: "غير متماثل",
    description: "كبير + صغير جنباً إلى جنب",
    types: ["BANNER_GRID_2", "BANNER_GRID_3", "IMAGE_TILES"],
  },
  {
    value: "mosaic",
    label: "فسيفساء",
    description: "بانر عريض مع بطاقات جانبية",
    types: ["IMAGE_TILES"],
  },
  {
    value: "carousel",
    label: "سلايدر",
    description: "تمرير أفقي بأحجام متناوبة",
    types: ["BANNER_CAROUSEL", "PRODUCT_LIST", "PACKAGES"],
  },
  {
    value: "marquee",
    label: "متحرك",
    description: "صور تتحرك أفقياً مثل النشرة",
    types: ["IMAGE_MARQUEE"],
  },
];

export function sizesForContext(ctx: CardSizeContext): CardSizeDef[] {
  return CARD_SIZES.filter((s) => s.contexts.includes(ctx));
}

export function labelForCardSize(id?: string | null) {
  return CARD_SIZES.find((s) => s.value === id)?.label ?? "متوسط";
}

export function layoutsForType(type: string) {
  return SECTION_LAYOUTS.filter((l) => l.types.includes("*") || l.types.includes(type));
}

export function defaultCardSizeForType(type: string): CardSizeId {
  if (type.includes("BANNER")) return "wide";
  if (type.includes("BRAND")) return "md";
  if (type.includes("PRODUCT") || type === "FLASH_SALE") return "md";
  return "md";
}

export function defaultLayoutForType(type: string): SectionLayoutId {
  if (type === "BANNER_GRID_2" || type === "BANNER_GRID_3") return "asymmetric";
  if (type === "IMAGE_TILES") return "mosaic";
  if (type === "BANNER_CAROUSEL") return "carousel";
  if (type.startsWith("CATEGORY") || type.includes("BRAND")) return "varied";
  return "auto";
}

/** أبعاد البطاقة بالبكسل للتطبيق */
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

export function resolveEntityCardSize(
  entityId: string,
  payload: Record<string, unknown>,
  index?: number,
): CardSizeId {
  const map = (payload.cardSizes as Record<string, string>) ?? {};
  if (map[entityId]) return map[entityId] as CardSizeId;
  const list = payload.itemSizes as { cardSize?: string }[] | undefined;
  if (index != null && list?.[index]?.cardSize) return list[index].cardSize as CardSizeId;
  const def = (payload.cardSize as CardSizeId) ?? defaultCardSizeForType("");
  if (payload.sectionLayout === "varied" && index != null) {
    const cycle: CardSizeId[] = ["sm", "lg", "md", "xl", "md", "tall"];
    return cycle[index % cycle.length];
  }
  return def;
}
