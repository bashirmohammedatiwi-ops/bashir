/**
 * Essence loose powders — 4 separate barcode products.
 * Usage: npx tsx scripts/add-essence-loose-powders-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "4059729348319",
    slug: "essence-banana-loose-powder",
    price: 6000,
    nameAr: "إيسنس - بودرة سائبة موزة ٦ جرام",
    nameEn: "Essence - Banana Loose Powder 6 g",
    descriptionAr:
      "بودرة سائبة موزة من إيسنس — بودرة فائقة النعومة بلون أصفر ناعم لتثبيت المكياج وإبراز الوجه بلمعة مطفية.\n\n" +
      "• بودرة سائبة فائقة النعومة بلون أصفر ناعم ودرجة عالمية.\n• تُستخدم لتثبيت المكياج وتقنية باكينج الكونسيلر.\n• مثالية لإبراز عظام الخد والجبين وجسر الأنف وقوس كيوبيد.\n• قوام خفيف جداً خالٍ من الزيوت المعدنية والتالك.\n• تصحيح لوني ومطفي وتثبيت وامتصاص لمعان وتأثير سوفت فوكس.\n• تُرفق مع إسفنجة لإعادة تثبيت الإطلالة في أي وقت.\n• خالٍ من البارابين والعطور والكحول والزيوت والغلوتين واللاكتوز.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق بفرشاة بودرة مع نفض الفائض على ظهر اليد.",
    descriptionEn:
      "Essence Banana Loose Powder — ultra-fine soft yellow powder for setting makeup, baking and matte highlighting.\n\n" +
      "• Ultra-fine loose powder in a soft yellow universal shade.\n• Ideal for setting makeup and the concealer baking technique.\n• Perfect for matte highlights on cheekbones, forehead, bridge of the nose and cupid's bow.\n• Weightless texture formulated without mineral oil and talc.\n• Colour-correcting, mattifying, setting, shine-absorbing and soft-focus effect.\n• Includes a sponge to refresh your look anytime.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free, gluten-free and lactose-free.\n• Cruelty-free.\n• Apply with a powder brush and tap off excess on the back of your hand.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/9/c94e2f336dbf505cad69d3fbbb35297962ff9555_4059729348319_bi_essence_banana_loose_powder.jpg",
  },
  {
    barcode: "4059729584519",
    slug: "essence-silky-blur-translucent-loose-setting-powder-10",
    price: 6000,
    nameAr: "إيسنس - بودرة سائبة سيلكي بلور ثابتة شفافة رقم ١٠ ٩ جرام",
    nameEn: "Essence - Silky Blur Translucent Loose Setting Powder 10 9 g",
    descriptionAr:
      "بودرة سائبة سيلكي بلور ثابتة شفافة من إيسنس بالدرجة ١٠ — بودرة هوائية بلون خوخي ناعم تثبّت المكياج وتمنح بشرة مطفية ناعمة دون فلاش باك.\n\n" +
      "• بودرة شفافة هوائية بلون خوخي ناعم تناسب البشرات الداكنة.\n• تمنح إشراقة طبيعية وتتكيّف مع درجات البشرة.\n• قوام حريري خفيف ينزلق بسهولة ويُمهّد البشرة.\n• تُخفّي العيوب وتثبّت المكياج بلمسة مطفية ناعمة.\n• مظهر ناعم ومتقن في جميع الإضاءات دون فلاش باك.\n• خالٍ من البارابين والعطور والكحول والغلوتين واللاكتوز.\n• نباتي.\n• يُوزّع بفرشاة بودرة مع نفض الفائض ثم يُمرّر بلطف على الوجه.",
    descriptionEn:
      "Essence Silky Blur Translucent Loose Setting Powder 10 — airy translucent powder in a soft peach tone for a refined matte, blurred finish.\n\n" +
      "• Airy translucent powder in a soft peach tone that harmonises with deeper skin tones.\n• Adds radiance and adapts to different skin tones for a natural finish.\n• Silky, feather-light formula glides effortlessly over the skin.\n• Blurs imperfections and sets makeup with a smoothing effect.\n• Refined matte finish with no flashback in any light.\n• Vegan, paraben-free, fragrance-free, alcohol-free, gluten-free and lactose-free.\n• Apply evenly with a powder brush, tap off excess and gently sweep over the face.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/7/d74c7a6320b81229c0920a0ce619eb9accc2e377_4059729584519_bi_essence_silky_blur_translucent_loose_setting_powder_10.jpg",
  },
  {
    barcode: "4059729382665",
    slug: "essence-fix-last-14h-makeup-fixing-loose-powder",
    price: 6750,
    nameAr: "إيسنس - بودرة سائبة ثابتة للمكياج فيكس آند لاست ١٤ ساعة ١٠ جرام",
    nameEn: "Essence - Fix & Last 14H Make-Up Fixing Loose Powder 10 g",
    descriptionAr:
      "بودرة سائبة ثابتة للمكياج فيكس آند لاست من إيسنس — تثبّت المكياج حتى ١٤ ساعة بتركيبة مقاومة للماء ولمسة مطفية خفيفة.\n\n" +
      "• بودرة سائبة لتثبيت المكياج تدوم حتى ١٤ ساعة.\n• مقاومة للماء.\n• تمتص الزيوت الزائدة وتمنح لمسة مطفية.\n• بشرة أكثر تجانساً ونعومة.\n• قوام خفيف جداً ومريح على البشرة.\n• تثبيت فوري وطويل الأمد وامتصاص للمعان.\n• خالٍ من البارابين والعطور والكحول والزيوت والغلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• مثالية للبشرة الدهنية والعادية.",
    descriptionEn:
      "Essence Fix & Last 14H Make-Up Fixing Loose Powder — waterproof setting powder for up to 14 hours of hold with a feather-light matte finish.\n\n" +
      "• Loose setting powder with 14-hour hold.\n• Waterproof formula.\n• Absorbs excess oil for a matte, even-looking complexion.\n• Feather-light, comfortable feel on the skin.\n• Instant setting, long-lasting and shine-absorbing effect.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free and gluten-free.\n• Cruelty-free.\n• Ideal for oily and normal skin types.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/b/f/bfd0dc289a4d8c5105caf2247be74ff6889913aa_4059729382665_bi_essence_fix_last_14h_make_up_fixing_loose_powder.jpg",
  },
  {
    barcode: "4059729404725",
    slug: "essence-brighten-up-banana-powder",
    price: 5250,
    nameAr: "إيسنس - بودرة موزة برايتن آب ٩ جرام",
    nameEn: "Essence - Brighten Up! Banana Powder 9 g",
    descriptionAr:
      "بودرة موزة برايتن آب من إيسنس — بودرة شفافة مطفية بلون أصفر ناعم جداً لإبراز الوجه وتقنية باكينج الكونسيلر.\n\n" +
      "• بودرة شفافة مطفية بلون موز أصفر ناعم.\n• تُبرز الوجه بلمعة مطفية ناعمة.\n• مثالية لتقنية باكينج الكونسيلر.\n• تغطية خفيفة ومظهر طبيعي.\n• خالٍ من البارابين والعطور والكحول والزيوت والغلوتين.\n• نباتي ولم يُختبر على الحيوانات.\n• مناسبة للبشرة المختلطة والدهنية.\n• يُطبّق بفرشاة بودرة على المناطق المراد إبرازها أو تثبيتها.",
    descriptionEn:
      "Essence Brighten Up! Banana Powder — translucent mattifying powder in a very soft yellow for baking and matte highlighting.\n\n" +
      "• Translucent mattifying banana powder in a very soft yellow.\n• Creates matte highlights on the face.\n• Perfect for the concealer baking technique.\n• Light coverage with a natural finish.\n• Vegan, paraben-free, fragrance-free, alcohol-free, oil-free and gluten-free.\n• Cruelty-free.\n• Suitable for combination and oily skin.\n• Apply with a powder brush to set or brighten targeted areas.",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/d/9d5a2cd8d79953c96318c0c0fa9e4f9b73b98dcb_4059729404725_bi_essence_brighten_up_banana_powder.jpg",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? "";
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

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  let added = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const check = await api<{ exists: boolean; product?: { nameAr?: string; id?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId: BRAND_ID,
      categoryId: CATEGORY_ID,
      subcategoryId: FACE,
      tertiaryCategoryId: POWDER,
      subcategoryIds: [FACE],
      tertiaryCategoryIds: [POWDER],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: p.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    });

    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
