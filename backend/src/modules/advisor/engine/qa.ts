import { INGREDIENTS, IngredientFact, TOPICS, TopicFact } from "./knowledge";
import { LEXICON } from "./lexicon";
import { normalize } from "./text";
import { Chip, KnowledgeOut } from "./types";

/**
 * أسئلة المعرفة: «شنو فائدة النياسيناميد؟»، «اقدر استخدم الريتينول ويه فيتامين سي؟»،
 * «شلون اثبت العطر؟». الأجوبة من قاعدة معرفة داخلية مكتوبة ومراجعة.
 */

export const QUESTION_RE =
  /(شنو|شو |ما هو|ما هي|ماهو|ماهي|شلون|كيف|هل |ليش|لماذا|متى|اشوكت|شكد|الفرق|اقدر|ينفع|يصير|يجوز|ممكن استخدم|اخلط|اجمع|ادمج|فايده|فائده|فوائد|يفيد|يسوي|نصيحه|نصايح|what|how|can i|difference|benefit|\?|؟)/;

const COMBO_RE = /( مع | ويه | وياه | سوا | سويه | بنفس | together| with |اخلط|اجمع|ادمج|اركب)/;

const pad = (s: string) => ` ${s} `;
const norm = (s: string) => normalize(s).replace(/[؟?!.,،]/g, " ").replace(/\s+/g, " ").trim();

const ING_ALIASES: { fact: IngredientFact; alias: string }[] = INGREDIENTS.flatMap((fact) =>
  [...new Set([fact.name, ...fact.aliases].map(norm).filter((a) => a.length >= 3))].map((alias) => ({ fact, alias })),
).sort((a, b) => b.alias.length - a.alias.length);

const TOPIC_TRIGGERS: { topic: TopicFact; trigger: string }[] = TOPICS.flatMap((topic) =>
  topic.triggers.map((t) => ({ topic, trigger: norm(t) })).filter((x) => x.trigger.length >= 4),
).sort((a, b) => b.trigger.length - a.trigger.length);

const LEXICON_INGREDIENTS = new Set(LEXICON.filter((v) => v.facet === "ingredient").map((v) => v.id));
const byId = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function detectIngredients(message: string): IngredientFact[] {
  let text = pad(norm(message));
  const found: IngredientFact[] = [];
  for (const { fact, alias } of ING_ALIASES) {
    const a = pad(alias);
    // «ال» و«بال» و«و» قبل الاسم مقبولة.
    const hit = [a, ` ال${alias} `, ` بال${alias} `, ` وال${alias} `, ` و${alias} `].find((v) => text.includes(v));
    if (!hit) continue;
    if (!found.includes(fact)) found.push(fact);
    text = text.replace(hit, " ");
  }
  return found;
}

export function detectTopic(message: string): { topic: TopicFact; trigger: string } | null {
  const text = pad(norm(message));
  for (const { topic, trigger } of TOPIC_TRIGGERS) {
    if (text.includes(pad(trigger)) || (trigger.includes(" ") && text.includes(trigger))) return { topic, trigger };
  }
  return null;
}

export interface QaAnswer {
  messages: string[];
  knowledge: KnowledgeOut;
  chips: Chip[];
  /** مكونات لعرض منتجات تحتويها (إن كانت ضمن المعجم). */
  productIngredients: string[];
  area?: string;
}

const ingName = (id: string) => byId.get(id)?.name ?? id;

const productChip = (f: IngredientFact): Chip =>
  LEXICON_INGREDIENTS.has(f.id)
    ? { label: `منتجات فيها ${f.name.replace(/^ال/, "")}`, value: `set:area=${f.area};add:ingredient=${f.id};act:recommend`, emoji: "🛍️" }
    : { label: `منتجات ${f.name}`, value: `منتجات ${f.name}`, emoji: "🛍️" };

function comboAnswer(a: IngredientFact, b: IngredientFact): QaAnswer {
  const clash = a.avoidWith.find((x) => x.id === b.id) ?? b.avoidWith.find((x) => x.id === a.id);
  const pairs = a.pairsWell.includes(b.id) || b.pairsWell.includes(a.id);
  let verdict: KnowledgeOut["verdict"];
  const split =
    a.time !== b.time && a.time !== "both" && b.time !== "both"
      ? `${a.name} ${a.time === "am" ? "صباحاً" : "مساءً"} و${b.name} ${b.time === "am" ? "صباحاً" : "مساءً"}`
      : `${a.name} بليلة و${b.name} بليلة ثانية`;
  if (clash) {
    const why = clash.why.replace(/[.。]$/, "");
    const solved = /(صباح|مساء|ليل|بالتناوب|ليله)/.test(why);
    verdict = { tone: "care", text: `لا تجمعيهم بنفس الخطوة — ${why}${solved ? "." : `. الحل: ${split}.`}` };
  } else if (pairs) {
    verdict = { tone: "good", text: `ثنائي ممتاز! ${a.name} و${b.name} يكمّلون بعض.` };
  } else {
    verdict = { tone: "good", text: `ممكن تستخدمينهم سوا بأمان غالباً — ابدئي تدريجياً وراقبي بشرتكِ.` };
  }
  const order =
    a.time === "pm" || b.time === "pm"
      ? []
      : ["رتّبيهم من الأخف قواماً للأثقل، وانتظري دقيقة بين الطبقات."];
  return {
    messages: [`سؤال ذكي 👌 هذا رأيي بمزج ${a.name} و${b.name}:`],
    knowledge: {
      title: `${a.name} + ${b.name}`,
      kind: "combo",
      verdict,
      sections: [
        { label: a.name, icon: "🧪", bullets: [a.what, `أفضل وقت: ${timeLabel(a.time)}`] },
        { label: b.name, icon: "🧪", bullets: [b.what, `أفضل وقت: ${timeLabel(b.time)}`] },
        ...(order.length ? [{ label: "الترتيب", icon: "📋", bullets: order }] : []),
      ],
    },
    chips: [productChip(a), productChip(b), { label: "روتين كامل", value: "set:area=skin;act:routine", emoji: "🧖‍♀️" }],
    productIngredients: [a.id, b.id].filter((x) => LEXICON_INGREDIENTS.has(x)),
    area: a.area,
  };
}

const timeLabel = (t: string) => (t === "am" ? "الصباح" : t === "pm" ? "المساء" : "صباحاً أو مساءً");

function ingredientAnswer(f: IngredientFact): QaAnswer {
  const sections: KnowledgeOut["sections"] = [
    { label: "فوائده", icon: "✨", bullets: f.benefits },
    { label: "يناسب", icon: "🎯", bullets: f.bestFor },
    { label: "طريقة الاستخدام", icon: "🕐", bullets: [f.howTo] },
  ];
  if (f.cautions.length) sections.push({ label: "انتبهي", icon: "⚠️", bullets: f.cautions });
  const friends = f.pairsWell.map(ingName).slice(0, 4);
  if (friends.length) sections.push({ label: "يتوافق مع", icon: "🤝", bullets: [friends.join("، ")] });
  if (f.avoidWith.length) {
    sections.push({ label: "لا تجمعيه مع", icon: "🚫", bullets: f.avoidWith.slice(0, 3).map((x) => `${ingName(x.id)}: ${x.why}`) });
  }
  return {
    messages: [`${f.name} — كل اللي تحتاجين تعرفينه 🧪`],
    knowledge: { title: f.name, kind: "ingredient", intro: f.what, sections },
    chips: [
      productChip(f),
      ...f.pairsWell
        .slice(0, 2)
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((g) => ({ label: `${f.name.replace(/^ال/, "")} + ${g!.name.replace(/^ال/, "")}؟`, value: `اقدر استخدم ${f.name} مع ${g!.name}؟`, emoji: "🤔" })),
    ],
    productIngredients: LEXICON_INGREDIENTS.has(f.id) ? [f.id] : [],
    area: f.area,
  };
}

function topicAnswer(t: TopicFact): QaAnswer {
  return {
    messages: [pickLead(t.id)],
    knowledge: { title: t.title, kind: "info", sections: [{ label: "", icon: "💡", bullets: t.answer }] },
    chips: (t.followUps ?? []).slice(0, 3).map((m) => ({ label: m, value: m, emoji: "✨" })),
    productIngredients: [],
    area: t.area,
  };
}

function pickLead(seed: string) {
  const leads = ["أكيد! هذا الملخص المفيد:", "سؤال حلو 👌 خليني أوضح لكِ:", "هذه خلاصة خبرتي بالموضوع:"];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return leads[h % leads.length];
}

/**
 * يجيب إن كانت الرسالة سؤال معرفة. `hasProductSignal`: طلب منتج صريح («شامبو للقشرة»)
 * يبقى ترشيحاً ما لم يكن السؤال عن مكوّن أو موضوع بعينه.
 */
export function answerQuestion(message: string): QaAnswer | null {
  const n = pad(norm(message));
  const isQ = QUESTION_RE.test(n);
  const ings = detectIngredients(message);
  if (ings.length >= 2 && (COMBO_RE.test(n) || isQ)) return comboAnswer(ings[0], ings[1]);
  const t = detectTopic(message);
  // عبارة من كلمتين فأكثر («ترتيب الروتين») تكفي وحدها؛ الكلمة المفردة تحتاج صيغة سؤال.
  if (t && (isQ || t.trigger.includes(" "))) return topicAnswer(t.topic);
  // اسم مكوّن وحده («النياسيناميد؟») أو سؤال عنه.
  if (ings.length === 1) {
    const words = norm(message).split(" ").filter((w) => w.length > 1);
    if (isQ || words.length <= 2) return ingredientAnswer(ings[0]);
  }
  return null;
}

/** تنبيه مختصر لمكوّن (لـ«هل يناسبني؟»). */
export function cautionFor(id: string): string | undefined {
  return byId.get(id)?.cautions[0];
}
