/**
 * Essence Micro Precise Brow Pencil — all shades.
 * Source: https://www.haar-shop.ch/en/76224436-1-micro-precise-brow-pencil.html
 * Usage: npx tsx scripts/add-essence-micro-precise-brow-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const TERTIARY_ID = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const PRODUCT = {
  slug: "essence-micro-precise-brow-pencil",
  sku: "ESS-MPBP-76224436",
  price: 5250,
  nameAr: "إيسنس - قلم حواجب دقيق مايكرو بريسايس",
  nameEn: "Essence - Micro Precise Brow Pencil",
  descriptionAr:
    "قلم حواجب دقيق مايكرو بريسايس من إيسنس — طرف فائق الدقة مع فرشاة مدمجة لحواجب محددة وطبيعية تدوم طوال اليوم.\n\n" +
    "• طرف فائق الدقة لرسم شعرات طبيعية وملء الفراغات بسهولة.\n• فرشاة مدمجة لتصفيف الحواجب ودمج اللون.\n• تركيبة ناعمة بتغطية كاملة ومظهر طبيعي.\n• مقاوم للماء وثبات طويل.\n• حواجب ممتلئة ومتناسقة بمظهر طبيعي.\n• خالٍ من البارابين.\n• نباتي ولم يُختبر على الحيوانات.\n• صفّفي الحواجب بالفرشاة، ثم ارسمي شعرات صغيرة بقلم الحواجب، وادمجي بلطف بالفرشاة للحصول على نتيجة طبيعية.",
  descriptionEn:
    "Essence Micro Precise Brow Pencil — ultra-fine tip with an integrated brush for seamlessly defined, naturally full brows.\n\n" +
    "• Ultra-fine tip for precise, hair-like strokes and seamless blending.\n• Integrated brush for easy shaping and styling.\n• Smooth formula with full coverage for natural-looking brows.\n• Waterproof, long-lasting formula that stays in place.\n• Fills even the smallest gaps for full, defined brows.\n• Vegan and paraben-free.\n• Cruelty-free.\n• Shape the brows with the brush, draw hair-like strokes with the pencil, then gently blend for a natural result.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Cool Blonde",
    colorHex: "#A98A6E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/e/0e7c2c197c48cf0ec81fee039a916935a40ed955_4059729583277_bi_essence_micro_precise_brow_pencil_01_cool_blonde.jpg",
    position: 0,
  },
  {
    name: "02 Taupe",
    colorHex: "#8A6F53",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/8/a8a74101aac3616eec7196f6ecca7cb0f43bd569_4059729583284_bi_essence_micro_precise_brow_pencil_02_taupe.jpg",
    position: 1,
  },
  {
    name: "03 Light Brown",
    colorHex: "#795B41",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/b/3b88f28af4bd62baf46af32f3a8afe8fd5bc0589_4059729583291_bi_essence_micro_precise_brow_pencil_03_light_brown.jpg",
    position: 2,
  },
  {
    name: "04 Neutral Brown",
    colorHex: "#71563D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/3/63e9868bcbf04964b8056774c29a320fa2bfb77f_4059729583307_bi_essence_micro_precise_brow_pencil_04_neutral_brown.jpg",
    position: 3,
  },
  {
    name: "05 Warm Brown",
    colorHex: "#805339",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/1/8183dbcbf3ee5ad0abebf464aead21c8ea40923b_4059729583314_bi_essence_micro_precise_brow_pencil_05_warm_brown.jpg",
    position: 4,
  },
  {
    name: "06 Dark Brown",
    colorHex: "#554941",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/7/5780b477bbf5dfb6becd986224763e64234d748a_4059729583321_bi_essence_micro_precise_brow_pencil_06_dark_brown.jpg",
    position: 5,
  },
  {
    name: "07 Auburn",
    colorHex: "#976A4B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/e/ce47e963762f2bef8b8b78c087e1d2fa8b2eb998_4059729583338_bi_essence_micro_precise_brow_pencil_07_auburn.jpg",
    position: 6,
  },
  {
    name: "08 Black Brown",
    colorHex: "#41372C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/6/a616046917b247f263480eb6c2113708538adbb2_4059729583345_bi_essence_micro_precise_brow_pencil_08_black_brown.jpg",
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
  console.log(`  Category: المكياج → الحواجب → أقلام الحواجب`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
