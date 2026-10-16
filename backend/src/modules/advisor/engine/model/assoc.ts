import { FacetTable, FeatureStats, MODEL_FACETS, ModelFacet } from "./types";

const FACET_IDX = new Map<string, number>(MODEL_FACETS.map((f, i) => [f, i]));

interface FeatFacet {
  nf: number;
  by: Map<number, number>;
}

export interface Scored {
  label: string;
  p: number;
}

/**
 * نموذج ترابط الكلمات بالصفات (Naive Bayes بصيغة «خبراء»):
 * لكل كلمة نعرف كم ظهرت في منتجات كل مجال، وكم مرة مع كل صفة.
 * الاحتمال اللاحق لصفة = المسبق × ما تضيفه كل كلمة (P(L|w)/P(L)) — مُنعَّم.
 */
export class Assoc {
  readonly labels: string[][] = MODEL_FACETS.map(() => []);
  private readonly labelIdx: Map<string, number>[] = MODEL_FACETS.map(() => new Map());
  readonly counts: number[][] = MODEL_FACETS.map(() => []);
  readonly totals: number[] = MODEL_FACETS.map(() => 0);
  readonly feats = new Map<string, Map<number, FeatFacet>>();

  /** وثيقة تدريب: ميزات بأوزانها (حقل الاسم أقوى من الوصف) وصفاتها المؤكدة. */
  add(features: Map<string, number>, labels: string[], w = 1) {
    const byFacet = new Map<number, number[]>();
    for (const l of labels) {
      const c = l.indexOf(":");
      const fi = FACET_IDX.get(l.slice(0, c));
      if (fi == null) continue;
      const id = l.slice(c + 1);
      let li = this.labelIdx[fi].get(id);
      if (li == null) {
        li = this.labels[fi].length;
        this.labels[fi].push(id);
        this.labelIdx[fi].set(id, li);
        this.counts[fi].push(0);
      }
      const list = byFacet.get(fi) ?? [];
      if (!list.includes(li)) list.push(li);
      byFacet.set(fi, list);
    }
    if (!byFacet.size) return;
    for (const [fi, lis] of byFacet) {
      // وثيقة بعدة صفات في نفس المجال تُقسَم بينها (حتى لا تُضخَّم).
      const share = w / lis.length;
      this.totals[fi] += w;
      for (const li of lis) this.counts[fi][li] += share;
    }
    for (const [feat, fw] of features) {
      let m = this.feats.get(feat);
      if (!m) this.feats.set(feat, (m = new Map()));
      for (const [fi, lis] of byFacet) {
        let e = m.get(fi);
        if (!e) m.set(fi, (e = { nf: 0, by: new Map() }));
        const x = w * fw;
        e.nf += x;
        const share = x / lis.length;
        for (const li of lis) e.by.set(li, (e.by.get(li) ?? 0) + share);
      }
    }
  }

  /** كلمات نادرة جداً تُحذف (ضجيج، وتكبّر النموذج بلا فائدة). */
  prune(minNf = 1.5) {
    for (const [feat, m] of this.feats) {
      for (const [fi, e] of m) if (e.nf < minNf) m.delete(fi);
      if (!m.size) this.feats.delete(feat);
    }
  }

  /**
   * الاحتمال اللاحق لصفات مجال من ميزات نص. `allowed` يحصر الصفات المرشحة
   * (مثلاً أنواع مجال الشعر فقط). يعيد أيضاً «الدليل»: مجموع ظهور الكلمات المساهمة.
   */
  score(
    facet: ModelFacet,
    features: string[] | Map<string, number>,
    opts: { allowed?: Set<string>; minNf?: number; alpha?: number } = {},
  ): { ranked: Scored[]; evidence: number; used: string[] } {
    const fi = FACET_IDX.get(facet)!;
    const labels = this.labels[fi];
    const total = this.totals[fi];
    if (!labels.length || !total) return { ranked: [], evidence: 0, used: [] };
    const alpha = opts.alpha ?? 1.5;
    const minNf = opts.minNf ?? 2;
    const cand: number[] = [];
    for (let i = 0; i < labels.length; i++) if (!opts.allowed || opts.allowed.has(labels[i])) cand.push(i);
    if (!cand.length) return { ranked: [], evidence: 0, used: [] };
    const prior = cand.map((i) => Math.max(1e-6, this.counts[fi][i] / total));
    const logit = prior.map((p) => Math.log(p));
    let evidence = 0;
    const used: string[] = [];
    // كل ميزة بوزنها: كلمة الرسالة نفسها 1، وجارها في المعنى (من المتجهات) أقل.
    const weighted = features instanceof Map ? features : new Map(features.map((f) => [f, 1]));
    for (const [f, w] of weighted) {
      const e = this.feats.get(f)?.get(fi);
      if (!e || e.nf < minNf) continue;
      let informative = false;
      for (let k = 0; k < cand.length; k++) {
        const n = e.by.get(cand[k]) ?? 0;
        const pl = (n + alpha * prior[k]) / (e.nf + alpha);
        const lift = pl / prior[k];
        if (lift > 1.6 && n >= 1) informative = true;
        logit[k] += w * Math.log(lift);
      }
      evidence += w * e.nf;
      if (informative) used.push(f);
    }
    const mx = Math.max(...logit);
    const ex = logit.map((x) => Math.exp(x - mx));
    const z = ex.reduce((a, b) => a + b, 0);
    const ranked = cand.map((i, k) => ({ label: labels[i], p: ex[k] / z })).sort((a, b) => b.p - a.p);
    return { ranked, evidence, used };
  }

  /**
   * أقوى صفة لكلمة واحدة ضمن المرشحين: احتمالها مع الكلمة (مُنعَّم)، رفعها عن نسبتها العامة،
   * وعدد مرات ظهورها معها. يُستخدم لفهم رسائل الزبونات القصيرة (قرار كلمة بكلمة، دقيق).
   */
  best(facet: ModelFacet, feature: string, allowed?: Set<string>): { label: string; p: number; lift: number; n: number; score: number } | null {
    const fi = FACET_IDX.get(facet)!;
    const e = this.feats.get(feature)?.get(fi);
    if (!e || !this.totals[fi]) return null;
    let tot = 0;
    let priorTot = 0;
    for (const [li, n] of e.by) if (!allowed || allowed.has(this.labels[fi][li])) tot += n;
    for (let li = 0; li < this.labels[fi].length; li++) if (!allowed || allowed.has(this.labels[fi][li])) priorTot += this.counts[fi][li];
    if (!tot || !priorTot) return null;
    // الترتيب بالاحتمال × لوغاريتم الرفع: صفة شائعة مع الكلمة لا تكفي، يجب أن تكون مميزة لها
    // («زيت» تظهر مع البلسم كثيراً، لكنها علامة زيت الشعر بالذات).
    let best: { label: string; p: number; lift: number; n: number; score: number } | null = null;
    for (const [li, n] of e.by) {
      const label = this.labels[fi][li];
      if (allowed && !allowed.has(label)) continue;
      const prior = this.counts[fi][li] / priorTot;
      const p = (n + 1.5 * prior) / (tot + 1.5);
      const lift = p / prior;
      const score = lift > 1 ? p * Math.log(lift) : 0;
      if (!best || score > best.score) best = { label, p, lift, n, score };
    }
    return best;
  }

  /** عدد الوثائق التي فيها الكلمة ضمن مجال (لمعرفة هل نعرفها أصلاً). */
  nf(facet: ModelFacet, feature: string): number {
    return this.feats.get(feature)?.get(FACET_IDX.get(facet)!)?.nf ?? 0;
  }

  /** أقوى صفة ترتبط بها كلمة واحدة في مجال: نسبة الرفع وعدد الظهور معها. */
  top(facet: ModelFacet, feature: string): { label: string; lift: number; n: number } | null {
    const fi = FACET_IDX.get(facet)!;
    const e = this.feats.get(feature)?.get(fi);
    if (!e || !this.totals[fi]) return null;
    let best: { label: string; lift: number; n: number } | null = null;
    for (const [li, n] of e.by) {
      const prior = this.counts[fi][li] / this.totals[fi];
      const lift = (n + 1.5 * prior) / (e.nf + 1.5) / prior;
      if (!best || lift > best.lift) best = { label: this.labels[fi][li], lift, n };
    }
    return best;
  }

  toData(round = 2): { facets: Record<ModelFacet, FacetTable>; features: Record<string, FeatureStats> } {
    const r = (x: number) => Math.round(x * 10 ** round) / 10 ** round;
    const facets = {} as Record<ModelFacet, FacetTable>;
    MODEL_FACETS.forEach((f, fi) => (facets[f] = { labels: this.labels[fi], counts: this.counts[fi].map((x) => r(x)), total: r(this.totals[fi]) }));
    const features: Record<string, FeatureStats> = {};
    for (const [feat, m] of this.feats) {
      const f: number[][] = [];
      for (const [fi, e] of m) {
        const row = [fi, r(e.nf)];
        for (const [li, n] of e.by) if (n >= 0.05) row.push(li, r(n));
        f.push(row);
      }
      features[feat] = { f };
    }
    return { facets, features };
  }

  static fromData(facets: Record<string, FacetTable>, features: Record<string, FeatureStats>): Assoc {
    const a = new Assoc();
    MODEL_FACETS.forEach((f, fi) => {
      const t = facets[f];
      if (!t) return;
      a.labels[fi].push(...t.labels);
      t.labels.forEach((l, i) => a.labelIdx[fi].set(l, i));
      a.counts[fi].push(...t.counts);
      a.totals[fi] = t.total;
    });
    for (const [feat, s] of Object.entries(features)) {
      const m = new Map<number, FeatFacet>();
      for (const row of s.f) {
        const by = new Map<number, number>();
        for (let k = 2; k + 1 < row.length; k += 2) by.set(row[k], row[k + 1]);
        m.set(row[0], { nf: row[1], by });
      }
      a.feats.set(feat, m);
    }
    return a;
  }
}
