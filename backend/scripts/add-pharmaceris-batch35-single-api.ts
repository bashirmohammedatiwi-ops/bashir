/**
 * Pharmaceris — 35 dermocosmetic products (no shades, no images).
 * Sources: pharmaceris.com, lifepharmacy.com, arena.pl, rozetka.pl, dawaai.pk
 * Skipped: 5900717144772 (not found in public databases)
 * Usage: npx tsx scripts/add-pharmaceris-batch35-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5900717147041",
    slug: "pharmaceris-w-albucin-mela-radiance-serum-30ml",
    sku: "PHR-147041",
    price: 22000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس W - سيروم ألبوسين-ميلا للإشراق والتفتيح 30مل",
    nameEn: "Pharmaceris W - Albucin-Mela Radiance Serum 30ml",
    descriptionAr: "سيروم تفتيح من خط W Albucin — يقلل البقع والتصبغات ويوحد لون البشرة بفضل حمض الهيaluronيك والنانوببتيد-1 ومستخلص الشوك الحلقي. مناسب للبشرة التي تعاني من تصبغات وبهتان.\n\n• حمض الهيaluronيك، نانوببتيد-1، مستخلص الشوك الحلقي\n• مختبر جلدياً\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris W Albucin-Mela Radiance Serum — brightens hyperpigmentation and evens skin tone with hyaluronic acid, nanopeptide-1 and lady's thistle extract.\n\n• Hyaluronic acid, nanopeptide-1, lady's thistle\n• Dermatologically tested\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717147065",
    slug: "pharmaceris-w-albucin-c-whitening-active-concentrate-5-vitamin-c-30ml",
    sku: "PHR-147065",
    price: 22000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس W - مركز ألبوسين-سي فيتامين C 5% للتفتيح 30مل",
    nameEn: "Pharmaceris W - Albucin-C Whitening Active Concentrate 5% Vitamin C 30ml",
    descriptionAr: "مركز فيتامين C 5% من خط W Albucin — يفتّح البقع الداكنة ويحمي البشرة كمضاد للأكسدة. تركيبة نشطة للبشرة المصابة بالتصبغات والبهتان.\n\n• فيتامين C 5%، نياسيناميد\n• مختبر جلدياً\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris W Albucin-C Whitening Active Concentrate — 5% vitamin C formula lightens dark spots and provides antioxidant protection for dull, hyperpigmented skin.\n\n• 5% vitamin C, niacinamide\n• Dermatologically tested\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717158511",
    slug: "pharmaceris-h-stimuforten-intensive-hair-growth-stimulating-spray-125ml",
    sku: "PHR-158511",
    price: 20000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1",
    nameAr: "فارماسيريس H - بخاخ ستيميوفورتن المكثّف لتحفيز نمو الشعر 125مل",
    nameEn: "Pharmaceris H - Stimuforten Intensive Hair Growth Stimulating Spray 125ml",
    descriptionAr: "بخاخ علاجي من خط H Stimuforten — يحفّز نمو الشعر ويقلّل التساقط بفضل عامل النمو الطبيعي FGF والكافيين. للشعر الضعيف والمتساقط.\n\n• FGF وكافيين\n• للاستخدام على فروة الرأس\n• صنع في بولندا\n• 125 مل",
    descriptionEn: "Pharmaceris H Stimuforten Intensive Hair Growth Stimulating Spray — stimulates regrowth and reduces hair loss with Natural Growth Factor FGF and caffeine.\n\n• FGF and caffeine complex\n• Scalp treatment spray\n• Made in Poland\n• 125ml",
  },
  {
    barcode: "5900717158313",
    slug: "pharmaceris-h-stimulinum-hair-growth-stimulating-conditioner-150ml",
    sku: "PHR-158313",
    price: 17000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "25b4613e-cbf3-47cc-98b1-c94b398d51f4",
    nameAr: "فارماسيريس H - بلسم Stimulinum لتنشيط نمو الشعر 150 مل",
    nameEn: "Pharmaceris H - Stimulinum Hair Growth Stimulating Conditioner 150ml",
    descriptionAr: "بلسم من خط H Stimuforten — يغذّي الشعر الضعيف ويزيد الكثافة مع FGF والكافيين. يُستخدم بعد الشامبو المناسب من نفس الخط.\n\n• FGF وكافيين\n• للشعر الضعيف والمتساقط\n• صنع في بولندا\n• 150 مل",
    descriptionEn: "Pharmaceris H Stimulinum Hair Growth Stimulating Conditioner — nourishes weak hair and boosts volume with FGF and caffeine.\n\n• FGF and caffeine\n• For weak, thinning hair\n• Made in Poland\n• 150ml",
  },
  {
    barcode: "5900717158214",
    slug: "pharmaceris-h-stimupurin-professional-hair-growth-stimulating-shampoo-250ml",
    sku: "PHR-158214",
    price: 17000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "25b4613e-cbf3-47cc-98b1-c94b398d51f4",
    nameAr: "فارماسيريس H - شامبو Stimupurin المهني لتحفيز نمو الشعر 250 مل",
    nameEn: "Pharmaceris H - Stimupurin Professional Hair Growth Stimulating Shampoo 250ml",
    descriptionAr: "شامبو مهني من خط H Stimuforten — ينشّط بصيلات الشعر ويقلّل التساقط. تركيبة FGF وكافيين للشعر الضعيف.\n\n• FGF وكافيين\n• للاستخدام اليومي\n• صنع في بولندا\n• 250 مل",
    descriptionEn: "Pharmaceris H Stimupurin Professional Hair Growth Stimulating Shampoo — stimulates follicles and prevents hair loss with FGF and caffeine.\n\n• FGF and caffeine\n• Daily use shampoo\n• Made in Poland\n• 250ml",
  },
  {
    barcode: "5900717146310",
    slug: "pharmaceris-p-ichtilix-forte-keratolytic-psoriatic-scale-reducing-spray-125ml",
    sku: "PHR-146310",
    price: 18000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "ee39d6a6-5074-43b6-a80c-a7c1b23c3bd1",
    nameAr: "فارماسيريس P - بخاخ Ichtilix-Forte لإزالة القشور 125 مل",
    nameEn: "Pharmaceris P - Ichtilix-Forte Keratolytic Psoriatic Scale Reducing Spray 125ml",
    descriptionAr: "بخاخ keratolytic من خط P — يزيل القشور psoriatic من فروة الرأس والجسم. للبشرة المصابة بال psoriasis والتقشر.\n\n• سائل keratolytic\n• للفروة والجسم\n• صنع في بولندا\n• 125 مل",
    descriptionEn: "Pharmaceris P Ichtilix-Forte Keratolytic Spray — removes psoriatic scales from scalp and body with keratolytic action.\n\n• Keratolytic formula\n• For scalp and body\n• Made in Poland\n• 125ml",
  },
  {
    barcode: "5900717146259",
    slug: "pharmaceris-p-puri-ichtilium-body-scalp-cleansing-gel-250ml",
    sku: "PHR-146259",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس P - جل Puri-Ichtilium لتنظيف الجسم وفروة الرأس 250 مل",
    nameEn: "Pharmaceris P - Puri-Ichtilium Body & Scalp Cleansing Gel 250ml",
    descriptionAr: "جل تنظيف من خط P — ينظّف بشرة psoriasis ويُطبيع التقشر. للاستخدام على الجسم وفروة الرأس.\n\n• للبشرة المصابة بال psoriasis\n• تنظيف لطيف يومي\n• صنع في بولندا\n• 250 مل",
    descriptionEn: "Pharmaceris P Puri-Ichtilium Body & Scalp Cleansing Gel — cleanses psoriasis-prone skin and normalizes flaking on body and scalp.\n\n• For psoriatic skin\n• Gentle daily cleanse\n• Made in Poland\n• 250ml",
  },
  {
    barcode: "5900717142718",
    slug: "pharmaceris-t-sebo-almond-peel-5-exfoliating-night-cream-50ml",
    sku: "PHR-142718",
    price: 22000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس T - كريم ليلي Sebo-Almond Peel 5% mandelic 50مل",
    nameEn: "Pharmaceris T - Sebo-Almond Peel 5% Exfoliating Night Cream 50ml",
    descriptionAr: "كريم ليلي تقشيري من خط T — 5% mandelic acid لتنظيف المسام وعلاج حب الشباب بلطف. للبشرة الدهنية والمختلطة.\n\n• 5% mandelic acid\n• للاستخدام الليلي\n• صنع في بولندا\n• 50 مل",
    descriptionEn: "Pharmaceris T Sebo-Almond Peel 5% Exfoliating Night Cream — gentle 5% mandelic acid exfoliation for acne-prone oily skin.\n\n• 5% mandelic acid grade I\n• Night use\n• Made in Poland\n• 50ml",
  },
  {
    barcode: "5900717142213",
    slug: "pharmaceris-t-sebostatic-day-anti-acne-normalizing-face-cream-spf-20-50ml",
    sku: "PHR-142213",
    price: 20000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس T - كريم نهاري Sebostatic SPF 20 ضد حب الشباب 50مل",
    nameEn: "Pharmaceris T - Sebostatic Day Anti-Acne Normalizing Face Cream SPF 20 50ml",
    descriptionAr: "كريم نهاري من خط T — يقلّل اللمعان ويصغّر المسام مع حماية SPF 20. للبشرة الدهنية والمختلطة مع حب الشباب.\n\n• SPF 20\n• مطفي ومنظّم للزهم\n• صنع في بولندا\n• 50 مل",
    descriptionEn: "Pharmaceris T Sebostatic Day Anti-Acne Normalizing Face Cream SPF 20 — mattifies, reduces pores and protects oily acne-prone skin.\n\n• SPF 20\n• Sebo-regulating\n• Made in Poland\n• 50ml",
  },
  {
    barcode: "5900717140073",
    slug: "pharmaceris-t-pureretinol-0-3-retinol-night-cream-adult-acne-40ml",
    sku: "PHR-140073",
    price: 24000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس T - كريم ليلي pureRETINOL 0.3% لحب الشباب 40مل",
    nameEn: "Pharmaceris T - pureRETINOL 0.3 Retinol Night Cream Adult Acne 40ml",
    descriptionAr: "كريم ليلي retinol 0.3% من خط T — لعلاج حب الشباب وعلامات التقدّم في العمر. للبشرة الناضجة المعرضة للحبوب.\n\n• 0.3% retinol\n• للاستخدام الليلي\n• صنع في بولندا\n• 40 مل",
    descriptionEn: "Pharmaceris T pureRETINOL 0.3 Retinol Night Cream — 0.3% retinol anti-acne and anti-aging care for adult acne-prone skin.\n\n• 0.3% retinol\n• Night use\n• Made in Poland\n• 40ml",
  },
  {
    barcode: "5900717149069",
    slug: "pharmaceris-s-spectrum-protect-broad-spectrum-spf-50-cream-50ml",
    sku: "PHR-149069",
    price: 18000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "25dc8086-bffa-47af-aaf7-64d503e58a9f",
    tertiaryCategoryId: "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2",
    nameAr: "فارماسيريس S - كريم Spectrum-Protect واقي SPF 50+ 50مل",
    nameEn: "Pharmaceris S - Spectrum-Protect Broad Spectrum SPF 50+ Cream 50ml",
    descriptionAr: "كريم واقي من خط S — حماية واسعة UVA/UVB/IR/HEV للبشرة الحساسة. SPF 50+ مناسب للأطفال والبالغين.\n\n• SPF 50+ broad spectrum\n• للبشرة الحساسة\n• صنع في بولندا\n• 50 مل",
    descriptionEn: "Pharmaceris S Spectrum-Protect Broad Spectrum SPF 50+ Cream — UVA/UVB/IR/HEV protection for sensitive skin, adults and children.\n\n• SPF 50+\n• Sensitive skin\n• Made in Poland\n• 50ml",
  },
  {
    barcode: "5900717149052",
    slug: "pharmaceris-s-medi-acne-protect-spf-50-mattifying-cream-50ml",
    sku: "PHR-149052",
    price: 18000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "25dc8086-bffa-47af-aaf7-64d503e58a9f",
    tertiaryCategoryId: "ad2a9e6b-5e20-4393-849a-e5e6c6cc97e2",
    nameAr: "فارماسيريس S - كريم Medi Acne Protect SPF 50+ مطفي 50مل",
    nameEn: "Pharmaceris S - Medi Acne Protect SPF 50+ Mattifying Cream 50ml",
    descriptionAr: "كريم واقي مطفي من خط S — SPF 50+ للبشرة الدهنية والمختلطة مع حب الشباب. حماية عالية بدون لمعان.\n\n• SPF 50+ مطفي\n• للبشرة الدهنية مع acne\n• صنع في بولندا\n• 50 مل",
    descriptionEn: "Pharmaceris S Medi Acne Protect SPF 50+ Mattifying Cream — high mattifying sun protection for oily acne-prone skin.\n\n• SPF 50+ mattifying\n• Acne-prone oily skin\n• Made in Poland\n• 50ml",
  },
  {
    barcode: "5900717153158",
    slug: "pharmaceris-f-matt-mineral-correction-10-light-mineral-mattifying-dermo-foundation-spf-30-30ml",
    sku: "PHR-153158",
    price: 22000,
    categoryId: "d3c24d19-dde5-41e5-b0a9-bede45393795",
    subcategoryId: "2bbecee1-084d-446c-b4fd-65f769130de9",
    tertiaryCategoryId: "036b1b3c-aa73-4dd1-bdd2-1a12f193645a",
    nameAr: "فارماسيريس F - أساس Matt-Mineral-Correction 10 Light SPF 30 30مل",
    nameEn: "Pharmaceris F - Matt-Mineral-Correction 10 Light Mineral Mattifying Dermo-Foundation SPF 30 30ml",
    descriptionAr: "أساس mineral matte من خط F — درجة 10 Light للبشرة الدهنية مع SPF 30. تغطية dermo-cosmetic للمسام واللمعان.\n\n• درجة 10 Light\n• SPF 30 mineral matte\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris F Matt-Mineral-Correction 10 Light — mineral mattifying dermo-foundation SPF 30 for oily skin.\n\n• Shade 10 Light\n• SPF 30\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717153257",
    slug: "pharmaceris-f-matt-mineral-correction-20-natural-mineral-mattifying-dermo-foundation-spf-30-30ml",
    sku: "PHR-153257",
    price: 22000,
    categoryId: "d3c24d19-dde5-41e5-b0a9-bede45393795",
    subcategoryId: "2bbecee1-084d-446c-b4fd-65f769130de9",
    tertiaryCategoryId: "036b1b3c-aa73-4dd1-bdd2-1a12f193645a",
    nameAr: "فارماسيريس F - أساس Matt-Mineral-Correction 20 Natural SPF 30 30مل",
    nameEn: "Pharmaceris F - Matt-Mineral-Correction 20 Natural Mineral Mattifying Dermo-Foundation SPF 30 30ml",
    descriptionAr: "أساس mineral matte من خط F — درجة 20 Natural للبشرة الدهنية مع SPF 30.\n\n• درجة 20 Natural\n• SPF 30 mineral matte\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris F Matt-Mineral-Correction 20 Natural — mineral mattifying dermo-foundation SPF 30 for oily skin.\n\n• Shade 20 Natural\n• SPF 30\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717153110",
    slug: "pharmaceris-f-coverage-correction-02-sand-mild-fluid-foundation-spf-20-30ml",
    sku: "PHR-153110",
    price: 22000,
    categoryId: "d3c24d19-dde5-41e5-b0a9-bede45393795",
    subcategoryId: "2bbecee1-084d-446c-b4fd-65f769130de9",
    tertiaryCategoryId: "036b1b3c-aa73-4dd1-bdd2-1a12f193645a",
    nameAr: "فارماسيريس F - أساس Coverage-Correction 02 Sand SPF 20 30مل",
    nameEn: "Pharmaceris F - Coverage-Correction 02 Sand Mild Fluid Foundation SPF 20 30ml",
    descriptionAr: "أساس سائل corrective من خط F — درجة 02 Sand بتغطية عالية وSPF 20.\n\n• درجة 02 Sand\n• تغطية عالية SPF 20\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris F Coverage-Correction 02 Sand — high-coverage fluid foundation SPF 20.\n\n• Shade 02 Sand\n• SPF 20\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717153011",
    slug: "pharmaceris-f-coverage-correction-01-ivory-mild-fluid-foundation-spf-20-30ml",
    sku: "PHR-153011",
    price: 22000,
    categoryId: "d3c24d19-dde5-41e5-b0a9-bede45393795",
    subcategoryId: "2bbecee1-084d-446c-b4fd-65f769130de9",
    tertiaryCategoryId: "036b1b3c-aa73-4dd1-bdd2-1a12f193645a",
    nameAr: "فارماسيريس F - أساس Coverage-Correction 01 Ivory SPF 20 30مل",
    nameEn: "Pharmaceris F - Coverage-Correction 01 Ivory Mild Fluid Foundation SPF 20 30ml",
    descriptionAr: "أساس سائل corrective من خط F — درجة 01 Ivory بتغطية عالية وSPF 20.\n\n• درجة 01 Ivory\n• تغطية عالية SPF 20\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris F Coverage-Correction 01 Ivory — high-coverage fluid foundation SPF 20.\n\n• Shade 01 Ivory\n• SPF 20\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717152915",
    slug: "pharmaceris-n-opti-capilaril-intensive-eye-cream-dark-circles-spf-15-15ml",
    sku: "PHR-152915",
    price: 18000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "09bedca5-0c6c-4a71-9b03-4bf29cecaf53",
    nameAr: "فارماسيريس N - كريم Opti-Capilaril للهالات السوداء SPF 15 15مل",
    nameEn: "Pharmaceris N - Opti-Capilaril Intensive Eye Cream Dark Circles SPF 15 15ml",
    descriptionAr: "كريم عيون من خط N — يقلّل الهالات والانتفاخ ويقوّي الشعيرات الدموية مع SPF 15.\n\n• SPF 15\n• للهالات والانتفاخ\n• صنع في بولندا\n• 15 مل",
    descriptionEn: "Pharmaceris N Opti-Capilaril Intensive Eye Cream — reduces dark circles and puffiness, strengthens capillaries, SPF 15.\n\n• SPF 15\n• Dark circles & puffiness\n• Made in Poland\n• 15ml",
  },
  {
    barcode: "5900717150614",
    slug: "pharmaceris-n-c-capilix-vitamin-c-1200-mg-concentrate-30ml",
    sku: "PHR-150614",
    price: 22000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس N - مركز C-Capilix فيتامين C 1200 mg 30مل",
    nameEn: "Pharmaceris N - C-Capilix Vitamin C 1200 mg Concentrate 30ml",
    descriptionAr: "مركز فيتamin C عالي التركيز من خط N — 1200 mg للبشرة ذات الشعيرات الضعيفة والاحمرار.\n\n• فيتامين C 1200 mg\n• للبشرة capillary-prone\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris N C-Capilix Vitamin C 1200 mg Concentrate — high-dose vitamin C for capillary-prone, redness-prone skin.\n\n• 1200 mg vitamin C\n• Capillary care\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717144415",
    slug: "pharmaceris-r-lipo-rosalgin-multi-soothing-day-cream-spf-15-30ml",
    sku: "PHR-144415",
    price: 20000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس R - كريم Lipo-Rosalgin النهاري SPF 15 30مل",
    nameEn: "Pharmaceris R - Lipo-Rosalgin Multi-Soothing Day Cream SPF 15 30ml",
    descriptionAr: "كريم نهاري من خط R — يهدّئ rosacea والاحمرار مع SPF 15. للبشرة الحساسة ذات الاحمرار والشعيرات.\n\n• SPF 15\n• لـ rosacea والاحمرار\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris R Lipo-Rosalgin Multi-Soothing Day Cream SPF 15 — soothes rosacea redness and erythema with daily SPF 15.\n\n• SPF 15\n• Rosacea-prone skin\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717160019",
    slug: "pharmaceris-a-a-e-sensilix-duo-concentrate-vitamins-a-e-in-27-squalane-30ml",
    sku: "PHR-160019",
    price: 22000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس A - مركز A & E-Sensilix فيتامينات A وE 30مل",
    nameEn: "Pharmaceris A - A & E-Sensilix Duo Concentrate Vitamins A & E in 27% Squalane 30ml",
    descriptionAr: "مركز فيتامينات A وE من خط A — 27% squalane لإصلاح البشرة الحساسة والجافة.\n\n• فيتامين A وE، 27% squalane\n• للبشرة الحساسة\n• صنع في بولندا\n• 30 مل",
    descriptionEn: "Pharmaceris A A & E-Sensilix Duo Concentrate — vitamins A & E in 27% squalane for sensitive skin repair.\n\n• Vitamins A & E, 27% squalane\n• Sensitive skin\n• Made in Poland\n• 30ml",
  },
  {
    barcode: "5900717163416",
    slug: "pharmaceris-a-lipo-sensilium-multilipid-nourishing-face-cream-50ml",
    sku: "PHR-163416",
    price: 20000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "فارماسيريس A - كريم Lipo-Sensilium Multilipid المغذّي 50مل",
    nameEn: "Pharmaceris A - Lipo-Sensilium Multilipid Nourishing Face Cream 50ml",
    descriptionAr: "كريم multilipid من خط A — يغذّي ويُصلح حاجز البشرة الجاف الحساس.\n\n• تركيبة multilipid\n• للبشرة الجافة الحساسة\n• صنع في بولندا\n• 50 مل",
    descriptionEn: "Pharmaceris A Lipo-Sensilium Multilipid Nourishing Face Cream — replenishes lipids and repairs sensitive dry skin barrier.\n\n• Multilipid formula\n• Sensitive dry skin\n• Made in Poland\n• 50ml",
  },
  {
    barcode: "5900717142114",
    slug: "pharmaceris-t-puri-sebotonique-normalizing-face-toner-200ml",
    sku: "PHR-142114",
    price: 15000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس T - تونر Puri-Sebotonique المنظّم 200مل",
    nameEn: "Pharmaceris T - Puri-Sebotonique Normalizing Face Toner 200ml",
    descriptionAr: "تونر من خط T — يوازن البشرة الدهنية مع حب الشباب بعد الغسيل.\n\n• للبشرة الدهنية/acne\n• 200 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris T Puri-Sebotonique Normalizing Face Toner — balances oily acne-prone skin after cleansing.\n\n• Oily acne skin\n• 200ml\n• Made in Poland",
  },
  {
    barcode: "5900717147102",
    slug: "pharmaceris-w-depigment-tonique-brightening-dermo-toner-200ml",
    sku: "PHR-147102",
    price: 15000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس W - تونر Depigment-Tonique للتفتيح 200مل",
    nameEn: "Pharmaceris W - Depigment-Tonique Brightening Dermo-Toner 200ml",
    descriptionAr: "تونر تفتيح من خط W — يقشّر ويُجهّز البشرة المصابة بالتصبغات. للوجه ومنطقة العين.\n\n• للتصبغات والبهتان\n• 200 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris W Depigment-Tonique Brightening Dermo-Toner — exfoliates and preps hyperpigmented skin for face and eye area.\n\n• Hyperpigmentation\n• 200ml\n• Made in Poland",
  },
  {
    barcode: "5900717142510",
    slug: "pharmaceris-t-sebo-micellar-sebo-regulating-micellar-liquid-200ml",
    sku: "PHR-142510",
    price: 15000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس T - ماء Sebo-Micellar micellar منظّم للزهم 200مل",
    nameEn: "Pharmaceris T - Sebo-Micellar Sebo-Regulating Micellar Liquid 200ml",
    descriptionAr: "ماء micellar من خط T — ينظّف ويزيل المكياج للبشرة الدهنية مع حب الشباب.\n\n• micellar للوجه والعين\n• 200 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris T Sebo-Micellar Sebo-Regulating Micellar Liquid — sebo-regulating micellar cleanser and makeup remover.\n\n• Face and eyes\n• 200ml\n• Made in Poland",
  },
  {
    barcode: "5900717165618",
    slug: "pharmaceris-a-physiopuric-gel-moisturizing-physiological-cleansing-gel-190ml",
    sku: "PHR-165618",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس A - جل Physiopuric-Gel المنظف الفسيولوجي 190مل",
    nameEn: "Pharmaceris A - Physiopuric-Gel Moisturizing Physiological Cleansing Gel 190ml",
    descriptionAr: "جل غسول من خط A — لطيف خالٍ من الصابون للبشرة الحساسة والحساسية. للوجه والعين.\n\n• خالٍ من الصابون\n• 190 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris A Physiopuric-Gel Moisturizing Physiological Cleansing Gel — soap-free gentle cleanser for sensitive allergic skin.\n\n• Soap-free\n• 190ml\n• Made in Poland",
  },
  {
    barcode: "5900717160064",
    slug: "pharmaceris-a-prebio-sensilique-prebiotic-micellar-water-190ml",
    sku: "PHR-160064",
    price: 15000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس A - ماء Prebio-Sensilique micellar prebiotic 190مل",
    nameEn: "Pharmaceris A - Prebio-Sensilique Prebiotic Micellar Water 190ml",
    descriptionAr: "ماء micellar prebiotic من خط A — للبشرة فائقة الحساسية.\n\n• prebiotic micellar\n• 190 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris A Prebio-Sensilique Prebiotic Micellar Water — prebiotic micellar water for hypersensitive skin.\n\n• Prebiotic formula\n• 190ml\n• Made in Poland",
  },
  {
    barcode: "5900717163515",
    slug: "pharmaceris-a-puri-sensilium-soothing-cleansing-foam-150ml",
    sku: "PHR-163515",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس A - رغوة Puri-Sensilium المنظفة المهدئة 150مل",
    nameEn: "Pharmaceris A - Puri-Sensilium Soothing Cleansing Foam 150ml",
    descriptionAr: "رغوة غسول من خط A — مهدئة للبشرة الحساسة والحساسية. للوجه والعين.\n\n• رغوة مهدئة\n• 150 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris A Puri-Sensilium Soothing Cleansing Foam — soap-free soothing foam for sensitive allergic skin.\n\n• Soothing foam\n• 150ml\n• Made in Poland",
  },
  {
    barcode: "5900717142428",
    slug: "pharmaceris-t-puri-sebogel-deep-cleansing-face-gel-190ml",
    sku: "PHR-142428",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس T - جل Puri-Sebogel للتنظيف العميق 190مل",
    nameEn: "Pharmaceris T - Puri-Sebogel Deep Cleansing Face Gel 190ml",
    descriptionAr: "جل تنظيف عميق من خط T — antibacterial للبشرة الدهنية مع حب الشباب.\n\n• تنظيف عميق antibacterial\n• 190 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris T Puri-Sebogel Deep Cleansing Face Gel — antibacterial deep cleanse for oily acne-prone skin.\n\n• Deep cleansing\n• 190ml\n• Made in Poland",
  },
  {
    barcode: "5900717141810",
    slug: "pharmaceris-t-puri-sebostat-anti-acne-face-cleansing-foam-150ml",
    sku: "PHR-141810",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس T - رغوة Puri-Sebostat anti-acne 150مل",
    nameEn: "Pharmaceris T - Puri-Sebostat Anti-Acne Face Cleansing Foam 150ml",
    descriptionAr: "رغوة غسول يومية من خط T — تنظّم الزهم لحب الشباب.\n\n• anti-acne يومي\n• 150 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris T Puri-Sebostat Anti-Acne Face Cleansing Foam — daily foam wash regulates sebum for acne skin.\n\n• Anti-acne daily\n• 150ml\n• Made in Poland",
  },
  {
    barcode: "5900717152021",
    slug: "pharmaceris-n-puri-capilium-redness-soothing-gel-wash-190ml",
    sku: "PHR-152021",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس N - جل Puri-Capilium المهدئ للاحمرار 190مل",
    nameEn: "Pharmaceris N - Puri-Capilium Redness Soothing Gel Wash 190ml",
    descriptionAr: "جل غسول من خط N — يهدّئ الاحمرار أثناء التنظيف اللطيف للوجه والعين.\n\n• للاحمرار والشعيرات\n• 190 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris N Puri-Capilium Redness Soothing Gel Wash — soothes redness during gentle face and eye cleansing.\n\n• Redness & capillaries\n• 190ml\n• Made in Poland",
  },
  {
    barcode: "5900717150423",
    slug: "pharmaceris-n-puri-capiliqmousse-delicate-capillary-strengthening-foam-150ml",
    sku: "PHR-150423",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس N - رغوة Puri-Capiliqmousse لتقوية الشعيرات 150مل",
    nameEn: "Pharmaceris N - Puri-Capiliqmousse Delicate Capillary-Strengthening Foam 150ml",
    descriptionAr: "رغوة غسول من خط N — تقوّي الشعيرات وتهدّئ الاحمرار.\n\n• تقوية الشعيرات\n• 150 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris N Puri-Capiliqmousse Delicate Capillary-Strengthening Foam — strengthens capillaries and soothes redness.\n\n• Capillary strengthening\n• 150ml\n• Made in Poland",
  },
  {
    barcode: "5900717147096",
    slug: "pharmaceris-w-pure-luminum-depigmenting-cleansing-foam-150ml",
    sku: "PHR-147096",
    price: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "فارماسيريس W - رغوة Pure-Luminum للتفتيح 150مل",
    nameEn: "Pharmaceris W - Pure-Luminum Depigmenting Cleansing Foam 150ml",
    descriptionAr: "رغوة غسول من خط W — تفتّح وتنظّف البشرة المصابة بالتصبغات.\n\n• للتصبغات\n• 150 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris W Pure-Luminum Depigmenting Cleansing Foam — brightens and cleanses hyperpigmented skin.\n\n• Depigmenting cleanse\n• 150ml\n• Made in Poland",
  },
  {
    barcode: "5900717157217",
    slug: "pharmaceris-h-keratineum-concentrated-strengthening-shampoo-250ml",
    sku: "PHR-157217",
    price: 17000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "25b4613e-cbf3-47cc-98b1-c94b398d51f4",
    nameAr: "فارماسيريس H - شامبو Keratineum المقوّي للشعر 250مل",
    nameEn: "Pharmaceris H - Keratineum Concentrated Strengthening Shampoo 250ml",
    descriptionAr: "شامبو من خط H — يقوّي الشعر الضعيف المعرض للتساقط.\n\n• للشعر الضعيف\n• 250 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris H Keratineum Concentrated Strengthening Shampoo — strengthens weak hair prone to falling out.\n\n• Weak hair\n• 250ml\n• Made in Poland",
  },
  {
    barcode: "5900717157118",
    slug: "pharmaceris-h-sensitonin-professional-soothing-shampoo-250ml",
    sku: "PHR-157118",
    price: 17000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "25b4613e-cbf3-47cc-98b1-c94b398d51f4",
    nameAr: "فارماسيريس H - شامبو Sensitonin المهدئ لفروة الرأس 250مل",
    nameEn: "Pharmaceris H - Sensitonin Professional Soothing Shampoo 250ml",
    descriptionAr: "شامبو من خط H — يهدّئ فروة الرأس الحساسة والحكة.\n\n• للفروة الحساسة\n• 250 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris H Sensitonin Professional Soothing Shampoo — soothes sensitive scalp irritation and itching.\n\n• Sensitive scalp\n• 250ml\n• Made in Poland",
  },
  {
    barcode: "5900717159112",
    slug: "pharmaceris-h-purin-special-anti-dandruff-shampoo-250ml",
    sku: "PHR-159112",
    price: 17000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "150a633e-80a7-4cb3-8f2d-8eab90a99190",
    tertiaryCategoryId: "25b4613e-cbf3-47cc-98b1-c94b398d51f4",
    nameAr: "فارماسيريس H - شامبو Purin ضد القشرة 250مل",
    nameEn: "Pharmaceris H - Purin Special Anti-Dandruff Shampoo 250ml",
    descriptionAr: "شامبو من خط H — لعلاج القشرة الجافة والدهنية.\n\n• anti-dandruff\n• 250 ml\n• صنع في بولندا",
    descriptionEn: "Pharmaceris H Purin Special Anti-Dandruff Shampoo — treats dry and oily dandruff.\n\n• Anti-dandruff\n• 250ml\n• Made in Poland",
  }
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  token = (json as { data?: { accessToken?: string }; accessToken?: string }).data?.accessToken ??
    (json as { accessToken?: string }).accessToken ?? "";
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
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "فارماسيريس",
    brandEn: "Pharmaceris",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Pharmaceris brand");
  return id;
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

function hasRealImages(product: { images?: Array<{ media?: { id?: string; hash?: string } }> }) {
  return (product.images ?? []).some(
    (img) =>
      img.media?.id &&
      img.media.id !== "placeholder" &&
      img.media.hash !== "alhayaa-product-placeholder-v1",
  );
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, no images, delete+readd)\n`);
  await login();
  const brandId = await resolveBrand();
  console.log(`Brand: Pharmaceris (${brandId})\n`);

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

    const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    if (hasRealImages(verify)) throw new Error(`Product ${product.barcode} has real images`);
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
