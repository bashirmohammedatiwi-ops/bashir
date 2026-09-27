/**
 * Essence Stay & Play Gel Eyeliner — all shades.
 * Source: https://www.haar-shop.ch/en/76230978-1-stay-play-gel-eyeliner.html
 * Usage: npx tsx scripts/add-essence-stay-play-gel-eyeliner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const TERTIARY_ID = "c8866117-67e0-4509-a887-60100775524b";

const PRODUCT = {
  slug: "essence-stay-play-gel-eyeliner",
  sku: "ESS-SPGE-76230978",
  price: 5250,
  nameAr: "إيسنس - كحل جيل ستي أند بلاي",
  nameEn: "Essence - Stay & Play Gel Eyeliner",
  descriptionAr:
    "كحل جيل ستي أند بلاي من إيسنس — تركيبة جيلية عالية التصبغ لخطوط جريئة وإطلالات عيون مميزة.\n\n" +
    "• كحل جيل عالي التصبغ بلون مكثف.\n• قوام ناعم للغاية ينزلق بسهولة على الجفون.\n• مثالي لرسم خطوط واضحة وإطلالات لافتة.\n• خالٍ من البارابين والعطور والكحول والزيت واللاكتوز والأسيتون.\n• نباتي ولم يُختبر على الحيوانات.\n• ابدئي من الزاوية الداخلية للعين وارسمي الكحل بخط واحد على طول خط الرموش. للجناح المثالي: اعملي بضربات صغيرة وابني الخط تدريجياً.",
  descriptionEn:
    "Essence Stay & Play Gel Eyeliner — highly pigmented gel-like texture for bold lines and striking eye looks.\n\n" +
    "• Highly pigmented gel eyeliner with high colour payoff.\n• Super-soft texture that glides effortlessly over the eyelids.\n• Perfect for bold, unique eye looks.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free, lactose-free and acetone-free.\n• Cruelty-free.\n• Start at the inner corner and draw along the lash line in one smooth stroke. For a perfect wing, work with small strokes and build it up step by step.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Black Raven",
    colorHex: "#000000",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/b/7b72bd785e4ccbf8a29307de219b2421b219e653_4059729405241_bi_essence_stay_play_gel_eyeliner_01_black_raven.jpg",
    position: 0,
  },
  {
    name: "02 But First Espresso",
    colorHex: "#5E463E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/5/9537010e91e9880b6bea78c56c699e4992cda0c9_4059729405289_bi_essence_stay_play_gel_eyeliner_02_but_first_espresso.jpg",
    position: 1,
  },
  {
    name: "03 Silky Nude",
    colorHex: "#FACEA6",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/b/6b3ab95c02dbdbdccf34f6205fdc5eebbdb83eb5_4059729405326_bi_essence_stay_play_gel_eyeliner_03_silky_nude.jpg",
    position: 2,
  },
  {
    name: "04 Ice Ice Baby",
    colorHex: "#FFFFFF",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/e/be320209d66a6b41837151c5133a79884d8a0f43_4059729405364_bi_essence_stay_play_gel_eyeliner_04_ice_ice_baby.jpg",
    position: 3,
  },
  {
    name: "05 Verry Berry",
    colorHex: "#634C54",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/e/fec7dadb1ae4df131a352a1b9db90d2dde851af6_4059729405401_bi_essence_stay_play_gel_eyeliner_05_verry_berry.jpg",
    position: 4,
  },
  {
    name: "06 Midnight Sky",
    colorHex: "#2A3A55",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/6/0691d960ed15498aee248fa18b27a2f2e1c0a6ec_4059729405449_bi_essence_stay_play_gel_eyeliner_06_midnight_sky.jpg",
    position: 5,
  },
  {
    name: "07 Emerald Dragon",
    colorHex: "#3B615C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/4/c49e4650d94d6601d2c1bd1d47b9b421d2a1fafc_4059729405487_bi_essence_stay_play_gel_eyeliner_07_emerald_dragon.jpg",
    position: 6,
  },
  {
    name: "08 Stardust Love",
    colorHex: "#5C5F60",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/3/83f1e626199a68cff22b84ed338f152685354781_4059729405524_bi_essence_stay_play_gel_eyeliner_08_stardust_love.jpg",
    position: 7,
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
