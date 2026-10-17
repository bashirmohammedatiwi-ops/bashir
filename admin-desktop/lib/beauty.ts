/** أنواع البشرة (نفس قيم السيرفر والتطبيق). */
export const SKIN_TYPES = [
  { value: "dry", label: "جافة", icon: "🏜️" },
  { value: "oily", label: "دهنية", icon: "💧" },
  { value: "combination", label: "مختلطة", icon: "🌗" },
  { value: "normal", label: "عادية", icon: "🌸" },
  { value: "sensitive", label: "حساسة", icon: "🌿" },
] as const;

export const skinTypeLabel = (v: string) => SKIN_TYPES.find((t) => t.value === v)?.label ?? v;

/** أسماء خطوات شائعة للروتين (اقتراحات سريعة). */
export const STEP_TITLES = [
  "غسول",
  "مزيل مكياج",
  "تونر",
  "سيروم",
  "كريم عين",
  "مرطب",
  "واقي شمس",
  "مقشر",
  "ماسك",
  "زيت",
  "كريم ليلي",
  "علاج موضعي",
  "بلسم شفاه",
];

/** أشكال العرض في رئيسية التطبيق لكل نوع. */
export const SHOWCASE_DISPLAYS: Record<string, { value: string; label: string }[]> = {
  skinGuide: [
    { value: "cards", label: "بطاقات بصور كبيرة" },
    { value: "grid", label: "شبكة مربعات" },
    { value: "circles", label: "دوائر" },
    { value: "chips", label: "أزرار صغيرة" },
  ],
  routines: [
    { value: "carousel", label: "صباحي / مسائي بتبديل" },
    { value: "stacked", label: "بطاقة كبيرة لكل روتين" },
  ],
  packages: [
    { value: "carousel", label: "بطاقات أفقية" },
    { value: "hero", label: "بطاقة مميزة كبيرة + الباقي" },
    { value: "grid", label: "شبكة" },
  ],
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  PROMO_STRIP: "شريط إعلان",
  CUSTOM_BANNER: "بنر",
  IMAGE_TILES: "صور",
  IMAGE_MARQUEE: "صور متحركة",
  PRODUCT_LIST: "منتجات",
  FLASH_SALE: "عرض سريع",
  FEATURED_BRANDS: "براندات",
  BRAND_SHOWCASE: "براندات",
  PACKAGES: "باقات",
  ROUTINE_CAROUSEL: "روتين",
  SKIN_CONCERNS: "دليل البشرة",
  CARE_HUB: "مركز العناية",
  SECTION_GROUP: "مجموعة أقسام",
  CIRCLE_TILES: "دوائر",
  MEDIA_GALLERY: "معرض",
  PHOTO_WALL: "جدار صور",
  CATEGORY_GRID: "أقسام",
};
