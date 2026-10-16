import { brandTier } from "./brands";
import { CatalogIndex, IndexedProduct } from "./catalog";
import { FacetKey, LEXICON, facetValue } from "./lexicon";
import { understand } from "./nlu";
import { normalize, tokens } from "./text";

/**
 * بحث المتجر — في الذاكرة على نفس فهرس «ديما»:
 * BM25 بأوزان الحقول + بادئة الكلمة الأخيرة أثناء الكتابة + تصحيح إملائي + فهم الصفات
 * («شامبو للقشرة»، «عطر رجالي تحت 50 ألف») + الشعبية. أجزاء من الملي ثانية لكل طلب.
 */

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "new" | "best" | "rating" | "discount";

export interface SearchFilters {
  brandIds?: string[];
  categoryId?: string;
  kind?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  deals?: boolean;
  sort?: SearchSort;
}

export interface SearchHit {
  p: IndexedProduct;
  score: number;
}

export interface FacetCount {
  id: string;
  name: string;
  slug?: string;
  count: number;
}

export interface SearchOutcome {
  hits: SearchHit[];
  /** الاستعلام بعد التصحيح إن لم يطابق الأصل شيئاً. */
  corrected?: string;
  /** ما فهمه البحث (للعرض كشرائح): «شامبو»، «القشرة»، «≤ 20,000». */
  understood: string[];
  /** ميزانية مفهومة من النص («تحت 20 ألف»). */
  budget?: { min?: number; max?: number };
  facets: { brands: FacetCount[]; kinds: FacetCount[]; categories: FacetCount[]; price: { min: number; max: number } | null };
}

// كلمات نية لا تحمل معنى بحث («اريد شامبو» = «شامبو»).
const FILLER = new Set(
  tokens("اريد ابي احتاج ابغى عندكم اكو شي منتج منتجات افضل احسن ممكن لو سمحتي رجاء please want need", { keepStop: true }),
);

/** كل كلمة مفردة من المعجم ← صفتها (لتغطية كلمة بالصفة لا بالنص فقط). */
const WORD_FACETS = new Map<string, { facet: FacetKey; id: string }[]>();
for (const v of LEXICON) {
  if (!["kind", "concern", "area", "gender", "family", "ingredient", "skinType", "finish"].includes(v.facet)) continue;
  for (const t of [...v.terms, v.label]) {
    const tk = tokens(t, { keepStop: true });
    if (tk.length !== 1) continue;
    const list = WORD_FACETS.get(tk[0]) ?? [];
    if (!list.some((x) => x.facet === v.facet && x.id === v.id)) list.push({ facet: v.facet, id: v.id });
    WORD_FACETS.set(tk[0], list);
  }
}

interface Group {
  /** الكلمة كما في الاستعلام (مجذّعة). */
  token: string;
  /** درجات BM25 لهذه الكلمة (ومتوسعاتها). */
  scores: Map<number, number>;
  facets: { facet: FacetKey; id: string }[];
}

function groupsFor(catalog: CatalogIndex, toks: string[], prefixLast: boolean, rawLast: string): Group[] {
  return toks.map((t, i) => {
    const last = i === toks.length - 1;
    const expand = last && (prefixLast || !catalog.docFreq(t)) && t.length >= 2;
    // البادئة: «شام» ← شامبو… الأشيع يتقدم (من يكتب «شام» يقصد الشامبو غالباً لا «شامل»).
    // الكلمة الناقصة تُؤخذ كما كُتبت لا مجذّعة («لوري» لا «لور»).
    const pre = expand && rawLast.length > t.length ? rawLast : t;
    // التجذيع قصّ الكلمة الناقصة («لوري» ← «لور» = لورين)؟ نعتمد ما كُتب فقط.
    const terms = [pre, ...(expand ? catalog.prefixTerms(pre, pre.length <= 2 ? 6 : 10) : [])];
    // كلمة كاملة لا يعرفها الكتالوج: كلمات بنفس المعنى من النموذج المدرَّب («هايش» ← «مجعد»).
    const semantic = !catalog.docFreq(t) && !(last && prefixLast) && catalog.model ? catalog.model.expandTerm(t, (x) => catalog.docFreq(x)) : [];
    for (const [w] of semantic) if (!terms.includes(w)) terms.push(w);
    const semW = new Map(semantic);
    const dfs = terms.map((x) => catalog.docFreq(x));
    const maxDf = Math.max(1, ...dfs);
    const scores = new Map<number, number>();
    terms.forEach((term, k) => {
      if (!dfs[k]) return;
      // الكلمة الكاملة كما كُتبت لها الأولوية؛ المتوسعات بحسب شيوعها.
      const w = semW.get(term) ?? (k === 0 ? (expand ? 0.7 + 0.3 * (dfs[k] / maxDf) : 1) : 0.55 + 0.45 * (dfs[k] / maxDf));
      for (const [d, sc] of catalog.search([term], 3000)) scores.set(d, Math.max(scores.get(d) ?? 0, sc * w));
    });
    // صفات المتوسعات الشائعة (شامبو ← نوع «شامبو») حتى تتقدم منتجاته.
    const facets = [...(WORD_FACETS.get(t) ?? [])];
    if (expand) {
      const top = terms.slice(1).sort((a, b) => catalog.docFreq(b) - catalog.docFreq(a)).slice(0, 2);
      for (const x of top) for (const f of WORD_FACETS.get(x) ?? []) if (f.facet === "kind") facets.push({ ...f, soft: true } as never);
    }
    return { token: t, scores, facets };
  });
}

function passFilters(p: IndexedProduct, f: SearchFilters, budget?: { min?: number; max?: number }): boolean {
  if (f.brandIds?.length && (!p.brandId || !f.brandIds.includes(p.brandId))) return false;
  if (f.categoryId && !p.cats.some((c) => c.id === f.categoryId)) return false;
  if (f.kind && !p.strong.get("kind")?.has(f.kind)) return false;
  const min = f.minPrice ?? budget?.min;
  const max = f.maxPrice ?? budget?.max;
  if (min != null && p.price < min) return false;
  if (max != null && p.price > max) return false;
  if (f.inStock && p.stock <= 0) return false;
  if (f.deals && !(p.discountPercent > 0)) return false;
  return true;
}

function run(catalog: CatalogIndex, query: string, f: SearchFilters, prefixLast: boolean) {
  const all = tokens(query);
  // حرف واحد في آخر الكتابة («عطر ر») لم يكتمل بعد — لا يُشترط.
  const toks = all.filter((t, i) => !FILLER.has(t) && (t.length > 1 || /\d/.test(t)) && !(prefixLast && i === all.length - 1 && t.length < 2));
  const parsed = understand(query, catalog);
  const d = parsed.delta;
  const budget = d.maxPrice || d.minPrice ? { min: d.minPrice, max: d.maxPrice } : undefined;
  // أرقام الميزانية ليست كلمات بحث («تحت 20 ألف»).
  const words = budget ? toks.filter((t) => !/^\d+$/.test(t) && !["تحت", "فوق", "بين", "الف", "دينار", "اقل", "اكثر"].includes(t)) : toks;
  const rawLast = normalize(query).split(" ").filter(Boolean).pop() ?? "";
  const groups = groupsFor(catalog, words.length ? words : toks, prefixLast, rawLast);
  const phrase = ` ${words.join(" ")} `;
  const brandIds = new Set(d.brands ?? []);
  // أثناء الكتابة: براندات تبدأ أسماؤها بالكلمة الناقصة («لوري» ← لوريال).
  const lastTok = rawLast.length > (words[words.length - 1] ?? "").length ? rawLast : words[words.length - 1] ?? "";
  const prefixBrands = new Set<string>();
  if (prefixLast && lastTok.length >= 3) {
    for (const [alias, ids] of catalog.brandAliases) if (alias.startsWith(lastTok)) ids.forEach((id) => prefixBrands.add(id));
  }
  const kinds = new Set(d.kinds ?? []);
  const concerns = d.concerns ?? [];

  // المرشّحون: ما طابق نصاً، ومنتجات البراند/النوع المفهوم.
  const cand = new Set<number>();
  for (const g of groups) for (const doc of g.scores.keys()) cand.add(doc);
  if (brandIds.size || kinds.size) {
    for (const p of catalog.products) {
      if ((p.brandId && brandIds.has(p.brandId)) || [...(p.strong.get("kind") ?? [])].some((k) => kinds.has(k))) cand.add(p.idx);
    }
  }

  const need = groups.length;
  const hits: SearchHit[] = [];
  for (const doc of cand) {
    const p = catalog.products[doc];
    if (!p.price) continue;
    let text = 0;
    let covered = 0;
    for (const g of groups) {
      const s = g.scores.get(doc);
      if (s) {
        text += s;
        covered++;
      } else if (g.facets.some((x) => catalog.has(p, x.facet, x.id) === "strong")) {
        covered++;
        text += 1.2;
      } else if (p.brandId && brandIds.has(p.brandId) && catalog.brandAliases.get(g.token)?.includes(p.brandId)) {
        covered++;
        text += 2;
      }
    }
    // كلمة أو كلمتان: كلها مطلوبة؛ أكثر: يكفي معظمها.
    const minCover = need <= 2 ? need : Math.ceil(need * 0.66);
    if (covered < minCover) continue;

    let score = text + (covered / need) * 3;
    if (words.length && p.nameBare.includes(phrase)) score += 4;
    if (words.length && p.nameBare.startsWith(phrase)) score += 1.5;
    if (p.brandId && brandIds.has(p.brandId)) score += 4;
    else if (p.brandId && prefixBrands.has(p.brandId)) score += 2.5;
    if ([...(p.strong.get("kind") ?? [])].some((k) => kinds.has(k))) score += 2.5;
    // نوع متوقع من الكلمة الناقصة («شام» ← شامبو).
    const lastG = groups[groups.length - 1];
    if (lastG?.facets.some((x) => (x as { soft?: boolean }).soft && catalog.has(p, x.facet, x.id) === "strong")) score += 2;
    for (const c of concerns) if (catalog.has(p, "concern", c) === "strong") score += 1.2;
    if (d.gender) {
      const g = p.strong.get("gender");
      if (g?.has(d.gender)) score += 1;
      else if (g && !g.has("unisex")) score -= 3;
    }
    // الجودة: سمعة البراند بمجاله، العطور الأيقونية، اكتمال البيانات، المبيعات والتفاعل.
    score += brandTier(p.brand, p.area) * 1.3 + (p.iconic ? 0.7 : 0) + p.richness * 0.5 + p.quality * 1.2 + p.learned * 0.8;
    if (p.discountPercent > 0) score += 0.2;
    if (p.stock <= 0) score -= 6; // النافد يبقى ظاهراً لكن بالآخر
    hits.push({ p, score });
  }
  return { hits, parsed, budget };
}

const sorters: Record<SearchSort, (a: SearchHit, b: SearchHit) => number> = {
  relevance: (a, b) => b.score - a.score,
  price_asc: (a, b) => a.p.price - b.p.price,
  price_desc: (a, b) => b.p.price - a.p.price,
  new: (a, b) => b.p.createdAt - a.p.createdAt,
  best: (a, b) => b.p.soldCount - a.p.soldCount || b.score - a.score,
  rating: (a, b) => b.p.rating * Math.min(1, b.p.reviewCount / 3) - a.p.rating * Math.min(1, a.p.reviewCount / 3) || b.score - a.score,
  discount: (a, b) => b.p.discountPercent - a.p.discountPercent || b.score - a.score,
};

export function searchCatalog(catalog: CatalogIndex, query: string, f: SearchFilters = {}, opts: { instant?: boolean } = {}): SearchOutcome {
  const q = query.trim();
  const empty: SearchOutcome = { hits: [], understood: [], facets: { brands: [], kinds: [], categories: [], price: null } };
  if (q.length < 1) return empty;
  // أثناء الكتابة: الكلمة الأخيرة ناقصة غالباً (إلا إذا انتهت بمسافة).
  const prefixLast = Boolean(opts.instant) && !/\s$/.test(query);

  let { hits, parsed, budget } = run(catalog, q, f, prefixLast);
  let corrected: string | undefined;
  if (!hits.length) {
    // تصحيح إملائي كلمة بكلمة لأقرب كلمة شائعة في الفهرس.
    const raw = normalize(q).split(" ").filter(Boolean);
    let changed = false;
    const fixed = raw.map((w) => {
      const t = tokens(w)[0];
      if (!t || catalog.docFreq(t)) return w;
      const n = catalog.nearestTerm(t);
      if (!n) return w;
      changed = true;
      return n;
    });
    if (changed) {
      const alt = run(catalog, fixed.join(" "), f, false);
      if (alt.hits.length) {
        ({ hits, parsed, budget } = alt);
        corrected = fixed.join(" ");
      }
    }
  }

  // الفلاتر بعد الفهم؛ الفئات تُحسب قبل فلاتر البراند/القسم حتى تبقى قابلة للتبديل.
  const base = hits.filter((h) => passFilters(h.p, { minPrice: f.minPrice, maxPrice: f.maxPrice, inStock: f.inStock, deals: f.deals }, budget));
  const final = base.filter((h) => passFilters(h.p, f, budget));
  final.sort(sorters[f.sort ?? "relevance"]);
  if ((f.sort ?? "relevance") !== "relevance") {
    // الترتيب بالسعر وغيره: النافد يبقى بالآخر.
    final.sort((a, b) => Number(b.p.stock > 0) - Number(a.p.stock > 0));
  }

  const count = <K>(items: SearchHit[], keyOf: (p: IndexedProduct) => K[], label: (k: K, p: IndexedProduct) => Omit<FacetCount, "count"> | null) => {
    const m = new Map<string, FacetCount>();
    for (const h of items) {
      for (const k of keyOf(h.p)) {
        const fc = label(k, h.p);
        if (!fc) continue;
        const cur = m.get(fc.id);
        if (cur) cur.count++;
        else m.set(fc.id, { ...fc, count: 1 });
      }
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  };
  const prices = base.map((h) => h.p.price);
  const brandName = new Map(catalog.brands.map((b) => [b.id, b.name]));

  const d = parsed.delta;
  const understood = [
    ...(d.kinds ?? []).map((k) => facetValue("kind", k)?.label),
    ...(d.concerns ?? []).map((c) => facetValue("concern", c)?.label),
    d.gender ? facetValue("gender", d.gender)?.label : undefined,
    ...(d.brands ?? []).slice(0, 1).map((b) => brandName.get(b)),
    budget?.max ? `≤ ${budget.max.toLocaleString("en-US")}` : undefined,
    budget?.min && !budget.max ? `≥ ${budget.min.toLocaleString("en-US")}` : undefined,
  ].filter(Boolean) as string[];

  return {
    hits: final,
    corrected,
    understood,
    budget,
    facets: {
      brands: count(base, (p) => (p.brandId ? [p.brandId] : []), (id, p) => ({ id, name: brandName.get(id) ?? p.brand, slug: p.brandSlug })).slice(0, 14),
      kinds: count(base, (p) => [...(p.strong.get("kind") ?? [])], (id) => {
        const fv = facetValue("kind", id);
        return fv ? { id, name: fv.label } : null;
      }).slice(0, 10),
      categories: count(base, (p) => p.cats.filter((c) => c.level > 0), (c) => ({ id: c.id, name: c.name, slug: c.slug })).slice(0, 10),
      price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    },
  };
}

// ───────────────────────────────────────────── اقتراحات أثناء الكتابة

export interface Completion {
  text: string;
  /** term | brand | phrase */
  type: string;
}

const SIZE_OR_NUM = /^[\d.,٠-٩]+$|^(مل|ml|غ|g|جم|غرام|ملل)$/i;

/** إكمالات للاستعلام: براندات وأنواع وعبارات من أسماء المنتجات الأقرب. */
export function completionsFor(catalog: CatalogIndex, query: string, hits: SearchHit[], limit = 6): Completion[] {
  const rawWords = query.trim().split(/\s+/).filter(Boolean);
  if (!rawWords.length) return [];
  const lastRaw = rawWords[rawWords.length - 1];
  const head = rawWords.slice(0, -1).join(" ");
  const nLast = normalize(lastRaw);
  const nQuery = normalize(query.trim());
  const withHead = (t: string) => (head ? `${head} ${t}` : t);
  const out: (Completion & { w: number })[] = [];
  const seen = new Set<string>([nQuery]);
  const push = (text: string, type: string, w: number) => {
    const n = normalize(text);
    if (seen.has(n) || n.length <= nQuery.length - 1) return;
    seen.add(n);
    out.push({ text, type, w });
  };

  if (nLast.length >= 2) {
    // براندات تبدأ بما كُتب.
    for (const b of catalog.brands) {
      const nb = normalize(b.name);
      if (nb.startsWith(nLast) || b.aliases.some((a) => a.startsWith(nLast) && a.length >= nLast.length)) {
        push(withHead(b.name), "brand", 3 + Math.min(2, b.productCount / 40));
      }
    }
    // أنواع/مشاكل المعجم بأسمائها العربية.
    for (const v of LEXICON) {
      if (v.facet !== "kind" && v.facet !== "concern") continue;
      const nl = normalize(v.label);
      if (nl.startsWith(nLast) || nl.replace(/^ال/, "").startsWith(nLast.replace(/^ال/, ""))) push(withHead(v.label), "term", 2.5);
    }
  }

  // عبارات من أسماء أقرب المنتجات: الكلمة المطابقة + كلمة/كلمتان بعدها.
  const freq = new Map<string, number>();
  for (const h of hits.slice(0, 40)) {
    const words = h.p.name.split(/[\s\-–—|،,()]+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const nw = normalize(words[i]);
      if (!nw.startsWith(nLast) && !nw.replace(/^ال/, "").startsWith(nLast.replace(/^ال/, ""))) continue;
      const tail: string[] = [words[i]];
      for (let j = i + 1; j < words.length && tail.length < 3; j++) {
        if (SIZE_OR_NUM.test(words[j])) break;
        tail.push(words[j]);
        if (tail.length === 2 && /^[a-z]/i.test(words[j]) !== /^[a-z]/i.test(words[i])) break;
      }
      for (const n of [1, 2]) {
        if (tail.length < n) continue;
        const phrase = tail.slice(0, n).join(" ");
        if (normalize(phrase).length < 3) continue;
        freq.set(phrase, (freq.get(phrase) ?? 0) + (n === 2 ? 1.2 : 1));
      }
      break;
    }
  }
  for (const [phrase, n] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    if (n < 1.2 && out.length >= 3) continue;
    push(withHead(phrase), "phrase", 1 + n / 3);
  }

  return out
    .sort((a, b) => b.w - a.w)
    .slice(0, limit)
    .map(({ text, type }) => ({ text, type }));
}
