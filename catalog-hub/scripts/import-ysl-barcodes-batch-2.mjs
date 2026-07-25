#!/usr/bin/env node
import { CATEGORIES, perfumeSubs } from '../lib/core/app-categories.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const YSL_BRAND_ID = 'b610d576-9fb9-4b21-a6a2-74e71b471474';
const LANCOME_BRAND_ID = 'bca2c344-538c-4ef1-ae91-9d12f789d8fa';
const CATEGORY_ID = CATEGORIES.perfumes;

const PRODUCTS = [
  {
    barcode: '3365440332546',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Elle Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران إيل أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `YSL Elle is a sophisticated feminine floral-chypre celebrating modern Parisian elegance and confident femininity.

◆ Scent family: Floral chypre with fruity sparkle
◆ Top notes: Lychee, peony, pink pepper
◆ Heart notes: Rose, jasmine, freesia
◆ Base notes: Patchouli, vetiver, musk
◆ Character: Chic, luminous and effortlessly elegant
◆ Best for: Day to evening, office and special occasions
◆ Longevity: 6–8 hours with moderate to strong sillage`,
    descriptionAr: `إيل من إيف سان لوران عطر زهري شيبري أنيق يحتفي بالأناقة الباريسية العصرية والأنوثة الواثقة.

◆ عائلة العطر: زهري شيبري بلمعة فاكهية
◆ المقدمة: ليتشي وبيوني وفلفل وردي
◆ القلب: ورد وجاسمين وفريزيا
◆ القاعدة: باتشولي وفيتيفر ومسك
◆ الطابع: راقٍ ومشرق وأنيق بلا مجهود
◆ الأنسب لـ: النهار والمساء والمناسبات
◆ الثبات: 6–8 ساعات بثبات جيد`,
  },
  {
    barcode: '3614272051010',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Le Vestiaire des Parfums Supreme Bouquet Eau de Parfum 125ml',
    nameAr: 'إيف سان لوران لو فستيير دو بارفوم سوبريم بوكيه أو دو برفوم 125 مل',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNiche: true }),
    descriptionEn: `Supreme Bouquet from Le Vestiaire des Parfums is a haute parfumerie masterpiece by Dominique Ropion — a lush tuberose and ylang-ylang bouquet wrapped in creamy woods.

◆ Collection: Le Vestiaire des Parfums (Haute Parfumerie)
◆ Scent family: Oriental floral
◆ Key notes: Tuberose, ylang-ylang, jasmine, patchouli, sandalwood
◆ Character: Opulent, creamy, sensual and highly refined
◆ Best for: Evening, formal events and collectors
◆ Longevity: 8+ hours with excellent projection`,
    descriptionAr: `سوبريم بوكيه من لو فستيير دو بارفوم تحفة هوت بارفومري من دومينيك روبيون — باقة فاخرة من التوبيروز واليلانغ يلانغ بأخشاب كريمية.

◆ المجموعة: لو فستيير دو بارفوم (الهوت بارفومري)
◆ عائلة العطر: زهري شرقي
◆ النوتات الرئيسية: توبيروز ويلانغ يلانغ وجاسمين وباتشولي وصندل
◆ الطابع: فخم وكريمي وحسي وراقٍ للغاية
◆ الأنسب لـ: المساء والمناسبات الرسمية والهواة
◆ الثبات: أكثر من 8 ساعات بثبات ممتاز`,
  },
  {
    barcode: '3365440003866',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Kouros Eau de Toilette 100ml',
    nameAr: 'إيف سان لوران كوروس أو دو تواليت 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `Kouros is a legendary masculine icon — a bold aromatic fougère that defined 1980s power and remains a statement of raw masculine confidence.

◆ Scent family: Aromatic fougère
◆ Top notes: Coriander, clary sage, artemisia, bergamot
◆ Heart notes: Honey, cinnamon, jasmine, carnation
◆ Base notes: Civet, leather, oakmoss, patchouli, musk, vetiver
◆ Character: Powerful, animalic, virile and unmistakable
◆ Best for: Evening, cold weather and bold personalities
◆ Longevity: 8+ hours with very strong projection`,
    descriptionAr: `كوروس أيقونة رجالية أسطورية — فوجير عطري جريء عرّف قوة الثمانينيات ويبقى بياناً عن الثقة الرجالية.

◆ عائلة العطر: فوجير عطري
◆ المقدمة: كزبرة وميرمية وأرتميسيا وبرغموت
◆ القلب: عسل وقرفة وجاسمين وقرنفل
◆ القاعدة: مسك وجلد وطحلب بلوط وباتشولي وفيتيفر
◆ الطابع: قوي وحيواني وفيريلي لا يُخطئ
◆ الأنسب لـ: المساء والطقس البارد والشخصيات الجريئة
◆ الثبات: أكثر من 8 ساعات بثبات عالٍ جداً`,
  },
  {
    barcode: '3614273863360',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Le Parfum 90ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم لو بارفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Black Opium Le Parfum is the most concentrated expression of the Black Opium universe — darker coffee, richer vanilla and deeper sensuality.

◆ Scent family: Oriental gourmand
◆ Key notes: Black coffee, vanilla absolute, jasmine sambac, orange blossom
◆ Character: Intense, addictive, glamorous and deeply sensual
◆ Best for: Evening, parties and statement nights out
◆ Longevity: 8–10 hours with powerful sillage`,
    descriptionAr: `بلاك أوبيوم لو بارفوم هو أكثر تعبيرات عالم بلاك أوبيوم تركيزاً — قهوة أغمق وفانيليا أغنى وحسية أعمق.

◆ عائلة العطر: غورماند شرقي
◆ النوتات الرئيسية: قهوة سوداء وفانيليا مطلقة وجاسمين سامباك وزهر برتقال
◆ الطابع: مكثف ومُدمن وفاخر وحسي للغاية
◆ الأنسب لـ: المساء والحفلات والخروج الليلي
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614274076202',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Eau de Parfum Over Red 90ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم أوفر ريد أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Black Opium Over Red reimagines the iconic coffee-vanilla signature with juicy cherry and red fruits for a bolder, more playful femininity.

◆ Scent family: Fruity gourmand oriental
◆ Key notes: Cherry, coffee, orange blossom, vanilla, patchouli
◆ Character: Juicy, daring, sweet and irresistibly modern
◆ Best for: Evening wear and confident night-out looks
◆ Longevity: 7–9 hours with strong projection`,
    descriptionAr: `بلاك أوبيوم أوفر ريد يعيد تصور توقيع القهوة والفانيليا بنفحات كرز وفواكه حمراء لأنوثة أجرأ وأكثر مرحاً.

◆ عائلة العطر: غورماند فاكهي شرقي
◆ النوتات الرئيسية: كرز وقهوة وزهر برتقال وفانيليا وباتشولي
◆ الطابع: عصيري وجريء وحلو وعصري بشكل لا يُقاوم
◆ الأنسب لـ: المساء والإطلالات الليلية الواثقة
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614272443716',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Eau de Parfum Intense 90ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم إنتنس أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Black Opium Intense amplifies the original with deeper coffee, richer vanilla and a more enveloping floral heart.

◆ Scent family: Oriental gourmand
◆ Key notes: Blue absinthe, orange blossom, coffee, jasmine, vanilla, licorice
◆ Character: Darker, warmer and more addictive than the original
◆ Best for: Evening and colder seasons
◆ Longevity: 8+ hours with strong sillage`,
    descriptionAr: `بلاك أوبيوم إنتنس يعزز الأصل بقهوة أعمق وفانيليا أغنى وقلب زهري أكثر احتضاناً.

◆ عائلة العطر: غورماند شرقي
◆ النوتات الرئيسية: أفسنتين أزرق وزهر برتقال وقهوة وجاسمين وفانيليا وعرقسوس
◆ الطابع: أغمق وأدفأ وأكثر إدماناً من الأصل
◆ الأنسب لـ: المساء والفصول الباردة
◆ الثبات: أكثر من 8 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273258180',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Extreme Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم إكستريم أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Black Opium Extreme pushes the collection to its darkest edge with intense coffee, cacao and creamy bourbon vanilla.

◆ Scent family: Oriental gourmand
◆ Top notes: Coffee, cacao
◆ Heart notes: Jasmine sambac, orange blossom
◆ Base notes: Bourbon vanilla, patchouli
◆ Character: Ultra-bold, seductive and boundary-pushing
◆ Best for: Nightlife, winter and maximum impact
◆ Longevity: 8–10 hours with very strong projection`,
    descriptionAr: `بلاك أوبيوم إكستريم يدفع المجموعة لأقصى حدودها بقهوة مكثفة وكاكاو وفانيليا بوربون كريمية.

◆ عائلة العطر: غورماند شرقي
◆ المقدمة: قهوة وكاكاو
◆ القلب: جاسمين سامباك وزهر برتقال
◆ القاعدة: فانيليا بوربون وباتشولي
◆ الطابع: جريء للغاية ومغري ويتحدى الحدود
◆ الأنسب لـ: الحياة الليلية والشتاء والتأثير الأقصى
◆ الثبات: 8–10 ساعات بثبات عالٍ جداً`,
  },
  {
    barcode: '3614271969545',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Eau de Toilette 90ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم أو دو تواليت 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `The lighter Black Opium Eau de Toilette offers the signature coffee-vanilla glamour in a fresher, more wearable daily format.

◆ Scent family: Oriental gourmand
◆ Key notes: Pear, pink pepper, orange blossom, coffee, jasmine, vanilla, patchouli
◆ Character: Sparkling, sensual and easier to wear by day
◆ Best for: Daily wear, office and casual evenings
◆ Longevity: 4–6 hours with moderate projection`,
    descriptionAr: `نسخة أو دو تواليت الأخف من بلاك أوبيوم تقدم فخامة القهوة والفانيليا بصيغة أنعش وأسهل للاستخدام اليومي.

◆ عائلة العطر: غورماند شرقي
◆ النوتات الرئيسية: كمثرى وفلفل وردي وزهر برتقال وقهوة وجاسمين وفانيليا وباتشولي
◆ الطابع: متألق وحسي وأسهل ارتداءً نهاراً
◆ الأنسب لـ: الاستخدام اليومي والعمل والمساء الخفيف
◆ الثبات: 4–6 ساعات بثبات متوسط`,
  },
  {
    barcode: '3365440787971',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `The original Black Opium Eau de Parfum — the global icon that fused coffee, vanilla and white florals into modern feminine addiction.

◆ Scent family: Oriental gourmand
◆ Top notes: Pear, pink pepper, orange blossom
◆ Heart notes: Coffee, jasmine, bitter almond, licorice
◆ Base notes: Vanilla, patchouli, cedar, cashmere wood
◆ Character: Bold, glamorous and irresistibly addictive
◆ Best for: Evening and signature night-out wear
◆ Longevity: 7–9 hours with strong sillage`,
    descriptionAr: `بلاك أوبيوم أو دو برفوم الأصلي — الأيقونة العالمية التي جمعت القهوة والفانيليا والزهور البيضاء في إدمان أنثوي عصري.

◆ عائلة العطر: غورماند شرقي
◆ المقدمة: كمثرى وفلفل وردي وزهر برتقال
◆ القلب: قهوة وجاسمين ولوز مر وفانيليا وعرقسوس
◆ القاعدة: فانيليا وباتشولي وأرز وخشب كشمير
◆ الطابع: جريء وفاخر ومُدمن بشكل لا يُقاوم
◆ الأنسب لـ: المساء والخروج الليلي
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614272824973',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Black Opium Neon Eau de Parfum 75ml',
    nameAr: 'إيف سان لوران بلاك أوبيوم نيون أو دو برفوم 75 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Black Opium Neon electrifies the signature with dragon fruit, citrus brightness and neon-pink energy for a vibrant limited-edition twist.

◆ Scent family: Fruity floral gourmand
◆ Top notes: Dragon fruit, mandarin, citron
◆ Heart notes: Orange blossom, coffee, jasmine sambac
◆ Base notes: Vanilla, musk
◆ Character: Electric, fruity, playful and couture-edgy
◆ Best for: Parties, summer nights and bold statements
◆ Longevity: 6–8 hours with strong projection`,
    descriptionAr: `بلاك أوبيوم نيون يضفي طاقة نيونية على التوقيع بفاكهة التنين وحمضيات مشرقة لإصدار محدود نابض بالحياة.

◆ عائلة العطر: غورماند زهري فاكهي
◆ المقدمة: فاكهة التنين وماندارين وليمون
◆ القلب: زهر برتقال وقهوة وجاسمين سامباك
◆ القاعدة: فانيليا ومسك
◆ الطابع: كهربائي وفاكهي ومرح وعصري جريء
◆ الأنسب لـ: الحفلات والليالي الصيفية
◆ الثبات: 6–8 ساعات بثبات قوي`,
  },
  {
    barcode: '3605530262309',
    brandId: LANCOME_BRAND_ID,
    nameEn: 'Lancôme Magie Noire Eau de Toilette 75ml',
    nameAr: 'لانكوم ماجي نوار أو دو تواليت 75 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Magie Noire is a timeless Lancôme classic — a mysterious chypre-floral with dark woods, incense and an enchanting feminine aura.

◆ Scent family: Chypre floral
◆ Key notes: Galbanum, hyacinth, rose, jasmine, patchouli, amber, musk
◆ Character: Mysterious, elegant, slightly dark and sophisticated
◆ Best for: Evening, autumn and formal occasions
◆ Longevity: 6–8 hours with moderate to strong sillage`,
    descriptionAr: `ماجي نوار كلاسيك خالد من لانكوم — شيبري زهري غامض بأخشاب داكنة وبخور وهالة أنثوية ساحرة.

◆ عائلة العطر: شيبري زهري
◆ النوتات الرئيسية: جالبانوم وزنبق وورد وجاسمين وباتشولي وعنبر ومسك
◆ الطابع: غامض وأنيق ومظلم قليلاً وراقٍ
◆ الأنسب لـ: المساء والخريف والمناسبات الرسمية
◆ الثبات: 6–8 ساعات بثبات جيد`,
  },
  {
    barcode: '3614272491359',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Mon Paris Floral Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران مون باريس فلورال أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Mon Paris Floral is a luminous floral flanker celebrating the romance of Paris with fresh peony, rose and sparkling fruit accords.

◆ Scent family: Floral fruity chypre
◆ Key notes: Raspberry, pear, peony, rose, patchouli, white musk
◆ Character: Romantic, fresh, feminine and joyfully Parisian
◆ Best for: Day wear, dates and spring/summer
◆ Longevity: 6–8 hours with moderate projection`,
    descriptionAr: `مون باريس فلورال إصدار زهري مشرق يحتفي برومانسية باريس ببيوني وورد وفواكه متألقة.

◆ عائلة العطر: شيبري زهري فاكهي
◆ النوتات الرئيسية: توت وكمثرى وبيوني وورد وباتشولي ومسك أبيض
◆ الطابع: رومانسي ومنعش وأنثوي وباريسي مبهج
◆ الأنسب لـ: النهار والمواعيد والربيع والصيف
◆ الثبات: 6–8 ساعات بثبات متوسط`,
  },
  {
    barcode: '3365440037106',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Nu Eau de Parfum 80ml',
    nameAr: 'إيف سان لوران نو أو دو برفوم 80 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Nu is a sensual skin-scent masterpiece — a warm oriental blend of bergamot, jasmine, vanilla and musk that feels intimate and luxurious.

◆ Scent family: Oriental woody
◆ Key notes: Bergamot, jasmine, vanilla, amber, musk, vetiver
◆ Character: Sensual, warm, skin-like and understatedly luxurious
◆ Best for: Evening and intimate occasions
◆ Longevity: 7–9 hours with moderate sillage`,
    descriptionAr: `نو تحفة عطرية حسية قريبة من البشرة — مزيج شرقي دافئ من برغموت وجاسمين وفانيليا ومسك فاخر وحميم.

◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: برغموت وجاسمين وفانيليا وعنبر ومسك وفيتيفر
◆ الطابع: حسي ودافئ وقريب من البشرة وفاخر ببساطة
◆ الأنسب لـ: المساء والمناسبات الحميمة
◆ الثبات: 7–9 ساعات بثبات متوسط`,
  },
  {
    barcode: '3365440037281',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Le Vestiaire des Parfums M7 Oud Absolu Eau de Toilette 80ml',
    nameAr: 'إيف سان لوران لو فستيير دو بارفوم إم 7 عود أبسولو أو دو تواليت 80 مل',
    subcategoryIds: perfumeSubs({ isUnisex: true, isNiche: true }),
    descriptionEn: `M7 Oud Absolu from Le Vestiaire des Parfums is a refined oud composition — smoky, resinous and elegantly masculine with a unisex appeal.

◆ Collection: Le Vestiaire des Parfums (Haute Parfumerie)
◆ Scent family: Woody oriental
◆ Key notes: Oud, myrrh, patchouli, amber, vetiver, mandarin
◆ Character: Smoky, resinous, sophisticated and bold
◆ Best for: Evening, formal wear and oud lovers
◆ Longevity: 7–9 hours with strong projection`,
    descriptionAr: `إم 7 عود أبسولو من لو فستيير دو بارفوم تركيبة عود راقية — دخانية وصمغية وأنيقة بجاذبية للجنسين.

◆ المجموعة: لو فستيير دو بارفوم (الهوت بارفومري)
◆ عائلة العطر: شرقي خشبي
◆ النوتات الرئيسية: عود ومر وباتشولي وعنبر وفيتيفر وماندرين
◆ الطابع: دخاني وصمغي وراقٍ وجريء
◆ الأنسب لـ: المساء والمناسبات الرسمية وعشاق العود
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614273668743',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent L\'Homme Eau de Parfum 100ml',
    nameAr: 'إيف سان لوران لوم أو دو برفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `L'Homme Eau de Parfum elevates the modern masculine signature with ginger, violet leaf, cedarwood and a refined woody-amber base.

◆ Scent family: Woody aromatic
◆ Key notes: Ginger, bergamot, violet leaf, basil, cedarwood, vetiver, tonka bean
◆ Character: Clean, confident, elegant and effortlessly modern
◆ Best for: Day to night, office and versatile wear
◆ Longevity: 7–9 hours with moderate to strong sillage`,
    descriptionAr: `لوم أو دو برفوم يرفع التوقيع الرجالي العصري بزنجبيل وأوراق بنفسج وأرز وقاعدة خشبية عنبرية راقية.

◆ عائلة العطر: عطري خشبي
◆ النوتات الرئيسية: زنجبيل وبرغموت وبنفسج وريحان وأرز وفيتيفر وفول التونكا
◆ الطابع: نظيف وواثق وأنيق وعصري بلا مجهود
◆ الأنسب لـ: النهار والمساء والعمل
◆ الثبات: 7–9 ساعات بثبات جيد`,
  },
  {
    barcode: '3614272648333',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent La Nuit de L\'Homme Eau de Parfum 100ml',
    nameAr: 'إيف سان لوران لا نوي دي لوم أو دو برفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `La Nuit de L'Homme EDP intensifies the seductive night signature with cardamom, lavender, sandalwood and deeper woody warmth.

◆ Scent family: Woody floral musk
◆ Top notes: Grapefruit, cardamom
◆ Heart notes: Lavender, clary sage
◆ Base notes: Sandalwood, patchouli, vetiver
◆ Character: Sensual, aromatic, seductive and refined
◆ Best for: Evening, dates and cooler weather
◆ Longevity: 7–9 hours with strong projection`,
    descriptionAr: `لا نوي دي لوم أو دو برفوم يكثف توقيع الإغواء الليلي بهيل ولافندر وصندل ودفء خشبي أعمق.

◆ عائلة العطر: خشبي زهري مسكي
◆ المقدمة: جريب فروت وهيل
◆ القلب: لافندر وميرمية
◆ القاعدة: صندل وباتشولي وفيتيفر
◆ الطابع: حسي وعطري ومغري وراقٍ
◆ الأنسب لـ: المساء والمواعيد والطقس البارد
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3365440316560',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent L\'Homme Eau de Toilette 100ml',
    nameAr: 'إيف سان لوران لوم أو دو تواليت 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men' }),
    descriptionEn: `The original L'Homme Eau de Toilette is a fresh ginger-laced masculine classic with violet leaf, cedar and tonka bean.

◆ Scent family: Woody aromatic
◆ Key notes: Ginger, bergamot, violet leaf, white pepper, cedarwood, vetiver, tonka bean
◆ Character: Fresh, clean, modern and universally appealing
◆ Best for: Daily wear, office and warm weather
◆ Longevity: 5–7 hours with moderate projection`,
    descriptionAr: `لوم أو دو تواليت الأصلي كلاسيك رجالي منعش بالزنجبيل وأوراق البنفسج والأرز وفول التونكا.

◆ عائلة العطر: عطري خشبي
◆ النوتات الرئيسية: زنجبيل وبرغموت وبنفسج وفلفل أبيض وأرز وفيتيفر وفول التونكا
◆ الطابع: منعش ونظيف وعصري وجذاب للجميع
◆ الأنسب لـ: الاستخدام اليومي والعمل والطقس الدافئ
◆ الثبات: 5–7 ساعات بثبات متوسط`,
  },
  {
    barcode: '3614272890626',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent L\'Homme Le Parfum 100ml',
    nameAr: 'إيف سان لوران لوم لو بارفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `L'Homme Le Parfum is the richest L'Homme concentration — deeper woods, refined spices and lasting masculine elegance.

◆ Scent family: Woody aromatic
◆ Key notes: Ginger, bergamot, violet leaf, cedarwood, vetiver, tonka bean, benzoin
◆ Character: Sophisticated, warm, long-lasting and polished
◆ Best for: Evening and formal occasions
◆ Longevity: 8–10 hours with strong sillage`,
    descriptionAr: `لوم لو بارفوم هو أكثر تركيزات لوم غنى — أخشاب أعمق وتوابل راقية وأناقة رجالية تدوم.

◆ عائلة العطر: عطري خشبي
◆ النوتات الرئيسية: زنجبيل وبرغموت وبنفسج وأرز وفيتيفر وفول التونكا وبنزوين
◆ الطابع: راقٍ ودافئ وطويل الأمد ومصقول
◆ الأنسب لـ: المساء والمناسبات الرسمية
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
  {
    barcode: '3614271990013',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent L\'Homme Cologne Bleue Eau de Toilette 100ml',
    nameAr: 'إيف سان لوران لوم كولون بلو أو دو تواليت 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `L'Homme Cologne Bleue is a vibrant aquatic-aromatic twist on L'Homme with marine freshness, ginger and crisp woods.

◆ Scent family: Aromatic aquatic
◆ Key notes: Ginger, bergamot, marine notes, violet leaf, cedarwood, vetiver
◆ Character: Fresh, aquatic, energetic and modern
◆ Best for: Summer, daytime and active lifestyles
◆ Longevity: 4–6 hours with moderate projection`,
    descriptionAr: `لوم كولون بلو إصدار مائي عطري نابض من لوم بانتعاش بحري وزنجبيل وأخشاب مقرمشة.

◆ عائلة العطر: عطري مائي
◆ النوتات الرئيسية: زنجبيل وبرغموت ونوتات بحرية وبنفسج وأرز وفيتيفر
◆ الطابع: منعش ومائي ونشيط وعصري
◆ الأنسب لـ: الصيف والنهار ونمط الحياة النشط
◆ الثبات: 4–6 ساعات بثبات متوسط`,
  },
  {
    barcode: '3365440621053',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent La Nuit de L\'Homme Le Parfum 100ml',
    nameAr: 'إيف سان لوران لا نوي دي لوم لو بارفوم 100 مل',
    subcategoryIds: perfumeSubs({ gender: 'men', isNew: true }),
    isNew: true,
    descriptionEn: `La Nuit de L'Homme Le Parfum is the deepest night concentration — cardamom, lavender and rich woods for maximum seductive impact.

◆ Scent family: Woody aromatic
◆ Key notes: Cardamom, lavender, cedarwood, vetiver, coumarin, tonka bean
◆ Character: Dark, seductive, intense and unmistakably masculine
◆ Best for: Evening, winter and special nights
◆ Longevity: 8–10 hours with very strong projection`,
    descriptionAr: `لا نوي دي لوم لو بارفوم هو أعمق تركيز ليلي — هيل ولافندر وأخشاب غنية لأقصى تأثير إغوائي.

◆ عائلة العطر: عطري خشبي
◆ النوتات الرئيسية: هيل ولافندر وأرز وفيتيفر وكومارين وفول التونكا
◆ الطابع: داكن ومغري ومكثف ورجولي بلا شك
◆ الأنسب لـ: المساء والشتاء والليالي المميزة
◆ الثبات: 8–10 ساعات بثبات عالٍ جداً`,
  },
  {
    barcode: '3614270561634',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Mon Paris Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران مون باريس أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women' }),
    descriptionEn: `Mon Paris is the fragrance of amour fou — a sparkling chypre-floral with strawberry, raspberry, peony and patchouli.

◆ Scent family: Floral fruity chypre
◆ Top notes: Strawberry, raspberry, pear, bergamot
◆ Heart notes: Datura flower, peony, jasmine, orange blossom
◆ Base notes: Patchouli, white musk, ambroxan
◆ Character: Romantic, sparkling, feminine and addictive
◆ Best for: Dates, spring and signature daily wear
◆ Longevity: 7–9 hours with strong sillage`,
    descriptionAr: `مون باريس عطر الحب الجنوني — شيبري زهري فاكهي متألق بالفراولة والتوت والبيوني والباتشولي.

◆ عائلة العطر: شيبري زهري فاكهي
◆ المقدمة: فراولة وتوت وكمثرى وبرغموت
◆ القلب: زهرة داتورا وبيوني وجاسمين وزهر برتقال
◆ القاعدة: باتشولي ومسك أبيض وأمبروكسان
◆ الطابع: رومانسي ومتألق وأنثوي ومُدمن
◆ الأنسب لـ: المواعيد والربيع والاستخدام اليومي
◆ الثبات: 7–9 ساعات بثبات قوي`,
  },
  {
    barcode: '3614272899711',
    brandId: YSL_BRAND_ID,
    nameEn: 'Yves Saint Laurent Mon Paris Intensément Eau de Parfum 90ml',
    nameAr: 'إيف سان لوران مون باريس إنتنسمان أو دو برفوم 90 مل',
    subcategoryIds: perfumeSubs({ gender: 'women', isNew: true }),
    isNew: true,
    descriptionEn: `Mon Paris Intensément deepens the love story with raspberry, rose, jasmine and creamy vanilla for a richer romantic signature.

◆ Scent family: Floral fruity chypre
◆ Key notes: Raspberry, rose, jasmine, orange blossom, patchouli, vanilla
◆ Character: Sweeter, deeper and more enveloping than the original
◆ Best for: Evening, romantic occasions and colder seasons
◆ Longevity: 8–10 hours with strong projection`,
    descriptionAr: `مون باريس إنتنسمان يعمق قصة الحب بتوت وورد وجاسمين وفانيليا كريمية لتوقيع رومانسي أغنى.

◆ عائلة العطر: شيبري زهري فاكهي
◆ النوتات الرئيسية: توت وورد وجاسمين وزهر برتقال وباتشولي وفانيليا
◆ الطابع: أحلى وأعمق وأكثر احتضاناً من الأصل
◆ الأنسب لـ: المساء والمناسبات الرومانسية والفصول الباردة
◆ الثبات: 8–10 ساعات بثبات قوي`,
  },
];

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || json?.message || res.statusText);
  return json?.data ?? json;
}

async function main() {
  const token = (await api('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })).accessToken;
  let ok = 0;
  for (const p of PRODUCTS) {
    const payload = {
      sku: p.barcode,
      barcode: p.barcode,
      name: p.nameAr,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      slug: slugify(p.nameEn),
      brandId: p.brandId,
      categoryId: CATEGORY_ID,
      subcategoryIds: [...new Set(p.subcategoryIds)],
      description: p.descriptionAr,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      ingredients: '',
      howToUse: '',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      stock: 0,
      isActive: true,
      isNew: !!p.isNew,
      imageIds: [],
    };
    try {
      const created = await api('/products', { method: 'POST', token, body: payload });
      ok += 1;
      console.log(`OK ${p.barcode} -> ${created.id}`);
    } catch (err) {
      console.error(`FAIL ${p.barcode}: ${err.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${PRODUCTS.length}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
