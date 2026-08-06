/**
 * Huda Beauty #FauxFilter Under Eye Color Corrector — 9 shades, images, no shade barcodes.
 * Names: GPT (barcode 6294018401919). Descriptions/images: Composer + Flitit CDN packshots.
 * Usage: npx tsx scripts/add-huda-fauxfilter-color-corrector-api.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { researchProductNameWithGpt } from "./lib/gpt-barcode-import/openai";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const SHADE_PRICE = 26000;
const ORIGINAL_PRICE = 30000;

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  sku: string;
  descAr?: string;
  descEn?: string;
};

const built = JSON.parse(
  readFileSync(join(__dirname, "data/huda-fauxfilter-color-corrector-shades-built.json"), "utf8"),
) as { shades: ShadeInput[]; productImages: string[] };

const SHADE_META: Record<string, { descAr: string; descEn: string }> = {
  "Cherry Light": {
    descAr: "وردي محايد فاتح — للبشرة الفاتحة ب undertone باردة",
    descEn: "Light neutral pink — for fair skin with cool undertone",
  },
  "Peach Light": {
    descAr: "برتقالي فاتح — للبشرة الفاتحة ب undertone دافئة",
    descEn: "Light orange — for fair skin with warm undertone",
  },
  "Pink Pomelo": {
    descAr: "وردي فاتح — للبشرة الفاتحة إلى الفاتحة المتوسطة ب undertone وردية",
    descEn: "Light pink — for fair to light skin with pink undertone",
  },
  "Cherry Blossom": {
    descAr: "وردي بارد فاتح — للبشرة الفاتحة إلى المتوسطة ب undertone وردية باردة",
    descEn: "Cool light pink — for light to tan skin with cool pink undertone",
  },
  Peach: {
    descAr: "برتقالي وردي فاتح — للبشرة الفاتحة إلى المتوسطة ب undertone دافئة",
    descEn: "Light pinky-orange — for light to medium skin with warm undertone",
  },
  Mango: {
    descAr: "برتقالي وردي عميق — للبشرة المتوسطة إلى السمراء ب undertone دافئة",
    descEn: "Deep pink-orange — for medium to tan skin with warm undertone",
  },
  Papaya: {
    descAr: "برتقالي دافئ — للبشرة السمراء إلى الداكنة ب undertone دافئة",
    descEn: "Warm orange — for tan to deep skin with warm undertone",
  },
  Lychee: {
    descAr: "وردي غني — للبشرة الداكنة والعميقة ب undertone وردية باردة",
    descEn: "Rich pink — for rich deep skin with cool pink undertone",
  },
  "Blood Orange": {
    descAr: "أحمر برتقالي عميق — للبشرة الداكنة والعميقة ب undertone دافئة",
    descEn: "Deep red-orange — for deep tan to rich skin with warm undertone",
  },
};

const SHADES: ShadeInput[] = built.shades.map((s) => ({
  ...s,
  descAr: SHADE_META[s.name]?.descAr,
  descEn: SHADE_META[s.name]?.descEn,
}));

const PRODUCT_GALLERY = built.productImages;

const PRODUCT = {
  barcode: "6294018401919",
  slug: "huda-beauty-fauxfilter-under-eye-color-corrector-9ml",
  sku: "HUDA-FFCC-401919",
  price: SHADE_PRICE,
  originalPrice: ORIGINAL_PRICE,
};

function normalizeGptNames(gptAr: string, gptEn: string): { nameAr: string; nameEn: string } {
  // GPT identifies the line; apply Huda Iraqi-market naming convention
  const nameAr = "هودا بيوتي – مصحح لون تحت العين #FauxFilter Under Eye Color Corrector 9 مل";

  let nameEn = gptEn.trim().replace(/هدى/gi, "Huda");
  if (!/under eye/i.test(nameEn)) {
    nameEn = nameEn.replace(/#FauxFilter Color Corrector/i, "#FauxFilter Under Eye Color Corrector");
  }
  if (!nameEn.startsWith("Huda Beauty")) {
    nameEn = `Huda Beauty ${nameEn.replace(/^Huda\s+/i, "")}`;
  }
  if (!/9\s*ml/i.test(nameEn)) {
    nameEn = `${nameEn.replace(/\s*–\s*9\s*ml\s*$/i, "").trim()} – 9 ml`;
  }

  // Log GPT raw for audit
  if (gptAr !== nameAr) {
    console.log(`  (GPT AR raw: ${gptAr})`);
  }

  return { nameAr, nameEn };
}

function buildDescriptions(shades: ShadeInput[]): { descriptionAr: string; descriptionEn: string } {
  const linesAr = shades.map((s) => `• ${s.name} — ${s.descAr ?? ""}`);
  const linesEn = shades.map((s) => `• ${s.name} — ${s.descEn ?? ""}`);

  const descriptionAr =
    "مصحح لون تحت العين #FauxFilter Under Eye Color Corrector من هودا بيوتي — يصحّح التصبغات ويوحّد لون البشرة ويمنح إشراقة طبيعية تحت العين.\n\n" +
    "• تركيبة كريمية مريحة شبه شفافة بصبغة عالية تندمج بسلاسة دون قسوة.\n" +
    "• يصحّح الهالات الداكنة والتصبغات والاحمرار — قاعدة مثالية قبل الكونسيلر والفاونديشن.\n" +
    "• مقاوم للتجاعيد والعرق والنقل — ثبات حتى 14 ساعة دون بهتان.\n" +
    "• مُعزّز بفيتامين C والنياسيناميد لتفتيح البشرة وتنعيم مظهر التصبغات.\n" +
    "• خالٍ من العطر — غير كوميدوجينيك — مختبر dermatologically — فيغن.\n" +
    "• 9 درجات ب undertone باردة (وردي) ودافئة (برتقالي/أحمر) لكل لون بشرة.\n" +
    "• الحجم: 9 مل (0.3 أونصة).\n\n" +
    "الدرجات المتوفرة:\n" +
    linesAr.join("\n");

  const descriptionEn =
    "Huda Beauty #FauxFilter Under Eye Color Corrector — corrects, evens and brightens the under-eye with a crease, sweat and transfer-proof formula.\n\n" +
    "• Creamy, comfortable sheer formula with high-impact pigment that blends effortlessly.\n" +
    "• Neutralizes dark circles, pigmentation and redness — ideal base before concealer and foundation.\n" +
    "• Crease-, sweat- and transfer-proof wear for up to 14 hours without fading.\n" +
    "• Infused with vitamin C and niacinamide to brighten and soften pigmentation over time.\n" +
    "• Fragrance-free, non-comedogenic, dermatologically tested, vegan.\n" +
    "• 9 shades in cool pink and warm peach/orange tones for every skin depth.\n" +
    "• Size: 9 ml (0.3 fl oz).\n\n" +
    "Available shades:\n" +
    linesEn.join("\n");

  return { descriptionAr, descriptionEn };
}

let token = "";

async function login() {
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

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1200));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length}\n`);

  console.log("GPT naming (1 web search)...");
  const { research, usage } = await researchProductNameWithGpt(PRODUCT.barcode, true);
  const { nameAr, nameEn } = normalizeGptNames(research.product_name_ar, research.product_name_en);
  console.log(`  AR: ${nameAr}`);
  console.log(`  EN: ${nameEn}`);
  console.log(`  GPT tokens: ${usage.input_tokens}+${usage.output_tokens}, searches: ${usage.web_search_count}\n`);

  await login();
  console.log("Logged in.\n");

  const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists) {
    console.log(`skip ${PRODUCT.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
    return;
  }

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — slug exists (${PRODUCT.slug})`);
    return;
  }

  const brandId = await resolveBrandId();
  const { descriptionAr, descriptionEn } = buildDescriptions(SHADES);

  console.log("Uploading product gallery images...");
  const galleryIds: string[] = [];
  for (let i = 0; i < PRODUCT_GALLERY.length; i++) {
    const id = await uploadImage(PRODUCT_GALLERY[i], `huda-ffcc-gallery-${i}`);
    galleryIds.push(id);
    console.log(`  ✓ gallery ${i + 1}/${PRODUCT_GALLERY.length}`);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}`);
    await new Promise((r) => setTimeout(r, 350));
  }

  shades.sort((a, b) => a.position - b.position);
  const shadeImageIds = shades.map((s) => s.imageId);
  const imageIds = [...new Set([...galleryIds, ...shadeImageIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${nameAr}`);
  console.log(`  EN: ${nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD / shade`);
  console.log(`  Gallery: ${galleryIds.length} | Shades: ${verify.shades?.length ?? 0}`);
  const withImages = verify.shades?.filter((s) => s.imageId).length ?? 0;
  const withBarcode = verify.shades?.filter((s) => s.barcode).length ?? 0;
  console.log(`  Shades with images: ${withImages}/${SHADES.length}`);
  console.log(`  Shades with barcode: ${withBarcode} (expected 0)`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.imageId ? " [img]" : ""}`);
  }
  console.log(`  Category: Makeup → Face → Concealers and Correctors`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
