/**
 * بحث ذكي لحقول الاختيار في لوحة التحكم.
 * يطابق العربي والإنجليزي معاً (لوريال ↔ L'Oréal)، يتجاهل الهمزات والتشكيل والرموز،
 * يقبل أي جزء من الاسم وبأي ترتيب للكلمات، ويتسامح مع الأخطاء الإملائية.
 */

const AR_DIACRITICS = /[ً-ٰٟـ]/g;
const LATIN_MARKS = /[̀-ͯ]/g;

/** تطبيع للمقارنة: حروف صغيرة، بلا تشكيل/لكنات، توحيد الألف والتاء المربوطة والياء. */
export function normalizeSearchText(input: unknown): string {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(LATIN_MARKS, "")
    .replace(AR_DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/['’‘`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const AR_SOUND: Record<string, string> = {
  ب: "b", پ: "b",
  ت: "t", ط: "t",
  ث: "s", ذ: "s", ز: "s", س: "s", ص: "s", ظ: "s",
  ش: "x",
  ج: "j", غ: "j", گ: "j", چ: "j",
  خ: "k", ق: "k", ك: "k",
  د: "d", ض: "d",
  ر: "r", ف: "f", ڤ: "f", ل: "l", م: "m", ن: "n",
};

/** حروف العلة كأصوات تقريبية — تُستعمل فقط للتفضيل بين نتائج متقاربة (ديور → Dior قبل Dr.). */
const AR_VOWEL: Record<string, string> = { ا: "a", و: "o", ي: "i" };
const LATIN_VOWEL: Record<string, string> = { a: "a", o: "o", u: "o", w: "o", e: "i", i: "i", y: "i" };

function latinSound(word: string, withVowels: boolean): string {
  const w = word
    .replace(/x/g, "ks")
    .replace(/sch/g, "x")
    .replace(/chr/g, "kr")
    .replace(/ph/g, "f")
    .replace(/th/g, "s")
    .replace(/sh/g, "x")
    .replace(/ch/g, "x")
    .replace(/kh/g, "k")
    .replace(/gh/g, "j")
    .replace(/ck/g, "k")
    .replace(/qu/g, "k")
    .replace(/c(?=[eiy])/g, "s");
  let out = "";
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    if (ch in LATIN_VOWEL) {
      if (withVowels) out += LATIN_VOWEL[ch];
      continue;
    }
    // h تُنطق في أول الكلمة فقط (Huda ↔ هدى)، وبعدها غالباً صامتة
    if (ch === "h") {
      if (i === 0) out += "h";
      continue;
    }
    out += ch === "c" || ch === "q" ? "k" : ch === "v" ? "f" : ch === "p" ? "b" : ch === "g" ? "j" : ch === "z" ? "s" : ch;
  }
  return out;
}

/**
 * مفتاح نطق تقريبي مشترك بين العربي واللاتيني: الحروف الساكنة فقط بأصوات موحّدة.
 * "Maybelline" و"ميبيلين" كلاهما → "mbln". مع `withVowels` تبقى حروف العلة: "ديور" و"Dior" → "dior".
 */
export function phoneticKey(normalized: string, withVowels = false): string {
  let out = "";
  for (const word of normalized.split(" ")) {
    if (!word) continue;
    if (/[؀-ۿ]/.test(word)) {
      for (const [i, ch] of [...word].entries()) {
        if ((ch === "ه" || ch === "ح") && i === 0) {
          out += "h";
          continue;
        }
        out += AR_SOUND[ch] ?? (withVowels ? AR_VOWEL[ch] : undefined) ?? (/[0-9a-z]/.test(ch) ? ch : "");
      }
    } else {
      out += latinSound(word, withVowels);
    }
  }
  return out.replace(/(.)\1+/g, "$1");
}

/** مسافة التحرير (مع تبديل حرفين متجاورين) مع توقف مبكر عند تجاوز الحد. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2: number[] = new Array(b.length + 1).fill(0);
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

/** أقل مسافة بين الكلمة وبداية الهدف (يسمح بكتابة جزء من الكلمة مع خطأ). */
function prefixDistance(query: string, target: string, max: number): number {
  let best = max + 1;
  for (let len = Math.max(1, query.length - max); len <= Math.min(target.length, query.length + max); len++) {
    best = Math.min(best, editDistance(query, target.slice(0, len), max));
    if (best === 0) break;
  }
  return best;
}

const typoBudget = (len: number) => (len <= 3 ? 0 : len <= 5 ? 1 : len <= 9 ? 2 : 3);

type Prepared = {
  text: string;
  compact: string;
  words: string[];
  sound: string;
  wordSounds: string[];
  wordVowelSounds: string[];
};

function prepare(raw: string): Prepared {
  const text = normalizeSearchText(raw);
  const words = text.split(" ").filter(Boolean);
  return {
    text,
    compact: text.replace(/ /g, ""),
    words,
    sound: phoneticKey(text),
    // بنفس ترتيب words (قد يكون فارغاً لكلمة كلها حروف علة)
    wordSounds: words.map((w) => phoneticKey(w)),
    wordVowelSounds: words.map((w) => phoneticKey(w, true)),
  };
}

const preparedCache = new Map<string, Prepared>();
function prepared(raw: string): Prepared {
  let hit = preparedCache.get(raw);
  if (!hit) {
    if (preparedCache.size > 20000) preparedCache.clear();
    hit = prepare(raw);
    preparedCache.set(raw, hit);
  }
  return hit;
}

/** مكافأة صغيرة داخل نفس الدرجة: الأقرب لطول البحث أولاً. */
const closeness = (queryLen: number, targetLen: number) =>
  Math.round((30 * Math.min(queryLen, targetLen)) / Math.max(1, queryLen, targetLen));
function scoreField(q: Prepared, f: Prepared): number {
  if (!f.text) return 0;
  if (f.text === q.text || f.compact === q.compact) return 1000;
  const textBonus = closeness(q.compact.length, f.compact.length);
  if (f.text.startsWith(q.text) || f.compact.startsWith(q.compact)) return 900 + textBonus;
  if (f.words.some((w) => w.startsWith(q.compact))) return 850 + textBonus;
  if (q.words.length > 1 && q.words.every((qw) => f.words.some((w) => w.startsWith(qw)))) return 800 + textBonus;
  // داخل كلمة واحدة؛ عبر حدود الكلمات فقط لبحث طويل (حتى لا تطابق "ديور" "بودي وركس")
  if (f.words.some((w) => w.includes(q.compact)) || (q.compact.length >= 6 && f.compact.includes(q.compact))) {
    return 700 + textBonus;
  }
  if (q.words.length > 1 && q.words.every((qw) => f.compact.includes(qw))) return 650 + textBonus;

  // تقارب النطق بين العربي واللاتيني
  const qSounds = q.wordSounds.filter(Boolean);
  if (qSounds.length > 1) {
    const aligned = qSounds.every((qs) => f.wordSounds.some((ws) => ws.startsWith(qs)));
    if (aligned) return 620 + closeness(q.sound.length, f.sound.length);
    if (q.sound.length >= 3 && f.sound.startsWith(q.sound)) return 560 + closeness(q.sound.length, f.sound.length);
  } else if (q.sound) {
    // كلمة واحدة: الأقرب طولاً للكلمة المطابقة أولاً ("ديور" → Dior قبل Dr.)
    const qs = q.sound;
    const idx = f.wordSounds.findIndex((ws) => (qs.length >= 2 ? ws.startsWith(qs) : ws === qs));
    if (idx >= 0) {
      return (
        (qs.length >= 2 ? 580 : 500) +
        closeness(qs.length, f.wordSounds[idx].length) +
        Math.max(0, 20 - 5 * prefixDistance(q.wordVowelSounds.join(""), f.wordVowelSounds[idx], 4)) +
        Math.round(closeness(q.compact.length, f.compact.length) / 3) +
        (idx === 0 ? 5 : 0)
      );
    }
    if (qs.length >= 3 && f.sound.includes(qs)) return 520 + closeness(qs.length, f.sound.length);
  }

  // أخطاء إملائية: كل كلمة من البحث تقارب بداية كلمة في الاسم
  let worst = 0;
  for (const qw of q.words) {
    const budget = typoBudget(qw.length);
    let best = budget + 1;
    for (const w of f.words) best = Math.min(best, prefixDistance(qw, w, budget));
    best = Math.min(best, prefixDistance(qw, f.compact, budget));
    if (best > budget) return phoneticTypo(q, f);
    worst = Math.max(worst, best);
  }
  return 450 - worst * 60;
}

function phoneticTypo(q: Prepared, f: Prepared): number {
  if (q.sound.length < 3 || !f.sound) return 0;
  return prefixDistance(q.sound, f.sound, 1) <= 1 ? 300 : 0;
}

let memoQuery = "";
const memo = new Map<string, number>();

/** درجة تطابق الاستعلام مع مجموعة نصوص (اسم عربي/إنجليزي/رابط…). 0 = لا تطابق. */
export function smartScore(query: string, fields: Array<string | null | undefined>): number {
  if (query !== memoQuery) {
    memoQuery = query;
    memo.clear();
  }
  const key = fields.join("\u0001");
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const score = computeScore(query, fields);
  memo.set(key, score);
  return score;
}

function computeScore(query: string, fields: Array<string | null | undefined>): number {
  const q = prepared(query);
  if (!q.text) return 1;
  let best = 0;
  for (const raw of fields) {
    if (!raw) continue;
    const s = scoreField(q, prepared(String(raw)));
    if (s > best) best = s;
    if (best >= 1000) break;
  }
  return best;
}

/** يرتّب ويصفّي قائمة عناصر حسب البحث (الأفضل أولاً). */
export function smartFilter<T>(items: T[], query: string, fields: (item: T) => Array<string | null | undefined>): T[] {
  if (!normalizeSearchText(query)) return items;
  return items
    .map((item, i) => ({ item, i, s: smartScore(query, fields(item)) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((r) => r.item);
}
