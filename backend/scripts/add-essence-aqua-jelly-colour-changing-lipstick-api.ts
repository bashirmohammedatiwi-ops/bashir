/**
 * Essence Aqua Jelly Colour Changing Lipstick — single barcode product.
 * Source: https://www.haar-shop.ch/en/67470354-essence-aqua-jelly-colour-changing-lipstick.html
 * Usage: npx tsx scripts/add-essence-aqua-jelly-colour-changing-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "eaa06284-281e-475f-937b-b01ee24192df";

const PRODUCT = {
  barcode: "4059729518590",
  slug: "essence-aqua-jelly-colour-changing-lipstick",
  price: 6000,
  nameAr: "إيسنس - أحمر شفاه أكوا جيلي متغيّر اللون ٣ جم",
  nameEn: "Essence - Aqua Jelly Colour Changing Lipstick 3 g",
  descriptionAr:
    "أحمر شفاه أكوا جيلي متغيّر اللون من إيسنس — قوام جيل أزرق مخضر مع جزيئات لامعة وتأثير سحري يلائم لون شفاهك.\n\n" +
    "• تركيبة تتفاعل مع درجة حموضة الشفاه لتمنح لوناً وردياً فردياً.\n• قوام جيل لامع برائحة فاكهية منعشة.\n• إطلالة مشرقة بلمعة ناعمة.\n• خالٍ من البارابين والزيت والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق بلطف للحصول على لمسة وردية ناعمة، ويُكرّر للون أقوى ولمعان أوضح.",
  descriptionEn:
    "Essence Aqua Jelly Colour Changing Lipstick — turquoise gel texture with shimmering particles and a magical wow effect.\n\n" +
    "• pH-reactive formula creates a delicate, individual pink shade.\n• Glittering gel texture with a fruity scent.\n• Radiant finish for a delicate glowy look.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Apply gently for a delicate hint of pink; repeat to intensify colour and glow.",
  imageUrl:
    "https://www.haar-shop.ch/media/catalog/product/9/6/960d2f41cf0cc14119f4e73e10df9d477f632ccb_4059729518590_bi_essence_aqua_jelly_colour_changing_lipstick.png",
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

    const contentType = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
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
