/**
 * Catalog knowledge (the agent's map of the store): a compact, cached
 * digest of categories/brands/bestsellers/price-ranges/skin-concerns
 * injected into the planner and agent loop so the model reasons about
 * the real catalog structure BEFORE choosing tools — fewer wasted calls,
 * sharper queries, better suggestions.
 */

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import { formatIQD } from "../text/money.util";

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_BLOCK_CHARS = 2400;

@Injectable()
export class CatalogKnowledgeService {
  private readonly logger = new Logger(CatalogKnowledgeService.name);
  private cache: { at: number; block: string } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Compact catalog digest for prompt injection (cached 10 minutes). */
  async catalogBlock(): Promise<string> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) return this.cache.block;
    try {
      const block = await this.build();
      this.cache = { at: Date.now(), block };
      return block;
    } catch (err) {
      this.logger.warn(`catalog knowledge build failed: ${(err as Error).message}`);
      return this.cache?.block ?? "";
    }
  }

  private async build(): Promise<string> {
    const [categories, brands, bestsellers, range, concerns] = await Promise.all([
      this.prisma.product.groupBy({
        by: ["categoryId"],
        where: { isActive: true },
        _count: { categoryId: true },
      }),
      this.prisma.product.groupBy({
        by: ["brandId"],
        where: { isActive: true },
        _count: { brandId: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0 } },
        orderBy: { soldCount: "desc" },
        take: 10,
        select: { nameAr: true, name: true, price: true, brand: { select: { name: true } } },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true },
        _count: true,
      }),
      this.prisma.skinConcern.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { position: "asc" },
        take: 12,
      }),
    ]);

    const [categoryRows, brandRows] = await Promise.all([
      categories.length
        ? this.prisma.category.findMany({
            where: { id: { in: categories.map((c) => c.categoryId).filter((id): id is string => Boolean(id)) } },
            select: { id: true, nameAr: true, name: true },
          })
        : Promise.resolve([]),
      brands.length
        ? this.prisma.brand.findMany({
            where: { id: { in: brands.map((b) => b.brandId).filter((id): id is string => Boolean(id)) } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const categoryCount = new Map(categories.map((c) => [c.categoryId, c._count.categoryId]));
    const categoryLines = categoryRows
      .map((c) => ({ label: c.nameAr || c.name, count: categoryCount.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map((c) => `${c.label}(${c.count})`);

    const brandCount = new Map(brands.map((b) => [b.brandId, b._count.brandId]));
    const brandLines = brandRows
      .map((b) => ({ label: b.name, count: brandCount.get(b.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map((b) => `${b.label}(${b.count})`);

    const bestsellerLines = bestsellers.map(
      (p) => `${p.nameAr || p.name} — ${p.brand?.name ?? ""} ${formatIQD(p.price)}`,
    );

    const parts = [
      `PRODUCTS: ${range._count} active, price range ${formatIQD(range._min.price ?? 0)} – ${formatIQD(range._max.price ?? 0)}`,
      categoryLines.length ? `CATEGORIES (name(count)): ${categoryLines.join(", ")}` : "",
      brandLines.length ? `TOP BRANDS (name(count)): ${brandLines.join(", ")}` : "",
      bestsellerLines.length ? `BESTSELLERS:\n- ${bestsellerLines.join("\n- ")}` : "",
      concerns.length ? `SKIN CONCERNS covered: ${concerns.map((c) => c.name).join(", ")}` : "",
    ].filter(Boolean);

    return parts.join("\n").slice(0, MAX_BLOCK_CHARS);
  }

  /** Invalidate on catalog writes (called opportunistically). */
  invalidate(): void {
    this.cache = null;
  }
}
