/**
 * Deborah Milano — 10 separate single-SKU products (no shades).
 * Sources: deborahmilano.com (verified names, descriptions)
 * Images: brocard.ua, econviene.it, lyko.com, dm-drogeriemarkt.it
 * Usage: npx tsx scripts/add-deborah-batch-10-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const EYEBROW_GEL = "a6620b04-09ee-427c-a195-5b0626276fc9";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BRONZER = "209555fb-201d-457f-9ac6-7cf1ea277bff";

const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";
const ECONVIENE = "https://www.econviene.it/media/catalog/product/8/0";
const LYKO = "https://lyko.com/globalassets/product-images";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "8009518376364",
    slug: "deborah-color-moods-palette-daylight-02",
    sku: "DBR-CMP-376364",
    price: 17500,
    nameAr: "ديبورا ميلانو - باليت ظلال عيون Color Moods Palette Daylight 02",
    nameEn: "Deborah Milano - Color Moods Palette Daylight 02",
    descriptionAr:
      "باليت ظلال عيون Color Moods Palette Daylight 02 من ديبورا ميلانو — 8 درجات بإنهاءات mat وshimmer وmetallic.\n\n" +
      "• درجات بيج وبني طبيعية مستوحاة من ضوء النهار.\n" +
      "• تركيبة غنية بزيت المشمش — قابلة للدمج بسهولة.\n" +
      "• تتضمن فرشاة مزدوجة للتطبيق والدمج.\n" +
      "• مناسبة لكل المزاجات والمناسبات.",
    descriptionEn:
      "Deborah Milano Color Moods Palette Daylight 02 — 8 eyeshadow shades in MAT, SHIMMER and METALLIC finishes.\n\n" +
      "• Natural beige and brown tones inspired by daylight.\n" +
      "• Apricot oil-enriched, sensorial texture that blends with ease.\n" +
      "• Includes a double-ended brush for application and blending.\n" +
      "• Perfect allies for infinite make-up alternatives.",
    imageUrls: [
      `${BROCARD}/8009518376364_1.jpg`,
      `${ECONVIENE}/8009518376364.jpg`,
      `${ECONVIENE}/8009518376364_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
  },
  {
    barcode: "8009518376401",
    slug: "deborah-color-moods-palette-moonlight-04",
    sku: "DBR-CMP-376401",
    price: 17500,
    nameAr: "ديبورا ميلانو - باليت ظلال عيون Color Moods Palette Moonlight 04",
    nameEn: "Deborah Milano - Color Moods Palette Moonlight 04",
    descriptionAr:
      "باليت ظلال عيون Color Moods Palette Moonlight 04 من ديبورا ميلانو — 8 درجات بإنهاءات mat وshimmer وmetallic.\n\n" +
      "• درجات بنفسجية وزرقاء مستوحاة من ضوء القمر.\n" +
      "• تركيبة غنية بزيت المشمش — قابلة للدمج بسهولة.\n" +
      "• تتضمن فرشاة مزدوجة للتطبيق والدمج.\n" +
      "• مناسبة لإطلالات مسائية جريئة.",
    descriptionEn:
      "Deborah Milano Color Moods Palette Moonlight 04 — 8 eyeshadow shades in MAT, SHIMMER and METALLIC finishes.\n\n" +
      "• Lilac and blue tones inspired by moonlight.\n" +
      "• Apricot oil-enriched, sensorial texture that blends with ease.\n" +
      "• Includes a double-ended brush for application and blending.\n" +
      "• Ideal for bold evening looks.",
    imageUrls: [
      `${BROCARD}/8009518376401_1.jpg`,
      `${ECONVIENE}/8009518376401.jpg`,
      `${ECONVIENE}/8009518376401_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYESHADOW,
  },
  {
    barcode: "8009518474107",
    slug: "deborah-face-trio-palette-contour-sculpt-light-01",
    sku: "DBR-FTP-474107",
    price: 16500,
    nameAr: "ديبورا ميلانو - باليت وجه Face Trio Palette Contour & Sculpt Light 01",
    nameEn: "Deborah Milano - Face Trio Palette Contour & Sculpt Light 01",
    descriptionAr:
      "باليت Face Trio Palette Contour & Sculpt Light 01 من ديبورا ميلانو — لتحديد ونحت الملامح.\n\n" +
      "• برونزران مطفيان: الداكن للنحت والفاتح للإبراز.\n" +
      "• بلاشر لامع لإضافة لون وإشراقة صحية.\n" +
      "• قوام حريري عالي التصبغ وقابل للدمج.\n" +
      "• 4 g — خاضع للاختبار الجلدي.",
    descriptionEn:
      "Deborah Milano Face Trio Palette Contour & Sculpt Light 01 — face contouring palette for light skin tones.\n\n" +
      "• Two matte bronzers: darker to sculpt, lighter to highlight.\n" +
      "• Frosted blush adds colour and a healthy glow.\n" +
      "• Silky soft, highly pigmented textures blend beautifully.\n" +
      "• 4 g — Dermatologist tested.",
    imageUrls: [
      `${ECONVIENE}/8009518474107.jpg`,
      `${ECONVIENE}/8009518474107_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BRONZER,
  },
  {
    barcode: "8009518482485",
    slug: "deborah-24ore-extra-brow-fixing-gel",
    sku: "DBR-EBFG-482485",
    price: 12500,
    nameAr: "ديبورا ميلانو - جل تثبيت حواجب 24Ore Extra Brow Fixing Gel",
    nameEn: "Deborah Milano - 24Ore Extra Brow Fixing Gel",
    descriptionAr:
      "جل تثبيت حواجب 24Ore Extra Brow Fixing Gel من ديبورا ميلانو — شفاف وخفيف وطويل الثبات.\n\n" +
      "• يمنح مظهر حواجب laminated فوراً.\n" +
      "• قوام قابل للبناء — من لمسة ناعمة إلى إطلالة جريئة.\n" +
      "• أداة تطبيق مريحة بدون تكتل أو لزوجة.\n" +
      "• يثبّت الحواجب حتى 12 ساعة.\n" +
      "• 7 ml.",
    descriptionEn:
      "Deborah Milano 24Ore Extra Brow Fixing Gel — clear, lightweight, long-wearing brow setting gel.\n\n" +
      "• Creates an instant laminated brow look.\n" +
      "• Buildable texture for soft and subtle or bold and dramatic brows.\n" +
      "• Ergonomic applicator with no clumping or stickiness.\n" +
      "• Flawlessly frames the face for up to 12 hours.\n" +
      "• 7 ml.",
    imageUrls: [
      `${BROCARD}/8009518482485_1.jpg`,
      `${BROCARD}/8009518482485_2.jpg`,
      `${ECONVIENE}/8009518482485.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: EYEBROW_GEL,
  },
  {
    barcode: "8009518477474",
    slug: "deborah-hydracolor-shine-no-2-rosewood",
    sku: "DBR-HS-477474",
    price: 8800,
    nameAr: "ديبورا ميلانو - بلسم شفاه Hydracolor Shine No. 2 Rosewood",
    nameEn: "Deborah Milano - Hydracolor Shine No. 2 Rosewood",
    descriptionAr:
      "بلسم شفاه Hydracolor Shine No. 2 Rosewood من ديبورا ميلانو — الأصلي «كريم في عصا» بلمعة لؤلؤية.\n\n" +
      "• يغذّي ويحمي ويُلوّن الشفاه بلمسة خفيفة.\n" +
      "• غني باللآلئ لمظهر لامع متألّق.\n" +
      "• تركيبة كريمية برائحة الفانيليا الخفيفة.\n" +
      "• SPF 25 لحماية الشفاه من أشعة UVA وUVB.\n" +
      "• 3.6 g — خاضع للاختبار الجلدي.",
    descriptionEn:
      "Deborah Milano Hydracolor Shine No. 2 Rosewood — the original “cream in a stick” with a pearly shine finish.\n\n" +
      "• Nourishes, protects and lightly colours the lips.\n" +
      "• Enriched with pearls for a sparkling, shiny result.\n" +
      "• Rich creamy formula delicately scented with vanilla.\n" +
      "• SPF 25 helps protect lips from UVA and UVB rays.\n" +
      "• 3.6 g — Dermatologist tested.",
    imageUrls: [
      `${LYKO}/hydracolor-shine-no.-2-rosewood-1018-101-0002_1.jpg`,
      `${LYKO}/hydracolor-shine-no.-2-rosewood-1018-101-0002_2.jpg`,
      `${LYKO}/hydracolor-shine-no.-2-rosewood-1018-101-0002_3.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
  },
  {
    barcode: "8009518477511",
    slug: "deborah-hydracolor-shine-no-4-summer-bronze",
    sku: "DBR-HS-477511",
    price: 8800,
    nameAr: "ديبورا ميلانو - بلسم شفاه Hydracolor Shine No. 4 Summer Bronze",
    nameEn: "Deborah Milano - Hydracolor Shine No. 4 Summer Bronze",
    descriptionAr:
      "بلسم شفاه Hydracolor Shine No. 4 Summer Bronze من ديبورا ميلانو — الأصلي «كريم في عصا» بلمعة لؤلؤية.\n\n" +
      "• يغذّي ويحمي ويُلوّن الشفاه بلمسة خفيفة.\n" +
      "• غني باللآلئ لمظهر لامع متألّق.\n" +
      "• تركيبة كريمية برائحة الفانيليا الخفيفة.\n" +
      "• SPF 25 لحماية الشفاه من أشعة UVA وUVB.\n" +
      "• 3.6 g — خاضع للاختبار الجلدي.",
    descriptionEn:
      "Deborah Milano Hydracolor Shine No. 4 Summer Bronze — the original “cream in a stick” with a pearly shine finish.\n\n" +
      "• Nourishes, protects and lightly colours the lips.\n" +
      "• Enriched with pearls for a sparkling, shiny result.\n" +
      "• Rich creamy formula delicately scented with vanilla.\n" +
      "• SPF 25 helps protect lips from UVA and UVB rays.\n" +
      "• 3.6 g — Dermatologist tested.",
    imageUrls: [
      `${LYKO}/hydracolor-shine-no.-4-summer-bronze-1018-101-0004_1.jpg`,
      `${LYKO}/hydracolor-shine-no.-4-summer-bronze-1018-101-0004_2.jpg`,
      `${LYKO}/hydracolor-shine-no.-4-summer-bronze-1018-101-0004_3.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
  },
  {
    barcode: "8009518125580",
    slug: "deborah-hydracolor-no-23-rose",
    sku: "DBR-HC-125580",
    price: 8000,
    nameAr: "ديبورا ميلانو - بلسم شفاه Hydracolor No. 23 Rose",
    nameEn: "Deborah Milano - Hydracolor No. 23 Rose",
    descriptionAr:
      "بلسم شفاه Hydracolor No. 23 Rose من ديبورا ميلانو — الأصلي «كريم في عصا».\n\n" +
      "• يغذّي كالكريم ويُلوّن كأحمر الشفاه.\n" +
      "• زيت فاكهة الآلام مع SPF 25 لحماية UVA وUVB.\n" +
      "• تركيبة كريمية مريحة برائحة الفانيليا.\n" +
      "• خالٍ من البارابين — خاضع للاختبار الجلدي.\n" +
      "• 3.6 g.",
    descriptionEn:
      "Deborah Milano Hydracolor No. 23 Rose — the original “cream in a stick” lip care.\n\n" +
      "• Nourishes like a cream and colours like a lipstick.\n" +
      "• Passion fruit oil with SPF 25 UVA-UVB protection.\n" +
      "• Rich creamy formula delicately scented with vanilla.\n" +
      "• Paraben free — Dermatologist tested.\n" +
      "• 3.6 g.",
    imageUrls: [
      `${ECONVIENE}/8009518125580.jpg`,
      `${ECONVIENE}/8009518125580_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
  },
  {
    barcode: "8009518125603",
    slug: "deborah-hydracolor-no-25-glicine",
    sku: "DBR-HC-125603",
    price: 8000,
    nameAr: "ديبورا ميلانو - بلسم شفاه Hydracolor No. 25 Glicine",
    nameEn: "Deborah Milano - Hydracolor No. 25 Glicine",
    descriptionAr:
      "بلسم شفاه Hydracolor No. 25 Glicine من ديبورا ميلانو — الأصلي «كريم في عصا».\n\n" +
      "• يغذّي كالكريم ويُلوّن كأحمر الشفاه.\n" +
      "• زيت فاكهة الآلام مع SPF 25 لحماية UVA وUVB.\n" +
      "• تركيبة كريمية مريحة برائحة الفانيليا.\n" +
      "• خالٍ من البارابين — خاضع للاختبار الجلدي.\n" +
      "• 3.6 g.",
    descriptionEn:
      "Deborah Milano Hydracolor No. 25 Glicine — the original “cream in a stick” lip care.\n\n" +
      "• Nourishes like a cream and colours like a lipstick.\n" +
      "• Passion fruit oil with SPF 25 UVA-UVB protection.\n" +
      "• Rich creamy formula delicately scented with vanilla.\n" +
      "• Paraben free — Dermatologist tested.\n" +
      "• 3.6 g.",
    imageUrls: [
      `${ECONVIENE}/8009518125603.jpg`,
      `${ECONVIENE}/8009518125603_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
  },
  {
    barcode: "8009518102871",
    slug: "deborah-extra-eye-pencil-01-black",
    sku: "DBR-EEP-102871",
    price: 10500,
    nameAr: "ديبورا ميلانو - قلم عيون Extra Eye Pencil 01 Black",
    nameEn: "Deborah Milano - Extra Eye Pencil 01 Black",
    descriptionAr:
      "قلم عيون Extra Eye Pencil 01 Black من ديبورا ميلانو — قلم بلاستيكي بتركيبة مقاومة للماء وطويلة الثبات.\n\n" +
      "• يُطبَّق بسلاسة فورية وراحة استثنائية.\n" +
      "• تركيبة مبتكرة ثابتة ومقاومة للماء.\n" +
      "• خاضع لاختبار العيون.\n" +
      "• 1.5 g.",
    descriptionEn:
      "Deborah Milano Extra Eye Pencil 01 Black — plastic pencil with an innovative long-wearing waterproof formula.\n\n" +
      "• Glides on instantly and effortlessly with amazing comfort.\n" +
      "• Innovative waterproof, long-wearing texture.\n" +
      "• Ophthalmologist tested.\n" +
      "• 1.5 g.",
    imageUrls: [
      `${BROCARD}/8009518102871_1.jpg`,
      `${ECONVIENE}/8009518102871.jpg`,
      `${ECONVIENE}/8009518102871_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
  },
  {
    barcode: "8009518417920",
    slug: "deborah-terra-bronzer-no-03-caramel",
    sku: "DBR-TB-417920",
    price: 15000,
    nameAr: "ديبورا ميلانو - برونزر Terra Bronzer No. 03 Caramel",
    nameEn: "Deborah Milano - Terra Bronzer No. 03 Caramel",
    descriptionAr:
      "برونزر Terra Bronzer No. 03 Caramel من ديبورا ميلانو — تأثير Sun Kissed طوال العام.\n\n" +
      "• تركيبة فائقة النعومة غنية بفيتامين C.\n" +
      "• إنهاء mat قابل للدمج والبناء.\n" +
      "• SPF 15 لحماية الوجه من أشعة UV.\n" +
      "• يُبرز ملامح الوجه ويمنح إشراقة طبيعية.",
    descriptionEn:
      "Deborah Milano Terra Bronzer No. 03 Caramel — Bronze Lover bronzing powder for a sun-kissed look.\n\n" +
      "• Ultra-thin silky texture enriched with Vitamin C.\n" +
      "• Matte, easy-to-blend and buildable finish.\n" +
      "• SPF 15 helps protect the face from UV rays.\n" +
      "• Warms the complexion with a natural bronzed glow.",
    imageUrls: [
      `${BROCARD}/8009518417920_1.jpg`,
      `${ECONVIENE}/8009518417920.jpg`,
      `${ECONVIENE}/8009518417920_1.jpg`,
    ],
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BRONZER,
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

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "ديبورا",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  return brandId;
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
  console.log(`Products: ${PRODUCTS.length} (no shades, multi-image)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
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

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(product.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((p) => p.slug === product.slug)) {
      console.log(`  skip — slug exists (${product.slug})\n`);
      skipped += 1;
      continue;
    }

    console.log(`  uploading ${product.imageUrls.length} images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      const imageId = await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`);
      imageIds.push(imageId);
    }

    const payload: Record<string, unknown> = {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      subcategoryIds: [product.subcategoryId],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.price,
      stock: 0,
      isActive: true,
      imageIds,
    };
    if (product.tertiaryCategoryId) {
      payload.tertiaryCategoryId = product.tertiaryCategoryId;
      payload.tertiaryCategoryIds = [product.tertiaryCategoryId];
    }

    const created = await api<{ id: string }>("/products", "POST", payload);
    const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
    console.log(`  ✓ ${product.nameEn}`);
    console.log(
      `    ID: ${created.id} | shades: ${verify.shades?.length ?? 0} | images: ${verify.images?.length ?? imageIds.length} | ${product.price} IQD\n`,
    );
    if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} has shades`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
