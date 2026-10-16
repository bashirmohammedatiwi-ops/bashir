import { CONCERN_AREA, LEXICON } from "../lexicon";
import type { Need } from "../types";
import { Assoc } from "./assoc";
import { wordFeatures } from "./features";
import { stem, tokens } from "../text";
import { needSig, affinityFeatures } from "./sig";
import { EnrichOut, ModelData, ModelFacet } from "./types";

const KIND_AREA = new Map(LEXICON.filter((v) => v.facet === "kind" && v.area).map((v) => [v.id, v.area!]));

export interface Inferred {
  area?: string;
  kinds?: string[];
  concerns?: string[];
  families?: string[];
  gender?: string;
  skinType?: string;
  /** الكلمات التي فسّرها النموذج (تخرج من البحث النصي الحر). */
  used: number[];
}

export interface Known {
  area?: string;
  kinds?: string[];
  concerns?: string[];
  families?: string[];
  gender?: string;
  skinType?: string;
}

const GENERIC = new Set(tokens("كريم كريمات منتج منتجات شي شيء نوع انواع اريد احتاج يخلي تخلي يكون تكون حلو حلوه زين زينه جيد افضل احسن", { keepStop: true }));

/** عتبات الثقة لفهم كلام الزبونة (ضُبطت على قسم التطوير من مجموعة التقييم). */
export const INFER = {
  area: 0.9,
  kind: 0.5,
  concern: 0.5,
  family: 0.35,
  gender: 0.45,
  skinType: 0.5,
  /** أقل عدد ظهور للكلمة مع الصفة. */
  minSupport: 3,
  /** أقل رفع عن النسبة العامة للصفة (حتى لا تُختار الصفة الشائعة دائماً). */
  minLift: 2,
};

/**
 * النموذج المدرَّب جاهزاً للاستخدام أثناء المحادثة: فهم الكلمات التي لا يعرفها المعجم،
 * وترتيب متعلّم من تفاعل الزبونات. كل استدعاء أجزاء من الملي ثانية.
 */
export class ModelRuntime {
  readonly assoc: Assoc;
  readonly trainedAt: number;
  private readonly affinity = new Map<string, Map<string, number>>();
  private readonly affCache = new Map<string, Map<string, number> | null>();

  private readonly vocabId = new Map<string, number>();

  constructor(readonly data: ModelData) {
    this.assoc = Assoc.fromData(data.facets, data.features);
    this.trainedAt = data.trainedAt;
    for (const [k, list] of Object.entries(data.affinity ?? {})) this.affinity.set(k, new Map(list));
    data.embed?.vocab.forEach((w, i) => this.vocabId.set(w, i));
  }

  enrichFor(productId: string): EnrichOut | undefined {
    return this.data.enrich?.[productId];
  }

  private allowed(facet: ModelFacet, area?: string): Set<string> | undefined {
    if (!area) return undefined;
    const fi = ["area", "kind", "concern", "family", "gender", "skinType", "finish"].indexOf(facet);
    if (facet === "kind") return new Set(this.assoc.labels[fi].filter((k) => KIND_AREA.get(k) === area));
    if (facet === "concern") return new Set(this.assoc.labels[fi].filter((c) => (CONCERN_AREA[c] ?? area) === area || (area === "body" && CONCERN_AREA[c] === "skin")));
    return undefined;
  }

  /** أقرب كلمات في المعنى (من المتجهات المدرَّبة): [كلمة، تشابه 0..1]. */
  neighbors(stemmed: string): [string, number][] {
    const e = this.data.embed;
    if (!e) return [];
    let i = this.vocabId.get(stemmed);
    // فعل مضارع («يطول»، «تلمع») ← اسمه في الكتالوج («طول»، «لمع»).
    if (i == null && stemmed.length >= 4 && /^[يتن]/.test(stemmed)) i = this.vocabId.get(stemmed.slice(1));
    if (i == null) return [];
    const nb = e.neighbors[i] ?? [];
    const out: [string, number][] = [];
    for (let k = 0; k + 1 < nb.length; k += 2) out.push([e.vocab[nb[k]], nb[k + 1] / 100]);
    return out;
  }

  /**
   * ميزات كلمة: نفسها بوزن 1، وإن كانت نادرة في الكتالوج فجيرانها في المعنى (بوزن تشابههم).
   * الكلمات الشائعة لا تُوسَّع — دليلها المباشر كافٍ، وجيرانها يضيفون ضجيجاً.
   */
  private expand(word: string): [string, number][] {
    const own = wordFeatures(word);
    const out: [string, number][] = own.map((f) => [f, 1]);
    const known = Math.max(...own.map((f) => this.assoc.nf("area", f)));
    if (known >= 8) return out;
    const s = own[0];
    let nbs = this.neighbors(s);
    if (!nbs.length && s.length >= 4 && /^[يتن]/.test(s)) nbs = [[s.slice(1), 0.9]];
    for (const [n, cos] of nbs.slice(0, 4)) if (cos >= 0.6) out.push([n, cos]);
    return out;
  }

  /**
   * تصويت الكلمات لصفة: كل كلمة تقترح أقوى صفة ترتبط بها (احتمال × وزن الكلمة)،
   * بشرط دعم كافٍ (n) ورفع واضح عن النسبة العامة. يعيد الصفات المقبولة والكلمات التي صوّتت.
   */
  private vote(facet: ModelFacet, feats: [string, number][][], threshold: number, area?: string, multi = 1): { labels: string[]; words: number[] } {
    const allowed = this.allowed(facet, area);
    const votes: { label: string; score: number; word: number }[] = [];
    feats.forEach((fs, i) => {
      let best: { label: string; score: number } | null = null;
      for (const [f, w] of fs) {
        const b = this.assoc.best(facet, f, allowed);
        if (!b || b.n * w < INFER.minSupport || b.lift < INFER.minLift) continue;
        const score = b.score * w;
        if (!best || score > best.score) best = { label: b.label, score };
      }
      if (best && best.score >= threshold) votes.push({ ...best, word: i });
    });
    votes.sort((a, b) => b.score - a.score);
    const labels: string[] = [];
    const words: number[] = [];
    for (const v of votes) {
      if (!labels.includes(v.label)) {
        if (labels.length >= multi) continue;
        labels.push(v.label);
      }
      words.push(v.word);
    }
    return { labels, words };
  }

  /**
   * كلمات حرة لم يفهمها المعجم («يلمع بالعرس»، «ريحة نظيفة»، «رموشي قصيرة») ← صفات،
   * فقط بثقة عالية وتملأ الفراغ لا تغيّر ما فهمته «ديما» صراحة.
   */
  inferFree(raw: string[], known: Known, context: string[] = []): Inferred {
    const out: Inferred = { used: [] };
    if (!raw.length && !context.length) return out;
    // كلمات عامة («كريم»، «منتج») صيغة لا معنى: لا يُستنتج منها نوع.
    const feats = raw.map((w) => (GENERIC.has(stem(w)) ? [] : this.expand(w)));
    const used = new Set<number>();
    const take = (r: { labels: string[]; words: number[] }) => {
      r.words.forEach((i) => used.add(i));
      return r.labels;
    };

    let area = known.area;
    if (!area && !known.kinds?.length) {
      const a = take(this.vote("area", feats, INFER.area));
      if (a.length) area = out.area = a[0];
    }
    if (!known.kinds?.length) {
      // كلمات السياق تصوّت للنوع فقط، ولا تُحسب «مفسَّرة» (فهمها المعجم أصلاً).
      const ctx = context.filter((w) => !GENERIC.has(stem(w))).map((w) => wordFeatures(w).map((f): [string, number] => [f, 1]));
      const r = this.vote("kind", [...feats, ...ctx], INFER.kind, area, area ? 2 : 1);
      const k = take({ labels: r.labels, words: r.words.filter((i) => i < feats.length) });
      if (k.length) {
        out.kinds = k;
        if (!area) area = out.area = KIND_AREA.get(k[0]);
      }
    }
    if (!known.concerns?.length && area !== "fragrance" && area !== "makeup" && area !== "nails") {
      const c = take(this.vote("concern", feats, INFER.concern, area, 2));
      if (c.length) {
        out.concerns = c;
        if (!area && CONCERN_AREA[c[0]]) area = out.area = CONCERN_AREA[c[0]];
      }
    }
    if (area === "fragrance") {
      if (!known.families?.length) {
        const f = take(this.vote("family", feats, INFER.family, undefined, 2));
        if (f.length) out.families = f;
      }
      if (!known.gender) {
        const g = take(this.vote("gender", feats, INFER.gender));
        if (g.length) out.gender = g[0];
      }
    }
    if (area === "skin" && !known.skinType) {
      const st = take(this.vote("skinType", feats, INFER.skinType));
      if (st.length) out.skinType = st[0];
    }
    out.used = [...used].sort((a, b) => a - b);
    return out;
  }

  /** دفعة متعلّمة لكل منتج لهذا الطلب (متوسط ميزات الطلب) — مخزنة لكل بصمة. */
  affinityFor(need: Need): Map<string, number> | null {
    if (!this.affinity.size) return null;
    const sig = needSig(need);
    if (this.affCache.has(sig)) return this.affCache.get(sig)!;
    const feats = affinityFeatures(sig).filter((f) => this.affinity.has(f));
    let out: Map<string, number> | null = null;
    if (feats.length) {
      out = new Map();
      for (const f of feats) for (const [id, b] of this.affinity.get(f)!) out.set(id, (out.get(id) ?? 0) + b / feats.length);
    }
    if (this.affCache.size > 2000) this.affCache.clear();
    this.affCache.set(sig, out);
    return out;
  }
}
