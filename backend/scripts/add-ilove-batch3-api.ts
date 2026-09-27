/**
 * إضافة الدفعة الثالثة من منتجات ilove (Wellness Calm / De-Stress / Energy) عبر API — بدون صور.
 * التسميات الدقيقة: راجع fix-ilove-batch3-api.ts (مصدر الحقيقة للأسماء والوصف).
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "4f70b98b-0236-41d9-a257-65db3c801091";
const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const HOME_SCENTS_ID = "06f8d36f-a094-4252-ae28-cba993445c8f";
const BODY_SUB = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const BODY_WASH_TERT = "35be991e-3062-4fbd-8f0a-2393bf806524";
const BODY_LOTION_TERT = "fcd86b22-a0fd-47b9-ba4c-c76164dadab2";
const BODY_OIL_TERT = "a898f04c-03d4-4ab6-baa7-bb64cf0d2e3e";
const BODY_SCRUB_TERT = "15e1a2c3-9924-4fd3-a7d9-b66d9adaddce";
const HANDS_SUB = "01ad1f0d-7c15-469c-bf86-85abd135e68f";
const HAND_WASH_TERT = "37616187-67dc-4ae5-9dc3-06ec3161bfa1";
const ROOM_MIST_SUB = "f2d3b8b3-fa5a-4e12-b0be-30bb7861f736";

const S = {
  calmAr: "النيرولي والبتغرين",
  calmEn: "neroli and petitgrain",
  destressAr: "عشب الليمون وإكليل الجبل والبرتقال والأوكالبتوس",
  destressEn: "lemongrass, rosemary, orange and eucalyptus",
  energyScrubAr: "البرتقال والبرغاموت",
  energyScrubEn: "orange and bergamot",
  energyBurstAr: "البرتقال والبرغاموت والبتغرين",
  energyBurstEn: "petitgrain, orange and bergamot",
};

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
};

function calmPillowMist(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - بخاخ وسادة للهدوء 125 مل",
    nameEn: "I Love - Wellness Calm Pillow Mist 125 ml",
    descriptionAr:
      `بخاخ وسادة من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calmAr} المهدئة، يُنشّئ أجواء هادئة ومريحة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية من البتغرين والبابونج.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُرش على الوسادة للاسترخاء.\n• يُساعد على الهدوء وتهدئة الحواس.\n• يُرش من مسافة 20–30 سم.`,
    descriptionEn:
      `Pillow mist spray from the I Love Wellness Calm collection with a calming ${S.calmEn} scent. Creates a relaxing, tranquil atmosphere.\n\n` +
      `• 99% naturally derived ingredients.\n• Infused with natural petitgrain and chamomile essential oils.\n• Vegan and made in the UK.\n• Spray onto pillow to unwind.\n• Helps soothe the senses.\n• Spray from 20–30 cm distance.`,
  };
}

function calmBathOil(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - زيت استحمام وجسم للهدوء 125 مل",
    nameEn: "I Love - Wellness Calm Bath & Body Oil 125 ml",
    descriptionAr:
      `زيت استحمام وجسم من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calmAr}، يُهدّئ الجسم والعقل.\n\n` +
      `• زيوت عطرية طبيعية 100%.\n• يحتوي على زيت البتغرين واليلانغ يلانغ.\n• يُستخدم في الحمام أو يُطبّق مباشرة على الجلد.\n• نباتي ومصنوع في المملكة المتحدة.\n• يترك البشرة ناعمة ومعطرة.\n• أضف 5–10 قطرات للماء الدافئ أو دلّك على الجلد.`,
    descriptionEn:
      `Bath and body oil from the I Love Wellness Calm collection with ${S.calmEn} essential oils. Soothes body and mind.\n\n` +
      `• 100% natural essential oils.\n• Infused with petitgrain and ylang ylang.\n• Use in the bath or apply directly to skin.\n• Vegan and made in the UK.\n• Leaves skin soft and delicately scented.\n• Add 5–10 drops to warm bath water or massage into skin.`,
  };
}

function calmBodyButter(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - زبدة جسم للهدوء 300 مل",
    nameEn: "I Love - Wellness Calm Body Butter 300 ml",
    descriptionAr:
      `زبدة جسم غنية من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calmAr} المهدئة، تُغذّي البشرة وتتركها ناعمة كالحرير.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• مدعّمة بزيت الأفوكادو وجوز الهند وزبدة الشيا والكاكاو.\n• تركيبة غنية وكريمية للترطيب العميق.\n• نباتية ومصنوعة في المملكة المتحدة.\n• مثالية للاسترخاء والهدوء.\n• يُوزّع على الجسم ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Rich body butter from the I Love Wellness Calm collection with a calming ${S.calmEn} aroma. Nourishes skin and leaves it silky smooth.\n\n` +
      `• 98% naturally derived ingredients.\n• Enriched with avocado and coconut oils, shea and cocoa butter.\n• Rich, creamy formula for deep moisturising.\n• Vegan and made in the UK.\n• Ideal for moments of calm and relaxation.\n• Apply generously and massage until absorbed.`,
  };
}

function calmBathSoak(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - مستحضر استحمام للهدوء 500 مل",
    nameEn: "I Love - Wellness Calm Bath Soak 500 ml",
    descriptionAr:
      `مستحضر استحمام من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calmAr}، يُهدّئ الجسم والعقل ويُنعّم البشرة أثناء الاستحمام.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار والبابونج وزيت اللوز الحلو.\n• يُصب تحت ماء الحمام الجاري للاسترخاء.\n• نباتي ومصنوع في المملكة المتحدة.\n• يترك البشرة نظيفة وناعمة ومعطرة.\n• يُصب الكمية المناسبة تحت ماء الحمام الجاري.`,
    descriptionEn:
      `Bath soak from the I Love Wellness Calm collection with ${S.calmEn} essential oils. Relaxes body and mind and leaves skin clean, soft and delicately scented.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with aloe vera, chamomile and sweet almond oil.\n• Pour under running bath water to unwind.\n• Vegan and made in the UK.\n• Leaves skin beautifully scented and silky soft.\n• Add the desired amount under running water.`,
  };
}

function destressScrub(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - مقشر جسم لإزالة التوتر 350 غ",
    nameEn: "I Love - Wellness De-Stress Body Scrub 350 g",
    descriptionAr:
      `مقشر جسم من مجموعة ويلنس لإزالة التوتر من آي لوف، برائحة ${S.destressAr}، يُقشّر بلطف ويُرطّب البشرة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• ملح البحر المطحون وحبوب المشمش لتقشير لطيف.\n• زيوت الجوجوبا وجوز الهند والقرطم لترطيب البشرة.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُدلّك على الجلد بحركات دائرية ثم يُشطف.\n• يترك البشرة ناعمة كالحرير.`,
    descriptionEn:
      `Exfoliating body scrub from the I Love Wellness De-Stress collection with ${S.destressEn} essential oils. Gently polishes and moisturises skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Sea salt and ground apricot stone for gentle exfoliation.\n• Jojoba, coconut and safflower oils nourish skin.\n• Vegan and made in the UK.\n• Massage in circular motions before rinsing.\n• Leaves skin silky smooth and soft.`,
  };
}

function destressShowerBurst(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - غسول استحمام لإزالة التوتر 500 مل",
    nameEn: "I Love - Wellness De-Stress Shower Burst 500 ml",
    descriptionAr:
      `غسول استحمام رغوي من مجموعة ويلنس لإزالة التوتر من آي لوف، برائحة ${S.destressAr}، ينظف البشرة ويُرطّبها.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية 100%.\n• رغوة غنية تُزيل الشوائب دون تجفيف البشرة.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجسم الرطب ثم يُشطف بالماء.`,
    descriptionEn:
      `Foaming shower burst from the I Love Wellness De-Stress collection with ${S.destressEn} essential oils. Cleanses and moisturises skin.\n\n` +
      `• 99% naturally derived ingredients.\n• 100% natural essential oils.\n• Rich lather removes impurities without drying.\n• Enriched with aloe vera and vitamin E.\n• Vegan and made in the UK.\n• Apply to wet skin, lather, then rinse.`,
  };
}

function destressHandWash(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - صابون سائل لليدين لإزالة التوتر 500 مل",
    nameEn: "I Love - Wellness De-Stress Hand Wash 500 ml",
    descriptionAr:
      `صابون سائل لليدين من مجموعة ويلنس لإزالة التوتر من آي لوف، برائحة ${S.destressAr}، ينظف اليدين بلطف دون تجفيفها.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• يُزيل الشوائب ويُبقي اليدين مرطبة.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُفرك على اليدين الرطبة لمدة 20 ثانية ثم يُشطف بالماء.`,
    descriptionEn:
      `Liquid hand wash from the I Love Wellness De-Stress collection with ${S.destressEn} essential oils. Gently cleanses hands without drying the skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with aloe vera and vitamin E.\n• Removes impurities while keeping hands hydrated.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply to wet hands, lather for 20 seconds, then rinse.`,
  };
}

function destressLotion(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - لوشن لليدين والجسم لإزالة التوتر 500 مل",
    nameEn: "I Love - Wellness De-Stress Hand & Body Lotion 500 ml",
    descriptionAr:
      `لوشن ترطيب لليدين والجسم من مجموعة ويلنس لإزالة التوتر من آي لوف، برائحة ${S.destressAr}، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بزيت جوز الهند وزبدة الشيا وبروفيتامين B5.\n• تركيبة ناعمة سريعة الامتصاص.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجلد ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Hand and body lotion from the I Love Wellness De-Stress collection with ${S.destressEn} essential oils. Moisturises skin and leaves it soft and delicately fragranced.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with coconut oil, shea butter and pro-vitamin B5.\n• Lightweight, fast-absorbing formula.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
  };
}

function energyScrub(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - مقشر جسم للطاقة 350 غ",
    nameEn: "I Love - Wellness Energy Body Scrub 350 g",
    descriptionAr:
      `مقشر جسم من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyScrubAr}، يُقشّر بلطف ويُنعش البشرة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• ملح البحر المطحون وحبوب المشمش لتقشير لطيف.\n• زيوت الجوجوبا وجوز الهند والقرطم لترطيب البشرة.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُدلّك على الجلد بحركات دائرية ثم يُشطف.\n• يترك البشرة ناعمة ومشرقة.`,
    descriptionEn:
      `Exfoliating body scrub from the I Love Wellness Energy collection with ${S.energyScrubEn} essential oils. Gently polishes and revitalises skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Sea salt and ground apricot stone for gentle exfoliation.\n• Jojoba, coconut and safflower oils nourish skin.\n• Vegan and made in the UK.\n• Massage in circular motions before rinsing.\n• Leaves skin silky smooth and refreshed.`,
  };
}

function energyShowerBurst(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - غسول استحمام للطاقة 500 مل",
    nameEn: "I Love - Wellness Energy Shower Burst 500 ml",
    descriptionAr:
      `غسول استحمام رغوي من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyBurstAr}، ينظف البشرة ويُنعش الحواس.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية 100%.\n• رغوة غنية تُزيل الشوائب دون تجفيف البشرة.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجسم الرطب ثم يُشطف بالماء.`,
    descriptionEn:
      `Foaming shower burst from the I Love Wellness Energy collection with ${S.energyBurstEn} essential oils. Cleanses skin and uplifts the senses.\n\n` +
      `• 99% naturally derived ingredients.\n• 100% natural essential oils.\n• Rich lather removes impurities without drying.\n• Enriched with aloe vera and vitamin E.\n• Vegan and made in the UK.\n• Apply to wet skin, lather, then rinse.`,
  };
}

function energyHandWash(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - صابون سائل لليدين للطاقة 500 مل",
    nameEn: "I Love - Wellness Energy Hand Wash 500 ml",
    descriptionAr:
      `صابون سائل لليدين من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyBurstAr}، ينظف اليدين بلطف دون تجفيفها.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• يُزيل الشوائب ويُبقي اليدين مرطبة.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُفرك على اليدين الرطبة لمدة 20 ثانية ثم يُشطف بالماء.`,
    descriptionEn:
      `Liquid hand wash from the I Love Wellness Energy collection with ${S.energyBurstEn} essential oils. Gently cleanses hands without drying the skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with aloe vera and vitamin E.\n• Removes impurities while keeping hands hydrated.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply to wet hands, lather for 20 seconds, then rinse.`,
  };
}

function energyLotion(): Pick<ProductInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: "آي لوف - لوشن لليدين والجسم للطاقة 500 مل",
    nameEn: "I Love - Wellness Energy Hand & Body Lotion 500 ml",
    descriptionAr:
      `لوشن ترطيب لليدين والجسم من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyBurstAr}، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بزيت جوز الهند وزبدة الشيا وبروفيتامين B5.\n• تركيبة ناعمة سريعة الامتصاص.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجلد ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Hand and body lotion from the I Love Wellness Energy collection with ${S.energyBurstEn} essential oils. Moisturises skin and leaves it soft and delicately fragranced.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with coconut oil, shea butter and pro-vitamin B5.\n• Lightweight, fast-absorbing formula.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
  };
}

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5060849630405",
    slug: "ilove-wellness-calm-pillow-mist-125ml",
    price: 8000,
    ...calmPillowMist(),
    categoryId: HOME_SCENTS_ID,
    subcategoryId: ROOM_MIST_SUB,
  },
  {
    barcode: "5060849630504",
    slug: "ilove-wellness-calm-bath-body-oil-125ml",
    price: 8000,
    ...calmBathOil(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_OIL_TERT,
  },
  {
    barcode: "5060849630382",
    slug: "ilove-wellness-calm-body-butter-300ml",
    price: 12000,
    ...calmBodyButter(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060849630344",
    slug: "ilove-wellness-calm-bath-soak-500ml",
    price: 10000,
    ...calmBathSoak(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849630481",
    slug: "ilove-wellness-de-stress-body-scrub-350g",
    price: 9000,
    ...destressScrub(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_SCRUB_TERT,
  },
  {
    barcode: "5060849630429",
    slug: "ilove-wellness-de-stress-shower-burst-500ml",
    price: 5750,
    ...destressShowerBurst(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849630443",
    slug: "ilove-wellness-de-stress-hand-wash-500ml",
    price: 6400,
    ...destressHandWash(),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
    tertiaryCategoryId: HAND_WASH_TERT,
  },
  {
    barcode: "5060849630467",
    slug: "ilove-wellness-de-stress-hand-body-lotion-500ml",
    price: 10000,
    ...destressLotion(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060849630474",
    slug: "ilove-wellness-energy-body-scrub-350g",
    price: 9000,
    ...energyScrub(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_SCRUB_TERT,
  },
  {
    barcode: "5060849630412",
    slug: "ilove-wellness-energy-shower-burst-500ml",
    price: 5750,
    ...energyShowerBurst(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849630436",
    slug: "ilove-wellness-energy-hand-wash-500ml",
    price: 6400,
    ...energyHandWash(),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
    tertiaryCategoryId: HAND_WASH_TERT,
  },
  {
    barcode: "5060849630450",
    slug: "ilove-wellness-energy-hand-body-lotion-500ml",
    price: 10000,
    ...energyLotion(),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
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

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products to add: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const p of PRODUCTS) {
    try {
      const check = await api<{ exists: boolean }>(`/products/barcode-check?barcode=${p.barcode}`);
      if (check.exists) {
        console.log(`skip ${p.barcode} — already exists`);
        skip += 1;
        continue;
      }

      const payload = {
        sku: p.barcode,
        barcode: p.barcode,
        slug: p.slug,
        brandId: BRAND_ID,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        tertiaryCategoryId: p.tertiaryCategoryId,
        subcategoryIds: [p.subcategoryId],
        tertiaryCategoryIds: p.tertiaryCategoryId ? [p.tertiaryCategoryId] : [],
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        originalPrice: p.price,
        stock: 0,
        isActive: true,
        imageIds: [] as string[],
      };

      const created = await api<{ id: string; name: string }>("/products", "POST", payload);
      console.log(`✓ ${created.name ?? p.nameEn} (${p.barcode})`);
      console.log(`  ${p.nameAr}`);
      ok += 1;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      fail += 1;
      console.log(`✗ ${p.barcode}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n--- Summary ---\nAdded: ${ok}\nSkipped: ${skip}\nFailed: ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
