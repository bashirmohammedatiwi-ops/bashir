/**
 * Huda Beauty Easy Bake Duo Loose Powder — Cherry Peach (2 shades, no shade barcodes).
 * Sources: hudabeauty.com (official gallery), Sephora swatch + Huda education graphic (shade images)
 * Product barcode: 6294018408550
 * Usage: npx tsx scripts/add-huda-easy-bake-duo-cherry-peach-api.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const HUDA_CDN = "https://cdn.shopify.com/s/files/1/0959/8962/9206/files";

const PRODUCT = {
  barcode: "6294018408550",
  slug: "huda-beauty-easy-bake-duo-loose-powder-cherry-peach",
  sku: "HUDA-408550",
  price: 38000,
  originalPrice: 44000,
  nameAr:
    "هودا بيوتي – بودرة سائبة Easy Bake Duo ثنائية Cherry Peach لتثبيت وتفتيح البشرة (2×6.5 غرام)",
  nameEn: "Huda Beauty Easy Bake Duo Loose Baking & Setting Powder – Cherry Peach – 2×6.5g",
  descriptionAr:
    "بودرة Easy Bake Duo السائبة من هودا بيوتي بدرجة Cherry Peach — مجموعة ثنائية فاخرة لتثبيت المكياج والبيكينج مع تأثير فلتر ضبابي ولمسة مطفية كالهواء.\n\n" +
    "• عبوتان ميني سائبتان (2×6.5 غرام) في علبة واحدة ذكية بفاصل قابل للتدوير — اختاري الوردي للتفتيح أو الخوخي للتصحيح أو امزجيهما.\n" +
    "• تركيبة خفيفة فائقة النعومة تمتص الزيوت وتموّه المسام وخطوط التجاعيد دون فلاش باك في الصور.\n" +
    "• بودرة وردية شفافة لتفتيح ورفع منطقة تحت العين، وبودرة خوخية فاتحة لتصحيح اللون ومحو الهالات والبقع الداكنة.\n" +
    "• ثبات يصل إلى 18 ساعة — تثبيت مكياج، تحكم باللمعان، وإشراقة ناعمة طوال اليوم.\n" +
    "• غير مسدّة للمسام (Non-comedogenic) — مناسبة للبشرة الفاتحة إلى المتوسطة.\n" +
    "• تحتوي على نشاء الأرز لامتصاص الزيوت وبودرة micronized للطبقات دون تكتل، وفيتامين E لنعومة التطبيق.\n" +
    "• الحجم: 2×6.5 غرام (2×0.22 أونصة).\n\n" +
    "الدرجات داخل العلبة:\n" +
    "• Cherry Blossom Cake — تشيري بلوسوم كيك: وردي فاتح شفاف لتفتيح وإضاءة تحت العين والوجه.\n" +
    "• Peach Pie — بيتش باي: خوخي فاتح لتصحيح اللون ومحو الهالات وتوحيد لون البشرة.",
  descriptionEn:
    "Huda Beauty Easy Bake Duo Loose Baking & Setting Powder in Cherry Peach — a dual mini loose powder set for blurring, baking and setting with a real-life filter effect.\n\n" +
    "• Two mini loose powders (2×6.5g) in one innovative twist-selector compact — use pink to brighten, peach to correct, or mix both.\n" +
    "• Ultra-fine, lightweight formula absorbs oil, blurs pores and fine lines with zero flashback.\n" +
    "• Sheer soft pink brightens and lifts; light peach neutralizes dark circles and color-corrects.\n" +
    "• Up to 18-hour wear — sets makeup, controls shine and delivers an airbrushed matte finish.\n" +
    "• Non-comedogenic — ideal for light to medium skin tones.\n" +
    "• Rice starch absorbs excess oil; micronized powder layers without caking; vitamin E supports smooth application.\n" +
    "• Size: 2×6.5g (2×0.22 oz).\n\n" +
    "Shades in this duo:\n" +
    "• Cherry Blossom Cake — sheer soft pink to brighten and lift under-eyes and high points.\n" +
    "• Peach Pie — light peach to color-correct and neutralize dark circles.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  localImage: string;
  position: number;
};

/** Hex sampled from Sephora Cherry Peach duo swatch (CBC) + Huda education graphic (Peach Pie). */
const SHADES: ShadeInput[] = [
  {
    name: "Cherry Blossom Cake — تشيري بلوسوم كيك (وردي فاتح للتفتيح)",
    colorHex: "#F3C3C3",
    localImage: "huda-easy-bake-duo-cherry-blossom-cake-shade.png",
    position: 0,
  },
  {
    name: "Peach Pie — بيتش باي (خوخي فاتح للتصحيح)",
    colorHex: "#ECCAB4",
    localImage: "huda-easy-bake-duo-peach-pie-shade.png",
    position: 1,
  },
];

/** Official Huda Beauty product gallery. */
const PRODUCT_GALLERY = [
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_PACKSHOTS_FINAL_CHERRY-PEACH.webp?v=1759616964`,
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_BAs_FINAL_CHERRY-PEACH.webp?v=1759616962`,
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_WAYS-TO-WEAR_FINAL_CHERRY-PEACH.webp?v=1759616963`,
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_SHADE-RANGE_FINAL_CHERRY-PEACH.webp?v=1759616963`,
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_INFOGRAPHICS_FINAL_EDUCATION-CHERRY-PEACH.webp?v=1759616962`,
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_INFOGRAPHICS_FINAL_UNDEREYE-ROUTINE.webp?v=1759616962`,
  `${HUDA_CDN}/EASY-BAKE-DUO_PDP_INFOGRAPHICS_FINAL_CLAIM.webp?v=1759616962`,
];

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

async function uploadBuffer(buffer: Buffer, alt: string, contentType: string, attempt = 1): Promise<string> {
  try {
    if (buffer.byteLength < 64) throw new Error("empty image");
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
    return uploadBuffer(buffer, alt, contentType, attempt + 1);
  }
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    return uploadBuffer(buffer, alt, contentType);
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1200));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function uploadLocal(filename: string, alt: string): Promise<string> {
  const path = join(__dirname, "data", filename);
  const buffer = readFileSync(path);
  const ext = filename.split(".").pop()?.toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return uploadBuffer(buffer, alt, contentType);
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted existing: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  if (await deleteByBarcode(PRODUCT.barcode)) console.log("");
  await deleteOrphanSlug(PRODUCT.slug);

  const brandId = await resolveBrandId();

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadLocal(shade.localImage, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (let i = 0; i < PRODUCT_GALLERY.length; i++) {
    const id = await uploadImage(PRODUCT_GALLERY[i], `huda-ebd-gallery-${i}`);
    galleryIds.push(id);
    console.log(`  ✓ gallery ${i + 1}/${PRODUCT_GALLERY.length}`);
    await new Promise((r) => setTimeout(r, 350));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [POWDER],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
    images?: unknown[];
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD (original ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.barcode ? ` [barcode: ${s.barcode}]` : ""}`);
  }
  console.log(`  Images: ${verify.images?.length ?? imageIds.length}`);
  console.log(`  Category: Makeup → Face → Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
