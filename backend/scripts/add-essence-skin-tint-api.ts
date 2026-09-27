/**
 * Essence Skin Tint SPF 30 — all 3 shades.
 * Source: https://www.haar-shop.ch/en/67463719-1-skin-tint.html
 * Usage: npx tsx scripts/add-essence-skin-tint-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "2bbecee1-084d-446c-b4fd-65f769130de9";
const TERTIARY_ID = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const PRODUCT = {
  slug: "essence-skin-tint",
  sku: "ESS-ST-67463719",
  price: 6000,
  nameAr: "إيسنس - تينت بشرة خفيف مع حماية SPF 30",
  nameEn: "Essence - Skin Tint SPF 30",
  descriptionAr:
    "تينت بشرة من إيسنس — يوحّد لون البشرة بتغطية خفيفة إلى متوسطة مع قوام خفيف جداً ومريح، بديل عملي لكريم الأساس.\n\n" +
    "• قوام خفيف ومريح لا يسد المسام.\n• تغطية قابلة للبناء من خفيفة إلى متوسطة.\n• حماية من الشمس SPF 30.\n• مُرطّب بمستخلص الألوفيرا وحمض الهيالورونيك.\n• يناسب جميع أنواع البشرة.\n• خالٍ من البارابين والعطور والكحول والزيت والغلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على الأنف والخدين ثم يُوزّع للخارج بإسفنجة أو فرشاة أو الأصابع؛ للثبات الأفضل ضعي مرطباً أو برايمر أولاً.",
  descriptionEn:
    "Essence Skin Tint — evens out small imperfections with light to medium coverage in a super light, pleasant texture. A lightweight alternative to foundation.\n\n" +
    "• Super light texture that does not clog pores.\n• Buildable light to medium coverage.\n• SPF 30 sun protection.\n• Moisturising with aloe vera and hyaluronic acid.\n• Suitable for all skin types.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free and gluten-free.\n• Cruelty-free.\n• Apply on the nose and cheeks, then blend outward with a sponge, brush or fingers; use day cream or primer underneath for longer wear.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "20",
    colorHex: "#F2C795",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/2/22694a1dfc924c9c5477a726e88ace801954bbe9_4059729446930_bi_essence_skin_tint_20.jpg",
    position: 0,
  },
  {
    name: "30",
    colorHex: "#ECB582",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/f/ff0aab0d15cd3b66bd16a0ea16990ae3c19a5eba_4059729446954_bi_essence_skin_tint_30.jpg",
    position: 1,
  },
  {
    name: "40",
    colorHex: "#EBB984",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/c/cc6eb7bf7e6635c0f0ca11e13e812e140355a65c_4059729446978_bi_essence_skin_tint_40.jpg",
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
  console.log(`  Category: المكياج → الوجه → كريم أساس`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
