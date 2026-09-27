/**
 * إضافة الدفعة الثانية من منتجات ilove (Naturals + Wellness) عبر API — بدون صور.
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-ilove-batch2-api.ts
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
const HANDS_SUB = "01ad1f0d-7c15-469c-bf86-85abd135e68f";
const HAND_WASH_TERT = "37616187-67dc-4ae5-9dc3-06ec3161bfa1";
const ROOM_MIST_SUB = "f2d3b8b3-fa5a-4e12-b0be-30bb7861f736";

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

const handCreamDesc = (scentAr: string, scentEn: string) => ({
  descriptionAr:
    `كريم يدين طبيعي من مجموعة I Love Naturals برائحة ${scentAr}، يُرطّب اليدين ويتركها ناعمة ومعطرة.\n\n` +
    `• 98% مكوّنات طبيعية المنشأ.\n• يحتوي على زيت جوز الهند العضوي وزبدة الشيا وبروفيتامين B5.\n• تركيبة ناعمة سريعة الامتصاص.\n• غني بالزيوت العطرية الطبيعية.\n• vegan ومصنوع في المملكة المتحدة.\n• يُوزّع على اليدين ويُدلّك حتى الامتصاص.`,
  descriptionEn:
    `Naturally moisturising I Love Naturals hand cream with a ${scentEn} fragrance. Helps hydrate hands and leave them soft and elegantly scented.\n\n` +
    `• 98% naturally derived ingredients.\n• Enriched with organic coconut oil, shea butter and pro-vitamin B5.\n• Lightweight, fast-absorbing formula.\n• Infused with essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
});

const handWashDesc = (scentAr: string, scentEn: string) => ({
  descriptionAr:
    `غسول يدين سائل من مجموعة I Love Naturals برائحة ${scentAr}، ينظف اليدين بلطف دون تجفيفها.\n\n` +
    `• 98% مكوّنات طبيعية المنشأ.\n• منظّفات نباتية وبروفيتامين B5.\n• رغوة كريمية ترطّب وتترك اليدين ناعمة.\n• غني بالزيوت العطرية.\n• vegan ومصنوع في المملكة المتحدة.\n• يُستخدم على اليدين الرطبة ثم يُشطف بالماء.`,
  descriptionEn:
    `I Love Naturals hand wash with a ${scentEn} scent. Gently cleanses hands without drying the skin.\n\n` +
    `• 98% naturally derived ingredients.\n• Plant-based cleansers and pro-vitamin B5.\n• Moisturising lather leaves hands silky smooth.\n• Rich in essential oils.\n• Vegan and made in the UK.\n• Apply to wet hands, lather for 20 seconds, then rinse.`,
});

const bodyWashDesc = (scentAr: string, scentEn: string) => ({
  descriptionAr:
    `غسول جسم من مجموعة I Love Naturals برائحة ${scentAr}، ينظف البشرة بلطف ويتركها مرطبة ومعطرة.\n\n` +
    `• 98% مكوّنات طبيعية المنشأ.\n• منظّفات نباتية وبروفيتامين B5.\n• رغوة فاخرة تزيل الشوائب دون تجفيف البشرة.\n• غني بالزيوت العطرية.\n• vegan ومصنوع في المملكة المتحدة.\n• يُوزّع على الجسم الرطب ثم يُشطف بالماء.`,
  descriptionEn:
    `I Love Naturals body wash with a ${scentEn} scent. Gently cleanses and moisturises the skin.\n\n` +
    `• 98% naturally derived ingredients.\n• Plant-based cleansers and pro-vitamin B5.\n• Luxurious lather removes impurities without drying.\n• Rich in essential oils.\n• Vegan and made in the UK.\n• Apply to wet skin, lather, then rinse.`,
});

const lotionDesc = (scentAr: string, scentEn: string) => ({
  descriptionAr:
    `لوشن يدين وجسم من مجموعة I Love Naturals برائحة ${scentAr}، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n` +
    `• 98% مكوّنات طبيعية المنشأ.\n• يحتوي على زيت جوز الهند العضوي وزبدة الشيا وبروفيتامين B5.\n• مناسب للبشرة الحساسة.\n• غني بالزيوت العطرية.\n• vegan ومصنوع في المملكة المتحدة.\n• يُوزّع على الجلد ويُدلّك حتى الامتصاص.`,
  descriptionEn:
    `I Love Naturals hand and body lotion with a ${scentEn} scent. Moisturises skin and leaves it soft and delicately fragranced.\n\n` +
    `• 98% naturally derived ingredients.\n• Enriched with organic coconut oil, shea butter and pro-vitamin B5.\n• Suitable for sensitive skin.\n• Infused with essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
});

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5060849630146",
    slug: "ilove-naturals-tonka-bean-myrrh-hand-cream-100ml",
    price: 5500,
    nameAr: "آي لوف - كريم يدين Naturals Tonka Bean & Myrrh 100 مل",
    nameEn: "I Love - Naturals Tonka Bean & Myrrh Hand Cream 100 ml",
    ...handCreamDesc("فول التونka والمر", "tonka bean and myrrh"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060849630092",
    slug: "ilove-naturals-rose-argan-hand-cream-100ml",
    price: 5500,
    nameAr: "آي لوف - كريم يدين Naturals Rose & Argan 100 مل",
    nameEn: "I Love - Naturals Rose & Argan Hand Cream 100 ml",
    ...handCreamDesc("الورد والأrgán", "rose and argan"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060849630122",
    slug: "ilove-naturals-lime-ginger-cardamom-hand-cream-100ml",
    price: 5500,
    nameAr: "آي لوف - كريم يدين Naturals Lime Ginger & Cardamom 100 مل",
    nameEn: "I Love - Naturals Lime, Ginger & Cardamom Hand Cream 100 ml",
    ...handCreamDesc("الليمون والزنجبيل والهيل", "lime, ginger and cardamom"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060849630108",
    slug: "ilove-naturals-bergamot-seaweed-hand-cream-100ml",
    price: 5500,
    nameAr: "آي لوف - كريم يدين Naturals Bergamot & Seaweed 100 مل",
    nameEn: "I Love - Naturals Bergamot & Seaweed Hand Cream 100 ml",
    ...handCreamDesc("البرgamot والطحالب", "bergamot and seaweed"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060351549882",
    slug: "ilove-naturals-lime-ginger-cardamom-hand-wash-500ml",
    price: 5500,
    nameAr: "آي لوف - غسول يدين Naturals lime ginger & cardamom 500 مل",
    nameEn: "I Love - Naturals Lime, Ginger & Cardamom Hand Wash 500 ml",
    ...handWashDesc("الليمون والزنجبيل والهيل", "lime, ginger and cardamom"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
    tertiaryCategoryId: HAND_WASH_TERT,
  },
  {
    barcode: "5060351549905",
    slug: "ilove-naturals-tonka-bean-myrrh-hand-wash-500ml",
    price: 5500,
    nameAr: "آي لوف - غسول يدين Naturals tonka bean & myrrh 500 مل",
    nameEn: "I Love - Naturals Tonka Bean & Myrrh Hand Wash 500 ml",
    ...handWashDesc("فول التونka والمر", "tonka bean and myrrh"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
    tertiaryCategoryId: HAND_WASH_TERT,
  },
  {
    barcode: "5060351549868",
    slug: "ilove-naturals-bergamot-seaweed-hand-wash-500ml",
    price: 5500,
    nameAr: "آي لوف - غسول يدين Naturals Bergamot & Seaweed 500 مل",
    nameEn: "I Love - Naturals Bergamot & Seaweed Hand Wash 500 ml",
    ...handWashDesc("البرgamot والطحالب", "bergamot and seaweed"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
    tertiaryCategoryId: HAND_WASH_TERT,
  },
  {
    barcode: "5060351549851",
    slug: "ilove-naturals-rose-argan-hand-wash-500ml",
    price: 5500,
    nameAr: "آي لوف - غسول يدين Naturals rose & argan 500 مل",
    nameEn: "I Love - Naturals Rose & Argan Hand Wash 500 ml",
    ...handWashDesc("الورد والأرgan", "rose and argan"),
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
    tertiaryCategoryId: HAND_WASH_TERT,
  },
  {
    barcode: "5060351549981",
    slug: "ilove-naturals-bergamot-seaweed-hand-body-lotion-500ml",
    price: 6500,
    nameAr: "آي لوف - لوشن يدين وجسم Naturals bergamot & seaweed 500 مل",
    nameEn: "I Love - Naturals Bergamot & Seaweed Hand & Body Lotion 500 ml",
    ...lotionDesc("البرgamot والطحالب", "bergamot and seaweed"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060351549974",
    slug: "ilove-naturals-rose-argan-hand-body-lotion-500ml",
    price: 6500,
    nameAr: "آي لوف - لوشن يدين وجسم Naturals rose & argan 500 مل",
    nameEn: "I Love - Naturals Rose & Argan Hand & Body Lotion 500 ml",
    ...lotionDesc("الورد والأرgan", "rose and argan"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060849630009",
    slug: "ilove-naturals-lime-ginger-cardamom-hand-body-lotion-500ml",
    price: 6500,
    nameAr: "آي لوف - لوشن يدين وجسم Naturals lime ginger & cardamom 500 مل",
    nameEn: "I Love - Naturals Lime, Ginger & Cardamom Hand & Body Lotion 500 ml",
    ...lotionDesc("الليمون والزنجبيل والهيل", "lime, ginger and cardamom"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060849630023",
    slug: "ilove-naturals-tonka-bean-myrrh-hand-body-lotion-500ml",
    price: 6500,
    nameAr: "آي لوف - لوشن يدين وجسم Naturals tonka bean & myrrh 500 مل",
    nameEn: "I Love - Naturals Tonka Bean & Myrrh Hand & Body Lotion 500 ml",
    ...lotionDesc("فول التونka والمر", "tonka bean and myrrh"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060351549745",
    slug: "ilove-naturals-bergamot-seaweed-body-wash-500ml",
    price: 5750,
    nameAr: "آي لوف - غسول جسم Naturals bergamot & seaweed 500 مل",
    nameEn: "I Love - Naturals Bergamot & Seaweed Body Wash 500 ml",
    ...bodyWashDesc("البرgamot والطحالب", "bergamot and seaweed"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060351549769",
    slug: "ilove-naturals-lime-ginger-cardamom-body-wash-500ml",
    price: 5750,
    nameAr: "آي لوف - غسول جسم Naturals lime ginger & cardamom 500 مل",
    nameEn: "I Love - Naturals Lime, Ginger & Cardamom Body Wash 500 ml",
    ...bodyWashDesc("الليمون والزنجبيل والهيل", "lime, ginger and cardamom"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060351549738",
    slug: "ilove-naturals-rose-argan-body-wash-500ml",
    price: 5750,
    nameAr: "آي لوف - غسول جسم Naturals Rose & Argan 500 مل",
    nameEn: "I Love - Naturals Rose & Argan Body Wash 500 ml",
    ...bodyWashDesc("الورد والأرgan", "rose and argan"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060351549783",
    slug: "ilove-naturals-tonka-bean-myrrh-body-wash-500ml",
    price: 5750,
    nameAr: "آي لوف - غسول جسم Naturals tonka bean & myrrh 500 مل",
    nameEn: "I Love - Naturals Tonka Bean & Myrrh Body Wash 500 ml",
    ...bodyWashDesc("فول التونka والمر", "tonka bean and myrrh"),
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849630375",
    slug: "ilove-wellness-sleep-body-butter-300ml",
    price: 8500,
    nameAr: "آي لوف - زبدة جسم Wellness Sleep 300 مل",
    nameEn: "I Love - Wellness Sleep Body Butter 300 ml",
    descriptionAr:
      "زبدة جسم من مجموعة I Love Wellness برائحة الخزامى والبابونج المهدئة، تُغذّي البشرة وتتركها ناعمة كالحرير.\n\n• 99% مكوّنات طبيعية المنشأ.\n• تحتوي على زيت الأفocado وجوز الهند وزبدة الشيا والكakao.\n• تركيبة غنية وكريمية للترطيب العميق.\n• vegan ومصنوعة في المملكة المتحدة.\n• مثالية قبل النوم للاسترخاء.\n• يُوزّع على الجسم ويُدلّك حتى الامتصاص.",
    descriptionEn:
      "I Love Wellness Sleep body butter with a calming lavender and chamomile aroma. Nourishes skin and leaves it silky smooth.\n\n• 99% naturally derived ingredients.\n• Enriched with avocado and coconut oils, shea and cocoa butter.\n• Rich, creamy formula for deep moisturising.\n• Vegan and made in the UK.\n• Ideal before bedtime to unwind.\n• Apply generously and massage until absorbed.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_LOTION_TERT,
  },
  {
    barcode: "5060849630498",
    slug: "ilove-wellness-sleep-bath-body-oil-125ml",
    price: 6500,
    nameAr: "آي لوف - زيت استحمام وجسم Wellness Sleep 125 مل",
    nameEn: "I Love - Wellness Sleep Bath & Body Oil 125 ml",
    descriptionAr:
      "زيت استحمام وجسم من مجموعة I Love Wellness برائحة الخزامى والبابونج، يُهدّئ الجسم والعقل استعداداً للنوم.\n\n• زيوت عطرية طبيعية 100%.\n• يحتوي على زيت الخزامى والبابونج.\n• يُستخدم في الحمام أو يُطبّق مباشرة على الجلد.\n• vegan ومصنوع في المملكة المتحدة.\n• يترك البشرة ناعمة ومعطرة.\n• أضف 5–10 قطرات للماء الدافئ أو دلّك على الجلد.",
    descriptionEn:
      "I Love Wellness Sleep bath and body oil with lavender and chamomile essential oils. Prepares body and mind for a restful night's sleep.\n\n• 100% natural essential oils.\n• Infused with lavender and chamomile.\n• Use in the bath or apply directly to skin.\n• Vegan and made in the UK.\n• Leaves skin soft and delicately scented.\n• Add 5–10 drops to warm bath water or massage into skin.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_OIL_TERT,
  },
  {
    barcode: "5060849630399",
    slug: "ilove-wellness-sleep-pillow-mist-125ml",
    price: 6500,
    nameAr: "آي لوف - بخاخ وسادة Wellness Sleep 125 مل",
    nameEn: "I Love - Wellness Sleep Pillow Mist 125 ml",
    descriptionAr:
      "بخاخ وسادة من مجموعة I Love Wellness برائحة الخزامى والبابونج المهدئة، يُنشّط أجواء النوم الهادئ.\n\n• 99% مكوّنات طبيعية المنشأ.\n• زيوت عطرية طبيعية من الخزامى والبابونج.\n• vegan ومصنوع في المملكة المتحدة.\n• يُرش على الوسادة قبل النوم.\n• يُساعد على الاسترخاء والهدوء.\n• يُرش من مسافة 20–30 سم.",
    descriptionEn:
      "I Love Wellness Sleep pillow mist spray with a calming lavender and chamomile scent. Creates a relaxing bedtime atmosphere.\n\n• 99% naturally derived ingredients.\n• Infused with natural lavender and chamomile essential oils.\n• Vegan and made in the UK.\n• Spray onto pillow before sleep.\n• Helps unwind and relax.\n• Spray from 20–30 cm distance.",
    categoryId: HOME_SCENTS_ID,
    subcategoryId: ROOM_MIST_SUB,
  },
  {
    barcode: "5060849630337",
    slug: "ilove-wellness-sleep-bath-soak-500ml",
    price: 6500,
    nameAr: "آي لوف - صابون استحمام Wellness Sleep 500 مل",
    nameEn: "I Love - Wellness Sleep Bath Soak 500 ml",
    descriptionAr:
      "صابون استحمام من مجموعة I Love Wellness برائحة الخزامى والبابونج، يُهدّئ الجسم والعقل ويُنعّم البشرة.\n\n• 99% مكوّنات طبيعية المنشأ.\n• يحتوي على مستخلص الصبار والبابونج والخزامى.\n• يُستخدم تحت ماء الحمام للاسترخاء.\n• vegan ومصنوع في المملكة المتحدة.\n• يترك البشرة نظيفة وناعمة ومعطرة.\n• يُصب الكمية المناسبة تحت ماء الحمام الجاري.",
    descriptionEn:
      "I Love Wellness Sleep bath soak with lavender and chamomile. Relaxes body and mind and leaves skin clean, soft and delicately scented.\n\n• 99% naturally derived ingredients.\n• Enriched with aloe vera, chamomile and lavender extract.\n• Pour under running bath water to unwind.\n• Vegan and made in the UK.\n• Leaves skin beautifully scented and silky soft.\n• Add the desired amount under running water.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
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
