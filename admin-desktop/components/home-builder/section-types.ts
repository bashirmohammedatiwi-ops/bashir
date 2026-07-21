/** ثابت في أعلى التطبيق — يُدار من صفحات البنرات والفئات */
export const FIXED_TOP_SECTION_TYPES = ["HERO_BANNER"] as const;

export function isFixedTopSection(type: string) {
  return (FIXED_TOP_SECTION_TYPES as readonly string[]).includes(type);
}

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
  | "IMAGE_MARQUEE"
  | "CIRCLE_TILES"
  | "ROUTINE_CAROUSEL"
  | "CARE_HUB"
  | "SECTION_GROUP"
  | "MEDIA_GALLERY";

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
    label: "رأس الصفحة",
    group: "أعلى الصفحة",
    description: "بنر صورة + أيقونات الفئات (4×2) — اختر البنرات والفئات من الأسفل",
    icon: "🏠",
    color: "#E1306C",
    defaultPayload: {
      bannerIds: [],
      categoryIds: [],
      maxItems: 8,
      adSlot: "hero",
      cardSize: "hero",
      cardSizes: {},
      sectionLayout: "auto",
      showTitle: false,
    },
  },
  {
    value: "PROMO_STRIP",
    label: "نشرة / شريط ترويج",
    group: "أعلى الصفحة",
    description: "نشرة إخبارية متحركة أو شريط عروض — تحكم كامل بالنص والسرعة والألوان والربط",
    icon: "📰",
    color: "#FCE4EC",
    defaultPayload: {
      variant: "news",
      text: "",
      items: [],
      label: "عاجل",
      separator: "   •   ",
      backgroundColor: "#FCE4EC",
      textColor: "#2A2826",
      linkType: "",
      linkValue: "",
      link: "",
      marquee: true,
      marqueeSpeed: 5,
      icon: "🎁",
      showIcon: true,
    },
  },
  {
    value: "SKIN_CONCERNS",
    label: "مشاكل البشرة",
    group: "فئات",
    description: "شرائح أفقية — حب الشباب، تصبغات، جفاف…",
    icon: "✨",
    color: "#FFF3E0",
    defaultPayload: { concernIds: [], maxItems: 10, display: "chips", showTitle: true },
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
      viewAllQuery: "",
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
      showTitle: true,
      limit: 12,
      productIds: [],
      categoryId: "",
      subcategoryId: "",
      tertiaryCategoryId: "",
      brandId: "",
      viewAllQuery: "",
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
    defaultPayload: { packageIds: [], kind: "all", cardSize: "md", cardSizes: {}, sectionLayout: "carousel", showTitle: true, showViewAll: true },
  },
  {
    value: "BANNER_FULL",
    label: "بنر عريض",
    group: "بنرات",
    description: "بنر واحد بعرض الشاشة",
    icon: "🖼️",
    color: "#E8F5E9",
    defaultPayload: {
      bannerId: "",
      source: "banner",
      adSlot: "wide",
      cardSize: "wide",
      sectionLayout: "auto",
      showTitle: false,
      fullBleed: false,
    },
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
      adSlot: "wide169",
      cardSize: "wide169",
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
    defaultPayload: {
      bannerId: "",
      source: "banner",
      adSlot: "wide",
      cardSize: "wide",
      sectionLayout: "auto",
      showTitle: false,
      fullBleed: false,
    },
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
      categoryItems: [],
      maxItems: 8,
      showViewAll: true,
      viewAllQuery: "/categories",
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
      categoryItems: [],
      maxItems: 6,
      showViewAll: true,
      viewAllQuery: "/categories",
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
      categoryItems: [],
      accentColor: "#FCE4EC",
      showViewAll: true,
      viewAllQuery: "/categories",
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
      showViewAll: true,
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
      showViewAll: true,
    },
  },
  {
    value: "IMAGE_MARQUEE",
    label: "صور متحركة",
    group: "بنرات",
    description: "شريط صور يتحرك أفقياً — مثل النشرة الإخبارية — مع ربط لكل صورة",
    icon: "🎞️",
    color: "#FFF8E1",
    defaultPayload: {
      items: [],
      adSlot: "wide169",
      cardSize: "wide169",
      sectionLayout: "marquee",
      showTitle: false,
      marqueeSpeed: 5,
      marqueeGap: 12,
      imageHeight: 120,
      fullBleed: false,
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
  {
    value: "SECTION_GROUP",
    label: "إطار مجموعة أقسام",
    group: "تصميم",
    description: "ضع عدة أقسام داخل إطار بخلفية ملونة — مثالي لتجميع العروض أو العناية",
    icon: "🖼️",
    color: "#FFF8E7",
    defaultPayload: {
      backgroundColor: "#F8F4EF",
      titleColor: "#2A2826",
      borderColor: "",
      borderRadius: 24,
      paddingTop: 20,
      paddingBottom: 20,
      paddingH: 12,
      shadow: true,
      showTitle: true,
      children: [
        {
          type: "PRODUCT_LIST",
          title: "منتجات مختارة",
          payload: { filter: "featured", limit: 8, showViewAll: true },
        },
      ],
    },
  },
  {
    value: "MEDIA_GALLERY",
    label: "معرض صور",
    group: "تصميم",
    description: "صور ثابتة أو متحركة — تمرير يدوي، مارquee، شبكة، أو عمود — بأحجام وأشكال مختلفة",
    icon: "🎞️",
    color: "#EDE7F6",
    defaultPayload: {
      display: "scroll",
      shape: "rounded",
      size: "md",
      columns: 3,
      gap: 12,
      height: 140,
      marqueeSpeed: 5,
      showTitle: true,
      items: [],
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

/** أنواع يمكن إضافتها من بناء الصفحة — بدون الرأس الثابت */
export const BUILDER_SECTION_TYPES = SECTION_TYPES.filter((t) => !isFixedTopSection(t.value));
