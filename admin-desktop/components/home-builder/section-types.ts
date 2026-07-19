export type SectionType =
  | "HERO_BANNER"
  | "CATEGORY_GRID"
  | "CATEGORY_TILES"
  | "MAKEUP_CATEGORIES"
  | "BANNER_FULL"
  | "BANNER_GRID_2"
  | "BANNER_GRID_3"
  | "BANNER_CAROUSEL"
  | "PRODUCT_LIST"
  | "FLASH_SALE"
  | "FEATURED_BRANDS"
  | "BRAND_SHOWCASE"
  | "PACKAGES"
  | "PROMO_STRIP"
  | "CUSTOM_BANNER"
  | "SKIN_CONCERNS"
  | "IMAGE_TILES"
  | "CIRCLE_TILES"
  | "ROUTINE_CAROUSEL"
  | "CARE_HUB";

export const SECTION_TYPES: {
  value: SectionType;
  label: string;
  group: string;
  description: string;
  icon: string;
  color: string;
  defaultPayload: Record<string, unknown>;
}[] = [
  {
    value: "HERO_BANNER",
    label: "بنر رئيسي + فئات",
    group: "أعلى الصفحة",
    description: "سلايدر كامل مع دوائر الأقسام المتداخلة (Nice One)",
    icon: "🏠",
    color: "#E1306C",
    defaultPayload: {
      bannerIds: [],
      categoryIds: [],
      maxItems: 8,
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "auto",
      showTitle: false,
    },
  },
  {
    value: "PROMO_STRIP",
    label: "شريط ترويجي",
    group: "أعلى الصفحة",
    description: "شريط ملون — شحن مجاني، عروض — مع نص متحرك ورابط ذكي",
    icon: "📢",
    color: "#FCE4EC",
    defaultPayload: { text: "", backgroundColor: "#FCE4EC", linkType: "", linkValue: "", link: "", marquee: true, icon: "🎁" },
  },
  {
    value: "SKIN_CONCERNS",
    label: "مشاكل البشرة",
    group: "فئات",
    description: "شرائح أفقية — حب الشباب، تصبغات، جفاف…",
    icon: "✨",
    color: "#FFF3E0",
    defaultPayload: { concernIds: [], maxItems: 10, display: "chips", showTitle: false },
  },
  {
    value: "FLASH_SALE",
    label: "أقوى العروض",
    group: "منتجات",
    description: "سلايدر أفقي مع عدّاد تنازلي",
    icon: "⚡",
    color: "#FF5722",
    defaultPayload: {
      filter: "promo",
      showViewAll: true,
      showTitle: true,
      limit: 12,
      productIds: [],
      categoryId: "",
      subcategoryId: "",
      tertiaryCategoryId: "",
      brandId: "",
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "carousel",
      productCardSize: "md",
    },
  },
  {
    value: "PRODUCT_LIST",
    label: "سلايدر منتجات",
    group: "منتجات",
    description: "قائمة منتجات أفقية حسب فلتر أو اختيار يدوي",
    icon: "🛍️",
    color: "#E3F2FD",
    defaultPayload: {
      filter: "bestSeller",
      showViewAll: true,
      showTitle: false,
      limit: 12,
      productIds: [],
      categoryId: "",
      subcategoryId: "",
      tertiaryCategoryId: "",
      brandId: "",
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "carousel",
      productCardSize: "md",
    },
  },
  {
    value: "PACKAGES",
    label: "الباقات",
    group: "منتجات",
    description: "باقات ومجموعات العناية",
    icon: "🎁",
    color: "#F3E5F5",
    defaultPayload: { packageIds: [], kind: "all", cardSize: "md", cardSizes: {}, sectionLayout: "carousel", showTitle: false },
  },
  {
    value: "BANNER_FULL",
    label: "بنر عريض",
    group: "بنرات",
    description: "بنر واحد بعرض الشاشة",
    icon: "🖼️",
    color: "#E8F5E9",
    defaultPayload: { bannerId: "", cardSize: "wide", sectionLayout: "auto", showTitle: false },
  },
  {
    value: "BANNER_GRID_2",
    label: "شبكة بنرات (2)",
    group: "بنرات",
    description: "بنران جنباً إلى جنب مع نص خصم",
    icon: "▦",
    color: "#E0F7FA",
    defaultPayload: {
      bannerIds: [],
      items: [],
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "asymmetric",
      showTitle: false,
    },
  },
  {
    value: "BANNER_GRID_3",
    label: "شبكة بنرات (3)",
    group: "بنرات",
    description: "ثلاثة بنرات أفقية",
    icon: "▦",
    color: "#E0F7FA",
    defaultPayload: {
      bannerIds: [],
      items: [],
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "asymmetric",
      showTitle: false,
    },
  },
  {
    value: "BANNER_CAROUSEL",
    label: "سلايدر بنرات",
    group: "بنرات",
    description: "بنرات تمرير أفقي (ماركات/عروض)",
    icon: "🎠",
    color: "#FFF8E1",
    defaultPayload: {
      bannerIds: [],
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "carousel",
      showTitle: false,
    },
  },
  {
    value: "CUSTOM_BANNER",
    label: "بنر مخصص",
    group: "بنرات",
    description: "بنر واحد قابل للتخصيص",
    icon: "🎨",
    color: "#F1F8E9",
    defaultPayload: { bannerId: "", cardSize: "wide", sectionLayout: "auto", showTitle: false },
  },
  {
    value: "CATEGORY_GRID",
    label: "شبكة فئات (دوائر)",
    group: "فئات",
    description: "صف دوائر أفقي — بديل للفئات في الهيرو",
    icon: "⭕",
    color: "#E8EAF6",
    defaultPayload: {
      categoryIds: [],
      maxItems: 8,
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "varied",
      showTitle: false,
    },
  },
  {
    value: "CATEGORY_TILES",
    label: "بلاطات فئات",
    group: "فئات",
    description: "فئات بصور أفقية (هايلايتر، بلاشر…)",
    icon: "🧩",
    color: "#E1F5FE",
    defaultPayload: {
      categoryIds: [],
      maxItems: 6,
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "varied",
      showTitle: false,
    },
  },
  {
    value: "MAKEUP_CATEGORIES",
    label: "أقسام المكياج",
    group: "فئات",
    description: "بطاقات وردية (وجه، شفاه، عيون)",
    icon: "💄",
    color: "#FCE4EC",
    defaultPayload: {
      categoryIds: [],
      accentColor: "#FCE4EC",
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "varied",
      showTitle: false,
    },
  },
  {
    value: "FEATURED_BRANDS",
    label: "براندات (شعارات)",
    group: "براندات",
    description: "صف أفقي من شعارات البراندات",
    icon: "🏷️",
    color: "#FAFAFA",
    defaultPayload: {
      brandIds: [],
      layout: "logos",
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "varied",
      showTitle: false,
    },
  },
  {
    value: "BRAND_SHOWCASE",
    label: "براندات (بطاقات)",
    group: "براندات",
    description: "بطاقات براند مع خصم",
    icon: "💎",
    color: "#E8F4FC",
    defaultPayload: {
      brandIds: [],
      layout: "cards",
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "varied",
      showTitle: false,
    },
  },
  {
    value: "IMAGE_TILES",
    label: "بطاقات صور مخصصة",
    group: "بنرات",
    description: "شبكة بطاقات — صورة + عنوان + رابط لأي منتج/قسم/براند",
    icon: "🧱",
    color: "#FFF3E0",
    defaultPayload: {
      columns: 2,
      shape: "rect",
      items: [],
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "mosaic",
      showTitle: false,
    },
  },
  {
    value: "CIRCLE_TILES",
    label: "دوائر مخصصة",
    group: "فئات",
    description: "صف أو شبكة دوائر بصور وروابط حرة",
    icon: "⭕",
    color: "#F3E5F5",
    defaultPayload: {
      items: [],
      maxItems: 12,
      cardSize: "md",
      cardSizes: {},
      sectionLayout: "row",
      showTitle: false,
    },
  },
  {
    value: "ROUTINE_CAROUSEL",
    label: "روتين البشرة",
    group: "منتجات",
    description: "باقات روتين صباحي / مسائي",
    icon: "🌅",
    color: "#E8F5E9",
    defaultPayload: {
      kind: "ROUTINE_MORNING",
      packageIds: [],
      limit: 8,
      cardSize: "md",
      sectionLayout: "carousel",
      showViewAll: true,
      showTitle: true,
    },
  },
  {
    value: "CARE_HUB",
    label: "مركز العناية",
    group: "فئات",
    description: "مشاكل بشرة + روتين + فئات عناية + منتجات",
    icon: "💆",
    color: "#E0F2F1",
    defaultPayload: {
      concernIds: [],
      routineKinds: ["ROUTINE_MORNING", "ROUTINE_EVENING"],
      categoryIds: [],
      morningPackageIds: [],
      eveningPackageIds: [],
      productFilter: "featured",
      productLimit: 8,
      layout: "stacked",
      showTitle: true,
    },
  },
];

export const PRODUCT_FILTERS = [
  { value: "promo", label: "عروض / تخفيضات" },
  { value: "new", label: "وصل حديثاً" },
  { value: "bestSeller", label: "الأكثر مبيعاً" },
  { value: "featured", label: "منتجات مختارة" },
];

export const LINK_TYPES = [
  { value: "product", label: "منتج" },
  { value: "category", label: "قسم رئيسي" },
  { value: "subcategory", label: "قسم فرعي" },
  { value: "tertiary", label: "قسم ثانوي" },
  { value: "brand", label: "براند" },
  { value: "search", label: "بحث" },
  { value: "offers", label: "صفحة العروض" },
  { value: "products", label: "قائمة منتجات" },
  { value: "url", label: "مسار داخل التطبيق" },
];

export function labelForType(type: string) {
  return SECTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function metaForType(type: string) {
  return SECTION_TYPES.find((t) => t.value === type);
}

export function normalizePayload(type: SectionType, payload: Record<string, unknown>) {
  const copy = { ...payload };
  if (type === "MAKEUP_CATEGORIES" && copy.accentColor && !copy.backgroundColor) {
    copy.backgroundColor = copy.accentColor;
  }
  return copy;
}
