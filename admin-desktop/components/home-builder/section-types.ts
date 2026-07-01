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
  | "CUSTOM_BANNER";

export const SECTION_TYPES: {
  value: SectionType;
  label: string;
  group: string;
  description: string;
  defaultPayload: Record<string, unknown>;
}[] = [
  {
    value: "HERO_BANNER",
    label: "بنر رئيسي + فئات",
    group: "أعلى الصفحة",
    description: "سلايدر كامل مع دوائر الأقسام المتداخلة (Nice One)",
    defaultPayload: { bannerIds: [], maxItems: 8, showQuickCategories: true },
  },
  {
    value: "FLASH_SALE",
    label: "أقوى العروض",
    group: "منتجات",
    description: "سلايدر أفقي مع عدّاد تنازلي",
    defaultPayload: { filter: "promo", showViewAll: true, limit: 12 },
  },
  {
    value: "BANNER_FULL",
    label: "بنر عريض",
    group: "بنرات",
    description: "بنر واحد بعرض الشاشة",
    defaultPayload: { bannerId: "" },
  },
  {
    value: "BANNER_GRID_2",
    label: "شبكة بنرات (2)",
    group: "بنرات",
    description: "بنران جنباً إلى جنب",
    defaultPayload: { bannerIds: [], items: [] },
  },
  {
    value: "BANNER_GRID_3",
    label: "شبكة بنرات (3)",
    group: "بنرات",
    description: "ثلاثة بنرات أفقية",
    defaultPayload: { bannerIds: [] },
  },
  {
    value: "BANNER_CAROUSEL",
    label: "سلايدر بنرات",
    group: "بنرات",
    description: "بنرات تمرير أفقي (ماركات/عروض)",
    defaultPayload: { bannerIds: [] },
  },
  {
    value: "CATEGORY_TILES",
    label: "بلاطات فئات",
    group: "فئات",
    description: "فئات بصور أفقية (هايلايتر، بلاشر…)",
    defaultPayload: { categoryIds: [], maxItems: 6 },
  },
  {
    value: "MAKEUP_CATEGORIES",
    label: "أقسام المكياج",
    group: "فئات",
    description: "بطاقات وردية (وجه، شفاه، عيون)",
    defaultPayload: { categoryIds: [], accentColor: "#FCE4EC" },
  },
  {
    value: "PRODUCT_LIST",
    label: "سلايدر منتجات",
    group: "منتجات",
    description: "قائمة منتجات أفقية حسب فلتر",
    defaultPayload: { filter: "bestSeller", showViewAll: true, limit: 12 },
  },
  {
    value: "FEATURED_BRANDS",
    label: "براندات (شعارات)",
    group: "براندات",
    description: "صف أفقي من شعارات البراندات",
    defaultPayload: { brandIds: [], layout: "logos" },
  },
  {
    value: "BRAND_SHOWCASE",
    label: "براندات (بطاقات)",
    group: "براندات",
    description: "بطاقات براند مع خصم",
    defaultPayload: { brandIds: [], layout: "cards" },
  },
  {
    value: "PACKAGES",
    label: "الباقات",
    group: "منتجات",
    description: "باقات ومجموعات العناية",
    defaultPayload: { packageIds: [] },
  },
  {
    value: "PROMO_STRIP",
    label: "شريط ترويجي",
    group: "أخرى",
    description: "شريط نصي ملون",
    defaultPayload: { text: "", backgroundColor: "#FCE4EC", link: "" },
  },
  {
    value: "CUSTOM_BANNER",
    label: "بنر مخصص",
    group: "بنرات",
    description: "بنر واحد قابل للتخصيص",
    defaultPayload: { bannerId: "" },
  },
];

export const PRODUCT_FILTERS = [
  { value: "promo", label: "عروض / تخفيضات" },
  { value: "new", label: "وصل حديثاً" },
  { value: "bestSeller", label: "الأكثر مبيعاً" },
  { value: "featured", label: "منتجات مختارة" },
];

export const LINK_TYPES = [
  { value: "url", label: "رابط خارجي" },
  { value: "product", label: "منتج" },
  { value: "category", label: "قسم" },
  { value: "brand", label: "براند" },
  { value: "search", label: "بحث" },
  { value: "offers", label: "صفحة العروض" },
  { value: "products", label: "قائمة منتجات" },
];

export function labelForType(type: string) {
  return SECTION_TYPES.find((t) => t.value === type)?.label ?? type;
}
