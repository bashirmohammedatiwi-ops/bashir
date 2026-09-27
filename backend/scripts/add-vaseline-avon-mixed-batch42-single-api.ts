/**
 * Mixed body/skincare batch — separate products, no shades, no images.
 * Names sourced via GPT Luna barcode research; delete+readd if exists.
 * Usage: npx tsx scripts/add-vaseline-avon-mixed-batch42-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const HANDS = "01ad1f0d-7c15-469c-bf86-85abd135e68f";
const SUN = "25dc8086-bffa-47af-aaf7-64d503e58a9f";

const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const BODY_LOTION = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const BODY_WHITENING = "5ab05504-516e-4104-a934-6d23666ffdca";
const HAND_MOIST = "3cdb4e43-e28d-4cac-8677-6415ea069d4f";

type BrandKey = "vaseline" | "avon" | "roc" | "johnsons" | "neutrogena";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  vaseline: { brandAr: "فازلين", brandEn: "Vaseline", prefix: "VAS" },
  avon: { brandAr: "أفون", brandEn: "Avon", prefix: "AVN" },
  roc: { brandAr: "روك", brandEn: "RoC", prefix: "ROC" },
  johnsons: { brandAr: "جونسون", brandEn: "Johnson's", prefix: "JNS" },
  neutrogena: { brandAr: "نيوتروجينا", brandEn: "Neutrogena", prefix: "NEU" },
};

/** Unresolved after Luna + web verification — do not invent. */
export const UNRESOLVED_BARCODES = [
  "6921199120390",
  "6921199135219",
  "6921199139071",
  "6921199139262",
  "6921199139255",
  "8888086782476",
  "8888086782469",
  "5050136192266",
  "5059018573711",
] as const;

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8901030912986",
    brandKey: "vaseline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – لوشن الجسم كاكاو راديانت بزبدة الكاكاو 725 مل",
    nameEn: "Vaseline Intensive Care Cocoa Radiant Body Lotion – 725 ml",
    descriptionAr:
      "لوشن جسم كاكاو راديانت من فازلين إنتنسيف كير — غني بزبدة الكاكاو وقطرات فازلين جيلي الدقيقة لترطيب عميق وإشراقة طبيعية تدوم حتى 48 ساعة.\n\n• يمتص بسرعة دون ملمس دهني.\n• يغذي البشرة الجافة ويمنحها نعومة ولمعاناً صحياً.\n• مناسب للاستخدام اليومي على كامل الجسم.\n• الحجم: 725 مل.",
    descriptionEn:
      "Vaseline Intensive Care Cocoa Radiant Body Lotion — enriched with cocoa butter and Vaseline Jelly microdroplets for deep moisture and a natural glow for up to 48 hours.\n\n• Fast-absorbing, non-greasy feel.\n• Nourishes dry skin for soft, healthy-looking radiance.\n• Ideal for daily all-over body use.\n• Size: 725 ml.",
  },
  {
    barcode: "8901030912993",
    brandKey: "vaseline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – لوشن الجسم المهدئ بالصبار Soothing Hydration 725 مل",
    nameEn: "Vaseline Intensive Care Soothing Hydration Body Lotion – 725 ml",
    descriptionAr:
      "لوشن مهدئ مرطب من فازلين بالصبار والجليسرين وقطرات فازلين جيلي — ينعش البشرة الجافة ويهدئ الإحساس بالجفاف دون ملمس لزج.\n\n• تركيبة خفيفة وسريعة الامتصاص.\n• ترطيب يومي مريح للبشرة الحساسة للجفاف.\n• الحجم: 725 مل.",
    descriptionEn:
      "Vaseline Intensive Care Soothing Hydration Body Lotion with aloe vera, glycerin and Vaseline Jelly — refreshes dry skin with comforting, non-sticky hydration.\n\n• Lightweight, fast-absorbing formula.\n• Daily comfort for dry or dehydrated skin.\n• Size: 725 ml.",
  },
  {
    barcode: "8901030912955",
    brandKey: "vaseline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – لوشن الإصلاح العميق Essential Healing 725 مل",
    nameEn: "Vaseline Intensive Care Essential Healing Body Lotion – 725 ml",
    descriptionAr:
      "لوشن الإصلاح العميق Essential Healing من فازلين — يساعد على ترميم البشرة الجافة بالجلسرين وفازلين جيلي لترطيب عميق ونعومة ملحوظة.\n\n• يدعم حاجز الرطوبة الطبيعي للبشرة.\n• مناسب للبشرة الجافة جداً والاستخدام اليومي.\n• الحجم: 725 مل.",
    descriptionEn:
      "Vaseline Intensive Care Essential Healing Body Lotion — helps restore dry skin with glycerin and Vaseline Jelly for deep moisture and noticeable softness.\n\n• Supports the skin’s natural moisture barrier.\n• Suitable for very dry skin and everyday use.\n• Size: 725 ml.",
  },
  {
    barcode: "6001087357081",
    brandKey: "vaseline",
    price: 11000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – لوشن الإصلاح المتقدم بدون عطر Advanced Repair 400 مل",
    nameEn: "Vaseline Intensive Care Advanced Repair Fragrance-Free Body Lotion – 400 ml",
    descriptionAr:
      "لوشن الإصلاح المتقدم بدون عطر من فازلين — مصمم للبشرة الجافة جداً أو الحساسة، يمتص بسرعة ويمنح ترطيباً طويلاً دون رائحة.\n\n• خالٍ من العطر ومناسب للبشرة الحساسة.\n• يساعد على إصلاح مظهر الجفاف والخشونة.\n• الحجم: 400 مل.",
    descriptionEn:
      "Vaseline Intensive Care Advanced Repair Fragrance-Free Body Lotion — made for very dry or sensitive skin, absorbing quickly with long-lasting hydration and no fragrance.\n\n• Fragrance-free and suitable for sensitive skin.\n• Helps improve the look of dry, rough skin.\n• Size: 400 ml.",
  },
  {
    barcode: "8901030913013",
    brandKey: "vaseline",
    price: 15000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت – لوشن الجسم اليومي للتفتيح والإشراقة 725 مل",
    nameEn: "Vaseline Healthy Bright Daily Brightening Body Lotion – 725 ml",
    descriptionAr:
      "لوشن هيلثي برايت اليومي من فازلين — بفيتامين B3 (نياسيناميد) وفازلين جيلي ومرشحات UV لدعم إشراقة البشرة وترطيبها يومياً.\n\n• يرطب ويمنح مظهراً أكثر إشراقاً وتوحيداً.\n• مناسب للاستخدام اليومي على الجسم.\n• الحجم: 725 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Daily Brightening Body Lotion — with niacinamide (Vitamin B3), Vaseline Jelly and UV filters to support radiant, moisturized skin every day.\n\n• Hydrates and helps skin look brighter and more even.\n• Suitable for daily body use.\n• Size: 725 ml.",
  },
  {
    barcode: "8901030913006",
    brandKey: "vaseline",
    price: 14000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – لوشن الإصلاح المتقدم برائحة خفيفة Advanced Repair 725 مل",
    nameEn: "Vaseline Intensive Care Advanced Repair Lightly Scented Body Lotion – 725 ml",
    descriptionAr:
      "لوشن الإصلاح المتقدم برائحة خفيفة من فازلين — يغذي البشرة الجافة جداً بالجلسرين والدايميثيكون وفازلين جيلي لدعم حاجز الرطوبة.\n\n• يخفف مظهر الجفاف الشديد والخشونة.\n• تركيبة سريعة الامتصاص برائحة خفيفة مريحة.\n• الحجم: 725 مل.",
    descriptionEn:
      "Vaseline Intensive Care Advanced Repair Lightly Scented Body Lotion — nourishes very dry skin with glycerin, dimethicone and Vaseline Jelly to support the moisture barrier.\n\n• Helps relieve the look of severe dryness and roughness.\n• Fast-absorbing formula with a light comforting scent.\n• Size: 725 ml.",
  },
  {
    barcode: "305210287303",
    brandKey: "vaseline",
    price: 12000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – زيت جل الجسم كاكاو راديانت 200 مل",
    nameEn: "Vaseline Intensive Care Cocoa Radiant Body Gel Oil – 200 ml",
    descriptionAr:
      "زيت جل كاكاو راديانت من فازلين — مزيج زبدة الكاكاو والزيوت المغذية يذوب على البشرة بسرعة ويمنح توهجاً طبيعياً غير دهني.\n\n• يرطب البشرة الباهتة والجافة.\n• ملمس جل زيتي فاخر سريع الامتصاص.\n• الحجم: حوالي 200 مل / 6.8 أونصة.",
    descriptionEn:
      "Vaseline Intensive Care Cocoa Radiant Body Gel Oil — cocoa butter and nourishing oils melt in quickly for a natural, non-greasy glow.\n\n• Moisturizes dull, dry skin.\n• Luxurious gel-oil texture with fast absorption.\n• Size: approx. 200 ml / 6.8 fl oz.",
  },
  {
    barcode: "8901030021268",
    brandKey: "vaseline",
    price: 12000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين إنتنسيف كير – زيت الجسم بفيتامين B3 لتوحيد اللون 200 مل",
    nameEn: "Vaseline Intensive Care Vitamin B3 Body Oil – 200 ml",
    descriptionAr:
      "زيت جسم بفيتامين B3 من فازلين — يرطب وينعم ملمس البشرة ويدعم مظهراً أكثر توحيداً مع فازلين جيلي.\n\n• خفيف وسريع الامتصاص.\n• مناسب للبشرة الجافة غير المتجانسة اللون.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Intensive Care Vitamin B3 Body Oil — hydrates, smooths texture and supports a more even-looking tone with Vaseline Jelly.\n\n• Lightweight and fast-absorbing.\n• Suitable for dry, uneven-looking skin.\n• Size: 200 ml.",
  },
  {
    barcode: "8712561705554",
    brandKey: "vaseline",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – مرطب الجسم البخاخ Essential Healing 190 مل",
    nameEn: "Vaseline Intensive Care Essential Healing Spray Moisturizer – 190 ml",
    descriptionAr:
      "مرطب جسم بخاخ Essential Healing من فازلين بمستخلص الشوفان — ترطيب عميق سريع الامتصاص بضغطة واحدة على كامل الجسم.\n\n• تطبيق عملي وسريع دون فرك كثير.\n• مناسب للترطيب اليومي والبشرة الجافة.\n• الحجم: 190 مل.",
    descriptionEn:
      "Vaseline Intensive Care Essential Healing Spray Moisturizer with oat extract — deep, fast-absorbing moisture with easy all-over spray application.\n\n• Convenient daily hydration with minimal rubbing.\n• Suitable for dry skin.\n• Size: 190 ml.",
  },
  {
    barcode: "8720181069246",
    brandKey: "vaseline",
    price: 10000,
    subcategoryId: HANDS,
    tertiaryCategoryId: HAND_MOIST,
    nameAr: "فازلين إكسبرت كير – كريم اليدين Dry Hands Rescue المرطب 2 في 1 حجم 200 مل",
    nameEn: "Vaseline Expert Care Dry Hands Rescue Moisturising 2-in-1 Hand Cream – 200 ml",
    descriptionAr:
      "كريم يدين Dry Hands Rescue من فازلين إكسبرت كير — يرطب اليدين الجافة والمتشققة بتركيبة غير دهنية وخالية من الكحول، ويدعم تعافي البشرة.\n\n• مناسب للبشرة الحساسة على اليدين.\n• امتصاص سريع دون لزوجة.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Expert Care Dry Hands Rescue 2-in-1 Hand Cream — moisturizes dry, cracked hands with a non-greasy, alcohol-free formula that supports skin recovery.\n\n• Suitable for sensitive hand skin.\n• Fast absorption without stickiness.\n• Size: 200 ml.",
  },
  {
    barcode: "5059018044921",
    brandKey: "avon",
    price: 12000,
    subcategoryId: FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "أفون نوترا إفكتس – مقشر ميسيلار مهدئ للوجه Soothe 150 مل",
    nameEn: "Avon Nutra Effects Soothe Micellar Scrub – 150 ml",
    descriptionAr:
      "مقشر ميسيلار مهدئ من أفون نوترا إفكتس — ينظف المسام ويزيل خلايا الجلد الميتة بلطف مع الميسيلز ومستخلص أوراق السيكا، مناسب للبشرة الحساسة.\n\n• تنظيف وتقشير لطيف في خطوة واحدة.\n• يهدئ ويترك البشرة ناعمة ونظيفة.\n• الحجم: 150 مل.",
    descriptionEn:
      "Avon Nutra Effects Soothe Micellar Scrub — gently cleanses pores and removes dead skin with micelles and cica leaf extract; suitable for sensitive skin.\n\n• Mild cleanse and exfoliation in one step.\n• Leaves skin soft, calm and clean.\n• Size: 150 ml.",
  },
  {
    barcode: "305210049130",
    brandKey: "vaseline",
    price: 13000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين غليزد أند غليستن – زيت جل لامع للجسم غولدن آور 200 مل",
    nameEn: "Vaseline Glazed & Glisten Golden Hour Glow Shimmering Body Gel Oil – 200 ml",
    descriptionAr:
      "زيت جل لامع غولدن آور من فازلين — بزبدة الكاكاو ولمعة ذهبية برونزية ورائحة فانيلا-كاكاو دافئة لإشراقة الجسم دون لون تسمير.\n\n• يرطب ويمنح توهجاً لامعاً أنيقاً.\n• ملمس جل زيتي سهل الدمج.\n• الحجم: حوالي 200 مل / 6.8 أونصة.",
    descriptionEn:
      "Vaseline Glazed & Glisten Golden Hour Glow Shimmering Body Gel Oil — cocoa butter with golden-bronze shimmer and a warm vanilla-cocoa scent for glow without a tanning tint.\n\n• Hydrates with an elegant luminous finish.\n• Easy-blend gel-oil texture.\n• Size: approx. 200 ml / 6.8 fl oz.",
  },
  {
    barcode: "8712561485579",
    brandKey: "vaseline",
    price: 12000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – زيت جل كاكاو راديانت للجسم 200 مل",
    nameEn: "Vaseline Intensive Care Cocoa Radiant Oil Gel – 200 ml",
    descriptionAr:
      "زيت جل كاكاو راديانت الأوروبي من فازلين — بزبدة الكاكاو النقية وفازلين جيلي لتغذية البشرة الجافة وإشراقة طبيعية غير دهنية.\n\n• يغذي ويضيء مظهر البشرة.\n• امتصاص سريع بملمس جل زيتي.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Intensive Care Cocoa Radiant Oil Gel (EU) — pure cocoa butter and Vaseline Jelly nourish dry skin with a radiant, non-greasy finish.\n\n• Feeds and brightens the look of skin.\n• Fast-absorbing gel-oil texture.\n• Size: 200 ml.",
  },
  {
    barcode: "8712561485548",
    brandKey: "vaseline",
    price: 9000,
    subcategoryId: HANDS,
    tertiaryCategoryId: HAND_MOIST,
    nameAr: "فازلين – كريم اليدين والعناية بالأظافر Healthy Hands Stronger Nails 200 مل",
    nameEn: "Vaseline Intensive Care Healthy Hands Stronger Nails Hand Cream – 200 ml",
    descriptionAr:
      "كريم يدين فازلين Healthy Hands Stronger Nails — بالكيراتين وفازلين جيلي لترطيب اليدين ودعم مظهر أظافر أقوى وأكثر صحة.\n\n• يرطب اليدين الجافة بسرعة.\n• عناية مزدوجة لليدين والأظافر.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Intensive Care Healthy Hands Stronger Nails Hand Cream — with keratin and Vaseline Jelly to moisturize hands and support stronger-looking nails.\n\n• Quickly hydrates dry hands.\n• Dual care for hands and nails.\n• Size: 200 ml.",
  },
  {
    barcode: "8999999533373",
    brandKey: "vaseline",
    price: 9000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت – لوشن الجسم المنعش المبرد Fresh & Bright Cooling 200 مل",
    nameEn: "Vaseline Healthy Bright Fresh & Bright Cooling Body Lotion – 200 ml",
    descriptionAr:
      "لوشن هيلثي برايت المنعش المبرد من فازلين — بالمنثول والصبار وفيتامين B3 لترطيب خفيف وإحساس انتعاش مثالي للمناخ الحار.\n\n• يرطب دون لزوجة.\n• يترك إحساساً بارداً منعشاً على البشرة.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Fresh & Bright Cooling Body Lotion — with menthol, aloe and Vitamin B3 for lightweight hydration and a cooling feel ideal for hot climates.\n\n• Non-sticky moisturization.\n• Leaves a refreshing cool sensation.\n• Size: 200 ml.",
  },
  {
    barcode: "8999999024789",
    brandKey: "vaseline",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت – لوشن Perfect 10 لإصلاح علامات التقدم بالعمر 200 مل",
    nameEn: "Vaseline Healthy Bright Perfect 10 Pro-Age Repair Lotion – 200 ml",
    descriptionAr:
      "لوشن Perfect 10 Pro-Age من فازلين هيلثي برايت — يرطب ويستهدف مظهر البقع الداكنة والخطوط الدقيقة لبشرة أكثر نعومة وإشراقاً.\n\n• عناية تفتيح وإصلاح مظهر التقدم بالعمر للجسم.\n• مناسب للاستخدام اليومي.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Perfect 10 Pro-Age Repair Lotion — moisturizes while targeting the look of dark spots and fine lines for smoother, brighter-looking body skin.\n\n• Brightening and age-appearance care for the body.\n• Suitable for daily use.\n• Size: 200 ml.",
  },
  {
    barcode: "8851932443234",
    brandKey: "vaseline",
    price: 11000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت سوبرفود – لوشن الجسم بالجريب فروت Freshlock 320 مل",
    nameEn: "Vaseline Healthy Bright Superfood Freshlock Grapefruit Body Lotion – 320 ml",
    descriptionAr:
      "لوشن سوبرفود بالجريب فروت من فازلين هيلثي برايت بتقنية Freshlock — ترطيب خفيف ورائحة منعشة مع دعم إشراقة البشرة.\n\n• مستخلص الجريب فروت وإحساس انتعاش يومي.\n• الحجم: 320 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Superfood Freshlock Grapefruit Body Lotion — lightweight hydration with a fresh scent and Freshlock technology to support brighter-looking skin.\n\n• Grapefruit extract with a daily refreshing feel.\n• Size: 320 ml.",
  },
  {
    barcode: "8851932443210",
    brandKey: "vaseline",
    price: 11000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت سوبرفود – لوشن الجسم بالتوت البري Freshlock 320 مل",
    nameEn: "Vaseline Healthy Bright Superfood Freshlock Cranberry Body Lotion – 320 ml",
    descriptionAr:
      "لوشن سوبرفود بالتوت البري من فازلين — بفيتامين C ومرشحات UV لترطيب وتفتيح ودعم تقليل مظهر البقع الداكنة.\n\n• عناية تفتيح يومية برائحة فواكه طازجة.\n• الحجم: 320 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Superfood Freshlock Cranberry Body Lotion — with Vitamin C and UV filters to moisturize, brighten and help reduce the look of dark spots.\n\n• Daily brightening care with a fresh fruity scent.\n• Size: 320 ml.",
  },
  {
    barcode: "8851932443227",
    brandKey: "vaseline",
    price: 11000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت سوبرفود – لوشن الجسم بالخوخ Freshlock 320 مل",
    nameEn: "Vaseline Healthy Bright Superfood Freshlock Peach Body Lotion – 320 ml",
    descriptionAr:
      "لوشن سوبرفود بالخوخ من فازلين هيلثي برايت — بخلاصة الخوخ وفيتامين E ومعزز السيراميد ومرشحات UV لترطيب خفيف وبشرة أكثر إشراقاً.\n\n• رائحة خوخ ناعمة وترطيب يومي.\n• الحجم: 320 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Superfood Freshlock Peach Body Lotion — with peach essence, vitamin E, ceramide booster and UV filters for lightweight hydration and brighter-looking skin.\n\n• Soft peach scent with daily moisture.\n• Size: 320 ml.",
  },
  {
    barcode: "8999999719418",
    brandKey: "vaseline",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت – لوشن GlutaGlow للتفتيح والحماية من الأشعة 200 مل",
    nameEn: "Vaseline Healthy Bright UV Extra Brightening GlutaGlow Lotion – 200 ml",
    descriptionAr:
      "لوشن GlutaGlow من فازلين هيلثي برايت — بالجلوتاثيون والنياسيناميد وحماية UV لترطيب سريع وتفتيح مظهر البشرة.\n\n• امتصاص سريع دون لزوجة.\n• يدعم إشراقة البشرة مع ترطيب يومي.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Healthy Bright UV Extra Brightening GlutaGlow Lotion — with glutathione, niacinamide and UV protection for fast-absorbing moisture and brighter-looking skin.\n\n• Non-sticky, quick absorption.\n• Supports radiance with daily hydration.\n• Size: 200 ml.",
  },
  {
    barcode: "8999999003043",
    brandKey: "vaseline",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_WHITENING,
    nameAr: "فازلين هيلثي برايت – لوشن الحماية من الشمس والتلوث SPF24 PA++ 200 مل",
    nameEn: "Vaseline Healthy Bright Sun + Pollution Protection Lotion SPF24 PA++ – 200 ml",
    descriptionAr:
      "لوشن هيلثي برايت للحماية من الشمس والتلوث من فازلين — SPF24 PA++ مع فيتامين B3 وفازلين جيلي لترطيب وحماية يومية لمظهر بشرة أكثر إشراقاً.\n\n• حماية خفيفة من UVA/UVB مع ترطيب.\n• مناسب للجسم في الاستخدام اليومي.\n• الحجم: 200 مل.",
    descriptionEn:
      "Vaseline Healthy Bright Sun + Pollution Protection Lotion SPF24 PA++ — with Vitamin B3 and Vaseline Jelly for daily moisture plus sun and pollution defence for brighter-looking skin.\n\n• Lightweight UVA/UVB protection with hydration.\n• Suitable for everyday body use.\n• Size: 200 ml.",
  },
  {
    barcode: "8712561940900",
    brandKey: "vaseline",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "فازلين إنتنسيف كير – مرطب الجسم البخاخ بالصبار Aloe Soothe 190 مل",
    nameEn: "Vaseline Intensive Care Aloe Soothe Spray Moisturizer – 190 ml",
    descriptionAr:
      "مرطب جسم بخاخ بالصبار من فازلين إنتنسيف كير — بقطرات فازلين جيلي الدقيقة لترطيب مهدئ سريع الامتصاص وغير دهني.\n\n• تطبيق بخاخ سهل على كامل الجسم.\n• ينعش البشرة الجافة بإحساس خفيف.\n• الحجم: 190 مل.",
    descriptionEn:
      "Vaseline Intensive Care Aloe Soothe Spray Moisturizer — with aloe and Vaseline Jelly micro-droplets for soothing, fast-absorbing, non-greasy hydration.\n\n• Easy spray application for the whole body.\n• Refreshes dry skin with a lightweight feel.\n• Size: 190 ml.",
  },
  {
    barcode: "5059018240705",
    brandKey: "roc",
    price: 35000,
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "روك سولاي بروتكت – سائل واقي شمس مضاد للتجاعيد SPF50 50 مل",
    nameEn: "RoC Soleil Protect Anti-Wrinkle Smoothing Fluid SPF50 – 50 ml",
    descriptionAr:
      "سائل واقي شمس روك سولاي بروتكت SPF50 — حماية واسعة من UVA/UVB بتركيبة خفيفة مضادة للتجاعيد دون أثر أبيض واضح.\n\n• مناسب للاستخدام اليومي على الوجه.\n• ملمس سائل ناعم سهل الدمج.\n• الحجم: 50 مل.",
    descriptionEn:
      "RoC Soleil Protect Anti-Wrinkle Smoothing Fluid SPF50 — broad UVA/UVB protection in a lightweight anti-wrinkle fluid with no heavy white cast.\n\n• Suitable for daily facial use.\n• Smooth fluid texture that blends easily.\n• Size: 50 ml.",
  },
  {
    barcode: "5059018432360",
    brandKey: "avon",
    price: 25000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "أفون أنيو – سيروم فيتامين C لإشراقة البشرة القصوى 30 مل",
    nameEn: "Avon Anew Vitamin C Radiance Maximising Serum – 30 ml",
    descriptionAr:
      "سيروم أفون أنيو بفيتامين C بنسبة عالية — يضيء البشرة وينعم ملمسها بتركيبة خالية من الزيت لإشراقة صحية.\n\n• يدعم توحيد اللون وتقليل مظهر البهتان.\n• خفيف وسريع الامتصاص.\n• الحجم: 30 مل.",
    descriptionEn:
      "Avon Anew Vitamin C Radiance Maximising Serum — brightens and refines texture with a high-potency vitamin C, oil-free formula for a healthy glow.\n\n• Helps even tone and reduce the look of dullness.\n• Lightweight and fast-absorbing.\n• Size: 30 ml.",
  },
  {
    barcode: "381371020652",
    brandKey: "johnsons",
    price: 10000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "جونسون – جل زيت الأطفال بزبدة الشيا والكاكاو 192 مل",
    nameEn: "Johnson's Baby Oil Gel with Shea & Cocoa Butter – 192 ml",
    descriptionAr:
      "جل زيت جونسون للأطفال بزبدة الشيا والكاكاو — يحبس الرطوبة بتركيبة زيت معدني غنية، مختبر جلدياً ومناسب لترطيب الجسم.\n\n• يُستخدم على البشرة الرطبة بعد الاستحمام.\n• يترك البشرة ناعمة ومحمية من الجفاف.\n• الحجم: 192 مل / 6.5 أونصة.",
    descriptionEn:
      "Johnson's Baby Oil Gel with Shea & Cocoa Butter — locks in moisture with a rich mineral-oil gel, dermatologist-tested for body hydration.\n\n• Apply to damp skin after bathing.\n• Leaves skin soft and protected from dryness.\n• Size: 192 ml / 6.5 fl oz.",
  },
  {
    barcode: "5059018153685",
    brandKey: "avon",
    price: 22000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "أفون أنيو بايوتيكس – لوشن العلاج المزدوج المنقّي للبشرة 30 مل",
    nameEn: "Avon Anew Biotics Dual Clarifying Treatment Lotion – 30 ml",
    descriptionAr:
      "لوشن أفون أنيو بايوتيكس المزدوج — ببريبيوتيك وبوستبيوتيك وحمض الساليسيليك لتنقية البشرة وتقليل مظهر الشوائب والتصبغات.\n\n• عناية علاجية مركّزة للبشرة غير المتجانسة.\n• الحجم: 30 مل.",
    descriptionEn:
      "Avon Anew Biotics Dual Clarifying Treatment Lotion — with prebiotics, postbiotics and salicylic acid to clarify skin and help reduce the look of blemishes and discoloration.\n\n• Targeted care for uneven, blemish-prone skin.\n• Size: 30 ml.",
  },
  {
    barcode: "5059018495570",
    brandKey: "avon",
    price: 22000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "أفون أنيو – كريم مائي بالهيالورونيك للترطيب والامتلاء 50 مل",
    nameEn: "Avon Anew HA Hydrate & Plump Water Cream – 50 ml",
    descriptionAr:
      "كريم أفون أنيو المائي بحمض الهيالورونيك — ملمس خفيف يشبه الماء يرطب ويمنح مظهر امتلاء ونضارة للبشرة.\n\n• ترطيب يومي دون ثقل.\n• مناسب للبشرة التي تحتاج انتعاشاً فورياً.\n• الحجم: 50 مل.",
    descriptionEn:
      "Avon Anew HA Hydrate & Plump Water Cream — a lightweight water-cream with hyaluronic acid for hydration and a plumper, fresher-looking complexion.\n\n• Daily moisture without heaviness.\n• Ideal for skin needing an instant refreshed feel.\n• Size: 50 ml.",
  },
  {
    barcode: "5059018014504",
    brandKey: "avon",
    price: 18000,
    subcategoryId: SUN,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "أفون كير سن+ – واقي شمس للوجه Shine Control SPF50 50 مل",
    nameEn: "Avon Care Sun+ Shine Control Facial Sun Cream SPF50 – 50 ml",
    descriptionAr:
      "واقي شمس أفون كير سن+ للوجه SPF50 — حماية UVA/UVB خالية من الزيت بمفعول مطفٍ ومقاومة للماء للتحكم بلمعان البشرة.\n\n• مناسب للبشرة الدهنية والمختلطة.\n• الحجم: 50 مل.",
    descriptionEn:
      "Avon Care Sun+ Shine Control Facial Sun Cream SPF50 — oil-free UVA/UVB protection with a mattifying, water-resistant finish to help control shine.\n\n• Suitable for oily and combination skin.\n• Size: 50 ml.",
  },
  {
    barcode: "5059018105073",
    brandKey: "avon",
    price: 28000,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "أفون أنيو بلاتينيوم – كريم ليلي مجدد للبشرة 50 مل",
    nameEn: "Avon Anew Platinum Night Replenishing Cream – 50 ml",
    descriptionAr:
      "كريم أفون أنيو بلاتينيوم الليلي — بتقنية Protinol لدعم تماسك البشرة وتنعيم مظهر التجاعيد أثناء الليل، مختبر جلدياً.\n\n• عناية ليلية مركّزة للبشرة الناضجة.\n• الحجم: 50 مل.",
    descriptionEn:
      "Avon Anew Platinum Night Replenishing Cream — with Protinol technology to support firmness and smooth the look of wrinkles overnight; dermatologically tested.\n\n• Intensive night care for mature-looking skin.\n• Size: 50 ml.",
  },
  {
    barcode: "5059018016027",
    brandKey: "avon",
    price: 12000,
    subcategoryId: FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "أفون نوترا إفكتس – رغوة تنظيف الوجه مات فلافي 150 مل",
    nameEn: "Avon Nutra Effects Matte Fluffy Foaming Cleanser – 150 ml",
    descriptionAr:
      "رغوة تنظيف أفون نوترا إفكتس مات فلافي — تزيل الزيوت والشوائب وتمنح مظهراً مطفياً مع فيتامين B وزبدة الشيا.\n\n• تنظيف يومي للبشرة الدهنية أو اللامعة.\n• الحجم: 150 مل.",
    descriptionEn:
      "Avon Nutra Effects Matte Fluffy Foaming Cleanser — removes excess sebum and impurities for a mattified finish with vitamin B and shea butter.\n\n• Daily cleanse for oily or shiny skin.\n• Size: 150 ml.",
  },
  {
    barcode: "5059018439215",
    brandKey: "avon",
    price: 12000,
    subcategoryId: FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "أفون كليرسكين – رغوة تنظيف منعشة للبشرة المعرضة للحبوب 150 مل",
    nameEn: "Avon Clearskin Blemish Clearing Fresh Bubble Cleanser – 150 ml",
    descriptionAr:
      "رغوة تنظيف أفون كليرسكين المنعشة — تركيبة فقاعات تنظف البشرة المعرضة للحبوب وتزيل الشوائب بإحساس منعش.\n\n• مناسب للتنظيف اليومي للبشرة الدهنية والمعرضة للشوائب.\n• الحجم: 150 مل.",
    descriptionEn:
      "Avon Clearskin Blemish Clearing Fresh Bubble Cleanser — a refreshing bubble foam that cleanses blemish-prone skin and removes impurities.\n\n• Suitable for daily cleansing of oily, blemish-prone skin.\n• Size: 150 ml.",
  },
  {
    barcode: "3574661391335",
    brandKey: "neutrogena",
    price: 18000,
    subcategoryId: BODY,
    tertiaryCategoryId: BODY_LOTION,
    nameAr: "نيوتروجينا هايدرو بوست – كريم جل الجسم المرطب 250 مل",
    nameEn: "Neutrogena Hydro Boost Body Gel Cream – 250 ml",
    descriptionAr:
      "كريم جل الجسم هايدرو بوست من نيوتروجينا — بحمض الهيالورونيك لترطيب طويل الأمد بملمس خفيف سريع الامتصاص وغير دهني.\n\n• يرطب بعمق دون ثقل.\n• مناسب للاستخدام اليومي على الجسم.\n• الحجم: 250 مل.",
    descriptionEn:
      "Neutrogena Hydro Boost Body Gel Cream — with hyaluronic acid for long-lasting hydration in a lightweight, fast-absorbing, non-greasy gel-cream.\n\n• Deep moisture without heaviness.\n• Suitable for daily body use.\n• Size: 250 ml.",
  },
  {
    barcode: "5059018452931",
    brandKey: "avon",
    price: 18000,
    subcategoryId: FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "أفون أنيو – تونر فيتامين C لإشراقة البشرة 200 مل",
    nameEn: "Avon Anew Vitamin C Radiance Maximising Tonic – 200 ml",
    descriptionAr:
      "تونر أفون أنيو بفيتامين C مع أحماض الجليكوليك واللاكتيك — يضيء البشرة ويقشر بلطف ويدعم إشراقة ونعومة الملمس.\n\n• خطوة يومية بعد التنظيف وقبل السيروم.\n• الحجم: 200 مل.",
    descriptionEn:
      "Avon Anew Vitamin C Radiance Maximising Tonic — with vitamin C, glycolic and lactic acids to brighten, gently exfoliate and refine skin texture.\n\n• Daily step after cleansing, before serum.\n• Size: 200 ml.",
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

async function resolveBrandId(key: BrandKey): Promise<string> {
  const b = BRANDS[key];
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: b.brandAr,
    brandEn: b.brandEn,
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error(`Brand resolve failed: ${b.brandEn}`);
  console.log(`Brand: ${b.brandEn} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
  return resolved.brand.id;
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${barcode.slice(-6)}`;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`To add: ${PRODUCTS.length} | unresolved skipped: ${UNRESOLVED_BARCODES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of Object.keys(BRANDS) as BrandKey[]) {
    brandIds[key] = await resolveBrandId(key);
  }
  console.log("");

  let added = 0;
  for (const p of PRODUCTS) {
    const brand = BRANDS[p.brandKey];
    const brandId = brandIds[p.brandKey]!;
    const slug = slugify(p.nameEn, p.barcode);
    const sku = `${brand.prefix}-${p.barcode.slice(-6)}`;

    console.log(`--- ${p.barcode} ---`);
    await deleteByBarcode(p.barcode);

    const created = await api<{ id: string }>("/products", "POST", {
      sku,
      barcode: p.barcode,
      slug,
      brandId,
      categoryId: CARE,
      subcategoryId: p.subcategoryId,
      subcategoryIds: [p.subcategoryId],
      tertiaryCategoryId: p.tertiaryCategoryId,
      tertiaryCategoryIds: [p.tertiaryCategoryId],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: Math.round((p.price * 1.15) / 500) * 500,
      stock: 0,
      isActive: true,
      imageIds: [],
    });

    const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Shades present on ${p.barcode}`);
    console.log(`  ✓ ${p.nameAr}`);
    console.log(`    EN: ${p.nameEn}`);
    console.log(`    ID: ${created.id} | ${p.price} IQD | images: ${verify.images?.length ?? 0}\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Done — added ${added}/${PRODUCTS.length}`);
  if (UNRESOLVED_BARCODES.length) {
    console.log("\nUnresolved barcodes (not added — no reliable product match):");
    for (const b of UNRESOLVED_BARCODES) console.log(`  - ${b}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
