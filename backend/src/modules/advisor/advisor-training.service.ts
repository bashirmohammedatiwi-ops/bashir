import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { join } from "path";
import { Worker } from "worker_threads";
import { PrismaService } from "../../common/prisma.service";
import { AdvisorService } from "./advisor.service";
import { weakUnderstanding } from "./engine/confidence";
import { FacetKey, facetValue } from "./engine/lexicon";
import { ModelRuntime } from "./engine/model/runtime";
import type { ModelData } from "./engine/model/types";
import type { EvalSummary, WorkerResult } from "./engine/model/train.worker";
import { understand } from "./engine/nlu";
import { normalize } from "./engine/text";

/** مفتاح النموذج المحفوظ (والسابق للرجوع إليه). */
const MODEL_KEY = "model:deema";
const PREV_KEY = "model:deema:prev";
const MODEL_NAME = "deema-inhouse-1";
const TICK_MS = 10 * 60_000;
/** أقل فاصل بين تدريبين تلقائيين، وأقصى عمر للنموذج قبل إعادة التدريب. */
const MIN_GAP_MS = 3 * 3_600_000;
const MAX_AGE_MS = 24 * 3_600_000;
const WORKER_TIMEOUT_MS = 15 * 60_000;

const FIELD_FACET: Record<string, FacetKey> = {
  area: "area", kinds: "kind", concerns: "concern", skinType: "skinType", gender: "gender", families: "family",
  ingredients: "ingredient", freeFrom: "freeFrom", attrs: "attr", finish: "finish", time: "time", occasion: "occasion", recipient: "recipient",
};
const INTENT_AR: Record<string, string> = { routine: "روتين", gift: "هدية", similar: "بديل/يشبه", knowledge: "سؤال معرفي", info: "سؤال معرفي" };

/** المعنى بالعربي للوحة التحكم: «🧴 مرطب · 💧 جافة · حتى 25,000». */
function meaningOf(delta: Record<string, unknown>, intent: string | null): string[] {
  const out: string[] = [];
  if (intent && INTENT_AR[intent]) out.push(INTENT_AR[intent]);
  for (const [k, v] of Object.entries(delta ?? {})) {
    const facet = FIELD_FACET[k];
    const vals = Array.isArray(v) ? v : [v];
    if (facet) {
      for (const id of vals) {
        const fv = facetValue(facet, String(id));
        out.push(k === "freeFrom" ? `بدون ${fv?.label ?? id}` : fv ? `${fv.emoji ? fv.emoji + " " : ""}${fv.label}` : String(id));
      }
    } else if (k === "maxPrice" && typeof v === "number") out.push(`حتى ${v.toLocaleString("en-US")} د.ع`);
    else if (k === "minPrice" && typeof v === "number") out.push(`فوق ${v.toLocaleString("en-US")} د.ع`);
    else if (k === "brands") out.push(`براند (${vals.length})`);
    else if (k === "free") out.push(...vals.map((w) => `«${w}»`));
  }
  return out;
}

interface StoredModel {
  model: ModelData;
  evalBefore: EvalSummary;
  evalAfter: EvalSummary;
  /** بصمة البيانات التي دُرّب عليها (لمعرفة هل تغيّر شيء يستحق إعادة التدريب). */
  dataSig: string;
}

/**
 * «تدريب ديما» — داخلي بالكامل على السيرفر، بلا أي خدمة خارجية:
 * يتعلّم من الكتالوج (أسماء، أقسام، أوصاف)، ومن العبارات المحفوظة، ومن تفاعل الزبونات
 * (فتح/سلة/إعجاب). يعمل في خيط منفصل بأقل أولوية وبنصف نواة كحد أقصى، تلقائياً كل ليلة
 * أو حين تتغير البيانات، ويدخل النموذج الجديد الخدمة فوراً بلا إعادة تشغيل.
 */
@Injectable()
export class AdvisorTrainingService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("AdvisorTraining");
  private timer?: NodeJS.Timeout;
  private worker: Worker | null = null;
  private trainingSince = 0;
  private stored: Omit<StoredModel, "model"> & { trainedAt: number; stats: ModelData["stats"] } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly advisor: AdvisorService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    // النموذج المحفوظ يدخل الخدمة بعد الإقلاع بقليل (لا نزاحم بناء الفهرس الأول).
    setTimeout(() => this.boot().catch((e) => this.log.warn(`boot: ${e.message}`)), 20_000).unref?.();
    this.timer = setInterval(() => this.tick().catch((e) => this.log.warn(`tick: ${e.message}`)), TICK_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    void this.worker?.terminate();
  }

  // ───────────────────────────── الإعدادات

  /**
   * `running`: التدريب التلقائي (ليلي + عند تغير البيانات). `liveAi`: فهم النموذج أثناء المحادثة.
   * `autoNew`: ملء صفات المنتجات الناقصة بما استنتجه النموذج.
   */
  async settings() {
    const row =
      (await this.prisma.advisorTraining.findUnique({ where: { id: "main" } })) ??
      (await this.prisma.advisorTraining.create({ data: { id: "main", tasks: [], running: true } }));
    this.advisor.setModelLive(row.liveAi);
    return row;
  }

  async update(patch: { running?: boolean; liveAi?: boolean; autoNew?: boolean }) {
    await this.settings();
    const data: Record<string, unknown> = {};
    if (patch.running != null) {
      data.running = patch.running;
      if (patch.running) data.startedAt = new Date();
    }
    if (patch.liveAi != null) data.liveAi = patch.liveAi;
    if (patch.autoNew != null) data.autoNew = patch.autoNew;
    const before = await this.prisma.advisorTraining.findUnique({ where: { id: "main" } });
    await this.prisma.advisorTraining.update({ where: { id: "main" }, data });
    const s = await this.settings();
    // تغيّر استخدام الإثراء: نعيد بناء الفهرس ليدخل/يخرج.
    if (patch.autoNew != null && before?.autoNew !== patch.autoNew) this.applyModel(this.advisor.currentModel(), s.autoNew);
    if (patch.running && !this.worker) setTimeout(() => this.train("start").catch(() => undefined), 500).unref?.();
    return s;
  }

  // ───────────────────────────── الحلقة

  private applyModel(rt: ModelRuntime | null, enrich: boolean) {
    // بلا إثراء: نموذج فهم وترتيب فقط (نسخة بلا صفات المنتجات).
    const model = rt && !enrich ? new ModelRuntime({ ...rt.data, enrich: {} }) : rt;
    this.advisor.setModel(model, { rebuild: true });
  }

  private async boot() {
    const s = await this.settings();
    const row = await this.prisma.advisorEnrichment.findUnique({ where: { key: MODEL_KEY } }).catch(() => null);
    if (row?.data) {
      const st = row.data as unknown as StoredModel;
      if (st.model?.version === 1) {
        this.remember(st);
        this.applyModel(new ModelRuntime(st.model), s.autoNew);
        this.log.log(`Deema model loaded (trained ${new Date(st.model.trainedAt).toISOString()})`);
        return;
      }
    }
    // أول تشغيل بلا نموذج: التدريب التلقائي يُفعَّل ونتدرّب مرة الآن (بعد أن يجهز الفهرس).
    if (!s.running) await this.prisma.advisorTraining.update({ where: { id: "main" }, data: { running: true, startedAt: new Date() } }).catch(() => undefined);
    setTimeout(() => this.train("first").catch((e) => this.log.warn(`first training: ${e.message}`)), 60_000).unref?.();
  }

  private remember(st: StoredModel) {
    this.stored = { evalBefore: st.evalBefore, evalAfter: st.evalAfter, dataSig: st.dataSig, trainedAt: st.model.trainedAt, stats: st.model.stats };
  }

  /** بصمة رخيصة لبيانات التدريب: الكتالوج + العبارات + التفاعل. */
  private async dataSig(): Promise<{ sig: string; events: number }> {
    const [p, ph, ev] = await Promise.all([
      this.prisma.product.aggregate({ where: { isActive: true }, _count: { _all: true }, _max: { updatedAt: true } }),
      this.prisma.advisorPhrase.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }).catch(() => null),
      this.prisma.advisorEvent.count().catch(() => 0),
    ]);
    // التفاعل بدرجات (كل 25 حدثاً) حتى لا يُعاد التدريب لكل نقرة.
    const sig = [p._count._all, p._max.updatedAt?.getTime() ?? 0, ph?._count._all ?? 0, ph?._max.updatedAt?.getTime() ?? 0, Math.floor(ev / 25)].join("|");
    return { sig, events: ev };
  }

  /**
   * كل 10 دقائق: هل يستحق النموذج إعادة تدريب؟ بلا نموذج ← الآن. تغيّرت البيانات أو مرّ يوم ←
   * في ساعات الليل (2–7 بتوقيت بغداد، الزحمة أقل)، وإن طال الانتظار أكثر من 30 ساعة ← الآن.
   */
  private async tick() {
    const s = await this.settings();
    if (!s.running || this.worker) return;
    if (!this.stored) return void (await this.train("schedule"));
    const age = Date.now() - this.stored.trainedAt;
    if (age < MIN_GAP_MS) return;
    const { sig } = await this.dataSig();
    if (sig === this.stored.dataSig && age < MAX_AGE_MS) return;
    const hour = (new Date().getUTCHours() + 3) % 24;
    if ((hour >= 2 && hour <= 7) || age > 30 * 3_600_000) await this.train("schedule");
  }

  /** تدريب كامل في خيط منفصل. يعيد ملخص النتائج أو null إن كان تدريب آخر جارياً. */
  async train(reason: string): Promise<{ trainedAt: number; evalBefore: EvalSummary; evalAfter: EvalSummary } | null> {
    if (this.worker) return null;
    this.trainingSince = Date.now();
    try {
      const [{ raw }, phrases, events, { sig }] = await Promise.all([
        this.advisor.loadRows(false),
        this.prisma.advisorPhrase.findMany({ select: { phrase: true, delta: true, source: true } }).catch(() => []),
        this.prisma.advisorEvent
          .groupBy({
            by: ["productId", "type", "sig"],
            where: { createdAt: { gte: new Date(Date.now() - 120 * 86_400_000) }, productId: { not: null } },
            _count: { _all: true },
          })
          .catch(() => [] as { productId: string | null; type: string; sig: string | null; _count: { _all: number } }[]),
        this.dataSig(),
      ]);
      const workerData = {
        rows: raw,
        phrases,
        events: events.filter((e) => e.productId).map((e) => ({ productId: e.productId!, type: e.type, sig: e.sig, n: e._count._all })),
      };
      const result = await this.runWorker(workerData);
      const stored: StoredModel = { model: result.model, evalBefore: result.evalBefore, evalAfter: result.evalAfter, dataSig: sig };
      const prev = await this.prisma.advisorEnrichment.findUnique({ where: { key: MODEL_KEY } }).catch(() => null);
      if (prev) {
        await this.prisma.advisorEnrichment.upsert({
          where: { key: PREV_KEY },
          create: { key: PREV_KEY, type: "model", data: prev.data as object, sourceHash: prev.sourceHash, model: MODEL_NAME },
          update: { data: prev.data as object, sourceHash: prev.sourceHash },
        });
      }
      await this.prisma.advisorEnrichment.upsert({
        where: { key: MODEL_KEY },
        create: { key: MODEL_KEY, type: "model", data: stored as unknown as object, sourceHash: sig.slice(0, 190), model: MODEL_NAME },
        update: { data: stored as unknown as object, sourceHash: sig.slice(0, 190), model: MODEL_NAME },
      });
      this.remember(stored);
      const s = await this.settings();
      this.applyModel(new ModelRuntime(result.model), s.autoNew);
      await this.prisma.advisorTraining.update({ where: { id: "main" }, data: { lastRunAt: new Date(), lastError: null } }).catch(() => undefined);
      const st = result.model.stats;
      this.log.log(
        `Deema trained (${reason}) in ${Math.round((Date.now() - this.trainingSince) / 1000)}s: ${st.products} products, ${st.features} words, ` +
          `${st.enriched} enriched, ${st.affinityKeys} ranking keys · eval ${result.evalBefore.accuracy} → ${result.evalAfter.accuracy}`,
      );
      // أسئلة لم تُفهم سابقاً: هل يفهمها النموذج الجديد؟
      setTimeout(() => this.recheckQuestions().catch(() => undefined), 3 * 60_000).unref?.();
      return { trainedAt: result.model.trainedAt, evalBefore: result.evalBefore, evalAfter: result.evalAfter };
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      this.log.warn(`Deema training failed: ${msg}`);
      await this.prisma.advisorTraining.update({ where: { id: "main" }, data: { lastError: msg.slice(0, 300) } }).catch(() => undefined);
      return null;
    } finally {
      this.trainingSince = 0;
    }
  }

  private runWorker(workerData: unknown): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const w = new Worker(join(__dirname, "engine", "model", "train.worker.js"), {
        workerData,
        // ذاكرة محدودة: السيرفر مشترك مع تطبيقات أخرى.
        resourceLimits: { maxOldGenerationSizeMb: 768 },
      });
      this.worker = w;
      const timer = setTimeout(() => {
        void w.terminate();
        reject(new Error("training timed out"));
      }, WORKER_TIMEOUT_MS);
      const done = () => {
        clearTimeout(timer);
        this.worker = null;
      };
      w.once("message", (m: { ok: boolean; result?: WorkerResult; error?: string }) => {
        done();
        void w.terminate();
        if (m.ok && m.result) resolve(m.result);
        else reject(new Error(m.error ?? "training failed"));
      });
      w.once("error", (e) => {
        done();
        reject(e);
      });
      w.once("exit", (code) => {
        if (this.worker === w) {
          done();
          reject(new Error(`training worker exited (${code})`));
        }
      });
    });
  }

  /** الأسئلة المفتوحة التي صار النموذج يفهمها تُعلَّم «مفهومة» (والباقي يبقى للمراجعة). */
  private async recheckQuestions() {
    const idx = await this.advisor.catalog();
    const open = await this.prisma.advisorQueryLog.findMany({ where: { resolved: false }, take: 500, orderBy: { count: "desc" } });
    let fixed = 0;
    for (const q of open) {
      if (weakUnderstanding(q.sample, idx)) continue;
      await this.prisma.advisorQueryLog.update({ where: { id: q.id }, data: { resolved: true } }).catch(() => undefined);
      fixed++;
      // لا نحجز الخيط الرئيسي طويلاً.
      if (fixed % 20 === 0) await new Promise((r) => setTimeout(r, 50));
    }
    if (fixed) this.log.log(`Deema now understands ${fixed} previously unclear questions`);
  }

  // ───────────────────────────── التقدّم (للوحة التحكم)

  async status() {
    const [s, phrasesBySource, openQ, resolvedQ, events] = await Promise.all([
      this.settings(),
      this.prisma.advisorPhrase.groupBy({ by: ["source"], _count: { _all: true } }).catch(() => []),
      this.prisma.advisorQueryLog.count({ where: { resolved: false } }).catch(() => 0),
      this.prisma.advisorQueryLog.count({ where: { resolved: true } }).catch(() => 0),
      this.prisma.advisorEvent.count().catch(() => 0),
    ]);
    const phrases: Record<string, number> = Object.fromEntries(phrasesBySource.map((r) => [r.source, r._count._all]));
    const m = this.stored;
    const idx = await this.advisor.catalog().catch(() => null);
    return {
      engine: "inhouse",
      model: MODEL_NAME,
      running: s.running,
      liveAi: s.liveAi,
      autoNew: s.autoNew,
      startedAt: s.startedAt,
      lastRunAt: s.lastRunAt,
      lastError: s.lastError,
      state: this.worker ? "training" : !m ? "untrained" : !s.running ? "stopped" : "ready",
      trainingSince: this.trainingSince || null,
      trainedAt: m?.trainedAt ?? null,
      evalBefore: m?.evalBefore ?? null,
      evalAfter: m?.evalAfter ?? null,
      stats: m?.stats ?? null,
      catalog: { products: idx?.products.length ?? 0 },
      progress: {
        phrases: { total: Object.values(phrases).reduce((a, b) => a + b, 0), bySource: phrases },
        questions: { open: openQ, resolved: resolvedQ },
        events,
      },
    };
  }

  async phrases(source?: string, q?: string, take = 100) {
    const rows = await this.prisma.advisorPhrase.findMany({
      where: { ...(source ? { source } : {}), ...(q ? { phrase: { contains: normalize(q) } } : {}) },
      orderBy: { updatedAt: "desc" },
      take: Math.min(300, take),
    });
    return rows.map((r) => ({ ...r, meaning: meaningOf(r.delta as Record<string, unknown>, r.intent) }));
  }

  /** جرّبي رسالة: ماذا تفهم «ديما» منها الآن (المعجم + النموذج المدرَّب)، وهل بقي فهمها ضعيفاً؟ */
  async tryMessage(message: string) {
    const idx = await this.advisor.catalog();
    const text = String(message ?? "").slice(0, 400);
    const p = understand(text, idx);
    const delta = { ...p.delta } as Record<string, unknown>;
    // ما أضافه النموذج تحديداً (للمقارنة).
    const model = idx.model;
    idx.model = undefined;
    const lexOnly = understand(text, idx);
    idx.model = model;
    const byModel = meaningOf(delta, null).filter((x) => !meaningOf({ ...lexOnly.delta } as Record<string, unknown>, null).includes(x));
    return {
      intent: p.intent,
      meaning: meaningOf(delta, null),
      byModel,
      unknownWords: (p.delta.free ?? []) as string[],
      weak: weakUnderstanding(text, idx),
    };
  }

  async deletePhrase(id: string) {
    await this.prisma.advisorPhrase.delete({ where: { id } }).catch(() => undefined);
    this.advisor.markDirty();
    return { ok: true };
  }

  async questions(take = 100) {
    return this.prisma.advisorQueryLog.findMany({ orderBy: [{ resolved: "asc" }, { count: "desc" }, { lastAt: "desc" }], take: Math.min(300, take) });
  }
}
