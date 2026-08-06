/**
 * Mon Reve Lip Crayon — 15 shades with images (no shade barcodes).
 * Source: monrevecosmetics.com/en/catalogue/lip-crayon_518/ (official names, images, hex sampled)
 * Product barcode: 5201641039076 (shade 12 True Red)
 * Usage: npx tsx scripts/add-mon-reve-lip-crayon-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const IMG = "https://monrevecosmetics.com/media/images/products/2024/10";

const PRODUCT = {
  barcode: "5201641039076",
  slug: "mon-reve-lip-crayon-long-lasting-matte-lipstick-pencil-2-5g",
  sku: "MON-LC-039076",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - قلم روج شفاه مطفي Lip Crayon طويل الثبات مع مبرد مدمج 2.5 غرام",
  nameEn: "Mon Reve Lip Crayon Long-Lasting Matte Lipstick Pencil with Built-In Sharpener 2.5g",
  descriptionAr:
    "قلم روج شفاه مطفي Lip Crayon من مون ريف — قلم ميكانيكي قابل للتدوير بلون غني وثابت بلمسة مطفية مخملية، يجمع بين روج الشفاه ومحدد الشفاه في أداة واحدة.\n\n" +
    "• لون مكثّف ثابت مقاوم للنقل مع إحساس خفيف على الشفاه.\n" +
    "• قوام كريمي ناعم يُطبّق بسهولة وتغطية كاملة من أول مرة.\n" +
    "• آلية تدوير للتحكم بطول الرأس + مبرد مدمج لرسم دقيق.\n" +
    "• ينفع لتعبئة الشفاه كاملة، تحديد المحيط، أو إطلالة أومبري.\n" +
    "• 2.5 غرام — 15 درجة تناسب جميع درجات البشرة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Latte — بيج لاتيه\n" +
    "• 02 Burnt Lilac — ليلك محروق\n" +
    "• 03 Apple Pie — تفاحة آبل باي\n" +
    "• 04 Rose — وردي روز\n" +
    "• 05 Guava — وردي جوافة\n" +
    "• 06 Nutmeg — جوزة طيب\n" +
    "• 07 Milk Choco — شوكولاتة بالحليب\n" +
    "• 08 Terra — تيراكوتا تيرا\n" +
    "• 09 Cherry — أحمر كرز\n" +
    "• 10 Clove — قرنفل بني\n" +
    "• 11 Rosewood — خشب الورد\n" +
    "• 12 True Red — أحمر كلاسيكي\n" +
    "• 13 Flame — أحمر ناري فليم\n" +
    "• 14 Chestnut — كستنائي\n" +
    "• 15 Choco — شوكولاتة تشوكو",
  descriptionEn:
    "Mon Reve Lip Crayon — long-lasting mechanical matte lipstick pencil with high pigment payoff, a velvety-matte finish, and a built-in sharpener in one easy tool.\n\n" +
    "• Intense transfer-resistant colour with a lightweight, comfortable feel.\n" +
    "• Smooth creamy texture glides on for even, full-coverage in one swipe.\n" +
    "• Retractable tip control plus built-in sharpener for precise lining and filling.\n" +
    "• Works for full lip colour, defining the lip line, or creating an ombre look.\n" +
    "• 2.5g — 15 stunning shades suitable for all skin tones.\n\n" +
    "Available shades:\n" +
    "• 01 Latte — latte nude\n" +
    "• 02 Burnt Lilac — burnt lilac\n" +
    "• 03 Apple Pie — apple pie rose\n" +
    "• 04 Rose — rose pink\n" +
    "• 05 Guava — guava pink\n" +
    "• 06 Nutmeg — warm nutmeg\n" +
    "• 07 Milk Choco — milk chocolate\n" +
    "• 08 Terra — terracotta terra\n" +
    "• 09 Cherry — cherry red\n" +
    "• 10 Clove — clove brown\n" +
    "• 11 Rosewood — rosewood brown\n" +
    "• 12 True Red — classic true red\n" +
    "• 13 Flame — fiery flame red\n" +
    "• 14 Chestnut — chestnut brown\n" +
    "• 15 Choco — chocolate choco",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from monrevecosmetics.com JSON-LD; hex sampled from official product photos. */
const SHADES: ShadeInput[] = [
  { name: "01 Latte", colorHex: "#B48278", imageUrl: `${IMG}/mon_reve_lip_crayon_01_1.jpg`, position: 0 },
  { name: "02 Burnt Lilac", colorHex: "#AA6E6E", imageUrl: `${IMG}/mon_reve_lip_crayon_02_1.jpg`, position: 1 },
  { name: "03 Apple Pie", colorHex: "#C85A5A", imageUrl: `${IMG}/MON_REVE_lip_crayon_03_1.jpg`, position: 2 },
  { name: "04 Rose", colorHex: "#AA5064", imageUrl: `${IMG}/mon_reve_lip_crayon_04_1.jpg`, position: 3 },
  { name: "05 Guava", colorHex: "#BE6464", imageUrl: `${IMG}/MON_REVE_lip_crayon_05_1.jpg`, position: 4 },
  { name: "06 Nutmeg", colorHex: "#A06450", imageUrl: `${IMG}/mon_reve_lip_crayon_06_1.jpg`, position: 5 },
  { name: "07 Milk Choco", colorHex: "#825046", imageUrl: `${IMG}/MON_REVE_lip_crayon_07_1.jpg`, position: 6 },
  { name: "08 Terra", colorHex: "#6E2828", imageUrl: `${IMG}/MON_REVE_lip_crayon_08_1.jpg`, position: 7 },
  { name: "09 Cherry", colorHex: "#780A1E", imageUrl: `${IMG}/mon_reve_lip_crayon_09_1.jpg`, position: 8 },
  { name: "10 Clove", colorHex: "#5A1E1E", imageUrl: `${IMG}/mon_reve_lip_crayon_10_1.jpg`, position: 9 },
  { name: "11 Rosewood", colorHex: "#8C2814", imageUrl: `${IMG}/mon_reve_lip_crayon_11_1.jpg`, position: 10 },
  { name: "12 True Red", colorHex: "#B40000", imageUrl: `${IMG}/mon_reve_lip_crayon_12_1.jpg`, position: 11 },
  { name: "13 Flame", colorHex: "#DC141E", imageUrl: `${IMG}/MON_REVE_lip_crayon_13_1.jpg`, position: 12 },
  { name: "14 Chestnut", colorHex: "#642828", imageUrl: `${IMG}/mon_reve_lip_crayon_14_1.jpg`, position: 13 },
  { name: "15 Choco", colorHex: "#8C3214", imageUrl: `${IMG}/mon_reve_lip_crayon_15_1.jpg`, position: 14 },
];

/** Product gallery — shade range + lifestyle shots. */
const PRODUCT_IMAGES = [
  `${IMG}/lip-crayon-shades.jpg`,
  `${IMG}/mon_reve_lip_crayon_01_4.jpg`,
  `${IMG}/mon_reve_lip_crayon_06_4.jpg`,
  `${IMG}/mon_reve_lip_crayon_12_4.jpg`,
  `${IMG}/mon_reve_lip_crayon_15_4.jpg`,
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
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 350));
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
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
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
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
