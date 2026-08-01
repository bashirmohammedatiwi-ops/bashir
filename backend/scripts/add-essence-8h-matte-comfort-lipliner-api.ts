/**
 * Essence 8H Matte Comfort Lipliner — all shades with images + color swatches.
 * Source: https://www.haar-shop.ch/en/67463587-1-8h-matte-comfort-lipliner.html
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-8h-matte-comfort-lipliner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "54e393a9-90bf-41bb-beeb-c5364afce287";

const PRODUCT = {
  slug: "essence-8h-matte-comfort-lipliner",
  sku: "ESS-8HMCL-67463587",
  price: 5250,
  nameAr: "إيسنس - قلم تحديد شفاه مريح مطفي يدوم ٨ ساعات",
  nameEn: "Essence - 8H Matte Comfort Lipliner",
  descriptionAr:
    "قلم تحديد شفاه مطفي مريح من إيسنس — لون مكثف وتحديد دقيق يدوم حتى ٨ ساعات.\n\n" +
    "• تركيبة كريمية ناعمة فائقة الليونة لرسم دقيق ومريح.\n• لمسة مطفية بلون واضح وتغطية عالية.\n• مقاوم للماء لتحديد موثوق طوال اليوم.\n• يُستخدم لتحديد محيط الشفاه أو ملء الشفاه بالكامل لتثبيت أحمر الشفاه.\n• خالٍ من البارابين والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• للحصول على أفضل نتيجة: ارسمي خطوطاً قصيرة على طول المحيط بدلاً من خط واحد متصل.",
  descriptionEn:
    "Essence 8H Matte Comfort Lipliner — intense colour and precise contouring with a long-lasting matte finish.\n\n" +
    "• Gentle, ultra-soft formula for precise and comfortable application.\n• Matte finish with intense colour payoff.\n• Waterproof texture for reliable, long-lasting definition.\n• Outline lip contours or fill in lips completely to intensify colour and extend wear.\n• Free from parabens, gluten and lactose.\n• Vegan and cruelty-free.\n• For best results, apply short strokes along the lip line rather than one continuous line.",
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
    colorHex: "#936656",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/b/2b0d8a9ca54299f8b835362092ad04a999287a0b_4059729384195_bi_essence_8h_matte_comfort_lipliner_01_cinnamon_spice.jpg",
    position: 0,
  },
  {
    name: "02 Silky Hazelnut",
    colorHex: "#965A53",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/3/63b24f8dc66fe277d972ad8c8ca2ed7f5043d315_4059729384232_bi_essence_8h_matte_comfort_lipliner_02_silky_hazelnut.jpg",
    position: 1,
  },
  {
    name: "03 Soft Beige",
    colorHex: "#B07062",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/f/1f9c522cb70b2ba24400612d9ca3122a9e44422f_4059729384270_bi_essence_8h_matte_comfort_lipliner_03_soft_beige.jpg",
    position: 2,
  },
  {
    name: "04 Rosy Nude",
    colorHex: "#A1635B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/6/a6d74aa8654b500c19dca47b6acadda6f3d76d63_4059729384317_bi_essence_8h_matte_comfort_lipliner_04_rosy_nude.jpg",
    position: 3,
  },
  {
    name: "05 Pink Blush",
    colorHex: "#B63E62",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/5/754d07e46c4d4d29f69aa9e715caef9e2be62b5d_4059729384355_bi_essence_8h_matte_comfort_lipliner_05_pink_blush.jpg",
    position: 4,
  },
  {
    name: "06 Cool Mauve",
    colorHex: "#883F4F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/f/cf9eeac9810f04ed296e9195ba095c4411eb42d8_4059729384393_bi_essence_8h_comfort_lipliner_06_cool_mauve.jpg",
    position: 5,
  },
  {
    name: "07 Classic Red",
    colorHex: "#B92739",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/a/da1b240fd57bcf1fbe46ca9a5fe2f662bab5d787_4059729384430_bi_essence_8h_matte_comfort_lipliner_07_classic_red.jpg",
    position: 6,
  },
  {
    name: "08 Dark Berry",
    colorHex: "#821B2C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/f/4fc1a6ee6b1e22ec905bfc31c1271bb3321992e8_4059729384478_bi_essence_8h_matte_comfort_lipliner_08_dark_berry.jpg",
    position: 7,
  },
  {
    name: "10 THE Perfect Shade",
    colorHex: "#865B47",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/8/28a5c8d86931908ef15681f06baec1d339487fdb_4059729490209_bi_essence_8h_matte_comfort_lipliner_10_the_perfect_shade.jpg",
    position: 8,
  },
  {
    name: "11 Chestnut Perfection",
    colorHex: "#513427",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/3/f33d4cd5dc6f273b8d01dc122d6e730b0d359873_4059729490216_bi_essence_8h_matte_comfort_lipliner_11_chestnut_perfection.jpg",
    position: 9,
  },
  {
    name: "12 Cushion Talk",
    colorHex: "#B5604F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/d/7dd2f849486be47712a2850520d6f3226270414a_4059729490223_bi_essence_8h_matte_comfort_lipliner_12_cushion_talk.jpg",
    position: 10,
  },
  {
    name: "14 Because It's Iconic",
    colorHex: "#A97053",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/a/ca7a18653faa3d6735c0c7d74c6a06a793432f74_4059729490247_bi_essence_8h_matte_comfort_lipliner_14_because_its_iconic.jpg",
    position: 11,
  },
  {
    name: "15 Vintage Rose",
    colorHex: "#D3675C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/c/9c1a4c0d9cb4000b14e4b88e31abddac0343d0c8_4059729466631_bi_essence_8h_matte_comfort_lipliner_15_vintage_rose.jpg",
    position: 12,
  },
  {
    name: "16 Run, Don't Walk!",
    colorHex: "#9B6C55",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/3/23b8dc88a9508628d4ac382ef0ec8bf4e2eba227_4059729490254_bi_essence_8h_matte_comfort_lipliner_16_run_dont_walk.jpg",
    position: 13,
  },
  {
    name: "17 Must Have Brown",
    colorHex: "#964A31",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/a/8aae3e0e56f1be947d6d62add3779e477cb6e1f2_4059729490261_bi_essence_8h_matte_comfort_lipliner_17_must_have_brown.jpg",
    position: 14,
  },
  {
    name: "18 Cherry On Top",
    colorHex: "#AB3C30",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/3/0361161be8ea39220bfea7ac69408dcf502a24f2_4059729490278_bi_essence_8h_matte_comfort_lipliner_18_cherry_on_to.jpg",
    position: 15,
  },
  {
    name: "19 Burgundy Bestie",
    colorHex: "#853E47",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/4/c4de47a2accc83691881b850b5b917000fc6a3ff_4059729542823_bi_essence_8h_matte_comfort_lipliner_19_burgundy_bestie.jpg",
    position: 16,
  },
  {
    name: "20 Mauve Mirage",
    colorHex: "#B55755",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/9/a9aec0b039ed2d7cc9b5ea9464b3404e3bc3e4c3_4059729542830_bi_essence_8h_matte_comfort_lipliner_20_mauve_mirage.jpg",
    position: 17,
  },
  {
    name: "21 Clouded",
    colorHex: "#B0644D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/9/399c3511ed3f1d43ec789271d935937d4305c08c_4059729585172_bi_essence_8h_matte_comfort_lipliner_21_clouded.jpg",
    position: 18,
  },
  {
    name: "22 Ash Attitude",
    colorHex: "#563F32",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/e/de4736d1482fd51070cadc3a2af51460754e37d7_4059729585189_bi_essence_8h_matte_comfort_lipliner_22_ash_attitude.jpg",
    position: 19,
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
