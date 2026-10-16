import { CatalogIndex } from "./catalog";
import { INGREDIENTS, TOPICS } from "./knowledge";
import { LEXICON } from "./lexicon";
import { stem, tokens } from "./text";

/**
 * تصحيح أخطاء الكتابة من بياناتنا: كلمات المعجم وكلمات الكتالوج بتكرارها.
 * • الحروف الممطوطة: «سيروووم» ← «سيروم»، «شامبوو» ← «شامبو».
 * • حروف تُخلط كتابةً (س/ش، ت/ط، ذ/ز/ظ، ض/ظ، ص/س، ك/ق، ه/ا آخر الكلمة) أو متجاورة في لوحة المفاتيح العربية.
 * لا تُصحَّح كلمة يعرفها الكتالوج أصلاً، ولا تُقبل إلا كلمة معروفة أشيع بكثير.
 */

const CONFUSED: [string, string][] = [
  ["س", "ش"], ["س", "ص"], ["ت", "ط"], ["ذ", "ز"], ["ز", "ظ"], ["ذ", "ظ"], ["ض", "ظ"], ["ض", "د"],
  ["ك", "ق"], ["ه", "ا"], ["ه", "ح"], ["ي", "ى"], ["ث", "س"], ["غ", "ق"], ["و", "ؤ"],
];

// لوحة المفاتيح العربية (صفوفها) — الجيران أخطاء إصبع شائعة.
const ROWS = ["ضصثقفغعهخحجد", "شسيبلاتنمكط", "ئءؤرىةوزظ"];

const COST = new Map<string, number>();
for (const [a, b] of CONFUSED) {
  COST.set(a + b, 0.3);
  COST.set(b + a, 0.3);
}
for (const row of ROWS) {
  for (let i = 0; i + 1 < row.length; i++) {
    const [a, b] = [row[i], row[i + 1]];
    if (!COST.has(a + b)) COST.set(a + b, 0.5);
    if (!COST.has(b + a)) COST.set(b + a, 0.5);
  }
}

/** كلمات المعجم المفردة (مجذّعة) — أهم ما يجب أن يُصحَّح إليه. */
const LEX_WORDS = new Set(
  LEXICON.flatMap((v) => [...v.terms, ...(v.ask ?? [])]).flatMap((t) => tokens(t, { keepStop: true })).filter((w) => w.length >= 3),
);

const ARABIC = /^[؀-ۿ]+$/;

/**
 * كلمات عربية صحيحة من نصوص «ديما» نفسها (قاعدة المعرفة): ليست أخطاء كتابة حتى لو ندرت في الكتالوج
 * («ابدي»، «الصفر» لا تُصحَّح إلى «ايدي»، «السفر»).
 */
const VALID = new Set(
  [
    ...TOPICS.flatMap((t) => [t.title, ...t.triggers, ...t.answer, ...(t.followUps ?? [])]),
    ...INGREDIENTS.flatMap((i) => [i.what, i.howTo, ...i.benefits, ...i.bestFor, ...i.cautions]),
    "ابدي ابدا اعتني اهتم الصفر صفر عيد ميلاد ميلادها مناسبه الدوام الجامعه المدرسه حفله سهره هديه زوجي زوجتي امي اختي صديقتي بنتي ابني ابوي اخوي",
  ].flatMap((t) => tokens(t, { keepStop: true })),
);

/** «سيروووم» ← «سيروم»: حرف مكرر 3 مرات فأكثر يصبح واحداً، والمكرر مرتين آخر الكلمة كذلك. */
function unstretch(w: string): string {
  return w.replace(/(.)\1{2,}/g, "$1").replace(/(.)\1$/, "$1");
}

const cache = new WeakMap<CatalogIndex, Map<string, string | null>>();

/** أصح صيغة لكلمة (مطبّعة، بلا تجذيع)، أو null إن لم يلزم/لم نجد. */
export function correctWord(word: string, catalog: CatalogIndex): string | null {
  if (word.length < 3 || !ARABIC.test(word)) return null;
  let memo = cache.get(catalog);
  if (!memo) cache.set(catalog, (memo = new Map()));
  if (memo.has(word)) return memo.get(word)!;
  const out = compute(word, catalog);
  if (memo.size > 20_000) memo.clear();
  memo.set(word, out);
  return out;
}

function known(w: string, catalog: CatalogIndex): number {
  const s = stem(w);
  return (LEX_WORDS.has(s) ? 1000 : 0) + catalog.docFreq(s);
}

/** تصحيح يغيّر الفهم فقط: الهدف كلمة من المعجم. */
const isLex = (w: string) => LEX_WORDS.has(stem(w));

function compute(word: string, catalog: CatalogIndex): string | null {
  const own = known(word, catalog);
  if (own >= 1000 || own >= 4 || VALID.has(stem(word))) return null;
  const u = unstretch(word);
  if (u !== word && isLex(u)) return u;
  let best: { w: string; score: number } | null = null;
  const consider = (cand: string, cost: number) => {
    if (!isLex(cand)) return;
    const k = known(cand, catalog);
    const score = cost - Math.log10(1 + k) * 0.05;
    if (!best || score < best.score) best = { w: cand, score };
  };
  const base = u;
  for (let i = 0; i < base.length; i++) {
    const ch = base[i];
    // استبدال حرف (مخلوط أو مجاور).
    for (const [pair, cost] of COST) {
      if (pair[0] !== ch) continue;
      // ه/ا تختلطان في آخر الكلمة فقط («ماسكره»)، لا في أولها («هلا» ليست «الا»).
      if ((pair === "ها" || pair === "اه") && i !== base.length - 1) continue;
      // أخطاء الإصبع (حرف مجاور) للكلمات الطويلة فقط — القصيرة تتحول بسهولة لكلمة صحيحة أخرى.
      if (cost >= 0.5 && base.length < 5) continue;
      consider(base.slice(0, i) + pair[1] + base.slice(i + 1), cost);
    }
    // حذف حرف زائد (كلمات 5+ فقط حتى لا تتحول كلمة قصيرة لأخرى).
    if (base.length >= 5) consider(base.slice(0, i) + base.slice(i + 1), 0.6);
  }
  return best && (best as { score: number }).score <= 0.55 ? (best as { w: string }).w : null;
}
