import { CATEGORIES, perfumeSubs } from '../lib/core/app-categories.js';

export const CATEGORY_ID = CATEGORIES.perfumes;

/** تصنيفات وأوصاف موحّدة لكل العطور المضافة */
export const PERFUME_UPDATES = [
  // ── Emporio Armani ──
  {
    barcode: '3614272225718',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Stronger With You Intensely is the deeper, warmer evolution of the iconic SWY line — an amber fougère built around chestnut, vanilla and smoky woods.

◆ Scent family: Amber fougère
◆ Key notes: Chestnut, vanilla, amber, lavender, cinnamon
◆ Character: Warm, sensual, addictive and confidently masculine
◆ Best for: Evening, dates and cooler seasons
◆ Longevity: 8–10 hours with strong projection`,
    descriptionAr: `سترونغر ويذ يو إنتنسلي هو التطور الأعمق والأدفأ لخط SWY الأيقوني — فوجير عنبري بالكستناء والفانيليا وأخشاب دخانية.

◆ عائلة العطر: فوجير عنبري
◆ النوتات الرئيسية: كستناء وفانيليا وعنبر ولافندر وقرفة
◆ الطابع: دافئ وحسي ومُدمن ورجولي بثقة
◆ الأنسب لـ: المساء والمواعيد والفصول الباردة
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614274184631',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Sandalwood blends creamy sandalwood with the signature SWY sweetness for a refined unisex oriental woody scent.

◆ Scent family: Oriental woody
◆ Key notes: Sandalwood, chestnut, vanilla, lavender, spices
◆ Character: Creamy, warm, elegant and genderless
◆ Best for: Day to evening, all seasons
◆ Longevity: 7–9 hours with moderate to strong sillage`,
    descriptionAr: `سترونغر ويذ يو صندل وود يمزج خشب الصندل الكريمي مع حلاوة SWY المميزة لعطر شرقي خشبي راقٍ للجنسين.

◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: صندل وكستناء وفانيليا ولافندر وتوابل
◆ الطابع: كريمي ودافئ وأنيق ومناسب للجنسين
◆ الأنسب لـ: النهار والمساء وطوال العام
◆ الثبات: 7–9 ساعات بثبات جيد`,
  },
  {
    barcode: '3614274219579',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Parfum is the richest SWY concentration — leather, lavender and vanilla in a bold, long-lasting masculine parfum.

◆ Scent family: Oriental fougère
◆ Key notes: Lavender, vanilla, leather, chestnut, spices
◆ Character: Deep, luxurious, seductive and powerful
◆ Best for: Evening and special occasions
◆ Longevity: 10+ hours with excellent projection`,
    descriptionAr: `سترونغر ويذ يو بارفوم هو أغنى تركيزات SWY — جلد ولافندر وفانيليا في بارفوم رجالي جريء يدوم طويلاً.

◆ عائلة العطر: فوجير شرقي
◆ النوتات الرئيسية: لافندر وفانيليا وجلد وكستناء وتوابل
◆ الطابع: عميق وفاخر ومغري وقوي
◆ الأنسب لـ: المساء والمناسبات الخاصة
◆ الثبات: أكثر من 10 ساعات بثبات ممتاز`,
  },
  {
    barcode: '3614273665018',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Stronger With You Oud brings luxurious oud warmth to the SWY DNA — deep, resinous and sensually sweet.

◆ Scent family: Oriental woody
◆ Key notes: Oud, chestnut, vanilla, lavender, amber
◆ Character: Rich, smoky, opulent and masculine
◆ Best for: Evening, winter and formal wear
◆ Longevity: 8–10 hours with strong sillage`,
    descriptionAr: `سترونغر ويذ يو عود يضفي دفء العود الفاخر على روح SWY — عميق وصمغي وحلو بحسية.

◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: عود وكستناء وفانيليا ولافندر وعنبر
◆ الطابع: غني ودخاني وفخم ورجولي
◆ الأنسب لـ: المساء والشتاء والمناسبات الرسمية
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273336383',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Absolutely is an ultra-intense parfum with rum, cedarwood and vanilla for maximum depth and longevity.

◆ Scent family: Oriental woody
◆ Key notes: Rum, cedarwood, vanilla, chestnut, spices
◆ Character: Absolute intensity, warm, boozy and captivating
◆ Best for: Night out and cold weather
◆ Longevity: 10+ hours with very strong projection`,
    descriptionAr: `سترونغر ويذ يو أبسولوتلي بارفوم مكثف للغاية بروم وأرز وفانيليا لأقصى عمق وثبات.

◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: روم وأرز وفانيليا وكستناء وتوابل
◆ الطابع: مكثف ودافئ وكحولي وجذاب
◆ الأنسب لـ: الخروج الليلي والطقس البارد
◆ الثبات: أكثر من 10 ساعات بثبات عالٍ جداً`,
  },
  {
    barcode: '3614274040067',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Tobacco adds smoky tobacco warmth to the SWY signature — sophisticated, daring and unisex.

◆ Scent family: Oriental spicy
◆ Key notes: Tobacco, chestnut, vanilla, lavender, spices
◆ Character: Smoky, warm, refined and modern
◆ Best for: Evening and autumn/winter
◆ Longevity: 8–9 hours with strong sillage`,
    descriptionAr: `سترونغر ويذ يو توباكو يضيف دفء التبغ الدخاني على توقيع SWY — راقٍ وجريء ومناسب للجنسين.

◆ عائلة العطر: شرقي متبل
◆ النوتات الرئيسية: تبغ وكستناء وفانيليا ولافندر وتوابل
◆ الطابع: دخاني ودافئ وراقٍ وعصري
◆ الأنسب لـ: المساء والخريف والشتاء
◆ الثبات: 8–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273762120',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Amber is a luminous amber fougère with lavender, bourbon vanilla and golden warmth for all genders.

◆ Scent family: Amber fougère
◆ Key notes: Lavender, amber, bourbon vanilla, chestnut, spices
◆ Character: Radiant, cozy, elegant and unisex
◆ Best for: Day to evening, versatile wear
◆ Longevity: 7–9 hours with moderate to strong projection`,
    descriptionAr: `سترونغر ويذ يو أمبر فوجير عنبري مضيء باللافندر وفانيليا بوربون ودفء ذهبي للجنسين.

◆ عائلة العطر: فوجير عنبري
◆ النوتات الرئيسية: لافندر وعنبر وفانيليا بوربون وكستناء وتوابل
◆ الطابع: مشرق ودافئ وأنيق ومناسب للجنسين
◆ الأنسب لـ: النهار والمساء والاستخدام المتعدد
◆ الثبات: 7–9 ساعات بثبات جيد`,
  },
  {
    barcode: '3614274624380',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Spices ignites the SWY line with bold spices, chestnut and vanilla for a fiery masculine statement.

◆ Scent family: Oriental spicy
◆ Key notes: Spices, chestnut, vanilla, lavender, amber
◆ Character: Bold, warm, spicy and addictive
◆ Best for: Evening and cooler seasons
◆ Longevity: 8–10 hours with strong sillage`,
    descriptionAr: `سترونغر ويذ يو سبايسز يشعل خط SWY بتوابل جريئة وكستناء وفانيليا لإطلالة رجالية نارية.

◆ عائلة العطر: شرقي متبل
◆ النوتات الرئيسية: توابل وكستناء وفانيليا ولافندر وعنبر
◆ الطابع: جريء ودافئ ومتبل ومُدمن
◆ الأنسب لـ: المساء والفصول الباردة
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614274752717',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Power of You is a vibrant feminine floriental celebrating confident femininity with passion fruit, florals and warm vanilla.

◆ Scent family: Floral fruity oriental
◆ Key notes: Passion fruit, florals, vanilla, musk
◆ Character: Joyful, radiant, feminine and empowering
◆ Best for: Day wear, spring/summer and social occasions
◆ Longevity: 6–8 hours with moderate projection`,
    descriptionAr: `باور أوف يو عطر فلورينتال نابض يحتفي بالأنوثة الواثقة بحمض الباشن فروت وزهور وفانيليا دافئة.

◆ عائلة العطر: زهري فاكهي شرقي
◆ النوتات الرئيسية: باشن فروت وزهور وفانيليا ومسك
◆ الطابع: مبهج ومشرق وأنثوي ومُلهم
◆ الأنسب لـ: النهار والربيع والصيف والمناسبات
◆ الثبات: 6–8 ساعات بثبات متوسط`,
  },
  {
    barcode: '3614274747058',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Powerfully adds juicy cherry to the SWY signature for a bold, fruity-gourmand masculine twist.

◆ Scent family: Oriental gourmand
◆ Key notes: Cherry, chestnut, vanilla, lavender, amber
◆ Character: Powerful, sweet, warm and modern
◆ Best for: Evening and night-out wear
◆ Longevity: 8–9 hours with strong projection`,
    descriptionAr: `سترونغر ويذ يو باورفولي يضيف الكرز العصيري على توقيع SWY لمسة غورماند فاكهية رجالية جريئة.

◆ عائلة العطر: غورماند شرقي
◆ النوتات الرئيسية: كرز وكستناء وفانيليا ولافندر وعنبر
◆ الطابع: قوي وحلو ودافئ وعصري
◆ الأنسب لـ: المساء والخروج الليلي
◆ الثبات: 8–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614272225671',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `In Love With You is a romantic feminine fragrance from the You collection — vibrant rose, jasmine and modern elegance.

◆ Scent family: Floral fruity
◆ Key notes: Rose, jasmine, raspberry, vanilla, musk
◆ Character: Romantic, fresh, feminine and joyful
◆ Best for: Day wear, dates and spring
◆ Longevity: 6–8 hours with moderate sillage`,
    descriptionAr: `إن لوف ويذ يو عطر نسائي رومانسي من مجموعة يو — ورد وجاسمين وتوت وأناقة عصرية.

◆ عائلة العطر: زهري فاكهي
◆ النوتات الرئيسية: ورد وجاسمين وتوت وفانيليا ومسك
◆ الطابع: رومانسي ومنعش وأنثوي ومبهج
◆ الأنسب لـ: النهار والمواعيد والربيع
◆ الثبات: 6–8 ساعات بثبات متوسط`,
  },
  {
    barcode: '3605522041486',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Because It's You is a sparkling feminine fragrance with rose, raspberry and vanilla — joyful, romantic and irresistibly sweet.

◆ Scent family: Floral fruity gourmand
◆ Key notes: Rose, raspberry, vanilla, musk
◆ Character: Playful, sweet, feminine and uplifting
◆ Best for: Daily wear and romantic occasions
◆ Longevity: 6–7 hours with moderate projection`,
    descriptionAr: `بيكوز إتس يو عطر نسائي متألق بالورد والتوت والفانيليا — مرح ورومانسي وحلو بشكل لا يُقاوم.

◆ عائلة العطر: غورماند زهري فاكهي
◆ النوتات الرئيسية: ورد وتوت وفانيليا ومسك
◆ الطابع: مرح وحلو وأنثوي ومبهج
◆ الأنسب لـ: الاستخدام اليومي والمناسبات الرومانسية
◆ الثبات: 6–7 ساعات بثبات متوسط`,
  },
  {
    barcode: '3614273628983',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Stronger With You Only is a fresher EDT take on SWY with chestnut, vanilla and soft spice for easy daily masculinity.

◆ Scent family: Amber fougère
◆ Key notes: Chestnut, vanilla, lavender, spices
◆ Character: Lighter, fresh, approachable and warm
◆ Best for: Office, daytime and warm weather
◆ Longevity: 5–7 hours with moderate projection`,
    descriptionAr: `سترونغر ويذ يو أونلي نسخة أو دو تواليت أنعش من SWY بالكستناء والفانيليا وتوابل خفيفة للاستخدام اليومي.

◆ عائلة العطر: فوجير عنبري
◆ النوتات الرئيسية: كستناء وفانيليا ولافندر وتوابل
◆ الطابع: أخف ومنعش ودافئ وسهل الارتداء
◆ الأنسب لـ: العمل والنهار والطقس الدافئ
◆ الثبات: 5–7 ساعات بثبات متوسط`,
  },
  {
    barcode: '3605522040588',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `The original Stronger With You EDT — the iconic masculine fougère with chestnut, vanilla and warm addictive sweetness.

◆ Scent family: Amber fougère
◆ Key notes: Chestnut, vanilla, lavender, cinnamon, amber
◆ Character: Iconic, warm, sweet and universally loved
◆ Best for: Daily wear, all seasons
◆ Longevity: 6–8 hours with moderate to strong sillage`,
    descriptionAr: `سترونغر ويذ يو أو دو تواليت الأصلي — الفوجير الرجالي الأيقوني بالكستناء والفانيليا والحلاوة الدافئة المُدمنة.

◆ عائلة العطر: فوجير عنبري
◆ النوتات الرئيسية: كستناء وفانيليا ولافندر وقرفة وعنبر
◆ الطابع: أيقوني ودافئ وحلو ومحبوب عالمياً
◆ الأنسب لـ: الاستخدام اليومي وطوال العام
◆ الثبات: 6–8 ساعات بثبات جيد`,
  },
  {
    barcode: '3614272889590',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `Stronger With You Freeze is a fresh aromatic fougère with lime, ginger, lavender and bourbon vanilla for energetic daily wear.

◆ Scent family: Aromatic fougère
◆ Key notes: Lime, ginger, lavender, bourbon vanilla, chestnut
◆ Character: Icy-fresh, vibrant, sporty and modern
◆ Best for: Summer, gym and daytime freshness
◆ Longevity: 5–7 hours with moderate projection`,
    descriptionAr: `سترونغر ويذ يو فريز فوجير عطري منعش بالليمون والزنجبيل واللافندر وفانيليا بوربون للنشاط اليومي.

◆ عائلة العطر: فوجير عطري
◆ النوتات الرئيسية: ليمون وزنجبيل ولافندر وفانيليا بوربون وكستناء
◆ الطابع: منعش وبارد ونابض وعصري
◆ الأنسب لـ: الصيف والنهار والنشاط
◆ الثبات: 5–7 ساعات بثبات متوسط`,
  },

  // ── YSL Batch 1 ──
  {
    barcode: '3614274151701',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Libre Flowers & Flames is a bold floral-oriental flanker blending coco palm flower and lily with signature Libre lavender and orange blossom.

◆ Scent family: Floral oriental
◆ Key notes: Coco palm flower, lily, lavender, orange blossom, vanilla
◆ Character: Warm, radiant, sensual and couture-feminine
◆ Best for: Evening and special occasions
◆ Longevity: 8–9 hours with strong projection`,
    descriptionAr: `ليبر فلاورز آند فليمز إصدار زهري شرقي جريء يمزج زهرة نخيل جوز الهند والزنبق مع لافندر وزهر برتقال ليبر.

◆ عائلة العطر: زهري شرقي
◆ النوتات الرئيسية: زهرة نخيل جوز الهند وزنبق ولافندر وزهر برتقال وفانيليا
◆ الطابع: دافئ ومشرق وحسي وأنثوي راقٍ
◆ الأنسب لـ: المساء والمناسبات الخاصة
◆ الثبات: 8–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614272648425',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `The iconic Libre Eau de Parfum — a modern feminine contrast of lavender from Provence, Moroccan orange blossom and warm vanilla.

◆ Scent family: Floral fougère oriental
◆ Key notes: Lavender, orange blossom, jasmine, vanilla, ambergris
◆ Character: Bold, free, elegant and unmistakably Libre
◆ Best for: Day to evening signature wear
◆ Longevity: 7–9 hours with strong sillage`,
    descriptionAr: `ليبر أو دو برفوم الأيقوني — تباين أنثوي عصري بين لافندر بروفانس وزهر البرتقال المغربي والفانيليا الدافئة.

◆ عائلة العطر: فوجير زهري شرقي
◆ النوتات الرئيسية: لافندر وزهر برتقال وجاسمين وفانيليا وعنبر
◆ الطابع: جريء وحُر وأنيق ولا يُخطئ تعريف ليبر
◆ الأنسب لـ: توقيع يومي من النهار للمساء
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273924030',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Libre Absolu Platine is an ultra-concentrated Libre with amplified lavender and orange blossom in creamy vanilla and white musk.

◆ Scent family: Floral fougère oriental
◆ Key notes: Lavender, orange blossom, vanilla, white musk, amber
◆ Character: Luminous, intense, platinum-elegant and long-lasting
◆ Best for: Evening and statement wear
◆ Longevity: 9–10 hours with excellent projection`,
    descriptionAr: `ليبر أبسولو بلاتين تركيز فائق بلافندر وزهر برتقال مكثفين مع فانيليا كريمية ومسك أبيض.

◆ عائلة العطر: فوجير زهري شرقي
◆ النوتات الرئيسية: لافندر وزهر برتقال وفانيليا ومسك أبيض وعنبر
◆ الطابع: لامع ومكثف وأنيق بلاتيني وطويل الأمد
◆ الأنسب لـ: المساء والإطلالات المميزة
◆ الثبات: 9–10 ساعات بثبات ممتاز`,
  },
  {
    barcode: '3614273069557',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Libre Intense deepens the Libre signature with lavender, orange blossom, orchid and vanilla absolute for bolder sensuality.

◆ Scent family: Floral oriental
◆ Key notes: Lavender, orange blossom, orchid, vanilla absolute, amber
◆ Character: Richer, deeper, more sensual than the original
◆ Best for: Evening and cooler weather
◆ Longevity: 8–10 hours with strong sillage`,
    descriptionAr: `ليبر إنتنس يعمق توقيع ليبر باللافندر وزهر البرتقال والأوركيد والفانيليا المطلقة لحسية أجرأ.

◆ عائلة العطر: زهري شرقي
◆ النوتات الرئيسية: لافندر وزهر برتقال وأوركيد وفانيليا مطلقة وعنبر
◆ الطابع: أغنى وأعمق وأكثر حسية من الأصل
◆ الأنسب لـ: المساء والطقس البارد
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273776127',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Libre Le Parfum is the most concentrated Libre with saffron, lavender, orange blossom and vanilla orchid for luxurious evenings.

◆ Scent family: Floral oriental
◆ Key notes: Saffron, lavender, orange blossom, vanilla orchid, amber
◆ Character: Opulent, enveloping and haute-couture feminine
◆ Best for: Formal evenings and winter
◆ Longevity: 10+ hours with powerful projection`,
    descriptionAr: `ليبر لو بارفوم هو أكثر تركيزات ليبر بالزعفران واللافندر وزهر البرتقال وأوركيد الفانيليا للأمسيات الفاخرة.

◆ عائلة العطر: زهري شرقي
◆ النوتات الرئيسية: زعفران ولافندر وزهر برتقال وأوركيد فانيليا وعنبر
◆ الطابع: فخم وغني وأنثوي راقٍ
◆ الأنسب لـ: الأمسيات الرسمية والشتاء
◆ الثبات: أكثر من 10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614274241006',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Libre L'Eau Nue is an alcohol-free Libre with green mandarin, bergamot and the signature floral Libre accord — soft and skin-friendly.

◆ Scent family: Floral citrus
◆ Key notes: Green mandarin, bergamot, lavender, orange blossom, musk
◆ Character: Soft, clean, modern and alcohol-free
◆ Best for: Sensitive skin, office and daily wear
◆ Longevity: 4–6 hours with intimate sillage`,
    descriptionAr: `ليبر لو نو تفسير ليبر خالٍ من الكحول باليوسفي الأخضر والبرغموت والتوقيع الزهري اللطيف على البشرة.

◆ عائلة العطر: زهري حمضي
◆ النوتات الرئيسية: يوسفي أخضر وبرغموت ولافندر وزهر برتقال ومسك
◆ الطابع: ناعم ونظيف وعصري وبدون كحول
◆ الأنسب لـ: البشرة الحساسة والعمل والاستخدام اليومي
◆ الثبات: 4–6 ساعات بثبات قريب`,
  },
  {
    barcode: '3614274521238',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Libre Berry Crush is a playful fruity-floral Libre with crushed berries over lavender and orange blossom.

◆ Scent family: Fruity floral
◆ Key notes: Berries, lavender, orange blossom, vanilla, musk
◆ Character: Juicy, playful, feminine and vibrant
◆ Best for: Day wear, spring and casual outings
◆ Longevity: 6–8 hours with moderate projection`,
    descriptionAr: `ليبر بيري كراش إصدار فاكهي زهري مرح بنفحات التوت فوق اللافندر وزهر البرتقال.

◆ عائلة العطر: زهري فاكهي
◆ النوتات الرئيسية: توت ولافندر وزهر برتقال وفانيليا ومسك
◆ الطابع: عصيري ومرح وأنثوي ونابض
◆ الأنسب لـ: النهار والربيع والخروجات اليومية
◆ الثبات: 6–8 ساعات بثبات متوسط`,
  },
  {
    barcode: '3614274114645',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `MYSLF Le Parfum is the richest MYSLF expression with black pepper, orange blossom, patchouli, bourbon vanilla and woods.

◆ Scent family: Woody oriental
◆ Key notes: Black pepper, orange blossom, patchouli, bourbon vanilla, amber, woods
◆ Character: Refined, deep, sensual and modern masculine
◆ Best for: Evening and formal occasions
◆ Longevity: 9–10 hours with strong projection`,
    descriptionAr: `ماي سيلف لو بارفوم هو أغنى تعبير لماي سيلف بالفلفل الأسود وزهر البرتقال والباتشولي وفانيليا بوربون والأخشاب.

◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: فلفل أسود وزهر برتقال وباتشولي وفانيليا بوربون وعنبر وأخشاب
◆ الطابع: راقٍ وعميق وحسي ورجولي عصري
◆ الأنسب لـ: المساء والمناسبات الرسمية
◆ الثبات: 9–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273852814',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `MYSLF Eau de Parfum celebrates modern self-expression with orange blossom, patchouli and warm woods.

◆ Scent family: Woody floral
◆ Key notes: Orange blossom, patchouli, woods, vanilla, musk
◆ Character: Clean, confident, contemporary and elegant
◆ Best for: Daily wear and all seasons
◆ Longevity: 7–9 hours with moderate to strong sillage`,
    descriptionAr: `ماي سيلف أو دو برفوم يحتفي بالتعبير عن الذات بزهر البرتقال والباتشولي والأخشاب الدافئة.

◆ عائلة العطر: زهري خشبي
◆ النوتات الرئيسية: زهر برتقال وباتشولي وأخشاب وفانيليا ومسك
◆ الطابع: نظيف وواثق وعصري وأنيق
◆ الأنسب لـ: الاستخدام اليومي وطوال العام
◆ الثبات: 7–9 ساعات بثبات جيد`,
  },
  {
    barcode: '3614274329384',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `MYSLF L'Absolu Parfum intensifies the line with ginger, orange blossom and rich woods for a bolder masculine statement.

◆ Scent family: Woody oriental
◆ Key notes: Ginger, orange blossom, patchouli, woods, vanilla
◆ Character: Bolder, warmer, more sensual MYSLF
◆ Best for: Evening and colder seasons
◆ Longevity: 9–10 hours with strong sillage`,
    descriptionAr: `ماي سيلف لابسولو بارفوم يكثف الخط بالزنجبيل وزهر البرتقال والأخشاب الغنية لتعبير رجولي أجرأ.

◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: زنجبيل وزهر برتقال وباتشولي وأخشاب وفانيليا
◆ الطابع: أجرأ وأدفأ وأكثر حسية
◆ الأنسب لـ: المساء والفصول الباردة
◆ الثبات: 9–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614274184785',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNiche: true }),
    descriptionEn: `Le Vestiaire Tuxedo is a unisex haute parfumerie masterpiece with sharp patchouli, black pepper and magnetic amber.

◆ Collection: Le Vestiaire des Parfums
◆ Scent family: Woody spicy
◆ Key notes: Patchouli, black pepper, amber, coriander, rose
◆ Character: Sharp, elegant, androgynous and couture
◆ Best for: Evening and collectors
◆ Longevity: 8–10 hours with strong projection`,
    descriptionAr: `توكسيدو من لو فستيير دو بارفوم تحفة هوت بارفومري للجنسين بباتشولي حاد وفلفل أسود وعنبر مغناطيسي.

◆ المجموعة: لو فستيير دو بارفوم
◆ عائلة العطر: خشبي متبل
◆ النوتات الرئيسية: باتشولي وفلفل أسود وعنبر وكزبرة وورد
◆ الطابع: حاد وأنيق ومندمج وراقٍ
◆ الأنسب لـ: المساء والهواة والجامعين
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614274184792',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNiche: true, isNew: true }),
    isNew: true,
    descriptionEn: `Babycat Raw Bourbon is a powerful unisex oriental woody with pepper, saffron, olibanum, vanilla, suede and cedarwood.

◆ Collection: Le Vestiaire des Parfums
◆ Scent family: Oriental woody
◆ Key notes: Pink pepper, black pepper, saffron, olibanum, vanilla, suede, cedarwood
◆ Character: Bold, smoky, luxurious and animalic
◆ Best for: Evening, winter and niche lovers
◆ Longevity: 9–11 hours with excellent sillage`,
    descriptionAr: `بيبي كات رو باوربون عطر شرقي خشبي قوي للجنسين بفلفل وزعفران ولبان وفانيليا وجلد وخشب أرز.

◆ المجموعة: لو فستيير دو بارفوم
◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: فلفل وزعفران ولبان وفانيليا وجلد وأرز
◆ الطابع: جريء ودخاني وفاخر وحيواني
◆ الأنسب لـ: المساء والشتاء وعشاق النيش
◆ الثبات: 9–11 ساعة بثبات ممتاز`,
  },
  {
    barcode: '3614273683401',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Y Eau de Toilette opens with fresh ginger, sage and juniper over crisp apple and tonka bean for versatile daily masculinity.

◆ Scent family: Aromatic fougère
◆ Key notes: Ginger, sage, juniper berries, apple, tonka bean
◆ Character: Bright, fresh, modern and easy to wear
◆ Best for: Office, daytime and warm weather
◆ Longevity: 5–7 hours with moderate projection`,
    descriptionAr: `واي أو دو تواليت يفتتح بزنجبيل منعش وميرمية وتوت عرعر مع تفاحة مقرمشة وفول التونكا لرجولة يومية متعددة.

◆ عائلة العطر: فوجير عطري
◆ النوتات الرئيسية: زنجبيل وميرمية وتوت عرعر وتفاح وفول التونكا
◆ الطابع: مشرق ومنعش وعصري وسهل الارتداء
◆ الأنسب لـ: العمل والنهار والطقس الدافئ
◆ الثبات: 5–7 ساعات بثبات متوسط`,
  },
  {
    barcode: '3614273898478',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Y Eau de Parfum Intense amplifies the Y signature with lavender, ginger, juniper and apple on a deeper woody-amber base.

◆ Scent family: Aromatic woody
◆ Key notes: Lavender, ginger, juniper, apple, tonka bean, woods, amber
◆ Character: Stronger, richer and more sophisticated than EDT
◆ Best for: Day to night, all seasons
◆ Longevity: 8–9 hours with strong sillage`,
    descriptionAr: `واي أو دو برفوم إنتنس يعزز توقيع واي باللافندر والزنجبيل والعرعر والتفاح على قاعدة خشبية عنبرية أعمق.

◆ عائلة العطر: عطري خشبي
◆ النوتات الرئيسية: لافندر وزنجبيل وعرعر وتفاح وفول التونكا وأخشاب وعنبر
◆ الطابع: أقوى وأغنى وأكثر رقياً من أو دو تواليت
◆ الأنسب لـ: النهار والمساء وطوال العام
◆ الثبات: 8–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614272050358',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `The signature Y Eau de Parfum blends lavender, ginger, apple and woody-amber notes for fresh yet sophisticated masculinity.

◆ Scent family: Aromatic fougère
◆ Key notes: Ginger, bergamot, sage, apple, tonka bean, amber, cedar
◆ Character: Fresh, elegant, versatile and modern
◆ Best for: Daily signature wear
◆ Longevity: 7–8 hours with moderate to strong projection`,
    descriptionAr: `واي أو دو برفوم يمزج اللافندر والزنجبيل والتفاح ونفحات خشبية عنبرية لرجولة منعشة وراقية.

◆ عائلة العطر: فوجير عطري
◆ النوتات الرئيسية: زنجبيل وبرغموت وميرمية وتفاح وفول التونكا وعنبر وأرز
◆ الطابع: منعش وأنيق ومتعدد الاستخدامات وعصري
◆ الأنسب لـ: التوقيع اليومي
◆ الثبات: 7–8 ساعات بثبات جيد`,
  },
  {
    barcode: '3614274266801',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `Y Le Parfum is the most concentrated Y with intensified lavender, ginger and deep woody-amber accords.

◆ Scent family: Aromatic woody
◆ Key notes: Lavender, ginger, apple, tonka bean, woods, amber
◆ Character: Bold, elegant, powerfully masculine
◆ Best for: Evening and formal wear
◆ Longevity: 9–11 hours with excellent projection`,
    descriptionAr: `واي لو بارفوم هو أكثر تركيزات واي بلافندر وزنجبيل مكثفين ونفحات خشبية عنبرية عميقة.

◆ عائلة العطر: عطري خشبي
◆ النوتات الرئيسية: لافندر وزنجبيل وتفاح وفول التونكا وأخشاب وعنبر
◆ الطابع: جريء وأنيق ورجولي بقوة
◆ الأنسب لـ: المساء والمناسبات الرسمية
◆ الثبات: 9–11 ساعة بثبات ممتاز`,
  },
  {
    barcode: '3365440025578',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Opium Pour Homme is a timeless masculine classic with star anise, blackcurrant, galangal, coffee, vanilla and liquorice.

◆ Scent family: Oriental spicy
◆ Key notes: Star anise, blackcurrant, galangal, coffee, vanilla, liquorice
◆ Character: Spicy, aromatic, bold and timeless
◆ Best for: Evening and autumn/winter
◆ Longevity: 7–9 hours with strong sillage`,
    descriptionAr: `أوبيوم بور هوم كلاسيك رجالي خالد بنجمة اليانسون والكشمش الأسود والجلنغان والقهوة والفانيليا والعرقسوس.

◆ عائلة العطر: شرقي متبل
◆ النوتات الرئيسية: يانسون وكشمش أسود وجلنغان وقهوة وفانيليا وعرقسوس
◆ الطابع: متبل وعطري وجريء وخالد
◆ الأنسب لـ: المساء والخريف والشتاء
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
];
