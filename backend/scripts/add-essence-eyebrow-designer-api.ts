/**
 * Essence Eyebrow Designer — all shades.
 * Source: https://www.haar-shop.ch/en/67463632-1-eyebrow-designer.html
 * Usage: npx tsx scripts/add-essence-eyebrow-designer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const TERTIARY_ID = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const PRODUCT = {
  slug: "essence-eyebrow-designer",
  sku: "ESS-EBD-67463632",
  price: 4000,
  nameAr: "إيسنس - قلم حواجب ديزاينر",
  nameEn: "Essence - Eyebrow Designer",
  descriptionAr:
    "قلم حواجب ديزاينر من إيسنس — يمنح الحواجب شكلاً مثالياً مع فرشاة عملية على الغطاء لتصفيف متناسق.\n\n" +
    "• يُبرز شكل الحواجب ويملأ الفراغات بشكل طبيعي.\n• فرشاة مدمجة على الغطاء لتصفيف وتثبيت الحواجب.\n• مجموعة واسعة من الألوان من الأشقر إلى الأسود.\n• مثالي لرسم شعرات طبيعية في المناطق الخفيفة.\n• يناسب جميع أنواع البشرة.\n• خالٍ من البارابين والعطور والكحول واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• ارسمي شعرات صغيرة بلون مطابق لملء الفراغات، ثم صفّفي الحواجب بالفرشاة.",
  descriptionEn:
    "Essence Eyebrow Designer — perfectly shaped brows with a practical brush on the cap for even, defined styling.\n\n" +
    "• Brings eyebrows into perfect shape.\n• Brush on the cap for even, defined brow styling.\n• Wide colour range from blonde to black.\n• Ideal for drawing hair-like strokes to fill small gaps.\n• Suitable for all skin types.\n• Vegan, paraben-free, fragrance-free, alcohol-free and lactose-free.\n• Cruelty-free.\n• Use a matching shade to draw hair-like strokes where brows are sparse, then brush through for a natural finish.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Black",
    colorHex: "#000000",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/d/2d85f8f85980092864e2da104f45bad08774dbca_4250035200586_bi_essence_eyebrow_designer_01_black.jpg",
    position: 0,
  },
  {
    name: "02 Brown",
    colorHex: "#3F3530",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/b/8b89b7ba0fc67cdc352be461fa9f652a7c7281d0_4250035200593_bi_essence_eyebrow_designer_02_brown.jpg",
    position: 1,
  },
  {
    name: "04 Blonde",
    colorHex: "#978376",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/8/e89ab2ed3f0660d184b4da205023bf8e2e1c9af9_4250338498864_bi_essence_eyebrow_designer_04_blonde.jpg",
    position: 2,
  },
  {
    name: "05 Soft Blonde",
    colorHex: "#B7A399",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/5/054ba30f22ddaf7cd78b4d0d8055dc1c0f2e12a5_4250587771855_bi_essence_eyebrow_designer_05_soft_blonde.jpg",
    position: 3,
  },
  {
    name: "10 Dark Chocolate Brown",
    colorHex: "#5B5044",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/0/10a8081f1539cf1502e6f9ee777406096d131dcd_4059729228284_bi_essence_eyebrow_designer_10_dark_chocolate_brown.jpg",
    position: 4,
  },
  {
    name: "11 Deep Brown",
    colorHex: "#483A30",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/2/820ccc3c77ba61daa6d2b3ea9d819bd041ec3084_4059729228291_bi_essence_eyebrow_designer_11_deep_brown.jpg",
    position: 5,
  },
  {
    name: "12 Hazelnut Brown",
    colorHex: "#78614A",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/5/e565f25e413508898e9433dec356d144651f52c6_4059729228307_bi_essence_eyebrow_designer_12_hazelnut_brown.jpg",
    position: 6,
  },
  {
    name: "13 Cool Blonde",
    colorHex: "#836B50",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/4/f45f50c0581ae87b1bb3afb1b40fd035f122efc5_4059729228314_bi_essence_eyebrow_designer_13_cool_blonde.jpg",
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
