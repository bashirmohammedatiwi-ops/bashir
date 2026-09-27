/**
 * GPT Barcode Import v2 — minimal GPT (names only), Composer for description/category/shades.
 *
 * Single product: 1 GPT call + 1 web search per barcode.
 * Variant group: 1 GPT call + 1 web search per group (representative barcode only).
 *
 * Usage:
 *   IMPORT_MANIFEST=scripts/data/gpt-import-test-2-shades.json npx tsx scripts/gpt-barcode-import.ts
 *   BARCODES=6971764158501 npx tsx scripts/gpt-barcode-import.ts
 *
 * Env:
 *   OPENAI_API_KEY, OPENAI_MODEL (default gpt-5.6-terra)
 *   API_BASE, ADMIN_EMAIL, ADMIN_PASSWORD
 *   IMPORT_MANIFEST — JSON with singles[] and variant_groups[]
 *   BARCODES — comma-separated singles (legacy/simple mode)
 *   DRY_RUN=1 — validate without POST
 *   REFRESH_CATEGORIES=1 — refetch category catalog
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readCache, writeCache } from "./lib/gpt-barcode-import/cache";
import {
  buildCategoryCatalog,
  categoryLabel,
  loadCachedCatalog,
  saveCatalog,
} from "./lib/gpt-barcode-import/catalog";
import {
  buildDescriptions,
  inferCategories,
  parseBrand,
  slugify,
} from "./lib/gpt-barcode-import/composer";
import { buildGroupKey, readGroupCache, writeGroupCache } from "./lib/gpt-barcode-import/group-cache";
import { uploadProductImage } from "./lib/gpt-barcode-import/images";
import { estimateCostUsd, researchProductNameWithGpt } from "./lib/gpt-barcode-import/openai";
import type {
  GptMinimalResearch,
  GptUsage,
  ImportManifest,
  ProcessResult,
  RunReport,
  VariantGroupInput,
  VariantInput,
} from "./lib/gpt-barcode-import/types";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const DRY_RUN = process.env.DRY_RUN === "1";
const REFRESH_CATEGORIES = process.env.REFRESH_CATEGORIES === "1";
const IMPORT_MANIFEST = process.env.IMPORT_MANIFEST ?? "";
const BARCODES_ENV = process.env.BARCODES ?? "";

function loadEnvFile(): void {
  const envPath = join(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile();

let token = "";
let gptCalls = 0;

async function login(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? json.accessToken ?? "";
  if (!token) throw new Error("No access token");
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: { message?: string } })?.error?.message ??
      (json as { message?: string })?.message ??
      res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return ((json as { data?: T }).data ?? json) as T;
}

async function fetchCategoryCatalog() {
  const tree = await api<unknown[]>("/categories?all=1");
  const catalog = buildCategoryCatalog(tree);
  saveCatalog(catalog);
  return catalog;
}

async function getCategoryCatalog() {
  if (!REFRESH_CATEGORIES) {
    const cached = loadCachedCatalog();
    if (cached) return cached;
  }
  await login();
  return fetchCategoryCatalog();
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

function loadManifest(): ImportManifest {
  if (IMPORT_MANIFEST) {
    const candidates = [
      IMPORT_MANIFEST,
      join(__dirname, IMPORT_MANIFEST),
      join(__dirname, "..", IMPORT_MANIFEST),
    ];
    const path = candidates.find((p) => existsSync(p));
    if (!path) throw new Error(`IMPORT_MANIFEST not found: ${IMPORT_MANIFEST}`);
    return JSON.parse(readFileSync(path, "utf8")) as ImportManifest;
  }
  const singles = BARCODES_ENV.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  return { singles };
}

async function resolveBrandId(brandAr: string, brandEn: string): Promise<string> {
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr,
    brandEn,
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve brand");
  return id;
}

async function fetchGptNames(
  barcode: string,
  variantLine: boolean,
  groupKey?: string,
): Promise<{ research: GptMinimalResearch; usage: GptUsage; fromCache: boolean }> {
  if (groupKey) {
    const groupCached = readGroupCache(groupKey);
    if (groupCached) {
      console.log("  ↺ using variant group cache");
      return { research: groupCached.research, usage: groupCached.usage, fromCache: true };
    }
  }

  const cached = readCache(barcode);
  if (cached) {
    console.log("  ↺ using barcode cache");
    return { research: cached.research, usage: cached.usage, fromCache: true };
  }

  console.log("  … calling OpenAI (one web search, names only)");
  gptCalls += 1;
  const gpt = await researchProductNameWithGpt(barcode, variantLine);
  writeCache({
    barcode,
    researched_at: new Date().toISOString(),
    model: gpt.model,
    research: gpt.research,
    usage: gpt.usage,
  });
  if (groupKey) {
    writeGroupCache({
      group_key: groupKey,
      representative_barcode: barcode,
      researched_at: new Date().toISOString(),
      model: gpt.model,
      research: gpt.research,
      usage: gpt.usage,
    });
  }
  console.log(
    `  GPT: in=${gpt.usage.input_tokens} out=${gpt.usage.output_tokens} searches=${gpt.usage.web_search_count}`,
  );
  return { research: gpt.research, usage: gpt.usage, fromCache: false };
}

function validateMinimal(
  barcode: string,
  research: GptMinimalResearch,
): { ok: boolean; reason?: string } {
  if (!research.product_name_ar?.trim() || !research.product_name_en?.trim()) {
    return { ok: false, reason: "missing product name" };
  }
  if (research.needs_review) {
    return { ok: false, reason: research.review_notes ?? "needs_review=true" };
  }
  if (research.confidence < 80) {
    return { ok: false, reason: `confidence ${research.confidence} < 80` };
  }
  if (!research.source_url?.trim()) {
    return { ok: false, reason: "no source_url" };
  }
  if (research.representative_barcode.trim() !== barcode.trim()) {
    return { ok: false, reason: `barcode mismatch: ${research.representative_barcode}` };
  }
  return { ok: true };
}

type ShadePayload = {
  name: string;
  colorHex: string;
  barcode: string;
  imageId?: string;
  position: number;
  stock: number;
};

async function buildShades(
  variants: VariantInput[],
  label: string,
): Promise<{ shades: ShadePayload[]; imageIds: string[]; review: string[] }> {
  const shades: ShadePayload[] = [];
  const imageIds: string[] = [];
  const review: string[] = [];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const shade: ShadePayload = {
      name: v.variant_value,
      colorHex: v.color_hex ?? "#888888",
      barcode: v.barcode.trim(),
      position: i,
      stock: 0,
    };

    if (v.image_url && !DRY_RUN) {
      try {
        const imageId = await uploadProductImage(token, v.image_url, `${label}-${v.variant_value}`);
        shade.imageId = imageId;
        imageIds.push(imageId);
        console.log(`    ✓ image ${v.variant_value}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        review.push(`${v.variant_value}: image upload failed — ${msg}`);
        console.log(`    ✗ image ${v.variant_value}: ${msg}`);
      }
      await new Promise((r) => setTimeout(r, 300));
    } else if (!v.image_url) {
      review.push(`${v.variant_value}: missing image_url`);
    }

    shades.push(shade);
  }

  return { shades, imageIds: [...new Set(imageIds)], review };
}

async function processSingle(
  barcode: string,
  catalog: Awaited<ReturnType<typeof buildCategoryCatalog>>,
): Promise<ProcessResult> {
  console.log(`\n=== SINGLE ${barcode} ===`);

  if (await barcodeExists(barcode)) {
    console.log("  ⊘ duplicate — skipped");
    return { barcode, status: "duplicate", kind: "single" };
  }

  const { research, usage, fromCache } = await fetchGptNames(barcode, false);
  const validation = validateMinimal(barcode, research);
  if (!validation.ok) {
    console.log(`  ⚠ needs review: ${validation.reason}`);
    return {
      barcode,
      status: "needs_review",
      kind: "single",
      name_ar: research.product_name_ar,
      name_en: research.product_name_en,
      confidence: research.confidence,
      review_notes: validation.reason,
      from_cache: fromCache,
      usage,
    };
  }

  const { brand_ar, brand_en } = parseBrand(research.product_name_en, research.product_name_ar);
  const cats = inferCategories(catalog, research.product_name_en, research.product_name_ar);
  if ("needs_review" in cats) {
    console.log(`  ⚠ needs review: ${cats.reason}`);
    return {
      barcode,
      status: "needs_review",
      kind: "single",
      name_ar: research.product_name_ar,
      name_en: research.product_name_en,
      brand_en,
      confidence: research.confidence,
      review_notes: cats.reason,
      from_cache: fromCache,
      usage,
    };
  }

  const { description_ar, description_en } = buildDescriptions(
    research.product_name_en,
    research.product_name_ar,
  );

  if (DRY_RUN) {
    console.log(`  ✓ validated (DRY_RUN) — ${research.product_name_ar}`);
    return {
      barcode,
      status: "added",
      kind: "single",
      name_ar: research.product_name_ar,
      name_en: research.product_name_en,
      brand_en,
      category: categoryLabel(
        catalog,
        cats.main_category.id,
        cats.subcategories.map((c) => c.id),
        cats.secondary_categories.map((c) => c.id),
      ),
      confidence: research.confidence,
      from_cache: fromCache,
      usage,
    };
  }

  const brandId = await resolveBrandId(brand_ar, brand_en);
  const slug = slugify(research.product_name_en, barcode);
  const subIds = cats.subcategories.map((c) => c.id);
  const tertiaryIds = cats.secondary_categories.map((c) => c.id);

  const created = await api<{ id: string }>("/products", "POST", {
    sku: `GPT-${barcode.slice(-8)}`,
    barcode,
    slug,
    brandId,
    categoryId: cats.main_category.id,
    subcategoryId: subIds[0],
    tertiaryCategoryId: tertiaryIds[0],
    subcategoryIds: subIds,
    tertiaryCategoryIds: tertiaryIds,
    nameAr: research.product_name_ar.trim(),
    nameEn: research.product_name_en.trim(),
    descriptionAr: description_ar,
    descriptionEn: description_en,
    price: 0,
    originalPrice: 0,
    stock: 0,
    isActive: true,
    imageIds: [] as string[],
  });

  console.log(`  ✓ added — ${research.product_name_ar}`);
  console.log(`    ID: ${created.id}`);

  return {
    barcode,
    status: fromCache ? "cached_added" : "added",
    kind: "single",
    name_ar: research.product_name_ar,
    name_en: research.product_name_en,
    brand_en,
    category: categoryLabel(catalog, cats.main_category.id, subIds, tertiaryIds),
    confidence: research.confidence,
    product_id: created.id,
    from_cache: fromCache,
    usage,
  };
}

function resolveGroupKey(group: VariantGroupInput, research: GptMinimalResearch): string {
  if (group.group_key?.trim()) return group.group_key.trim();
  const { brand_en } = parseBrand(research.product_name_en, research.product_name_ar);
  return buildGroupKey([brand_en, research.product_name_en]);
}

async function processVariantGroup(
  group: VariantGroupInput,
  catalog: Awaited<ReturnType<typeof buildCategoryCatalog>>,
): Promise<ProcessResult[]> {
  const rep = group.representative_barcode.trim();
  const variants = group.variants ?? [];
  console.log(`\n=== VARIANT GROUP (rep: ${rep}, ${variants.length} shades) ===`);

  const results: ProcessResult[] = [];

  for (const v of variants) {
    if (await barcodeExists(v.barcode.trim())) {
      console.log(`  ⊘ duplicate shade barcode ${v.barcode} — group skipped`);
      results.push({ barcode: v.barcode, status: "duplicate", kind: "variant_shade", group_key: group.group_key });
      return results;
    }
  }

  const preliminaryKey = group.group_key ?? rep;
  const { research, usage, fromCache } = await fetchGptNames(rep, true, preliminaryKey);
  const groupKey = resolveGroupKey(group, research);

  if (groupKey !== preliminaryKey && !fromCache) {
    const altCache = readGroupCache(groupKey);
    if (altCache) {
      console.log("  ↺ using resolved group cache");
    }
  }

  const validation = validateMinimal(rep, research);
  if (!validation.ok) {
    console.log(`  ⚠ needs review: ${validation.reason}`);
    results.push({
      barcode: rep,
      status: "needs_review",
      kind: "variant_parent",
      group_key: groupKey,
      name_ar: research.product_name_ar,
      name_en: research.product_name_en,
      confidence: research.confidence,
      review_notes: validation.reason,
      from_cache: fromCache,
      usage,
      shades_added: 0,
    });
    return results;
  }

  const { brand_ar, brand_en } = parseBrand(research.product_name_en, research.product_name_ar);
  const cats = inferCategories(catalog, research.product_name_en, research.product_name_ar);
  if ("needs_review" in cats) {
    results.push({
      barcode: rep,
      status: "needs_review",
      kind: "variant_parent",
      group_key: groupKey,
      name_ar: research.product_name_ar,
      name_en: research.product_name_en,
      brand_en,
      confidence: research.confidence,
      review_notes: cats.reason,
      from_cache: fromCache,
      usage,
    });
    return results;
  }

  const { description_ar, description_en } = buildDescriptions(
    research.product_name_en,
    research.product_name_ar,
    variants,
  );

  const label = research.product_name_en.slice(0, 40);

  if (DRY_RUN) {
    console.log(`  ✓ validated (DRY_RUN) — ${research.product_name_ar}`);
    console.log(`    shades: ${variants.length}`);
  } else {
    console.log("  Uploading shade images...");
  }

  const { shades, imageIds, review } = await buildShades(variants, label);

  if (DRY_RUN) {
    results.push({
      barcode: rep,
      status: "added",
      kind: "variant_parent",
      group_key: groupKey,
      name_ar: research.product_name_ar,
      name_en: research.product_name_en,
      brand_en,
      category: categoryLabel(
        catalog,
        cats.main_category.id,
        cats.subcategories.map((c) => c.id),
        cats.secondary_categories.map((c) => c.id),
      ),
      confidence: research.confidence,
      from_cache: fromCache,
      usage,
      shades_added: variants.length,
      shades_with_image: variants.filter((v) => v.image_url).length,
      review_notes: review.length ? review.join("; ") : null,
    });
    for (const v of variants) {
      results.push({
        barcode: v.barcode,
        status: "added",
        kind: "variant_shade",
        group_key: groupKey,
        name_ar: v.variant_value,
        from_cache: fromCache,
        shades_with_image: v.image_url ? 1 : 0,
      });
    }
    return results;
  }

  const brandId = await resolveBrandId(brand_ar, brand_en);
  const slug = slugify(research.product_name_en, rep);
  const subIds = cats.subcategories.map((c) => c.id);
  const tertiaryIds = cats.secondary_categories.map((c) => c.id);

  const created = await api<{ id: string }>("/products", "POST", {
    sku: `GPT-${rep.slice(-8)}`,
    barcode: rep,
    slug,
    brandId,
    categoryId: cats.main_category.id,
    subcategoryId: subIds[0],
    tertiaryCategoryId: tertiaryIds[0],
    subcategoryIds: subIds,
    tertiaryCategoryIds: tertiaryIds,
    nameAr: research.product_name_ar.trim(),
    nameEn: research.product_name_en.trim(),
    descriptionAr: description_ar,
    descriptionEn: description_en,
    price: 0,
    originalPrice: 0,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const withImages = shades.filter((s) => s.imageId).length;
  console.log(`  ✓ added parent — ${research.product_name_ar}`);
  console.log(`    ID: ${created.id}`);
  console.log(`    Shades: ${shades.length} (${withImages} with images)`);
  if (review.length) console.log(`    Review notes: ${review.join("; ")}`);

  results.push({
    barcode: rep,
    status: fromCache ? "cached_added" : "added",
    kind: "variant_parent",
    group_key: groupKey,
    name_ar: research.product_name_ar,
    name_en: research.product_name_en,
    brand_en,
    category: categoryLabel(catalog, cats.main_category.id, subIds, tertiaryIds),
    confidence: research.confidence,
    product_id: created.id,
    from_cache: fromCache,
    usage,
    shades_added: shades.length,
    shades_with_image: withImages,
    review_notes: review.length ? review.join("; ") : null,
  });

  for (const s of shades) {
    results.push({
      barcode: s.barcode,
      status: fromCache ? "cached_added" : "added",
      kind: "variant_shade",
      group_key: groupKey,
      name_ar: s.name,
      product_id: created.id,
      shades_with_image: s.imageId ? 1 : 0,
    });
  }

  return results;
}

function buildReport(allResults: ProcessResult[]): RunReport {
  let inputTokens = 0;
  let outputTokens = 0;
  let webSearches = 0;

  for (const r of allResults) {
    if (r.usage && r.kind !== "variant_shade") {
      inputTokens += r.usage.input_tokens;
      outputTokens += r.usage.output_tokens;
      webSearches += r.usage.web_search_count;
    }
  }

  const parents = allResults.filter((r) => r.kind === "variant_parent");
  const singles = allResults.filter((r) => r.kind === "single");
  const shadeRows = allResults.filter((r) => r.kind === "variant_shade");
  const addedParents = parents.filter((r) => r.status === "added" || r.status === "cached_added");
  const addedSingles = singles.filter((r) => r.status === "added" || r.status === "cached_added");
  const variantsWithImage = shadeRows.reduce((n, r) => n + (r.shades_with_image ?? 0), 0);
  const variantsNeedsReview = allResults.filter((r) => r.status === "needs_review").length;

  return {
    received: allResults.length,
    main_products_added: addedParents.length + addedSingles.length,
    singles_added: addedSingles.length,
    variant_groups_processed: parents.length,
    total_variants: shadeRows.length,
    variants_added: shadeRows.filter((r) => r.status === "added" || r.status === "cached_added").length,
    variants_with_image: variantsWithImage,
    variants_needs_review: variantsNeedsReview,
    added: allResults.filter((r) => r.status === "added" || r.status === "cached_added").length,
    duplicates: allResults.filter((r) => r.status === "duplicate").length,
    failed_identification: allResults.filter((r) => r.status === "failed").length,
    needs_review: variantsNeedsReview,
    gpt_api_calls: gptCalls,
    web_searches: webSearches,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd: estimateCostUsd(inputTokens, outputTokens, webSearches),
    results: allResults,
  };
}

function printReport(report: RunReport): void {
  console.log("\n══════════════════════════════════════");
  console.log("تقرير الاستيراد");
  console.log("══════════════════════════════════════");
  console.log(`عدد المنتجات الرئيسية المضافة: ${report.main_products_added}`);
  console.log(`عدد المنتجات المنفردة المضافة: ${report.singles_added}`);
  console.log(`عدد مجموعات التدرجات: ${report.variant_groups_processed}`);
  console.log(`إجمالي عدد التدرجات: ${report.total_variants}`);
  console.log(`عدد التدرجات المضافة: ${report.variants_added}`);
  console.log(`عدد التدرجات التي تحتوي على صورة: ${report.variants_with_image}`);
  console.log(`عدد التدرجات التي تحتاج إلى مراجعة: ${report.variants_needs_review}`);
  console.log(`عدد استدعاءات GPT API: ${report.gpt_api_calls}`);
  console.log(`عدد عمليات Web Search: ${report.web_searches}`);
  console.log(`عدد المنتجات الموجودة مسبقًا: ${report.duplicates}`);
  console.log(`عدد المنتجات التي فشل التعرف عليها: ${report.failed_identification}`);
  console.log(`إجمالي توكنات الإدخال: ${report.input_tokens}`);
  console.log(`إجمالي توكنات الإخراج: ${report.output_tokens}`);
  console.log(`التكلفة التقديرية: $${report.estimated_cost_usd.toFixed(4)}`);
}

async function main(): Promise<void> {
  console.log(`API: ${API_BASE}`);
  console.log(`Model: ${process.env.OPENAI_MODEL ?? "gpt-5.6-terra"}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);

  const manifest = loadManifest();
  const singles = manifest.singles ?? [];
  const groups = manifest.variant_groups ?? [];
  console.log(`Singles: ${singles.length} | Variant groups: ${groups.length}`);

  const catalog = await getCategoryCatalog();
  console.log(
    `Categories: ${catalog.main.length} main / ${catalog.sub.length} sub / ${catalog.tertiary.length} tertiary`,
  );

  await login();
  console.log("Logged in.");

  const allResults: ProcessResult[] = [];

  for (const barcode of singles) {
    try {
      const result = await processSingle(barcode, catalog);
      allResults.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ error: ${msg}`);
      allResults.push({ barcode, status: "failed", kind: "single", error: msg });
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  for (const group of groups) {
    try {
      const groupResults = await processVariantGroup(group, catalog);
      allResults.push(...groupResults);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ group error: ${msg}`);
      allResults.push({
        barcode: group.representative_barcode,
        status: "failed",
        kind: "variant_parent",
        error: msg,
      });
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const report = buildReport(allResults);
  const reportDir = join(__dirname, "data/gpt-barcode-reports");
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, `report-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nReport saved: ${reportPath}`);

  printReport(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
