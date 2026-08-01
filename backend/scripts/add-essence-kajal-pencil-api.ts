/**
 * Essence Kajal Pencil — all shades.
 * Source: https://www.haar-shop.ch/en/67463671-1-kajal-pencil.html
 * Usage: npx tsx scripts/add-essence-kajal-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const TERTIARY_ID = "c8866117-67e0-4509-a887-60100775524b";

const PRODUCT = {
  slug: "essence-kajal-pencil",
  sku: "ESS-KJP-67463671",
  price: 3750,
  nameAr: "إيسنس - قلم كحل كاجال",
  nameEn: "Essence - Kajal Pencil",
  descriptionAr:
    "قلم كحل كاجال من إيسنس — ألوان عصرية باردة لإبراز مكياج العيون بلمسات لونية جريئة وثبات طويل.\n\n" +
    "• ألوان ترند عصرية تناسب مختلف الإطلالات.\n• طرف قلم ناعم قابل للشحذ لتطبيق سهل.\n• تحديد دقيق وثبات طويل للمكياج.\n• مثالي لتحديد خط الرموش أو إضافة لمسات لونية على العين.\n• خالٍ من البارابين والعطور والكحول.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على خط الرموش العلوي أو السفلي أو داخل العين حسب الإطلالة المطلوبة.",
  descriptionEn:
    "Essence Kajal Pencil — cool trend colours for trendy eye makeup highlights with easy, long-lasting application.\n\n" +
    "• Cool trend colours for every look.\n• Soft, sharpenable pencil tip for easy application.\n• Defining, long-lasting finish.\n• Perfect for the lash line or bold colour accents on the eyes.\n• Vegan, paraben-free, fragrance-free and alcohol-free.\n• Cruelty-free.\n• Apply along the upper or lower lash line, or on the waterline as desired.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Black",
    colorHex: "#000000",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/9/99298105825048d0f5edb90d80089004806d245f_4250035200715_bi_essence_kajal_pencil_01_black.jpg",
    position: 0,
  },
  {
    name: "04 White",
    colorHex: "#FFFFFF",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/3/83fe1870aff5e624990fc1e7cc0ebff0c32740de_4250035200746_bi_essence_kajal_pencil_04_white.jpg",
    position: 1,
  },
  {
    name: "08 Teddy",
    colorHex: "#533A2B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/e/ee9b51671abeec63075e9d02e22ad0c584f5d09d_4250035270459_bi_essence_kajal_pencil_08_teddy.jpg",
    position: 2,
  },
  {
    name: "15 Behind The Scenes",
    colorHex: "#92999D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/3/a387206e6cbc1d3d8abfc97afed26ae93fbb063c_4250338414765_bi_essence_kajal_pencil_15_behind_the_scenes.jpg",
    position: 3,
  },
  {
    name: "25 Feel The Mari-Time",
    colorHex: "#40A3B5",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/8/68240106b5a4b749cc6c7558e595f6889619d9f8_4250587772050_bi_essence_kajal_pencil_25_feel_the_mari_time.jpg",
    position: 4,
  },
  {
    name: "29 Rain Forest",
    colorHex: "#354435",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/7/37c1b09c19488a98d24a5a5776ed9640e98b79c1_4059729307576_bi_essence_kajal_pencil_29_rain_forest.jpg",
    position: 5,
  },
  {
    name: "30 Classic Blue",
    colorHex: "#242B99",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/4/54e6d629ae3bf957242c03c28813c63bf515cdca_4059729307583_bi_essence_kajal_pencil_30_classic_blue.jpg",
    position: 6,
  },
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
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
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
    brandId: BRAND_ID,
    categoryId: CATEGORY_ID,
    subcategoryId: SUBCATEGORY_ID,
    tertiaryCategoryId: TERTIARY_ID,
    subcategoryIds: [SUBCATEGORY_ID],
    tertiaryCategoryIds: [TERTIARY_ID],
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
  console.log(`  Category: المكياج → العيون → كحل`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
