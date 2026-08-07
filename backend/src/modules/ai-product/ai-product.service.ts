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
  private readonly autofillCache = new Map<string, { at: number; payload: Record<string, unknown> }>();

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
          cached: false,
        },
      };
    }

    const cacheKey = `v2|${digits}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.autofillCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 30 * 60_000) {
      return { ...cached.payload, meta: { ...(cached.payload.meta as object), cached: true } };
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

    // 2) Free facts first (helps image name queries) — zero AI
    const free = await this.freeBarcodeHint(digits);

    // 3) Cheap GPT call — NO web_search
    const rawGpt = await this.callGpt({
      apiKey,
      model,
      barcode: digits,
      free,
      hint: hint?.trim() || undefined,
    });
    const gpt = this.polishNaming(rawGpt);

    // 4) Images by barcode + product/brand name (not from AI)
    const imageHits = await this.images.searchByBarcode(digits, 36, [
      free.title ?? "",
      gpt.brand_en,
      gpt.name_en,
      `${gpt.brand_en} ${gpt.name_en}`.replace(`${gpt.brand_en} ${gpt.brand_en}`, gpt.brand_en),
      gpt.brand_ar,
    ]);

    const matched = await this.matchCategories(gpt);

    const payload = {
      exists: false as const,
      barcode: digits,
      brandAr: gpt.brand_ar,
      brandEn: gpt.brand_en,
      nameAr: gpt.name_ar,
      nameEn: gpt.name_en,
      descriptionAr: gpt.description_ar,
      descriptionEn: gpt.description_en,
      category: matched,
      confidence: gpt.confidence > 0 ? gpt.confidence : gpt.needs_review ? 55 : 70,
      needsReview: gpt.needs_review || gpt.confidence < 40,
      reviewNotes: null,
      sourceUrl: null,
      images: imageHits,
      meta: {
        model,
        usedWebSearch: false,
        freeHintSource: free.source ?? null,
        imageCount: imageHits.length,
        imageQuery: [digits, gpt.brand_en, gpt.name_en].filter(Boolean).join(" | "),
        aiSkipped: false,
        reason: null,
        cached: false,
      },
    };
    this.autofillCache.set(cacheKey, { at: Date.now(), payload: payload as unknown as Record<string, unknown> });
    return payload;
  }

  /** Refresh images by barcode + optional product name — no AI. */
  async searchImages(barcode: string, nameHint?: string) {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) throw new BadRequestException("باركود غير صالح");
    const hints = (nameHint ?? "")
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const images = await this.images.searchByBarcode(digits, 36, hints);
    return {
      barcode: digits,
      images,
      meta: {
        imageQuery: [digits, ...hints].join(" | "),
        imageCount: images.length,
      },
    };
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
        brand: { select: { id: true, name: true } },
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
            brand: { select: { id: true, name: true } },
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

    // Compact prompt — naming quality first, still no web_search
    const instructions = `Iraqi beauty e-commerce catalog writer (Al Hayaa). JSON only. Keep tokens low.

NAMING (strict — both languages MUST use: Brand - Product):
• name_ar = "{براند} {براند} - {نوع عربي} {خط EN} {صفات}"
  IMPORTANT: Arabic brand MUST appear TWICE before the dash (same spelling).
  Example: "هدى بيوتي هدى بيوتي - مجموعة كونتور وستروب Contour & Strobe Silverfox & Enchanting تثبيت عالي"
• name_en = "{BrandEn} - {expressive official product name}"
  Example: "Huda Beauty - Contour & Strobe Set Silverfox & Enchanting Long-Wear Glow"
• NEVER omit the " - " separator. Do NOT use two different brand spellings.

DESC_AR: 2 short Iraqi retail sentences + 3 benefit bullets.
DESC_EN: 2 short retail sentences + 3 benefit bullets.
Categories MUST match catalog names below (Arabic preferred):
${categoryHint}
If unsure: nearest category + needs_review=true. No shade barcodes.`;

    const userInput = `barcode=${args.barcode}
facts: ${known || "none — infer carefully, needs_review=true"}
Write expressive Brand - Product names in AR+EN, then fill the rest of the JSON.`;

    const payload: Record<string, unknown> = {
      model: args.model,
      instructions,
      input: userInput,
      max_output_tokens: 560,
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

  /** Enforce naming: EN "Brand - Product"; AR "Brand Brand - Product". */
  private polishNaming(gpt: GptAutofillJson): GptAutofillJson {
    const brandEn = this.canonicalBrandEn(gpt.brand_en || gpt.brand_ar || "");
    const brandAr = this.canonicalBrandAr(brandEn, gpt.brand_ar || "");
    const nameEn = this.ensureBrandDashName(gpt.name_en || "", brandEn, { doubleBrand: false });
    const nameAr = this.ensureBrandDashName(gpt.name_ar || "", brandAr, { doubleBrand: true });
    return {
      ...gpt,
      brand_en: brandEn || gpt.brand_en?.trim() || "",
      brand_ar: brandAr || gpt.brand_ar?.trim() || "",
      name_en: nameEn,
      name_ar: nameAr,
      confidence: typeof gpt.confidence === "number" ? gpt.confidence : 60,
    };
  }

  private canonicalBrandEn(raw: string): string {
    const n = this.norm(raw);
    if (!n) return raw.trim();
    const map: Array<[RegExp, string]> = [
      [/seventeen|سيفينتين|سفنتيين|سفنتين/, "Seventeen"],
      [/deborah\s*milano|deborah|ديبورا/, "Deborah Milano"],
      [/gosh|جوش/, "GOSH"],
      [/essence|اسنس|إسسنس/, "essence"],
      [/catrice|كاتريس/, "Catrice"],
      [/bourjois|بورجوا/, "Bourjois"],
      [/loreal|لوريال|لورييل/, "L'Oréal"],
      [/maybelline|ميبلين/, "Maybelline"],
      [/huda\s*beauty|هدى/, "Huda Beauty"],
      [/beesline|بيزلين|بيزلاين/, "Beesline"],
      [/garnier|غارنييه|غارنييه/, "Garnier"],
      [/radiant|راديانت/, "Radiant"],
      [/mon\s*reve|مون\s*ريف/, "Mon Reve"],
      [/grigi|جريجي/, "Grigi"],
    ];
    for (const [re, en] of map) {
      if (re.test(n)) return en;
    }
    return raw.trim().replace(/\s+/g, " ");
  }

  private canonicalBrandAr(brandEn: string, rawAr: string): string {
    const n = this.norm(brandEn || rawAr);
    const map: Array<[RegExp, string]> = [
      [/seventeen/, "سفنتين"],
      [/deborah/, "ديبورا ميلانو"],
      [/gosh/, "جوش"],
      [/essence/, "اسنس"],
      [/catrice/, "كاتريس"],
      [/bourjois/, "بورجوا"],
      [/l.?oreal/, "لوريال"],
      [/maybelline/, "ميبلين"],
      [/huda/, "هدى بيوتي"],
      [/beesline/, "بيزلين"],
      [/garnier/, "غارنييه"],
      [/radiant/, "راديانت"],
      [/mon\s*reve/, "مون ريف"],
      [/grigi/, "جريجي"],
    ];
    for (const [re, ar] of map) {
      if (re.test(n)) return ar;
    }
    const ar = rawAr.trim().replace(/\s+/g, " ");
    return ar || brandEn.trim();
  }

  private ensureBrandDashName(
    name: string,
    brand: string,
    opts: { doubleBrand?: boolean } = {},
  ): string {
    const cleaned = name.replace(/\s+/g, " ").trim();
    const b = brand.replace(/\s+/g, " ").trim();
    if (!cleaned) return b ? (opts.doubleBrand ? `${b} ${b} -` : `${b} -`) : "";
    if (!b) return cleaned;

    const dashParts = cleaned.split(/\s*[-–—]\s*/);
    let productPart = cleaned;

    // "Brand - Product" or "Brand Brand - Product"
    if (dashParts.length >= 2) {
      const left = dashParts[0].trim();
      const leftNorm = this.norm(left);
      const brandNorm = this.norm(b);
      const doubleNorm = this.norm(`${b} ${b}`);
      if (leftNorm === brandNorm || leftNorm === doubleNorm || this.namesMatch(left, b)) {
        productPart = dashParts.slice(1).join(" - ").trim();
      } else if (this.startsWithBrand(cleaned, b)) {
        productPart = cleaned.slice(b.length).replace(/^[\s:–—-]+/, "").trim();
        // strip second brand if present after first
        productPart = this.stripLeadingBrand(productPart, b).replace(/^[\s:–—-]+/, "").trim() || productPart;
      }
    } else if (this.startsWithBrand(cleaned, b)) {
      productPart = cleaned.slice(b.length).replace(/^[\s:–—-]+/, "").trim();
      productPart = this.stripLeadingBrand(productPart, b).replace(/^[\s:–—-]+/, "").trim() || productPart;
    } else {
      const stripped = this.stripLeadingBrand(cleaned, b);
      productPart = stripped || cleaned;
    }

    productPart = this.stripLeadingBrand(productPart, b).replace(/^[\s:–—-]+/, "").trim() || productPart;
    // Remove accidental alternate spellings of same brand at start (هودا بيوتي after هدى بيوتي)
    productPart = productPart.replace(/^(هودا\s*بيوتي|huda\s*beauty)\s*[-–—]?\s*/i, "").trim() || productPart;
    if (!productPart) productPart = cleaned;

    const prefix = opts.doubleBrand ? `${b} ${b}` : b;
    return `${prefix} - ${productPart}`;
  }

  private startsWithBrand(name: string, brand: string): boolean {
    return this.norm(name).startsWith(this.norm(brand));
  }

  private namesMatch(a: string, b: string): boolean {
    const na = this.norm(a);
    const nb = this.norm(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  }

  private stripLeadingBrand(text: string, brand: string): string {
    const t = text.trim();
    const b = brand.trim();
    if (!t || !b) return t;
    if (this.norm(t).startsWith(this.norm(b))) {
      return t.slice(b.length).replace(/^[\s:–—-]+/, "").trim();
    }
    // Also strip common Seventeen Arabic variants when canonical brand is سفنتين
    const variants = ["سيفينتين", "سفنتيين", "سفنتين", "Seventeen", "seventeen"];
    for (const v of variants) {
      if (this.norm(b).includes("seventeen") || this.norm(b).includes("سفنتين") || this.norm(b) === this.norm(v)) {
        if (this.norm(t).startsWith(this.norm(v))) {
          return t.slice(v.length).replace(/^[\s:–—-]+/, "").trim();
        }
      }
    }
    return t;
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
