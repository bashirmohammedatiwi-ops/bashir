/**
 * GOSH Copenhagen — 19 separate single-SKU products (no shades).
 * Source: goshcopenhagen.com (verified names, descriptions, images)
 * Usage: npx tsx scripts/add-gosh-batch-19-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";

const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const SUN_CARE = "25dc8086-bffa-47af-aaf7-64d503e58a9f";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";

const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";
const MAKEUP_SPRAY = "afb26abb-e48f-4ced-8863-2c3ba1333505";
const MAKEUP_REMOVERS = "a53f7b8d-1b45-4fa8-9055-d5de6fac6ab8";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const LIP_TINT = "b53dd3be-ae16-47a4-a306-238f2060b8d8";
const EYE_CARE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";
const FACE_MOISTURIZER = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";
const SUNSCREEN = "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2";
const EYEBROW_GEL = "a6620b04-09ee-427c-a195-5b0626276fc9";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";
const TAGO = "https://tagomago.pl/cdn/shop/files";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5701278601801",
    slug: "gosh-velvet-touch-foundation-primer-classic",
    sku: "GSH-VTP-601801",
    price: 13000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "كوش - برايمر وجه فيلفيت تاتش كلاسيك شفاف 30 مل",
    nameEn: "GOSH Copenhagen - Velvet Touch Foundation Primer Classic 30ml",
    descriptionAr:
      "برايمر فيلفيت تاتش كلاسيك من كوش — قاعدة شفافة تملأ الخطوط الدقيقة والمسام لبشرة ناعمة كالمخمل قبل الفاونديشن.\n\n" +
      "• يملأ الخطوط الدقيقة والمسام العميقة.\n" +
      "• لمسة نهائية ناعمة كالحرير تسهّل تطبيق الفاونديشن.\n" +
      "• يُطبّق على بشرة نظيفة أو بعد المرطب.\n" +
      "• خالٍ من العطر — نباتي (Vegan).\n" +
      "• مناسب لجميع أنواع البشرة.",
    descriptionEn:
      "GOSH Copenhagen Velvet Touch Foundation Primer Classic — transparent primer that fills fine lines and pores for a silky-smooth base.\n\n" +
      "• Fills fine lines and deep pores.\n" +
      "• Silky-smooth finish for easy, even foundation application.\n" +
      "• Apply on clean skin or after moisturiser.\n" +
      "• Perfume-free and vegan.\n" +
      "• Suitable for all skin types.",
    imageUrls: [`${CDN}/5701278601801.jpg`, `${CDN}/5701278601801_grande.jpg`],
  },
  {
    barcode: "5701278601849",
    slug: "gosh-velvet-touch-foundation-primer-anti-wrinkle",
    sku: "GSH-VTP-601849",
    price: 14000,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "كوش - برايمر وجه فيلفيت تاتش مضاد للتجاعيد 30 مل",
    nameEn: "GOSH Copenhagen - Velvet Touch Foundation Primer Anti Wrinkle 30ml",
    descriptionAr:
      "برايمر فيلفيت تاتش مضاد للتجاعيد من كوش — قاعدة مكياج تعالج علامات التقدّم في السن وتنعّم البشرة قبل وضع الفاونديشن.\n\n" +
      "• تركيبة مضادة للتجاعيد تملأ الخطوط الدقيقة.\n" +
      "• يمنح بشرة ناعمة ومتساوية لثبات أطول للمكياج.\n" +
      "• يُطبّق على بشرة نظيفة أو بعد المرطب.\n" +
      "• خالٍ من العطر — نباتي (Vegan).\n" +
      "• مناسب لجميع أنواع البشرة.",
    descriptionEn:
      "GOSH Copenhagen Velvet Touch Foundation Primer Anti Wrinkle — anti-ageing makeup base that smooths the skin before foundation.\n\n" +
      "• Anti-wrinkle formula fills fine lines and pores.\n" +
      "• Silky finish for longer-lasting, even makeup.\n" +
      "• Apply on clean skin or after moisturiser.\n" +
      "• Perfume-free and vegan.\n" +
      "• Suitable for all skin types.",
    imageUrls: [`${CDN}/5701278601849_1.jpg`, `${CDN}/5701278601849_1.jpg`],
  },
  {
    barcode: "5711914179359",
    slug: "gosh-primen-set-spray-001-refreshed-skin",
    sku: "GSH-PNS-179359",
    price: 11500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "كوش - سبراي برايمر وتثبيت مكياج 001 ريفريشد سكين 50 مل",
    nameEn: "GOSH Copenhagen - Prime'n Set Spray 001 Refreshed Skin 50ml",
    descriptionAr:
      "سبراي برايمر وتثبيت 001 ريفريشد سكين من كوش — 2 في 1 يثبّت المكياج ويرطّب البشرة بإطلالة منعشة.\n\n" +
      "• يثبّت الفاونديشن والهايلايتر والآيلاينر طوال اليوم.\n" +
      "• يعمل كبرايمر مرطّب أو سبراي تثبيت فوق المكياج.\n" +
      "• يمنح بشرة مشرقة وشابة — يُمتص خلال دقيقة.\n" +
      "• يُستخدم وحده كميست مرطّبة أو فوق المكياج.\n" +
      "• نباتي — معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Prime'n Set Spray 001 Refreshed Skin — 2-in-1 primer and setting spray for long-lasting, fresh makeup.\n\n" +
      "• Keeps foundation, highlighter and liner in place all day.\n" +
      "• Works as a hydrating primer or finishing spray over makeup.\n" +
      "• Leaves skin looking radiant and youthful — fully absorbed in one minute.\n" +
      "• Use alone as a face mist or over makeup.\n" +
      "• Vegan and Allergy Certified.",
    imageUrls: [`${CDN}/5711914179359.jpg`, `${CDN}/5711914179359_grande.jpg`],
  },
  {
    barcode: "5711914187606",
    slug: "gosh-2-phase-eye-makeup-remover-100ml",
    sku: "GSH-2PE-187606",
    price: 9500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_REMOVERS,
    nameAr: "كوش - مزيل مكياج عيون ثنائي الطور 100 مل",
    nameEn: "GOSH Copenhagen - 2 Phase Eye Makeup Remover 100ml",
    descriptionAr:
      "مزيل مكياج عيون ثنائي الطور من كوش — يزيل الماسكارا المقاومة للماء بلطف دون ترك طبقة دهنية.\n\n" +
      "• يزيل المكياج المقاوم للماء بلطف وفعالية.\n" +
      "• قوام خفيف كالريشة — لا يترك زيوت زائدة.\n" +
      "• يحتوي على ألانتوين و بروفيتامين B5 لتهدئة وترطيب منطقة العين.\n" +
      "• يُرجّ جيداً قبل الاستخدام.\n" +
      "• نباتي — مناسب للبشرة الحساسة.",
    descriptionEn:
      "GOSH Copenhagen 2 Phase Eye Makeup Remover — gently removes waterproof mascara without leaving excess oil.\n\n" +
      "• Effectively removes waterproof eye makeup.\n" +
      "• Feather-light consistency with no greasy residue.\n" +
      "• Contains Allantoin and Provitamin B5 to soothe and moisturise.\n" +
      "• Shake well before use.\n" +
      "• Vegan — suitable for sensitive skin.",
    imageUrls: [
      `${CDN}/5711914187606_0f74a7ea-67de-4fdb-86fc-0128f706e9cf.jpg`,
      `${CDN}/5711914187606_0f74a7ea-67de-4fdb-86fc-0128f706e9cf_grande.jpg`,
    ],
  },
  {
    barcode: "5711914209773",
    slug: "gosh-primen-set-spray-002-dewy-skin",
    sku: "GSH-PNS-209773",
    price: 11500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "كوش - سبراي برايمر وتثبيت مكياج 002 ديوي سكين 50 مل",
    nameEn: "GOSH Copenhagen - Prime'n Set Spray 002 Dewy Skin 50ml",
    descriptionAr:
      "سبراي برايمر وتثبيت 002 ديوي سكين من كوش — إشراقة طبيعية وترطيب مع ثبات مكياج طويل.\n\n" +
      "• يمنح إطلالة ديوي مشرقة دون ثقل أو دهون.\n" +
      "• يعمل كبرايمر مرطّب وسبراي تثبيت في آن واحد.\n" +
      "• يثبّت المكياج ويمنح البشرة توهجاً صحياً.\n" +
      "• مناسب لجميع أنواع البشرة.\n" +
      "• نباتي — معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Prime'n Set Spray 002 Dewy Skin — natural glow and hydration with long-lasting makeup hold.\n\n" +
      "• Delivers a dewy, radiant finish without heaviness.\n" +
      "• Works as both a hydrating primer and setting spray.\n" +
      "• Sets makeup while keeping skin looking fresh and luminous.\n" +
      "• Suitable for all skin types.\n" +
      "• Vegan and Allergy Certified.",
    imageUrls: [`${CDN}/5711914209773_1.jpg`, `${CDN}/5711914209773_2.jpg`],
  },
  {
    barcode: "5711914208516",
    slug: "gosh-micellar-cleansing-water-150ml",
    sku: "GSH-MCW-208516",
    price: 9000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "كوش - ماء ميسيلار لتنظيف وإزالة المكياج 150 مل",
    nameEn: "GOSH Copenhagen - Micellar Cleansing Water 150ml",
    descriptionAr:
      "ماء ميسيلار من كوش — منظّف شامل قوي ولطيف يزيل المكياج والشوائب بخطوة واحدة.\n\n" +
      "• تقنية ميسيلار تلتقط الأوساخ والزيوت والمكياج كالمغناطيس.\n" +
      "• يحتوي على بروفيتامين B5 لترطيب البشرة وتقوية حاجزها.\n" +
      "• منظّف ومزيل مكياج في منتج واحد.\n" +
      "• لطيف على جميع أنواع البشرة حتى الحساسة.\n" +
      "• خالٍ من العطر — نباتي — معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Micellar Cleansing Water — powerful yet gentle all-in-one cleanser and makeup remover.\n\n" +
      "• Micellar technology lifts dirt, oil and makeup like a magnet.\n" +
      "• Provitamin B5 locks in moisture and strengthens the skin barrier.\n" +
      "• All-in-one cleanser and makeup remover.\n" +
      "• Gentle for all skin types, including sensitive skin.\n" +
      "• Perfume-free, vegan and Allergy Certified.",
    imageUrls: [
      `${CDN}/5711914208516_b6a3e51c-3818-437d-a5ae-6433b2df9bc3.jpg`,
      `${CDN}/5711914208516_b6a3e51c-3818-437d-a5ae-6433b2df9bc3_grande.jpg`,
    ],
  },
  {
    barcode: "5711914216313",
    slug: "gosh-skin-care-cleansing-mousse-150ml",
    sku: "GSH-CM-216313",
    price: 10500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "كوش - رغوة تنظيف وتنقية الوجه 150 مل",
    nameEn: "GOSH Copenhagen - Skin Care Cleansing Mousse 150ml",
    descriptionAr:
      "رغوة تنظيف الوجه من كوش — تنظيف لطيف وفعّال للبشرة الحساسة والمعرضة لحب الشباب.\n\n" +
      "• Sodium Cocoyl Glutamate من زيت جوز الهند — تنظيف رغوي لطيف.\n" +
      "• غنية بـ Pink Nectar وفيتامين B12 للترطيب والتغذية.\n" +
      "• تزيل المكياج والزيوت والشوائب دون تجفيف.\n" +
      "• تحسّن مرونة البشرة وتتركها ناعمة ومنعشة.\n" +
      "• تُطبّق على بشرة رطبة صباحاً ومساءً ثم تُشطف.",
    descriptionEn:
      "GOSH Copenhagen Cleansing Mousse — mild yet effective foam cleanser for sensitive and acne-prone skin.\n\n" +
      "• Sodium Cocoyl Glutamate from coconut oil for a gentle foaming cleanse.\n" +
      "• Enriched with Pink Nectar and Vitamin B12 to moisturise and nourish.\n" +
      "• Removes makeup, oil and impurities without stripping the skin.\n" +
      "• Improves skin elasticity and leaves skin soft and fresh.\n" +
      "• Apply to damp skin morning and evening, then rinse.",
    imageUrls: [
      `${CDN}/5711914216313_1_ef5ec4c6-e5a2-4daa-b78b-070c6f609b2a.jpg`,
      `${CDN}/5711914216313_1_ef5ec4c6-e5a2-4daa-b78b-070c6f609b2a_grande.jpg`,
    ],
  },
  {
    barcode: "5711914190767",
    slug: "gosh-lash-extension-mascara-001-extreme-black",
    sku: "GSH-LEM-190767",
    price: 12000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا لاش اكستنشن لتطويل الرموش 001 إكستريم بلاك 7 مل",
    nameEn: "GOSH Copenhagen - Lash Extension Mascara 001 Extreme Black 7ml",
    descriptionAr:
      "ماسكارا لاش اكستنشن من كوش — إطلالة رموش طويلة وكثيفة كالرموش الصناعية مع مرآة مدمجة للتطبيق أثناء التنقل.\n\n" +
      "• بوليمرات خاصة تلتف حول كل رمشة وتطيلها بسرعة.\n" +
      "• ثبات قوي وسهل الإزالة — ليست مقاومة للماء لكنها تدوم طويلاً.\n" +
      "• مرآة مدمجة في العبوة للمسات سريعة.\n" +
      "• خالية من العطر — نباتية — معتمدة Allergy Certified.\n" +
      "• مثالية للعيون الحساسة.",
    descriptionEn:
      "GOSH Copenhagen Lash Extension Mascara 001 Extreme Black — lash-extension effect with a built-in mirror for on-the-go touch-ups.\n\n" +
      "• Special polymers grip and lengthen each lash with every stroke.\n" +
      "• Long-wearing yet easy to remove — allergy certified.\n" +
      "• Built-in mirror on the packaging.\n" +
      "• Fragrance-free and vegan.\n" +
      "• Perfect for sensitive eyes.",
    imageUrls: [
      `${CDN}/5711914190767_120ad4bc-086e-412d-956e-15c57ccd2ac5.jpg`,
      `${CDN}/5711914190767_120ad4bc-086e-412d-956e-15c57ccd2ac5_grande.jpg`,
    ],
  },
  {
    barcode: "5711914049775",
    slug: "gosh-primer-plus-003-hydration",
    sku: "GSH-PPH-049775",
    price: 13500,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: FACE_PRIMER,
    nameAr: "كوش - برايمر بلس ترطيب 003 هايدريشن 30 مل",
    nameEn: "GOSH Copenhagen - Primer+ 003 Hydration 30ml",
    descriptionAr:
      "برايمر بلس هايدريشن من كوش — أكثر من قاعدة مكياج؛ ترطيب فوري ومكافحة علامات التقدّم في السن.\n\n" +
      "• يملأ الخطوط الدقيقة والمسام وينعّم البشرة.\n" +
      "• يحتوي على طحالب الثلج (Snow Algae) لمظهر شبابي.\n" +
      "• يُستخدم كبرايمر تحت المكياج أو وحده فوق المرطب.\n" +
      "• خالٍ من العطر والبارابين — نباتي.\n" +
      "• دفئي المنتج بين يديك قبل التطبيق لنتيجة متجانسة.",
    descriptionEn:
      "GOSH Copenhagen Primer+ 003 Hydration — more than a primer: instant hydration with anti-ageing care.\n\n" +
      "• Fills fine lines and pores for a smooth, even base.\n" +
      "• Contains Snow Algae to help preserve a youthful appearance.\n" +
      "• Use under makeup or alone over moisturiser.\n" +
      "• Perfume-free, paraben-free and vegan.\n" +
      "• Warm between hands before applying for seamless blending.",
    imageUrls: [
      `${CDN}/primerplus_hydration_176dbb37-05d6-486d-a61b-1fa4d1cd1bd9.jpg`,
      `${CDN}/primerplus_hydration_176dbb37-05d6-486d-a61b-1fa4d1cd1bd9_grande.jpg`,
    ],
  },
  {
    barcode: "5711914195144",
    slug: "gosh-lip-stain-002-wild-berry",
    sku: "GSH-LS-195144",
    price: 8500,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_TINT,
    nameAr: "كوش - تينت شفاه ليب ستين 002 وايلد بيري 3 مل",
    nameEn: "GOSH Copenhagen - Lip Stain 002 Wild Berry 3ml",
    descriptionAr:
      "تينت شفاه ليب ستين 002 وايلد بيري من كوش — لون شفاه ثابت لساعات بلمسة توت برية جريئة.\n\n" +
      "• لون شبه دائم عالي التصبغ يُمتص في الشفاه.\n" +
      "• لا يتلطخ ولا يترك إحساساً دهنياً — يجف بسرعة.\n" +
      "• طبقة واحدة للون طبيعي أو أكثر للون أقوى.\n" +
      "• يُستخدم وحده أو مع لمعان الشفاه.\n" +
      "• لون 002 وايلد بيري — توت برية غني.",
    descriptionEn:
      "GOSH Copenhagen Lip Stain 002 Wild Berry — semi-permanent lip colour that lasts for hours with a bold berry tint.\n\n" +
      "• Highly pigmented formula absorbs into the lips.\n" +
      "• Smudge-resistant, quick-drying and non-greasy.\n" +
      "• One layer for a natural tint or build for more intensity.\n" +
      "• Wear alone or topped with lip gloss.\n" +
      "• Shade 002 Wild Berry — rich berry tone.",
    imageUrls: [`${CDN}/5711914195144.jpg`, `${CDN}/5711914195144_grande.jpg`],
  },
  {
    barcode: "5711914187804",
    slug: "gosh-bright-eyes-revitalizing-eye-cream-15ml",
    sku: "GSH-BE-187804",
    price: 12500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: EYE_CARE,
    nameAr: "كوش - كريم عيون برايت آيز لإشراقة وتفتيح منطقة العين 15 مل",
    nameEn: "GOSH Copenhagen - Bright Eyes Revitalizing Eye Cream 15ml",
    descriptionAr:
      "كريم عيون برايت آيز من كوش — إسعاف فوري للعيون المتعبة يقلل الهالات والانتفاخ.\n\n" +
      "• يفتّح ويرطّب منطقة العين الحساسة.\n" +
      "• يخفّف مظهر الهالات السوداء والانتفاخ تحت العين.\n" +
      "• يحتوي على فيتامين E و Squalane و Cityguard+.\n" +
      "• أداة تطبيق مدمجة للتدليك صباحاً ومساءً.\n" +
      "• مناسب لجميع درجات البشرة — نباتي.",
    descriptionEn:
      "GOSH Copenhagen Bright Eyes Eye Cream — instant first aid for tired eyes, dark circles and puffiness.\n\n" +
      "• Brightens and moisturises the delicate eye area.\n" +
      "• Helps minimise under-eye bags and dark circles.\n" +
      "• With Vitamin E, Squalane and Cityguard+.\n" +
      "• Built-in applicator for morning and evening massage.\n" +
      "• Suitable for all skin tones — vegan.",
    imageUrls: [
      `${CDN}/5711914187804_49a99d45-1037-4623-989f-87e477c4582f.jpg`,
      `${CDN}/5711914187804_49a99d45-1037-4623-989f-87e477c4582f_grande.jpg`,
    ],
  },
  {
    barcode: "5711914187651",
    slug: "gosh-hydration-booster-facial-booster-50ml",
    sku: "GSH-HB-187651",
    price: 15000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "كوش - معزز ترطيب هايدريشن بوستر للوجه SPF15 50 مل",
    nameEn: "GOSH Copenhagen - Hydration Booster Intensive Facial Booster 50ml",
    descriptionAr:
      "معزز ترطيب الوجه من كوش — جرعة فورية من الترطيب العميق تمهّد البشرة للمكياج.\n\n" +
      "• ترطيب فوري مع تأثير مبرد ومنعش.\n" +
      "• يُنعّم ويُشرق البشرة لتطبيق فاونديشن مثالي.\n" +
      "• غني بـ MULTIMOIST و Early Boost وحمض الهيالورونيك.\n" +
      "• يحتوي على SPF 15 — يُمتص بسرعة.\n" +
      "• نباتي — معتمد Allergy Certified.",
    descriptionEn:
      "GOSH Copenhagen Hydration Booster — instant deep hydration to prep skin for flawless makeup.\n\n" +
      "• Immediate moisture with a cooling, refreshing effect.\n" +
      "• Smooths and brightens skin for seamless foundation application.\n" +
      "• With MULTIMOIST, Early Boost and Hyaluronic Acid.\n" +
      "• SPF 15 protection — fast-absorbing formula.\n" +
      "• Vegan and Allergy Certified.",
    imageUrls: [`${TAGO}/27442361712150362.jpg`, `${TAGO}/27442361712150362_grande.jpg`],
  },
  {
    barcode: "5711914187705",
    slug: "gosh-anti-wrinkle-face-cream-spf15-50ml",
    sku: "GSH-AW-187705",
    price: 16000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "كوش - كريم وجه مضاد للتجاعيد بي إف 15 50 مل",
    nameEn: "GOSH Copenhagen - Anti-Wrinkle Face Cream SPF15 50ml",
    descriptionAr:
      "كريم وجه مضاد للتجاعيد من كوش — يعيد مرونة البشرة مع ترطيب وحماية SPF 15.\n\n" +
      "• Matrixyl 3000 بنتائج موثقة بعد 6 أسابيع.\n" +
      "• يقلل مظهر التجاعيد ويحسّن لون البشرة ومرونتها.\n" +
      "• فيتامين E يحمي البشرة من الجذور الحرة.\n" +
      "• حماية SPF 15 من أشعة الشمس.\n" +
      "• يُطبّق صباحاً ومساءً على الوجه والرقبة — تجنّبي منطقة العين.",
    descriptionEn:
      "GOSH Copenhagen Anti-Wrinkle Face Cream SPF15 — restores elasticity with hydration and sun protection.\n\n" +
      "• Matrixyl 3000 with documented results after 6 weeks.\n" +
      "• Reduces the appearance of wrinkles and improves skin tone.\n" +
      "• Vitamin E protects against free radicals.\n" +
      "• SPF 15 protection against UV rays.\n" +
      "• Apply morning and evening to face and neck — avoid the eye area.",
    imageUrls: [
      `${CDN}/5711914187705_68ea0cad-94f5-4d55-b42a-d2f55f67c560.jpg`,
      `${CDN}/5711914187705_68ea0cad-94f5-4d55-b42a-d2f55f67c560_grande.jpg`,
    ],
  },
  {
    barcode: "5711914187750",
    slug: "gosh-energizing-gel-face-gel-50ml",
    sku: "GSH-EG-187750",
    price: 14500,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOISTURIZER,
    nameAr: "كوش - جل وجه منشط ومرطب إنرجايزينغ جل 50 مل",
    nameEn: "GOSH Copenhagen - Energizing Gel Refreshing Hydrating Face Gel 50ml",
    descriptionAr:
      "جل وجه إنرجايزينغ من كوش — ترطيب منعش يمنح البشرة حيوية وإشراقة فورية.\n\n" +
      "• قوام جل خفيف يُمتص بسرعة دون ثقل.\n" +
      "• ينشّط البشرة المتعبة ويمنحها مظهراً حيوياً.\n" +
      "• ترطيب عميق مع لمسة منعشة ومريحة.\n" +
      "• مناسب للاستخدام اليومي صباحاً ومساءً.\n" +
      "• نباتي — خالٍ من العطر.",
    descriptionEn:
      "GOSH Copenhagen Energizing Gel — refreshing hydration that instantly revives tired-looking skin.\n\n" +
      "• Lightweight gel texture absorbs quickly without heaviness.\n" +
      "• Energises dull skin for a healthy, radiant look.\n" +
      "• Deep moisture with a cooling, comfortable feel.\n" +
      "• Suitable for daily morning and evening use.\n" +
      "• Vegan and perfume-free.",
    imageUrls: [`${TAGO}/46862521712151128.jpg`, `${TAGO}/46862521712151128_grande.jpg`],
  },
  {
    barcode: "5711914203818",
    slug: "gosh-spf50-protective-cream-dry-sensitive-skin-50ml",
    sku: "GSH-SP-203818",
    price: 17000,
    categoryId: CARE,
    subcategoryId: SUN_CARE,
    tertiaryCategoryId: SUNSCREEN,
    nameAr: "كوش - كريم واقي من الشمس بي إف 50 للبشرة الجافة والحساسة 50 مل",
    nameEn: "GOSH Copenhagen - SPF50 Protective Cream for Dry & Sensitive Skin 50ml",
    descriptionAr:
      "كريم واقي SPF 50 من كوش — حماية عالية من الشمس مصممة للبشرة الجافة والحساسة.\n\n" +
      "• حماية SPF 50 من الأشعة فوق البنفسجية.\n" +
      "• تركيبة مرطّبة تناسب البشرة الجافة والحساسة.\n" +
      "• يحمي من أشعة الشمس ويساعد على منع الشيخوخة المبكرة.\n" +
      "• قوام مريح يُمتص دون بقاء طبقة بيضاء.\n" +
      "• يُطبّق يومياً على الوجه والرقبة قبل التعرض للشمس.",
    descriptionEn:
      "GOSH Copenhagen SPF50 Protective Cream — high sun protection formulated for dry and sensitive skin.\n\n" +
      "• SPF 50 broad-spectrum UV protection.\n" +
      "• Moisturising formula for dry and sensitive skin types.\n" +
      "• Helps prevent premature ageing caused by sun exposure.\n" +
      "• Comfortable texture that absorbs without a white cast.\n" +
      "• Apply daily to face and neck before sun exposure.",
    imageUrls: [
      `${CDN}/5711914203818_0240a99a-6531-475a-84fa-5dc9a26951a5.jpg`,
      `${CDN}/5711914203818_0240a99a-6531-475a-84fa-5dc9a26951a5_grande.jpg`,
    ],
  },
  {
    barcode: "5711914213404",
    slug: "gosh-brow-lift-lamination-wax-001-clear",
    sku: "GSH-BLW-213404",
    price: 9500,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_GEL,
    nameAr: "كوش - شمع حواجب براو ليفت لامينيشن 001 كلير 6 مل",
    nameEn: "GOSH Copenhagen - Brow Lift Lamination Wax 001 Clear 6ml",
    descriptionAr:
      "شمع حواجب براو ليفت لامينيشن من كوش — بديل اقتصادي لتثبيت الحواجب وإعطائها مظهراً أكثر كثافة.\n\n" +
      "• يثبّت شعر الحواجب ويمنح إطلالة لامينيشن احترافية.\n" +
      "• يملأ الفراغات ويخلق وهم كثافة أكبر.\n" +
      "• ثبات أقوى من جل اللامينيشن — قوام شمعي كريمي.\n" +
      "• لون 001 كلير شفاف — مناسب لجميع ألوان الحواجب.\n" +
      "• فرشاة مدمجة في الغطاء لتصفيف الحواجب.",
    descriptionEn:
      "GOSH Copenhagen Brow Lift Lamination Wax 001 Clear — affordable brow lamination for fuller, lifted brows.\n\n" +
      "• Sets and shapes brow hairs for a laminated look.\n" +
      "• Fills gaps and creates the illusion of fuller brows.\n" +
      "• Firmer hold than Lamination Gel — creamy wax texture.\n" +
      "• Shade 001 Clear — suits all brow colours.\n" +
      "• Built-in brow brush in the cap for styling.",
    imageUrls: [
      `${CDN}/5711914213404_1_75df8b4e-5256-4fd0-aecf-1e20283b687f.jpg`,
      `${CDN}/5711914213404_1_75df8b4e-5256-4fd0-aecf-1e20283b687f_grande.jpg`,
    ],
  },
  {
    barcode: "5711914060305",
    slug: "gosh-boombastic-swirl-mascara-001-black",
    sku: "GSH-BS-060305",
    price: 11000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بومباستك سويرل للحجم 001 بلاك",
    nameEn: "GOSH Copenhagen - Boombastic Swirl Mascara 001 Black",
    descriptionAr:
      "ماسكارا بومباستك سويرل من كوش — فرشاة دوّارة فريدة لحجم وتكثيف استثنائي للرموش.\n\n" +
      "• فرشاة سويرل تلتف حول كل رمشة لتوزيع متساوٍ.\n" +
      "• حجم كثيف بلون أسود عميق 001 بلاك.\n" +
      "• تركيبة كريمية سهلة البناء بدون تكتل.\n" +
      "• خالية من العطر — نباتية.\n" +
      "• طبّقي من الجذور إلى الأطراف بحركات متعرجة.",
    descriptionEn:
      "GOSH Copenhagen Boombastic Swirl Mascara 001 Black — unique swirl brush for exceptional lash volume.\n\n" +
      "• Swirl brush wraps around each lash for even coverage.\n" +
      "• Buildable creamy formula with deep black 001 Black pigment.\n" +
      "• Volumising effect without clumping.\n" +
      "• Fragrance-free and vegan.\n" +
      "• Apply from roots to tips in a zigzag motion.",
    imageUrls: [`${CDN}/5711914060305.jpg`, `${CDN}/5711914060305_grande.jpg`],
  },
  {
    barcode: "5711914153175",
    slug: "gosh-boom-boombastic-volume-mascara-001-extreme-black",
    sku: "GSH-BBV-153175",
    price: 12500,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا بوم بومباستك فوليوم للحجم الكثيف 001 إكستريم بلاك 13 مل",
    nameEn: "GOSH Copenhagen - Boom Boombastic Volume Mascara 001 Extreme Black 13ml",
    descriptionAr:
      "ماسكارا بوم بومباستك فوليوم من كوش — حجم خارق للرموش بلون أسود عميق دون تكتل.\n\n" +
      "• فرشاة ألياف تلتقط أصغر الرموش.\n" +
      "• تأثير سوبر فوليوم مع تدرج سهل الطبقات.\n" +
      "• مقاومة للماء — لون 001 إكستريم بلاك.\n" +
      "• خالية من العطر — نباتية.\n" +
      "• ابدئي من خط الرموش واصعدي نحو الأطراف لرفعة إضافية.",
    descriptionEn:
      "GOSH Copenhagen Boom Boombastic Volume Mascara 001 Extreme Black — super volume without clumping.\n\n" +
      "• Fibre brush catches even the smallest lashes.\n" +
      "• Super volume effect with buildable layers.\n" +
      "• Water-resistant deep black 001 Extreme Black pigment.\n" +
      "• Perfume-free and vegan.\n" +
      "• Start at the lash line and build upward for extra lift.",
    imageUrls: [
      `${CDN}/5711914153175_1_07821969-4c9d-4fb8-865a-8a7376baca43.jpg`,
      `${CDN}/5711914153175_1_07821969-4c9d-4fb8-865a-8a7376baca43_grande.jpg`,
    ],
  },
  {
    barcode: "5711914207151",
    slug: "gosh-eyedeal-lashes-mascara-001-black",
    sku: "GSH-EL-207151",
    price: 13000,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "كوش - ماسكارا آيديل لاشز لتكثيف وتجميل الرموش 001 بلاك 8 مل",
    nameEn: "GOSH Copenhagen - Eyedeal Lashes Mascara 001 Black 8ml",
    descriptionAr:
      "ماسكارا آيديل لاشز من كوش — رموش أكثر كثافة وجمالاً بإطلالة طبيعية ولامعة.\n\n" +
      "• تغطي كل رمشة من الجذور إلى الأطراف.\n" +
      "• لون أسود 001 بلاك عميق ومكثّف.\n" +
      "• لا تتقشر ولا تتلطخ — ثبات طوال اليوم.\n" +
      "• خالية من العطر — نباتية — لطيفة على العيون الحساسة.\n" +
      "• إزالة سهلة وآمنة لمنطقة العين الحساسة.",
    descriptionEn:
      "GOSH Copenhagen Eyedeal Lashes Mascara 001 Black — fuller, more beautiful lashes with a natural glossy finish.\n\n" +
      "• Coats each lash from root to tip.\n" +
      "• Deep black 001 Black pigment for intense definition.\n" +
      "• Smudge-proof, flake-free wear all day.\n" +
      "• Fragrance-free, vegan and gentle on sensitive eyes.\n" +
      "• Easy, safe removal for the delicate eye area.",
    imageUrls: [`${CDN}/5711914207151_1.jpg`, `${CDN}/5711914207151_1_grande.jpg`],
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
    brandAr: "كوش",
    brandEn: "GOSH Copenhagen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve GOSH Copenhagen brand");
  return brandId;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) throw new Error(`not an image (${contentType || "unknown"})`);

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
  console.log(`Brand: كوش (${brandId})\n`);

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

    console.log(`  uploading ${product.imageUrls.length} images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      tertiaryCategoryId: product.tertiaryCategoryId,
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryIds: [product.tertiaryCategoryId],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds,
    });

    const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
    console.log(`  ✓ ${product.nameEn}`);
    console.log(`    ID: ${created.id} | shades: ${verify.shades?.length ?? 0} | ${product.price} IQD\n`);
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
