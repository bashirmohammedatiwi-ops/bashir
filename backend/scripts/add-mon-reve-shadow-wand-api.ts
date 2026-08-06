/**
 * Mon Reve Shadow Wand — 10 shades with images (no shade barcodes).
 * Sources: pharm24.gr + beautyfree.gr product photos; hex sampled/refined from images
 * Product barcode: 5201641028193 (shade 07 Black)
 * Usage: npx tsx scripts/add-mon-reve-shadow-wand-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const P24 = "https://cdn.pharm24.gr/images/1200x630-90";
const BF = "https://beautyfree.gr";

const PRODUCT = {
  barcode: "5201641028193",
  slug: "mon-reve-shadow-wand-creamy-eyeshadow-stick-2g",
  sku: "MON-SW-028193",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - ستيك ظلال عيون Shadow Wand كريمي مقاوم للماء مع فرشاة مدمجة 2 غرام",
  nameEn: "Mon Reve Shadow Wand Creamy Water-Resistant Eyeshadow Stick with Built-In Brush 2g",
  descriptionAr:
    "ستيك ظلال عيون كريمي Shadow Wand من مون ريف — لون قوي يثبت لساعات دون تلطخ أو بهتان، بتركيبة كريمية سهلة التطبيق والدمج مع فرشاة مدمجة على الطرف.\n\n" +
    "• يجف بعد التطبيق ويبقى ثابتاً ومقاوماً للماء طوال اليوم.\n" +
    "• يُستخدم كظل على كامل الجفن، أو كآيلاينر على خط الرموش، أو هايلايتر بالدرجات الفاتحة.\n" +
    "• فرشاة مدمجة لدمج سريع ونعومة مخملية.\n" +
    "• فيغن، بدون عطر، خالٍ من الغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 2 غرام — 10 درجات.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Gold — ذهبي لامع\n" +
    "• 02 Frost — فضي جليدي فاتح\n" +
    "• 03 Bubbles — شامبين وردي فاتح\n" +
    "• 04 Sand — رملي دافئ\n" +
    "• 05 Tobacco — بني تبغي\n" +
    "• 06 Green — أخضر زيتوني\n" +
    "• 07 Black — أسود\n" +
    "• 08 Plum — برقوقي\n" +
    "• 09 Midnight — أزرق ليلي داكن\n" +
    "• 10 Mermaid — تركوازي ميرميد",
  descriptionEn:
    "Mon Reve Shadow Wand — creamy water-resistant eyeshadow stick with intense colour payoff that sets for hours without transferring or fading, plus a built-in brush for effortless blending.\n\n" +
    "• Quick-setting, long-wearing, water-resistant formula.\n" +
    "• Use all over the lid as eyeshadow, along the lash line as eyeliner, or as a highlighter with lighter shades.\n" +
    "• Built-in brush for fast, velvety-smooth blending.\n" +
    "• Vegan, fragrance-free, gluten-free, cruelty-free, dermatologically tested.\n" +
    "• 2g — 10 shades.\n\n" +
    "Available shades:\n" +
    "• 01 Gold — shimmering gold\n" +
    "• 02 Frost — icy light silver\n" +
    "• 03 Bubbles — light rosy champagne\n" +
    "• 04 Sand — warm sand\n" +
    "• 05 Tobacco — tobacco brown\n" +
    "• 06 Green — olive green\n" +
    "• 07 Black — black\n" +
    "• 08 Plum — plum\n" +
    "• 09 Midnight — deep midnight blue\n" +
    "• 10 Mermaid — mermaid turquoise",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Shade names official; images from retailer product photos; hex sampled/refined. */
const SHADES: ShadeInput[] = [
  { name: "01 Gold", colorHex: "#D4AF37", imageUrl: `${P24}/5201641028131a.jpg`, position: 0 },
  { name: "02 Frost", colorHex: "#D8DEE8", imageUrl: `${P24}/5201641028148a.jpg`, position: 1 },
  { name: "03 Bubbles", colorHex: "#E8C4BC", imageUrl: `${P24}/8720181446788.jpg`, position: 2 },
  { name: "04 Sand", colorHex: "#E2A735", imageUrl: `${BF}/66724-large_default/mon-reve-shadow-wand.jpg`, position: 3 },
  { name: "05 Tobacco", colorHex: "#795C3F", imageUrl: `${BF}/66727-large_default/mon-reve-shadow-wand.jpg`, position: 4 },
  { name: "06 Green", colorHex: "#4F7F67", imageUrl: `${P24}/8720181446801.jpg`, position: 5 },
  { name: "07 Black", colorHex: "#1A1A1A", imageUrl: `${P24}/5201641028193a.jpg`, position: 6 },
  { name: "08 Plum", colorHex: "#AA7B8C", imageUrl: `${BF}/66722-large_default/mon-reve-shadow-wand.jpg`, position: 7 },
  { name: "09 Midnight", colorHex: "#1A7BB3", imageUrl: `${P24}/8720181449185.jpg`, position: 8 },
  { name: "10 Mermaid", colorHex: "#0188A1", imageUrl: `${P24}/5201641031100a.jpg`, position: 9 },
];

/** Product gallery — shade range + key colours. */
const PRODUCT_IMAGES = [
  `${BF}/66728-large_default/mon-reve-shadow-wand.jpg`,
  `${P24}/5201641028131a.jpg`,
  `${P24}/8720181446788.jpg`,
  `${P24}/8720181449185.jpg`,
  `${P24}/5201641031100a.jpg`,
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
    brandAr: "مون ريف",
    brandEn: "Mon Reve",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Mon Reve brand");
  console.log(`Brand: Mon Reve (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
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
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  if (await deleteByBarcode(PRODUCT.barcode)) {
    console.log("");
  }
  await deleteOrphanSlug(PRODUCT.slug);

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
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYESHADOW],
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
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.barcode ? ` [barcode: ${s.barcode}]` : ""}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyes → Eyeshadow`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
