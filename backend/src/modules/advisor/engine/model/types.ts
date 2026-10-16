/** بيانات تدريب نموذج «ديما» — تُجمع من قاعدة البيانات وتُمرَّر لخيط التدريب. */
export interface TrainProduct {
  id: string;
  name: string;
  cats: string;
  summary: string;
  desc: string;
  brand: string;
  /** صفات مؤكدة من الفهرس بصيغة facet:id (مثل kind:serum، area:skin). */
  labels: string[];
}

export interface TrainInput {
  products: TrainProduct[];
  /** عبارات بمعناها: المعجم، وما تعلّمته «ديما» سابقاً (AdvisorPhrase). */
  phrases: { text: string; labels: string[]; w: number }[];
  /** تفاعل مجمّع: منتج × نوع × بصمة الطلب. */
  events: { productId: string; type: string; sig: string | null; n: number }[];
}

/** المجالات التي يتعلّمها النموذج من الكلمات. */
export const MODEL_FACETS = ["area", "kind", "concern", "family", "gender", "skinType", "finish"] as const;
export type ModelFacet = (typeof MODEL_FACETS)[number];

export interface FacetTable {
  labels: string[];
  /** وزن كل صفة في مجالها (للاحتمال المسبق). */
  counts: number[];
  total: number;
}

/** ما يعرفه النموذج عن كلمة: وزن ظهورها في كل مجال، وظهورها مع كل صفة. */
export interface FeatureStats {
  /** [facetIdx, nf, labelIdx, n, labelIdx, n, ...] لكل مجال ظهرت فيه. */
  f: number[][];
}

export interface EnrichOut {
  area?: string;
  kind?: string;
  gender?: string;
  families?: string[];
  concerns?: string[];
  skinTypes?: string[];
  finish?: string;
}

export interface ModelData {
  version: 1;
  trainedAt: number;
  facets: Record<ModelFacet, FacetTable>;
  features: Record<string, FeatureStats>;
  /** ميزة طلب (area:skin، kind:serum…) → [productId, boost] — ترتيب متعلّم من تفاعل الزبونات. */
  affinity: Record<string, [string, number][]>;
  /** عتبة الثقة لكل مجال في إثراء المنتجات (من التحقق المتقاطع). */
  thresholds: Partial<Record<ModelFacet, number>>;
  /** صفات استنتجها النموذج للمنتجات الناقصة. */
  enrich: Record<string, EnrichOut>;
  /** متجهات الكلمات مختصرة: المفردات وأقرب جيران كل كلمة [index, cos×100, …]. */
  embed?: { vocab: string[]; neighbors: number[][] };
  stats: ModelStats;
}

export interface ModelStats {
  products: number;
  phrases: number;
  events: number;
  features: number;
  ms: number;
  /** دقة الإثراء بالتحقق المتقاطع لكل مجال: الدقة والتغطية عند العتبة. */
  cv: Partial<Record<ModelFacet, { precision: number; coverage: number; n: number }>>;
  enriched: number;
  affinityKeys: number;
  vocab: number;
}
