import { CatalogIndex } from "../engine/catalog";
import { respond } from "../engine/dialog";
import { normalize } from "../engine/text";
import { AdvisorReply, AdvisorState } from "../engine/types";

/**
 * محادثات متعددة الأدوار: الزبونة تبدأ بطلب ثم تعدّله («بس للدهنية»، «أرخص»، «غيرهم»، «الثاني يناسبني؟»).
 * كل دور له توقعات؛ المحادثة تنجح إذا نجحت كل أدوارها.
 */
export type TurnReply = "products" | "routine" | "knowledge" | "similar" | "fit" | "compare" | "howto" | "ask" | "chat";

export interface TurnExpect {
  reply?: TurnReply | TurnReply[];
  area?: string;
  kinds?: string[];
  concerns?: string[];
  skinType?: string;
  gender?: string;
  families?: string[];
  maxPrice?: number;
  /** صفات يجب أن تبقى كما في الدور السابق (حمل السياق). */
  keep?: ("area" | "kinds" | "concerns" | "skinType" | "gender" | "families" | "maxPrice")[];
  /** صفات يجب أن تُمسح (موضوع جديد). */
  cleared?: ("gender" | "families" | "kinds" | "concerns" | "skinType")[];
  avoid?: string[];
  freeFrom?: string[];
  /** متوسط سعر أول 3 ترشيحات أقل من الدور السابق. */
  cheaper?: boolean;
  /** ترشيحات مختلفة كلياً عن الدور السابق. */
  fresh?: boolean;
  /** أول 5 ترشيحات: نسبة ما يطابق التعبير (اسم + قسم) لا تقل عن 0.6. */
  rel?: string;
  /** لا يظهر في أول 5 ما يطابق هذا التعبير. */
  notRel?: string;
}

export interface Conversation {
  id: string;
  split: "dev" | "test";
  turns: { say: string; expect: TurnExpect }[];
}

const T = (say: string, expect: TurnExpect = {}) => ({ say, expect });
const c = (id: string, split: "dev" | "test", ...turns: { say: string; expect: TurnExpect }[]): Conversation => ({ id, split, turns });
const PERFUME = "عطر|عطور|parfum|perfume|toilette|cologne";

export const CONVERSATIONS: Conversation[] = [
  c("refine-skintype", "dev", T("مرطب للوجه", { kinds: ["moisturizer", "face_cream"] }), T("بس للبشرة الدهنية", { keep: ["kinds"], skinType: "oily", reply: "products" })),
  c("refine-budget", "dev", T("سيروم فيتامين سي", { kinds: ["serum"] }), T("تحت 20 الف", { keep: ["kinds"], maxPrice: 20000, reply: ["products", "ask"] })),
  c("cheaper", "dev", T("عطر رجالي خشبي", { gender: "men" }), T("ارخص", { keep: ["gender"], cheaper: true, reply: "products" })),
  c("more", "dev", T("شامبو للقشرة", { kinds: ["shampoo"] }), T("غيرهم", { keep: ["kinds", "concerns"], fresh: true, reply: "products" })),
  c("topic-switch", "dev", T("عطر نسائي ثابت", { gender: "women" }), T("شامبو للتساقط", { area: "hair", kinds: ["shampoo"], concerns: ["hairloss"], cleared: ["gender"] })),
  c("avoid-sweet", "dev", T("عطر نسائي", { gender: "women" }), T("ما احب الريحة الحلوة", { keep: ["gender"], avoid: ["family:sweet"], reply: "products" })),
  c("fragrance-free", "test", T("مرطب للبشرة الحساسة", { skinType: "sensitive" }), T("بدون عطر", { keep: ["skinType"], freeFrom: ["fragrance"], reply: "products" })),
  c("gender-answer", "dev", T("عطر", { reply: "ask" }), T("رجالي", { gender: "men", area: "fragrance", reply: ["products", "ask"] })),
  c("recipient-answer", "test", T("اريد عطر هدية", { area: "fragrance" }), T("لزوجي", { gender: "men", reply: ["products", "ask"] })),
  c("compare", "dev", T("كريم أساس للبشرة الدهنية", { kinds: ["foundation"] }), T("قارنيهم", { reply: "compare" })),
  c("ordinal-fit", "dev", T("سيروم للحبوب", { kinds: ["serum"] }), T("الثاني يناسب بشرتي الحساسة؟", { reply: "fit" })),
  c("howto", "test", T("ماسكارا مقاومة للماء", { kinds: ["mascara"] }), T("شلون استخدمه", { reply: "howto" })),
  c("same-cheaper", "dev", T("عطر نسائي فانيلا", { gender: "women" }), T("نفس هذا بس ارخص", { reply: ["similar", "products"], cheaper: true })),
  c("add-concern", "dev", T("غسول للوجه", { kinds: ["cleanser"] }), T("عندي حبوب", { keep: ["kinds"], concerns: ["acne"], reply: "products" })),
  c("routine-then-cheaper", "test", T("روتين للبشرة الجافة", { reply: "routine", skinType: "dry" }), T("ارخص", { reply: "routine", keep: ["skinType"] })),
  c("brand-follow", "dev", T("واقي شمس", { kinds: ["sunscreen"] }), T("من لاروش بوزيه", { keep: ["kinds"], rel: "لاروش|roche|بوزيه|posay", reply: ["products", "ask"] })),
  c("men-deodorant", "dev", T("مزيل عرق", { kinds: ["deodorant"] }), T("للرجال", { keep: ["kinds"], gender: "men", reply: ["products", "ask"] })),
  c("hair-oil-concern", "test", T("زيت للشعر", { kinds: ["hair_oil"] }), T("شعري مجعد", { keep: ["kinds"], concerns: ["frizz"], reply: "products" })),
  c("lipstick-color", "dev", T("روج", { kinds: ["lipstick"] }), T("لون نود مطفي", { keep: ["kinds"], reply: "products" })),
  c("perfume-family", "test", T("عطر رجالي", { gender: "men" }), T("ريحته عود", { keep: ["gender"], families: ["oud"], reply: "products" })),
  c("budget-then-more", "dev", T("هدية لأمي بحدود 50 ألف", { maxPrice: 50000 }), T("غيرهم", { keep: ["maxPrice"], fresh: true, reply: "products" })),
  c("english-follow", "test", T("perfume for women", { gender: "women" }), T("cheaper", { keep: ["gender"], cheaper: true, reply: "products" })),
  c("skin-to-makeup", "dev", T("بشرتي دهنية", { skinType: "oily" }), T("اريد كريم اساس", { kinds: ["foundation"], keep: ["skinType"], reply: "products" })),
  c("dupe-then-cheaper", "dev", T("عطر يشبه سوفاج", { reply: "similar" }), T("ارخص", { reply: ["similar", "products"] })),
  c("knowledge-then-products", "test", T("شنو فائدة النياسيناميد", { reply: "knowledge" }), T("اريد سيروم بيه", { kinds: ["serum"], reply: "products", rel: "نياسين|niacin|سيروم|serum" })),
  c("not-brand", "dev", T("ماسكارا", { kinds: ["mascara"] }), T("مو من ميبيلين", { keep: ["kinds"], notRel: "ميبيلين|maybelline", reply: ["products", "ask"] })),
  c("three-turns", "dev",
    T("كريم للوجه", { area: "skin" }),
    T("بشرتي جافة", { skinType: "dry" }),
    T("بس رخيص تحت 15 الف", { keep: ["skinType"], maxPrice: 15000, reply: ["products", "ask"] })),
  c("reset", "test", T("عطر رجالي", { gender: "men" }), T("ابدي من جديد", { reply: "chat", cleared: ["gender"] })),
  c("hair-routine-switch", "test", T("روتين للشعر التالف", { reply: "routine", concerns: ["damaged"] }), T("وروتين للبشرة الدهنية", { reply: "routine", area: "skin", skinType: "oily" })),
  c("gift-then-gender", "dev", T("هدية لصديقتي", {}), T("عطر", { area: "fragrance", gender: "women", reply: ["products", "ask"] })),

  // ── دفعة ثانية أصعب: سلاسل أطول، تصحيح الطلب، لغة مختلطة، تغيير الميزانية بالنص.
  c("hard-correction", "test", T("عطر رجالي", { gender: "men" }), T("لا قصدي نسائي", { gender: "women", keep: [], reply: ["products", "ask"] })),
  c("hard-chain4", "test",
    T("بشرتي مختلطة", { skinType: "combination" }),
    T("اريد غسول", { kinds: ["cleanser"], keep: ["skinType"] }),
    T("بدون عطر", { freeFrom: ["fragrance"], keep: ["kinds", "skinType"] }),
    T("ارخص", { cheaper: true, keep: ["kinds", "skinType"], reply: "products" })),
  c("hard-mixed-lang", "test", T("sunscreen", { kinds: ["sunscreen"] }), T("للبشرة الدهنية spf 50", { keep: ["kinds"], skinType: "oily", reply: "products" })),
  c("hard-budget-raise", "test", T("عطر نسائي تحت 30 الف", { maxPrice: 30000 }), T("خليها تحت 60", { maxPrice: 60000, keep: ["gender"], reply: ["products", "ask"] })),
  c("hard-switch-back", "test",
    T("شامبو للتساقط", { kinds: ["shampoo"] }),
    T("وبلسم", { kinds: ["conditioner"], keep: ["concerns"], reply: "products" })),
  c("hard-third-howto", "test", T("سيروم فيتامين سي", { kinds: ["serum"] }), T("شلون استخدم الثالث", { reply: "howto" })),
  c("hard-for-husband", "test", T("مزيل عرق", { kinds: ["deodorant"] }), T("لزوجي", { keep: ["kinds"], gender: "men", reply: ["products", "ask"] })),
  c("hard-not-sticky", "test", T("واقي شمس", { kinds: ["sunscreen"] }), T("ما يكون دهني ولا يلزق", { keep: ["kinds"], reply: ["products", "ask"] })),
  c("hard-fit-oily", "test", T("كريم اساس", { kinds: ["foundation"] }), T("الاول يناسب البشرة الدهنية؟", { reply: "fit" })),
  c("hard-more-twice", "test",
    T("ماسكارا", { kinds: ["mascara"] }),
    T("غيرهم", { fresh: true, keep: ["kinds"] }),
    T("بعد غيرهم", { fresh: true, keep: ["kinds"], reply: "products" })),
];

function kindOf(r: AdvisorReply): TurnReply {
  if (r.compare) return "compare";
  if (r.fit) return "fit";
  if (r.knowledge && r.anchor && /طريق/.test(r.knowledge.title)) return "howto";
  if (r.knowledge) return "knowledge";
  if (r.routine) return "routine";
  if ((r.anchor || r.state.simRef) && r.products.length) return "similar";
  if (r.products.length || r.groups.some((g) => g.products.length)) return "products";
  if (r.chips.length >= 2 && r.state.asked.length && !r.products.length) return "ask";
  return "chat";
}

const cards = (r: AdvisorReply) => [...r.products, ...r.groups.flatMap((g) => g.products), ...(r.routine?.steps.map((s) => s.product) ?? [])];
const avgTop = (r: AdvisorReply) => {
  const ps = cards(r).slice(0, 3).map((p) => p.price);
  return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
};
const anyOf = (want: string[], got?: string[]) => want.some((w) => (got ?? []).includes(w));
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export interface ConvoResult {
  id: string;
  split: string;
  ok: boolean;
  fails: string[];
  ms: number[];
}

export function evaluateConversations(catalog: CatalogIndex, list: Conversation[] = CONVERSATIONS): { ok: number; n: number; turnsOk: number; turns: number; bySplit: Record<string, { ok: number; n: number }>; results: ConvoResult[] } {
  const results: ConvoResult[] = [];
  let turnsOk = 0;
  let turns = 0;
  for (const convo of list) {
    let state: AdvisorState | null = null;
    let prev: AdvisorReply | null = null;
    const fails: string[] = [];
    const ms: number[] = [];
    convo.turns.forEach((t, i) => {
      const t0 = process.hrtime.bigint();
      const r: AdvisorReply = respond({ message: t.say }, state, { catalog });
      ms.push(Number(process.hrtime.bigint() - t0) / 1e6);
      const n = r.state.need;
      const e = t.expect;
      const bad: string[] = [];
      const k = kindOf(r);
      if (e.reply && !(Array.isArray(e.reply) ? e.reply : [e.reply]).includes(k)) bad.push(`reply=${k}`);
      if (e.area && n.area !== e.area) bad.push(`area=${n.area}`);
      if (e.kinds && !anyOf(e.kinds, n.kinds)) bad.push(`kinds=${n.kinds.join("+")}`);
      if (e.concerns && !anyOf(e.concerns, n.concerns)) bad.push(`concerns=${n.concerns.join("+")}`);
      if (e.skinType && n.skinType !== e.skinType) bad.push(`skinType=${n.skinType}`);
      if (e.gender && n.gender !== e.gender) bad.push(`gender=${n.gender}`);
      if (e.families && !anyOf(e.families, n.families)) bad.push(`families=${n.families.join("+")}`);
      if (e.maxPrice && n.maxPrice !== e.maxPrice) bad.push(`maxPrice=${n.maxPrice}`);
      if (e.avoid && !e.avoid.every((a) => n.avoid.includes(a))) bad.push(`avoid=${n.avoid.join("+")}`);
      if (e.freeFrom && !e.freeFrom.every((a) => n.freeFrom.includes(a))) bad.push(`freeFrom=${n.freeFrom.join("+")}`);
      if (prev) {
        for (const key of e.keep ?? []) if (!same((prev.state.need as unknown as Record<string, unknown>)[key], (n as unknown as Record<string, unknown>)[key])) bad.push(`lost ${key}`);
        if (e.cheaper && !(avgTop(r) > 0 && avgTop(r) < avgTop(prev))) bad.push(`not cheaper (${Math.round(avgTop(prev))}→${Math.round(avgTop(r))})`);
        if (e.fresh) {
          const before = new Set(cards(prev).map((p) => p.id));
          if (!cards(r).length || cards(r).some((p) => before.has(p.id))) bad.push("repeated products");
        }
      }
      for (const key of e.cleared ?? []) {
        const v = (n as unknown as Record<string, unknown>)[key];
        if (Array.isArray(v) ? v.length : v) bad.push(`kept ${key}`);
      }
      const top = cards(r).slice(0, 5).map((p) => catalog.byId(p.id)).filter(Boolean);
      const text = (p: NonNullable<(typeof top)[number]>) => normalize(`${p.name} ${p.nameEn} ${p.brand} ${p.categoryPath.join(" ")}`);
      if (e.rel && top.length) {
        const re = new RegExp(e.rel, "i");
        if (top.filter((p) => re.test(text(p!))).length / top.length < 0.6) bad.push("rel<0.6");
      }
      if (e.notRel && top.some((p) => new RegExp(e.notRel!, "i").test(text(p!)))) bad.push("excluded shown");
      turns++;
      if (!bad.length) turnsOk++;
      else fails.push(`#${i + 1} «${t.say}»: ${bad.join(", ")}`);
      state = r.state;
      prev = r;
    });
    results.push({ id: convo.id, split: convo.split, ok: !fails.length, fails, ms });
  }
  const bySplit: Record<string, { ok: number; n: number }> = {};
  for (const r of results) {
    const s = (bySplit[r.split] ??= { ok: 0, n: 0 });
    s.n++;
    if (r.ok) s.ok++;
  }
  return { ok: results.filter((r) => r.ok).length, n: results.length, turnsOk, turns, bySplit, results };
}
