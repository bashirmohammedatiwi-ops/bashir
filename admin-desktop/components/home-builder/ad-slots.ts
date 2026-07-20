/** مقاسات الإعلانات — نسب العرض/الارتفاع + عرض الشاشة */
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

export type AdSlotDef = {
  id: AdSlotId;
  label: string;
  ratioLabel: string;
  /** عرض ÷ ارتفاع */
  aspect: number;
  fullBleed?: boolean;
  previewW: number;
  previewH: number;
  description: string;
};

export const AD_SLOTS: AdSlotDef[] = [
  {
    id: "fullBleed",
    label: "عرض الشاشة",
    ratioLabel: "100%",
    aspect: 2.05,
    fullBleed: true,
    previewW: 104,
    previewH: 44,
    description: "صورة من حافة إلى حافة بدون هوامش",
  },
  {
    id: "stripUltra",
    label: "شريط فائق",
    ratioLabel: "3:1",
    aspect: 3,
    previewW: 96,
    previewH: 32,
    description: "شريط إعلاني رفيع جداً",
  },
  {
    id: "ultraWide",
    label: "سينمائي",
    ratioLabel: "21:9",
    aspect: 2.33,
    previewW: 96,
    previewH: 40,
    description: "بانر سينمائي عريض",
  },
  {
    id: "wide169",
    label: "HD",
    ratioLabel: "16:9",
    aspect: 1.78,
    previewW: 88,
    previewH: 50,
    description: "نسبة فيديو قياسية",
  },
  {
    id: "wide21",
    label: "بانر 2:1",
    ratioLabel: "2:1",
    aspect: 2,
    previewW: 88,
    previewH: 44,
    description: "بانر أفقي متوازن",
  },
  {
    id: "hero",
    label: "بطل",
    ratioLabel: "2.08:1",
    aspect: 2.08,
    previewW: 96,
    previewH: 46,
    description: "البانر الرئيسي في أعلى الصفحة",
  },
  {
    id: "wide",
    label: "عريض",
    ratioLabel: "2.35:1",
    aspect: 2.35,
    previewW: 88,
    previewH: 38,
    description: "بانر عروض أفقي",
  },
  {
    id: "standard43",
    label: "قياسي",
    ratioLabel: "4:3",
    aspect: 1.33,
    previewW: 72,
    previewH: 54,
    description: "بطاقة إعلان متوازنة",
  },
  {
    id: "square",
    label: "مربع",
    ratioLabel: "1:1",
    aspect: 1,
    previewW: 56,
    previewH: 56,
    description: "إعلان مربع",
  },
  {
    id: "portrait34",
    label: "عمودي 3:4",
    ratioLabel: "3:4",
    aspect: 0.75,
    previewW: 48,
    previewH: 64,
    description: "بطاقة عمودية",
  },
  {
    id: "portrait23",
    label: "عمودي 2:3",
    ratioLabel: "2:3",
    aspect: 0.67,
    previewW: 44,
    previewH: 66,
    description: "ستوري / عمودي طويل",
  },
  {
    id: "tall",
    label: "طويل",
    ratioLabel: "0.72:1",
    aspect: 0.72,
    previewW: 44,
    previewH: 72,
    description: "زوج بنرات عمودي",
  },
  {
    id: "compact",
    label: "مدمج",
    ratioLabel: "1.05:1",
    aspect: 1.05,
    previewW: 52,
    previewH: 50,
    description: "ثلاث بنرات في صف",
  },
  {
    id: "xs",
    label: "XS",
    ratioLabel: "1.15:1",
    aspect: 1.15,
    previewW: 44,
    previewH: 38,
    description: "صغير جداً",
  },
  {
    id: "sm",
    label: "S",
    ratioLabel: "1.25:1",
    aspect: 1.25,
    previewW: 48,
    previewH: 38,
    description: "صغير",
  },
  {
    id: "md",
    label: "M",
    ratioLabel: "1.35:1",
    aspect: 1.35,
    previewW: 52,
    previewH: 38,
    description: "متوسط",
  },
  {
    id: "lg",
    label: "L",
    ratioLabel: "1.45:1",
    aspect: 1.45,
    previewW: 56,
    previewH: 38,
    description: "كبير",
  },
  {
    id: "xl",
    label: "XL",
    ratioLabel: "1.55:1",
    aspect: 1.55,
    previewW: 60,
    previewH: 38,
    description: "كبير جداً",
  },
];

const SLOT_MAP = new Map(AD_SLOTS.map((s) => [s.id, s]));

export function adSlotById(id?: string | null): AdSlotDef | undefined {
  if (!id) return undefined;
  return SLOT_MAP.get(id as AdSlotId);
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
  const slot = adSlotById(slotId) ?? adSlotById("wide")!;
  const fullBleed =
    payload.fullBleed === true || slot.fullBleed === true || slotId === "fullBleed";
  return {
    adSlot: slot.id,
    aspect: customAspect ?? slot.aspect,
    fullBleed,
    ratioLabel: slot.ratioLabel,
  };
}

export function defaultAdSlotForType(type: string): AdSlotId {
  if (type === "HERO_BANNER") return "hero";
  if (type === "BANNER_FULL" || type === "CUSTOM_BANNER") return "wide";
  if (type === "BANNER_CAROUSEL") return "wide169";
  if (type === "BANNER_GRID_2") return "tall";
  if (type === "BANNER_GRID_3") return "compact";
  if (type === "IMAGE_MARQUEE") return "wide169";
  return "wide";
}

export function labelForAdSlot(id?: string | null) {
  const slot = adSlotById(id);
  if (!slot) return "عريض";
  return `${slot.label} (${slot.ratioLabel})`;
}
