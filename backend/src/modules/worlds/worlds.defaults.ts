export type WorldSeed = {
  slug: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  accentColor: string;
  canvasColor: string;
  inkColor: string;
  surfaceColor: string;
  position: number;
};

/** العوالم الخمسة. الأقسام تُربط لاحقاً من لوحة التحكم. */
export const WORLD_SEEDS: WorldSeed[] = [
  {
    slug: "beauty-spell",
    nameAr: "سحر الجمال",
    nameEn: "Beauty Spell",
    taglineAr: "مكياج وأظافر وعدسات",
    taglineEn: "Makeup, nails, and lenses",
    accentColor: "#D41F5C",
    canvasColor: "#FFF5F8",
    inkColor: "#2A1020",
    surfaceColor: "#FFFFFF",
    position: 0,
  },
  {
    slug: "care-rituals",
    nameAr: "طقوس العناية",
    nameEn: "Care Rituals",
    taglineAr: "عناية وصحة وأجهزة",
    taglineEn: "Care, wellness, and devices",
    accentColor: "#1F8A70",
    canvasColor: "#F3FAF7",
    inkColor: "#10241C",
    surfaceColor: "#FFFFFF",
    position: 1,
  },
  {
    slug: "his-elegance",
    nameAr: "أناقة الرجل",
    nameEn: "His Elegance",
    taglineAr: "عناية وحضور رجالي",
    taglineEn: "Grooming for him",
    accentColor: "#1C3A5F",
    canvasColor: "#F4F7FB",
    inkColor: "#101820",
    surfaceColor: "#FFFFFF",
    position: 2,
  },
  {
    slug: "gift-moments",
    nameAr: "لحظات تُهدى",
    nameEn: "Gifted Moments",
    taglineAr: "هدايا ومختارات",
    taglineEn: "Gifts and edits",
    accentColor: "#B8954A",
    canvasColor: "#FBF7F0",
    inkColor: "#2A2114",
    surfaceColor: "#FFFFFF",
    position: 3,
  },
  {
    slug: "scent-story",
    nameAr: "حكاية عطر",
    nameEn: "A Scent Story",
    taglineAr: "عطور ومعطرات المنزل",
    taglineEn: "Perfume and home scent",
    accentColor: "#6B3FA0",
    canvasColor: "#F7F3FB",
    inkColor: "#1A1024",
    surfaceColor: "#FFFFFF",
    position: 4,
  },
];
