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
  imageUrl?: string;
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

  async autofill(barcode: string, hint?: string, modelChoice?: string, force = false) {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) throw new BadRequestException("باركود غير صالح");

    // 1) Duplicate check — no AI cost (unless force = review/correct mode)
    const existing = await this.findExistingProduct(digits);
    if (existing && !force) {
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
        issues: [],
        meta: {
          model: null,
          modelChoice: null,
          usedWebSearch: false,
          freeHintSource: null,
          imageCount: 0,
          imageQuery: digits,
          aiSkipped: true,
          reason: "duplicate",
          cached: false,
          force: false,
        },
      };
    }

    const resolved = this.resolveOpenAiModel(modelChoice);
    const cacheKey = `v8|${force ? "force|" : ""}${digits}|${resolved.apiModel}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.autofillCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 30 * 60_000) {
      return { ...cached.payload, meta: { ...(cached.payload.meta as object), cached: true } };
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY غير مُعد على السيرفر");
    }

    const model = resolved.apiModel;

    // 2) Free barcode DBs + go-upc (many regional beauty EANs are missing from OBF/UPC alone)
    const free = await this.freeBarcodeHint(digits);

    // 3) Barcode images first; supplement with brand/title only if barcode hits are thin
    const imageHits = await this.images.searchByBarcode(digits, 48, [
      free.brand,
      free.title,
      free.brand && free.title ? `${free.brand} ${free.title}`.slice(0, 90) : null,
      existing?.nameEn,
      existing?.nameAr,
    ].filter((s): s is string => Boolean(s && String(s).trim().length >= 2)));
    if (free.imageUrl?.startsWith("http")) {
      const key = free.imageUrl.toLowerCase();
      if (!imageHits.some((h) => h.url.toLowerCase() === key)) {
        imageHits.unshift({
          url: free.imageUrl,
          thumbUrl: free.imageUrl,
          title: free.title ?? digits,
          source: free.source ?? "barcode-db",
        });
      }
    }
    const imageTitles = this.extractIdentityTitles(imageHits);

    const reviewHint = existing
      ? [
          hint?.trim(),
          `CURRENT_IN_CATALOG name_ar=${existing.nameAr || existing.name || ""}`,
          `CURRENT name_en=${existing.nameEn || ""}`,
          `CURRENT brand=${(existing as { brand?: { name?: string } }).brand?.name || ""}`,
          "Compare barcode identity vs CURRENT; suggest corrections. Do not invent a different product.",
        ]
          .filter(Boolean)
          .join(" | ")
      : hint?.trim() || undefined;

    // 4) GPT with web_search — required for non-famous products; never invent
    const { gpt: rawGpt, usedWebSearch } = await this.callGpt({
      apiKey,
      model,
      barcode: digits,
      free,
      hint: reviewHint,
      imageTitles,
    });
    const gpt = this.polishNaming(rawGpt);

    const matched = await this.matchCategories(gpt);
    const issues = this.buildQualityIssues({
      existing,
      gpt,
      matched,
      imageCount: imageHits.length,
      free,
    });

    const payload = {
      exists: Boolean(existing) as boolean,
      barcode: digits,
      product: existing ?? null,
      brandAr: gpt.brand_ar,
      brandEn: gpt.brand_en,
      nameAr: gpt.name_ar,
      nameEn: gpt.name_en,
      descriptionAr: gpt.description_ar,
      descriptionEn: gpt.description_en,
      category: matched,
      confidence: gpt.confidence > 0 ? gpt.confidence : gpt.needs_review ? 35 : 70,
      needsReview: gpt.needs_review || gpt.confidence < 45 || issues.some((i) => i.severity === "high"),
      reviewNotes: existing
        ? issues.length
          ? `مراجعة منتج موجود — ${issues.length} ملاحظة`
          : "مراجعة منتج موجود — يبدو سليماً"
        : null,
      sourceUrl: null,
      images: imageHits,
      issues,
      current: existing
        ? {
            nameAr: existing.nameAr || existing.name || "",
            nameEn: existing.nameEn || "",
            brandName: (existing as { brand?: { name?: string } }).brand?.name || "",
            price: existing.price,
            stock: existing.stock,
          }
        : null,
      suggested: {
        nameAr: gpt.name_ar,
        nameEn: gpt.name_en,
        brandAr: gpt.brand_ar,
        brandEn: gpt.brand_en,
        descriptionAr: gpt.description_ar,
        descriptionEn: gpt.description_en,
        category: matched,
      },
      meta: {
        model,
        modelChoice: resolved.choice,
        usedWebSearch,
        freeHintSource: free.source ?? null,
        freeHintTitle: free.title ?? null,
        imageTitleHints: imageTitles.slice(0, 5),
        imageCount: imageHits.length,
        imageQuery: [digits, gpt.brand_en, gpt.name_en].filter(Boolean).join(" | "),
        aiSkipped: false,
        reason: existing ? "force_review" : null,
        cached: false,
        force: Boolean(force && existing),
      },
    };
    this.autofillCache.set(cacheKey, { at: Date.now(), payload: payload as unknown as Record<string, unknown> });
    return payload;
  }

  /** AI quality review for a barcode already in the catalog. */
  async reviewExisting(barcode: string, hint?: string, modelChoice?: string) {
    return this.autofill(barcode, hint, modelChoice, true);
  }

  listModels() {
    return {
      default: "gpt-5.6-luna-low",
      models: [
        {
          id: "gpt-5.6-luna-low",
          labelAr: "5.6 Luna Low",
          labelEn: "Luna Low",
          descriptionAr: "الأرخص — مع بحث ويب للباركود",
          apiModel: "gpt-5.4-nano",
          costTier: "lowest",
        },
        {
          id: "gpt-5.6-luna-medium",
          labelAr: "5.6 Luna Medium",
          labelEn: "Luna Medium",
          descriptionAr: "أدق للتسمية + بحث ويب — تكلفة أعلى قليلاً",
          apiModel: "gpt-5.4-mini",
          costTier: "medium",
        },
      ],
    };
  }

  /**
   * Cursor slugs (luna-low / luna-medium) are not OpenAI API model ids.
   * Map them to the closest cheap OpenAI models.
   */
  private resolveOpenAiModel(choice?: string): { choice: string; apiModel: string } {
    const raw = (choice ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna-low").trim();
    const key = raw.toLowerCase().replace(/_/g, "-");

    if (
      key === "gpt-5.6-luna-medium" ||
      key === "luna-medium" ||
      key === "luna-med" ||
      /luna[-]?med/i.test(key)
    ) {
      return { choice: "gpt-5.6-luna-medium", apiModel: "gpt-5.4-mini" };
    }

    if (
      key === "gpt-5.6-luna-low" ||
      key === "luna-low" ||
      /luna[-]?low/i.test(key) ||
      key === "gpt-5.4-nano"
    ) {
      return { choice: "gpt-5.6-luna-low", apiModel: "gpt-5.4-nano" };
    }

    if (key === "gpt-5.4-mini") {
      return { choice: "gpt-5.6-luna-medium", apiModel: "gpt-5.4-mini" };
    }

    // Allow explicit OpenAI ids as escape hatch
    if (/^gpt-/i.test(raw)) {
      return { choice: raw, apiModel: raw };
    }

    return { choice: "gpt-5.6-luna-low", apiModel: "gpt-5.4-nano" };
  }

  /** Refresh images by barcode + optional product name — no AI. */
  async searchImages(
    barcode: string,
    nameHint?: string,
    mode: "barcode" | "name" = "barcode",
    query?: string,
  ) {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) throw new BadRequestException("باركود غير صالح");

    if (mode === "name") {
      const q = (query ?? nameHint ?? "").replace(/\s+/g, " ").trim();
      if (q.length < 2) throw new BadRequestException("أدخل اسم المنتج للبحث");
      const images = await this.images.searchQuery(q, 48);
      return {
        barcode: digits,
        images,
        meta: { imageQuery: q, imageCount: images.length, mode: "name" },
      };
    }

    // Barcode mode: search digits like Google Images — do NOT mix product-name hints
    // (they dilute barcode results). User can switch to "بالاسم" for name search.
    const q = (query ?? digits).replace(/\D/g, "") || digits;
    const images = await this.images.searchByBarcode(q, 48);
    return {
      barcode: digits,
      images,
      meta: {
        imageQuery: q,
        imageCount: images.length,
        mode: "barcode",
      },
    };
  }

  private async findExistingProduct(barcode: string) {
    const candidates = barcodeLookupCandidates(barcode);
    if (!candidates.length) return null;

    const productSelect = {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      nameAr: true,
      nameEn: true,
      descriptionAr: true,
      descriptionEn: true,
      isActive: true,
      price: true,
      stock: true,
      brandId: true,
      categoryId: true,
      subcategoryId: true,
      tertiaryCategoryId: true,
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, nameAr: true, name: true } },
      _count: { select: { images: true, shades: true } },
    } as const;

    const product = await this.prisma.product.findFirst({
      where: { barcode: { in: candidates } },
      select: productSelect,
    });
    if (product) return product;

    const shade = await this.prisma.productShade.findFirst({
      where: { barcode: { in: candidates } },
      select: {
        name: true,
        barcode: true,
        product: { select: productSelect },
      },
    });
    if (!shade?.product) return null;
    return {
      ...shade.product,
      matchedShadeName: shade.name,
      matchedShadeBarcode: shade.barcode,
    };
  }

  private buildQualityIssues(args: {
    existing: Awaited<ReturnType<AiProductService["findExistingProduct"]>>;
    gpt: GptAutofillJson;
    matched: {
      categoryId: string | null;
      subcategoryId: string | null;
      tertiaryCategoryId: string | null;
    };
    imageCount: number;
    free: FreeHint;
  }): Array<{
    code: string;
    severity: "high" | "medium" | "low";
    field: string;
    messageAr: string;
    current?: string;
    suggested?: string;
  }> {
    const issues: Array<{
      code: string;
      severity: "high" | "medium" | "low";
      field: string;
      messageAr: string;
      current?: string;
      suggested?: string;
    }> = [];
    const ex = args.existing;
    const gpt = args.gpt;

    const curNameAr = (ex?.nameAr || ex?.name || "").trim();
    const curNameEn = (ex?.nameEn || "").trim();
    const curBrand = (ex as { brand?: { name?: string } } | null)?.brand?.name?.trim() || "";
    const curDescAr = (ex as { descriptionAr?: string } | null)?.descriptionAr?.trim() || "";
    const imageCountInDb = (ex as { _count?: { images?: number } } | null)?._count?.images ?? 0;

    if (!curNameAr) {
      issues.push({
        code: "name_ar_empty",
        severity: "high",
        field: "nameAr",
        messageAr: "الاسم العربي فارغ أو ضعيف",
        suggested: gpt.name_ar,
      });
    } else if (/(.)\1{3,}/.test(curNameAr) || /^(\S+)(\s+\1){2,}/.test(curNameAr)) {
      issues.push({
        code: "name_ar_repeated",
        severity: "high",
        field: "nameAr",
        messageAr: "تكرار غير طبيعي في الاسم العربي",
        current: curNameAr,
        suggested: gpt.name_ar,
      });
    } else if (
      gpt.name_ar &&
      this.norm(curNameAr) !== this.norm(gpt.name_ar) &&
      !this.norm(curNameAr).includes(this.norm(gpt.brand_ar || "").split(" ")[0] || "___")
    ) {
      // Suggest rename when AI identity differs meaningfully
      const a = this.norm(curNameAr);
      const b = this.norm(gpt.name_ar);
      if (a.length > 8 && b.length > 8 && !a.includes(b.slice(0, 12)) && !b.includes(a.slice(0, 12))) {
        issues.push({
          code: "name_ar_mismatch",
          severity: "medium",
          field: "nameAr",
          messageAr: "الاسم العربي قد لا يطابق هوية الباركود",
          current: curNameAr,
          suggested: gpt.name_ar,
        });
      }
    }

    if (!curNameEn && gpt.name_en) {
      issues.push({
        code: "name_en_empty",
        severity: "medium",
        field: "nameEn",
        messageAr: "الاسم الإنجليزي فارغ",
        suggested: gpt.name_en,
      });
    }

    if (curDescAr.length < 40 && (gpt.description_ar?.length ?? 0) > 40) {
      issues.push({
        code: "description_ar_weak",
        severity: "medium",
        field: "descriptionAr",
        messageAr: "الوصف العربي قصير أو ناقص",
        current: curDescAr.slice(0, 80),
        suggested: gpt.description_ar,
      });
    }

    if (curBrand && gpt.brand_en && this.norm(curBrand) !== this.norm(gpt.brand_en) && this.norm(curBrand) !== this.norm(gpt.brand_ar)) {
      const bn = this.norm(curBrand);
      const be = this.norm(gpt.brand_en);
      const ba = this.norm(gpt.brand_ar);
      if (!bn.includes(be.split(" ")[0] || "___") && !be.includes(bn.split(" ")[0] || "___") && !ba.includes(bn.split(" ")[0] || "___")) {
        issues.push({
          code: "brand_mismatch",
          severity: "high",
          field: "brand",
          messageAr: "البراند في الكتالوج قد لا يطابق نتيجة البحث",
          current: curBrand,
          suggested: `${gpt.brand_ar} / ${gpt.brand_en}`,
        });
      }
    }

    if (!ex?.categoryId && !args.matched.categoryId) {
      issues.push({
        code: "category_missing",
        severity: "high",
        field: "category",
        messageAr: "التصنيف غير محدد",
      });
    }

    if (imageCountInDb === 0) {
      issues.push({
        code: "images_missing",
        severity: "high",
        field: "images",
        messageAr: args.imageCount > 0 ? `لا صور في المتجر — وُجد ${args.imageCount} اقتراح بالباركود` : "لا صور للمنتج",
      });
    }

    if ((ex?.price ?? 0) <= 0) {
      issues.push({
        code: "price_zero",
        severity: "medium",
        field: "price",
        messageAr: "السعر غير مضبوط (0)",
      });
    }

    if (!args.free.title && gpt.needs_review) {
      issues.push({
        code: "weak_identity",
        severity: "medium",
        field: "identity",
        messageAr: "هوية الباركود ضعيفة — راجع الاسم يدوياً",
      });
    }

    if (gpt.confidence > 0 && gpt.confidence < 45) {
      issues.push({
        code: "low_confidence",
        severity: "medium",
        field: "confidence",
        messageAr: `ثقة التعرّف منخفضة (${Math.round(gpt.confidence)}%)`,
      });
    }

    return issues;
  }

  private async freeBarcodeHint(barcode: string): Promise<FreeHint> {
    const variants = barcodeLookupCandidates(barcode)
      .filter((v) => /^\d{8,14}$/.test(v))
      .slice(0, 3);

    const tasks: Promise<FreeHint>[] = [];
    for (const v of variants) {
      tasks.push(
        this.lookupOpenBeautyFacts(v),
        this.lookupOpenFoodFacts(v),
        this.lookupUpcItemDb(v),
        this.lookupGoUpc(v),
        this.lookupBuycott(v),
      );
    }
    const results = (await Promise.all(tasks)).filter((r) => r.title?.trim());
    if (!results.length) return {};

    const rank = (source?: string) => {
      switch (source) {
        case "openbeautyfacts":
          return 0;
        case "go-upc":
          return 1;
        case "buycott":
          return 2;
        case "upcitemdb":
          return 3;
        case "openfoodfacts":
          return 4;
        default:
          return 9;
      }
    };
    results.sort((a, b) => rank(a.source) - rank(b.source));
    const best = { ...results[0] };
    const altTitles = [
      ...new Set(
        results
          .slice(1)
          .map((r) => r.title!.trim())
          .filter((t) => t && this.norm(t) !== this.norm(best.title ?? "")),
      ),
    ].slice(0, 4);
    if (altTitles.length) {
      best.categoryHints = [...(best.categoryHints ?? []), ...altTitles.map((t) => `also:${t}`)].slice(
        0,
        8,
      );
    }
    if (!best.brand) {
      best.brand = results.find((r) => r.brand)?.brand;
    }
    if (!best.imageUrl) {
      best.imageUrl = results.find((r) => r.imageUrl)?.imageUrl;
    }
    return best;
  }

  private extractIdentityTitles(
    hits: Array<{ title?: string; source?: string }>,
  ): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const hit of hits) {
      const raw = (hit.title ?? "").replace(/\s+/g, " ").trim();
      if (raw.length < 8 || raw.length > 140) continue;
      if (/^\d[\d\s-]{6,}$/.test(raw)) continue;
      if (/^(image|photo|img|product|untitled)\b/i.test(raw)) continue;
      const key = this.norm(raw).slice(0, 80);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(raw);
      if (out.length >= 8) break;
    }
    return out;
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

  /** Public go-upc search — strong coverage for EU/ME beauty EANs. */
  private async lookupGoUpc(barcode: string): Promise<FreeHint> {
    try {
      const res = await fetch(`https://go-upc.com/search?q=${encodeURIComponent(barcode)}`, {
        headers: {
          Accept: "text/html",
          "User-Agent":
            "Mozilla/5.0 (compatible; AlhayaaAiAutofill/2.0; +https://deemaalhayat.com)",
        },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) return {};
      const html = await res.text();
      const h1 = html
        .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!h1 || /not found|no product|search results/i.test(h1)) return {};
      if (/^\d+$/.test(h1)) return {};
      const brand =
        html.match(/<td[^>]*>\s*Brand\s*<\/td>\s*<td[^>]*>([^<]+)/i)?.[1]?.trim() ||
        html.match(/Brand<\/[^>]+>\s*<[^>]+>([^<]+)/i)?.[1]?.trim();
      const cat =
        html.match(/<td[^>]*>\s*Category\s*<\/td>\s*<td[^>]*>([^<]+)/i)?.[1]?.trim() ||
        html.match(/Category<\/[^>]+>\s*<[^>]+>([^<]+)/i)?.[1]?.trim();
      const imageUrl =
        html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1]?.trim() ||
        html.match(/https?:\/\/[^"'\\\s>]*go-upc[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)/i)?.[0];
      return {
        title: h1.slice(0, 180),
        brand: brand || undefined,
        categoryHints: cat ? [cat] : undefined,
        imageUrl: imageUrl?.startsWith("http") ? imageUrl : undefined,
        source: "go-upc",
      };
    } catch {
      return {};
    }
  }

  private async lookupBuycott(barcode: string): Promise<FreeHint> {
    try {
      const res = await fetch(`https://www.buycott.com/upc/${encodeURIComponent(barcode)}`, {
        headers: {
          Accept: "text/html",
          "User-Agent":
            "Mozilla/5.0 (compatible; AlhayaaAiAutofill/2.0; +https://deemaalhayat.com)",
        },
        signal: AbortSignal.timeout(7_000),
      });
      if (!res.ok) return {};
      const html = await res.text();
      const title =
        html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1]?.trim() ||
        html
          .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
          ?.replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      if (!title || /not found|buycott|upc\/ean/i.test(title)) return {};
      const cleaned = title.replace(/\s*[|\-–—]\s*Buycott.*$/i, "").trim();
      if (cleaned.length < 4) return {};
      return { title: cleaned.slice(0, 180), source: "buycott" };
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
    imageTitles?: string[];
  }): Promise<{ gpt: GptAutofillJson; usedWebSearch: boolean }> {
    const categoryHint = await this.compactCategoryHint();

    const known = [
      args.free.title ? `db_title=${args.free.title}` : null,
      args.free.brand ? `db_brand=${args.free.brand}` : null,
      args.free.quantity ? `size=${args.free.quantity}` : null,
      args.free.source ? `db_source=${args.free.source}` : null,
      args.free.categoryHints?.length ? `db_tags=${args.free.categoryHints.join(",")}` : null,
      args.imageTitles?.length ? `image_titles=${args.imageTitles.slice(0, 6).join(" || ")}` : null,
      args.hint ? `staff=${args.hint}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const instructions = `كاتب كتالوج تجميل عراقي لمتجر الحياة (Al Hayaa). JSON فقط.

IDENTIFY (إلزامي — لا تختلق):
1) نفّذ web_search واحدة فقط باستعلام = أرقام الباركود فقط (${args.barcode}).
2) اعتمد نتائج البحث + قواعد الباركود + عناوين الصور. إذا تعارضت الحقائق المجانية مع الويب، ثق بالويب.
3) منتجات التجميل الإقليمية (يونان/شرق أوسط/أوروبا) غالباً غير مشهورة — ابحث بالباركود ولا تستبدلها بمنتج عالمي شهير مشابه.
4) إذا لم تجد مصدراً موثوقاً: needs_review=true و confidence≤30. ضع أفضل تخمين حذر من الحقائق المتوفرة فقط — ممنوع اختلاق براند/منتج مشهور خطأً.
5) لا تكتب وصفاً تسويقياً مفصلاً لمنتج غير مؤكد.

الجمهور: زبائن عراقيين — لهجة بيع مألوفة (فصحى قريبة من المحكي العراقي الخفيف).

NAMING (صارم):
• brand_ar / brand_en = اسم البراند فقط (مرة واحدة).
• name_en = "{BrandEn} - {Official Product Name}"  (البراند مرة واحدة قبل الشرطة)
• name_ar = "{براند} - {نوع عراقي} {اسم الخط EN} {صفة قصيرة} {الحجم إن وُجد}"
  البراند بالعربي يظهر مرة واحدة فقط قبل الشرطة — ممنوع تكراره.
  أمثلة:
  - "سفنتين - كونسيلر Ideal Cover Liquid بتغطية كاملة"
  - "كوسمالاين - جل استحمام Soft Wave برائحة الورد 650 مل"
  - "كريست - شرائط تبييض 3D Whitestrips Professional Effects"
• مفردات النوع: foundation→فاونديشن | concealer→كونسيلر | mascara→ماسكارا | lipstick→أحمر شفاه
  lip gloss→جلوس شفاه | lip liner→قلم شفاه | brow pencil→قلم حواجب | blush→بلاشر
  highlighter→هايلايتر | powder→بودرة | eyeliner→كحل أو ايلاينر | eyeshadow→ظل عيون
  primer→برايمر | serum→سيروم | moisturizer→مرطب | sunscreen→واقي شمس | whitening strips→شرائط تبييض

DESC_AR: جملتان قصيرتان بنبرة محل عراقي + 3 نقاط فوائد (أو وصف مختصر جداً إذا الثقة منخفضة).
DESC_EN: جملتان + 3 نقاط.
التصنيفات يجب أن تطابق الأسماء أدناه (فضّل العربي):
${categoryHint}
بدون باركود درجات.`;

    const userInput = `barcode=${args.barcode}
known: ${known || "none"}
STEP1: web_search query="${args.barcode}" once.
STEP2: return JSON — Iraqi name_ar + official name_en. If unknown: needs_review=true, confidence≤30.`;

    const payload: Record<string, unknown> = {
      model: args.model,
      instructions,
      input: userInput,
      max_output_tokens: 700,
      tools: [{ type: "web_search" }],
      text: {
        format: {
          type: "json_schema",
          name: "ai_product_autofill",
          strict: true,
          schema: AUTOFILL_SCHEMA,
        },
      },
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(75_000),
    });

    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = body.error as { message?: string } | undefined;
      this.logger.error(`OpenAI error: ${err?.message ?? res.status}`);
      throw new ServiceUnavailableException(err?.message ?? `OpenAI HTTP ${res.status}`);
    }

    const output = (body.output as unknown[]) ?? [];
    const usedWebSearch = output.some((item) => {
      const row = item as { type?: string };
      return row.type === "web_search_call" || row.type === "web_search";
    });
    const jsonText = this.extractJsonText(body);
    return { gpt: JSON.parse(jsonText) as GptAutofillJson, usedWebSearch };
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

  /** Enforce naming: EN/AR both "Brand - Product" (brand once). */
  private polishNaming(gpt: GptAutofillJson): GptAutofillJson {
    const brandEn = this.canonicalBrandEn(gpt.brand_en || gpt.brand_ar || "");
    const brandAr = this.canonicalBrandAr(brandEn, gpt.brand_ar || "");
    const nameEn = this.ensureBrandDashName(gpt.name_en || "", brandEn, { doubleBrand: false });
    const nameAr = this.ensureBrandDashName(gpt.name_ar || "", brandAr, { doubleBrand: false });
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
      [/huda\s*beauty|هدى|هودا/, "Huda Beauty"],
      [/beesline|بيزلين|بيزلاين/, "Beesline"],
      [/garnier|غارنييه/, "Garnier"],
      [/radiant|راديانت/, "Radiant"],
      [/mon\s*reve|مون\s*ريف/, "Mon Reve"],
      [/grigi|جريجي/, "Grigi"],
      [/crest|كريست/, "Crest"],
      [/cosmaline|كوسمالاين/, "Cosmaline"],
      [/oral[\s-]?b|اورال/, "Oral-B"],
      [/colgate|كولجيت/, "Colgate"],
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
      [/crest/, "كريست"],
      [/cosmaline/, "كوسمالاين"],
      [/oral[\s-]?b/, "اورال بي"],
      [/colgate/, "كولجيت"],
    ];
    for (const [re, ar] of map) {
      if (re.test(n)) return ar;
    }
    const ar = rawAr.trim().replace(/\s+/g, " ");
    return ar || brandEn.trim();
  }

  /** Build final title with brand prefix exactly once. */
  private ensureBrandDashName(
    name: string,
    brand: string,
    opts: { doubleBrand?: boolean } = {},
  ): string {
    const b = brand.replace(/\s+/g, " ").trim();
    if (!b) return name.replace(/\s+/g, " ").trim();

    const product = this.extractProductCore(name, b);
    // doubleBrand kept for backwards-compat but unused (always single brand now)
    const prefix = opts.doubleBrand ? `${b} ${b}` : b;
    if (!product) return `${prefix} -`;
    return `${prefix} - ${product}`;
  }

  /** Strip every leading brand repetition and return product-only text. */
  private extractProductCore(name: string, brand: string): string {
    let s = name.replace(/\s+/g, " ").trim();
    if (!s) return "";

    // If "anything - product", drop a left side that is only brand tokens
    const dash = s.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dash) {
      const left = dash[1].trim();
      const right = dash[2].trim();
      if (this.isOnlyBrandRepetition(left, brand)) {
        s = right;
      }
    }

    s = this.stripAllLeadingBrands(s, brand);
    // If product still starts with "Brand -", peel again
    s = this.stripAllLeadingBrands(s.replace(/^[-–—\s]+/, "").trim(), brand);
    return s.replace(/^[-–—\s]+/, "").trim();
  }

  private brandAliases(brand: string): string[] {
    const b = brand.replace(/\s+/g, " ").trim();
    const n = this.norm(b);
    const aliases = new Set<string>([b]);
    if (/crest|كريست/.test(n)) {
      ["Crest", "crest", "كريست"].forEach((a) => aliases.add(a));
    }
    if (/huda|هدى|هودا/.test(n)) {
      ["Huda Beauty", "Huda", "هدى بيوتي", "هودا بيوتي", "هدى"].forEach((a) => aliases.add(a));
    }
    if (/seventeen|سفنتين|سيفينتين|سفنتيين/.test(n)) {
      ["Seventeen", "سفنتين", "سيفينتين", "سفنتيين"].forEach((a) => aliases.add(a));
    }
    if (/deborah|ديبورا/.test(n)) {
      ["Deborah Milano", "Deborah", "ديبورا ميلانو", "ديبورا"].forEach((a) => aliases.add(a));
    }
    // Always include single first token for multi-word brands (Huda, Deborah…)
    const first = b.split(/\s+/)[0];
    if (first && first.length >= 3) aliases.add(first);
    return [...aliases].sort((a, c) => c.length - a.length);
  }

  private isOnlyBrandRepetition(left: string, brand: string): boolean {
    let rest = this.norm(left);
    if (!rest) return true;
    for (let i = 0; i < 12; i++) {
      let hit = false;
      for (const alias of this.brandAliases(brand)) {
        const a = this.norm(alias);
        if (!a) continue;
        if (rest === a) return true;
        if (rest.startsWith(a + " ")) {
          rest = rest.slice(a.length).trim();
          hit = true;
          break;
        }
      }
      if (!hit) break;
    }
    return rest.length === 0;
  }

  private stripAllLeadingBrands(text: string, brand: string): string {
    let s = text.replace(/\s+/g, " ").trim();
    for (let i = 0; i < 16; i++) {
      let changed = false;
      for (const alias of this.brandAliases(brand)) {
        const words = alias.split(/\s+/).filter(Boolean);
        const sWords = s.split(/\s+/).filter(Boolean);
        if (sWords.length < words.length) continue;
        const head = sWords.slice(0, words.length).join(" ");
        if (this.norm(head) === this.norm(alias)) {
          s = sWords.slice(words.length).join(" ").replace(/^[-–—:\s]+/, "").trim();
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }
    return s;
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
