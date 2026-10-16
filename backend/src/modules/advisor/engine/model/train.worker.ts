import { setPriority } from "os";
import { parentPort, workerData } from "worker_threads";
import { CatalogIndex, RawProduct } from "../catalog";
import { evaluate } from "../../eval/evaluate";
import { buildTrainInput, DatasetRaw } from "./dataset";
import { ModelRuntime } from "./runtime";
import { pacer, trainModel } from "./train";
import type { ModelData } from "./types";

/**
 * خيط تدريب «ديما» — منفصل عن خيط الخادم، بأقل أولوية للمعالج، ويستريح نصف وقته:
 * الخادم يبقى يجاوب بنفس السرعة أثناء التدريب، وباقي تطبيقات السيرفر لا تتأثر.
 *
 * 1) يبني فهرساً بلا النموذج ويقيس مجموعة التقييم (قبل).
 * 2) يدرّب النموذج.
 * 3) يبني فهرساً بالنموذج ويقيس نفس الأسئلة (بعد).
 */

export interface WorkerResult {
  model: ModelData;
  evalBefore: EvalSummary;
  evalAfter: EvalSummary;
}

export interface EvalSummary {
  accuracy: number;
  dev: number;
  test: number;
  p5: number;
  meanMs: number;
  p95Ms: number;
  n: number;
}

function summary(catalog: CatalogIndex): EvalSummary {
  const r = evaluate(catalog);
  const s = (k: string) => (r.bySplit[k]?.n ? r.bySplit[k].ok / r.bySplit[k].n : 0);
  const round = (x: number) => Math.round(x * 1000) / 1000;
  return {
    accuracy: round(r.accuracy),
    dev: round(s("dev")),
    test: round(s("test")),
    p5: round(r.p5),
    meanMs: Math.round(r.latency.mean * 100) / 100,
    p95Ms: Math.round(r.latency.p95 * 100) / 100,
    n: r.n,
  };
}

async function main() {
  try {
    // أقل أولوية (nice 19) لهذا الخيط وحده على لينكس.
    setPriority(19);
  } catch {
    /* بيئة لا تسمح — نكتفي بالاستراحات */
  }
  const raw = workerData as DatasetRaw;
  const pace = pacer(40, 40);
  const rows: RawProduct[] = raw.rows.map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));

  const before = CatalogIndex.build(rows);
  const evalBefore = summary(before);
  await pace();

  const input = buildTrainInput({ ...raw, rows }, before);
  const model = await trainModel(input, pace);

  const rt = new ModelRuntime(model);
  const after = CatalogIndex.build(rows.map((r) => ({ ...r, enrich: r.enrich ?? rt.enrichFor(r.id) ?? null })));
  after.model = rt;
  const evalAfter = summary(after);

  const out: WorkerResult = { model, evalBefore, evalAfter };
  parentPort?.postMessage({ ok: true, result: out });
}

main().catch((e) => parentPort?.postMessage({ ok: false, error: String((e as Error)?.message ?? e) }));
