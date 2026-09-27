/**
 * Beesline — 12 remaining products (no shades, with images).
 * Source: beesline.com CDN, pharmacoline.com, elryan.com, go-upc.com
 * Usage: npx tsx scripts/add-beesline-batch12-remaining-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const CARE_FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const CLEANSERS = "05028a17-da64-4c66-b25f-73c758acc2f8";
const FACE_MOIST = "21801439-d0e9-4106-b5e8-dfdd70ffeb8d";

const SHOPIFY = "https://cdn.shopify.com/s/files/1/0723/0321/4747/files";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5281018951569",
    slug: "beesline-whitening-facial-soap-classic",
    sku: "BEE-951569",
    price: 8000,
    originalPrice: 8000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "بيزلاين - صابونة تفتيح الوجه الكلاسيكية 85 جم",
    nameEn: "Beesline - Whitening Facial Soap Classic 85g",
    descriptionAr:
      "صابونة تفتيح كلاسيكية للوجه من بيزلاين — تركيبة طبيعية بالعسل والغليسرين النباتي.\n\n" +
      "• تنظف بعمق وترطب وتفتّح لون البشرة.\n• توحّد لون البشرة وتمنح إشراقاً طبيعياً.\n• مناسبة للبشرة العادية والجافة والحساسة.\n• 85 جم.",
    descriptionEn:
      "Beesline Classic Whitening Facial Soap — natural honey and vegetable glycerin formula.\n\n" +
      "• Deeply cleanses, moisturizes and brightens skin tone.\n• Evens complexion for a natural radiance.\n• Suitable for normal, dry and sensitive skin.\n• 85g bar.",
    imageUrls: [
      `${SHOPIFY}/whitening_facial_soap.webp`,
      "https://i0.wp.com/www.pharmacoline.com/wp-content/uploads/2021/01/whitening-soap.jpg?fit=1000%2C1000&ssl=1",
    ],
  },
  {
    barcode: "5281018953310",
    slug: "beesline-whitening-mud-soap",
    sku: "BEE-953310",
    price: 8000,
    originalPrice: 8000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "بيزلاين - صابونة الطين المفتحة للوجه 85 جم",
    nameEn: "Beesline - Whitening Mud Soap 85g",
    descriptionAr:
      "صابونة طين مفتحة للوجه من بيزلاين — للبشرة الدهنية والمعرضة لحب الشباب.\n\n" +
      "• تمتص الزهم الزائد وتنظف المسام بعمق.\n• تفتّح البشرة وتقلّل اللمعان.\n• طين طبيعي مع عسل بيزلاين.\n• 85 جم.",
    descriptionEn:
      "Beesline Whitening Mud Soap — clay formula for oily and acne-prone skin.\n\n" +
      "• Absorbs excess sebum and deeply cleanses pores.\n• Brightens skin and reduces shine.\n• Natural clay with Beesline honey.\n• 85g bar.",
    imageUrls: [
      "https://i0.wp.com/www.pharmacoline.com/wp-content/uploads/2021/01/mud-soap.png?fit=488%2C434&ssl=1",
    ],
  },
  {
    barcode: "5281018717264",
    slug: "beesline-everyone-barrier-cream-50ml",
    sku: "BEE-717264",
    price: 28000,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - كريم Everyone Barrier لإصلاح حاجز البشرة 50 مل",
    nameEn: "Beesline - Everyone Barrier Cream 50ml",
    descriptionAr:
      "كريم إصلاح حاجز البشرة من خط Everyone — 5 أنواع سيراميد.\n\n" +
      "• يعزّز ويُصلح حاجز البشرة الضعيف.\n• يرطّب بعمق ويهدّئ البشرة الحساسة.\n• تركيبة خفيفة مناسبة للاستخدام اليومي.\n• 50 مل.",
    descriptionEn:
      "Beesline Everyone Barrier Cream — barrier repair with 5 ceramides.\n\n" +
      "• Strengthens and repairs a weakened skin barrier.\n• Deep hydration and soothing for sensitive skin.\n• Lightweight daily formula.\n• 50ml.",
    imageUrls: [
      `${SHOPIFY}/everyone_barrier_cream.webp`,
      `${SHOPIFY}/everyone_barrier_cream_2.webp`,
      `${SHOPIFY}/everyone_barrier_cream_3.webp`,
    ],
  },
  {
    barcode: "5281018717288",
    slug: "beesline-adaptogen-barrier-cream-50ml",
    sku: "BEE-717288",
    price: 28000,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - كريم Adaptogen Barrier للبشرة الجافة والحساسة 50 مل",
    nameEn: "Beesline - Adaptogen Barrier Cream 50ml",
    descriptionAr:
      "كريم حاجز البشرة Adaptogen — للبشرة الجافة والحساسة.\n\n" +
      "• مستخلصات adaptogen تهدئ وتحمي البشرة.\n• يعيد التوازن ويرطّب بعمق.\n• يُصلح الحاجز الجلدي ويقلّل الجفاف.\n• 50 مل.",
    descriptionEn:
      "Beesline Adaptogen Barrier Cream — for dry and sensitive skin.\n\n" +
      "• Adaptogen extracts soothe and protect.\n• Restores balance and deep hydration.\n• Repairs skin barrier and reduces dryness.\n• 50ml.",
    imageUrls: [
      `${SHOPIFY}/adaptogen_barrier_cream.webp`,
      `${SHOPIFY}/adaptogen_barrier_cream_2.webp`,
      `${SHOPIFY}/adaptogen_barrier_cream_3.webp`,
    ],
  },
  {
    barcode: "5281018717240",
    slug: "beesline-future-barrier-cream-50ml",
    sku: "BEE-717240",
    price: 30000,
    originalPrice: 30000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - كريم Future Barrier المضاد للتجاعيد 50 مل",
    nameEn: "Beesline - Future Barrier Cream 50ml",
    descriptionAr:
      "كريم Future Barrier المضاد للشيخوخة من بيزلاين — يعزّز حاجز البشرة ويحارب علامات التقدّم.\n\n" +
      "• يُصلح الحاجز الجلدي ويحسّن مرونة البشرة.\n• يقلّل الخطوط الدقيقة ويوحّد الملمس.\n• تركيبة غنية ومغذّية للبشرة الناضجة.\n• 50 مل.",
    descriptionEn:
      "Beesline Future Barrier Cream — anti-aging barrier repair.\n\n" +
      "• Repairs skin barrier and improves elasticity.\n• Reduces fine lines and evens texture.\n• Rich nourishing formula for mature skin.\n• 50ml.",
    imageUrls: [
      `${SHOPIFY}/future_barrier_cream.webp`,
      `${SHOPIFY}/future_barrier_cream_2.webp`,
      `${SHOPIFY}/future_barrier_cream_3.webp`,
    ],
  },
  {
    barcode: "5281018087619",
    slug: "beesline-whitening-intimate-zone-routine-set",
    sku: "BEE-087619",
    price: 25000,
    originalPrice: 25000,
    categoryId: CARE,
    subcategoryId: BODY,
    nameAr: "بيزلاين - طقم روتين تفتيح المناطق الحساسة",
    nameEn: "Beesline - Whitening Intimate Zone Routine Set",
    descriptionAr:
      "طقم عناية متكامل لتفتيح المناطق الحساسة من بيزلاين.\n\n" +
      "• يشمل منتجات مكملة للعناية اليومية.\n• يفتّح ويوحّد لون البشرة في المناطق الدقيقة.\n• تركيبة لطيفة ومناسبة للبشرة الحساسة.\n• طقم هدايا/عناية.",
    descriptionEn:
      "Beesline Whitening Intimate Zone Routine Set — complete care kit.\n\n" +
      "• Complementary products for daily intimate care.\n• Brightens and evens skin tone in delicate areas.\n• Gentle formula for sensitive skin.\n• Care/gift set.",
    imageUrls: [`${SHOPIFY}/whitening_intimate_zone_routine.webp`],
  },
  {
    barcode: "5281018715383",
    slug: "beesline-sebum-control-balancing-serum-30ml",
    sku: "BEE-715383",
    price: 28000,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - سيروم توازن الزهم Sebum-Control 30 مل",
    nameEn: "Beesline - Sebum-Control Balancing Serum 30ml",
    descriptionAr:
      "سيروم توازن الزهم من بيزلاين — 2% ساليسيليك أسيد و2.5% لاكتيك أسيد.\n\n" +
      "• ينظّم إفراز الزهم ويصغّر المسام.\n• يقشر بلطف ويقلّل حب الشباب.\n• للبشرة الدهنية والمختلطة.\n• 30 مل.",
    descriptionEn:
      "Beesline Sebum-Control Balancing Serum — 2% salicylic + 2.5% lactic acid.\n\n" +
      "• Regulates sebum and minimizes pores.\n• Gentle exfoliation for acne-prone skin.\n• For oily and combination skin.\n• 30ml.",
    imageUrls: [
      `${SHOPIFY}/sebum_control_balancing_1.webp`,
      `${SHOPIFY}/sebum_control_balancing_2.webp`,
      `${SHOPIFY}/sebum_control_balancing_3.webp`,
    ],
  },
  {
    barcode: "5281018715437",
    slug: "beesline-unifying-brightening-serum-30ml",
    sku: "BEE-715437",
    price: 30000,
    originalPrice: 30000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - سيروم التفتيح الموحّد فيتامين C 15% 30 مل",
    nameEn: "Beesline - Unifying Brightening Serum 15% Vitamin C 30ml",
    descriptionAr:
      "سيروم تفتيح موحّد بتركيز 15% فيتامين C من بيزلاين.\n\n" +
      "• يفتّح البقع الداكنة ويوحّد لون البشرة.\n• مضاد قوي للأكسدة يمنح إشراقاً فورياً.\n• للبشرة الباهتة والمصابة بالتصبغات.\n• 30 مل.",
    descriptionEn:
      "Beesline Unifying Brightening Serum — 15% vitamin C concentrate.\n\n" +
      "• Lightens dark spots and evens skin tone.\n• Powerful antioxidant for instant radiance.\n• For dull and hyperpigmented skin.\n• 30ml.",
    imageUrls: [
      `${SHOPIFY}/unifying_brightening_1.webp`,
      `${SHOPIFY}/unifying_brightening_2.webp`,
      `${SHOPIFY}/unifying_brightening_3.webp`,
    ],
  },
  {
    barcode: "5281018715406",
    slug: "beesline-super-hydrating-serum-30ml",
    sku: "BEE-715406",
    price: 28000,
    originalPrice: 28000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - سيروم الترطيب الفائق 30 مل",
    nameEn: "Beesline - Super Hydrating Serum 30ml",
    descriptionAr:
      "سيروم ترطيب فائق من بيزلاين — هيالورونيك أسيد وببتيدات.\n\n" +
      "• ترطيب مكثّف يعيد نعومة البشرة.\n• يعزّز مرونة البشرة ويملأ الخطوط الدقيقة.\n• للبشرة الجافة والمجهدة.\n• 30 مل.",
    descriptionEn:
      "Beesline Super Hydrating Serum — hyaluronic acid and peptides.\n\n" +
      "• Intensive hydration restores skin softness.\n• Boosts elasticity and plumps fine lines.\n• For dry and dehydrated skin.\n• 30ml.",
    imageUrls: [
      `${SHOPIFY}/super_hydrating_1.webp`,
      `${SHOPIFY}/super_hydrating_2.webp`,
      `${SHOPIFY}/super_hydrating_3.webp`,
    ],
  },
  {
    barcode: "5281018715390",
    slug: "beesline-anti-wrinkle-radiance-serum-30ml",
    sku: "BEE-715390",
    price: 30000,
    originalPrice: 30000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: FACE_MOIST,
    nameAr: "بيزلاين - سيروم مضاد التجاعيد والإشراق 30 مل",
    nameEn: "Beesline - Anti-Wrinkle & Radiance Serum 30ml",
    descriptionAr:
      "سيروم مضاد للتجاعيد والإشراق من بيزلاين — ريتينول ومكونات نشطة.\n\n" +
      "• يقلّل التجاعيد والخطوط الدقيقة.\n• يمنح البشرة إشراقاً ونعومة.\n• للبشرة الناضجة والباهتة.\n• 30 مل.",
    descriptionEn:
      "Beesline Anti-Wrinkle & Radiance Serum — retinol and active ingredients.\n\n" +
      "• Reduces wrinkles and fine lines.\n• Restores radiance and smoothness.\n• For mature and dull skin.\n• 30ml.",
    imageUrls: [
      `${SHOPIFY}/anti_wrinkle_and_radiance_1.webp`,
      `${SHOPIFY}/anti_wrinkle_and_radiance_2.webp`,
      `${SHOPIFY}/anti_wrinkle_and_radiance_3.webp`,
    ],
  },
  {
    barcode: "5281018881330",
    slug: "beesline-4in1-whitening-cleanser-150ml",
    sku: "BEE-881330",
    price: 22000,
    originalPrice: 22000,
    categoryId: CARE,
    subcategoryId: CARE_FACE,
    tertiaryCategoryId: CLEANSERS,
    nameAr: "بيزلاين - غسول تفتيح 4 في 1 150 مل",
    nameEn: "Beesline - 4in1 Whitening Cleanser 150ml",
    descriptionAr:
      "غسول تفتيح متعدد الاستخدامات 4 في 1 من بيزلاين.\n\n" +
      "• غسول + مقشر + ماسك + تفتيح في منتج واحد.\n• ينظف بعمق ويفتّح ويوحّد لون البشرة.\n• للاستخدام اليومي على الوجه.\n• 150 مل.",
    descriptionEn:
      "Beesline 4in1 Whitening Cleanser — wash, scrub, mask and whitening in one.\n\n" +
      "• Cleanser + exfoliator + mask + brightening action.\n• Deep cleanse with tone-evening benefits.\n• For daily facial use.\n• 150ml.",
    imageUrls: [
      `${SHOPIFY}/4in1_whitening_cleanser.webp`,
      "https://i0.wp.com/www.pharmacoline.com/wp-content/uploads/2021/01/Whitening-Cleanser.jpg?fit=600%2C600&ssl=1",
    ],
  },
  {
    barcode: "5281018035054",
    slug: "beesline-xy-super-gel-150ml",
    sku: "BEE-035054",
    price: 15000,
    originalPrice: 15000,
    categoryId: CARE,
    subcategoryId: BODY,
    nameAr: "بيزلاين - جل XY Super للمناطق الحساسة 150 مل",
    nameEn: "Beesline - XY Super Gel 150ml",
    descriptionAr:
      "جل XY Super من بيزلاين — جل مزلق للمناطق الحساسة.\n\n" +
      "• تركيبة بالجينسنغ وفيتامين E.\n• يرطّب ويلطّف البشرة الحساسة.\n• مناسب للاستخدام اليومي.\n• 150 مل.",
    descriptionEn:
      "Beesline XY Super Gel — intimate lubricant gel.\n\n" +
      "• Ginseng and vitamin E formula.\n• Moisturizes and soothes sensitive skin.\n• Suitable for daily use.\n• 150ml.",
    imageUrls: [
      "https://www.elryan.com/img/600/600/resize/catalog/product/a/d/adb68907-227a-46a0-a7ca-0e14a81e977f-13177.jpg",
    ],
  },
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
    brandAr: "بيزلاين",
    brandEn: "Beesline",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Beesline brand");
  return id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) throw new Error(`not an image (${contentType || "unknown"})`);

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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, with images)\n`);
  await login();
  const brandId = await resolveBrand();
  console.log(`Brand: Beesline (${brandId})\n`);

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${product.barcode}`,
    );
    if (check.exists) {
      console.log(`  skip — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    console.log(`  uploading images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      try {
        imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
      } catch (err) {
        console.log(`  image ${i + 1} failed: ${(err as Error).message}`);
      }
    }
    if (!imageIds.length) throw new Error(`No images uploaded for ${product.barcode}`);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      ...(product.tertiaryCategoryId ? { tertiaryCategoryId: product.tertiaryCategoryId } : {}),
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: 0,
      isActive: true,
      imageIds,
    });

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    ID: ${created.id} | images: ${imageIds.length} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
