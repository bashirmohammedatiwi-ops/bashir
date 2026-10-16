import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AiParse, BRAND_SYSTEM, cleanAiParse, cleanEnrich, ENRICH_SYSTEM, EnrichData, PARSE_SYSTEM } from "./engine/ai";
import { normalize } from "./engine/text";

type Usage = { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
type ChatBody = {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  usage?: Usage;
  error?: { message?: string };
};

/**
 * ذكاء «ديما» الاحتياطي — بكلفة مضبوطة:
 * • نموذج صغير رخيص، ردود JSON قصيرة، ومهلة قصيرة (إن تأخر نكمل بدونه).
 * • ذاكرة مؤقتة: نفس السؤال لا يُدفع ثمنه مرتين.
 * • سقف يومي للمحادثة وسقف منفصل للإثراء، ويُسجَّل الاستهلاك يومياً.
 * • قاطع دائرة: أخطاء متتالية توقف الاستدعاء دقائق بدل الإلحاح.
 */
@Injectable()
export class AdvisorAiService {
  private readonly log = new Logger("AdvisorAI");
  private readonly key = process.env.OPENAI_API_KEY ?? "";
  readonly model = process.env.ADVISOR_AI_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-nano";
  private readonly chatCap = Number(process.env.ADVISOR_AI_DAILY_CHAT ?? 300);
  private readonly enrichCap = Number(process.env.ADVISOR_AI_DAILY_ENRICH ?? 40);
  private readonly cache = new Map<string, AiParse>();
  private day = "";
  private counts = { chat: 0, enrich: 0 };
  private loaded = false;
  private failures = 0;
  /** درجات التفكير المجرَّبة بالترتيب (الأرخص أولاً)؛ تُحذف غير المدعومة تلقائياً. */
  private readonly efforts: (string | null)[] = [process.env.ADVISOR_AI_EFFORT || "none", "minimal", "low", null].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  private pausedUntil = 0;

  constructor(private readonly prisma: PrismaService) {}

  /** الذكاء أثناء المحادثة (للرسائل غير المفهومة) — يُضبط من لوحة التحكم. */
  liveAi = true;

  get enabled(): boolean {
    return this.key.length > 0 && process.env.ADVISOR_AI !== "off";
  }

  /** اليوم بتوقيت بغداد — حدود السقف اليومي. */
  private today(): string {
    return new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);
  }

  private async ensureDay() {
    const d = this.today();
    if (d === this.day && this.loaded) return;
    this.day = d;
    this.counts = { chat: 0, enrich: 0 };
    const row = await this.prisma.advisorAiUsage.findUnique({ where: { day: d } }).catch(() => null);
    if (row) this.counts = { chat: row.chatCalls, enrich: row.enrichCalls };
    this.loaded = true;
  }

  private async record(kind: "chat" | "enrich", u: Usage) {
    this.counts[kind]++;
    const inc = {
      chatCalls: kind === "chat" ? 1 : 0,
      enrichCalls: kind === "enrich" ? 1 : 0,
      promptTokens: u.prompt_tokens ?? 0,
      completionTokens: u.completion_tokens ?? 0,
      cachedTokens: u.prompt_tokens_details?.cached_tokens ?? 0,
    };
    await this.prisma.advisorAiUsage
      .upsert({
        where: { day: this.day },
        create: { day: this.day, ...inc },
        update: {
          chatCalls: { increment: inc.chatCalls },
          enrichCalls: { increment: inc.enrichCalls },
          promptTokens: { increment: inc.promptTokens },
          completionTokens: { increment: inc.completionTokens },
          cachedTokens: { increment: inc.cachedTokens },
        },
      })
      .catch(() => undefined);
  }

  /** استدعاء واحد مضبوط: JSON فقط، حد للرموز، ومهلة. null عند أي تعثر. */
  private async call(kind: "chat" | "enrich", system: string, user: string, maxTokens: number, timeoutMs: number) {
    if (!this.enabled || Date.now() < this.pausedUntil) return null;
    await this.ensureDay();
    if (kind === "chat" && this.counts.chat >= this.chatCap) return null;
    if (kind === "enrich" && this.counts.enrich >= (this.enrichCapOverride ?? this.enrichCap)) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      let body: ChatBody = {};
      for (;;) {
        const effort = this.efforts[0];
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal: ctrl.signal,
          headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            // تفكير أدنى: المهمة تصنيف قصير، والتفكير يستهلك رموزاً مدفوعة بلا فائدة.
            ...(effort ? { reasoning_effort: effort } : {}),
            max_completion_tokens: maxTokens,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
        });
        body = (await res.json()) as ChatBody;
        // النموذج لا يقبل هذه الدرجة؟ نجرّب التالية مرة واحدة ونتذكرها.
        if (res.status === 400 && effort && /reasoning/i.test(body.error?.message ?? "")) {
          this.efforts.shift();
          continue;
        }
        if (!res.ok) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
        break;
      }
      await this.record(kind, body.usage ?? {});
      const choice = body.choices?.[0];
      const text = choice?.message?.content ?? "";
      if (!text.trim()) throw new Error(`empty reply (${choice?.finish_reason ?? "?"})`);
      this.failures = 0;
      return JSON.parse(text) as Record<string, unknown>;
    } catch (e) {
      if (++this.failures >= 3) {
        this.pausedUntil = Date.now() + 5 * 60_000;
        this.failures = 0;
      }
      this.log.warn(`AI ${kind} skipped: ${(e as Error).message?.slice(0, 120)}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** فهم رسالة لم تفهمها «ديما» بثقة → صفات بمعرّفات معجمنا. */
  async parse(message: string, context?: { area?: string }): Promise<AiParse | null> {
    const key = `${context?.area ?? ""}|${normalize(message).slice(0, 200)}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const user = context?.area ? `(previous topic area: ${context.area})\n${message.slice(0, 400)}` : message.slice(0, 400);
    const raw = await this.call("chat", PARSE_SYSTEM, user, 260, 6500);
    if (!raw) return null;
    const out = cleanAiParse(raw);
    this.cache.set(key, out);
    if (this.cache.size > 3000) this.cache.delete(this.cache.keys().next().value as string);
    return out;
  }

  /** إثراء دفعة منتجات من نصها (مرة لكل منتج). */
  async enrich(items: { id: string; text: string }[]): Promise<Map<string, EnrichData>> {
    const out = new Map<string, EnrichData>();
    if (!items.length) return out;
    const user = items.map((i) => `id=${i.id}\n${i.text}`).join("\n---\n");
    const raw = await this.call("enrich", ENRICH_SYSTEM, user, 120 + items.length * 70, 30_000);
    const list = Array.isArray(raw?.items) ? (raw!.items as Record<string, unknown>[]) : [];
    const valid = new Set(items.map((i) => i.id));
    for (const r of list) {
      const id = String(r.id ?? "");
      if (valid.has(id)) out.set(id, cleanEnrich(r));
    }
    return out;
  }

  /** سمعة براندات جديدة (A/B/C) — مرة لكل براند. */
  async rateBrands(brands: { id: string; name: string; area: string; sample: string }[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (!brands.length) return out;
    const user = brands.map((b) => `id=${b.id} | ${b.name} | ${b.area} | e.g. ${b.sample}`).join("\n");
    const raw = await this.call("enrich", BRAND_SYSTEM, user, 60 + brands.length * 16, 30_000);
    const list = Array.isArray(raw?.items) ? (raw!.items as Record<string, unknown>[]) : [];
    for (const r of list) {
      const t = String(r.tier ?? "").toUpperCase();
      if (["A", "B", "C"].includes(t)) out.set(String(r.id ?? ""), t);
    }
    return out;
  }

  /** طلب تدريب عام (يُحسب من سقف التدريب لا المحادثة). */
  async train(system: string, user: string, maxTokens: number): Promise<Record<string, unknown> | null> {
    return this.call("enrich", system, user, maxTokens, 40_000);
  }

  /** سقف دفعات التدريب اليومي يُضبط من لوحة التحكم. */
  setDailyEnrichCap(n: number) {
    this.enrichCapOverride = Math.max(0, Math.min(2000, Math.round(n)));
  }
  private enrichCapOverride: number | null = null;

  remainingToday(): { chat: number; train: number } {
    const cap = this.enrichCapOverride ?? this.enrichCap;
    return { chat: Math.max(0, this.chatCap - this.counts.chat), train: Math.max(0, cap - this.counts.enrich) };
  }

  /** ملخص الاستهلاك (للوحة التحكم). */
  async usage(days = 14) {
    return this.prisma.advisorAiUsage.findMany({ orderBy: { day: "desc" }, take: days }).catch(() => []);
  }
}
