/**
 * Essence Blush Crush! — all 6 shades.
 * Source: https://www.haar-shop.ch/en/76224580-1-blush-crush.html
 * Usage: npx tsx scripts/add-essence-blush-crush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const TERTIARY_ID = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  slug: "essence-blush-crush",
  sku: "ESS-BC-76224580",
  price: 5000,
  nameAr: "إيسنس - بلاشر كراش",
  nameEn: "Essence - Blush Crush!",
  descriptionAr:
    "بلاشر كراش من إيسنس — بودرة خدود ناعمة مستوحاة من أزهار الربيع تمنح البشرة مظهراً صحياً ومنعشاً.\n\n" +
    "• قوام بودرة مضغوطة فائق النعومة ينزلق بسلاسة.\n• تصبغ عالٍ قابل للتحكم من لمسة خفيفة إلى لون جريء.\n• يُدمج بسهولة لنتيجة طبيعية ومتجانسة.\n• خالٍ من البارابين والزيت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق بفرشاة بلاشر على الخدود ثم يُدمج بلطف؛ يُكرّر للون أقوى.",
  descriptionEn:
    "Essence Blush Crush! — ultra-soft pressed powder blush inspired by spring blossoms for a fresh, healthy-looking complexion.\n\n" +
    "• Ultra-soft texture for even, smooth application.\n• High pigmentation with customisable colour intensity.\n• Pressed powder formula that blends effortlessly.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Apply with a blush brush to the cheeks and blend gently; layer for more intensity.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "100 Blossom Pink",
    colorHex: "#E2ADAF",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/7/978ea6b47e299ad208fdb75b2f90c6c0f3128c95_4059729586599_bi_essence_blush_crush_100_blossom_pink.jpg",
    position: 0,
  },
  {
    name: "110 Peachy Promise",
    colorHex: "#EEA49A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/3/63313425152dce345819a0db1be8e7b2c4367249_4059729586612_bi_essence_blush_crush_110_peachy_promise.jpg",
    position: 1,
  },
  {
    name: "120 Apricot Touch",
    colorHex: "#DF908B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/5/a534802ceef70c4bd0ce10e9a891954796703755_4059729586636_bi_essence_blush_crush_120_apricot_touch.jpg",
    position: 2,
  },
  {
    name: "130 Sweet Hibiscus",
    colorHex: "#E88892",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/b/6b37d8f1b362c4c9115e3a3592c6d2aef1495de8_4059729586650_bi_essence_blush_crush_130_sweet_hibiscus.jpg",
    position: 3,
  },
  {
    name: "140 Cherry Kiss",
    colorHex: "#AE3B6B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/d/cd8af9c3a297ddfcf5497561b49317f2d58d6613_4059729584687_bi_essence_blush_crush_140_cherry_kiss.jpg",
    position: 4,
  },
  {
    name: "150 Cinnamon Sugar",
    colorHex: "#B9646A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/d/fd7146d54bb7f8853d53d23eae046a2021ebe7c0_4059729584670_bi_essence_blush_crush_150_cinnamon_sugar.jpg",
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
