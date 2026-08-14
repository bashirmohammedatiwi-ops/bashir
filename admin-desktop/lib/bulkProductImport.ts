import { matchBrandIdLocal } from "./catalogBrandMatch";
import { matchBestNamedEntity, matchNamedLabels } from "./catalogCategoryMatch";
import {
  lookupInventoryBarcodes,
  resolveBarcodeLookup,
  type BarcodeInventoryLookup,
} from "./inventorySync";
import { buildProductPayload } from "./productPayload";
import type { PastedProductRow } from "./parseProductTablePaste";
import { mutations, queries } from "./queries";

type NamedRow = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  parentId?: string | null;
};

export type BulkProductResolved = PastedProductRow & {
  brandId?: string;
  brandLabel?: string;
  categoryId?: string;
  categoryLabel?: string;
  subcategoryIds: string[];
  subcategoryLabels: string[];
  tertiaryCategoryIds: string[];
  tertiaryLabels: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  existsInApp: boolean;
  existingId?: string;
  existingName?: string;
  warnings: string[];
  canImport: boolean;
};

export type BulkImportProgress = {
  index: number;
  total: number;
  barcode: string;
  status: "ok" | "skip" | "error";
  message?: string;
};

function labelOf(entities: NamedRow[], id?: string) {
  if (!id) return "";
  const hit = entities.find((e) => e.id === id);
  return hit?.nameAr || hit?.name || hit?.nameEn || "";
}

function labelsOf(entities: NamedRow[], ids: string[]) {
  return ids.map((id) => labelOf(entities, id)).filter(Boolean);
}

export async function resolveBulkProductRows(
  rows: PastedProductRow[],
): Promise<BulkProductResolved[]> {
  const [brands, categories, subcategories, tertiary] = await Promise.all([
    queries.brands({ activeOnly: true }),
    queries.categories(),
    queries.subcategories(),
    queries.tertiarySections(),
  ]);

  const brandRows = (brands ?? []) as NamedRow[];
  const catRows = (categories ?? []) as NamedRow[];
  const subRows = (subcategories ?? []) as NamedRow[];
  const tertRows = (tertiary ?? []) as NamedRow[];

  const invMap = await lookupInventoryBarcodes(rows.map((r) => r.barcode)).catch(
    () => ({} as Record<string, BarcodeInventoryLookup>),
  );

  const brandCache = new Map<string, string | undefined>();

  const resolved: BulkProductResolved[] = [];
  for (const row of rows) {
    const warnings: string[] = [];
    const brandKey = row.brand.trim().toLowerCase();
    let brandId = brandCache.get(brandKey);
    if (!brandCache.has(brandKey)) {
      brandId = matchBrandIdLocal(brandRows, row.brand, row.brand);
      if (!brandId && row.brand.trim()) {
        try {
          const created = await mutations.resolveBrand({
            brandAr: row.brand,
            brandEn: row.brand,
            createIfMissing: true,
          });
          brandId = created?.brand?.id || created?.id;
          if (brandId) {
            brandRows.push({
              id: brandId,
              name: row.brand,
              nameAr: row.brand,
              nameEn: row.brand,
            });
          }
        } catch {
          warnings.push("تعذّر إنشاء/مطابقة البراند");
        }
      }
      brandCache.set(brandKey, brandId);
    }
    if (!brandId) warnings.push("البراند غير معروف");

    const categoryId = matchBestNamedEntity(catRows, row.category, 40);
    if (!categoryId && row.category.trim()) warnings.push("القسم غير مطابق");

    const subcategoryIds = matchNamedLabels(
      subRows,
      row.subcategory,
      50,
      categoryId ? [categoryId] : undefined,
    );
    if (row.subcategory.trim() && !subcategoryIds.length) {
      warnings.push("القسم الفرعي غير مطابق");
    }

    const tertiaryCategoryIds = matchNamedLabels(
      tertRows,
      row.tertiary,
      50,
      subcategoryIds.length ? subcategoryIds : undefined,
    );
    if (row.tertiary.trim() && !tertiaryCategoryIds.length) {
      warnings.push("القسم الثانوي غير مطابق");
    }

    const inv = resolveBarcodeLookup(row.barcode, invMap);
    const existsInApp = Boolean(inv?.inApp?.id);
    if (existsInApp) warnings.push("موجود مسبقاً في المتجر");

    const price = Number(inv?.pos?.price ?? 0);
    const originalPrice = Number(inv?.pos?.originalPrice ?? 0);
    const discountPercent = Number(inv?.pos?.discountPercent ?? 0);
    const stock = Number(inv?.pos?.stock ?? 0);
    if (!inv?.pos) warnings.push("لا بيانات POS للسعر/المخزون");

    const canImport = Boolean(brandId && categoryId && !existsInApp && (row.nameAr || row.nameEn));

    resolved.push({
      ...row,
      brandId,
      brandLabel: row.brand || labelOf(brandRows, brandId),
      categoryId,
      categoryLabel: labelOf(catRows, categoryId) || row.category,
      subcategoryIds,
      subcategoryLabels: labelsOf(subRows, subcategoryIds),
      tertiaryCategoryIds,
      tertiaryLabels: labelsOf(tertRows, tertiaryCategoryIds),
      price,
      originalPrice,
      discountPercent,
      stock,
      existsInApp,
      existingId: inv?.inApp?.id,
      existingName: inv?.inApp?.name ?? undefined,
      warnings,
      canImport,
    });
  }

  return resolved;
}

export async function importBulkProducts(
  rows: BulkProductResolved[],
  onProgress?: (p: BulkImportProgress) => void,
): Promise<{ ok: number; skipped: number; failed: number }> {
  const importable = rows.filter((r) => r.canImport);
  let ok = 0;
  let skipped = rows.length - importable.length;
  let failed = 0;

  for (let i = 0; i < importable.length; i++) {
    const row = importable[i];
    try {
      const payload = buildProductPayload(
        {
          sku: `AI-${row.barcode}`,
          barcode: row.barcode,
          nameAr: row.nameAr,
          nameEn: row.nameEn,
          brandId: row.brandId,
          categoryId: row.categoryId,
          subcategoryIds: row.subcategoryIds,
          tertiaryCategoryIds: row.tertiaryCategoryIds,
          descriptionAr: row.descriptionAr,
          descriptionEn: row.descriptionEn,
          price: row.price,
          originalPrice: row.originalPrice,
          discountPercent: row.discountPercent,
          stock: row.stock,
          isActive: true,
        },
        [],
      );
      await mutations.createProduct(payload);
      ok += 1;
      onProgress?.({
        index: i + 1,
        total: importable.length,
        barcode: row.barcode,
        status: "ok",
      });
    } catch (err) {
      failed += 1;
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "فشل الإنشاء";
      onProgress?.({
        index: i + 1,
        total: importable.length,
        barcode: row.barcode,
        status: "error",
        message: String(message),
      });
    }
  }

  if (skipped > 0) {
    onProgress?.({
      index: importable.length,
      total: importable.length,
      barcode: "",
      status: "skip",
      message: `تم تخطي ${skipped} صف (موجود أو ناقص بيانات)`,
    });
  }

  return { ok, skipped, failed };
}
