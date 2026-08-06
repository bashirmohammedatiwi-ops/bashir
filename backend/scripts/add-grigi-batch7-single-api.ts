/**
 * Grigi — 7 separate products (no shades, no images).
 * Sources: grigi.gr, epharmadora.com, beautyfree.gr, aromaoneirou.gr
 * Usage: npx tsx scripts/add-grigi-batch7-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";

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
    barcode: "5207042710019",
    slug: "grigi-palette-pro-10-colours-01-beige-brown-smokey",
    sku: "GRG-710019",
    price: 12500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Palette Pro 10 Colours No 01 The Beige Brown Smokey",
    nameEn: "Grigi - Palette Pro 10 Colours No 01 The Beige Brown Smokey",
    descriptionAr:
      "باليت ظلال عيون Palette Pro 10 Colours No 01 The Beige Brown Smokey من غريغي — 10 درجات بيج وبني للإطلالة السموكي الأنيقة.\n\n" +
      "• 10 درجات matte وsatin وmetallic بألوان بيج وبني دافئة.\n" +
      "• من الإطلالات الطبيعية الناعمة إلى السموكي الجريء — قابلة للبناء.\n" +
      "• قوام كريمي ناعم سهل الدمج وثبات عالٍ.\n" +
      "• إصدار احتفالي بمناسبة 10 سنوات من غريغي.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Palette Pro 10 Colours No 01 The Beige Brown Smokey — 10 beige and brown eyeshadow shades for elegant smoky looks.\n\n" +
      "• 10 matte, satin and metallic warm beige and brown tones.\n" +
      "• From soft natural looks to bold smoky eyes — buildable coverage.\n" +
      "• Soft creamy texture blends effortlessly with long wear.\n" +
      "• Anniversary edition celebrating 10 years of Grigi.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042710026",
    slug: "grigi-palette-pro-10-colours-02-blues-purple-paradise",
    sku: "GRG-710026",
    price: 12500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    nameAr: "غريغي - باليت ظلال عيون Palette Pro 10 Colours No 02 The Blues & Purple Paradise",
    nameEn: "Grigi - Palette Pro 10 Colours No 02 The Blues & Purple Paradise",
    descriptionAr:
      "باليت ظلال عيون Palette Pro 10 Colours No 02 The Blues & Purple Paradise من غريغي — 10 درجات أزرق وبنفسجي.\n\n" +
      "• 10 درجات matte وsatin وmetallic بألوان الأزرق والبنفسجي والذهبي الوردي.\n" +
      "• صبغات لؤلؤية فاخرة بلمعة عالية الأداء.\n" +
      "• قوام خفيف سهل الدمج — من الأزرق المعدني إلى البنفسجي الداكن.\n" +
      "• إصدار احتفالي بمناسبة 10 سنوات من غريغي.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Palette Pro 10 Colours No 02 The Blues & Purple Paradise — 10 blue and purple eyeshadow shades.\n\n" +
      "• 10 matte, satin and metallic blue, purple and rose-gold tones.\n" +
      "• Luxurious pearl pigments with high-performance shine.\n" +
      "• Lightweight, blendable formula from metallic blue to dark purple.\n" +
      "• Anniversary edition celebrating 10 years of Grigi.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042050177",
    slug: "grigi-miracle-mattifying-powder-pro",
    sku: "GRG-050177",
    price: 10500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    nameAr: "غريغي - بودرة مطفية Miracle Mattifying Powder Pro",
    nameEn: "Grigi - Miracle Mattifying Powder Pro",
    descriptionAr:
      "بودرة مطفية Miracle Mattifying Powder Pro من غريغي — لبشرة ناعمة ومطفية طوال اليوم.\n\n" +
      "• قوام خفيف كريمي ينزلق بسلاسة ويصحّح العيوب فوراً.\n" +
      "• تُطبّق فوق المكياج أو كبرايمر لامتصاص اللمعان.\n" +
      "• إنهاء مطفي ناعم يدوم لساعات.\n" +
      "• مناسبة للبشرة الدهنية والمختلطة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Miracle Mattifying Powder Pro — for flawless matte skin that lasts all day.\n\n" +
      "• Lightweight creamy texture glides on smoothly and blurs imperfections instantly.\n" +
      "• Apply over makeup or as a primer to absorb shine in one swipe.\n" +
      "• Soft matte finish that stays fresh for hours.\n" +
      "• Suitable for oily and combination skin.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042100100",
    slug: "grigi-eyebrow-pomade-pro",
    sku: "GRG-100100",
    price: 9500,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    nameAr: "غريغي - بوماد حواجب Eyebrow Pomade Pro",
    nameEn: "Grigi - Eyebrow Pomade Pro",
    descriptionAr:
      "بوماد حواجب Eyebrow Pomade Pro من غريغي — لتحديد وملء وتشكيل الحواجب بثبات عالٍ.\n\n" +
      "• تركيبة كريمية غنية بلون ثابت طوال اليوم.\n" +
      "• يملأ الفراغات ويمنح الحواجب مظهراً أكثر كثافة وتحديداً.\n" +
      "• سهل التطبيق والدمج بفرشاة حواجب.\n" +
      "• مثالي لإطلالة حواجب منحوتة وطبيعية.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Eyebrow Pomade Pro — define, fill and shape brows with long-lasting wear.\n\n" +
      "• Rich creamy formula with all-day colour payoff.\n" +
      "• Fills gaps for fuller, more defined brows.\n" +
      "• Easy to apply and blend with a brow brush.\n" +
      "• Perfect for sculpted, natural-looking eyebrows.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042550011",
    slug: "grigi-skin-perception-perfectioner-oil-base-30ml",
    sku: "GRG-550011",
    price: 14000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "غريغي - زيت أساس الوجه The Skin Perception Perfectioner Oil Base 30 مل",
    nameEn: "Grigi - The Skin Perception Perfectioner Oil Base 30ml",
    descriptionAr:
      "زيت أساس الوجه The Skin Perception Perfectioner Oil Base من غريغي — قاعدة مثالية قبل المكياج.\n\n" +
      "• زيت خفيف غير دهني يُجفف فوراً ويمنح البشرة نعومة وترطيباً.\n" +
      "• يخلق طبقة رقيقة متجانسة — أساس مثالي للمكياج.\n" +
      "• بزيت الأرغان والقنب العضوي وزيت الورد Mosqueta وزيت عباد الشمس.\n" +
      "• تركيبة vegan-friendly.\n" +
      "• 30 مل — صُنع في اليونان.",
    descriptionEn:
      "Grigi The Skin Perception Perfectioner Oil Base — the perfect pre-makeup skin base.\n\n" +
      "• Lightweight non-greasy oil that dries instantly for smooth, hydrated skin.\n" +
      "• Creates a thin, even film — ideal foundation for makeup application.\n" +
      "• With argan oil, organic hemp seed oil, rosehip oil and sunflower oil.\n" +
      "• Vegan-friendly formula.\n" +
      "• 30ml — Made in Greece.",
  },
  {
    barcode: "5207042520038",
    slug: "grigi-sun-perception-face-cream-spf50-50ml",
    sku: "GRG-520038",
    price: 18500,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "غريغي - كريم واقي شمس The Sun Perception Face Cream SPF50 50 مل",
    nameEn: "Grigi - The Sun Perception Face Cream SPF50 50ml",
    descriptionAr:
      "كريم واقي شمس The Sun Perception Face Cream SPF50 من غريغي — حماية عالية بدون لون.\n\n" +
      "• حماية واسعة الطيف من أشعة UVA وUVB — SPF50.\n" +
      "• مُعزّز بحمض الهيالورونيك والبانثينول وفيتامين E وزيت اللوز.\n" +
      "• يحمي من الشيخوخة الضوئية ويرطّب بعمق.\n" +
      "• مقاوم للماء — تركيبة vegan-friendly.\n" +
      "• 50 مل — صُنع في اليونان.",
    descriptionEn:
      "Grigi The Sun Perception Face Cream SPF50 — high protection clear sunscreen.\n\n" +
      "• Broad-spectrum UVA and UVB protection — SPF50.\n" +
      "• Enriched with hyaluronic acid, panthenol, vitamin E and almond oil.\n" +
      "• Protects against photoaging with deep hydration.\n" +
      "• Water-resistant — vegan-friendly formula.\n" +
      "• 50ml — Made in Greece.",
  },
  {
    barcode: "5207042520014",
    slug: "grigi-sun-perception-tinted-face-cream-spf50-50ml",
    sku: "GRG-520014",
    price: 18500,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "غريغي - كريم واقي شمس ملوّن The Sun Perception Tinted Face Cream SPF50 50 مل",
    nameEn: "Grigi - The Sun Perception Tinted Face Cream SPF50 50ml",
    descriptionAr:
      "كريم واقي شمس ملوّن The Sun Perception Tinted Face Cream SPF50 من غريغي — حماية وتغطية بلون موحّد.\n\n" +
      "• حماية واسعة الطيف من أشعة UVA وUVB — SPF50 مع لون طبيعي.\n" +
      "• مُعزّز بحمض الهيالورونيك والبانثينول وفيتامين E وزيت اللوز.\n" +
      "• يوحّد لون البشرة ويمنح إشراقة ونعومة طوال اليوم.\n" +
      "• مقاوم للماء — تركيبة vegan-friendly.\n" +
      "• 50 مل — صُنع في اليونان.",
    descriptionEn:
      "Grigi The Sun Perception Tinted Face Cream SPF50 — sun protection with natural-looking coverage.\n\n" +
      "• Broad-spectrum UVA and UVB protection — SPF50 with a natural tint.\n" +
      "• Enriched with hyaluronic acid, panthenol, vitamin E and almond oil.\n" +
      "• Evens skin tone with a fresh, radiant finish all day.\n" +
      "• Water-resistant — vegan-friendly formula.\n" +
      "• 50ml — Made in Greece.",
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
