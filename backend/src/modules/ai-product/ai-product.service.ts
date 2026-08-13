import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { barcodeLookupCandidates } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { CursorNamingClient } from "./cursor-naming.client";
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
  /** Short catalog codes from the tree, e.g. M01 / S03 / T12 — preferred over names. */
  category_main_code: string;
  category_sub_codes: string[];
  category_tertiary_codes: string[];
  /** Human labels (echo of chosen codes) — fallback if codes missing/invalid. */
  category_main_ar: string;
  category_sub_ar: string;
  category_tertiary_ar: string;
  category_subs_ar: string[];
  category_tertiaries_ar: string[];
  confidence: number;
  needs_review: boolean;
};

type GptShadeRow = {
  barcode: string;
  code: string;
  name_en: string;
  name_ar: string;
  color_hex: string;
};

type CategoryCodeEntry = {
  id: string;
  code: string;
  level: "main" | "sub" | "tertiary";
  parentCode: string | null;
  parentId: string | null;
  nameAr: string;
};

type CategoryCatalog = {
  at: number;
  text: string;
  byCode: Map<string, CategoryCodeEntry>;
};

/** Beauty product-type synonyms — fallback name matching only (not primary). */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  كونسيلر: ["concealer", "cover", "تصحيح"],
  فاونديشن: ["foundation", "fond de teint", "كريم اساس", "كريم أساس"],
  ماسكارا: ["mascara"],
  "احمر شفاه": ["lipstick", "أحمر شفاه", "روج", "ليبستيك", "lip stick"],
  "جلوس شفاه": ["lip gloss", "ليب جلوس", "لمعان شفاه"],
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
  "عناية الفم": ["oral care", "dental", "toothpaste", "معجون اسنان", "معجون أسنان", "غسول فم"],
  "عناية الفم والاسنان": ["oral", "dental care", "teeth"],
};

/** Tokens too generic for fallback name matching. */
const GENERIC_CATEGORY_TOKENS = new Set(
  [
    "عناية",
    "العناية",
    "مكياج",
    "تجميل",
    "وجه",
    "عيون",
    "شفاه",
    "حواجب",
    "شعر",
    "جسم",
    "بشرة",
    "care",
    "skin",
    "makeup",
    "face",
    "eye",
    "eyes",
    "lips",
    "lip",
    "hair",
    "body",
  ].map((s) => s.toLowerCase()),
);

@Injectable()
export class AiProductService {
  private readonly logger = new Logger(AiProductService.name);
  private categoryCatalogCache: CategoryCatalog | null = null;
  private readonly autofillCache = new Map<string, { at: number; payload: Record<string, unknown> }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly images: GoogleImagesService,
    private readonly cursor: CursorNamingClient,
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

    const resolved = this.cursor.resolveModel(modelChoice);
    const cacheKey = `v13|${force ? "force|" : ""}${digits}|${resolved.choice}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.autofillCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 30 * 60_000) {
      const cachedPayload = cached.payload as {
        nameAr?: string;
        nameEn?: string;
        brandAr?: string;
        brandEn?: string;
        category?: { categoryId?: string | null };
      };
      const hasName = Boolean((cachedPayload.nameAr || cachedPayload.nameEn || "").trim());
      const hasBrand = Boolean((cachedPayload.brandAr || cachedPayload.brandEn || "").trim());
      if (hasName && hasBrand) {
        return { ...cached.payload, meta: { ...(cached.payload.meta as object), cached: true } };
      }
      this.autofillCache.delete(cacheKey);
    }

    if (!this.cursor.hasApiKey()) {
      throw new ServiceUnavailableException("CURSOR_API_KEY غير مُعد على السيرفر");
    }

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

    // 4) Heuristic identity + template desc/category. Composer 2.5 Low verifies bilingual names only.
    const draft = this.buildHeuristicAutofill({ barcode: digits, free, imageTitles, hint: reviewHint });
    const named = await this.cursor.verifyBilingualNames(
      {
        barcode: digits,
        brand_ar: draft.brand_ar,
        brand_en: draft.brand_en,
        name_ar: draft.name_ar,
        name_en: draft.name_en,
        dbTitle: free.title,
        dbBrand: free.brand,
        quantity: free.quantity,
        imageTitles,
        hint: reviewHint,
      },
      resolved.choice,
    );
    const gpt = this.polishNaming({
      ...draft,
      brand_ar: named.brand_ar || draft.brand_ar,
      brand_en: named.brand_en || draft.brand_en,
      name_ar: named.name_ar || draft.name_ar,
      name_en: named.name_en || draft.name_en,
      needs_review: draft.needs_review || !named.verified,
      confidence: named.verified ? Math.max(draft.confidence, 72) : Math.min(draft.confidence, 45),
    });
    const namesVerified = named.verified && !this.isWeakGpt(gpt);

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
        model: resolved.apiModel,
        modelChoice: resolved.choice,
        fast: resolved.fast,
        usedWebSearch: false,
        namesVerified,
        namingSource: namesVerified ? "composer-2.5" : "heuristic",
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
    const cacheable =
      Boolean((payload.nameAr || payload.nameEn || "").trim()) &&
      Boolean((payload.brandAr || payload.brandEn || "").trim());
    if (cacheable) {
      this.autofillCache.set(cacheKey, { at: Date.now(), payload: payload as unknown as Record<string, unknown> });
    }
    return payload;
  }

  /** AI quality review for a barcode already in the catalog. */
  async reviewExisting(barcode: string, hint?: string, modelChoice?: string) {
    return this.autofill(barcode, hint, modelChoice, true);
  }

  /**
   * Makeup shade-family add: many scanned EANs → one product + shade list
   * (code, official name, hex) + bilingual naming. Images are chosen on the phone.
   */
  async shadeFamily(rawBarcodes: string[], hint?: string, modelChoice?: string) {
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const raw of rawBarcodes ?? []) {
      const digits = String(raw ?? "").replace(/\D/g, "") || String(raw ?? "").trim();
      if (digits.length < 6) continue;
      const key = digits.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(digits);
      if (unique.length >= 40) break;
    }
    if (!unique.length) throw new BadRequestException("أدخل باركود تدرج واحد على الأقل");

    if (!this.cursor.hasApiKey()) {
      throw new ServiceUnavailableException("CURSOR_API_KEY غير مُعد على السيرفر");
    }

    const resolved = this.cursor.resolveModel(modelChoice);
    const cacheKey = `shade-v2|${unique.join(",")}|${resolved.choice}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.autofillCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 20 * 60_000) {
      return { ...cached.payload, meta: { ...(cached.payload.meta as object), cached: true } };
    }

    const existingHits = (
      await Promise.all(
        unique.map(async (barcode) => {
          const product = await this.findExistingProduct(barcode);
          if (!product) return null;
          return {
            barcode,
            productId: product.id,
            nameAr: product.nameAr || product.name || "",
            nameEn: product.nameEn || "",
            matchedShadeName: (product as { matchedShadeName?: string }).matchedShadeName || null,
          };
        }),
      )
    ).filter((h): h is NonNullable<typeof h> => Boolean(h));

    const hintBarcodes = unique.slice(0, 5);
    const freeByBarcode = new Map<string, FreeHint>();
    for (let i = 0; i < hintBarcodes.length; i += 2) {
      const chunk = hintBarcodes.slice(i, i + 2);
      const part = await Promise.all(
        chunk.map(async (barcode) => [barcode, await this.freeBarcodeHint(barcode)] as const),
      );
      for (const [barcode, free] of part) freeByBarcode.set(barcode, free);
    }

    const lead = unique[0];
    const leadFree = freeByBarcode.get(lead) ?? {};
    const imageHits = await this.images.searchByBarcode(lead, 24, [
      leadFree.brand,
      leadFree.title,
      hint,
    ].filter((s): s is string => Boolean(s && String(s).trim().length >= 2)));
    const imageTitles = this.extractIdentityTitles(imageHits);

    const draft = this.buildHeuristicAutofill({
      barcode: lead,
      free: leadFree,
      imageTitles,
      hint,
      shadeFamily: true,
    });
    const shadeRows = unique.map((barcode, index) =>
      this.guessShadeRow(barcode, freeByBarcode.get(barcode), imageTitles, index),
    );
    const named = await this.cursor.verifyBilingualNames(
      {
        barcode: lead,
        brand_ar: draft.brand_ar,
        brand_en: draft.brand_en,
        name_ar: draft.name_ar,
        name_en: draft.name_en,
        dbTitle: leadFree.title,
        dbBrand: leadFree.brand,
        quantity: leadFree.quantity,
        imageTitles,
        hint,
        extraContext: `shade_family barcodes=${unique.join(",")} product_type=${draft.category_tertiary_ar || ""}`,
      },
      resolved.choice,
    );
    const polished = this.polishNaming({
      ...draft,
      brand_ar: named.brand_ar || draft.brand_ar,
      brand_en: named.brand_en || draft.brand_en,
      name_ar: named.name_ar || draft.name_ar,
      name_en: named.name_en || draft.name_en,
      needs_review: draft.needs_review || !named.verified,
      confidence: named.verified ? Math.max(draft.confidence, 72) : Math.min(draft.confidence, 45),
    });
    const namesVerified = named.verified && !this.isWeakGpt(polished);
    const matched = await this.matchCategories(polished);

    const gptByBarcode = new Map<string, GptShadeRow>();
    for (const row of shadeRows) {
      const key = (String(row.barcode ?? "").replace(/\D/g, "") || String(row.barcode ?? "").trim()).toLowerCase();
      if (!key) continue;
      gptByBarcode.set(key, row);
    }

    const shades = unique.map((barcode, index) => {
      const row = gptByBarcode.get(barcode.toLowerCase());
      const code = String(row?.code ?? "").trim();
      const nameEn = String(row?.name_en ?? "").trim();
      const nameAr = this.polishMarketArabic(String(row?.name_ar ?? "").trim());
      let name = "";
      if (code && nameEn && !nameEn.toLowerCase().startsWith(code.toLowerCase())) {
        name = `${code} ${nameEn}`;
      } else if (nameEn) {
        name = nameEn;
      } else if (code && nameAr) {
        name = `${code} ${nameAr}`;
      } else {
        name = nameAr || code || `تدرج ${index + 1}`;
      }
      return {
        barcode,
        code,
        name,
        nameEn: nameEn || name,
        nameAr: nameAr || name,
        colorHex: this.normalizeShadeHex(row?.color_hex),
        position: index,
      };
    });

    const galleryQuery = [polished.brand_en || polished.brand_ar, polished.name_en || polished.name_ar]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
    let galleryImages = imageHits;
    if (galleryQuery.length >= 4) {
      try {
        const extra = await this.images.searchQuery(galleryQuery, 36);
        const seenUrl = new Set(galleryImages.map((h) => h.url.toLowerCase()));
        for (const hit of extra) {
          if (seenUrl.has(hit.url.toLowerCase())) continue;
          seenUrl.add(hit.url.toLowerCase());
          galleryImages.push(hit);
        }
      } catch (err) {
        this.logger.warn(`Shade-family gallery search failed: ${(err as Error).message}`);
      }
    }

    const payload = {
      barcodes: unique,
      brandAr: polished.brand_ar,
      brandEn: polished.brand_en,
      nameAr: polished.name_ar,
      nameEn: polished.name_en,
      descriptionAr: polished.description_ar,
      descriptionEn: polished.description_en,
      productTypeAr: String(draft.category_tertiary_ar || draft.category_sub_ar || "").trim(),
      category: matched,
      confidence: polished.confidence > 0 ? polished.confidence : polished.needs_review ? 35 : 70,
      needsReview: polished.needs_review || polished.confidence < 45 || shades.some((s) => !s.code),
      shades,
      images: galleryImages,
      existingHits,
      meta: {
        model: resolved.apiModel,
        modelChoice: resolved.choice,
        fast: resolved.fast,
        usedWebSearch: false,
        namesVerified,
        namingSource: namesVerified ? "composer-2.5" : "heuristic",
        shadeCount: shades.length,
        imageCount: galleryImages.length,
        imageQuery: galleryQuery || lead,
        cached: false,
      },
    };

    this.autofillCache.set(cacheKey, { at: Date.now(), payload: payload as unknown as Record<string, unknown> });
    return payload;
  }

  listModels() {
    return {
      default: "composer-2.5-low",
      namesOnly: true,
      provider: "cursor",
      models: [
        {
          id: "composer-2.5-low",
          labelAr: "Composer 2.5 Low",
          labelEn: "Composer 2.5 Low",
          descriptionAr: "تأكيد الاسم بالعربي والإنجليزي فقط — الأرخص",
          apiModel: "composer-2.5",
          fast: false,
          costTier: "lowest",
        },
        {
          id: "composer-2.5-fast",
          labelAr: "Composer 2.5 Fast",
          labelEn: "Composer 2.5 Fast",
          descriptionAr: "نفس التأكيد على الاسم — أسرع بتكلفة أعلى",
          apiModel: "composer-2.5",
          fast: true,
          costTier: "medium",
        },
      ],
    };
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

    // Barcode mode: digits + name hints; filter drops barcode-sticker junk
    const q = (query ?? digits).replace(/\D/g, "") || digits;
    const hints = (nameHint ?? "")
      .split(/[|,/]+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 2);
    const images = await this.images.searchByBarcode(q, 48, hints);
    return {
      barcode: digits,
      images,
      meta: {
        imageQuery: hints.length ? `${q} | ${hints[0]}` : q,
        imageCount: images.length,
        mode: "barcode",
        nameHints: hints.slice(0, 3),
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

    const arPrefix = this.brandPrefixForArabicTitle(gpt.brand_en || "", gpt.brand_ar || "");
    if (curNameAr && arPrefix && !curNameAr.toLowerCase().startsWith(arPrefix.toLowerCase())) {
      issues.push({
        code: "name_ar_brand_prefix",
        severity: "medium",
        field: "nameAr",
        messageAr: `الاسم العربي يجب أن يبدأ بالبراند كما هو: ${arPrefix}`,
        current: curNameAr,
        suggested: gpt.name_ar,
      });
    }

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

  private buildHeuristicAutofill(args: {
    barcode: string;
    free: FreeHint;
    imageTitles?: string[];
    hint?: string;
    shadeFamily?: boolean;
  }): GptAutofillJson {
    const blob = [
      args.free.brand,
      args.free.title,
      args.hint,
      ...(args.imageTitles ?? []),
      ...(args.free.categoryHints ?? []),
    ]
      .filter(Boolean)
      .join(" ");

    const type = this.guessProductType(blob);
    const rawBrand = (args.free.brand || this.guessBrandFromText(blob) || "").trim();
    const brandEn = this.canonicalBrandEn(rawBrand);
    const brandAr = this.canonicalBrandAr(brandEn, rawBrand);
    const arTitleBrand = this.brandPrefixForArabicTitle(brandEn, brandAr);

    let productCore = this.stripRetailerJunk(args.free.title || args.imageTitles?.[0] || args.hint || "");
    if (brandEn) productCore = this.extractProductCore(productCore, brandEn);
    if (brandAr && this.norm(brandAr) !== this.norm(brandEn)) {
      productCore = this.extractProductCore(productCore, brandAr);
    }
    productCore = this.stripShadeTokens(productCore);
    const qty = (args.free.quantity || "").trim();
    if (qty) {
      const escaped = qty.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(escaped, "i").test(productCore)) {
        productCore = `${productCore} ${qty}`.trim();
      }
    }
    if (!productCore) productCore = type.en || args.barcode;

    const nameEn = brandEn ? `${brandEn} - ${productCore}` : productCore;
    const arType = type.ar ? `${type.ar} ` : "";
    const arCore = this.stripLeadingType(productCore, type);
    const nameAr = arTitleBrand
      ? `${arTitleBrand} - ${arType}${arCore}`.replace(/\s+/g, " ").trim()
      : `${arType}${arCore}`.trim();

    const desc = this.templateDescriptions({
      brandEn,
      brandAr: arTitleBrand,
      typeAr: type.ar,
      typeEn: type.en,
      line: productCore,
      shadeFamily: Boolean(args.shadeFamily),
    });

    const weak = !brandEn || (!args.free.title && !(args.imageTitles?.length));
    return {
      brand_ar: brandAr,
      brand_en: brandEn,
      name_ar: this.polishMarketArabic(nameAr),
      name_en: nameEn,
      description_ar: desc.ar,
      description_en: desc.en,
      category_main_code: "",
      category_sub_codes: [],
      category_tertiary_codes: [],
      category_main_ar: type.mainAr,
      category_sub_ar: type.subAr,
      category_tertiary_ar: type.ar,
      category_subs_ar: type.subAr ? [type.subAr] : [],
      category_tertiaries_ar: type.ar ? [type.ar] : [],
      confidence: weak ? 28 : 62,
      needs_review: weak,
    };
  }

  private guessBrandFromText(text: string): string {
    const n = this.norm(text);
    const known = [
      "ARTDECO",
      "Seventeen",
      "GOSH",
      "Mon Reve",
      "Maybelline",
      "L'Oréal",
      "essence",
      "Catrice",
      "Bourjois",
      "Huda Beauty",
      "Beesline",
      "Garnier",
      "Radiant",
      "Deborah Milano",
      "Cosmaline",
      "Grigi",
      "Crest",
      "Colgate",
      "Oral-B",
    ];
    for (const b of known) {
      if (n.includes(this.norm(b))) return b;
    }
    return "";
  }

  private guessProductType(text: string): { ar: string; en: string; mainAr: string; subAr: string } {
    const n = this.norm(text);
    const rows: Array<{ test: RegExp; ar: string; en: string; mainAr: string; subAr: string }> = [
      { test: /lip\s*fluid|liquid\s*lip|matte\s*ink|lip\s*tint|احمر شفاه سائل/, ar: "أحمر شفاه سائل", en: "liquid lipstick", mainAr: "مكياج", subAr: "شفاه" },
      { test: /lip\s*gloss|جلوس|gloss/, ar: "جلوس شفاه", en: "lip gloss", mainAr: "مكياج", subAr: "شفاه" },
      { test: /lip\s*liner|lipliner|قلم شفاه/, ar: "قلم شفاه", en: "lip liner", mainAr: "مكياج", subAr: "شفاه" },
      { test: /lipstick|احمر شفاه|أحمر شفاه|\brouge\b|ليبستيك/, ar: "أحمر شفاه", en: "lipstick", mainAr: "مكياج", subAr: "شفاه" },
      { test: /concealer|كونسيلر/, ar: "كونسيلر", en: "concealer", mainAr: "مكياج", subAr: "وجه" },
      { test: /foundation|فاونديشن|fond de teint|كريم اساس|كريم أساس/, ar: "فاونديشن", en: "foundation", mainAr: "مكياج", subAr: "وجه" },
      { test: /mascara|ماسكارا/, ar: "ماسكارا", en: "mascara", mainAr: "مكياج", subAr: "عيون" },
      { test: /eyeshadow|ظل عيون|eye\s*shadow/, ar: "ظل عيون", en: "eyeshadow", mainAr: "مكياج", subAr: "عيون" },
      { test: /eyeliner|ايلاينر|كحل|kohl/, ar: "ايلاينر", en: "eyeliner", mainAr: "مكياج", subAr: "عيون" },
      { test: /brow\s*gel|جل حواجب/, ar: "جل حواجب", en: "brow gel", mainAr: "مكياج", subAr: "حواجب" },
      { test: /brow|حواجب|eyebrow/, ar: "قلم حواجب", en: "brow pencil", mainAr: "مكياج", subAr: "حواجب" },
      { test: /blush|بلاشر|احمر خدود|أحمر خدود/, ar: "بلاشر", en: "blush", mainAr: "مكياج", subAr: "وجه" },
      { test: /highlighter|هايلايتر/, ar: "هايلايتر", en: "highlighter", mainAr: "مكياج", subAr: "وجه" },
      { test: /bronzer|برونزر/, ar: "برونزر", en: "bronzer", mainAr: "مكياج", subAr: "وجه" },
      { test: /primer|برايمر/, ar: "برايمر", en: "primer", mainAr: "مكياج", subAr: "وجه" },
      { test: /powder|بودرة/, ar: "بودرة", en: "powder", mainAr: "مكياج", subAr: "وجه" },
      { test: /serum|سيروم/, ar: "سيروم", en: "serum", mainAr: "عناية", subAr: "بشرة" },
      { test: /moisturizer|مرطب/, ar: "مرطب", en: "moisturizer", mainAr: "عناية", subAr: "بشرة" },
      { test: /sunscreen|واقي شمس|\bspf\b/, ar: "واقي شمس", en: "sunscreen", mainAr: "عناية", subAr: "بشرة" },
      { test: /shampoo|شامبو/, ar: "شامبو", en: "shampoo", mainAr: "عناية", subAr: "شعر" },
      { test: /toothpaste|معجون|oral|dental|mouthwash|غسول فم/, ar: "عناية الفم", en: "oral care", mainAr: "عناية", subAr: "فم" },
    ];
    for (const row of rows) {
      if (row.test.test(n) || row.test.test(text)) return row;
    }
    return { ar: "", en: "", mainAr: "مكياج", subAr: "" };
  }

  private stripRetailerJunk(title: string): string {
    return title
      .replace(/\s+/g, " ")
      .replace(/\b(buy|shop|online|price|offer|sale|amazon|ebay|pharmacy|صيدلية|سعر|عرض)\b/gi, " ")
      .replace(/\b\d{8,14}\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  private stripShadeTokens(text: string): string {
    return text
      .replace(/\b(shade|n[°o.]?|nr\.?|color)\s*[#:]?\s*[A-Z]?\d{1,3}\b/gi, " ")
      .replace(/\b[A-Z]\d{2,3}\b/g, " ")
      .replace(/\s+#\d{1,3}\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private stripLeadingType(core: string, type: { ar: string; en: string }): string {
    let s = core.replace(/\s+/g, " ").trim();
    for (const t of [type.ar, type.en]) {
      if (!t) continue;
      const re = new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–:]?\\s*`, "i");
      s = s.replace(re, "").trim();
    }
    return s || core;
  }

  private templateDescriptions(args: {
    brandEn: string;
    brandAr: string;
    typeAr: string;
    typeEn: string;
    line: string;
    shadeFamily: boolean;
  }): { ar: string; en: string } {
    const brand = args.brandAr || args.brandEn || "المنتج";
    const typeAr = args.typeAr || "منتج تجميل";
    const typeEn = args.typeEn || "beauty product";
    const line = args.line || typeEn;
    const shadeNoteAr = args.shadeFamily ? "متوفر بعدة تدرجات." : "";
    const shadeNoteEn = args.shadeFamily ? "Available in multiple shades." : "";
    const ar = `${brand} ${typeAr} ${line}. مناسب للاستخدام اليومي في سوق العراق. ${shadeNoteAr}
• ملمس مريح وسهل التطبيق
• لمسة نهائية مناسبة لنوع المنتج
• عبوة عملية للاستخدام اليومي`.replace(/\s+\n/g, "\n").trim();
    const en = `${args.brandEn || "This"} ${typeEn} (${line}) for everyday wear. ${shadeNoteEn}
• Easy to apply
• Finish suited to the product type
• Practical everyday packaging`.trim();
    return { ar: this.polishMarketArabic(ar), en };
  }

  private guessShadeRow(
    barcode: string,
    free: FreeHint | undefined,
    imageTitles: string[],
    index: number,
  ): GptShadeRow {
    const blob = [free?.title, free?.brand, ...(imageTitles ?? [])].filter(Boolean).join(" ");
    const code = this.extractShadeCode(blob, barcode, index);
    const nameEn = this.extractShadeName(blob, code) || (code ? `Shade ${code}` : `Shade ${index + 1}`);
    const nameAr = this.polishMarketArabic(this.guessShadeNameAr(nameEn, code));
    return {
      barcode,
      code,
      name_en: nameEn,
      name_ar: nameAr,
      color_hex: this.guessShadeHex(`${nameEn} ${blob}`),
    };
  }

  private extractShadeCode(text: string, barcode: string, index: number): string {
    const m =
      text.match(/\b(?:shade|n[°o.]?|nr\.?|#)\s*([A-Z]?\d{1,3})\b/i) ||
      text.match(/\b([A-Z]\d{2,3})\b/) ||
      text.match(/\b(\d{2,3})\b/);
    if (m?.[1]) return m[1].toUpperCase();
    const tail = barcode.replace(/\D/g, "").slice(-2);
    if (tail && tail !== "00") return String(Number(tail) || tail);
    return String(index + 1).padStart(2, "0");
  }

  private extractShadeName(text: string, code: string): string {
    const quoted = text.match(/["“']([A-Za-z][A-Za-z \-]{2,40})["”']/);
    if (quoted?.[1]) return quoted[1].trim();
    if (!code) return "";
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const afterCode = text.match(new RegExp(`${escaped}\\s*[-–:]\\s*([A-Za-z][A-Za-z \\-]{2,40})`));
    if (afterCode?.[1]) return afterCode[1].trim();
    return "";
  }

  private guessShadeNameAr(nameEn: string, code: string): string {
    const n = this.norm(nameEn);
    const map: Array<[RegExp, string]> = [
      [/nude|nudist/, "نود"],
      [/ivory/, "عاجي"],
      [/beige/, "بيج"],
      [/rose|pink/, "وردي"],
      [/coral/, "مرجاني"],
      [/red|cherry|ruby/, "أحمر"],
      [/brown|mocha|cocoa|espresso/, "بني"],
      [/plum|berry/, "برقوقي"],
      [/clear|transparent/, "شفاف"],
      [/sand/, "رملي"],
      [/honey/, "عسلي"],
      [/caramel/, "كراميل"],
    ];
    for (const [re, ar] of map) {
      if (re.test(n)) return code ? `${code} ${ar}` : ar;
    }
    return code || nameEn;
  }

  private normalizeShadeHex(raw?: string): string {
    let h = String(raw ?? "").trim().toUpperCase().replace(/^#/, "");
    if (/^[0-9A-F]{3}$/.test(h)) {
      h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }
    if (!/^[0-9A-F]{6}$/.test(h)) return "#CCCCCC";
    return `#${h}`;
  }

  private guessShadeHex(text: string): string {
    const n = this.norm(text);
    const map: Array<[RegExp, string]> = [
      [/ivory|porcelain/, "#F4E6D4"],
      [/nude|beige|sand/, "#D4B08C"],
      [/honey|caramel|gold/, "#C4924A"],
      [/rose|pink|blush/, "#E8A0B0"],
      [/coral/, "#E07A5F"],
      [/red|cherry|ruby|passion/, "#C41E3A"],
      [/plum|berry|wine/, "#8E3A59"],
      [/brown|mocha|cocoa|espresso|chocolate/, "#6B3E2E"],
      [/clear|transparent/, "#F6EDE8"],
      [/black|noir/, "#1A1A1A"],
    ];
    for (const [re, hex] of map) {
      if (re.test(n)) return hex;
    }
    return "#CCCCCC";
  }

  private isWeakGpt(gpt: GptAutofillJson): boolean {
    const name = (gpt.name_ar || gpt.name_en || "").trim();
    const brand = (gpt.brand_ar || gpt.brand_en || "").trim();
    return name.length < 3 || brand.length < 1;
  }


  /** Latin/English brand stays Latin; Arabic brand stays Arabic. */
  private isLatinBrand(value: string): boolean {
    const s = (value || "").trim();
    if (!s || /[\u0600-\u06FF]/.test(s)) return false;
    return /[A-Za-z]/.test(s);
  }

  private hasArabicScript(value: string): boolean {
    return /[\u0600-\u06FF]/.test(value || "");
  }

  /** Prefix used at the start of name_ar — brand as-is, never translated. */
  private brandPrefixForArabicTitle(brandEn: string, brandAr: string): string {
    const en = (brandEn || "").replace(/\s+/g, " ").trim();
    const ar = (brandAr || "").replace(/\s+/g, " ").trim();
    if (this.isLatinBrand(en)) return en;
    if (this.hasArabicScript(ar)) return ar;
    if (this.isLatinBrand(ar)) return ar;
    return en || ar;
  }

  /** Enforce naming: EN/AR both "Brand - Product" (brand once) + market Arabic terms. */
  private polishNaming(gpt: GptAutofillJson): GptAutofillJson {
    const brandEn = this.canonicalBrandEn(gpt.brand_en || gpt.brand_ar || "");
    const brandAr = this.canonicalBrandAr(brandEn, gpt.brand_ar || "");
    const arTitleBrand = this.brandPrefixForArabicTitle(brandEn, brandAr);
    const nameEn = this.ensureBrandDashName(gpt.name_en || "", brandEn, { doubleBrand: false });
    const nameArRaw = this.ensureBrandDashName(gpt.name_ar || "", arTitleBrand, {
      doubleBrand: false,
      alsoStrip: [brandEn, brandAr],
    });
    const nameAr = this.polishMarketArabic(nameArRaw);
    const descriptionAr = this.polishMarketArabic(gpt.description_ar || "");
    const normCodes = (arr: unknown, prefix: string) =>
      (Array.isArray(arr) ? arr : [])
        .map((s) => String(s ?? "").trim().toUpperCase())
        .filter((c) => new RegExp(`^${prefix}\\d{2}$`).test(c));

    return {
      ...gpt,
      brand_en: brandEn || gpt.brand_en?.trim() || "",
      brand_ar: brandAr || gpt.brand_ar?.trim() || "",
      name_en: nameEn,
      name_ar: nameAr,
      description_ar: descriptionAr,
      category_main_code: (() => {
        const c = String(gpt.category_main_code ?? "")
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        return /^M\d{2}$/.test(c) ? c : "";
      })(),
      category_sub_codes: normCodes(gpt.category_sub_codes, "S").slice(0, 2),
      category_tertiary_codes: normCodes(gpt.category_tertiary_codes, "T").slice(0, 2),
      category_subs_ar: Array.isArray(gpt.category_subs_ar)
        ? gpt.category_subs_ar.map((s) => String(s ?? "").trim()).filter(Boolean)
        : [],
      category_tertiaries_ar: Array.isArray(gpt.category_tertiaries_ar)
        ? gpt.category_tertiaries_ar.map((s) => String(s ?? "").trim()).filter(Boolean)
        : [],
      confidence: typeof gpt.confidence === "number" ? gpt.confidence : 60,
    };
  }

  /** MSA + Iraqi-market beauty terms (not dialect). */
  private polishMarketArabic(text: string): string {
    if (!text?.trim()) return text || "";
    let s = text.replace(/\s+/g, " ").trim();
    const termMap: Array<[RegExp, string]> = [
      [/\bروج\b/g, "أحمر شفاه"],
      [/\bليب\s*ستيك\b/gi, "أحمر شفاه"],
      [/\blipstick\b/gi, "أحمر شفاه"],
      [/\brouge\b/gi, "أحمر شفاه"],
      [/\bليب\s*جلوس\b/gi, "جلوس شفاه"],
      [/\blip\s*gloss\b/gi, "جلوس شفاه"],
      [/\bليب\s*لاينر\b/gi, "قلم شفاه"],
      [/\blip\s*liner\b/gi, "قلم شفاه"],
    ];
    for (const [re, to] of termMap) s = s.replace(re, to);

    // Strip common Iraqi dialect tokens if the model slips
    s = s
      .replace(/\b(شلون|هواية|هواي|هسه|خوش|يمعود|شكد|وينه|هايچ|هيج|اكو|ماكو)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return s;
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
      [/artdeco|ارتديكو|آرتديكو|ارتيكو|أرتديكو/, "ARTDECO"],
      [/grigi|جريجي/, "Grigi"],
      [/crest|كريست/, "Crest"],
      [/cosmaline|كوسمالاين/, "Cosmaline"],
      [/artdeco|ارتديكو|أرتديكو/, "ARTDECO"],
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
      [/artdeco/, "آرتديكو"],
      [/grigi/, "جريجي"],
      [/crest/, "كريست"],
      [/cosmaline/, "كوسمالاين"],
      [/artdeco/, "أرتديكو"],
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
    opts: { doubleBrand?: boolean; alsoStrip?: string[] } = {},
  ): string {
    const b = brand.replace(/\s+/g, " ").trim();
    if (!b) return name.replace(/\s+/g, " ").trim();

    let product = this.extractProductCore(name, b);
    for (const extra of opts.alsoStrip ?? []) {
      const e = extra.replace(/\s+/g, " ").trim();
      if (!e || this.norm(e) === this.norm(b)) continue;
      product = this.extractProductCore(product, e);
    }
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

  /** Build coded category tree for GPT to pick from (IDs resolved server-side). */
  private async getCategoryCatalog(): Promise<CategoryCatalog> {
    const now = Date.now();
    if (this.categoryCatalogCache && now - this.categoryCatalogCache.at < 10 * 60_000) {
      return this.categoryCatalogCache;
    }

    const mains = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        name: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            name: true,
            children: {
              where: { isActive: true },
              select: { id: true, nameAr: true, nameEn: true, name: true },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    const byCode = new Map<string, CategoryCodeEntry>();
    const lines: string[] = ["CATEGORY TREE — copy codes exactly (Mxx / Sxx / Txx):"];
    let mIdx = 0;
    let sIdx = 0;
    let tIdx = 0;

    const labelOf = (row: { nameAr: string | null; nameEn: string | null; name: string }) =>
      row.nameAr || row.nameEn || row.name;

    for (const m of mains) {
      mIdx += 1;
      const mCode = `M${String(mIdx).padStart(2, "0")}`;
      const mLabel = labelOf(m);
      byCode.set(mCode, {
        id: m.id,
        code: mCode,
        level: "main",
        parentCode: null,
        parentId: null,
        nameAr: mLabel,
      });
      lines.push(`${mCode} ${mLabel}`);

      for (const s of m.children) {
        sIdx += 1;
        const sCode = `S${String(sIdx).padStart(2, "0")}`;
        const sLabel = labelOf(s);
        byCode.set(sCode, {
          id: s.id,
          code: sCode,
          level: "sub",
          parentCode: mCode,
          parentId: m.id,
          nameAr: sLabel,
        });
        lines.push(`  ${sCode} ${sLabel}`);

        for (const t of s.children) {
          tIdx += 1;
          const tCode = `T${String(tIdx).padStart(2, "0")}`;
          const tLabel = labelOf(t);
          byCode.set(tCode, {
            id: t.id,
            code: tCode,
            level: "tertiary",
            parentCode: sCode,
            parentId: s.id,
            nameAr: tLabel,
          });
          lines.push(`    ${tCode} ${tLabel}`);
        }
      }
    }

    // Keep prompt bounded but prefer full tree when possible
    let text = lines.join("\n");
    if (text.length > 6000) {
      text = text.slice(0, 6000) + "\n…(truncated)";
    }

    const catalog: CategoryCatalog = { at: now, text, byCode };
    this.categoryCatalogCache = catalog;
    return catalog;
  }

  private async matchCategories(gpt: GptAutofillJson) {
    const catalog = await this.getCategoryCatalog();

    // 1) Primary path: AI-picked codes (validated against tree + parent links)
    const mainFromCode = this.resolveCode(catalog, gpt.category_main_code, "main");
    let mainId = mainFromCode?.id ?? null;
    let mainName = mainFromCode?.nameAr ?? null;
    const mainCode = mainFromCode?.code ?? null;

    const subcategoryIds: string[] = [];
    const tertiaryCategoryIds: string[] = [];
    const subcategoryNames: string[] = [];
    const tertiaryNames: string[] = [];

    if (mainFromCode) {
      for (const code of gpt.category_sub_codes ?? []) {
        if (subcategoryIds.length >= 2) break;
        const entry = this.resolveCode(catalog, code, "sub");
        if (!entry) continue;
        if (entry.parentCode !== mainCode && entry.parentId !== mainFromCode.id) continue;
        if (subcategoryIds.includes(entry.id)) continue;
        subcategoryIds.push(entry.id);
        subcategoryNames.push(entry.nameAr);
      }

      const allowedSubCodes = new Set(
        [...catalog.byCode.values()]
          .filter((e) => e.level === "sub" && subcategoryIds.includes(e.id))
          .map((e) => e.code),
      );
      for (const code of gpt.category_tertiary_codes ?? []) {
        if (tertiaryCategoryIds.length >= 2) break;
        const entry = this.resolveCode(catalog, code, "tertiary");
        if (!entry) continue;
        if (entry.parentCode && !allowedSubCodes.has(entry.parentCode)) continue;
        if (entry.parentId && !subcategoryIds.includes(entry.parentId)) continue;
        if (tertiaryCategoryIds.includes(entry.id)) continue;
        tertiaryCategoryIds.push(entry.id);
        tertiaryNames.push(entry.nameAr);
      }
    }

    // 2) Fallback: name matching only if codes missing/invalid
    if (!mainId) {
      const mains = [...catalog.byCode.values()]
        .filter((e) => e.level === "main")
        .map((e) => ({ id: e.id, nameAr: e.nameAr, nameEn: null, name: e.nameAr }));
      const mainHit =
        this.bestMatch(mains, gpt.category_main_ar, gpt.category_main_ar) ??
        this.bestMatch(mains, gpt.name_ar, gpt.name_en);
      if (mainHit && mainHit.score >= 55) {
        mainId = mainHit.id;
        mainName = mainHit.nameAr || mainHit.name || null;
      }
    }

    if (mainId && !subcategoryIds.length) {
      const subs = [...catalog.byCode.values()]
        .filter((e) => e.level === "sub" && e.parentId === mainId)
        .map((e) => ({ id: e.id, nameAr: e.nameAr, nameEn: null, name: e.nameAr }));
      const subHints = this.collectCategoryHints(gpt.category_sub_ar, gpt.category_subs_ar);
      const identityHints = this.collectCategoryHints(gpt.name_ar, [gpt.name_en]);
      const ids = this.matchManyCategories(subs, subHints, identityHints, {
        maxSelect: Math.min(2, Math.max(1, subHints.length || 1)),
      });
      for (const id of ids) {
        const row = subs.find((s) => s.id === id);
        subcategoryIds.push(id);
        if (row?.nameAr) subcategoryNames.push(row.nameAr);
      }
    }

    if (subcategoryIds.length && !tertiaryCategoryIds.length) {
      const tert = [...catalog.byCode.values()]
        .filter((e) => e.level === "tertiary" && e.parentId && subcategoryIds.includes(e.parentId))
        .map((e) => ({ id: e.id, nameAr: e.nameAr, nameEn: null, name: e.nameAr }));
      const tertHints = this.collectCategoryHints(gpt.category_tertiary_ar, gpt.category_tertiaries_ar);
      const identityHints = this.collectCategoryHints(gpt.name_ar, [gpt.name_en]);
      const ids = this.matchManyCategories(tert, tertHints, identityHints, {
        maxSelect: Math.min(2, Math.max(1, tertHints.length || 1)),
      });
      for (const id of ids) {
        const row = tert.find((t) => t.id === id);
        tertiaryCategoryIds.push(id);
        if (row?.nameAr) tertiaryNames.push(row.nameAr);
      }
    }

    return {
      categoryId: mainId,
      subcategoryId: subcategoryIds[0] ?? null,
      tertiaryCategoryId: tertiaryCategoryIds[0] ?? null,
      subcategoryIds,
      tertiaryCategoryIds,
      categoryNameAr: mainName || gpt.category_main_ar,
      subcategoryNameAr: subcategoryNames[0] ?? gpt.category_sub_ar,
      tertiaryNameAr: tertiaryNames[0] ?? gpt.category_tertiary_ar,
      subcategoryNamesAr: subcategoryNames,
      tertiaryNamesAr: tertiaryNames,
    };
  }

  private resolveCode(
    catalog: CategoryCatalog,
    raw: string | undefined,
    level: CategoryCodeEntry["level"],
  ): CategoryCodeEntry | null {
    const code = String(raw ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (!code) return null;
    const entry = catalog.byCode.get(code);
    if (!entry || entry.level !== level) return null;
    return entry;
  }

  /** Split GPT strings / arrays into distinct category name hints. */
  private collectCategoryHints(primary: string | undefined, extras?: string[] | string): string[] {
    const raw: string[] = [];
    if (primary?.trim()) raw.push(primary);
    if (Array.isArray(extras)) raw.push(...extras);
    else if (typeof extras === "string" && extras.trim()) raw.push(extras);

    const out: string[] = [];
    const seen = new Set<string>();
    for (const chunk of raw) {
      for (const part of chunk.split(/[,|،/]+/)) {
        const t = part.replace(/\s+/g, " ").trim();
        if (t.length < 2) continue;
        const key = this.norm(t);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(t);
      }
    }
    return out;
  }

  /**
   * Fallback name matcher only — primary path uses AI codes.
   */
  private matchManyCategories(
    rows: Array<{ id: string; nameAr: string | null; nameEn: string | null; name?: string | null }>,
    primaryHints: string[],
    identityHints: string[],
    opts: { maxSelect?: number } = {},
  ): string[] {
    if (!rows.length) return [];
    const maxSelect = Math.max(1, opts.maxSelect ?? 1);

    const selected: string[] = [];
    const push = (id: string | undefined | null) => {
      if (!id || selected.includes(id)) return;
      if (selected.length >= maxSelect) return;
      selected.push(id);
    };

    for (const hint of primaryHints) {
      if (selected.length >= maxSelect) break;
      const hit = this.bestMatch(rows, hint, hint);
      if (hit && hit.score >= 55) push(hit.id);
    }

    if (!selected.length && identityHints.length) {
      let best:
        | ({ id: string; nameAr: string | null; nameEn: string | null; name?: string | null } & {
            score: number;
          })
        | null = null;
      for (const hint of identityHints) {
        const hit = this.bestMatch(rows, hint, hint);
        if (hit && hit.score >= 70 && (!best || hit.score > best.score)) best = hit;
      }
      if (best) push(best.id);
    }

    return selected;
  }

  private bestMatch(
    rows: Array<{ id: string; nameAr: string | null; nameEn: string | null; name?: string | null }>,
    ar: string,
    en: string,
  ):
    | ({ id: string; nameAr: string | null; nameEn: string | null; name?: string | null } & { score: number })
    | null {
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
        if (this.isGenericCategoryToken(t)) continue;
        for (const c of expandedCandidates) {
          if (this.isGenericCategoryToken(c)) continue;
          if (t === c) {
            score = Math.max(score, t.length >= 6 ? 100 : 88);
          } else if (t.includes(c) || c.includes(t)) {
            const shorter = t.length <= c.length ? t : c;
            const longer = t.length > c.length ? t : c;
            // Require a meaningful phrase — blocks "عناية" matching every care sub
            if (shorter.length < 6) continue;
            if (this.isGenericCategoryToken(shorter)) continue;
            score = Math.max(score, shorter.length * 2 >= longer.length ? 90 : 72);
          } else if (this.tokenOverlap(t, c) >= 0.7) {
            score = Math.max(score, 60);
          }
        }
      }
      if (score >= 55 && (!best || score > best.score)) best = { ...row, score };
    }
    return best;
  }

  private isGenericCategoryToken(token: string): boolean {
    const n = this.norm(token);
    if (!n) return true;
    if (GENERIC_CATEGORY_TOKENS.has(n)) return true;
    // Single short Arabic/Latin word shared by many category labels
    if (!n.includes(" ") && n.length <= 4) return true;
    return false;
  }

  private expandTargets(raw: string[]): string[] {
    const out = new Set<string>();
    for (const s of raw) {
      const n = this.norm(s);
      if (!n) continue;
      out.add(n);
      for (const [key, syns] of Object.entries(CATEGORY_SYNONYMS)) {
        const kn = this.norm(key);
        if (kn.length < 5) continue;
        if (n.includes(kn) || kn.includes(n)) {
          out.add(kn);
          for (const syn of syns) {
            const sn = this.norm(syn);
            if (sn.length >= 4) out.add(sn);
          }
        }
        for (const syn of syns) {
          const sn = this.norm(syn);
          if (sn.length < 4) continue;
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
