/**
 * Essence Brow Powder Duo Set — all 3 shades.
 * Source: https://www.haar-shop.ch/en/76231057-1-brow-powder-duo-set.html
 * Usage: npx tsx scripts/add-essence-brow-powder-duo-set-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const TERTIARY_ID = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const PRODUCT = {
  slug: "essence-brow-powder-duo-set",
  sku: "ESS-BPDS-76231057",
  price: 5500,
  nameAr: "إيسنس - مجموعة بودرة حواجب ثنائية",
  nameEn: "Essence - Brow Powder Duo Set",
  descriptionAr:
    "مجموعة بودرة حواجب ثنائية من إيسنس — بودرتان عاليتي الجودة لملء الفراغات وتحديد الحواجب بشكل طبيعي مع فرشاة مرفقة.\n\n" +
    "• بودرتان متناسقتان لإطلالة طبيعية أو جريئة.\n• قوام ناعم سهل الدمج وتوزيع متساوٍ.\n• فرشاة مرفقة لتشكيل وتحديد الحواجب بسهولة.\n• تطبيق دقيق وسهل للتحكم الكامل.\n• خالٍ من البارابين والعطور والكحول والزيت والغلوتين واللاكتوز.\n• يُلتقط كمية صغيرة بالفرشاة ويُطبّق بضربات خفيفة على الحواجب ثم يُدمج؛ يُكرّر لزيادة الكثافة.",
  descriptionEn:
    "Essence Brow Powder Duo Set — two high-quality powders to fill in gaps and define brows naturally, with an included brush.\n\n" +
    "• Two complementary powders for a natural or bold brow look.\n• Soft, blendable texture for even application.\n• Included brush for easy shaping and definition.\n• Simple, precise application with full control.\n• Paraben-free, fragrance-free, alcohol-free, oil-free, gluten-free and lactose-free.\n• Pick up a small amount with the brush, apply in short strokes and blend; layer for more intensity.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Light",
    colorHex: "#9B6F51",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/5/d5c7571f5a4f3921749cfca1127f7c3c490dfd8a_4059729516688_bi_essence_brow_powder_duo_set_01_light.jpg",
    position: 0,
  },
  {
    name: "02 Medium",
    colorHex: "#765E49",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/9/69477c3e838492feee28dd7e529f56471d3521e0_4059729516695_bi_essence_brow_powder_duo_set_02_medium.jpg",
    position: 1,
  },
  {
    name: "03 Dark",
    colorHex: "#65463E",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/8/984a4d4cc02c01d77bf8c5384f022715251193b5_4059729516701_bi_essence_brow_powder_duo_set_03_dark.jpg",
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
