/**
 * Essence I Love Flawless Skin Concealer — 3 separate shade products.
 * Sources: makeupcityshop.com
 * Usage: npx tsx scripts/add-essence-i-love-flawless-skin-concealer-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const DESCRIPTION_AR_BASE =
  "كونسيلر آي لوف فلولس سكين من إيسنس — تغطية عالية بلمسة مطفية طبيعية لإخفاء العيوب والاحمرار.\n\n" +
  "• تغطية عالية بلمسة مطفية طبيعية.\n• تركيبة خفيفة وناعمة مريحة على البشرة.\n• مقاوم للماء وثبات طويل.\n• أداة تطبيق مدمجة لسهولة الاستخدام.\n• نباتي.\n• يُطبّق على الهالات والعيوب ويُدمج بالأصابع أو الإسفنجة أو الفرشاة.";

const DESCRIPTION_EN_BASE =
  "Essence I Love Flawless Skin Concealer — high-coverage concealer with a natural matte finish.\n\n" +
  "• High coverage with a natural matte finish.\n• Light, soft and comfortable texture.\n• Waterproof, long-lasting formula.\n• Integrated applicator for easy application.\n• Vegan.\n• Apply to dark circles and imperfections; blend with fingers, a sponge or brush.";

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729447012",
    slug: "essence-i-love-flawless-skin-concealer-30-light-beige",
    price: 6750,
    nameAr: "إيسنس - كونسيلر آي لوف فلولس سكين رقم ٣٠ بيج فاتح ٤ مل",
    nameEn: "Essence - I Love Flawless Skin Concealer 30 Light Beige 4 ml",
    descriptionAr:
      "كونسيلر آي لوف فلولس سكين من إيسنس — درجة ٣٠ بيج فاتح، تغطية عالية بلمسة مطفية طبيعية لإخفاء العيوب والاحمرار.\n\n" +
      DESCRIPTION_AR_BASE.split("\n\n")[1],
    descriptionEn:
      "Essence I Love Flawless Skin Concealer 30 Light Beige — high-coverage concealer with a natural matte finish.\n\n" +
      DESCRIPTION_EN_BASE.split("\n\n")[1],
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/files/a24059729447012.jpg?v=1718953026",
  },
  {
    barcode: "4059729447036",
    slug: "essence-i-love-flawless-skin-concealer-40-dark-beige",
    price: 6750,
    nameAr: "إيسنس - كونسيلر آي لوف فلولس سكين رقم ٤٠ بيج داكن ٤ مل",
    nameEn: "Essence - I Love Flawless Skin Concealer 40 Dark Beige 4 ml",
    descriptionAr:
      "كونسيلر آي لوف فلولس سكين من إيسنس — درجة ٤٠ بيج داكن، تغطية عالية بلمسة مطفية طبيعية لإخفاء العيوب والاحمرار.\n\n" +
      DESCRIPTION_AR_BASE.split("\n\n")[1],
    descriptionEn:
      "Essence I Love Flawless Skin Concealer 40 Dark Beige — high-coverage concealer with a natural matte finish.\n\n" +
      DESCRIPTION_EN_BASE.split("\n\n")[1],
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/files/a24059729447036.jpg?v=1718953028",
  },
  {
    barcode: "4059729447050",
    slug: "essence-i-love-flawless-skin-concealer-50-light-sand",
    price: 6750,
    nameAr: "إيسنس - كونسيلر آي لوف فلولس سكين رقم ٥٠ رملي فاتح ٤ مل",
    nameEn: "Essence - I Love Flawless Skin Concealer 50 Light Sand 4 ml",
    descriptionAr:
      "كونسيلر آي لوف فلولس سكين من إيسنس — درجة ٥٠ رملي فاتح، تغطية عالية بلمسة مطفية طبيعية لإخفاء العيوب والاحمرار.\n\n" +
      DESCRIPTION_AR_BASE.split("\n\n")[1],
    descriptionEn:
      "Essence I Love Flawless Skin Concealer 50 Light Sand — high-coverage concealer with a natural matte finish.\n\n" +
      DESCRIPTION_EN_BASE.split("\n\n")[1],
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/files/a24059729447050.jpg?v=1718953030",
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
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
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
      subcategoryId: FACE,
      tertiaryCategoryId: CONCEALER,
      subcategoryIds: [FACE],
      tertiaryCategoryIds: [CONCEALER],
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
