import { detectConcerns } from "./understand";
import { ProductKind, ShoppingState } from "./types";

export type Clarification = {
  reply: string;
  suggestions: string[];
  kind?: ProductKind;
};

const HAIR: ProductKind[] = ["shampoo", "mask", "serum"];
const SKIN: ProductKind[] = ["cream", "moisturizer", "cleanser"];

/** إذا الطلب عام، نسأل سؤالاً واحداً باختيارات قبل ما نعرض منتجات. */
export function isNameQuestion(message: string) {
  return /اسمج|اسمك|شسمج|شسمك|منو انتي|منو إنتي|منو انت|who are you|your name/i.test(message);
}

export function nameReply(lang: "ar" | "en") {
  return lang === "ar"
    ? "أنا فضه، مستشارة الجمال بمتجر ديما الحياة. احكيلي شنو تحتاجين وأختارلج من المتجر."
    : "I'm Fidda, the beauty advisor at Deema Al Hayat. Tell me what you need and I'll pick from the store.";
}

export function clarify(message: string, state: ShoppingState): Clarification | null {
  const text = message.replace(/\s+/g, " ").trim().toLowerCase();
  if (!text || isFollowUp(text) || detectConcerns(text).length > 0) return null;
  if (state.kind === "perfume" || state.kind === "splash" || state.kind === "lipstick") return null;
  const kind = mentionedKind(text) ?? (state.kind !== "other" ? state.kind : undefined);
  if (kind === "perfume" || kind === "splash" || kind === "lipstick" || kind === "sunscreen") return null;
  if ((kind && HAIR.includes(kind)) || /شعر/.test(text)) {
    return {
      kind: kind && HAIR.includes(kind) ? kind : "shampoo",
      reply: "حتى أختار لج الصح، شنو مشكلة الشعر؟ تقدرين تختارين أكثر من وحدة.",
      suggestions: ["تساقط", "فروة دهنية", "شعر جاف", "قشرة", "شعر مصبوغ"],
    };
  }
  if ((kind && SKIN.includes(kind)) || /بشر/.test(text)) {
    return {
      kind: kind && SKIN.includes(kind) ? kind : "cream",
      reply: "حتى أختار لج الصح، شنو تبين للبشرة؟ تقدرين تختارين أكثر من وحدة.",
      suggestions: ["تفتيح", "حبوب", "بشرة جافة", "بشرة دهنية", "بشرة حساسة"],
    };
  }
  if (isOpenAsk(text)) {
    return {
      reply: "حاضرة. تبين أساعدك بأي قسم؟",
      suggestions: ["شعر", "بشرة", "عطر"],
    };
  }
  return null;
}

function mentionedKind(text: string): ProductKind | undefined {
  if (/عطر|برفان|perfume/.test(text)) return "perfume";
  if (/سبلاش|splash/.test(text)) return "splash";
  if (/شامبو|shampoo/.test(text)) return "shampoo";
  if (/ماسك(?!ارا)/.test(text)) return "mask";
  if (/سيروم|serum/.test(text)) return "serum";
  if (/غسول/.test(text)) return "cleanser";
  if (/واقي|صن بلوك|sunscreen|sunblock|spf/.test(text)) return "sunscreen";
  if (/كريم|مرطب/.test(text)) return "cream";
  if (/روج|lipstick/.test(text)) return "lipstick";
  return undefined;
}

function isOpenAsk(text: string) {
  return text.length < 18 || /شي|منتج|ساعد|انصح|تنصح|اقتراح|اختار|أختار/.test(text);
}

function isFollowUp(text: string) {
  return /ارخص|أرخص|اغلى|أغلى|المزيد|اضافي|بدل|بدلي|غير البخاخ|غير الشامبو|ليش|قارن|استخدم|الاول|الأول|الثاني|الثالث/.test(text);
}
