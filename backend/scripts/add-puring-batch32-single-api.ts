/**
 * Puring — 32 separate single-SKU hair care products (no shades, no images).
 * Sources: puring.it, maatcosmetici.com, probeauty.ro, chanse.eu (verified EANs)
 * Usage: npx tsx scripts/add-puring-batch32-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";
const OIL_MASKS = "ab7c66e4-4df6-474f-b9d2-dd059dd60bfc";
const HAIR_TREATMENT = "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const PRODUCTS: ProductDef[] = [
  // ── 01 Richness ──
  {
    barcode: "8053853726056",
    slug: "puring-01-richness-nourishing-shampoo-300ml",
    sku: "PUR-726056",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 01 Richness Nourishing للشعر الجاف 300 مل",
    nameEn: "Puring - 01 Richness Nourishing Shampoo 300ml",
    descriptionAr:
      "شامبو 01 Richness Nourishing من بيورنغ — تغذية عميقة للشعر الجاف والمجعد والمعالج كيميائياً.\n\n" +
      "• Avocado وبروتينات الحرير والحليب لترطيب وتنعيم فوري.\n• ينظّف بلطف دون أن يثقل الشعر.\n• يعيد اللمعان والمرونة ويسهّل التصفيف.\n• مثالي للاستخدام اليومي بعد الصبغ أو التمويج.\n• 300 مل.",
    descriptionEn:
      "Puring 01 Richness Nourishing Shampoo gently cleanses dry, frizzy or chemically treated hair with deep nourishment.\n\n" +
      "• Avocado, silk proteins and milk proteins hydrate and soften.\n• Cleanses without weighing hair down.\n• Restores shine, elasticity and manageability.\n• Ideal for daily use on stressed or treated hair.\n• 300 ml.",
  },
  {
    barcode: "8053853725998",
    slug: "puring-01-richness-nourishing-conditioner-300ml",
    sku: "PUR-725998",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - بلسم 01 Richness Nourishing للشعر الجاف 300 مل",
    nameEn: "Puring - 01 Richness Nourishing Conditioner 300ml",
    descriptionAr:
      "بلسم 01 Richness Nourishing من بيورنغ — ترطيب وتغذية للشعر الجاف والكثيف والصعب التمشيط.\n\n" +
      "• Avocado ومستخلص الخيزران لتقوية الألياف.\n• ينعّم ويفكّ التشابك من أول استخدام.\n• يعيد هيكلة الشعر المعالج كيميائياً.\n• مناسب للشعر المجعد والجاف جداً.\n• 300 مل.",
    descriptionEn:
      "Puring 01 Richness Nourishing Conditioner nourishes dry, thick, porous and hard-to-manage hair.\n\n" +
      "• Avocado and bamboo extract strengthen the hair fiber.\n• Softens and detangles from the first use.\n• Restructures chemically treated hair.\n• Ideal for curly, dry or unruly hair.\n• 300 ml.",
  },
  {
    barcode: "8053853726001",
    slug: "puring-01-richness-nourishing-conditioner-1000ml",
    sku: "PUR-726001",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - بلسم 01 Richness Nourishing للشعر الجاف 1000 مل",
    nameEn: "Puring - 01 Richness Nourishing Conditioner 1000ml",
    descriptionAr:
      "بلسم 01 Richness Nourishing من بيورنغ — حجم عائلي/صالون للشعر الجاف والمجعد.\n\n" +
      "• تركيبة غنية بالAvocado والخيزران.\n• تغذية مكثّفة دون إثقال.\n• يحسّن التمشيط والنعومة واللمعان.\n• مثالي للاستخدام المتكرر في المنزل أو الصالون.\n• 1000 مل.",
    descriptionEn:
      "Puring 01 Richness Nourishing Conditioner 1000ml — salon-size nourishing treatment for dry, curly hair.\n\n" +
      "• Rich avocado and bamboo formula.\n• Intensive nourishment without weighing down.\n• Improves combability, softness and shine.\n• Ideal for frequent home or salon use.\n• 1000 ml.",
  },
  {
    barcode: "8053853726032",
    slug: "puring-01-richness-nourishing-mask-1000ml",
    sku: "PUR-726032",
    price: 24000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "بيورنغ - ماسك 01 Richness Nourishing للشعر الجاف 1000 مل",
    nameEn: "Puring - 01 Richness Nourishing Mask 1000ml",
    descriptionAr:
      "ماسك 01 Richness Nourishing من بيورنغ — علاج مكثّف للشعر الجاف والمرهق.\n\n" +
      "• Avocado وزيت بذور الكتان ومستخلص الجزر.\n• يعيد بناء الألياف ويمنح نعومة حريرية.\n• pH 4.5–5.0 مناسب للشعر المعالج.\n• يُترك 3–5 دقائق ثم يُشطف.\n• 1000 مل.",
    descriptionEn:
      "Puring 01 Richness Nourishing Mask — intensive mask for dry, stressed and chemically treated hair.\n\n" +
      "• Avocado, linseed oil and carrot extract.\n• Restructures the fiber for silky softness and shine.\n• pH 4.5–5.0, ideal for treated hair.\n• Leave on 3–5 minutes, then rinse.\n• 1000 ml.",
  },
  {
    barcode: "8053853726049",
    slug: "puring-01-richness-intensive-nourishing-oil-100ml",
    sku: "PUR-726049",
    price: 14000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - زيت 01 Richness Intensive Nourishing للشعر 100 مل",
    nameEn: "Puring - 01 Richness Intensive Nourishing Oil 100ml",
    descriptionAr:
      "زيت 01 Richness Intensive Nourishing من بيورنغ — تجديد عميق للشعر الجاف والتالف.\n\n" +
      "• يغذّي ويرطّب ويقلّل التقصف.\n• يعيد اللمعان والحيوية للأطراف الباهتة.\n• خفيف التركيبة، مناسب للاستخدام قبل أو بعد التصفيف.\n• يُوزّع على الأطوال والأطراف.\n• 100 مل.",
    descriptionEn:
      "Puring 01 Richness Intensive Nourishing Oil — deep renewal for dry and damaged hair.\n\n" +
      "• Nourishes, hydrates and helps reduce breakage.\n• Restores shine and vitality to dull ends.\n• Lightweight formula for pre- or post-styling use.\n• Apply to mid-lengths and ends.\n• 100 ml.",
  },

  // ── 02 Smoothing Discipline ──
  {
    barcode: "8053853726124",
    slug: "puring-02-smoothing-discipline-shampoo-1000ml",
    sku: "PUR-726124",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 02 Smoothing Discipline لمكافحة الهيشان 1000 مل",
    nameEn: "Puring - 02 Smoothing Discipline Shampoo 1000ml",
    descriptionAr:
      "شامبو 02 Smoothing Discipline من بيورنغ — ينظّم الشعر المجعد والهائش من أول غسلة.\n\n" +
      "• كيراتين وزيت الزيتون لتقوية الألياف.\n• يقلّل الهيشان ويتحكم بالحجم.\n• يسهّل التصفيف المفرود أو الطبيعي.\n• يرطّب ويمنح لمعاناً دون ثقل.\n• 1000 مل.",
    descriptionEn:
      "Puring 02 Smoothing Discipline Shampoo tames frizzy, porous and unruly hair from the first wash.\n\n" +
      "• Keratin and olive oil strengthen the fiber.\n• Reduces frizz and controls volume.\n• Eases straight or natural styling.\n• Hydrates and adds shine without weighing down.\n• 1000 ml.",
  },

  // ── 03 Rehab Restructuring Curly ──
  {
    barcode: "8053853725974",
    slug: "puring-03-rehab-restructuring-curly-shampoo-1000ml",
    sku: "PUR-725974",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 03 Rehab Restructuring Curly للشعر المجعد 1000 مل",
    nameEn: "Puring - 03 Rehab Restructuring Curly Shampoo 1000ml",
    descriptionAr:
      "شامبو 03 Rehab Restructuring Curly من بيورنغ — لإعادة بناء الشعر المجعد والموجي.\n\n" +
      "• بروتينات القمح والحرير ضد الهيشان.\n• يرطّب وينظّم الشعر الكهربائي.\n• يعيد المرونة واللمعان للمجعد الطبيعي أو المعالج.\n• pH 5.5/6.0.\n• 1000 مل.",
    descriptionEn:
      "Puring 03 Rehab Restructuring Curly Shampoo rebuilds curly, wavy and frizzy hair.\n\n" +
      "• Wheat and silk proteins with anti-frizz action.\n• Hydrates and disciplines electrified hair.\n• Restores bounce and shine to natural or treated curls.\n• pH 5.5/6.0.\n• 1000 ml.",
  },
  {
    barcode: "8053853725950",
    slug: "puring-03-rehab-restructuring-curly-multi-action-mask-500ml",
    sku: "PUR-725950",
    price: 15000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "بيورنغ - ماسك 03 Rehab Restructuring Curly Multi Action 500 مل",
    nameEn: "Puring - 03 Rehab Restructuring Curly Multi Action Mask 500ml",
    descriptionAr:
      "ماسك 03 Rehab Restructuring Curly Multi Action من بيورنغ — علاج متعدد المزايا للمجعد.\n\n" +
      "• يغذّي وينظّم ويعيد مرونة التمويج.\n• يقلّل الهيشان دون إثقال.\n• مناسب للشعر المجعد والموجي الطبيعي أو الدائم.\n• يُترك 3–5 دقائق على الأطوال والأطراف.\n• 500 مل.",
    descriptionEn:
      "Puring 03 Rehab Restructuring Curly Multi Action Mask — multi-action treatment for curly hair.\n\n" +
      "• Nourishes, disciplines and restores curl elasticity.\n• Reduces frizz without weighing down.\n• For natural or permed curly and wavy hair.\n• Leave on 3–5 minutes on mid-lengths and ends.\n• 500 ml.",
  },

  // ── 04 KeepColor ──
  {
    barcode: "8053853725882",
    slug: "puring-04-keepcolor-color-care-shampoo-1000ml",
    sku: "PUR-725882",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 04 KeepColor Color Care للشعر المصبوغ 1000 مل",
    nameEn: "Puring - 04 KeepColor Color Care Shampoo 1000ml",
    descriptionAr:
      "شامبو 04 KeepColor Color Care من بيورنغ — يحافظ على لون الشعر المصبوغ لفترة أطول.\n\n" +
      "• فيتامين E وزيت بذور الكتان بعمل مضاد للأكسدة.\n• ينظّف بلطف ويغذّي دون بهتان اللون.\n• يمنح لمعاناً ونعومة للشعر الملوّن.\n• عطر القهوة الدافئ.\n• 1000 مل.",
    descriptionEn:
      "Puring 04 KeepColor Color Care Shampoo helps maintain vibrant cosmetic color on treated hair.\n\n" +
      "• Vitamin E and linseed oil with antioxidant action.\n• Gently cleanses and nourishes without fading color.\n• Adds shine and softness to colored hair.\n• Warm coffee scent.\n• 1000 ml.",
  },
  {
    barcode: "8053853725837",
    slug: "puring-04-keepcolor-color-care-conditioner-1000ml",
    sku: "PUR-725837",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - بلسم 04 KeepColor Color Care للشعر المصبوغ 1000 مل",
    nameEn: "Puring - 04 KeepColor Color Care Conditioner 1000ml",
    descriptionAr:
      "بلسم 04 KeepColor Color Care من بيورنغ — حماية وتغذية للشعر المصبوغ.\n\n" +
      "• فيتامين E وزيت الكتان يحميان اللون من البهتان.\n• يفكّ التشابك ويعيد الحيوية للألياف.\n• يساعد على إطالة ثبات الصبغة.\n• عطر الحليب الخفيف.\n• 1000 مل.",
    descriptionEn:
      "Puring 04 KeepColor Color Care Conditioner protects and nourishes color-treated hair.\n\n" +
      "• Vitamin E and linseed oil help prevent color fade.\n• Detangles and regenerates the fiber.\n• Helps prolong cosmetic color vibrancy.\n• Delicate milky scent.\n• 1000 ml.",
  },
  {
    barcode: "8053853729804",
    slug: "puring-04-keepcolor-color-care-mask-500ml",
    sku: "PUR-729804",
    price: 15000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "بيورنغ - ماسك 04 KeepColor Color Care للشعر المصبوغ 500 مل",
    nameEn: "Puring - 04 KeepColor Color Care Mask 500ml",
    descriptionAr:
      "ماسك 04 KeepColor Color Care من بيورنغ — علاج مكثّف لثبات لون الشعر.\n\n" +
      "• مثالي للشعر المصبوغ أو الملوّن أو ذي الخصل.\n• pH 4.5–5.0 يحمي اللون ويغذّي.\n• يمنح نعومة ولمعاناً إضافياً.\n• يُترك 3–5 دقائق ثم يُشطف.\n• 500 مل.",
    descriptionEn:
      "Puring 04 KeepColor Color Care Mask — intensive color-maintenance treatment.\n\n" +
      "• Ideal for colored, bleached or highlighted hair.\n• pH 4.5–5.0 protects color while nourishing.\n• Adds extra softness and shine.\n• Leave on 3–5 minutes, then rinse.\n• 500 ml.",
  },
  {
    barcode: "8053853725813",
    slug: "puring-04-keepcolor-color-intense-leave-in-2-phase-200ml",
    sku: "PUR-725813",
    price: 13000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - سبراي بلسم 04 KeepColor Color Intense Leave-In 200 مل",
    nameEn: "Puring - 04 KeepColor Color Intense Leave-In 2-Phase 200ml",
    descriptionAr:
      "بلسم 04 KeepColor Color Intense Leave-In 2-Phase من بيورنغ — بدون شطف للشعر المصبوغ.\n\n" +
      "• تركيبة ثنائية الطور تفكّ التشابك فوراً.\n• زيت الكتان وفيتامين E يحميان اللون.\n• يرطّب ويمنح لمعاناً دون إثقال.\n• رُجّ الزجاجة قبل الاستخدام؛ لا يُشطف.\n• 200 مل.",
    descriptionEn:
      "Puring 04 KeepColor Color Intense Leave-In 2-Phase — rinse-free conditioner for colored hair.\n\n" +
      "• Bi-phase formula instantly detangles.\n• Linseed oil and vitamin E protect color.\n• Hydrates and adds shine without weighing down.\n• Shake well before use; do not rinse.\n• 200 ml.",
  },
  {
    barcode: "8053853725899",
    slug: "puring-04-keepcolor-color-shine-spray-150ml",
    sku: "PUR-725899",
    price: 12000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - سبراي 04 KeepColor Color Shine للشعر المصبوغ 150 مل",
    nameEn: "Puring - 04 KeepColor Color Shine Spray 150ml",
    descriptionAr:
      "سبراي 04 KeepColor Color Shine من بيورنغ — لمعان فوري للشعر المصبوغ.\n\n" +
      "• زيت الكتان وفيتامين E للحماية والإشراق.\n• لا يثقل الشعر.\n• مناسب قبل التصفيف أو على الشعر الجاف.\n• يبرز لون الصبغة ويمنح مظهراً صحياً.\n• 150 مل.",
    descriptionEn:
      "Puring 04 KeepColor Color Shine Spray — instant radiance for color-treated hair.\n\n" +
      "• Linseed oil and vitamin E for protection and shine.\n• Does not weigh hair down.\n• Use before styling or on dry hair.\n• Enhances cosmetic color with a healthy look.\n• 150 ml.",
  },

  // ── 05 Hydrargan ──
  {
    barcode: "8053853725738",
    slug: "puring-05-hydrargan-moisturizing-shampoo-300ml",
    sku: "PUR-725738",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 05 Hydrargan Moisturizing بزيت Argan 300 مل",
    nameEn: "Puring - 05 Hydrargan Moisturizing Shampoo 300ml",
    descriptionAr:
      "شامبو 05 Hydrargan Moisturizing من بيورنغ — ترطيب بزيت Argan وبذور الكتان.\n\n" +
      "• ينظّف بلطف ويرطّب فروة الرأس والشعر.\n• يغذّي دون إثقال ويمنح لمعاناً.\n• مناسب للشعر العادي إلى الجاف.\n• للاستخدام اليومي.\n• 300 مل.",
    descriptionEn:
      "Puring 05 Hydrargan Moisturizing Shampoo with argan and linseed oils.\n\n" +
      "• Gently cleanses while hydrating scalp and hair.\n• Nourishes without weighing down and adds shine.\n• For normal to dry hair.\n• Suitable for daily use.\n• 300 ml.",
  },
  {
    barcode: "8053853725745",
    slug: "puring-05-hydrargan-moisturizing-shampoo-1000ml",
    sku: "PUR-725745",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 05 Hydrargan Moisturizing بزيت Argan 1000 مل",
    nameEn: "Puring - 05 Hydrargan Moisturizing Shampoo 1000ml",
    descriptionAr:
      "شامبو 05 Hydrargan Moisturizing من بيورنغ — حجم 1000 مل للترطيب اليومي.\n\n" +
      "• زيت Argan وبذور الكتان لترطيب متوازن.\n• يعيد الحيوية والنعومة للشعر الباهت.\n• يحمي من الجفاف ويغذّي فروة الرأس.\n• مثالي للاستخدام المتكرر.\n• 1000 مل.",
    descriptionEn:
      "Puring 05 Hydrargan Moisturizing Shampoo 1000ml — daily hydration with argan oil.\n\n" +
      "• Argan and linseed oils for balanced moisture.\n• Revives dull hair with softness and vitality.\n• Protects against dryness and nourishes the scalp.\n• Ideal for frequent use.\n• 1000 ml.",
  },
  {
    barcode: "8053853725653",
    slug: "puring-05-hydrargan-moisturizing-conditioner-300ml",
    sku: "PUR-725653",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - بلسم 05 Hydrargan Moisturizing بزيت Argan 300 مل",
    nameEn: "Puring - 05 Hydrargan Moisturizing Conditioner 300ml",
    descriptionAr:
      "بلسم 05 Hydrargan Moisturizing من بيورنغ — ترطيب وتنعيم بزيت Argan.\n\n" +
      "• يفكّ التشابك ويمنح ملمساً حريرياً.\n• زيت Argan وبذور الكتان يغذّيان الألياف.\n• لا يثقل الشعر.\n• للشعر العادي إلى الجاف.\n• 300 مل.",
    descriptionEn:
      "Puring 05 Hydrargan Moisturizing Conditioner — argan-powered hydration and softness.\n\n" +
      "• Detangles and leaves a silky feel.\n• Argan and linseed oils nourish the fiber.\n• Does not weigh hair down.\n• For normal to dry hair.\n• 300 ml.",
  },
  {
    barcode: "8053853725660",
    slug: "puring-05-hydrargan-moisturizing-conditioner-1000ml",
    sku: "PUR-725660",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - بلسم 05 Hydrargan Moisturizing بزيت Argan 1000 مل",
    nameEn: "Puring - 05 Hydrargan Moisturizing Conditioner 1000ml",
    descriptionAr:
      "بلسم 05 Hydrargan Moisturizing من بيورنغ — حجم صالون للترطيب العميق.\n\n" +
      "• يرطّب وينعّم ويسهّل التمشيط.\n• يمنح لمعاناً دون ثقل.\n• مثالي بعد شامبو Hydrargan.\n• للشعر العادي أو الجاف.\n• 1000 مل.",
    descriptionEn:
      "Puring 05 Hydrargan Moisturizing Conditioner 1000ml — salon-size deep hydration.\n\n" +
      "• Hydrates, softens and eases combing.\n• Adds shine without weighing down.\n• Perfect after Hydrargan Shampoo.\n• For normal or dry hair.\n• 1000 ml.",
  },
  {
    barcode: "8053853725714",
    slug: "puring-05-hydrargan-moisturizing-mask-1000ml",
    sku: "PUR-725714",
    price: 24000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "بيورنغ - ماسك 05 Hydrargan Moisturizing بزيت Argan 1000 مل",
    nameEn: "Puring - 05 Hydrargan Moisturizing Mask 1000ml",
    descriptionAr:
      "ماسك 05 Hydrargan Moisturizing من بيورنغ — ترطيب مكثّف بزيت Argan.\n\n" +
      "• للشعر الجاف والباهت وصعب التمشيط.\n• يعيد المرونة والنعومة واللمعان.\n• يُترك 3–5 دقائق على الأطوال.\n• عطر Red Sunset (فواكه حمراء).\n• 1000 مل.",
    descriptionEn:
      "Puring 05 Hydrargan Moisturizing Mask — intensive argan hydration.\n\n" +
      "• For dry, dull and tangled hair.\n• Restores elasticity, softness and shine.\n• Leave on 3–5 minutes on mid-lengths.\n• Red Sunset fruity fragrance.\n• 1000 ml.",
  },
  {
    barcode: "8053853725677",
    slug: "puring-05-hydrargan-moisturizing-intensive-lotion-10x10ml",
    sku: "PUR-725677",
    price: 17000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - أمبولات 05 Hydrargan Intensive Lotion 10×10 مل",
    nameEn: "Puring - 05 Hydrargan Moisturizing Intensive Lotion 10 x 10ml",
    descriptionAr:
      "أمبولات 05 Hydrargan Moisturizing Intensive Lotion من بيورنغ — علاج مكثّف للشعر التالف.\n\n" +
      "• 10 أمبولات × 10 مل بزيت Argan والكتان.\n• يعيد بناء الشعر الجاف والهش.\n• يُستخدم بعد الشامبو على فروة الرأس والأطوال.\n• دورة علاجية كاملة.\n• 10 × 10 مل.",
    descriptionEn:
      "Puring 05 Hydrargan Moisturizing Intensive Lotion — intensive ampoule treatment.\n\n" +
      "• 10 ampoules x 10 ml with argan and linseed oils.\n• Rebuilds dry, fragile and treated hair.\n• Use after shampoo on scalp and lengths.\n• Complete intensive course.\n• 10 x 10 ml.",
  },

  // ── 07 EnergyForce ──
  {
    barcode: "8053853726162",
    slug: "puring-07-energyforce-reinforcing-shampoo-300ml",
    sku: "PUR-726162",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 07 EnergyForce Reinforcing ضد التساقط 300 مل",
    nameEn: "Puring - 07 EnergyForce Reinforcing Shampoo 300ml",
    descriptionAr:
      "شامبو 07 EnergyForce Reinforcing من بيورنغ — يعزّز الشعر الضعيف والرفيع.\n\n" +
      "• فلفل حار ومنثول وعناصر دقيقة لتنشيط فروة الرأس.\n• ينظّف بعمق دون جفاف.\n• يساعد في الوقاية من التساقط.\n• للشعر الرفيع والمرهق.\n• 300 مل.",
    descriptionEn:
      "Puring 07 EnergyForce Reinforcing Shampoo energizes fine, devitalized hair prone to shedding.\n\n" +
      "• Chili pepper, menthol and trace elements stimulate the scalp.\n• Deep cleansing without dryness.\n• Helps prevent hair loss.\n• For fine and weakened hair.\n• 300 ml.",
  },
  {
    barcode: "8053853726179",
    slug: "puring-07-energyforce-reinforcing-shampoo-1000ml",
    sku: "PUR-726179",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 07 EnergyForce Reinforcing ضد التساقط 1000 مل",
    nameEn: "Puring - 07 EnergyForce Reinforcing Shampoo 1000ml",
    descriptionAr:
      "شامبو 07 EnergyForce Reinforcing من بيورنغ — حجم 1000 مل للشعر الضعيف.\n\n" +
      "• يحفّز الدورة الدموية ويقوّي الجذور.\n• ينقّي فروة الرأس ويعيد التوازن.\n• مناسب للاستخدام المتكرر.\n• pH 5.5/6.0.\n• 1000 مل.",
    descriptionEn:
      "Puring 07 EnergyForce Reinforcing Shampoo 1000ml — anti-hair-loss energizing cleanse.\n\n" +
      "• Stimulates microcirculation and strengthens roots.\n• Purifies the scalp and restores balance.\n• Suitable for frequent use.\n• pH 5.5/6.0.\n• 1000 ml.",
  },
  {
    barcode: "8053853726131",
    slug: "puring-07-energyforce-reinforcing-energizing-lotion-125ml",
    sku: "PUR-726131",
    price: 16000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - لوشن 07 EnergyForce Reinforcing Energizing 125 مل",
    nameEn: "Puring - 07 EnergyForce Reinforcing Energizing Lotion 125ml",
    descriptionAr:
      "لوشن 07 EnergyForce Reinforcing Energizing من بيورنغ — مساعد ضد تساقط الشعر.\n\n" +
      "• إكليل الجبل والقريص والفلفل والمنثول.\n• يحفّز فروة الرأس ويعزّز النمو.\n• يُطبّق على فروة نظيفة ولا يُشطف.\n• للشعر الضعيف والخفيف.\n• 125 مل.",
    descriptionEn:
      "Puring 07 EnergyForce Reinforcing Energizing Lotion — adjuvant anti-hair-loss treatment.\n\n" +
      "• Rosemary, nettle, chili pepper and menthol.\n• Stimulates the scalp and supports healthy growth.\n• Apply to clean scalp; do not rinse.\n• For weak, thinning hair.\n• 125 ml.",
  },
  {
    barcode: "8053853726155",
    slug: "puring-07-energyforce-energizing-super-active-lotion-125ml",
    sku: "PUR-726155",
    price: 16000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - لوشن 07 EnergyForce Energizing Super Active 125 مل",
    nameEn: "Puring - 07 EnergyForce Energizing Super Active Lotion 125ml",
    descriptionAr:
      "لوشن 07 EnergyForce Energizing Super Active من بيورنغ — علاج مكثّف منشّط.\n\n" +
      "• فلفل حار وليمون وأوراق الشاي.\n• يعزّز مقاومة الشعر الضعيف.\n• ينقّي ويوازن فروة الرأس.\n• يُدلّك حتى الامتصاص الكامل.\n• 125 مل.",
    descriptionEn:
      "Puring 07 EnergyForce Energizing Super Active Lotion — intensive stimulating treatment.\n\n" +
      "• Chili pepper, lemon and tea leaf extracts.\n• Strengthens weak, fine hair.\n• Purifies and rebalances the scalp.\n• Massage until fully absorbed; do not rinse.\n• 125 ml.",
  },
  {
    barcode: "8053853726148",
    slug: "puring-07-energyforce-energizing-super-active-lotion-12x10ml",
    sku: "PUR-726148",
    price: 18000,
    tertiaryCategoryId: HAIR_TREATMENT,
    nameAr: "بيورنغ - أمبولات 07 EnergyForce Super Active 12×10 مل",
    nameEn: "Puring - 07 EnergyForce Energizing Super Active Lotion 12 x 10ml",
    descriptionAr:
      "أمبولات 07 EnergyForce Energizing Super Active من بيورنغ — علاج مكثّف ضد التساقط.\n\n" +
      "• 12 أمبولة × 10 مل للشعر الضعيف.\n• تحفّز الدورة الدموية وتقوّي الألياف.\n• مثالية للتساقط الموسمي.\n• تُوزّع على فروة الرأس ولا تُشطف.\n• 12 × 10 مل.",
    descriptionEn:
      "Puring 07 EnergyForce Energizing Super Active Lotion ampoules — intensive anti-hair-loss course.\n\n" +
      "• 12 ampoules x 10 ml for fine, weakened hair.\n• Stimulates microcirculation and strengthens fibers.\n• Ideal during seasonal shedding.\n• Apply to scalp; do not rinse.\n• 12 x 10 ml.",
  },

  // ── 08 PureClean ──
  {
    barcode: "8053853725905",
    slug: "puring-08-pureclean-purifying-shampoo-300ml",
    sku: "PUR-725905",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 08 PureClean Purifying للشعر الدهني 300 مل",
    nameEn: "Puring - 08 PureClean Purifying Shampoo 300ml",
    descriptionAr:
      "شامبو 08 PureClean Purifying من بيورنغ — تنقية وتوازن للشعر الدهني والقشرة.\n\n" +
      "• Piroctone Olamine وإكليل الجبل والقريص.\n• ينظّم إفراز الدهون ويهدّئ الحكة.\n• يناسب فروة الرأس الحساسة.\n• للاستخدام اليومي.\n• 300 مل.",
    descriptionEn:
      "Puring 08 PureClean Purifying Shampoo — sebo-control cleanse for oily scalp and dandruff.\n\n" +
      "• Piroctone olamine, rosemary and nettle extracts.\n• Regulates sebum and soothes itching.\n• For sensitive or impure scalp.\n• Suitable for daily use.\n• 300 ml.",
  },
  {
    barcode: "8053853725912",
    slug: "puring-08-pureclean-purifying-shampoo-1000ml",
    sku: "PUR-725912",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 08 PureClean Purifying للشعر الدهني 1000 مل",
    nameEn: "Puring - 08 PureClean Purifying Shampoo 1000ml",
    descriptionAr:
      "شامبو 08 PureClean Purifying من بيورنغ — حجم 1000 مل للشعر الدهني.\n\n" +
      "• ينقّي ويوازن فروة الرأس الدهنية.\n• يساعد على السيطرة على القشرة.\n• يريّح التهيّج والاحمرار.\n• عطر حمضيات منعش (kumquat وليمون وyuzu).\n• 1000 مل.",
    descriptionEn:
      "Puring 08 PureClean Purifying Shampoo 1000ml — professional purifying cleanse.\n\n" +
      "• Purifies and rebalances oily, impure scalp.\n• Helps control dandruff and excess sebum.\n• Relieves irritation and redness.\n• Fresh kumquat, lemon and yuzu scent.\n• 1000 ml.",
  },

  // ── 09 BlondeResolve ──
  {
    barcode: "8053853725639",
    slug: "puring-09-blonderesolve-silver-shampoo-1000ml",
    sku: "PUR-725639",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 09 BlondeResolve Silver ضد الاصفرار 1000 مل",
    nameEn: "Puring - 09 BlondeResolve Silver Shampoo 1000ml",
    descriptionAr:
      "شامبو 09 BlondeResolve Silver من بيورنغ — يعادل الاصفرار في الشعر الأشقر.\n\n" +
      "• pigment بنفسجي لشعر أشقر ورمادي أو مُفتّح.\n• بروتينات الحرير وزيت بذور العنب.\n• يغذّي ويحافظ على برودة اللون.\n• عطر العنب.\n• 1000 مل.",
    descriptionEn:
      "Puring 09 BlondeResolve Silver Shampoo — anti-yellowing care for blonde and grey hair.\n\n" +
      "• Violet pigment neutralizes unwanted yellow tones.\n• Silk proteins and grape seed extract nourish.\n• Maintains cool blonde and silver reflections.\n• Grape fragrance.\n• 1000 ml.",
  },

  // ── 10 Reconstruction ──
  {
    barcode: "8053853729972",
    slug: "puring-10-reconstruction-veg-keratin-shampoo-300ml",
    sku: "PUR-729972",
    price: 12000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 10 Reconstruction Veg-Keratin 300 مل",
    nameEn: "Puring - 10 Reconstruction Veg-Keratin Shampoo 300ml",
    descriptionAr:
      "شامبو 10 Reconstruction Veg-Keratin من بيورنغ — إعادة بناء للشعر التالف.\n\n" +
      "• Keratin نباتي وبروtينات الحرير والقمح.\n• pH 5.5/6.0 للشعر المجعد والهائش.\n• يرطّب وينظّm ويمنح لمعاناً.\n• 300 مل.",
    descriptionEn:
      "Puring 10 Reconstruction Veg-Keratin Shampoo — restructuring cleanse for damaged hair.\n\n" +
      "• Vegetable keratin, silk and wheat proteins.\n• pH 5.5/6.0 for curly and frizzy hair.\n• Hydrates, disciplines and adds shine.\n• 300 ml.",
  },
  {
    barcode: "8053853729989",
    slug: "puring-10-reconstruction-veg-keratin-shampoo-1000ml",
    sku: "PUR-729989",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 10 Reconstruction Veg-Keratin 1000 مل",
    nameEn: "Puring - 10 Reconstruction Veg-Keratin Shampoo 1000ml",
    descriptionAr:
      "شامبو 10 Reconstruction Veg-Keratin من بيورنغ — حجم صالون للشعر التالف.\n\n" +
      "• يقوّi قوة الألياف ومرونتها.\n• للشعر الطبيعي أو المعالج كيمiائياً.\n• يناسب المجعد والهائش.\n• 1000 مل.",
    descriptionEn:
      "Puring 10 Reconstruction Veg-Keratin Shampoo 1000ml — salon restructuring shampoo.\n\n" +
      "• Strengthens and hydrates damaged fibers.\n• For natural or chemically treated hair.\n• Suitable for curly and frizzy hair.\n• 1000 ml.",
  },
  {
    barcode: "8057587080002",
    slug: "puring-10-reconstruction-veg-keratin-mask-500ml",
    sku: "PUR-080002",
    price: 15000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "بيورنغ - ماسك 10 Reconstruction Veg-Keratin 500 مل",
    nameEn: "Puring - 10 Reconstruction Veg-Keratin Mask 500ml",
    descriptionAr:
      "ماسك 10 Reconstruction Veg-Keratin من بيورنغ — علاج عميق للشعر التالف.\n\n" +
      "• Keratin نباتي يغذّي ويقوّي.\n• pH 4.5/5.0.\n• يُترك 3–5 دقائق.\n• 500 مل.",
    descriptionEn:
      "Puring 10 Reconstruction Veg-Keratin Mask — deep repair for damaged hair.\n\n" +
      "• Vegetable keratin nourishes and strengthens.\n• pH 4.5/5.0.\n• Leave on 3–5 minutes.\n• 500 ml.",
  },
  {
    barcode: "8057587080019",
    slug: "puring-10-reconstruction-veg-keratin-mask-1000ml",
    sku: "PUR-080019",
    price: 24000,
    tertiaryCategoryId: OIL_MASKS,
    nameAr: "بيورنغ - ماسك 10 Reconstruction Veg-Keratin 1000 مل",
    nameEn: "Puring - 10 Reconstruction Veg-Keratin Mask 1000ml",
    descriptionAr:
      "ماسك 10 Reconstruction Veg-Keratin من بيورنغ — حجم صالون لإعادة بناء الشعر.\n\n" +
      "• يعيد الحيوية للشعر الهش والباهت.\n• Keratin نباتي وبروتينات.\n• 1000 مل.",
    descriptionEn:
      "Puring 10 Reconstruction Veg-Keratin Mask 1000ml — salon-size restructuring mask.\n\n" +
      "• Revives brittle, dull and treated hair.\n• Vegetable keratin and proteins.\n• 1000 ml.",
  },

  // ── 11 VolumeUp ──
  {
    barcode: "8057587080507",
    slug: "puring-11-volumeup-volumizing-shampoo-1000ml",
    sku: "PUR-080507",
    price: 22000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "بيورنغ - شامبو 11 VolumeUp Volumizing للشعر الرفيع 1000 مل",
    nameEn: "Puring - 11 VolumeUp Volumizing Shampoo 1000ml",
    descriptionAr:
      "شامبو 11 VolumeUp Volumizing من بيورنغ — حجم وكثافة للشعر الرفيع.\n\n" +
      "• مستخلص الخيزران لتقوية الألياف.\n• يرفع الجذور دون إثقال.\n• يمنح حيوية ولمعاناً.\n• عطر جوز الهند والبطيخ.\n• 1000 مل.",
    descriptionEn:
      "Puring 11 VolumeUp Volumizing Shampoo — body and lift for fine, limp hair.\n\n" +
      "• Bamboo extract strengthens the fiber.\n• Lifts roots without weighing down.\n• Adds vitality and shine.\n• Coconut, melon and patchouli scent.\n• 1000 ml.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
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

async function resolveBrand(): Promise<string> {
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "بيورنغ",
    brandEn: "Puring",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Puring brand");
  return id;
}

async function barcodeExists(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${barcode}`);
  return check.exists;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images)\n`);
  await login();
  const brandId = await resolveBrand();
  console.log(`Brand: Puring (${brandId})\n`);

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
