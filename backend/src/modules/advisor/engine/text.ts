/**
 * معالجة النص العربي للمستشارة — بلا أي خدمة خارجية.
 *
 * تطبيع الإملاء (أ/إ/آ → ا، ة → ه، ى → ي، حذف التشكيل والتطويل)، الأرقام
 * العربية → لاتينية، تحويل كلمات اللهجة العراقية الشائعة لصيغة موحدة، وتجذيع
 * خفيف (حذف ال/و/ب/ل/ف في البداية، وات/ين/ون/ه في النهاية) حتى تتطابق
 * «البشرة» مع «بشرتي» و«للبشره».
 */

const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

export function normalize(input: string): string {
  if (!input) return "";
  let s = input.toLowerCase();
  s = s
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[’'`´]/g, "")
    .replace(/[éèê]/g, "e")
    .replace(/[àâ]/g, "a")
    .replace(/[ô]/g, "o")
    .replace(/[،؛؟!?.,:;()[\]{}"«»\-_/\\|+*&^%$#@~=<>]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

/** لهجة عراقية/خليجية شائعة → صيغة موحدة (بعد التطبيع). */
const DIALECT: Record<string, string> = {
  اريد: "اريد",
  ابي: "اريد",
  ابغي: "اريد",
  ابغا: "اريد",
  احتاج: "اريد",
  اخذ: "اريد",
  شي: "شيء",
  شلون: "كيف",
  شنو: "ماذا",
  شنهو: "ماذا",
  اشكد: "كم",
  شكد: "كم",
  بيش: "كم",
  هواي: "كثير",
  كلش: "جدا",
  ماكو: "لايوجد",
  اكو: "يوجد",
  مو: "ليس",
  مال: "",
  حق: "",
  زين: "جيد",
  حلو: "جيد",
  حلوه: "جيده",
  رخيص: "رخيص",
  غالي: "غالي",
  برفان: "عطر",
  بارفان: "عطر",
  بيرفيوم: "عطر",
  ريحه: "عطر",
  ريحة: "عطر",
  ريحته: "عطر",
  كريمات: "كريم",
  شامبوات: "شامبو",
};

export function applyDialect(token: string): string {
  return DIALECT[token] ?? token;
}

// أداة التعريف وما يلتصق بها فقط — الحروف المفردة (ب/ل/ف) جزء من جذور كثيرة
// (بلسم، فانيلا، لوشن، بخور) فلا تُقص. «و» العاطفة تُقص في الكلمات الطويلة فقط.
const ARTICLES = ["وال", "بال", "كال", "فال", "لل", "ال"];
/** تاء مربوطة + ضمير: بشرتي/بشرتها/بشرتك → بشر. */
const TA_PRONOUN = ["تهم", "تها", "تكم", "تنا", "تي", "تك", "ته"];

/** تجذيع خفيف محافظ ومتّسق: نفس الكلمة بصيغها المختلفة تعطي نفس الجذر. */
export function stem(token: string): string {
  if (!/[\u0600-\u06FF]/.test(token)) return token;
  let t = token;
  let stripped = false;
  for (const p of ARTICLES) {
    if (t.startsWith(p) && t.length - p.length >= 3) {
      t = t.slice(p.length);
      stripped = true;
      break;
    }
  }
  if (!stripped && t.startsWith("و") && t.length >= 5) t = t.slice(1);

  const cut = (suffixes: string[], min: number) => {
    for (const s of suffixes) {
      if (t.endsWith(s) && t.length - s.length >= min) {
        t = t.slice(0, -s.length);
        return true;
      }
    }
    return false;
  };
  // لاحقة واحدة فقط، بالترتيب من الأكثر تحديداً.
  cut(TA_PRONOUN, 2) ||
    cut(["ات"], 3) ||
    cut(["ين", "ون"], 3) ||
    cut(["يه"], 3) ||
    cut(["ها", "هم", "كم", "نا"], 3) ||
    cut(["ي", "ه", "ك"], 3);
  return t;
}

const STOP = new Set([
  "في", "من", "على", "الى", "عن", "مع", "او", "و", "ان", "اذا", "هل", "هذا", "هذه", "هاي", "هذي",
  "انا", "اني", "لي", "الي", "عندي", "عدي", "يا", "شيء", "كثير", "جدا", "اريد", "ممكن", "لو", "بس",
  "كم", "ماذا", "كيف", "the", "a", "an", "for", "and", "or", "with", "of", "to", "in", "my", "me", "i",
  "want", "need", "please", "some", "any", "is", "it", "that", "this",
]);

export function tokens(input: string, { keepStop = false } = {}): string[] {
  const out: string[] = [];
  for (const raw of normalize(input).split(" ")) {
    if (!raw) continue;
    const d = applyDialect(raw);
    if (!d) continue;
    if (!keepStop && STOP.has(d)) continue;
    out.push(stem(d));
  }
  return out;
}

/** هل يحتوي النص المطبَّع على العبارة (حدود كلمة مرنة للعربية)؟ */
export function hasPhrase(normText: string, phrase: string): boolean {
  if (!phrase) return false;
  const p = normalize(phrase);
  if (!p) return false;
  if (/^[a-z0-9 ]+$/.test(p)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRe(p)}([^a-z0-9]|$)`).test(normText);
  }
  // للعربية: نسمح بسوابق ال/و/ب/ل ولواحق الضمائر.
  return new RegExp(`(^|\\s)(و|ب|ل|ف|ك)?(ال|لل)?${escapeRe(p)}(ي|ه|ها|ك|تي|ات|ين)?(\\s|$)`).test(normText);
}

/** «ل» + اسم: «حب الشباب» ← «لحب الشباب»، «التصبغات» ← «للتصبغات». */
export function li(label: string): string {
  return label.startsWith("ال") ? `لل${label.slice(2)}` : `ل${label}`;
}

/**
 * «ب» + اسم مكوّن: الكلمة الأجنبية المفردة تأخذ «ال» (بالريتينول، بالساليسيليك)،
 * والمركّبة تبقى كما هي (بشجرة الشاي، بفيتامين C).
 */
export function bi(label: string): string {
  if (label.startsWith("ال")) return `ب${label}`;
  const single = !/\s/.test(label.trim());
  return single && !/^(فيتامين|زيت|حمض|خلاصة)/.test(label) ? `بال${label}` : `ب${label}`;
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** مسافة تحرير (لأسماء البراندات المكتوبة بأخطاء) — محدودة لأداء عالٍ. */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

/** أرقام بالسياق العراقي: «20 الف» = 20000، «20k» = 20000، «ربع مليون»… */
export function parseMoney(raw: string): number | null {
  const s = normalize(raw);
  const m = s.match(/(\d+(?:\.\d+)?)\s*(الف|الاف|k|ك|الفين|مليون)?/);
  if (!m) {
    if (/ربع مليون/.test(s)) return 250000;
    if (/نص مليون|نصف مليون/.test(s)) return 500000;
    return null;
  }
  let n = parseFloat(m[1]);
  const unit = m[2] ?? "";
  if (unit === "مليون") n *= 1_000_000;
  else if (unit) n *= 1000;
  else if (n < 1000) n *= 1000; // «تحت 25» في سياق الأسعار = 25 ألف
  return Math.round(n);
}

/** ألوان بالعربية ↔ أسماؤها الإنجليزية في أسماء الدرجات (Red 401، Nude…). */
export const COLOR_SYNONYMS: Record<string, string[]> = {
  احمر: ["red", "rouge", "cherry", "ruby", "scarlet"],
  وردي: ["pink", "rose", "rosy", "blush"],
  زهري: ["pink", "rose"],
  نود: ["nude", "beige"],
  بيج: ["beige", "nude"],
  بني: ["brown", "chocolate", "mocha", "coffee"],
  اسود: ["black", "noir"],
  ابيض: ["white", "blanc"],
  ذهبي: ["gold", "golden"],
  فضي: ["silver"],
  بنفسجي: ["purple", "violet", "plum", "lilac"],
  ازرق: ["blue", "navy"],
  اخضر: ["green"],
  برتقالي: ["orange", "coral"],
  مرجاني: ["coral"],
  عنابي: ["burgundy", "wine", "berry"],
  خمري: ["burgundy", "wine"],
  شفاف: ["clear", "transparent"],
};
