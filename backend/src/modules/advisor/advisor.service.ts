import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { rewriteMediaRecord, rewriteMediaUrl } from "../../common/media-url.util";
import { CatalogIndex, LearnedPhrase, RawProduct } from "./engine/catalog";
import { AdvisorAiService } from "./advisor-ai.service";
import { AiParse, aiToDelta, isUsefulLearning, needsAi } from "./engine/ai";
import { setDynamicTiers } from "./engine/brands";
import { phraseWords, understand } from "./engine/nlu";
import { normalize } from "./engine/text";
import type { Need } from "./engine/types";
import { WELCOME_BODY, greetingFor, pick } from "./engine/composer";
import { STARTERS, respond } from "./engine/dialog";
import { searchCatalog } from "./engine/search";
import { AdvisorReply, AdvisorState, Profile } from "./engine/types";

/** أمثلة تُظهر طرق السؤال المختلفة — تتبدل كل ساعة. */
const PROMPTS_CORE = ["بشرتي دهنية وبيها حبوب", "هدية لأمي بحدود 50 ألف", "روتين كامل للبشرة الجافة", "عطر رجالي خشبي لزوجي", "ماسكارا مقاومة للماء", "سيروم للتصبغات تحت 25 ألف"];
const PROMPTS_SKILLS = [
  "عطر يشبه باكارات بس أرخص",
  "شنو فائدة النياسيناميد؟",
  "لوك سهرة كامل بـ 60 ألف",
  "شامبو وبلسم للشعر الجاف",
  "اقدر استخدم الريتينول ويه فيتامين سي؟",
  "شلون أثبّت العطر أطول؟",
  "بديل أرخص لسوفاج",
  "شلون أعرف نوع بشرتي؟",
];

const EVENT_TYPES = new Set(["click", "cart", "like", "dislike"]);

const REBUILD_EVERY_MS = 5 * 60_000;

type VariantNode = { formats?: Record<string, string> };

/** صورة البطاقة: مقاس small (640px) webp — يكفي العرض بلا هدر. */
function coverUrl(media: unknown): string {
  if (!media || typeof media !== "object") return "";
  const m = rewriteMediaRecord(media as Record<string, unknown>) as { variants?: Record<string, VariantNode> };
  for (const size of ["small", "medium", "thumb", "large"]) {
    const f = m.variants?.[size]?.formats;
    const url = f?.webp ?? f?.jpg ?? f?.avif;
    if (url) return rewriteMediaUrl(url) ?? url;
  }
  return "";
}

/**
 * «ديما» — المستشارة الذكية. خوارزمية داخلية بالكامل (لا خدمات ذكاء خارجية):
 * فهرس للكتالوج في الذاكرة يُعاد بناؤه دورياً، وفهم اللغة والترتيب يجريان محلياً
 * في أجزاء من الملي ثانية.
 */
@Injectable()
export class AdvisorService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("Advisor");
  private index: CatalogIndex | null = null;
  private building: Promise<CatalogIndex> | null = null;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AdvisorAiService,
  ) {}

  private dirtyTimer?: NodeJS.Timeout;
  private lastRebuildAt = 0;

  /**
   * تغيّر شيء (منتج جديد، تعديل، معرفة من التدريب): إعادة بناء خلال دقيقة تقريباً،
   * مجمّعة حتى لا تتكرر مع كل تعديل صغير.
   */
  markDirty() {
    this.lastSig = "";
    if (this.dirtyTimer) return;
    const wait = Math.max(45_000, 120_000 - (Date.now() - this.lastRebuildAt));
    this.dirtyTimer = setTimeout(() => {
      this.dirtyTimer = undefined;
      this.refresh().catch(() => undefined);
    }, wait);
    this.dirtyTimer.unref?.();
  }

  /** يحفظ عبارة تعلّمتها «ديما» ويطبّقها فوراً (بلا انتظار إعادة البناء). */
  async learnPhrase(text: string, delta: Partial<Need>, intent: string | undefined, source: string, whole = true) {
    const phrase = normalize(text).replace(/\d{6,}/g, "#").trim().slice(0, 200);
    if (phrase.length < 2) return;
    await this.prisma.advisorPhrase
      .upsert({
        where: { phrase },
        create: { phrase, delta: delta as object, intent: intent ?? null, source },
        update: { delta: delta as object, intent: intent ?? null, source },
      })
      .catch(() => undefined);
    this.index?.addLearned({ words: phraseWords(phrase), whole, delta, intent });
  }

  /** رسالة لم تُفهم بثقة — تُسجَّل (بلا هوية) لتصبح مادة التدريب التالية. */
  private async logQuery(message: string, resolved: boolean) {
    const text = normalize(message).replace(/\d{6,}/g, "#").trim().slice(0, 200);
    if (text.length < 3) return;
    await this.prisma.advisorQueryLog
      .upsert({
        where: { text },
        create: { text, sample: message.replace(/\d{6,}/g, "#").slice(0, 200), resolved },
        update: { count: { increment: 1 }, lastAt: new Date(), ...(resolved ? { resolved: true } : {}) },
      })
      .catch(() => undefined);
  }

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    // بناء أولي متأخر قليلاً حتى لا يزاحم إقلاع الخادم.
    setTimeout(() => this.refresh().catch((e) => this.log.warn(`Index build failed: ${e.message}`)), 15_000).unref?.();
    this.timer = setInterval(() => this.refresh().catch(() => undefined), REBUILD_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * ترتيب سريع لمعرّفات نتائج بحث (لقوائم المنتجات ذات `search=`). يعيد null إن لم
   * يُبنَ الفهرس بعد — فيستخدم المتصل الطريقة القديمة ريثما يجهز.
   */
  rankedIds(query: string, limit = 400): string[] | null {
    if (!this.index) {
      this.rebuild().catch(() => undefined);
      return null;
    }
    return searchCatalog(this.index, query).hits.slice(0, limit).map((h) => h.p.id);
  }

  /** الفهرس المشترك (يستخدمه البحث أيضاً). */
  async catalog(): Promise<CatalogIndex> {
    if (this.index) return this.index;
    return this.rebuild();
  }

  private lastSig = "";
  private lastFull = 0;

  /**
   * تحديث دوري: يُعاد البناء فقط إن تغيّر الكتالوج (عدد المنتجات أو آخر تعديل)،
   * أو مرّت 30 دقيقة — وإلا نحدّث ما تعلّمته «ديما» فقط (سريع).
   */
  private async refresh(): Promise<void> {
    const [p, t] = await Promise.all([
      this.prisma.product.aggregate({ where: { isActive: true }, _count: { _all: true }, _max: { updatedAt: true } }),
      this.prisma.assistantProductTag.aggregate({ _max: { updatedAt: true } }),
    ]);
    const sig = `${p._count._all}|${p._max.updatedAt?.getTime() ?? 0}|${t._max.updatedAt?.getTime() ?? 0}`;
    if (this.index && sig === this.lastSig && Date.now() - this.lastFull < 30 * 60_000) {
      this.index.applyLearning(await this.learning());
      return;
    }
    await this.rebuild();
    this.lastSig = sig;
  }

  async rebuild(): Promise<CatalogIndex> {
    if (this.building) return this.building;
    this.building = (async () => {
      const started = Date.now();
      const [rows, tags] = await Promise.all([
        this.prisma.product.findMany({
          where: { isActive: true },
          select: {
            id: true,
            slug: true,
            name: true,
            nameAr: true,
            nameEn: true,
            description: true,
            descriptionAr: true,
            price: true,
            originalPrice: true,
            discountPercent: true,
            rating: true,
            reviewCount: true,
            soldCount: true,
            stock: true,
            isNew: true,
            isBestSeller: true,
            isPromo: true,
            createdAt: true,
            sku: true,
            brand: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, slug: true, name: true, nameAr: true } },
            subcategory: { select: { id: true, slug: true, name: true, nameAr: true } },
            tertiaryCategory: { select: { id: true, slug: true, name: true, nameAr: true } },
            images: { take: 1, orderBy: { position: "asc" }, select: { media: true } },
            _count: { select: { shades: true } },
            shades: { select: { name: true }, take: 60 },
          },
        }),
        this.prisma.assistantProductTag.findMany({
          select: { productId: true, kind: true, area: true, concerns: true, audience: true, summary: true },
        }),
      ]);
      const [enrichRows, phraseRows] = await Promise.all([
        // قبل تطبيق الترحيل (أو عند أي تعثر) نبني بدون المعرفة المتعلَّمة بدل أن يفشل البناء كله.
        this.prisma.advisorEnrichment
          .findMany({ where: { type: { in: ["product", "brand"] } }, select: { key: true, type: true, data: true } })
          .catch(() => []),
        this.prisma.advisorPhrase.findMany({ select: { phrase: true, delta: true, intent: true, source: true } }).catch(() => []),
      ]);
      const enrichBy = new Map(enrichRows.filter((r) => r.type === "product").map((r) => [r.key, r.data as RawProduct["enrich"]]));
      const tagBy = new Map(tags.map((t) => [t.productId, t]));
      const raw: RawProduct[] = rows.map((r) => ({
        ...r,
        description: r.description ?? "",
        image: coverUrl(r.images[0]?.media),
        shadeCount: r._count.shades,
        shadeNames: r.shades.map((x) => x.name).filter(Boolean),
        tag: tagBy.get(r.id) ?? null,
        enrich: enrichBy.get(r.id) ?? null,
      }));
      const idx = await CatalogIndex.buildAsync(raw);
      idx.applyLearning(await this.learning());
      idx.setLearned(
        phraseRows
          // معرفة ضعيفة (مجال فقط بلا نوع/مشكلة) تُهمل: تمنع سؤال الذكاء دون أن تفيد.
          .filter((r) => r.source === "language" || isUsefulLearning(r.delta as Partial<Need>, r.intent))
          .map(
          (r): LearnedPhrase => ({
            words: phraseWords(r.phrase),
            whole: r.source !== "language",
            delta: r.delta as Partial<Need>,
            intent: r.intent ?? undefined,
          }),
        ),
      );
      setDynamicTiers(this.brandEstimates(idx, enrichRows.filter((r) => r.type === "brand")));
      this.lastRebuildAt = Date.now();
      this.index = idx;
      this.lastFull = Date.now();
      this.log.log(`Advisor index: ${idx.products.length} products, ${idx.brands.length} brands in ${Date.now() - started}ms`);
      return idx;
    })().finally(() => {
      this.building = null;
    });
    return this.building;
  }

  /**
   * سمعة تلقائية للبراندات خارج القائمة: تقييم الذكاء الاصطناعي إن وُجد، وإلا تقدير من
   * البيانات (أسعاره مقارنة بمنافسيه في نفس النوع + تنوع منتجاته).
   */
  private brandEstimates(idx: CatalogIndex, rated: { key: string; data: unknown }[]): Map<string, number> {
    const out = new Map<string, number>();
    const kindMedian = new Map<string, number>();
    const byKind = new Map<string, number[]>();
    for (const p of idx.products) {
      const k = [...(p.strong.get("kind") ?? [])][0];
      if (!k || !p.price) continue;
      (byKind.get(k) ?? byKind.set(k, []).get(k)!).push(p.price);
    }
    for (const [k, list] of byKind) kindMedian.set(k, list.sort((a, b) => a - b)[Math.floor(list.length / 2)]);
    const brand = new Map<string, { ratios: number[]; kinds: Set<string> }>();
    for (const p of idx.products) {
      const k = [...(p.strong.get("kind") ?? [])][0];
      if (!p.brand || !k || !kindMedian.get(k)) continue;
      const e = brand.get(p.brand) ?? { ratios: [], kinds: new Set<string>() };
      e.ratios.push(p.price / kindMedian.get(k)!);
      e.kinds.add(k);
      brand.set(p.brand, e);
    }
    for (const [name, e] of brand) {
      const r = e.ratios.sort((a, b) => a - b)[Math.floor(e.ratios.length / 2)];
      const est = 0.3 + 0.22 * Math.max(0, Math.min(1, (r - 1) / 1.5)) + 0.08 * Math.min(1, e.kinds.size / 6);
      out.set(name, Math.min(0.6, est));
    }
    const TIER: Record<string, number> = { A: 0.95, B: 0.62, C: 0.35 };
    for (const r of rated) {
      const d = r.data as { tier?: string; name?: string };
      if (d?.name && d.tier && TIER[d.tier]) out.set(d.name, TIER[d.tier]);
    }
    return out;
  }

  async welcome(firstName?: string) {
    const seed = Math.floor(Date.now() / 3_600_000);
    const hour = (new Date().getUTCHours() + 3) % 24; // توقيت بغداد
    const rot = <T,>(a: T[], n: number) => Array.from({ length: n }, (_, i) => a[(seed * 3 + i) % a.length]);
    return {
      messages: [greetingFor(firstName?.trim() || undefined, hour, seed), pick(WELCOME_BODY, seed)],
      chips: STARTERS,
      prompts: [...rot(PROMPTS_CORE, 3), ...rot(PROMPTS_SKILLS, 3)],
    };
  }

  async chat(input: {
    message?: string;
    action?: string;
    state?: AdvisorState | null;
    firstName?: string;
    profile?: Profile | null;
    productId?: string;
  }): Promise<AdvisorReply> {
    const catalog = await this.catalog();
    let action = input.action;
    // فُتحت «ديما» من صفحة منتج: نبدأ الحديث عنه.
    if (input.productId && !input.message && !action) action = `set:focus=${input.productId};act:focus`;
    const profile = sanitizeProfile(input.profile);
    // طريقة الاستخدام تحتاج نص المنتج الكامل من قاعدة البيانات.
    let details: { howToUse: string | null; ingredients: string | null } | null = null;
    const wantsHowto =
      action?.includes("act:howto") || /(طريق[ةه] الاستخدام|طريق[ةه] استخدام|شلون استخدم|شلون استعمل|كيف استخدم|how to use)/.test(input.message ?? "");
    if (wantsHowto) {
      const focus = action?.match(/set:focus=([\w-]+)/)?.[1] ?? input.state?.focus ?? input.state?.lastTop;
      if (focus) {
        details = await this.prisma.product
          .findUnique({ where: { id: focus }, select: { howToUse: true, ingredients: true } })
          .catch(() => null);
      }
    }
    // فهم ضعيف؟ نسجل الرسالة للتدريب، ونستعين بالذكاء الاصطناعي (إن سُمح) — ونحفظ فهمه
    // عبارةً متعلّمة فلا ندفع ثمن نفس السؤال مرة ثانية.
    let ai: AiParse | null = null;
    if (input.message && !action && needsAi(input.message, catalog)) {
      let learned = false;
      if (this.ai.enabled && this.ai.liveAi) {
        ai = await this.ai.parse(input.message, { area: input.state?.need?.area });
        if (ai) {
          // نحفظ فقط ما أضاف فيه النموذج معنىً حقيقياً؛ وإلا تبقى الرسالة سؤالاً مفتوحاً للتدريب.
          const own = aiToDelta(ai, catalog);
          learned = isUsefulLearning(own.delta, own.intent);
          if (learned) {
            const { delta, intent } = aiToDelta(ai, catalog, understand(input.message, catalog));
            await this.learnPhrase(input.message, delta, intent, "chat");
          }
        }
      }
      void this.logQuery(input.message, learned);
    }
    return respond({ message: input.message, action }, input.state ?? null, {
      catalog,
      firstName: input.firstName,
      profile,
      details,
      ai,
    });
  }

  /** تفاعل مجهول: فتح منتج أو إضافته من ترشيح، أو إعجاب بالرد. */
  async feedback(input: { productId?: string; type: string; sig?: string }) {
    if (!EVENT_TYPES.has(input.type)) return { ok: false };
    await this.prisma.advisorEvent
      .create({ data: { productId: input.productId?.slice(0, 64) || null, type: input.type, sig: input.sig?.slice(0, 60) || null } })
      .catch(() => undefined);
    return { ok: true };
  }

  /** ما تعلّمته من آخر 90 يوم: الإضافة للسلة أقوى إشارة، ثم الإعجاب، ثم الفتح. */
  private async learning(): Promise<Map<string, number>> {
    const since = new Date(Date.now() - 90 * 86_400_000);
    const rows = await this.prisma.advisorEvent
      .groupBy({ by: ["productId", "type"], where: { createdAt: { gte: since }, productId: { not: null } }, _count: { _all: true } })
      .catch(() => [] as { productId: string | null; type: string; _count: { _all: number } }[]);
    const raw = new Map<string, number>();
    const W: Record<string, number> = { cart: 3, like: 2, click: 1, dislike: -2.5 };
    for (const r of rows) {
      if (!r.productId) continue;
      raw.set(r.productId, (raw.get(r.productId) ?? 0) + (W[r.type] ?? 0) * r._count._all);
    }
    const out = new Map<string, number>();
    for (const [id, v] of raw) if (v > 0) out.set(id, 1 - Math.exp(-v / 12));
    return out;
  }
}

function sanitizeProfile(p: Profile | null | undefined): Profile | undefined {
  if (!p || typeof p !== "object") return undefined;
  const str = (v: unknown) => (typeof v === "string" && v.length <= 24 ? v : undefined);
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.length <= 24).slice(0, 6) : undefined);
  return { skinType: str(p.skinType), gender: str(p.gender), concerns: arr(p.concerns), hairConcerns: arr(p.hairConcerns), families: arr(p.families), avoid: arr(p.avoid) };
}
