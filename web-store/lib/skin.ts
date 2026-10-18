export type SkinType = "dry" | "oily" | "combination" | "normal" | "sensitive";

export const SKIN: Record<SkinType, { label: string; emoji: string; blurb: string }> = {
  dry: { label: "جافة", emoji: "🏜️", blurb: "بشرتكِ تحتاج ترطيباً عميقاً وحاجزاً يحبس الرطوبة — ابتعدي عن الغسولات القاسية." },
  oily: { label: "دهنية", emoji: "💧", blurb: "بشرتكِ تفرز دهوناً أكثر — تحتاجين تنظيفاً لطيفاً منتظماً ومرطباً خفيفاً غير زيتي." },
  combination: { label: "مختلطة", emoji: "🌗", blurb: "منطقة T دهنية والخدود عادية أو جافة — وازني بين التنظيف والترطيب الخفيف." },
  normal: { label: "عادية", emoji: "🌸", blurb: "بشرتكِ متوازنة — حافظي عليها بروتين بسيط وواقي شمس يومي." },
  sensitive: { label: "حساسة", emoji: "🌿", blurb: "بشرتكِ تتحسس بسهولة — اختاري تركيبات لطيفة خالية من العطور وجربي أي منتج أولاً." },
};
export const skinLabel = (k?: string | null) => (k && k in SKIN ? SKIN[k as SkinType].label : k ?? "");

type Opt = { label: string; emoji: string; score: Partial<Record<SkinType, number>> };
export const QUESTIONS: { title: string; hint: string; options: Opt[] }[] = [
  {
    title: "بعد غسل وجهكِ بساعة، شلون تحسين بشرتكِ؟",
    hint: "بدون أي كريم",
    options: [
      { label: "مشدودة وجافة", emoji: "🏜️", score: { dry: 3 } },
      { label: "لامعة بكل الوجه", emoji: "✨", score: { oily: 3 } },
      { label: "لامعة بالجبهة والأنف فقط", emoji: "🌗", score: { combination: 3 } },
      { label: "مرتاحة وطبيعية", emoji: "🌸", score: { normal: 3 } },
    ],
  },
  {
    title: "بنص النهار، شلون يبين وجهكِ؟",
    hint: "خصوصاً بدون مكياج",
    options: [
      { label: "باهت أو فيه قشور", emoji: "🍂", score: { dry: 2 } },
      { label: "لمعان واضح ودهون", emoji: "💧", score: { oily: 2 } },
      { label: "لمعان بمنطقة T بس", emoji: "🎯", score: { combination: 2 } },
      { label: "ما يتغيّر كثير", emoji: "👌", score: { normal: 2 } },
    ],
  },
  {
    title: "شلون المسام عندكِ؟",
    hint: "شوفيها بالمراية بضوء طبيعي",
    options: [
      { label: "صغيرة وما تنشاف", emoji: "🔹", score: { dry: 1, normal: 1 } },
      { label: "واسعة بكل الوجه", emoji: "🔵", score: { oily: 2 } },
      { label: "واسعة بالأنف والجبهة", emoji: "👃", score: { combination: 2 } },
      { label: "متوسطة", emoji: "⚪", score: { normal: 2 } },
    ],
  },
  {
    title: "تتحسس بشرتكِ من المنتجات الجديدة؟",
    hint: "احمرار، حكة، أو حرقان",
    options: [
      { label: "كثيراً — أغلب المنتجات", emoji: "🌿", score: { sensitive: 4 } },
      { label: "أحياناً", emoji: "🤏", score: { sensitive: 2 } },
      { label: "نادراً أو أبداً", emoji: "💪", score: {} },
    ],
  },
];

export function scoreQuiz(answers: number[]): SkinType {
  const s: Record<SkinType, number> = { dry: 0, oily: 0, combination: 0, normal: 0, sensitive: 0 };
  answers.forEach((o, q) => {
    for (const [t, v] of Object.entries(QUESTIONS[q]?.options[o]?.score ?? {})) s[t as SkinType] += v ?? 0;
  });
  if (s.sensitive >= 4) return "sensitive";
  return (["dry", "oily", "combination", "normal"] as SkinType[]).sort((a, b) => s[b] - s[a])[0];
}

export type SkinProfile = { skinType: SkinType; concerns: string[]; takenAt: string };
const KEY = "dh-skin";
export function loadSkin(): SkinProfile | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as SkinProfile) : null;
  } catch {
    return null;
  }
}
export function saveSkin(p: SkinProfile | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {}
}
