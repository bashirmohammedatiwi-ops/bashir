export type AiAutofillImage = {
  url: string;
  thumbUrl?: string | null;
  title?: string | null;
  source?: string | null;
};

export type AiAutofillCategory = {
  categoryId?: string | null;
  subcategoryId?: string | null;
  tertiaryCategoryId?: string | null;
  subcategoryIds?: string[];
  tertiaryCategoryIds?: string[];
  categoryNameAr?: string | null;
  subcategoryNameAr?: string | null;
  tertiaryNameAr?: string | null;
};

export type AiAutofillShade = {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
  colorHex?: string;
  barcode?: string;
  position?: number;
};

export type AiAutofillResult = {
  barcode: string;
  brandAr: string;
  brandEn: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  productTypeAr?: string;
  category: AiAutofillCategory;
  confidence: number;
  needsReview: boolean;
  images: AiAutofillImage[];
  shades: AiAutofillShade[];
  namesVerified?: boolean;
  namingSource?: string;
  meta?: Record<string, unknown>;
};

export type ShadeFamilyShade = {
  barcode: string;
  code?: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  colorHex?: string;
  position?: number;
};

export type ShadeFamilyResult = {
  barcodes: string[];
  brandAr: string;
  brandEn: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  productTypeAr?: string;
  category: AiAutofillCategory;
  confidence: number;
  needsReview: boolean;
  shades: ShadeFamilyShade[];
  images: AiAutofillImage[];
  namesVerified?: boolean;
  namingSource?: string;
  isFallback?: boolean;
  meta?: Record<string, unknown>;
};

export type AiModelOption = {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr?: string;
  apiModel?: string;
  fast?: boolean;
};

export function pickImages(data: unknown): AiAutofillImage[] {
  const body = data as { images?: unknown[] };
  return (body?.images ?? [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((img) => ({
      url: String(img.url ?? "").trim(),
      thumbUrl: img.thumbUrl ? String(img.thumbUrl) : null,
      title: img.title ? String(img.title) : null,
      source: img.source ? String(img.source) : null,
    }))
    .filter((i) => i.url.length > 0);
}

export function parseAutofill(data: unknown): AiAutofillResult {
  const d = (data ?? {}) as Record<string, unknown>;
  const cat = (d.category ?? {}) as Record<string, unknown>;
  const meta = (d.meta ?? {}) as Record<string, unknown>;
  return {
    barcode: String(d.barcode ?? ""),
    brandAr: String(d.brandAr ?? ""),
    brandEn: String(d.brandEn ?? ""),
    nameAr: String(d.nameAr ?? ""),
    nameEn: String(d.nameEn ?? ""),
    descriptionAr: String(d.descriptionAr ?? ""),
    descriptionEn: String(d.descriptionEn ?? ""),
    productTypeAr: String(d.productTypeAr ?? ""),
    category: {
      categoryId: cat.categoryId ? String(cat.categoryId) : null,
      subcategoryId: cat.subcategoryId ? String(cat.subcategoryId) : null,
      tertiaryCategoryId: cat.tertiaryCategoryId ? String(cat.tertiaryCategoryId) : null,
      subcategoryIds: (cat.subcategoryIds as string[] | undefined) ?? [],
      tertiaryCategoryIds: (cat.tertiaryCategoryIds as string[] | undefined) ?? [],
      categoryNameAr: cat.categoryNameAr ? String(cat.categoryNameAr) : null,
      subcategoryNameAr: cat.subcategoryNameAr ? String(cat.subcategoryNameAr) : null,
      tertiaryNameAr: cat.tertiaryNameAr ? String(cat.tertiaryNameAr) : null,
    },
    confidence: Number(d.confidence ?? 0),
    needsReview: d.needsReview === true,
    images: pickImages(d),
    shades: ((d.shades as unknown[]) ?? []).map((s) => {
      const row = s as Record<string, unknown>;
      return {
        name: String(row.name ?? ""),
        nameAr: row.nameAr ? String(row.nameAr) : undefined,
        nameEn: row.nameEn ? String(row.nameEn) : undefined,
        code: row.code ? String(row.code) : undefined,
        colorHex: row.colorHex ? String(row.colorHex) : undefined,
        barcode: row.barcode ? String(row.barcode) : undefined,
        position: Number(row.position ?? 0),
      };
    }),
    namesVerified: meta.namesVerified === true,
    namingSource: meta.namingSource ? String(meta.namingSource) : undefined,
    meta,
  };
}

export function parseShadeFamily(data: unknown): ShadeFamilyResult {
  const d = (data ?? {}) as Record<string, unknown>;
  const cat = (d.category ?? {}) as Record<string, unknown>;
  const meta = (d.meta ?? {}) as Record<string, unknown>;
  return {
    barcodes: ((d.barcodes as unknown[]) ?? []).map((b) => String(b)),
    brandAr: String(d.brandAr ?? ""),
    brandEn: String(d.brandEn ?? ""),
    nameAr: String(d.nameAr ?? ""),
    nameEn: String(d.nameEn ?? ""),
    descriptionAr: String(d.descriptionAr ?? ""),
    descriptionEn: String(d.descriptionEn ?? ""),
    productTypeAr: String(d.productTypeAr ?? ""),
    category: {
      categoryId: cat.categoryId ? String(cat.categoryId) : null,
      subcategoryId: cat.subcategoryId ? String(cat.subcategoryId) : null,
      tertiaryCategoryId: cat.tertiaryCategoryId ? String(cat.tertiaryCategoryId) : null,
      subcategoryIds: (cat.subcategoryIds as string[] | undefined) ?? [],
      tertiaryCategoryIds: (cat.tertiaryCategoryIds as string[] | undefined) ?? [],
    },
    confidence: Number(d.confidence ?? 0),
    needsReview: d.needsReview === true,
    shades: ((d.shades as unknown[]) ?? []).map((s) => {
      const row = s as Record<string, unknown>;
      return {
        barcode: String(row.barcode ?? ""),
        code: row.code ? String(row.code) : undefined,
        name: String(row.name ?? ""),
        nameAr: row.nameAr ? String(row.nameAr) : undefined,
        nameEn: row.nameEn ? String(row.nameEn) : undefined,
        colorHex: row.colorHex ? String(row.colorHex) : "#CCCCCC",
        position: Number(row.position ?? 0),
      };
    }),
    images: pickImages(d),
    namesVerified: meta.namesVerified === true,
    namingSource: meta.namingSource ? String(meta.namingSource) : undefined,
    isFallback: meta.fallback === true || meta.namingSource === "fallback",
    meta,
  };
}
