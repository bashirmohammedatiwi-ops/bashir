import { emptyState, ProductKind, ShoppingState, Turn } from "./types";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function understand(message: string, previous: ShoppingState = emptyState()): Turn {
  const text = normalize(message);
  if (isSmallTalk(text)) {
    return { kind: "smalltalk", state: previous, searchTerm: "", note: "" };
  }

  if (isAdvice(text) && !isFreshBuy(text) && !detectConcern(text) && detectKind(text) == null && inferKind(text) == null) {
    return { kind: "advice", state: previous, searchTerm: "", note: "" };
  }

  const switched = productSwitch(text, previous.kind);
  if (switched && previous.kind !== "other") {
    const state = freshState(previous, switched.kind, text);
    const moreWithSwitch = moreRequest(text);
    return { ...finish("recommend", state), moreCount: moreWithSwitch?.count };
  }

  const pointed = referenceIndex(text);
  if (pointed != null && previous.shown.length > 0 && previous.shown.length <= pointed && (detectKind(text) == null || detectKind(text) === previous.kind)) {
    const state = {
      ...previous,
      excludedBrands: [...previous.excludedBrands],
      shown: previous.shown,
      seenIds: [...new Set([...(previous.seenIds ?? []), ...previous.shown.map((item) => item.id)])],
    };
    return { ...finish("recommend", state), moreCount: Math.max(1, pointed + 1 - previous.shown.length) };
  }

  const more = moreRequest(text);
  if (more && (previous.kind !== "other" || previous.goal || previous.shown.length > 0)) {
    const state = {
      ...previous,
      excludedBrands: [...previous.excludedBrands],
      shown: previous.shown,
      seenIds: [...new Set([...(previous.seenIds ?? []), ...previous.shown.map((item) => item.id)])],
    };
    return { ...finish("recommend", state), moreCount: more.count };
  }

  if (isExplain(text) && !isFreshBuy(text) && !asksAboutProblem(text)) {
    const index = referenceIndex(text) ?? previous.focusIndex ?? (previous.shown.length ? 0 : undefined);
    return {
      kind: "explain",
      state: index == null ? previous : { ...previous, focusIndex: index },
      referenceIndex: index,
      searchTerm: "",
      note: "",
    };
  }

  const reference = referenceIndex(text) ?? implicitReference(text, previous);
  if (reference != null && previous.shown.length > reference) {
    return {
      kind: "reference",
      state: { ...previous, focusIndex: reference },
      referenceIndex: reference,
      searchTerm: "",
      note: "",
    };
  }

  const compare = compareIndexes(text);
  if (compare && previous.shown.length > Math.max(...compare)) {
    return { kind: "compare", state: previous, compareIndexes: compare, searchTerm: "", note: "" };
  }

  const state = { ...previous, excludedBrands: [...previous.excludedBrands], shown: previous.shown };
  const explicitKind = detectKind(text);
  const fresh = isFreshBuy(text);
  if (explicitKind && explicitKind !== state.kind) {
    state.kind = explicitKind;
    state.maxPrice = undefined;
    state.minPrice = undefined;
    state.priceTier = undefined;
    state.shown = [];
    state.seenIds = [];
    state.goal = undefined;
    state.concern = undefined;
    state.audience = undefined;
    state.traits = [];
  } else if (explicitKind) {
    state.kind = explicitKind;
  }
  if (fresh) {
    const concerns = detectConcerns(text);
    state.concern = concerns[0];
    state.also = concerns.slice(1);
    state.traits = extractTraits(text);
    state.audience = detectAudience(text) ?? "adult";
    state.seenIds = [];
    state.goal = undefined;
  } else {
    const concerns = detectConcerns(text);
    const audience = detectAudience(text);
    if (concerns.length) {
      state.concern = concerns[0];
      state.also = concerns.slice(1);
    }
    if (audience) state.audience = audience;
    if (!state.traits?.length) state.traits = extractTraits(text);
  }
  if (!explicitKind && state.kind === "other") {
    const inferred = inferKind(text);
    if (inferred) state.kind = inferred;
  }

  const gender = detectGender(text);
  if (gender) state.gender = gender;

  const bounds = priceBounds(text);
  if (bounds.maxPrice != null) state.maxPrice = bounds.maxPrice;
  if (bounds.minPrice != null) state.minPrice = bounds.minPrice;

  const droppedBrand = excludedBrand(text, state);
  const tier = priceTierOf(text);
  if (tier) state.priceTier = tier;
  else if (fresh) state.priceTier = undefined;

  if (/اغلى|أغلى/.test(text) && state.shown.length > 0) {
    state.minPrice = Math.max(...state.shown.map((item) => item.price)) + 1;
    state.maxPrice = undefined;
    state.priceTier = "premium";
    return finish("recommend", state);
  }
  if (/ارخص|أرخص|ارخن|أقل سعر|اقل سعر/.test(text) && state.shown.length > 0) {
    const floor = Math.min(...state.shown.map((item) => item.price));
    state.maxPrice = Math.max(1000, floor - 1);
    state.minPrice = undefined;
    state.priceTier = "value";
    return finish("cheaper", state);
  }
  if (droppedBrand) {
    if (!state.excludedBrands.includes(droppedBrand)) state.excludedBrands.push(droppedBrand);
    return finish("exclude_brand", state);
  }
  return finish("recommend", state);
}

export function acceptsProduct(
  product: { nameAr: string; nameEn: string; brand: string; category: string; price: number; description?: string },
  state: ShoppingState,
) {
  if (product.price <= 0) return false;
  if (state.maxPrice != null && product.price > state.maxPrice) return false;
  if (state.minPrice != null && product.price < state.minPrice) return false;
  const name = `${product.nameAr} ${product.nameEn}`;
  const hay = `${name} ${product.brand} ${product.category} ${product.description ?? ""}`;
  if (state.excludedBrands.some((brand) => sameBrand(hay, brand) || sameBrand(product.brand, brand))) return false;
  if (state.audience !== "baby" && /اطفال|أطفال|بيبي|baby|kids|infant/i.test(name)) return false;
  if (state.audience === "baby" && !/اطفال|أطفال|بيبي|baby|kids|infant/i.test(name)) return false;
  if (state.kind === "perfume" && /سبلاش|splash|بودي ميست|body mist|body spray|معطر جسم/i.test(hay)) return false;
  if (state.kind === "perfume" && !/عطر|perfume|parfum|بارفيوم|edp|edt|eau de|او دو/i.test(hay)) return false;
  if (state.kind === "splash" && !/سبلاش|splash|body mist|معطر جسم/i.test(hay)) return false;
  if (state.gender === "female" && /رجالي|للرجال| men\b|homme/i.test(hay) && !/نسائي|women|femme/i.test(hay)) return false;
  if (state.gender === "male" && /نسائي|للنساء|women|femme/i.test(hay) && !/رجالي|homme| men\b/i.test(hay)) return false;
  return true;
}

function finish(kind: Turn["kind"], state: ShoppingState): Turn {
  return {
    kind,
    state,
    searchTerm: searchTerm(state),
    note: noteFor(state),
  };
}

function searchTerm(state: ShoppingState) {
  const base = kindWord(state.kind);
  const traits = distinctTraits(state).slice(0, 2).join(" ");
  return [base, traits].filter(Boolean).join(" ");
}

export function extractTraits(text: string): string[] {
  const found: string[] = [];
  for (const group of TRAIT_GROUPS) {
    if (group.some((alias) => text.includes(alias))) found.push(group[0]);
  }
  return found.slice(0, 4);
}

export function distinctTraits(state: ShoppingState): string[] {
  const skip = kindWord(state.kind);
  return (state.traits ?? []).filter((trait) => trait !== skip);
}

const TRAIT_GROUPS = [
  ["تساقط", "تساقذ", "كثافة", "تقوية", "hair loss", "hairfall", "anti-hair"],
  ["تفتيح", "تفتح", "تصبغ", "brightening", "whitening", "pigment"],
  ["حبوب", "حب شباب", "acne"],
  ["حساس", "حساسة", "sensitive"],
  ["ترطيب", "مرطب", "hydrat", "moistur"],
  ["مطفي", "matte"],
  ["جاف", "جفاف", "dry"],
  ["دهني", "دهون", "oily"],
  ["قشرة", "dandruff"],
  ["مصبوغ", "صبغ", "color"],
  ["اطفال", "أطفال", "بيبي", "baby", "kids"],
];

export function traitAliases(trait: string): string[] {
  const group = TRAIT_GROUPS.find((aliases) => aliases.some((alias) => trait.includes(alias) || alias.includes(trait)));
  return group ?? [trait];
}

export function coversTraits(hay: string, traits: string[]) {
  const text = hay.toLowerCase();
  return traits.every((trait) => traitAliases(trait).some((alias) => text.includes(alias)));
}

function kindWord(kind: ProductKind) {
  switch (kind) {
    case "perfume":
      return "عطر";
    case "splash":
      return "سبلاش";
    case "shampoo":
      return "شامبو";
    case "mask":
      return "ماسك";
    case "serum":
      return "سيروم";
    case "moisturizer":
      return "مرطب";
    case "cream":
      return "كريم";
    case "cleanser":
      return "غسول";
    case "sunscreen":
      return "واقي";
    case "lipstick":
      return "روج";
    default:
      return "";
  }
}

function concernWord(concern?: ShoppingState["concern"]) {
  switch (concern) {
    case "hairloss":
      return "تساقط";
    case "dry":
      return "جاف";
    case "oily":
      return "دهني";
    case "colored":
      return "مصبوغ";
    case "dandruff":
      return "قشرة";
    default:
      return "";
  }
}

const CONCERN_TESTS: Array<[NonNullable<ShoppingState["concern"]>, RegExp]> = [
  ["hairloss", /تساقط|تساقذ|يتساقط|كثافه|كثافة|تقوية|تقويه|يطيح|يطوح|شعري خفيف|شعر خفيف|خفة الشعر|hair loss|anti-hair|hairfall/],
  ["dandruff", /قشرة|dandruff/],
  ["colored", /مصبوغ|صبغ|colored hair/],
  ["acne", /حبوب|حب الشباب|حب شباب|بثور|acne/],
  ["pigment", /تفتيح|تصبغ|بقع|pigment|brighten|whitening/],
  ["sensitive", /حساس|حساسه|حساسة|sensitive/],
  ["dry", /جاف|جفاف|dry/],
  ["oily", /دهني|دهون|oily/],
];

export function detectConcerns(text: string): Array<NonNullable<ShoppingState["concern"]>> {
  return CONCERN_TESTS.filter(([, pattern]) => pattern.test(text)).map(([concern]) => concern);
}

export function detectConcern(text: string): ShoppingState["concern"] {
  return detectConcerns(text)[0];
}

function detectAudience(text: string): ShoppingState["audience"] {
  if (/اطفال|أطفال|بيبي|baby|kids|infant/.test(text)) return "baby";
  return undefined;
}

function concernPattern(concern?: ShoppingState["concern"]) {
  switch (concern) {
    case "hairloss":
      return /تساقط|تساقذ|يتساقط|كثافه|كثافة|تقوية|تقويه|يطيح|يطوح|hair loss|anti-hair|hairfall/i;
    case "dandruff":
      return /قشرة|dandruff/i;
    case "colored":
      return /مصبوغ|صبغ|color/i;
    case "dry":
      return /جاف|جفاف|dry/i;
    case "oily":
      return /دهني|دهون|oily/i;
    default:
      return null;
  }
}

/** إذا الزبونة انتقلت لمنتج مختلف، نرجع النوع الجديد حتى ما نبقى على الطلب السابق. */
export function productSwitch(message: string, current: ProductKind): { kind: ProductKind } | null {
  const text = normalize(message);
  const kind = detectKind(text) ?? inferKind(text);
  if (kind && current !== "other" && kind !== current) return { kind };
  if (current !== "other" && /بلسم|فاونديشن|كونسيلر|ماسكارا|تونر|كحل|ايشادو|بودرة|بلاشر|ملمع/.test(text)) {
    if (/فاونديشن|كونسيلر|بودرة|بلاشر/.test(text)) return { kind: "cream" };
    if (/بلسم/.test(text)) return { kind: "shampoo" };
    return { kind: "other" };
  }
  return null;
}

function freshState(previous: ShoppingState, kind: ProductKind, text: string): ShoppingState {
  const bounds = priceBounds(text);
  const concerns = detectConcerns(text);
  return {
    ...emptyState(),
    kind,
    concern: concerns[0],
    also: concerns.slice(1),
    traits: extractTraits(text),
    audience: detectAudience(text) ?? "adult",
    gender: detectGender(text) ?? previous.gender,
    maxPrice: bounds.maxPrice,
    minPrice: bounds.minPrice,
    priceTier: priceTierOf(text),
  };
}

function moreRequest(text: string): { count: number } | null {
  if (!/المزيد|اضافي|إضافي|اضافه|إضافة|غيرهم|غيرهن|غيرهن|خيارات اكثر|خيارات أكثر|اعرض اكثر|أعرض أكثر|نتائج اخر|نتائج اخرى|نتائج أخرى|غير هاي|غير هاي/.test(text)) {
    return null;
  }
  const digit = text.match(/(\d+)/);
  if (digit) return { count: clampCount(Number(digit[1])) };
  const words: Array<[string, number]> = [
    ["ستة", 6],
    ["ست ", 6],
    ["خمسة", 5],
    ["خمسه", 5],
    ["خمس", 5],
    ["اربعة", 4],
    ["أربعة", 4],
    ["اربع", 4],
    ["ثلاثة", 3],
    ["ثلاث", 3],
  ];
  for (const [word, count] of words) {
    if (text.includes(word)) return { count };
  }
  return { count: 3 };
}

function clampCount(count: number) {
  if (!Number.isFinite(count) || count < 1) return 3;
  return Math.min(6, Math.round(count));
}

function isFreshBuy(text: string) {
  return /(اريد|أريد|ابي|أبغى|ابغى|احتاج|أحتاج)/.test(text) && (detectKind(text) != null || extractTraits(text).length > 0);
}

function isAdvice(text: string) {
  return /شنو سبب|ليش يصير|شلون اوقف|كيف اوقف|سولفلي|تدرين/.test(text);
}

function asksAboutProblem(text: string) {
  if (/هذا|هذي|الاول|الأول|الثاني|الثالث|الرابع|المنتج/.test(text)) return false;
  return detectConcern(text) != null || inferKind(text) != null;
}

function isExplain(text: string) {
  return /كيف استخدم|كيف أستخدم|طريقة الاستخدام|شلون استخدم|شلون أستخدم|شلون استخدام|استخدامه|استخدامها|مكونات|شنو يفيد|وش يفيد|ينفع|يناسب|ليش|وضح|اشرح/.test(text);
}

export function detectKind(text: string): ProductKind | null {
  if (/سبلاش|splash/.test(text)) return "splash";
  if (/عطر|perfume|parfum|بارفيوم|برفان/.test(text)) return "perfume";
  if (/شامبو|shampoo/.test(text)) return "shampoo";
  if (/ماسك(?!ارا)|hair mask/.test(text)) return "mask";
  if (/سيروم|serum/.test(text)) return "serum";
  if (/غسول|cleanser/.test(text)) return "cleanser";
  if (/واقي|sunscreen|spf/.test(text)) return "sunscreen";
  if (/مرطب|moistur/.test(text) && !/كريم/.test(text)) return "moisturizer";
  if (/كريم|cream/.test(text)) return "cream";
  if (/روج|lipstick|احمر شفاه|أحمر شفاه/.test(text)) return "lipstick";
  return null;
}

function inferKind(text: string): ProductKind | null {
  if (/شعر/.test(text) && /يطيح|يطوح|يتساقط|تساقط|تساقذ|قشره|قشرة|خفيف/.test(text)) return "shampoo";
  if (/ريح|برفان|عطور/.test(text) && !/سبلاش|splash/.test(text)) return "perfume";
  return null;
}

function detectGender(text: string): "female" | "male" | undefined {
  if (/نسائي|للنساء|بنات|women/.test(text)) return "female";
  if (/رجالي|للرجال|men|homme/.test(text)) return "male";
  return undefined;
}

/** غالي يعني الأعلى سعراً بين المناسب، ورخيص يعني الأقل. «أرخص» ما تنحسب رخيص لأن المقارنة لها مسار ثانٍ. */
export function priceTierOf(message: string): ShoppingState["priceTier"] {
  const text = normalize(message);
  if (/مو غالي|مو غاليه|ليس غالي|not expensive/.test(text)) return "value";
  if (/غير رخيص|مو رخيص|not cheap/.test(text)) return "premium";
  if (/غالي|غاليه|غالية|غالين|فاخر|فخم|راقي|بريميوم|سعره عالي|premium|expensive|luxury/.test(text)) return "premium";
  if (/رخيص|رخيصه|رخيصة|اقتصادي|cheap|affordable/.test(text)) return "value";
  return undefined;
}

export function priceBounds(message: string) {
  const text = normalize(message);
  const read = (raw: string, unit?: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return undefined;
    if (unit || value < 1000) return Math.round(value * 1000);
    return Math.round(value);
  };
  const max = text.match(/(?:اقل من|أقل من|تحت|لحد|لغاية|ما يتعدى|مو اغلى من|بحدود|حول)\s*(\d+(?:\.\d+)?)\s*(الف|ألف|الاف|آلاف|k)?/);
  if (max) return { maxPrice: read(max[1], max[2]) };
  const min = text.match(/(?:اكثر من|أكثر من|فوق|اغلى من|أغلى من)\s*(\d+(?:\.\d+)?)\s*(الف|ألف|الاف|آلاف|k)?/);
  if (min) return { minPrice: read(min[1], min[2]) };
  return {};
}

function excludedBrand(text: string, state: ShoppingState) {
  const named = text.match(/(?:بدون|مو|ليس|لا اريد|لا أريد|غير)\s+([a-zA-Z\u0600-\u06FF'’]{3,})/);
  if (named && !/هذا|هذي|البراند|براند|منتج/.test(named[1])) return canonicalBrand(named[1]);
  if (/(هذا البراند|هذي البراند|نفس البراند|مو هذا|لا هذا|غير البراند|براند ثاني)/.test(text)) {
    const current = state.shown[state.focusIndex ?? 0]?.brand;
    return current ? canonicalBrand(current) : null;
  }
  return null;
}

const BRAND_ALIASES = [
  ["loreal", "l'oreal", "لوريال", "لوريل", "لوريال باريس"],
  ["maybelline", "ميبيلين", "مايبلين", "مايبيلين"],
  ["garnier", "غارنييه", "جارنييه"],
  ["nivea", "نيفيا"],
  ["lattafa", "لطافة", "لطافه"],
];

export function canonicalBrand(raw: string) {
  const text = raw.toLowerCase().replace(/['’]/g, "").replace(/é/g, "e");
  const group = BRAND_ALIASES.find((aliases) => aliases.some((alias) => text.includes(alias.replace(/['’]/g, ""))));
  return group?.[0] ?? text;
}

function sameBrand(hay: string, excluded: string) {
  const left = canonicalBrand(hay);
  const right = canonicalBrand(excluded);
  return left === right || hay.toLowerCase().includes(right);
}

function implicitReference(text: string, previous: ShoppingState) {
  if (!previous.shown.length) return null;
  if (/^(هذا|هذي|شكد سعره|سعره|حجمه)$/.test(text) || /شكد سعر/.test(text)) {
    return previous.focusIndex ?? 0;
  }
  return null;
}

function referenceIndex(text: string) {
  if (/(الاول|الأول|اول واحد|الأولى)/.test(text)) return 0;
  if (/الثاني|الثانية/.test(text)) return 1;
  if (/الثالث|الثالثة/.test(text)) return 2;
  if (/الرابع/.test(text)) return 3;
  return null;
}

function compareIndexes(text: string): [number, number] | null {
  if (!/قارن|مقارنة|الفرق/.test(text)) return null;
  const first = referenceIndex(text);
  const rest = text.replace(/(الاول|الأول|الثاني|الثالث|الرابع)/, "");
  const second = referenceIndex(rest) ?? (first === 0 ? 1 : 0);
  if (first == null) return [0, 1];
  return [first, second === first ? first + 1 : second];
}

function noteFor(state: ShoppingState) {
  const parts = [searchTerm(state)];
  if (state.gender === "female") parts.push("نسائي");
  if (state.gender === "male") parts.push("رجالي");
  if (state.maxPrice) parts.push(`لا يتجاوز ${state.maxPrice} دينار`);
  if (state.excludedBrands.length) parts.push(`بدون ${state.excludedBrands.join(" و")}`);
  return parts.filter(Boolean).join("، ");
}

function isSmallTalk(text: string) {
  return text.length < 4 || /^(مرحبا|اهلا|أهلا|هلا|هاي|السلام|شكرا|شكراً|hi|hello|hey|thanks)$/.test(text);
}

function normalize(message: string) {
  return message
    .replace(/[٠-٩]/g, (digit) => String(AR_DIGITS.indexOf(digit)))
    .replace(/[,٬]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
