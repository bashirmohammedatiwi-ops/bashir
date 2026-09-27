/**
 * Essence Jelly Jewels Glitter Stick — all 3 shades.
 * Source: https://www.haar-shop.ch/en/67470453-1-jelly-jewels-glitter-stick.html
 * Usage: npx tsx scripts/add-essence-jelly-jewels-glitter-stick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "774d62c3-8119-4c0c-983b-2513fc46df24";
const TERTIARY_ID = "6fed608e-80d7-4449-9427-fc2848b091be";

const PRODUCT = {
  slug: "essence-jelly-jewels-glitter-stick",
  sku: "ESS-JJGS-67470453",
  price: 6000,
  nameAr: "إيسنس - ستك جيلي جولز لامع",
  nameEn: "Essence - Jelly Jewels Glitter Stick",
  descriptionAr:
    "ستك جيلي جولز لامع من إيسنس — قوام جيلي مليء بجزيئات لامعة تمنح إطلالة متعددة الأبعاد بلمعان عالٍ.\n\n" +
    "• يُستخدم كظل عيون لامع أو هايلايتر للخدود.\n• تأثير لامع مكثّف بأبعاد متعددة.\n• قوام جيلي سريع الجفاف وثابت دون تساقط.\n• خفيف وسهل التطبيق والدمج بالأصابع.\n• مثالي للتنقّل والاستخدام السريع.\n• خالٍ من البارابين والعطور والكحول والزيت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق مباشرة على الجفون أو الخدين أو أي منطقة تريدين إبرازها ثم يُدمج بلطف بالأصابع.",
  descriptionEn:
    "Essence Jelly Jewels Glitter Stick — jelly-like texture packed with shimmering particles for a multidimensional, high-shine finish.\n\n" +
    "• 2-in-1 glitter magic — use as eyeshadow or shimmering highlighter.\n• Extreme glitter effect with multichrome dimension.\n• Lightweight jelly texture that dries quickly and stays in place with no fallout.\n• Smooth application, easy to blend with fingertips.\n• Compact and perfect on the go.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free, gluten-free and lactose-free.\n• Apply directly to eyelids, cheeks or anywhere you want to shine, then blend gently.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Frosted Twinkle",
    colorHex: "#EBE2CA",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/5/d5ff9f5af2fa762fcf6404753ecac7fc49980d0c_4059729561428_bi_essence_jelly_jewels_glitter_stick_01_frosted_twinkle.jpg",
    position: 0,
  },
  {
    name: "02 Diamond Dust",
    colorHex: "#CBAA8B",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/6/d676002beda3ebe9ef4fc07e4f310d40b119d83a_4059729561435_bi_essence_jelly_jewels_glitter_stick_02_diamond_dust.jpg",
    position: 1,
  },
  {
    name: "03 Golden Hour",
    colorHex: "#D1A891",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/b/fb9407527a702b3ce6dfe154ab5622976d02ffeb_4059729561442_bi_essence_jelly_jewels_glitter_stick_03_golden_hour.jpg",
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
  console.log(`  Category: المكياج → الهايلايتر → هايلايتر سائل`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
