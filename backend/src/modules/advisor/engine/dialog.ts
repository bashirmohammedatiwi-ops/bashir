import { CatalogIndex } from "./catalog";
import {
  ABOUT,
  GREETINGS,
  OPENERS_RESULTS,
  RELAX_NOTE,
  THANKS,
  WELCOME_BODY,
  describeNeed,
  fmtPrice,
  pick,
  tipFor,
} from "./composer";
import { CONCERN_AREA, FacetKey, LEXICON, facetValue } from "./lexicon";
import { parseAction, understand } from "./nlu";
import { li } from "./text";
import { Ranked, rank, routineTemplate, toCard } from "./ranker";
import {
  AdvisorReply,
  AdvisorState,
  Chip,
  Intent,
  Need,
  QuizOut,
  RoutineStepOut,
  emptyNeed,
  emptyState,
} from "./types";

export interface DialogInput {
  message?: string;
  action?: string;
}

export interface DialogCtx {
  catalog: CatalogIndex;
  firstName?: string;
}

// ───────────────────────────────────────────────────────── الحقول

const SINGLE_KEYS = new Set([
  "area", "skinType", "gender", "time", "strength", "season", "finish", "coverage", "audience", "occasion", "recipient", "sort",
]);
const MULTI_KEYS: Record<string, keyof Need> = {
  kind: "kinds",
  concern: "concerns",
  ingredient: "ingredients",
  freeFrom: "freeFrom",
  family: "families",
  attr: "attrs",
  brand: "brands",
};

const KIND_AREA = new Map(LEXICON.filter((x) => x.facet === "kind" && x.area).map((x) => [x.id, x.area!]));

function areaOf(need: Partial<Need>): string | undefined {
  if (need.area) return need.area;
  for (const k of need.kinds ?? []) if (KIND_AREA.has(k)) return KIND_AREA.get(k);
  for (const c of need.concerns ?? []) if (CONCERN_AREA[c]) return CONCERN_AREA[c];
  if (need.skinType) return "skin";
  if (need.families?.length || need.gender) return "fragrance";
  return undefined;
}

function mergeNeed(need: Need, delta: Partial<Need>): { need: Need; newTopic: boolean } {
  const nextArea = areaOf(delta);
  const curArea = areaOf(need);
  const newTopic = Boolean(nextArea && curArea && nextArea !== curArea);
  // موضوع جديد: نبدأ من الصفر مع الاحتفاظ بنوع البشرة (صفة ثابتة للزبونة).
  const base: Need = newTopic ? { ...emptyNeed(), skinType: need.skinType } : { ...need };

  for (const [k, v] of Object.entries(delta)) {
    if (v === undefined) continue;
    if (k === "kinds") base.kinds = v as string[]; // نوع جديد يحل محل السابق
    else if (k === "brands") base.brands = v as string[];
    else if (k === "free") base.free = v as string[];
    else if (Array.isArray(v)) {
      const cur = (base as unknown as Record<string, string[]>)[k] ?? [];
      (base as unknown as Record<string, string[]>)[k] = [...new Set([...cur, ...(v as string[])])];
    } else (base as unknown as Record<string, unknown>)[k] = v;
  }
  if (!delta.free) base.free = [];
  if (!base.area) base.area = areaOf(base);
  // اختيار «للجنسين» أو جنس جديد يلغي التعارض.
  return { need: base, newTopic };
}

function applyAction(need: Need, state: AdvisorState, op: string, key: string, val?: string): Need {
  const n: Need = { ...need };
  if (op === "set" && key === "budget" && val) {
    const [a, b] = val.split("-");
    n.minPrice = a ? Number(a) : undefined;
    n.maxPrice = b ? Number(b) : undefined;
    return n;
  }
  if (op === "set" || op === "add") {
    if (!val) return n;
    if (SINGLE_KEYS.has(key)) {
      (n as unknown as Record<string, unknown>)[key] = val;
      if (key === "area") {
        // تغيير المجال بزر = موضوع جديد
        const fresh = { ...emptyNeed(), skinType: need.skinType, area: val, maxPrice: need.maxPrice, minPrice: need.minPrice, recipient: need.recipient, gender: need.gender, occasion: need.occasion };
        return fresh;
      }
      return n;
    }
    const field = MULTI_KEYS[key];
    if (field) {
      const cur = (n[field] as string[]) ?? [];
      (n as unknown as Record<string, string[]>)[field] = key === "kind" ? [val] : [...new Set([...cur, val])];
      if (!n.area) n.area = areaOf(n);
    }
    return n;
  }
  if (op === "unset") {
    if (key === "budget") {
      n.minPrice = undefined;
      n.maxPrice = undefined;
    } else if (SINGLE_KEYS.has(key)) (n as unknown as Record<string, unknown>)[key] = undefined;
    else {
      const field = MULTI_KEYS[key] ?? (key as keyof Need);
      const cur = n[field];
      if (Array.isArray(cur)) (n as unknown as Record<string, string[]>)[field as string] = val ? cur.filter((x) => x !== val) : [];
    }
    return n;
  }
  if (op === "skip") state.asked.push(key);
  return n;
}

// ───────────────────────────────────────────────────────── الأسئلة

interface Question {
  key: string;
  texts: string[];
  chips: Chip[];
}

const chipsFor = (facet: FacetKey, ids: string[], op = "set", key: string = facet): Chip[] =>
  ids
    .map((id) => facetValue(facet, id))
    .filter(Boolean)
    .map((fv) => ({ label: fv!.label, value: `${op}:${key}=${fv!.id}`, emoji: fv!.emoji }));

const SKIP = (key: string): Chip => ({ label: "ما يهم", value: `skip:${key}`, emoji: "🤷‍♀️" });

const QUESTIONS: Record<string, Question> = {
  area: {
    key: "area",
    texts: ["تمام! شنو اللي تدورين عليه اليوم؟", "على شنو أساعدكِ؟ اختاري المجال:"],
    chips: chipsFor("area", ["fragrance", "skin", "hair", "makeup", "body", "nails"]),
  },
  gender: {
    key: "gender",
    texts: ["العطر لمن؟ لكِ ولا هدية لرجل؟", "تريدينه نسائي، رجالي، لو للجنسين؟"],
    chips: [...chipsFor("gender", ["women", "men", "unisex"])],
  },
  family: {
    key: "family",
    texts: ["أي نوع رائحة تحبين؟ 🌸", "تميلين لروائح دافئة ولا منعشة؟ اختاري اللي يشبهكِ:"],
    chips: [...chipsFor("family", ["woody", "floral", "oriental", "oud", "musk", "sweet", "fresh", "fruity"], "add"), SKIP("family")],
  },
  skinType: {
    key: "skinType",
    texts: ["حتى أختار صح: شنو نوع بشرتكِ؟", "كيف بشرتكِ عادةً؟"],
    chips: [...chipsFor("skinType", ["oily", "dry", "combination", "sensitive", "normal"]), SKIP("skinType")],
  },
  concern: {
    key: "concern",
    texts: ["شنو أكثر شي يزعجكِ ببشرتكِ؟", "شنو الهدف؟ اختاري اللي تحتاجينه أكثر:"],
    chips: [...chipsFor("concern", ["acne", "pigment", "aging", "dryness", "pores", "dark_circles", "dull", "sensitive"], "add"), SKIP("concern")],
  },
  hairConcern: {
    key: "hairConcern",
    texts: ["شنو مشكلة شعركِ الأساسية؟", "شعركِ يحتاج شنو أكثر؟"],
    chips: [...chipsFor("concern", ["hairloss", "dandruff", "frizz", "damaged", "colored", "dry_hair", "oily_scalp"], "add"), SKIP("hairConcern")],
  },
  makeupKind: {
    key: "makeupKind",
    texts: ["أي قطعة مكياج تدورين؟ 💄", "شنو تحتاجين من المكياج؟"],
    chips: chipsFor("kind", ["foundation", "concealer", "lipstick", "lip_gloss", "mascara", "eyeliner", "eyeshadow", "blush", "highlighter", "powder"]),
  },
  bodyKind: {
    key: "bodyKind",
    texts: ["شنو تحتاجين لجسمكِ؟"],
    chips: chipsFor("kind", ["body_lotion", "body_wash", "body_scrub", "body_oil", "hand_cream", "deodorant", "mist"]),
  },
};

function specificity(n: Need): number {
  return (
    (n.kinds.length ? 1 : 0) + n.concerns.length + (n.skinType ? 1 : 0) + n.families.length + (n.gender ? 1 : 0) +
    n.brands.length * 2 + (n.free.length ? 1 : 0) + n.ingredients.length + (n.finish ? 1 : 0) + (n.recipient ? 1 : 0)
  );
}

function nextQuestion(n: Need, asked: string[]): Question | null {
  const can = (k: string) => !asked.includes(k);
  const area = areaOf(n);
  if (!area && !n.kinds.length && !n.free.length && !n.brands.length) return can("area") ? QUESTIONS.area : null;
  if (area === "fragrance") {
    // البخور ومعطرات المنزل لا تحتاج سؤال الجنس.
    const personal = !n.kinds.length || n.kinds.some((k) => ["perfume", "mist", "oil_perfume"].includes(k));
    if (!personal) return null;
    if (!n.gender && can("gender")) return QUESTIONS.gender;
    if (!n.families.length && can("family")) return QUESTIONS.family;
    return null;
  }
  if (area === "skin") {
    if (!n.skinType && !n.concerns.length && can("skinType")) return QUESTIONS.skinType;
    if (!n.concerns.length && can("concern")) return QUESTIONS.concern;
    return null;
  }
  if (area === "hair" && !n.concerns.length && can("hairConcern")) return QUESTIONS.hairConcern;
  if (area === "makeup" && !n.kinds.length && can("makeupKind")) return QUESTIONS.makeupKind;
  if (area === "body" && !n.kinds.length && can("bodyKind")) return QUESTIONS.bodyKind;
  return null;
}

// ───────────────────────────────────────────────────────── الاختبارات الموجّهة

interface QuizStep {
  key: string;
  question: string;
  options: Chip[];
  multi?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  finish: "routine" | "recommend";
  prefill?: Partial<Need>;
  steps: QuizStep[];
}

const BUDGET = (tiers: [string, string][]): Chip[] => [
  ...tiers.map(([label, range]) => ({ label, value: `set:budget=${range}`, emoji: "💰" })),
  { label: "ما يهم", value: "skip:budget", emoji: "✨" },
];

const QUIZZES: Record<string, Quiz> = {
  perfume: {
    id: "perfume",
    title: "اكتشفي عطركِ",
    finish: "recommend",
    prefill: { area: "fragrance", kinds: ["perfume"] },
    steps: [
      {
        key: "gender",
        question: "العطر لمن؟",
        options: [
          { label: "لي أنا", value: "set:gender=women", emoji: "👩" },
          { label: "رجالي", value: "set:gender=men", emoji: "👨" },
          { label: "للجنسين", value: "set:gender=unisex", emoji: "🤝" },
        ],
      },
      {
        key: "family",
        question: "أي روائح تحسينها تشبهكِ؟ (اختاري واحدة أو اثنتين)",
        multi: true,
        options: chipsFor("family", ["woody", "floral", "oriental", "oud", "musk", "vanilla", "sweet", "fresh", "fruity", "spicy"], "add"),
      },
      {
        key: "time",
        question: "متى ستضعينه أكثر شي؟",
        options: [
          { label: "للدوام والنهار", value: "set:time=day", emoji: "☀️" },
          { label: "للسهرات والمساء", value: "set:time=night", emoji: "🌙" },
          { label: "للكل", value: "skip:time", emoji: "✨" },
        ],
      },
      {
        key: "strength",
        question: "تحبين العطر يكون…",
        options: [
          { label: "فواح وثابت", value: "set:strength=parfum", emoji: "🔥" },
          { label: "ناعم وقريب", value: "set:strength=edt", emoji: "🕊️" },
          { label: "ما يهم", value: "skip:strength", emoji: "✨" },
        ],
      },
      {
        key: "budget",
        question: "وأخيراً، ميزانيتكِ؟",
        options: BUDGET([
          ["أقل من 30 ألف", "-30000"],
          ["30 – 70 ألف", "30000-70000"],
          ["فوق 70 ألف", "70000-"],
        ]),
      },
    ],
  },
  skin: {
    id: "skin",
    title: "اختبار البشرة",
    finish: "routine",
    prefill: { area: "skin" },
    steps: [
      {
        key: "skinType",
        question: "كيف تصير بشرتكِ بعد ساعتين من غسلها؟",
        options: [
          { label: "تلمع بالكامل", value: "set:skinType=oily", emoji: "💦" },
          { label: "تشد وتجف", value: "set:skinType=dry", emoji: "🏜️" },
          { label: "تلمع بالجبهة والأنف", value: "set:skinType=combination", emoji: "☯️" },
          { label: "تحمر وتتحسس", value: "set:skinType=sensitive", emoji: "🌷" },
          { label: "مرتاحة وعادية", value: "set:skinType=normal", emoji: "😊" },
        ],
      },
      {
        key: "concern",
        question: "شنو تحبين تعالجين؟ (اختاري كل اللي يناسبكِ)",
        multi: true,
        options: chipsFor("concern", ["acne", "pigment", "aging", "pores", "dark_circles", "dull", "dryness", "sensitive"], "add"),
      },
      {
        key: "budget",
        question: "ميزانيتكِ للروتين كامل؟",
        options: BUDGET([
          ["أقل من 40 ألف", "-40000"],
          ["40 – 90 ألف", "40000-90000"],
          ["فوق 90 ألف", "90000-"],
        ]),
      },
    ],
  },
  hair: {
    id: "hair",
    title: "عناية الشعر",
    finish: "routine",
    prefill: { area: "hair" },
    steps: [
      {
        key: "concern",
        question: "شنو يحتاج شعركِ؟ (اختاري كل اللي يناسبكِ)",
        multi: true,
        options: chipsFor("concern", ["hairloss", "dandruff", "frizz", "damaged", "colored", "dry_hair", "oily_scalp"], "add"),
      },
      {
        key: "budget",
        question: "ميزانيتكِ لروتين الشعر؟",
        options: BUDGET([
          ["أقل من 30 ألف", "-30000"],
          ["30 – 60 ألف", "30000-60000"],
          ["فوق 60 ألف", "60000-"],
        ]),
      },
    ],
  },
  gift: {
    id: "gift",
    title: "هدية مثالية",
    finish: "recommend",
    prefill: { occasion: "gift" },
    steps: [
      {
        key: "recipient",
        question: "الهدية لمن؟ 🎁",
        options: ["mother", "wife", "husband", "friend", "sister", "father"].map((id) => {
          const fv = facetValue("recipient", id)!;
          const gender = { mother: "women", wife: "women", friend: "women", sister: "women", husband: "men", father: "men" }[id];
          return { label: fv.label, value: `set:recipient=${id};set:gender=${gender}`, emoji: fv.emoji };
        }),
      },
      {
        key: "category",
        question: "شنو تحبين تهدين؟",
        options: [
          { label: "عطر", value: "set:area=fragrance;set:kind=perfume", emoji: "✨" },
          { label: "مكياج", value: "set:area=makeup", emoji: "💄" },
          { label: "عناية بشرة", value: "set:area=skin", emoji: "🌸" },
          { label: "عناية جسم", value: "set:area=body", emoji: "🛁" },
        ],
      },
      {
        key: "budget",
        question: "ميزانية الهدية؟",
        options: BUDGET([
          ["أقل من 25 ألف", "-25000"],
          ["25 – 60 ألف", "25000-60000"],
          ["فوق 60 ألف", "60000-"],
        ]),
      },
    ],
  },
  makeup: {
    id: "makeup",
    title: "مكياجكِ",
    finish: "recommend",
    prefill: { area: "makeup" },
    steps: [
      {
        key: "kind",
        question: "شنو تحتاجين؟ 💄",
        options: chipsFor("kind", ["foundation", "concealer", "lipstick", "lip_gloss", "mascara", "eyeliner", "eyeshadow", "blush", "highlighter", "powder"]),
      },
      {
        key: "finish",
        question: "أي لمسة نهائية تحبين؟",
        options: [...chipsFor("finish", ["matte", "glossy", "satin", "dewy"]), SKIP("finish")],
      },
      {
        key: "budget",
        question: "ميزانيتكِ؟",
        options: BUDGET([
          ["أقل من 15 ألف", "-15000"],
          ["15 – 35 ألف", "15000-35000"],
          ["فوق 35 ألف", "35000-"],
        ]),
      },
    ],
  },
};

export const STARTERS: Chip[] = [
  { label: "اكتشفي عطركِ", value: "quiz:start=perfume", emoji: "✨" },
  { label: "اختبار البشرة وروتين", value: "quiz:start=skin", emoji: "🌸" },
  { label: "عناية الشعر", value: "quiz:start=hair", emoji: "💇‍♀️" },
  { label: "هدية مثالية", value: "quiz:start=gift", emoji: "🎁" },
  { label: "مكياج يناسبكِ", value: "quiz:start=makeup", emoji: "💄" },
  { label: "عروض اليوم", value: "act:deals", emoji: "🔥" },
];

function quizOut(q: Quiz, step: number): QuizOut {
  const s = q.steps[step];
  return { id: q.id, title: q.title, question: s.question, step: step + 1, total: q.steps.length, options: s.options, multi: s.multi };
}

// ───────────────────────────────────────────────────────── الرد

function understoodChips(n: Need, brandNames: Map<string, string>): AdvisorReply["understood"] {
  const out: AdvisorReply["understood"] = [];
  const single = (facet: FacetKey, key: string, id?: string) => {
    if (!id) return;
    const fv = facetValue(facet, id);
    if (fv) out.push({ key: `unset:${key}`, label: `${fv.emoji ? `${fv.emoji} ` : ""}${fv.label}` });
  };
  single("area", "area", n.area);
  for (const k of n.kinds) single("kind", "kind", k);
  single("gender", "gender", n.gender);
  for (const f of n.families) out.push({ key: `unset:family=${f}`, label: `${facetValue("family", f)?.emoji ?? ""} ${facetValue("family", f)?.label ?? f}`.trim() });
  single("skinType", "skinType", n.skinType);
  for (const c of n.concerns) out.push({ key: `unset:concern=${c}`, label: `${facetValue("concern", c)?.emoji ?? ""} ${facetValue("concern", c)?.label ?? c}`.trim() });
  for (const i of n.ingredients) out.push({ key: `unset:ingredient=${i}`, label: facetValue("ingredient", i)?.label ?? i });
  single("time", "time", n.time);
  single("strength", "strength", n.strength);
  single("finish", "finish", n.finish);
  single("coverage", "coverage", n.coverage);
  for (const a of n.attrs) out.push({ key: `unset:attr=${a}`, label: `${facetValue("attr", a)?.emoji ?? ""} ${facetValue("attr", a)?.label ?? a}`.trim() });
  for (const f of n.freeFrom) out.push({ key: `unset:freeFrom=${f}`, label: facetValue("freeFrom", f)?.label ?? f });
  for (const b of n.brands) out.push({ key: `unset:brand=${b}`, label: brandNames.get(b) ?? "براند" });
  for (const a of n.avoid) {
    const [facet, id] = a.split(":") as [FacetKey, string];
    const fv = facetValue(facet, id);
    if (fv) out.push({ key: `unset:avoid=${a}`, label: `🚫 ${fv.label}` });
  }
  for (const b of n.excludeBrands) out.push({ key: `unset:excludeBrands=${b}`, label: `🚫 ${brandNames.get(b) ?? "براند"}` });
  const SORT_LABEL: Record<string, string> = {
    cheap: "💸 الأوفر",
    best: "🔥 الأكثر مبيعاً",
    rated: "⭐ الأعلى تقييماً",
    new: "🆕 الأحدث",
    deals: "🏷️ العروض",
    premium: "💎 فاخر",
  };
  if (n.sort && SORT_LABEL[n.sort]) out.push({ key: "unset:sort", label: SORT_LABEL[n.sort] });
  if (n.maxPrice || n.minPrice) {
    out.push({
      key: "unset:budget",
      label: `💰 ${n.minPrice && n.maxPrice ? `${fmtPrice(n.minPrice)}–${fmtPrice(n.maxPrice)}` : n.maxPrice ? `≤ ${fmtPrice(n.maxPrice)}` : `≥ ${fmtPrice(n.minPrice!)}`}`,
    });
  }
  return out;
}

function refineChips(n: Need, hasResults: boolean): Chip[] {
  const chips: Chip[] = [];
  const area = areaOf(n);
  const personalScent = !n.kinds.length || n.kinds.some((k) => ["perfume", "mist", "oil_perfume"].includes(k));
  if (area === "fragrance" && personalScent) {
    if (!n.gender) chips.push(...chipsFor("gender", ["women", "men", "unisex"]));
    else if (n.families.length < 2) {
      chips.push(...chipsFor("family", ["woody", "floral", "oriental", "fresh", "sweet", "oud"].filter((f) => !n.families.includes(f)), "add").slice(0, 4));
    }
    if (!n.time) chips.push(...chipsFor("time", ["day", "night"]));
  } else if (area === "skin") {
    if (!n.skinType) chips.push(...chipsFor("skinType", ["oily", "dry", "combination", "sensitive"]));
    if (!n.concerns.length) chips.push(...chipsFor("concern", ["acne", "pigment", "aging"], "add"));
    if (!n.routine) chips.push({ label: "روتين كامل", value: "act:routine", emoji: "🧖‍♀️" });
  } else if (area === "hair") {
    if (!n.concerns.length) chips.push(...chipsFor("concern", ["hairloss", "dandruff", "frizz", "damaged"], "add"));
    if (!n.routine) chips.push({ label: "روتين شعر كامل", value: "act:routine", emoji: "💇‍♀️" });
  } else if (area === "makeup" && n.kinds.length && !n.finish) {
    chips.push(...chipsFor("finish", ["matte", "glossy", "satin"]));
  }
  if (hasResults) {
    chips.push(
      { label: "أرخص", value: "act:cheaper", emoji: "💸" },
      { label: "غيرهم", value: "act:more", emoji: "🔄" },
      { label: "الأعلى تقييماً", value: "set:sort=rated", emoji: "⭐" },
    );
    if (n.sort !== "deals") chips.push({ label: "عليها عروض", value: "set:sort=deals", emoji: "🔥" });
  }
  return chips.slice(0, 8);
}

function reply(state: AdvisorState, partial: Partial<AdvisorReply>, ctx: DialogCtx): AdvisorReply {
  const brandNames = new Map(ctx.catalog.brands.map((b) => [b.id, b.name]));
  return {
    messages: partial.messages ?? [],
    chips: partial.chips ?? [],
    products: partial.products ?? [],
    groups: partial.groups ?? [],
    routine: partial.routine,
    quiz: partial.quiz,
    understood: partial.understood ?? understoodChips(state.need, brandNames),
    state,
  };
}

function remember(state: AdvisorState, items: Ranked[]) {
  state.shown = [...new Set([...state.shown, ...items.map((r) => r.p.id)])].slice(-80);
  const top = items.slice(0, 3);
  if (top.length) state.lastPrice = Math.round(top.reduce((s, r) => s + r.p.price, 0) / top.length);
}

function recommend(state: AdvisorState, ctx: DialogCtx, lead?: string, opts: { exclude?: boolean } = {}): AdvisorReply {
  const need = state.need;
  const brandNames = new Map(ctx.catalog.brands.map((b) => [b.id, b.name]));
  const exclude = opts.exclude ? new Set(state.shown) : undefined;
  const res = rank(ctx.catalog, need, { exclude, limit: 14 });
  const seed = state.turns;

  if (!res.items.length) {
    return reply(state, {
      messages: [
        lead ?? pick(["ما لقيت منتجاً متوفراً يطابق كل هذا بالضبط 😔", "للأسف ما عندي تطابق كامل حالياً."], seed),
        "جربي تغيرين شرطاً واحداً — مثلاً الميزانية أو النوع — أو اختاري من هنا:",
      ],
      chips: [...refineChips(need, false), { label: "ابدئي من جديد", value: "act:reset", emoji: "🔁" }],
    }, ctx);
  }

  // الجودة قبل العدد: نُسقط الترشيحات الضعيفة بعيداً عن الأفضل (مع إبقاء 3 على الأقل).
  const bestMatch = Math.max(...res.items.slice(0, 6).map((r) => r.match));
  const floor = Math.max(60, bestMatch - 28);
  const top = res.items.slice(0, 6).filter((r, i) => i < 3 || r.match >= floor);
  remember(state, top);
  const groups: AdvisorReply["groups"] = [];
  const avgTop = top.slice(0, 3).reduce((s, r) => s + r.p.price, 0) / Math.min(3, top.length);
  const cheaper = res.items
    .slice(6)
    .filter((r) => r.p.price <= avgTop * 0.7 && r.match >= Math.max(60, bestMatch - 20))
    .slice(0, 4);
  if (cheaper.length >= 2 && need.sort !== "cheap") {
    groups.push({ title: "بدائل أوفر 💸", products: cheaper.map(toCard) });
    remember(state, cheaper);
  }

  const desc = describeNeed(need, brandNames);
  // طلبت عروضاً ولا خصم على ما يطابق: نقولها بصراحة.
  const noDeals = need.sort === "deals" && !top.some((r) => r.p.discountPercent > 0);
  const messages = [
    noDeals
      ? `حالياً ما عندي خصومات على ${desc || "هذا الطلب"} — بس هذه أحلى الخيارات المتاحة:`
      : lead ?? `${pick(OPENERS_RESULTS, seed)}${desc ? ` ${desc}` : ""} ✨`,
  ];
  const notes = res.relaxed.map((r) => RELAX_NOTE[r]).filter(Boolean);
  if (notes.length) messages.push(notes[notes.length - 1]);
  const first = top[0];
  if (first?.reasons.length) {
    messages.push(`أكثر واحد يناسبكِ: «${shortName(first.p.name)}» — ${first.reasons.slice(0, 2).join(" و")}.`);
  }
  const tip = tipFor(need, seed);
  if (tip) messages.push(tip);

  return reply(state, { messages, products: top.map(toCard), groups, chips: refineChips(need, true) }, ctx);
}

function buildRoutine(state: AdvisorState, ctx: DialogCtx): AdvisorReply {
  const need = state.need;
  const area = areaOf(need) ?? "skin";
  const template = routineTemplate(area === "hair" || area === "body" ? area : "skin", need);
  const picked = new Set<string>();
  const steps: RoutineStepOut[] = [];
  let brand: string | null = null;
  for (const step of template) {
    const stepNeed: Need = {
      ...need,
      area: area === "hair" || area === "body" ? area : "skin",
      kinds: step.kinds,
      families: [],
      free: [],
      sort: need.sort === "deals" ? "deals" : undefined,
      maxPrice: need.maxPrice ? Math.round(need.maxPrice * step.share * 1.2) : undefined,
      minPrice: undefined,
    };
    let res = rank(ctx.catalog, stepNeed, { exclude: picked, limit: 3, preferBrand: brand });
    if (!res.items.length && stepNeed.maxPrice) res = rank(ctx.catalog, { ...stepNeed, maxPrice: undefined }, { exclude: picked, limit: 3, preferBrand: brand });
    const best = res.items[0];
    if (!best) continue;
    if (step.optional && best.match < 70) continue;
    picked.add(best.p.id);
    brand ??= best.p.brandId; // تناسق: نفضّل نفس البراند للخطوات التالية
    steps.push({ step: step.step, label: step.label, emoji: step.emoji, when: step.when, product: toCard(best) });
  }
  if (!steps.length) return recommend(state, ctx);
  remember(state, steps.map((s) => ({ p: ctx.catalog.products.find((p) => p.id === s.product.id)!, score: 0, match: 0, reasons: [] })).filter((r) => r.p));
  const total = steps.reduce((s, x) => s + x.product.price, 0);
  const title = area === "hair" ? "روتين شعركِ" : area === "body" ? "روتين جسمكِ" : "روتين بشرتكِ";
  // لمن الروتين: «للبشرة الجافة»، «لتساقط الشعر»… بلا تكرار «منتجات العناية».
  const forWhom = [
    need.skinType && area === "skin" ? `للبشرة ال${facetValue("skinType", need.skinType)!.label.replace(/^ال/, "")}` : null,
    need.concerns.length ? li(need.concerns.map((c) => facetValue("concern", c)?.label).filter(Boolean).join(" و")) : null,
  ]
    .filter(Boolean)
    .join(" و");
  const messages = [
    forWhom
      ? pick([`صممت لكِ روتيناً متكاملاً ${forWhom} خطوة بخطوة 🧖‍♀️`, `هذا روتينكِ المثالي ${forWhom} — كل خطوة مختارة لكِ ✨`], state.turns)
      : pick(["صممت لكِ روتيناً متكاملاً خطوة بخطوة 🧖‍♀️", "هذا روتينكِ المثالي — كل خطوة مختارة لكِ ✨"], state.turns),
    `${steps.length} خطوات بمجموع ${fmtPrice(total)} د.ع — تكدرين تضيفينه كله للسلة بلمسة.`,
  ];
  const tip = tipFor(need, state.turns);
  if (tip) messages.push(tip);
  return reply(state, {
    messages,
    routine: { title, steps, total },
    chips: [
      { label: "روتين أوفر", value: "act:cheaper", emoji: "💸" },
      { label: "منتجات مفردة", value: "act:recommend", emoji: "🛍️" },
      ...refineChips({ ...need, routine: true }, false).slice(0, 4),
    ],
  }, ctx);
}

/** اسم مختصر للجملة: أطول جزء وصفي (بلا البراند ولا الحجم). */
function shortName(name: string) {
  const unit = "(مل|ml|غ|g|gm|جم|غرام|لتر|l|oz)";
  const size = new RegExp(`^\\s*[\\d.,]+\\s*${unit}?\\s*$`, "i");
  // «3 قطع»، «قطعتين»، «طقم من 4» — عدد لا اسم.
  const count = /^\s*(\d+\s*(قطع|قطعة|قطعه|حبات|pcs|pieces?)|قطعتين|قطعتان)\s*$/i;
  const parts = name
    .split(/\s[-–—|]\s?/)
    .map((x) => x.trim())
    .filter((x) => x && !size.test(x) && !count.test(x));
  // الجزء الأول القصير غالباً اسم البراند («فالنتينو - اومو انتنس…») فنفضّل الوصف بعده.
  const pool = parts.length > 1 && parts[0].split(/\s+/).length <= 2 ? parts.slice(1) : parts;
  let s = [...pool].sort((a, b) => b.length - a.length)[0] ?? name;
  // \b لا يعمل مع العربية، فنستخدم «ليس بعده حرف».
  s = s.replace(new RegExp(`[,،]?\\s*[\\d.,]+\\s*${unit}(?!\\p{L}).*$`, "iu"), "").trim() || s;
  return s.length > 46 ? `${s.slice(0, 44)}…` : s;
}

// ───────────────────────────────────────────────────────── نقطة الدخول

export function respond(input: DialogInput, prev: AdvisorState | null | undefined, ctx: DialogCtx): AdvisorReply {
  const state: AdvisorState = prev ? structuredClone(prev) : emptyState();
  state.turns += 1;
  state.need = { ...emptyNeed(), ...state.need };
  const seed = state.turns;
  let intent: Intent | null = null;

  // ── أفعال الأزرار. إجابة الاختبار تحمل أفعالاً متعددة: «quiz:ans=set:a=b;add:c=d»
  // فلا تُقسَّم مع غيرها.
  const parts = input.action?.startsWith("quiz:ans=")
    ? [`quiz:ans=${input.action.slice("quiz:ans=".length).replace(/;/g, "|")}`]
    : input.action?.split(";") ?? [];
  if (input.action) {
    for (const part of parts) {
      const a = parseAction(part.trim());
      if (!a) continue;
      if (a.op === "act") {
        intent = (a.key as Intent) ?? null;
        continue;
      }
      if (a.op === "quiz" && a.key === "start" && a.val && QUIZZES[a.val]) {
        const q = QUIZZES[a.val];
        state.need = { ...emptyNeed(), skinType: state.need.skinType, ...q.prefill } as Need;
        state.asked = [];
        state.quiz = { id: q.id, step: 0 };
        return reply(state, { messages: [pick([`يلا نبدأ «${q.title}» ✨`, `«${q.title}» — بضع أسئلة سريعة وأختار لكِ الأنسب.`], seed)], quiz: quizOut(q, 0) }, ctx);
      }
      if (a.op === "quiz" && a.key === "ans" && state.quiz) {
        // الإجابة تحمل أفعالها بعد «ans=» مفصولة بـ «|»
        for (const sub of (a.val ?? "").split("|")) {
          const s = parseAction(sub);
          if (s) state.need = applyAction(state.need, state, s.op, s.key, s.val);
        }
        const q = QUIZZES[state.quiz.id];
        state.quiz.step += 1;
        if (state.quiz.step < q.steps.length) {
          return reply(state, { messages: [pick(["حلو 👌", "تمام!", "اختيار جميل ✨", "ممتاز"], seed)], quiz: quizOut(q, state.quiz.step) }, ctx);
        }
        state.quiz = undefined;
        if (q.finish === "routine") {
          state.need.routine = true;
          return buildRoutine(state, ctx);
        }
        return recommend(state, ctx, `${pick(["حسب اختياراتكِ، هذه أنسب الخيارات:", "اخترت لكِ بناءً على ذوقكِ:"], seed)} ✨`);
      }
      if (a.op === "skip") {
        state.asked.push(a.key);
        continue;
      }
      state.need = applyAction(state.need, state, a.op, a.key, a.val);
    }
    intent ??= "recommend";
  }

  // ── رسالة نصية
  let ack: string | undefined;
  if (input.message?.trim()) {
    state.quiz = undefined;
    const parsed = understand(input.message, ctx.catalog);
    intent = parsed.intent;
    if (parsed.delta.avoid?.length || parsed.delta.excludeBrands?.length) {
      const names = [
        ...(parsed.delta.avoid ?? []).map((a) => {
          const [f, id] = a.split(":") as [FacetKey, string];
          return facetValue(f, id)?.label;
        }),
        ...(parsed.delta.excludeBrands ?? []).map((b) => ctx.catalog.brands.find((x) => x.id === b)?.name),
      ].filter(Boolean);
      if (names.length) ack = `${pick(["تمام، استبعدت", "على راحتكِ، شلت", "ولا يهمكِ، بدون"], seed)} ${names.join(" و")} 👌`;
    }
    const merged = mergeNeed(state.need, parsed.delta);
    state.need = merged.need;
    if (merged.newTopic) {
      state.asked = [];
      state.shown = [];
    }
  }

  switch (intent) {
    case "reset": {
      const fresh = emptyState();
      fresh.turns = state.turns;
      return reply(fresh, { messages: [pick(["تمام، نبدأ من جديد 🌸 شنو تحتاجين؟", "صفحة جديدة ✨ على شنو أساعدكِ؟"], seed)], chips: STARTERS }, ctx);
    }
    case "greet":
      return reply(state, {
        messages: [pick(GREETINGS, seed)(ctx.firstName?.trim() || undefined), pick(WELCOME_BODY, seed)],
        chips: STARTERS,
      }, ctx);
    case "thanks":
      return reply(state, { messages: [pick(THANKS, seed)], chips: STARTERS.slice(0, 4) }, ctx);
    case "about":
    case "help":
      return reply(state, {
        messages: [
          pick(ABOUT, seed),
          "تكدرين تكتبين بأي أسلوب — مثلاً: «بشرتي دهنية وبيها حبوب»، «عطر لزوجي خشبي»، «ماسكارا مقاومة للماء تحت 15 ألف» — أو تبدين اختبار:",
        ],
        chips: STARTERS,
      }, ctx);
    case "quiz":
      return reply(state, { messages: ["اختاري الاختبار اللي يناسبكِ:"], chips: STARTERS.slice(0, 5) }, ctx);
    case "routine":
      state.need.routine = true;
      if (!areaOf(state.need)) {
        return reply(state, {
          messages: ["روتين لأي مجال؟"],
          chips: [
            { label: "روتين البشرة", value: "set:area=skin;act:routine", emoji: "🌸" },
            { label: "روتين الشعر", value: "set:area=hair;act:routine", emoji: "💇‍♀️" },
            { label: "روتين الجسم", value: "set:area=body;act:routine", emoji: "🛁" },
          ],
        }, ctx);
      }
      return buildRoutine(state, ctx);
    case "more":
      if (!specificity(state.need) && !areaOf(state.need)) break;
      return recommend(state, ctx, pick(["هذه خيارات ثانية لكِ:", "تفضلي، مجموعة جديدة:"], seed), { exclude: true });
    case "cheaper": {
      const ref = state.lastPrice;
      if (ref) state.need.maxPrice = Math.round(ref * 0.75);
      state.need.sort = "cheap";
      state.need.minPrice = undefined;
      if (state.need.routine) return buildRoutine(state, ctx);
      return recommend(state, ctx, pick(["خيارات أوفر بنفس الجودة تقريباً 💸", "تفضلي، أرخص وتستاهل:"], seed), { exclude: true });
    }
    case "pricier":
      if (state.lastPrice) state.need.minPrice = Math.round(state.lastPrice * 1.2);
      state.need.maxPrice = undefined;
      state.need.sort = "rated";
      return recommend(state, ctx, "خيارات أرقى للي تحب التميز ✨", { exclude: true });
    case "deals":
      state.need.sort = "deals";
      return recommend(state, ctx, pick(["أحلى العروض المتاحة الآن 🔥", "هذه عليها خصومات حلوة:"], seed));
  }

  // ── توصية: نسأل أولاً فقط إن كان الطلب عاماً جداً
  const q = nextQuestion(state.need, state.asked);
  const askedThisTopic = state.asked.length;
  if (q && specificity(state.need) < 2 && askedThisTopic < 2) {
    state.asked.push(q.key);
    return reply(state, { messages: [pick(q.texts, seed)], chips: q.chips }, ctx);
  }
  if (state.need.routine) return buildRoutine(state, ctx);
  if (!specificity(state.need) && !areaOf(state.need)) {
    return reply(state, {
      messages: [pick(["ما فهمت عليكِ زين 🙈 احكيلي أكثر — شنو المنتج أو المشكلة؟", "وضحيلي أكثر حبيبتي: تدورين عطر، عناية، لو مكياج؟"], seed)],
      chips: QUESTIONS.area.chips,
    }, ctx);
  }
  // هدية بلا مجال محدد: العطر أكثر هدية مضمونة.
  if (intent === "gift" && !areaOf({ ...state.need, gender: undefined }) && !state.need.free.length) {
    state.need.area = "fragrance";
  }
  const giftLead =
    intent === "gift" && state.need.recipient
      ? `${pick(["هدايا تفرح القلب لـ", "اخترت هدايا مميزة لـ"], seed)}${facetValue("recipient", state.need.recipient)?.label ?? ""} 🎁`
      : undefined;
  const lead = ack ?? giftLead;
  return recommend(state, ctx, lead);
}

