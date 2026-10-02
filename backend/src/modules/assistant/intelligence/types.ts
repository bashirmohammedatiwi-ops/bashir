export type ProductKind = "perfume" | "splash" | "shampoo" | "mask" | "serum" | "moisturizer" | "cream" | "cleanser" | "sunscreen" | "lipstick" | "other";

export type Concern = "hairloss" | "dry" | "oily" | "colored" | "dandruff" | "acne" | "pigment" | "sensitive";

export type Audience = "baby" | "adult";

export type TurnKind = "smalltalk" | "advice" | "recommend" | "cheaper" | "exclude_brand" | "reference" | "compare" | "explain";

/** فهم المساعد للمنتج من نصه: يُحسب مرة وحدة وينحفظ. */
export type ProductTagLite = {
  kind: string;
  role: string;
  area: string;
  concerns: string[];
  audience: string;
  summary: string;
};

export type ShownProduct = {
  id: string;
  tags?: ProductTagLite;
  nameAr: string;
  nameEn: string;
  brand: string;
  price: number;
  description?: string;
  howToUse?: string;
  ingredients?: string;
  card: Record<string, unknown>;
};

export type ShoppingState = {
  kind: ProductKind;
  concern?: Concern;
  /** مشاكل إضافية مع الطلب، مثل تساقط مع فروة دهنية. */
  also?: Concern[];
  /** كلمات الطلب نفسها، مثل تفتيح أو تساقط أو مطفي، مو نوع واحد ثابت. */
  traits?: string[];
  audience?: Audience;
  maxPrice?: number;
  minPrice?: number;
  /** غالي يفضّل الأعلى سعراً بين المناسب، ورخيص يفضّل الأقل. */
  priceTier?: "premium" | "value";
  gender?: "female" | "male";
  excludedBrands: string[];
  shown: ShownProduct[];
  seenIds?: string[];
  focusIndex?: number;
  /** آخر طلب شراء بصياغة الزبونة، حتى «أرخص» و«المزيد» يبقيان على نفس القصد. */
  goal?: string;
  /** شركات تحبها الزبونة من ملفها، ترفع الترتيب شوي بدون ما تغلب المشكلة. */
  preferBrands?: string[];
  /** المشكلة جت من ملف الزبونة مو من رسالتها. */
  fromProfile?: boolean;
  profileNote?: string;
  /** ملخص ملف الزبونة للموديل. */
  about?: string;
};

export type Turn = {
  kind: TurnKind;
  state: ShoppingState;
  referenceIndex?: number;
  compareIndexes?: [number, number];
  searchTerm: string;
  note: string;
  /** طلب دفعة جديدة، مثل «خمس نتائج إضافية». */
  moreCount?: number;
};

export const emptyState = (): ShoppingState => ({
  kind: "other",
  excludedBrands: [],
  shown: [],
  seenIds: [],
  traits: [],
});
