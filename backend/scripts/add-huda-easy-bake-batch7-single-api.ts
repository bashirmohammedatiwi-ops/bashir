/**
 * Huda Beauty Easy Bake — 7 separate products (loose + duo, no shades, no images).
 * GPT for naming only; descriptions from hudabeauty.com + verified barcodes.
 * Usage: npx tsx scripts/add-huda-easy-bake-batch7-single-api.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { estimateCostUsd, researchProductNameWithGpt } from "./lib/gpt-barcode-import/openai";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

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

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

type ProductMeta = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  shadeEn?: string;
  shadeAr?: string;
  sizeEn?: string;
  sizeAr?: string;
  descriptionAr: string;
  descriptionEn: string;
};

const LOOSE_DESC_AR =
  "بودرة Easy Bake السائبة من هودا بيوتي — تثبّت المكياج وتمنح إطلالة فلتر ضبابي مطفية دون فلاش باك.\n\n" +
  "• تركيبة فائقة النعومة تمتزج بسلاسة وتمتص الزيوت لساعات.\n" +
  "• تموّه المسام والخطوط الرفيعة مع إشراقة ناعمة.\n" +
  "• مثالية للبيكينج تحت العين ومنطقة T والخطوط الضاحكة.\n" +
  "• غير مسدّدة للمسام (Non-comedogenic) — فيتامين E لنعومة التطبيق.\n" +
  "• نشاء الأرز لامتصاص اللمعان وبودرة micronized للطبقات دون تكتل.\n";

const LOOSE_DESC_EN =
  "Huda Beauty Easy Bake Loose Baking & Setting Powder sets makeup with a blurring airbrushed matte finish and zero flashback.\n\n" +
  "• Ultra-fine lightweight formula blends seamlessly and absorbs oil.\n" +
  "• Blurs pores and fine lines with a soft luminous matte finish.\n" +
  "• Ideal for baking under eyes, T-zone and smile lines.\n" +
  "• Non-comedogenic with vitamin E for smooth application.\n" +
  "• Rice starch controls shine; micronized powder layers without caking.\n";

const CURATED_NAMES: Record<string, { nameAr: string; nameEn: string }> = {
  "6291106032253": {
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Sugar Cookie 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Sugar Cookie – 20 g",
  },
  "6291106032260": {
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Cupcake 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Cupcake – 20 g",
  },
  "6291106032277": {
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Pound Cake 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Pound Cake – 20 g",
  },
  "6294018406501": {
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Ube Birthday Cake 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Ube Birthday Cake – 20 g",
  },
  "6294018402725": {
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Peach Pie 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Peach Pie – 20 g",
  },
  "6294018408550": {
    nameAr: "هودا بيوتي – بودرة Easy Bake Duo السائبة Cherry Peach 2×6.5 غ",
    nameEn: "Huda Beauty Easy Bake Duo Loose Baking & Setting Powder – Cherry Peach – 2×6.5 g",
  },
  "6294018408567": {
    nameAr: "هودا بيوتي – بودرة Easy Bake Duo السائبة Pink Pumpkin 2×6.5 غ",
    nameEn: "Huda Beauty Easy Bake Duo Loose Baking & Setting Powder – Pink Pumpkin – 2×6.5 g",
  },
};

const PRODUCT_META: ProductMeta[] = [
  {
    barcode: "6291106032253",
    slug: "huda-beauty-easy-bake-loose-powder-sugar-cookie-20g",
    sku: "HUDA-032253",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Sugar Cookie",
    shadeAr: "Sugar Cookie",
    sizeEn: "20 g",
    sizeAr: "20 غ",
    descriptionAr:
      LOOSE_DESC_AR +
      "• Sugar Cookie — درجة صفراء فاتحة لتفتيح وتوحيد لون البشرة الفاتحة إلى المتوسطة.\n" +
      "• يُطبّق بفرشاة أو اسفنجة على المناطق المراد تثبيتها، اتركيه للبيكينج 3–5 دقائق ثم امسحي الفائض.\n" +
      "• 20 غ (0.71 أونصة).",
    descriptionEn:
      LOOSE_DESC_EN +
      "• Sugar Cookie — soft yellow brightening shade for fair to medium skin tones.\n" +
      "• Apply with brush or sponge, bake 3–5 minutes then dust off excess.\n" +
      "• 20 g (0.71 oz).",
  },
  {
    barcode: "6291106032260",
    slug: "huda-beauty-easy-bake-loose-powder-cupcake-20g",
    sku: "HUDA-032260",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Cupcake",
    shadeAr: "Cupcake",
    sizeEn: "20 g",
    sizeAr: "20 غ",
    descriptionAr:
      LOOSE_DESC_AR +
      "• Cupcake — درجة ذهبية دافعة للبشرة المتوسطة إلى الداكنة مع تثبيت طبيعي.\n" +
      "• مثالية لتثبيت المكياج ومحو اللمعان في منطقة تحت العين والوجه.\n" +
      "• 20 غ (0.71 أونصة).",
    descriptionEn:
      LOOSE_DESC_EN +
      "• Cupcake — warm golden-tan shade for medium to tan skin tones.\n" +
      "• Ideal for setting makeup and controlling shine on face and under eyes.\n" +
      "• 20 g (0.71 oz).",
  },
  {
    barcode: "6291106032277",
    slug: "huda-beauty-easy-bake-loose-powder-pound-cake-20g",
    sku: "HUDA-032277",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Pound Cake",
    shadeAr: "Pound Cake",
    sizeEn: "20 g",
    sizeAr: "20 غ",
    descriptionAr:
      LOOSE_DESC_AR +
      "• Pound Cake — درجة صفراء فاتحة كلاسيكية لتفتيح تحت العين والوجه للبشرة الفاتحة.\n" +
      "• واحدة من أشهر درجات Easy Bake لتأثير البيكينج الناعم والمشرق.\n" +
      "• 20 غ (0.71 أونصة).",
    descriptionEn:
      LOOSE_DESC_EN +
      "• Pound Cake — classic soft yellow brightening shade for fair to light skin.\n" +
      "• Iconic Easy Bake shade for a soft bright under-eye baking effect.\n" +
      "• 20 g (0.71 oz).",
  },
  {
    barcode: "6294018406501",
    slug: "huda-beauty-easy-bake-loose-powder-ube-birthday-cake-20g",
    sku: "HUDA-406501",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Ube Birthday Cake",
    shadeAr: "Ube Birthday Cake",
    sizeEn: "20 g",
    sizeAr: "20 غ",
    descriptionAr:
      LOOSE_DESC_AR +
      "• Ube Birthday Cake — درجة وردية بنفسجية خفيفة مستوحاة من كعكة الأوبي لتفتيح وإشراقة ناعمة.\n" +
      "• تمنح تحت العين إشراقة وردية طبيعية مع تثبيت المكياج طوال اليوم.\n" +
      "• مناسبة للبشرة الفاتحة إلى المتوسطة ب undertone دافئ.\n" +
      "• 20 غ.",
    descriptionEn:
      LOOSE_DESC_EN +
      "• Ube Birthday Cake — soft pink-purple brightening shade inspired by ube cake.\n" +
      "• Adds a natural pink lift under the eyes while setting makeup all day.\n" +
      "• Suitable for light to medium skin with warm undertones.\n" +
      "• 20 g.",
  },
  {
    barcode: "6294018402725",
    slug: "huda-beauty-easy-bake-loose-powder-peach-pie-20g",
    sku: "HUDA-402725",
    price: 34000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Peach Pie",
    shadeAr: "Peach Pie",
    sizeEn: "20 g",
    sizeAr: "20 غ",
    descriptionAr:
      LOOSE_DESC_AR +
      "• Peach Pie — درجة خوخية فاتحة لتصحيح اللون ومحو الهالات والاحمرار.\n" +
      "• مثالية للبيكينج تحت العين على البشرة الفاتحة إلى المتوسطة.\n" +
      "• تثبّت المكياج وتوحّد لون البشرة بإطلالة ناعمة مطفية.\n" +
      "• 20 غ.",
    descriptionEn:
      LOOSE_DESC_EN +
      "• Peach Pie — light peach shade to color-correct and neutralize dark circles.\n" +
      "• Ideal for under-eye baking on light to medium skin tones.\n" +
      "• Sets makeup with a soft matte even finish.\n" +
      "• 20 g.",
  },
  {
    barcode: "6294018408550",
    slug: "huda-beauty-easy-bake-duo-loose-powder-cherry-peach",
    sku: "HUDA-408550",
    price: 38000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Cherry Peach",
    shadeAr: "Cherry Peach",
    sizeEn: "2×6.5 g",
    sizeAr: "2×6.5 غ",
    descriptionAr:
      "بودرة Easy Bake Duo السائبة من هودا بيوتي بدرجة Cherry Peach — مجموعة ثنائية فاخرة لتثبيت المكياج والبيكينج.\n\n" +
      "• عبوتان ميني سائبتان (2×6.5 غ) في علبة ذكية بفاصل دوّار — اختاري الوردي للتفتيح أو الخوخي للتصحيح أو امزجيهما.\n" +
      "• تركيبة خفيفة فائقة النعومة تموّه المسام وخطوط التجاعيد دون فلاش باك.\n" +
      "• ثبات يصل إلى 18 ساعة — تثبيت مكياج وتحكم باللمعان.\n" +
      "• غير مسدّدة للمسام — مناسبة للبشرة الفاتحة إلى المتوسطة.\n" +
      "• Cherry Blossom Cake: وردي فاتح شفاف للتفتيح | Peach Pie: خوخي فاتح لتصحيح الهالات.\n" +
      "• 2×6.5 غ (2×0.22 أونصة).",
    descriptionEn:
      "Huda Beauty Easy Bake Duo Loose Powder in Cherry Peach — dual mini set for baking and setting.\n\n" +
      "• Two mini loose powders (2×6.5 g) in a twist-selector compact — pink to brighten, peach to correct, or mix both.\n" +
      "• Ultra-fine formula blurs pores and fine lines with zero flashback.\n" +
      "• Up to 18-hour wear — sets makeup and controls shine.\n" +
      "• Non-comedogenic — ideal for light to medium skin tones.\n" +
      "• Cherry Blossom Cake: sheer soft pink | Peach Pie: light peach color corrector.\n" +
      "• 2×6.5 g (2×0.22 oz).",
  },
  {
    barcode: "6294018408567",
    slug: "huda-beauty-easy-bake-duo-loose-powder-pink-pumpkin",
    sku: "HUDA-408567",
    price: 38000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    shadeEn: "Pink Pumpkin",
    shadeAr: "Pink Pumpkin",
    sizeEn: "2×6.5 g",
    sizeAr: "2×6.5 غ",
    descriptionAr:
      "بودرة Easy Bake Duo السائبة من هودا بيوتي بدرجة Pink Pumpkin — مجموعة ثنائية للبشرة المتوسطة إلى الداكنة.\n\n" +
      "• عبوتان ميني سائبتان (2×6.5 غ) بفاصل دوّار لاختيار الدرجة أو مزجها.\n" +
      "• تركيبة تموّه وتثبّت المكياج حتى 18 ساعة بإطلالة airbrushed مطفية.\n" +
      "• غير مسدّدة للمسام — تفتيح ومحو الهالات دون تكتل.\n" +
      "• Pink Velvet Cookie: وردي عميق للتفتيح | Pumpkin Pie: خوخي سلموني لتصحيح اللون.\n" +
      "• 2×6.5 غ (2×0.22 أونصة).",
    descriptionEn:
      "Huda Beauty Easy Bake Duo Loose Powder in Pink Pumpkin — dual mini set for tan to rich skin tones.\n\n" +
      "• Two mini loose powders (2×6.5 g) with twist-selector for single shade or custom mix.\n" +
      "• Blurring formula sets makeup for up to 18 hours with an airbrushed matte finish.\n" +
      "• Non-comedogenic — brightens and neutralizes dark circles without caking.\n" +
      "• Pink Velvet Cookie: deep rosy pink | Pumpkin Pie: deep salmon peach corrector.\n" +
      "• 2×6.5 g (2×0.22 oz).",
  },
];

function normalizeGptNames(
  gptAr: string,
  gptEn: string,
  meta: ProductMeta,
): { nameAr: string; nameEn: string } {
  let nameEn = gptEn.trim().replace(/هدى/gi, "Huda");
  let nameAr = gptAr.trim().replace(/هدى/gi, "هودا");

  if (!nameEn.startsWith("Huda Beauty")) {
    nameEn = `Huda Beauty ${nameEn.replace(/^Huda\s+/i, "").replace(/^HUDA\s+BEAUTY\s+/i, "")}`;
  }
  nameEn = nameEn.replace(/\s+/g, " ").trim();

  if (!nameAr.includes("هودا")) {
    nameAr = `هودا بيوتي – ${nameAr}`;
  } else {
    nameAr = nameAr
      .replace(/^هدى\s*بيوتي/i, "هودا بيوتي")
      .replace(/^هودا\s*بيوتي\s*[–-]\s*/i, "هودا بيوتي – ")
      .replace(/^هودا\s*بيوتي\s+/i, "هودا بيوتي – ");
  }
  nameAr = nameAr.replace(/هودا بيوتي\s*[–-]\s*[–-]\s*/g, "هودا بيوتي – ");

  if (meta.shadeEn && !nameEn.toLowerCase().includes(meta.shadeEn.toLowerCase().split(" ")[0])) {
    nameEn = `${nameEn.replace(/\s*–\s*[\d.]+\s*(ml|g|oz).*$/i, "").trim()} – ${meta.shadeEn}`;
  }
  if (meta.shadeAr && !nameAr.includes(meta.shadeAr.split(" ")[0])) {
    nameAr = `${nameAr.replace(/\s*[\d.]+\s*(مل|غرام|غ).*$/i, "").trim()} ${meta.shadeAr}`;
  }

  if (meta.sizeEn && !new RegExp(meta.sizeEn.replace(".", "\\."), "i").test(nameEn)) {
    nameEn = `${nameEn.replace(/\s*–\s*[\d.]+\s*(ml|g|oz).*$/i, "").trim()} – ${meta.sizeEn}`;
  }
  if (meta.sizeAr && !nameAr.includes(meta.sizeAr.split(" ")[0])) {
    if (!nameAr.includes(meta.sizeAr)) {
      nameAr = `${nameAr.trim()} ${meta.sizeAr}`;
    }
  }

  return { nameAr: nameAr.trim(), nameEn: nameEn.trim() };
}

let token = "";

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

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "هودا بيوتي",
    brandEn: "Huda Beauty",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Huda Beauty brand");
  console.log(`Brand: Huda Beauty (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

type ResolvedProduct = ProductMeta & { nameAr: string; nameEn: string };

async function gptWithRetry(barcode: string, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await researchProductNameWithGpt(barcode, false);
    } catch (err) {
      if (i >= attempts) throw err;
      console.log(`  retry ${i}/${attempts - 1}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, i * 2000));
    }
  }
  throw new Error("gptWithRetry unreachable");
}

async function resolveNamesWithGpt(): Promise<ResolvedProduct[]> {
  const resolved: ResolvedProduct[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalSearches = 0;

  console.log(`GPT naming for ${PRODUCT_META.length} barcodes...\n`);

  for (const meta of PRODUCT_META) {
    console.log(`--- GPT ${meta.barcode} ---`);
    const curated = CURATED_NAMES[meta.barcode];
    let nameAr: string;
    let nameEn: string;

    try {
      const { research, usage } = await gptWithRetry(meta.barcode);
      totalInput += usage.input_tokens;
      totalOutput += usage.output_tokens;
      totalSearches += usage.web_search_count;

      console.log(`  GPT raw AR: ${research.product_name_ar}`);
      console.log(`  GPT raw EN: ${research.product_name_en}`);
      if (research.needs_review) console.log(`  ⚠ needs_review (confidence ${research.confidence})`);

      const useCurated =
        curated &&
        (research.needs_review ||
          research.confidence < 60 ||
          !research.product_name_ar ||
          !research.product_name_en);

      if (useCurated) {
        console.log(`  → using curated fallback`);
        nameAr = curated.nameAr;
        nameEn = curated.nameEn;
      } else {
        const normalized = normalizeGptNames(research.product_name_ar, research.product_name_en, meta);
        nameAr = normalized.nameAr;
        nameEn = normalized.nameEn;
      }
    } catch (err) {
      console.log(`  GPT failed: ${(err as Error).message}`);
      if (!curated) throw err;
      console.log(`  → using curated fallback`);
      nameAr = curated.nameAr;
      nameEn = curated.nameEn;
    }

    console.log(`  → AR: ${nameAr}`);
    console.log(`  → EN: ${nameEn}\n`);

    resolved.push({ ...meta, nameAr, nameEn });
    await new Promise((r) => setTimeout(r, 400));
  }

  const cost = estimateCostUsd(totalInput, totalOutput, totalSearches);
  console.log(
    `GPT total: ${totalInput}+${totalOutput} tokens, ${totalSearches} searches, ~$${cost.toFixed(4)}\n`,
  );

  return resolved;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCT_META.length} (no shades, no images)\n`);

  const products = await resolveNamesWithGpt();

  await login();
  const brandId = await resolveBrandId();

  let added = 0;
  let skipped = 0;

  for (const product of products) {
    console.log(`--- ${product.barcode} ---`);
    if (await barcodeExists(product.barcode)) {
      console.log(`  skip — barcode already exists\n`);
      skipped += 1;
      continue;
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryId: product.tertiaryCategoryId,
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds: [] as string[],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${products.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
