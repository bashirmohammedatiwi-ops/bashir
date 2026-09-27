/**
 * Seventeen Lumi Multi-Flex Concealer — 6 official shades, 15ml, no shade barcodes.
 * Sources:
 * - seventeencosmetics.com/en/catalogue/lumi-multi-flex-concealer_1602/
 *   (official hex chips, pack photos 2025/02, gallery 2026/02)
 * Product barcode: 5201641045299 (shade 04)
 * Hex: official color-select__option__hex / schema.org colour
 * Price: Alshaheera Iraq 26,000 IQD
 * Usage: npx tsx scripts/add-seventeen-lumi-multi-flex-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const IMG = "https://seventeencosmetics.com/media/images/products";
const IMG_25 = `${IMG}/2025/02`;
const IMG_26 = `${IMG}/2026/02`;
const IMG_25_04 = `${IMG}/2025/04`;

const SHADE_PRICE = 26000;

const PRODUCT = {
  barcode: "5201641045299",
  slug: "seventeen-lumi-multi-flex-concealer-15ml",
  sku: "SVN-LMFC-045299",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - كونسيلر Lumi Multi-Flex مرطب متعدد الاستخدام للإخفاء والإشراق 15 مل",
  nameEn: "Seventeen - Lumi Multi-Flex Concealer Hydrating Multi-Use Illuminate & Glow 15ml",
  descriptionAr:
    "كونسيلر Lumi Multi-Flex من سيفينتين — كونسيلر سائل خفيف متعدد الاستخدام: يخفي العيوب والهالات، يضيء تحت العين، ويمكن استخدامه لإبراز أو تحديد مناطق الوجه بلمسة مشرقة طبيعية.\n\n" +
    "• تغطية متوسطة إلى عالية قابلة للبناء بملمس خفيف يندمج بسلاسة.\n" +
    "• إنهاء مضيء طبيعي دون تكتّل أو ترسّب في خطوط التعبير.\n" +
    "• 90٪ مكونات طبيعية المنشأ مع فيتامين C والصبار والكركم وإكليل الجبل لترطيب وإشراق وتهدئة.\n" +
    "• زيت نشط (Octyldodecyl PCA) يدعم إنتاج السيراميد وترطيب الحاجز الجلدي.\n" +
    "• مقاوم للماء والعرق — ثابت طوال اليوم دون بهتان أو انتقال.\n" +
    "• مناسب لجميع أنواع البشرة — مُختبر جلدياً وعينياً — خالٍ من العطر والغلوتين.\n" +
    "• حجم 15 مل — 6 درجات رسمية.\n\n" +
    "طريقة الاستخدام: استخدمي أداة التطبيق المدمجة لوضع الكمية المناسبة، ثم ادمِجي بأصابعك أو فرشاة أو إسفنجة. نصيحة: درجة أفتح للهايلايت ودرجة أغمق للكونتور.\n\n" +
    "الدرجات المتوفرة (الأرقام الرسمية):\n" +
    "• 01 — فاتح جداً دافئ\n" +
    "• 02 — فاتح بيج\n" +
    "• 03 — فاتح متوسط\n" +
    "• 04 — متوسط بيج طبيعي\n" +
    "• 05 — متوسط دافئ حنطي\n" +
    "• 06 — غامق حنطي ذهبي",
  descriptionEn:
    "Seventeen Lumi Multi-Flex Concealer — a multi-use liquid concealer with seamless blendability and a lightweight texture for buildable medium-to-high coverage and a natural luminous finish. Conceal imperfections, brighten the under-eye, and use on the face for highlighting or contouring.\n\n" +
    "• Buildable medium-to-high coverage with a lightweight, blendable feel.\n" +
    "• Natural luminous finish that won’t settle into fine lines or creases.\n" +
    "• 90% naturally derived formula with Vitamin C, Aloe Vera, Turmeric and Rosemary for hydration, radiance and soothing care.\n" +
    "• Active oil (Octyldodecyl PCA) helps support ceramide production and skin moisture.\n" +
    "• Water & sweat resistant — long-lasting wear that won’t transfer or fade.\n" +
    "• Suitable for all skin types — dermatologically & ophthalmologically tested — fragrance free & gluten free.\n" +
    "• 15ml — 6 official shades.\n\n" +
    "How to use: Use the built-in applicator to apply the right amount, then blend with fingers, a brush or sponge. Extra tip: use a lighter shade for highlighting and a darker shade for contouring.\n\n" +
    "Available shades (official codes):\n" +
    "• 01 — very light warm\n" +
    "• 02 — light beige\n" +
    "• 03 — light medium\n" +
    "• 04 — medium natural beige\n" +
    "• 05 — medium warm\n" +
    "• 06 — deeper golden tan",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade codes; hex from official colour chips; pack photos *_2.jpg. */
const SHADES: ShadeInput[] = [
  {
    name: "01",
    colorHex: "#DFBCB0",
    imageUrl: `${IMG_25}/seventeen_lumi_1_2.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02",
    colorHex: "#CEA891",
    imageUrl: `${IMG_25}/seventeen_lumi_2_2.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "03",
    colorHex: "#D5A28D",
    imageUrl: `${IMG_25}/seventeen_lumi_3_2.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "04",
    colorHex: "#CBA28E",
    imageUrl: `${IMG_25}/seventeen_lumi_4_2.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "05",
    colorHex: "#CD9A7F",
    imageUrl: `${IMG_25}/seventeen_lumi_5_2.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "06",
    colorHex: "#B18066",
    imageUrl: `${IMG_25}/seventeen_lumi_6_2.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
];

const PRODUCT_IMAGES = [
  `${IMG_25}/seventeen_lumi_4_2.jpg`,
  `${IMG_25}/seventeen_lumi_4_3.jpg`,
  `${IMG_26}/en_lumi_multi_flex_1200x1200212.jpeg`,
  `${IMG_26}/lumi-multiflex-concealer-shades.jpeg`,
  `${IMG_25_04}/CONCEALER-LUMI-_1400x700_3-n.jpg`,
  `${IMG_25}/seventeen_lumi_1_2.jpg`,
  `${IMG_25}/seventeen_lumi_2_2.jpg`,
  `${IMG_25}/seventeen_lumi_2_3.jpg`,
  `${IMG_25}/seventeen_lumi_3_2.jpg`,
  `${IMG_25}/seventeen_lumi_3_3.jpg`,
  `${IMG_25}/seventeen_lumi_5_2.jpg`,
  `${IMG_25}/seventeen_lumi_5_3.jpg`,
  `${IMG_25}/seventeen_lumi_6_2.jpg`,
  `${IMG_25}/seventeen_lumi_6_3.jpg`,
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login: ${(json as { message?: string }).message ?? res.statusText}`);
  const data = (json as { data?: { accessToken?: string; token?: string } }).data ?? json;
  token =
    (data as { accessToken?: string }).accessToken ??
    (data as { token?: string }).token ??
    (json as { accessToken?: string }).accessToken ??
    "";
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
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  const gallerySet = new Set<string>();
  for (const url of PRODUCT_IMAGES) {
    if (gallerySet.has(url)) continue;
    gallerySet.add(url);
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery ${url.split("/").pop()}`);
    } catch (e) {
      console.log(`  ✗ skip ${url.split("/").pop()}: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

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
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
