#!/usr/bin/env node
/**
 * Manually reviewed fixes for short / unclear product names.
 * Each entry verified against POS, store lookup, and barcode research.
 *
 * Usage: node scripts/repair-care-short-names-one-by-one.mjs
 * Env: START=1 LIMIT=0 DELAY_MS=1200 BARCODES=optional,comma,separated
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARE_CATEGORY_ID, CARE_SUB_SLUGS, CARE_TERTIARY_SLUGS } from '../lib/core/care-category-map.js';
import { api, getToken } from '../lib/core/api-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(__dirname, '../data/care-batch-large-repair-state.json');
const OUT = path.join(__dirname, '../data/care-batch-large-products.json');
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const START = Math.max(1, Number(process.env.START || 1));
const LIMIT = Number(process.env.LIMIT || 0);
const ONLY = (process.env.BARCODES || '').split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

/** @type {Array<object>} */
const FIXES = [
  {
    barcode: '8809305993831',
    brandEn: 'Secret Key', brandAr: 'سيكريت كي',
    nameEn: 'Secret Key Snow White Spot Gel 65g',
    nameAr: 'سيكريت كي جل سنو وايت للبقع 65 جم',
    typeKey: 'cream', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Secret Key Snow White Spot Gel targets dark spots for a brighter-looking complexion.',
    introAr: 'جل سيكريت كي سنو وايت يستهدف البقع لمظهر أكثر إشراقاً وتجانساً.',
  },
  {
    barcode: '4005800194849',
    brandEn: 'Eucerin', brandAr: 'يوسيرين',
    nameEn: 'Eucerin pH5 Washlotion Refill 400ml',
    nameAr: 'يوسيرين لوشن غسول pH5 للبشرة الحساسة 400 مل',
    typeKey: 'body-wash', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-cleansers'],
    introEn: 'Eucerin pH5 Washlotion gently cleanses dry and sensitive skin without drying it out.',
    introAr: 'لوشن غسول يوسيرين pH5 ينظف البشرة الجافة والحساسة بلطف دون جفاف.',
  },
  {
    barcode: '733739076847',
    brandEn: 'Now Foods', brandAr: 'ناو فودز',
    nameEn: 'Now Foods Solutions Organic Vegetable Glycerin 237ml',
    nameAr: 'ناو فودز جلسرين نباتي عضوي 237 مل',
    typeKey: 'moisturizer', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Now Foods Organic Vegetable Glycerin helps soften and hydrate skin and hair.',
    introAr: 'جلسرين ناو فودز النباتي العضوي يرطب ويلين البشرة والشعر.',
  },
  {
    barcode: '733739081902',
    brandEn: 'Now Foods', brandAr: 'ناو فودز',
    nameEn: 'Now Foods Solutions Red Clay Powder Moroccan 170g',
    nameAr: 'ناو فودز بودرة طين أحمر مغربي 170 جم',
    typeKey: 'face-mask', sub: ['care-face-care'], tert: ['care-face-care-face-masks'],
    introEn: 'Now Foods Moroccan Red Clay Powder is used for purifying face and body masks.',
    introAr: 'بودرة الطين الأحمر المغربي من ناو فودز تُستخدم في أقنعة تنقية للوجه والجسم.',
  },
  {
    barcode: '5012251013390',
    brandEn: 'Beauty Formulas', brandAr: 'بيوتي فورميولاز',
    nameEn: 'Beauty Formulas Brightening Vitamin C Facial Tonic 150ml',
    nameAr: 'بيوتي فورميولاز تونر مضيء بفيتامين سي 150 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Beauty Formulas Vitamin C Facial Tonic refreshes skin and supports a brighter tone.',
    introAr: 'تونر بيوتي فورميولاز بفيتامين سي ينعش البشرة ويدعم مظهراً أكثر إشراقاً.',
  },
  {
    barcode: '8859690411328',
    brandEn: 'YC', brandAr: 'واي سي',
    nameEn: 'YC Alpha Arbutin Whitening Bath Salt',
    nameAr: 'واي سي ملح استحمام للتفتيح بالأربوتين',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'YC Alpha Arbutin Bath Salt supports a brighter, more even-looking body tone.',
    introAr: 'ملح الاستحمام واي سي بالأربوتين يدعم مظهراً أفتح وأكثر تجانساً للجسم.',
  },
  {
    barcode: '8859690400346',
    brandEn: 'YC', brandAr: 'واي سي',
    nameEn: 'YC Alpha Arbutin Whitening Capsule Cream',
    nameAr: 'واي سي كريم تفتيح بالأربوتين (كبسولات)',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'YC Alpha Arbutin Capsule Cream helps brighten skin and improve tone clarity.',
    introAr: 'كريم واي سي بالأربوتين يساعد على تفتيح البشرة وتحسين وضوح اللون.',
  },
  {
    barcode: '3760074270279',
    brandEn: 'Floxia', brandAr: 'فلوكسيا',
    nameEn: 'Floxia Deodorant Anti-Odor Roll-On 15ml',
    nameAr: 'فلوكسيا مزيل عرق رول أون مضاد للرائحة 15 مل',
    typeKey: 'deodorant', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-deodorant'],
    introEn: 'Floxia Anti-Odor Deodorant provides long-lasting freshness and odor control.',
    introAr: 'مزيل عرق فلوكسيا مضاد للرائحة يمنح انتعاشاً يدوم وتحكماً بالرائحة.',
  },
  {
    barcode: '8886467068805',
    brandEn: 'Skincare', brandAr: 'عناية',
    nameEn: 'All-in-1 Micellar Cleansing Water 400ml',
    nameAr: 'ماء ميسيلار منظف كل في 1 للوجه والعين والشفاه 400 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'All-in-1 micellar water gently removes makeup, dirt, and impurities without rinsing.',
    introAr: 'ماء ميسيلار كل في 1 يزيل المكياج والشوائب بلطف دون الحاجة للشطف.',
  },
  {
    barcode: '8886467068799',
    brandEn: 'Skincare', brandAr: 'عناية',
    nameEn: 'All-in-1 Micellar Cleansing Water 400ml',
    nameAr: 'ماء ميسيلار منظف كل في 1 للوجه والعين والشفاه 400 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'All-in-1 micellar water gently removes makeup, dirt, and impurities without rinsing.',
    introAr: 'ماء ميسيلار كل في 1 يزيل المكياج والشوائب بلطف دون الحاجة للشطف.',
  },
  {
    barcode: '8886467068812',
    brandEn: 'Skincare', brandAr: 'عناية',
    nameEn: 'All-in-1 Micellar Cleansing Water 400ml',
    nameAr: 'ماء ميسيلار منظف كل في 1 للوجه والعين والشفاه 400 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'All-in-1 micellar water gently removes makeup, dirt, and impurities without rinsing.',
    introAr: 'ماء ميسيلار كل في 1 يزيل المكياج والشوائب بلطف دون الحاجة للشطف.',
  },
  {
    barcode: '5011451103863',
    brandEn: 'Simple', brandAr: 'سيمبل',
    nameEn: 'Simple Refreshing Facial Wash Gel 150ml',
    nameAr: 'سيمبل غسول وجه منعش بالجل 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Simple Refreshing Facial Wash Gel cleanses gently and leaves skin feeling fresh.',
    introAr: 'غسول سيمبل المنعش بالجل ينظف بلطف ويترك البشرة منتعشة.',
  },
  {
    barcode: '5011451104020',
    brandEn: 'Simple', brandAr: 'سيمبل',
    nameEn: 'Simple Age Resisting Facial Wash 150ml',
    nameAr: 'سيمبل غسول وجه مقاوم لعلامات التقدم في السن 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Simple Age Resisting Facial Wash supports smoother-looking, cared-for skin.',
    introAr: 'غسول سيمبل المقاوم لعلامات التقدم في السن يدعم بشرة أكثر نعومة وعناية.',
  },
  {
    barcode: '8710908710773',
    brandEn: 'Simple', brandAr: 'سيمبل',
    nameEn: 'Simple Micellar Facial Gel Wash 150ml',
    nameAr: 'سيمبل غسول جل ميسيلار للوجه يزيل المكياج 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Simple Micellar Gel Wash removes impurities and makeup while cleansing gently.',
    introAr: 'غسول سيمبل الجل الميسيلار يزيل الشوائب والمكياج مع تنظيف لطيف.',
  },
  {
    barcode: '8901030953941',
    brandEn: 'Simple', brandAr: 'سيمبل',
    nameEn: "Simple Protect 'N' Glow Vitamin C Facial Wash 150ml",
    nameAr: 'سيمبل غسول وجه بروتكت إن جلو بفيتامين سي 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Simple Protect N Glow Vitamin C Wash cleanses and supports a radiant glow.',
    introAr: 'غسول سيمبل بروتكت إن جلو بفيتامين سي ينظف ويدعم إشراقة البشرة.',
  },
  {
    barcode: '893689001181',
    brandEn: 'RevitaLash', brandAr: 'ريفيتالاش',
    nameEn: 'RevitaLash Advanced Eyelash Conditioner 3.5ml',
    nameAr: 'ريفيتالاش ادفانسد مُكثّف ومعزّز للرموش 3.5 مل',
    typeKey: 'eye-cream', sub: ['care-face-care'], tert: ['care-face-care-eye-care'],
    introEn: 'RevitaLash Advanced conditions lashes for a fuller, healthier-looking appearance.',
    introAr: 'ريفيتالاش ادفانسد يعزّز الرموش لمظهر أكثر كثافة وصحة.',
  },
  {
    barcode: '3350900002589',
    brandEn: 'Embryolisse', brandAr: 'أمبريوليس',
    nameEn: 'Embryolisse Moisturizing Lotion 400ml',
    nameAr: 'أمبريوليس لوشن مرطب 400 مل',
    typeKey: 'moisturizer', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Embryolisse Moisturizing Lotion hydrates and comforts skin with a light texture.',
    introAr: 'لوشن أمبريوليس المرطب يرطب ويريح البشرة بتركيبة خفيفة.',
  },
  {
    barcode: '4005800283079',
    brandEn: 'Eucerin', brandAr: 'يوسيرين',
    nameEn: 'Eucerin Hyaluron-Filler Moisture Booster Gel-Cream 200ml',
    nameAr: 'يوسيرين كريم جل مرطب Hyaluron-Filler للوجه 200 مل',
    typeKey: 'cream', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Eucerin Hyaluron-Filler Gel-Cream boosts hydration and plumps the look of skin.',
    introAr: 'كريم جل يوسيرين Hyaluron-Filler يعزّز الترطيب ويمنح البشرة مظهراً أكثر امتلاءً.',
  },
  {
    barcode: '6971764157658',
    brandEn: 'Estelin', brandAr: 'إستيلين',
    nameEn: 'Estelin AHA Facial Toner 400ml',
    nameAr: 'إستيلين تونر للوجه بأحماض AHA 400 مل',
    typeKey: 'toner', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Estelin AHA Toner exfoliates gently and preps skin for the next routine step.',
    introAr: 'تونر إستيلين بأحماض AHA يقشّر بلطف ويهيّئ البشرة للخطوة التالية.',
  },
  {
    barcode: '6971764157986',
    brandEn: 'Estelin', brandAr: 'إستيلين',
    nameEn: 'Estelin Ceramide Face Cream 200g',
    nameAr: 'إستيلين كريم وجه بالسيراميد 200 جم',
    typeKey: 'cream', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Estelin Ceramide Cream strengthens the skin barrier and delivers lasting moisture.',
    introAr: 'كريم إستيلين بالسيراميد يقوّي حاجز البشرة ويمنح ترطيباً دائماً.',
  },
  {
    barcode: '9314839019890',
    brandEn: 'QV', brandAr: 'كيو في',
    nameEn: 'QV Gentle Wash Refill 250g',
    nameAr: 'كيو في غسول لطيف للبشرة الجافة 250 جم',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'QV Gentle Wash cleanses dry and sensitive skin without stripping moisture.',
    introAr: 'غسول كيو في اللطيف ينظف البشرة الجافة والحساسة دون تجفيف.',
  },
  {
    barcode: '6929428206945',
    brandEn: 'Only', brandAr: 'أونلي',
    nameEn: 'Only Niacinamide & Hyaluronic Face Wash Cleansing Gel 150ml',
    nameAr: 'أونلي غسول جل بالنياسيناميد وحمض الهيالورونيك 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Only Niacinamide & Hyaluronic Gel Wash purifies, hydrates, and balances skin.',
    introAr: 'غسول أونلي بالنياسيناميد وحمض الهيالورونيك ينقي ويرطب ويوازن البشرة.',
  },
  {
    barcode: '6929428206952',
    brandEn: 'Only', brandAr: 'أونلي',
    nameEn: 'Only Retinol Anti-Aging Anti-Spot Face Cleanser 150ml',
    nameAr: 'أونلي غسول وجه بالريتينول مضاد لعلامات التقدم في السن والبقع 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Only Retinol Face Cleanser targets signs of aging and blemishes while cleansing.',
    introAr: 'غسول أونلي بالريتينول يستهدف علامات التقدم في السن والبقع أثناء التنظيف.',
  },
  {
    barcode: '5011451103870',
    brandEn: 'Simple', brandAr: 'سيمبل',
    nameEn: 'Simple Kind to Skin Moisturising Facial Wash 150ml',
    nameAr: 'سيمبل غسول وجه لطيف ومرطب للبشرة 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Simple Kind to Skin Facial Wash cleanses while helping maintain skin moisture.',
    introAr: 'غسول سيمبل اللطيف للبشرة ينظف مع الحفاظ على ترطيب البشرة.',
  },
  {
    barcode: '6942349743955',
    brandEn: 'Sadoer', brandAr: 'سادور',
    nameEn: 'Sadoer Refreshing Foaming Face Wash',
    nameAr: 'سادور غسول وجه منعش برغوة',
    typeKey: 'cleanser', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Sadoer Foaming Face Wash refreshes skin with a gentle daily cleanse.',
    introAr: 'غسول سادور الرغوي المنعش ينظف البشرة بلطف في الروتين اليومي.',
  },
  {
    barcode: '4005808668861',
    brandEn: 'Nivea', brandAr: 'نيفيا',
    nameEn: 'Nivea Refreshing Face Wash Gel',
    nameAr: 'نيفيا غسول وجه منعش بالجل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nivea Refreshing Face Wash Gel cleanses and leaves skin feeling fresh and comfortable.',
    introAr: 'غسول نيفيا المنعش بالجل ينظف ويترك البشرة منتعشة ومريحة.',
  },
  {
    barcode: '3600524053147',
    brandEn: "L'Oréal Paris", brandAr: 'لوريال باريس',
    nameEn: "L'Oréal Paris Hyaluron Expert Oil Control Face Wash 200ml",
    nameAr: 'لوريال باريس غسول وجه Hyaluron Expert للتحكم بالزيت 200 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: "L'Oréal Hyaluron Expert Oil Control Wash cleanses oily skin with hyaluronic care.",
    introAr: 'غسول لوريال Hyaluron Expert للتحكم بالزيت ينظف البشرة الدهنية مع ترطيب.',
  },
  {
    barcode: '3600540676627',
    brandEn: 'Garnier', brandAr: 'غارنييه',
    nameEn: 'Garnier Pure Active 3-in-1 Anti-Imperfections Wash 150ml',
    nameAr: 'غارنييه Pure Active غسول 3 في 1 مضاد للشوائب 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Garnier Pure Active 3-in-1 Wash cleanses, exfoliates, and masks in one step.',
    introAr: 'غسول غارنييه Pure Active 3 في 1 ينظف ويقشر ويعمل كقناع في خطوة واحدة.',
  },
  {
    barcode: '8809438489829',
    brandEn: 'Derma 101', brandAr: 'ديرما 101',
    nameEn: 'Derma 101 Power Brightening Serum 30ml',
    nameAr: 'ديرما 101 سيروم باور لتفتيح البشرة 30 مل',
    typeKey: 'serum', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Derma 101 Power Serum supports a brighter, more even-looking complexion.',
    introAr: 'سيروم ديرما 101 باور يدعم بشرة أكثر إشراقاً وتجانساً.',
  },
  {
    barcode: '3574661288376',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Hydro Boost Cleanser Water Gel 200ml',
    nameAr: 'نيوتروجينا جل منظف Hydro Boost 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Hydro Boost Water Gel Cleanser removes impurities without over-drying.',
    introAr: 'جل منظف نيوتروجينا Hydro Boost يزيل الشوائب دون تجفيف مفرط.',
  },
  {
    barcode: '3574661351711',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Hydro Boost City Shield SPF25 Hydrating Lotion 50ml',
    nameAr: 'نيوتروجينا لوشن مرطب Hydro Boost City Shield SPF 25 50 مل',
    typeKey: 'sunscreen', sub: ['care-derma-hub', 'care-face-care', 'care-sun-care'], tert: ['care-sun-care-sunscreen'],
    introEn: 'Neutrogena Hydro Boost City Shield hydrates while helping protect against UV rays.',
    introAr: 'لوشن نيوتروجينا Hydro Boost City Shield يرطب ويساعد على الحماية من أشعة الشمس.',
  },
  {
    barcode: '3574661287263',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Hydro Boost Water Gel 50ml',
    nameAr: 'نيوتروجينا جل مائي Hydro Boost 50 مل',
    typeKey: 'moisturizer', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Neutrogena Hydro Boost Water Gel delivers lightweight, intense hydration.',
    introAr: 'جل نيوتروجينا المائي Hydro Boost يمنح ترطيباً خفيفاً ومكثفاً.',
  },
  {
    barcode: '3574660245844',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Deep Clean Gel Wash 200ml',
    nameAr: 'نيوتروجينا غسول جل Deep Clean للتنظيف العميق 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Deep Clean Gel Wash purifies pores for a thoroughly clean feel.',
    introAr: 'غسول نيوتروجينا Deep Clean ينقِي المسام لمظهر نظيف.',
  },
  {
    barcode: '3574661529240',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Clear & Soothe Micellar Jelly Makeup Remover 200ml',
    nameAr: 'نيوتروجينا مزيل مكياج ميسيلار جلي Clear & Soothe 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Clear & Soothe Micellar Jelly gently removes makeup and soothes skin.',
    introAr: 'مزيل مكياج نيوتروجينا Clear & Soothe يزيل المكياج ويهدئ البشرة.',
  },
  {
    barcode: '3574661835570',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Fresh & Clear Vitamin C Face Wash 200ml',
    nameAr: 'نيوتروجينا غسول وجه Fresh & Clear بفيتامين سي 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Fresh & Clear Vitamin C Wash cleanses and supports clearer-looking skin.',
    introAr: 'غسول نيوتروجينا Fresh & Clear ينظف ويدعم بشرة أكثر نقاءً.',
  },
  {
    barcode: '3574660569759',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Refreshingly Clear Facial Wash 200ml',
    nameAr: 'نيوتروجينا غسول Refreshingly Clear 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Refreshingly Clear Facial Wash cleanses blemish-prone skin gently.',
    introAr: 'غسول نيوتروجينا Refreshingly Clear ينظف البشرة المعرضة للحبوب بلطف.',
  },
  {
    barcode: '3574661073224',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Oil Balancing Facial Wash 200ml',
    nameAr: 'نيوتروجينا غسول Oil Balancing للبشرة الدهنية 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Oil Balancing Wash helps control shine while cleansing oily skin.',
    introAr: 'غسول نيوتروجينا Oil Balancing يساعد على التحكم باللمعان أثناء التنظيف.',
  },
  {
    barcode: '3574661292113',
    brandEn: 'Neutrogena', brandAr: 'نيوتروجينا',
    nameEn: 'Neutrogena Visibly Clear Fine & Matte Wash 150ml',
    nameAr: 'نيوتروجينا غسول Visibly Clear Fine & Matte 150 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Neutrogena Visibly Clear Fine & Matte Wash mattifies and cleans blemish-prone skin.',
    introAr: 'غسول نيوتروجينا Visibly Clear يمنح مظهراً مطفياً وينظف البشرة المعرضة للحبوب.',
  },
  {
    barcode: '8859690409790',
    brandEn: 'YC', brandAr: 'واي سي',
    nameEn: 'YC Alpha Arbutin Whitening Body Serum',
    nameAr: 'واي سي سيروم تفتيح للجسم بالأربوتين',
    typeKey: 'serum', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'YC Alpha Arbutin Body Serum supports a brighter, more even body tone.',
    introAr: 'سيروم واي سي بالأربوتين للجسم يدعم مظهراً أفتح وأكثر تجانساً.',
  },
  {
    barcode: '4005800210617',
    brandEn: 'Eucerin', brandAr: 'يوسيرين',
    nameEn: 'Eucerin Anti-Pigment Dual Serum 30ml',
    nameAr: 'يوسيرين سيروم مزدوج مضاد للتصبغ 30 مل',
    typeKey: 'serum', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Eucerin Anti-Pigment Dual Serum targets dark spots for a more even tone.',
    introAr: 'سيروم يوسيرين المزدوج مضاد للتصبغ يستهدف البقع لمظهر أكثر تجانساً.',
  },
  {
    barcode: '4005800288296',
    brandEn: 'Eucerin', brandAr: 'يوسيرين',
    nameEn: 'Eucerin UreaRepair PLUS 10% Urea Foot Foam 150ml',
    nameAr: 'يوسيرين رغوة للقدمين UreaRepair PLUS 10% يوريا 150 مل',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'Eucerin UreaRepair Foot Foam softens very dry, rough feet with 10% urea.',
    introAr: 'رغوة يوسيرين للقدمين بنسبة 10% يوريا تلين القدم الجافة والمتشققة.',
  },
  {
    barcode: '6971764152554',
    brandEn: 'Estelin', brandAr: 'إستيلين',
    nameEn: 'Estelin Sun Protection Cream SPF 90',
    nameAr: 'إستيلين كريم واقي من الشمس SPF 90',
    typeKey: 'sunscreen', sub: ['care-face-care', 'care-sun-care'], tert: ['care-sun-care-sunscreen'],
    introEn: 'Estelin SPF 90 Sun Cream helps protect skin from intense sun exposure.',
    introAr: 'كريم إستيلين الواقي SPF 90 يساعد على حماية البشرة من التعرض الشديد للشمس.',
  },
  {
    barcode: '5902802706492',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Pure Vitamin C Serum 20% 30ml',
    nameAr: 'بيوليك سيروم فيتامين سي 20% 30 مل',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Vitamin C 20% Serum brightens and revitalizes dull-looking skin.',
    introAr: 'سيروم بيوليك بفيتامين سي 20% يضيء وينعش البشرة الباهتة.',
  },
  {
    barcode: '9314839008948',
    brandEn: 'QV', brandAr: 'كيو في',
    nameEn: 'QV Intensive Moisturising Cleanser 250g',
    nameAr: 'كيو في غسول مرطب مكثف 250 جم',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'QV Intensive Moisturising Cleanser cleanses very dry skin without irritation.',
    introAr: 'غسول كيو في المرطب المكثف ينظف البشرة شديدة الجفاف دون تهيّج.',
  },
  {
    barcode: '9314839021206',
    brandEn: 'QV', brandAr: 'كيو في',
    nameEn: 'QV Face Night Cream with Niacinamide B3 50g',
    nameAr: 'كيو في كريم ليلي للوجه بفيتامين B3 (نياسيناميد) 50 جم',
    typeKey: 'cream', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'QV Night Cream with Niacinamide B3 nourishes skin overnight.',
    introAr: 'كريم كيو في الليلي بفيتامين B3 يغذّي البشرة طوال الليل.',
  },
  {
    barcode: '3574660149807',
    brandEn: 'Beautybomb', brandAr: 'بيوتي بومب',
    nameEn: 'Beautybomb Only Matte Liquid Lipstick',
    nameAr: 'بيوتي بومب أحمر شفاه سائل مات أونلي',
    typeKey: 'lip-balm', sub: ['care-face-care'], tert: ['care-face-care-lip-care'],
    introEn: 'Beautybomb Only Matte Liquid Lipstick delivers bold matte lip color.',
    introAr: 'أحمر شفاه بيوتي بومب السائل المات أونلي يمنح لوناً جريئاً بلمسة مطفية.',
  },
  {
    barcode: '892717001162',
    brandEn: 'PFB Vanish', brandAr: 'بي إف بي فانيش',
    nameEn: 'PFB Vanish Chromabright Skin Lightening Serum 93g',
    nameAr: 'بي إف بي فانيش سيروم Chromabright لتفتيح البشرة 93 جم',
    typeKey: 'serum', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'PFB Vanish Chromabright Serum helps lighten dark areas for even-looking skin.',
    introAr: 'سيروم بي إف بي فانيش Chromabright يساعد على تفتيح المناطق الداكنة.',
  },
  {
    barcode: '6930236309889',
    brandEn: 'Rose Berry', brandAr: 'روز بيري',
    nameEn: 'Rose Berry Snow White Whitening Cream',
    nameAr: 'روز بيري كريم سنو وايت للتفتيح',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Rose Berry Snow White Cream supports a brighter, more radiant complexion.',
    introAr: 'كريم روز بيري سنو وايت يدعم بشرة أكثر إشراقاً ونضارة.',
  },
  {
    barcode: '8802547874623',
    brandEn: 'Cat Eye', brandAr: 'كات آي',
    nameEn: 'Cat Eye Double Lash Eyelash Fortifier Serum',
    nameAr: 'كات آي دابل لاش سيروم مُقوّي للرموش',
    typeKey: 'eye-cream', sub: ['care-face-care'], tert: ['care-face-care-eye-care'],
    introEn: 'Cat Eye Double Lash Serum fortifies lashes for a fuller appearance.',
    introAr: 'سيروم كات آي دابل لاش يقوّي الرموش لمظهر أكثر كثافة.',
  },
  {
    barcode: '8436575091648',
    brandEn: 'Biovene', brandAr: 'بيوفين',
    nameEn: 'Biovene Vitamins Hair & Skin Gummy Supplements',
    nameAr: 'بيوفين علكة فيتامينات للشعر والبشرة',
    typeKey: 'moisturizer', sub: ['care-hair-care'], tert: ['care-hair-care-hair-treatment'],
    introEn: 'Biovene Vitamin Gummies support hair and skin wellness from within.',
    introAr: 'علكة بيوفين بالفيتامينات تدعم صحة الشعر والبشرة من الداخل.',
  },
  {
    barcode: '6942349708909',
    brandEn: 'Fayankou', brandAr: 'فايانكو',
    nameEn: 'Fayankou Vitamin C Whitening Amino Acid Gentle Cleanser 150ml',
    nameAr: 'فايانكو غسول لطيف بالأحماض الأمينية وفيتامين سي للتفتيح 150 مل',
    typeKey: 'cleanser', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Fayankou Vitamin C Amino Acid Cleanser gently cleanses while supporting a brighter-looking tone.',
    introAr: 'غسول فايانكو بالأحماض الأمينية وفيتامين سي ينظف بلطف ويدعم مظهراً أفتح.',
  },
  {
    barcode: '6942349717284',
    brandEn: 'Fayankou', brandAr: 'فايانكو',
    nameEn: 'Fayankou Collagen Moisturizing Face Spray 150ml',
    nameAr: 'فايانكو بخاخ وجه مرطب بالكولاجين 150 مل',
    typeKey: 'moisturizer', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Fayankou Collagen Face Spray refreshes skin with lightweight moisture on the go.',
    introAr: 'بخاخ فايانكو بالكولاجين ينعش البشرة بترطيب خفيف أثناء التنقل.',
  },
  {
    barcode: '5021044025908',
    brandEn: 'Garnier', brandAr: 'غارنييه',
    nameEn: 'Garnier Pure Active Anti-Blackhead Deep Pore Wash 150ml',
    nameAr: 'غارنييه Pure Active غسول يومي للمسام ومضاد للرؤوس السوداء 150 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Garnier Pure Active Deep Pore Wash unclogs pores and helps reduce blackheads and shine.',
    introAr: 'غسول غارنييه Pure Active للمسام ينظف ويساعد على تقليل الرؤوس السوداء واللمعان.',
  },
  {
    barcode: '3350900000264',
    brandEn: 'Embryolisse', brandAr: 'أمبريوليس',
    nameEn: 'Embryolisse Foaming Cream-Milk Face & Body Cleanser 200ml',
    nameAr: 'أمبريوليس غسول كريمي رغوي للوجه والجسم 200 مل',
    typeKey: 'cleanser', sub: ['care-derma-hub', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Embryolisse Foaming Cream-Milk is a soap-free cleanser for face and body that preserves moisture.',
    introAr: 'غسول أمبريوليس الكريمي الرغوي بدون صابون ينظف الوجه والجسم مع الحفاظ على الترطيب.',
  },
  {
    barcode: '8809317118628',
    brandEn: 'Farm Stay', brandAr: 'فارم ستاي',
    nameEn: 'Farm Stay Snail Mucus Moisture Toner 150ml',
    nameAr: 'فارم ستاي تونر مرطب بإفرازات الحلزون 150 مل',
    typeKey: 'toner', sub: ['care-korean-skincare-6', 'care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Farm Stay Snail Mucus Toner hydrates with snail filtrate and hyaluronic acid after cleansing.',
    introAr: 'تونر فارم ستاي بإفرازات الحلزون يرطب بفلتر الحلزون وحمض الهيالورونيك بعد التنظيف.',
  },
  {
    barcode: '4806500238822',
    brandEn: 'Kokuryu', brandAr: 'كوكوريو',
    nameEn: 'Kokuryu Lemon Cleanser 225ml',
    nameAr: 'كوكوريو غسول بالليمون 225 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Kokuryu Lemon Cleanser refreshes and cleanses skin with a bright citrus wash.',
    introAr: 'غسول كوكوريو بالليمون ينظف وينعش البشرة بلمسة حمضية منعشة.',
  },
  {
    barcode: '4005900480392',
    brandEn: 'Eucerin', brandAr: 'يوسيرين',
    nameEn: 'Eucerin Sun Kids Spray SPF 50 200ml',
    nameAr: 'يوسيرين واقي شمس للأطفال سبراي SPF 50 200 مل',
    typeKey: 'sunscreen', sub: ['care-derma-hub', 'care-sun-care'], tert: ['care-sun-care-sunscreen'],
    introEn: 'Eucerin Sun Kids Spray SPF 50 helps protect children’s sensitive skin from UV rays.',
    introAr: 'سبراي يوسيرين واقي الشمس للأطفال SPF 50 يساعد على حماية البشرة الحساسة من الأشعة فوق البنفسجية.',
  },
  {
    barcode: '8680923355030',
    brandEn: 'Nippon', brandAr: 'نيبون',
    nameEn: 'Nippon Advanced Facial Repair & Care Cleansing Foam 160ml',
    nameAr: 'نيبون رغوة تنظيف متقدمة للإصلاح والعناية 160 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nippon Advanced Cleansing Foam deep-cleans while supporting skin repair and daily care.',
    introAr: 'رغوة نيبون المتقدمة تنظف بعمق وتدعم إصلاح البشرة والعناية اليومية.',
  },
  {
    barcode: '8680923355016',
    brandEn: 'Nippon', brandAr: 'نيبون',
    nameEn: 'Nippon Cleansing Foam with Aloe Vera 160ml',
    nameAr: 'نيبون رغوة تنظيف بالصبار 160 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nippon Aloe Vera Cleansing Foam soothes and cleanses normal to sensitive skin.',
    introAr: 'رغوة نيبون بالصبار تهدئ وتنظف البشرة العادية إلى الحساسة.',
  },
  {
    barcode: '8680923355023',
    brandEn: 'Nippon', brandAr: 'نيبون',
    nameEn: 'Nippon Cleansing Foam with Chamomile 160ml',
    nameAr: 'نيبون رغوة تنظيف بالبابونج 160 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nippon Chamomile Cleansing Foam calms skin while removing makeup and impurities.',
    introAr: 'رغوة نيبون بالبابونج تهدئ البشرة وتزيل المكياج والشوائب.',
  },
  {
    barcode: '8680923356389',
    brandEn: 'Nippon', brandAr: 'نيبون',
    nameEn: 'Nippon Gentle Cleansing Foam 200ml',
    nameAr: 'نيبون رغوة تنظيف لطيفة للوجه 200 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Nippon Gentle Cleansing Foam removes daily impurities without disturbing the skin barrier.',
    introAr: 'رغوة نيبون اللطيفة تزيل الشوائب اليومية دون الإخلال بحاجز البشرة.',
  },
  {
    barcode: '5906071023076',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Dermo Soothing and Strengthening Cream for Couperose Skin 50ml',
    nameAr: 'بيوليك ديرمو كريم مهدئ ومقوّي للبشرة ذات الشعيرات الدموية 50 مل',
    typeKey: 'cream', sub: ['care-face-care'], tert: ['care-face-care-face-moisturizer'],
    introEn: 'Bioliq Dermo Soothing Cream reduces redness and strengthens fragile capillary-prone skin.',
    introAr: 'كريم بيوليك ديرمو المهدئ يقلل الاحمرار ويقوي البشرة المعرضة لمشاكل الشعيرات الدموية.',
  },
  {
    barcode: '5906071043784',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Clean Micellar Solution for All Skin Types 200ml',
    nameAr: 'بيوليك Clean ماء ميسيلار لجميع أنواع البشرة 200 مل',
    typeKey: 'cleanser', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Bioliq Clean Micellar Solution removes makeup and impurities without rinsing.',
    introAr: 'ماء بيوليك Clean الميسيلار يزيل المكياج والشوائب دون الحاجة للشطف.',
  },
  {
    barcode: '5906071049366',
    brandEn: 'Bioliq', brandAr: 'بيوليك',
    nameEn: 'Bioliq Specialist Toning Liquid Against Skin Imperfections 200ml',
    nameAr: 'بيوليك Specialist تونر ضد عيوب البشرة 200 مل',
    typeKey: 'toner', sub: ['care-face-care'], tert: ['care-face-care-cleansers-toners'],
    introEn: 'Bioliq Specialist Toning Liquid mattifies and helps reduce blemishes and enlarged pores.',
    introAr: 'تونر بيوليك Specialist يعزز التوازن ويساعد على تقليل العيوب وتوسع المسام.',
  },
  {
    barcode: '9314839006876',
    brandEn: 'QV', brandAr: 'كيو في',
    nameEn: 'QV Heel Balm for Dry Cracked Heels 50g',
    nameAr: 'كيو في بلسم/كريم للقدمين الجافة والمتشققة 50 جم',
    typeKey: 'body-cream', sub: ['care-skin-and-body-care'], tert: ['care-skin-and-body-care-body-moisturizer'],
    introEn: 'QV Heel Balm softens very dry, cracked heels with intensive moisturising care.',
    introAr: 'بلسم كيو في للقدمين يلين الجلد الجاف والمتشقق بترطيب مكثف.',
  },
  {
    barcode: '8013134009292',
    brandEn: 'Foltene', brandAr: 'فولتين',
    nameEn: 'Foltene Pharma Thinning Hair Strengthening Shampoo for Men 200ml',
    nameAr: 'فولتين فارما شامبو تقوية الشعر الخفيف للرجال 200 مل',
    typeKey: 'shampoo', sub: ['care-hair-care'], tert: ['care-hair-care-shampoo-conditioners'],
    introEn: 'Foltene Pharma Men’s Shampoo strengthens thinning hair and supports scalp health.',
    introAr: 'شامبو فولتين فارما للرجال يقوّي الشعر الخفيف ويدعم صحة فروة الرأس.',
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function desc(p) {
  const sizeM = p.nameEn.match(/(\d+(?:\.\d+)?)\s*(ml|g)\b/i);
  const size = sizeM ? sizeM[0] : 'حسب المنتج';
  const sizeAr = size.replace(/ml/i, ' مل').replace(/g/i, ' جم');
  const typeMap = {
    serum: ['Face serum', 'سيروم للوجه'],
    toner: ['Facial toner', 'تونر للوجه'],
    cleanser: ['Facial cleanser', 'غسول للوجه'],
    cream: ['Face cream', 'كريم للوجه'],
    'body-cream': ['Body care', 'العناية بالجسم'],
    'body-wash': ['Body cleanser', 'غسول للجسم'],
    deodorant: ['Deodorant', 'مزيل عرق'],
    sunscreen: ['Sunscreen', 'واقي شمس'],
    'eye-cream': ['Eye care', 'العناية بالعين'],
    'lip-balm': ['Lip care', 'العناية بالشفاه'],
    'face-mask': ['Face mask', 'قناع وجه'],
    moisturizer: ['Moisturiser', 'مرطب'],
    shampoo: ['Shampoo', 'شامبو'],
  };
  const [typeEn, typeAr] = typeMap[p.typeKey] || ['Skincare', 'عناية'];
  const catEn = /body|foot|deodorant|hair|lip/i.test(p.typeKey) ? 'Body care' : 'Face care';
  const catAr = /body|foot|deodorant|hair|lip/i.test(p.typeKey) ? 'العناية بالجسم' : 'العناية بالوجه';
  return {
    descriptionEn: `${p.introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: Daily care · Targeted formula · Routine essential\n◆ Suitable for: Daily care routines\n◆ Size: ${size}`,
    descriptionAr: `${p.introAr}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: عناية يومية · تركيبة مركّزة · أساسي للروتين\n◆ الأنسب لـ: الاستخدام اليومي ضمن روتين العناية\n◆ الحجم: ${sizeAr}`,
  };
}

async function findProduct(barcode) {
  const res = await api(`/products?limit=5&search=${encodeURIComponent(barcode)}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  return items.find((x) => String(x.sku || x.barcode || '').trim() === barcode) || null;
}

async function resolveBrand(brandEn) {
  const brands = await api('/brands?limit=500');
  const list = Array.isArray(brands) ? brands : brands?.items || [];
  const slug = brandEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hit = list.find((b) => (b.slug || '').toLowerCase() === slug
    || [b.nameEn, b.name].filter(Boolean).some((n) => n.toLowerCase() === brandEn.toLowerCase()));
  if (hit) return hit.id;
  const created = await api('/brands', { method: 'POST', body: { name: brandEn, slug } });
  return created.id;
}

async function main() {
  await getToken();
  const queue = FIXES.filter((p) => !ONLY.length || ONLY.includes(p.barcode));
  const start = START - 1;
  const end = LIMIT > 0 ? Math.min(queue.length, start + LIMIT) : queue.length;
  const slice = queue.slice(start, end);
  const total = queue.length;

  console.log('══════════════════════════════════════════════════');
  console.log(`Manual short-name review ONE-BY-ONE | total=${total} | run=${slice.length}`);
  console.log('══════════════════════════════════════════════════\n');

  const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { done: {}, skipped: {}, failed: {} };
  let overrides = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
  const map = new Map(overrides.map((p) => [p.barcode, p]));
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < slice.length; i += 1) {
    const p = slice[i];
    const n = start + i + 1;
    if (i > 0) await sleep(DELAY_MS);
    const d = desc(p);
    const body = {
      name: p.nameAr,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      description: d.descriptionAr,
      descriptionAr: d.descriptionAr,
      descriptionEn: d.descriptionEn,
      subcategoryIds: p.sub.map((s) => CARE_SUB_SLUGS[s]).filter(Boolean),
      tertiaryCategoryIds: p.tert.map((s) => CARE_TERTIARY_SLUGS[s]).filter(Boolean),
    };

    try {
      const existing = await findProduct(p.barcode);
      let id;
      let action;
      if (existing?.id) {
        await api(`/products/${existing.id}`, { method: 'PATCH', body });
        id = existing.id;
        action = 'PATCH';
      } else {
        const brandId = await resolveBrand(p.brandEn);
        const created = await api('/products', {
          method: 'POST',
          body: {
            sku: p.barcode,
            barcode: p.barcode,
            slug: `${p.brandEn}-${p.barcode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 85),
            brandId,
            categoryId: CARE_CATEGORY_ID,
            ingredients: '',
            howToUse: '',
            price: 0,
            stock: 0,
            isActive: true,
            imageIds: [],
            ...body,
          },
        });
        id = created.id;
        action = 'CREATE';
      }

      await sleep(400);
      const verified = await findProduct(p.barcode);
      if (!verified || verified.nameAr !== p.nameAr || verified.nameEn !== p.nameEn) {
        throw new Error(`verify failed: ${verified?.nameAr}`);
      }

      map.set(p.barcode, {
        barcode: p.barcode,
        brandEn: p.brandEn,
        brandAr: p.brandAr,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        typeKey: p.typeKey,
        subcategorySlugs: p.sub,
        tertiarySlugs: p.tert,
        ...d,
      });
      writeFileSync(OUT, `${JSON.stringify([...map.values()], null, 2)}\n`);
      state.done[p.barcode] = { id, action: action.toLowerCase(), verified: true, nameEn: p.nameEn, nameAr: p.nameAr, at: Date.now() };
      delete state.failed[p.barcode];
      delete state.skipped[p.barcode];
      writeFileSync(STATE, JSON.stringify(state, null, 2));
      ok += 1;
      console.log(`[${n}/${total}] ${((n / total) * 100).toFixed(1)}% | OK-${action} | ${p.barcode}`);
      console.log(`  EN: ${p.nameEn}`);
      console.log(`  AR: ${p.nameAr}\n`);
    } catch (err) {
      fail += 1;
      state.failed[p.barcode] = { reason: err.message, at: Date.now() };
      writeFileSync(STATE, JSON.stringify(state, null, 2));
      console.log(`[${n}/${total}] FAIL | ${p.barcode} | ${err.message}`);
    }
  }

  console.log('══════════════════════════════════════════════════');
  console.log(`Done: OK=${ok} FAIL=${fail}`);
  console.log('══════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
