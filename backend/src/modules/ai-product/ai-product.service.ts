import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { barcodeLookupCandidates } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { CursorNamingClient } from "./cursor-naming.client";
import { GoogleImageHit, GoogleImagesService } from "./google-images.service";

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
  منظف: ["cleanser", "cleansing", "موس تنظيف", "cleansing mousse", "foam cleanser"],
  "موس تنظيف": ["cleansing mousse", "mousse", "cleanser"],
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

/** Tokens too generic for *partial* matching. Exact labels like شفاه/وجه still match. */
const GENERIC_CATEGORY_TOKENS = new Set(
  [
    "عناية",
    "العناية",
    "مكياج",
    "تجميل",
    "care",
    "skin",
    "makeup",
    "beauty",
    "product",
    "cosmetic",
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
    const cacheKey = `v14|${force ? "force|" : ""}${digits}|${resolved.choice}|${(hint ?? "").trim().toLowerCase()}`;
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

    // 2) Free barcode DBs + go-upc (many regional beauty EANs are missing from OBF/UPC alone)
    const free = await this.freeBarcodeHint(digits);

    // 3) Barcode images first; supplement with brand/title only if barcode hits are thin
    const imageHits = await this.images.searchByBarcode(digits, 72, [
      free.brand,
      free.title,
      free.brand && free.title ? `${free.brand} ${free.title}`.slice(0, 90) : null,
      existing?.nameEn,
      existing?.nameAr,
      hint,
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
    await this.mergeNamedImageSearch(imageHits, gpt);

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

    try {
      return await this.shadeFamilyFast(unique, hint, modelChoice);
    } catch (err) {
      this.logger.warn(`shadeFamily fast path failed, using fallback: ${(err as Error).message}`);
      return await this.buildShadeFamilyFallback(unique, hint, modelChoice);
    }
  }

  /** Fast shade-family path — must finish within ~45s for 15+ barcodes. */
  private async shadeFamilyFast(rawBarcodes: string[], hint?: string, modelChoice?: string) {
    const unique = rawBarcodes;
    const resolved = this.cursor.resolveModel(modelChoice);
    const cacheKey = `shade-v9|${unique.join(",")}|${resolved.choice}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.autofillCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 20 * 60_000) {
      return { ...cached.payload, meta: { ...(cached.payload.meta as object), cached: true } };
    }

    const [existingHits, freeByBarcode] = await Promise.all([
      Promise.all(
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
      ).then((rows) => rows.filter((h): h is NonNullable<typeof h> => Boolean(h))),
      (async () => {
        const map = new Map<string, FreeHint>();
        for (let i = 0; i < unique.length; i += 8) {
          const chunk = unique.slice(i, i + 8);
          const part = await Promise.all(
            chunk.map(async (barcode) => [barcode, await this.freeBarcodeHintLight(barcode)] as const),
          );
          for (const [barcode, free] of part) map.set(barcode, free);
        }
        return map;
      })(),
    ]);

    const existingByBarcode = new Map(
      existingHits.map((h) => [h.barcode.toLowerCase(), h] as const),
    );

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

    const enrichHints = [
      leadFree.brand,
      leadFree.title,
      hint,
      draft.brand_en,
      draft.name_en,
    ].filter((s): s is string => Boolean(s && String(s).trim().length >= 2));

    await this.enrichShadeHintsFromCatalog(unique, freeByBarcode);
    try {
      await Promise.race([
        this.enrichShadeHintsFromImages(unique, freeByBarcode, enrichHints),
        new Promise<void>((resolve) => setTimeout(resolve, 14_000)),
      ]);
    } catch (err) {
      this.logger.warn(`Shade image enrich skipped: ${(err as Error).message}`);
    }

    let shadeRows = unique.map((barcode, index) =>
      this.guessShadeRow(
        barcode,
        freeByBarcode.get(barcode),
        index,
        existingByBarcode.get(barcode.toLowerCase())?.matchedShadeName,
      ),
    );

    const namingBudgetMs = unique.length >= 10 ? 16_000 : 22_000;
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
      namingBudgetMs,
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

    const genericCount = shadeRows.filter((r) => this.isGenericShadeName(r.name_en)).length;
    if (genericCount >= 2 && this.cursor.hasApiKey()) {
      try {
        const aiShades = await this.cursor.verifyShadeFamilyNames(
          {
            brand_en: polished.brand_en,
            brand_ar: polished.brand_ar,
            product_en: polished.name_en,
            hint,
            shades: shadeRows.map((row) => ({
              barcode: row.barcode,
              code: row.code,
              name_en: row.name_en,
              db_title: freeByBarcode.get(row.barcode)?.title,
            })),
          },
          resolved.choice,
          unique.length >= 10 ? 18_000 : 24_000,
        );
        if (aiShades?.length) {
          const byBc = new Map(aiShades.map((s) => [s.barcode.toLowerCase(), s] as const));
          shadeRows = shadeRows.map((row) => {
            const hit = byBc.get(row.barcode.toLowerCase());
            if (!hit || this.isGenericShadeName(hit.name_en)) return row;
            return {
              ...row,
              name_en: hit.name_en,
              name_ar: hit.name_ar || this.polishMarketArabic(this.guessShadeNameAr(hit.name_en, row.code)),
            };
          });
        }
      } catch (err) {
        this.logger.warn(`Shade-family AI naming skipped: ${(err as Error).message}`);
      }
    }

    const gptByBarcode = new Map<string, GptShadeRow>();
    for (const row of shadeRows) {
      const key = (String(row.barcode ?? "").replace(/\D/g, "") || String(row.barcode ?? "").trim()).toLowerCase();
      if (!key) continue;
      gptByBarcode.set(key, row);
    }

    const shades = this.sortShadeFamily(
      unique.map((barcode, index) => {
        const row = gptByBarcode.get(barcode.toLowerCase());
        let code = String(row?.code ?? "").trim();
        if (this.isBarcodeFragmentCode(code, barcode)) code = "";
        const nameEn = String(row?.name_en ?? "").trim();
        const nameAr = this.polishMarketArabic(String(row?.name_ar ?? "").trim());
        let name = "";
        const cleanEn = nameEn
          .replace(new RegExp(`^shade\\s*${code}\\s*`, "i"), "")
          .replace(new RegExp(`^${code}\\s*`, "i"), "")
          .trim();
        if (cleanEn && code && !cleanEn.toLowerCase().includes(code.toLowerCase())) {
          name = `${cleanEn} ${code}`;
        } else if (cleanEn) {
          name = cleanEn;
        } else if (nameEn) {
          name = nameEn;
        } else if (code && nameAr) {
          name = nameAr.includes(code) ? nameAr : `${nameAr} ${code}`;
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
      }),
    ).map((shade, index) => ({ ...shade, position: index }));

    const galleryQuery = [polished.brand_en || polished.brand_ar, polished.name_en || polished.name_ar]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
    let galleryImages = imageHits;
    if (galleryQuery.length >= 4) {
      try {
        const extra = await Promise.race([
          this.images.searchQuery(galleryQuery, 24),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("gallery search timeout")), 8_000),
          ),
        ]);
        const seenUrl = new Set(galleryImages.map((h) => h.url.toLowerCase()));
        for (const hit of extra) {
          if (seenUrl.has(hit.url.toLowerCase())) continue;
          seenUrl.add(hit.url.toLowerCase());
          galleryImages.push(hit);
        }
      } catch (err) {
        this.logger.warn(`Shade-family gallery search skipped: ${(err as Error).message}`);
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
      const images = await this.images.searchQuery(q, 72);
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
    let images = await this.images.searchByBarcode(q, 72, hints);
    if (images.length < 4 && hints.length) {
      try {
        const nameQ = hints[0].slice(0, 90);
        const extra = await Promise.race([
          this.images.searchQuery(nameQ, 48),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("name fallback timeout")), 8_000),
          ),
        ]);
        const seen = new Set(images.map((h) => h.url.toLowerCase()));
        for (const hit of extra) {
          if (seen.has(hit.url.toLowerCase())) continue;
          seen.add(hit.url.toLowerCase());
          images.push(hit);
        }
      } catch (err) {
        this.logger.warn(`searchImages name fallback skipped: ${(err as Error).message}`);
      }
    }
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

  /** Lighter barcode lookup for multi-shade scans — 2 sources, short timeout. */
  private async freeBarcodeHintLight(barcode: string): Promise<FreeHint> {
    const variants = barcodeLookupCandidates(barcode)
      .filter((v) => /^\d{8,14}$/.test(v))
      .slice(0, 2);
    const tasks: Promise<FreeHint>[] = [];
    for (const v of variants) {
      tasks.push(
        this.lookupOpenBeautyFacts(v),
        this.lookupOpenFoodFacts(v),
        this.lookupUpcItemDb(v),
        this.lookupGoUpc(v),
      );
    }
    const results = (await Promise.all(tasks)).filter((r) => r.title?.trim());
    if (!results.length) return {};
    const rank = (source?: string) => (source === "openbeautyfacts" ? 0 : source === "go-upc" ? 1 : 9);
    results.sort((a, b) => rank(a.source) - rank(b.source));
    return { ...results[0] };
  }

  private async buildShadeFamilyFallback(barcodes: string[], hint?: string, modelChoice?: string) {
    const resolved = this.cursor.resolveModel(modelChoice);
    const hintText = String(hint ?? "").trim();
    const lead = barcodes[0] ?? "";

    const freeByBarcode = new Map<string, FreeHint>();
    for (let i = 0; i < barcodes.length; i += 8) {
      const chunk = barcodes.slice(i, i + 8);
      const part = await Promise.all(
        chunk.map(async (barcode) => [barcode, await this.freeBarcodeHintLight(barcode)] as const),
      );
      for (const [barcode, free] of part) freeByBarcode.set(barcode, free);
    }
    const leadFree = freeByBarcode.get(lead) ?? { title: hintText };

    let galleryImages: GoogleImageHit[] = [];
    try {
      galleryImages = await Promise.race([
        this.images.searchByBarcode(lead, 20, [leadFree.brand, leadFree.title, hintText].filter(
          (s): s is string => Boolean(s && String(s).trim().length >= 2),
        )),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("fallback gallery timeout")), 10_000),
        ),
      ]);
    } catch (err) {
      this.logger.warn(`Shade-family fallback gallery skipped: ${(err as Error).message}`);
    }

    const imageTitles = this.extractIdentityTitles(galleryImages);
    const draft = this.buildHeuristicAutofill({
      barcode: lead,
      free: leadFree,
      imageTitles,
      hint: hintText,
      shadeFamily: true,
    });

    await this.enrichShadeHintsFromCatalog(barcodes, freeByBarcode);
    try {
      await Promise.race([
        this.enrichShadeHintsFromImages(
          barcodes,
          freeByBarcode,
          [leadFree.brand, leadFree.title, hintText, draft.brand_en, draft.name_en].filter(
            (s): s is string => Boolean(s && String(s).trim().length >= 2),
          ),
        ),
        new Promise<void>((resolve) => setTimeout(resolve, 12_000)),
      ]);
    } catch {
      /* optional */
    }

    const shadeRows = barcodes.map((barcode, index) =>
      this.guessShadeRow(
        barcode,
        freeByBarcode.get(barcode) ?? { title: hintText },
        index,
      ),
    );
    const shades = this.sortShadeFamily(
      barcodes.map((barcode, index) => {
        const row = shadeRows[index];
        const code = String(row?.code ?? "").trim();
        const nameEn = String(row?.name_en ?? "").trim();
        const nameAr = this.polishMarketArabic(String(row?.name_ar ?? "").trim());
        const name = nameEn || nameAr || `تدرج ${index + 1}`;
        return {
          barcode,
          code,
          name,
          nameEn: nameEn || name,
          nameAr: nameAr || name,
          colorHex: this.normalizeShadeHex(row?.color_hex),
          position: index,
        };
      }),
    ).map((shade, index) => ({ ...shade, position: index }));

    let matched = {
      categoryId: null as string | null,
      subcategoryId: null as string | null,
      tertiaryCategoryId: null as string | null,
      subcategoryIds: [] as string[],
      tertiaryCategoryIds: [] as string[],
      categoryNameAr: null as string | null,
      subcategoryNameAr: null as string | null,
      tertiaryNameAr: null as string | null,
    };
    try {
      matched = await this.matchCategories(draft);
    } catch (err) {
      this.logger.warn(`Shade-family fallback categories skipped: ${(err as Error).message}`);
    }

    return {
      barcodes,
      brandAr: draft.brand_ar || "",
      brandEn: draft.brand_en || "",
      nameAr: draft.name_ar || hintText,
      nameEn: draft.name_en || hintText,
      descriptionAr: draft.description_ar || (hintText ? `${hintText}. متوفر بعدة تدرجات.` : "متوفر بعدة تدرجات."),
      descriptionEn: draft.description_en || (hintText ? `${hintText}. Available in multiple shades.` : "Available in multiple shades."),
      productTypeAr: String(draft.category_tertiary_ar || draft.category_sub_ar || "").trim(),
      category: matched,
      confidence: 32,
      needsReview: true,
      shades,
      images: galleryImages,
      existingHits: [],
      meta: {
        model: resolved.apiModel,
        modelChoice: resolved.choice,
        fast: resolved.fast,
        usedWebSearch: false,
        namesVerified: false,
        namingSource: "fallback",
        shadeCount: shades.length,
        imageCount: galleryImages.length,
        imageQuery: hintText || lead || "",
        cached: false,
        fallback: true,
      },
    };
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
      const imageUrl =
        (p as { image_front_url?: string; image_url?: string; image_front_small_url?: string })
          .image_front_url ||
        (p as { image_url?: string }).image_url ||
        undefined;
      return {
        title,
        brand: (p.brands ?? "").split(",")[0]?.trim() || undefined,
        quantity: p.quantity?.trim() || undefined,
        categoryHints: (p.categories_tags ?? []).slice(0, 6).map((t) => t.replace(/^en:/, "")),
        source: "openbeautyfacts",
        imageUrl,
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
      const imageUrl =
        (p as { image_front_url?: string; image_url?: string }).image_front_url ||
        (p as { image_url?: string }).image_url ||
        undefined;
      return {
        title,
        brand: (p.brands ?? "").split(",")[0]?.trim() || undefined,
        quantity: p.quantity?.trim() || undefined,
        categoryHints: (p.categories_tags ?? []).slice(0, 6).map((t) => t.replace(/^en:/, "")),
        source: "openfoodfacts",
        imageUrl,
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
        items?: Array<{ title?: string; brand?: string; size?: string; category?: string; images?: string[] }>;
      };
      const item = body.items?.[0];
      if (!item?.title?.trim()) return {};
      return {
        title: item.title.trim(),
        brand: item.brand?.trim() || undefined,
        quantity: item.size?.trim() || undefined,
        categoryHints: item.category ? [item.category] : undefined,
        source: "upcitemdb",
        imageUrl: item.images?.[0]?.trim() || undefined,
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
    const arCore = this.arabicizeProductCore(this.stripLeadingType(productCore, type), type.ar);
    const nameAr = arTitleBrand ? `${arTitleBrand} - ${arCore}` : arCore;

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
      { test: /cleansing\s*mousse|mousse\s*nettoyante|موس تنظيف/, ar: "موس تنظيف", en: "cleansing mousse", mainAr: "عناية", subAr: "بشرة" },
      { test: /cleansing\s*foam|رغوة تنظيف/, ar: "رغوة تنظيف", en: "cleansing foam", mainAr: "عناية", subAr: "بشرة" },
      { test: /micellar|ميسيلار/, ar: "ماء ميسيلار", en: "micellar water", mainAr: "عناية", subAr: "بشرة" },
      { test: /makeup\s*remover|مزيل مكياج/, ar: "مزيل مكياج", en: "makeup remover", mainAr: "عناية", subAr: "بشرة" },
      { test: /cleanser|cleansing|منظف وجه|منظف/, ar: "منظف", en: "cleanser", mainAr: "عناية", subAr: "بشرة" },
      { test: /mat\s*passion|lip\s*fluid|liquid\s*lip/, ar: "أحمر شفاه سائل", en: "liquid lipstick", mainAr: "مكياج", subAr: "شفاه" },
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
      { test: /conditioner|بلسم/, ar: "بلسم", en: "conditioner", mainAr: "عناية", subAr: "شعر" },
      { test: /toner|تونر/, ar: "تونر", en: "toner", mainAr: "عناية", subAr: "بشرة" },
      { test: /body\s*lotion|لوشن جسم/, ar: "لوشن جسم", en: "body lotion", mainAr: "عناية", subAr: "جسم" },
      { test: /shower\s*gel|جل استحمام/, ar: "جل استحمام", en: "shower gel", mainAr: "عناية", subAr: "جسم" },
      { test: /nail\s*polish|طلاء اظافر|طلاء أظافر/, ar: "طلاء أظافر", en: "nail polish", mainAr: "مكياج", subAr: "أظافر" },
      { test: /perfume|eau de|عطر|بارفان/, ar: "عطر", en: "perfume", mainAr: "عطور", subAr: "" },
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

  /** After the brand dash: Arabic market type + optional EN line + size. */
  private arabicizeProductCore(core: string, typeHintAr?: string): string {
    let s = (core || "").replace(/\s+/g, " ").trim();
    if (!s) return (typeHintAr || "").trim();

    const sizes: string[] = [];
    s = s.replace(/(\d+(?:[.,]\d+)?)\s*(ml|مل|g|غ|gm|gr|grams?|oz)\b/gi, (_m, n: string, u: string) => {
      const unit = /ml|مل/i.test(u) ? "مل" : /oz/i.test(u) ? "أونصة" : "غ";
      sizes.push(`${String(n).replace(",", ".")} ${unit}`);
      return " ";
    });
    s = s.replace(/\s+/g, " ").trim();

    const phrases: Array<[RegExp, string]> = [
      [/cleansing\s+mousse|mousse\s+nettoyante/gi, "موس تنظيف"],
      [/cleansing\s+foam/gi, "رغوة تنظيف"],
      [/cleansing\s+milk/gi, "حليب تنظيف"],
      [/cleansing\s+gel/gi, "جل تنظيف"],
      [/makeup\s+remover/gi, "مزيل مكياج"],
      [/micellar\s+water/gi, "ماء ميسيلار"],
      [/facial\s+cleanser|\bcleanser\b|\bcleansing\b/gi, "منظف"],
      [/liquid\s+lipstick|lip\s+fluid/gi, "أحمر شفاه سائل"],
      [/lip\s+gloss/gi, "جلوس شفاه"],
      [/\blipstick\b|\brouge\b/gi, "أحمر شفاه"],
      [/lip\s+liner|lipliner/gi, "قلم شفاه"],
      [/\bconcealer\b/gi, "كونسيلر"],
      [/\bfoundation\b/gi, "فاونديشن"],
      [/\bmascara\b/gi, "ماسكارا"],
      [/eye\s*shadow/gi, "ظل عيون"],
      [/\beyeliner\b|\bkohl\b/gi, "ايلاينر"],
      [/brow\s+gel/gi, "جل حواجب"],
      [/brow\s+pencil|eyebrow/gi, "قلم حواجب"],
      [/\bblush(er)?\b/gi, "بلاشر"],
      [/\bhighlighter\b/gi, "هايلايتر"],
      [/\bbronzer\b/gi, "برونزر"],
      [/\bprimer\b/gi, "برايمر"],
      [/\bpowder\b/gi, "بودرة"],
      [/\bserum\b/gi, "سيروم"],
      [/moisturi[sz]er/gi, "مرطب"],
      [/sun\s*screen|\bspf\b/gi, "واقي شمس"],
      [/\bshampoo\b/gi, "شامبو"],
      [/\bconditioner\b/gi, "بلسم"],
      [/shower\s+gel/gi, "جل استحمام"],
      [/body\s+lotion/gi, "لوشن جسم"],
      [/\btoner\b/gi, "تونر"],
      [/\bmask\b|\bmasque\b/gi, "ماسك"],
      [/\bmousse\b/gi, "موس"],
      [/\bfoam\b/gi, "رغوة"],
      [/\bcream\b/gi, "كريم"],
      [/\blotion\b/gi, "لوشن"],
      [/\bgel\b/gi, "جل"],
      [/\boil\b/gi, "زيت"],
      [/\bspray\b/gi, "بخاخ"],
      [/\bsoap\b/gi, "صابون"],
    ];

    const types: string[] = [];
    for (const [re, ar] of phrases) {
      if (!re.test(s)) continue;
      re.lastIndex = 0;
      if (!types.includes(ar)) types.push(ar);
      s = s.replace(re, " ");
      re.lastIndex = 0;
    }
    s = s.replace(/\s+/g, " ").trim();
    for (const t of types) {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      s = s.replace(new RegExp(esc, "gi"), " ").replace(/\s+/g, " ").trim();
    }

    const typeAr = types[0] || (!this.hasArabicScript(s) ? (typeHintAr || "").trim() : "");
    const line = s.replace(/\s+/g, " ").trim();
    let out = [typeAr, line, ...sizes].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    out = this.dedupeArabicPhrases(out);
    if (!this.hasArabicScript(out) && typeHintAr && !out.includes(typeHintAr)) {
      return `${typeHintAr} ${out}`.replace(/\s+/g, " ").trim();
    }
    return out;
  }

  private dedupeArabicPhrases(text: string): string {
    let s = (text || "").replace(/\s+/g, " ").trim();
    if (!s) return s;
    const known = [
      "أحمر شفاه سائل",
      "أحمر شفاه",
      "جلوس شفاه",
      "قلم شفاه",
      "موس تنظيف",
      "فاونديشن",
      "كونسيلر",
      "ماسكارا",
      "بلاشر",
      "هايلايتر",
      "برونزر",
      "برايمر",
      "بودرة",
    ];
    for (const phrase of known) {
      const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      s = s.replace(new RegExp(`(${esc})(\\s+\\1)+`, "g"), "$1");
    }
    return s.replace(/\s+/g, " ").trim();
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
    index: number,
    existingShadeName?: string | null,
  ): GptShadeRow {
    const known = String(existingShadeName ?? "").trim();
    const title = String(free?.title ?? "").trim();
    const blob = [known, title, free?.brand].filter(Boolean).join(" ");
    let code = this.extractShadeCode(blob || title, barcode, index);
    if (this.isBarcodeFragmentCode(code, barcode)) {
      code = this.extractShadeCode(known || title, barcode, index);
    }
    let nameEn = known ? this.extractShadeName(known, code) || known : this.extractShadeName(title, code);
    if (!nameEn || this.isGenericShadeName(nameEn)) {
      nameEn = this.inventShadeLabel(blob || title, code, index);
    }
    if (this.isGenericShadeName(nameEn)) {
      nameEn = this.inventShadeLabel(blob || title, code, index);
    }
    const nameAr = this.polishMarketArabic(this.guessShadeNameAr(nameEn, code));
    return {
      barcode,
      code,
      name_en: nameEn,
      name_ar: nameAr,
      color_hex: this.guessShadeHex(`${nameEn} ${title} ${blob}`),
    };
  }

  private inventShadeLabel(text: string, code: string, index: number): string {
    let s = this.stripRetailerJunk(text);
    s = s.replace(/\bARTDECO\b/gi, " ").replace(/\blip\s*fluid\b/gi, " ");
    s = s.replace(/\bmat\s*passion\b/gi, " ").replace(/\b\d+\s*ml\b/gi, " ");
    s = s.replace(/\b(?:nr\.?|no\.?|n[°o]\.?|#)\s*\d+\b/gi, " ");
    s = s.replace(/\s+/g, " ").trim();
    const words = s.split(/\s+/).filter((w) => w.length > 1 && !/^\d+$/.test(w));
    if (words.length >= 2) return words.slice(-2).join(" ");
    if (words.length === 1) return words[0];
    return code ? `Shade ${code}` : `Shade ${index + 1}`;
  }

  private shadeSortNumber(code: string, name: string): number | null {
    const c = String(code ?? "").trim();
    if (/^\d{1,3}$/.test(c)) {
      const n = parseInt(c, 10);
      return Number.isFinite(n) ? n : null;
    }
    const alphaNum = c.match(/^([A-Za-z]?)(\d{1,3})$/);
    if (alphaNum?.[2]) {
      const n = parseInt(alphaNum[2], 10);
      if (n >= 1 && n <= 999) return n;
    }
    const nums = [...String(name ?? "").matchAll(/\b(\d{1,3})\b/g)];
    if (nums.length) {
      const n = parseInt(nums[nums.length - 1][1], 10);
      if (n >= 1 && n <= 999) return n;
    }
    return null;
  }

  private compareShadeOrder(
    a: { code: string; name: string },
    b: { code: string; name: string },
    barcodeA: string,
    barcodeB: string,
  ): number {
    const na = this.shadeSortNumber(a.code, a.name);
    const nb = this.shadeSortNumber(b.code, b.name);
    if (na != null && nb != null && na !== nb) return na - nb;
    if (na != null && nb == null) return -1;
    if (na == null && nb != null) return 1;
    const nameCmp = String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
      sensitivity: "base",
    });
    if (nameCmp !== 0) return nameCmp;
    const barcodeCmp = String(barcodeA ?? "").localeCompare(String(barcodeB ?? ""));
    if (barcodeCmp !== 0) return barcodeCmp;
    return String(a.code ?? "").localeCompare(String(b.code ?? ""), undefined, { sensitivity: "base" });
  }

  private sortShadeFamily<
    T extends { barcode: string; code?: string; name?: string; nameEn?: string },
  >(shades: T[]): T[] {
    return [...shades].sort((a, b) =>
      this.compareShadeOrder(
        { code: String(a.code ?? ""), name: String(a.name ?? a.nameEn ?? "") },
        { code: String(b.code ?? ""), name: String(b.name ?? b.nameEn ?? "") },
        a.barcode,
        b.barcode,
      ),
    );
  }

  private extractShadeCode(text: string, barcode: string, index: number): string {
    const t = text || "";
    const labeled =
      t.match(/\b(?:shade|n[°o.]?|nr\.?|no\.?|#)\s*([A-Za-z]?\d{1,3})\b/i) ||
      t.match(/\b([A-Z]{1,2}\d{2,3})\b/);
    if (labeled?.[1]) return labeled[1].toUpperCase();

    const endNum = t.match(/\b(\d{2,3})\b(?!\s*(?:ml|g|gr|oz)\b)/gi);
    if (endNum?.length) {
      const last = endNum[endNum.length - 1];
      const n = parseInt(last, 10);
      if (n >= 10 && n <= 999) return String(n);
    }

    return String(index + 1).padStart(2, "0");
  }

  private isBarcodeFragmentCode(code: string, barcode: string): boolean {
    const c = String(code ?? "").trim();
    if (!/^\d{3,4}$/.test(c)) return false;
    const digits = barcode.replace(/\D/g, "");
    return digits.includes(c);
  }

  private isGenericShadeName(name: string): boolean {
    const t = String(name ?? "").trim();
    if (!t) return true;
    if (/^تدرج\s*\d+$/i.test(t)) return true;
    if (/^shade\s*\d+$/i.test(t)) return true;
    if (/^shade\s*\d{1,3}$/i.test(t)) return true;
    if (/^\d{1,3}$/.test(t)) return true;
    return false;
  }

  private catalogHubBase(): string {
    const raw =
      process.env.CATALOG_HUB_INTERNAL_URL ??
      process.env.CATALOG_HUB_URL ??
      "http://catalog-hub:10000";
    return raw.replace(/\/$/, "").replace(/\/catalog-hub$/, "");
  }

  private async lookupCatalogShade(
    barcode: string,
  ): Promise<{ shadeName?: string; title?: string; imageUrl?: string } | null> {
    const stores = ["faces", "miswag", "miraaya", "beautyway", "niceone"];
    for (const store of stores) {
      try {
        const url = `${this.catalogHubBase()}/api/import/search?q=${encodeURIComponent(barcode)}&store=${encodeURIComponent(store)}&stores=${encodeURIComponent(store)}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": "AlhayaaAiAutofill/2.1" },
          signal: AbortSignal.timeout(6_500),
        });
        if (!res.ok) continue;
        const body = (await res.json()) as {
          results?: Array<{
            shadeName?: string;
            matchedShadeName?: string;
            nameEn?: string;
            nameAr?: string;
            title?: string;
            thumb?: string;
          }>;
        };
        const hit = body.results?.[0];
        if (!hit) continue;
        const shadeName = String(hit.matchedShadeName || hit.shadeName || "").trim();
        const title = String(hit.nameEn || hit.nameAr || hit.title || "").trim();
        const imageUrl = String(hit.thumb || "").trim();
        if (shadeName || title) {
          return {
            shadeName: shadeName || undefined,
            title: title || undefined,
            imageUrl: imageUrl.startsWith("http") ? imageUrl : undefined,
          };
        }
      } catch {
        /* try next store */
      }
    }
    return null;
  }

  private async enrichShadeHintsFromCatalog(
    barcodes: string[],
    freeByBarcode: Map<string, FreeHint>,
  ): Promise<void> {
    for (let i = 0; i < barcodes.length; i += 6) {
      const chunk = barcodes.slice(i, i + 6);
      await Promise.all(
        chunk.map(async (barcode) => {
          const cur = freeByBarcode.get(barcode) ?? {};
          const title = String(cur.title ?? "").trim();
          const code = this.extractShadeCode(title, barcode, 0);
          const name = this.extractShadeName(title, code);
          if (title.length >= 14 && name && !this.isGenericShadeName(name)) return;

          const hit = await this.lookupCatalogShade(barcode);
          if (!hit) return;

          const next: FreeHint = { ...cur };
          if (hit.shadeName) {
            next.title = hit.title
              ? `${hit.title} — ${hit.shadeName}`
              : hit.shadeName;
          } else if (hit.title && hit.title.length > title.length) {
            next.title = hit.title;
          }
          if (!next.imageUrl && hit.imageUrl) next.imageUrl = hit.imageUrl;
          next.source = next.source ?? "catalog-hub";
          freeByBarcode.set(barcode, next);
        }),
      );
    }
  }

  private async enrichShadeHintsFromImages(
    barcodes: string[],
    freeByBarcode: Map<string, FreeHint>,
    nameHints: string[],
  ): Promise<void> {
    const hints = [...new Set(nameHints.map((h) => h.replace(/\s+/g, " ").trim()).filter((h) => h.length >= 2))];
    const need = barcodes.filter((barcode) => {
      const title = String(freeByBarcode.get(barcode)?.title ?? "").trim();
      if (title.length < 10) return true;
      const code = this.extractShadeCode(title, barcode, 0);
      const name = this.extractShadeName(title, code);
      return !name || /^shade\s*\d+$/i.test(name);
    });
    if (!need.length) return;

    for (let i = 0; i < need.length; i += 4) {
      const chunk = need.slice(i, i + 4);
      await Promise.all(
        chunk.map(async (barcode) => {
          try {
            const hits = await this.images.searchByBarcode(barcode, 24, hints);
            const titles = this.extractIdentityTitles(hits);
            const best =
              titles.find((t) => this.extractShadeName(t, this.extractShadeCode(t, barcode, 0)).length >= 2) ??
              titles[0] ??
              hits.find((h) => (h.title ?? "").trim().length >= 12)?.title;
            if (!best) return;
            const cur = freeByBarcode.get(barcode) ?? {};
            const curTitle = String(cur.title ?? "").trim();
            if (!curTitle || curTitle.length < best.length) {
              freeByBarcode.set(barcode, { ...cur, title: best.trim(), source: cur.source ?? "image-search" });
            }
          } catch {
            /* ignore per-barcode image failures */
          }
        }),
      );
    }
  }

  private extractShadeName(text: string, code: string): string {
    const quoted = text.match(/["“']([A-Za-z][A-Za-z \-]{2,40})["”']/);
    if (quoted?.[1]) return quoted[1].trim();

    const nrMatch = text.match(
      /\b(?:no\.?|nr\.?|n[°o]\.?|#)\s*(\d{1,3})\s*[-–:]\s*([A-Za-z][A-Za-z\s\-]{2,36})/i,
    );
    if (nrMatch?.[2]) return nrMatch[2].replace(/\s+/g, " ").trim();

    const colorTail = text.match(/\b([A-Za-z][A-Za-z\s\-]{2,28}?)\s+(\d{2,3})\s*(?:ml|mL|g|gr|oz)?\s*$/i);
    if (colorTail?.[1] && colorTail?.[2]) {
      const label = colorTail[1].replace(/\s+/g, " ").trim();
      const num = colorTail[2];
      if (label.length >= 3 && !/^(lip|fluid|mat|passion|artdeco|makeup)$/i.test(label)) {
        return label;
      }
      if (label.length >= 3) return `${label} ${num}`;
    }

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
    const nameArRaw = this.ensureBrandDashName(gpt.name_ar || gpt.name_en || "", arTitleBrand, {
      doubleBrand: false,
      alsoStrip: [brandEn, brandAr],
    });
    const typeHint =
      gpt.category_tertiary_ar || gpt.category_sub_ar || this.guessProductType(`${nameEn} ${nameArRaw}`).ar;
    const nameArBody = this.extractProductCore(nameArRaw, arTitleBrand);
    const nameAr = this.polishMarketArabic(
      arTitleBrand ? `${arTitleBrand} - ${this.arabicizeProductCore(nameArBody, typeHint)}` : this.arabicizeProductCore(nameArRaw, typeHint),
    );
    const nameArFinal = this.dedupeArabicPhrases(nameAr);
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
      name_ar: nameArFinal,
      description_ar: descriptionAr,
      category_main_code: (() => {
        const c = String(gpt.category_main_code ?? "")
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        return /^M\d{2}$/.test(c) ? c : "";
      })(),
      category_sub_codes: normCodes(gpt.category_sub_codes, "S").slice(0, 4),
      category_tertiary_codes: normCodes(gpt.category_tertiary_codes, "T").slice(0, 4),
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

  private async mergeNamedImageSearch(
    imageHits: GoogleImageHit[],
    gpt: Pick<GptAutofillJson, "brand_ar" | "brand_en" | "name_ar" | "name_en">,
  ) {
    const queries = [
      [gpt.brand_en || gpt.brand_ar, gpt.name_en].filter(Boolean).join(" "),
      [gpt.brand_en || gpt.brand_ar, gpt.name_ar].filter(Boolean).join(" "),
      gpt.name_en,
      gpt.name_ar,
    ]
      .map((s) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, 90))
      .filter((s) => s.length >= 4);
    const seen = new Set(imageHits.map((h) => h.url.toLowerCase()));
    for (const q of [...new Set(queries)].slice(0, 3)) {
      if (imageHits.length >= 90) break;
      try {
        const extra = await this.images.searchQuery(q, 48);
        for (const hit of extra) {
          const key = hit.url.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          imageHits.push(hit);
        }
      } catch (err) {
        this.logger.warn(`Named image search failed: ${(err as Error).message}`);
      }
    }
  }

  private async matchCategories(gpt: GptAutofillJson) {
    const catalog = await this.getCategoryCatalog();
    const type = this.guessProductType(
      [gpt.name_ar, gpt.name_en, gpt.category_main_ar, gpt.category_sub_ar, gpt.category_tertiary_ar, gpt.brand_en, gpt.brand_ar]
        .filter(Boolean)
        .join(" "),
    );

    const mainFromCode = this.resolveCode(catalog, gpt.category_main_code, "main");
    let mainId = mainFromCode?.id ?? null;
    let mainName = mainFromCode?.nameAr ?? null;
    const mainCode = mainFromCode?.code ?? null;

    const subcategoryIds: string[] = [];
    const tertiaryCategoryIds: string[] = [];
    const subcategoryNames: string[] = [];
    const tertiaryNames: string[] = [];
    const maxMulti = 4;

    const pushSub = (id: string | undefined | null, name?: string | null) => {
      if (!id || subcategoryIds.includes(id) || subcategoryIds.length >= maxMulti) return;
      subcategoryIds.push(id);
      if (name) subcategoryNames.push(name);
    };
    const pushTert = (id: string | undefined | null, name?: string | null) => {
      if (!id || tertiaryCategoryIds.includes(id) || tertiaryCategoryIds.length >= maxMulti) return;
      tertiaryCategoryIds.push(id);
      if (name) tertiaryNames.push(name);
    };

    if (mainFromCode) {
      for (const code of gpt.category_sub_codes ?? []) {
        const entry = this.resolveCode(catalog, code, "sub");
        if (!entry) continue;
        if (entry.parentCode !== mainCode && entry.parentId !== mainFromCode.id) continue;
        pushSub(entry.id, entry.nameAr);
      }

      const allowedSubCodes = new Set(
        [...catalog.byCode.values()]
          .filter((e) => e.level === "sub" && subcategoryIds.includes(e.id))
          .map((e) => e.code),
      );
      for (const code of gpt.category_tertiary_codes ?? []) {
        const entry = this.resolveCode(catalog, code, "tertiary");
        if (!entry) continue;
        if (entry.parentCode && !allowedSubCodes.has(entry.parentCode)) continue;
        if (entry.parentId && !subcategoryIds.includes(entry.parentId)) continue;
        pushTert(entry.id, entry.nameAr);
      }
    }

    if (!mainId) {
      const mains = [...catalog.byCode.values()]
        .filter((e) => e.level === "main")
        .map((e) => ({ id: e.id, nameAr: e.nameAr, nameEn: null as string | null, name: e.nameAr }));
      const mainHints = this.collectCategoryHints(gpt.category_main_ar, [type.mainAr, gpt.name_ar, gpt.name_en]);
      for (const hint of mainHints) {
        const hit = this.bestMatch(mains, hint, hint);
        if (hit && hit.score >= 48) {
          mainId = hit.id;
          mainName = hit.nameAr || hit.name || null;
          break;
        }
      }
      if (!mainId) {
        for (const hint of [type.mainAr, gpt.category_main_ar].filter(Boolean)) {
          const tn = this.norm(hint);
          if (!tn) continue;
          const row = mains.find((m) => {
            const n = this.norm(m.nameAr || m.name || "");
            return n === tn || n.includes(tn) || tn.includes(n);
          });
          if (row) {
            mainId = row.id;
            mainName = row.nameAr || row.name || null;
            break;
          }
        }
      }
    }

    const allEntries = [...catalog.byCode.values()];
    const subsOfMain = mainId
      ? allEntries
          .filter((e) => e.level === "sub" && e.parentId === mainId)
          .map((e) => ({ id: e.id, nameAr: e.nameAr, nameEn: null as string | null, name: e.nameAr }))
      : [];

    if (mainId && subcategoryIds.length < maxMulti && subsOfMain.length) {
      const subHints = this.collectCategoryHints(gpt.category_sub_ar, [
        ...(gpt.category_subs_ar ?? []),
        type.subAr,
        type.ar,
      ]);
      const identityHints = this.collectCategoryHints(gpt.name_ar, [gpt.name_en, type.en, type.ar]);
      const ids = this.matchManyCategories(subsOfMain, subHints, identityHints, {
        maxSelect: maxMulti,
        primaryMinScore: 48,
        identityMinScore: 58,
      });
      for (const id of ids) {
        const row = subsOfMain.find((s) => s.id === id);
        pushSub(id, row?.nameAr);
      }
      if (!subcategoryIds.length && type.subAr) {
        const tn = this.norm(type.subAr);
        for (const row of subsOfMain) {
          const n = this.norm(row.nameAr || row.name || "");
          if (n === tn || n.includes(tn) || (tn.length >= 3 && tn.includes(n))) {
            pushSub(row.id, row.nameAr);
          }
        }
      }
    }

    const tertUnderSubs = (parentIds: string[]) =>
      allEntries
        .filter((e) => e.level === "tertiary" && e.parentId && parentIds.includes(e.parentId))
        .map((e) => ({ id: e.id, nameAr: e.nameAr, nameEn: null as string | null, name: e.nameAr, parentId: e.parentId }));

    if (mainId && tertiaryCategoryIds.length < maxMulti) {
      const tertHints = this.collectCategoryHints(gpt.category_tertiary_ar, [
        ...(gpt.category_tertiaries_ar ?? []),
        type.ar,
      ]);
      const identityHints = this.collectCategoryHints(gpt.name_ar, [gpt.name_en, type.en, type.ar]);
      let tertRows = tertUnderSubs(subcategoryIds);
      if (!tertRows.length && subsOfMain.length) {
        tertRows = tertUnderSubs(subsOfMain.map((s) => s.id));
      }
      if (tertRows.length) {
        const ids = this.matchManyCategories(tertRows, tertHints, identityHints, {
          maxSelect: maxMulti,
          primaryMinScore: 48,
          identityMinScore: 58,
        });
        for (const id of ids) {
          const row = tertRows.find((t) => t.id === id);
          if (row?.parentId) {
            const parent = subsOfMain.find((s) => s.id === row.parentId) ?? allEntries.find((e) => e.id === row.parentId);
            pushSub(row.parentId, parent?.nameAr ?? null);
          }
          pushTert(id, row?.nameAr);
        }
      }
      if (!tertiaryCategoryIds.length && type.ar) {
        const tn = this.norm(type.ar);
        for (const row of tertUnderSubs(subsOfMain.length ? subsOfMain.map((s) => s.id) : subcategoryIds)) {
          const n = this.norm(row.nameAr || row.name || "");
          if (n === tn || n.includes(tn) || (tn.length >= 4 && tn.includes(n))) {
            if (row.parentId) {
              const parent = subsOfMain.find((s) => s.id === row.parentId);
              pushSub(row.parentId, parent?.nameAr);
            }
            pushTert(row.id, row.nameAr);
          }
        }
      }
    }

    return {
      categoryId: mainId,
      subcategoryId: subcategoryIds[0] ?? null,
      tertiaryCategoryId: tertiaryCategoryIds[0] ?? null,
      subcategoryIds,
      tertiaryCategoryIds,
      categoryNameAr: mainName || gpt.category_main_ar || type.mainAr,
      subcategoryNameAr: subcategoryNames[0] ?? (gpt.category_sub_ar || type.subAr),
      tertiaryNameAr: tertiaryNames[0] ?? (gpt.category_tertiary_ar || type.ar),
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
    opts: { maxSelect?: number; primaryMinScore?: number; identityMinScore?: number } = {},
  ): string[] {
    if (!rows.length) return [];
    const maxSelect = Math.max(1, opts.maxSelect ?? 4);
    const primaryMin = opts.primaryMinScore ?? 48;
    const identityMin = opts.identityMinScore ?? 58;

    const selected: string[] = [];
    const push = (id: string | undefined | null) => {
      if (!id || selected.includes(id) || selected.length >= maxSelect) return;
      selected.push(id);
    };

    const ranked: Array<{ id: string; score: number }> = [];
    for (const hint of primaryHints) {
      const hit = this.bestMatch(rows, hint, hint);
      if (hit && hit.score >= primaryMin) ranked.push({ id: hit.id, score: hit.score });
    }
    ranked.sort((a, b) => b.score - a.score);
    for (const r of ranked) push(r.id);

    if (selected.length < maxSelect && identityHints.length) {
      const extra: Array<{ id: string; score: number }> = [];
      for (const hint of identityHints) {
        const hit = this.bestMatch(rows, hint, hint);
        if (hit && hit.score >= identityMin) extra.push({ id: hit.id, score: hit.score });
      }
      extra.sort((a, b) => b.score - a.score);
      for (const r of extra) push(r.id);
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
        for (const c of expandedCandidates) {
          if (t === c) {
            score = Math.max(score, t.length >= 3 ? 100 : 88);
            continue;
          }
          if (this.isGenericCategoryToken(t) || this.isGenericCategoryToken(c)) continue;
          if (t.includes(c) || c.includes(t)) {
            const shorter = t.length <= c.length ? t : c;
            const longer = t.length > c.length ? t : c;
            if (shorter.length < 4) continue;
            if (this.isGenericCategoryToken(shorter)) continue;
            score = Math.max(score, shorter.length * 2 >= longer.length ? 90 : 72);
          } else if (this.tokenOverlap(t, c) >= 0.7) {
            score = Math.max(score, 60);
          }
        }
      }
      if (score >= 48 && (!best || score > best.score)) best = { ...row, score };
    }
    return best;
  }

  private isGenericCategoryToken(token: string): boolean {
    const n = this.norm(token);
    if (!n) return true;
    if (GENERIC_CATEGORY_TOKENS.has(n)) return true;
    // Short Latin particles only — Arabic labels like شفاه/وجه must still match.
    if (/^[a-z]+$/.test(n) && n.length <= 3) return true;
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
