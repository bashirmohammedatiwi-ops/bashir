/**
 * Brand alias / normalization (task rule #9): resolves user-typed brand
 * mentions ("لوريال", "loreal", "L'Oréal", "لوريل") to real Brand rows.
 *
 * Aliases are GENERATED from data, not hardcoded: every brand contributes
 * normalized keys of its own name plus tokens mined from its products'
 * bilingual names. A brand token must appear in that brand's products and
 * in no other brand's products to become an alias (avoids shared tokens
 * like "شامبو" mapping to a brand).
 */

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import { normalizeBrandKey, normalizeArabicText } from "../text/arabic.util";

export interface BrandAliasEntry {
  brandId: string;
  name: string;
  slug: string;
}

interface BrandAliasIndex {
  byKey: Map<string, BrandAliasEntry>;
  builtAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const MINING_SAMPLE_PER_BRAND = 120;
const MIN_TOKEN_LENGTH = 3;

@Injectable()
export class BrandAliasService {
  private readonly logger = new Logger(BrandAliasService.name);
  private index: BrandAliasIndex | null = null;
  private building: Promise<BrandAliasIndex> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve a free-text brand mention to the best matching brand.
   * Exact normalized-key wins; otherwise the longest alias key contained
   * in the normalized mention wins (handles "لوريال الاصلي", "loreal paris").
   */
  async resolve(mention: string): Promise<BrandAliasEntry | null> {
    const index = await this.getIndex();
    const key = normalizeBrandKey(mention);
    if (!key) return null;

    const exact = index.byKey.get(key);
    if (exact) return exact;

    let best: { entry: BrandAliasEntry; length: number } | null = null;
    for (const [aliasKey, entry] of index.byKey) {
      if (aliasKey.length < MIN_TOKEN_LENGTH) continue;
      if (key.includes(aliasKey) && (!best || aliasKey.length > best.length)) {
        best = { entry, length: aliasKey.length };
      }
    }
    return best?.entry ?? null;
  }

  /** Resolve many mentions at once (used by the turn planner). */
  async resolveMany(mentions: string[]): Promise<Map<string, BrandAliasEntry>> {
    const out = new Map<string, BrandAliasEntry>();
    for (const mention of mentions) {
      const hit = await this.resolve(mention);
      if (hit) out.set(mention, hit);
    }
    return out;
  }

  /** All brands, for LLM grounding context (id + name only). */
  async listBrands(): Promise<Array<{ id: string; name: string }>> {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return brands;
  }

  async getIndex(): Promise<BrandAliasIndex> {
    if (this.index && Date.now() - this.index.builtAt < CACHE_TTL_MS) return this.index;
    if (this.building) return this.building;

    this.building = this.buildIndex()
      .then((index) => {
        this.index = index;
        this.building = null;
        return index;
      })
      .catch((err) => {
        this.building = null;
        this.logger.warn(`Brand alias index build failed: ${(err as Error).message}`);
        const empty: BrandAliasIndex = { byKey: new Map(), builtAt: Date.now() };
        this.index = empty;
        return empty;
      });
    return this.building;
  }

  private async buildIndex(): Promise<BrandAliasIndex> {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        products: {
          take: MINING_SAMPLE_PER_BRAND,
          select: { name: true, nameAr: true, nameEn: true },
          orderBy: { soldCount: "desc" },
        },
      },
    });

    // Count in how many DIFFERENT brands each candidate token appears.
    const tokenBrands = new Map<string, Map<string, number>>(); // token -> brandId -> count

    const byKey = new Map<string, BrandAliasEntry>();
    for (const brand of brands) {
      const entry: BrandAliasEntry = { brandId: brand.id, name: brand.name, slug: brand.slug };

      // Name-derived keys (always win — added last with priority semantics below).
      const nameKeys = new Set<string>();
      for (const source of [brand.name, brand.slug]) {
        const key = normalizeBrandKey(source);
        if (key.length >= 2) nameKeys.add(key);
      }

      // Mine alias tokens from the brand's own product names.
      const candidateCounts = new Map<string, number>();
      for (const product of brand.products) {
        const words = normalizeArabicText(`${product.nameEn ?? ""} ${product.name} ${product.nameAr ?? ""}`)
          .split(" ")
          .filter((w) => w.length >= MIN_TOKEN_LENGTH && !/^\d+$/.test(w));
        // Unigrams + adjacent bigrams.
        for (let i = 0; i < words.length; i += 1) {
          candidateCounts.set(words[i], (candidateCounts.get(words[i]) ?? 0) + 1);
          if (i + 1 < words.length) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            candidateCounts.set(bigram, (candidateCounts.get(bigram) ?? 0) + 1);
          }
        }
      }

      const occurrences = Math.max(1, brand.products.length);
      for (const [token, count] of candidateCounts) {
        // Keep tokens common across this brand's catalog (>=25% of sampled products).
        if (count < Math.max(2, occurrences * 0.25)) continue;
        if (token.includes(" ")) {
          const compact = token.replace(/\s+/g, "");
          this.trackToken(tokenBrands, compact, brand.id);
        } else {
          this.trackToken(tokenBrands, token, brand.id);
        }
      }

      for (const key of nameKeys) {
        const existing = byKey.get(key);
        if (!existing) byKey.set(key, entry);
      }
    }

    // Exclusive mined tokens become aliases.
    for (const [token, brandCounts] of tokenBrands) {
      if (brandCounts.size !== 1) continue;
      const [brandId, count] = [...brandCounts.entries()][0];
      if (count < 2) continue;
      const brand = brands.find((b) => b.id === brandId);
      if (!brand) continue;
      const key = normalizeBrandKey(token);
      if (key.length < MIN_TOKEN_LENGTH) continue;
      if (!byKey.has(key)) {
        byKey.set(key, { brandId: brand.id, name: brand.name, slug: brand.slug });
      }
    }

    this.logger.log(`Brand alias index built: ${brands.length} brands, ${byKey.size} alias keys`);
    return { byKey, builtAt: Date.now() };
  }

  private trackToken(
    tokenBrands: Map<string, Map<string, number>>,
    token: string,
    brandId: string,
  ): void {
    let brands = tokenBrands.get(token);
    if (!brands) {
      brands = new Map();
      tokenBrands.set(token, brands);
    }
    brands.set(brandId, (brands.get(brandId) ?? 0) + 1);
  }
}
