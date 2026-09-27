/**
 * Essence Hydra Kiss Lip Tint — all shades with images + color swatches.
 * Source: https://www.haar-shop.ch/en/67470364-1-hydra-kiss-lip-tint.html
 * Usage: npx tsx scripts/add-essence-hydra-kiss-lip-tint-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const PRODUCT = {
  slug: "essence-hydra-kiss-lip-tint",
  sku: "ESS-HKLT-67470364",
  price: 5250,
  nameAr: "إيسنس - تينت شفاه هايدرا كيس",
  nameEn: "Essence - Hydra Kiss Lip Tint",
  descriptionAr:
    "تينت شفاه هايدرا كيس من إيسنس — لمسة لون طبيعية بلمعة ناعمة وإطلالة مشرقة يومية بأقل جهد.\n\n" +
    "• تينت شفاه بلون طبيعي بتأثير لوني يدوم حتى بعد زوال اللمعة.\n• قوام سائل خفيف بلمعة لطيفة ومظهر مشرق.\n• تركيبة قابلة للبناء لتحكم بكثافة اللون حسب الرغبة.\n• يترك بقعة لونية رقيقة تبقى على الشفاه لفترة طويلة.\n• مثالي للاستخدام اليومي بإطلالة منعشة وسهلة.\n• خالٍ من البارابين والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق من منتصف الشفاه للخارج بالأداة المرفقة، يُترك ليجف قليلاً ثم يُعاد للحصول على لون أوضح.",
  descriptionEn:
    "Essence Hydra Kiss Lip Tint — effortless everyday glow with a naturally appearing touch of colour and soft shine.\n\n" +
    "• Naturally appearing lip tint with a long-lasting colour effect.\n• Light, liquid texture with gentle shine and a radiant finish.\n• Buildable formula for individually adjustable colour intensity.\n• Leaves a delicate stain that remains even after the shine fades.\n• Perfect for every day – your go-to for a fresh, radiant finish with minimal effort.\n• Vegan, paraben-free, gluten-free and lactose-free.\n• Apply from the centre of the lips and blend outwards, let dry briefly and reapply for more intensity.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Blushing Nude",
    colorHex: "#AA4830",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/3/a3aaa3afa45ce9e549caef7d01eec0ce8fb0821f_4059729542861_bi_essence_hydra_kiss_lip_tint_01_blushing_nude.jpg",
    position: 0,
  },
  {
    name: "02 Vintage Rose",
    colorHex: "#D66057",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/b/0b8a1c97d1747f04678dd704abe9aefe3dc5e449_4059729542885_bi_essence_hydra_kiss_lip_tint_02_vintage_rose.jpg",
    position: 1,
  },
  {
    name: "03 Rosy Blossom",
    colorHex: "#AF372D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/d/bd3d5c6cb46c9740422d4e13c7bf5b604ef8baef_4059729542908_bi_essence_hydra_kiss_lip_tint_03_rosy_blossom.jpg",
    position: 2,
  },
  {
    name: "04 Classy Red",
    colorHex: "#9B2A23",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/3/83759ff457422eb2d870226cdfab818e2de0819a_4059729542922_bi_essence_hydra_kiss_lip_tint_04_classy_red.jpg",
    position: 3,
  },
  {
    name: "05 Chocolate Brown",
    colorHex: "#6F3629",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/4/746b2fbbea7603fe45bc84ce348e33728a74a41a_4059729542946_bi_essence_hydra_kiss_lip_tint_05_chocolate_brown.jpg",
    position: 4,
  },
  {
    name: "06 Berry Crush",
    colorHex: "#AE383C",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/0/3/036303d64338389c952897756b2a55e0da8fb250_4059729542977_bi_essence_hydra_kiss_lip_tint_06_berry_crush.jpg",
    position: 5,
  },
  {
    name: "07 Hazelnut Haze",
    colorHex: "#A14E3D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/8/c835d7951c3891a6554838cfbac0f6f3e4a57641_4059729541758_bi_essence_hydra_kiss_lip_tint_07_hazelnut_haze.jpg",
    position: 6,
  },
  {
    name: "08 Poppy Pink",
    colorHex: "#DC5A5D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/1/a134e1292ef7d81f71126ea66e60292257df8b6b_4059729541901_bi_essence_hydra_kiss_lip_tint_08_poppy_pink.jpg",
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
