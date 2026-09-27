/**
 * Essence Glossy Glaze High Shine Lipstick — all 5 shades.
 * Sources:
 * - https://beautyboothqa.com/product/essence-glossy-glaze-high-shine-lipstick-01-livin-la-vida-mocha-19g
 * - https://www.boozyshop.com/products/essence-glossy-glaze-high-shine-lipstick-01-livin-la-vida-mocha
 * Usage: npx tsx scripts/add-essence-glossy-glaze-high-shine-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "eaa06284-281e-475f-937b-b01ee24192df";

const PRODUCT = {
  slug: "essence-glossy-glaze-high-shine-lipstick",
  sku: "ESS-GGHSL-952100",
  price: 5250,
  nameAr: "إيسنس - أحمر شفاه لامع عالي التوهج جوزي غلايز",
  nameEn: "Essence - Glossy Glaze High Shine Lipstick",
  descriptionAr:
    "أحمر شفاه جوزي غلايز هاي شاين من إيسنس — لون غني مع لمعة عالية كالمرآة لشفاه تبدو أكمل وأنعم.\n\n" +
    "• لمعة عالية وتغطية لونية غنية وناعمة.\n• قوام كريمي زبدي ينزلق بسهولة على الشفاه.\n• يمنح الشفاه مظهراً أكمل وأكثر نعومة وإشراقاً.\n• إحساس مريح غير لزج طوال اليوم دون جفاف.\n• خالٍ من البارابين والغلوتين واللاكتوز والزيت.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق مباشرة على شفاه نظيفة وجافة، ويمكن تكرار الطبقات لمزيد من اللون واللمعة.",
  descriptionEn:
    "Essence Glossy Glaze High Shine Lipstick — rich colour with a mirror-like glossy finish for fuller, smoother, beautifully luminous lips.\n\n" +
    "• High-shine, glossy finish with rich, smooth colour payoff.\n• Creamy, buttery texture that glides effortlessly.\n• Leaves lips looking fuller, smoother and beautifully luminous.\n• Comfortable, non-sticky feel without drying lips.\n• Free from parabens, gluten, lactose and oil.\n• Vegan and cruelty-free.\n• Apply directly onto clean, dry lips; layer for more intense colour and shine.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Livin La Vida Mocha",
    colorHex: "#6E4438",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0859/0275/4068/files/essence-glossy-glaze-high-shine-lipstick-01-livin-la-vida-mocha-63809665007999.png",
    position: 0,
  },
  {
    name: "02 On Cloud Nude",
    colorHex: "#C48E7F",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0859/0275/4068/files/essence-glossy-glaze-high-shine-lipstick-02-on-cloud-nude-63809626505599.png",
    position: 1,
  },
  {
    name: "03 Pink Things Up",
    colorHex: "#D85C8F",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0859/0275/4068/files/essence-glossy-glaze-high-shine-lipstick-03-pink-things-up-63809585873279.png",
    position: 2,
  },
  {
    name: "04 Red-dy For The Day",
    colorHex: "#B91C3C",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0859/0275/4068/files/essence-glossy-glaze-high-shine-lipstick-04-red-dy-for-the-day-63809542979967.png",
    position: 3,
  },
  {
    name: "05 Maple Me Crazy",
    colorHex: "#B85A2E",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0859/0275/4068/files/essence-glossy-glaze-high-shine-lipstick-05-maple-me-crazy-67186227544447.png",
    position: 4,
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
  console.log(`  Category: المكياج → الشفاه → أحمر الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
