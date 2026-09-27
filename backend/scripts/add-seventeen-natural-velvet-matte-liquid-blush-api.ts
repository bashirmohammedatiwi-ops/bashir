/**
 * Seventeen Natural Velvet Matte Liquid Blush — 8 official shades, no shade barcodes.
 * Sources: seventeencosmetics.com/en/catalogue/natural-velvet-liquid-blush_1435/
 * Product barcode: 5201641030745 (shade 01 Cool Nude)
 * Hex: trimmed-mean pigment from official *_3 swatches
 * Price: Alshaheera Iraq 25,000 IQD
 * Usage: npx tsx scripts/add-seventeen-natural-velvet-matte-liquid-blush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG = "https://seventeencosmetics.com/media/images/products";
const IMG_23 = `${IMG}/2023/10`;
const IMG_24 = `${IMG}/2024/06`;
const IMG_25 = `${IMG}/2025/04`;

const SHADE_PRICE = 25000;

const PRODUCT = {
  barcode: "5201641030745",
  slug: "seventeen-natural-velvet-matte-liquid-blush-5ml",
  sku: "SVN-NVLB-030745",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - بلش سائل Natural Velvet مطفي مخملي مرطب متعدد الاستخدام 5 مل",
  nameEn: "Seventeen - Natural Velvet Matte Liquid Blush Multi-Use Hydrating 5ml",
  descriptionAr:
    "بلش سائل Natural Velvet مطفي من سيفينتين — تركيبة مخملية خفيفة غير دهنية تمنح الخدود لوناً صحياً بلمسة مطفية ناعمة مع تأثير يموّه المسام ويوحّد مظهر البشرة.\n\n" +
    "• لون قابل للبناء من لمسة طبيعية خجولة إلى إطلالة أوضح حسب الرغبة.\n" +
    "• يندمج بسهولة مع البشرة والمكياج دون تكتّل أو تشقّق، ويثبت طوال اليوم دون بهتان.\n" +
    "• فرشاة دو فوت للتطبيق الدقيق والكمية المناسبة في كل مرة.\n" +
    "• فيغن — خالٍ من العطر — خالٍ من الغلوتين — مُختبر جلدياً.\n" +
    "• حجم 5 مل — 8 درجات رسمية طويلة الثبات.\n\n" +
    "طريقة الاستخدام: ضعي كمية صغيرة بفرشاة التطبيق وادمِجي بفرشاة أو إسفنجة أو أطراف الأصابع حتى الوصول للنتيجة المطلوبة. مثالي على أعلى الخدود باتجاه الصدغين لإطلالة منتعشة.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Cool Nude — نود بارد ناعم\n" +
    "• 02 Warm Natural — طبيعي دافئ خوخي\n" +
    "• 04 Happy — وردي مرجاني سعيد\n" +
    "• 05 Nude Rose — وردي نود\n" +
    "• 06 Rose — وردي كلاسيكي\n" +
    "• 07 Excited — وردي حيوي جريء\n" +
    "• 08 Pink — وردي فاقع\n" +
    "• 09 Pale — وردي شاحب ناعم",
  descriptionEn:
    "Seventeen Natural Velvet Matte Liquid Blush — a lightweight, non-oily multi-use hydrating liquid blush with a velvety matte finish and pore-diffusing blur effect for a refreshed, happy glow.\n\n" +
    "• Easily buildable and blendable colour payoff from a natural flush to a bolder look.\n" +
    "• Spreads evenly without caking or creasing and stays true all day without fading.\n" +
    "• Doe-foot applicator for precise, mess-free application.\n" +
    "• Vegan — fragrance free — gluten free — dermatologically tested.\n" +
    "• 5ml — 8 official long-lasting shades.\n\n" +
    "How to use: Apply a small amount with the doe-foot applicator and blend with a brush, sponge or fingers until you reach the desired effect. Sweep on the apples of the cheeks toward the temples for a lifted, fresh look.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Cool Nude — soft cool nude\n" +
    "• 02 Warm Natural — warm peachy natural\n" +
    "• 04 Happy — happy coral-pink\n" +
    "• 05 Nude Rose — nude rose\n" +
    "• 06 Rose — classic rose\n" +
    "• 07 Excited — bold vivid rose\n" +
    "• 08 Pink — bright pink\n" +
    "• 09 Pale — soft pale rose",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  packUrl: string;
  openUrl: string;
  position: number;
  price: number;
};

/** Official shade names from seventeencosmetics.com; hex from *_3 swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Cool Nude",
    colorHex: "#CE948D",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_01_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_01_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_01.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02 Warm Natural",
    colorHex: "#DD8E89",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_02_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_02_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_02.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "04 Happy",
    colorHex: "#E28080",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_04_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_04_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_04.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "05 Nude Rose",
    colorHex: "#D77D85",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_05_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_05_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_05.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "06 Rose",
    colorHex: "#E77A91",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_06_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_06_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_06.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "07 Excited",
    colorHex: "#E3435D",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_07_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_07_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_07.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "08 Pink",
    colorHex: "#F185B5",
    imageUrl: `${IMG_23}/seventeen_natural_velvet_08_3.jpg`,
    packUrl: `${IMG_23}/seventeen_natural_velvet_08_1.jpg`,
    openUrl: `${IMG_23}/seventeen_natural_velvet_08.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
  {
    name: "09 Pale",
    colorHex: "#D37D8C",
    imageUrl: `${IMG_24}/seventeen_natural_velvet_09_3.jpeg`,
    packUrl: `${IMG_24}/seventeen_natural_velvet_09_1.jpeg`,
    openUrl: `${IMG_24}/seventeen_natural_velvet_09.jpeg`,
    position: 7,
    price: SHADE_PRICE,
  },
];

/** Gallery — shade 01 first (product barcode), swatch sheet, open + pack range. */
const PRODUCT_IMAGES = [
  `${IMG_23}/seventeen_natural_velvet_01_1.jpg`,
  `${IMG_23}/seventeen_natural_velvet_01.jpg`,
  `${IMG_25}/swatches_natural_velvet_blush.jpg`,
  `${IMG_23}/seventeen_natural_velvet_02_1.jpg`,
  `${IMG_23}/seventeen_natural_velvet_04_1.jpg`,
  `${IMG_23}/seventeen_natural_velvet_06_1.jpg`,
  `${IMG_23}/seventeen_natural_velvet_07_1.jpg`,
  `${IMG_23}/seventeen_natural_velvet_08_1.jpg`,
  `${IMG_24}/seventeen_natural_velvet_09_1.jpeg`,
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
    brandAr: "سيفينتين",
    brandEn: "Seventeen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Seventeen brand");
  console.log(`Brand: Seventeen (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists && check.product?.id) {
    await api(`/products/${check.product.id}`, "DELETE");
    console.log(`deleted existing: ${check.product.nameAr ?? PRODUCT.barcode}\n`);
  }

  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === PRODUCT.slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`deleted orphan slug: ${PRODUCT.slug}`);
  }

  console.log("Uploading shade images (official swatches)...");
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
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price,
      originalPrice: shade.price,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.price} IQD`);
    await new Promise((r) => setTimeout(r, 450));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery ${url.split("/").pop()}`);
    await new Promise((r) => setTimeout(r, 450));
  }

  // Remaining open + pack shots
  const gallerySet = new Set(PRODUCT_IMAGES);
  for (const shade of SHADES) {
    for (const url of [shade.openUrl, shade.packUrl]) {
      if (gallerySet.has(url)) continue;
      gallerySet.add(url);
      try {
        const id = await uploadImage(url, `extra-${shade.name}`);
        galleryIds.push(id);
        console.log(`  ✓ extra ${url.split("/").pop()}`);
      } catch (e) {
        console.log(`  ✗ skip ${url.split("/").pop()}: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

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
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.price,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string; price?: number }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    barcode?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  if ((verify.shades?.length ?? 0) !== SHADES.length) {
    throw new Error(`Expected ${SHADES.length} shades, got ${verify.shades?.length ?? 0}`);
  }

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length} (no shade barcodes)`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.price ?? "?"} IQD`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
