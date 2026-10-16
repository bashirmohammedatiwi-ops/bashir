import { CatalogIndex, IndexedProduct, RawProduct } from "../catalog";
import { CONCERN_AREA, LEXICON } from "../lexicon";
import type { Need } from "../types";
import { TrainInput, TrainProduct } from "./types";

const KIND_AREA = new Map(LEXICON.filter((v) => v.facet === "kind" && v.area).map((v) => [v.id, v.area!]));

/** صفات المنتج المؤكدة كما يراها الفهرس (بلا ما استنتجه النموذج نفسه — حتى لا يتعلم من تخمينه). */
export function productLabels(p: IndexedProduct): string[] {
  const out: string[] = [];
  if (p.area) out.push(`area:${p.area}`);
  for (const k of p.strong.get("kind") ?? []) out.push(`kind:${k}`);
  for (const c of p.strong.get("concern") ?? []) out.push(`concern:${c}`);
  for (const g of p.strong.get("gender") ?? []) if (p.area === "fragrance" || p.area === "body") out.push(`gender:${g}`);
  if (p.area === "fragrance") {
    const fam = new Set([...(p.strong.get("family") ?? []), ...(p.weak.get("family") ?? [])]);
    for (const f of fam) out.push(`family:${f}`);
  }
  if (p.area === "skin") for (const s of new Set([...(p.strong.get("skinType") ?? []), ...(p.weak.get("skinType") ?? [])])) out.push(`skinType:${s}`);
  if (p.area === "makeup") for (const f of p.strong.get("finish") ?? []) out.push(`finish:${f}`);
  return out;
}

/** معنى عبارة متعلّمة ← صفات تدريب. */
export function deltaLabels(d: Partial<Need> | null | undefined): string[] {
  if (!d || typeof d !== "object") return [];
  const out: string[] = [];
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  if (typeof d.area === "string") out.push(`area:${d.area}`);
  for (const k of arr(d.kinds)) {
    out.push(`kind:${k}`);
    if (!d.area && KIND_AREA.get(k)) out.push(`area:${KIND_AREA.get(k)}`);
  }
  for (const c of arr(d.concerns)) {
    out.push(`concern:${c}`);
    if (!d.area && !d.kinds?.length && CONCERN_AREA[c]) out.push(`area:${CONCERN_AREA[c]}`);
  }
  for (const f of arr(d.families)) out.push(`family:${f}`);
  if (typeof d.gender === "string") out.push(`gender:${d.gender}`);
  if (typeof d.skinType === "string") out.push(`skinType:${d.skinType}`);
  if (typeof d.finish === "string") out.push(`finish:${d.finish}`);
  return [...new Set(out)];
}

export interface DatasetRaw {
  rows: RawProduct[];
  /** عبارات تعلّمتها «ديما» (AdvisorPhrase) بمعناها. */
  phrases: { phrase: string; delta: unknown; source: string }[];
  events: TrainInput["events"];
}

/** يبني بيانات التدريب: فهرس بلا إثراء النموذج (الصفوف لا تحمل تخمينه) ← صفات مؤكدة + نصوص كل منتج. */
export function buildTrainInput(raw: DatasetRaw, prebuilt?: CatalogIndex): TrainInput {
  const rows = raw.rows;
  const idx = prebuilt ?? CatalogIndex.build(rows);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const products: TrainProduct[] = [];
  for (const p of idx.products) {
    const r = byId.get(p.id);
    if (!r) continue;
    products.push({
      id: p.id,
      name: `${p.name} ${p.nameEn}`,
      cats: p.categoryPath.join(" "),
      summary: p.summary,
      desc: (r.descriptionAr || r.description || "").replace(/\s+/g, " ").slice(0, 900),
      brand: p.brand,
      labels: productLabels(p),
    });
  }
  const phrases = raw.phrases
    .map((ph) => ({ text: ph.phrase, labels: deltaLabels(ph.delta as Partial<Need>), w: ph.source === "admin" ? 4 : 3 }))
    .filter((ph) => ph.labels.length);
  return { products, phrases, events: raw.events };
}
