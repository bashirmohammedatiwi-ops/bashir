/**
 * Retrieval pipeline (task rules #7, #21, #74): exact → lexical → semantic
 * → hard filters → scoring → diversity. The LLM never sees the catalog —
 * only the small grounded candidate set this pipeline produces.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma.service";
import { barcodeLookupCandidates } from "../../../common/barcode.util";
import { normalizeArabicText, tokenizeNormalized } from "../text/arabic.util";

export interface ProductSearchCriteria {
  queries: string[];
  brandIds?: string[];
  excludedBrandIds?: string[];
  categoryIds?: string[];
  gender?: "male" | "female" | "unisex";
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "popular" | "rating";
  limit?: number;
  /** Soft preferences from the planner/memory — ranking hints only. */
  softPreferences?: Array<{ key: string; value: string }>;
}

export interface ScoredCandidate {
  id: string;
  lexicalScore: number;
  semanticScore: number;
  finalScore: number;
  matchedBy: Array<"exact" | "lexical" | "semantic" | "brand" | "category">;
}

@Injectable()
export class ProductRetrieverService {
  private readonly logger = new Logger(ProductRetrieverService.name);
  private trigramAvailable: boolean | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Products resolved verbatim: barcode / SKU / id / slug. */
  async exactLookup(term: string): Promise<string[]> {
    const trimmed = term.trim();
    if (!trimmed) return [];
    const barcodeCandidates = barcodeLookupCandidates(trimmed);

    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { id: trimmed },
          { slug: trimmed },
          { sku: { in: barcodeCandidates } },
          { barcode: { in: barcodeCandidates } },
          { shades: { some: { barcode: { in: barcodeCandidates } } } },
        ],
      },
      select: { id: true },
      take: 5,
    });
    return rows.map((r) => r.id);
  }

  /** Lexical stage over the normalized searchText column (+ trigram when available). */
  async lexicalSearch(query: string, limit: number): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    const normalized = normalizeArabicText(query);
    const tokens = tokenizeNormalized(query).filter((t) => t.length >= 2);
    if (!normalized) return scores;

    if (await this.hasTrigram()) {
      try {
        const rows = await this.prisma.$queryRaw<Array<{ id: string; sim: number }>>`
          SELECT "id", similarity("searchText", ${normalized}) AS sim
          FROM "Product"
          WHERE "isActive" = true AND "searchText" % ${normalized}
          ORDER BY sim DESC
          LIMIT ${limit}`;
        for (const row of rows) scores.set(row.id, Math.min(1, Number(row.sim)));
        return scores;
      } catch (err) {
        this.logger.warn(`trigram query failed, falling back to contains: ${(err as Error).message}`);
        this.trigramAvailable = false;
      }
    }

    // Fallback: AND over tokens using normalized substring containment.
    if (!tokens.length) return scores;
    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        AND: tokens.slice(0, 6).map((token) => ({ searchText: { contains: token } })),
      },
      select: { id: true, searchText: true },
      take: limit * 3,
    });
    for (const row of rows) {
      const hitTokens = tokens.filter((t) => row.searchText.includes(t)).length;
      scores.set(row.id, hitTokens / tokens.length);
    }
    return scores;
  }

  /** Hard catalog filters compiled to one Prisma where (task rule #22). */
  buildWhere(criteria: ProductSearchCriteria): Prisma.ProductWhereInput {
    const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
    if (criteria.inStockOnly !== false) and.push({ stock: { gt: 0 } });
    if (criteria.brandIds?.length) and.push({ brandId: { in: criteria.brandIds } });
    if (criteria.excludedBrandIds?.length) and.push({ brandId: { notIn: criteria.excludedBrandIds } });
    if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
      and.push({ price: { gte: criteria.minPrice, lte: criteria.maxPrice } });
    }
    if (criteria.categoryIds?.length) {
      and.push({
        OR: [
          { categoryId: { in: criteria.categoryIds } },
          { subcategoryId: { in: criteria.categoryIds } },
          { tertiaryCategoryId: { in: criteria.categoryIds } },
          { subcategories: { some: { id: { in: criteria.categoryIds } } } },
          { tertiaryCategories: { some: { id: { in: criteria.categoryIds } } } },
        ],
      });
    }
    if (criteria.gender && criteria.gender !== "unisex") {
      // Gender markers in bilingual text; never trust category trees alone
      // (category validation is intentionally lenient in this codebase).
      // Keep products marked for the wanted gender, unisex products, and
      // neutral products; exclude products explicitly marked the opposite.
      const wantedMarkers = criteria.gender === "female" ? ["نسائي", "حريم", "women", "female"] : ["رجالي", "رجال", "men", "male"];
      const oppositeMarkers = criteria.gender === "female" ? ["رجالي", "رجال", "men", "male"] : ["نسائي", "حريم", "women", "female"];
      and.push({
        OR: [
          ...wantedMarkers.map((t) => ({ searchText: { contains: t } })),
          { searchText: { contains: "للجنسين" } },
          { searchText: { contains: "unisex" } },
          { NOT: { OR: oppositeMarkers.map((t) => ({ searchText: { contains: t } })) } },
        ],
      });
    }
    return { AND: and };
  }

  private async hasTrigram(): Promise<boolean> {
    if (this.trigramAvailable !== null) return this.trigramAvailable;
    try {
      const rows = await this.prisma.$queryRaw<Array<{ ok: number }>>`
        SELECT 1 AS ok FROM pg_extension WHERE extname = 'pg_trgm' LIMIT 1`;
      this.trigramAvailable = rows.length > 0;
    } catch {
      this.trigramAvailable = false;
    }
    if (!this.trigramAvailable) {
      this.logger.warn("pg_trgm unavailable — lexical search degrades to normalized contains");
    }
    return this.trigramAvailable;
  }
}

