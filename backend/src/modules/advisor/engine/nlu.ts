import { CatalogIndex } from "./catalog";
import { CONCERN_AREA, FacetKey, KIND_BY_AREA, LEXICON, RECIPIENT_GENDER } from "./lexicon";
import { applyDialect, editDistance, normalize, parseMoney, stem, tokens } from "./text";
import { Intent, Need } from "./types";

/** ما استخرجته المستشارة من رسالة واحدة. */
export interface Parsed {
  intent: Intent;
  delta: Partial<Need> & { kinds?: string[]; concerns?: string[] };
  /** هل في الرسالة طلب منتج فعلي (صفة/نوع/براند)؟ */
  hasProductSignal: boolean;
  /** مفاتيح ذكرتها الزبونة صراحة (للحكم على الأسئلة المتبقية). */
  mentioned: Set<string>;
}

const SINGLE: FacetKey[] = [
  "area", "skinType", "gender", "time", "strength", "season", "finish", "coverage",
  "audience", "occasion", "recipient",
];

interface Phrase {
  facet: FacetKey;
  id: string;
  bare: string;
  latin: boolean;
  /** عبارات الزبونة تُطابق الكلمة كما كُتبت (بلا تجذيع): «لزوجي» ≠ «لزوجتي». */
  raw: boolean;
}

const KIND_AREA_NLU = new Map(LEXICON.filter((x) => x.facet === "kind" && x.area).map((x) => [x.id, x.area!]));

const FACET_PRIORITY = (f: FacetKey) => (f === "kind" ? 0 : f === "area" ? 2 : 1);

/** كلمات مطبّعة + لهجة، بلا تجذيع (بنفس فهرسة `tokens`). */
const rawWords = (text: string) =>
  normalize(text)
    .split(" ")
    .map(applyDialect)
    .filter(Boolean);

/** عبارات المعجم + عبارات الزبونة (`ask`) مترجمة مرة واحدة، الأطول أولاً. */
const PHRASES: Phrase[] = LEXICON.flatMap((fv) => [
  ...fv.terms.map((t) => {
    const b = tokens(t, { keepStop: true }).join(" ");
    return { facet: fv.facet, id: fv.id, bare: b, latin: /^[a-z0-9 ]+$/.test(b), raw: false };
  }),
  ...(fv.ask ?? []).map((t) => {
    const b = rawWords(t).join(" ");
    return { facet: fv.facet, id: fv.id, bare: b, latin: /^[a-z0-9 ]+$/.test(b), raw: true };
  }),
])
  .filter((p) => p.bare.length >= 2)
  // الأطول أولاً، وعند التساوي النوع قبل المجال («مناكير» = طلاء أظافر لا مجرد «أظافر»).
  .sort((a, b) => b.bare.length - a.bare.length || FACET_PRIORITY(a.facet) - FACET_PRIORITY(b.facet));

// تمر بنفس المعالجة (تطبيع/لهجة/تجذيع) حتى تطابق كلمات الرسالة.
const norms = (list: string[]) => new Set(list.flatMap((w) => tokens(w, { keepStop: true })));
const NEGATORS = norms(["بدون", "بلا", "ليس", "مو", "ما", "لا", "غير", "no", "without", "not", "except", "عدا", "ماريد", "مااريد", "مااحب"]);
// كلمات قد تفصل النفي عن المنفي («مو من ميبلين»، «ما احب الحلو»).
const NEG_VERBS = norms(["احب", "اريد", "يعجب", "يعجبني", "تعجبني", "يناسب", "يناسبني", "like", "want", "اكره", "من", "from"]);

/** هل العبارة عند الموضع مسبوقة بنفي؟ («ما احب الحلو»، «بدون عطر»، «مو زيتي») */
function negatedAt(words: string[], start: number): boolean {
  for (let k = 1; k <= 3 && start - k >= 0; k++) {
    const w = words[start - k];
    if (NEGATORS.has(w)) return true;
    if (!NEG_VERBS.has(w)) break;
  }
  return false;
}

const RE = {
  reset: /(من جديد|ابدي من جديد|نبدا من جديد|امسحي|reset|start over|انسي كل)/,
  greet: /^(مرحبا|هلا|اهلا|هلو|هاي|السلام عليكم|سلام|صباح الخير|مساء الخير|صباحو|مساءو|hi|hello|hey|good morning|good evening)( (يا )?\S+)?$/,
  thanks: /(شكرا|مشكوره|مشكور|تسلمين|تسلمي|يعطيج العافيه|thank|thanks|ممنونه|حبيبتي)/,
  help: /(شنو تكدرين|ماذا تستطيعين|شتسوين|من انتي|منو انتي|كيف تساعدين|help|what can you|ساعديني)/,
  more: /(غيرهم|غيرها|غير هاي|غير هذه|غير هذي|اكثر|بعد شي|ثانيه|ثاني|other|more|another|else|بدايل|بدائل)/,
  cheaper: /(ارخص|اقل سعر|اقل من هذا|مو غالي|ميزانيه اقل|cheaper|less expensive|budget)/,
  pricier: /(اغلى|ارقى|فاخر|فخم|براند عالمي|premium|luxury|high end)/,
  deals: /(عروض|عرض|خصم|خصومات|تخفيض|تخفيضات|تنزيلات|sale|offer|deal|discount)/,
  routine: /(روتين|routine|خطوات|كامل للبشره|كامل للشعر|نظام عنايه)/,
  quiz: /(اختبار|quiz|اكتشفي|اكتشف|ساعديني اختار|ساعديني اختار|اختاري الي|اختاري لي)/,
  about: /(اسمك|شسمك|ما اسمك|من انتي)/,
};

const SORT_RE: [RegExp, Need["sort"]][] = [
  [/(الارخص|ارخص شي|اقل سعر|cheapest|lowest price)/, "cheap"],
  [/(الاكثر مبيعا|الاكثر طلبا|الاشهر|ترند|ترندي|best seller|bestseller|popular|مشهور)/, "best"],
  [/(الاعلى تقييم|افضل تقييم|top rated|اعلى تقييم|اقوى شي|افضل شي|الافضل)/, "rated"],
  [/(جديد|الجديد|احدث|new arrival|newest|latest)/, "new"],
  // «فخم/راقي» تفضيل للأرقى لا كلمة بحث.
  [/(فخم|فخمه|فاخر|فاخره|راقي|راقيه|ارقى|براند عالمي|luxury|premium|high end)/, "premium"],
];

function parseBudget(norm: string): { min?: number; max?: number } {
  const num = String.raw`(\d+(?:\.\d+)?)\s*(الف|الاف|k|ك|مليون)?`;
  const between = norm.match(new RegExp(`(بين|من)\\s*${num}\\s*(و|الى|ل|-|to)\\s*${num}`));
  if (between) {
    const a = parseMoney(`${between[2]} ${between[3] ?? between[7] ?? ""}`);
    const b = parseMoney(`${between[5]} ${between[6] ?? ""}`);
    if (a && b) return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const max = norm.match(
    new RegExp(`(تحت|اقل من|ما يتعدى|مايتعدى|لا يتجاوز|ما يتجاوز|لحد|حد|الى|ل حد|بحدود|حدود|ميزانيتي|ميزانيه|بسعر|ب|under|below|max|up to|less than|budget)\\s*${num}`),
  );
  if (max) {
    const n = parseMoney(`${max[2]} ${max[3] ?? ""}`);
    if (n) return { max: n };
  }
  const min = norm.match(new RegExp(`(فوق|اكثر من|اعلى من|above|over|more than|من)\\s*${num}`));
  if (min) {
    const n = parseMoney(`${min[2]} ${min[3] ?? ""}`);
    if (n && n >= 1000) return { min: n };
  }
  const bareAmount = norm.match(new RegExp(`${num}\\s*(دينار|د ع|iqd)`)) ?? norm.match(/(\d+)\s*(الف|الاف)/);
  if (bareAmount) {
    const n = parseMoney(`${bareAmount[1]} ${bareAmount[2] ?? ""}`);
    if (n) return { max: n };
  }
  return {};
}

const GENERIC_FORMS = new Set(tokens("كريم كريمات منتج منتجات نوع انواع", { keepStop: true }));

/** صيغة خفيفة للمطابقة مع عبارات الزبونة: «وثابته» ← «ثابت»، «حلوه» ← «حلو». */
const lite = (w: string) => {
  let x = w;
  if (x.length >= 5 && x.startsWith("و")) x = x.slice(1);
  if (x.length >= 4 && x.endsWith("ه")) x = x.slice(0, -1);
  return x;
};

// مديح عام لا صفة: «عطر ريحته حلوة» = رائحته جميلة، لا «عائلة حلوة».
const NEUTRAL_RE = /(ريحت(ه|ها)|ريحه|رائحت(ه|ها)|رائحه|ريحتو)\s+(حلو|حلوه|طيبه|طيب|زينه|حلوة)/g;

export function understand(message: string, catalog: CatalogIndex): Parsed {
  message = normalize(message).replace(NEUTRAL_RE, " ");
  const norm = normalize(message);
  const raws = rawWords(message);
  const lites = raws.map(lite);
  const words = raws.map(stem);
  const mentioned = new Set<string>();
  const delta: Parsed["delta"] = {};
  const consumed = new Set<number>();

  // ── صفات المعجم (الأطول أولاً، مع النفي)
  const multi: Record<string, string[]> = {};
  const single: Record<string, string> = {};
  const avoid: string[] = [];
  for (const p of PHRASES) {
    const pw = p.bare.split(" ");
    for (let i = 0; i + pw.length <= words.length; i++) {
      let ok = true;
      for (let j = 0; j < pw.length; j++) {
        const w = p.raw ? raws[i + j] : words[i + j];
        const target = pw[j];
        const alt = p.raw ? lites[i + j] : w;
        if (p.latin && j === pw.length - 1 ? !w.startsWith(target) : w !== target && alt !== target) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      // عبارة أطول سبقت واستهلكت هذه الكلمات (مثل «بشرة جافة» قبل «جافة»).
      let overlap = false;
      for (let j = 0; j < pw.length; j++) if (consumed.has(i + j)) overlap = true;
      if (overlap) continue;
      for (let j = 0; j < pw.length; j++) consumed.add(i + j);
      mentioned.add(p.facet);
      if (negatedAt(words, i) || (p.facet === "freeFrom")) {
        if (p.facet === "freeFrom") (multi.freeFrom ??= []).push(p.id);
        else avoid.push(`${p.facet}:${p.id}`);
        continue;
      }
      if (SINGLE.includes(p.facet)) single[p.facet] = p.id;
      else (multi[p.facet] ??= []).push(p.id);
    }
  }

  // نوع البشرة مقابل مشكلة بنفس الاسم: «بشرتي دهنية» = نوع بشرة.
  if (single.skinType && multi.concern) {
    const map: Record<string, string> = { oily: "oily", dry: "dryness", sensitive: "sensitive" };
    multi.concern = multi.concern.filter((c) => c !== map[single.skinType]);
  }

  const uniq = (a?: string[]) => (a ? [...new Set(a)] : undefined);
  if (multi.kind) delta.kinds = uniq(multi.kind);
  if (multi.concern) delta.concerns = uniq(multi.concern);
  if (multi.ingredient) delta.ingredients = uniq(multi.ingredient);
  if (multi.freeFrom) delta.freeFrom = uniq(multi.freeFrom);
  if (multi.family) delta.families = uniq(multi.family);
  if (multi.attr) delta.attrs = uniq(multi.attr);
  for (const [k, val] of Object.entries(single)) (delta as Record<string, unknown>)[k] = val;
  if (avoid.length) delta.avoid = avoid;

  // المُهدى إليه يحدد جنس العطر إن لم يُذكر.
  if (single.recipient && !single.gender && RECIPIENT_GENDER[single.recipient]) {
    delta.gender = RECIPIENT_GENDER[single.recipient];
  }
  // مشكلة أو نوع بشرة يحدد المجال.
  if (!single.area && delta.concerns?.length) {
    const area = CONCERN_AREA[delta.concerns[0]];
    if (area) delta.area = area;
  }
  if (!delta.area && single.skinType && !delta.kinds?.length) delta.area = "skin";

  // «ثابت/يدوم» للعطر = تركيز عالٍ، ولغير العطر = ثبات طويل (مكياج يدوم).
  const kindArea = delta.kinds?.map((k) => KIND_AREA_NLU.get(k)).find(Boolean);
  if (delta.strength === "parfum" && (delta.area ?? kindArea) && (delta.area ?? kindArea) !== "fragrance") {
    delete delta.strength;
    delta.attrs = [...new Set([...(delta.attrs ?? []), "longwear"])];
  }

  // النوع يتبع المجال: «مرطب للجسم» = لوشن جسم، «سيروم للشعر» = سيروم شعر.
  if (delta.kinds?.length && delta.area) {
    const remap = KIND_BY_AREA[delta.area];
    if (remap) delta.kinds = [...new Set(delta.kinds.map((k) => remap[k] ?? k))];
  }

  // ── البراندات (مع تحمّل أخطاء الكتابة للأسماء اللاتينية الطويلة)
  const brands: string[] = [];
  const excludeBrands: string[] = [];
  const aliases = [...catalog.brandAliases.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, ids] of aliases) {
    const aw = alias.split(" ");
    for (let i = 0; i + aw.length <= words.length; i++) {
      let ok = true;
      for (let j = 0; j < aw.length; j++) {
        if (consumed.has(i + j)) {
          ok = false;
          break;
        }
        const w = words[i + j];
        const a = aw[j];
        const fuzzy = a.length >= 6 && /^[a-z]+$/.test(a) && editDistance(w, a, 1) <= 1;
        if (w !== a && raws[i + j] !== a && !fuzzy) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let j = 0; j < aw.length; j++) consumed.add(i + j);
      (negatedAt(words, i) ? excludeBrands : brands).push(...ids);
      break;
    }
  }
  if (brands.length) delta.brands = [...new Set(brands)];
  if (excludeBrands.length) delta.excludeBrands = [...new Set(excludeBrands)];
  if (brands.length || excludeBrands.length) mentioned.add("brand");

  // ── الميزانية والترتيب
  const budget = parseBudget(norm);
  if (budget.max) delta.maxPrice = budget.max;
  if (budget.min) delta.minPrice = budget.min;
  if (budget.max || budget.min) mentioned.add("budget");
  for (const [re, sort] of SORT_RE) {
    if (re.test(norm)) {
      delta.sort = sort;
      break;
    }
  }

  // ── النية
  let intent: Intent = "recommend";
  const hasProductSignal = Boolean(
    delta.kinds?.length || delta.concerns?.length || delta.area || delta.families?.length ||
      delta.brands?.length || delta.ingredients?.length || delta.skinType || delta.gender,
  );
  if (RE.reset.test(norm)) intent = "reset";
  else if (RE.greet.test(norm) && !hasProductSignal) intent = "greet";
  else if (RE.thanks.test(norm) && !hasProductSignal && words.length <= 5) intent = "thanks";
  else if (RE.about.test(norm) && !hasProductSignal) intent = "about";
  else if (RE.help.test(norm) && !hasProductSignal) intent = "help";
  else if (RE.quiz.test(norm) && !hasProductSignal) intent = "quiz";
  else if (RE.routine.test(norm)) intent = "routine";
  else if (single.occasion === "gift" || single.recipient) intent = "gift";
  else if (RE.cheaper.test(norm) && !hasProductSignal) intent = "cheaper";
  else if (RE.pricier.test(norm) && !hasProductSignal) intent = "pricier";
  else if (RE.deals.test(norm)) intent = "deals";
  else if (RE.more.test(norm) && !hasProductSignal) intent = "more";
  if (intent === "routine") delta.routine = true;
  if (intent === "deals") delta.sort = "deals";

  // ── كلمات حرة لم تُستهلك (للبحث النصي): أسماء منتجات، ألوان، روائح غير مدرجة…
  const INTENT_WORDS = new Set(
    tokens(
      "اريد ابي احتاج عندي شي منتج منتجات افضل احسن اقترحي اقترح نصيحه انصحيني شنو شلون كيف ممكن يا حلوه حبيبتي " +
        "ابحث عن عندكم لديكم يوجد توجد اكو ماكو عطيني دليني ساعديني بس رجاء لو سمحتي please show me recommend suggest best good",
      { keepStop: true },
    ),
  );
  const free = words.filter(
    (w, i) => !consumed.has(i) && w.length >= 3 && !INTENT_WORDS.has(w) && !/^\d+$/.test(w) &&
      !["الف", "دينار", "تحت", "فوق", "بين", "ارخص", "اغلى"].includes(w) &&
      // كلمات الترتيب والنوايا («فخم»، «عروض»، «جديد») ليست أسماء منتجات.
      !SORT_RE.some(([re]) => re.test(w)) && !RE.deals.test(w) && !RE.cheaper.test(w) && !RE.pricier.test(w) &&
      // «كريم» مع نوع محدد («كريم واقي شمس») صيغة لا كلمة بحث.
      !(delta.kinds?.length && GENERIC_FORMS.has(w)) &&
      // أدوات النفي وما نُفي (براند غير متوفر مثلاً) لا يُبحث عنه.
      !NEGATORS.has(w) && !negatedAt(words, i),
  );
  if (free.length) delta.free = free;

  return { intent, delta, hasProductSignal: hasProductSignal || free.length > 0, mentioned };
}

/** أفعال الشرائح: `set:skinType=oily`، `add:concern=acne`، `unset:maxPrice`، `act:more`. */
export function parseAction(value: string): { op: string; key: string; val?: string } | null {
  const m = value.match(/^(set|add|unset|act|quiz|skip):([a-zA-Z_]+)(?:=(.+))?$/);
  if (!m) return null;
  return { op: m[1], key: m[2], val: m[3] };
}
