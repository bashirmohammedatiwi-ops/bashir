import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { rewriteMediaRecord, rewriteMediaUrl } from "../../common/media-url.util";
import { CatalogIndex, RawProduct } from "./engine/catalog";
import { GREETINGS, WELCOME_BODY, pick } from "./engine/composer";
import { STARTERS, respond } from "./engine/dialog";
import { AdvisorReply, AdvisorState } from "./engine/types";

const REBUILD_EVERY_MS = 10 * 60_000;

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

  private async catalog(): Promise<CatalogIndex> {
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
            brand: { select: { id: true, name: true } },
            category: { select: { name: true, nameAr: true } },
            subcategory: { select: { name: true, nameAr: true } },
            tertiaryCategory: { select: { name: true, nameAr: true } },
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
    return {
      messages: [pick(GREETINGS, seed)(firstName?.trim() || undefined), pick(WELCOME_BODY, seed)],
      chips: STARTERS,
      prompts: [
        "بشرتي دهنية وبيها حبوب",
        "عطر نسائي خشبي للسهرة",
        "شامبو للتساقط تحت 20 ألف",
        "هدية لأمي بحدود 50 ألف",
        "ماسكارا مقاومة للماء",
        "روتين كامل للبشرة الجافة",
      ],
    };
  }

  async chat(input: { message?: string; action?: string; state?: AdvisorState | null; firstName?: string }): Promise<AdvisorReply> {
    const catalog = await this.catalog();
    return respond({ message: input.message, action: input.action }, input.state ?? null, {
      catalog,
      firstName: input.firstName,
    });
  }
}
