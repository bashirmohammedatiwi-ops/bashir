/**
 * Mon Reve Lip Mousse — 8 shades with images (no shade barcodes).
 * Source: monrevecosmetics.com/en/catalogue/lip_mousse_535/ (official names, images, hex sampled)
 * Product barcode: 5201641038628 (shade 03 Paris)
 * Usage: npx tsx scripts/add-mon-reve-lip-mousse-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://monrevecosmetics.com/media/images/products/2024/11";

const PRODUCT = {
  barcode: "5201641038628",
  slug: "mon-reve-lip-mousse-powdery-matte-liquid-lipstick-4ml",
  sku: "MON-LM-038628",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - روج شفاه سائل مطفي Lip Mousse بقوام موس خفيف 4 مل",
  nameEn: "Mon Reve Lip Mousse Powdery Matte Liquid Lipstick 4ml",
  descriptionAr:
    "روج شفاه سائل مطفي Lip Mousse من مون ريف — تركيبة موسية خفيفة جداً بقوام كريمي مخملي تمنح إحساساً ناعماً على الشفاه مع لون غني ثابت طوال اليوم.\n\n" +
    "• يجف بسرعة ويترك لمسة مطفية بودرية أنيقة دون لزوجة.\n" +
    "• يحافظ على نعومة وترطيب الشفاه دون تجفيفها.\n" +
    "• أداة تطبيق مرنة تلتقط الكمية المناسبة لتغطية متساوية.\n" +
    "• فيغن، خالٍ من الغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 4 مل — 8 درجات مستوحاة من أشهر مدن العالم.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Madrid — بيج مدريد دافئ\n" +
    "• 02 Bali — وردي بالي ناعم\n" +
    "• 03 Paris — وردي باريس كلاسيكي\n" +
    "• 04 Milan — تيراكوتا ميلانو\n" +
    "• 05 Florence — عنابي فلورنس\n" +
    "• 06 Prague — بني براغ\n" +
    "• 07 Vienna — موف فيينا\n" +
    "• 08 London — أحمر لندن كلاسيكي",
  descriptionEn:
    "Mon Reve Lip Mousse — ultra-lightweight creamy matte liquid lipstick with a velvety mousse texture and intense, long-lasting colour that keeps lips soft and comfortable all day.\n\n" +
    "• Quick-drying powdery-matte finish with rich pigment coverage — no sticky feel.\n" +
    "• Featherlight mousse formula blends effortlessly onto lips without drying them out.\n" +
    "• Soft, flexible applicator picks up just the right amount for even coverage.\n" +
    "• Vegan, gluten-free, cruelty-free, dermatologically tested.\n" +
    "• 4ml — 8 dreamy shades inspired by the world's most romantic cities.\n\n" +
    "Available shades:\n" +
    "• 01 Madrid — warm Madrid nude\n" +
    "• 02 Bali — soft Bali pink\n" +
    "• 03 Paris — classic Paris rose\n" +
    "• 04 Milan — terracotta Milan\n" +
    "• 05 Florence — Florence berry\n" +
    "• 06 Prague — Prague brown\n" +
    "• 07 Vienna — Vienna mauve\n" +
    "• 08 London — classic London red",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from monrevecosmetics.com JSON-LD; hex sampled from official product photos. */
const SHADES: ShadeInput[] = [
  { name: "01 Madrid", colorHex: "#A35358", imageUrl: `${IMG}/mon_reve__lip_mousse__Madrid_01_1.jpg`, position: 0 },
  { name: "02 Bali", colorHex: "#DB2842", imageUrl: `${IMG}/mon_reve__lip_mousse__bali-02_1.jpg`, position: 1 },
  { name: "03 Paris", colorHex: "#A74351", imageUrl: `${IMG}/mon_reve__lip_mousse__paris_03_1.jpg`, position: 2 },
  { name: "04 Milan", colorHex: "#B96A75", imageUrl: `${IMG}/mon_reve__lip_mousse__milan__04_1.jpg`, position: 3 },
  { name: "05 Florence", colorHex: "#CD6A71", imageUrl: `${IMG}/mon_reve__lip_mousse__florence_05_1.jpg`, position: 4 },
  { name: "06 Prague", colorHex: "#C96E71", imageUrl: `${IMG}/mon_reve__lip_mousse__prague_06_1.jpg`, position: 5 },
  { name: "07 Vienna", colorHex: "#CC6477", imageUrl: `${IMG}/mon_reve__lip_mousse__vienna_07_1.jpg`, position: 6 },
  { name: "08 London", colorHex: "#853F44", imageUrl: `${IMG}/mon_reve__lip_mousse__london_08_1.jpg`, position: 7 },
];

/** Product gallery — shade range + lifestyle shots. */
const PRODUCT_IMAGES = [
  `${IMG}/crayon-mousse-shades.jpg`,
  `${IMG}/mon_reve__lip_mousse__Madrid_01_4.jpg`,
  `${IMG}/mon_reve__lip_mousse__paris_03_4.jpg`,
  `${IMG}/mon_reve__lip_mousse__florence_05_4.jpg`,
  `${IMG}/mon_reve__lip_mousse__london_08_4.jpg`,
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
    subcategoryId: LIPS,
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }> }>(
    `/products/${created.id}`,
  );

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

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
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
