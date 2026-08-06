/**
 * L'Oreal Professionnel Serie Expert + Kérastase — 28 single-SKU hair products (no shades, with images).
 * Source: lorealprofessionnel.com / kerastase.com + verified barcodes
 * Usage: npx tsx scripts/add-lp-kerastase-batch28-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

const LP_IMG = "https://www.lorealprofessionnel.com/-/media/project/loreal/brand-sites/lp";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  brandKey: "lp" | "ks";
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

function tertiary(type: "shampoo" | "conditioner" | "mask" | "oil" | "leave-in" | "spray"): string {
  if (type === "shampoo" || type === "conditioner") return SHAMPOO_CONDITIONER;
  if (type === "mask" || type === "oil") return OIL_MASKS;
  return HAIR_TREATMENT;
}

const PRODUCTS: ProductDef[] = [
  {
    barcode: "3474636976133",
    slug: "loreal-professionnel-serie-expert-silver-conditioner-200ml",
    sku: "LPP-976133",
    price: 34750,
    originalPrice: 38500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("conditioner"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - بلسم Silver للشعر الرمادي والأبيض 200 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Silver Conditioner 200ml",
    descriptionAr:
      "بلسم Silver من لوريال بروفشنال سير إكسبيرت — ينعّم الشعر الرمادي والأبيض ويحيي لمعانه البارد.\n\n" +
      "• يفك التشابك ويرطّب الشعر المصبوغ فاتح أو الرمادي.\n• يقلّل الاصفرار ويحافظ على نقاء اللون.\n• تركيبة احترافية للاستخدام بعد شامبو Silver.\n• يترك الشعر ناعماً وسهل التسريح.\n• يُوزّع على الشعر المغسول من منتصفه للأطراف ثم يُشطف.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Silver Conditioner softens and revives grey, white and light blonde hair.\n\n" +
      "• Detangles and hydrates grey or lightened hair.\n• Helps neutralise yellow tones and preserve cool shades.\n• Professional formula — use after Silver Shampoo.\n• Leaves hair soft and manageable.\n• Apply to mid-lengths and ends after shampoo, then rinse.",
    imageUrls: ["https://ca.lorealpartnershop.com/dw/image/v2/BJWX_PRD/on/demandware.static/-/Sites-master-PPD-CA/default/dw461a72e2/products/3474636976133_EN_01.jpg?sw=800"],
  },
  {
    barcode: "3474636975211",
    slug: "loreal-professionnel-serie-expert-inforcer-conditioner-200ml",
    sku: "LPP-975211",
    price: 34750,
    originalPrice: 38500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("conditioner"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - بلسم Inforcer ضد التقصف 200 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Inforcer Conditioner 200ml",
    descriptionAr:
      "بلسم Inforcer من لوريال بروفشنال — يقوّي الشعر الضعيف المعرّض للتقصف بتركيبة B6 + Biotin.\n\n" +
      "• يقلّل التقصف ويقوّي ألياف الشعر.\n• ينعّم ويفك التشابك بعد الغسيل.\n• مثالي للشعر التالف والهش.\n• يُستخدم بعد شامبو Inforcer.\n• يُوزّع على الشعر المبلل ثم يُشطف جيداً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Inforcer Conditioner strengthens breakage-prone hair with B6 and biotin.\n\n" +
      "• Helps reduce breakage and fortify hair fibres.\n• Softens and detangles after shampooing.\n• Ideal for weak, fragile hair.\n• Use after Inforcer Shampoo.\n• Apply to damp hair and rinse thoroughly.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/inforcer/pdp/anti-breakage-conditioner/1-slider.jpg?rev=8eb335fd7c70441682001f784512e8d4`],
  },
  {
    barcode: "3474637269012",
    slug: "loreal-professionnel-serie-expert-vitamino-color-spectrum-conditioner-200ml",
    sku: "LPP-269012",
    price: 41250,
    originalPrice: 45500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("conditioner"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - بلسم Vitamino Color Spectrum 200 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Conditioner 200ml",
    descriptionAr:
      "بلسم Vitamino Color Spectrum — يحمي لون الشعر المصبوغ ويمنحه إشراقاً طويلاً.\n\n" +
      "• تركيبة Spectrum لحماية اللون وتقليل البهتان.\n• ينعّم الألياف ويفك التشابك.\n• مناسب للشعر المصبوغ بجميع درجاته.\n• يُستخدم بعد شامبو Vitamino Color Spectrum.\n• يُطبّق على الشعر المغسول ثم يُشطف.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Conditioner protects colour vibrancy on colour-treated hair.\n\n" +
      "• Spectrum formula helps prevent colour fade.\n• Softens and detangles coloured hair.\n• Suitable for all colour-treated hair types.\n• Use after Vitamino Color Spectrum Shampoo.\n• Apply to cleansed hair and rinse.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/vitamino-color-spectrum/conditioner/vitamino-color-spectrum-conditioner-slider1.jpg?rev=09ee373cbf2e4629888b773110dd9d93`],
  },
  {
    barcode: "3474636976119",
    slug: "loreal-professionnel-serie-expert-pro-longer-conditioner-200ml",
    sku: "LPP-976119",
    price: 34750,
    originalPrice: 38500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("conditioner"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - بلسم Pro Longer للشعر الطويل 200 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Pro Longer Conditioner 200ml",
    descriptionAr:
      "بلسم Pro Longer من لوريال بروفشنال — يقوّي الشعر الطويل ويقلّل تقصف الأطراف.\n\n" +
      "• تركيبة Filler-A100 و Amino Acid لإطالة ألياف الشعر.\n• ينعّم ويفك التشابك.\n• مثالي للشعر الطويل والأطراف المتضررة.\n• يُستخدم بعد شامبو Pro Longer.\n• يُوزّع على الأطوال والأطراف ثم يُشطف.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Pro Longer Conditioner strengthens long hair and helps reduce split ends.\n\n" +
      "• Filler-A100 and amino acid complex for length renewal.\n• Softens and detangles long hair.\n• Ideal for long hair with damaged ends.\n• Use after Pro Longer Shampoo.\n• Apply to lengths and ends, then rinse.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/pro-longer/pdp/conditioner-lengths-renewing/1-slider.jpg?rev=1d5387ee294a4b3f8bdb8abcd8fc8502`],
  },
  {
    barcode: "3474636977307",
    slug: "loreal-professionnel-serie-expert-pro-longer-ends-filler-cream-150ml",
    sku: "LPP-977307",
    price: 24750,
    originalPrice: 27500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("leave-in"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - كريم Pro Longer لملء أطراف الشعر 150 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Pro Longer Ends Filler Cream 150ml",
    descriptionAr:
      "كريم Pro Longer Ends Filler — علاج بدون شطف لملء وتقوية أطراف الشعر الطويل.\n\n" +
      "• يملأ الأطراف المتقصفة ويقلّل ظهور التلف.\n• ينعّم ويسهّل التصفيف.\n• للشعر الطويل والأطراف الهشة.\n• يُطبّق على الأطراف على شعر مبلل أو جاف.\n• لا يحتاج شطفاً — للاستخدام اليومي.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Pro Longer Ends Filler Cream is a leave-in treatment for long hair ends.\n\n" +
      "• Helps fill and strengthen split, damaged ends.\n• Smooths and eases styling.\n• For long hair with fragile ends.\n• Apply to ends on damp or dry hair.\n• No rinse — daily use.",
    imageUrls: ["https://images.openbeautyfacts.org/images/products/347/463/697/7307/front_fr.3.400.jpg"],
  },
  {
    barcode: "3474637069155",
    slug: "loreal-professionnel-serie-expert-curl-expression-cream-250ml",
    sku: "LPP-069155",
    price: 30250,
    originalPrice: 33500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("leave-in"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - كريم Curl Expression لتعريف المجعد 250 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Curl Expression Cream 250ml",
    descriptionAr:
      "كريم Curl Expression من لوريال بروفشنال — يعرّف التموجات والمجعد ويقلّل الهيشان.\n\n" +
      "• يمنح تموجات معرّفة ومرنة بدون قسوة.\n• يرطّب الشعر المجعد ويحميه من الرطوبة.\n• مناسب للشعر المموج والمجعد والكيرلي.\n• يُوزّع على الشعر المبلل section بsection.\n• يُستخدم للتصفيف أو كعلاج leave-in.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Curl Expression Cream defines curls and waves while reducing frizz.\n\n" +
      "• Defines curls with flexible, touchable hold.\n• Hydrates curly hair and helps fight humidity.\n• For wavy, curly and coily hair types.\n• Apply section by section on damp hair.\n• Use for styling or as a leave-in treatment.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/curl-expression/cream-activator/ce-cream-activator-slider1.jpg?rev=58bb5526c0bc4eb694499f1bba51c834`],
  },
  {
    barcode: "3474636202447",
    slug: "loreal-professionnel-serie-expert-vitamino-color-fresh-feel-masque-500ml",
    sku: "LPP-202447",
    price: 26750,
    originalPrice: 29500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قناع Vitamino Color Fresh Feel 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Fresh Feel Masque 500ml",
    descriptionAr:
      "قناع Vitamino Color Fresh Feel — علاج منعش يحمي لون الشعر المصبوغ.\n\n" +
      "• Resveratrol ومضادات أكسدة لحماية اللون.\n• يرطّب وينعّم الشعر المصبوغ.\n• قوام خفيف منعش — Fresh Feel.\n• يُترك 3–5 دقائق ثم يُشطف.\n• للاستخدام 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Fresh Feel Masque refreshes and protects colour-treated hair.\n\n" +
      "• Resveratrol and antioxidants for colour protection.\n• Hydrates and softens coloured hair.\n• Lightweight, refreshing masque texture.\n• Leave on 3–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: ["https://s.cdnsbn.com/images/products/20074051144.jpg"],
  },
  {
    barcode: "3474637106331",
    slug: "loreal-professionnel-serie-expert-aminexil-advanced-serum-90ml",
    sku: "LPP-106331",
    price: 77250,
    originalPrice: 85000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("leave-in"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - سيروم Aminexil Advanced ضد تساقط الشعر 90 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Aminexil Advanced Anti-Hair Loss Serum 90ml",
    descriptionAr:
      "سيروم Aminexil Advanced — علاج احترافي ضد تساقط الشعر بتركيز 1.5% Aminexil.\n\n" +
      "• يقوّي تثبيت جذور الشعر ويقلّل التساقط.\n• يعزّz قوة الألياف — +87% أقوى.\n• نتائج ملحوظة من الأسبوع السادس.\n• يُرش على فروة الرأس مساءً (4 أقسام × 5 رشّات).\n• يُدلّk برفق ويُترك دون شطف.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Aminexil Advanced Serum reduces hair loss with 1.5% Aminexil.\n\n" +
      "• Reinforces root anchorage and reduces hair fall.\n• Strengthens fibres — up to +87% stronger hair.\n• Visible results from week 6.\n• Spray on scalp at night (4 sections, 5 sprays each).\n• Massage gently and leave in — no rinse.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/aminexil-advanced/pdp/anti-hair-loss-activator-serum/1-slider.jpg?rev=c3b05c39d46a434aab0e50999844b35b`],
  },
  {
    barcode: "3474630267596",
    slug: "kerastase-specifique-stimuliste-anti-hair-loss-spray-125ml",
    sku: "KRS-267596",
    price: 23000,
    originalPrice: 25500,
    brandKey: "ks",
    tertiaryCategoryId: tertiary("spray"),
    nameAr: "كيراستاس Specifique - بخاخ Stimuliste ضد تساقط الشعر 125 مل",
    nameEn: "Kérastase Specifique Stimuliste Anti-Hair Loss Spray 125ml",
    descriptionAr:
      "بخاخ Stimuliste من كيراستاس Specifique — يعزّز كثافة الشعر ويقلّل التساقط.\n\n" +
      "• ينشّط فروة الرأس ويقوّi جذور الشعر.\n• تركيبة خفيفة للاستخدام اليومي.\n• مناسب للشعر الرقيق والمتساقط.\n• يُرشّ على فروة الرأس على شعر جاف أو مبلل.\n• لا يحتاج شطفاً — للاستخدام المسائي أو الصباحي.",
    descriptionEn:
      "Kérastase Specifique Stimuliste Anti-Hair Loss Spray boosts density and helps reduce hair fall.\n\n" +
      "• Stimulates the scalp and strengthens hair roots.\n• Lightweight daily leave-in formula.\n• For thinning and hair-loss-prone hair.\n• Spray onto scalp on dry or towel-dried hair.\n• No rinse — use morning or evening.",
    imageUrls: ["https://www.kerastase.pt/-/media/project/loreal/brand-sites/kerastase/emea/pt/products/specifique/packshots/stimuliste-specifique-250ml-01-kerastase.png?rev=7fcd4bf973804419a2ba4295bbfb5944"],
  },
  {
    barcode: "3474637292423",
    slug: "loreal-professionnel-serie-expert-absolut-repair-molecular-bi-phase-oil-30ml",
    sku: "LPP-292423",
    price: 28000,
    originalPrice: 31000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("oil"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - زيت Absolut Repair Molecular ثنائي الطور 30 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Absolut Repair Molecular Bi-Phase Oil 30ml",
    descriptionAr:
      "زيت Absolut Repair Molecular ثنائي الطور — إصلاح جزيئي للشعر المتضرر بلمعان يدوم 100 ساعة.\n\n" +
      "• Peptide Bonder + 5 Amino Acids لإصلاح الروابط الداخلية.\n• يُرجّ جيداً قبل الاستخدام.\n• 100 ساعة لمعان + 3 أيام anti-frizz.\n• 1–2 ضخة على شعر جاف أو مبلل (تجنّب الجذور).\n• لا يُشطف — للشعر التالف والمصبوغ.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Absolut Repair Molecular Bi-Phase Oil repairs damaged hair at molecular level.\n\n" +
      "• Peptide bonders and 5 amino acids rebuild internal structure.\n• Shake well before use to blend both phases.\n• Up to 100 hours of shine and 3-day anti-frizz.\n• Apply 1–2 pumps on dry or damp hair, avoiding roots.\n• No rinse — for damaged, colour-treated hair.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/absolut-repair-molecular/arm-bi-phase-oil/arm-bi-phase-oil-slider1.jpg?rev=05dac5009022464db805170703b88830`],
  },
  {
    barcode: "3474637090609",
    slug: "loreal-professionnel-serie-expert-metal-detox-oil-50ml",
    sku: "LPP-090609",
    price: 38000,
    originalPrice: 42000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("oil"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - زيت Metal Detox المركّز 50 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Metal Detox Concentrated Oil 50ml",
    descriptionAr:
      "زيت Metal Detox المركّز — يحمي الشعر من ترسبات المعادن في الماء ويقلّل التقصف.\n\n" +
      "• Glicoamine لتحييد المعادن داخل الألياف.\n• حماية من الحرارة حتى 230°م.\n• حتى 97% تقصف أقل + لمعان ×2.\n• 1–2 ضخة يومياً على شعر جاف أو مبلل.\n• لا يُشطف — لجميع أنواع الشعر.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Metal Detox Concentrated Oil protects hair from metal deposits in water.\n\n" +
      "• Patented Glicoamine neutralises metal inside the fibre.\n• Heat protection up to 230°C.\n• Up to 97% less breakage and 2x more shine.\n• Apply 1–2 pumps daily on dry or towel-dried hair.\n• No rinse — for all hair types.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/metal-detox/oil/30ml/md-oil-30ml-slider1.jpg?rev=623d3fcab20c4755a1302eb74d4cf9bc`],
  },
  {
    barcode: "3474637268435",
    slug: "loreal-professionnel-serie-expert-vitamino-color-spectrum-glass-shine-serum-50ml",
    sku: "LPP-268435",
    price: 41250,
    originalPrice: 45500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("leave-in"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - سيروم Vitamino Color Spectrum Glass Shine 50 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Glass Shine Serum 50ml",
    descriptionAr:
      "سيروم Glass Shine من Vitamino Color Spectrum — لمعان زجاجي فوري للشعر المصبوغ.\n\n" +
      "• يحمي اللون ويمنح إشراقاً مرآوياً.\n• ينعّم قشرة الشعر ويقلّl الهيشan.\n• قوام خفيف سريع الامتصاص.\n• 2–3 ضخات على الأطوال والأطراف.\n• لا يُشطف — قبل أو بعد التصفيف.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Glass Shine Serum delivers instant glass-like shine.\n\n" +
      "• Protects colour and adds mirror-like radiance.\n• Smooths cuticles and helps reduce frizz.\n• Lightweight, fast-absorbing serum.\n• Apply 2–3 pumps on lengths and ends.\n• No rinse — use before or after styling.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/vitamino-color-spectrum/serum/vitamino-color-spectrum-serum-slider1.jpg?rev=56c26095264542188f8f83ba018cf14e`],
  },
  {
    barcode: "3474637090531",
    slug: "loreal-professionnel-serie-expert-scalp-advanced-anti-oiliness-mask-250ml",
    sku: "LPP-090531",
    price: 41500,
    originalPrice: 46000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قناع Scalp Advanced للفروة الدهنية 250 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Scalp Advanced Anti-Oiliness Mask 250ml",
    descriptionAr:
      "قnaع Scalp Advanced للفروة الدهنية — ينقّي فروة الرأس ويمتص الزيوت الزائدة.\n\n" +
      "• طين منقي 2-in-1 Deep Purifier.\n• يقلّl الدهون ويريح فروة الرأس.\n• للفروة الدهنية والشعر الذي يزداد دهنية سريعاً.\n• يُوزّع على فروة الرأس والجذور.\n• يُترك 5 دقائق ثم يُشطف.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Scalp Advanced Anti-Oiliness Mask purifies oily scalp and absorbs excess sebum.\n\n" +
      "• 2-in-1 deep purifier clay formula.\n• Helps reduce oiliness and refresh the scalp.\n• For oily scalp and fast-greasing hair.\n• Apply to scalp and roots.\n• Leave 5 minutes and rinse.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/scalp-advanced/pdp/anti-oiliness-2-in-1-deep-purifier-clay/1-slider.jpg?rev=cb53db84e750468a989d8bd0eeccb8ea`],
  },
  {
    barcode: "3474637268459",
    slug: "loreal-professionnel-serie-expert-vitamino-color-spectrum-mask-250ml",
    sku: "LPP-268459",
    price: 41250,
    originalPrice: 45500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قناع Vitamino Color Spectrum 250 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Mask 250ml",
    descriptionAr:
      "قnaع Vitamino Color Spectrum — علاج مكثّف لحماية لون الشعر المصبوغ.\n\n" +
      "• يعزّz إشراق اللون ويقلّl البهتان.\n• يرطّب وينعّم الألياف.\n• للشعر المصبوغ بجميع درجاته.\n• يُترك 3–5 دقائق ثم يُشطف.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Mask intensively protects colour-treated hair.\n\n" +
      "• Boosts colour radiance and helps prevent fade.\n• Deeply hydrates and softens fibres.\n• For all colour-treated hair.\n• Leave on 3–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/vitamino-color-spectrum/mask/vitamino-color-spectrum-mask-slider1.jpg?rev=5900ad2167c543ef877f5529a92dba19`],
  },
  {
    barcode: "3474636975297",
    slug: "loreal-professionnel-serie-expert-inforcer-mask-250ml",
    sku: "LPP-975297",
    price: 41250,
    originalPrice: 45500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قnaع Inforcer ضد التقصف 250 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Inforcer Mask 250ml",
    descriptionAr:
      "قnaع Inforcer — علاج مكثّف ضد التقصف للشعر الضعيف.\n\n" +
      "• B6 + Biotin ليقوّي الألياف.\n• ينعّm ويرمّم الشعر الهش.\n• يقلّl التقصف ويسهّl التمشيط.\n• يُترك 3–5 دقائق ثم يُشطف.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Inforcer Mask is an intensive anti-breakage treatment.\n\n" +
      "• B6 and biotin strengthen fragile fibres.\n• Smooths and repairs weak hair.\n• Helps reduce breakage and eases detangling.\n• Leave on 3–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/inforcer/pdp/anti-breakage-masque/1-slider.jpg?rev=698de9128f2d4e69907260730ae14dde`],
  },
  {
    barcode: "3474636976072",
    slug: "loreal-professionnel-serie-expert-pro-longer-mask-250ml",
    sku: "LPP-976072",
    price: 41250,
    originalPrice: 45500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قnaع Pro Longer للشعر الطويل 250 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Pro Longer Mask 250ml",
    descriptionAr:
      "قnaع Pro Longer — علاج مكثّف لإطالة وتقوية الشعر الطويل.\n\n" +
      "• Filler-A100 لملء الألياف وتقليل التقصف.\n• ينعّm الأطوال والأطراف.\n• للشعر الطويل المتضرر.\n• يُترك 3–5 دقائق ثم يُشطف.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Pro Longer Mask renews and strengthens long hair.\n\n" +
      "• Filler-A100 helps fill fibres and reduce split ends.\n• Smooths lengths and ends.\n• For long, damaged hair.\n• Leave on 3–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/pro-longer/pdp/mask-lengths-renewing/1-slider.jpg?rev=68c117d10f7448a2ba1cc3718c23e4d4`],
  },
  {
    barcode: "3474636977369",
    slug: "loreal-professionnel-serie-expert-absolut-repair-10-in-1-oil-90ml",
    sku: "LPP-977369",
    price: 38000,
    originalPrice: 42000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("oil"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - زيت Absolut Repair 10-in-1 90 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Absolut Repair 10-in-1 Oil 90ml",
    descriptionAr:
      "زيت Absolut Repair 10-in-1 — علاج متعدد الفوائد للشعر التالف بزيت جنين القمح.\n\n" +
      "• 10 فوائd: تغذية، لمعان، فك تشابك، حماية حرارية...\n• Gold Quinoa + Protein لإصلاح السطح.\n• حماية حتى 230°م.\n• 2–3 ضخات على شعر جاف أو مبلل.\n• لا يُشطف — للشعر التالف والحساس.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Absolut Repair 10-in-1 Oil is a multi-benefit leave-in for damaged hair.\n\n" +
      "• 10 benefits: nourishment, shine, detangling, heat protection and more.\n• Gold quinoa and protein repair surface damage.\n• Heat protection up to 230°C.\n• Apply 2–3 pumps on dry or towel-dried hair.\n• No rinse — for damaged, sensitized hair.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/absolut-repair/pdp/instant-resurfacing-10-in-1-perfecting-spray/1-slider.jpg?rev=7279005510ef438fa35f86e9a6f4aab2`],
  },
  {
    barcode: "3474637268206",
    slug: "loreal-professionnel-serie-expert-vitamino-color-spectrum-green-shampoo-300ml",
    sku: "LPP-268206",
    price: 20500,
    originalPrice: 22500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - شامبو Vitamino Color Spectrum Green 300 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Green Shampoo 300ml",
    descriptionAr:
      "شامبو Vitamino Color Spectrum Green — يحيّd اللون وي neutralize الدرجات الحمراء غير المرغوبة.\n\n" +
      "• pigments خضراء لشعر مصبوغ به درجات حمراء.\n• يحمي اللون وينظّf بلطف.\n• للشعر المصبوغ أحمر أو كستنائي.\n• يُدلّk على شعر مبلل ثم يُشطف.\n• للاستخدام 1–2 مرات أسبوعياً أو حسب الحاجة.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Green Shampoo neutralises unwanted red tones.\n\n" +
      "• Green pigments for colour-treated hair with red reflects.\n• Gently cleanses while protecting colour.\n• For red or auburn colour-treated hair.\n• Massage into wet hair and rinse.\n• Use 1–2 times per week as needed.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/vitamino-color-spectrum/green-shampoo/vitamino-color-spectrum-green-shampoo-slider1.jpg?rev=30630bb91b9543a08dae4ad796348ab9`],
  },
  {
    barcode: "3474636974429",
    slug: "loreal-professionnel-serie-expert-pro-longer-shampoo-300ml",
    sku: "LPP-974429",
    price: 20500,
    originalPrice: 22500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - شامبو Pro Longer للشعر الطويل 300 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Pro Longer Shampoo 300ml",
    descriptionAr:
      "شامبو Pro Longer — ينظّf ويقوّi الشعر الطويل من الجذور للأطراف.\n\n" +
      "• Filler-A100 + Amino Acid لإطالة الألياf.\n• يقلّl تقصف الأطراف.\n• للشعر الطويل والأطوال المتضررة.\n• يُدلّk على فروة الرأس والأطوال.\n• يُشطف جيداً — للاستخدام اليومي.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Pro Longer Shampoo cleanses and strengthens long hair.\n\n" +
      "• Filler-A100 and amino acids renew hair length.\n• Helps reduce split ends on long hair.\n• For long hair with damaged lengths.\n• Massage into scalp and lengths, then rinse.\n• Daily use.",
    imageUrls: [`${LP_IMG}/master/dmi/hair-care/pro-longer/pdp/shampoo-lengths-renewing/1-slider.jpg?rev=842aca1a1ad943c08c88b47ff2bc784a`],
  },
  {
    barcode: "3474637268510",
    slug: "loreal-professionnel-serie-expert-vitamino-color-spectrum-shampoo-300ml",
    sku: "LPP-268510",
    price: 20500,
    originalPrice: 22500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروfشنال سير إكسبيرت - شامبو Vitamino Color Spectrum 300 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Shampoo 300ml",
    descriptionAr:
      "شامبو Vitamino Color Spectrum — ينظّf ويحمي إشراق لون الشعر المصبوغ.\n\n" +
      "• تركيبة Spectrum لحماية اللون.\n• ينظّf بلطف دون تجفيف.\n• للشعر المصبوغ بجميع الدرجات.\n• يُدلّk ثم يُشطf.\n• للاستخدام اليومي أو المتناوب.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Shampoo cleanses and protects colour radiance.\n\n" +
      "• Spectrum formula for colour protection.\n• Gentle cleanse without stripping colour.\n• For all colour-treated hair shades.\n• Massage and rinse thoroughly.\n• Daily or alternate-day use.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/vitamino-color-spectrum/shampoo/vitamino-color-spectrum-shampoo-slider1.jpg?rev=3356e077187d4b8794987ccf7aee949a`],
  },
  {
    barcode: "3474637268381",
    slug: "loreal-professionnel-serie-expert-vitamino-color-spectrum-purple-shampoo-300ml",
    sku: "LPP-268381",
    price: 20500,
    originalPrice: 22500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروfشنال سير إكسبيرت - شامبو Vitamino Color Spectrum Purple 300 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Purple Shampoo 300ml",
    descriptionAr:
      "شامبو Vitamino Color Spectrum Purple — ي neutralize الاصفرar على الشعر الأشقر والفاتح.\n\n" +
      "• pigments بنفسجية للشعر الأشقر والرمادي.\n• يحيّd اللون البارد ويقلّl brassiness.\n• للشعر المصفّf أو الأشقر المصبوغ.\n• يُترك 2–5 دقائق ثم يُشطf.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Spectrum Purple Shampoo neutralises yellow tones on blonde hair.\n\n" +
      "• Purple pigments for blonde and light colour-treated hair.\n• Revives cool tones and reduces brassiness.\n• For highlighted, bleached or blonde coloured hair.\n• Leave on 2–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/vitamino-color-spectrum/purple-shampoo/vitamino-color-spectrum-purple-shampoo-slider1.jpg?rev=f35f97ec53804c27abb2158444a95f0f`],
  },
  {
    barcode: "3474636975952",
    slug: "loreal-professionnel-serie-expert-vitamino-color-shampoo-500ml",
    sku: "LPP-975952",
    price: 30000,
    originalPrice: 33000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروfشنال سير إكسبيرت - شامبو Vitamino Color 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Shampoo 500ml",
    descriptionAr:
      "شامبو Vitamino Color — ينظّf وي prolong إشراق لون الشعر المصبوغ.\n\n" +
      "• Resveratrol + UV filters لحماية اللون.\n• ينظّf بلطف ويحمي من البهتan.\n• للشعر المصبوغ والهايلايت.\n• يُدلّk على فروة الرأس والأطوال.\n• للاستخدام اليومي.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Shampoo cleanses and prolongs colour radiance.\n\n" +
      "• Resveratrol and UV filters protect colour.\n• Gentle cleanse that helps prevent fade.\n• For colour-treated and highlighted hair.\n• Massage into scalp and lengths.\n• Daily use.",
    imageUrls: [`${LP_IMG}/master/dmi/hair-care/vitamino-color/pdp/color-radiance-system-shampoo/1-slider.jpg?rev=0a99a3b3dbbc4bab87689f84132c5c10`],
  },
  {
    barcode: "3474636975921",
    slug: "loreal-professionnel-serie-expert-absolut-repair-shampoo-500ml",
    sku: "LPP-975921",
    price: 30000,
    originalPrice: 33000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروfشنال سير إكسبيرت - شامبو Absolut Repair 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Absolut Repair Shampoo 500ml",
    descriptionAr:
      "شامبو Absolut Repair — ينظّf ويصلّh الشعر التالف بGold Quinoa + Protein.\n\n" +
      "• إصلاح سطحي فوري للشعر المتضرر.\n• ينعّm ويلمع الألياf.\n• للشعر الجاف والتالf والمصبوغ.\n• يُدلّk ثم يُشطf.\n• للاستخدام اليومي.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Absolut Repair Shampoo cleanses and repairs damaged hair.\n\n" +
      "• Gold quinoa and protein for instant surface repair.\n• Smooths and adds shine to fibres.\n• For dry, damaged and colour-treated hair.\n• Massage and rinse.\n• Daily use.",
    imageUrls: [`${LP_IMG}/master/dmi/hair-care/absolut-repair/pdp/instant-resurfacing-shampoo/1-slider.jpg?rev=fb2bf8813753468ba163185dd3bace2b`],
  },
  {
    barcode: "3474636974269",
    slug: "loreal-professionnel-serie-expert-silver-shampoo-500ml",
    sku: "LPP-974269",
    price: 30000,
    originalPrice: 33000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - شامبو Silver للشعر الرمادي 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Silver Shampoo 500ml",
    descriptionAr:
      "شامبو Silver — ينظّf وي neutralize الاصفرar على الشعر الرمادي والأبيض.\n\n" +
      "• pigments بنفسجية للشعر الرمادي والأشقر الفاتh.\n• يحيّd اللون البارد ويلمع.\n• للشعر الرمادي والأبيض والمصفّf.\n• يُدلّk ثم يُشطf.\n• للاستخدام 2–3 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Silver Shampoo cleanses and neutralises yellow tones on grey hair.\n\n" +
      "• Purple pigments for grey, white and light blonde hair.\n• Revives cool tones and adds shine.\n• For grey, white and lightened hair.\n• Massage and rinse.\n• Use 2–3 times per week.",
    imageUrls: [`${LP_IMG}/emea/inter/hair-care/silver/pdp/silver-grey-hair-shampoo/1-slider.jpg?rev=8c50fc9f7c44424b8bddf97de49a2317`],
  },
  {
    barcode: "3474637072483",
    slug: "loreal-professionnel-serie-expert-curl-expression-shampoo-500ml",
    sku: "LPP-072483",
    price: 29250,
    originalPrice: 32500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("shampoo"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - شامبو Curl Expression 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Curl Expression Shampoo 500ml",
    descriptionAr:
      "شامبو Curl Expression — ينظّf بلطف ويعرّf التموجات والمجعد.\n\n" +
      "• يرطّb الشعر المجعد دون stripping.\n• يقلّl الهيشan ويحافظ على التعريف.\n• للشعر المموج والمجعد والكيرلي.\n• يُدلّk section بsection.\n• للاستخدام اليومي.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Curl Expression Shampoo gently cleanses and defines curls.\n\n" +
      "• Hydrates curly hair without stripping natural oils.\n• Helps reduce frizz and maintain curl definition.\n• For wavy, curly and coily hair.\n• Massage section by section.\n• Daily use.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/curl-expression/shampoo/ce-shampoo-slider1.jpg?rev=d2177450385a47e0a844429fed892f07`],
  },
  {
    barcode: "3474637069162",
    slug: "loreal-professionnel-serie-expert-curl-expression-mask-500ml",
    sku: "LPP-069162",
    price: 45750,
    originalPrice: 50500,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قnaع Curl Expression 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Curl Expression Mask 500ml",
    descriptionAr:
      "قnaع Curl Expression — علاج مكثّf للشعر المجعد والمموج.\n\n" +
      "• يرطّb بعمق ويعرّf التموجات.\n• ينعّm ويقلّl الهيشan.\n• للشعر المجعد الجاف أو التالf.\n• يُترك 5–10 دقائق ثم يُشطf.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Curl Expression Mask deeply nourishes curly and wavy hair.\n\n" +
      "• Deep hydration and curl definition.\n• Smooths and helps reduce frizz.\n• For dry, damaged curly hair.\n• Leave on 5–10 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: [`${LP_IMG}/shared/common/pdp/hair-care/curl-expression/mask/ce-mask-slider1.jpg?rev=e11d265bb9854064bfbaf07282382612`],
  },
  {
    barcode: "3474636975396",
    slug: "loreal-professionnel-serie-expert-pro-longer-mask-500ml",
    sku: "LPP-975396",
    price: 60000,
    originalPrice: 66000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قnaع Pro Longer 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Pro Longer Mask 500ml",
    descriptionAr:
      "قnaع Pro Longer حجم صالon 500 مل — علاج مكثّf للشعر الطويل.\n\n" +
      "• Filler-A100 لملء الألياf وتقليل التقصف.\n• ينعّm الأطوال والأطراف.\n• حجم اقتصادي للاستخدام المتكرر.\n• يُترك 3–5 دقائق ثم يُشطf.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Pro Longer Mask 500ml — salon-size intensive treatment for long hair.\n\n" +
      "• Filler-A100 fills fibres and reduces split ends.\n• Smooths lengths and ends.\n• Economical salon size for regular use.\n• Leave on 3–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: ["https://s.cdnsbn.com/images/products/26269851144.jpg"],
  },
  {
    barcode: "3474636975679",
    slug: "loreal-professionnel-serie-expert-vitamino-color-mask-500ml",
    sku: "LPP-975679",
    price: 60000,
    originalPrice: 66000,
    brandKey: "lp",
    tertiaryCategoryId: tertiary("mask"),
    nameAr: "لوريال بروفشنال سير إكسبيرت - قnaع Vitamino Color 500 مل",
    nameEn: "L'Oreal Professionnel Serie Expert Vitamino Color Mask 500ml",
    descriptionAr:
      "قnaع Vitamino Color حجم 500 مل — علاج مكثّf لحماية لون الشعر المصبوغ.\n\n" +
      "• Resveratrol لحماية اللون وإشراقه.\n• يرطّb وينعّm الألياf.\n• حجم صالon للاستخدام الأسبوعي.\n• يُترك 3–5 دقائق ثم يُشطf.\n• 1–2 مرات أسبوعياً.",
    descriptionEn:
      "L'Oreal Professionnel Serie Expert Vitamino Color Mask 500ml intensively protects colour-treated hair.\n\n" +
      "• Resveratrol preserves colour vibrancy.\n• Deeply hydrates and softens fibres.\n• Salon size for weekly treatment.\n• Leave on 3–5 minutes and rinse.\n• Use 1–2 times per week.",
    imageUrls: ["https://s.cdnsbn.com/images/products/27505651144.jpg"],
  },
];

let token = "";
const brandIds: Record<string, string> = {};

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

async function resolveBrand(key: "lp" | "ks"): Promise<string> {
  if (brandIds[key]) return brandIds[key];
  const spec =
    key === "ks"
      ? { brandAr: "كيراستاس", brandEn: "Kérastase" }
      : { brandAr: "لوريال بروفشنال", brandEn: "L'Oreal Professionnel" };
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    ...spec,
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error(`Could not resolve brand ${key}`);
  brandIds[key] = id;
  console.log(`Brand: ${spec.brandEn} (${id})${resolved.created ? " [created]" : ""}`);
  return id;
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
  console.log(`Products: ${PRODUCTS.length} (with images, no shades)\n`);
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

    const brandId = await resolveBrand(product.brandKey);

    console.log(`  uploading image...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      try {
        imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
      } catch (err) {
        console.log(`  image ${i + 1} failed: ${(err as Error).message}`);
      }
    }
    if (!imageIds.length) throw new Error(`No images uploaded for ${product.barcode}`);

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
      imageIds,
    });

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    EN: ${product.nameEn}`);
    console.log(`    ID: ${created.id} | images: ${imageIds.length} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
