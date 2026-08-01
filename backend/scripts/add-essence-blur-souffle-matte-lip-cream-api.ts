/**
 * Essence Blur Soufflé Matte Lip Cream — all shades with images + color swatches.
 * Source: https://www.haar-shop.ch/en/76224504-1-blur-souffl-matte-lip-cream.html
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-blur-souffle-matte-lip-cream-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "eaa06284-281e-475f-937b-b01ee24192df";

const PRODUCT = {
  slug: "essence-blur-souffle-matte-lip-cream",
  sku: "ESS-BSMLC-76224504",
  price: 5250,
  nameAr: "إيسنس - أحمر شفاه كريمي مطفي بتأثير ضبابي",
  nameEn: "Essence - Blur Soufflé Matte Lip Cream",
  descriptionAr:
    "أحمر شفاه كريمي مطفي من إيسنس — إطلالة شفاه ضبابية ناعمة بملمس شبه مطفي أنيق.\n\n" +
    "• ملمس شبه مطفي بتأثير ضبابي ناعم لشفاه مموّهة بأناقة.\n• تركيبة كريمية خفيفة الوزن ومريحة على الشفاه.\n• تغطية متوسطة بلون ناعم وسهل التوزيع.\n• يجمع بين أناقة المكياج واتجاه الشفاه الضبابية العصري.\n• خالٍ من البارابين والزيوت والغلوتين واللاكتوز.\n• نباتي.\n• للحصول على أفضل نتيجة: حدّدي محيط الشفاه بقلم تحديد ثم وزّعي الكريم من المنتصف للخارج.",
  descriptionEn:
    "Essence Blur Soufflé Matte Lip Cream — refined elegance with a soft, blended blurred-lips finish.\n\n" +
    "• Semi-matte texture with a soft-focus effect for perfect blurred lips.\n• Lightweight creamy formula for a smooth and comfortable feel.\n• Medium coverage with a supple, effortlessly chic finish.\n• Embraces the viral blurred lips trend.\n• Free from parabens, oil, gluten and lactose.\n• Vegan.\n• For best results, outline lips with a lip liner first, then apply from the centre outwards.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Deep Scroll",
    colorHex: "#6D4440",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/8/f8a1462b5f1471b1f66fa41145e3c8628363004d_4059729584847_bi_essence_blur_souffle_matte_lip_cream_01_deep_scroll.jpg",
    position: 0,
  },
  {
    name: "02 Spice Filter",
    colorHex: "#8A524A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/5/656258d13602fe906be05de67656448a1a3160af_4059729584861_bi_essence_blur_souffle_matte_lip_cream_02_spice_filter.jpg",
    position: 1,
  },
  {
    name: "03 Hot Offline",
    colorHex: "#9C4B45",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/f/6f7a6a3dd987aca6379f0fd043be5e91637a9e55_4059729584885_bi_essence_blur_souffle_matte_lip_cream_03_hot_offline.jpg",
    position: 2,
  },
  {
    name: "04 Main Feed",
    colorHex: "#BF3140",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/0/d0c979565a8a73ac3d6178e03de968c6b2d730fa_4059729584908_bi_essence_blur_souffle_matte_lip_cream_04_main_feed.jpg",
    position: 3,
  },
  {
    name: "05 Crush Hour",
    colorHex: "#8E4950",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/a/6acab682fc8cb2c003279cae6ecfaeda09535f5d_4059729584922_bi_essence_blur_souffle_matte_lip_cream_05_crush_hour.jpg",
    position: 4,
  },
  {
    name: "06 Pillow Talking",
    colorHex: "#885554",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/4/242fb033c522f90a63ec051f1e78a9f2c71d4cb6_4059729584946_bi_essence_blur_souffle_matte_lip_cream_06_pillow_talking.jpg",
    position: 5,
  },
  {
    name: "07 Main Character",
    colorHex: "#884240",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/5/e540aecd088be09be770036fceb94afa99e8b0e0_4059729593696_bi_essence_blur_souffle_matte_lip_cream_07_main_character.jpg",
    position: 6,
  },
  {
    name: "08 No Filter Needed",
    colorHex: "#7F4744",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/7/c78985a0d2119cb5e57eb011ae1c6193cd1a786f_4059729584724_bi_essence_blur_souffle_matte_lip_cream_08_no_filter_needed.jpg",
    position: 7,
  },
  {
    name: "09 Ghost Typing",
    colorHex: "#845051",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/0/b02f31e30de48b5eeac0a305602c4f1127dae1f6_4059729593054_bi_essence_blur_souffle_matte_lip_cream_09_ghost_typing.jpg",
    position: 8,
  },
  {
    name: "10 Status Toast",
    colorHex: "#864F49",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/a/8a8dfa5ad3abe35159334bb5b964c738c87e6664_4059729593047_bi_essence_blur_souffle_matte_lip_cream_10_status_toast.jpg",
    position: 9,
  },
  {
    name: "11 Clickbait",
    colorHex: "#A6212E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/e/7ee13075f892aec16a91782e01b8fa2fa47f3273_4059729614445_bi_essence_blur_souffle_matte_lip_cream_11_clickbait.jpg",
    position: 10,
  },
  {
    name: "12 Soft Launch",
    colorHex: "#7B3F38",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/1/e159c07b862e36432d86cea5aec23c71b377d367_4059729614483_bi_essence_blur_souffle_matte_lip_cream_11_clickbait.jpg",
    position: 11,
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
