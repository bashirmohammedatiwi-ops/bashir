import type { Pace } from "./train";

/**
 * متجهات كلمات تُدرَّب على نصوص كتالوجنا (PPMI + SVD عشوائي) — بلا مكتبات خارجية.
 * كلمتان تظهران في سياقات متشابهة («بشرة نضرة»، «تمنح البشرة إشراقة») تتقاربان،
 * فيفهم النموذج كلمة نادرة عبر جيرانها المعروفين.
 */

export interface EmbedOptions {
  dim?: number;
  window?: number;
  minCount?: number;
  maxVocab?: number;
  neighbors?: number;
  minCos?: number;
}

export interface EmbedResult {
  vocab: string[];
  /** لكل كلمة: أقرب الكلمات [index, cos×100]. */
  neighbors: number[][];
  dim: number;
}

/** ضرب مصفوفة متناثرة متماثلة (CSR) بمصفوفة كثيفة V×k. */
function spmm(rowPtr: Int32Array, col: Int32Array, val: Float32Array, X: Float64Array, V: number, k: number): Float64Array {
  const Y = new Float64Array(V * k);
  for (let i = 0; i < V; i++) {
    const yo = i * k;
    for (let p = rowPtr[i]; p < rowPtr[i + 1]; p++) {
      const v = val[p];
      const xo = col[p] * k;
      for (let j = 0; j < k; j++) Y[yo + j] += v * X[xo + j];
    }
  }
  return Y;
}

/** تعامد أعمدة مصفوفة V×k (Gram-Schmidt المعدّل) — في مكانها. */
function orthonormalize(Q: Float64Array, V: number, k: number) {
  for (let j = 0; j < k; j++) {
    for (let i = 0; i < j; i++) {
      let dot = 0;
      for (let r = 0; r < V; r++) dot += Q[r * k + i] * Q[r * k + j];
      for (let r = 0; r < V; r++) Q[r * k + j] -= dot * Q[r * k + i];
    }
    let n = 0;
    for (let r = 0; r < V; r++) n += Q[r * k + j] ** 2;
    n = Math.sqrt(n) || 1;
    for (let r = 0; r < V; r++) Q[r * k + j] /= n;
  }
}

/** قيم ومتجهات ذاتية لمصفوفة متماثلة صغيرة (Jacobi). */
function jacobiEigen(A: Float64Array, n: number): { values: Float64Array; vectors: Float64Array } {
  const a = Float64Array.from(A);
  const v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-18) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (Math.abs(apq) < 1e-15) continue;
        const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k * n + p];
          const akq = a[k * n + q];
          a[k * n + p] = c * akp - s * akq;
          a[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p * n + k];
          const aqk = a[q * n + k];
          a[p * n + k] = c * apk - s * aqk;
          a[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k * n + p];
          const vkq = v[k * n + q];
          v[k * n + p] = c * vkp - s * vkq;
          v[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) values[i] = a[i * n + i];
  return { values, vectors: v };
}

/** مولّد أرقام عشوائية ثابت البذرة (نتائج قابلة للتكرار). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export async function trainEmbeddings(sentences: string[][], pace: Pace, o: EmbedOptions = {}): Promise<EmbedResult> {
  const dim = o.dim ?? 64;
  const win = o.window ?? 4;
  const minCount = o.minCount ?? 3;
  const maxVocab = o.maxVocab ?? 14000;

  // ── المفردات
  const freq = new Map<string, number>();
  for (const s of sentences) for (const w of s) freq.set(w, (freq.get(w) ?? 0) + 1);
  const vocab = [...freq.entries()].filter(([, c]) => c >= minCount).sort((a, b) => b[1] - a[1]).slice(0, maxVocab).map(([w]) => w);
  const V = vocab.length;
  const id = new Map(vocab.map((w, i) => [w, i]));
  if (V < dim * 2) return { vocab: [], neighbors: [], dim };

  // ── التواجد المشترك (نافذة بأوزان 1/المسافة)
  const co = new Map<number, number>();
  let n = 0;
  for (const s of sentences) {
    const ids = s.map((w) => id.get(w) ?? -1);
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i];
      if (a < 0) continue;
      for (let d = 1; d <= win && i + d < ids.length; d++) {
        const b = ids[i + d];
        if (b < 0 || b === a) continue;
        const w = 1 / d;
        co.set(a * V + b, (co.get(a * V + b) ?? 0) + w);
        co.set(b * V + a, (co.get(b * V + a) ?? 0) + w);
      }
    }
    if (++n % 300 === 0) await pace();
  }

  // ── PPMI (توزيع السياق منعَّم بأس 0.75)
  const rowSum = new Float64Array(V);
  for (const [key, c] of co) rowSum[Math.floor(key / V)] += c;
  const ctxPow = rowSum.map((x) => x ** 0.75);
  const ctxTotal = ctxPow.reduce((a, b) => a + b, 0);
  const total = rowSum.reduce((a, b) => a + b, 0);
  const rows: [number, number][][] = Array.from({ length: V }, () => []);
  let m = 0;
  for (const [key, c] of co) {
    const i = Math.floor(key / V);
    const j = key - i * V;
    const pmi = Math.log((c * ctxTotal) / (rowSum[i] * ctxPow[j])) - Math.log(total / total);
    if (pmi > 0) rows[i].push([j, pmi]);
    if (++m % 50000 === 0) await pace();
  }
  co.clear();
  const nnz = rows.reduce((a, r) => a + r.length, 0);
  const rowPtr = new Int32Array(V + 1);
  const col = new Int32Array(nnz);
  const val = new Float32Array(nnz);
  let p = 0;
  for (let i = 0; i < V; i++) {
    rowPtr[i] = p;
    for (const [j, x] of rows[i]) {
      col[p] = j;
      val[p++] = x;
    }
    rows[i] = [];
  }
  rowPtr[V] = p;
  await pace();

  // ── SVD عشوائي: Q ≈ أهم اتجاهات المصفوفة، ثم تحليل ذاتي صغير.
  const k = dim + 12;
  const rand = rng(17);
  let Q: Float64Array = new Float64Array(V * k);
  for (let i = 0; i < Q.length; i++) Q[i] = rand() - 0.5;
  for (let it = 0; it < 3; it++) {
    Q = spmm(rowPtr, col, val, Q, V, k);
    await pace();
    orthonormalize(Q, V, k);
    await pace();
  }
  const MQ = spmm(rowPtr, col, val, Q, V, k);
  // B = Qᵀ M Q (k×k متماثلة)
  const B = new Float64Array(k * k);
  for (let r = 0; r < V; r++) {
    const qo = r * k;
    for (let i = 0; i < k; i++) {
      const qi = Q[qo + i];
      if (!qi) continue;
      for (let j = 0; j < k; j++) B[i * k + j] += qi * MQ[qo + j];
    }
  }
  await pace();
  const { values, vectors } = jacobiEigen(B, k);
  const order = [...values.keys()].sort((a, b) => values[b] - values[a]).slice(0, dim);
  // متجه الكلمة = Q · U · √λ ، ثم تطبيع لطول 1.
  const E = new Float32Array(V * dim);
  for (let r = 0; r < V; r++) {
    for (let d = 0; d < dim; d++) {
      const c = order[d];
      const s = Math.sqrt(Math.max(0, values[c]));
      let x = 0;
      for (let i = 0; i < k; i++) x += Q[r * k + i] * vectors[i * k + c];
      E[r * dim + d] = x * s;
    }
    let nn = 0;
    for (let d = 0; d < dim; d++) nn += E[r * dim + d] ** 2;
    nn = Math.sqrt(nn) || 1;
    for (let d = 0; d < dim; d++) E[r * dim + d] /= nn;
    if (r % 500 === 0) await pace();
  }

  // ── أقرب الجيران لكل كلمة (تُخزَّن جاهزة — لا حساب أثناء المحادثة).
  const K = o.neighbors ?? 8;
  const minCos = o.minCos ?? 0.45;
  const neighbors: number[][] = [];
  const sims = new Float32Array(V);
  for (let a = 0; a < V; a++) {
    const ao = a * dim;
    for (let b = 0; b < V; b++) {
      let s = 0;
      const bo = b * dim;
      for (let d = 0; d < dim; d++) s += E[ao + d] * E[bo + d];
      sims[b] = s;
    }
    sims[a] = -1;
    const top: number[] = [];
    for (let t = 0; t < K; t++) {
      let best = -1;
      let bv = minCos;
      for (let b = 0; b < V; b++) if (sims[b] > bv) {
        bv = sims[b];
        best = b;
      }
      if (best < 0) break;
      top.push(best, Math.round(bv * 100));
      sims[best] = -1;
    }
    neighbors.push(top);
    if (a % 40 === 0) await pace();
  }
  return { vocab, neighbors, dim };
}
