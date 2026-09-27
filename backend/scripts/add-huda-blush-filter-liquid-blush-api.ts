/**
 * Huda Beauty Blush Filter Liquid Blush — 14 shades with barcodes, images & per-shade pricing.
 * Sources: hudabeauty.com Shopify CDN (packshots), ozcosmetics/UPC (barcodes)
 * Product barcode: 6294018405733 (Peach Sorbet) — shade barcode excluded per request
 * Usage: npx tsx scripts/add-huda-blush-filter-liquid-blush-api.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const SHADE_PRICE = 25000;
const ORIGINAL_PRICE = 30000;

type ShadeBuilt = {
  name: string;
  nameAr: string;
  displayName: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  sku: string;
  barcode?: string;
  price: number;
  descEn?: string;
  descAr?: string;
};

const built = JSON.parse(
  readFileSync(join(__dirname, "data/huda-blush-filter-shades-built.json"), "utf8"),
) as { shades: ShadeBuilt[]; productImages: string[] };

const SHADES = built.shades;
const PRODUCT_GALLERY = built.productImages;

const PRODUCT = {
  barcode: "6294018405733",
  slug: "huda-beauty-blush-filter-liquid-blush",
  sku: "HUDA-BFLB-405733",
  price: SHADE_PRICE,
  originalPrice: ORIGINAL_PRICE,
  nameAr: "هودا بيوتي – بلاشر سائل Blush Filter لإشراقة الخدود 4.5 مل",
  nameEn: "Huda Beauty Blush Filter Liquid Blush 4.5ml",
};

function buildDescriptions(shades: ShadeBuilt[]): { descriptionAr: string; descriptionEn: string } {
  const linesAr = shades.map((s) => `• ${s.displayName} — ${s.descAr ?? ""}`);
  const linesEn = shades.map((s) => `• ${s.displayName} — ${s.descEn ?? ""}`);

  const descriptionAr =
    "بلاشر سائل Blush Filter من هودا بيوتي — لمسة لون بإشراقة مفلترة ناعمة (airblushed) بصبغة قابلة للبناء وثبات عالي.\n\n" +
    "• تركيبة خفيفة تنصهر مع البشرة بلمسة soft-focus لامعة.\n" +
    "• صبغات قابلة للبناء مع ميكرو-بيرلز ناعمة لتوهج طبيعي.\n" +
    "• فرشاة دائرية على شكل فول سوداني لتوزيع سهل ومتساوٍ.\n" +
    "• رائحة حلوى لطيفة — فيغن — غير مجرّب على الحيوانات.\n" +
    "• 14 درجة تناسب جميع ألوان البشرة — من الوردي الفاتح إلى التوتي العميق.\n" +
    "• نصيحة هدى: امزجي درجتين لإطلالة ombre، أو ثبّتي مع بودرة Easy Bake لإشراقة airblushed.\n" +
    "• الحجم: 4.5 مل.\n\n" +
    "الدرجات المتوفرة:\n" +
    linesAr.join("\n");

  const descriptionEn =
    "Huda Beauty Blush Filter Liquid Blush — lightweight liquid blush for a soft-focus, airblushed glow with buildable pigment and major staying power.\n\n" +
    "• Lightweight formula melts into skin with a filtered, luminous finish.\n" +
    "• Buildable pigments with finely milled micro-pearls for a natural radiance.\n" +
    "• Innovative peanut-shaped doe-foot applicator for easy, even application.\n" +
    "• Yummy candy scent — vegan and cruelty-free.\n" +
    "• 14 shades for all skin tones — from baby pink to deep burnt berry.\n" +
    "• Huda's hack: layer two shades for an ombre blush, or set with Easy Bake for an airbrushed finish.\n" +
    "• Size: 4.5ml.\n\n" +
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
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  if (await deleteByBarcode(PRODUCT.barcode)) console.log("");
  await deleteOrphanSlug(PRODUCT.slug);

  const brandId = await resolveBrandId();
  const { descriptionAr, descriptionEn } = buildDescriptions(SHADES);

  console.log("Uploading product gallery images...");
  const galleryIds: string[] = [];
  for (let i = 0; i < PRODUCT_GALLERY.length; i++) {
    const id = await uploadImage(PRODUCT_GALLERY[i], `huda-bf-gallery-${i}`);
    galleryIds.push(id);
    console.log(`  ✓ gallery ${i + 1}/${PRODUCT_GALLERY.length}`);
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
    price: number;
    originalPrice: number;
    barcode?: string;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.displayName);
    const entry: {
      name: string;
      colorHex: string;
      imageId: string;
      position: number;
      stock: number;
      price: number;
      originalPrice: number;
      barcode?: string;
    } = {
      name: shade.displayName,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price ?? SHADE_PRICE,
      originalPrice: ORIGINAL_PRICE,
    };
    if (shade.barcode) entry.barcode = shade.barcode;
    shades.push(entry);
    console.log(
      `  ✓ ${shade.displayName} — ${shade.colorHex} — ${shade.price ?? SHADE_PRICE} IQD${shade.barcode ? ` — ${shade.barcode}` : ""}`,
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...galleryIds, ...shades.map((s) => s.imageId)])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
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
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; price?: number }>;
    images?: unknown[];
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD (original ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${verify.images?.length ?? imageIds.length}`);
  console.log(`  Category: Makeup → Cheek → Blush`);
  const withBarcode = verify.shades?.filter((s) => s.barcode).length ?? 0;
  console.log(`  Shade barcodes: ${withBarcode} (Peach Sorbet excluded)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
