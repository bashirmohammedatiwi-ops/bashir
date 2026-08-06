/**
 * Seventeen All Day Lip Color & Top Gloss — Non-transfer double lip color
 * 29 shades with official codes/names + official hex (NO shade barcodes).
 * Product barcode: 5201641724248 (shade 03)
 *
 * Sources: seventeencosmetics.com (official tips, hex chips, product photos)
 * Hex: official color-select__option__hex from product page.
 * Size: listed as 3ml by Greek retailers (dual-ended color + clear gloss).
 *
 * Usage: npx tsx scripts/add-seventeen-all-day-lip-color-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const OFF = "https://seventeencosmetics.com/media/images/products";
const BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  barcode: "5201641724248",
  slug: "seventeen-all-day-lip-color-top-gloss-non-transfer",
  sku: "SVN-ADLC-724248",
  price: 18000,
  originalPrice: 20000,
  nameAr: "سفنتين - أحمر شفاه سائل All Day Lip Color & Top Gloss ثابت مطفي مع ملمع مرطب لا ينتقل",
  nameEn: "Seventeen All Day Lip Color & Top Gloss Non-Transfer Matte Lip Color with Clear Gloss",
  descriptionAr:
    "All Day Lip Color & Top Gloss من سفنتين — أحمر شفاه سائل ثنائي الطرف: لون مطفي ثابت لا ينتقل + ملمع شفاف مرطب في الطرف الآخر. ثبّتيه صباحاً وانسيه — يدوم حتى نهاية اليوم حتى بعد الأكل والشرب، مع الحفاظ على ترطيب الشفاه.\n\n" +
    "• ثبات طويل جداً — يجف خلال أقل من دقيقة ويبقى ثابتاً دون إعادة تطبيق.\n" +
    "• لا ينتقل على الأكواب والكؤوس (non-transfer).\n" +
    "• فرشاة دقيقة لتطبيق سهل واحترافي.\n" +
    "• طرف ملمع شفاف لإضافة لمعان وعصارة وترطيب حسب الرغبة.\n" +
    "• مختبر جلدياً — خالٍ من الغلوتين.\n" +
    "• 29 درجة من النود والوردي والأحمر والبرقوقي والميتاليك.\n\n" +
    "طريقة الاستخدام: ضعي جانب اللون أولاً وانتظري 30–50 ثانية حتى يجف. ثم ضعي الجانب الشفاف للملمع إن رغبتِ بلمعان وترطيب، وانتظري 30–50 ثانية. يمكن استخدام جانب اللون كآيلاينر ملوّن جريء.\n\n" +
    "الدرجات المتوفرة (حسب الموقع الرسمي):\n" +
    "• 01 — وردي فاتح ناعم\n" +
    "• 02 — بيج طبيعي دافئ\n" +
    "• 03 — بيج فاتح (Light Beige لدى تجار موثوقين)\n" +
    "• 04 — بني محمر كلاسيكي\n" +
    "• 05 — بني محمر ترابي\n" +
    "• 06 — وردي أحمر طماطم\n" +
    "• 07 — أحمر كلاسيكي\n" +
    "• 08 — أحمر غامق\n" +
    "• 11 — وردي متوسط\n" +
    "• 28 — بني برقوقي\n" +
    "• 31 — نود وردي\n" +
    "• 32 — وردي ترابي\n" +
    "• 58 — فوشي أحمر قوي\n" +
    "• 60 Retro — بني رترو\n" +
    "• 61 Urban Twist — وردي حضري\n" +
    "• 65 — بنفسجي عنابي\n" +
    "• 85 Metallic Dark Pink — وردي غامق ميتاليك\n" +
    "• 86 Metallic Dark Peach — خوخي غامق ميتاليك\n" +
    "• 88 — أحمر نبيذي عميق\n" +
    "• 89 Orange Pink — وردي برتقالي\n" +
    "• 90 Baby Pink — وردي بيبي\n" +
    "• 92 — بني وردي\n" +
    "• 93 — وردي فاتح حلو\n" +
    "• 94 — مرجاني أحمر\n" +
    "• 95 — أحمر توتي\n" +
    "• 96 — أحمر نبيذي داكن\n" +
    "• 97 — برقوقي غامق\n" +
    "• 98 — أحمر ساطع\n" +
    "• 99 — وردي نود دافئ",
  descriptionEn:
    "Seventeen All Day Lip Color & Top Gloss — a dual-ended non-transfer liquid lip colour: long-lasting matte colour on one side and a clear moisturizing gloss on the other. Apply in the morning and forget it — it stays flawless all day, even after food or drinks, while keeping lips hydrated.\n\n" +
    "• Ultra long-wear — dries in under a minute, no reapplication needed.\n" +
    "• Non-transfer formula — no more stains on cups and glasses.\n" +
    "• Precise applicator for easy, clean application.\n" +
    "• Clear gloss side for juicy shine and moisture when you want it.\n" +
    "• Dermatologically tested — gluten free.\n" +
    "• 29 shades from nudes and pinks to reds, plums and metallics.\n\n" +
    "How to use: Apply the colour side first and wait 30–50 seconds to dry. Then apply the clear gloss side for shine and moisture if desired, and wait 30–50 seconds. Pro tip: use the colour side as a bold eyeliner.\n\n" +
    "Available shades (official codes/names):\n" +
    "• 01 — soft light pink\n" +
    "• 02 — warm natural beige\n" +
    "• 03 — light beige (listed as Light Beige by trusted retailers)\n" +
    "• 04 — classic rosy brown\n" +
    "• 05 — earthy reddish brown\n" +
    "• 06 — tomato rose red\n" +
    "• 07 — classic red\n" +
    "• 08 — deep dark red\n" +
    "• 11 — medium rose pink\n" +
    "• 28 — plum brown\n" +
    "• 31 — rosy nude\n" +
    "• 32 — dusty rose\n" +
    "• 58 — bold fuchsia red\n" +
    "• 60 Retro — retro brown\n" +
    "• 61 Urban Twist — urban rose\n" +
    "• 65 — plum burgundy\n" +
    "• 85 Metallic Dark Pink — metallic dark pink\n" +
    "• 86 Metallic Dark Peach — metallic dark peach\n" +
    "• 88 — deep wine red\n" +
    "• 89 Orange Pink — orange pink\n" +
    "• 90 Baby Pink — baby pink\n" +
    "• 92 — rosy brown\n" +
    "• 93 — sweet light pink\n" +
    "• 94 — coral red\n" +
    "• 95 — berry red\n" +
    "• 96 — deep wine\n" +
    "• 97 — deep plum\n" +
    "• 98 — vivid red\n" +
    "• 99 — warm nude rose",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade tips + hex from seventeencosmetics.com. Images: official product photos (Brocard fallback for 94). */
const SHADES: ShadeInput[] = [
  { name: "01", colorHex: "#E28AA3", imageUrl: `${OFF}/2026/02/All_day_01.jpeg`, position: 0 },
  { name: "02", colorHex: "#DB9584", imageUrl: `${OFF}/2026/02/All_day_02_3.jpeg`, position: 1 },
  { name: "03", colorHex: "#B79185", imageUrl: `${OFF}/2026/02/All_day_03.jpeg`, position: 2 },
  { name: "04", colorHex: "#9C484A", imageUrl: `${OFF}/2026/02/All_day_04.jpeg`, position: 3 },
  { name: "05", colorHex: "#A24D43", imageUrl: `${OFF}/2026/02/All_day_05.jpeg`, position: 4 },
  { name: "06", colorHex: "#C13F57", imageUrl: `${OFF}/2026/02/All_day_06.jpeg`, position: 5 },
  { name: "07", colorHex: "#BC2026", imageUrl: `${OFF}/2026/02/All_day_07.jpeg`, position: 6 },
  { name: "08", colorHex: "#A02541", imageUrl: `${OFF}/2026/02/All_day_08.jpeg`, position: 7 },
  { name: "11", colorHex: "#AC617F", imageUrl: `${OFF}/2026/02/All_day_11.jpeg`, position: 8 },
  { name: "28", colorHex: "#AA390D", imageUrl: `${OFF}/2026/02/All_day_28.jpeg`, position: 9 },
  { name: "31", colorHex: "#D6938B", imageUrl: `${OFF}/2026/02/All_day_31_3.jpeg`, position: 10 },
  { name: "32", colorHex: "#B16160", imageUrl: `${OFF}/2026/02/All_day_32.jpeg`, position: 11 },
  { name: "58", colorHex: "#D10E6E", imageUrl: `${OFF}/2026/02/All_day_58.jpeg`, position: 12 },
  { name: "60 Retro", colorHex: "#94645A", imageUrl: `${OFF}/2026/02/All_day_60.jpeg`, position: 13 },
  { name: "61 Urban Twist", colorHex: "#964F55", imageUrl: `${OFF}/2026/02/All_day_61.jpeg`, position: 14 },
  { name: "65", colorHex: "#6B2146", imageUrl: `${OFF}/2026/02/All_day_65.jpeg`, position: 15 },
  { name: "85 Metallic Dark Pink", colorHex: "#D18188", imageUrl: `${OFF}/2026/02/All_day_85.jpeg`, position: 16 },
  { name: "86 Metallic Dark Peach", colorHex: "#E36D6F", imageUrl: `${OFF}/2026/02/All_day_86.jpeg`, position: 17 },
  { name: "88", colorHex: "#67101A", imageUrl: `${OFF}/2026/02/All_day_88.jpeg`, position: 18 },
  { name: "89 Orange Pink", colorHex: "#C87E83", imageUrl: `${OFF}/2026/02/All_day_89.jpeg`, position: 19 },
  { name: "90 Baby Pink", colorHex: "#C87A88", imageUrl: `${OFF}/2026/02/All_day_90.jpeg`, position: 20 },
  { name: "92", colorHex: "#935A55", imageUrl: `${OFF}/2026/02/All_day_92.jpeg`, position: 21 },
  { name: "93", colorHex: "#EFA2BD", imageUrl: `${OFF}/2026/02/All_day_93.jpeg`, position: 22 },
  { name: "94", colorHex: "#D44E4A", imageUrl: `${BROCARD}/5201641042915_1.jpg`, position: 23 },
  { name: "95", colorHex: "#A10538", imageUrl: `${OFF}/2026/02/All_day_95_3.jpeg`, position: 24 },
  { name: "96", colorHex: "#70020B", imageUrl: `${OFF}/2026/02/All_day_96.jpeg`, position: 25 },
  { name: "97", colorHex: "#69012E", imageUrl: `${OFF}/2026/02/All_day_97.jpeg`, position: 26 },
  { name: "98", colorHex: "#CD0110", imageUrl: `${OFF}/2026/03/Seventeen_all_day_lip_color_98_4.jpg`, position: 27 },
  { name: "99", colorHex: "#BA7574", imageUrl: `${OFF}/2026/03/Seventeen_all_day_lip_color_99_4.jpg`, position: 28 },
];

const PRODUCT_IMAGES = [
  `${OFF}/2026/02/All_day_03.jpeg`,
  `${BROCARD}/5201641724248_1.jpg`,
  `${BROCARD}/5201641724248_2.jpg`,
  `${OFF}/2026/02/All_day_01.jpeg`,
  `${OFF}/2026/02/All_day_02_3.jpeg`,
  `${OFF}/2026/02/All_day_07.jpeg`,
  `${OFF}/2026/02/All_day_31_3.jpeg`,
  `${OFF}/2026/02/All_day_85.jpeg`,
  `${OFF}/2026/02/All_day_86.jpeg`,
  `${OFF}/2026/03/Seventeen_all_day_lip_color_98_4.jpg`,
  `${OFF}/2026/03/Seventeen_all_day_lip_color_99_4.jpg`,
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
  // Known catalog brand (slug: seventeen)
  const KNOWN = "f133215c-8cb8-4686-9960-0ab79390a6bb";
  try {
    const b = await api<{ id: string; name?: string }>(`/brands/${KNOWN}`);
    if (b?.id) {
      console.log(`Brand: Seventeen (${b.id}) [known]\n`);
      return b.id;
    }
  } catch {
    /* fall through */
  }

  const search = await api<
    { data?: Array<{ id: string; name?: string; slug?: string }> } | Array<{ id: string; name?: string; slug?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=100`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const name = (b.name ?? "").trim().toLowerCase();
    const slug = (b.slug ?? "").trim().toLowerCase();
    return name === "seventeen" || slug === "seventeen";
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]\n`);
    return exact.id;
  }

  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Seventeen",
  });
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

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted existing: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  if (await deleteByBarcode(PRODUCT.barcode)) console.log("");
  await deleteOrphanSlug(PRODUCT.slug);

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery`);
    } catch (e) {
      console.log(`  ✗ gallery skip: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  const noHex = (verify.shades ?? []).filter((s) => !s.colorHex);
  if (noHex.length) throw new Error(`Shades missing hex: ${noHex.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
