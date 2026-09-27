/**
 * Mon Reve Infiniliner Eye Gel Pencil — waterproof long-wear eye pencil 0.3g
 * 10 shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641754238 (shade 02 Brown Black)
 *
 * Sources: monrevecosmetics.com/en/catalogue/infiniliner-eye-gel-pencil-all_203/
 * Hex: trimmed-mean pigment from official *_04 zigzag swatches
 * Price: aligned with Mon Reve eye pencil IQD range (≈4.90€ retail)
 *
 * Usage: npx tsx scripts/add-mon-reve-infiniliner-eye-gel-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const IMG = "https://monrevecosmetics.com/media/images/products";
const IMG_23 = `${IMG}/2023/09`;
const IMG_25 = `${IMG}/2025/06`;
const P24 = "https://cdn.pharm24.gr/images/AUTOxAUTO-90";

const SHADE_PRICE = 7000;

const PRODUCT = {
  barcode: "5201641754238",
  slug: "mon-reve-infiniliner-eye-gel-pencil-waterproof-0-3g",
  sku: "MON-INFEYE-754238",
  price: SHADE_PRICE,
  originalPrice: 8000,
  nameAr: "مون ريف - قلم عيون جل Infiniliner مقاوم للماء طويل الثبات مع مبراة 0.3 غرام",
  nameEn: "Mon Reve - Infiniliner Eye Gel Pencil Waterproof Long-Wear with Sharpener 0.3g",
  descriptionAr:
    "قلم عيون جل Infiniliner من مون ريف — تركيبة كريمية ناعمة تنساب بسهولة دون تهيج، بلون غني مقاوم للماء يدوم طوال اليوم دون تلطخ أو بهتان.\n\n" +
    "• رأس رفيع لدقة عالية على خط الرموش العلوي والسفلي، وعلى الخط الداخلي ككحل (Kajal).\n" +
    "• آلية لفّ دوّارة للتحكم بطول الرأس، مع مبراة مرفقة للحفاظ على حدّة القلم في كل استخدام.\n" +
    "• يمكن دمجه بفرشاة ظل لإطلالة سموكي ناعمة قبل أن يثبت اللون.\n" +
    "• فيغن — مقاوم للماء — خالٍ من البارابين والغلوتين — غير مجرّب على الحيوانات — مُختبر جلدياً وطبّياً للعيون.\n" +
    "• 0.3 غرام — 10 درجات رسمية من الأسود الكلاسيكي إلى الذهبي والميرميد.\n\n" +
    "طريقة الاستخدام: حافظي على رأس القلم حاداً بالمبراة المرفقة، ارسمي خطاً دقيقاً على خط الرموش العلوي أو السفلي أو الخط الداخلي ككحل، وللمظهر السموكي ادمجي اللون بفرشاة ظل قبل أن يثبت.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Black — أسود كلاسيكي\n" +
    "• 02 Brown Black — بني أسود\n" +
    "• 03 Gray Black — رمادي أسود فحمي\n" +
    "• 04 Olive — زيتوني داكن\n" +
    "• 05 Real Brown — بني حقيقي دافئ\n" +
    "• 06 Almost Brown — بني غامق عميق\n" +
    "• 07 Plum Brown — بني برقوقي\n" +
    "• 08 Dark Violet — بنفسجي داكن\n" +
    "• 09 Gold — ذهبي شمبانيا لامع\n" +
    "• 10 Mermaid — تركوازي ميرميد",
  descriptionEn:
    "Mon Reve Infiniliner Eye Gel Pencil — a soft creamy waterproof eye pencil that glides on smoothly without irritating the skin. Intense long-wear colour that stays put all day with a smudge-free finish.\n\n" +
    "• Fine tip for precise lining on the upper and lower lash line, and on the waterline as Kajal.\n" +
    "• Retractable twist mechanism for tip control, plus an included sharpener to keep the point sharp.\n" +
    "• Smudge with a shadow brush before it sets for a soft smoky look.\n" +
    "• Vegan — water-resistant — paraben-free — gluten-free — cruelty-free — dermatologically and ophthalmologically tested.\n" +
    "• 0.3g — 10 official shades from classic black to gold and mermaid teal.\n\n" +
    "How to use: Keep the tip sharp with the included sharpener. Draw precise lines across the upper and lower lash line or waterline like Kajal. For a smoky look, smudge with a shadow brush before it sets.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Black — classic black\n" +
    "• 02 Brown Black — brown black\n" +
    "• 03 Gray Black — charcoal gray black\n" +
    "• 04 Olive — deep olive\n" +
    "• 05 Real Brown — warm real brown\n" +
    "• 06 Almost Brown — deep almost-brown\n" +
    "• 07 Plum Brown — plum brown\n" +
    "• 08 Dark Violet — dark violet\n" +
    "• 09 Gold — shimmering champagne gold\n" +
    "• 10 Mermaid — mermaid teal",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade names; hex from official *_04 zigzag swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Black",
    colorHex: "#1E1E1D",
    imageUrl: `${IMG_23}/mon_reve_infiniliner_eyes_01_04.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02 Brown Black",
    colorHex: "#564B44",
    imageUrl: `${IMG_23}/mon_reve_infiniliner_eyes_02_04.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "03 Gray Black",
    colorHex: "#393C3E",
    imageUrl: `${IMG_23}/mon_reve_infiniliner_eyes_03_04.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "04 Olive",
    colorHex: "#384136",
    imageUrl: `${IMG_23}/mon_reve_infiniliner_eyes_04_04.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "05 Real Brown",
    colorHex: "#3E312A",
    imageUrl: `${IMG_23}/mon_reve_infiniliner_eyes_05_04.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "06 Almost Brown",
    colorHex: "#34251E",
    imageUrl: `${IMG_25}/mon_reve_infiniliner_eyes_06_04.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "07 Plum Brown",
    colorHex: "#51332E",
    imageUrl: `${IMG_25}/mon_reve_infiniliner_eyes_07_04.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
  {
    name: "08 Dark Violet",
    colorHex: "#3C263C",
    imageUrl: `${IMG_25}/mon_reve_infiniliner_eyes_08_04.jpg`,
    position: 7,
    price: SHADE_PRICE,
  },
  {
    name: "09 Gold",
    colorHex: "#C59476",
    imageUrl: `${IMG_25}/mon_reve_infiniliner_eyes_09_04.jpg`,
    position: 8,
    price: SHADE_PRICE,
  },
  {
    name: "10 Mermaid",
    colorHex: "#0C3E5B",
    imageUrl: `${IMG_25}/mon_reve_infiniliner_eyes_10_04.png`,
    position: 9,
    price: SHADE_PRICE,
  },
];

/** Gallery — shade 02 pack first (product barcode) + lifestyle + range packshots. */
const PRODUCT_IMAGES = [
  `${IMG_23}/mon_reve_infiniliner_eyes_02_01.jpg`,
  `${IMG_23}/mon_reve_infiniliner_eyes_02_02.jpg`,
  `${P24}/5201641754238_1.jpg`,
  `${P24}/5201641754238_2.jpg`,
  `${IMG}/2025/08/infini-eyes-site.jpg`,
  `${IMG_25}/Website_Eyes_2.jpg`,
  `${IMG_23}/mon_reve_infiniliner_eyes_01_01.jpg`,
  `${IMG_23}/mon_reve_infiniliner_eyes_01_02.jpg`,
  `${IMG_23}/mon_reve_infiniliner_eyes_03_01.jpg`,
  `${IMG_23}/mon_reve_infiniliner_eyes_05_01.jpg`,
  `${IMG_25}/mon_reve_infiniliner_eyes_09_01.jpg`,
  `${IMG_25}/mon_reve_infiniliner_eyes_10_01.jpg`,
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
    await new Promise((r) => setTimeout(r, 450));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery ${url.split("/").pop()}`);
    } catch (e) {
      console.log(`  ✗ gallery skip: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 450));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
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
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string; price?: number }>;
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

  const noHex = (verify.shades ?? []).filter((s) => !s.colorHex);
  if (noHex.length) throw new Error(`Shades missing hex: ${noHex.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD (was ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? 0} (no shade barcodes)`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.price ?? "?"} IQD`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
