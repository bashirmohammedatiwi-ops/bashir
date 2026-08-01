/**
 * Essence Baby Got Blush Liquid Blush — all shades.
 * Source: https://www.haar-shop.ch/en/67463597-1-baby-got-blush-liquid-blush.html
 * Usage: npx tsx scripts/add-essence-baby-got-blush-liquid-blush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const TERTIARY_ID = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  slug: "essence-baby-got-blush-liquid-blush",
  sku: "ESS-BGBL-67463597",
  price: 6000,
  nameAr: "إيسنس - بلاشر سائل بيبي جوت بلاش",
  nameEn: "Essence - Baby Got Blush Liquid Blush",
  descriptionAr:
    "بلاشر سائل بيبي جوت بلاش من إيسنس — لون طبيعي للخدود بتركيبة خفيفة سهلة التطبيق والدمج.\n\n" +
    "• بلاشر سائل بنتيجة طبيعية وقابلة للتدرج.\n• أداة إسفنجية ناعمة لتطبيق سهل ومريح.\n• يُدمج بسهولة بالفرشاة أو الإسفنجة أو الأصابع.\n• تغطية كاملة مع جفاف سريع ونتيجة فورية.\n• يناسب جميع أنواع البشرة.\n• خالٍ من البارابين والزيت والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• ضعي قطرتين إلى ثلاث قطرات على طول عظام الخد ثم وزّعيها للخارج.",
  descriptionEn:
    "Essence Baby Got Blush Liquid Blush — lightweight liquid blush for a natural cheek colour that is easy to blend and build.\n\n" +
    "• Liquid blush with a natural, buildable result.\n• Soft sponge applicator for easy application.\n• Blends easily with a brush, beauty blender or fingers.\n• Full coverage with a quick-drying, instant result.\n• Suitable for all skin types.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Apply two to three drops along the cheekbones and blend outward. Use more product for a more intense colour.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "10 Pinkalicious",
    colorHex: "#F3707B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/c/3cb7072617551e9a8c92e302eb149083b8f94455_4059729447357_bi_essence_baby_got_blush_liquid_blush_10_pinkalicious.jpg",
    position: 0,
  },
  {
    name: "20 Blushin Berry",
    colorHex: "#AC4F4A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/9/e921d377081b147df02aa8503aa087c3e389bdc0_4059729447371_bi_essence_baby_got_blush_liquid_blush_20_blushin_berry.jpg",
    position: 1,
  },
  {
    name: "30 Dusty Rose",
    colorHex: "#E98272",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/5/95854835b2e9d23a30c013af62543e64e9dfa010_4059729447395_bi_essence_baby_got_blush_liquid_blush_30_dusty_rose.jpg",
    position: 2,
  },
  {
    name: "40 Coral Crush",
    colorHex: "#FD856A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/6/966c4441fc244b9880fe4424a4844d46b9669b35_4059729446558_bi_essence_baby_got_blush_liquid_blush_40_coral_crush.jpg",
    position: 3,
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
  console.log(`  Category: المكياج → الخدود → بلاشر`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
