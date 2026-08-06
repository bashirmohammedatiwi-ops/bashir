/**
 * Head & Shoulders — 16 separate single-SKU shampoo products (no shades, no images).
 * Usage: npx tsx scripts/add-head-shoulders-batch16-single-api.ts
 * Optional: ONLY_BARCODES=5011321361089,8006540028957 npx tsx ...
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HAIR_CARE = "150a633e-80a7-4cb3-8f2d-8eab90a99190";
const SHAMPOO_CONDITIONER = "25b4613e-cbf3-47cc-98b1-c94b398d51f4";

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

function bullets(intro: string, benefits: string[]): string {
  return `${intro}\n\n${benefits.map((b) => `• ${b}`).join("\n")}`;
}

const PRODUCTS: ProductDef[] = [
  // ─── 1. Citrus Fresh 400ml ───
  {
    barcode: "5011321361089",
    slug: "head-shoulders-citrus-fresh-anti-dandruff-shampoo-400ml-361089",
    sku: "HNS-CF-361089",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز سيتروس فريش - شامبو ضد القشرة 400 مل",
    nameEn: "Head & Shoulders Citrus Fresh Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز سيتروس فريش بخلاصة الحمضيات ينظّف فروة الرأس بعمق ويزيل القشرة والدهون الزائدة مع إحساس منعش بالانتعاش.",
      ["ضد القشرة بنسبة تصل إلى 100%", "ينظّف الدهون الزائدة بعمق", "رائحة حمضيات منعشة", "مناسب للاستخدام اليومي", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Citrus Fresh shampoo deeply purifies the scalp and removes dandruff and excess oil, leaving a refreshing citrus sensation.",
      ["Up to 100% dandruff free", "Deep oil cleansing", "Refreshing citrus scent", "Suitable for daily use", "400ml"],
    ),
  },

  // ─── 2. Daily Protect 400ml ───
  {
    barcode: "8006540028957",
    slug: "head-shoulders-daily-protect-anti-dandruff-shampoo-400ml-028957",
    sku: "HNS-DP-028957",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز ديلي بروتكت - شامبو حماية يومية ضد القشرة 400 مل",
    nameEn: "Head & Shoulders Daily Protect Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز ديلي بروتكت يوفّر حماية يومية من القشرة والجراثيم والبكتيريا بتركيبة ثلاثية المفعول تنظّف وتحمي وترطّب.",
      ["حماية يومية من الجراثيم والبكتيريا", "ضد القشرة بنسبة تصل إلى 100%", "تركيبة ثلاثية المفعول", "ينظّف ويحمي ويرطّب", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Daily Protect shampoo provides daily protection against dandruff, germs and bacteria with a 3-action formula that cleanses, protects and moisturizes.",
      ["Daily germ & bacteria protection", "Up to 100% dandruff free", "3-action formula", "Cleanses, protects & moisturizes", "400ml"],
    ),
  },

  // ─── 3. Sub-Zero Freshness 400ml ───
  {
    barcode: "8006540314210",
    slug: "head-shoulders-sub-zero-freshness-anti-dandruff-shampoo-400ml-314210",
    sku: "HNS-SZ-314210",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز صب زيرو - شامبو انتعاش مكثّف ضد القشرة 400 مل",
    nameEn: "Head & Shoulders Sub-Zero Freshness Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز صب زيرو فريشنس بتركيبة المنثول المضاعف يمنح فروة الرأس إحساساً بالبرودة المكثّفة -5 درجات مع حماية فعّالة من القشرة.",
      ["إحساس تبريد مكثّف -5 درجات", "ضعف كمية المنثول", "ضد القشرة بنسبة تصل إلى 100%", "مناسب لجميع أنواع الشعر", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Sub-Zero Freshness shampoo with 2x menthol delivers an intense -5°C cooling sensation while providing effective dandruff protection.",
      ["-5°C intense cooling sensation", "2x menthol formula", "Up to 100% dandruff free", "Suitable for all hair types", "400ml"],
    ),
  },

  // ─── 4. Total Care 400ml ───
  {
    barcode: "4084500140547",
    slug: "head-shoulders-total-care-anti-dandruff-shampoo-400ml-140547",
    sku: "HNS-TC-140547",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز توتال كير - شامبو العناية الشاملة ضد القشرة 400 مل",
    nameEn: "Head & Shoulders Total Care Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز توتال كير بتركيبة هيدرازنك المعزّزة برائحة رجالية منعشة ينظّف بعمق ويحارب القشرة ويترك الشعر ناعماً ومنتعشاً.",
      ["تركيبة هيدرازنك المتقدمة", "ضد القشرة بنسبة تصل إلى 100%", "تنظيف وحماية وترطيب", "رائحة رجالية منعشة", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Total Care shampoo with Hydrazinc formula and a masculine scent deeply cleanses, fights dandruff and leaves hair soft and refreshed.",
      ["Advanced Hydrazinc formula", "Up to 100% dandruff free", "Cleanses, protects & moisturizes", "Fresh masculine scent", "400ml"],
    ),
  },

  // ─── 5. Classic Clean 400ml ───
  {
    barcode: "5011321360945",
    slug: "head-shoulders-classic-clean-anti-dandruff-shampoo-400ml-360945",
    sku: "HNS-CC-360945",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز كلاسيك كلين - شامبو التنظيف الكلاسيكي ضد القشرة 400 مل",
    nameEn: "Head & Shoulders Classic Clean Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز كلاسيك كلين الأصلي بتركيبة توازن الميكروبيوم يحارب القشرة من جذورها ويمنح شعراً نظيفاً وناعماً ومنتعشاً للاستخدام اليومي.",
      ["الشامبو الأصلي ضد القشرة", "تركيبة توازن الميكروبيوم", "ضد القشرة بنسبة تصل إلى 100%", "لطيف للاستخدام اليومي", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Classic Clean — the original anti-dandruff shampoo with Microbiome Balance formula targets the root cause of dandruff for clean, soft and refreshed hair.",
      ["The original anti-dandruff shampoo", "Microbiome Balance formula", "Up to 100% dandruff free", "Gentle for daily use", "400ml"],
    ),
  },

  // ─── 6. Hairfall Defense For Men 400ml ───
  {
    barcode: "5011321656390",
    slug: "head-shoulders-hairfall-defense-anti-dandruff-shampoo-men-400ml-656390",
    sku: "HNS-HF-656390",
    price: 9500,
    originalPrice: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز هيرفول ديفنس - شامبو ضد القشرة وتساقط الشعر للرجال 400 مل",
    nameEn: "Head & Shoulders Hairfall Defense Anti-Dandruff Shampoo For Men 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز هيرفول ديفنس للرجال يحارب القشرة ويقوّي الشعر الضعيف المعرّض للتساقط مع رائحة رجالية منعشة.",
      ["ضد القشرة وتساقط الشعر", "يقوّي ويكثّف الشعر الضعيف", "رائحة رجالية بتقنية Fresh Scent", "مناسب للاستخدام اليومي", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Hairfall Defense shampoo for men fights dandruff while strengthening weak, thinning hair with a masculine Fresh Scent Technology fragrance.",
      ["Anti-dandruff & anti-hair loss", "Strengthens & thickens weak hair", "Fresh Scent Technology", "Suitable for daily use", "400ml"],
    ),
  },

  // ─── 7. Dry Scalp Care 400ml ───
  {
    barcode: "5011321986794",
    slug: "head-shoulders-dry-scalp-care-anti-dandruff-shampoo-400ml-986794",
    sku: "HNS-DS-986794",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز دراي سكالب كير - شامبو ضد القشرة لفروة الرأس الجافة 400 مل",
    nameEn: "Head & Shoulders Dry Scalp Care Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز دراي سكالب كير بزيت اللوز يعيد الترطيب الطبيعي لفروة الرأس الجافة ويحارب القشرة والحكة والجفاف.",
      ["بخلاصة زيت اللوز", "يرطّب فروة الرأس الجافة", "يحارب القشرة والحكة والجفاف", "ضد القشرة بنسبة تصل إلى 100%", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Dry Scalp Care shampoo infused with almond oil restores natural moisture to dry scalps while fighting dandruff, itch and dryness.",
      ["Infused with almond oil", "Restores scalp moisture", "Fights dandruff, itch & dryness", "Up to 100% dandruff free", "400ml"],
    ),
  },

  // ─── 8. Menthol Fresh 400ml ───
  {
    barcode: "5011321361058",
    slug: "head-shoulders-menthol-fresh-anti-dandruff-shampoo-400ml-361058",
    sku: "HNS-MF-361058",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز منثول فريش - شامبو ضد القشرة بالنعناع 400 مل",
    nameEn: "Head & Shoulders Menthol Fresh Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز منثول فريش بالنعناع يمنح فروة الرأس إحساساً منعشاً ومهدّئاً مع حماية فعّالة من القشرة والحكة والجفاف.",
      ["إحساس منعش ومهدّئ بالنعناع", "تركيبة توازن الميكروبيوم", "ضد القشرة بنسبة تصل إلى 100%", "معزّز بالفيتامينات ومضادات الأكسدة", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Menthol Fresh shampoo provides an instantly refreshing and soothing menthol sensation while fighting dandruff, itch and dryness.",
      ["Refreshing menthol sensation", "Microbiome Balance formula", "Up to 100% dandruff free", "Boosted with vitamins & antioxidants", "400ml"],
    ),
  },

  // ─── 9. Apple Fresh 400ml ───
  {
    barcode: "8001090316196",
    slug: "head-shoulders-apple-fresh-anti-dandruff-shampoo-400ml-316196",
    sku: "HNS-AF-316196",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز أبل فريش - شامبو ضد القشرة بالتفاح الأخضر 400 مل",
    nameEn: "Head & Shoulders Apple Fresh Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز أبل فريش بتركيبة ثلاثية المفعول ورائحة التفاح الأخضر المنعشة ينظّف فروة الرأس ويحمي من القشرة ويرطّب الشعر.",
      ["رائحة التفاح الأخضر المنعشة", "تركيبة ثلاثية المفعول", "ضد القشرة بنسبة تصل إلى 100%", "مناسب لجميع أنواع الشعر", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Apple Fresh shampoo with a 3-action formula and refreshing green apple scent cleanses the scalp, protects from dandruff and moisturizes hair.",
      ["Refreshing green apple scent", "3-action formula", "Up to 100% dandruff free", "Suitable for all hair types", "400ml"],
    ),
  },

  // ─── 10. Extra Volume 400ml ───
  {
    barcode: "5011321361027",
    slug: "head-shoulders-extra-volume-anti-dandruff-shampoo-400ml-361027",
    sku: "HNS-EV-361027",
    price: 9000,
    originalPrice: 10500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز إكسترا فوليوم - شامبو كثافة إضافية ضد القشرة 400 مل",
    nameEn: "Head & Shoulders Extra Volume Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز إكسترا فوليوم يمنح الشعر الخفيف والمسطّح كثافة وحيوية تدوم 24 ساعة مع حماية فعّالة من القشرة.",
      ["كثافة وحيوية تدوم 24 ساعة", "للشعر الخفيف والمسطّح", "ضد القشرة بنسبة تصل إلى 100%", "تركيبة بالـ Piroctone Olamine", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Extra Volume shampoo gives flat, lifeless hair a 24-hour volume boost while providing effective dandruff protection.",
      ["24-hour volume boost", "For flat & lifeless hair", "Up to 100% dandruff free", "Piroctone Olamine formula", "400ml"],
    ),
  },

  // ─── 11. Deep Clean Severe Oily Scalp 400ml ───
  {
    barcode: "8001090967558",
    slug: "head-shoulders-deep-clean-severe-oily-scalp-shampoo-400ml-967558",
    sku: "HNS-DO-967558",
    price: 9500,
    originalPrice: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز ديب كلين - شامبو تنظيف عميق لفروة الرأس شديدة الدهون 400 مل",
    nameEn: "Head & Shoulders Deep Clean Severe Oily Scalp Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز ديب كلين بتركيبة جل مكثّفة بالحمضيات والليمون ينظّف مسام فروة الرأس بعمق ويزيل الدهون الشديدة والقشرة من أول استخدام.",
      ["تنظيف عميق لمسام فروة الرأس", "يزيل الدهون الشديدة من أول غسلة", "بخلاصة الحمضيات والليمون", "خالٍ من السيليكون والبارابين", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Deep Clean shampoo with a citrus-infused gel formula deeply cleanses scalp pores, removing severe oil and dandruff from the first wash.",
      ["Deep scalp pore cleansing", "Removes severe oil from first wash", "Citrus & lemon infused", "Silicone & paraben free", "400ml"],
    ),
  },

  // ─── 12. Deep Clean Severe Itchy Scalp (Peppermint) 400ml ───
  {
    barcode: "8001090965721",
    slug: "head-shoulders-deep-clean-itchy-scalp-shampoo-400ml-965721",
    sku: "HNS-DI-965721",
    price: 9500,
    originalPrice: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز ديب كلين - شامبو تنظيف عميق لفروة الرأس شديدة الحكة بالنعناع 400 مل",
    nameEn: "Head & Shoulders Deep Clean Severe Itchy Scalp Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز ديب كلين بالنعناع ينظّف فروة الرأس بعمق ويهدّئ الحكة الشديدة ويزيل القشرة والدهون مع إحساس منعش.",
      ["تنظيف عميق وتهدئة الحكة الشديدة", "بخلاصة النعناع المنعشة", "ضد القشرة من أول استخدام", "خالٍ من السيليكون والبارابين", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Deep Clean shampoo infused with peppermint deeply cleanses the scalp, soothes severe itch and removes dandruff and oil with a refreshing feel.",
      ["Deep cleansing & severe itch relief", "Peppermint infused", "Anti-dandruff from first use", "Silicone & paraben free", "400ml"],
    ),
  },

  // ─── 13. Oud Collection 400ml ───
  {
    barcode: "8001841558608",
    slug: "head-shoulders-oud-collection-anti-dandruff-shampoo-400ml-558608",
    sku: "HNS-OD-558608",
    price: 9500,
    originalPrice: 11000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز مجموعة العود - شامبو ضد القشرة برائحة العود الشرقي 400 مل",
    nameEn: "Head & Shoulders Oud Collection Anti-Dandruff Shampoo 400ml",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز من مجموعة العود بتركيبة عطرية فاخرة مستوحاة من العود الشرقي يحارب القشرة ويمنح الشعر رطوبة وعطراً جذاباً يدوم.",
      ["رائحة العود الشرقي الفاخرة", "ضد القشرة بنسبة تصل إلى 100%", "يرطّب الشعر ويمنحه لمعاناً", "مناسب لجميع أنواع الشعر", "400 مل"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Oud Collection shampoo with a luxurious Oud-inspired fragrance fights dandruff while leaving hair moisturized and beautifully scented.",
      ["Luxurious Oud fragrance", "Up to 100% dandruff free", "Moisturizes & adds shine", "Suitable for all hair types", "400ml"],
    ),
  },

  // ─── 14. h&s 5in1 Cool Cleanse 340g (Japan) ───
  {
    barcode: "4987176243355",
    slug: "head-shoulders-5in1-cool-cleanse-shampoo-340g-243355",
    sku: "HNS-5C-243355",
    price: 12000,
    originalPrice: 14000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز 5 في 1 كول كلينز - شامبو تنظيف منعش ياباني 340 غرام",
    nameEn: "Head & Shoulders h&s 5in1 Cool Cleanse Shampoo 340g (Japan)",
    descriptionAr: bullets(
      "شامبو h&s 5 في 1 كول كلينز الياباني يعالج 5 مشاكل لفروة الرأس في منتج واحد: الحكة والرائحة والقشرة والجفاف والدهون الزائدة مع رائحة زهرية منعشة.",
      ["5 فوائد في شامبو واحد", "ضد الحكة والرائحة والقشرة", "يرطّب ويزيل الدهون الزائدة", "بمعادن أعماق البحار", "صناعة يابانية — 340 غرام"],
    ),
    descriptionEn: bullets(
      "h&s 5in1 Cool Cleanse Japanese shampoo tackles 5 scalp concerns in one: itch, odor, dandruff, dryness and oiliness with deep sea minerals and a refreshing floral scent.",
      ["5-in-1 scalp care", "Fights itch, odor & dandruff", "Moisturizes & removes excess oil", "Deep sea minerals", "Made in Japan — 340g"],
    ),
  },

  // ─── 15. h&s Soothing Scalp Care 500ml (Japan) ───
  {
    barcode: "4987176214768",
    slug: "head-shoulders-soothing-scalp-care-shampoo-500ml-214768",
    sku: "HNS-SS-214768",
    price: 14000,
    originalPrice: 16500,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز سوذينغ سكالب كير - شامبو العناية المهدّئة بالأوكالبتوس 500 مل ياباني",
    nameEn: "Head & Shoulders h&s Soothing Scalp Care Shampoo 500ml (Japan)",
    descriptionAr: bullets(
      "شامبو h&s سوذينغ سكالب كير الياباني بخلاصة الأوكالبتوس يهدّئ فروة الرأس الحسّاسة ويحارب القشرة والحكة بتركيبة متقدمة مع الزنك بيريثيون.",
      ["بخلاصة الأوكالبتوس المهدّئة", "يحارب القشرة والحكة", "للفروة الحسّاسة والمتهيّجة", "تركيبة متقدمة بالزنك بيريثيون", "صناعة يابانية — 500 مل"],
    ),
    descriptionEn: bullets(
      "h&s Soothing Scalp Care Japanese shampoo with eucalyptus extract soothes sensitive scalps and fights dandruff and itch with an advanced zinc pyrithione formula.",
      ["Eucalyptus extract", "Fights dandruff & itch", "For sensitive & irritated scalps", "Advanced zinc pyrithione formula", "Made in Japan — 500ml"],
    ),
  },

  // ─── 16. Itchy Scalp Care 1.8L ───
  {
    barcode: "4902430373937",
    slug: "head-shoulders-itchy-scalp-care-shampoo-1800ml-373937",
    sku: "HNS-IS-373937",
    price: 18000,
    originalPrice: 21000,
    tertiaryCategoryId: SHAMPOO_CONDITIONER,
    nameAr: "هيد أند شولدرز إيتشي سكالب كير - شامبو ضد القشرة والحكة 1.8 لتر",
    nameEn: "Head & Shoulders Itchy Scalp Care Anti-Dandruff Shampoo 1.8L",
    descriptionAr: bullets(
      "شامبو هيد أند شولدرز إيتشي سكالب كير بالحجم العائلي 1.8 لتر بتركيبة ZPT الحاصلة على براءة اختراع يهدّئ الحكة ويزيل القشرة ويقلّل تكسّر الشعر.",
      ["حجم عائلي اقتصادي 1.8 لتر", "تركيبة ZPT الحاصلة على براءة اختراع", "يهدّئ الحكة ويزيل القشرة", "يقلّل تكسّر الشعر ويكثّفه", "تنظيف وحماية وترطيب"],
    ),
    descriptionEn: bullets(
      "Head & Shoulders Itchy Scalp Care family-size shampoo with patented ZPT formula soothes itch, clears dandruff and reduces hair breakage for thicker-looking hair.",
      ["Family-size 1.8L", "Patented ZPT formula", "Soothes itch & clears dandruff", "Reduces hair breakage", "Cleanses, protects & moisturizes"],
    ),
  },
];

const ONLY_BARCODES = process.env.ONLY_BARCODES?.split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const ACTIVE = PRODUCTS.filter((p) => !ONLY_BARCODES?.length || ONLY_BARCODES.includes(p.barcode));

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
    brandAr: "هيد أند شولدرز",
    brandEn: "Head & Shoulders",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Head & Shoulders brand");
  return brandId;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${ACTIVE.length} (no shades, no images)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log(`Brand: هيد أند شولدرز (${brandId})\n`);

  let added = 0;
  let skipped = 0;

  for (const product of ACTIVE) {
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

  console.log(`\nDone — added: ${added}/${ACTIVE.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
