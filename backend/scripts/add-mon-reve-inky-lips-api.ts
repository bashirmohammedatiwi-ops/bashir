/**
 * Mon Reve Inky Lips Kiss-Proof — liquid matte lipstick 4ml
 * 21 shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641006603 (shade 03 OBSESSION)
 *
 * Sources: monrevecosmetics.com (official names, product + texture photos)
 * Hex sampled from official swatch/texture/product images.
 *
 * Usage: npx tsx scripts/add-mon-reve-inky-lips-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://monrevecosmetics.com/media/images/products";
const P24 = "https://cdn.pharm24.gr/images/515x515-90";

const PRODUCT = {
  barcode: "5201641006603",
  slug: "mon-reve-inky-lips-kiss-proof-liquid-matte-lipstick-4ml",
  sku: "MON-IL-006603",
  price: 8500,
  originalPrice: 9500,
  nameAr: "مون ريف - روج شفاه سائل Inky Lips Kiss-Proof مطفي ثابت كالحبر 4 مل",
  nameEn: "Mon Reve Inky Lips Kiss-Proof Liquid Matte Lipstick 4ml",
  descriptionAr:
    "روج شفاه سائل مطفي Inky Lips من مون ريف — تركيبة رقيقة كالحبر تمنح إحساساً خفيفاً كأنكِ لا ترتدين شيئاً، مع لون قوي ثابت لا ينتقل ولا يلمع.\n\n" +
    "• يجف بسرعة ويبقى ثابتاً لساعات (kiss-proof) دون تلطيخ الكأس أو الكمامة.\n" +
    "• ينساب كالحبر على الشفاه بطبقة رقيقة مع الحفاظ على نعومتها وترطيبها.\n" +
    "• فرشاة دقيقة صغيرة لتطبيق متساوٍ ورسم محيط الشفاه بسهولة.\n" +
    "• فيغن، مقاوم للماء، خالٍ من البارابين والغلوتين، مختبر جلدياً وغير مجرّب على الحيوانات.\n" +
    "• 4 مل — 21 درجة سوبر مات تناسب السوق العراقي من النود اليومي إلى الأحمر الجريء.\n\n" +
    "نصيحة: ثبّتي المحيط بقلم Infiniliner Gel Lip Pencil لمزيد من الحدّة والثبات.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 BISCUIT — بيج بسكوتي وردي ناعم\n" +
    "• 02 SIREN — وردي سيرين متوسط\n" +
    "• 03 OBSESSION — وردي بني أوبسشن (درجة هذا الباركود)\n" +
    "• 04 VELOUR — تيراكوتا مخملي\n" +
    "• 08 SCARLET — أحمر سكارلت كلاسيكي\n" +
    "• 09 FIERCE — أحمر فيرس غامق\n" +
    "• 10 Deep Espresso — بني إسبريسو عميق (بدون اسم رسمي)\n" +
    "• 11 SOFTLY — وردي خوخي ناعم\n" +
    "• 12 BARE — نود عاري دافئ\n" +
    "• 13 TENDER — وردي تندر هادئ\n" +
    "• 14 WHISPER — وردي همسة فاقع\n" +
    "• 15 FEATHER — وردي فيذر حيوي\n" +
    "• 17 DRENCH — وردي درينش مشرق\n" +
    "• 18 Bright Coral — مرجاني فاقع (بدون اسم رسمي)\n" +
    "• 19 MUSE — وردي موز أنيق\n" +
    "• 20 MAGNET — نود ماغنيت دافئ\n" +
    "• 22 ENIGMA — عنابي إنيجما عميق\n" +
    "• 23 COCOA — بني كاكاو وردي\n" +
    "• 24 BUFF — بيج باف وردي\n" +
    "• 25 SUEDE — وردي سويدي مغبر\n" +
    "• 26 VEIL — وردي فيل شفّاف المظهر",
  descriptionEn:
    "Mon Reve Inky Lips Kiss-Proof — ultra-thin liquid matte lipstick with a naked-lip feel. High-impact, vibrant colour that dries quickly while keeping lips smooth and hydrated. The advanced formula glides on like ink, delivering a thin veil of transfer-free colour.\n\n" +
    "• Quick-drying, long-lasting, kiss-proof matte finish.\n" +
    "• Lightweight ink-like formula — comfortable all day.\n" +
    "• Small precision applicator for even, flawless coverage.\n" +
    "• Vegan, water-resistant, paraben-free, gluten-free, dermatologically tested, cruelty-free.\n" +
    "• 4ml — 21 super-matte shades from everyday nudes to bold reds.\n\n" +
    "Pro tip: Pair with Infiniliner Gel Lip Pencil to sharpen the contour and extend wear.\n\n" +
    "Available shades:\n" +
    "• 01 BISCUIT — soft biscuit nude-pink\n" +
    "• 02 SIREN — medium siren rose\n" +
    "• 03 OBSESSION — dusty rose-brown (this barcode’s shade)\n" +
    "• 04 VELOUR — terracotta velour\n" +
    "• 08 SCARLET — classic scarlet red\n" +
    "• 09 FIERCE — deep fierce red\n" +
    "• 10 Deep Espresso — deep espresso brown (no official name)\n" +
    "• 11 SOFTLY — soft peachy rose\n" +
    "• 12 BARE — warm bare nude\n" +
    "• 13 TENDER — quiet tender rose\n" +
    "• 14 WHISPER — bright whisper pink\n" +
    "• 15 FEATHER — lively feather pink\n" +
    "• 17 DRENCH — bright drench pink\n" +
    "• 18 Bright Coral — vivid coral (no official name)\n" +
    "• 19 MUSE — elegant muse rose\n" +
    "• 20 MAGNET — warm magnet nude\n" +
    "• 22 ENIGMA — deep enigma berry\n" +
    "• 23 COCOA — rosy cocoa brown\n" +
    "• 24 BUFF — rosy buff nude\n" +
    "• 25 SUEDE — dusty suede rose\n" +
    "• 26 VEIL — soft veil pink",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official names from monrevecosmetics.com; 10 & 18 have no official colour name. */
const SHADES: ShadeInput[] = [
  { name: "01 BISCUIT", colorHex: "#C77978", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_01.jpg`, position: 0 },
  { name: "02 SIREN", colorHex: "#A84F59", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_02.jpg`, position: 1 },
  { name: "03 OBSESSION", colorHex: "#874D52", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_03.jpg`, position: 2 },
  { name: "04 VELOUR", colorHex: "#8E4F47", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_04.jpg`, position: 3 },
  { name: "08 SCARLET", colorHex: "#B80F21", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_08.jpg`, position: 4 },
  { name: "09 FIERCE", colorHex: "#970119", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_09.jpg`, position: 5 },
  { name: "10 Deep Espresso", colorHex: "#50201F", imageUrl: `${IMG}/2021/03/mon_reve_inky_lips_10.jpg`, position: 6 },
  { name: "11 SOFTLY", colorHex: "#CE9E90", imageUrl: `${IMG}/2022/04/mon_reve_inky_lips_11.jpg`, position: 7 },
  { name: "12 BARE", colorHex: "#C88981", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_12.jpg`, position: 8 },
  { name: "13 TENDER", colorHex: "#B77E75", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_13.jpg`, position: 9 },
  { name: "14 WHISPER", colorHex: "#D998A6", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_14.jpg`, position: 10 },
  { name: "15 FEATHER", colorHex: "#DD8E97", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_15.jpg`, position: 11 },
  { name: "17 DRENCH", colorHex: "#E67779", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_17.jpg`, position: 12 },
  { name: "18 Bright Coral", colorHex: "#DE4F48", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_18.jpg`, position: 13 },
  { name: "19 MUSE", colorHex: "#95525D", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_19.jpg`, position: 14 },
  { name: "20 MAGNET", colorHex: "#C08077", imageUrl: `${IMG}/2022/03/mon_reve_inky_lips_20_1.jpg`, position: 15 },
  { name: "22 ENIGMA", colorHex: "#6F162F", imageUrl: `${IMG}/2025/09/mon_reve_inky_lips_22.jpg`, position: 16 },
  { name: "23 COCOA", colorHex: "#B77776", imageUrl: `${IMG}/2026/07/5201641054086_1.jpg`, position: 17 },
  { name: "24 BUFF", colorHex: "#B86E6F", imageUrl: `${IMG}/2026/07/5201641054093_1.jpg`, position: 18 },
  { name: "25 SUEDE", colorHex: "#9F595E", imageUrl: `${IMG}/2026/07/5201641054109_1.jpg`, position: 19 },
  { name: "26 VEIL", colorHex: "#C67881", imageUrl: `${IMG}/2026/07/5201641054116_1.jpg`, position: 20 },
];

const PRODUCT_IMAGES = [
  `${IMG}/2021/03/mon_reve_inky_lips_03.jpg`,
  `${IMG}/2021/03/mon_reve_inky_lips_03_5.jpg`,
  `${IMG}/2021/03/mon_reve_inky_lips_01_5.jpg`,
  `${IMG}/2021/03/mon_reve_inky_lips_01_3.jpg`,
  `${IMG}/2023/08/inky_lips__mag_2.jpg`,
  `${P24}/5201641006603_1.jpg`,
];

/** Also delete prior listing that used shade-17 barcode as product barcode. */
const LEGACY_BARCODES = ["5201641020272"];

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
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>
  >(`/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""}`.toLowerCase();
    return n.includes("mon reve") || n.includes("mon rêve") || n.includes("مون ريف");
  });
  if (exact?.id) {
    console.log(`Brand: Mon Reve (${exact.id}) [exact search]\n`);
    return exact.id;
  }
  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Mon Reve",
    nameAr: "مون ريف",
    nameEn: "Mon Reve",
  });
  console.log(`Brand: Mon Reve (${created.id}) [created]\n`);
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
  console.log(`  deleted existing: ${check.product.nameAr ?? check.product.id} (${barcode})`);
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

  for (const bc of [PRODUCT.barcode, ...LEGACY_BARCODES]) {
    await deleteByBarcode(bc);
  }
  console.log("");
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
    await new Promise((r) => setTimeout(r, 350));
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
    await new Promise((r) => setTimeout(r, 350));
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
