/**
 * إضافة منتجات ilove عبر API الإدارة (بدون صور).
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-ilove-products-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "4f70b98b-0236-41d9-a257-65db3c801091";
const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const PERFUME_ID = "975e0e23-edd2-4181-ad6d-ecade6452b95";
const BODY_SUB = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const BODY_WASH_TERT = "35be991e-3062-4fbd-8f0a-2393bf806524";
const HANDS_SUB = "01ad1f0d-7c15-469c-bf86-85abd135e68f";
const BODY_MIST_SUB = "453c027d-0022-455b-91a9-d4299479ec62";

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

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5060217188385",
    slug: "ilove-mango-papaya-hand-lotion-75ml",
    price: 4500,
    nameAr: "آي لوف - كريم ترطيب اليدين بالمانجو والبابايا 75 مل",
    nameEn: "I Love - Mango & Papaya Super Soft Hand Lotion 75 ml",
    descriptionAr:
      "كريم ترطيب لليدين والأظافف للنساء برائحة استوائية منعشة تجمع بين المانجو الحلو والبابايا، ويساعد على ترطيب اليدين الجافة وتركها ناعمة ومعطرة.\n\n• يحتوي على زبدة الشيا وزيت جوز الهند المغذيين.\n• مدعّم ببروفيتامين B5 وفيتامين E.\n• تركيبة ناعمة سريعة الامتصاص.\n• يترك اليدين ناعمة ومرطبة ومعطرة برائحة المانجو والبابايا.\n• مناسب للاستخدام اليومي ويمكن حمله في الحقيبة.\n• يُوزّع على اليدين ويُدلّك حتى الامتصاص.",
    descriptionEn:
      "Moisturising hand and nail lotion for women with a tropical mango and papaya scent. Helps hydrate dry hands and leave them soft, smooth, and delicately fragranced.\n\n• Enriched with shea butter and coconut oil.\n• Contains pro-vitamin B5 and vitamin E.\n• Lightweight, fast-absorbing formula.\n• Leaves hands soft, nourished, and scented.\n• Suitable for daily use and on-the-go hydration.\n• Apply generously and massage until absorbed.",
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060217188415",
    slug: "ilove-coconut-cream-hand-lotion-75ml",
    price: 4500,
    nameAr: "آي لوف - كريم ترطيب اليدين بجوز الهند والكريمة 75 مل",
    nameEn: "I Love - Coconut & Cream Super Soft Hand Lotion 75 ml",
    descriptionAr:
      "كريم ترطيب لليدين والأظافف للنساء برائحة دافئة تجمع بين جوز الهند الحلو والكريمة الناعمة، ويساعد على ترطيب اليدين الجافة وتركها ناعمة ومعطرة.\n\n• يحتوي على زبدة الشيا وزيت جوز الهند المغذيين.\n• مدعّم ببروفيتامين B5 وفيتامين E.\n• تركيبة ناعمة سريعة الامتصاص.\n• يترك اليدين ناعمة ومرطبة ومعطرة برائحة جوز الهند والكريمة.\n• مناسب للاستخدام اليومي ويمكن حمله في الحقيبة.\n• يُوزّع على اليدين ويُدلّك حتى الامتصاص.",
    descriptionEn:
      "Moisturising hand and nail lotion for women with a sweet coconut and cream scent. Helps hydrate dry hands and leave them soft, smooth, and delicately fragranced.\n\n• Enriched with shea butter and coconut oil.\n• Contains pro-vitamin B5 and vitamin E.\n• Lightweight, fast-absorbing formula.\n• Leaves hands soft, nourished, and scented.\n• Suitable for daily use and on-the-go hydration.\n• Apply generously and massage until absorbed.",
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060217188392",
    slug: "ilove-raspberry-blackberry-hand-lotion-75ml",
    price: 4500,
    nameAr: "آي لوف - كريم ترطيب اليدين بالتوت العليق والتوت الأسود 75 مل",
    nameEn: "I Love - Raspberry & Blackberry Super Soft Hand Lotion 75 ml",
    descriptionAr:
      "كريم ترطيب لليدين والأظافف للنساء برائحة فاكهية حلوة تجمع بين التوت العليق والتوت الأسود، ويساعد على ترطيب اليدين الجافة وتركها ناعمة ومعطرة.\n\n• يحتوي على زبدة الشيا وزيت جوز الهند المغذيين.\n• يحتوي على مستخلصات فواكه طبيعية.\n• تركيبة ناعمة سريعة الامتصاص.\n• يترك اليدين ناعمة ومرطبة ومعطرة برائحة التوت.\n• مناسب للاستخدام اليومي ويمكن حمله في الحقيبة.\n• يُوزّع على اليدين ويُدلّك حتى الامتصاص.",
    descriptionEn:
      "Moisturising hand and nail lotion for women with a sweet fruity raspberry and blackberry scent. Helps hydrate dry hands and leave them soft, smooth, and delicately fragranced.\n\n• Enriched with shea butter and coconut oil.\n• Contains natural fruit extracts.\n• Lightweight, fast-absorbing formula.\n• Leaves hands soft, nourished, and berry-scented.\n• Suitable for daily use and on-the-go hydration.\n• Apply generously and massage until absorbed.",
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060217188408",
    slug: "ilove-strawberries-cream-hand-lotion-75ml",
    price: 4500,
    nameAr: "آي لوف - كريم ترطيب اليدين بالفراولة والكريمة 75 مل",
    nameEn: "I Love - Strawberries & Cream Super Soft Hand Lotion 75 ml",
    descriptionAr:
      "كريم ترطيب لليدين والأظافف للنساء برائحة حلوة تجمع بين الفراولة الطازجة والكريمة الناعمة، ويساعد على ترطيب اليدين الجافة وتركها ناعمة ومعطرة.\n\n• يحتوي على زبدة الشيا وزيت جوز الهند المغذيين.\n• يحتوي على مستخلصات فواكه طبيعية.\n• تركيبة ناعمة سريعة الامتصاص.\n• يترك اليدين ناعمة ومرطبة ومعطرة برائحة الفراولة والكريمة.\n• مناسب للاستخدام اليومي ويمكن حمله في الحقيبة.\n• يُوزّع على اليدين ويُدلّك حتى الامتصاص.",
    descriptionEn:
      "Moisturising hand and nail lotion for women with a sweet strawberries and cream scent. Helps hydrate dry hands and leave them soft, smooth, and delicately fragranced.\n\n• Enriched with shea butter and coconut oil.\n• Contains natural fruit extracts.\n• Lightweight, fast-absorbing formula.\n• Leaves hands soft, nourished, and sweetly scented.\n• Suitable for daily use and on-the-go hydration.\n• Apply generously and massage until absorbed.",
    categoryId: CARE_ID,
    subcategoryId: HANDS_SUB,
  },
  {
    barcode: "5060849634724",
    slug: "ilove-cherry-bomb-whipped-shower-foam-250ml",
    price: 6500,
    nameAr: "آي لوف - رغوة استحمام مخفوقة تشيري بوم 250 مل",
    nameEn: "I Love - Cherry Bomb Whipped Shower Foam 250 ml",
    descriptionAr:
      "رغوة استحمام مخفوقة للجسم برائحة الكرز الحلو والمنعش، تتحول إلى رغوة كريمية غنية لتنظيف البشرة ومنحها شعوراً بالانتعاش والنعومة.\n\n• رغوة مخفوقة خفيفة وكريمية للاستحمام اليومي.\n• تنظف البشرة بلطف وتتركها ناعمة ومعطرة.\n• مدعّمة بفيتامين E للعناية بالبشرة أثناء التنظيف.\n• يُرجّ العبوة جيداً ويُستخدم رأساً على عقب للحصول على أفضل رغوة.\n• يُرش في اليد ثم يُوزّع على الجسم ويُشطف بالماء.\n• مناسب للاستخدام اليومي ولجميع أنواع البشرة.",
    descriptionEn:
      "Whipped shower foam for the body with a sweet cherry scent. Transforms into a rich creamy lather to gently cleanse the skin and leave it feeling fresh and soft.\n\n• Light, whipped foam for daily shower use.\n• Gently cleanses and leaves skin soft and scented.\n• Enriched with vitamin E for skin care while cleansing.\n• Shake well and use upside down for best foam.\n• Spray into the hand, lather over the body, then rinse.\n• Suitable for daily use on all skin types.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849634786",
    slug: "ilove-cosmic-candy-whipped-shower-foam-250ml",
    price: 6500,
    nameAr: "آي لوف - رغوة استحمام مخفوقة كوزميك كاندي 250 مل",
    nameEn: "I Love - Cosmic Candy Whipped Shower Foam 250 ml",
    descriptionAr:
      "رغوة استحمام مخفوقة للجسم برائحة حلوى كونية حلوة وممتعة، تتحول إلى رغوة كريمية غنية لتنظيف البشرة ومنحها شعوراً بالانتعاش والنعومة.\n\n• رغوة مخفوقة خفيفة وكريمية للاستحمام اليومي.\n• تنظف البشرة بلطف وتتركها ناعمة ومعطرة.\n• مدعّمة بفيتامين E للعناية بالبشرة أثناء التنظيف.\n• يُرجّ العبوة جيداً ويُستخدم رأساً على عقب للحصول على أفضل رغوة.\n• يُرش في اليد ثم يُوزّع على الجسم ويُشطف بالماء.\n• مناسب للاستخدام اليومي ولجميع أنواع البشرة.",
    descriptionEn:
      "Whipped shower foam for the body with a fun cosmic candy scent. Transforms into a rich creamy lather to gently cleanse the skin and leave it feeling fresh and soft.\n\n• Light, whipped foam for daily shower use.\n• Gently cleanses and leaves skin soft and scented.\n• Enriched with vitamin E for skin care while cleansing.\n• Shake well and use upside down for best foam.\n• Spray into the hand, lather over the body, then rinse.\n• Suitable for daily use on all skin types.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849634762",
    slug: "ilove-tropic-like-its-hot-whipped-shower-foam-250ml",
    price: 6500,
    nameAr: "آي لوف - رغوة استحمام مخفوقة تروبيك لايك إتس هوت 250 مل",
    nameEn: "I Love - Tropic Like It's Hot Whipped Shower Foam 250 ml",
    descriptionAr:
      "رغوة استحمام مخفوقة للجسم برائحة استوائية منعشة مستوحاة من أجواء العطلة، تمنح البشرة شعوراً بالانتعاش والنعومة أثناء الاستحمام.\n\n• رغوة مخفوقة خفيفة وكريمية للاستحمام اليومي.\n• تنظف البشرة بلطف وتتركها ناعمة ومعطرة.\n• مدعّمة بفيتامين E للعناية بالبشرة أثناء التنظيف.\n• يُرجّ العبوة جيداً ويُستخدم رأساً على عقب للحصول على أفضل رغوة.\n• يُرش في اليد ثم يُوزّع على الجسم ويُشطف بالماء.\n• مناسب للاستخدام اليومي ولجميع أنواع البشرة.",
    descriptionEn:
      "Whipped shower foam for the body with a fresh tropical holiday-inspired scent. Gently cleanses the skin and leaves it feeling refreshed and smooth.\n\n• Light, whipped foam for daily shower use.\n• Gently cleanses and leaves skin soft and scented.\n• Enriched with vitamin E for skin care while cleansing.\n• Shake well and use upside down for best foam.\n• Spray into the hand, lather over the body, then rinse.\n• Suitable for daily use on all skin types.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060849634748",
    slug: "ilove-meringue-kisses-whipped-shower-foam-250ml",
    price: 6500,
    nameAr: "آي لوف - رغوة استحمام مخفوقة ميرينغ كيسز 250 مل",
    nameEn: "I Love - Meringue Kisses Whipped Shower Foam 250 ml",
    descriptionAr:
      "رغوة استحمام مخفوقة للجسم برائحة حلوة مستوحاة من حلوى الميرانغ، تتحول إلى رغوة كريمية غنية لتنظيف البشرة ومنحها شعوراً بالانتعاش والنعومة.\n\n• رغوة مخفوقة خفيفة وكريمية للاستحمام اليومي.\n• تنظف البشرة بلطف وتتركها ناعمة ومعطرة.\n• مدعّمة بفيتامين E للعناية بالبشرة أثناء التنظيف.\n• يُرجّ العبوة جيداً ويُستخدم رأساً على عقب للحصول على أفضل رغوة.\n• يُرش في اليد ثم يُوزّع على الجسم ويُشطف بالماء.\n• مناسب للاستخدام اليومي ولجميع أنواع البشرة.",
    descriptionEn:
      "Whipped shower foam for the body with a sweet meringue-inspired scent. Transforms into a rich creamy lather to gently cleanse the skin and leave it feeling fresh and soft.\n\n• Light, whipped foam for daily shower use.\n• Gently cleanses and leaves skin soft and scented.\n• Enriched with vitamin E for skin care while cleansing.\n• Shake well and use upside down for best foam.\n• Spray into the hand, lather over the body, then rinse.\n• Suitable for daily use on all skin types.",
    categoryId: CARE_ID,
    subcategoryId: BODY_SUB,
    tertiaryCategoryId: BODY_WASH_TERT,
  },
  {
    barcode: "5060351545181",
    slug: "ilove-elderflower-fizz-body-mist-150ml",
    price: 6500,
    nameAr: "آي لوف - بخاخ معطر للجسم إلدرفلاور فيز 150 مل",
    nameEn: "I Love - Elderflower Fizz Body Mist 150 ml",
    descriptionAr:
      "بخاخ معطر للجسم للنساء برائحة زهرية منعشة مستوحاة من زهرة البيلسان، يمنح الجسم عطراً خفيفاً وحلواً مناسباً للاستخدام اليومي.\n\n• يتميز برائحة زهرية منعشة وحلوة.\n• يحتوي على مستخلصات فواكه طبيعية.\n• تركيبته خفيفة وسريعة الجفاف على البشرة.\n• يمنح الجسم رائحة تدوم لساعات.\n• مناسب للاستخدام اليومي ولتعطير الجسم أو الملابس.\n• يُرش من مسافة مناسبة ويُعاد استخدامه خلال اليوم عند الحاجة.",
    descriptionEn:
      "Scented body mist for women with a fresh, sweet elderflower fragrance. Provides a light, refreshing scent suitable for everyday use.\n\n• Fresh floral elderflower scent.\n• Contains natural fruit extracts.\n• Lightweight, fast-drying formula.\n• Leaves a long-lasting fragrance on the skin.\n• Suitable for daily use on body or clothes.\n• Spray from a distance and reapply as needed.",
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "5060351545235",
    slug: "ilove-glazed-raspberry-body-mist-150ml",
    price: 6500,
    nameAr: "آي لوف - بخاخ معطر للجسم جليزد راسبيري 150 مل",
    nameEn: "I Love - Glazed Raspberry Body Mist 150 ml",
    descriptionAr:
      "بخاخ معطر للجسم للنساء برائحة فاكهية حلوة مستوحاة من التوت العليق المغطى بطبقة سكرية، يمنح الجسم عطراً خفيفاً وجذاباً مناسباً للاستخدام اليومي.\n\n• يتميز برائحة التوت العليق الحلوة والمنعشة.\n• يحتوي على مستخلصات فواكه طبيعية.\n• تركيبته خفيفة وسريعة الجفاف على البشرة.\n• يمنح الجسم رائحة تدوم لساعات.\n• مناسب للاستخدام اليومي ولتعطير الجسم أو الملابس.\n• يُرش من مسافة مناسبة ويُعاد استخدامه خلال اليوم عند الحاجة.",
    descriptionEn:
      "Scented body mist for women with a sweet glazed raspberry fragrance. Provides a light, fruity scent suitable for everyday use.\n\n• Sweet, juicy raspberry scent.\n• Contains natural fruit extracts.\n• Lightweight, fast-drying formula.\n• Leaves a long-lasting fragrance on the skin.\n• Suitable for daily use on body or clothes.\n• Spray from a distance and reapply as needed.",
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "5060351545198",
    slug: "ilove-violet-dreams-body-mist-150ml",
    price: 6500,
    nameAr: "آي لوف - بخاخ معطر للجسم فايوليت دريمز 150 مل",
    nameEn: "I Love - Violet Dreams Body Mist 150 ml",
    descriptionAr:
      "بخاخ معطر للجسم للنساء برائحة زهرية ناعمة مستوحاة من البنفسج، يمنح الجسم عطراً خفيفاً وأنيقاً مناسباً للاستخدام اليومي.\n\n• يتميز برائحة البنفسج الزهرية الناعمة.\n• تركيبته خفيفة وسريعة الجفاف على البشرة.\n• يمنح الجسم رائحة تدوم لساعات.\n• مناسب للاستخدام اليومي ولتعطير الجسم أو الملابس.\n• يأتي بحجم عملي يسهل حمله أثناء التنقل.\n• يُرش من مسافة مناسبة ويُعاد استخدامه خلال اليوم عند الحاجة.",
    descriptionEn:
      "Scented body mist for women with a soft violet floral fragrance. Provides a light, elegant scent suitable for everyday use.\n\n• Soft violet floral scent.\n• Lightweight, fast-drying formula.\n• Leaves a long-lasting fragrance on the skin.\n• Suitable for daily use on body or clothes.\n• Practical size for on-the-go refreshment.\n• Spray from a distance and reapply as needed.",
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "5060351545242",
    slug: "ilove-english-rose-body-mist-150ml",
    price: 6500,
    nameAr: "آي لوف - بخاخ معطر للجسم إنجلش روز 150 مل",
    nameEn: "I Love - English Rose Body Mist 150 ml",
    descriptionAr:
      "بخاخ معطر للجسم للنساء برائحة زهرية رومانسية مستوحاة من الورد الإنجليزي، يجمع بين نفحات الورد الطازج والتوت الأحمر والياسمين مع قاعدة دافئة من العنبر، ويمنح الجسم عطراً خفيفاً وأنيقاً مناسباً للاستخدام اليومي.\n\n• يتميز برائحة الورد الإنجليزي مع التوت والياسمين.\n• يحتوي على مستخلصات فواكه طبيعية.\n• تركيبته خفيفة وسريعة الجفاف على البشرة.\n• يمنح الجسم رائحة تدوم لساعات.\n• مناسب للاستخدام اليومي ولتعطير الجسم أو الملابس.\n• يُرش من مسافة مناسبة ويُعاد استخدامه خلال اليوم عند الحاجة.",
    descriptionEn:
      "Scented body mist for women with a romantic English rose fragrance. Combines fresh rose, red berries, and jasmine with a warm amber base for a light, elegant everyday scent.\n\n• English rose scent with berries and jasmine.\n• Contains natural fruit extracts.\n• Lightweight, fast-drying formula.\n• Leaves a long-lasting fragrance on the skin.\n• Suitable for daily use on body or clothes.\n• Spray from a distance and reapply as needed.",
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
  },
  {
    barcode: "5060351545259",
    slug: "ilove-vanilla-milk-body-mist-150ml",
    price: 6500,
    nameAr: "آي لوف - بخاخ معطر للجسم فانيلا ميلك 150 مل",
    nameEn: "I Love - Vanilla Milk Body Mist 150 ml",
    descriptionAr:
      "بخاخ معطر للجسم للنساء برائحة حلوة دافئة تجمع بين الفانيلا الناعمة ولمسة كريمية من الحليب، يمنح الجسم عطراً خفيفاً ومريحاً مناسباً للاستخدام اليومي.\n\n• يتميز برائحة الفانيلا والحليب الكريمية.\n• يحتوي على مستخلصات فواكه طبيعية.\n• تركيبته خفيفة وسريعة الجفاف على البشرة.\n• يمنح الجسم رائحة تدوم لساعات.\n• مناسب للاستخدام اليومي ولتعطير الجسم أو الملابس.\n• يُرش من مسافة مناسبة ويُعاد استخدامه خلال اليوم عند الحاجة.",
    descriptionEn:
      "Scented body mist for women with a warm sweet vanilla milk fragrance. Provides a light, comforting scent suitable for everyday use.\n\n• Sweet vanilla and creamy milk scent.\n• Contains natural fruit extracts.\n• Lightweight, fast-drying formula.\n• Leaves a long-lasting fragrance on the skin.\n• Suitable for daily use on body or clothes.\n• Spray from a distance and reapply as needed.",
    categoryId: PERFUME_ID,
    subcategoryId: BODY_MIST_SUB,
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
      console.log(`✓ ${created.name} (${p.barcode})`);
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
