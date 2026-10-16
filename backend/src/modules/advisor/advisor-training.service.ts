import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AdvisorAiService } from "./advisor-ai.service";
import { AdvisorService } from "./advisor.service";
import { aiToDelta, BATCH_PARSE_SYSTEM, BRAND_SYSTEM, cleanAiParse, cleanEnrich, ENRICH_SYSTEM, LANGUAGE_SYSTEM, needsAi } from "./engine/ai";
import { brandTier } from "./engine/brands";
import { FacetKey, facetValue, LEXICON } from "./engine/lexicon";
import { understand } from "./engine/nlu";
import { normalize } from "./engine/text";

export type TrainingTask = "products" | "brands" | "queries" | "language";
const ALL_TASKS: TrainingTask[] = ["products", "brands", "queries", "language"];
const TICK_MS = 40_000;

/** بصمة نص المنتج — تتغيّر إن عُدّل اسمه أو وصفه فيُعاد فهمه. */
export function textHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

const LANG_FACETS = new Set(["kind", "concern", "family", "ingredient", "skinType", "finish", "attr", "freeFrom"]);

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

/**
 * «تدريب ديما»: الذكاء الاصطناعي يدرّسها على دفعات صغيرة متى شغّلتِ التدريب:
 * يفهم المنتجات من أوصافها، يقيّم البراندات، يعلّمها عبارات الزبونات العراقية،
 * ويحوّل كل سؤال لم تفهمه إلى معرفة محفوظة — فتفهمه بعدها بنفسها مجاناً.
 */
@Injectable()
export class AdvisorTrainingService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("AdvisorTraining");
  private timer?: NodeJS.Timeout;
  private busy = false;
  private turn = 0;
  private enrichedHash = new Map<string, string>();
  private hashLoadedAt = 0;
  private learnedSinceRebuild = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AdvisorAiService,
    private readonly advisor: AdvisorService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => this.tick().catch((e) => this.log.warn(`tick: ${e.message}`)), TICK_MS);
    this.timer.unref?.();
    this.settings().catch(() => undefined);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ───────────────────────────── الإعدادات

  async settings() {
    const row =
      (await this.prisma.advisorTraining.findUnique({ where: { id: "main" } })) ??
      (await this.prisma.advisorTraining.create({ data: { id: "main", tasks: ALL_TASKS } }));
    this.ai.setDailyEnrichCap(row.dailyBatches);
    this.ai.liveAi = row.liveAi;
    return row;
  }

  async update(patch: { running?: boolean; liveAi?: boolean; autoNew?: boolean; dailyBatches?: number; tasks?: string[] }) {
    await this.settings();
    const data: Record<string, unknown> = {};
    if (patch.running != null) {
      data.running = patch.running;
      if (patch.running) data.startedAt = new Date();
    }
    if (patch.liveAi != null) data.liveAi = patch.liveAi;
    if (patch.autoNew != null) data.autoNew = patch.autoNew;
    if (patch.dailyBatches != null) data.dailyBatches = Math.max(0, Math.min(2000, Math.round(patch.dailyBatches)));
    if (patch.tasks) data.tasks = patch.tasks.filter((t): t is TrainingTask => ALL_TASKS.includes(t as TrainingTask));
    await this.prisma.advisorTraining.update({ where: { id: "main" }, data });
    const s = await this.settings();
    if (patch.running) setTimeout(() => this.tick().catch(() => undefined), 500).unref?.();
    return s;
  }

  // ───────────────────────────── الحلقة

  private async tick() {
    if (this.busy || !this.ai.enabled) return;
    this.busy = true;
    try {
      const s = await this.settings();
      const tasks = (Array.isArray(s.tasks) ? (s.tasks as string[]) : ALL_TASKS).filter((t): t is TrainingTask => ALL_TASKS.includes(t as TrainingTask));
      // التدريب متوقف: المنتجات الجديدة فقط تُفهم تلقائياً (إن فُعّل ذلك).
      const active: TrainingTask[] = s.running ? tasks : s.autoNew ? ["products"] : [];
      if (!active.length || this.ai.remainingToday().train <= 0) return;
      for (let k = 0; k < active.length; k++) {
        const task = active[(this.turn + k) % active.length];
        const did = await this.run(task, !s.running);
        if (did) {
          this.turn = (this.turn + k + 1) % active.length;
          await this.prisma.advisorTraining.update({ where: { id: "main" }, data: { lastRunAt: new Date(), lastError: null } });
          break;
        }
      }
      // معرفة جديدة كافية؟ نعيد بناء الفهرس ليدخل الفهم الجديد في الترشيحات.
      if (this.learnedSinceRebuild >= 24) {
        this.learnedSinceRebuild = 0;
        this.advisor.markDirty();
      }
    } catch (e) {
      await this.prisma.advisorTraining
        .update({ where: { id: "main" }, data: { lastError: (e as Error).message.slice(0, 300) } })
        .catch(() => undefined);
    } finally {
      this.busy = false;
    }
  }

  private async run(task: TrainingTask, onlyNew: boolean): Promise<boolean> {
    switch (task) {
      case "products":
        return this.trainProducts(onlyNew);
      case "brands":
        return this.trainBrands();
      case "queries":
        return this.trainQueries();
      case "language":
        return this.trainLanguage();
    }
  }

  // ───────────────────────────── 1) فهم المنتجات

  private async loadHashes() {
    if (Date.now() - this.hashLoadedAt < 5 * 60_000 && this.enrichedHash.size) return;
    const rows = await this.prisma.advisorEnrichment.findMany({ where: { type: "product" }, select: { key: true, sourceHash: true } });
    this.enrichedHash = new Map(rows.map((r) => [r.key, r.sourceHash]));
    this.hashLoadedAt = Date.now();
  }

  /** منتجات تحتاج فهماً: الأضعف أولاً (بلا نوع/جنس/عائلة/مشكلة)، ثم الباقي. */
  async pendingProducts(onlyNew = false) {
    await this.loadHashes();
    const idx = await this.advisor.catalog();
    const weak: string[] = [];
    const rest: string[] = [];
    for (const p of idx.products) {
      if (this.enrichedHash.has(p.id)) continue;
      const fresh = Date.now() - p.createdAt < 3 * 86_400_000;
      if (onlyNew && !fresh) continue;
      const isWeak =
        !p.strong.get("kind")?.size ||
        !p.area ||
        (p.area === "fragrance" && ((!p.strong.get("gender")?.size && !p.genderHint) || !(p.strong.get("family")?.size || p.weak.get("family")?.size))) ||
        (p.area === "skin" && !p.strong.get("concern")?.size && !p.strong.get("skinType")?.size);
      (isWeak || fresh ? weak : rest).push(p.id);
    }
    return { ids: [...weak, ...rest], weak: weak.length, total: idx.products.length, done: this.enrichedHash.size };
  }

  private async trainProducts(onlyNew: boolean): Promise<boolean> {
    const pending = await this.pendingProducts(onlyNew);
    const ids = pending.ids.slice(0, 12);
    if (!ids.length) return false;
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameEn: true,
        description: true,
        descriptionAr: true,
        ingredients: true,
        brand: { select: { name: true } },
        category: { select: { name: true, nameAr: true } },
        subcategory: { select: { name: true, nameAr: true } },
      },
    });
    const items = rows.map((r) => {
      const desc = (r.descriptionAr || r.description || "").replace(/\s+/g, " ").slice(0, 520);
      const text = [
        `name: ${r.nameAr || r.name}${r.nameEn ? ` / ${r.nameEn}` : ""}`,
        r.brand?.name ? `brand: ${r.brand.name}` : "",
        `category: ${[r.category?.nameAr || r.category?.name, r.subcategory?.nameAr || r.subcategory?.name].filter(Boolean).join(" > ")}`,
        desc ? `description: ${desc}` : "",
        r.ingredients ? `ingredients: ${r.ingredients.slice(0, 160)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      return { id: r.id, text, hash: textHash(`${r.name}|${r.nameAr}|${desc}`) };
    });
    const raw = await this.ai.train(ENRICH_SYSTEM, items.map((i) => `id=${i.id}\n${i.text}`).join("\n---\n"), 140 + items.length * 75);
    if (!raw) return false;
    const list = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
    const byId = new Map(items.map((i) => [i.id, i]));
    for (const r of list) {
      const it = byId.get(String(r.id ?? ""));
      if (!it) continue;
      const data = cleanEnrich(r);
      await this.prisma.advisorEnrichment.upsert({
        where: { key: it.id },
        create: { key: it.id, type: "product", data: data as object, sourceHash: it.hash, model: this.ai.model },
        update: { data: data as object, sourceHash: it.hash, model: this.ai.model },
      });
      this.enrichedHash.set(it.id, it.hash);
      this.learnedSinceRebuild++;
    }
    // ما لم يُرجعه النموذج يُعلَّم «تمت محاولته» حتى لا يُعاد بلا نهاية.
    for (const it of items) {
      if (this.enrichedHash.has(it.id)) continue;
      await this.prisma.advisorEnrichment.upsert({
        where: { key: it.id },
        create: { key: it.id, type: "product", data: {}, sourceHash: it.hash, model: this.ai.model },
        update: { sourceHash: it.hash },
      });
      this.enrichedHash.set(it.id, it.hash);
    }
    return true;
  }

  // ───────────────────────────── 2) سمعة البراندات

  async pendingBrands() {
    const idx = await this.advisor.catalog();
    const rated = new Set(
      (await this.prisma.advisorEnrichment.findMany({ where: { type: "brand" }, select: { key: true } })).map((r) => r.key.slice(6)),
    );
    const counts = new Map<string, { name: string; area: string; sample: string; n: number }>();
    for (const p of idx.products) {
      if (!p.brandId || !p.brand) continue;
      const e = counts.get(p.brandId) ?? { name: p.brand, area: p.area ?? "", sample: p.name.slice(0, 50), n: 0 };
      e.n++;
      counts.set(p.brandId, e);
    }
    const unknown = [...counts.entries()].filter(([id, b]) => !rated.has(id) && brandTier(b.name, b.area || null) < 0.5);
    return { list: unknown.sort((a, b) => b[1].n - a[1].n), rated: rated.size, total: counts.size };
  }

  private async trainBrands(): Promise<boolean> {
    const { list } = await this.pendingBrands();
    const batch = list.slice(0, 40);
    if (!batch.length) return false;
    const user = batch.map(([id, b]) => `id=${id} | ${b.name} | ${b.area} | e.g. ${b.sample}`).join("\n");
    const raw = await this.ai.train(BRAND_SYSTEM, user, 80 + batch.length * 18);
    if (!raw) return false;
    const got = new Map((Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : []).map((r) => [String(r.id ?? ""), String(r.tier ?? "").toUpperCase()]));
    for (const [id, b] of batch) {
      const tier = ["A", "B", "C"].includes(got.get(id) ?? "") ? got.get(id)! : "C";
      await this.prisma.advisorEnrichment.upsert({
        where: { key: `brand:${id}` },
        create: { key: `brand:${id}`, type: "brand", data: { tier, name: b.name }, sourceHash: textHash(b.name), model: this.ai.model },
        update: { data: { tier, name: b.name } },
      });
    }
    this.advisor.markDirty();
    return true;
  }

  // ───────────────────────────── 3) أسئلة الزبونات التي لم تُفهم

  private async trainQueries(): Promise<boolean> {
    const open = await this.prisma.advisorQueryLog.findMany({ where: { resolved: false }, orderBy: [{ count: "desc" }, { lastAt: "desc" }], take: 10 });
    if (!open.length) return false;
    const raw = await this.ai.train(BATCH_PARSE_SYSTEM, open.map((q) => `id=${q.id}\n${q.sample}`).join("\n---\n"), 120 + open.length * 90);
    if (!raw) return false;
    const idx = await this.advisor.catalog();
    const got = new Map((Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : []).map((r) => [String(r.id ?? ""), r]));
    for (const q of open) {
      const r = got.get(q.id);
      if (r) {
        const { delta, intent } = aiToDelta(cleanAiParse(r), idx, understand(q.sample, idx));
        if (Object.keys(delta).length || intent) await this.advisor.learnPhrase(q.sample, delta, intent, "training");
      }
      await this.prisma.advisorQueryLog.update({ where: { id: q.id }, data: { resolved: true } });
    }
    return true;
  }

  // ───────────────────────────── 4) لغة الزبونات

  private async trainLanguage(): Promise<boolean> {
    const done = new Set(
      (await this.prisma.advisorEnrichment.findMany({ where: { type: "language" }, select: { key: true } })).map((r) => r.key),
    );
    const todo = LEXICON.filter((v) => LANG_FACETS.has(v.facet) && !done.has(`lang:${v.facet}:${v.id}`)).slice(0, 14);
    if (!todo.length) return false;
    const user = todo.map((v) => `id=${v.facet}:${v.id} | ${v.label} | ${v.labelEn}`).join("\n");
    const raw = await this.ai.train(LANGUAGE_SYSTEM, user, 120 + todo.length * 60);
    if (!raw) return false;
    const got = new Map((Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : []).map((r) => [String(r.id ?? ""), r.phrases]));
    const FIELD: Record<string, string> = { kind: "kinds", concern: "concerns", family: "families", ingredient: "ingredients", skinType: "skinType", finish: "finish", attr: "attrs", freeFrom: "freeFrom" };
    for (const v of todo) {
      const phrases = got.get(`${v.facet}:${v.id}`);
      if (Array.isArray(phrases)) {
        for (const ph of phrases.slice(0, 6)) {
          if (typeof ph !== "string") continue;
          const t = normalize(ph).trim();
          if (t.length < 3 || t.length > 40 || t.split(" ").length > 4) continue;
          const field = FIELD[v.facet];
          const delta = field === "skinType" || field === "finish" ? { [field]: v.id } : { [field]: [v.id] };
          await this.advisor.learnPhrase(t, delta, undefined, "language", false);
        }
      }
      await this.prisma.advisorEnrichment.upsert({
        where: { key: `lang:${v.facet}:${v.id}` },
        create: { key: `lang:${v.facet}:${v.id}`, type: "language", data: {}, sourceHash: "1", model: this.ai.model },
        update: {},
      });
    }
    return true;
  }

  // ───────────────────────────── التقدّم (للوحة التحكم)

  async status() {
    const [s, products, brands, phrasesBySource, openQ, resolvedQ, langDone, usage] = await Promise.all([
      this.settings(),
      this.pendingProducts(false),
      this.pendingBrands(),
      this.prisma.advisorPhrase.groupBy({ by: ["source"], _count: { _all: true } }),
      this.prisma.advisorQueryLog.count({ where: { resolved: false } }),
      this.prisma.advisorQueryLog.count({ where: { resolved: true } }),
      this.prisma.advisorEnrichment.count({ where: { type: "language" } }),
      this.ai.usage(14),
    ]);
    const langTotal = LEXICON.filter((v) => LANG_FACETS.has(v.facet)).length;
    const phrases = Object.fromEntries(phrasesBySource.map((r) => [r.source, r._count._all]));
    const phraseTotal = Object.values(phrases).reduce((a, b) => a + b, 0);
    const prodPct = products.total ? Math.min(1, products.done / products.total) : 0;
    const brandPct = brands.total ? Math.min(1, 1 - brands.list.length / brands.total) : 1;
    const langPct = langTotal ? langDone / langTotal : 1;
    const qPct = openQ + resolvedQ ? resolvedQ / (openQ + resolvedQ) : 1;
    // مستوى الفهم: تغطية المنتجات أهم شيء، ثم البراندات واللغة وأسئلة الزبونات.
    const level = Math.round(100 * (0.5 * prodPct + 0.15 * brandPct + 0.2 * langPct + 0.15 * qPct));
    const remaining = this.ai.remainingToday();
    const allDone = !products.ids.length && !brands.list.length && langDone >= langTotal && openQ === 0;
    return {
      aiEnabled: this.ai.enabled,
      model: this.ai.model,
      running: s.running,
      liveAi: s.liveAi,
      autoNew: s.autoNew,
      dailyBatches: s.dailyBatches,
      tasks: s.tasks,
      startedAt: s.startedAt,
      lastRunAt: s.lastRunAt,
      lastError: s.lastError,
      state: !this.ai.enabled ? "no_ai" : !s.running ? "stopped" : allDone ? "idle" : remaining.train <= 0 ? "capped" : "training",
      level,
      remainingToday: remaining,
      progress: {
        products: { done: products.done, total: products.total, pending: products.ids.length, weak: products.weak },
        brands: { rated: brands.rated, unknown: brands.list.length, total: brands.total },
        language: { done: langDone, total: langTotal },
        phrases: { total: phraseTotal, bySource: phrases },
        questions: { open: openQ, resolved: resolvedQ },
      },
      usage,
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

  /** جرّبي رسالة: ماذا تفهم «ديما» منها الآن (محلياً)، وهل ستحتاج الذكاء الاصطناعي؟ */
  async tryMessage(message: string) {
    const idx = await this.advisor.catalog();
    const text = String(message ?? "").slice(0, 400);
    const p = understand(text, idx);
    const delta = { ...p.delta } as Record<string, unknown>;
    return {
      intent: p.intent,
      meaning: meaningOf(delta, null),
      unknownWords: (p.delta.free ?? []) as string[],
      needsAi: needsAi(text, idx),
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
