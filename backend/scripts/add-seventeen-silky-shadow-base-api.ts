/**
 * Seventeen Silky Shadow Base — 7 official shades, compact eyeshadow, no shade barcodes.
 * Sources:
 * - seventeencosmetics.com/en/catalogue/silky-shadow-base_1268/
 *   (official hex chips + pack photos 2022/12; gallery 2025/04)
 * - Elryan Iraq: product barcode 5201641723579, price 6,250 IQD
 * Product barcode: 5201641723579 (Iraqi retail parent/SKU for this line)
 * Hex: official color-select / schema.org colour chips
 * Usage: npx tsx scripts/add-seventeen-silky-shadow-base-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const IMG = "https://seventeencosmetics.com/media/images/products";
const IMG_22 = `${IMG}/2022/12`;
const IMG_25 = `${IMG}/2025/04`;

const SHADE_PRICE = 6250;

const PRODUCT = {
  barcode: "5201641723579",
  slug: "seventeen-silky-shadow-base-compact-eyeshadow",
  sku: "SVN-SSB-723579",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - ظل عيون Silky Shadow Base مضغوط حريري طبيعي ثابت طويل الأمد",
  nameEn: "Seventeen - Silky Shadow Base Long-Lasting Compact Eyeshadow Natural Finish",
  descriptionAr:
    "ظل عيون Silky Shadow Base من سيفينتين — ظلال مضغوطة بملمس حريري ناعم ودرجات طبيعية مثالية وحدها لإطلالة يومية ناعمة، أو كأساس تحت أي ظل عيون آخر لثبات ولون أوضح.\n\n" +
    "• ملمس حريري فائق النعومة ينساب على الجفن ويُدمَج بسهولة.\n" +
    "• لون طبيعي بتغطية مثالية يدوم طوال اليوم دون تلطخ أو خطوط.\n" +
    "• درجات أساسية متعددة الاستخدام: منفردة أو كقاعدة لأي مكياج عيون.\n" +
    "• علبة شفافة عملية تُظهر اللون الحقيقي بوضوح.\n" +
    "• مختبر جلدياً وطبّياً للعيون.\n" +
    "• 7 درجات رسمية طبيعية من الأبيض العاجي إلى التاوب والموكا.\n\n" +
    "طريقة الاستخدام: طبّقيه بفرشاة ظلال سيفينتين المناسبة على الجفن، وادمِجي الحواف. يمكن استخدامه وحده أو كأساس قبل ظلال الساتان أو البرل أو الميتاليك.\n\n" +
    "الدرجات المتوفرة (الأرقام الرسمية):\n" +
    "• 101 — أبيض عاجي ناعماً\n" +
    "• 102 — خوخي نود فاتح\n" +
    "• 103 — بيج طبيعي\n" +
    "• 104 — بيج دافئ\n" +
    "• 105 — تاوب بني متوسط\n" +
    "• 110 — تاوب بيج ناعم\n" +
    "• 111 — موكا وردي ترابي",
  descriptionEn:
    "Seventeen Silky Shadow Base — compact eyeshadows with a silky-smooth texture in natural shades that satisfy even the most demanding makeup artists. Wear alone for an everyday look, or use as a base under any eyeshadow for easier blending and longer wear.\n\n" +
    "• Unique silky-smooth texture for easy, even application.\n" +
    "• Great colour payoff with perfect coverage that lasts all day without smudging.\n" +
    "• Natural base shades — beautiful alone or as a primer for other shadows.\n" +
    "• Clear compact packaging that shows the true shade.\n" +
    "• Dermatologically and ophthalmologically tested.\n" +
    "• 7 official natural shades from ivory white to taupe and mocha.\n\n" +
    "How to use: Apply with the appropriate Seventeen eyeshadow brushes and blend. Wear alone or as a base before Satin, Pearl or Metallic Silky Shadow shades.\n\n" +
    "Available shades (official codes):\n" +
    "• 101 — soft ivory white\n" +
    "• 102 — light peachy nude\n" +
    "• 103 — natural beige\n" +
    "• 104 — warm beige\n" +
    "• 105 — medium taupe brown\n" +
    "• 110 — soft beige taupe\n" +
    "• 111 — rosy mocha taupe",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade codes; hex from official colour chips; pack photos from official CDN. */
const SHADES: ShadeInput[] = [
  {
    name: "101",
    colorHex: "#F5F4F9",
    imageUrl: `${IMG_22}/5201641712016_P_1_yOCcO6K.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "102",
    colorHex: "#F6D6BF",
    imageUrl: `${IMG_22}/5201641712023_P_1.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "103",
    colorHex: "#E7CFB5",
    imageUrl: `${IMG_22}/5201641712030_P_1.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "104",
    colorHex: "#E5C7AF",
    imageUrl: `${IMG_22}/5201641712047_P_1.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "105",
    colorHex: "#A0907C",
    imageUrl: `${IMG_22}/5201641712054_P_1.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "110",
    colorHex: "#DBC8B5",
    imageUrl: `${IMG_22}/5201641725658_P_1.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "111",
    colorHex: "#A6867E",
    imageUrl: `${IMG_22}/5201641725665_P_1.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
];

const PRODUCT_IMAGES = [
  `${IMG_25}/silky_shadow_base_copy.jpg`,
  `${IMG_25}/silky_shadow_base_copy_wABahH1.jpg`,
  `${IMG_25}/silky_shadow_base_copy_3b7anFk.jpg`,
  `${IMG_25}/silky_shadow_base_copy_puAfbqG.jpg`,
  `${IMG_25}/silky_shadow_base_copy_5tpez6I.jpg`,
  `${IMG_25}/silky_shadow_base_copy_QwBOUU1.jpg`,
  `${IMG_25}/silky_shadow_base_copy_kcnwgWv.jpg`,
  `${IMG_22}/5201641712016_P_1_yOCcO6K.jpg`,
  `${IMG_22}/5201641712030_P_1.jpg`,
  `${IMG_22}/5201641712054_P_1.jpg`,
  "https://www.elryan.com/img/600/600/resize/catalog/product/d/c/dca853f3-f00e-41d8-928f-9afc5384ba60-63938.jpg",
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
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYESHADOW],
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
  console.log(`  Category: Makeup → Eyes → Eyeshadow`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
