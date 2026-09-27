/**
 * Essence What A Tint! Staining Lip & Cheek Tint — all shades.
 * Source: https://www.haar-shop.ch/en/67470385-1-staining-lip-cheek-tint.html
 * Usage: npx tsx scripts/add-essence-staining-lip-cheek-tint-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const TERTIARY_ID = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  slug: "essence-what-a-tint-staining-lip-cheek-tint",
  sku: "ESS-WAT-SLCT-67470385",
  price: 7500,
  nameAr: "إيسنس - ستيك تينت شفاه وخدود ملوّن وات آ تينت",
  nameEn: "Essence - What A Tint! Staining Lip & Cheek Tint",
  descriptionAr:
    "ستيك تينت شفاه وخدود ملوّن وات آ تينت من إيسنس — قوام بلسمي لامع يندمج مع البشرة ويمنح إشراقة طبيعية على الشفاه والخدود.\n\n" +
    "• منتج ثنائي الاستخدام للشفاه والخدود.\n• تركيبة بلسمية لامعة بإحساس منعش عند التطبيق.\n• قوام سهل الدمج مع لون قابل للبناء.\n• رائحة فاكهية وإحساس منعش على البشرة.\n• شكل ستيك عملي للتعديل السريع في أي وقت.\n• خالٍ من البارابين والزيت والغلوتين واللاكتوز.\n• نباتي.\n• يُمرّر الستيك على الشفاه والخدود ويُدمج بالأصابع أو الإسفنجة.",
  descriptionEn:
    "Essence What A Tint! Staining Lip & Cheek Tint — shiny balm texture that melts into the skin for a radiant, effortless flush on lips and cheeks.\n\n" +
    "• Versatile 2-in-1 product for lips and cheeks.\n• Shiny balm formula with a refreshing skin feel upon application.\n• Easy-to-blend texture with buildable colour intensity.\n• Fruity scent and refreshing sensation.\n• Practical stick format for quick touch-ups.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Swipe directly onto lips and cheeks, then blend with fingers or a beauty blender.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "10 Raspberry Vibes",
    colorHex: "#CB3254",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/e/0e42c3ed0900d1834c45986a8580e44f348f6b13_4059729542540_bi_essence_what_a_tint_staining_lip_and_cheek_tint_10_raspberry_vibes.jpg",
    position: 0,
  },
  {
    name: "20 Grapefruit Bliss",
    colorHex: "#FF1713",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/9/19916301d9c37a04fa0d92da9e0ddd7c875fe76a_4059729542571_bi_essence_what_a_tint_staining_lip_and_cheek_tint_20_grapefruit_bliss.jpg",
    position: 1,
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
  console.log(`  Price: ${PRODUCT.price} IQD`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
