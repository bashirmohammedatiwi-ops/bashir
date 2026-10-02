import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { createHash } from "node:crypto";
import { PrismaService } from "../../common/prisma.service";
import { ProductTagLite } from "./intelligence/types";
import { OpenAiAssistantClient } from "./openai-assistant.client";

const ROLES = new Set(["wash", "treat", "care", "protect", "other"]);
const AUDIENCES = new Set(["adult", "baby"]);
const TAG_BATCH = 20;
const EMBED_BATCH = 100;

type SourceProduct = {
  id: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  description: string | null;
  descriptionAr: string | null;
  howToUse: string | null;
  brand: { name: string } | null;
  category: { name: string } | null;
};

function productText(product: SourceProduct) {
  return [
    `name: ${product.nameAr || product.name} / ${product.nameEn || product.name}`,
    product.brand?.name ? `brand: ${product.brand.name}` : "",
    product.category?.name ? `category: ${product.category.name}` : "",
    `description: ${(product.descriptionAr || product.description || "").replace(/\s+/g, " ").slice(0, 700)}`,
    product.howToUse ? `use: ${product.howToUse.replace(/\s+/g, " ").slice(0, 200)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function hashOf(text: string) {
  return createHash("sha1").update(text).digest("hex");
}

/** وسوم المنتجات والبحث بالمعنى. الفهرس بالذاكرة لأن الكتالوج بآلاف، مو ملايين. */
@Injectable()
export class AssistantCatalogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AssistantCatalogService.name);
  private index: { at: number; tags: Map<string, ProductTagLite>; vectors: Array<{ id: string; v: Float32Array }> } | null = null;
  private loading: Promise<void> | null = null;
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly queryCache = new Map<string, Float32Array>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gpt: OpenAiAssistantClient,
    @Optional() private readonly adapter?: HttpAdapterHost,
  ) {}

  onModuleInit() {
    if (!this.adapter?.httpAdapter || process.env.ASSISTANT_AUTOTAG === "0" || !this.gpt.enabled) return;
    setTimeout(() => void this.refresh(100), 90_000).unref();
    this.timer = setInterval(() => void this.refresh(100), 60 * 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** يلصق الوسوم على صفوف المنتجات حتى الترتيب يستخدمها. */
  async attach<T extends { id: string; tags?: ProductTagLite }>(rows: T[]): Promise<T[]> {
    const index = await this.ensureIndex();
    if (!index) return rows;
    for (const row of rows) {
      const tag = index.tags.get(row.id);
      if (tag) row.tags = tag;
    }
    return rows;
  }

  async semantic(query: string, limit = 40): Promise<string[]> {
    const text = query.replace(/\s+/g, " ").trim().slice(0, 300);
    if (!text || !this.gpt.enabled) return [];
    const index = await this.ensureIndex();
    if (!index?.vectors.length) return [];
    try {
      let vector = this.queryCache.get(text);
      if (!vector) {
        const [raw] = await this.gpt.embed([text]);
        vector = normalize(raw);
        if (this.queryCache.size > 500) this.queryCache.clear();
        this.queryCache.set(text, vector);
      }
      const scored: Array<{ id: string; score: number }> = [];
      for (const item of index.vectors) {
        let dot = 0;
        for (let i = 0; i < vector.length; i += 1) dot += vector[i] * item.v[i];
        if (dot >= 0.3) scored.push({ id: item.id, score: dot });
      }
      scored.sort((a, b) => b.score - a.score);
      const floor = (scored[0]?.score ?? 0) - 0.12;
      return scored.filter((item) => item.score >= floor).slice(0, limit).map((item) => item.id);
    } catch (error) {
      this.logger.warn(`semantic search skipped: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async coverage() {
    const [tagged, total] = await Promise.all([
      this.prisma.assistantProductTag.count(),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);
    return { tagged, total };
  }

  /** يوسم المنتجات الجديدة أو اللي تغيّر نصها. */
  async refresh(limit = 100, concurrency = 1) {
    if (this.running) return { tagged: 0, remaining: -1 };
    this.running = true;
    try {
      const products = (await this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameEn: true,
          description: true,
          descriptionAr: true,
          howToUse: true,
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      })) as SourceProduct[];
      const existing = new Map(
        (await this.prisma.assistantProductTag.findMany({ select: { productId: true, sourceHash: true } })).map((row) => [row.productId, row.sourceHash]),
      );
      const pending = products
        .map((product) => ({ product, text: productText(product) }))
        .map((item) => ({ ...item, hash: hashOf(item.text) }))
        .filter((item) => existing.get(item.product.id) !== item.hash);
      const work = pending.slice(0, limit);
      const batches: Array<typeof work> = [];
      for (let i = 0; i < work.length; i += TAG_BATCH) batches.push(work.slice(i, i + TAG_BATCH));

      let tagged = 0;
      let cursor = 0;
      const worker = async () => {
        while (cursor < batches.length) {
          const batch = batches[cursor++];
          try {
            tagged += await this.tagBatch(batch);
          } catch (error) {
            this.logger.warn(`tag batch failed: ${error instanceof Error ? error.message : error}`);
          }
        }
      };
      await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
      if (tagged) this.index = null;
      return { tagged, remaining: pending.length - tagged };
    } finally {
      this.running = false;
    }
  }

  private async tagBatch(all: Array<{ product: SourceProduct; text: string; hash: string }>) {
    const labels = await this.gpt.tagProducts(all.map((item) => ({ id: item.product.id, text: item.text })));
    const byId = new Map(labels.map((label) => [String(label.id ?? ""), label]));
    const batch = all.filter((item) => byId.has(item.product.id));
    if (!batch.length) return 0;
    const embedTexts = batch.map((item) => {
      const label = byId.get(item.product.id);
      return [item.text, label?.summary ? `summary: ${String(label.summary)}` : "", Array.isArray(label?.concerns) ? `for: ${(label!.concerns as unknown[]).join(", ")}` : ""]
        .filter(Boolean)
        .join("\n");
    });
    const vectors: number[][] = [];
    for (let i = 0; i < embedTexts.length; i += EMBED_BATCH) vectors.push(...(await this.gpt.embed(embedTexts.slice(i, i + EMBED_BATCH))));

    await this.prisma.$transaction(
      batch.map((item, position) => {
        const label = byId.get(item.product.id)!;
        const data = {
          kind: String(label.kind ?? "other").slice(0, 20),
          role: ROLES.has(String(label.role)) ? String(label.role) : "other",
          area: String(label.area ?? "other").slice(0, 20),
          concerns: Array.isArray(label.concerns) ? (label.concerns as unknown[]).map(String).slice(0, 6) : [],
          audience: AUDIENCES.has(String(label.audience)) ? String(label.audience) : "adult",
          summary: String(label.summary ?? "").slice(0, 160),
          embedding: vectors[position] ?? [],
          sourceHash: item.hash,
        };
        return this.prisma.assistantProductTag.upsert({
          where: { productId: item.product.id },
          create: { productId: item.product.id, ...data },
          update: data,
        });
      }),
    );
    return batch.length;
  }

  private async ensureIndex() {
    if (this.index && Date.now() - this.index.at < 10 * 60_000) return this.index;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const rows = await this.prisma.assistantProductTag.findMany();
          const tags = new Map<string, ProductTagLite>();
          const vectors: Array<{ id: string; v: Float32Array }> = [];
          for (const row of rows) {
            tags.set(row.productId, { kind: row.kind, role: row.role, area: row.area, concerns: row.concerns, audience: row.audience, summary: row.summary });
            if (row.embedding.length) vectors.push({ id: row.productId, v: normalize(row.embedding) });
          }
          this.index = { at: Date.now(), tags, vectors };
        } catch (error) {
          this.logger.warn(`catalog index skipped: ${error instanceof Error ? error.message : error}`);
          this.index = { at: Date.now(), tags: new Map(), vectors: [] };
        } finally {
          this.loading = null;
        }
      })();
    }
    await this.loading;
    return this.index;
  }
}

function normalize(values: number[]) {
  const v = Float32Array.from(values);
  let sum = 0;
  for (const value of v) sum += value * value;
  const norm = Math.sqrt(sum) || 1;
  for (let i = 0; i < v.length; i += 1) v[i] /= norm;
  return v;
}
