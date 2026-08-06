/**
 * Grigi — 10 separate products (no shades, no images).
 * Sources: grigi.gr, beautyfree.gr, epharmadora.com
 * Usage: npx tsx scripts/add-grigi-batch10-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

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
    barcode: "5207042230036",
    slug: "grigi-pro-luminous-primer-3-in-1-30ml",
    sku: "GRG-230036",
    price: 16500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "كريجي - برايمر Pro Luminous Primer 3 in 1 للوجه 30 مل",
    nameEn: "Grigi - Pro Luminous Primer 3 in 1 30ml",
    descriptionAr:
      "برايمر Pro Luminous Primer 3 in 1 من كريجي — قاعدة مكياج مُضيئة متعددة الاستخدامات بتركيبة gel-cream ناعمة.\n\n" +
      "• يقلّل فقدان رطوبة البشرة ويرطّبها بعمق بفضل مزيج الإسترات والبوليمرات.\n" +
      "• قوام gel-cream خفيف وناعم يجفّ بسرعة ويترك البشرة ناعمة ومشرقة.\n" +
      "• 3 في 1: كريم نهار، هايلايتر سائل، وقاعدة مكياج.\n" +
      "• خالٍ من البارابين — Vegan Friendly.\n" +
      "• 30 مل — صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Luminous Primer 3 in 1 — multi-use illuminating makeup base with a soft gel-cream texture.\n\n" +
      "• Reduces water loss and deeply hydrates with a blend of esters and low molecular weight polymers.\n" +
      "• Lightweight gel-cream dries quickly for soft, radiant skin.\n" +
      "• 3-in-1: day cream, liquid highlighter and makeup base.\n" +
      "• Paraben free — Vegan Friendly.\n" +
      "• 30ml — Made in Greece.",
  },
  {
    barcode: "5207042520298",
    slug: "grigi-the-sun-perception-face-cream-spf30-50ml",
    sku: "GRG-520298",
    price: 18500,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "كريجي - كريم واقي شمس The Sun Perception Face Cream SPF30 50 مل (بدون لون)",
    nameEn: "Grigi - The Sun Perception Face Cream SPF30 50ml",
    descriptionAr:
      "كريم واقي شمس The Sun Perception Face Cream SPF30 من كريجي — حماية واسعة الطيف بدون لون.\n\n" +
      "• حماية UVA وUVB — SPF30 بتركيبة شفافة مناسبة للاستخدام اليومي.\n" +
      "• مُعزّز بحمض الهيالورونيك والبانثينول وفيتامين E وزيت اللوز.\n" +
      "• يحمي من الشيخوخة الضوئية ويرطّب بعمق ويترك البشرة منتعشة.\n" +
      "• مقاوم للماء — Vegan Friendly.\n" +
      "• 50 مل — صُنع في اليونان.",
    descriptionEn:
      "Grigi The Sun Perception Face Cream SPF30 — broad-spectrum clear facial sunscreen.\n\n" +
      "• UVA and UVB protection — SPF30 transparent formula for daily wear.\n" +
      "• Enriched with hyaluronic acid, panthenol, vitamin E and almond oil.\n" +
      "• Protects against photoaging with deep hydration and a fresh finish.\n" +
      "• Water-resistant — Vegan Friendly.\n" +
      "• 50ml — Made in Greece.",
  },
  {
    barcode: "5207042130251",
    slug: "grigi-black-party-mascara",
    sku: "GRG-130251",
    price: 8500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كريجي - ماسكارا Black Party للحجم والكثافة",
    nameEn: "Grigi - Black Party Mascara",
    descriptionAr:
      "ماسكارا Black Party من كريجي — ماسكارا ثورية لرموش بكثافة غنية وحجم درامي.\n\n" +
      "• تركيبة سائلة خفيفة لسهولة تطبيق استثنائية.\n" +
      "• لون أسود مكثّف يمنح حجمًا إضافيًا من أول طبقة دون ثقل.\n" +
      "• فرشاة bundled lashes لفصل ممتاز بين الرموش.\n" +
      "• مثالية لإطلالة حفلة جريئة وعيون جذابة.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Black Party Mascara — revolutionary volume mascara for rich, dramatic lashes.\n\n" +
      "• Lightweight fluid texture for exceptionally easy application.\n" +
      "• Intense black colour adds extra volume in one coat without weighing lashes down.\n" +
      "• Bundled lashes brush ensures excellent separation.\n" +
      "• Perfect for bold party looks and captivating eyes.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042100070",
    slug: "grigi-eyebrow-pro-pencil-07-nude-grey",
    sku: "GRG-100070",
    price: 6500,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    nameAr: "كريجي - قلم حواجب Eyebrow Pro Pencil No 07 Nude Grey",
    nameEn: "Grigi - Eyebrow Pro Pencil No 07 Nude Grey",
    descriptionAr:
      "قلم حواجب Eyebrow Pro Pencil No 07 Nude Grey من كريجي — قلم احترافي طويل الثبات مع فرشاة مدمجة.\n\n" +
      "• يحدّد الشكل واللون ويُبرز جمال العين بخط دقيق ومريح.\n" +
      "• قوام متجانس ينزلق بسلاسة دون تشويش على الجفون.\n" +
      "• فرشاة مبتكرة لملء وتصفيف الحواجب بحركات سهلة.\n" +
      "• درجة Nude Grey — رمادي نود طبيعي للحواجب الفاتحة والمتوسطة.\n" +
      "• Paraben free — صُنع في اليونان.",
    descriptionEn:
      "Grigi Eyebrow Pro Pencil No 07 Nude Grey — professional long-wear brow pencil with integrated brush.\n\n" +
      "• Defines shape and colour while enhancing the eyes with precise, comfortable application.\n" +
      "• Smooth, even texture glides on without smudging on the lids.\n" +
      "• Innovative brush tip fills and grooms brows effortlessly.\n" +
      "• Nude Grey shade — natural grey-nude for light to medium brows.\n" +
      "• Paraben free — Made in Greece.",
  },
  {
    barcode: "5207042130107",
    slug: "grigi-length-pro-mascara-jet-black",
    sku: "GRG-130107",
    price: 9500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كريجي - ماسكارا Length Pro Mascara Jet Black للطول",
    nameEn: "Grigi - Length Pro Mascara Jet Black",
    descriptionAr:
      "ماسكارا Length Pro Mascara Jet Black من كريجي — ماسكارا للطول بلون أسود كثيف وثبات عالٍ.\n\n" +
      "• فرشاة طويلة مُصمّمة لفصل كل رمش من الجذور حتى الأطراف.\n" +
      "• لون أسود Jet Black غني يمنح رموشًا أطول وأكثر وضوحًا من أول طبقة.\n" +
      "• لا تلتصق ولا تترك بقايا — تطبيق سهل ونتيجة نظيفة.\n" +
      "• مثالية لإطلالة عيون جذابة برموش طويلة طوال اليوم.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Length Pro Mascara Jet Black — lengthening mascara with intense black colour and long wear.\n\n" +
      "• Extra-long brush designed to separate every lash from root to tip.\n" +
      "• Rich Jet Black colour delivers longer, more defined lashes from the first coat.\n" +
      "• Does not clump or leave residue — easy application with a clean finish.\n" +
      "• Perfect for an alluring eye look with spectacular length all day.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042204037",
    slug: "grigi-premium-gel-eyeliner-pencil-pro-02-brown",
    sku: "GRG-204037",
    price: 8500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "كريجي - قلم جل تحديد عيون Premium Gel Eyeliner Pencil Pro No 02 Brown",
    nameEn: "Grigi - Premium Gel Eyeliner Pencil Pro No 02 Brown",
    descriptionAr:
      "قلم جل تحديد عيون Premium Gel Eyeliner Pencil Pro No 02 Brown من كريجي — لون بني دافئ بثبات يدوم حتى 17 ساعة.\n\n" +
      "• تركيبة جلية بقوام مخملي ناعم ينزلق بسلاسة على الجفون.\n" +
      "• لون بني غني مكثّف — مثالي للإطلالات الطبيعية والـ Smoky Eye الناعم.\n" +
      "• مقاوم للماء — يثبت طوال اليوم دون ذوبان.\n" +
      "• مُختبر طبياً وجلدياً — Vegan وCruelty Free.\n" +
      "• ارسمي على خط الرموش من الزاوية الداخلية نحو الخارج.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Premium Gel Eyeliner Pencil Pro No 02 Brown — warm brown gel eyeliner with up to 17 hours of wear.\n\n" +
      "• Gel-like velvety texture glides smoothly on the eyelids.\n" +
      "• Rich brown colour — ideal for natural looks and soft smoky eyes.\n" +
      "• Waterproof formula that stays put all day.\n" +
      "• Ophthalmologically and dermatologically tested — Vegan and Cruelty Free.\n" +
      "• Line the lash line from inner to outer corner.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042120047",
    slug: "grigi-pro-eyeliner-pen-waterproof-black",
    sku: "GRG-120047",
    price: 8500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "كريجي - قلم تحديد عيون Pro Eyeliner Pen Waterproof Black",
    nameEn: "Grigi - Pro Eyeliner Pen Waterproof Black",
    descriptionAr:
      "قلم تحديد عيون Pro Eyeliner Pen Waterproof Black من كريجي — دقة عالية لخطوط رفيعة أو متوسطة.\n\n" +
      "• رأس قلم دقيق لرسم أو تصحيح محيط العين بسرعة وسهولة.\n" +
      "• خط ثابت رفيع أو عريض حسب ضغط اليد — بدون ذوبان أو تشوه.\n" +
      "• مقاوم للماء — إطلالة sensual وfresh طوال اليوم.\n" +
      "• مثالي للخط الكتّان الكلاسيكي والـ Cat Eye.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Pro Eyeliner Pen Waterproof Black — high-precision liquid eyeliner for thin or medium lines.\n\n" +
      "• Fine pen tip to create or correct eye contours quickly and easily.\n" +
      "• Stable thin or regular line without smudging or running.\n" +
      "• Waterproof — sensual, fresh look all day long.\n" +
      "• Perfect for classic tightlining and cat-eye looks.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042100148",
    slug: "grigi-eyebrow-definer-pencil-08-nude-dark",
    sku: "GRG-100148",
    price: 5500,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    nameAr: "كريجي - قلم حواجب Eyebrow Definer Pencil No 08 Nude Dark",
    nameEn: "Grigi - Eyebrow Definer Pencil No 08 Nude Dark",
    descriptionAr:
      "قلم حواجب Eyebrow Definer Pencil No 08 Nude Dark من كريجي — لتحديد وتشكيل الحواجب بخط ثابت.\n\n" +
      "• يحدّد شكل الحواجب ويمنح مظهرًا أنيقًا وشبابيًا للوجه.\n" +
      "• قوام جاف وناعم في آنٍ واحد — يثبت خط الحواجب دون تشويش.\n" +
      "• درجة Nude Dark — بني نود داكن للحواجب المتوسطة والداكنة.\n" +
      "• ارسمي شعرات خفيفة لملء الفراغات ثم وزّعي بفرشاة spoolie.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Eyebrow Definer Pencil No 08 Nude Dark — defines and shapes brows with a stable line.\n\n" +
      "• Defines brow shape for a well-groomed, youthful facial appearance.\n" +
      "• Dry yet soft texture stabilises the brow line without smudging.\n" +
      "• Nude Dark shade — deep nude brown for medium to dark brows.\n" +
      "• Draw light hair-like strokes to fill gaps, then blend with a spoolie.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042100032",
    slug: "grigi-eyebrow-definer-pencil-03-elephant-grey",
    sku: "GRG-100032",
    price: 5500,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    nameAr: "كريجي - قلم حواجب Eyebrow Definer Pencil No 03 Elephant Grey",
    nameEn: "Grigi - Eyebrow Definer Pencil No 03 Elephant Grey",
    descriptionAr:
      "قلم حواجب Eyebrow Definer Pencil No 03 Elephant Grey من كريجي — لتحديد وتشكيل الحواجب بخط ثابت.\n\n" +
      "• يحدّد شكل الحواجب ويمنح مظهرًا أنيقًا وشبابيًا للوجه.\n" +
      "• قوام جاف وناعم في آنٍ واحد — يثبت خط الحواجب دون تشويش.\n" +
      "• درجة Elephant Grey — رمادي فيل رمادي ناعم للحواجب الفاتحة والرمادية.\n" +
      "• ارسمي شعرات خفيفة لملء الفراغات ثم وزّعي بفرشاة spoolie.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Eyebrow Definer Pencil No 03 Elephant Grey — defines and shapes brows with a stable line.\n\n" +
      "• Defines brow shape for a well-groomed, youthful facial appearance.\n" +
      "• Dry yet soft texture stabilises the brow line without smudging.\n" +
      "• Elephant Grey shade — soft elephant grey for light and ash-toned brows.\n" +
      "• Draw light hair-like strokes to fill gaps, then blend with a spoolie.\n" +
      "• Made in Greece.",
  },
  {
    barcode: "5207042420017",
    slug: "grigi-gloss-liquid-lipstick-01-transparent",
    sku: "GRG-420017",
    price: 6500,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "كريجي - Gloss Liquid Lipstick No 01 Transparent شفاف لامع",
    nameEn: "Grigi - Gloss Liquid Lipstick No 01 Transparent",
    descriptionAr:
      "Gloss Liquid Lipstick No 01 Transparent من كريجي — روج شفاه سائل شفاف طويل الثبات بلمعة لامعة.\n\n" +
      "• يمنح الشفاه مظهرًا ممتلئًا ولامعًا مع ترطيب ونعومة.\n" +
      "• يُطبّق وحده للإشراقة الطبيعية أو فوق أي lipstick لتأثير خاص.\n" +
      "• يحمي الشفاه من الجفاف ويتركها ناعمة طوال اليوم.\n" +
      "• درجة Transparent — شفاف نقي يناسب جميع ألوان الشفاه.\n" +
      "• صُنع في اليونان.",
    descriptionEn:
      "Grigi Gloss Liquid Lipstick No 01 Transparent — long-wear clear gloss lipstick with a shiny finish.\n\n" +
      "• Gives lips a plump, glossy look with hydration and softness.\n" +
      "• Wear alone for natural shine or over any lipstick for a special effect.\n" +
      "• Helps prevent dryness and keeps lips soft all day.\n" +
      "• Transparent shade — clear finish that suits all lip colours.\n" +
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
    brandAr: "كريجي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string; slug?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameAr ?? check.product.slug ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images, delete+readd)\n`);
  await login();
  const brandId = await resolveBrandId();

  let added = 0;
  let deleted = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    if (await deleteByBarcode(product.barcode)) deleted += 1;
    await deleteOrphanSlug(product.slug);

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

    const verify = await api<{
      shades?: unknown[];
      nameAr?: string;
      nameEn?: string;
      descriptionAr?: string;
      descriptionEn?: string;
    }>(`/products/${created.id}`);

    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
      throw new Error(`Missing bilingual copy for ${product.barcode}`);
    }

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | deleted: ${deleted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
