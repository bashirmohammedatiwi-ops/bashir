/**
 * Pantene Pro-V — 30 separate single-SKU hair products (no shades, no images).
 * Usage: npx tsx scripts/add-pantene-batch-30-single-api.ts
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
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "4084500795464",
    slug: "pantene-pro-v-milky-damage-repair-conditioner-360ml",
    sku: "PTN-MDR-795464",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في عناية حليبية - بلسم إصلاح التلف للشعر الجاف والمتضرر 360 مل",
    nameEn: "Pantene Pro-V Milky Damage Repair Conditioner 360ml",
    descriptionAr:
      "بلسم بانتين برو-في العناية الحليبية — يغذّي ويصلّح الشعر الجاف والمتضرر بتركيبة حليبية غنية.\n\n" +
      "• يغذّي الألياف بعمق ويقلّل التقصف.\n• تركيبة Pro-V تقوّي الشعر من الجذور.\n• يسهّل التمشيط ويترك الشعر ناعماً ولامعاً.\n• مناسب للشعر الجاف والمتضرر والمتقصف.\n• مكمّل مثالي لشامبو العناية الحليبية.",
    descriptionEn:
      "Pantene Pro-V Milky Damage Repair Conditioner — milky nourishing formula for dry, damaged hair.\n\n" +
      "• Deeply nourishes fibres and helps reduce breakage.\n• Pro-V formula strengthens hair from the roots.\n• Detangles and leaves hair soft and shiny.\n• Ideal for dry, damaged and brittle hair.\n• Perfect partner to Milky Damage Repair Shampoo.",
  },
  {
    barcode: "4084500795860",
    slug: "pantene-pro-v-colored-hair-repair-conditioner-360ml",
    sku: "PTN-CHR-795860",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - بلسم إصلاح الشعر المصبوغ والملون 360 مل",
    nameEn: "Pantene Pro-V Colored Hair Repair Conditioner 360ml",
    descriptionAr:
      "بلسم بانتين برو-في لإصلاح الشعر المصبوغ — يحمي اللون ويغذّي الألياف المتضررة بالصبغ.\n\n" +
      "• يحافظ على حيوية ولمعان اللون.\n• يصلّح التلف الناتج عن الصبغ والتلوين.\n• يسهّل التمشيط ويقلّل الهيشان.\n• تركيبة Pro-V تقوّي الشعر المصبوغ.\n• مكمّل مثالي لشامبو إصلاح الشعر المصبوغ.",
    descriptionEn:
      "Pantene Pro-V Colored Hair Repair Conditioner — protects colour and nourishes dye-stressed fibres.\n\n" +
      "• Helps maintain colour vibrancy and shine.\n• Repairs damage caused by colouring.\n• Detangles and helps reduce frizz.\n• Pro-V formula strengthens coloured hair.\n• Perfect partner to Colored Hair Repair Shampoo.",
  },
  {
    barcode: "8700216228503",
    slug: "pantene-pro-v-daily-care-2in1-shampoo-375ml",
    sku: "PTN-DC2-228503",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو 2 في 1 للعناية اليومية 375 مل",
    nameEn: "Pantene Pro-V Daily Care 2-in-1 Shampoo 375ml",
    descriptionAr:
      "شامبو بانتين برو-في 2 في 1 للعناية اليومية — ينظف ويرطّب في خطوة واحدة لجميع أنواع الشعر.\n\n" +
      "• تركيبة 2 في 1 تجمع الشامبو والبلسم.\n• ينظف بلطف دون أن يجفّف الشعر.\n• يترك الشعر ناعماً وسهل التصفيف.\n• مناسب للاستخدام اليومي على الشعر العادي.\n• تركيبة Pro-V تغذّي الألياف.",
    descriptionEn:
      "Pantene Pro-V Daily Care 2-in-1 Shampoo — cleanses and conditions in one step for all hair types.\n\n" +
      "• 2-in-1 formula combines shampoo and conditioner.\n• Gently cleanses without drying hair out.\n• Leaves hair soft and manageable.\n• Suitable for daily use on normal hair.\n• Pro-V formula nourishes fibres.",
  },
  {
    barcode: "4084500795297",
    slug: "pantene-pro-v-anti-hair-fall-shampoo-360ml",
    sku: "PTN-AHF-795297",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو ضد تساقط الشعر 360 مل",
    nameEn: "Pantene Pro-V Anti Hair Fall Shampoo 360ml",
    descriptionAr:
      "شامبو بانتين برو-في ضد تساقط الشعر — يقوّي الجذور ويقلّل التساقط الناتج عن التقصف.\n\n" +
      "• يقوّي الشعر من الجذور إلى الأطراف.\n• يقلّل التساقط المرتبط بالتلف والتقصف.\n• ينظف بلطف ويغذّي الألياف.\n• تركيبة Pro-V للشعر الضعيف.\n• للاستخدام اليومي على الشعر المعرّض للتساقط.",
    descriptionEn:
      "Pantene Pro-V Anti Hair Fall Shampoo — strengthens roots and helps reduce breakage-related hair fall.\n\n" +
      "• Strengthens hair from roots to tips.\n• Helps reduce hair fall linked to breakage.\n• Gently cleanses and nourishes fibres.\n• Pro-V formula for weak, fall-prone hair.\n• For daily use on hair prone to falling.",
  },
  {
    barcode: "4084500795648",
    slug: "pantene-pro-v-smooth-silky-conditioner-360ml",
    sku: "PTN-SSS-795648",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - بلسم انسيابي وحريري للشعر المجعد والهيشان 360 مل",
    nameEn: "Pantene Pro-V Smooth & Silky Conditioner 360ml",
    descriptionAr:
      "بلسم بانتين برو-في انسيابي وحريري — ينعّم الشعر المجعد والهيشان ويقلّل التطاير.\n\n" +
      "• يتحكم بالهيشان ويمنح انسيابية فورية.\n• يسهّل التمشيط ويترك الشعر حريرياً.\n• تركيبة Pro-V تغذّي الألياف.\n• مناسب للشعر الجاف والمجعد والهيشان.\n• مكمّل مثالي لشامبو انسيابي وحريري.",
    descriptionEn:
      "Pantene Pro-V Smooth & Silky Conditioner — tames frizz and smooths unruly hair.\n\n" +
      "• Controls frizz for instant smoothness.\n• Detangles and leaves hair silky.\n• Pro-V formula nourishes fibres.\n• Ideal for dry, frizzy and unruly hair.\n• Perfect partner to Smooth & Silky Shampoo.",
  },
  {
    barcode: "4084500795754",
    slug: "pantene-pro-v-moisture-renewal-conditioner-360ml",
    sku: "PTN-MRC-795754",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - بلسم تجديد الترطيب للشعر الجاف 360 مل",
    nameEn: "Pantene Pro-V Moisture Renewal Conditioner 360ml",
    descriptionAr:
      "بلسم بانتين برو-في تجديد الترطيب — يرطّب الشعر الجاف بعمق ويمنع الجفاف.\n\n" +
      "• ترطيب مكثّف للألياف الجافة.\n• يسهّل التمشيط ويترك الشعر ناعماً.\n• تركيبة Pro-V تعيد توازن الرطوبة.\n• مناسب للشعر الجاف والعطشان.\n• مكمّل مثالي لشامبو تجديد الترطيب.",
    descriptionEn:
      "Pantene Pro-V Moisture Renewal Conditioner — deep hydration for dry, thirsty hair.\n\n" +
      "• Intensive moisture for dry fibres.\n• Detangles and leaves hair soft.\n• Pro-V formula restores moisture balance.\n• Ideal for dry and dehydrated hair.\n• Perfect partner to Moisture Renewal Shampoo.",
  },
  {
    barcode: "8006540277676",
    slug: "pantene-pro-v-goodbye-frizz-conditioner-360ml",
    sku: "PTN-GFC-277676",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في وداعاً للتطاير - بلسم ضد الهيشان 360 مل",
    nameEn: "Pantene Pro-V Goodbye Frizz Conditioner 360ml",
    descriptionAr:
      "بلسم بانتين برو-في وداعاً للتطاير — يتحكم بالهيشان ويمنح نعومة تدوم حتى 72 ساعة.\n\n" +
      "• يقلّل التطاير والهيشان في الرطوبة.\n• ينعّم الألياف ويسهّل التصفيف.\n• تركيبة Pro-V مع البانثينول.\n• مناسب للشعر المجعد والهيشان.\n• مكمّل مثالي لشامبو وداعاً للتطاير.",
    descriptionEn:
      "Pantene Pro-V Goodbye Frizz Conditioner — controls frizz for up to 72 hours.\n\n" +
      "• Reduces flyaways and frizz in humidity.\n• Smooths fibres and eases styling.\n• Pro-V formula with panthenol.\n• Ideal for frizzy, unruly hair.\n• Perfect partner to Goodbye Frizz Shampoo.",
  },
  {
    barcode: "4084500795976",
    slug: "pantene-pro-v-sheer-volume-conditioner-360ml",
    sku: "PTN-SVC-795976",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - بلسم للحجم والكثافة للشعر الرفيع 360 مل",
    nameEn: "Pantene Pro-V Sheer Volume Conditioner 360ml",
    descriptionAr:
      "بلسم بانتين برو-في للحجم والكثافة — يمنح الشعر الرفيع حجماً خفيفاً دون أن يثقله.\n\n" +
      "• يعزّز الحجم والكثافة الظاهرية.\n• تركيبة خفيفة لا تثقل الشعر.\n• يسهّل التمشيط ويمنح لمعاناً.\n• مناسب للشعر الرفيع والمسطح.\n• مكمّل مثالي لشامبو الحجم والكثافة.",
    descriptionEn:
      "Pantene Pro-V Sheer Volume Conditioner — lightweight volume for fine, flat hair.\n\n" +
      "• Boosts visible volume and body.\n• Lightweight formula without weighing down.\n• Detangles and adds shine.\n• Ideal for fine and flat hair.\n• Perfect partner to Sheer Volume Shampoo.",
  },
  {
    barcode: "5410076652471",
    slug: "pantene-pro-v-sheer-volume-shampoo-400ml",
    sku: "PTN-SVS-652471",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو للحجم والكثافة للشعر الرفيع 400 مل",
    nameEn: "Pantene Pro-V Sheer Volume Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في للحجم والكثافة — ينظف ويعطي الشعر الرفيع حجماً دون أن يثقله.\n\n" +
      "• يعزّز الحجم والكثافة الظاهرية.\n• ينظف بلطف دون ترسبات ثقيلة.\n• يترك الشعر ممتلئاً ولامعاً.\n• مناسب للشعر الرفيع والمسطح.\n• مكمّل مثالي لبلسم الحجم والكثافة.",
    descriptionEn:
      "Pantene Pro-V Sheer Volume Shampoo — cleanses and adds volume without weighing fine hair down.\n\n" +
      "• Boosts visible volume and fullness.\n• Gently cleanses without heavy build-up.\n• Leaves hair looking fuller and shinier.\n• Ideal for fine and flat hair.\n• Perfect partner to Sheer Volume Conditioner.",
  },
  {
    barcode: "5410076652105",
    slug: "pantene-pro-v-milky-damage-repair-shampoo-400ml",
    sku: "PTN-MDS-652105",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في عناية حليبية - شامبو إصلاح التلف 400 مل",
    nameEn: "Pantene Pro-V Milky Damage Repair Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في العناية الحليبية — ينظف ويغذّي الشعر الجاف والمتضرر.\n\n" +
      "• تركيبة حليبية تغذّي وتصلّح الألياف.\n• يقلّل التقصف والتلف الظاهري.\n• ينظف بلطف دون أن يجفّف الشعر.\n• مناسب للشعر الجاف والمتقصف.\n• مكمّل مثالي لبلسم العناية الحليبية.",
    descriptionEn:
      "Pantene Pro-V Milky Damage Repair Shampoo — milky nourishing cleanse for dry, damaged hair.\n\n" +
      "• Milky formula nourishes and repairs fibres.\n• Helps reduce breakage and visible damage.\n• Gently cleanses without stripping moisture.\n• Ideal for dry and brittle hair.\n• Perfect partner to Milky Damage Repair Conditioner.",
  },
  {
    barcode: "5410076651788",
    slug: "pantene-pro-v-classic-care-shampoo-400ml",
    sku: "PTN-CCS-651788",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو العناية الكلاسيكية للشعر العادي 400 مل",
    nameEn: "Pantene Pro-V Classic Care Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في العناية الكلاسيكية — تنظيف يومي لطيف لجميع أنواع الشعر.\n\n" +
      "• ينظف بلطف ويغذّي الألياف.\n• يترك الشعر ناعماً ولامعاً وصحياً.\n• تركيبة Pro-V للعناية اليومية.\n• مناسب للشعر العادي والمختلط.\n• خيار كلاسيكي موثوق للعائلة.",
    descriptionEn:
      "Pantene Pro-V Classic Care Shampoo — gentle daily cleansing for all hair types.\n\n" +
      "• Gently cleanses and nourishes fibres.\n• Leaves hair soft, shiny and healthy-looking.\n• Pro-V formula for everyday care.\n• Ideal for normal and mixed hair types.\n• A trusted classic for the whole family.",
  },
  {
    barcode: "5410076652686",
    slug: "pantene-pro-v-smooth-silky-shampoo-400ml",
    sku: "PTN-SSS-652686",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو انسيابي وحريري للشعر المجعد والهيشان 400 مل",
    nameEn: "Pantene Pro-V Smooth & Silky Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في انسيابي وحريري — ينظّف ويتحكم بالهيشان للشعر المجعد والجاف.\n\n" +
      "• يقلّل الهيشان ويمنح انسيابية.\n• ينظف بلطف ويغذّي الألياف.\n• يترك الشعر ناعماً وحريرياً.\n• مناسب للشعر الجاف والمجعد.\n• مكمّل مثالي لبلسم انسيابي وحريري.",
    descriptionEn:
      "Pantene Pro-V Smooth & Silky Shampoo — cleanses and tames frizz for dry, unruly hair.\n\n" +
      "• Helps reduce frizz for smoother hair.\n• Gently cleanses and nourishes fibres.\n• Leaves hair soft and silky.\n• Ideal for dry and frizzy hair.\n• Perfect partner to Smooth & Silky Conditioner.",
  },
  {
    barcode: "5410076881840",
    slug: "pantene-pro-v-anti-hair-fall-shampoo-400ml",
    sku: "PTN-AHS-881840",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو ضد تساقط الشعر 400 مل",
    nameEn: "Pantene Pro-V Anti Hair Fall Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في ضد تساقط الشعر — يقوّي الجذور ويقلّل التساقط الناتج عن التقصف.\n\n" +
      "• يقوّي الشعر من الجذور.\n• يقلّل التساقط المرتبط بالتلف.\n• ينظف ويغذّي الألياف.\n• تركيبة Pro-V للشعر الضعيف.\n• للاستخدام اليومي.",
    descriptionEn:
      "Pantene Pro-V Anti Hair Fall Shampoo — strengthens roots and helps reduce breakage-related hair fall.\n\n" +
      "• Strengthens hair from the roots.\n• Helps reduce fall linked to damage.\n• Cleanses and nourishes fibres.\n• Pro-V formula for weak hair.\n• For daily use.",
  },
  {
    barcode: "5410076651627",
    slug: "pantene-pro-v-anti-dandruff-2in1-shampoo-400ml",
    sku: "PTN-AD2-651627",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو 2 في 1 ضد القشرة 400 مل",
    nameEn: "Pantene Pro-V Anti-Dandruff 2-in-1 Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في 2 في 1 ضد القشرة — ينظف فروة الرأس ويقضي على القشرة في خطوة واحدة.\n\n" +
      "• تركيبة 2 في 1 للتنظيف والتنعيم.\n• يقضي على القشرة ويهدّئ الفروة.\n• يقوّي الشعر ويقلّل التقصف.\n• مناسب للفروة الدهنية والقشرة.\n• خالٍ من السيليكون.",
    descriptionEn:
      "Pantene Pro-V Anti-Dandruff 2-in-1 Shampoo — cleanses scalp and fights dandruff in one step.\n\n" +
      "• 2-in-1 cleansing and conditioning formula.\n• Helps eliminate dandruff and soothe the scalp.\n• Strengthens hair and reduces breakage.\n• Ideal for oily scalp and dandruff.\n• Silicone-free.",
  },
  {
    barcode: "5410076881802",
    slug: "pantene-pro-v-colored-hair-repair-shampoo-400ml",
    sku: "PTN-CHS-881802",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو إصلاح الشعر المصبوغ والملون 400 مل",
    nameEn: "Pantene Pro-V Colored Hair Repair Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في لإصلاح الشعر المصبوغ — ينظف ويحمي لون الشعر من البهتان.\n\n" +
      "• يحافظ على حيوية اللون.\n• يصلّح التلف الناتج عن الصبغ.\n• ينظف بلطف دون أن يجفّف الشعر.\n• تركيبة Pro-V للشعر الملون.\n• مكمّل مثالي لبلسم إصلاح الشعر المصبوغ.",
    descriptionEn:
      "Pantene Pro-V Colored Hair Repair Shampoo — cleanses and protects colour from fading.\n\n" +
      "• Helps maintain colour vibrancy.\n• Repairs dye-related damage.\n• Gently cleanses without drying out.\n• Pro-V formula for coloured hair.\n• Perfect partner to Colored Hair Repair Conditioner.",
  },
  {
    barcode: "8700216085878",
    slug: "pantene-curlastic-sulfate-free-shampoo-400ml",
    sku: "PTN-CLS-085878",
    price: 8500,
    originalPrice: 9500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين كيرLASTIC - شامبو للشعر المجعد بدون سلفات 400 مل",
    nameEn: "Pantene Curlastic Sulfate-Free Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين كيرLASTIC بدون sulfates — ينظّف بلطف ويعرّف التموجات والمجعد.\n\n" +
      "• خالٍ من السلفات — لطيف على الشعر المجعد.\n• يعرّف التموجات ويقلّل الهيشان.\n• يحافظ على مرونة ونعومة المجعد.\n• مناسب للشعر المموج والمجعد.\n• مكمّل لسيروم وكريم كيرLASTIC.",
    descriptionEn:
      "Pantene Curlastic Sulfate-Free Shampoo — gently cleanses and defines curls and waves.\n\n" +
      "• Sulfate-free — gentle on curly hair.\n• Defines curls and helps reduce frizz.\n• Maintains curl elasticity and softness.\n• Ideal for wavy and curly hair.\n• Pairs with Curlastic serum and leave-in cream.",
  },
  {
    barcode: "4015600835149",
    slug: "pantene-pro-v-moisture-renewal-shampoo-400ml",
    sku: "PTN-MRS-835149",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو تجديد الترطيب للشعر الجاف 400 مل",
    nameEn: "Pantene Pro-V Moisture Renewal Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في تجديد الترطيب — يرطّب الشعر الجاف بعمق أثناء التنظيف.\n\n" +
      "• ترطيب مكثّف للألياف الجافة.\n• ينظف بلطف دون أن يجفّف الشعر.\n• يترك الشعر ناعماً ومرطّباً.\n• مناسب للشعر الجاف والعطشان.\n• مكمّل مثالي لبلسم تجديد الترطيب.",
    descriptionEn:
      "Pantene Pro-V Moisture Renewal Shampoo — deep hydration while cleansing dry hair.\n\n" +
      "• Intensive moisture for dry fibres.\n• Gently cleanses without stripping.\n• Leaves hair soft and hydrated.\n• Ideal for dry and dehydrated hair.\n• Perfect partner to Moisture Renewal Conditioner.",
  },
  {
    barcode: "8006540277553",
    slug: "pantene-pro-v-goodbye-frizz-shampoo-400ml",
    sku: "PTN-GFS-277553",
    price: 8000,
    originalPrice: 9000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في وداعاً للتطاير - شامبو ضد الهيشان 400 مل",
    nameEn: "Pantene Pro-V Goodbye Frizz Shampoo 400ml",
    descriptionAr:
      "شامبو بانتين برو-في وداعاً للتطاير — ينظّف ويتحكم بالهيشان حتى 72 ساعة.\n\n" +
      "• يقلّل التطاير والهيشان في الرطوبة.\n• ينظف بلطف ويغذّي الألياف.\n• يترك الشعر ناعماً ومنسقاً.\n• مناسب للشعر المجعد والهيشان.\n• مكمّل مثالي لبلسم وداعاً للتطاير.",
    descriptionEn:
      "Pantene Pro-V Goodbye Frizz Shampoo — cleanses and controls frizz for up to 72 hours.\n\n" +
      "• Reduces flyaways and frizz in humidity.\n• Gently cleanses and nourishes fibres.\n• Leaves hair smooth and manageable.\n• Ideal for frizzy, unruly hair.\n• Perfect partner to Goodbye Frizz Conditioner.",
  },
  {
    barcode: "4084500807600",
    slug: "pantene-pro-v-sheer-volume-shampoo-600ml",
    sku: "PTN-SVS-807600",
    price: 11000,
    originalPrice: 12250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو للحجم والكثافة للشعر الرفيع 600 مل",
    nameEn: "Pantene Pro-V Sheer Volume Shampoo 600ml",
    descriptionAr:
      "شامبو بانتين برو-في للحجم والكثافة — حجم عائلي 600 مل للشعر الرفيع والمسطح.\n\n" +
      "• يعزّز الحجم دون أن يثقل الشعر.\n• ينظف بلطف ويغذّي الألياف.\n• حجم اقتصادي للاستخدام اليومي.\n• مناسب للشعر الرفيع.\n• مكمّل مثالي لبلسم الحجم والكثافة.",
    descriptionEn:
      "Pantene Pro-V Sheer Volume Shampoo 600ml — family size volume boost for fine, flat hair.\n\n" +
      "• Adds volume without weighing hair down.\n• Gently cleanses and nourishes fibres.\n• Economical size for daily use.\n• Ideal for fine hair.\n• Perfect partner to Sheer Volume Conditioner.",
  },
  {
    barcode: "8006540277591",
    slug: "pantene-pro-v-goodbye-frizz-shampoo-360ml",
    sku: "PTN-GFS-277591",
    price: 7500,
    originalPrice: 8250,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في وداعاً للتطاير - شامبو ضد الهيشان 360 مل",
    nameEn: "Pantene Pro-V Goodbye Frizz Shampoo 360ml",
    descriptionAr:
      "شامبو بانتين برو-في وداعاً للتطاير — ينظّف ويتحكم بالهيشان والتطاير.\n\n" +
      "• يقلّل الهيشان في الرطوبة.\n• ينظف بلطف ويغذّي الألياف.\n• يترك الشعر ناعماً ومنسقاً.\n• مناسب للشعر المجعد والهيشان.\n• مكمّل مثالي لبلسم وداعاً للتطاير.",
    descriptionEn:
      "Pantene Pro-V Goodbye Frizz Shampoo 360ml — cleanses and controls frizz and flyaways.\n\n" +
      "• Helps reduce frizz in humidity.\n• Gently cleanses and nourishes fibres.\n• Leaves hair smooth and manageable.\n• Ideal for frizzy hair.\n• Perfect partner to Goodbye Frizz Conditioner.",
  },
  {
    barcode: "7501007448916",
    slug: "pantene-pro-v-hair-fall-control-shampoo-1l",
    sku: "PTN-HFC-448916",
    price: 14000,
    originalPrice: 15500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين برو-في - شامبو ضد تساقط الشعر 1 لتر",
    nameEn: "Pantene Pro-V Hair Fall Control Shampoo 1L",
    descriptionAr:
      "شامبو بانتين برو-في ضد تساقط الشعر — حجم عائلي 1 لتر لتقوية الشعر الضعيف.\n\n" +
      "• يقوّي الجذور ويقلّل التساقط.\n• بزيت الخروع وفيتامين E.\n• ينظف ويغذّي الألياف.\n• حجم اقتصادي للعائلة.\n• للاستخدام اليومي على الشعر المعرّض للتساقط.",
    descriptionEn:
      "Pantene Pro-V Hair Fall Control Shampoo 1L — family size for weak, fall-prone hair.\n\n" +
      "• Strengthens roots and helps reduce hair fall.\n• With castor oil and vitamin E.\n• Cleanses and nourishes fibres.\n• Economical family size.\n• For daily use on hair prone to falling.",
  },
  {
    barcode: "7501001164683",
    slug: "pantene-classic-shampoo-1l",
    sku: "PTN-CLS-164683",
    price: 13000,
    originalPrice: 14500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين - شامبو كلاسيك للعناية اليومية 1 لتر",
    nameEn: "Pantene Classic Shampoo 1L",
    descriptionAr:
      "شامبو بانتين كلاسيك — حجم عائلي 1 لتر للعناية اليومية اللطيفة.\n\n" +
      "• ينظف بلطف جميع أنواع الشعر.\n• يترك الشعر ناعماً ولامعاً.\n• تركيبة Pro-V الكلاسيكية.\n• حجم اقتصادي للعائلة.\n• خيار موثوق للاستخدام اليومي.",
    descriptionEn:
      "Pantene Classic Shampoo 1L — family size for gentle everyday care.\n\n" +
      "• Gently cleanses all hair types.\n• Leaves hair soft and shiny.\n• Classic Pro-V formula.\n• Economical family size.\n• A trusted choice for daily use.",
  },
  {
    barcode: "8001090150981",
    slug: "pantene-pro-v-milky-damage-repair-oil-replacement-275ml",
    sku: "PTN-MDO-150981",
    price: 9000,
    originalPrice: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين برو-في عناية حليبية - بديل زيت إصلاح التلف 275 مل",
    nameEn: "Pantene Pro-V Milky Damage Repair Oil Replacement 275ml",
    descriptionAr:
      "بديل زيت بانتين برو-في العناية الحليبية — عناية بدون شطف لإصلاح الشعر التالف.\n\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف دون شطف.\n• أقوى 2× من الزيت العادي.\n• فيتامينات B و C و E.\n• يقلّل التقصف ويحمي من الحرارة.\n• مناسب للشعر الجاف والمتضرر.",
    descriptionEn:
      "Pantene Pro-V Milky Damage Repair Oil Replacement — no-rinse repair care for damaged hair.\n\n" +
      "• Apply to damp or dry hair, no rinse needed.\n• 2× stronger than regular oil.\n• Vitamins B, C and E.\n• Helps reduce breakage and protects from heat.\n• Ideal for dry and damaged hair.",
  },
  {
    barcode: "8001090151858",
    slug: "pantene-pro-v-sheer-volume-oil-replacement-275ml",
    sku: "PTN-SVO-151858",
    price: 9000,
    originalPrice: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين برو-في - بديل زيت للحجم والكثافة 275 مل",
    nameEn: "Pantene Pro-V Sheer Volume Oil Replacement 275ml",
    descriptionAr:
      "بديل زيت بانتين برو-في للحجم والكثافة — عناية بدون شطف للشعر الرفيع.\n\n" +
      "• يُطبَّق دون شطف على الشعر المبلل أو الجاف.\n• يعزّز الحجم دون أن يثقل الشعر.\n• البانثينول وفيتامينات B و C و E.\n• يسهّل التصفيف ويمنح لمعاناً.\n• مناسب للشعر الرفيع والمسطح.",
    descriptionEn:
      "Pantene Pro-V Sheer Volume Oil Replacement — no-rinse volume care for fine hair.\n\n" +
      "• Apply without rinsing to damp or dry hair.\n• Boosts volume without weighing down.\n• Panthenol and vitamins B, C and E.\n• Eases styling and adds shine.\n• Ideal for fine and flat hair.",
  },
  {
    barcode: "8001090151001",
    slug: "pantene-pro-v-anti-hair-fall-oil-replacement-275ml",
    sku: "PTN-AHO-151001",
    price: 9000,
    originalPrice: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين برو-في - بديل زيت ضد تساقط الشعر 275 مل",
    nameEn: "Pantene Pro-V Anti Hair Fall Oil Replacement 275ml",
    descriptionAr:
      "بديل زيت بانتين برو-في ضد تساقط الشعر — تقوية بدون شطف للشعر الضعيف.\n\n" +
      "• يُطبَّق دون شطف على الشعر المبلل أو الجاف.\n• يقوّي الجذور ويقلّل التقصف.\n• حماية من الحرارة حتى 230°م.\n• يسهّل التصفيف ويمنح لمعاناً.\n• مناسب للشعر المعرّض للتساقط.",
    descriptionEn:
      "Pantene Pro-V Anti Hair Fall Oil Replacement — no-rinse strengthening for weak hair.\n\n" +
      "• Apply without rinsing to damp or dry hair.\n• Strengthens roots and helps reduce breakage.\n• Heat protection up to 230°C.\n• Eases styling and adds shine.\n• Ideal for hair prone to falling.",
  },
  {
    barcode: "8001090153418",
    slug: "pantene-pro-v-daily-care-oil-replacement-275ml",
    sku: "PTN-DCO-153418",
    price: 9000,
    originalPrice: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين برو-في - بديل زيت للعناية اليومية 275 مل",
    nameEn: "Pantene Pro-V Daily Care Oil Replacement 275ml",
    descriptionAr:
      "بديل زيت بانتين برو-في للعناية اليومية — تغذية بدون شطف لجميع أنواع الشعر.\n\n" +
      "• يُطبَّق دون شطف على الشعر المبلل أو الجاف.\n• يغذّي ويحمي الألياف يومياً.\n• يسهّل التمشيط والتصفيف.\n• يترك الشعر ناعماً ولامعاً.\n• مناسب للاستخدام اليومي.",
    descriptionEn:
      "Pantene Pro-V Daily Care Oil Replacement — daily no-rinse nourishment for all hair types.\n\n" +
      "• Apply without rinsing to damp or dry hair.\n• Nourishes and protects fibres daily.\n• Eases detangling and styling.\n• Leaves hair soft and shiny.\n• Suitable for everyday use.",
  },
  {
    barcode: "8001090151780",
    slug: "pantene-pro-v-smooth-silky-oil-replacement-275ml",
    sku: "PTN-SSO-151780",
    price: 9000,
    originalPrice: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين برو-في - بديل زيت انسيابي وحريري 275 مل",
    nameEn: "Pantene Pro-V Smooth & Silky Oil Replacement 275ml",
    descriptionAr:
      "بديل زيت بانتين برو-في انسيابي وحريري — ينعّم ويتحكم بالهيشان بدون شطف.\n\n" +
      "• يُطبَّق دون شطف على الشعر المبلل أو الجاف.\n• يقلّل الهيشان والتطاير.\n• ينعّم الألياف ويسهّل التصفيف.\n• يترك الشعر حريرياً ولامعاً.\n• مناسب للشعر المجعد والهيشان.",
    descriptionEn:
      "Pantene Pro-V Smooth & Silky Oil Replacement — no-rinse smoothing and frizz control.\n\n" +
      "• Apply without rinsing to damp or dry hair.\n• Helps reduce frizz and flyaways.\n• Smooths fibres and eases styling.\n• Leaves hair silky and shiny.\n• Ideal for frizzy, unruly hair.",
  },
  {
    barcode: "4902430401128",
    slug: "pantene-nature-care-fullness-life-shampoo-750ml",
    sku: "PTN-NCF-401128",
    price: 12000,
    originalPrice: 13300,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بانتين نيتشر كير - شامبو للامتلاء والحيوية للشعر الضعيف 750 مل",
    nameEn: "Pantene Nature Care Fullness & Life Shampoo 750ml",
    descriptionAr:
      "شامبو بانتين نيتشر كير للامتلاء والحيوية — يعزّز كثافة الشعر الضعيف والرفيع.\n\n" +
      "• مركّب الكسيا الطبيعي.\n• يمنح الشعر الضعيف امتلاء وحيوية.\n• ينظف بلطف ويغذّي الألياف.\n• مناسب للشعر الرفيع والضعيف.\n• تركيبة Pro-V مع مكونات طبيعية.",
    descriptionEn:
      "Pantene Nature Care Fullness & Life Shampoo — boosts fullness for weak, fine hair.\n\n" +
      "• Natural cassia complex.\n• Gives weak hair fullness and vitality.\n• Gently cleanses and nourishes fibres.\n• Ideal for fine and weak hair.\n• Pro-V formula with natural-origin ingredients.",
  },
  {
    barcode: "8700216079365",
    slug: "pantene-curlastic-hair-revival-serum-145ml",
    sku: "PTN-CRS-079365",
    price: 9000,
    originalPrice: 10000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين كيرLASTIC - سيروم إحياء وتجديد للشعر المجعد 145 مل",
    nameEn: "Pantene Curlastic Hair Revival Serum 145ml",
    descriptionAr:
      "سيروم بانتين كيرLASTIC لإحياء الشعر المجعد — يعيد الحيوية والمرونة للتموجات.\n\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف.\n• يعيد حيوية الشعر المجعد المتعب.\n• يقلّل الهيشان ويعزّز تعريف التموجات.\n• ملمس خفيف غير دهني.\n• مناسب للشعر المموج والمجعد.",
    descriptionEn:
      "Pantene Curlastic Hair Revival Serum — revives elasticity and definition for tired curls.\n\n" +
      "• Apply to damp or dry hair.\n• Revives tired, lifeless curls.\n• Helps reduce frizz and enhance curl definition.\n• Lightweight, non-greasy texture.\n• Ideal for wavy and curly hair.",
  },
  {
    barcode: "8700216196734",
    slug: "pantene-curlastic-defining-anti-frizz-leave-in-cream-270ml",
    sku: "PTN-CLC-196734",
    price: 9500,
    originalPrice: 10500,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بانتين كيرLASTIC - كريم ليف إن لتعريف التموجات ومقاومة الهيشان 270 مل",
    nameEn: "Pantene Curlastic Defining Anti-Frizz Leave-In Cream 270ml",
    descriptionAr:
      "كريم ليف إن بانتين كيرLASTIC — يعرّف التموجات ويقلّل الهيشان دون شطف.\n\n" +
      "• يُطبَّق على الشعر المبلل أو الجاف دون شطف.\n• يعرّف التموجات والمجعد.\n• يقلّل الهيشان ويحافظ على المرونة.\n• يسهّل التصفيف والتجفيف.\n• مناسب للشعر المموج والمجعد.",
    descriptionEn:
      "Pantene Curlastic Defining Anti-Frizz Leave-In Cream — defines curls and fights frizz, no rinse.\n\n" +
      "• Apply to damp or dry hair without rinsing.\n• Defines curls and waves.\n• Reduces frizz and maintains elasticity.\n• Eases styling and blow-drying.\n• Ideal for wavy and curly hair.",
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
    brandAr: "بانتين",
    brandEn: "Pantene",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Pantene brand");
  return brandId;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log(`Brand: بانتين (${brandId})\n`);

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
