/**
 * Semantic retrieval without a vector database: product embeddings live in
 * Postgres (ProductEmbedding) and are cached in-process as Float32 vectors.
 * Catalog sizes here are thousands of rows — cosine over the active set is
 * microseconds. Stale docs (docHash mismatch) are re-embedded lazily in the
 * background; any failure degrades to lexical-only (task rule #86).
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../common/prisma.service";
import { AI_PROVIDER, type AIProvider } from "../ai/ai-provider.interface";
import { buildEmbeddingDocument, searchDocHash, type SearchDocProduct } from "./search-document";

const EMBED_INCLUDE = {
  brand: { select: { name: true } },
  category: { select: { name: true, nameAr: true } },
  subcategory: { select: { name: true, nameAr: true } },
  tertiaryCategory: { select: { name: true, nameAr: true } },
  subcategories: { select: { name: true, nameAr: true } },
  tertiaryCategories: { select: { name: true, nameAr: true } },
  shades: { select: { name: true } },
  variants: { select: { label: true, sizeLabel: true } },
} as const;

const RELOAD_TTL_MS = 5 * 60 * 1000;

interface SemanticIndex {
  vectors: Map<string, Float32Array>;
  loadedAt: number;
}

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private index: SemanticIndex | null = null;
  private loading: Promise<void> | null = null;
  private staleIds = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
  ) {}

  /**
   * Top semantic matches for a query. Returns [] on any failure — callers
   * must treat semantics as an enhancement, never a dependency.
   */
  async search(query: string, limit: number, minScore = 0.3): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (!query.trim()) return out;
    try {
      const [queryVector] = await this.provider.embed([query.slice(0, 2000)]);
      if (!queryVector?.length) return out;

      const index = await this.ensureIndex();
      const queryNorm = norm(queryVector);
      if (queryNorm === 0) return out;

      for (const [productId, vector] of index.vectors) {
        const score = cosine(queryVector, queryNorm, vector);
        if (score >= minScore) out.set(productId, score);
      }

      // Kick off background refresh of stale/missing docs; never block the query.
      void this.refreshStale();
    } catch (err) {
      this.logger.warn(`semantic search degraded: ${(err as Error).message}`);
    }
    return out;
  }

  /** Re-embed one product now (called after catalog writes). */
  async embedProductNow(productId: string): Promise<void> {
    this.staleIds.add(productId);
    await this.refreshStale();
  }

  private async ensureIndex(): Promise<SemanticIndex> {
    if (this.index && Date.now() - this.index.loadedAt < RELOAD_TTL_MS) return this.index;
    if (this.loading) {
      await this.loading;
      return this.index ?? { vectors: new Map(), loadedAt: Date.now() };
    }
    this.loading = this.loadIndex()
      .then(() => {
        this.loading = null;
      })
      .catch((err) => {
        this.loading = null;
        this.logger.warn(`semantic index load failed: ${(err as Error).message}`);
      });
    await this.loading;
    return this.index ?? { vectors: new Map(), loadedAt: Date.now() };
  }

  private async loadIndex(): Promise<void> {
    const rows = await this.prisma.productEmbedding.findMany({
      select: { productId: true, embedding: true, dims: true, updatedAt: true },
    });
    const vectors = new Map<string, Float32Array>();
    for (const row of rows) {
      const vector = decodeVector(row.embedding, row.dims);
      if (vector) vectors.set(row.productId, vector);
    }
    this.index = { vectors, loadedAt: Date.now() };
    this.logger.log(`semantic index loaded: ${vectors.size} vectors`);
  }

  /** Refresh embeddings whose search document changed, plus flagged ids. */
  private async refreshStale(): Promise<void> {
    if (!this.staleIds.size) {
      return this.refreshChangedDocs();
    }
    const ids = [...this.staleIds];
    this.staleIds.clear();
    try {
      const products = await this.prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        include: EMBED_INCLUDE,
      });
      await this.embedAndStore(products);
    } catch (err) {
      this.logger.warn(`stale re-embed failed: ${(err as Error).message}`);
    }
  }

  private async refreshChangedDocs(): Promise<void> {
    try {
      const rows = await this.prisma.productEmbedding.findMany({
        select: { productId: true, docHash: true },
      });
      const hashById = new Map(rows.map((r) => [r.productId, r.docHash]));
      const products = await this.prisma.product.findMany({
        where: { isActive: true, updatedAt: { gte: new Date(Date.now() - RELOAD_TTL_MS * 4) } },
        include: EMBED_INCLUDE,
      });
      const changed = products.filter((p) => {
        const hash = searchDocHash(buildEmbeddingDocument(p as SearchDocProduct));
        return hashById.get(p.id) !== hash;
      });
      if (changed.length) await this.embedAndStore(changed);
    } catch {
      // silent — background maintenance only
    }
  }

  private async embedAndStore(
    products: Array<Prisma.ProductGetPayload<{ include: typeof EMBED_INCLUDE }>>,
  ): Promise<void> {
    if (!products.length) return;
    const docs = products.map((p) => buildEmbeddingDocument(p as SearchDocProduct));
    const vectors = await this.provider.embed(docs);
    const model = process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";

    await this.prisma.$transaction(
      products.map((p, i) =>
        this.prisma.productEmbedding.upsert({
          where: { productId: p.id },
          create: {
            productId: p.id,
            model,
            dims: vectors[i].length,
            embedding: encodeVector(vectors[i]),
            docHash: searchDocHash(docs[i]),
          },
          update: {
            model,
            dims: vectors[i].length,
            embedding: encodeVector(vectors[i]),
            docHash: searchDocHash(docs[i]),
          },
        }),
      ),
    );

    if (this.index) {
      products.forEach((p, i) => this.index!.vectors.set(p.id, Float32Array.from(vectors[i])));
    }
    this.logger.log(`embedded ${products.length} products`);
  }
}

function encodeVector(vector: number[]): string {
  const buffer = new ArrayBuffer(vector.length * 4);
  const view = new DataView(buffer);
  vector.forEach((value, i) => view.setFloat32(i * 4, value, true));
  return Buffer.from(buffer).toString("base64");
}

function decodeVector(base64: string, dims: number): Float32Array | null {
  try {
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length < dims * 4) return null;
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const out = new Float32Array(dims);
    for (let i = 0; i < dims; i += 1) out[i] = view.getFloat32(i * 4, true);
    return out;
  } catch {
    return null;
  }
}

function norm(vector: number[] | Float32Array): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i += 1) sum += vector[i] * vector[i];
  return Math.sqrt(sum);
}

function cosine(a: number[], normA: number, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot / (normA * norm(b) || 1);
}
