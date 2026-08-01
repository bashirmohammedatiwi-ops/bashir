/**
 * Radiant Professional Softline Waterproof Eye Pencil — all 11 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-softline-waterproof-eye-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const IMG_2022 = "https://radiant-professional.com/media/images/products/2022/08";
const IMG_2026 = "https://radiant-professional.com/media/images/products/2026/07";

const PRODUCT = {
  slug: "radiant-professional-softline-waterproof-eye-pencil",
  sku: "RAD-SWEP",
  price: 9500,
  nameAr: "راديانت بروفيشنال - قلم عيون سوفت لاين مقاوم للماء",
  nameEn: "Radiant Professional - Softline Waterproof Eye Pencil",
  descriptionAr:
    "قلم عيون سوفت لاين مقاوم للماء من راديانت بروفيشنال — لتحديد وإبراز العيون بلون ثابت طوال اليوم.\n\n" +
    "• تركيبة ناعمة غنية بفيتامين إي وزيت الجوجوبا ومضادات أكسدة طبيعية.\n• مقاوم للماء ولا ينتقل بسهولة.\n• يحدد محيط العين الداخلي والخارجي بدقة.\n• مجموعة درجات متنوعة من الأسود والبني إلى الألوان الجريئة.\n• مختبر جلدياً.\n• يُطبّق على الجفن العلوي والسفلي أو داخل خط الرموش.",
  descriptionEn:
    "Radiant Professional Softline Waterproof Eye Pencil — soft waterproof eye liner for precise, long-lasting definition.\n\n" +
    "• Soft formula with natural antioxidants, Vitamin E and Jojoba oil.\n• Non-transfer, long-lasting waterproof wear.\n• Defines upper and lower lash lines with precision.\n• Wide shade range from classic blacks and browns to bold colours.\n• Dermatologically tested.\n• Apply to upper and lower lash lines or waterline.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "01 Pure Black", colorHex: "#111213", barcode: "5201641047064", imageUrl: `${IMG_2026}/2_dQM7b0O.jpg`, position: 0 },
  { name: "02 Pure Grey", colorHex: "#47423c", barcode: "5201641689806", imageUrl: `${IMG_2022}/5201641689806_1_ARFHHIL.jpg`, position: 1 },
  { name: "05 Navy Blue", colorHex: "#35414f", barcode: "5201641689813", imageUrl: `${IMG_2022}/5201641689813_2_lSKXRt9.jpg`, position: 2 },
  { name: "21 Forest Green", colorHex: "#223634", barcode: "5201641689844", imageUrl: `${IMG_2022}/5201641689844_5_GNo8JgY.jpg`, position: 3 },
  { name: "22 Purple", colorHex: "#522d88", barcode: "5201641702468", imageUrl: `${IMG_2022}/5201641702468_21_bSLs6TI.jpg`, position: 4 },
  { name: "24 Black Prune", colorHex: "#2b2230", barcode: "5201641702475", imageUrl: `${IMG_2022}/5201641702475_22_JQuxiE6.jpg`, position: 5 },
  { name: "26 Blue", colorHex: "#1b3e80", barcode: "5201641702499", imageUrl: `${IMG_2022}/5201641702499_24_6rDjr2w.jpg`, position: 6 },
  { name: "29 Beige", colorHex: "#d8a491", barcode: "5201641706176", imageUrl: `${IMG_2022}/5201641706176_26_wLKegUu.jpg`, position: 7 },
  { name: "30 Smoky Black", colorHex: "#111213", barcode: "5201641723104", imageUrl: `${IMG_2022}/5201641723104_29_v1ONhIs.jpg`, position: 8 },
  { name: "31 Smoky Dark Brown", colorHex: "#3d271c", barcode: "5201641725603", imageUrl: `${IMG_2022}/5201641725603_30_QhRaLeJ.jpg`, position: 9 },
  { name: "34 Dark Chocolate", colorHex: "#4f2d23", barcode: "5201641725610", imageUrl: `${IMG_2022}/5201641725610_31_gf4RPXv.jpg`, position: 10 },
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
    brandAr: "راديانت بروفيشنال",
    brandEn: "Radiant Professional",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Radiant Professional brand");
  console.log(`Brand: Radiant Professional (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — product already exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      shades.push({
        name: shade.name,
        colorHex: shade.colorHex,
        barcode: shade.barcode,
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex}) — ${shade.barcode}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
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

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: المكياج → العيون → قلم تحديد العيون`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
