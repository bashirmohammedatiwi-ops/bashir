/**
 * Essence Baby Got Blush Stick — all shades.
 * Source: https://www.haar-shop.ch/en/67463593-1-baby-got-blush.html
 * Usage: npx tsx scripts/add-essence-baby-got-blush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const TERTIARY_ID = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  slug: "essence-baby-got-blush",
  sku: "ESS-BGB-67463593",
  price: 6000,
  nameAr: "إيسنس - ستك بلاشر بيبي جوت بلاش",
  nameEn: "Essence - Baby Got Blush Stick",
  descriptionAr:
    "ستك بلاشر بيبي جوت بلاش من إيسنس — انتعاش فوري ومظهر نضر ومشرق بتركيبة كريمية سهلة التطبيق والدمج.\n\n" +
    "• ستك بلاشر بقوام كريمي ناعم يندمج بلطف مع البشرة.\n• تطبيق سهل ومريح على الخدود أو الشفاه.\n• إطلالة نضرة وطبيعية بلمعة خفيفة.\n• نتيجة فورية لمظهر مشرق ومنعش.\n• شكل ستك عملي يناسب الحقيبة والتطبيق السريع أثناء التنقل.\n• يناسب جميع أنواع البشرة.\n• خالٍ من البارابين والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق مباشرة على الخدود أو الشفاه ويُدمج بالأصابع أو فرشاة.",
  descriptionEn:
    "Essence Baby Got Blush — instant freshness and a vibrant, radiant look with a creamy blush stick that is easy to apply on the go.\n\n" +
    "• Creamy blush stick texture that blends perfectly with the skin.\n• Easy, comfortable application on cheeks and lips.\n• Radiantly fresh, natural-looking finish.\n• Instant results for a bright, healthy glow.\n• Practical stick format that fits in any handbag.\n• Suitable for all skin types.\n• Vegan, paraben-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Apply directly to cheeks or lips and blend with fingers or a brush.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "10 Tickle Me Pink",
    colorHex: "#FF8493",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/f/3f93c6059ab30287a75c013cbd519bf2852daa7f_4059729381019_bi_essence_baby_got_blush_10_tickle_me_pink.jpg",
    position: 0,
  },
  {
    name: "20 Peaches & Cream",
    colorHex: "#FF8673",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/3/c31ce03b0694402170bf8e7c51bc87c77817e0b2_4059729381026_bi_essence_baby_got_blush_20_peaches__cream.jpg",
    position: 1,
  },
  {
    name: "30 Rosé All Day",
    colorHex: "#DA666A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/c/bcb10f6cac460d5529f91fb4d1a386c5b0984bcb_4059729381033_bi_essence_baby_got_blush_30_rose_all_day.jpg",
    position: 2,
  },
  {
    name: "40 Sweets & Roses",
    colorHex: "#CD5D59",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/d/fd8c660ce36454f6b04d676121eb2621033879d1_4059729491275_bi_essence_baby_got_blush_40_sweets_roses.jpg",
    position: 3,
  },
  {
    name: "50 Cherry Cherry Baby",
    colorHex: "#830B21",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/7/a70ccfadf3d86a0a1041e44e6da1572b5cfd338f_4059729490285_bi_essence_baby_got_blush_50_cherry_cherry_baby.jpg",
    position: 4,
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
