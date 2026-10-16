/** ما فهمته المستشارة من الزبونة — يتراكم عبر المحادثة. */
export interface Need {
  area?: string;
  kinds: string[];
  concerns: string[];
  skinType?: string;
  ingredients: string[];
  freeFrom: string[];
  gender?: string;
  families: string[];
  time?: string;
  strength?: string;
  season?: string;
  finish?: string;
  coverage?: string;
  attrs: string[];
  audience?: string;
  occasion?: string;
  recipient?: string;
  brands: string[];
  excludeBrands: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "cheap" | "best" | "rated" | "new" | "deals" | "premium";
  /** صفات لا تريدها («بدون عطر»، «ما احب الحلو») بصيغة facet:id. */
  avoid: string[];
  /** كلمات حرة لا تنتمي لصفة معروفة — تُستخدم في البحث النصي. */
  free: string[];
  /** يريد روتيناً كاملاً لا منتجاً واحداً. */
  routine?: boolean;
}

export const emptyNeed = (): Need => ({
  kinds: [],
  concerns: [],
  ingredients: [],
  freeFrom: [],
  families: [],
  attrs: [],
  brands: [],
  excludeBrands: [],
  avoid: [],
  free: [],
});

export type Intent =
  | "greet"
  | "thanks"
  | "recommend"
  | "routine"
  | "gift"
  | "deals"
  | "more"
  | "cheaper"
  | "pricier"
  | "reset"
  | "help"
  | "quiz"
  | "about";

/** حالة المحادثة — يحفظها التطبيق ويعيدها مع كل رسالة (المستشارة بلا ذاكرة خادم). */
export interface AdvisorState {
  need: Need;
  /** أسئلة سبق طرحها (لا نكرر السؤال). */
  asked: string[];
  /** منتجات عُرضت (لـ«غيرهم» دون تكرار). */
  shown: string[];
  /** آخر سعر مرجعي لـ«أرخص». */
  lastPrice?: number;
  /** اختبار موجّه جارٍ. */
  quiz?: { id: string; step: number };
  turns: number;
}

export const emptyState = (): AdvisorState => ({ need: emptyNeed(), asked: [], shown: [], turns: 0 });

export interface Chip {
  label: string;
  /** يُرسل كما هو (رسالة) أو كفعل مضبوط مثل `set:skinType=oily`. */
  value: string;
  emoji?: string;
}

export interface ProductCardOut {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  shadeCount: number;
  /** لماذا اخترتها — شارات قصيرة. */
  reasons: string[];
  /** مدى الملاءمة 0..100 (للعرض كحلقة). */
  match: number;
}

export interface RoutineStepOut {
  step: string;
  label: string;
  emoji: string;
  when: "am" | "pm" | "both";
  product: ProductCardOut;
}

export interface QuizOut {
  id: string;
  title: string;
  question: string;
  step: number;
  total: number;
  options: Chip[];
  multi?: boolean;
}

export interface AdvisorReply {
  /** فقرات الرد (تُعرض متتابعة بحركة كتابة). */
  messages: string[];
  chips: Chip[];
  products: ProductCardOut[];
  /** مجموعات إضافية: «بدائل اقتصادية»، «الأعلى تقييماً»… */
  groups: { title: string; products: ProductCardOut[] }[];
  routine?: { title: string; steps: RoutineStepOut[]; total: number };
  quiz?: QuizOut;
  /** ملخص ما فهمته (شرائح قابلة للإزالة). */
  understood: { key: string; label: string }[];
  state: AdvisorState;
}
