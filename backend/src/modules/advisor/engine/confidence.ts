import { CatalogIndex } from "./catalog";
import { famousIn, SIMILAR_RE } from "./similar";
import { understand } from "./nlu";
import { answerQuestion } from "./qa";
import { normalize, tokens } from "./text";
import { Need } from "./types";

const FILLERS = new Set(
  tokens(
    "اريد ابي احتاج ابغى عندكم اكو شي منتج منتجات افضل احسن ممكن لو سمحتي رجاء شنو شلون حبيبتي عيوني بليز وايد كلش هواية جدا كثير صاير صايرة صار يعني منفرد منفردة مفرد مفردة لوحدها بدون روتين please want need",
    { keepStop: true },
  ),
);

/**
 * هل بقي فهم «ديما» ضعيفاً (بعد المعجم والنموذج المدرَّب)؟ رخيص، بلا آثار جانبية.
 * لا: التحيات، الأسئلة المعرفية المعروفة، «يشبه/بديل» المفهومة، والطلبات المفهومة.
 * نعم: رسالة من كلمتين فأكثر بلا أي صفة مفهومة، أو أغلب كلماتها غير مفهومة.
 * هذه الرسائل تُسجَّل (بلا هوية) لتظهر في لوحة التدريب ويُعاد فحصها بعد كل تدريب.
 */
export function weakUnderstanding(message: string, catalog: CatalogIndex): boolean {
  const m = message.trim();
  if (m.length < 4 || m.length > 400) return false;
  const words = tokens(m).filter((t) => !FILLERS.has(t) && t.length > 1);
  if (words.length < 2) return false;
  if (answerQuestion(m)) return false;
  const nm = normalize(m);
  if (SIMILAR_RE.test(nm) && famousIn(m)) return false;
  const parsed = understand(m, catalog);
  if (["greet", "thanks", "reset", "about", "help", "quiz", "cheaper", "pricier", "more", "deals"].includes(parsed.intent)) return false;
  const free = (parsed.delta.free ?? []).filter((w) => !FILLERS.has(w));
  const d = parsed.delta;
  const strong = Boolean(d.kinds?.length || d.concerns?.length || d.families?.length || d.brands?.length || d.ingredients?.length);
  const facetSignal = strong || Boolean(d.area || d.skinType || d.gender);
  const ratio = free.length / words.length;
  if (!facetSignal) return true;
  // مجال فقط («وجهي»، «شعري») وبقية الكلام وصفٌ لم نفهمه: «شي يخلي وجهي يلمع بالعرس».
  if (!strong && free.length && words.length >= 3) return true;
  if (words.length >= 3 && ratio >= 0.5) return true;
  if (words.length >= 7 && ratio >= 0.34) return true;
  return false;
}

/** هل في المعنى ما يستحق الحفظ؟ (نوع، مشكلة، عائلة، مكوّن، براند، ميزانية، أو نية خاصة) */
export function isUsefulLearning(delta: Partial<Need>, intent?: string | null): boolean {
  return Boolean(
    intent ||
      delta.kinds?.length ||
      delta.concerns?.length ||
      delta.families?.length ||
      delta.ingredients?.length ||
      delta.brands?.length ||
      delta.maxPrice ||
      delta.minPrice,
  );
}
