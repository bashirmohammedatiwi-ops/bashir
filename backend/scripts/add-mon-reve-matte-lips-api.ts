/**
 * Mon Reve Matte Lips — 15 shades with images (no shade barcodes).
 * Sources: monrevecosmetics.com (official names, swatch images, 7.90€)
 * Product barcode: 5201641752319 (shade 16 SHIMMER SAND)
 * Usage: npx tsx scripts/add-mon-reve-matte-lips-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://monrevecosmetics.com/media/images/products/2019/11";

const SHADE_PRICE = 7500;

const PRODUCT = {
  barcode: "5201641752319",
  slug: "mon-reve-matte-lips-liquid-matte-lipstick-4ml",
  sku: "MON-ML-752319",
  price: SHADE_PRICE,
  nameAr: "مون ريف - روج شفاه سائل مطفي Matte Lips حجم 4 مل",
  nameEn: "Mon Reve - Matte Lips Liquid Matte Lipstick 4ml",
  descriptionAr:
    "روج شفاه سائل مطفي Matte Lips من مون ريف — تركيبة كريمية فائقة النعومة بقوام مخملي خفيف ولون غني يدوم طوال اليوم دون تجفيف الشفاه.\n\n" +
    "• لون مكثّف بلمسة مطفية أنيقة — ثبات عالٍ حتى بعد الأكل والشرب.\n" +
    "• قوام كريمي مخملي خفيف ينزلق بسلاسة ولا يجفّف الشفاه.\n" +
    "• فرشاة دقيقة على شكل قلب لرسم محيط الشفاه وملء الزوايا بسهولة.\n" +
    "• خالٍ من البارابين — خالٍ من الغلوتين — غير مجرّب على الحيوانات — مُختبر جلدياً.\n" +
    "• حجم 4 مل — صُنع في اليونان.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Nutmeg — جوزة طيب خفيفة دافئة\n" +
    "• 02 Latte — بيج لاتيه ناعم\n" +
    "• 03 Vanilla Swirl — فانيلا كريمي فاتح\n" +
    "• 04 Cinnamon Cream — قرفة كريمي دافئ\n" +
    "• 05 Slurry Pie — موف بني ناعم\n" +
    "• 06 Choco Milk — شوكولاتة بالحليب\n" +
    "• 07 Rosewood — خشب الورد البني\n" +
    "• 08 Canelé — كراميل كانيليه\n" +
    "• 09 Red Plum — برقوقي أحمر\n" +
    "• 10 True Red — أحمر كلاسيكي صريح\n" +
    "• 11 Fire Red — أحمر ناري لامع\n" +
    "• 12 Milky Berry — توت وردي حليبي\n" +
    "• 13 Marshmallow — مارشميلو وردي فاتح\n" +
    "• 15 Rock Red — أحمر صخري عميق\n" +
    "• 16 Shimmer Sand — رملي لامع نود",
  descriptionEn:
    "Mon Reve Matte Lips — ultra-creamy liquid matte lipstick with a lightweight velvety texture and rich, long-lasting colour that does not dry out lips.\n\n" +
    "• Intense colour with an elegant matte finish — high staying power even after eating and drinking.\n" +
    "• Lightweight creamy-velvet formula glides on smoothly without dehydrating lips.\n" +
    "• Precision heart-shaped applicator to line and fill every corner of the lips with ease.\n" +
    "• Paraben free — gluten free — cruelty free — dermatologically tested.\n" +
    "• 4ml — Made in Greece.\n\n" +
    "Available shades:\n" +
    "• 01 Nutmeg — warm soft nutmeg\n" +
    "• 02 Latte — soft latte beige\n" +
    "• 03 Vanilla Swirl — light creamy vanilla\n" +
    "• 04 Cinnamon Cream — warm cinnamon cream\n" +
    "• 05 Slurry Pie — soft mauve brown\n" +
    "• 06 Choco Milk — chocolate milk brown\n" +
    "• 07 Rosewood — rosewood brown\n" +
    "• 08 Canelé — caramel canelé\n" +
    "• 09 Red Plum — red plum\n" +
    "• 10 True Red — classic true red\n" +
    "• 11 Fire Red — fiery bright red\n" +
    "• 12 Milky Berry — milky berry pink\n" +
    "• 13 Marshmallow — soft light pink\n" +
    "• 15 Rock Red — deep rock red\n" +
    "• 16 Shimmer Sand — shimmering sand nude",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Names from monrevecosmetics.com JSON-LD; hex refined from official swatch images. */
const SHADES: ShadeInput[] = [
  { name: "01 Nutmeg", colorHex: "#A0714F", imageUrl: `${IMG}/mon-reve-matte-lips-01.jpg`, position: 0, price: SHADE_PRICE },
  { name: "02 Latte", colorHex: "#C4A088", imageUrl: `${IMG}/mon-reve-matte-lips-02.jpg`, position: 1, price: SHADE_PRICE },
  { name: "03 Vanilla Swirl", colorHex: "#E5D0BC", imageUrl: `${IMG}/mon-reve-matte-lips-03.jpg`, position: 2, price: SHADE_PRICE },
  { name: "04 Cinnamon Cream", colorHex: "#B8835F", imageUrl: `${IMG}/mon-reve-matte-lips-04.jpg`, position: 3, price: SHADE_PRICE },
  { name: "05 Slurry Pie", colorHex: "#A67B7D", imageUrl: `${IMG}/mon-reve-matte-lips-05.jpg`, position: 4, price: SHADE_PRICE },
  { name: "06 Choco Milk", colorHex: "#6E4538", imageUrl: `${IMG}/mon-reve-matte-lips-06.jpg`, position: 5, price: SHADE_PRICE },
  { name: "07 Rosewood", colorHex: "#9B6062", imageUrl: `${IMG}/mon-reve-matte-lips-07.jpg`, position: 6, price: SHADE_PRICE },
  { name: "08 Canelé", colorHex: "#B0744E", imageUrl: `${IMG}/mon-reve-matte-lips-08.jpg`, position: 7, price: SHADE_PRICE },
  { name: "09 Red Plum", colorHex: "#8B3A52", imageUrl: `${IMG}/mon-reve-matte-lips-09.jpg`, position: 8, price: SHADE_PRICE },
  { name: "10 True Red", colorHex: "#C62828", imageUrl: `${IMG}/mon-reve-matte-lips-10.jpg`, position: 9, price: SHADE_PRICE },
  { name: "11 Fire Red", colorHex: "#E53935", imageUrl: `${IMG}/mon-reve-matte-lips-11.jpg`, position: 10, price: SHADE_PRICE },
  { name: "12 Milky Berry", colorHex: "#C75B7D", imageUrl: `${IMG}/mon-reve-matte-lips-12.jpg`, position: 11, price: SHADE_PRICE },
  { name: "13 Marshmallow", colorHex: "#E8B4C4", imageUrl: `${IMG}/mon-reve-matte-lips-13.jpg`, position: 12, price: SHADE_PRICE },
  { name: "15 Rock Red", colorHex: "#A6243B", imageUrl: `${IMG}/mon-reve-matte-lips-15.jpg`, position: 13, price: SHADE_PRICE },
  { name: "16 Shimmer Sand", colorHex: "#C9A882", imageUrl: `${IMG}/mon-reve-matte-lips-16.jpg`, position: 14, price: SHADE_PRICE },
];

/** Product gallery — representative shade range. */
const PRODUCT_IMAGES = [
  `${IMG}/mon-reve-matte-lips-01.jpg`,
  `${IMG}/mon-reve-matte-lips-06.jpg`,
  `${IMG}/mon-reve-matte-lips-10.jpg`,
  `${IMG}/mon-reve-matte-lips-12.jpg`,
  `${IMG}/mon-reve-matte-lips-16.jpg`,
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
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.price ?? "?"} IQD`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
