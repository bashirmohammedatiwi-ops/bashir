import { Concern, ProductKind, ShoppingState } from "./types";

export type SkinType = "oily" | "dry" | "sensitive" | "combination" | "normal";
export type HairType = "oily" | "dry" | "colored" | "curly";

/** معلومات ثابتة عن الزبونة تبقى بين المحادثات. الطلب نفسه ما ينحفظ هنا. */
export type CustomerProfile = {
  skinType?: SkinType;
  hairType?: HairType;
  sensitivities: string[];
  likedBrands: string[];
  avoidBrands: string[];
};

export type ProfileFacts = {
  skinType?: SkinType;
  hairType?: HairType;
  sensitivities?: string[];
  likedBrandWords?: string[];
  avoidBrandWords?: string[];
};

export const emptyProfile = (): CustomerProfile => ({ sensitivities: [], likedBrands: [], avoidBrands: [] });

const HAIR_KINDS: ProductKind[] = ["shampoo", "mask"];
const SKIN_KINDS: ProductKind[] = ["cream", "moisturizer", "cleanser", "sunscreen"];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/** يلتقط بس الحقائق اللي الزبونة قالتها عن نفسها، مو طلب الشراء. */
export function extractProfileFacts(message: string): ProfileFacts {
  const text = normalize(message);
  const facts: ProfileFacts = {};

  const skin = text.match(/(?:بشرتي|بشرتى|بشره وجهي|my skin(?: is)?)\s*(?:جدا\s*)?(دهني|دهنيه|جاف|جافه|حساس|حساسه|مختلط|مختلطه|عادي|عاديه|oily|dry|sensitive|combination|normal)/);
  if (skin) facts.skinType = skinFrom(skin[1]);

  const hair = text.match(/(?:شعري|شعرى|my hair(?: is)?)\s*(?:جدا\s*)?(دهني|جاف|خشن|مصبوغ|صابغته|مجعد|كيرلي|oily|dry|colou?red|curly)/);
  if (hair) facts.hairType = hairFrom(hair[1]);

  const allergy = [...text.matchAll(/حساسي(?:ه|ة)? (?:من|على|ضد) ([\u0600-\u06FFa-z]+(?: [\u0600-\u06FFa-z]+)?)/g)].map((match) => allergenFrom(match[1]));
  const english = [...text.matchAll(/allergic to ([a-z]+)/g)].map((match) => allergenFrom(match[1]));
  const sensitivities = [...new Set([...allergy, ...english].filter(Boolean))];
  if (sensitivities.length) facts.sensitivities = sensitivities;

  const liked = [...text.matchAll(/(?:احب|يعجبني|افضل|ارتاح (?:على|ل)|i like|i love) (?:منتجات |شركه |ماركه |براند )?([a-z\u0600-\u06FF']{3,})/g)].map((match) => match[1]);
  const avoided = [...text.matchAll(/(?:ما احب|مااحب|ما يعجبني|ما ارتاح (?:على|ل)|ما اريد|لا تجيبيلي|لا تقترحين|i don'?t like|i hate) (?:منتجات |شركه |ماركه |براند )?([a-z\u0600-\u06FF']{3,})/g)].map((match) => match[1]);
  const avoidSet = new Set(avoided);
  const likedClean = liked.filter((word) => !avoidSet.has(word) && !/^(ما|لا)$/.test(word));
  if (likedClean.length) facts.likedBrandWords = likedClean;
  if (avoided.length) facts.avoidBrandWords = avoided;
  return facts;
}

export function hasFacts(facts: ProfileFacts) {
  return Boolean(facts.skinType || facts.hairType || facts.sensitivities?.length || facts.likedBrandWords?.length || facts.avoidBrandWords?.length);
}

function skinFrom(word: string): SkinType {
  if (/دهن|oily/.test(word)) return "oily";
  if (/جاف|dry/.test(word)) return "dry";
  if (/حساس|sensitive/.test(word)) return "sensitive";
  if (/مختلط|combination/.test(word)) return "combination";
  return "normal";
}

function hairFrom(word: string): HairType {
  if (/دهن|oily/.test(word)) return "oily";
  if (/صبغ|صابغ|colou?red/.test(word)) return "colored";
  if (/مجعد|كيرلي|curly/.test(word)) return "curly";
  return "dry";
}

function allergenFrom(raw: string) {
  const word = raw.trim();
  if (/عطر|عطور|ريحه|روائح|fragrance|perfume|parfum/.test(word)) return "fragrance";
  if (/بارابين|paraben/.test(word)) return "paraben";
  if (/كحول|alcohol/.test(word)) return "alcohol";
  if (/سلفات|sulfate|sulphate/.test(word)) return "sulfate";
  if (/نيكل|nickel/.test(word)) return "nickel";
  return word.split(" ")[0];
}

/** يدمج حقائق جديدة. الشركة اللي انقالت «ما احبها» تطلع من المفضلة والعكس. */
export function mergeProfile(profile: CustomerProfile, facts: ProfileFacts, liked: string[] = [], avoided: string[] = []): CustomerProfile {
  const avoidBrands = [...new Set([...profile.avoidBrands.filter((brand) => !liked.includes(brand)), ...avoided])];
  const likedBrands = [...new Set([...profile.likedBrands.filter((brand) => !avoided.includes(brand)), ...liked])];
  return {
    skinType: facts.skinType ?? profile.skinType,
    hairType: facts.hairType ?? profile.hairType,
    sensitivities: [...new Set([...profile.sensitivities, ...(facts.sensitivities ?? [])])].slice(0, 8),
    likedBrands: likedBrands.slice(0, 8),
    avoidBrands: avoidBrands.slice(0, 12),
  };
}

function isHairRequest(state: ShoppingState, message: string) {
  return HAIR_KINDS.includes(state.kind) || (state.kind === "serum" && /شعر|فروه|فروة|hair|scalp/.test(message));
}

function isSkinRequest(state: ShoppingState, message: string) {
  return SKIN_KINDS.includes(state.kind) || (state.kind === "serum" && /بشر|وجه|skin|face/.test(message));
}

/** المشكلة اللي نعرفها من الملف إذا الطلب ما حددها. */
export function profileConcern(state: ShoppingState, profile: CustomerProfile, message: string): Concern | undefined {
  if (state.concern) return undefined;
  if (isHairRequest(state, message)) {
    if (profile.hairType === "oily" || profile.hairType === "dry" || profile.hairType === "colored") return profile.hairType;
    return undefined;
  }
  if (isSkinRequest(state, message)) {
    if (profile.skinType === "oily" || profile.skinType === "dry" || profile.skinType === "sensitive") return profile.skinType;
  }
  return undefined;
}

/** يكفي الملف بدل سؤال التوضيح إذا يعرف نوع البشرة أو الشعر للقسم المطلوب. */
export function profileAnswersClarify(kind: ProductKind | undefined, profile: CustomerProfile) {
  if (!kind) return false;
  if (HAIR_KINDS.includes(kind)) return profile.hairType === "oily" || profile.hairType === "dry" || profile.hairType === "colored";
  if (SKIN_KINDS.includes(kind)) return profile.skinType === "oily" || profile.skinType === "dry" || profile.skinType === "sensitive";
  return false;
}

/** يطبّق الملف على طلب جديد: الشركات الممنوعة والمفضلة، والمشكلة إذا الطلب ما حددها. */
export function applyProfile(state: ShoppingState, profile: CustomerProfile, message: string, canonical: (brand: string) => string): ShoppingState {
  const excluded = [...new Set([...state.excludedBrands, ...profile.avoidBrands.map(canonical)])];
  const next: ShoppingState = { ...state, excludedBrands: excluded, preferBrands: profile.likedBrands, about: profileSummary(profile) || undefined };
  const concern = profileConcern(state, profile, message);
  if (concern) {
    next.concern = concern;
    next.fromProfile = true;
    next.profileNote = isHairRequest(state, message)
      ? `شعرج ${HAIR_LABEL[profile.hairType as HairType]}`
      : `بشرتج ${SKIN_LABEL[profile.skinType as SkinType]}`;
  }
  return next;
}

const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  fragrance: /fragrance|parfum|perfume|عطر|معطر/i,
  paraben: /paraben|بارابين/i,
  alcohol: /alcohol denat|ethanol|كحول/i,
  sulfate: /sulfate|sulphate|سلفات/i,
};

/** يشيل المنتجات اللي مكتوب بمكوناتها شي عندها حساسية منه. العطور نفسها ما تتشال إذا طلبت عطر. */
export function triggersSensitivity(row: { ingredients?: string; description?: string; nameAr?: string; nameEn?: string }, profile: CustomerProfile, kind: ProductKind) {
  for (const allergen of profile.sensitivities) {
    if (allergen === "fragrance" && (kind === "perfume" || kind === "splash")) continue;
    const pattern = ALLERGEN_PATTERNS[allergen] ?? new RegExp(allergen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const hay = allergen === "fragrance" ? row.ingredients ?? "" : `${row.ingredients ?? ""} ${row.description ?? ""}`;
    if (pattern.test(hay)) return true;
  }
  return false;
}

const SKIN_LABEL: Record<SkinType, string> = { oily: "دهنية", dry: "جافة", sensitive: "حساسة", combination: "مختلطة", normal: "عادية" };
const HAIR_LABEL: Record<HairType, string> = { oily: "دهني", dry: "جاف", colored: "مصبوغ", curly: "مجعد" };
const ALLERGEN_LABEL: Record<string, string> = { fragrance: "العطور", paraben: "البارابين", alcohol: "الكحول", sulfate: "السلفات", nickel: "النيكل" };

export function profileSummary(profile: CustomerProfile) {
  return [
    profile.skinType ? `بشرتها ${SKIN_LABEL[profile.skinType]}` : "",
    profile.hairType ? `شعرها ${HAIR_LABEL[profile.hairType]}` : "",
    profile.sensitivities.length ? `حساسية من ${profile.sensitivities.map((item) => ALLERGEN_LABEL[item] ?? item).join(" و")}` : "",
    profile.likedBrands.length ? `تحب ${profile.likedBrands.join(" و")}` : "",
    profile.avoidBrands.length ? `ما تحب ${profile.avoidBrands.join(" و")}` : "",
  ].filter(Boolean).join("، ");
}

export function learnedReply(lang: "ar" | "en", facts: ProfileFacts, liked: string[], avoided: string[]) {
  if (lang === "en") return "Got it, I'll remember that.";
  const bits = [
    facts.skinType ? `بشرتج ${SKIN_LABEL[facts.skinType]}` : "",
    facts.hairType ? `شعرج ${HAIR_LABEL[facts.hairType]}` : "",
    facts.sensitivities?.length ? `عندج حساسية من ${facts.sensitivities.map((item) => ALLERGEN_LABEL[item] ?? item).join(" و")}` : "",
    liked.length ? `تحبين ${liked.join(" و")}` : "",
    avoided.length ? `ما تحبين ${avoided.join(" و")}` : "",
  ].filter(Boolean);
  return bits.length ? `تمام، راح أتذكر إن ${bits.join(" و")}.` : "";
}

export function describeProfile(lang: "ar" | "en", profile: CustomerProfile) {
  const summary = profileSummary(profile);
  if (lang === "en") return summary ? `Here's what I remember: ${summary}. Say "forget my info" to clear it.` : "I don't have anything saved about you yet.";
  if (!summary) return "لحد هسه ما حافظة شي عنج. إذا قلتيلي نوع بشرتج أو شعرج أو الشركات اللي تحبينها، أتذكرها للمرات الجاية.";
  const personal = summary
    .replace(/بشرتها/g, "بشرتج")
    .replace(/شعرها/g, "شعرج")
    .replace(/حساسية من/g, "عندج حساسية من")
    .replace(/تحب /g, "تحبين ")
    .replace(/ما تحب /g, "ما تحبين ");
  return `هذا اللي أتذكره عنج: ${personal}. إذا تريدين أمسحه قوليلي «انسي معلوماتي».`;
}

export function isMemoryQuestion(message: string) {
  return /شنو تعرفين عني|شتعرفين عني|شنو تتذكرين|شتتذكرين|شنو حافظه عني|شنو حافظة عني|what do you (know|remember) about me/i.test(message);
}

export function isForgetRequest(message: string) {
  return /انسي معلوماتي|انسي كل شي عني|امسحي معلوماتي|انسيني|forget (me|my info)/i.test(message);
}
