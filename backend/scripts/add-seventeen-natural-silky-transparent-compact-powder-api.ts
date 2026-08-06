/**
 * Seventeen Natural Silky Transparent Compact Powder SPF15 — 7 official shades, 10g.
 * Product barcode: 5201641722268 (04 Beige).
 * Shade barcodes intentionally omitted.
 *
 * Sources:
 * - seventeencosmetics.com/en/catalogue/natural-silky-transparent-compact-powder_67/
 *   (official tips/names, color-select__option__hex, pack photos 2024/06)
 * - Brocard pack shots per UPC (gallery)
 * - Price: Alshaheera Iraq Natural Silky Compact Powder ~23,000 IQD
 *
 * Note: Brand copy says “8 colors”; current official selector lists 7 (01–07).
 *
 * Usage: npx tsx scripts/add-seventeen-natural-silky-transparent-compact-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const OFF = "https://seventeencosmetics.com/media/images/products/2024/06";
const BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  barcode: "5201641722268",
  slug: "seventeen-natural-silky-transparent-compact-powder-spf15-10g",
  sku: "SVN-NSTCP-722268",
  price: 23000,
  originalPrice: 25500,
  nameAr: "سفنتين - باودر مدمجة Natural Silky Transparent Compact Powder حريرية شفافة SPF15 10 غ",
  nameEn: "Seventeen Natural Silky Transparent Compact Powder SPF15 Semi-Sheer 10g",
  descriptionAr:
    "باودر مدمجة Natural Silky Transparent Compact Powder من سفنتين — ملمس ميكروني حريري فائق النعومة يمنح البشرة حجاباً شفافاً طبيعياً بمظهر مطفي أنيق. تمتص الدهون الزائدة خلال اليوم، ترطّب بفيتامين E والصبار (Aloe Vera)، وتحمي بفلتر SPF15 — مثالية للمناخ العراقي ولجميع أنواع البشرة.\n\n" +
    "• تقنية micronised لتطبيق سهل ومتجانس بملمس حريري.\n" +
    "• نتيجة مطفية طبيعية شفافة تدوم طويلاً دون مظهر ثقيل أو دهني.\n" +
    "• تمتص الزيوت الزائدة وتحافظ على مكياج منعش طوال اليوم.\n" +
    "• فيتامين E + Aloe Vera لترطيب متوازن.\n" +
    "• حماية شمسية SPF15.\n" +
    "• خالية من العطر — خالية من الغلوتين — مختبرة جلدياً.\n" +
    "• 10 غ — 7 درجات رسمية تتكيّف مع معظم ألوان البشرة.\n\n" +
    "طريقة الاستخدام: وزّعيها بالتساوي على الوجه فوق الكريم أو الفاونديشن بالإسفنجة المرفقة، وأعيدي التطبيق عند الحاجة. ادمِجي نحو الرقبة وخط الشعر لمظهر طبيعي.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Ivory — عاجي فاتح\n" +
    "• 02 Light Beige — بيج فاتح\n" +
    "• 03 Medium Beige — بيج متوسط\n" +
    "• 04 Beige — بيج (درجة هذا الباركود)\n" +
    "• 05 Honey — عسلي\n" +
    "• 06 Caramel — كراميل\n" +
    "• 07 Medium Caramel — كراميل متوسط",
  descriptionEn:
    "Seventeen Natural Silky Transparent Compact Powder SPF15 — a micronised, ultra-fine compact powder with a silky feel for a veil-like, naturally matte finish. Absorbs excess oil through the day, moisturises with Vitamin E and Aloe Vera, and protects with SPF15 — suitable for all skin types.\n\n" +
    "• Micronised technology for easy, suave application and a silky-smooth feel.\n" +
    "• Non-oily, long-lasting natural matte result without a heavy look.\n" +
    "• Absorbs oil residue so makeup stays fresh all day.\n" +
    "• Vitamin E + Aloe Vera keep skin comfortably moisturised.\n" +
    "• SPF15 sun protection.\n" +
    "• Fragrance free — gluten free — dermatologically tested.\n" +
    "• 10g — 7 official shades that adapt to a wide range of skin tones.\n\n" +
    "How to use: Apply evenly on the face over your base cream or foundation with the sponge. Re-apply where more coverage is needed. Blend towards the neck, face and hairline for a natural finish.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Ivory\n" +
    "• 02 Light Beige\n" +
    "• 03 Medium Beige\n" +
    "• 04 Beige (this barcode’s shade)\n" +
    "• 05 Honey\n" +
    "• 06 Caramel\n" +
    "• 07 Medium Caramel",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official tips + hex from color-select__option__hex; images: official 2024/06 pack photos. */
const SHADES: ShadeInput[] = [
  { name: "01 Ivory", colorHex: "#E6CDC6", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_1_3.jpg`, position: 0 },
  { name: "02 Light Beige", colorHex: "#E3C7BC", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_2_3.jpg`, position: 1 },
  { name: "03 Medium Beige", colorHex: "#DEC0B5", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_3_3.jpg`, position: 2 },
  { name: "04 Beige", colorHex: "#DAB6AA", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_4_3.jpg`, position: 3 },
  { name: "05 Honey", colorHex: "#D6AC9E", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_5_3.jpg`, position: 4 },
  { name: "06 Caramel", colorHex: "#D0A595", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_6_3.jpg`, position: 5 },
  { name: "07 Medium Caramel", colorHex: "#CFA090", imageUrl: `${OFF}/seventeen_natural_silky_transparent_compact_powder_7_3.jpg`, position: 6 },
];

const PRODUCT_IMAGES = [
  `${OFF}/seventeen_natural_silky_transparent_compact_powder_4_3.jpg`,
  `${BROCARD}/5201641722268_1.jpg`,
  `${OFF}/seventeen_natural_silky_transparent_compact_powder_1_3.jpg`,
  `${OFF}/seventeen_natural_silky_transparent_compact_powder_3_3.jpg`,
  `${OFF}/seventeen_natural_silky_transparent_compact_powder_7_3.jpg`,
  `${BROCARD}/5201641722237_1.jpg`,
  `${BROCARD}/5201641722299_1.jpg`,
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
  const KNOWN = "f133215c-8cb8-4686-9960-0ab79390a6bb";
  try {
    const b = await api<{ id: string }>(`/brands/${KNOWN}`);
    if (b?.id) {
      console.log(`Brand: Seventeen (${b.id}) [known]\n`);
      return b.id;
    }
  } catch {
    /* fall through */
  }
  const created = await api<{ id: string }>("/brands", "POST", { name: "Seventeen" });
  console.log(`Brand: Seventeen (${created.id}) [created]\n`);
  return created.id;
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists) {
    console.log(`skip ${PRODUCT.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
    return;
  }

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — slug exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades = [];
  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    await new Promise((r) => setTimeout(r, 250));
  }
  shades.sort((a, b) => a.position - b.position);

  console.log("\nUploading gallery images...");
  const shadeIds = new Set(shades.map((s) => s.imageId));
  const extraIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, `gallery-${extraIds.length + 1}`);
      if (!shadeIds.has(id) && !extraIds.includes(id)) {
        extraIds.push(id);
        console.log(`  ✓ gallery extra ${extraIds.length}`);
      }
    } catch (e) {
      console.log(`  ⚠ gallery skip: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const imageIds = [...shades.map((s) => s.imageId), ...extraIds];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: POWDER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [POWDER],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string | null }>;
    images?: unknown[];
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Gallery: ${verify.images?.length ?? imageIds.length}`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
  console.log(`  Category: Makeup → Face → Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
