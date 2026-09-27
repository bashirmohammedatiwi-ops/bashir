/**
 * تصحيح تسميات ووصف منتجات ilove — الدفعة الثالثة (Wellness Calm / De-Stress / Energy).
 * Usage: npx tsx scripts/fix-ilove-batch3-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const S = {
  calm: "النيرولي والبتغرين",
  calmEn: "neroli and petitgrain",
  destress: "عشب الليمون وإكليل الجبل والأوكالبتوس",
  destressFull: "عشب الليمون وإكليل الجبل والبرتقال والأوكالبتوس",
  destressEn: "lemongrass, rosemary and eucalyptus",
  destressFullEn: "lemongrass, rosemary, orange and eucalyptus",
  energyScrub: "البرتقال والبرغاموت",
  energyScrubEn: "orange and bergamot",
  energyBurst: "البرتقال والبرغاموت والبتغرين",
  energyBurstEn: "petitgrain, orange and bergamot",
};

type FixInput = {
  barcode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const FIXES: FixInput[] = [
  {
    barcode: "5060849630405",
    nameAr: `آي لوف - بخاخ وسادة للهدوء برائحة ${S.calm} 125 مل`,
    nameEn: "I Love - Wellness Calm Neroli & Petitgrain Pillow Mist 125 ml",
    descriptionAr:
      `بخاخ وسادة من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calm} المهدئة، يُنشّئ أجواء هادئة ومريحة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية من النيرولي والبتغرين والبابونج.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُرش على الوسادة للاسترخاء.\n• يُساعد على الهدوء وتهدئة الحواس.\n• يُرش من مسافة 20–30 سم.`,
    descriptionEn:
      "Pillow mist spray from the I Love Wellness Calm collection with a calming neroli and petitgrain scent. Creates a relaxing, tranquil atmosphere.\n\n• 99% naturally derived ingredients.\n• Infused with natural neroli, petitgrain and chamomile essential oils.\n• Vegan and made in the UK.\n• Spray onto pillow to unwind.\n• Helps soothe the senses.\n• Spray from 20–30 cm distance.",
  },
  {
    barcode: "5060849630504",
    nameAr: `آي لوف - زيت استحمام وجسم للهدوء برائحة ${S.calm} 125 مل`,
    nameEn: "I Love - Wellness Calm Neroli & Petitgrain Bath & Body Oil 125 ml",
    descriptionAr:
      `زيت استحمام وجسم من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calm}، يُهدّئ الجسم والعقل.\n\n` +
      `• زيوت عطرية طبيعية 100%.\n• يحتوي على زيت البتغرين واليلانغ يلانغ.\n• يُستخدم في الحمام أو يُطبّق مباشرة على الجلد.\n• نباتي ومصنوع في المملكة المتحدة.\n• يترك البشرة ناعمة ومعطرة.\n• أضف 5–10 قطرات للماء الدافئ أو دلّك على الجلد.`,
    descriptionEn:
      "Bath and body oil from the I Love Wellness Calm collection with neroli and petitgrain essential oils. Soothes body and mind.\n\n• 100% natural essential oils.\n• Infused with petitgrain and ylang ylang.\n• Use in the bath or apply directly to skin.\n• Vegan and made in the UK.\n• Leaves skin soft and delicately scented.\n• Add 5–10 drops to warm bath water or massage into skin.",
  },
  {
    barcode: "5060849630382",
    nameAr: `آي لوف - زبدة جسم للهدوء برائحة ${S.calm} 300 مل`,
    nameEn: "I Love - Wellness Calm Neroli & Petitgrain Body Butter 300 ml",
    descriptionAr:
      `زبدة جسم غنية من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calm} المهدئة، تُغذّي البشرة وتتركها ناعمة كالحرير.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• مدعّمة بزيت الأفوكادو وجوز الهند وزبدة الشيا والكاكاو.\n• تركيبة غنية وكريمية للترطيب العميق.\n• نباتية ومصنوعة في المملكة المتحدة.\n• مثالية للاسترخاء والهدوء.\n• يُوزّع على الجسم ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      "Rich body butter from the I Love Wellness Calm collection with a calming neroli and petitgrain aroma. Nourishes skin and leaves it silky smooth.\n\n• 98% naturally derived ingredients.\n• Enriched with avocado and coconut oils, shea and cocoa butter.\n• Rich, creamy formula for deep moisturising.\n• Vegan and made in the UK.\n• Ideal for moments of calm and relaxation.\n• Apply generously and massage until absorbed.",
  },
  {
    barcode: "5060849630344",
    nameAr: `آي لوف - مستحضر استحمام للهدوء برائحة ${S.calm} 500 مل`,
    nameEn: "I Love - Wellness Calm Neroli & Petitgrain Bath Soak 500 ml",
    descriptionAr:
      `مستحضر استحمام من مجموعة ويلنس للهدوء من آي لوف، برائحة ${S.calm}، يُهدّئ الجسم والعقل ويُنعّم البشرة أثناء الاستحمام.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار والبابونج وزيت اللوز الحلو.\n• يُصب تحت ماء الحمام الجاري للاسترخاء.\n• نباتي ومصنوع في المملكة المتحدة.\n• يترك البشرة نظيفة وناعمة ومعطرة.\n• يُصب الكمية المناسبة تحت ماء الحمام الجاري.`,
    descriptionEn:
      "Bath soak from the I Love Wellness Calm collection with neroli and petitgrain essential oils. Relaxes body and mind and leaves skin clean, soft and delicately scented.\n\n• 99% naturally derived ingredients.\n• Enriched with aloe vera, chamomile and sweet almond oil.\n• Pour under running bath water to unwind.\n• Vegan and made in the UK.\n• Leaves skin beautifully scented and silky soft.\n• Add the desired amount under running water.",
  },
  {
    barcode: "5060849630481",
    nameAr: `آي لوف - مقشر جسم لتخفيف التوتر برائحة ${S.destress} 350 غ`,
    nameEn: "I Love - Wellness De-Stress Lemongrass Rosemary & Eucalyptus Body Scrub 350 g",
    descriptionAr:
      `مقشر جسم من مجموعة ويلنس لتخفيف التوتر من آي لوف، برائحة ${S.destressFull}، يُقشّر بلطف ويُرطّب البشرة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• ملح البحر وحبوب المشمش المطحونة لتقشير لطيف.\n• زيوت الجوجوبا وجوز الهند والقرطم لترطيب البشرة.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُدلّك على الجلد بحركات دائرية ثم يُشطف.\n• يترك البشرة ناعمة كالحرير.`,
    descriptionEn:
      `Exfoliating body scrub from the I Love Wellness De-Stress collection with ${S.destressFullEn} essential oils. Gently polishes and moisturises skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Sea salt and ground apricot stone for gentle exfoliation.\n• Jojoba, coconut and safflower oils nourish skin.\n• Vegan and made in the UK.\n• Massage in circular motions before rinsing.\n• Leaves skin silky smooth and soft.`,
  },
  {
    barcode: "5060849630429",
    nameAr: `آي لوف - رغوة استحمام لتخفيف التوتر برائحة ${S.destress} 500 مل`,
    nameEn: "I Love - Wellness De-Stress Lemongrass Rosemary & Eucalyptus Shower Burst 500 ml",
    descriptionAr:
      `رغوة استحمام من مجموعة ويلنس لتخفيف التوتر من آي لوف، برائحة ${S.destressFull}، تنظف البشرة وترطّبها.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية 100%.\n• رغوة غنية تُزيل الشوائب دون تجفيف البشرة.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجسم الرطب ثم يُشطف بالماء.`,
    descriptionEn:
      `Foaming shower burst from the I Love Wellness De-Stress collection with ${S.destressFullEn} essential oils. Cleanses and moisturises skin.\n\n` +
      `• 99% naturally derived ingredients.\n• 100% natural essential oils.\n• Rich lather removes impurities without drying.\n• Enriched with aloe vera and vitamin E.\n• Vegan and made in the UK.\n• Apply to wet skin, lather, then rinse.`,
  },
  {
    barcode: "5060849630443",
    nameAr: `آي لوف - صابون سائل لليدين لتخفيف التوتر برائحة ${S.destress} 500 مل`,
    nameEn: "I Love - Wellness De-Stress Lemongrass Rosemary & Eucalyptus Hand Wash 500 ml",
    descriptionAr:
      `صابون سائل لليدين من مجموعة ويلنس لتخفيف التوتر من آي لوف، برائحة ${S.destress}، ينظف اليدين بلطف دون تجفيفها.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• يُزيل الشوائب ويُبقي اليدين مرطبة.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُفرك على اليدين الرطبة لمدة 20 ثانية ثم يُشطف بالماء.`,
    descriptionEn:
      `Liquid hand wash from the I Love Wellness De-Stress collection with ${S.destressEn} essential oils. Gently cleanses hands without drying the skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with aloe vera and vitamin E.\n• Removes impurities while keeping hands hydrated.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply to wet hands, lather for 20 seconds, then rinse.`,
  },
  {
    barcode: "5060849630467",
    nameAr: `آي لوف - لوشن لليدين والجسم لتخفيف التوتر برائحة ${S.destress} 500 مل`,
    nameEn: "I Love - Wellness De-Stress Lemongrass Rosemary & Eucalyptus Hand & Body Lotion 500 ml",
    descriptionAr:
      `لوشن ترطيب لليدين والجسم من مجموعة ويلنس لتخفيف التوتر من آي لوف، برائحة ${S.destress}، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• مدعّم بزيت الأفوكادو وجوز الهند وزبدة الشيا.\n• تركيبة كريمية ناعمة سريعة الامتصاص.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجلد ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Hand and body lotion from the I Love Wellness De-Stress collection with ${S.destressEn} essential oils. Moisturises skin and leaves it soft and delicately fragranced.\n\n` +
      `• 98% naturally derived ingredients.\n• Enriched with avocado oil, coconut oil and shea butter.\n• Lightweight, fast-absorbing formula.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
  },
  {
    barcode: "5060849630474",
    nameAr: `آي لوف - مقشر جسم للطاقة برائحة ${S.energyScrub} 350 غ`,
    nameEn: "I Love - Wellness Energy Orange & Bergamot Body Scrub 350 g",
    descriptionAr:
      `مقشر جسم من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyScrub}، يُقشّر بلطف ويُنعش البشرة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• ملح البحر وحبوب المشمش المطحونة لتقشير لطيف.\n• زيوت الجوجوبا وجوز الهند والقرطم لترطيب البشرة.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُدلّك على الجلد بحركات دائرية ثم يُشطف.\n• يترك البشرة ناعمة ومشرقة.`,
    descriptionEn:
      `Exfoliating body scrub from the I Love Wellness Energy collection with ${S.energyScrubEn} essential oils. Gently polishes and revitalises skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Sea salt and ground apricot stone for gentle exfoliation.\n• Jojoba, coconut and safflower oils nourish skin.\n• Vegan and made in the UK.\n• Massage in circular motions before rinsing.\n• Leaves skin silky smooth and refreshed.`,
  },
  {
    barcode: "5060849630412",
    nameAr: `آي لوف - رغوة استحمام للطاقة برائحة ${S.energyBurst} 500 مل`,
    nameEn: "I Love - Wellness Energy Petitgrain Orange & Bergamot Shower Burst 500 ml",
    descriptionAr:
      `رغوة استحمام من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyBurst}، تنظف البشرة وتُنعش الحواس.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية 100%.\n• رغوة غنية تُزيل الشوائب دون تجفيف البشرة.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجسم الرطب ثم يُشطف بالماء.`,
    descriptionEn:
      `Foaming shower burst from the I Love Wellness Energy collection with ${S.energyBurstEn} essential oils. Cleanses skin and uplifts the senses.\n\n` +
      `• 99% naturally derived ingredients.\n• 100% natural essential oils.\n• Rich lather removes impurities without drying.\n• Enriched with aloe vera and vitamin E.\n• Vegan and made in the UK.\n• Apply to wet skin, lather, then rinse.`,
  },
  {
    barcode: "5060849630436",
    nameAr: `آي لوف - صابون سائل لليدين للطاقة برائحة ${S.energyBurst} 500 مل`,
    nameEn: "I Love - Wellness Energy Petitgrain Orange & Bergamot Hand Wash 500 ml",
    descriptionAr:
      `صابون سائل لليدين من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyBurst}، ينظف اليدين بلطف دون تجفيفها.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار وفيتامين E.\n• يُزيل الشوائب ويُبقي اليدين مرطبة.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُفرك على اليدين الرطبة لمدة 20 ثانية ثم يُشطف بالماء.`,
    descriptionEn:
      `Liquid hand wash from the I Love Wellness Energy collection with ${S.energyBurstEn} essential oils. Gently cleanses hands without drying the skin.\n\n` +
      `• 99% naturally derived ingredients.\n• Enriched with aloe vera and vitamin E.\n• Removes impurities while keeping hands hydrated.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply to wet hands, lather for 20 seconds, then rinse.`,
  },
  {
    barcode: "5060849630450",
    nameAr: `آي لوف - لوشن لليدين والجسم للطاقة برائحة ${S.energyBurst} 500 مل`,
    nameEn: "I Love - Wellness Energy Petitgrain Orange & Bergamot Hand & Body Lotion 500 ml",
    descriptionAr:
      `لوشن ترطيب لليدين والجسم من مجموعة ويلنس للطاقة من آي لوف، برائحة ${S.energyBurst}، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• مدعّم بزيت الأفوكادو وجوز الهند وزبدة الشيا.\n• تركيبة كريمية ناعمة سريعة الامتصاص.\n• غني بالزيوت العطرية الطبيعية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجلد ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Hand and body lotion from the I Love Wellness Energy collection with ${S.energyBurstEn} essential oils. Moisturises skin and leaves it soft and delicately fragranced.\n\n` +
      `• 98% naturally derived ingredients.\n• Enriched with avocado oil, coconut oil and shea butter.\n• Lightweight, fast-absorbing formula.\n• Infused with natural essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
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

async function findProductId(barcode: string): Promise<string | null> {
  const check = await api<{ exists: boolean; product?: { id: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  return check.exists && check.product?.id ? check.product.id : null;
}

async function main() {
  console.log(`Fixing ${FIXES.length} products...\n`);
  await login();

  let ok = 0;
  let fail = 0;

  for (const fix of FIXES) {
    const id = await findProductId(fix.barcode);
    if (!id) {
      console.log(`✗ ${fix.barcode}: not found`);
      fail += 1;
      continue;
    }
    try {
      await api(`/products/${id}`, "PATCH", {
        nameAr: fix.nameAr,
        nameEn: fix.nameEn,
        descriptionAr: fix.descriptionAr,
        descriptionEn: fix.descriptionEn,
      });
      console.log(`✓ ${fix.barcode}`);
      console.log(`  ${fix.nameAr}`);
      ok += 1;
    } catch (err) {
      fail += 1;
      console.log(`✗ ${fix.barcode}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n--- Summary ---\nFixed: ${ok}\nFailed: ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
