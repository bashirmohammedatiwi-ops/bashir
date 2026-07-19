import { SectionType } from "./section-types";

export type TemplateSection = {
  type: SectionType;
  title?: string;
  subtitle?: string;
  payload?: Record<string, unknown>;
};

export type PageTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  sections: TemplateSection[];
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "nice-one",
    name: "Nice One كامل",
    description: "تخطيط متجر تجميل احترافي — هيرو، عروض، أكثر مبيعاً، براندات",
    icon: "💄",
    accent: "#E1306C",
    sections: [
      { type: "HERO_BANNER", title: "مرحباً بكم" },
      {
        type: "PROMO_STRIP",
        title: "شحن مجاني",
        payload: {
          text: "🚚 شحن مجاني للطلبات فوق 50,000 د.ع",
          backgroundColor: "#FCE4EC",
          linkType: "offers",
          marquee: true,
          icon: "🚚",
        },
      },
      { type: "SKIN_CONCERNS", title: "تسوّق حسب مشكلتك" },
      { type: "FLASH_SALE", title: "أقوى العروض", payload: { filter: "promo", showViewAll: true, limit: 12 } },
      { type: "PRODUCT_LIST", title: "الأكثر مبيعاً", payload: { filter: "bestSeller", showViewAll: true, limit: 12 } },
      { type: "FEATURED_BRANDS", title: "براندات مميزة" },
      { type: "BANNER_CAROUSEL", title: "عروض حصرية" },
      { type: "MAKEUP_CATEGORIES", title: "أقسام المكياج" },
      { type: "PRODUCT_LIST", title: "وصل حديثاً", payload: { filter: "new", showViewAll: true, limit: 12 } },
    ],
  },
  {
    id: "minimal",
    name: "بسيط وأنيق",
    description: "هيرو + منتجات + براندات — مناسب للبداية السريعة",
    icon: "✨",
    accent: "#6366F1",
    sections: [
      { type: "HERO_BANNER", title: "اكتشفي جمالك" },
      { type: "PRODUCT_LIST", title: "منتجات مختارة", payload: { filter: "featured", showViewAll: true, limit: 12 } },
      { type: "FEATURED_BRANDS", title: "برانداتنا" },
      { type: "BANNER_FULL", title: "عرض خاص" },
    ],
  },
  {
    id: "promo-heavy",
    name: "تركيز العروض",
    description: "عروض فلاش، شرائط ترويجية، وبنرات متعددة",
    icon: "⚡",
    accent: "#FF5722",
    sections: [
      {
        type: "PROMO_STRIP",
        payload: { text: "🔥 خصم 30% على المكياج — لفترة محدودة", backgroundColor: "#FFEBEE", linkType: "offers" },
      },
      { type: "FLASH_SALE", title: "تخفيضات اليوم", payload: { filter: "promo", showViewAll: true, limit: 16 } },
      { type: "BANNER_GRID_2", title: "عروض مزدوجة" },
      { type: "PRODUCT_LIST", title: "عروض لا تفوت", payload: { filter: "promo", showViewAll: true, limit: 12 } },
      { type: "BANNER_CAROUSEL", title: "المزيد من العروض" },
    ],
  },
  {
    id: "categories",
    name: "تصفّح بالأقسام",
    description: "فئات، مكياج، مشاكل البشرة — لتسهيل التصفح",
    icon: "🧩",
    accent: "#0EA5E9",
    sections: [
      { type: "CATEGORY_GRID", title: "تسوّقي حسب القسم" },
      { type: "MAKEUP_CATEGORIES", title: "المكياج" },
      { type: "CATEGORY_TILES", title: "العناية" },
      { type: "SKIN_CONCERNS", title: "حسب نوع بشرتك" },
      { type: "PRODUCT_LIST", title: "الأكثر مبيعاً", payload: { filter: "bestSeller", showViewAll: true } },
    ],
  },
  {
    id: "brands",
    name: "واجهة البراندات",
    description: "عرض البراندات والباقات بشكل بارز",
    icon: "🏷️",
    accent: "#8B5CF6",
    sections: [
      { type: "FEATURED_BRANDS", title: "براندات عالمية" },
      { type: "BRAND_SHOWCASE", title: "خصومات البراندات" },
      { type: "BANNER_CAROUSEL", title: "حملات البراندات" },
      { type: "PACKAGES", title: "باقات العناية" },
      { type: "PRODUCT_LIST", title: "منتجات مختارة", payload: { filter: "featured", showViewAll: true } },
    ],
  },
  {
    id: "visual",
    name: "بصري غني",
    description: "بطاقات صور مخصصة + بنرات + سلايدرات",
    icon: "🖼️",
    accent: "#F59E0B",
    sections: [
      { type: "HERO_BANNER" },
      { type: "IMAGE_TILES", title: "اكتشفي المزيد", payload: { columns: 2, items: [] } },
      { type: "BANNER_GRID_3", title: "مجموعات" },
      { type: "BANNER_FULL" },
      { type: "PRODUCT_LIST", title: "جديدنا", payload: { filter: "new", showViewAll: true } },
    ],
  },
  {
    id: "care-journey",
    name: "رحلة العناية",
    description: "مشاكل بشرة + روتين + فئات عناية + منتجات",
    icon: "💆",
    accent: "#26A69A",
    sections: [
      { type: "SKIN_CONCERNS", title: "ما مشكلتك؟", payload: { display: "circles", showTitle: true, maxItems: 10 } },
      { type: "ROUTINE_CAROUSEL", title: "روتينك اليومي", payload: { kind: "both", limit: 8, showViewAll: true, showTitle: true } },
      { type: "CATEGORY_TILES", title: "أقسام العناية", payload: { showTitle: true } },
      { type: "PRODUCT_LIST", title: "منتجات العناية", payload: { filter: "featured", showViewAll: true, limit: 12 } },
    ],
  },
  {
    id: "circle-shortcuts",
    name: "اختصارات دائرية",
    description: "دوائر روابط سريعة + شريط ترويجي",
    icon: "⭕",
    accent: "#AB47BC",
    sections: [
      { type: "CIRCLE_TILES", title: "تسوّقي بسرعة", payload: { sectionLayout: "row", showTitle: true, items: [] } },
      { type: "PROMO_STRIP", payload: { text: "🎁 عروض حصرية — اكتشفي المزيد", marquee: true, linkType: "offers" } },
      { type: "FLASH_SALE", title: "عروض اليوم", payload: { filter: "promo", showViewAll: true } },
    ],
  },
  {
    id: "premium-beauty",
    name: "جمال فاخر",
    description: "هيرو + دوائر براندات + عروض + فسيفساء",
    icon: "✨",
    accent: "#D4AF37",
    sections: [
      { type: "HERO_BANNER", title: "اكتشفي جمالك" },
      { type: "CIRCLE_TILES", title: "براندات مميزة", payload: { sectionLayout: "grid3", showTitle: true, items: [] } },
      { type: "FLASH_SALE", title: "عروض حصرية", payload: { filter: "promo", showViewAll: true, limit: 12 } },
      { type: "IMAGE_TILES", title: "مجموعات مختارة", payload: { sectionLayout: "mosaic", columns: 2, items: [] } },
    ],
  },
];
