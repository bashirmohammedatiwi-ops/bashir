import { CONCERN_AREA, FacetKey, KIND_BY_AREA, LEXICON } from "./lexicon";
import { normalize, tokens } from "./text";

/** منتج كما تراه المستشارة — صفاته مستخرجة من نصه بالمعجم. */
export interface IndexedProduct {
  idx: number;
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  brand: string;
  brandId: string | null;
  categoryPath: string[];
  summary: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stock: number;
  isNew: boolean;
  isBestSeller: boolean;
  isPromo: boolean;
  image: string;
  shadeCount: number;
  createdAt: number;
  area: string | null;
  /** صفات مؤكدة (من الاسم/القسم/الوسوم). */
  strong: Map<FacetKey, Set<string>>;
  /** صفات مذكورة في الوصف فقط (أضعف). */
  weak: Map<FacetKey, Set<string>>;
  /** جودة مسبقة 0..1 (مبيعات + تقييم). */
  quality: number;
}

export interface BrandEntry {
  id: string;
  name: string;
  aliases: string[]; // مطبّعة ومجذّعة: لاتيني + عربي (من بادئة أسماء المنتجات)
  productCount: number;
}

export interface RawProduct {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  description: string;
  descriptionAr: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stock: number;
  isNew: boolean;
  isBestSeller: boolean;
  isPromo: boolean;
  createdAt: Date;
  brand: { id: string; name: string } | null;
  category: { name: string; nameAr: string | null } | null;
  subcategory: { name: string; nameAr: string | null } | null;
  tertiaryCategory: { name: string; nameAr: string | null } | null;
  image: string;
  shadeCount: number;
  /** أسماء الدرجات (ألوان) — تدخل البحث النصي. */
  shadeNames?: string[];
  tag?: { kind: string; area: string; concerns: string[]; audience: string; summary: string } | null;
}

/** «نص مجرّد»: كلمات مطبّعة ومجذّعة بفواصل — للمطابقة السريعة بحدود الكلمة. */
const bare = (text: string) => ` ${tokens(text, { keepStop: true }).join(" ")} `;

interface CompiledTerm {
  facet: FacetKey;
  id: string;
  bare: string;
  latinPrefix: boolean;
}

/** يُترجم مرة واحدة: كل عبارة في المعجم إلى صيغتها المجرّدة. */
const COMPILED: CompiledTerm[] = LEXICON.flatMap((fv) =>
  fv.terms
    .map((t) => {
      const b = tokens(t, { keepStop: true }).join(" ");
      return {
        facet: fv.facet,
        id: fv.id,
        bare: b,
        // كلمات لاتينية مقطوعة عمداً (moistur, exfoliat) تُطابق بداية الكلمة.
        latinPrefix: /^[a-z]+$/.test(b) && b.length >= 5,
      };
    })
    .filter((t) => t.bare.length >= 2),
);

function matchFacets(
  text: string,
  into: Map<FacetKey, Set<string>>,
  only?: Set<FacetKey>,
  lengths?: Map<string, number>,
) {
  const b = bare(text);
  for (const t of COMPILED) {
    if (only && !only.has(t.facet)) continue;
    const hit = t.latinPrefix ? b.includes(` ${t.bare}`) : b.includes(` ${t.bare} `);
    if (!hit) continue;
    let set = into.get(t.facet);
    if (!set) into.set(t.facet, (set = new Set()));
    set.add(t.id);
    if (lengths) lengths.set(`${t.facet}:${t.id}`, Math.max(lengths.get(`${t.facet}:${t.id}`) ?? 0, t.bare.length));
  }
}

/** عبارات الأنواع مرتبة بالطول (بالكلمات) للاستهلاك داخل الاسم. */
const KIND_TERMS = COMPILED.filter((t) => t.facet === "kind").sort(
  (a, b) => b.bare.split(" ").length - a.bare.split(" ").length || b.bare.length - a.bare.length,
);

/** أنواع تحدد هوية المنتج حتى لو ذُكر معها نوع آخر («فرشاة فاونديشن» أداة، «مزيل طلاء» مزيل). */
const DOMINANT_KINDS = new Set(["makeup_tool", "makeup_remover", "nail_care", "hair_color"]);

/**
 * أنواع اسم المنتج: العبارة الأطول تستهلك كلماتها («مزيل طلاء أظافر» لا يُحسب «طلاء أظافر»)،
 * ثم تغلب الأنواع المحددة للهوية.
 */
function nameKinds(text: string): string[] {
  const words = tokens(text, { keepStop: true });
  const used = new Set<number>();
  const found: string[] = [];
  const position = new Map<string, number>();
  for (const t of KIND_TERMS) {
    const tw = t.bare.split(" ");
    for (let i = 0; i + tw.length <= words.length; i++) {
      let ok = true;
      for (let j = 0; j < tw.length; j++) {
        const w = words[i + j];
        const last = j === tw.length - 1;
        if (used.has(i + j) || (t.latinPrefix && last ? !w.startsWith(tw[j]) : w !== tw[j])) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let j = 0; j < tw.length; j++) used.add(i + j);
      if (!found.includes(t.id)) found.push(t.id);
      position.set(t.id, Math.min(position.get(t.id) ?? Infinity, i));
    }
  }
  const dominant = found.filter((k) => DOMINANT_KINDS.has(k));
  if (dominant.length) return dominant;
  // الاسم العربي يبدأ عادةً باسم المنتج نفسه: «تونر… المرطب» تونر، «كريم مرطب» مرطب.
  return found.sort((a, b) => (position.get(a) ?? 0) - (position.get(b) ?? 0));
}

/** وسوم الذكاء القديمة (مخزنة مسبقاً في القاعدة) → معجمنا. */
function mapTagKind(kind: string, area: string): string | null {
  switch (kind) {
    case "perfume":
      return "perfume";
    case "splash":
      return "mist";
    case "deodorant":
      return "deodorant";
    case "shampoo":
      return "shampoo";
    case "conditioner":
      return "conditioner";
    case "mask":
      return area === "hair" ? "hair_mask" : "face_mask";
    case "oil":
      return area === "hair" ? "hair_oil" : area === "body" ? "body_oil" : null;
    case "serum":
      return area === "hair" ? "hair_serum" : "serum";
    case "cream":
    case "moisturizer":
      return area === "body" ? "body_lotion" : area === "hair" ? "leave_in" : "moisturizer";
    case "cleanser":
      return area === "body" ? "body_wash" : "cleanser";
    case "toner":
      return "toner";
    case "sunscreen":
      return "sunscreen";
    case "lipstick":
      return "lipstick";
    case "body":
      return "body_lotion";
    case "tool":
      return "makeup_tool";
    default:
      return null;
  }
}

function mapTagConcern(c: string, area: string): string | null {
  const hair = area === "hair";
  switch (c) {
    case "dry":
      return hair ? "dry_hair" : "dryness";
    case "oily":
      return hair ? "oily_scalp" : "oily";
    case "pigment":
    case "acne":
    case "aging":
    case "sensitive":
    case "dark_circles":
    case "hairloss":
    case "dandruff":
    case "frizz":
    case "colored":
    case "damaged":
      return c;
    case "dull":
      return "dull";
    case "redness":
      return "sensitive";
    default:
      return null;
  }
}

const TAG_AREA: Record<string, string> = {
  fragrance: "fragrance",
  skin: "skin",
  hair: "hair",
  makeup: "makeup",
  body: "body",
  nails: "nails",
};

const add = (m: Map<FacetKey, Set<string>>, f: FacetKey, id: string) => {
  let s = m.get(f);
  if (!s) m.set(f, (s = new Set()));
  s.add(id);
};

const KIND_AREA = new Map(LEXICON.filter((x) => x.facet === "kind" && x.area).map((x) => [x.id, x.area!]));

/** كل كلمات المعجم والكلمات الوصفية الشائعة — لا تُعدّ أسماء براندات. */
const LEXICON_WORDS = new Set([
  ...COMPILED.flatMap((t) => t.bare.split(" ")),
  ...tokens(
    "كريم عطر شامبو بلسم رجال رجالي نسائي احمر اسود ابيض وردي ازرق اخضر ذهبي فضي بني تواليت بارفيوم برفيوم مل غرام " +
      "لوشن جل زيت ماء طقم مجموعه هديه حجم كبير صغير جديد اصدار اصلي ليمون ورد عود مسك فانيلا بطيخ فراوله كرز توت " +
      "تحكم توتر عصا رصاص قلم مود سير ثري وايت امواج كولور بول جان مان وومن هوم",
    { keepStop: true },
  ),
]);

/** كلمات شائعة في أسماء البراندات لا تميّز برانداً بعينه. */
const GENERIC_BRAND_WORDS = new Set([
  "paris", "london", "milano", "beauty", "cosmetics", "cosmetic", "professional", "professionnel", "care", "skin",
  "hair", "natural", "organic", "home", "body", "collection", "parfums", "parfum", "perfumes", "perfume", "fragrance",
  "kids", "baby", "lab", "labs", "pharma", "derma", "dermo", "medical", "makeup", "make", "studio", "new", "york",
  "oriental", "arabia", "arabian", "gold", "royal", "france", "italia", "korea", "official", "store", "plus", "pro",
]);

// ───────────────────────────────────────────────────────── فهرس BM25

const FIELD_WEIGHTS = { name: 3, brand: 2.5, category: 2, summary: 1.6, desc: 0.8 };
const K1 = 1.2;
const B = 0.75;

export class CatalogIndex {
  products: IndexedProduct[] = [];
  brands: BrandEntry[] = [];
  /** اسم مجرّد → براندات (قد يكون عائلة). */
  brandAliases = new Map<string, string[]>();
  private postings = new Map<string, Map<number, number>>();
  private docLen: number[] = [];
  private avgLen = 1;
  private vocab: string[] = [];
  builtAt = 0;

  static build(rows: RawProduct[]): CatalogIndex {
    const idx = new CatalogIndex();
    const maxSold = Math.max(1, ...rows.map((r) => r.soldCount));
    const brandNames = new Map<
      string,
      { name: string; ar: Map<string, number>; first: Map<string, number>; tok: Map<string, number>; count: number }
    >();
    const globalTok = new Map<string, number>();

    rows.forEach((r, i) => {
      const name = r.nameAr || r.name;
      const nameEn = r.nameEn || "";
      const categoryPath = [r.category, r.subcategory, r.tertiaryCategory]
        .filter(Boolean)
        .map((c) => (c!.nameAr || c!.name) as string);
      const summary = r.tag?.summary ?? "";
      const desc = (r.descriptionAr || r.description || "").slice(0, 900);

      const strong = new Map<FacetKey, Set<string>>();
      const weak = new Map<FacetKey, Set<string>>();
      matchFacets(`${name} ${nameEn} ${categoryPath.join(" ")} ${summary}`, strong);
      matchFacets(desc, weak);

      // النوع: الاسم أصدق مصدر («بلسم» في قسم «شامبو وبلسم» بلسمٌ فقط)،
      // ثم وسم الذكاء المخزن، ثم القسم.
      const nameFacets = new Map<FacetKey, Set<string>>();
      matchFacets(`${name} ${nameEn}`, nameFacets, new Set<FacetKey>(["area"]));
      // الأدق أولاً: «غسول جسم» يغلب «غسول»، فالمنتج للجسم لا للوجه.
      const nameKindsSorted = nameKinds(`${name} ${nameEn}`);
      const tagKind = r.tag ? mapTagKind(r.tag.kind, r.tag.area) : null;
      if (nameKindsSorted.length) {
        // النوع الأساسي مؤكد؛ الأنواع المذكورة بعده صفات ثانوية.
        strong.set("kind", new Set([nameKindsSorted[0]]));
        for (const k of nameKindsSorted.slice(1)) add(weak, "kind", k);
      } else if (tagKind) {
        strong.set("kind", new Set([tagKind]));
      }

      // المجال: كلمة المجال الصريحة في الاسم («…للشعر») ← نوع الاسم ← الوسم ← القسم.
      let area: string | null = null;
      const nameAreas = nameFacets.get("area");
      if (nameAreas?.size === 1) {
        const a = [...nameAreas][0];
        if (a === "hair" || a === "body" || a === "nails") area = a;
      }
      if (!area) {
        for (const k of nameKindsSorted) {
          if (KIND_AREA.has(k)) {
            area = KIND_AREA.get(k)!;
            break;
          }
        }
      }
      const tagArea = r.tag ? TAG_AREA[r.tag.area] : undefined;
      area ??= tagArea ?? null;
      if (!area) {
        for (const k of strong.get("kind") ?? []) {
          if (KIND_AREA.has(k)) {
            area = KIND_AREA.get(k)!;
            break;
          }
        }
      }
      if (!area) {
        const a = strong.get("area");
        if (a?.size) area = [...a][0];
      }
      if (area) strong.set("area", new Set([area]));
      // النوع يتبع المجال: «سيروم» في منتج للشعر = سيروم شعر.
      const remap = area ? KIND_BY_AREA[area] : undefined;
      const kindsNow = strong.get("kind");
      if (remap && kindsNow) strong.set("kind", new Set([...kindsNow].map((k) => remap[k] ?? k)));

      // مشاكل الوسم تُعتمد فقط إن اتفق مجاله مع مجال المنتج (وسوم قديمة خاطئة أحياناً).
      if (r.tag && (!tagArea || tagArea === area)) {
        for (const c of r.tag.concerns) {
          const mc = mapTagConcern(c, r.tag.area);
          if (mc) add(strong, "concern", mc);
        }
        if (r.tag.audience === "baby") add(strong, "audience", "baby");
      }
      // مشاكل لا تخص مجال المنتج تُحذف (شامبو لا يُرشَّح لحب الشباب).
      const concerns = strong.get("concern");
      if (concerns && area) {
        for (const c of [...concerns]) {
          const ca = CONCERN_AREA[c];
          if (ca && ca !== area && !(ca === "skin" && area === "body")) concerns.delete(c);
        }
      }

      // نوع البشرة من صيغة «للبشرة الدهنية» القوية فقط، والمشاكل تُلمّح للنوع.
      for (const c of strong.get("concern") ?? []) {
        if (CONCERN_AREA[c] === "skin" && (c === "oily" || c === "sensitive")) add(weak, "skinType", c);
        if (c === "dryness") add(weak, "skinType", "dry");
      }

      // عطور بلا جنس صريح: «للجنسين» ضمنياً لا يُفترض — نتركها محايدة.
      const quality =
        0.5 * (Math.log1p(r.soldCount) / Math.log1p(maxSold)) +
        0.35 * ((r.rating || 0) / 5) * Math.min(1, (r.reviewCount || 0) / 4) +
        (r.isBestSeller ? 0.15 : 0);

      idx.products.push({
        idx: i,
        id: r.id,
        slug: r.slug,
        name,
        nameEn,
        brand: r.brand?.name ?? "",
        brandId: r.brand?.id ?? null,
        categoryPath,
        summary,
        price: r.price,
        originalPrice: r.originalPrice,
        discountPercent: r.discountPercent,
        rating: r.rating,
        reviewCount: r.reviewCount,
        soldCount: r.soldCount,
        stock: r.stock,
        isNew: r.isNew,
        isBestSeller: r.isBestSeller,
        isPromo: r.isPromo,
        image: r.image,
        shadeCount: r.shadeCount,
        createdAt: r.createdAt.getTime(),
        area,
        strong,
        weak,
        quality: Math.min(1, quality),
      });

      // BM25: حقول بأوزان.
      const tf = new Map<string, number>();
      const addField = (text: string, w: number) => {
        for (const t of tokens(text)) tf.set(t, (tf.get(t) ?? 0) + w);
      };
      addField(name, FIELD_WEIGHTS.name);
      addField(nameEn, FIELD_WEIGHTS.name);
      addField(r.brand?.name ?? "", FIELD_WEIGHTS.brand);
      addField(categoryPath.join(" "), FIELD_WEIGHTS.category);
      addField(summary, FIELD_WEIGHTS.summary);
      if (r.shadeNames?.length) addField(r.shadeNames.join(" "), FIELD_WEIGHTS.category);
      addField(desc, FIELD_WEIGHTS.desc);
      let len = 0;
      for (const [t, w] of tf) {
        len += w;
        let p = idx.postings.get(t);
        if (!p) idx.postings.set(t, (p = new Map()));
        p.set(i, w);
      }
      idx.docLen.push(len);

      // أسماء البراندات العربية: بادئة الاسم العربي قبل « - » (مثل «كريجي - …»).
      if (r.brand) {
        let b = brandNames.get(r.brand.id);
        if (!b) brandNames.set(r.brand.id, (b = { name: r.brand.name, ar: new Map(), first: new Map(), tok: new Map(), count: 0 }));
        b.count++;
        for (const t of new Set(tokens(r.nameAr || "", { keepStop: true }))) {
          if (t.length < 3 || !/[\u0600-\u06FF]/.test(t)) continue;
          b.tok.set(t, (b.tok.get(t) ?? 0) + 1);
          globalTok.set(t, (globalTok.get(t) ?? 0) + 1);
        }
        const fw = tokens((r.nameAr || "").split(" ")[0] ?? "", { keepStop: true })[0];
        if (fw && /[\u0600-\u06FF]/.test(fw)) b.first.set(fw, (b.first.get(fw) ?? 0) + 1);
        const prefix = (r.nameAr || "").split(/\s[-–—]\s/)[0]?.trim();
        if (prefix && prefix.length >= 2 && prefix.length <= 30 && /[؀-ۿ]/.test(prefix)) {
          b.ar.set(prefix, (b.ar.get(prefix) ?? 0) + 1);
        }
      }
    });

    idx.avgLen = idx.docLen.reduce((a, b) => a + b, 0) / Math.max(1, idx.docLen.length);
    idx.vocab = [...idx.postings.keys()];
    idx.brands = [...brandNames.entries()].map(([id, b]) => ({
      id,
      name: b.name,
      aliases: [],
      productCount: b.count,
    }));

    // جدول الأسماء: الاسم الواحد قد يشير لعائلة براندات («لوريال» → إلفيف، بروفيشنال، باريس…).
    const addAlias = (alias: string, brandId: string) => {
      if (alias.length < 3 || /\d/.test(alias)) return;
      // كلمة من المعجم (كريم، عطر، احمر…) لا تكون اسم براند.
      if (LEXICON_WORDS.has(alias)) return;
      const list = idx.brandAliases.get(alias) ?? [];
      if (!list.includes(brandId)) list.push(brandId);
      idx.brandAliases.set(alias, list);
    };
    for (const [id, b] of brandNames) {
      const latin = tokens(b.name, { keepStop: true }).filter((w) => /^[a-z0-9]+$/.test(w));
      const full = tokens(b.name, { keepStop: true }).join(" ");
      addAlias(full, id);
      addAlias(normalize(b.name).replace(/\s+/g, ""), id);
      for (const w of latin) if (w.length >= 4 && !GENERIC_BRAND_WORDS.has(w)) addAlias(w, id);
      // الاسم العربي: البادئة قبل « - » أو الكلمة الأولى الأكثر تكراراً في أسماء منتجاته.
      const topAr = [...b.ar.entries()].sort((a, c) => c[1] - a[1])[0];
      if (topAr && topAr[1] >= 2 && topAr[1] >= Math.floor(b.count * 0.3)) {
        const arTokens = tokens(topAr[0], { keepStop: true });
        if (arTokens.length <= 3) addAlias(arTokens.join(" "), id);
        // كل كلمة مميزة من الاسم العربي («ديور» من «كريستيان ديور»).
        for (const w of arTokens) {
          if (w.length >= 4 && (b.tok.get(w) ?? 0) >= 2 && (b.tok.get(w) ?? 0) / (globalTok.get(w) ?? 1) >= 0.6) addAlias(w, id);
        }
      }
      // تنقيب إحصائي: كلمة عربية في 40%+ من أسماء منتجات البراند، و80%+ من ظهورها له.
      for (const [t, n] of b.tok) {
        if (b.count >= 2 && n >= Math.ceil(b.count * 0.4) && n / (globalTok.get(t) ?? n) >= 0.8) addAlias(t, id);
      }
      const firstWord = [...b.first.entries()].sort((a, c) => c[1] - a[1])[0];
      if (firstWord && firstWord[0].length >= 4 && firstWord[1] >= Math.max(2, Math.ceil(b.count * 0.5))) {
        addAlias(firstWord[0], id);
      }
    }
    // اسم يشير لأكثر من 6 براندات عام جداً — يُهمل.
    for (const [alias, ids] of idx.brandAliases) if (ids.length > 6) idx.brandAliases.delete(alias);
    for (const [alias, ids] of idx.brandAliases) {
      for (const id of ids) idx.brands.find((b) => b.id === id)?.aliases.push(alias);
    }
    idx.builtAt = Date.now();
    return idx;
  }

  /** BM25 للاستعلام مع توسعة بادئة للكلمات الطويلة. */
  search(queryTokens: string[], limit = 400): Map<number, number> {
    const scores = new Map<number, number>();
    const N = this.products.length;
    for (const qt of new Set(queryTokens)) {
      const terms: { t: string; damp: number }[] = [];
      if (this.postings.has(qt)) terms.push({ t: qt, damp: 1 });
      if (qt.length >= 4) {
        let n = 0;
        for (const v of this.vocab) {
          if (v !== qt && v.startsWith(qt)) {
            terms.push({ t: v, damp: 0.6 });
            if (++n >= 6) break;
          }
        }
      }
      for (const { t, damp } of terms) {
        const post = this.postings.get(t)!;
        const idf = Math.log(1 + (N - post.size + 0.5) / (post.size + 0.5));
        for (const [doc, f] of post) {
          const s =
            (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * this.docLen[doc]) / this.avgLen));
          scores.set(doc, (scores.get(doc) ?? 0) + s * damp);
        }
      }
    }
    if (scores.size <= limit) return scores;
    return new Map([...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit));
  }

  has(p: IndexedProduct, facet: FacetKey, id: string): "strong" | "weak" | null {
    if (p.strong.get(facet)?.has(id)) return "strong";
    if (p.weak.get(facet)?.has(id)) return "weak";
    return null;
  }
}
