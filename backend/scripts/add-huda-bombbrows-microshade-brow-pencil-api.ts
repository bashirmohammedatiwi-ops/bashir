/**
 * Huda Beauty #BombBrows Microshade Brow Pencil — 8 shades, images & per-shade pricing (no shade barcodes).
 * Sources: Cult Beauty / official shade names, static.thcdn.com product images
 * Product barcode: 6291106036619 (1 Warm Blonde)
 * Usage: npx tsx scripts/add-huda-bombbrows-microshade-brow-pencil-api.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const SHADE_PRICE = 22000;
const ORIGINAL_PRICE = 26000;

type ShadeBuilt = {
  name: string;
  nameAr: string;
  displayName: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  sku: string;
  price: number;
  descEn?: string;
  descAr?: string;
};

const built = JSON.parse(
  readFileSync(join(__dirname, "data/huda-bombbrows-shades-built.json"), "utf8"),
) as { shades: ShadeBuilt[]; productImages: string[] };

const SHADES = built.shades;
const PRODUCT_GALLERY = built.productImages;

const PRODUCT = {
  barcode: "6291106036619",
  slug: "huda-beauty-bombbrows-microshade-brow-pencil",
  sku: "HUDA-BBMB-036619",
  price: SHADE_PRICE,
  originalPrice: ORIGINAL_PRICE,
  nameAr: "هودا بيوتي – قلم حواجب #BombBrows Microshade أوتوماتيكي",
  nameEn: "Huda Beauty #BombBrows Microshade Brow Pencil",
};

function buildDescriptions(shades: ShadeBuilt[]): { descriptionAr: string; descriptionEn: string } {
  const linesAr = shades.map((s) => `• ${s.displayName} — ${s.descAr ?? ""}`);
  const linesEn = shades.map((s) => `• ${s.displayName} — ${s.descEn ?? ""}`);

  const descriptionAr =
    "قلم حواجب #BombBrows Microshade من هودا بيوتي — قلم أوتوماتيكي قابل للسحب ب tip فائق النعومة 0.9 ملم لخطوط تشبه الشعر وتأثير microblading طبيعي.\n\n" +
    "• يحدّد ويشكّل ويملأ الحواجب بخطوط دقيقة تشبه الشعر الطبيعي.\n" +
    "• صبغة عالية بقوام كريمي ناعم مع فيتامين E وزيت الخروع وزيت جوز الهند.\n" +
    "• فرشاة spoolie على الطرف الآخر للدمج والتمشيط وتشكيل الحواجب.\n" +
    "• ثبات 24 ساعة — مقاوم للماء والنقل — فيغن.\n" +
    "• عبوة مستدامة — خالي من العطر.\n" +
    "• 8 درجات من الأشقر الدافئ إلى الأسود الناعم.\n" +
    "• نصيحة هدى: لفّي القلم قليلاً فقط (نصف دورة) لتجنب كسر الرأس الرفيع.\n" +
    "• الحجم: 0.023 غرام (0.0008 أونصة).\n\n" +
    "الدرجات المتوفرة:\n" +
    linesAr.join("\n");

  const descriptionEn =
    "Huda Beauty #BombBrows Microshade Brow Pencil — ultra-fine 0.9mm retractable brow pencil for hair-like strokes and a microblade-worthy effect.\n\n" +
    "• Precisely defines, shapes and fills brows with tiny realistic hair-like lines.\n" +
    "• Highly pigmented, super-smooth creamy formula infused with vitamin E, castor oil and coconut oil.\n" +
    "• Built-in spoolie for blending, combing and customizing your brow look.\n" +
    "• 24-hour wear — waterproof and transfer-proof — vegan.\n" +
    "• Sustainable packaging — fragrance-free.\n" +
    "• 8 shades from warm blonde to soft black.\n" +
    "• Huda's tip: twist up only slightly (half a turn) to protect the ultra-fine tip.\n" +
    "• Size: 0.023 g (0.0008 oz).\n\n" +
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
    const id = await uploadImage(PRODUCT_GALLERY[i], `huda-bb-gallery-${i}`);
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
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.displayName);
    shades.push({
      name: shade.displayName,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price ?? SHADE_PRICE,
      originalPrice: ORIGINAL_PRICE,
    });
    console.log(`  ✓ ${shade.displayName} — ${shade.colorHex} — ${shade.price ?? SHADE_PRICE} IQD`);
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
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [BROW_PENCIL],
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
  console.log(`  Category: Makeup → Eyebrow → Brow Pencil`);
  const withBarcode = verify.shades?.filter((s) => s.barcode).length ?? 0;
  console.log(`  Shade barcodes: ${withBarcode} (none — product barcode only)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
