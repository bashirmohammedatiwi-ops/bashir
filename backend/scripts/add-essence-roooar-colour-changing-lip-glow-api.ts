/**
 * Essence Roooar Colour Changing Lip Glow 01 What The Fluff? — single barcode product.
 * Barcode: 4059729523129
 * Source: https://reana.pk/products/essence-roooar-colour-changing-lip-glow-01
 * Usage: npx tsx scripts/add-essence-roooar-colour-changing-lip-glow-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "eaa06284-281e-475f-937b-b01ee24192df";

const PRODUCT = {
  barcode: "4059729523129",
  slug: "essence-roooar-colour-changing-lip-glow",
  price: 6000,
  nameAr: "إيسنس - لمعان شفاه رووور متغيّر اللون ٣.٤ جم",
  nameEn: "Essence - Roooar Colour Changing Lip Glow 01 What The Fluff? 3.4 g",
  descriptionAr:
    "لمعان شفاه رووور متغيّر اللون من إيسنس — لون أزرق داكن يتفاعل مع درجة حموضة الشفاه ليتحوّل إلى درجة توتية فردية تناسبك.\n\n" +
    "• تركيبة تتفاعل مع حموضة الشفاه لمنح لون توتي مخصّص.\n• تصميم أنيق بطبعة حيوانية مميزة.\n• قوام كريمي ناعم ينزلق بسهولة.\n• لمعان يدوم طوال اليوم مع إحساس مريح.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق مباشرة على الشفاه ويُكرّر للون أوضح.",
  descriptionEn:
    "Essence Roooar Colour Changing Lip Glow 01 What The Fluff? — dark blue colour reacts to your skin's pH, transforming into a custom berry shade as unique as you.\n\n" +
    "• pH-reactive formula for an individual berry shade.\n• Sleek design with a cute animal print pattern.\n• Smooth, creamy texture that glides effortlessly.\n• Long-wearing glow that adapts to your unique lip tone.\n• Vegan and cruelty-free.\n• Swipe directly onto bare lips and watch the magic happen.",
  imageUrl: "https://reana.pk/cdn/shop/files/4059729523129_1.jpg?v=1772345495",
};

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
  console.log(`API: ${API_BASE}\n`);
  await login();
  console.log("Logged in.\n");

  const check = await api<{ exists: boolean; product?: { nameAr?: string; id?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists) {
    console.log(`skip — barcode exists | ${check.product?.nameAr ?? "?"}`);
    return;
  }

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — slug exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading image...");
  const imageId = await uploadImage(PRODUCT.imageUrl, PRODUCT.slug);

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.barcode,
    barcode: PRODUCT.barcode,
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
    imageIds: [imageId],
  });

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: المكياج → الشفاه → أحمر الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
