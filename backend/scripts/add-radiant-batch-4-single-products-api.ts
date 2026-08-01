/**
 * Radiant Professional — 4 separate single-SKU products.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-batch-4-single-products-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";

const MAKEUP_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const MAKEUP_FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  categoryLabel: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5201641723531",
    slug: "radiant-professional-24hr-cream-spf15",
    price: 24000,
    categoryId: CARE_ID,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    categoryLabel: "العناية → الوجه → مرطب الوجه",
    nameAr: "راديانت بروفيشنال - كريم ٢٤ ساعة بي إف ١٥",
    nameEn: "Radiant Professional - 24HR Cream SPF 15",
    descriptionAr:
      "كريم ٢٤ ساعة بي إف ١٥ من راديانت بروفيشنال — ترطيب يدوم طوال اليوم مع حماية من أشعة الشمس ومكافحة علامات التقدّم في السن.\n\n" +
      "• تركيبة فريدة بببتيدات تعزز مرونة البشرة وتحسّن لونها.\n• فيتامين إي يحمي من الجذور الحرة ويدعم تجدد خلايا البشرة.\n• حماية بي إف ١٥ من الأشعة فوق البنفسجية.\n• يرطب البشرة ويحافظ على نعومتها طوال اليوم.\n• مناسب للاستخدام اليومي صباحاً ومساءً.\n• يُطبّق على وجه وعنق نظيفين يومياً صباحاً ومساءً.",
    descriptionEn:
      "Radiant Professional 24HR Cream SPF 15 — all-day hydration with sun protection and anti-ageing care.\n\n" +
      "• Unique peptide complex to promote elasticity and improve skin tone.\n• Vitamin E shields against free radicals and supports healthy skin cell renewal.\n• SPF 15 protection against harmful UV rays.\n• Keeps skin hydrated and comfortable all day long.\n• Suitable for daily morning and evening use.\n• Apply daily, morning and evening on clean face and neck.",
    imageUrl: "https://radiant-professional.com/media/images/products/2023/03/5201641723531_1.jpg",
  },
  {
    barcode: "5201641728567",
    slug: "radiant-professional-visible-rejuvenation-botox-radiance-effect",
    price: 49000,
    categoryId: CARE_ID,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    categoryLabel: "العناية → الوجه → مرطب الوجه",
    nameAr: "راديانت بروفيشنال - كريم تجديد مرئي بتأثير الإشراقة",
    nameEn: "Radiant Professional - Visible Rejuvenation Botox & Radiance Effect",
    descriptionAr:
      "كريم تجديد مرئي بتأثير الإشراقة من راديانت بروفيشنال — عناية مكثّفة لمكافحة التجاعيد وشد البشرة وإعادة إشراقتها دون إجراءات طبية.\n\n" +
      "• مركّب ببتيدات يخفّف انقباضات العضلات المسببة لخطوط التعبير.\n• مستخلص نبات البوليغونوم أفيكولاري يعزز شد البشرة ومرونتها.\n• يحسّن تماسك البشرة ويمنحها إشراقة طبيعية.\n• تركيبة غنية ترطّب وتغذّي البشرة بعمق.\n• مناسب للاستخدام اليومي صباحاً ومساءً.\n• يُطبّق بحركات تصاعدية خفيفة على بشرة نظيفة مع التركيز على الجبهة وحول العينين والفم.",
    descriptionEn:
      "Radiant Professional Visible Rejuvenation Botox & Radiance Effect — intensive anti-wrinkle cream for firmness, elasticity and radiance without invasive procedures.\n\n" +
      "• Peptide complex helps inhibit muscle contractions that cause expression lines.\n• Polygonum Aviculare herbal extract boosts skin tone and elasticity.\n• Improves firmness and restores a healthy radiant glow.\n• Rich nourishing formula for deep hydration.\n• Suitable for daily morning and evening use.\n• Apply with light upward strokes on cleansed skin, focusing on the forehead, eye and mouth areas.",
    imageUrl: "https://radiant-professional.com/media/images/products/2026/02/radiant_visible_rejuvenation_3_.jpg",
  },
  {
    barcode: "5201641700983",
    slug: "radiant-professional-matt-finish-transparent-base",
    price: 16000,
    categoryId: MAKEUP_ID,
    subcategoryId: MAKEUP_FACE,
    tertiaryCategoryId: FACE_PRIMER,
    categoryLabel: "المكياج → الوجه → برايمر الوجه",
    nameAr: "راديانت بروفيشنال - قاعدة شفافة بلمسة مطفية",
    nameEn: "Radiant Professional - Matt Finish Transparent Base",
    descriptionAr:
      "قاعدة شفافة بلمسة مطفية من راديانت بروفيشنال — برايمر غير مرئي لتصغير المسام وضبط اللمعان وتثبيت المكياج.\n\n" +
      "• قوام حريري بلمسة مطفية شفافة.\n• يقلل اللمعان الزائد ويُنعّم خطوط التعبير.\n• يصغّر مظهر المسام مع السماح للبشرة بالتنفس.\n• يمنح بشرة ناعمة ومتساوية لجميع أنواع البشرة.\n• يطيل ثبات كريم الأساس ويحسّن نتيجته.\n• يُطبّق على الوجه كاملاً أو منطقة تي بعد المرطب وقبل كريم الأساس أو البودرة، ويمكن استخدامه حول العين أيضاً.",
    descriptionEn:
      "Radiant Professional Matt Finish Transparent Base — invisible mattifying primer to minimise pores, control shine and extend makeup wear.\n\n" +
      "• Silky texture with a translucent matte finish.\n• Reduces excess shine and smooths expression lines.\n• Minimises the appearance of pores while letting skin breathe.\n• Creates a smooth, even complexion on all skin types.\n• Extends foundation wear and improves the final result.\n• Apply to the full face or T-zone after moisturiser and before foundation or powder; may also be used around the eyes.",
    imageUrl: "https://radiant-professional.com/media/images/products/2022/08/5201641700983.jpg",
  },
  {
    barcode: "5201641040188",
    slug: "radiant-professional-magnetic-palette-02-sultry-eyes",
    price: 41000,
    categoryId: MAKEUP_ID,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
    categoryLabel: "المكياج → العيون → ظلال العيون",
    nameAr: "راديانت بروفيشنال - باليت ظلال عيون مغناطيسي رقم ٠٢ إصدار محدود",
    nameEn: "Radiant Professional - Magnetic Palette No.02 Sultry Eyes Limited Edition",
    descriptionAr:
      "باليت ظلال عيون مغناطيسي رقم ٠٢ إصدار محدود من راديانت بروفيشنال — ٦ درجات ترابية للإطلالات اليومية والدرامية.\n\n" +
      "• إصدار محدود بدرجات ترابية متعددة الإنهاءات.\n• ألوان ثابتة وعالية التغطية تناسب جميع ألوان العيون والبشرة.\n• تركيبة مستقرة سهلة الدمج والتدرج.\n• علبة عملية للسفر مع مرآة مدمجة.\n• مثالي للإطلالات النهارية والمسائية.\n• ادمجي الدرجات لإنشاء إطلالات فريدة باستخدام فرشاة ظلال العيون.",
    descriptionEn:
      "Radiant Professional Magnetic Palette No.02 Sultry Eyes Limited Edition — 6 earthy shades for everyday and dramatic eye looks.\n\n" +
      "• Limited edition palette with long-lasting, high colour payoff.\n• Shades flatter all eye colours and skin tones.\n• Very stable, super blendable and buildable formula.\n• Travel-friendly case with built-in mirror.\n• Ideal for both day and evening looks.\n• Combine shades and finishes to create unique eye looks with an eyeshadow brush.",
    imageUrl: "https://radiant-professional.com/media/images/products/2024/05/radiant_palette_2_sultry_eyes_1.jpg",
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
    brandAr: "راديانت بروفيشنال",
    brandEn: "Radiant Professional",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Radiant Professional brand");
  console.log(`Brand: Radiant Professional (${brandId})${resolved.created ? " [created]" : ""}\n`);
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

  const brandId = await resolveBrandId();
  let added = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    console.log(`--- ${p.nameEn} ---`);

    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(p.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((row) => row.slug === p.slug)) {
      console.log(`skip ${p.barcode} — slug exists (${p.slug})\n`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId,
      categoryId: p.categoryId,
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
    console.log(`  ID: ${created.id}`);
    console.log(`  Barcode: ${p.barcode}`);
    console.log(`  Price: ${p.price} IQD`);
    console.log(`  Category: ${p.categoryLabel}\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
