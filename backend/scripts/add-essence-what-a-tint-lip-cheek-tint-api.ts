/**
 * Essence What A Tint! Lip & Cheek Tint — all 3 shades.
 * Source: https://www.haar-shop.ch/en/67463735-1-what-a-tint-lip-cheek-tint.html
 * Usage: npx tsx scripts/add-essence-what-a-tint-lip-cheek-tint-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const TERTIARY_ID = "388af575-b9d3-484f-b382-3376cbb4efe8";

const PRODUCT = {
  slug: "essence-what-a-tint-lip-cheek-tint",
  sku: "ESS-WAT-67463735",
  price: 7500,
  nameAr: "إيسنس - تينت شفاه وخدود وات آ تينت",
  nameEn: "Essence - What A Tint! Lip & Cheek Tint",
  descriptionAr:
    "تينت شفاه وخدود وات آ تينت من إيسنس — قوام مائي خفيف غير لزج يمنح لمسة لون ناعمة بإطلالة طبيعية ومنعشة.\n\n" +
    "• مناسب للشفاه والخدود في منتج واحد.\n• لمسة لون ناعمة بلمسة نهائية طبيعية.\n• مقاوم للتقبيل على الشفاه وثبات طويل على الخدود.\n• أداة تطبيق إسفنجية مدمجة لسهولة الاستخدام.\n• خالٍ من البارابين والزيت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق على الشفاه أو الخدود ويُدمج بالأصابع أو الإسفنجة؛ يُكرّر للون أقوى.",
  descriptionEn:
    "Essence What A Tint! Lip & Cheek Tint — non-sticky, water-like texture for a soft tint with a natural, fresh finish.\n\n" +
    "• Suitable for both lips and cheeks.\n• Soft tint with a natural finish.\n• Kiss-proof on lips and long-lasting colour sheen on cheeks.\n• Integrated flocked applicator for easy application.\n• Vegan, paraben-free, oil-free, gluten-free and lactose-free.\n• Apply to lips or cheeks and blend with fingers or a sponge; layer for more intensity.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Kiss From A Rose",
    colorHex: "#D54768",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/d/8d30326792d563b40ecf8713ed4651444127b8e5_4059729382412_bi_essence_what_a_tint_lip_cheek_tint_01_kiss_from_a_rose.jpg",
    position: 0,
  },
  {
    name: "02 Coral Sunset",
    colorHex: "#FF1D39",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/3/b361fc32f5d4792e0968d2907b7197513ca86703_4059729490681_bi_essence_what_a_tint_lip_cheek_tint_02_coral_sunset.jpg",
    position: 1,
  },
  {
    name: "03 Peachy Vibes",
    colorHex: "#FF623F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/5/d57cc47113b734304a8194de5154baa975f94903_4059729476739_bi_essence_what_a_tint_lip__cheek_tint_03_peachy_vibes.jpg",
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
  console.log(`  Price: ${PRODUCT.price} IQD`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
