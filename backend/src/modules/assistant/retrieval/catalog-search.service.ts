/**
 * Facade for the full retrieval pipeline. Tools call THIS, never Prisma
 * directly. Stages run in parallel; semantics failing never blocks lexical
 * (task rule #86). Output is a small grounded candidate set for the LLM.
 */

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import type { ProductSearchCriteria } from "./product-retriever.service";
import { ProductRetrieverService } from "./product-retriever.service";
import { SemanticSearchService } from "./semantic-search.service";
import { RankingService, type RankingSignal } from "./ranking.service";
import { CardProductInclude, ProductCardService } from "./product-card.service";
import { tokenizeNormalized } from "../text/arabic.util";
import type { AssistantProductCard } from "../assistant.types";

@Injectable()
export class CatalogSearchService {
  private readonly logger = new Logger(CatalogSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retriever: ProductRetrieverService,
    private readonly semantic: SemanticSearchService,
    private readonly ranking: RankingService,
    private readonly cards: ProductCardService,
  ) {}

  /**
   * Full hybrid search. Returns diverse, in-stock (by default) product cards.
   */
  async search(criteria: ProductSearchCriteria): Promise<AssistantProductCard[]> {
    const limit = Math.min(criteria.limit ?? 6, 12);
    const queries = criteria.queries.filter(Boolean).slice(0, 4);
    const primaryQuery = queries[0] ?? "";

    const [exactIds, where] = await Promise.all([
      this.lookupExactIds(primaryQuery),
      Promise.resolve(this.retriever.buildWhere(criteria)),
    ]);

    // Lexical + semantic fan-out in parallel.
    const lexicalMaps = await Promise.all(
      (queries.length ? queries : [""]).map((q) => this.retriever.lexicalSearch(q, 40)),
    );
    const semanticMap = primaryQuery
      ? await this.semantic.search(primaryQuery, 60)
      : new Map<string, number>();

    // Union candidate ids.
    const candidateIds = new Set<string>([
      ...exactIds,
      ...lexicalMaps.flatMap((m) => [...m.keys()]),
      ...semanticMap.keys(),
    ]);
    if (!candidateIds.size) return [];

    const filtered = await this.prisma.product.findMany({
      where: { AND: [where, { id: { in: [...candidateIds] } }] },
      select: { id: true, brandId: true },
      take: 300,
    });
    const allowedIds = new Set(filtered.map((r) => r.id));
    if (!allowedIds.size) return [];

    const brandTokens = tokenizeNormalized(primaryQuery);
    const signals: RankingSignal[] = [...allowedIds].map((id) => {
      const lexicalScore = Math.max(0, ...lexicalMaps.map((m) => m.get(id) ?? 0));
      const semanticScore = semanticMap.get(id) ?? 0;
      return {
        id,
        exactMatch: exactIds.includes(id),
        lexicalScore,
        semanticScore,
        brandMatch: exactIds.includes(id) && brandTokens.length > 0,
        categoryMatch: Boolean(criteria.categoryIds?.length) && (lexicalScore > 0 || semanticScore > 0),
      };
    });

    const ranked = await this.ranking.rank(
      signals,
      {
        maxPrice: criteria.maxPrice,
        softPreferences: criteria.softPreferences ?? [],
        limit: limit + 2,
      },
    );
    if (!ranked.length) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: ranked.map((r) => r.id) } },
      include: CardProductInclude,
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Drop unavailable rows that slipped past filters (POS sync races).
    const finalCards: AssistantProductCard[] = [];
    for (const { id } of ranked) {
      const product = byId.get(id);
      if (!product) continue;
      if (criteria.inStockOnly !== false && product.stock <= 0 && !(product.shades ?? []).some((s) => s.stock > 0)) continue;
      finalCards.push(this.cards.toCard(product));
      if (finalCards.length >= limit) break;
    }
    return finalCards;
  }

  /** Also used directly by the exact-match tool. */
  async lookupExactIds(term: string): Promise<string[]> {
    try {
      return await this.retriever.exactLookup(term);
    } catch {
      return [];
    }
  }
}
