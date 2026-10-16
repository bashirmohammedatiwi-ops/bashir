import { facetValue } from "./lexicon";
import { bi, li } from "./text";
import { Need } from "./types";

/** اختيار عبارة متنوعة (ثابتة لنفس الدور حتى لا تتبدل عند إعادة الرسم). */
export function pick<T>(options: T[], seed: number): T {
  return options[Math.abs(seed) % options.length];
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** تحية الترحيب — الاسم في مكانه الطبيعي («أهلاً سارة!») لا في آخر الجملة. */
export const GREETINGS: ((name?: string) => string)[] = [
  (n) => `${n ? `أهلاً ${n}!` : "أهلاً بكِ!"} أنا ديما، مستشارتكِ الشخصية للجمال والعطور 🌸`,
  (n) => `${n ? `هلا ${n}!` : "هلا بيكِ!"} أنا ديما — أساعدكِ تختارين الأنسب لكِ من بين آلاف المنتجات ✨`,
  (n) => `${n ? `مرحباً ${n}!` : "مرحباً حبيبتي!"} أنا ديما، خبيرتكِ في العناية والمكياج والعطور 💜`,
];

export const WELCOME_BODY = [
  "اكتبي لي اللي تحتاجينه بأسلوبكِ — مثل «عطر نسائي خشبي للسهرة» أو «شامبو للتساقط تحت 20 ألف» — أو اختاري من الاقتراحات.",
  "احكي لي عن بشرتكِ أو شعركِ أو العطر اللي تحلمين بيه، وأنا أرشحلكِ الأنسب مع السبب.",
];

export const OPENERS_RESULTS = [
  "اخترت لكِ بعناية:",
  "هذه أنسب الخيارات لكِ:",
  "رشحت لكِ هذه:",
  "وجدت لكِ خيارات رائعة:",
];

export const THANKS = [
  "العفو حبيبتي 💜 أي وقت تحتاجين شي آني هنا.",
  "تدللين! إذا تحبين أكمل وياكِ بشي ثاني، كوليلي.",
];

export const ABOUT = [
  "أنا ديما 🌸 مستشارة جمال ذكية مبنية خصيصاً لمتجر ديما الحياة. أفهم احتياجكِ وأقارن آلاف المنتجات بصفاتها ومكوناتها وتقييماتها حتى أرشحلكِ الأنسب مع السبب.",
];

/** نصائح خبيرة قصيرة تُضاف للرد — تجعل الترشيح استشارة لا قائمة. */
export const TIPS: Record<string, string[]> = {
  acne: [
    "💡 نصيحة: ابدئي بمنتج واحد فعّال (ساليسيليك أو نياسيناميد) وامنحيه 4 أسابيع قبل الحكم عليه.",
    "💡 لا تقشري البشرة يومياً مع الحبوب — مرتين بالأسبوع تكفي، والترطيب ضروري حتى للبشرة الدهنية.",
  ],
  pigment: [
    "💡 أي علاج للتصبغات بدون واقي شمس يومي يضيع مفعوله — الواقي هو نصف العلاج.",
    "💡 فيتامين سي صباحاً والنياسيناميد مساءً ثنائي ممتاز لتوحيد اللون.",
  ],
  aging: [
    "💡 الريتينول يُستخدم ليلاً وبالتدريج (مرتين بالأسبوع أولاً)، مع واقي شمس صباحاً.",
  ],
  dryness: [
    "💡 ضعي المرطب على بشرة رطبة قليلاً بعد الغسول مباشرة — يحبس الترطيب أكثر.",
  ],
  oily: [
    "💡 البشرة الدهنية تحتاج ترطيب خفيف بقوام جل — حرمانها من الترطيب يزيد الدهون.",
  ],
  sensitive: [
    "💡 جربي أي منتج جديد على جزء صغير خلف الأذن 24 ساعة قبل استخدامه على الوجه.",
  ],
  hairloss: [
    "💡 دلكي فروة الرأس دقيقتين مع السيروم يومياً — التدليك يحفز الدورة الدموية ويقوي البصيلات.",
  ],
  dandruff: [
    "💡 اتركي شامبو القشرة على فروة الرأس 3–5 دقائق قبل الشطف حتى يعمل فعلاً.",
  ],
  frizz: [
    "💡 جففي شعركِ بمنشفة قطنية بالضغط لا بالفرك، وضعي الكريم والشعر رطب.",
  ],
  damaged: [
    "💡 ماسك أسبوعي + حماية من الحرارة قبل السشوار يصنع فرقاً واضحاً خلال شهر.",
  ],
  perfume: [
    "💡 رشي العطر على نقاط النبض (المعصم وخلف الأذن) ولا تفركيه — الفرك يكسر الطبقة العليا.",
    "💡 للثبات الأطول: رطبي البشرة بلوشن غير معطر قبل العطر.",
  ],
  night: ["🌙 العطور المسائية عادةً أعمق — رشتان تكفي."],
  day: ["☀️ للدوام اختاري عطراً هادئاً لا يزعج من حولك — رشة أو رشتان."],
};

export function tipFor(need: Need, seed: number): string | null {
  const keys = [...need.concerns, need.area === "fragrance" ? "perfume" : "", need.time ?? ""].filter(Boolean);
  for (const k of keys) {
    const list = TIPS[k];
    if (list?.length) return pick(list, seed);
  }
  return null;
}

/** وصف ما فهمته بجملة طبيعية: «عطور نسائية خشبية للمساء ضمن 50 ألف». */
/** صفات العطر بصيغة الجمع المؤنث: «عطور نسائية خشبية». */
const FAMILY_PL: Record<string, string> = {
  woody: "خشبية", oud: "بالعود", floral: "زهرية", oriental: "شرقية", musk: "بالمسك", vanilla: "بالفانيلا",
  sweet: "حلوة", fresh: "منعشة", aquatic: "مائية", spicy: "حارة", fruity: "فواكهية", leather: "جلدية",
  powdery: "بودرية", coffee: "بالقهوة",
};
const GENDER_PL: Record<string, string> = { women: "نسائية", men: "رجالية", unisex: "للجنسين" };

export function describeNeed(need: Need, brandNames: Map<string, string>): string {
  const parts: string[] = [];
  const kind = need.kinds[0] ? facetValue("kind", need.kinds[0])?.label : null;
  const area = need.area ? facetValue("area", need.area)?.label : null;
  const perfume = need.area === "fragrance" && (!need.kinds.length || need.kinds[0] === "perfume");
  if (perfume) parts.push("عطور");
  else if (kind) parts.push(kind);
  // «منتجات العناية بالبشرة للبشرة الدهنية» مكررة — نختصرها حين يُذكر نوع البشرة.
  else if (need.area === "skin" && need.skinType) parts.push("منتجات عناية");
  else if (area) parts.push(`منتجات ${area}`);
  if (need.gender) parts.push(perfume ? GENDER_PL[need.gender] : facetValue("gender", need.gender)!.label);
  if (need.families.length) {
    parts.push(
      need.families
        .map((f) => (perfume ? FAMILY_PL[f] : facetValue("family", f)?.label))
        .filter(Boolean)
        .join(" و"),
    );
  }
  if (need.time) parts.push(need.time === "night" ? "للمساء" : "للنهار");
  if (need.skinType) parts.push(`للبشرة ال${facetValue("skinType", need.skinType)!.label.replace(/^ال/, "")}`);
  if (need.concerns.length) {
    parts.push(li(need.concerns.map((c) => facetValue("concern", c)?.label).filter(Boolean).join(" و")));
  }
  if (need.ingredients.length) {
    parts.push(bi(need.ingredients.map((i) => facetValue("ingredient", i)?.label).filter(Boolean).join(" و")));
  }
  if (need.finish) parts.push(facetValue("finish", need.finish)!.label);
  if (need.brands.length) parts.push(`من ${need.brands.map((b) => brandNames.get(b) ?? "").filter(Boolean).join(" أو ")}`);
  if (need.maxPrice && need.minPrice) parts.push(`بين ${fmt(need.minPrice)} و${fmt(need.maxPrice)} د.ع`);
  else if (need.maxPrice) parts.push(`ضمن ${fmt(need.maxPrice)} د.ع`);
  else if (need.minPrice) parts.push(`فوق ${fmt(need.minPrice)} د.ع`);
  return parts.join(" ");
}

export const RELAX_NOTE: Record<string, string> = {
  free: "ما لقيت تطابقاً حرفياً لكل كلمة، فاخترت الأقرب لطلبكِ.",
  families: "وسّعت نوع الرائحة قليلاً حتى أعطيكِ خيارات أكثر.",
  budget: "ما كان أكو خيارات كافية ضمن الميزانية بالضبط، فأضفت خيارات قريبة منها.",
  finish: "خففت بعض التفاصيل الدقيقة حتى أطلعلكِ نتائج أكثر.",
  families_all: "عرضت لكِ أفضل الخيارات بغض النظر عن نوع الرائحة.",
};

export const fmtPrice = fmt;
