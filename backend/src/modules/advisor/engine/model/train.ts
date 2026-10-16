import { CONCERN_AREA, LEXICON } from "../lexicon";
import { Assoc } from "./assoc";
import { textFeatures, wordFeatures, words } from "./features";
import { EnrichOut, MODEL_FACETS, ModelData, ModelFacet, ModelStats, TrainInput, TrainProduct } from "./types";
import { affinityFeatures } from "./sig";
import { trainEmbeddings } from "./embed";
import { stem } from "../text";

/**
 * تدريب نموذج «ديما» — داخلياً بالكامل، على بياناتنا فقط:
 * 1) ترابط الكلمات بالصفات من نصوص الكتالوج (الاسم، القسم، الوصف) + المعجم + ما تعلّمته سابقاً.
 * 2) إثراء المنتجات الناقصة (نوع/مجال/جنس/عائلة/مشكلة) بعتبة ثقة من التحقق المتقاطع.
 * 3) ترتيب متعلّم: أي المنتجات تُضاف للسلة/تُفتح/تُستحسن لكل نوع طلب.
 *
 * يعمل على دفعات مع استراحات (`pace`) حتى لا يأخذ أكثر من نصف نواة.
 */

export type Pace = () => Promise<void>;

/** يستريح بقدر ما عمل (≈50% من نواة واحدة كحد أقصى). */
export function pacer(workMs = 40, restMs = 40): Pace {
  let last = Date.now();
  return async () => {
    if (Date.now() - last < workMs) return;
    await new Promise((r) => setTimeout(r, restMs));
    last = Date.now();
  };
}

const KIND_AREA = new Map(LEXICON.filter((v) => v.facet === "kind" && v.area).map((v) => [v.id, v.area!]));
const MODEL_SET = new Set<string>(MODEL_FACETS);

/** ميزات منتج بأوزان الحقول: الاسم والقسم أصدق من الوصف الطويل. البراند لا يدخل. */
export function productFeatures(p: Pick<TrainProduct, "name" | "cats" | "summary" | "desc" | "brand">): Map<string, number> {
  const out = new Map<string, number>();
  const brand = textFeatures(p.brand);
  const put = (text: string, w: number) => {
    for (const f of textFeatures(text)) if (!brand.has(f) && (out.get(f) ?? 0) < w) out.set(f, w);
  };
  put(p.desc.slice(0, 900), 0.6);
  put(p.summary, 1);
  put(p.cats, 1);
  put(p.name, 1);
  return out;
}

/** وثائق المعجم: كل مرادف (وعبارة زبونة) يعلّم صفته — أساس ثابت فوقه يتعلم النموذج. */
function lexiconDocs(): { feats: Map<string, number>; labels: string[]; w: number }[] {
  const out: { feats: Map<string, number>; labels: string[]; w: number }[] = [];
  for (const v of LEXICON) {
    if (!MODEL_SET.has(v.facet)) continue;
    const labels = [`${v.facet}:${v.id}`];
    if (v.facet === "kind" && v.area) labels.push(`area:${v.area}`);
    if (v.facet === "concern" && CONCERN_AREA[v.id]) labels.push(`area:${CONCERN_AREA[v.id]}`);
    for (const t of [...v.terms, ...(v.ask ?? [])]) {
      const feats = new Map<string, number>();
      for (const f of textFeatures(t)) feats.set(f, 1);
      if (feats.size) out.push({ feats, labels, w: 4 });
    }
  }
  return out;
}

function phraseDocs(input: TrainInput) {
  return input.phrases
    .map((ph) => {
      const feats = new Map<string, number>();
      for (const f of textFeatures(ph.text)) feats.set(f, 1);
      return { feats, labels: ph.labels, w: ph.w };
    })
    .filter((d) => d.feats.size && d.labels.length);
}

const facetOf = (l: string) => l.slice(0, l.indexOf(":"));
const idOf = (l: string) => l.slice(l.indexOf(":") + 1);

/** ما ينقص المنتج ويمكن للنموذج استنتاجه (بحسب مجاله). */
function missingFacets(labels: string[]): ModelFacet[] {
  const has = new Set(labels.map(facetOf));
  const area = labels.find((l) => l.startsWith("area:"))?.slice(5);
  const out: ModelFacet[] = [];
  if (!has.has("area")) out.push("area");
  if (!has.has("kind")) out.push("kind");
  if (area === "fragrance") {
    if (!has.has("gender")) out.push("gender");
    if (!has.has("family")) out.push("family");
  }
  if ((area === "skin" || area === "hair") && !has.has("concern")) out.push("concern");
  if (area === "skin" && !has.has("skinType")) out.push("skinType");
  return out;
}

/** المرشحون المسموحون لمجال ضمن مجال المنتج (أنواع الشعر لمنتج شعر…). */
function allowedFor(facet: ModelFacet, area: string | undefined, a: Assoc): Set<string> | undefined {
  if (facet === "kind" && area) {
    const fi = MODEL_FACETS.indexOf("kind");
    return new Set(a.labels[fi].filter((k) => KIND_AREA.get(k) === area));
  }
  if (facet === "concern" && area) {
    const fi = MODEL_FACETS.indexOf("concern");
    return new Set(a.labels[fi].filter((c) => (CONCERN_AREA[c] ?? area) === area));
  }
  return undefined;
}

function predict(a: Assoc, facet: ModelFacet, feats: Map<string, number>, area?: string) {
  const r = a.score(facet, [...feats.keys()], { allowed: allowedFor(facet, area, a), minNf: 2 });
  return r.ranked[0] ? { label: r.ranked[0].label, p: r.ranked[0].p, evidence: r.evidence } : null;
}

const ENRICH_FACETS: ModelFacet[] = ["area", "kind", "gender", "family", "concern", "skinType"];

export async function trainModel(input: TrainInput, pace: Pace = async () => undefined): Promise<ModelData> {
  const started = Date.now();
  const lex = lexiconDocs();
  const phr = phraseDocs(input);
  const docs: { feats: Map<string, number>; labels: string[] }[] = [];
  for (const p of input.products) {
    docs.push({ feats: productFeatures(p), labels: p.labels });
    await pace();
  }

  const build = async (skip?: (i: number) => boolean) => {
    const a = new Assoc();
    for (const d of lex) a.add(d.feats, d.labels, d.w);
    for (const d of phr) a.add(d.feats, d.labels, d.w);
    for (let i = 0; i < docs.length; i++) {
      if (skip?.(i)) continue;
      a.add(docs[i].feats, docs[i].labels, 1);
      if (i % 200 === 0) await pace();
    }
    return a;
  };

  // ── التحقق المتقاطع (5 أجزاء): نخفي صفة معروفة ونرى هل يستنتجها النموذج — منه عتبة الثقة.
  const K = 5;
  const preds: Record<string, { p: number; ok: boolean }[]> = {};
  for (let k = 0; k < K; k++) {
    const a = await build((i) => i % K === k);
    for (let i = k; i < docs.length; i += K) {
      const d = docs[i];
      const area = d.labels.find((l) => l.startsWith("area:"))?.slice(5);
      for (const facet of ENRICH_FACETS) {
        const truth = d.labels.filter((l) => facetOf(l) === facet).map(idOf);
        if (!truth.length) continue;
        if ((facet === "gender" || facet === "family") && area !== "fragrance") continue;
        const pr = predict(a, facet, d.feats, facet === "area" ? undefined : area);
        if (!pr) continue;
        (preds[facet] ??= []).push({ p: pr.p, ok: truth.includes(pr.label) });
      }
      if (i % 100 === 0) await pace();
    }
  }
  const thresholds: Partial<Record<ModelFacet, number>> = {};
  const cv: ModelStats["cv"] = {};
  for (const facet of ENRICH_FACETS) {
    const list = (preds[facet] ?? []).sort((x, y) => y.p - x.p);
    if (list.length < 30) continue;
    // أدنى عتبة تبقي الدقة ≥ 92% (على الأقل 20 منتجاً فوقها).
    let ok = 0;
    let best: { t: number; prec: number; cov: number } | null = null;
    for (let i = 0; i < list.length; i++) {
      if (list[i].ok) ok++;
      const prec = ok / (i + 1);
      if (i >= 19 && prec >= 0.92) best = { t: list[i].p, prec, cov: (i + 1) / list.length };
    }
    if (best) {
      thresholds[facet] = Math.max(0.5, best.t);
      cv[facet] = { precision: Math.round(best.prec * 1000) / 1000, coverage: Math.round(best.cov * 1000) / 1000, n: list.length };
    }
  }

  // ── النموذج النهائي على كل البيانات.
  const a = await build();
  a.prune(1.5);

  // ── إثراء المنتجات الناقصة.
  const enrich: Record<string, EnrichOut> = {};
  let enriched = 0;
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const missing = missingFacets(d.labels);
    if (!missing.length) continue;
    let area = d.labels.find((l) => l.startsWith("area:"))?.slice(5);
    const out: EnrichOut = {};
    for (const facet of ENRICH_FACETS) {
      if (!missing.includes(facet)) continue;
      const t = thresholds[facet];
      if (t == null) continue;
      if ((facet === "gender" || facet === "family") && area !== "fragrance") continue;
      const pr = predict(a, facet, d.feats, facet === "area" ? undefined : area);
      if (!pr || pr.p < t || pr.evidence < 3) continue;
      if (facet === "area") out.area = area = pr.label;
      else if (facet === "kind") {
        if (area && KIND_AREA.get(pr.label) && KIND_AREA.get(pr.label) !== area) continue;
        out.kind = pr.label;
      } else if (facet === "gender") out.gender = pr.label;
      else if (facet === "family") out.families = [pr.label];
      else if (facet === "concern") out.concerns = [pr.label];
      else if (facet === "skinType") out.skinTypes = [pr.label];
    }
    if (Object.keys(out).length) {
      enrich[input.products[i].id] = out;
      enriched++;
    }
    if (i % 200 === 0) await pace();
  }

  // ── الترتيب المتعلّم من التفاعل.
  const affinity = trainAffinity(input.events);

  // ── متجهات الكلمات من جمل الكتالوج والمعجم والعبارات المتعلّمة.
  const sentences: string[][] = [];
  const addText = (text: string) => {
    for (const part of text.split(/[.!؟?\n،,:;()•|]+/)) {
      const w = words(part).map(stem);
      if (w.length >= 2) sentences.push(w);
    }
  };
  for (const p of input.products) {
    addText(p.name);
    addText(p.desc);
    addText(p.summary);
    await pace();
  }
  for (const ph of input.phrases) addText(ph.text);
  const emb = await trainEmbeddings(sentences, pace, { maxVocab: 9000, dim: 64, minCos: 0.5, neighbors: 8, minCount: 5 });

  const data = a.toData();
  return {
    version: 1,
    trainedAt: Date.now(),
    facets: data.facets,
    features: data.features,
    affinity,
    thresholds,
    enrich,
    embed: emb.vocab.length ? { vocab: emb.vocab, neighbors: emb.neighbors } : undefined,
    stats: {
      products: input.products.length,
      phrases: input.phrases.length,
      events: input.events.reduce((s, e) => s + e.n, 0),
      features: Object.keys(data.features).length,
      ms: Date.now() - started,
      cv,
      enriched,
      affinityKeys: Object.keys(affinity).length,
      vocab: emb.vocab.length,
    },
  };
}

const EVENT_W: Record<string, number> = { cart: 3, like: 2, click: 1, dislike: -2.5 };

/**
 * لكل ميزة طلب (kind:serum، concern:acne…): المنتجات التي تفضّلها الزبونات فيه أكثر
 * من شعبيتها العامة (رفع مُنعَّم)، وعقوبة لما لم يعجبهن.
 */
export function trainAffinity(events: TrainInput["events"]): Record<string, [string, number][]> {
  const pos = new Map<string, Map<string, number>>();
  const neg = new Map<string, Map<string, number>>();
  const global = new Map<string, number>();
  let globalSum = 0;
  for (const e of events) {
    const w = (EVENT_W[e.type] ?? 0) * e.n;
    if (!w || !e.productId) continue;
    if (w > 0) {
      global.set(e.productId, (global.get(e.productId) ?? 0) + w);
      globalSum += w;
    }
    for (const f of affinityFeatures(e.sig)) {
      const m = w > 0 ? pos : neg;
      const row = m.get(f) ?? m.set(f, new Map()).get(f)!;
      row.set(e.productId, (row.get(e.productId) ?? 0) + Math.abs(w));
    }
  }
  const nProducts = Math.max(1, global.size);
  const share = (id: string) => ((global.get(id) ?? 0) + 1) / (globalSum + nProducts);
  const out: Record<string, [string, number][]> = {};
  const keys = new Set([...pos.keys(), ...neg.keys()]);
  for (const f of keys) {
    const row = pos.get(f) ?? new Map<string, number>();
    const nc = [...row.values()].reduce((a, b) => a + b, 0);
    const list: [string, number][] = [];
    const ids = new Set([...row.keys(), ...(neg.get(f)?.keys() ?? [])]);
    for (const id of ids) {
      const n = row.get(id) ?? 0;
      const q = share(id);
      const alpha = 6;
      const lift = (n + alpha * q) / ((nc + alpha) * q);
      let b = n > 0 ? Math.max(0, Math.min(2, Math.log(lift))) * (1 - Math.exp(-n / 3)) : 0;
      const bad = neg.get(f)?.get(id) ?? 0;
      if (bad) b -= Math.min(1.5, 0.35 * bad);
      if (Math.abs(b) >= 0.05) list.push([id, Math.round(b * 100) / 100]);
    }
    list.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
    if (list.length) out[f] = list.slice(0, 80);
  }
  return out;
}

export { wordFeatures, words };
