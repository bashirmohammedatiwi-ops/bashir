/**
 * Deborah Milano — 13 separate single-SKU products (no shades).
 * Sources: deborahmilano.com (verified names, images, descriptions)
 * Usage: npx tsx scripts/add-deborah-batch-13-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const NAILS = "84084ccc-f185-499c-8d0b-97d2ba2d0686";
const NAIL_POLISH = "335e8fa7-2ab1-4a3d-894e-607c434898b5";
const NAILS_CARE = "44962225-cca9-4351-818e-a106307de3ac";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";

const DM03 = "https://www.deborahmilano.com/en/wp-content/uploads/2021/03";
const DM01 = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";
const DM24 = "https://www.deborahmilano.com/en/wp-content/uploads/2024/05";
const DM24_08 = "https://www.deborahmilano.com/en/wp-content/uploads/2024/08";
const DM26 = "https://www.deborahmilano.com/en/wp-content/uploads/2026/01";
const DMIT03 = "https://www.deborahmilano.com/it/wp-content/uploads/2021/03";
const DMIT24 = "https://www.deborahmilano.com/it/wp-content/uploads/2024/04";
const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8009518006940",
    slug: "deborah-gel-top-coat",
    sku: "DBR-GTC-MDV000821",
    price: 10000,
    nameAr: "ديبورا ميلانو - طبقة علوية Gel Top Coat",
    nameEn: "Deborah Milano - Gel Top Coat",
    descriptionAr:
      "طبقة علوية Gel Top Coat من ديبورا ميلانو — شفافة وسريعة الجفاف لتأثير جل مثالي.\n\n" +
      "• تُغلق طبقة الطلاء وتمنح لمعاناً extreme.\n" +
      "• مُثراة بمسحوق Diamond Powder.\n" +
      "• بدون حاجة لمصباح UV — تُزال بمزيل طلاء عادي.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Gel Top Coat — transparent quick-drying top coat for a perfect gel-effect manicure.\n\n" +
      "• Seals enamel and delivers extreme shine.\n" +
      "• Enriched with Diamond Powder.\n" +
      "• No UV lamp required — removes with regular nail polish remover.\n" +
      "• 8.5 ml.",
    imageUrl: `${DM03}/0000_MDV000821_GelTopCoat.jpg`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518006964",
    slug: "deborah-nail-and-cuticle-oil",
    sku: "DBR-NCO-MDV000721",
    price: 10000,
    nameAr: "ديبورا ميلانو - زيت أظافر وجلد Nail and Cuticle Oil",
    nameEn: "Deborah Milano - Nail and Cuticle Oil",
    descriptionAr:
      "زيت أظافر وجلد Nail and Cuticle Oil من ديبورا ميلانو.\n\n" +
      "• زيت لوز مركّز يرطّب ويغذّي الأظافر والجلد فوراً.\n" +
      "• مُثرى بزيت الخروع وفيتامينات E وF.\n" +
      "• رائحة لوز حلوة لطيفة مع أداة تطبيق على شكل spatula.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Nail and Cuticle Oil — concentrated almond oil for instant nail and cuticle care.\n\n" +
      "• Hydrates, nourishes and soothes nails and cuticles on contact.\n" +
      "• Enriched with Castor Oil and Vitamins E and F.\n" +
      "• Delicate sweet almond scent with a spatula applicator.\n" +
      "• 8.5 ml.",
    imageUrl: `${DM03}/0001_MDV000721_OlioCuticole.jpg`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518375879",
    slug: "deborah-quick-dry",
    sku: "DBR-QD-010060",
    price: 10000,
    nameAr: "ديبورا ميلانو - طبقة سريعة الجفاف Quick Dry",
    nameEn: "Deborah Milano - Quick Dry",
    descriptionAr:
      "طبقة Quick Dry من ديبورا ميلانو — تجفيف فوري ولمعان عالٍ.\n\n" +
      "• مُثراة بمسحوق Diamond Dust.\n" +
      "• بزيت Sacha Inchi وفيتامين E لأظافر أقوى ومانيكير أطول.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Quick Dry — fast-drying top coat with high gloss finish.\n\n" +
      "• Enriched with diamond dust.\n" +
      "• Sacha Inchi Oil and Vitamin E for stronger nails and longer wear.\n" +
      "• 8.5 ml.",
    imageUrl: `${DM03}/0004_010060_Asciugasmalto.jpg`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518449204",
    slug: "deborah-nail-glow-effect",
    sku: "DBR-NGE-MDV002024",
    price: 10000,
    nameAr: "ديبورا ميلانو - طلاء أظافر Nail Glow Effect",
    nameEn: "Deborah Milano - Nail Glow Effect",
    descriptionAr:
      "طلاء Nail Glow Effect من ديبورا ميلانو — لون وردي ناعم بلمعة طبيعية.\n\n" +
      "• يُنعّم ويُضيء الأظافر ويُبرز لونها الطبيعي.\n" +
      "• زيت الجوجوبا المُغذّي مع AHA ومستخلص Goji.\n" +
      "• يُستخدم وحده.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Nail Glow Effect — soft pink sublimating polish with a luminous finish.\n\n" +
      "• Revives natural nail colour with a healthy glow.\n" +
      "• Nourishing Jojoba Oil with AHA and Goji extract.\n" +
      "• To be used alone.\n" +
      "• 8.5 ml.",
    imageUrl: `${DM24}/MDV002024_dh-smalto-curativo-illuminante-600x600.png`,
    categoryId: NAILS,
    subcategoryId: NAIL_POLISH,
  },
  {
    barcode: "8009518449228",
    slug: "deborah-gel-cuticle-scrub",
    sku: "DBR-GCS-MDV002124",
    price: 10000,
    nameAr: "ديبورا ميلانو - مقشر جل للأظافر والجلد Gel & Cuticle Scrub",
    nameEn: "Deborah Milano - Gel & Cuticle Scrub",
    descriptionAr:
      "مقشر Gel & Cuticle Scrub من ديبورا ميلانو.\n\n" +
      "• يقشّر بلطف ويحمي الجلد المحيط بالأظافر.\n" +
      "• مُثرى بالألوفيرا لتهدئة وحماية الجلد.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Gel & Cuticle Scrub — gentle exfoliating gel for nails and cuticles.\n\n" +
      "• Gently exfoliates and helps protect cuticles from external aggressors.\n" +
      "• Enriched with Aloe Vera for soothing, protective care.\n" +
      "• 8.5 ml.",
    imageUrl: `${DMIT24}/MDV002124_dh-scrub-unghie-e-cuticole-600x600.png`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518006841",
    slug: "deborah-smoothing-base-coat",
    sku: "DBR-SBC-MDV000521",
    price: 10000,
    nameAr: "ديبورا ميلانو - طبقة أساس منعمة Smoothing Base Coat",
    nameEn: "Deborah Milano - Smoothing Base Coat",
    descriptionAr:
      "طبقة أساس Smoothing Base Coat من ديبورا ميلانو.\n\n" +
      "• تملأ التشققات وتُنعّم سطح الظفر فوراً.\n" +
      "• مُعزّزة بمركبات تجديد خلوي وفيتامين E.\n" +
      "• Camu Camu غني بفيتامين C لإشراقة وانتعاش الأظافر.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Smoothing Base Coat — instantly fills uneven nail surfaces.\n\n" +
      "• Smooths the nail bed for a sleek manicure base.\n" +
      "• Cell-regeneration actives and Vitamin E help protect nails.\n" +
      "• Vitamin C-rich Camu Camu for a brightening, revitalising boost.\n" +
      "• 8.5 ml.",
    imageUrl: `${DM03}/0003_MDV000521_Levigante.jpg`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518375794",
    slug: "deborah-hardener",
    sku: "DBR-HRD-010052",
    price: 10000,
    nameAr: "ديبورا ميلانو - مقوّي أظافر Hardener",
    nameEn: "Deborah Milano - Hardener",
    descriptionAr:
      "مقوّي أظافر Hardener من ديبورا ميلانو — شفاف للأظافر الهشة.\n\n" +
      "• Calcium Multimineral Complex وCheratina لتقوية الأظافر.\n" +
      "• زيت الأفوكادو المُغذّي والمُرمّم.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Hardener — clear treatment for nails that tend to peel.\n\n" +
      "• Calcium Multimineral Complex and Keratin for stronger, healthier nails.\n" +
      "• Enriched with Avocado Oil to nourish and repair.\n" +
      "• 8.5 ml.",
    imageUrl: `${DM03}/0007_010052_Indurente-600x600.jpg`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518006889",
    slug: "deborah-whitening-anti-yellow-base",
    sku: "DBR-WAB-MDV000621",
    price: 10000,
    nameAr: "ديبورا ميلانو - طبقة أساس مبيّضة Whitening Anti-Yellow Base",
    nameEn: "Deborah Milano - Whitening Anti-Yellow Base",
    descriptionAr:
      "طبقة أساس Whitening Anti-Yellow Base من ديبورا ميلانو.\n\n" +
      "• تُصحّح اصفرار الأظافر وتُوحّد لونها.\n" +
      "• مستخلصات شجرة الليمون والليمون لترطيب وحماية.\n" +
      "• أظافر أكثر إشراقاً ومظهراً صحياً.\n" +
      "• 8.5 ml.",
    descriptionEn:
      "Deborah Milano Whitening Anti-Yellow Base — brightening treatment for discoloured nails.\n\n" +
      "• Corrects yellowing and evens the nail bed tone.\n" +
      "• Lime Tree and Lemon extracts for hydrating, protective care.\n" +
      "• Visibly brighter, healthier-looking nails.\n" +
      "• 8.5 ml.",
    imageUrl: `${DMIT03}/0002_MDV000621_Sbiancante-600x600.jpg`,
    categoryId: NAILS,
    subcategoryId: NAILS_CARE,
  },
  {
    barcode: "8009518141580",
    slug: "deborah-ultraliner-eyeliner-black",
    sku: "DBR-ULT-014158",
    price: 14000,
    nameAr: "ديبورا ميلانو - آيلاينر Ultraliner Eyeliner Black",
    nameEn: "Deborah Milano - Ultraliner Eyeliner Black",
    descriptionAr:
      "آيلاينر Ultraliner Eyeliner Black من ديبورا ميلانو — سائل عالي الدقة.\n\n" +
      "• رأس felt ناعم لتطبيق سهل ودقيق.\n" +
      "• خاضع لاختبار العيون.\n" +
      "• 2.5 g.",
    descriptionEn:
      "Deborah Milano Ultraliner Eyeliner Black — high-definition liquid eyeliner.\n\n" +
      "• Comfortable felt tip for easy, precise application.\n" +
      "• Ophthalmologist tested.\n" +
      "• 2.5 g.",
    imageUrl: `${DM01}/014158-Eyeliner-Ultraliner.jpg`,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
  },
  {
    barcode: "8009518044225",
    slug: "deborah-24ore-waterproof-eyeliner-black-mat",
    sku: "DBR-24W-MDV000921",
    price: 14000,
    nameAr: "ديبورا ميلانو - آيلاينر 24Ore Waterproof Eyeliner Black Mat",
    nameEn: "Deborah Milano - 24Ore Waterproof Eyeliner Black Mat",
    descriptionAr:
      "آيلاينر 24Ore Waterproof Eyeliner Black Mat من ديبورا ميلانو.\n\n" +
      "• آيلاينر سائل بلمسة نهائية mat سوداء extra black.\n" +
      "• رأس flock فائق الدقة لخطوط رفيعة أو عريضة.\n" +
      "• مقاوم للماء ولا يتلف — ثبات طويل.\n" +
      "• 2.9 g — خاضع لاختبار العيون.",
    descriptionEn:
      "Deborah Milano 24Ore Waterproof Eyeliner Black Mat — liquid liner with an extra-black matte finish.\n\n" +
      "• Ultra-slim flock tip for thin to bold lines.\n" +
      "• Waterproof, transfer-proof and extremely long-lasting.\n" +
      "• 2.9 g — Ophthalmologist tested.",
    imageUrl: `${BROCARD}/8009518044225_1.jpg`,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
  },
  {
    barcode: "8009518252057",
    slug: "deborah-lovemylashes-volume-mascara-black",
    sku: "DBR-LML-005818",
    price: 13000,
    nameAr: "ديبورا ميلانو - ماسكارا LoveMyLashes Volume Mascara Black",
    nameEn: "Deborah Milano - LoveMyLashes Volume Mascara Black",
    descriptionAr:
      "ماسكارا LoveMyLashes Volume Mascara Black من ديبورا ميلانو.\n\n" +
      "• تركيبة volumizing مع Hydra-Lash DH Complex.\n" +
      "• microspheres من silica لحجم فوري وتوزيع متساوٍ.\n" +
      "• بدون عطر — خاضعة لاختبار العيون.\n" +
      "• 13 ml.",
    descriptionEn:
      "Deborah Milano LoveMyLashes Volume Mascara Black — volumising mascara with Hydra-Lash DH Complex.\n\n" +
      "• Silica microspheres wrap lashes for instant volume.\n" +
      "• Flexible film-forming polymers for defined, long-wear lashes.\n" +
      "• Fragrance free — Ophthalmologist tested.\n" +
      "• 13 ml.",
    imageUrl: `${DM01}/005818-Mascara-loveMYlashes-Volume.jpg`,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
  },
  {
    barcode: "8009518491647",
    slug: "deborah-skin-booster-make-up-fixer",
    sku: "DBR-SBMF-MDV040125",
    price: 16500,
    nameAr: "ديبورا ميلانو - سبراي تثبيت Skin Booster Make Up Fixer",
    nameEn: "Deborah Milano - Skin Booster Make Up Fixer",
    descriptionAr:
      "سبراي Skin Booster Make Up Fixer من ديبورا ميلانو — تثبيت وتجديد المكياج.\n\n" +
      "• يُثبّت المكياج ويُنعّم البشرة ويُنعشها طوال اليوم.\n" +
      "• Niacinamide وخلاصة البابونج وحمض الهيالورونيك.\n" +
      "• لمسة نهائية soft-matte طبيعية — مناسب لكل أنواع البشرة.\n" +
      "• 75 ml — خاضع للاختبار الجلدي.",
    descriptionEn:
      "Deborah Milano Skin Booster Make Up Fixer — makeup fixing and perfecting spray.\n\n" +
      "• Sets makeup, revitalises the complexion and ensures longer wear.\n" +
      "• Niacinamide, Chamomile Extract and Hyaluronic Acid.\n" +
      "• Natural soft-matte finish — suitable for all skin types.\n" +
      "• 75 ml — Dermatologist tested.",
    imageUrl: `${DM26}/MDV040125_make-up-fixer-600x600.png`,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
  },
  {
    barcode: "8009518456394",
    slug: "deborah-super-plump-volumizing-gloss",
    sku: "DBR-SPV-MDV009624",
    price: 12500,
    nameAr: "ديبورا ميلانو - جلوس شفاه Super Plump Volumizing Gloss",
    nameEn: "Deborah Milano - Super Plump Volumizing Gloss",
    descriptionAr:
      "جلوس Super Plump Volumizing Gloss من ديبورا ميلانو.\n\n" +
      "• يمنح الشفاه مظهراً أكثر امتلاءً خلال دقائق.\n" +
      "• لون وردي طبيعي لطيف بلمعة عالية.\n" +
      "• Maxi-Lip™ وزيت الزنجبيل ومستخلص الفلفل والكافيين وفيتامينات B3 وE.\n" +
      "• إحساس وخز خفيف — حجم أوضح حتى ساعتين.",
    descriptionEn:
      "Deborah Milano Super Plump Volumizing Gloss — plumping lip gloss with a super-shiny finish.\n\n" +
      "• Makes lips look fuller in just minutes with a delicate natural pink tint.\n" +
      "• Creamy, non-sticky texture with Maxi-Lip™, Ginger Root Oil, Chilli Pepper Extract, Caffeine, Vitamins B3 and E.\n" +
      "• Light tingling sensation — noticeably plumper lips for up to two hours.",
    imageUrl: `${DM24_08}/MDV009624_SuperPLUMP-600x600.png`,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
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

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "ديبورا",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  return brandId;
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  let added = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${product.barcode}`,
    );
    if (check.exists) {
      console.log(`  skip — exists | ${check.product?.nameAr ?? "?"}\n`);
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(product.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((p) => p.slug === product.slug)) {
      console.log(`  skip — slug exists (${product.slug})\n`);
      continue;
    }

    console.log("  uploading image...");
    const imageId = await uploadImage(product.imageUrl, product.slug);

    const payload: Record<string, unknown> = {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    };
    if (product.tertiaryCategoryId) {
      payload.tertiaryCategoryId = product.tertiaryCategoryId;
      payload.tertiaryCategoryIds = [product.tertiaryCategoryId];
    }

    const created = await api<{ id: string }>("/products", "POST", payload);
    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    console.log(`  ✓ ${product.nameEn}`);
    console.log(`    ID: ${created.id} | shades: ${verify.shades?.length ?? 0} | ${product.price} IQD\n`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
