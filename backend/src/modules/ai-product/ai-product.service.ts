import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { GoogleImagesService } from "./google-images.service";

type FreeHint = {
  title?: string;
  brand?: string;
  quantity?: string;
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
  review_notes: string | null;
  source_url: string;
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
    review_notes: { type: ["string", "null"] },
    source_url: { type: "string" },
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
    "review_notes",
    "source_url",
  ],
} as const;

@Injectable()
export class AiProductService {
  private readonly logger = new Logger(AiProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly images: GoogleImagesService,
  ) {}

  async autofill(barcode: string, hint?: string) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY غير مُعد على السيرفر");
    }

    const requested = (process.env.OPENAI_MODEL ?? "gpt-5.4-nano").trim();
    // Cursor slug gpt-5.6-luna-low is not an OpenAI API model — map to cheapest nano tier.
    const model =
      /luna[-_]?low/i.test(requested) || requested === "gpt-5.6-luna-low"
        ? "gpt-5.4-nano"
        : requested;
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) throw new BadRequestException("باركود غير صالح");

    const free = await this.freeBarcodeHint(digits);
    const useWebSearch = !free.title && !(hint && hint.trim());

    const gpt = await this.callGpt({
      apiKey,
      model,
      barcode: digits,
      free,
      hint: hint?.trim() || undefined,
      useWebSearch,
    });

    const imageQuery =
      [gpt.brand_en || gpt.brand_ar, gpt.name_en || gpt.name_ar, digits].filter(Boolean).join(" ").trim() ||
      digits;

    const [matched, imageHits] = await Promise.all([
      this.matchCategories(gpt),
      this.images.searchProductImages(imageQuery, 28),
    ]);

    return {
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
      reviewNotes: gpt.review_notes,
      sourceUrl: gpt.source_url,
      images: imageHits,
      meta: {
        model,
        usedWebSearch: useWebSearch,
        freeHintSource: free.source ?? null,
        imageCount: imageHits.length,
      },
    };
  }

  private async freeBarcodeHint(barcode: string): Promise<FreeHint> {
    try {
      const url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "AlhayaaAiAutofill/1.0" },
        signal: AbortSignal.timeout(8_000),
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
        source: "openbeautyfacts",
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
    useWebSearch: boolean;
  }): Promise<GptAutofillJson> {
    const categoryHint = await this.compactCategoryHint();

    const known = [
      args.free.title ? `Known title: ${args.free.title}` : null,
      args.free.brand ? `Known brand: ${args.free.brand}` : null,
      args.free.quantity ? `Known size: ${args.free.quantity}` : null,
      args.hint ? `Staff hint: ${args.hint}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const instructions = `You fill bilingual product fields for an Iraqi beauty e-commerce app (Al Hayaa).
Return STRICT JSON only. Keep text SHORT to save tokens.
Arabic: natural Iraqi market naming. English: professional retail naming.
Descriptions: 2–4 short sentences + 3–5 bullet benefits max. No fluff.
Pick category names ONLY from this catalog (Arabic names preferred):
${categoryHint}
If unsure, nearest category and needs_review=true.
Do NOT invent shade barcodes.`;

    const userInput = args.useWebSearch
      ? `Barcode: ${args.barcode}
STEP 1: ONE web search with query "${args.barcode}" only.
STEP 2: Fill JSON.
${known}`
      : `Barcode: ${args.barcode}
Use the known product facts below. Do NOT web search.
${known || "No external facts — infer carefully and set needs_review=true."}`;

    const payload: Record<string, unknown> = {
      model: args.model,
      instructions,
      input: userInput,
      max_output_tokens: 700,
      text: {
        format: {
          type: "json_schema",
          name: "ai_product_autofill",
          strict: true,
          schema: AUTOFILL_SCHEMA,
        },
      },
    };
    if (args.useWebSearch) {
      payload.tools = [{ type: "web_search" }];
    }

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
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
              take: 12,
            },
          },
          take: 16,
        },
      },
      take: 12,
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
            .slice(0, 6);
          return tert.length ? `${subLabel}[${tert.join(",")}]` : subLabel;
        })
        .filter(Boolean);
      lines.push(`${mainLabel}: ${subs.join(" | ")}`);
    }
    return lines.join("\n").slice(0, 3500);
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
        subcategoryNameAr = sub.nameAr || sub.name;
        const tert = await this.prisma.category.findMany({
          where: { parentId: sub.id, isActive: true },
          select: { id: true, nameAr: true, nameEn: true, name: true },
        });
        const t =
          this.bestMatch(tert, gpt.category_tertiary_ar, gpt.category_tertiary_ar) ??
          this.bestMatch(tert, gpt.category_tertiary_ar, "");
        if (t) {
          tertiaryCategoryId = t.id;
          tertiaryNameAr = t.nameAr || t.name;
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
    const targets = [ar, en].map((s) => this.norm(s)).filter(Boolean);
    if (!targets.length) return null;
    let best:
      | { id: string; nameAr: string | null; nameEn: string | null; name?: string | null; score: number }
      | null = null;
    for (const row of rows) {
      const candidates = [row.nameAr, row.nameEn, row.name]
        .map((s) => this.norm(s ?? ""))
        .filter(Boolean);
      let score = 0;
      for (const t of targets) {
        for (const c of candidates) {
          if (t === c) score = Math.max(score, 100);
          else if (t.includes(c) || c.includes(t)) score = Math.max(score, 70);
        }
      }
      if (score >= 40 && (!best || score > best.score)) best = { ...row, score };
    }
    return best;
  }

  private norm(s: string) {
    return s
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
