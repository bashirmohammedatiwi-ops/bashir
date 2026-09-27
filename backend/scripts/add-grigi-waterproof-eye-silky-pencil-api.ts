/**
 * Grigi Waterproof Eye Silky Pencil — 18 shades.
 * Sources: grigi.gr (images, names), epharmadora.com (08/12 images), melekosbeauty.cy (shade names)
 * Product barcode: 5207042201036 (03 White)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-waterproof-eye-silky-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042201036",
  slug: "grigi-waterproof-eye-silky-pencil",
  sku: "GRG-GWESP",
  price: 6500,
  nameAr: "كريجي - قلم عيون Waterproof Eye Silky Pencil مقاوم للماء",
  nameEn: "Grigi - Waterproof Eye Silky Pencil",
  descriptionAr:
    "قلم عيون Waterproof Eye Silky Pencil من كريجي — قلم تحديد عيون سيلكي مقاوم للماء يمنح خطاً ناعماً وثابتاً طوال اليوم.\n\n" +
    "• تركيبة ناعمة بقوام سيلكي مخملي — ينزلق بسلاسة على الجفون وخط الرموش.\n" +
    "• مقاوم للماء — ثبات عالٍ دون ذوبان أو انتقال.\n" +
    "• لون غني وواضح — من الأسود والرمادي والبني إلى الأزرق والبنفسجي والأخضر والمرجاني.\n" +
    "• مثالي لتحديد محيط العين الداخلي والخارجي أو لإطلالة Smoky Eye.\n" +
    "• 18 درجة: من 01 Black و 02 Grey و 03 White إلى 23 Lime Gold.\n" +
    "• ارسمي على خط الرموش من الزاوية الداخلية نحو الخارج؛ للـ Smoky Eye وزّعي اللون بفرشاة.\n" +
    "• للثبات الأطول على خط الماء، حدّدي ثم ثبّتي بظلال مطابقة.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Waterproof Eye Silky Pencil — silky-soft waterproof eye pencil for smooth, long-lasting definition.\n\n" +
    "• Soft, velvety silky texture that glides effortlessly on lids and lash lines.\n" +
    "• Waterproof formula with high staying power — no smudging or transfer.\n" +
    "• Rich, vivid colour from classic black, grey and brown to blue, purple, green and gold.\n" +
    "• Ideal for upper and lower lash lines or a smoky eye look.\n" +
    "• 18 shades from 01 Black, 02 Grey and 03 White to 23 Lime Gold.\n" +
    "• Line from the inner to outer corner; blend with a brush for a smoky effect.\n" +
    "• For extra waterline longevity, line and set with matching eyeshadow.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Hex sampled from grigi.gr / epharmadora product images (pencil tip region), tuned to shade names. */
const SHADES: ShadeInput[] = [
  { name: "01 Black", colorHex: "#1e1e1e", imageUrl: `${IMG}/G/W/GWEP-01_3.jpeg`, position: 0 },
  { name: "02 Grey", colorHex: "#6e6e6e", imageUrl: `${IMG}/G/W/GWEP-02_3.jpeg`, position: 1 },
  { name: "03 White", colorHex: "#ececea", imageUrl: `${IMG}/g/w/gwep-03.jpg`, position: 2 },
  { name: "04 Dark Brown", colorHex: "#5c4638", imageUrl: `${IMG}/G/W/GWEP-04_3.jpeg`, position: 3 },
  { name: "05 Brown", colorHex: "#6b5040", imageUrl: `${IMG}/G/W/GWEP-05_3.jpeg`, position: 4 },
  {
    name: "08 Blue",
    colorHex: "#3a5898",
    imageUrl: "https://epharmadora.com/mediastream/w640/files/products/da75c8cf6855f34a9c2205cf830aa11a.jpg.jpg",
    position: 5,
  },
  { name: "10 Blue", colorHex: "#4a5880", imageUrl: `${IMG}/g/w/gwep-10.jpg`, position: 6 },
  {
    name: "12 Deep Blue",
    colorHex: "#1e2848",
    imageUrl: "https://epharmadora.com/mediastream/w640/files/products/a813cc51a0288c6e6ebd42d01a165ba0.jpeg.jpg",
    position: 7,
  },
  { name: "13 Blue Purple", colorHex: "#5a5888", imageUrl: `${IMG}/g/w/gwep-13.jpg`, position: 8 },
  { name: "14 Purple", colorHex: "#6a5078", imageUrl: `${IMG}/G/W/GWEP-14_3.jpeg`, position: 9 },
  { name: "16 Green", colorHex: "#3a6848", imageUrl: `${IMG}/g/w/gwep-16.jpg`, position: 10 },
  { name: "17 Forest Green", colorHex: "#2a5038", imageUrl: `${IMG}/g/e/gesp-017.jpg`, position: 11 },
  { name: "18 Tifany Green", colorHex: "#7ab8b0", imageUrl: `${IMG}/g/e/gesp-018.jpg`, position: 12 },
  { name: "19 Olive Green", colorHex: "#6b6848", imageUrl: `${IMG}/g/w/gwep-19.jpg`, position: 13 },
  { name: "20 Wine Bordeaux", colorHex: "#7a3a48", imageUrl: `${IMG}/g/w/gwep-20.jpg`, position: 14 },
  { name: "21 Turquoise Blue", colorHex: "#5e798e", imageUrl: `${IMG}/g/w/gwep-21.jpg`, position: 15 },
  { name: "22 Veri Peri", colorHex: "#6a5a88", imageUrl: `${IMG}/g/w/gwep-22.jpg`, position: 16 },
  { name: "23 Lime Gold", colorHex: "#8f8972", imageUrl: `${IMG}/g/w/gwep-23.jpg`, position: 17 },
];

/** Texture / lifestyle gallery images. */
const PRODUCT_IMAGES = [
  `${IMG}/g/e/gesp-017-tex.jpg`,
  `${IMG}/g/e/gesp-018-tex.jpg`,
  `${IMG}/G/W/GWEP-14_3.jpeg`,
  `${IMG}/g/w/gwep-21.jpg`,
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
    brandAr: "كريجي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string }>;
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
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
