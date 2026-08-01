/**
 * Essence Soft Baked Blush — all 6 shades.
 * Source: https://www.haar-shop.ch/en/76224496-1-soft-baked-blush.html
 * Usage: npx tsx scripts/add-essence-soft-baked-blush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const TERTIARY_ID = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  slug: "essence-soft-baked-blush",
  sku: "ESS-SBB-76224496",
  price: 5250,
  nameAr: "إيسنس - بلاشر سوفت بيكد",
  nameEn: "Essence - Soft Baked Blush",
  descriptionAr:
    "بلاشر سوفت بيكد من إيسنس — بلاشر مخبوز عالي التصبغ يمنح الخدود إشراقة ناعمة ولمعة صحية مع قوام حريري خفيف سهل الدمج.\n\n" +
    "• تركيبة مخبوزة خفيفة الوزن بلمعة طبيعية.\n• لون غني قابل للبناء من ناعم إلى واضح.\n• قوام ناعم يندمج بسلاسة على البشرة.\n• يُستخدم على الخدود أو لإبراز مناطق الوجه.\n• خالٍ من البارابين والعطور والكحول والزيت والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق بفرشاة بلاشر على عظام الخد ثم يُوزّع نحو الصدغين؛ يمكن تكرار الطبقات لمزيد من اللون.",
  descriptionEn:
    "Essence Soft Baked Blush — highly pigmented baked blush for a soft, luminous glow with a silky-soft, blendable texture.\n\n" +
    "• Weightless baked formula with a natural, radiant finish.\n• Buildable colour from subtle to bold.\n• Silky-soft texture that blends seamlessly.\n• Can be used on cheeks or to add a touch of colour elsewhere.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Apply with a blush brush to the apples of the cheeks and blend upward toward the temples.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "10 Soft Bloom",
    colorHex: "#F6A8AC",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/f/3f90b8b3cb033a47ccce48d39319c5ff9fd1dd04_4059729584557_bi_essence_soft_baked_blush_10_soft_bloom.jpg",
    position: 0,
  },
  {
    name: "20 Peach Please",
    colorHex: "#FFA27B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/0/c080d6427623ecd12fbb5710e9a35e42b9ec8116_4059729584571_bi_essence_soft_baked_blush_20_peach_please.jpg",
    position: 1,
  },
  {
    name: "30 Rose All Day",
    colorHex: "#E88491",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/d/9d3cd99d18b122b35cf0ea5b30163f7c7f715fdd_4059729584595_bi_essence_soft_baked_blush_30_rose_all_day.jpg",
    position: 2,
  },
  {
    name: "40 Think Pink",
    colorHex: "#F67B8E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/a/2a36e9361460b653efc42df7406f54c080f38ccf_4059729584618_bi_essence_soft_baked_blush_40_think_pink.jpg",
    position: 3,
  },
  {
    name: "50 Berry Bliss",
    colorHex: "#AC325B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/2/228f0791f9ab88cb1706d49adb969fbf70634043_4059729584632_bi_essence_soft_baked_blush_50_berry_bliss.jpg",
    position: 4,
  },
  {
    name: "60 Cocoa Glaze",
    colorHex: "#94383C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/0/d07b648aedc4d2be581e3cf4defb10714b917ede_4059729584656_bi_essence_soft_baked_blush_60_cocoa_glaze.jpg",
    position: 5,
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
