/**
 * Mon Reve Impeccable Foundation SPF15 — 8 shades (101–108), no shade barcodes.
 * Sources: monrevecosmetics.com (official bottles + texture swatches + copy)
 * Price: Vanilla Cosmetics IQD 20,000
 * Product barcode: 5201641750483 (shade 107)
 * Hex: trimmed-mean pigment sample from official texture swatches
 * Usage: npx tsx scripts/add-mon-reve-impeccable-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG = "https://monrevecosmetics.com/media/images/products";
const IMG_TEX = `${IMG}/2019/11`;
const IMG_BOTTLE = `${IMG}/2023/05`;
const IMG_2025_02 = `${IMG}/2025/02`;
const IMG_2025_04 = `${IMG}/2025/04`;

const SHADE_PRICE = 20000;

const PRODUCT = {
  barcode: "5201641750483",
  slug: "mon-reve-impeccable-foundation-spf15-30ml",
  sku: "MON-IMP-FND-750483",
  price: SHADE_PRICE,
  nameAr: "مون ريف - كريم أساس Impeccable مطفي تغطية عالية SPF15 حجم 30 مل",
  nameEn: "Mon Reve - Impeccable Foundation SPF15 Matte High Coverage 30ml",
  descriptionAr:
    "كريم أساس Impeccable مطفي من مون ريف — تغطية عالية بمظهر طبيعي يدوم طوال اليوم، مع واقي شمس SPF15 ونتيجة ناعمة خالية من العيوب تناسب أجواء العراق الحرّة.\n\n" +
    "• تغطية عالية وطبيعية المظهر بلمسة نهائية مطفية مريحة تدوم من الصباح حتى المساء.\n" +
    "• غني ببديل نباتي لحمض الهيالورونيك وفيتامين E ومساحيق دقيقة لتنظيم الدهون وتحسين مظهر المسام والشوائب.\n" +
    "• مقاوم للحرارة والعرق — لا ينتقل على الملابس — لا يسد المسام.\n" +
    "• مناسب لجميع أنواع البشرة بما فيها الدهنية والمختلطة.\n" +
    "• خالٍ من البارابين — خالٍ من الغلوتين — فيغن — غير مجرّب على الحيوانات — مُختبر جلدياً.\n" +
    "• حجم 30 مل — صُنع في اليونان.\n" +
    "• يُطبّق على بشرة نظيفة ومرطبة بفرشاة أو إسفنجة كريم أساس حتى يمتزج تماماً مع البشرة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 101 Light Porcelain — بورسلين فاتح جداً بلمسة وردية خفيفة\n" +
    "• 102 Soft Ivory — عاجي ناعم للبشرة الفاتحة\n" +
    "• 103 Natural Beige — بيج طبيعي محايد\n" +
    "• 104 Warm Sand — رملي دافئ بلمسة خوخية\n" +
    "• 105 Honey Beige — بيج عسلي دافئ\n" +
    "• 106 Golden Tan — حنطي ذهبي متوسط\n" +
    "• 107 Caramel Tan — كراميل حنطي دافئ\n" +
    "• 108 Deep Bronze — برونزي داكن دافئ",
  descriptionEn:
    "Mon Reve Impeccable Foundation SPF15 — a long-wear high-coverage matte foundation with a natural flawless finish and SPF15 protection.\n\n" +
    "• High yet natural-looking coverage with a comfortable matte finish that lasts all day.\n" +
    "• Enriched with a botanical alternative to hyaluronic acid, vitamin E and micro powders to help regulate oiliness while improving the appearance of pores and imperfections.\n" +
    "• Heat and sweat resistant — non-transfer — non-comedogenic.\n" +
    "• Ideal for all skin types, including oily and combination skin.\n" +
    "• Paraben free — gluten free — vegan — cruelty free — dermatologically tested.\n" +
    "• 30ml — Made in Greece.\n" +
    "• Apply to clean, moisturized skin with a brush or foundation sponge until evenly blended.\n\n" +
    "Available shades:\n" +
    "• 101 Light Porcelain — very fair porcelain with a soft rosy cast\n" +
    "• 102 Soft Ivory — soft light ivory for fair skin\n" +
    "• 103 Natural Beige — neutral natural beige\n" +
    "• 104 Warm Sand — warm sandy beige with a peachy cast\n" +
    "• 105 Honey Beige — warm honey beige\n" +
    "• 106 Golden Tan — medium golden tan\n" +
    "• 107 Caramel Tan — warm caramel tan\n" +
    "• 108 Deep Bronze — deep warm bronze",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  /** Official texture swatch (accurate pigment). */
  imageUrl: string;
  /** Matching shade bottle packshot for product gallery. */
  bottleUrl: string;
  position: number;
  price: number;
};

/** Hex from official monrevecosmetics texture swatches (trimmed-mean pigment). */
const SHADES: ShadeInput[] = [
  {
    name: "101 Light Porcelain",
    colorHex: "#E4BEA9",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-01-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_101.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "102 Soft Ivory",
    colorHex: "#D9B6A0",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-02-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_102.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "103 Natural Beige",
    colorHex: "#C8A088",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-03_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_103.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "104 Warm Sand",
    colorHex: "#CFA795",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-04-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_104.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "105 Honey Beige",
    colorHex: "#D7A589",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-05-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_105.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "106 Golden Tan",
    colorHex: "#CA9778",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-06-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_106.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "107 Caramel Tan",
    colorHex: "#BF8D68",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-07-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_107.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
  {
    name: "108 Deep Bronze",
    colorHex: "#BF8C66",
    imageUrl: `${IMG_TEX}/mon-reve-impeccable-foundation-08-text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_foundation_108.jpg`,
    position: 7,
    price: SHADE_PRICE,
  },
];

/** Product gallery — shade 107 bottle first (product barcode), then range/lifestyle + remaining bottles. */
const PRODUCT_IMAGES = [
  `${IMG_BOTTLE}/mon_reve_impeccable_foundation_107.jpg`,
  `${IMG_2025_02}/impeccample-foundation.jpg`,
  `${IMG_2025_04}/impeccable-foundation-1.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_foundation_101.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_foundation_105.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_foundation_108.jpg`,
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

  console.log("Uploading shade images (texture swatches)...");
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
    console.log(`  ✓ gallery ${url.split("/").pop()}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  // Also upload remaining shade bottles not already in gallery for full packshot coverage
  const gallerySet = new Set(PRODUCT_IMAGES);
  for (const shade of SHADES) {
    if (gallerySet.has(shade.bottleUrl)) continue;
    const id = await uploadImage(shade.bottleUrl, `bottle-${shade.name}`);
    galleryIds.push(id);
    console.log(`  ✓ bottle ${shade.name}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
    images?: unknown[];
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
