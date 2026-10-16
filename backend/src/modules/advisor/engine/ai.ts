import { CatalogIndex } from "./catalog";
import { famousIn, SIMILAR_RE } from "./similar";
import { FacetKey, LEXICON, facetValue } from "./lexicon";
import { Parsed, understand } from "./nlu";
import { answerQuestion } from "./qa";
import { normalize, tokens } from "./text";
import { Intent, Need } from "./types";

/**
 * الذكاء الاصطناعي كمساعد احتياطي — لا كبديل:
 * • «ديما» تفهم بنفسها أولاً، ولا تستدعي النموذج إلا إن كان فهمها ضعيفاً فعلاً.
 * • النموذج يحوّل الرسالة إلى صفات بمعرّفات معجمنا فقط؛ الترشيح يبقى لخوارزميتنا.
 * • كل ما يأتي منه يُتحقق منه (معرّفات معروفة فقط) قبل الاستخدام.
 */

export interface AiParse {
  intent?: string;
  area?: string;
  kinds?: string[];
  concerns?: string[];
  skinType?: string;
  gender?: string;
  families?: string[];
  ingredients?: string[];
  freeFrom?: string[];
  finish?: string;
  time?: string;
  occasion?: string;
  recipient?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  similarTo?: string;
  query?: string;
  reply?: string;
}

const ids = (f: FacetKey) => LEXICON.filter((v) => v.facet === f).map((v) => v.id);
const VALID = new Map<FacetKey, Set<string>>(
  (["area", "kind", "concern", "skinType", "gender", "family", "ingredient", "freeFrom", "finish", "time", "occasion", "recipient"] as FacetKey[]).map(
    (f) => [f, new Set(ids(f))],
  ),
);

/** المعجم مضغوطاً للنموذج (معرّف=اسم) — يُبنى مرة واحدة ويثبت (يستفيد من كاش الطلبات). */
const vocab = (f: FacetKey) =>
  LEXICON.filter((v) => v.facet === f)
    .map((v) => `${v.id}=${v.label}`)
    .join(", ");

export const PARSE_SYSTEM = `You are the understanding layer of «ديما», an Iraqi beauty store assistant. Convert the shopper message (Iraqi Arabic, MSA, English or Franco) into JSON for the store engine.
Use ONLY these ids (id=meaning):
area: ${vocab("area")}
kinds: ${vocab("kind")}
concerns: ${vocab("concern")}
skinType: ${vocab("skinType")}
gender: ${vocab("gender")}
families: ${vocab("family")}
ingredients: ${vocab("ingredient")}
freeFrom: ${vocab("freeFrom")}
finish: ${vocab("finish")}
time: ${vocab("time")}
occasion: ${vocab("occasion")}
recipient: ${vocab("recipient")}
intent: recommend (wants products) | routine (full regimen) | knowledge (beauty question, how/why) | similar (smells/looks like a named product) | chat (greeting/small talk) | gift
Rules: omit unknown fields; never invent ids; prices in IQD ("50 ألف"=50000, "تحت 20"=maxPrice 20000); brand = brand name exactly as she wrote it; similarTo = the product/perfume she compares to; query = 1-4 Arabic words for anything the ids do not cover (as written on products); reply ONLY for knowledge/chat: max 2 short sentences, warm Iraqi feminine tone, no product names, no prices, no medical claims.
JSON only: {"intent":"","area":"","kinds":[],"concerns":[],"skinType":"","gender":"","families":[],"ingredients":[],"freeFrom":[],"finish":"","time":"","occasion":"","recipient":"","minPrice":null,"maxPrice":null,"brand":"","similarTo":"","query":"","reply":""}`;

const FILLERS = new Set(
  tokens(
    "اريد ابي احتاج ابغى عندكم اكو شي منتج منتجات افضل احسن ممكن لو سمحتي رجاء شنو شلون حبيبتي عيوني بليز وايد كلش هواية جدا كثير صاير صايرة صار يعني منفرد منفردة مفرد مفردة لوحدها بدون روتين please want need",
    { keepStop: true },
  ),
);

/**
 * هل فهم «ديما» ضعيف بما يستحق سؤال النموذج؟ (رخيص: لا شبكة، بلا آثار جانبية)
 * لا: التحيات، الأسئلة المعرفية المعروفة، «يشبه/بديل» المفهومة، والطلبات المفهومة.
 * نعم: رسالة من كلمتين فأكثر بلا أي صفة مفهومة، أو أغلب كلماتها غير مفهومة.
 */
export function needsAi(message: string, catalog: CatalogIndex): boolean {
  const m = message.trim();
  if (m.length < 4 || m.length > 400) return false;
  const words = tokens(m).filter((t) => !FILLERS.has(t) && t.length > 1);
  if (words.length < 2) return false;
  if (answerQuestion(m)) return false;
  const nm = normalize(m);
  if (SIMILAR_RE.test(nm) && famousIn(m)) return false;
  const parsed = understand(m, catalog);
  if (["greet", "thanks", "reset", "about", "help", "quiz", "cheaper", "pricier", "more", "deals"].includes(parsed.intent)) return false;
  const free = (parsed.delta.free ?? []).filter((w) => !FILLERS.has(w));
  const d = parsed.delta;
  const strong = Boolean(d.kinds?.length || d.concerns?.length || d.families?.length || d.brands?.length || d.ingredients?.length);
  const facetSignal = strong || Boolean(d.area || d.skinType || d.gender);
  const ratio = free.length / words.length;
  if (!facetSignal) return true;
  // مجال فقط («وجهي»، «شعري») وبقية الكلام وصفٌ لم نفهمه: «شي يخلي وجهي يلمع بالعرس».
  if (!strong && free.length && words.length >= 3) return true;
  if (words.length >= 3 && ratio >= 0.5) return true;
  if (words.length >= 7 && ratio >= 0.34) return true;
  return false;
}

const one = (f: FacetKey, v: unknown) => (typeof v === "string" && VALID.get(f)?.has(v) ? v : undefined);
const many = (f: FacetKey, v: unknown) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && Boolean(VALID.get(f)?.has(x))))] : [];
const money = (v: unknown) => (typeof v === "number" && v > 0 && v < 10_000_000 ? Math.round(v) : undefined);
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/** ينظّف رد النموذج: معرّفات معروفة فقط، أرقام معقولة، نصوص قصيرة. */
export function cleanAiParse(raw: Record<string, unknown>): AiParse {
  return {
    intent: typeof raw.intent === "string" ? raw.intent : undefined,
    area: one("area", raw.area),
    kinds: many("kind", raw.kinds),
    concerns: many("concern", raw.concerns),
    skinType: one("skinType", raw.skinType),
    gender: one("gender", raw.gender),
    families: many("family", raw.families),
    ingredients: many("ingredient", raw.ingredients),
    freeFrom: many("freeFrom", raw.freeFrom),
    finish: one("finish", raw.finish),
    time: one("time", raw.time),
    occasion: one("occasion", raw.occasion),
    recipient: one("recipient", raw.recipient),
    minPrice: money(raw.minPrice),
    maxPrice: money(raw.maxPrice),
    brand: text(raw.brand, 40),
    similarTo: text(raw.similarTo, 60),
    query: text(raw.query, 40),
    reply: text(raw.reply, 280),
  };
}

const INTENTS: Record<string, Intent> = { recommend: "recommend", routine: "routine", gift: "gift", similar: "similar", knowledge: "info", chat: "greet" };

/** يدمج فهم النموذج مع فهمنا: ما فهمناه نحن يبقى، والنموذج يملأ الفراغات. */
export function mergeAiParse(parsed: Parsed, ai: AiParse, catalog: CatalogIndex): Parsed {
  const d = { ...parsed.delta };
  const fill = <K extends keyof Need>(k: K, v: Need[K] | undefined) => {
    if (v == null || (Array.isArray(v) && !v.length)) return;
    const cur = d[k];
    if (cur == null || (Array.isArray(cur) && !cur.length)) (d as Record<string, unknown>)[k] = v;
  };
  fill("area", ai.area);
  // سُئل النموذج لأن فهمنا ضعيف: نوعه وعائلته أدق من قراءتنا («ريحة الصابون» عطرٌ لا شاور جل).
  if (ai.kinds?.length) d.kinds = ai.kinds;
  if (ai.families?.length) d.families = ai.families;
  if (ai.concerns?.length) d.concerns = [...new Set([...(d.concerns ?? []), ...ai.concerns])].slice(0, 3);
  fill("skinType", ai.skinType);
  fill("gender", ai.gender);
  fill("ingredients", ai.ingredients);
  fill("freeFrom", ai.freeFrom);
  fill("finish", ai.finish);
  fill("time", ai.time);
  fill("occasion", ai.occasion);
  fill("recipient", ai.recipient);
  fill("maxPrice", ai.maxPrice);
  fill("minPrice", ai.minPrice);
  if (ai.brand && !d.brands?.length) {
    const b = understand(ai.brand, catalog).delta.brands;
    if (b?.length) d.brands = b;
  }
  // كلمات حرة بقيت بلا معنى عندنا: نستبدلها بعبارة النموذج القصيرة.
  if (ai.query) d.free = tokens(ai.query).slice(0, 4);
  else if (d.kinds?.length || d.concerns?.length || d.families?.length) d.free = [];
  if (ai.kinds?.length && !d.area) {
    const a = ai.kinds.map((k) => facetValue("kind", k)?.area).find(Boolean);
    if (a) d.area = a;
  }
  const intent = parsed.intent === "recommend" && ai.intent && INTENTS[ai.intent] ? INTENTS[ai.intent] : parsed.intent;
  if (intent === "routine") d.routine = true;
  const hasProductSignal = Boolean(d.kinds?.length || d.concerns?.length || d.area || d.families?.length || d.brands?.length || d.free?.length);
  return { ...parsed, intent, delta: d, hasProductSignal };
}

// ───────────────────────────────────────────── إثراء الكتالوج (مرة لكل منتج)

export interface EnrichData {
  area?: string;
  kind?: string;
  gender?: string;
  families?: string[];
  concerns?: string[];
  skinTypes?: string[];
  finish?: string;
  notes?: string;
}

export const ENRICH_SYSTEM = `You label cosmetics products for an Iraqi beauty store using ONLY the given text (name, brand, category, description). Never guess what the text does not support; omit unknown fields.
ids (id=meaning):
area: ${vocab("area")}
kind: ${vocab("kind")}
gender (perfumes/deodorants only): ${vocab("gender")}
families (perfumes only): ${vocab("family")}
concerns: ${vocab("concern")}
skinTypes: ${vocab("skinType")}
finish (makeup only): ${vocab("finish")}
notes: perfumes only, up to 6 main notes in Arabic (e.g. "فانيلا، عنبر، ياسمين").
JSON only: {"items":[{"id":"","area":"","kind":"","gender":"","families":[],"concerns":[],"skinTypes":[],"finish":"","notes":""}]}`;

export function cleanEnrich(raw: Record<string, unknown>): EnrichData {
  return {
    area: one("area", raw.area),
    kind: one("kind", raw.kind),
    gender: one("gender", raw.gender),
    families: many("family", raw.families),
    concerns: many("concern", raw.concerns),
    skinTypes: many("skinType", raw.skinTypes),
    finish: one("finish", raw.finish),
    notes: text(raw.notes, 120),
  };
}

export const BRAND_SYSTEM = `Rate beauty brands sold in Iraq by reputation within their main category. A = reference/leading brand (dermatologist-recommended, prestige or iconic), B = good mainstream brand, C = little-known or budget.
Use your knowledge of the brand; if unsure, use C.
JSON only: {"items":[{"id":"","tier":"A|B|C"}]}`;

/** فهم النموذج ← صفات «ديما» (لحفظه عبارةً متعلّمة تُفهم لاحقاً محلياً). */
/** ما يُحفظ للتعلّم: فهمنا للرسالة مدموجاً بفهم النموذج (`base` = فهمنا المحلي إن وُجد). */
export function aiToDelta(ai: AiParse, catalog: CatalogIndex, base?: Parsed): { delta: Partial<Need>; intent?: string } {
  const empty: Parsed = { intent: "recommend", delta: {}, hasProductSignal: false, mentioned: new Set() };
  const merged = mergeAiParse(base ?? empty, ai, catalog);
  const d = merged.delta;
  const out: Partial<Need> = {};
  for (const k of ["area", "kinds", "concerns", "skinType", "gender", "families", "ingredients", "freeFrom", "finish", "time", "occasion", "recipient", "maxPrice", "minPrice", "brands", "free"] as const) {
    const v = d[k];
    if (v != null && !(Array.isArray(v) && !v.length)) (out as Record<string, unknown>)[k] = v;
  }
  const intent = ai.intent && ["routine", "gift", "similar", "knowledge"].includes(ai.intent) ? ai.intent : undefined;
  return { delta: out, intent };
}

/** دفعة رسائل لم تُفهم → فهم كل منها (تدريب على أسئلة الزبونات الحقيقية). */
export const BATCH_PARSE_SYSTEM = `${PARSE_SYSTEM.replace(/JSON only:[\s\S]*$/, "")}
You receive several messages, each with an id. Return JSON only: {"items":[{"id":"", ...same fields as above, no "reply"}]}`;

/** صيغ الزبونات لكل نوع/مشكلة: كيف تكتبها العراقية فعلاً. */
export const LANGUAGE_SYSTEM = `For an Iraqi beauty store, list how shoppers actually write each concept below: Iraqi dialect, MSA, common misspellings, English and Franco-Arabic (Arabic in Latin letters). 3 to 6 short phrases each (1-3 words), no duplicates of the given label.
JSON only: {"items":[{"id":"","phrases":["",""]}]}`;
