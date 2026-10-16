import { CatalogIndex, LearnedPhrase } from "./catalog";
import { CONCERN_AREA, FacetKey, KIND_BY_AREA, LEXICON, RECIPIENT_GENDER } from "./lexicon";
import { applyDialect, editDistance, normalize, parseMoney, stem, tokens } from "./text";
import { Intent, Need } from "./types";
import { correctWord } from "./spell";

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
  /** كلماتها مقسّمة مسبقاً. */
  pw: string[];
}

const KIND_AREA_NLU = new Map(LEXICON.filter((x) => x.facet === "kind" && x.area).map((x) => [x.id, x.area!]));

const FACET_PRIORITY = (f: FacetKey) => (f === "kind" ? 0 : f === "area" ? 2 : 1);

/** مفتاح عبارة متعلّمة: كلماتها كما تُقارن داخل `understand` (مطبّعة ومجذّعة). */
export function phraseWords(text: string): string[] {
  return rawWords(text).map(stem);
}

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
    return { facet: fv.facet, id: fv.id, bare: b, latin: /^[a-z0-9 ]+$/.test(b), raw: false, pw: b.split(" ") };
  }),
  ...(fv.ask ?? []).map((t) => {
    const b = rawWords(t).join(" ");
    return { facet: fv.facet, id: fv.id, bare: b, latin: /^[a-z0-9 ]+$/.test(b), raw: true, pw: b.split(" ") };
  }),
])
  .filter((p) => p.bare.length >= 2)
  // الأطول أولاً، وعند التساوي النوع قبل المجال («مناكير» = طلاء أظافر لا مجرد «أظافر»).
  .sort((a, b) => b.bare.length - a.bare.length || FACET_PRIORITY(a.facet) - FACET_PRIORITY(b.facet));

/** عبارات من كلمة واحدة لأخطاء الكتابة (الأنواع والمشاكل والمكونات والروائح). */
const FUZZY_FACETS = new Set<FacetKey>(["kind", "concern", "ingredient", "family", "skinType"]);
const FUZZY_PHRASES = PHRASES.filter((p) => !p.raw && !p.bare.includes(" ") && p.bare.length >= 4 && FUZZY_FACETS.has(p.facet));

// تمر بنفس المعالجة (تطبيع/لهجة/تجذيع) حتى تطابق كلمات الرسالة.
const norms = (list: string[]) => new Set(list.flatMap((w) => tokens(w, { keepStop: true })));
const NEGATORS = norms(["بدون", "بلا", "ليس", "مو", "ما", "لا", "غير", "no", "without", "not", "except", "عدا", "ماريد", "مااريد", "مااحب"]);
// كلمات قد تفصل النفي عن المنفي («مو من ميبلين»، «ما احب الحلو»).
const NEG_VERBS = norms(["احب", "اريد", "يعجب", "يعجبني", "تعجبني", "يناسب", "يناسبني", "like", "want", "اكره", "من", "from", "الريحه", "الرائحه", "الروائح"]);

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
  routine: /(روتين|routine|خطوات|كامل للبشره|كامل للشعر|نظام عنايه|من الصفر|ابدي اعتني|ابدا اعتني|ابدي اهتم|ابدا اهتم)/,
  quiz: /(اختبار|quiz|اكتشفي|اكتشف|ساعديني اختار|ساعديني اختار|اختاري الي|اختاري لي)/,
  about: /(اسمك|شسمك|ما اسمك|من انتي)/,
  look: /(لوك|look|مكياج( \S+)? (كامل|متكامل)|سله مكياج|طقم مكياج|عده مكياج|مكياج عروس|مكياج عرس|full makeup|makeup look)/,
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

/** الحجم: «حجم كبير/اقتصادي» ← الأكبر، «ميني/للسفر» ← الأصغر. */
const SIZE_BIG_RE = /(حجم (كبير|اكبر|عائلي|اقتصادي)|الحجم الكبير|الحجم الاكبر|كبير الحجم|اكبر حجم|عبوه كبيره|اقتصادي|جامبو|jumbo|large size|big size|bigger size)/;
const SIZE_SMALL_RE = /(حجم (صغير|اصغر|سفر|تجربه)|الحجم الصغير|صغير الحجم|اصغر حجم|ميني|mini|للسفر|travel size|travel|عبوه صغيره|حجم تجريبي)/;

/** «بدون روتين»، «منتجات منفردة»، «كل واحد لوحده»: منتجات مفردة لا روتين. */
export const NO_ROUTINE_RE =
  /(منتج(ات)? (مفرد|منفرد|منفصل)|منفرد(ه|ين)?|مفرد(ه)?|منفصل(ه|ين)?|لوحد(ه|ها|هم)|بس منتج|منتج واحد|(مو|مش|بدون|بلا|ما اريد|ما ابي|لا اريد|مابي) ?روتين|without (a )?routine|single products?)/;

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

/** صفات سياقية: لا تحدد نوع المنتج بنفسها، لكن كلماتها دليل للنموذج عليه (كلمات المجال لا: «رجلي» قدم لا رجل). */
const CONTEXT_FACETS = new Set<FacetKey>(["coverage", "attr", "occasion", "time", "season", "finish"]);

/** أسماء البراندات مرتبة (الأطول أولاً) ومقسّمة — تُحسب مرة لكل فهرس. */
const aliasCache = new WeakMap<CatalogIndex, [string, string[], string[]][]>();
function sortedAliases(catalog: CatalogIndex): [string, string[], string[]][] {
  let list = aliasCache.get(catalog);
  if (!list) {
    list = [...catalog.brandAliases.entries()].sort((a, b) => b[0].length - a[0].length).map(([a, ids]) => [a, ids, a.split(" ")]);
    aliasCache.set(catalog, list);
  }
  return list;
}

export function understand(message: string, catalog: CatalogIndex, spelled = false): Parsed {
  message = normalize(message).replace(NEUTRAL_RE, " ");
  const norm = normalize(message);
  const raws = rawWords(message);
  const lites = raws.map(lite);
  const words = raws.map(stem);
  // «وحب الشباب»: الواو الملتصقة بكلمة قصيرة (التجذيع لا يزيلها حتى لا يخرب «ورد»).
  // وكذلك اللام والباء: «لحب الشباب»، «بحب الشباب» (بديل مطابقة فقط، الأصل يبقى).
  const deW = raws.map((w, i) => (w.length >= 3 && (/^[ولب]/.test(w) && (w.length <= 4 || /^[لب]/.test(w))) ? stem(w.slice(1)) : words[i]));
  const mentioned = new Set<string>();
  const delta: Parsed["delta"] = {};
  const consumed = new Set<number>();
  /** أي صفة استهلكت كل كلمة (لنعرف كلمات السياق: «ايدي»، «يغطي»، «بالعرس»). */
  const consumedBy = new Map<number, FacetKey>();

  // ── صفات المعجم (الأطول أولاً، مع النفي)
  const multi: Record<string, string[]> = {};
  const single: Record<string, string> = {};
  const avoid: string[] = [];

  // ── ما تعلّمته «ديما» من التدريب: عبارات الزبونات ← معناها (محلياً، بلا ذكاء خارجي).
  // العبارات الكاملة والمتعددة الكلمات قبل المعجم: هي فهمٌ أدق لصيغة الزبونة بالذات.
  let learnedIntent: string | undefined;
  const learnedDelta: Partial<Need> = {};
  const applyLearned = (lp: LearnedPhrase) => {
    const n = lp.words.length;
    if (lp.whole) {
      if (n !== words.length || lp.words.some((w, k) => w !== words[k])) return;
      for (let k = 0; k < n; k++) consumed.add(k);
    } else {
      let at = -1;
      for (let i = 0; i + n <= words.length && at < 0; i++) {
        let ok = true;
        for (let j = 0; j < n; j++) if (consumed.has(i + j) || (words[i + j] !== lp.words[j] && deW[i + j] !== lp.words[j])) ok = false;
        if (ok) at = i;
      }
      if (at < 0) return;
      for (let j = 0; j < n; j++) consumed.add(at + j);
      if (negatedAt(words, at)) {
        for (const k of lp.delta.kinds ?? []) avoid.push(`kind:${k}`);
        for (const c of lp.delta.families ?? []) avoid.push(`family:${c}`);
        return;
      }
    }
    const d = lp.delta;
    const MULTI: [keyof Need, FacetKey][] = [["kinds", "kind"], ["concerns", "concern"], ["families", "family"], ["ingredients", "ingredient"], ["freeFrom", "freeFrom"], ["attrs", "attr"]];
    for (const [k, f] of MULTI) for (const v of (d[k] as string[] | undefined) ?? []) (multi[f] ??= []).push(v);
    const SINGLE_K: [keyof Need, FacetKey][] = [["area", "area"], ["skinType", "skinType"], ["gender", "gender"], ["time", "time"], ["finish", "finish"], ["occasion", "occasion"], ["recipient", "recipient"]];
    for (const [k, f] of SINGLE_K) if (typeof d[k] === "string") single[f] ??= d[k] as string;
    if (d.maxPrice) learnedDelta.maxPrice ??= d.maxPrice;
    if (d.minPrice) learnedDelta.minPrice ??= d.minPrice;
    if (d.brands?.length) learnedDelta.brands = [...new Set([...(learnedDelta.brands ?? []), ...d.brands])];
    if (d.free?.length) learnedDelta.free = [...new Set([...(learnedDelta.free ?? []), ...d.free])];
    if (lp.intent) learnedIntent ??= lp.intent;
    for (const f of Object.keys(d)) mentioned.add(f === "kinds" ? "kind" : f);
  };
  for (const lp of catalog.learned) if (lp.whole || lp.words.length > 1) applyLearned(lp);

  // فرز سريع: عبارة لا تظهر كلمتها الأولى بأي صيغة في الرسالة لا تُفحص.
  const seenStem = new Set([...words, ...deW]);
  const seenRaw = new Set([...raws, ...lites]);
  for (const p of PHRASES) {
    const pw = p.pw;
    if (!(p.latin && pw.length === 1) && !(p.raw ? seenRaw : seenStem).has(pw[0])) continue;
    for (let i = 0; i + pw.length <= words.length; i++) {
      let ok = true;
      for (let j = 0; j < pw.length; j++) {
        const w = p.raw ? raws[i + j] : words[i + j];
        const target = pw[j];
        const alt = p.raw ? lites[i + j] : w;
        const alt2 = p.raw ? raws[i + j] : deW[i + j];
        if (p.latin && j === pw.length - 1 ? !w.startsWith(target) : w !== target && alt !== target && alt2 !== target) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      // عبارة أطول سبقت واستهلكت هذه الكلمات (مثل «بشرة جافة» قبل «جافة»).
      let overlap = false;
      for (let j = 0; j < pw.length; j++) if (consumed.has(i + j)) overlap = true;
      if (overlap) continue;
      for (let j = 0; j < pw.length; j++) {
        consumed.add(i + j);
        consumedBy.set(i + j, p.facet);
      }
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

  // العبارات المتعلَّمة المفردة بعد المعجم (لا تسرق كلمة من عبارة معجمية أطول).
  for (const lp of catalog.learned) if (!lp.whole && lp.words.length === 1) applyLearned(lp);

  // ── تحمّل أخطاء الكتابة: «شامبوا»، «ماسكرا»، «فاونديشين»، «سيرم».
  for (let i = 0; i < words.length; i++) {
    if (consumed.has(i)) continue;
    const w = words[i];
    if (w.length < 4 || /\d/.test(w) || catalog.brandAliases.has(w)) continue;
    let best: Phrase | null = null;
    let bestD = 9;
    for (const p of FUZZY_PHRASES) {
      if (Math.abs(p.bare.length - w.length) > 2) continue;
      // كلمة قصيرة تحتمل حرفاً واحداً، والطويلة حرفين (العربية فقط: «something» ليست «soothing»).
      const max = w.length >= 8 && !/^[a-z]+$/.test(w) ? 2 : 1;
      if (w.length < 5 && p.bare.length < 5) continue;
      const d = editDistance(w, p.bare, max);
      if (d <= max && d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) continue;
    consumed.add(i);
    mentioned.add(best.facet);
    if (negatedAt(words, i)) avoid.push(`${best.facet}:${best.id}`);
    else if (SINGLE.includes(best.facet)) single[best.facet] ??= best.id;
    else (multi[best.facet] ??= []).push(best.id);
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
  // المجال: نوع المنتج أصدق («بلسم» للشعر)، ثم المشكلة، ثم نوع البشرة.
  const kindAreas = [...new Set((delta.kinds ?? []).map((k) => KIND_AREA_NLU.get(k)).filter(Boolean))];
  if (!single.area && kindAreas.length === 1) delta.area = kindAreas[0];
  // «وجهي» + هايلايتر/برايمر = مكياج (لا نوع بديل بالعناية بالبشرة)؛ أما «مرطب للجسم» فيُحوَّل للجسم أدناه.
  else if (single.area && kindAreas.length === 1 && kindAreas[0] !== single.area) {
    const remap = KIND_BY_AREA[single.area] ?? {};
    if (!(delta.kinds ?? []).some((k) => remap[k])) delta.area = kindAreas[0];
  }
  if (!delta.area && delta.concerns?.length) {
    const area = CONCERN_AREA[delta.concerns[0]];
    if (area) delta.area = area;
  }
  // «سيروم يطول الشعر»: نوع عام (سيروم) + مشكلة شعر ← سيروم شعر، والمجال للشعر.
  if (!single.area && delta.concerns?.length && delta.kinds?.length) {
    const ca = CONCERN_AREA[delta.concerns[0]];
    const remap = ca ? KIND_BY_AREA[ca] : undefined;
    if (ca && ca !== delta.area && remap && delta.kinds.every((k) => remap[k])) delta.area = ca;
  }
  if (!delta.area && single.skinType && !delta.kinds?.length) delta.area = "skin";
  // «بشرتي تلمع/دهنية بالوسط» كشكوى = نوع بشرة دهني أيضاً (لا مشكلة فقط).
  if (delta.area === "skin" && !delta.skinType && delta.concerns?.includes("oily")) delta.skinType = "oily";
  // «جاف/دهني» في سياق الشعر = جفاف الشعر/فروة دهنية، لا نوع بشرة.
  if (delta.area === "hair") {
    // «لمعان للشعر» = تريده لامعاً، لا فروة دهنية (إلا إن ذكرت الدهون صراحة).
    if (/(^| )(لمعان|لماع|يلمع|تلمع|لمعه|بريق|shine|shiny)( |$)/.test(norm) && !/(دهني|دهون|فروه|زيوت|oily|greasy)/.test(norm)) {
      delta.concerns = (delta.concerns ?? []).filter((c) => c !== "oily" && c !== "oily_scalp");
      if (!delta.concerns.length) delete delta.concerns;
      delta.free = [...new Set([...(delta.free ?? []), "لمعان"])];
    }
    const HAIR: Record<string, string> = { dryness: "dry_hair", oily: "oily_scalp", dry: "dry_hair" };
    if (delta.concerns) delta.concerns = [...new Set(delta.concerns.map((c) => HAIR[c] ?? c))];
    if (delta.skinType && HAIR[delta.skinType]) {
      delta.concerns = [...new Set([...(delta.concerns ?? []), HAIR[delta.skinType]])];
      delete delta.skinType;
    }
  }

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
  const seenBrand = new Set([...words, ...raws]);
  for (const [alias, ids, aw] of sortedAliases(catalog)) {
    // اسم لا تظهر كلمته الأولى ولا تحتمل خطأ كتابة (لاتيني طويل) لا يُفحص.
    if (!seenBrand.has(aw[0]) && !(aw[0].length >= 6 && /^[a-z]+$/.test(aw[0]))) continue;
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
  else if (RE.look.test(norm)) {
    intent = "routine";
    delta.area = "makeup";
    delta.kinds = [];
    if (/(سهره|عرس|عروس|حفله|مناسبه|night|party|wedding)/.test(norm)) delta.time = "night";
  } else if (RE.routine.test(norm) && !NO_ROUTINE_RE.test(norm)) intent = "routine";
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
        "ابحث عن عندكم لديكم يوجد توجد اكو ماكو عطيني دليني ساعديني بس رجاء لو سمحتي يعطي تعطي يخلي تخلي يسوي تسوي يمنح تمنح يكون تكون please show me recommend suggest best good",
      { keepStop: true },
    ),
  );
  const freeIdx = words.map((_, i) => i).filter((i) => {
    const w = words[i];
    return !consumed.has(i) && w.length >= 3 && !INTENT_WORDS.has(w) && !/^\d+$/.test(w) &&
      !["الف", "دينار", "تحت", "فوق", "بين", "ارخص", "اغلى", "بديل", "بدائل", "بديله", "يشبه", "تشبه", "مثل"].includes(w) &&
      !RE.routine.test(w) && !RE.look.test(w) && !w.startsWith("روت") &&
      // كلمات الترتيب والنوايا («فخم»، «عروض»، «جديد») ليست أسماء منتجات.
      !SORT_RE.some(([re]) => re.test(w)) && !RE.deals.test(w) && !RE.cheaper.test(w) && !RE.pricier.test(w) &&
      // «كريم» مع نوع محدد («كريم واقي شمس») صيغة لا كلمة بحث.
      !(delta.kinds?.length && GENERIC_FORMS.has(w)) &&
      // أدوات النفي وما نُفي (براند غير متوفر مثلاً) لا يُبحث عنه.
      !NEGATORS.has(w) && !negatedAt(words, i);
  });
  // ── كلمات بقيت بلا معنى: خطأ كتابة لكلمة نعرفها؟ («واقي شمش»، «سيروووم») نصحح ونعيد الفهم مرة.
  if (!spelled && freeIdx.length && catalog.products.length) {
    let changed = false;
    const fixed = raws.slice();
    for (const i of freeIdx) {
      const w = raws[i];
      if (w.length < 3 || catalog.brandAliases.has(words[i])) continue;
      const c = correctWord(w, catalog);
      if (c) {
        fixed[i] = c;
        changed = true;
      }
    }
    if (changed) return understand(fixed.join(" "), catalog, true);
  }
  let free = freeIdx.map((i) => words[i]);
  // ── ما لم يفهمه المعجم: نموذج «ديما» المدرَّب على الكتالوج يستنتج معناه («يلمع بالعرس» ← هايلايتر).
  // كلمات فهمها المعجم كسياق فقط (تغطية/ثبات/مناسبة…) تساعد النموذج على اختيار النوع («يغطي الحبوب» ← كونسيلر).
  const ctxIdx =
    intent === "routine" || delta.kinds?.length
      ? []
      : [
          ...[...consumedBy].filter(([, f]) => CONTEXT_FACETS.has(f)).map(([i]) => i),
          // «ما يسيح»، «ما يتكسر»: المنفي هنا وصف للأثر المطلوب — دليل على النوع (مثبت مكياج).
          ...words.map((_, i) => i).filter((i) => !consumed.has(i) && words[i].length >= 3 && !NEGATORS.has(words[i]) && negatedAt(words, i)),
        ];
  if (catalog.model && (freeIdx.length || ctxIdx.length) && !["reset", "greet", "thanks", "about", "help"].includes(intent)) {
    const inf = catalog.model.inferFree(
      freeIdx.map((i) => raws[i]),
      {
        area: delta.area, kinds: delta.kinds, concerns: delta.concerns, families: delta.families, gender: delta.gender, skinType: delta.skinType,
        occasionNight: single.occasion === "wedding" || single.time === "night" || /(حفله|سهره|مناسبه|party)/.test(norm),
      },
      ctxIdx.map((i) => raws[i]),
    );
    {
      if (inf.area && !delta.area) delta.area = inf.area;
      // «وجهي يلمع» + هايلايتر: النوع من المكياج يحدد المجال (مثل قاعدة المعجم).
      const kindArea = inf.kinds?.length ? KIND_AREA_NLU.get(inf.kinds[0]) : undefined;
      if (kindArea && delta.area && kindArea !== delta.area && !(KIND_BY_AREA[delta.area] ?? {})[inf.kinds![0]]) delta.area = kindArea;
      if (inf.kinds?.length) {
        const remap = delta.area ? KIND_BY_AREA[delta.area] ?? {} : {};
        delta.kinds = [...new Set(inf.kinds.map((k) => remap[k] ?? k))];
        mentioned.add("kind");
      }
      if (inf.concerns?.length) {
        delta.concerns = inf.concerns;
        mentioned.add("concern");
      }
      if (inf.families?.length) {
        delta.families = inf.families;
        mentioned.add("family");
      }
      if (inf.gender) {
        delta.gender = inf.gender;
        mentioned.add("gender");
      }
      if (inf.skinType) {
        delta.skinType = inf.skinType;
        mentioned.add("skinType");
      }
      if (inf.used.length) {
        const used = new Set(inf.used.map((k) => freeIdx[k]));
        free = freeIdx.filter((i) => !used.has(i)).map((i) => words[i]);
      }
    }
  }
  if (free.length) delta.free = [...new Set([...(delta.free ?? []), ...free])];
  if (SIZE_BIG_RE.test(norm)) delta.size = "big";
  else if (SIZE_SMALL_RE.test(norm)) delta.size = "small";
  if (delta.size && delta.free) {
    delta.free = delta.free.filter((w) => !/^(حجم|الحجم|كبير|اكبر|صغير|اصغر|ميني|mini|سفر|للسفر|اقتصادي|عائلي|عبوه|travel|size)$/.test(w));
    if (!delta.free.length) delete delta.free;
  }
  // ما تعلّمته من عبارات كاملة (ميزانية، براند، كلمات بحث).
  if (learnedDelta.maxPrice && !delta.maxPrice) delta.maxPrice = learnedDelta.maxPrice;
  if (learnedDelta.minPrice && !delta.minPrice) delta.minPrice = learnedDelta.minPrice;
  if (learnedDelta.brands?.length && !delta.brands?.length) delta.brands = learnedDelta.brands;
  if (learnedDelta.free?.length) delta.free = [...new Set([...(delta.free ?? []), ...learnedDelta.free])];
  if (learnedIntent && intent === "recommend") {
    const map: Record<string, Intent> = { routine: "routine", gift: "gift", similar: "similar", knowledge: "info" };
    if (map[learnedIntent]) intent = map[learnedIntent];
    if (intent === "routine") delta.routine = true;
  }

  const modelSignal = Boolean(delta.kinds?.length || delta.concerns?.length || delta.area || delta.families?.length);
  return { intent, delta, hasProductSignal: hasProductSignal || modelSignal || free.length > 0, mentioned };
}

/** أفعال الشرائح: `set:skinType=oily`، `add:concern=acne`، `unset:maxPrice`، `act:more`. */
export function parseAction(value: string): { op: string; key: string; val?: string } | null {
  const m = value.match(/^(set|add|unset|act|quiz|skip):([a-zA-Z_]+)(?:=(.+))?$/);
  if (!m) return null;
  return { op: m[1], key: m[2], val: m[3] };
}
