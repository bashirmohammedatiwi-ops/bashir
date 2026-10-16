import { CatalogIndex, IndexedProduct } from "./catalog";
import { CONCERN_INGREDIENTS, FacetKey, facetValue } from "./lexicon";
import { COLOR_SYNONYMS, tokens } from "./text";
import { Need, ProductCardOut } from "./types";

export interface Ranked {
  p: IndexedProduct;
  score: number;
  match: number;
  reasons: string[];
}

export interface RankResult {
  items: Ranked[];
  /** ما خُفّف للعثور على نتائج (يُذكر للزبونة بصراحة). */
  relaxed: string[];
  total: number;
}

const SKIN_FINISH: Record<string, { finish: string; reason: string }> = {
  oily: { finish: "matte", reason: "مطفي يناسب الدهنية" },
  combination: { finish: "matte", reason: "يتحكم باللمعان" },
  dry: { finish: "dewy", reason: "لمسة ندية للجافة" },
};

const SPECIAL_KINDS = new Set(["hair_color", "hair_styling", "makeup_tool", "home_scent", "bakhoor", "nail_care", "makeup_remover"]);

const WEIGHTS: Partial<Record<FacetKey, number>> = {
  concern: 3.2,
  skinType: 2.4,
  ingredient: 2.2,
  family: 2.6,
  time: 1.4,
  strength: 1.2,
  season: 1.1,
  finish: 2,
  coverage: 1.4,
  attr: 1.5,
  freeFrom: 2,
  occasion: 1,
};

interface Options {
  exclude?: Set<string>;
  limit?: number;
  /** براند لنعطيه أفضلية (تناسق الروتين). */
  preferBrand?: string | null;
  /** أقصى منتجات من نفس البراند في القائمة (إلا إن طُلب براند). */
  perBrand?: number;
}

type Rung = { label: string; apply: (n: Need) => Need } | null;

/** سُلّم التخفيف عند قلة النتائج — بالترتيب من الأخف للأقوى. */
const RELAX: Rung[] = [
  null,
  { label: "free", apply: (n) => ({ ...n, free: [] }) },
  { label: "families", apply: (n) => ({ ...n, families: n.families.slice(0, 1), time: undefined, season: undefined }) },
  { label: "budget", apply: (n) => (n.maxPrice ? { ...n, maxPrice: Math.round(n.maxPrice * 1.3) } : n) },
  { label: "finish", apply: (n) => ({ ...n, finish: undefined, coverage: undefined, attrs: [] }) },
  { label: "families_all", apply: (n) => ({ ...n, families: [] }) },
];

export function rank(catalog: CatalogIndex, need: Need, opts: Options = {}): RankResult {
  let current = need;
  const relaxed: string[] = [];
  let best: RankResult | null = null;
  for (const rung of RELAX) {
    if (rung) {
      const next = rung.apply(current);
      if (JSON.stringify(next) === JSON.stringify(current)) continue; // لا شيء يُخفَّف هنا
      current = next;
      relaxed.push(rung.label);
    }
    const res = rankOnce(catalog, current, opts);
    if (!best || res.items.length > best.items.length) best = { ...res, relaxed: [...relaxed] };
    if (res.items.length >= 3) return { ...res, relaxed: [...relaxed] };
  }
  return best ?? { items: [], relaxed, total: 0 };
}

function inPriceRange(p: IndexedProduct, need: Need) {
  if (need.maxPrice && p.price > need.maxPrice) return false;
  if (need.minPrice && p.price < need.minPrice) return false;
  return true;
}

function passesHard(catalog: CatalogIndex, p: IndexedProduct, need: Need, exclude?: Set<string>) {
  if (p.stock <= 0) return false;
  if (exclude?.has(p.id)) return false;
  if (!inPriceRange(p, need)) return false;
  if (need.excludeBrands.length && p.brandId && need.excludeBrands.includes(p.brandId)) return false;
  if (need.brands.length && (!p.brandId || !need.brands.includes(p.brandId))) return false;

  // المجال: منتج بلا مجال معروف لا يدخل طلباً محدد المجال (معجون أسنان «إكسترا فريش» ليس عطراً).
  if (need.area && !p.area) return false;
  if (need.area && p.area && p.area !== need.area) {
    // «جسم» يشمل معطرات الجسم ومزيلات العرق المصنفة عطوراً، والعكس.
    const bodyFrag = (need.area === "body" && p.area === "fragrance") || (need.area === "fragrance" && p.area === "body");
    if (!bodyFrag || !need.kinds.length) return false;
  }
  // النوع: يجب أن يكون مؤكداً (من الاسم/القسم/الوسم).
  if (need.kinds.length && !need.kinds.some((k) => p.strong.get("kind")?.has(k))) return false;
  // منتجات لغرض خاص لا تظهر في ترشيح عام (صبغة لمن تسأل عن التساقط، فرشاة لمن تسأل عن بشرتها).
  if (!need.kinds.length) {
    const kinds = p.strong.get("kind");
    if (kinds && [...kinds].every((k) => SPECIAL_KINDS.has(k))) return false;
  }
  // «عطر» بلا نوع محدد = عطور شخصية: لا شموع ولا بخور ولا مزيلات عرق إلا إن طُلبت.
  if (need.area === "fragrance" && !need.kinds.length) {
    const kinds = p.strong.get("kind");
    if (kinds && !kinds.has("perfume") && !kinds.has("oil_perfume") && !kinds.has("mist")) return false;
  }

  // الأطفال لا يظهرون إلا عند الطلب.
  const baby = p.strong.get("audience")?.has("baby");
  if (baby && need.audience !== "baby") return false;
  if (need.audience === "baby" && !baby) return false;

  // جنس العطر: نستبعد المعاكس الصريح فقط (للجنسين يناسب الجميع).
  if (need.gender && (p.area === "fragrance" || need.area === "fragrance")) {
    const g = p.strong.get("gender");
    if (g && !g.has(need.gender) && !g.has("unisex")) return false;
  }

  // ما لا تريده صراحة
  for (const a of need.avoid) {
    const [facet, id] = a.split(":") as [FacetKey, string];
    if (p.strong.get(facet)?.has(id)) return false;
  }
  return true;
}

function rankOnce(catalog: CatalogIndex, need: Need, opts: Options): RankResult {
  // الألوان العربية تُوسَّع لأسمائها الإنجليزية في أسماء الدرجات.
  const query = need.free.flatMap((w) => {
    const t = tokens(w);
    return [...t, ...t.flatMap((x) => COLOR_SYNONYMS[x] ?? [])];
  });
  const textScores = query.length ? catalog.search(query) : null;
  const maxText = textScores ? Math.max(0, ...textScores.values()) : 0;
  const candidates = catalog.products.filter((p) => passesHard(catalog, p, need, opts.exclude));
  if (!candidates.length) return { items: [], relaxed: [], total: 0 };

  const wanted: [FacetKey, string][] = [];
  for (const c of need.concerns) wanted.push(["concern", c]);
  if (need.skinType) wanted.push(["skinType", need.skinType]);
  for (const i of need.ingredients) wanted.push(["ingredient", i]);
  for (const f of need.families) wanted.push(["family", f]);
  for (const f of need.freeFrom) wanted.push(["freeFrom", f]);
  for (const a of need.attrs) wanted.push(["attr", a]);
  if (need.time) wanted.push(["time", need.time]);
  if (need.strength) wanted.push(["strength", need.strength]);
  if (need.season) wanted.push(["season", need.season]);
  if (need.finish) wanted.push(["finish", need.finish]);
  if (need.coverage) wanted.push(["coverage", need.coverage]);
  if (need.occasion === "gift" || need.occasion === "wedding") wanted.push(["occasion", need.occasion]);

  const helpful = new Set(need.concerns.flatMap((c) => CONCERN_INGREDIENTS[c] ?? []));
  const prices = candidates.map((p) => p.price).sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)] || 1;
  const newest = Math.max(...candidates.map((p) => p.createdAt));
  const oldest = Math.min(...candidates.map((p) => p.createdAt));

  const scored: Ranked[] = [];
  for (const p of candidates) {
    let facetScore = 0;
    let facetMax = 0;
    let matched = 0;
    const reasons: { w: number; text: string }[] = [];

    for (const [facet, id] of wanted) {
      const w = WEIGHTS[facet] ?? 1;
      facetMax += w;
      const hit = catalog.has(p, facet, id);
      if (!hit) continue;
      matched++;
      const gain = hit === "strong" ? w : w * 0.45;
      facetScore += gain;
      const fv = facetValue(facet, id);
      if (fv) reasons.push({ w: gain, text: reasonText(facet, fv.label) });
    }

    // مكوّن معروف بفعاليته للمشكلة المطلوبة.
    let ingredientBonus = 0;
    let synergy = 0;
    for (const ing of helpful) {
      if (catalog.has(p, "ingredient", ing)) {
        ingredientBonus += 0.9;
        synergy += 0.5;
        if (!need.ingredients.includes(ing)) {
          const fv = facetValue("ingredient", ing);
          if (fv) reasons.push({ w: 1.6, text: `غني بـ${fv.label}` });
        }
        if (ingredientBonus >= 1.8) break;
      }
    }

    // معرفة خبيرة: مع المكياج، البشرة الدهنية تناسبها اللمسة المطفية والجافة الندية.
    if (need.skinType && p.area === "makeup" && !need.finish) {
      const fit = SKIN_FINISH[need.skinType];
      if (fit && catalog.has(p, "finish", fit.finish)) {
        ingredientBonus += 1.4;
        synergy += 1;
        reasons.push({ w: 1.5, text: fit.reason });
      }
    }

    const text = textScores && maxText > 0 ? (textScores.get(p.idx) ?? 0) / maxText : 0;
    if (textScores && text === 0 && !wanted.length) continue; // بحث نصي بلا تطابق إطلاقاً

    let score = facetScore + ingredientBonus + text * 4 + p.quality * 2.6;
    if (p.discountPercent > 0) score += Math.min(0.6, p.discountPercent / 60);
    if (opts.preferBrand && p.brandId === opts.preferBrand) score += 0.8;
    // جنس العطر: المطابق الصريح أفضل من غير المصنف.
    if (need.gender && p.area === "fragrance") {
      const g = p.strong.get("gender");
      if (g?.has(need.gender)) score += 1.6;
      else if (g?.has("unisex")) score += 0.6;
      else if (!g) score -= 1.4;
    }
    // الهدية: نميل للأرقى ضمن الميزانية (هدية تليق) وللأطقم.
    if (need.occasion === "gift") {
      const cap = need.maxPrice ?? medianPrice * 2;
      score += 1.6 * Math.min(1, p.price / cap);
      if (p.strong.get("occasion")?.has("gift")) score += 1.2;
    }

    switch (need.sort) {
      case "cheap":
        score += 2.5 * (1 - Math.min(1, p.price / (medianPrice * 2)));
        break;
      case "best":
        score += 3 * p.quality;
        break;
      case "rated":
        score += 2.5 * ((p.rating || 0) / 5) * Math.min(1, p.reviewCount / 3);
        break;
      case "new":
        score += 2.5 * ((p.createdAt - oldest) / Math.max(1, newest - oldest));
        break;
      case "deals":
        score += p.discountPercent > 0 ? 2 + p.discountPercent / 25 : -3;
        break;
    }

    // شارات عامة
    if (p.isBestSeller) reasons.push({ w: 0.9, text: "الأكثر مبيعاً" });
    if (p.rating >= 4.5 && p.reviewCount >= 2) reasons.push({ w: 0.8, text: `★ ${p.rating.toFixed(1)}` });
    if (p.discountPercent >= 10) reasons.push({ w: 0.85, text: `خصم ${p.discountPercent}%` });
    if (need.maxPrice && p.price <= need.maxPrice) reasons.push({ w: 0.5, text: "ضمن ميزانيتك" });

    const facetRatio = facetMax ? facetScore / facetMax : 0.7;
    const match = Math.round(
      Math.max(
        55,
        Math.min(
          99,
          52 + facetRatio * 34 + p.quality * 8 + text * 8 + Math.min(1, synergy) * 14 +
            (matched === wanted.length && wanted.length ? 4 : 0),
        ),
      ),
    );
    scored.push({
      p,
      score,
      match,
      reasons: dedupe(reasons.sort((a, b) => b.w - a.w).map((r) => r.text)).slice(0, 3),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return { items: diversify(scored, need, opts), relaxed: [], total: scored.length };
}

/** تنويع: لا يسيطر براند واحد على القائمة (إلا إن طلبته الزبونة). */
function diversify(sorted: Ranked[], need: Need, opts: Options): Ranked[] {
  const limit = opts.limit ?? 12;
  const perBrand = need.brands.length ? 99 : opts.perBrand ?? 2;
  const count = new Map<string, number>();
  const out: Ranked[] = [];
  const spill: Ranked[] = [];
  for (const r of sorted) {
    const key = r.p.brandId ?? r.p.id;
    const n = count.get(key) ?? 0;
    if (n >= perBrand) {
      spill.push(r);
      continue;
    }
    count.set(key, n + 1);
    out.push(r);
    if (out.length >= limit) return out;
  }
  for (const r of spill) {
    if (out.length >= limit) break;
    out.push(r);
  }
  return out;
}

function dedupe(a: string[]) {
  return [...new Set(a)];
}

function reasonText(facet: FacetKey, label: string): string {
  switch (facet) {
    case "concern":
      return `لـ${label}`;
    case "skinType":
      return `للبشرة ال${label.replace(/^ال/, "")}`;
    case "ingredient":
      return `بـ${label}`;
    case "family":
      return `${label}`;
    case "freeFrom":
      return label;
    default:
      return label;
  }
}

export function toCard(r: Ranked): ProductCardOut {
  const p = r.p;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.stock > 0,
    shadeCount: p.shadeCount,
    reasons: r.reasons,
    match: r.match,
  };
}

// ───────────────────────────────────────────────────────── الروتين

export interface RoutineTemplateStep {
  step: string;
  label: string;
  emoji: string;
  when: "am" | "pm" | "both";
  kinds: string[];
  share: number;
  optional?: boolean;
}

export function routineTemplate(area: string, need: Need): RoutineTemplateStep[] {
  if (area === "hair") {
    const treat = need.concerns.includes("hairloss")
      ? { step: "treat", label: "علاج التساقط", emoji: "🌱", when: "both" as const, kinds: ["hair_serum", "hair_oil"], share: 0.3 }
      : { step: "treat", label: "تغذية وحماية", emoji: "✨", when: "both" as const, kinds: ["hair_oil", "hair_serum", "leave_in"], share: 0.25 };
    return [
      { step: "wash", label: "شامبو", emoji: "🫧", when: "both", kinds: ["shampoo"], share: 0.25 },
      { step: "condition", label: "بلسم", emoji: "💧", when: "both", kinds: ["conditioner"], share: 0.2 },
      { step: "mask", label: "ماسك أسبوعي", emoji: "🌿", when: "both", kinds: ["hair_mask"], share: 0.25 },
      treat,
    ];
  }
  if (area === "body") {
    return [
      { step: "wash", label: "غسول الجسم", emoji: "🛁", when: "both", kinds: ["body_wash"], share: 0.3 },
      { step: "scrub", label: "مقشر أسبوعي", emoji: "🧂", when: "both", kinds: ["body_scrub", "exfoliator"], share: 0.3, optional: true },
      { step: "moisturize", label: "ترطيب", emoji: "🧴", when: "both", kinds: ["body_lotion", "body_oil"], share: 0.4 },
    ];
  }
  const steps: RoutineTemplateStep[] = [
    { step: "cleanse", label: "التنظيف", emoji: "🫧", when: "both", kinds: ["cleanser"], share: 0.17 },
    { step: "tone", label: "التونر", emoji: "💦", when: "both", kinds: ["toner"], share: 0.12, optional: true },
    { step: "treat", label: "السيروم", emoji: "💎", when: "both", kinds: ["serum"], share: 0.28 },
  ];
  if (need.concerns.includes("dark_circles")) {
    steps.push({ step: "eye", label: "محيط العين", emoji: "👁️", when: "pm", kinds: ["eye_cream"], share: 0.15, optional: true });
  }
  steps.push(
    { step: "moisturize", label: "الترطيب", emoji: "🧴", when: "both", kinds: ["moisturizer", "face_cream"], share: 0.23 },
    { step: "protect", label: "واقي الشمس", emoji: "☀️", when: "am", kinds: ["sunscreen"], share: 0.2 },
  );
  return steps;
}
