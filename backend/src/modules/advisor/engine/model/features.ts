import { applyDialect, normalize, stem } from "../text";

/**
 * ميزات النموذج: كل كلمة تعطي جذرها (نفس تجذيع الفهرس) و«صيغة خفيفة» ثانية
 * تتحمل اختلاف اللواحق («باهت» و«باهتة» تلتقيان، والتجذيع وحده يفرّقهما).
 */

const STOP = new Set(
  (
    "في من على الى عن مع او و ان اذا هل هذا هذه هاي هذي انا اني لي الي عندي يا شيء كثير جدا اريد ممكن لو بس كم ماذا كيف " +
    "ليس لا ما مو بدون بلا كل جميع يوجد لايوجد اكو ماكو هو هي هم انتي انت الذي التي اللي الي بعد قبل عند حتى ثم لان لانه كان يكون تكون " +
    "the a an for and or with of to in my me i want need please some any is it that this your you our by on at as be are from its " +
    "something smell smells like looks look really very so good nice great best"
  ).split(" "),
);

/** صيغة خفيفة: بلا أداة تعريف/عطف/جر ملتصقة، وبلا تاء مربوطة/ياء/جمع في الآخر. */
export function lite(word: string): string {
  let w = word;
  for (const p of ["وال", "بال", "كال", "فال", "لل", "ال"]) {
    if (w.startsWith(p) && w.length - p.length >= 3) {
      w = w.slice(p.length);
      break;
    }
  }
  if (w.length >= 5 && /^[وبل]/.test(w)) w = w.slice(1);
  for (const s of ["تها", "تي", "ته", "ات", "ين", "ون", "يه", "ه", "ي"]) {
    if (w.endsWith(s) && w.length - s.length >= 3) {
      w = w.slice(0, -s.length);
      break;
    }
  }
  return w;
}

/** كلمات النص المطبّعة (بعد اللهجة) بلا كلمات الوصل والأرقام. */
export function words(text: string): string[] {
  const out: string[] = [];
  for (const raw of normalize(text).split(" ")) {
    const d = applyDialect(raw);
    if (!d || d.length < 2 || STOP.has(d) || /^\d+$/.test(d)) continue;
    out.push(d);
  }
  return out;
}

/** ميزات كلمة واحدة (جذر + صيغة خفيفة إن اختلفت). */
export function wordFeatures(word: string): string[] {
  const s = stem(word);
  const l = lite(word);
  return l !== s && l.length >= 2 ? [s, `~${l}`] : [s];
}

/** ميزات نص كامل (بلا تكرار). */
export function textFeatures(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of words(text)) for (const f of wordFeatures(w)) out.add(f);
  return out;
}
