/**
 * Essence — 3 separate eyeliner products.
 * Sources: makeupcityshop.com
 * Usage: npx tsx scripts/add-essence-eyeliners-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";

const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

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

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729254368",
    slug: "essence-24ever-ink-liner-01",
    price: 6250,
    nameAr: "إيسنس - كحل سائل ٢٤ إيفر إنك رقم ٠١",
    nameEn: "Essence - 24Ever Ink Liner 01",
    descriptionAr:
      "كحل سائل ٢٤ إيفر إنك من إيسنس — تركيبة مقاومة للماء وعالية التصبغ تدوم حتى ٢٤ ساعة.\n\n" +
      "• فرشاة فائقة الدقة لخطوط مثالية على الجفن.\n• لون أسود كثيف وثبات طويل.\n• مقاوم للماء والتلطيخ.\n• يجف بسرعة ويمنح إطلالة نظيفة.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على خط الرموش العلوي من الزاوية الداخلية نحو الخارج.",
    descriptionEn:
      "Essence 24Ever Ink Liner 01 — long-lasting, waterproof and highly pigmented liquid eyeliner.\n\n" +
      "• Extra-fine brush draws a perfect line in an instant.\n• Intense black colour with up to 24-hour wear.\n• Waterproof and smudge-resistant formula.\n• Quick-drying for a clean finish.\n• Vegan and cruelty-free.\n• Apply along the upper lash line from inner to outer corner.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/products/4059729254368.jpg?v=1631277604",
  },
  {
    barcode: "4250587772173",
    slug: "essence-eyeliner-pen-waterproof-01-deep-black",
    price: 6000,
    nameAr: "إيسنس - قلم كحل مقاوم للماء رقم ٠١ أسود داكن",
    nameEn: "Essence - Eyeliner Pen Waterproof 01 Deep Black",
    descriptionAr:
      "قلم كحل مقاوم للماء من إيسنس — رأس إسفنجي رفيع يمنح دقة عالية وتحكماً سهلاً لخطوط نظيفة.\n\n" +
      "• تركيبة مقاومة للماء والتلطيخ.\n• لون أسود داكن بلمسة مطفية.\n• رأس إسفنجي رفيع لخطوط دقيقة.\n• ثبات طويل طوال اليوم.\n• خالٍ من العطور، نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على خط الرموش العلوي ويُستخدم لإطلالة الكات آي.",
    descriptionEn:
      "Essence Eyeliner Pen Waterproof 01 Deep Black — slim felt-tip pen for high-precision, long-lasting lines.\n\n" +
      "• Waterproof and smudge-proof matte black formula.\n• Fine felt tip for accurate eyeliner application.\n• Long-lasting wear throughout the day.\n• Skin-friendly formula.\n• Fragrance-free, vegan and cruelty-free.\n• Apply along the upper lash line; build for a winged look.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/products/4250587772173-1.jpg?v=1644907931",
  },
  {
    barcode: "4059729420886",
    slug: "essence-eyeliner-pen-extra-long-lasting-010-blackest-black",
    price: 6000,
    nameAr: "إيسنس - قلم كحل فائق الثبات رقم ٠١٠ أسود غامق ١٫١ مل",
    nameEn: "Essence - Eyeliner Pen Extra Long-lasting 010 Blackest Black 1.1 ml",
    descriptionAr:
      "قلم كحل فائق الثبات من إيسنس — تركيبة سوداء غامقة تدوم حتى ٢٤ ساعة مع رأس فرشاة فائق الدقة.\n\n" +
      "• ثبات يصل إلى ٢٤ ساعة.\n• لون أسود غامق بلمسة مطفية.\n• رأس فرشاة فائق الدقة لخطوط محددة.\n• مقاوم للماء، خالٍ من الزيوت والبارابين.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على خط الرموش العلوي بحركات سلسة من الزاوية الداخلية.",
    descriptionEn:
      "Essence Eyeliner Pen Extra Long-lasting 010 Blackest Black — precise eyeliner with up to 24-hour wear.\n\n" +
      "• Long-lasting finish up to 24 hours.\n• Deep black matte colour.\n• Ultra-fine brush tip for defined lines.\n• Waterproof, oil-free and paraben-free.\n• Vegan and cruelty-free.\n• Glide along the upper lash line from the inner corner outward.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0561/4259/4241/files/s-l1200_760638d0-62a7-42dd-b660-29fc3c32f009.webp?v=1730445318",
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
      subcategoryId: EYES,
      tertiaryCategoryId: EYELINER,
      subcategoryIds: [EYES],
      tertiaryCategoryIds: [EYELINER],
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
