/**
 * Essence — 11 barcodes (primers, lips, sprays, eyeliner, hair comb).
 * Usage: npx tsx scripts/add-essence-batch-11-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";

const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const MAKEUP_SPRAY = "afb26abb-e48f-4ced-8863-2c3ba1333505";

const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const HAIR = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const HAIR_BRUSHES = "50d4a6f9-efc9-4411-9b27-711f93cb754c";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729584717",
    slug: "essence-glow-like-honey-dewy-primer-30ml",
    price: 6750,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "إيسنس - برايمر وجه جيلي غلو لايك هوني ٣٠ مل",
    nameEn: "Essence - Glow Like Honey Dewy Primer 30 ml",
    descriptionAr:
      "برايمر وجه جيلي بلمعة نضرة، يمنح البشرة إشراقاً طبيعياً ويحسّن ثبات المكياج.\n\n" +
      "• قوام جيلي خفيف يذوب على البشرة.\n• لمسة لون عسلي فاتح موحّدة.\n• يمنح إشراقاً نضراً دون ثقل.\n• يساعد المكياج على الالتصاق والثبات.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على بشرة نظيفة قبل المكياج.",
    descriptionEn:
      "Glow Like Honey Dewy Primer — lightweight gel primer for a radiant, dewy glow and improved makeup grip.\n\n" +
      "• Lightweight gel texture melts into skin.\n• Light honey-yellow tint.\n• Natural radiant finish without heaviness.\n• Grippy texture for better makeup adherence.\n• Vegan and cruelty-free.\n• Apply to clean skin before makeup.",
  },
  {
    barcode: "4059729542359",
    slug: "essence-bouncy-plump-smoothing-primer",
    price: 6750,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "إيسنس - برايمر وجه بونسي بلمب لنعومة وترطيب البشرة",
    nameEn: "Essence - Bouncy Plump Smoothing Primer",
    descriptionAr:
      "برايمر وجه بقوام موس خفيف، يرطّب البشرة ويمنحها نعومة وامتلاءً قبل وضع المكياج.\n\n" +
      "• قوام موس منعش برائحة البطيخ.\n• مُعزّز بحمض الهيالورونيك ومستخلص البطيخ.\n• يهدئ البشرة ويوحّد ملمسها.\n• خالٍ من السيليكون.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق بالتساوي على الوجه كخطوة أولى.",
    descriptionEn:
      "Bouncy Plump Smoothing Primer — refreshing mousse-texture primer that hydrates and smooths skin.\n\n" +
      "• Light mousse texture with a watermelon scent.\n• Enriched with hyaluronic acid and watermelon extract.\n• Soothes and smooths skin.\n• Silicone-free.\n• Vegan and cruelty-free.\n• Apply evenly as the first step in your routine.",
  },
  {
    barcode: "4059729522818",
    slug: "essence-juicy-bomb-party-lip-oil-03-marvellous-mango-2-4ml",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "إيسنس - زيت شفاه جوسي بوم بارتي رقم ٠٣ مانجو ٢٫٤ مل",
    nameEn: "Essence - Juicy Bomb Party Lip Oil 03 Marvellous Mango 2.4 ml",
    descriptionAr:
      "زيت شفاه مغذٍ بلمعان عالي ولمسة لون خفيفة، برائحة مانجو منعشة لشفاه ناعمة ولامعة.\n\n" +
      "• تركيبة زيتية غير لاصقة.\n• لمعان عالي بلون شفاف خفيف.\n• رائحة مانجو فاكهية.\n• مُعزّز بزيت الجوجوبا.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق مباشرة على الشفاه.",
    descriptionEn:
      "Juicy Bomb Party Lip Oil 03 Marvellous Mango — nourishing lip oil with high shine and a fruity mango scent.\n\n" +
      "• Non-sticky oil formula.\n• High-gloss finish with a sheer tint.\n• Fresh mango fragrance.\n• Enriched with jojoba oil.\n• Vegan and cruelty-free.\n• Apply directly to lips.",
  },
  {
    barcode: "4059729522733",
    slug: "essence-juicy-bomb-party-lip-oil-01-peach-perfect-2-4ml",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "إيسنس - زيت شفاه جوسي بوم بارتي رقم ٠١ خوخ ٢٫٤ مل",
    nameEn: "Essence - Juicy Bomb Party Lip Oil 01 Peach Perfect 2.4 ml",
    descriptionAr:
      "زيت شفاه مغذٍ بلمعان عالي ولمسة لون خوخي خفيفة، لشفاه ناعمة ولامعة طوال اليوم.\n\n" +
      "• تركيبة زيتية خفيفة غير لاصقة.\n• لمعان عالي مع لون خوخي شفاف.\n• رائحة فاكهية حلوة.\n• مُعزّز بزيت الجوجوبا وزيت الميدوفوم.\n• نباتي ولم يُختبر على الحيوانات.\n• يُستخدم وحده أو فوق أحمر الشفاه.",
    descriptionEn:
      "Juicy Bomb Party Lip Oil 01 Peach Perfect — nourishing lip oil with high shine and a sweet peach scent.\n\n" +
      "• Lightweight, non-sticky oil formula.\n• High-gloss finish with a sheer peach tint.\n• Sweet fruity fragrance.\n• Enriched with jojoba and meadowfoam seed oils.\n• Vegan and cruelty-free.\n• Wear alone or over lipstick.",
  },
  {
    barcode: "4059729539809",
    slug: "essence-polly-pocket-peptide-lip-mask-01-so-much-cute-12g",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    nameAr: "إيسنس - ماسك شفاه ببتيد بولي بوكيت رقم ٠١ ١٢ جم",
    nameEn: "Essence - Polly Pocket Peptide Lip Mask 01 So Much Cute 12 g",
    descriptionAr:
      "ماسك شفاه غني بالببتيدات يرطّب الشفاه ويمنحها نعومة ومرونة مع رائحة تفاح حلوة.\n\n" +
      "• فورمولا مغذية مُعزّزة بالببتيدات.\n• يُنعّم الشفاه ويرطّبها بعمق.\n• رائحة تفاح لذيذة.\n• يأتي مع مرآة وقطعة تطبيق سيليكون.\n• خالٍ من البارابين.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "Polly Pocket Peptide Lip Mask 01 So Much Cute — peptide-rich lip mask for soft, revitalised lips.\n\n" +
      "• Nourishing formula enriched with peptides.\n• Deeply moisturises and softens lips.\n• Sweet apple scent.\n• Includes built-in mirror and silicone applicator.\n• Free from parabens.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4059729539755",
    slug: "essence-polly-pocket-hair-comb-a-polly-kinda",
    price: 2250,
    categoryId: CARE,
    subcategoryId: HAIR,
    tertiaryCategoryId: HAIR_BRUSHES,
    nameAr: "إيسنس - مشط شعر بولي بوكيت على شكل قلب",
    nameEn: "Essence - Polly Pocket Hair Comb A Polly Kinda",
    descriptionAr:
      "مشط شعر على شكل قلب مستوحى من بولي بوكيت، يسهّل تمشيط الشعر دون شد أو كسر.\n\n" +
      "• أسنان عريضة وناعمة.\n• مناسب للشعر الرطب أو الجاف.\n• خفيف وسهل الحمل.\n• مثالي للتصفيف السريع والتموجات.\n• تصميم لطيف على شكل قلب.\n• أداة عملية للحقيبة.",
    descriptionEn:
      "Polly Pocket Hair Comb A Polly Kinda — heart-shaped comb for gentle detangling.\n\n" +
      "• Wide, smooth teeth.\n• Suitable for wet or dry hair.\n• Lightweight and portable.\n• Ideal for quick styling and waves.\n• Cute heart-shaped design.\n• Practical purse companion.",
  },
  {
    barcode: "4059729539762",
    slug: "essence-polly-pocket-hydro-fixing-spray-50ml",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "إيسنس - مثبت مكياج مرطب بولي بوكيت ٥٠ مل",
    nameEn: "Essence - Polly Pocket Hydro Fixing Spray 50 ml",
    descriptionAr:
      "سبراي مثبت مكياج مرطب بتركيبة منعشة، يثبّت الإطلالة ويمنح البشرة ترطيباً خفيفاً.\n\n" +
      "• يثبّت المكياج بثبات مريح.\n• تركيبة مرطبة ومنعشة.\n• رذاذ ناعم ومتساوٍ.\n• حجم ٥٠ مل مناسب للسفر.\n• نباتي ولم يُختبر على الحيوانات.\n• يُرشّ على المكياج من مسافة ٢٠–٣٠ سم.",
    descriptionEn:
      "Polly Pocket Hydro Fixing Spray — soothing hydro fixing spray with a refreshing, moisturising effect.\n\n" +
      "• Sets makeup with a nourishing finish.\n• Refreshing and hydrating formula.\n• Fine, even mist.\n• Compact 50 ml travel size.\n• Vegan and cruelty-free.\n• Spray over makeup from 20–30 cm away.",
  },
  {
    barcode: "4250587705461",
    slug: "essence-liquid-ink-eyeliner-waterproof-black-01",
    price: 3750,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "إيسنس - كحل سائل إنك مقاوم للماء أسود رقم ٠١",
    nameEn: "Essence - Liquid Ink Eyeliner Waterproof Black 01",
    descriptionAr:
      "كحل سائل مقاوم للماء بفرشاة رفيعة، يمنح خطوطاً سوداء دقيقة تدوم طويلاً دون تلطيخ.\n\n" +
      "• تركيبة مقاومة للماء والتلطيخ.\n• فرشاة رفيعة لخطوط دقيقة.\n• لون أسود كثيف.\n• يجف بسرعة.\n• نباتي ولم يُختبر على الحيوانات.\n• مثالي للكات آي والخط الدقيق.",
    descriptionEn:
      "Liquid Ink Eyeliner Waterproof Black 01 — waterproof liquid eyeliner with a fine brush applicator.\n\n" +
      "• Waterproof and smudge-proof formula.\n• Fine brush for precise lines.\n• Intense black colour.\n• Quick-drying.\n• Vegan and cruelty-free.\n• Ideal for cat-eye and fine liner looks.",
  },
  {
    barcode: "4059729490452",
    slug: "essence-fix-last-keep-it-perfect-makeup-fixing-spray-50ml",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "إيسنس - مثبت مكياج كيب إت بيرفكت فكس آند لاست ٥٠ مل",
    nameEn: "Essence - Fix & Last Keep It Perfect Make-Up Fixing Spray 50 ml",
    descriptionAr:
      "مثبت مكياج مُعزّز بحمض الهيالورونيك، يثبّت الإطلالة ويرطّب البشرة دون إحساس لزج.\n\n" +
      "• يطيل ثبات المكياج طوال اليوم.\n• مُعزّز بحمض الهيالورونيك للترطيب.\n• رذاذ ناعم ومتساوٍ.\n• خالٍ من الزيوت والكحول.\n• نباتي ولم يُختبر على الحيوانات.\n• يُرشّ على المكياج بعد اكتماله.",
    descriptionEn:
      "Fix & Last Keep It Perfect Make-Up Fixing Spray — makeup fixing spray with hyaluronic acid.\n\n" +
      "• Prolongs makeup wear throughout the day.\n• Enriched with hyaluronic acid for hydration.\n• Ultra-fine, even mist.\n• Free from oil and alcohol.\n• Vegan and cruelty-free.\n• Spray over finished makeup.",
  },
  {
    barcode: "4059729542588",
    slug: "essence-jelly-grip-refreshing-aloe-spray-50ml",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "إيسنس - سبراي مكياج مرطب جيلي جريب بالألوفيرا ٥٠ مل",
    nameEn: "Essence - Jelly Grip Refreshing Aloe Spray 50 ml",
    descriptionAr:
      "سبراي ثلاثي الاستخدام يُنعّش ويرطّب ويثبّت المكياج بتركيبة جيل تتحول إلى رذاذ خفيف.\n\n" +
      "• يُنعّش البشرة ويرطّبها.\n• يمهّد البشرة قبل المكياج.\n• يثبّت المكياج بعد وضعه.\n• مُعزّز بمستخلص الألوفيرا.\n• رذاذ خفيف ومتساوٍ.\n• نباتي ولم يُختبر على الحيوانات.",
    descriptionEn:
      "Jelly Grip Refreshing Aloe Spray — 3-in-1 gel-to-mist spray that refreshes, preps and sets makeup.\n\n" +
      "• Refreshes and hydrates skin.\n• Primes skin before makeup.\n• Sets makeup after application.\n• Enriched with aloe extract.\n• Light, even mist.\n• Vegan and cruelty-free.",
  },
  {
    barcode: "4059729490438",
    slug: "essence-fix-last-18h-long-lasting-makeup-fixing-spray-50ml",
    price: 5250,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "إيسنس - مثبت مكياج طويل الثبات ١٨ ساعة فكس آند لاست ٥٠ مل",
    nameEn: "Essence - Fix & Last 18h Long-Lasting Make-Up Fixing Spray 50 ml",
    descriptionAr:
      "مثبت مكياج طويل الثبات يدوم حتى ١٨ ساعة، بتركيبة مقاومة للماء تثبت الإطلالة دون تلطيخ.\n\n" +
      "• ثبات يدوم حتى ١٨ ساعة.\n• تركيبة مقاومة للماء.\n• رذاذ ناعم ومتساوٍ.\n• خالٍ من الزيوت والكحول.\n• نباتي ولم يُختبر على الحيوانات.\n• يُرشّ على المكياج بعد اكتماله.",
    descriptionEn:
      "Fix & Last 18h Long-Lasting Make-Up Fixing Spray — up to 18 hours of makeup hold with a waterproof formula.\n\n" +
      "• Up to 18-hour long-lasting wear.\n• Waterproof formula.\n• Fine, even mist.\n• Free from oil and alcohol.\n• Vegan and cruelty-free.\n• Spray over finished makeup.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? "";
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const p of PRODUCTS) {
    try {
      const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
        `/products/barcode-check?barcode=${p.barcode}`,
      );
      if (check.exists) {
        console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
        skip += 1;
        continue;
      }

      const created = await api<{ id: string }>("/products", "POST", {
        sku: p.barcode,
        barcode: p.barcode,
        slug: p.slug,
        brandId: BRAND_ID,
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
        imageIds: [] as string[],
      });

      console.log(`✓ ${p.nameAr}`);
      console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD`);
      ok += 1;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      fail += 1;
      console.log(`✗ ${p.barcode}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n--- Summary ---\nAdded: ${ok}\nSkipped: ${skip}\nFailed: ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
