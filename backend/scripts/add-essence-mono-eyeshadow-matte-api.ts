/**
 * Essence Mono Eyeshadow Matte — all 3 shades.
 * Source: https://www.haar-shop.ch/en/76224468-1-mono-eyeshadow-matte.html
 * Usage: npx tsx scripts/add-essence-mono-eyeshadow-matte-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const TERTIARY_ID = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const PRODUCT = {
  slug: "essence-mono-eyeshadow-matte",
  sku: "ESS-MEM-76224468",
  price: 4000,
  nameAr: "إيسنس - ظل عيون أحادي مطفي",
  nameEn: "Essence - Mono Eyeshadow Matte",
  descriptionAr:
    "ظل عيون أحادي مطفي من إيسنس — لون غني بلمسة ناعمة سهلة التطبيق والدمج لإطلالات عيون طبيعية أو جريئة.\n\n" +
    "• تركيبة مطفية بلون واضح وثابت.\n• قوام ناعم ينزلق بسهولة ويُدمج بسلاسة.\n• تغطية قابلة للبناء حسب الإطلالة.\n• مناسب للاستخدام اليومي والمسائي.\n• خالٍ من البارابين والعطور والكحول والزيت.\n• نباتي.\n• يُطبّق بفرشاة ظلال العيون على الجفن المتحرك أو ثنيته ثم يُدمج للحصول على لون أعمق.",
  descriptionEn:
    "Essence Mono Eyeshadow Matte — rich matte colour in a soft, blendable formula for effortless eye looks.\n\n" +
    "• Matte finish with smooth colour payoff.\n• Soft texture that glides on and blends easily.\n• Buildable coverage for day or evening looks.\n• Vegan, paraben-free, fragrance-free, alcohol-free and oil-free.\n• Apply with an eyeshadow brush to the mobile lid or crease and blend for more intensity.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Soft Beige",
    colorHex: "#FFDBA4",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/f/7f93afdae9cae5a3a898cf917cb725a0b03ad183_4059729583437_bi_essence_mono_eyeshadow_matte_01_soft_beige.jpg",
    position: 0,
  },
  {
    name: "02 Neutral Brown",
    colorHex: "#D8935C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/0/501b34a97c15d98de1dfa02bb0c088f436e30533_4059729583444_bi_essence_mono_eyeshadow_matte_02_neutral_brown.jpg",
    position: 1,
  },
  {
    name: "03 Deep Ink",
    colorHex: "#000000",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/3/c36511f5e9fc5d0a62077aa8e46adea99f3f31bf_4059729583451_bi_essence_mono_eyeshadow_matte_03_deep_ink.jpg",
    position: 2,
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
  console.log(`  Category: المكياج → العيون → ايشادو`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
