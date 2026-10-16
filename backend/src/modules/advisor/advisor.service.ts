import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { rewriteMediaRecord, rewriteMediaUrl } from "../../common/media-url.util";
import { CatalogIndex, RawProduct } from "./engine/catalog";
import { WELCOME_BODY, greetingFor, pick } from "./engine/composer";
import { STARTERS, respond } from "./engine/dialog";
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

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return;
    // بناء أولي متأخر قليلاً حتى لا يزاحم إقلاع الخادم.
    setTimeout(() => this.rebuild().catch((e) => this.log.warn(`Index build failed: ${e.message}`)), 15_000).unref?.();
    this.timer = setInterval(() => this.rebuild().catch(() => undefined), REBUILD_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** الفهرس المشترك (يستخدمه البحث أيضاً). */
  async catalog(): Promise<CatalogIndex> {
    if (this.index) return this.index;
    return this.rebuild();
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
      const tagBy = new Map(tags.map((t) => [t.productId, t]));
      const raw: RawProduct[] = rows.map((r) => ({
        ...r,
        description: r.description ?? "",
        image: coverUrl(r.images[0]?.media),
        shadeCount: r._count.shades,
        shadeNames: r.shades.map((x) => x.name).filter(Boolean),
        tag: tagBy.get(r.id) ?? null,
      }));
      const idx = CatalogIndex.build(raw);
      idx.applyLearning(await this.learning());
      this.index = idx;
      this.log.log(`Advisor index: ${idx.products.length} products, ${idx.brands.length} brands in ${Date.now() - started}ms`);
      return idx;
    })().finally(() => {
      this.building = null;
    });
    return this.building;
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
    return respond({ message: input.message, action }, input.state ?? null, {
      catalog,
      firstName: input.firstName,
      profile,
      details,
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
