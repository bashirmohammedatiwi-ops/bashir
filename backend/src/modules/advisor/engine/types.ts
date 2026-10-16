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
  | "info"
  | "similar"
  | "compare"
  | "fit"
  | "complement"
  | "howto"
  | "focus"
  | "dupe"
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
  /** المنتج محور الحديث (فُتحت «ديما» من صفحته، أو سألت عنه). */
  focus?: string;
  /** أعلى ترشيح في آخر رد — مرجع «هذا/هاي» حين لا يوجد محور. */
  lastTop?: string;
  /** أول بطاقات آخر رد (لـ«قارنيهم»). */
  lastCards?: string[];
  /** مرجع آخر بحث تشابه («p:id» أو «f:id») — لـ«أرخص» بعده. */
  simRef?: string;
  turns: number;
}

/** ملف الزبونة الجمالي — يحفظه التطبيق على الجهاز ويرسله مع كل رسالة. */
export interface Profile {
  skinType?: string;
  concerns?: string[];
  hairConcerns?: string[];
  /** ذوقها في العطور. */
  families?: string[];
  /** عطورها لنفسها: نسائي/للجنسين. */
  gender?: string;
  avoid?: string[];
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
  /** تفصيل «ليش رشحته؟»: ما طابق وما لم يطابق من طلبها. */
  why?: { ok: boolean; text: string }[];
  /** نسبة الشبه بالمنتج المرجعي (بدائل/مشابه). */
  similarity?: number;
  /** كم توفّر مقارنةً بالمرجع. */
  saving?: number;
}

/** بطاقة معرفة: جواب سؤال عن مكوّن أو موضوع. */
export interface KnowledgeOut {
  title: string;
  /** info | ingredient | combo */
  kind: string;
  intro?: string;
  sections: { label: string; icon: string; bullets: string[] }[];
  /** لمزج مكوّنين: good | care | avoid */
  verdict?: { tone: "good" | "care" | "avoid"; text: string };
}

export interface CompareOut {
  products: ProductCardOut[];
  rows: { label: string; values: string[]; best?: number }[];
  winner?: number;
  verdict: string;
}

export interface FitOut {
  product: ProductCardOut;
  tone: "good" | "ok" | "care";
  headline: string;
  points: { ok: boolean | null; text: string }[];
}

export interface RoutineStepOut {
  step: string;
  label: string;
  emoji: string;
  when: "am" | "pm" | "both" | "any";
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
  routine?: { title: string; steps: RoutineStepOut[]; total: number; emoji?: string; brand?: string };
  quiz?: QuizOut;
  knowledge?: KnowledgeOut;
  compare?: CompareOut;
  fit?: FitOut;
  /** المنتج المرجعي لبدائل/مشابه/مكمّلات. */
  anchor?: ProductCardOut;
  /** ما تعلّمته عن الزبونة في هذا الرد — يدمجه التطبيق في ملفها. */
  profileUpdate?: Partial<Profile>;
  /** ملخص ما فهمته (شرائح قابلة للإزالة). */
  understood: { key: string; label: string }[];
  state: AdvisorState;
}
