/**
 * Essence Soft Touch Bouncy — 3 separate barcode products (no shades).
 * Sources:
 * - https://www.haar-shop.ch/en/67470377-1-soft-touch-bouncy-glow.html#232=55881
 * - https://www.haar-shop.ch/en/67470423-1-soft-touch-bouncy-blush.html#232=55949
 * - https://www.haar-shop.ch/en/67470423-1-soft-touch-bouncy-blush.html#232=55946
 * Usage: npx tsx scripts/add-essence-soft-touch-bouncy-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const LIQUID_HIGHLIGHTER = "6fed608e-80d7-4449-9427-fc2848b091be";

const GLOW_DESC_AR =
  "هايلايتر سوفت توتش بونسي جلو من إيسنس — قوام مرن مبتكر يتحول عند التطبيق إلى لمسة حريرية بودرية مع توهج شفاف كالزجاج.\n\n" +
  "• قوام كريمي يتحول إلى بودرة بلمسة خفيفة.\n• لمسة لامعة بتغطية خفيفة وإشراقة طبيعية.\n• رائحة فانيلا خفيفة.\n• خالٍ من البارابين والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق بالأصابع على أعلى نقاط الوجه مثل عظام الخد وجسر الأنف وتحت الحاجب.";
const GLOW_DESC_EN =
  "Essence Soft Touch Bouncy Glow — innovative springy texture that transforms into a silky-powdery finish for a transparent, glass-like glow.\n\n" +
  "• Cream-to-powder texture with a light finish.\n• Shiny finish with light coverage and natural radiance.\n• Subtle vanilla scent.\n• Vegan, paraben-free, gluten-free and lactose-free.\n• Apply with your fingers to cheekbones, bridge of the nose and under the brows.";

const BLUSH_DESC_AR =
  "بلاشر سوفت توتش بونسي من إيسنس — قوام كريمي ناعم يتحول عند التطبيق إلى لمسة بودرية حريرية مع لون غني قابل للبناء.\n\n" +
  "• قوام كريمي يتحول إلى بودرة مع إحساس مريح عند اللمس.\n• تركيبة طويلة الثبات وعالية التصبغ سهلة التحكم.\n• لمسة مطفية ناعمة ومتجانسة.\n• خالٍ من البارابين والعطور والكحول والزيت والغلوتين واللاكتوز.\n• نباتي.\n• يُطبّق بالأصابع أو الفرشاة حسب الإطلالة المطلوبة من ناعمة إلى جريئة.";
const BLUSH_DESC_EN =
  "Essence Soft Touch Bouncy Blush — smooth creamy texture that transforms into a silky powder finish with buildable, highly pigmented colour.\n\n" +
  "• Smooth cream-to-powder texture with a special caring sensation.\n• Long-lasting, easy-to-dose, highly pigmented formula.\n• Matte finish for a smooth, seamless look.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free, gluten-free and lactose-free.\n• Apply with fingertips or a brush from soft and natural to bold and radiant.";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729542397",
    slug: "essence-soft-touch-bouncy-glow-20-glazed-dew",
    price: 5250,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    nameAr: "إيسنس - هايلايتر سوفت توتش بونسي جلو رقم ٢٠ جليزد ديو",
    nameEn: "Essence - Soft Touch Bouncy Glow 20 Glazed Dew",
    descriptionAr: GLOW_DESC_AR,
    descriptionEn: GLOW_DESC_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/2/b20debfe7b5e27e1bef8360c2816ee3aab259bb3_4059729542397_bi_essence_soft_touch_bouncy_glow_20_glazed_dew.jpg",
  },
  {
    barcode: "4059729546975",
    slug: "essence-soft-touch-bouncy-blush-30-exotic-daisy",
    price: 5000,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "إيسنس - بلاشر سوفت توتش بونسي رقم ٣٠ إكزوتيك ديزي",
    nameEn: "Essence - Soft Touch Bouncy Blush 30 Exotic Daisy",
    descriptionAr: BLUSH_DESC_AR,
    descriptionEn: BLUSH_DESC_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/c/4c91c646292337b0c3e542e7f8a8d5867b3c44dc_4059729546975_bi_essence_soft_touch_bouncy_blush_30_exotic_daisy.jpg",
  },
  {
    barcode: "4059729546951",
    slug: "essence-soft-touch-bouncy-blush-20-electric-peony",
    price: 5000,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    nameAr: "إيسنس - بلاشر سوفت توتش بونسي رقم ٢٠ إلكتريك بيوني",
    nameEn: "Essence - Soft Touch Bouncy Blush 20 Electric Peony",
    descriptionAr: BLUSH_DESC_AR,
    descriptionEn: BLUSH_DESC_EN,
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/8/3/83b36ff3eac93f3f7c5420c2ea33663ca4d3bd10_4059729546951_bi_essence_soft_touch_bouncy_blush_20_electric_peony.jpg",
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
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let added = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const check = await api<{ exists: boolean; product?: { nameAr?: string; id?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(p.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((row) => row.slug === p.slug)) {
      console.log(`skip ${p.barcode} — slug exists (${p.slug})`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId: BRAND_ID,
      categoryId: CATEGORY_ID,
      subcategoryId: p.subcategoryId,
      tertiaryCategoryId: p.tertiaryCategoryId,
      subcategoryIds: [p.subcategoryId],
      tertiaryCategoryIds: [p.tertiaryCategoryId],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: p.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    });

    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
