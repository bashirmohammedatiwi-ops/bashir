import { normalize } from "./text";

/**
 * كلام اجتماعي لا طلب فيه («السلام عليكم»، «شلونج ديما»، «تمام»، «ههههه»):
 * يُجاب بلطف دون ترشيح منتجات عشوائية من كلماته.
 */
export type SmallTalk = "salaam" | "greet" | "howareyou" | "who" | "ok" | "laugh" | "love" | "praise" | "bye";

const GROUPS: [SmallTalk, string[]][] = [
  ["salaam", ["السلام", "سلام", "عليكم", "عليكم", "ورحمه", "الله", "وبركاته", "وعليكم"]],
  ["greet", ["مرحبا", "مرحبتين", "مراحب", "هلا", "هلو", "هلاو", "اهلا", "اهلين", "هاي", "صباح", "صباحو", "مساء", "مساءو", "الخير", "النور", "hi", "hello", "hey", "morning", "evening", "good"]],
  ["howareyou", ["شلونج", "شلونك", "شلونكم", "شلون", "كيفك", "كيفج", "كيف", "حالك", "حالج", "الحال", "شخبارك", "شخبارج", "اخبارك", "اخبارج", "عساج", "عساك", "بخير", "زينه", "how", "are", "you", "doing"]],
  ["who", ["منو", "انتي", "انت", "من", "اسمج", "اسمك", "شسمج", "شسمك", "who"]],
  ["ok", ["تمام", "اوك", "اوكي", "ok", "okay", "ماشي", "طيب", "عدل", "صح", "اي", "ايه", "نعم", "زين", "فهمت", "مفهوم", "يس", "yes"]],
  ["love", ["احبج", "احبك", "احبچ", "عمري", "روحي", "قلبي", "حياتي", "love"]],
  ["praise", ["شاطره", "ذكيه", "رائعه", "ممتازه", "جميله", "حلوه", "عسل", "كفو", "عاشت", "ايدج", "يمه", "واو", "wow", "nice", "cool"]],
  ["bye", ["باي", "bye", "سلامه", "السلامه", "بامان", "مع", "تصبحين", "على", "خير", "الله", "وياج", "ويامج", "اشوفج"]],
];
const FILLER = new Set(["يا", "ديما", "ديمه", "حبي", "حبيبتي", "عيوني", "اختي", "و", "انتي", "انتِ", "؟", "?"]);
const LAUGH = /^(ه{3,}|خخخ+|lol|haha+|😂+|🤣+)$/;

const WORD_GROUP = new Map<string, SmallTalk>();
for (const [k, words] of GROUPS) for (const w of words) if (!WORD_GROUP.has(normalize(w))) WORD_GROUP.set(normalize(w), k);

/** الأنواع الموجودة في الرسالة إن كانت كلها كلاماً اجتماعياً، وإلا null. */
export function detectSmallTalk(message: string): Set<SmallTalk> | null {
  const words = normalize(message)
    .replace(/[!؟?.,،…~💜🌸❤️♥️😍🥰😊🙂👋]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length || words.length > 8) return null;
  const kinds = new Set<SmallTalk>();
  for (const w of words) {
    if (FILLER.has(w)) continue;
    if (LAUGH.test(w)) {
      kinds.add("laugh");
      continue;
    }
    const k = WORD_GROUP.get(w);
    if (!k) return null; // كلمة طلب حقيقية — ليست دردشة
    kinds.add(k);
  }
  if (!kinds.size) return words.some((w) => w === "ديما" || w === "ديمه") ? new Set(["greet"]) : null;
  // «مع السلامة»/«تصبحين على خير»: وداع لا سلام.
  const n = normalize(message);
  if (/(مع السلامه|تصبحين على خير|باي|bye|اشوفج)/.test(n)) return new Set(["bye"]);
  if (/(السلام عليكم|سلام عليكم|^سلام$|^السلام$)/.test(n)) kinds.add("salaam");
  return kinds;
}

/** ردّ دافئ بلهجة عراقية حسب نوع الكلام. */
export function smallTalkReply(kinds: Set<SmallTalk>, seed: number, name?: string, message = "", afterPicks = false): string[] {
  const pick = <T,>(a: T[]) => a[seed % a.length];
  const hi = name ? ` ${name}` : "";
  const out: string[] = [];
  if (kinds.has("bye")) return [pick(["بأمان الله 🌸 أنا هنا متى ما احتجتيني.", "الله وياج 💜 ارجعيلي أي وقت تحتاجين شي."])];
  if (kinds.has("salaam")) out.push(`وعليكم السلام ورحمة الله 🌸 هلا بيكِ${hi}!`);
  else if (kinds.has("greet")) {
    const n = normalize(message);
    out.push(
      /صباح/.test(n) ? `صباح النور${hi} ☀️` : /مساء/.test(n) ? `مساء النور${hi} 🌙` : pick([`هلا بيكِ${hi} 🌸`, `أهلين${hi} 💜`, `يا هلا${hi} ✨`]),
    );
  }
  if (kinds.has("howareyou")) out.push(pick(["الحمد لله بخير، تسلمين على السؤال 💜 وإنتِ شلونج؟", "زينة الحمد لله، وأحسن من شفتج 🌸 شلونج إنتِ؟"]));
  if (kinds.has("love")) out.push(pick(["وأنا أحبج أكثر 💜", "تسلمين يا عسل 🥰"]));
  if (kinds.has("praise")) out.push(pick(["تسلمين 🌸 هذا من ذوقج!", "شكراً حبيبتي، يفرحني أفيدج ✨"]));
  if (kinds.has("laugh")) out.push(pick(["😄 فرحتيني!", "😄 حلوة!"]));
  if (kinds.has("ok") && !out.length) out.push(pick(["تمام 🌸", "حلو 👌", "ماشي 💜"]));
  if (kinds.has("who") && !kinds.has("howareyou")) {
    out.push("أنا ديما 🌸 مستشارتج الجمالية بمتجر ديما الحياة — أعرف المنتجات وأختارلج الأنسب لبشرتج وشعرج وذوقج بالعطور.");
  }
  // بعد ترشيحات معروضة: «تمام» = رضا — نقترح الخطوة التالية بدل السؤال من جديد.
  if (afterPicks && (kinds.has("ok") || kinds.has("praise") || kinds.has("love"))) {
    out.push("إذا تحبين أعدّل الاختيار — أوفر، أرقى، لو نوع ثاني — كوليلي، أو أضيفي اللي عجبج للسلة 🛍️");
    return out;
  }
  out.push(pick([
    "شنو تحتاجين اليوم؟ عناية، مكياج، لو عطر؟",
    "كوليلي شنو تدورين، وأختارلج الأنسب ✨",
    "إذا تحتاجين شي للبشرة أو الشعر أو عطر، أنا حاضرة.",
  ]));
  return out;
}

/**
 * «هلا شلونج اريد عطر»: يفصل كلمات التحية في أول الرسالة عن الطلب، حتى لا تُبحث كمنتجات.
 * يعيد الطلب وحده وسطر ترحيب قصير — أو null إن لم تبدأ الرسالة بتحية.
 */
export function splitGreeting(message: string, seed: number): { rest: string; lead: string } | null {
  const raw = message.trim().split(/\s+/);
  let i = 0;
  const kinds = new Set<SmallTalk>();
  while (i < raw.length) {
    const w = normalize(raw[i]).replace(/[!؟?.,،]+/g, "");
    if (FILLER.has(w) || w === "") {
      i++;
      continue;
    }
    const k = WORD_GROUP.get(w);
    if (!k || k === "ok" || k === "praise" || k === "who") break;
    kinds.add(k);
    i++;
  }
  if (!kinds.size || i >= raw.length) return null;
  const rest = raw.slice(i).join(" ");
  const n = normalize(message);
  const lead = /السلام|سلام/.test(n)
    ? "وعليكم السلام 🌸"
    : kinds.has("howareyou")
      ? "الحمد لله بخير 💜"
      : /صباح/.test(n)
        ? "صباح النور ☀️"
        : /مساء/.test(n)
          ? "مساء النور 🌙"
          : ["هلا بيكِ 🌸", "أهلين 💜"][seed % 2];
  return { rest, lead };
}
