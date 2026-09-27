/**
 * Elvive + Garnier — 6 new single-SKU hair products (no shades, no images).
 * Note: 33/39 barcodes from the user list already exist in the store.
 * Usage: npx tsx scripts/add-elvive-garnier-batch-6-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  brandAr: string;
  brandEn: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "7509552847550",
    slug: "loreal-elvive-extraordinary-clay-purifying-shampoo-370ml",
    sku: "ELV-ECL-847550",
    price: 5000,
    originalPrice: 5500,
    brandAr: "لوريال باريس إلفيف",
    brandEn: "L'Oreal Paris Elvive",
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف - شامبو Extraordinary Clay المنقي للشعر الدهني 370 مل",
    nameEn: "L'Oreal Paris Elvive Extraordinary Clay Purifying Shampoo 370ml",
    descriptionAr:
      "شامبو لوريال باريس إلفيف Extraordinary Clay — ينقّي فروة الرأس الدهنية ويمتص الزيوت الزائدة.\n\n" +
      "• الطين المنقي ينظّف الجذور دون أن يجفّف الأطراف.\n• يزيل تراكم الزيوت والشوائب.\n• يترك الشعر نظيفاً وخفيفاً ومنتعشاً.\n• مناسب للفروة الدهنية والشعر الذي يتساقط بسرعة.\n• للاستخدام اليومي أو حسب الحاجة.",
    descriptionEn:
      "L'Oreal Paris Elvive Extraordinary Clay Purifying Shampoo — purifies oily scalp and absorbs excess sebum.\n\n" +
      "• Purifying clay cleanses roots without drying ends.\n• Removes oil build-up and impurities.\n• Leaves hair clean, light and refreshed.\n• Ideal for oily scalp and hair that gets greasy quickly.\n• Use daily or as needed.",
  },
  {
    barcode: "7509552817409",
    slug: "loreal-elvive-total-repair-5-extreme-renewing-shampoo-680ml",
    sku: "ELV-TR5-817409",
    price: 9000,
    originalPrice: 10000,
    brandAr: "لوريال باريس إلفيف",
    brandEn: "L'Oreal Paris Elvive",
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "لوريال باريس إلفيف توتال ريبير 5 إكستريم - شامبو إصلاح للشعر المتضرر جداً 680 مل",
    nameEn: "L'Oreal Paris Elvive Total Repair 5 Extreme Renewing Shampoo 680ml",
    descriptionAr:
      "شامبو لوريال باريس إلفيف توتال ريبير 5 إكستريم — إصلاح مكثّف للشعر المتضرر والمتقصف جداً.\n\n" +
      "• مركّب Bio-Ceramide يصلّح الألياف من الداخل.\n• يعالج 5 علامات التلف: التقصف، الخشونة، الجفاف، الهيشان، الضعف.\n• ينظف بلطف ويقوّي الشعر.\n• حجم عائلي 680 مل.\n• مناسب للشعر المتضرر بالصبغ والحرارة والتصفيف.",
    descriptionEn:
      "L'Oreal Paris Elvive Total Repair 5 Extreme Renewing Shampoo — intensive repair for very damaged hair.\n\n" +
      "• Bio-Ceramide complex repairs fibres from within.\n• Targets 5 signs of damage: breakage, roughness, dryness, frizz, weakness.\n• Gently cleanses and strengthens hair.\n• Family size 680ml.\n• Ideal for colour, heat and styling damage.",
  },
  {
    barcode: "3610340687488",
    slug: "garnier-ultra-doux-avocado-shea-nourishing-shampoo-400ml",
    sku: "GRN-UDAS-687488",
    price: 4250,
    originalPrice: 4750,
    brandAr: "غارنييه",
    brandEn: "Garnier",
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - شامبو تغذية عميقة بزيت الأفوكادو وزبدة الشيا للشعر الجاف 400 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Shampoo 400ml",
    descriptionAr:
      "شامبو غارنييه ألترا دو بزيت الأفوكادو وزبدة الشيا — ينظف ويغذّي الشعر الجاف والمجعد.\n\n" +
      "• زيت الأفوكادو يرطّب وزبدة الشيا تغذّي الألياف.\n• ينظف بلطف دون أن يجفّف الشعر.\n• يترك الشعر ناعماً ولامعاً وأسهل في التصفيف.\n• خالٍ من البارابين والسيليكون.\n• مكمّل مثالي لبلسم الأفوكادو وزبدة الشيا.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Shampoo — cleanses and nourishes dry, frizzy hair.\n\n" +
      "• Avocado oil hydrates; shea butter nourishes fibres.\n• Gently cleanses without stripping moisture.\n• Leaves hair soft, shiny and manageable.\n• Paraben-free and silicone-free.\n• Perfect partner to Avocado & Shea Butter Conditioner.",
  },
  {
    barcode: "3610340687662",
    slug: "garnier-ultra-doux-avocado-shea-nourishing-conditioner-400ml",
    sku: "GRN-UDAS-687662",
    price: 6250,
    originalPrice: 7000,
    brandAr: "غارنييه",
    brandEn: "Garnier",
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "غارنييه ألترا دو - بلسم تغذية عميقة بزيت الأفوكادو وزبدة الشيا للشعر الجاف 400 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Conditioner 400ml",
    descriptionAr:
      "بلسم غارنييه ألترا دو بزيت الأفوكادو وزبدة الشيا — يغذّي الشعر الجاف ويسهّل التمشيط.\n\n" +
      "• يغذّي الألياف بعمق ويقلّل التشابك.\n• زيت الأفوكادو وزبدة الشيا ينعّمان الخصلات.\n• يترك الشعر ناعماً ولامعاً.\n• خالٍ من السيليكون.\n• مكمّل مثالي لشامبو الأفوكادو وزبدة الشيا.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Nourishing Conditioner — nourishes dry hair and detangles.\n\n" +
      "• Deeply nourishes fibres and reduces tangling.\n• Avocado oil and shea butter soften strands.\n• Leaves hair soft and shiny.\n• Silicone-free.\n• Perfect partner to Avocado & Shea Butter Shampoo.",
  },
  {
    barcode: "3610340687679",
    slug: "garnier-ultra-doux-avocado-shea-nourishing-leave-in-cream-200ml",
    sku: "GRN-UDAS-687679",
    price: 8500,
    originalPrice: 9500,
    brandAr: "غارنييه",
    brandEn: "Garnier",
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "غارنييه ألترا دو - كريم ليف إن بزيت الأفوكادو وزبدة الشيا بدون شطف 200 مل",
    nameEn: "Garnier Ultra Doux Avocado Oil & Shea Butter Leave-In Cream 200ml",
    descriptionAr:
      "كريم ليف إن غارنييه ألترا دو بزيت الأفوكادو وزبدة الشيا — عناية مستمرة بدون شطف للشعر الجاف.\n\n" +
      "• يغذّي ويحمي الشعر طوال اليوم.\n• زيت الأفوكادو وزبدة الشيا ينعّمان ويرطّبان.\n• يسهّل التصفيف ويقلّل الهيشان.\n• مناسب للشعر الجاف والمجعد.\n• يُطبَّق على الشعر المبلل أو الجاف.",
    descriptionEn:
      "Garnier Ultra Doux Avocado Oil & Shea Butter Leave-In Cream — continuous no-rinse care for dry hair.\n\n" +
      "• Nourishes and protects hair all day.\n• Avocado oil and shea butter soften and hydrate.\n• Eases styling and helps reduce frizz.\n• Ideal for dry and frizzy hair.\n• Apply to damp or dry hair.",
  },
  {
    barcode: "3610340673887",
    slug: "loreal-elvive-glycolic-gloss-leave-in-combing-cream-200ml",
    sku: "ELV-GGL-673887",
    price: 8500,
    originalPrice: 9500,
    brandAr: "لوريال باريس إلفيف",
    brandEn: "L'Oreal Paris Elvive",
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "لوريال باريس إلفيف - كريم تصفيف جليكوليك جلوس بدون شطف 200 مل",
    nameEn: "L'Oreal Paris Elvive Glycolic Gloss Leave-In Combing Cream 200ml",
    descriptionAr:
      "كريم تصفيف لوريال باريس إلفيف جليكوليك جلوس — يلمع الشعر ويسهّل التمشيط بدون شطف.\n\n" +
      "• تركيبة جليكوليك جلوس (~2%) تغلق قشرة الشعر.\n• يمنح معاناً مرآوياً ولمسة ناعمة.\n• حماية من الحرارة والأشعة فوق البنفسجية.\n• يسهّل التصفيف ويقلّل التشابك.\n• يُطبَّق على الشعر المبلل أو الجاف.",
    descriptionEn:
      "L'Oreal Paris Elvive Glycolic Gloss Leave-In Combing Cream — mirror shine and easy detangling, no rinse.\n\n" +
      "• Glycolic gloss complex (~2%) helps seal the cuticle.\n• Delivers mirror shine and a smooth finish.\n• Heat and UV protection.\n• Eases combing and reduces tangling.\n• Apply to damp or dry hair.",
  },
];

let token = "";
const brandCache = new Map<string, string>();

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

async function resolveBrandId(brandAr: string, brandEn: string): Promise<string> {
  const key = `${brandAr}|${brandEn}`;
  const cached = brandCache.get(key);
  if (cached) return cached;

  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr,
    brandEn,
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error(`Could not resolve brand ${brandEn}`);
  brandCache.set(key, brandId);
  return brandId;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  console.log("Logged in.\n");

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${product.barcode}`,
    );
    if (check.exists) {
      console.log(`  skip — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(product.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((p) => p.slug === product.slug)) {
      console.log(`  skip — slug exists (${product.slug})\n`);
      skipped += 1;
      continue;
    }

    const brandId = await resolveBrandId(product.brandAr, product.brandEn);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: CARE,
      subcategoryId: HAIR_CARE,
      tertiaryCategoryId: product.tertiaryCategoryId,
      subcategoryIds: [HAIR_CARE],
      tertiaryCategoryIds: [product.tertiaryCategoryId],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: 0,
      isActive: true,
      imageIds: [] as string[],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | ${product.price} IQD\n`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
