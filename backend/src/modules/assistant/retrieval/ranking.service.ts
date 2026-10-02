/**
 * Fusion + ranking + diversity (task rules #24, #25, #26, #92):
 * combines exact/lexical/semantic scores, applies business signals,
 * dedups brand/family repeats, caps results at 3–6 meaningful options.
 */

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import type { ScoredCandidate } from "./product-retriever.service";

export interface RankingSignal {
  id: string;
  lexicalScore?: number;
  semanticScore?: number;
  exactMatch?: boolean;
  brandMatch?: boolean;
  categoryMatch?: boolean;
}

export interface RankingOptions {
  maxPrice?: number;
  budgetScope?: "per_item" | "total";
  softPreferences?: Array<{ key: string; value: string }>;
  limit?: number;
}

const WEIGHTS = {
  exact: 3.0,
  lexical: 1.6,
  semantic: 1.4,
  brand: 1.2,
  category: 0.6,
  budgetFit: 0.8,
  popularity: 0.4,
  rating: 0.3,
  stock: 0.2,
};

const MAX_PER_BRAND = 2;

type PrefetchedFacts = Map<string, CandidateFact>;

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ranks candidate signals against DB facts (price/popularity/stock).
   * Returns product ids ordered by finalScore, diversity-deduped.
   */
  async rank(
    signals: RankingSignal[],
    options: RankingOptions = {},
    prefetched?: PrefetchedFacts,
  ): Promise<Array<{ id: string; finalScore: number }>> {
    if (!signals.length) return [];
    const facts = prefetched ?? (await this.loadFacts(signals.map((s) => s.id)));

    const scored = signals.map((signal) => {
      let score = 0;
      if (signal.exactMatch) score += WEIGHTS.exact;
      score += (signal.lexicalScore ?? 0) * WEIGHTS.lexical;
      score += (signal.semanticScore ?? 0) * WEIGHTS.semantic;
      if (signal.brandMatch) score += WEIGHTS.brand;
      if (signal.categoryMatch) score += WEIGHTS.category;

      const fact = facts.get(signal.id);
      if (fact) {
        // Budget fit: inside budget scores high, creeping past scores less (rule #22/#23).
        if (options.maxPrice && fact.price > 0) {
          if (fact.price <= options.maxPrice) score += WEIGHTS.budgetFit;
          else score -= Math.min(1.5, ((fact.price - options.maxPrice) / options.maxPrice) * 3);
        }
        // Popularity/rating/stock as gentle business signals — never dominant.
        score += Math.log1p(fact.soldCount) * 0.05 * WEIGHTS.popularity * 2.5;
        score += (fact.rating / 5) * WEIGHTS.rating;
        score += fact.stock > 0 ? WEIGHTS.stock : 0;

        if (options.softPreferences?.length) {
          const haystack = fact.searchText;
          for (const pref of options.softPreferences) {
            if (haystack.includes(normalizeWord(pref.value))) score += 0.5;
          }
        }
      }
      return { id: signal.id, finalScore: score };
    });

    scored.sort((a, b) => b.finalScore - a.finalScore);
    return this.diversify(scored, options.limit ?? 6, facts);
  }

  /** Max MAX_PER_BRAND per brand unless the tail is thin (rule #101). */
  private diversify(
    scored: Array<{ id: string; finalScore: number }>,
    limit: number,
    facts: Map<string, CandidateFact> | null,
  ): Array<{ id: string; finalScore: number }> {
    const brandCount = new Map<string, number>();
    const picked: Array<{ id: string; finalScore: number }> = [];
    const deferred: Array<{ id: string; finalScore: number }> = [];

    for (const item of scored) {
      const brandId = facts?.get(item.id)?.brandId ?? "?";
      const count = brandCount.get(brandId) ?? 0;
      if (count >= MAX_PER_BRAND) {
        deferred.push(item);
        continue;
      }
      brandCount.set(brandId, count + 1);
      picked.push(item);
      if (picked.length >= limit) break;
    }
    while (picked.length < limit && deferred.length) picked.push(deferred.shift()!);
    return picked;
  }

  async loadFacts(ids: string[]): Promise<Map<string, CandidateFact>> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        brandId: true,
        price: true,
        rating: true,
        soldCount: true,
        stock: true,
        searchText: true,
      },
    });
    return new Map<string, CandidateFact>(rows.map((r) => [r.id, r as CandidateFact]));
  }
}

export interface CandidateFact {
  id: string;
  brandId: string;
  price: number;
  rating: number;
  soldCount: number;
  stock: number;
  searchText: string;
}

function normalizeWord(value: string): string {
  return value.toLowerCase().trim();
}
