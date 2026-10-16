import { CatalogIndex, IndexedProduct } from "./catalog";
import { FAMOUS, FamousScent } from "./famous";
import { FacetKey, facetValue } from "./lexicon";
import { li, normalize, tokens } from "./text";

/**
 * التشابه بين المنتجات: «ريحة تشبه باكارات»، «بديل أرخص لهذا الكريم»، «شي مثله».
 * البصمة = العائلات العطرية + المشاكل والمكونات + متجه الكلمات المميزة من الوصف.
 */
export interface AnchorProfile {
  product?: IndexedProduct;
  famous?: FamousScent;
  label: string;
  area: string | null;
  kinds: string[];
  families: Map<string, number>;
  gender: string | null;
  concerns: string[];
  ingredients: string[];
  skinTypes: string[];
  finish: string | null;
  coverage: string | null;
  price: number | null;
  /** نوتات عطرية (لعطر مشهور غير متوفر) — تُقاس بالبحث النصي في الأوصاف. */
  notes?: string[];
}

export interface SimilarHit {
  p: IndexedProduct;
  sim: number;
  reasons: string[];
  saving?: number;
}

// كلمات طلب التشابه نفسها — تُحذف قبل البحث عن اسم المنتج المرجعي.
const SIM_WORDS = new Set(
  tokens(
    "يشبه تشبه يشبهه تشبهه يشبهها شبيه شبيهه مشابه مشابهه مثل مثله مثلها نفس ريحه ريحة رائحه رائحة ريحت بديل بدائل بديله " +
      "ارخص اوفر عطر عطور كوبي نسخه تقليد قريب مقارب dupe dupes alternative alternatives similar like cheaper smells smell " +
      "اريد ابي احتاج عندكم شي منتج يكون تكون اكو لو سمحتي ممكن",
    { keepStop: true },
  ),
);

export const SIMILAR_RE =
  /(يشبه|تشبه|شبيه|مشابه|مثل ريح|نفس ريح|نفس رائح|ريحه مثل|ريحتها مثل|ريحته مثل|قريب من|قريبه من|قريب لريح|بديل|بدائل|dupe|alternative|similar to|smells like|كوبي من|تقليد)/;

const fam = (p: IndexedProduct) => {
  const m = new Map<string, number>();
  for (const f of p.strong.get("family") ?? []) m.set(f, 1);
  for (const f of p.weak.get("family") ?? []) if (!m.has(f)) m.set(f, 0.6);
  return m;
};

const strongList = (p: IndexedProduct, f: FacetKey) => [...(p.strong.get(f) ?? [])];

function genderOf(p: IndexedProduct): string | null {
  const g = p.strong.get("gender");
  if (g?.has("unisex")) return "unisex";
  if (g?.has("women") && !g.has("men")) return "women";
  if (g?.has("men") && !g.has("women")) return "men";
  return p.genderHint;
}

export function profileOf(p: IndexedProduct): AnchorProfile {
  return {
    product: p,
    label: p.name,
    area: p.area,
    kinds: strongList(p, "kind"),
    families: fam(p),
    gender: genderOf(p),
    concerns: strongList(p, "concern"),
    ingredients: [...new Set([...strongList(p, "ingredient"), ...(p.weak.get("ingredient") ?? [])])],
    skinTypes: [...new Set([...strongList(p, "skinType"), ...(p.weak.get("skinType") ?? [])])],
    finish: strongList(p, "finish")[0] ?? null,
    coverage: strongList(p, "coverage")[0] ?? null,
    price: p.price,
  };
}

export function profileOfFamous(f: FamousScent): AnchorProfile {
  return {
    famous: f,
    label: f.name,
    area: "fragrance",
    kinds: ["perfume"],
    families: new Map(f.families.map((x, i) => [x, i === 0 ? 1 : 0.85])),
    gender: f.gender,
    concerns: [],
    ingredients: [],
    skinTypes: [],
    finish: null,
    coverage: null,
    price: f.price,
    notes: tokens(f.notes),
  };
}

/** عطر مشهور مذكور في الرسالة («باكارات»، «سوفاج»…). */
export function famousIn(message: string): FamousScent | null {
  const padded = ` ${normalize(message).replace(/[؟?!.,،]/g, " ")} `;
  let best: { f: FamousScent; len: number } | null = null;
  for (const f of FAMOUS) {
    for (const a of f.aliases) {
      const na = normalize(a);
      if (na.length < 3) continue;
      // «لسوفاج»، «بباكارات»، «والسوفاج» — حروف ملتصقة قبل الاسم.
      const hit = ["", "ل", "ب", "و", "ك", "ال", "لل", "بال", "وال"].some((pre) => padded.includes(` ${pre}${na} `));
      if (hit && (!best || na.length > best.len)) best = { f, len: na.length };
    }
  }
  return best?.f ?? null;
}

/**
 * منتج من الكتالوج بالاسم: كلمات الطلب (بعد حذف كلمات التشابه) يجب أن تغطي اسمه.
 * لا يكفي اسم البراند وحده («يشبه ديور» غامض).
 */
export function findByName(
  catalog: CatalogIndex,
  text: string,
  area?: string | null,
  kinds?: Set<string>,
): IndexedProduct | null {
  const brandWords = new Set([...catalog.brandAliases.keys()].flatMap((a) => a.split(" ")));
  const q = tokens(text).filter((t) => !SIM_WORDS.has(t) && t.length >= 2);
  if (!q.length || q.every((t) => brandWords.has(t))) return null;
  const scores = catalog.search(q, 60);
  let best: { p: IndexedProduct; s: number } | null = null;
  for (const [doc, sc] of scores) {
    const p = catalog.products[doc];
    if (area && p.area && p.area !== area) continue;
    if (kinds && ![...(p.strong.get("kind") ?? [])].some((k) => kinds.has(k))) continue;
    const nameTok = tokens(`${p.name} ${p.nameEn}`);
    const covered = q.filter((t) => nameTok.some((n) => n === t || (t.length >= 4 && n.startsWith(t)))).length;
    const cov = covered / q.length;
    const distinctive = q.some((t) => !brandWords.has(t) && nameTok.includes(t));
    if (cov < 0.6 || !distinctive) continue;
    const s = sc * (0.6 + cov) + (p.stock > 0 ? 0.5 : 0) + p.quality;
    if (!best || s > best.s) best = { p, s };
  }
  return best?.p ?? null;
}

/** العطر المشهور نفسه إن كان متوفراً (العطر لا عطر الشعر). */
// صيغ ليست العطر نفسه: عطر الشعر، لوشن، مزيل، طقم، تستر، نسخ مركّزة خاصة.
const NOT_BASE = /(شعر|hair|لوشن|lotion|مزيل|deodorant|جسم|body|شاور|طقم|set|تستر|tester|ميني|mini)/i;
const FLANKER = /(اكسير|اليكسير|elixir|انتنس|intense|ابسولو|absolu|extreme|اكستريم|بارفيوم|parfum)/i;

export function findFamousProduct(catalog: CatalogIndex, f: FamousScent): IndexedProduct | null {
  let best: { p: IndexedProduct; s: number } | null = null;
  for (const a of f.aliases) {
    const na = normalize(a);
    if (na.length < 3) continue;
    for (const [doc] of catalog.search(tokens(a), 80)) {
      const p = catalog.products[doc];
      if (p.area !== "fragrance" || p.stock <= 0) continue;
      if (![...(p.strong.get("kind") ?? [])].some((k) => k === "perfume" || k === "oil_perfume")) continue;
      const nm = ` ${normalize(`${p.name} ${p.nameEn}`)} `;
      if (!nm.includes(` ${na} `) && !nm.includes(` ${na}`)) continue;
      if (NOT_BASE.test(nm)) continue;
      // الإصدار الأساسي أولاً (لا «إكسير/إنتنس»)، ثم الاسم الأقصر.
      const s = (FLANKER.test(nm) ? 0 : 10) - nm.length / 100 + p.quality;
      if (!best || s > best.s) best = { p, s };
    }
  }
  return best?.p ?? null;
}

/** بصمة منتج متوفر مدعومة بنوتات العطر المشهور (أدق من الوصف وحده). */
export function profileOfBoth(p: IndexedProduct, f: FamousScent): AnchorProfile {
  const a = profileOf(p);
  for (const [k, w] of profileOfFamous(f).families) if (!a.families.has(k) || a.families.get(k)! < w) a.families.set(k, w);
  a.notes = tokens(f.notes);
  if (!a.gender) a.gender = f.gender;
  return a;
}

/** نسخ من نفس الخط (EDT/EDP لنفس العطر، أحجام مختلفة) — ليست «بدائل». */
function sameLine(a: IndexedProduct, b: IndexedProduct): boolean {
  if (!a.brandId || a.brandId !== b.brandId) return false;
  const ta = new Set(tokens(a.name).filter((t) => t.length >= 3 && !/^\d+$/.test(t)));
  const tb = new Set(tokens(b.name).filter((t) => t.length >= 3 && !/^\d+$/.test(t)));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(1, Math.min(ta.size, tb.size)) >= 0.6;
}

const PERFUME_KINDS = new Set(["perfume", "oil_perfume"]);

export function similarProducts(
  catalog: CatalogIndex,
  a: AnchorProfile,
  opts: { cheaper?: boolean; limit?: number; exclude?: Set<string>; maxPrice?: number; gender?: string } = {},
): SimilarHit[] {
  const limit = opts.limit ?? 8;
  const aKinds = new Set(a.kinds);
  const isFrag = a.area === "fragrance";
  const out: (SimilarHit & { score: number })[] = [];
  const aFamTotal = [...a.families.values()].reduce((x, y) => x + y, 0);
  // نوتات العطر المشهور: بحث نصي في الأوصاف، مطبّع على أعلى نتيجة.
  let noteSim: Map<number, number> | null = null;
  if (a.notes?.length) {
    const sc = catalog.search(a.notes, 600);
    const top = Math.max(1e-9, ...sc.values());
    noteSim = new Map([...sc].map(([d, v]) => [d, Math.min(1, v / (top * 0.7))]));
  }

  for (const p of catalog.products) {
    if (p.stock <= 0 || !p.price) continue;
    if (a.product && (p.id === a.product.id || sameLine(a.product, p))) continue;
    if (opts.exclude?.has(p.id)) continue;
    if (a.area && p.area !== a.area) continue;
    const pk = p.strong.get("kind");
    if (isFrag) {
      if (pk && ![...pk].some((k) => PERFUME_KINDS.has(k)) && !(aKinds.has("mist") && pk.has("mist"))) continue;
    } else if (aKinds.size && !(pk && [...pk].some((k) => aKinds.has(k)))) continue;
    // الجنس: لا نقترح للمرجع النسائي عطراً رجالياً والعكس.
    const pg = genderOf(p);
    if (a.gender && a.gender !== "unisex" && pg && pg !== "unisex" && pg !== a.gender) continue;
    if (opts.cheaper && a.price && p.price > a.price * 0.85) continue;
    if (opts.maxPrice && p.price > opts.maxPrice) continue;

    let score = 0;
    let max = 0;
    const reasons: string[] = [];

    if (aFamTotal) {
      const pf = fam(p);
      let inter = 0;
      let union = 0;
      const shared: string[] = [];
      for (const k of new Set([...a.families.keys(), ...pf.keys()])) {
        const x = a.families.get(k) ?? 0;
        const y = pf.get(k) ?? 0;
        inter += Math.min(x, y);
        union += Math.max(x, y);
        if (x && y) shared.push(k);
      }
      const j = union ? inter / union : 0;
      score += j * 3.4;
      max += 3.4;
      if (shared.length) {
        const labels = shared.slice(0, 2).map((f) => facetValue("family", f)?.label).filter(Boolean);
        if (labels.length) reasons.push(`${labels.join(" و")} مثله`);
      }
    }
    if (a.product) {
      const cos = catalog.cosine(a.product.idx, p.idx);
      score += cos * 2.8;
      max += 2.8;
      if (cos >= 0.32) reasons.push("نفس الطابع");
    }
    if (noteSim) {
      const ns = noteSim.get(p.idx) ?? 0;
      score += ns * 3.2;
      max += 3.2;
      if (ns >= 0.45) reasons.push("نوتات قريبة");
    }
    const overlap = (xs: string[], f: FacetKey, w: number, label?: (id: string) => string | undefined) => {
      if (!xs.length) return;
      max += w;
      const hit = xs.filter((x) => catalog.has(p, f, x));
      score += (hit.length / xs.length) * w;
      if (hit.length && label) {
        const l = label(hit[0]);
        if (l) reasons.push(l);
      }
    };
    overlap(a.concerns, "concern", 1.8, (id) => {
      const l = facetValue("concern", id)?.label;
      return l ? `${li(l)} مثله` : undefined;
    });
    overlap(a.ingredients, "ingredient", 1.3, (id) => {
      const l = facetValue("ingredient", id)?.label;
      return l ? `فيه ${l}` : undefined;
    });
    overlap(a.skinTypes, "skinType", 0.7);
    if (a.finish) {
      max += 0.9;
      if (catalog.has(p, "finish", a.finish)) score += 0.9;
    }
    if (a.coverage) {
      max += 0.6;
      if (catalog.has(p, "coverage", a.coverage)) score += 0.6;
    }
    if (isFrag && a.gender) {
      max += 0.7;
      if (pg === a.gender) score += 0.7;
      else if (pg === "unisex" || a.gender === "unisex") score += 0.35;
      // مرجع للجنسين وطالبته امرأة غالباً: الرجالي يتأخر.
      const lean = opts.gender ?? "women";
      if (a.gender === "unisex" && pg && pg !== "unisex" && pg !== lean) score -= 0.9;
    }
    score += p.quality * 0.5;
    if (!max) continue;
    const ratio = Math.min(1, score / max);
    if (ratio < 0.28) continue;

    let saving: number | undefined;
    if (a.price && p.price < a.price) {
      saving = a.price - p.price;
      if (opts.cheaper) score += Math.min(1.2, (saving / a.price) * 1.6);
    }
    out.push({ p, sim: Math.round(45 + ratio * 54), reasons: [...new Set(reasons)].slice(0, 3), saving, score });
  }

  // الأشبه أولاً (النسبة الظاهرة تنازلية دائماً)، ثم الأوفر عند التقارب.
  out.sort((x, y) => y.sim - x.sim || (y.saving ?? 0) - (x.saving ?? 0) || y.score - x.score);
  // تنويع: ما يزيد عن اثنين من نفس البراند.
  const perBrand = new Map<string, number>();
  const res: SimilarHit[] = [];
  for (const h of out) {
    const b = h.p.brandId ?? h.p.id;
    if ((perBrand.get(b) ?? 0) >= 2) continue;
    perBrand.set(b, (perBrand.get(b) ?? 0) + 1);
    res.push({ p: h.p, sim: h.sim, reasons: h.reasons, saving: h.saving });
    if (res.length >= limit) break;
  }
  return res;
}
