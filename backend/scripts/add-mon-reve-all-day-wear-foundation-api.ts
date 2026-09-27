/**
 * Mon Reve All Day Wear Foundation SPF15 — 7 shades (101–107), no shade barcodes.
 * Sources: monrevecosmetics.com (official images, swatches), vanillacosmetics.com (IQD price)
 * Product barcode: 5201641751367 (shade 105)
 * Usage: npx tsx scripts/add-mon-reve-all-day-wear-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG = "https://monrevecosmetics.com/media/images/products/2019/11";
const IMG_POST = "https://monrevecosmetics.com/media/images/products/2023/08";
const IMG_NEW = "https://monrevecosmetics.com/media/images/products/2025/04";

const SHADE_PRICE = 11750;

const PRODUCT = {
  barcode: "5201641751367",
  slug: "mon-reve-all-day-wear-foundation-spf15-35ml",
  sku: "MON-ADWF-751367",
  price: SHADE_PRICE,
  nameAr: "مون ريف - كريم أساس All Day Wear طويل الثبات SPF15 حجم 35 مل",
  nameEn: "Mon Reve - All Day Wear Foundation SPF15 35ml",
  descriptionAr:
    "كريم أساس All Day Wear طويل الثبات من مون ريف — تركيبة سائلة مرطبة غير دهنية بتغطية متوسطة إلى عالية ولمسة مطفية طبيعية تدوم من الصباح حتى المساء.\n\n" +
    "• تغطية متوسطة إلى عالية بلمسة نهائية مطفية طبيعية — مناسب لجميع أنواع البشرة.\n" +
    "• تركيبة غير دهنية لا تسد المسام ومقاومة للحرارة والعرق.\n" +
    "• غني بعوامل ترطيب وحماية SPF15 من أشعة الشمس.\n" +
    "• خالٍ من البارابين — خالٍ من الغلوتين — فيغن — غير مجرّب على الحيوانات — مُختبر جلدياً.\n" +
    "• حجم 35 مل — صُنع في اليونان.\n" +
    "• يُطبّق على بشرة نظيفة ومرطبة بفرشاة أو إسفنجة كريم أساس حتى يمتزج تماماً مع البشرة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 101 Light Porcelain — بورسلين فاتح جداً للبشرة الفاتحة\n" +
    "• 102 Light Ivory — عاجي فاتح ناعم\n" +
    "• 103 Natural Beige — بيج طبيعي فاتح\n" +
    "• 104 Medium Beige — بيج متوسط محايد\n" +
    "• 105 Warm Beige — بيج دافئ متوسط\n" +
    "• 106 Golden Tan — برونزي ذهبي\n" +
    "• 107 Deep Bronze — برونزي داكن",
  descriptionEn:
    "Mon Reve All Day Wear Foundation SPF15 — long-wear hydrating liquid foundation with a non-oily, medium-to-high coverage matte-natural finish.\n\n" +
    "• Medium to high coverage with a natural matte finish — suitable for all skin types.\n" +
    "• Non-oily, non-comedogenic formula resistant to heat and perspiration.\n" +
    "• Enriched with moisturizing agents and SPF15 sun protection.\n" +
    "• Paraben free — gluten free — vegan — cruelty free — dermatologically tested.\n" +
    "• 35ml — Made in Greece.\n" +
    "• Apply to clean, moisturized skin with a brush or sponge until evenly blended.\n\n" +
    "Available shades:\n" +
    "• 101 Light Porcelain — very light porcelain for fair skin\n" +
    "• 102 Light Ivory — soft light ivory\n" +
    "• 103 Natural Beige — light natural beige\n" +
    "• 104 Medium Beige — neutral medium beige\n" +
    "• 105 Warm Beige — warm medium beige\n" +
    "• 106 Golden Tan — golden tan bronze\n" +
    "• 107 Deep Bronze — deep bronze",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Names progressive by tone; hex from official txtr swatches; images from monrevecosmetics.com. */
const SHADES: ShadeInput[] = [
  {
    name: "101 Light Porcelain",
    colorHex: "#DFBDAF",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_101_txtr.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "102 Light Ivory",
    colorHex: "#D8AA95",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_102_txtr.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "103 Natural Beige",
    colorHex: "#C3A188",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_103_txtr.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "104 Medium Beige",
    colorHex: "#C7A185",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_104_txtr.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "105 Warm Beige",
    colorHex: "#D3A18D",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_105_txtr.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "106 Golden Tan",
    colorHex: "#C4927C",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_106_txtr.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "107 Deep Bronze",
    colorHex: "#A57F66",
    imageUrl: `${IMG}/Mon-Reve_all_day_wear_foundation-_107_txtr.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
];

/** Product gallery — bottle range + lifestyle. */
const PRODUCT_IMAGES = [
  `${IMG}/mon-reve-all-day-wear.jpg`,
  `${IMG}/mon-reve-all-day-wear_vUjXIdI.jpg`,
  `${IMG}/mon-reve-all-day-wear_Zd8KPsI.jpg`,
  `${IMG}/mon-reve-all-day-wear_qWfiefq.jpg`,
  `${IMG_POST}/all_day_wear_post.jpg`,
  `${IMG_NEW}/all-day-wear-1.jpg`,
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
