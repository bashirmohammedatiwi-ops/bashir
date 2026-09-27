/**
 * Essence 8H Matte Liquid Lipstick — all shades with images + color swatches.
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-8h-matte-liquid-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const PRODUCT = {
  slug: "essence-8h-matte-liquid-lipstick",
  sku: "ESS-8HML-76220489",
  price: 5250,
  nameAr: "إيسنس - أحمر شفاه سائل مطفي يدوم ٨ ساعات",
  nameEn: "Essence - 8H Matte Liquid Lipstick",
  descriptionAr:
    "روج سائل مطفي ٨ ساعات من إيسنس — لون مكثف يدوم حتى ٨ ساعات دون تجفيف الشفاه.\n\n" +
    "• ملمس مطفي عالي التغطية بلون فوري دون تلطيخ.\n• مقاوم للماء ولا يُنقل بالتقبيل.\n• أداة تطبيق مخصّصة لرسم دقيق وسهل.\n• خالٍ من البارابين والزيوت والغلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• للنتيجة المثالية: حدّدي الشفاه بقلم تحديد ثم وزّعي الروج من المنتصف للخارج.",
  descriptionEn:
    "Essence 8H Matte Liquid Lipstick — intense matte colour that lasts up to 8 hours without drying lips.\n\n" +
    "• High-coverage matte texture with instant colour payoff and no smudging.\n• Waterproof and kiss-proof wear.\n• Specially shaped applicator for easy, precise application.\n• Free from parabens, oil and gluten.\n• Vegan and cruelty-free.\n• For best results, outline lips with a lip liner first, then apply from the centre outwards.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Cinnamon Spice",
    colorHex: "#84503F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/3/733d72332b78e76e89a794503cc2bd0709a03d38_4059729371652_bi_essence_8h_matte_liquid_lipstick_01_cinnamon_spice.jpg",
    position: 0,
  },
  {
    name: "02 Silky Hazelnut",
    colorHex: "#914D45",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/e/3edaee45405522b80e77adb7aa39b829b7659cec_4059729371669_bi_essence_8h_matte_liquid_lipstick_02_silky_hazelnut.jpg",
    position: 1,
  },
  {
    name: "03 Soft Beige",
    colorHex: "#A95F58",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/7/f74e555b2c689a4a99c064324b3e42730d8b4dad_4059729371676_bi_essence_8h_matte_liquid_lipstick_03_soft_beige.jpg",
    position: 2,
  },
  {
    name: "04 Rosy Nude",
    colorHex: "#A65853",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/d/2d7d2590824ff7b1d0dd2b9694385c530dd72e28_4059729371683_bi_essence_8h_matte_liquid_lipstick_04_rosy_nude.jpg",
    position: 3,
  },
  {
    name: "05 Pink Blush",
    colorHex: "#A83B58",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/f/cf0bcf9d810e159bc58f4af66fd9a663c557bf50_4059729371690_bi_essence_8h_matte_liquid_lipstick_05_pink_blush.jpg",
    position: 4,
  },
  {
    name: "06 Cool Mauve",
    colorHex: "#883F4F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/8/b84cb6717f5fd85ff4c1af5e8b6ff1b2ac7ce4a9_4059729371706_bi_essence_8h_matte_liquid_lipstick_06_cool_mauve.jpg",
    position: 5,
  },
  {
    name: "07 Classic Red",
    colorHex: "#A91230",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/8/681a24e9b9c4d34823b2bd0d1a56245ccdc42318_4059729371713_bi_essence_8h_matte_liquid_lipstick_07_classic_red.jpg",
    position: 6,
  },
  {
    name: "08 Dark Berry",
    colorHex: "#7B2A38",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/5/d5493644c9104b15960175d3b8177d195b141186_4059729371720_bi_essence_8h_matte_liquid_lipstick_08_dark_berry.jpg",
    position: 7,
  },
  {
    name: "09 Fiery Red",
    colorHex: "#D43642",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/1/5175f190de2f6f5d392654a62580ccdda0f96b46_4059729384515_bi_essence_8h_matte_liquid_lipstick_09_fiery_red.jpg",
    position: 8,
  },
  {
    name: "10 Deep Rust",
    colorHex: "#A04B3F",
    imageUrl: "https://i8.amplience.net/i/Cosnova/2571041",
    position: 9,
  },
  {
    name: "11 Misty Rose",
    colorHex: "#9E4D5E",
    imageUrl: "https://i8.amplience.net/i/Cosnova/5305824",
    position: 10,
  },
  {
    name: "12 Golden Rose",
    colorHex: "#D07A6E",
    imageUrl: "https://i8.amplience.net/i/Cosnova/5305826",
    position: 11,
  },
  {
    name: "13 Rusty Copper",
    colorHex: "#B5443F",
    imageUrl: "https://i8.amplience.net/i/Cosnova/5305828",
    position: 12,
  },
  {
    name: "14 Soft Red",
    colorHex: "#C45A52",
    imageUrl: "https://i8.amplience.net/i/Cosnova/5305830",
    position: 13,
  },
  {
    name: "15 Vintage Rose",
    colorHex: "#CD5C60",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/f/6fc6414d6b0a02c60653b4708ad2edc42c8793b8_4059729466600_bi_essence_8h_matte_liquid_lipstick_15_vintage_rose.jpg",
    position: 14,
  },
  {
    name: "16 Velvet Brick",
    colorHex: "#A95752",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/6/f6c755805ced33871133855ff67d8c5dc291d9ff_4059729491640_bi_essence_8h_matte_liquid_lipstick_16_vlevet_brick.jpg",
    position: 15,
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
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)",
      },
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
      await new Promise((r) => setTimeout(r, 900));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const payload = {
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
  };

  const created = await api<{ id: string; name?: string }>("/products", "POST", payload);
  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
