/**
 * Essence Line N' Stain! Tattoo Lip Liner — all shades.
 * Source: https://www.haar-shop.ch/en/76226921-1-line-n-stain-tattoo-lip-liner.html
 * Usage: npx tsx scripts/add-essence-line-n-stain-tattoo-lip-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "54e393a9-90bf-41bb-beeb-c5364afce287";

const PRODUCT = {
  slug: "essence-line-n-stain-tattoo-lip-liner",
  sku: "ESS-LNST-76226921",
  price: 5250,
  nameAr: "إيسنس - قلم تحديد شفاه سائل تاتو لاين أن ستين",
  nameEn: "Essence - Line N' Stain! Tattoo Lip Liner",
  descriptionAr:
    "قلم تحديد شفاه سائل تاتو لاين أن ستين من إيسنس — تحديد دقيق بلون مكثف بتأثير تاتو طبيعي يدوم طوال اليوم.\n\n" +
    "• تركيبة سائلة خفيفة ومائية عالية التصبغ.\n• ثبات طويل مع تحديد واضح للشفاه.\n• طرف دقيق لرسم المحيط أو ملء الشفاه بسهولة.\n• قوام خفيف بالكاد محسوس على الشفاه بلون مكثف.\n• إطلالة تاتو طبيعية بلون ثابت.\n• خالٍ من البارابين والعطور والكحول والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• حدّدي محيط الشفاه ثم ضعي بلسم أو ملمع أو أحمر الشفاه. لإطلالة أكثر امتلاءً: املئي الشفاه بالكامل قبل وضع المنتج المفضل.",
  descriptionEn:
    "Essence Line N' Stain! Tattoo Lip Liner — precise contours with intense colour and a natural tattoo finish that lasts all day.\n\n" +
    "• Light, watery and highly pigmented liquid formula.\n• Long-lasting definition with a natural tattoo tint.\n• Precise tip for easy contouring and effortless filling.\n• Weightless feel on the lips with maximum colour impact.\n• Vegan, paraben-free, fragrance-free, alcohol-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Outline your lips for a defined look, then apply lip balm, gloss or lipstick as desired. For a fuller effect, fill in your lips completely before applying your favourite product.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Everyone's Nude-Pink",
    colorHex: "#B55567",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/3/13be9850636da35e038bf11e3183fb35f111ccda_4059729518507_bi_essence_line_n_stain_tattoo_lip_liner_01_everyones_nude_pink.jpg",
    position: 0,
  },
  {
    name: "02 Must Have Brown",
    colorHex: "#803618",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/2/52632455fac3ba80f3c4b850fed17e843e8e73d9_4059729518521_bi_essence_line_n_stain_tattoo_lip_liner_02_must_have_brown.jpg",
    position: 1,
  },
  {
    name: "03 Make A Mauve",
    colorHex: "#925C56",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/2/725ea0db69d6b3f6106e8d20a5ff7cf30a741529_4059729521439_bi_essence_line_n_stain_tattoo_lip_liner_03_make_a_mauve.jpg",
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
  console.log(`  Category: المكياج → الشفاه → قلم تحديد الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
