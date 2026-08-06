/**
 * Mon Reve Infiniliner Gel Brow Pencil — 5 shades (official names), no shade barcodes.
 * Sources: monrevecosmetics.com/en/catalogue/infinilner-gel-brow-pencil-all_216/
 * Product barcode: 5201641747377 (shade 03 Brunette)
 * Hex: trimmed-mean pigment from official zigzag swatches (*_4.jpg)
 * Price: aligned with Mon Reve brow/eye pencil IQD range (≈5.40€ retail)
 * Usage: npx tsx scripts/add-mon-reve-infiniliner-gel-brow-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const IMG = "https://monrevecosmetics.com/media/images/products/2023/09";

const SHADE_PRICE = 7500;

const PRODUCT = {
  barcode: "5201641747377",
  slug: "mon-reve-infiniliner-gel-waterproof-brow-pencil-0-3ml",
  sku: "MON-INFI-BROW-747377",
  price: SHADE_PRICE,
  originalPrice: 8500,
  nameAr: "مون ريف - قلم حواجب Infiniliner جل مقاوم للماء طويل الثبات بطرف مثلث وفرشاة 0.3 مل",
  nameEn: "Mon Reve - Infiniliner Gel Waterproof Brow Pencil Triangular Tip 0.3ml",
  descriptionAr:
    "قلم حواجب Infiniliner جل من مون ريف — تركيبة كريمية هلامية مقاومة للماء بثبات طويل ولمسة نهائية مطفية طبيعية بملمس بودري، لرسم حواجب واضحة وممتلئة بمظهر طبيعي أنيق.\n\n" +
    "• طرف مثلث دقيق يسهّل ملء الفراغات ورسم شعيرات دقيقة وتحديد شكل الحاجب.\n" +
    "• آلية سحب دوّارة للتحكم الكامل بطول الرأس أثناء التطبيق.\n" +
    "• فرشاة سпули مدمجة في الطرف الآخر لتمشيط الحواجب ودمج اللون بتساوٍ.\n" +
    "• مقاوم للماء والعرق — ثابت طوال اليوم دون تلطخ أو بهتان.\n" +
    "• فيغن — خالٍ من البارابين والغلوتين — غير مجرّب على الحيوانات — مُختبر جلدياً وطبّياً للعيون.\n" +
    "• 0.3 مل — 5 درجات رسمية تناسب ألوان الحواجب من الأشقر إلى البني الرمادي.\n\n" +
    "طريقة الاستخدام: مشّطي الحواجب بالفرشاة، ثم ارسمي بضربات قصيرة حادة للأعلى باتجاه نمو الشعيرات واملئي الفراغات برفق، وأعيدي التمشيط لدمج اللون.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Light Blond — أشقر فاتح طبيعي بلمسة بيج دافئة\n" +
    "• 02 Light Brunette — بني فاتح / برونيت ناعم\n" +
    "• 03 Brunette — بني كلاسيكي متوسط\n" +
    "• 04 Brown Rouge — بني محمر دافئ\n" +
    "• 05 Grey Brown — بني رمادي بارد",
  descriptionEn:
    "Mon Reve Infiniliner Gel Brow Pencil — a soft creamy waterproof gel eyebrow pencil with a natural powdery-matte finish for well-defined, full-looking brows that last.\n\n" +
    "• Triangular tip for precise filling, hair-like strokes and easy brow shaping.\n" +
    "• Retractable twist mechanism for full control of tip length.\n" +
    "• Built-in spoolie brush on the other end to comb brows and blend colour evenly.\n" +
    "• Waterproof, long-wear formula that resists smudging and fading all day.\n" +
    "• Vegan — paraben free — gluten free — cruelty free — dermatologically and ophthalmologically tested.\n" +
    "• 0.3ml — 5 official shades from light blond to grey brown.\n\n" +
    "How to use: Comb brows into place with the brush. Apply with small, sharp, upward strokes following the brow shape and softly fill gaps. Comb again to blend evenly.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Light Blond — soft light blond with a warm beige cast\n" +
    "• 02 Light Brunette — soft light brunette\n" +
    "• 03 Brunette — classic medium brunette\n" +
    "• 04 Brown Rouge — warm reddish brown\n" +
    "• 05 Grey Brown — cool grey brown",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  packUrl: string;
  position: number;
  price: number;
};

/** Official shade names from monrevecosmetics.com; hex from *_4 zigzag swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Light Blond",
    colorHex: "#977B66",
    imageUrl: `${IMG}/mon_reve_infiniliner_brows_01_4.jpg`,
    packUrl: `${IMG}/mon_reve_infiniliner_brows_01_1.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02 Light Brunette",
    colorHex: "#917E6C",
    imageUrl: `${IMG}/mon_reve_infiniliner_brows_02_4.jpg`,
    packUrl: `${IMG}/mon_reve_infiniliner_brows_02_1.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "03 Brunette",
    colorHex: "#695B4F",
    imageUrl: `${IMG}/mon_reve_infiniliner_brows_03_4.jpg`,
    packUrl: `${IMG}/mon_reve_infiniliner_brows_03_1.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "04 Brown Rouge",
    colorHex: "#876669",
    imageUrl: `${IMG}/mon_reve_infiniliner_brows_04_4.jpg`,
    packUrl: `${IMG}/mon_reve_infiniliner_brows_04_1.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "05 Grey Brown",
    colorHex: "#4F4B47",
    imageUrl: `${IMG}/mon_reve_infiniliner_brows_05_4.jpg`,
    packUrl: `${IMG}/mon_reve_infiniliner_brows_05_1.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
];

/** Gallery — shade 03 pack first (product barcode), open product, range packshots + textures. */
const PRODUCT_IMAGES = [
  `${IMG}/mon_reve_infiniliner_brows_03_1.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_03_2.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_03_7_TTsXHta.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_01_1.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_02_1.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_04_1.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_05_1.jpg`,
  `${IMG}/mon_reve_infiniliner_brows_01_2_%CE%B1%CE%BD%CF%84%CE%AF%CE%B3%CF%81%CE%B1%CF%86%CE%BF.jpg`,
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
      originalPrice: PRODUCT.originalPrice,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.price} IQD`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery ${url.split("/").pop()}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  // Remaining open-product shots for shades not already in gallery
  const extraOpen = [
    `${IMG}/mon_reve_infiniliner_brows_02_2.jpg`,
    `${IMG}/mon_reve_infiniliner_brows_04_2.jpg`,
    `${IMG}/mon_reve_infiniliner_brows_05_2.jpg`,
  ];
  for (const url of extraOpen) {
    const id = await uploadImage(url, "product-open");
    galleryIds.push(id);
    console.log(`  ✓ open ${url.split("/").pop()}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
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
  console.log(`  Price: ${PRODUCT.price} IQD (was ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length} (no shade barcodes)`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.price ?? "?"} IQD`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyebrow → Brow Pencil`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
