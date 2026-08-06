/**
 * Grigi — 13 separate palette products (no shades, no images).
 * Sources: grigi.gr, epharmadora.com, beautyfree.gr
 * Usage: npx tsx scripts/add-grigi-palettes-batch13-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BRONZER = "209555fb-201d-457f-9ac6-7cf1ea277bff";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HIGHLIGHTER = "7480a30f-ed2b-41a8-9349-dd67edb010b6";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5207042495121",
    slug: "grigi-pro-palette-512-metallic-shimmer-strawberry-paradise",
    sku: "GRG-495121",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Pro Palette No 512 Metallic & Shimmer Strawberry Paradise (5 ألوان)",
    nameEn: "Grigi - Pro Palette No 512 Metallic & Shimmer Eyeshadow Strawberry Paradise (5 Shades)",
    descriptionAr:
      "باليت ظلال عيون Pro Palette No 512 Strawberry Paradise من غريغي — 5 درجات معدنية ولامعة بألوان الفراولة الدافئة.\n\n" +
      "• خمس درجات بإنهاء satin وmetallic ناعمة وثابتة طوال اليوم.\n" +
      "• تطبيق سهل ومتساوٍ يمنح العين إشراقة طبيعية.\n" +
      "• مثالية للإطلالات اليومية والمسائية.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Palette No 512 Metallic & Shimmer Eyeshadow Strawberry Paradise — 5 warm strawberry-toned metallic and shimmer shades.\n\n" +
      "• Five soft satin and metallic shades with long-lasting wear.\n" +
      "• Easy, even application for a fresh, radiant eye look.\n" +
      "• Perfect for day and evening makeup.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042495039",
    slug: "grigi-pro-palette-503-metallic-shimmer-fuchsia-gold",
    sku: "GRG-495039",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Pro Palette No 503 Metallic & Shimmer Fuchsia & Gold (5 ألوان)",
    nameEn: "Grigi - Pro Palette No 503 Metallic & Shimmer Eyeshadow Fuchsia & Gold (5 Shades)",
    descriptionAr:
      "باليت ظلال عيون Pro Palette No 503 Fuchsia & Gold من غريغي — 5 درجات فوشيا وذهبي معدنية ولامعة.\n\n" +
      "• ألوان جريئة بلمعة معدنية وإشراقة عالية.\n" +
      "• قوام ناعم يثبت طوال اليوم دون بهتان.\n" +
      "• مثالية لإطلالة عيون جذابة ومشرقة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Palette No 503 Metallic & Shimmer Eyeshadow Fuchsia & Gold — 5 bold fuchsia and gold metallic shimmer shades.\n\n" +
      "• High-impact metallic colour with radiant shine.\n" +
      "• Soft texture stays vibrant all day.\n" +
      "• Ideal for glamorous, eye-catching looks.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042495022",
    slug: "grigi-pro-palette-502-metallic-shimmer-cinnamon",
    sku: "GRG-495022",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Pro Palette No 502 Metallic & Shimmer Cinnamon (5 ألوان)",
    nameEn: "Grigi - Pro Palette No 502 Metallic & Shimmer Eyeshadow Cinnamon (5 Shades)",
    descriptionAr:
      "باليت ظلال عيون Pro Palette No 502 Cinnamon من غريغي — 5 درجات قرفة دافئة معدنية ولامعة.\n\n" +
      "• ألوان ترابية دافئة تناسب جميع ألوان البشرة.\n" +
      "• إنهاء satin وmetallic ناعم وثابت.\n" +
      "• مثالية للإطلالات الطبيعية والسموكي الخفيف.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Palette No 502 Metallic & Shimmer Eyeshadow Cinnamon — 5 warm cinnamon-toned metallic shimmer shades.\n\n" +
      "• Warm earthy tones that flatter all skin tones.\n" +
      "• Soft satin and metallic finish with long wear.\n" +
      "• Perfect for natural and soft smoky looks.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042495138",
    slug: "grigi-pro-palette-513-metallic-shimmer-copper-paradise",
    sku: "GRG-495138",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Pro Palette No 513 Metallic & Shimmer The Copper Paradise (5 ألوان)",
    nameEn: "Grigi - Pro Palette No 513 Metallic & Shimmer Eyeshadow The Copper Paradise (5 Shades)",
    descriptionAr:
      "باليت ظلال عيون Pro Palette No 513 The Copper Paradise من غريغي — 5 درجات نحاسية معدنية ولامعة.\n\n" +
      "• درجات نحاسية دافئة بلمعة معدنية فاخرة.\n" +
      "• قوام ناعم يثبت طوال اليوم ويمنح العين لمعاناً طبيعياً.\n" +
      "• مثالية للإطلالات الكهرمانية والمسائية.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Palette No 513 Metallic & Shimmer Eyeshadow The Copper Paradise — 5 warm copper metallic shimmer shades.\n\n" +
      "• Luxurious copper tones with rich metallic shine.\n" +
      "• Soft texture with all-day wear and natural radiance.\n" +
      "• Ideal for warm amber and evening eye looks.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042495060",
    slug: "grigi-pro-palette-eyebrow-506",
    sku: "GRG-495060",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    nameAr: "غريغي - باليت ظلال حواجب Pro Palette Eyebrow No 506",
    nameEn: "Grigi - Pro Palette Eyebrow No 506",
    descriptionAr:
      "باليت ظلال حواجب Pro Palette Eyebrow No 506 من غريغي — لملء وتكثيف وتحديد الحواجب بمظهر طبيعي.\n\n" +
      "• يملأ الفراغات ويضيف طولاً وحجماً للحواجب.\n" +
      "• يخلق ظلاً تحت شعر الحاجب لمظهر أكثر كثافة.\n" +
      "• تطبيق سهل ونتيجة طبيعية أنيقة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Palette Eyebrow No 506 — eyebrow shadow palette to fill, define and add volume.\n\n" +
      "• Fills gaps and adds length and fullness to brows.\n" +
      "• Creates shadow beneath hairs for a thicker appearance.\n" +
      "• Easy application with a natural, polished finish.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042495053",
    slug: "grigi-pro-palette-505-metallic-shimmer-pastel-paradise",
    sku: "GRG-495053",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Pro Palette No 505 Metallic & Shimmer Pastel Paradise (5 ألوان)",
    nameEn: "Grigi - Pro Palette No 505 Metallic & Shimmer Eyeshadow Pastel Paradise (5 Shades)",
    descriptionAr:
      "باليت ظلال عيون Pro Palette No 505 Pastel Paradise من غريغي — 5 درجات باستيل معدنية ولامعة.\n\n" +
      "• ألوان باستيل ناعمة بلمعة خفيفة وأنيقة.\n" +
      "• قوام ناعم يثبت طوال اليوم ويمنح العين إشراقة رقيقة.\n" +
      "• مثالية للإطلالات الربيعية واليومية الناعمة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Palette No 505 Metallic & Shimmer Eyeshadow Pastel Paradise — 5 soft pastel metallic shimmer shades.\n\n" +
      "• Delicate pastel tones with a subtle elegant shimmer.\n" +
      "• Soft texture with long wear and a refined glow.\n" +
      "• Perfect for soft spring and everyday looks.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042710040",
    slug: "grigi-palette-pro-10-colours-04-green-paradise",
    sku: "GRG-710040",
    price: 12500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Palette Pro 10 Colours No 04 The Green Paradise",
    nameEn: "Grigi - Palette Pro 10 Colours No 04 The Green Paradise",
    descriptionAr:
      "باليت ظلال عيون Palette Pro 10 Colours No 04 The Green Paradise من غريغي — 10 درجات خضراء وذهبية.\n\n" +
      "• 10 درجات matte وsatin وmetallic بألوان الطبيعة.\n" +
      "• صبغات لؤلؤية فاخرة بلمعة عالية الأداء.\n" +
      "• قوام خفيف سهل الدمج — من الأخضر المعدني إلى الزيتوني الداكن.\n" +
      "• إصدار احتفالي بمناسبة 10 سنوات من غريغي.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Palette Pro 10 Colours No 04 The Green Paradise — 10 green and gold eyeshadow shades.\n\n" +
      "• 10 matte, satin and metallic shades inspired by nature.\n" +
      "• Luxurious pearl pigments with high-performance shine.\n" +
      "• Lightweight, blendable formula from metallic green to dark olive.\n" +
      "• Anniversary edition celebrating 10 years of Grigi.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042710033",
    slug: "grigi-palette-pro-10-colours-03-pink-coral-paradise",
    sku: "GRG-710033",
    price: 12500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Palette Pro 10 Colours No 03 The Pink and Coral Paradise",
    nameEn: "Grigi - Palette Pro 10 Colours No 03 The Pink and Coral Paradise",
    descriptionAr:
      "باليت ظلال عيون Palette Pro 10 Colours No 03 The Pink and Coral Paradise من غريغي — 10 درجات وردية ومرجانية.\n\n" +
      "• 10 درجات matte وsatin وmetallic بألوان الوردي والكورالي.\n" +
      "• صبغات لؤلؤية فاخرة بلمعة عالية الأداء.\n" +
      "• قوام خفيف سهل الدمج — من الكورالي الفاتح إلى الوردي المعدني الداكن.\n" +
      "• إصدار احتفالي بمناسبة 10 سنوات من غريغي.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Palette Pro 10 Colours No 03 The Pink and Coral Paradise — 10 pink and coral eyeshadow shades.\n\n" +
      "• 10 matte, satin and metallic pink and coral tones.\n" +
      "• Luxurious pearl pigments with high-performance shine.\n" +
      "• Lightweight, blendable formula from light coral to dark metallic pink.\n" +
      "• Anniversary edition celebrating 10 years of Grigi.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042430016",
    slug: "grigi-pro-multi-palette-trio-01-coral-paradise",
    sku: "GRG-430016",
    price: 11500,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BRONZER,
    nameAr: "غريغي - باليت وجه Pro Multi Palette Trio No 01 Coral Paradise (برونزر + بلاشر + هايلايتر)",
    nameEn: "Grigi - Pro Multi Palette Trio No 01 Coral Paradise (Bronzer + Blush + Highlighter)",
    descriptionAr:
      "باليت وجه Pro Multi Palette Trio No 01 Coral Paradise من غريغي — 3 درجات متكاملة للوجه.\n\n" +
      "• برونزر وبلاشر وهايلايتر بألوان مرجانية متناسقة.\n" +
      "• لنحت الوجه وإضافة لون وإشراقة طبيعية.\n" +
      "• قابلة للدمج معاً أو استخدام كل درجة على حدة.\n" +
      "• مثالية لإطلالة وجه منحوتة ومتألقة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Multi Palette Trio No 01 Coral Paradise — 3-in-1 face palette.\n\n" +
      "• Coordinated bronzer, blusher and highlighter in coral tones.\n" +
      "• Sculpts, adds colour and natural radiance to the face.\n" +
      "• Blend together or use each shade separately.\n" +
      "• Perfect for a sculpted, glowing complexion.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042430030",
    slug: "grigi-pro-multi-palette-trio-03-bronzing-paradise",
    sku: "GRG-430030",
    price: 11500,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BRONZER,
    nameAr: "غريغي - باليت وجه Pro Multi Palette Trio No 03 Bronzing Paradise (3 درجات برونزر)",
    nameEn: "Grigi - Pro Multi Palette Trio No 03 Bronzing Paradise (3 Bronzer Shades)",
    descriptionAr:
      "باليت وجه Pro Multi Palette Trio No 03 Bronzing Paradise من غريغي — 3 درجات برونزر متقنة.\n\n" +
      "• ثلاث درجات برونزر مختارة بعناية لإطلالة برونزية مثالية.\n" +
      "• لنحت الوجه وإضافة دفء وعمق طبيعي.\n" +
      "• قابلة للدمج معاً أو استخدام كل درجة على حدة.\n" +
      "• مثالية لمظهر مشمس ومنحوت أنيق.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Multi Palette Trio No 03 Bronzing Paradise — 3 carefully selected bronzer shades.\n\n" +
      "• Three bronzer tones for the perfect sun-kissed look.\n" +
      "• Sculpts the face with natural warmth and depth.\n" +
      "• Blend together or use each shade separately.\n" +
      "• Ideal for an elegant bronzed, contoured finish.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042430061",
    slug: "grigi-pro-multi-palette-trio-06-pink-highlighter-paradise",
    sku: "GRG-430061",
    price: 11500,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: POWDER_HIGHLIGHTER,
    nameAr: "غريغي - باليت وجه Pro Multi Palette Trio No 06 Pink Highlighter Paradise (3 درجات هايلايتر وردي)",
    nameEn: "Grigi - Pro Multi Palette Trio No 06 Pink Highlighter Paradise (3 Pink Highlighter Shades)",
    descriptionAr:
      "باليت وجه Pro Multi Palette Trio No 06 Pink Highlighter Paradise من غريغي — 3 درجات هايلايتر وردي.\n\n" +
      "• ثلاث درجات هايلايتر وردي بلمعة طبيعية ومشرقة.\n" +
      "• قوام حريري سهل التطبيق والدمج.\n" +
      "• ثبات طويل الأمد لإشراقة تدوم طوال اليوم.\n" +
      "• قابلة للاستخدام منفردة أو معاً لإطلالات متنوعة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Multi Palette Trio No 06 Pink Highlighter Paradise — 3 pink highlighter shades.\n\n" +
      "• Three pink highlighter tones for a natural, radiant glow.\n" +
      "• Silky texture for easy application and blending.\n" +
      "• Long-lasting formula for all-day luminosity.\n" +
      "• Use alone or combined for versatile highlighting.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042543013",
    slug: "grigi-palette-premium-pro-301-matte-paradise",
    sku: "GRG-543013",
    price: 18500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Premium Pro No 301 The Matte Paradise (12 لون مطفي)",
    nameEn: "Grigi - Palette Premium Pro No 301 The Matte Paradise (12 Matte Shades)",
    descriptionAr:
      "باليت ظلال عيون Premium Pro No 301 The Matte Paradise من غريغي — 12 درجة مطفية فاخرة.\n\n" +
      "• 12 درجة matte مستوحاة من درجات البشرة الطبيعية.\n" +
      "• من الأبيض الناعم إلى الأسود الداكن — تغطية قابلة للبناء.\n" +
      "• قوام كريمي مطفي سهل الدمج وثبات عالٍ.\n" +
      "• مثالية للإطلالات الطبيعية والسموكي الاحترافية.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Palette Premium Pro No 301 The Matte Paradise — 12 premium matte eyeshadow shades.\n\n" +
      "• 12 matte shades inspired by natural skin tones.\n" +
      "• From soft white to deep black — buildable coverage.\n" +
      "• Creamy matte formula blends effortlessly with superior adherence.\n" +
      "• Perfect for natural and professional smoky looks.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042543020",
    slug: "grigi-palette-premium-pro-302-metallic-paradise",
    sku: "GRG-543020",
    price: 18500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Premium Pro No 302 The Metallic Paradise (12 لون معدني)",
    nameEn: "Grigi - Palette Premium Pro No 302 The Metallic Paradise (12 Metallic Shades)",
    descriptionAr:
      "باليت ظلال عيون Premium Pro No 302 The Metallic Paradise من غريغي — 12 درجة معدنية فاخرة.\n\n" +
      "• 12 درجة metallic مستوحاة من ألوان الطبيعة.\n" +
      "• من الإطلالات الطبيعية إلى الدرامية — تغطية غنية.\n" +
      "• قوام كريمي ينزلق بسلاسة ويلتصق بالجفن.\n" +
      "• صبغات لؤلؤية فاخرة بلمعة عالية الأداء.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Palette Premium Pro No 302 The Metallic Paradise — 12 premium metallic eyeshadow shades.\n\n" +
      "• 12 metallic shades inspired by colours found in nature.\n" +
      "• From natural to dramatic looks — rich colour payoff.\n" +
      "• Creamy formula glides on and melts into the lids.\n" +
      "• Luxurious pearl pigments with high-performance shine.\n" +
      "• Made in Greece.",
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
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "غريغي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  const brandId = await resolveBrandId();

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    if (await barcodeExists(product.barcode)) {
      console.log(`  skip — barcode already exists\n`);
      skipped += 1;
      continue;
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryId: product.tertiaryCategoryId,
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds: [] as string[],
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
