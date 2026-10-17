import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CmsPageKey, HomeBlock, HomeBlockType, PackageKind, Prisma } from "@prisma/client";
import { HomeFeedCacheService } from "../../common/home-feed-cache.service";
import { PrismaService } from "../../common/prisma.service";

/**
 * «العرض في الصفحة الرئيسية» لكل عالم: دليل البشرة، روتين البشرة، الباقات.
 * كل واحد منها قسم HomeBlock عادي في رئيسية العالم (يظهر أيضاً في منشئ الرئيسية)،
 * تُدار حالته وعنوانه وشكله ومكانه من صفحته في لوحة التحكم.
 */
export const SHOWCASES = {
  skinGuide: { type: HomeBlockType.SKIN_CONCERNS, title: "دليل البشرة", subtitle: "اختاري مشكلتكِ ونرشّحلكِ الأنسب", display: "cards" },
  routines: { type: HomeBlockType.ROUTINE_CAROUSEL, title: "روتين البشرة", subtitle: "خطوات الصباح والمساء جاهزة", display: "carousel" },
  packages: { type: HomeBlockType.PACKAGES, title: "الباقات", subtitle: "منتجات مختارة بسعر أوفر", display: "carousel" },
} as const;
export type ShowcaseKind = keyof typeof SHOWCASES;

const ROUTINE_KINDS: PackageKind[] = [PackageKind.ROUTINE_MORNING, PackageKind.ROUTINE_EVENING];

@Injectable()
export class ShowcaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly homeFeedCache: HomeFeedCacheService,
  ) {}

  private kindOf(kind: string): ShowcaseKind {
    if (!(kind in SHOWCASES)) throw new BadRequestException("نوع عرض غير معروف");
    return kind as ShowcaseKind;
  }

  /** قسم العرض المُدار لهذا العالم (أو أول قسم من نفس النوع أُضيف يدوياً). */
  private pick(blocks: HomeBlock[], kind: ShowcaseKind) {
    const type = SHOWCASES[kind].type;
    const ofType = blocks.filter((b) => b.type === type);
    const managed = ofType.find((b) => (b.payload as Record<string, unknown> | null)?.showcase === kind);
    if (managed) return managed;
    // قسم باقات يدوي بنوع روتين يُحسب روتيناً لا باقات.
    if (kind === "packages") {
      return ofType.find((b) => !String((b.payload as Record<string, unknown> | null)?.kind ?? "").startsWith("ROUTINE")) ?? null;
    }
    return ofType[0] ?? null;
  }

  /** لكل عالم: هل القسم ظاهر، عنوانه وشكله، مكانه بين أقسام رئيسيته، وعدد العناصر المتاحة فيه. */
  async overview(rawKind: string) {
    const kind = this.kindOf(rawKind);
    const worlds = await this.prisma.world.findMany({
      orderBy: { position: "asc" },
      select: { id: true, slug: true, nameAr: true, accentColor: true, isActive: true },
    });
    const blocks = await this.prisma.homeBlock.findMany({
      where: { pageKey: CmsPageKey.HOME, worldId: { in: worlds.map((w) => w.id) } },
      orderBy: { position: "asc" },
    });
    const counts = await this.itemCounts(kind, worlds.map((w) => w.slug));
    return worlds.map((w) => {
      const own = blocks.filter((b) => b.worldId === w.id);
      const block = this.pick(own, kind);
      const payload = (block?.payload ?? {}) as Record<string, unknown>;
      return {
        world: w,
        shown: !!block?.isActive,
        blockId: block?.id ?? null,
        title: block?.title ?? SHOWCASES[kind].title,
        subtitle: block?.subtitle ?? SHOWCASES[kind].subtitle,
        display: (payload.display as string) ?? SHOWCASES[kind].display,
        // القسم الذي يسبقه مباشرة (null = في الأعلى).
        afterBlockId: block ? (own[own.findIndex((b) => b.id === block.id) - 1]?.id ?? null) : (own[own.length - 1]?.id ?? null),
        sections: own
          .filter((b) => b.id !== block?.id)
          .map((b) => ({ id: b.id, type: b.type, title: b.title, isActive: b.isActive })),
        itemCount: counts.get(w.slug) ?? 0,
      };
    });
  }

  /** كم عنصراً سيظهر في كل عالم (الباقات العامة + المخصصة له). */
  private async itemCounts(kind: ShowcaseKind, slugs: string[]) {
    const out = new Map<string, number>();
    if (kind === "skinGuide") {
      const rows = await this.prisma.skinConcern.findMany({ where: { isActive: true }, select: { worldSlugs: true } });
      for (const s of slugs) out.set(s, rows.filter((r) => !r.worldSlugs.length || r.worldSlugs.includes(s)).length);
      return out;
    }
    const now = new Date();
    const rows = await this.prisma.package.findMany({
      where: {
        isActive: true,
        kind: kind === "routines" ? { in: ROUTINE_KINDS } : { notIn: ROUTINE_KINDS },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        items: { some: {} },
      },
      select: { worldSlugs: true },
    });
    for (const s of slugs) out.set(s, rows.filter((r) => !r.worldSlugs.length || r.worldSlugs.includes(s)).length);
    return out;
  }

  /**
   * إظهار/إخفاء القسم في رئيسية عالم، مع عنوانه وشكله ومكانه.
   * afterBlockId: يأتي بعد هذا القسم — null = أعلى الأقسام، "end" = آخرها.
   */
  async save(
    rawKind: string,
    worldId: string,
    body: { shown?: boolean; title?: string; subtitle?: string; display?: string; afterBlockId?: string | null },
  ) {
    const kind = this.kindOf(rawKind);
    const world = await this.prisma.world.findUnique({ where: { id: worldId } });
    if (!world) throw new NotFoundException("World not found");
    const def = SHOWCASES[kind];
    const own = await this.prisma.homeBlock.findMany({
      where: { pageKey: CmsPageKey.HOME, worldId },
      orderBy: { position: "asc" },
    });
    let block = this.pick(own, kind);
    const payload: Record<string, unknown> = {
      ...((block?.payload ?? {}) as Record<string, unknown>),
      showcase: kind,
      display: body.display || ((block?.payload as Record<string, unknown> | null)?.display as string) || def.display,
      showViewAll: true,
      showTitle: true,
    };
    if (kind === "routines") payload.kind = "both";
    if (kind === "packages") payload.kind = "bundles";
    const data = {
      isActive: body.shown !== false,
      title: body.title?.trim() || block?.title || def.title,
      subtitle: body.subtitle !== undefined ? body.subtitle.trim() || null : (block?.subtitle ?? def.subtitle),
      payload: payload as Prisma.InputJsonValue,
    };
    block = block
      ? await this.prisma.homeBlock.update({ where: { id: block.id }, data })
      : await this.prisma.homeBlock.create({
          data: { ...data, type: def.type, pageKey: CmsPageKey.HOME, worldId, position: 0 },
        });

    // الترتيب: نضعه بعد القسم المختار ونعيد ترقيم أقسام العالم.
    if (body.afterBlockId !== undefined || !own.some((b) => b.id === block!.id)) {
      const rest = own.filter((b) => b.id !== block!.id);
      const after = body.afterBlockId === undefined ? "end" : body.afterBlockId;
      let index = after === "end" ? rest.length : after === null ? 0 : rest.findIndex((b) => b.id === after) + 1;
      if (index < 0) index = rest.length;
      const ordered = [...rest.slice(0, index), block, ...rest.slice(index)];
      await this.prisma.$transaction(
        ordered.map((b, i) => this.prisma.homeBlock.update({ where: { id: b.id }, data: { position: (i + 1) * 10 } })),
      );
    }
    await this.homeFeedCache.invalidateAll();
    return { success: true, blockId: block.id };
  }
}
