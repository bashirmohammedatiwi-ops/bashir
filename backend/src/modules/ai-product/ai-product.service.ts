import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { barcodeLookupCandidates } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { GoogleImagesService } from "./google-images.service";

type FreeHint = {
  title?: string;
  brand?: string;
  quantity?: string;
  categoryHints?: string[];
  source?: string;
};

type GptAutofillJson = {
  brand_ar: string;
  brand_en: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category_main_ar: string;
  category_sub_ar: string;
  category_tertiary_ar: string;
  confidence: number;
  needs_review: boolean;
};

const AUTOFILL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    brand_ar: { type: "string" },
    brand_en: { type: "string" },
    name_ar: { type: "string" },
    name_en: { type: "string" },
    description_ar: { type: "string" },
    description_en: { type: "string" },
    category_main_ar: { type: "string" },
    category_sub_ar: { type: "string" },
    category_tertiary_ar: { type: "string" },
    confidence: { type: "number" },
    needs_review: { type: "boolean" },
  },
  required: [
    "brand_ar",
    "brand_en",
    "name_ar",
    "name_en",
    "description_ar",
    "description_en",
    "category_main_ar",
    "category_sub_ar",
    "category_tertiary_ar",
    "confidence",
    "needs_review",
  ],
} as const;

/** Beauty category synonym helpers for better matching without extra AI tokens. */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  كونسيلر: ["concealer", "cover", "تصحيح"],
  فاونديشن: ["foundation", "fond de teint", "كريم اساس", "كريم أساس"],
  ماسكارا: ["mascara"],
  "احمر شفاه": ["lipstick", "أحمر شفاه", "روج"],
  "قلم شفاه": ["lip liner", "lipliner", "قلم تحديد شفاه"],
  "قلم حواجب": ["brow pencil", "eyebrow pencil", "eyebrow"],
  "جل حواجب": ["brow gel", "eyebrow gel"],
  بلاشر: ["blush", "blusher", "احمر خدود", "أحمر خدود"],
  هايلايتر: ["highlighter", "highlight"],
  برونزر: ["bronzer"],
  بودرة: ["powder", "compact powder", "setting powder"],
  كحل: ["eyeliner", "kohl", "ايلاينر"],
  "ظل عيون": ["eyeshadow", "eye shadow"],
  برايمر: ["primer"],
  سيروم: ["serum"],
  مرطب: ["moisturizer", "moisturiser", "cream"],
  شامبو: ["shampoo"],
  "واقي شمس": ["sunscreen", "spf", "sun screen"],
};

@Injectable()
export class AiProductService {
  private readonly logger = new Logger(AiProductService.name);
  private categoryHintCache: { at: number; text: string } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly images: GoogleImagesService,
  ) {}

  async autofill(barcode: string, hint?: string) {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) throw new BadRequestException("باركود غير صالح");

    // 1) Duplicate check — no AI cost
    const existing = await this.findExistingProduct(digits);
    if (existing) {
      return {
        exists: true as const,
        barcode: digits,
        product: existing,
        brandAr: "",
        brandEn: "",
        nameAr: existing.nameAr || existing.name || "",
        nameEn: existing.nameEn || "",
        descriptionAr: "",
        descriptionEn: "",
        category: {
          categoryId: null,
          subcategoryId: null,
          tertiaryCategoryId: null,
          categoryNameAr: null,
          subcategoryNameAr: null,
          tertiaryNameAr: null,
        },
        confidence: 100,
        needsReview: false,
        reviewNotes: "المنتج موجود مسبقاً في المتجر",
        sourceUrl: null,
        images: [],
        meta: {
          model: null,
          usedWebSearch: false,
          freeHintSource: null,
          imageCount: 0,
          imageQuery: digits,
          aiSkipped: true,
          reason: "duplicate",
        },
      };
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY غير مُعد على السيرفر");
    }

    const requested = (process.env.OPENAI_MODEL ?? "gpt-5.4-nano").trim();
    const model =
      /luna[-_]?low/i.test(requested) || requested === "gpt-5.6-luna-low"
        ? "gpt-5.4-nano"
        : requested;

    // 2) Free barcode facts + barcode image search — parallel, zero AI
    const [free, imageHits] = await Promise.all([
      this.freeBarcodeHint(digits),
      this.images.searchByBarcode(digits, 32),
    ]);

    // 3) One cheap GPT call — NO web_search tool (images already from barcode search)
    const gpt = await this.callGpt({
      apiKey,
      model,
      barcode: digits,
      free,
      hint: hint?.trim() || undefined,
    });

    const matched = await this.matchCategories(gpt);

    return {
      exists: false as const,
      barcode: digits,
      brandAr: gpt.brand_ar,
      brandEn: gpt.brand_en,
      nameAr: gpt.name_ar,
      nameEn: gpt.name_en,
      descriptionAr: gpt.description_ar,
      descriptionEn: gpt.description_en,
      category: matched,
      confidence: gpt.confidence,
      needsReview: gpt.needs_review,
      reviewNotes: null,
      sourceUrl: null,
      images: imageHits,
      meta: {
        model,
        usedWebSearch: false,
        freeHintSource: free.source ?? null,
        imageCount: imageHits.length,
        imageQuery: digits,
        aiSkipped: false,
        reason: null,
      },
    };
  }

  /** Refresh images by barcode only — no AI. */
  async searchImages(barcode: string) {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) throw new BadRequestException("باركود غير صالح");
    const images = await this.images.searchByBarcode(digits, 32);
    return { barcode: digits, images, meta: { imageQuery: digits, imageCount: images.length } };
  }

  private async findExistingProduct(barcode: string) {
    const candidates = barcodeLookupCandidates(barcode);
    if (!candidates.length) return null;

    const product = await this.prisma.product.findFirst({
      where: { barcode: { in: candidates } },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        nameAr: true,
        nameEn: true,
        isActive: true,
        price: true,
        stock: true,
        brand: { select: { id: true, name: true, nameAr: true, nameEn: true } },
      },
    });
    if (product) return product;

    const shade = await this.prisma.productShade.findFirst({
      where: { barcode: { in: candidates } },
      select: {
        name: true,
        barcode: true,
        product: {
          select: {
            id: true,
            sku: true,
            barcode: true,
            name: true,
            nameAr: true,
            nameEn: true,
            isActive: true,
            price: true,
            stock: true,
            brand: { select: { id: true, name: true, nameAr: true, nameEn: true } },
          },
        },
      },
    });
    if (!shade?.product) return null;
    return {
      ...shade.product,
      matchedShadeName: shade.name,
      matchedShadeBarcode: shade.barcode,
    };
  }

  private async freeBarcodeHint(barcode: string): Promise<FreeHint> {
    const [obf, off, upc] = await Promise.all([
      this.lookupOpenBeautyFacts(barcode),
      this.lookupOpenFoodFacts(barcode),
      this.lookupUpcItemDb(barcode),
    ]);
    return obf.title ? obf : off.title ? off : upc.title ? upc : {};
  }

  private async lookupOpenBeautyFacts(barcode: string): Promise<FreeHint> {
    try {
      const url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "AlhayaaAiAutofill/2.0" },
        signal: AbortSignal.timeout(7_000),
      });
      if (!res.ok) return {};
      const body = (await res.json()) as {
        status?: number;
        product?: {
          product_name?: string;
          product_name_en?: string;
          product_name_ar?: string;
          brands?: string;
          quantity?: string;
          categories_tags?: string[];
        };
      };
      if (body.status !== 1 || !body.product) return {};
      const p = body.product;
      const title = (p.product_name_en || p.product_name || p.product_name_ar || "").trim();
      if (!title) return {};
      return {
        title,
        brand: (p.brands ?? "").split(",")[0]?.trim() || undefined,
        quantity: p.quantity?.trim() || undefined,
        categoryHints: (p.categories_tags ?? []).slice(0, 6).map((t) => t.replace(/^en:/, "")),
        source: "openbeautyfacts",
      };
    } catch {
      return {};
    }
  }

  private async lookupOpenFoodFacts(barcode: string): Promise<FreeHint> {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "AlhayaaAiAutofill/2.0" },
        signal: AbortSignal.timeout(7_000),
      });
      if (!res.ok) return {};
      const body = (await res.json()) as {
        status?: number;
        product?: {
          product_name?: string;
          product_name_en?: string;
          brands?: string;
          quantity?: string;
          categories_tags?: string[];
        };
      };
      if (body.status !== 1 || !body.product) return {};
      const p = body.product;
      const title = (p.product_name_en || p.product_name || "").trim();
      if (!title) return {};
      return {
        title,
        brand: (p.brands ?? "").split(",")[0]?.trim() || undefined,
        quantity: p.quantity?.trim() || undefined,
        categoryHints: (p.categories_tags ?? []).slice(0, 6).map((t) => t.replace(/^en:/, "")),
        source: "openfoodfacts",
      };
    } catch {
      return {};
    }
  }

  private async lookupUpcItemDb(barcode: string): Promise<FreeHint> {
    try {
      const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "AlhayaaAiAutofill/2.0" },
        signal: AbortSignal.timeout(7_000),
      });
      if (!res.ok) return {};
      const body = (await res.json()) as {
        items?: Array<{ title?: string; brand?: string; size?: string; category?: string }>;
      };
      const item = body.items?.[0];
      if (!item?.title?.trim()) return {};
      return {
        title: item.title.trim(),
        brand: item.brand?.trim() || undefined,
        quantity: item.size?.trim() || undefined,
        categoryHints: item.category ? [item.category] : undefined,
        source: "upcitemdb",
      };
    } catch {
      return {};
    }
  }

  private async callGpt(args: {
    apiKey: string;
    model: string;
    barcode: string;
    free: FreeHint;
    hint?: string;
  }): Promise<GptAutofillJson> {
    const categoryHint = await this.compactCategoryHint();

    const known = [
      args.free.title ? `title=${args.free.title}` : null,
      args.free.brand ? `brand=${args.free.brand}` : null,
      args.free.quantity ? `size=${args.free.quantity}` : null,
      args.free.categoryHints?.length ? `tags=${args.free.categoryHints.join(",")}` : null,
      args.hint ? `staff=${args.hint}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    // Compact prompt — no web_search, tiny output budget
    const instructions = `Iraqi beauty shop catalog writer. JSON only. Minimal tokens.
NAME_AR: "[براند عربي] - [نوع] [اسم الخط EN]" e.g. "سفنتين - كونسيلر Ideal Cover Liquid"
NAME_EN: "[Brand] - [Official Name]" e.g. "Seventeen - Ideal Cover Liquid Concealer"
DESC_AR: 2 short Iraqi retail sentences + 3 benefit bullets.
DESC_EN: 2 short retail sentences + 3 benefit bullets.
Categories MUST match catalog names below (Arabic preferred):
${categoryHint}
If unsure: nearest category + needs_review=true. No shade barcodes.`;

    const userInput = `barcode=${args.barcode}
facts: ${known || "none — infer carefully, needs_review=true"}
Fill product JSON.`;

    const payload: Record<string, unknown> = {
      model: args.model,
      instructions,
      input: userInput,
      max_output_tokens: 480,
      text: {
        format: {
          type: "json_schema",
          name: "ai_product_autofill",
          strict: true,
          schema: AUTOFILL_SCHEMA,
        },
      },
    };
    // Intentionally NO tools / web_search — images come from barcode search; facts from free APIs.

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });

    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = body.error as { message?: string } | undefined;
      this.logger.error(`OpenAI error: ${err?.message ?? res.status}`);
      throw new ServiceUnavailableException(err?.message ?? `OpenAI HTTP ${res.status}`);
    }

    const jsonText = this.extractJsonText(body);
    return JSON.parse(jsonText) as GptAutofillJson;
  }

  private extractJsonText(body: Record<string, unknown>): string {
    const output = (body.output as unknown[]) ?? [];
    for (const item of output) {
      const row = item as { type?: string; content?: Array<{ type?: string; text?: string }> };
      if (row.type !== "message" || !row.content) continue;
      for (const part of row.content) {
        if ((part.type === "output_text" || part.type === "text") && part.text) return part.text;
      }
    }
    const top = body.output_text;
    if (typeof top === "string" && top.trim()) return top;
    throw new ServiceUnavailableException("رد GPT فارغ");
  }

  private async compactCategoryHint(): Promise<string> {
    const now = Date.now();
    if (this.categoryHintCache && now - this.categoryHintCache.at < 10 * 60_000) {
      return this.categoryHintCache.text;
    }

    const mains = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      select: {
        nameAr: true,
        nameEn: true,
        name: true,
        children: {
          where: { isActive: true },
          select: {
            nameAr: true,
            nameEn: true,
            name: true,
            children: {
              where: { isActive: true },
              select: { nameAr: true, nameEn: true, name: true },
              take: 8,
            },
          },
          take: 12,
        },
      },
      take: 10,
      orderBy: { position: "asc" },
    });

    const lines: string[] = [];
    for (const m of mains) {
      const mainLabel = m.nameAr || m.nameEn || m.name;
      const subs = m.children
        .map((s) => {
          const subLabel = s.nameAr || s.nameEn || s.name;
          const tert = s.children
            .map((t) => t.nameAr || t.nameEn || t.name)
            .filter(Boolean)
            .slice(0, 4);
          return tert.length ? `${subLabel}>{${tert.join(",")}}` : subLabel;
        })
        .filter(Boolean);
      lines.push(`${mainLabel}: ${subs.join(" | ")}`);
    }
    const text = lines.join("\n").slice(0, 2200);
    this.categoryHintCache = { at: now, text };
    return text;
  }

  private async matchCategories(gpt: GptAutofillJson) {
    const mains = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      select: { id: true, nameAr: true, nameEn: true, name: true },
    });
    const main =
      this.bestMatch(mains, gpt.category_main_ar, gpt.category_main_ar) ??
      this.bestMatch(mains, gpt.category_main_ar, "");

    let subcategoryId: string | null = null;
    let tertiaryCategoryId: string | null = null;
    let subcategoryNameAr: string | null = null;
    let tertiaryNameAr: string | null = null;

    if (main) {
      const subs = await this.prisma.category.findMany({
        where: { parentId: main.id, isActive: true },
        select: { id: true, nameAr: true, nameEn: true, name: true },
      });
      const sub =
        this.bestMatch(subs, gpt.category_sub_ar, gpt.category_sub_ar) ??
        this.bestMatch(subs, gpt.category_sub_ar, "");
      if (sub) {
        subcategoryId = sub.id;
        subcategoryNameAr = sub.nameAr || sub.name || null;
        const tert = await this.prisma.category.findMany({
          where: { parentId: sub.id, isActive: true },
          select: { id: true, nameAr: true, nameEn: true, name: true },
        });
        const t =
          this.bestMatch(tert, gpt.category_tertiary_ar, gpt.category_tertiary_ar) ??
          this.bestMatch(tert, gpt.category_tertiary_ar, "");
        if (t) {
          tertiaryCategoryId = t.id;
          tertiaryNameAr = t.nameAr || t.name || null;
        }
      }
    }

    return {
      categoryId: main?.id ?? null,
      subcategoryId,
      tertiaryCategoryId,
      categoryNameAr: main?.nameAr || main?.name || gpt.category_main_ar,
      subcategoryNameAr: subcategoryNameAr ?? gpt.category_sub_ar,
      tertiaryNameAr: tertiaryNameAr ?? gpt.category_tertiary_ar,
    };
  }

  private bestMatch(
    rows: Array<{ id: string; nameAr: string | null; nameEn: string | null; name?: string | null }>,
    ar: string,
    en: string,
  ) {
    const targets = this.expandTargets([ar, en]);
    if (!targets.length) return null;
    let best:
      | { id: string; nameAr: string | null; nameEn: string | null; name?: string | null; score: number }
      | null = null;
    for (const row of rows) {
      const candidates = [row.nameAr, row.nameEn, row.name]
        .map((s) => this.norm(s ?? ""))
        .filter(Boolean);
      const expandedCandidates = this.expandTargets(candidates);
      let score = 0;
      for (const t of targets) {
        for (const c of expandedCandidates) {
          if (t === c) score = Math.max(score, 100);
          else if (t.includes(c) || c.includes(t)) score = Math.max(score, 72);
          else if (this.tokenOverlap(t, c) >= 0.6) score = Math.max(score, 55);
        }
      }
      if (score >= 40 && (!best || score > best.score)) best = { ...row, score };
    }
    return best;
  }

  private expandTargets(raw: string[]): string[] {
    const out = new Set<string>();
    for (const s of raw) {
      const n = this.norm(s);
      if (!n) continue;
      out.add(n);
      for (const [key, syns] of Object.entries(CATEGORY_SYNONYMS)) {
        const kn = this.norm(key);
        if (n.includes(kn) || kn.includes(n)) {
          out.add(kn);
          for (const syn of syns) out.add(this.norm(syn));
        }
        for (const syn of syns) {
          const sn = this.norm(syn);
          if (n.includes(sn) || sn.includes(n)) {
            out.add(kn);
            out.add(sn);
          }
        }
      }
    }
    return [...out];
  }

  private tokenOverlap(a: string, b: string): number {
    const ta = new Set(a.split(" ").filter((t) => t.length > 1));
    const tb = new Set(b.split(" ").filter((t) => t.length > 1));
    if (!ta.size || !tb.size) return 0;
    let hit = 0;
    for (const t of ta) if (tb.has(t)) hit++;
    return hit / Math.max(ta.size, tb.size);
  }

  private norm(s: string) {
    return s
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
