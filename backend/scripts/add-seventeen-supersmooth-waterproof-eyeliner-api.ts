/**
 * Seventeen Super Smooth Waterproof Eyeliner Pencil 1.2g
 * 21 official shades with hex + images (NO shade barcodes).
 * Product barcode: 5201641689240 (shade 15 Navy)
 *
 * Sources: seventeencosmetics.com (official names, color-select hex, pack/swatch photos)
 * Hex: official schema.org / color-select__option__hex values
 *
 * Usage: npx tsx scripts/add-seventeen-supersmooth-waterproof-eyeliner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const IMG = "https://seventeencosmetics.com/media/images/products/2022/06";
const IMG25 = "https://seventeencosmetics.com/media/images/products/2025/09";
const IMG26 = "https://seventeencosmetics.com/media/images/products/2026/05";

const SHADE_PRICE = 8500;

const PRODUCT = {
  barcode: "5201641689240",
  slug: "seventeen-supersmooth-waterproof-eyeliner-pencil-1-2g",
  sku: "SEV-SSWE-689240",
  price: SHADE_PRICE,
  originalPrice: 10000,
  nameAr: "سفنتيين - قلم كحل عيون Super Smooth مقاوم للماء ناعم طويل الثبات 1.2 غرام",
  nameEn: "Seventeen Super Smooth Waterproof Eyeliner Pencil Long-Wear 1.2g",
  descriptionAr:
    "قلم كحل عيون Super Smooth Waterproof من سفنتيين — ملمس كريمي فائق النعومة ينساب بسهولة دون تلطخ، بلون غني مقاوم للماء يدوم حتى في أصعب الظروف.\n\n" +
    "• مثالي لتحديد خط الرموش وإطلالات السموكي بفضل قوامه الكريمي القابل للدمج قبل أن يثبت.\n" +
    "• غني بفيتامين E وزيت الجوجوبا لترطيب منطقة العين والحفاظ على نعومة الخط.\n" +
    "• مناسب لمستخدمي العدسات اللاصقة — مُختبر طبّياً للعيون وجلدياً — خالٍ من الغلوتين.\n" +
    "• 1.2 غرام — 21 درجة رسمية من الأسود الكلاسيكي إلى الألوان الجريئة والدرجات المطفية.\n" +
    "• باركود هذا المنتج لدرجة 15 Navy — كحلي بحري أنيق يناسب الإطلالات اليومية والسهرات في السوق العراقي.\n\n" +
    "طريقة الاستخدام: ارسمي خطاً على خط الرموش العلوي أو السفلي. وللمظهر السموكي ادمجي اللون بسرعة بفرشاة ظل قبل أن يثبت (خلال ثوانٍ).\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Black Velvet — أسود مخملي كثيف\n" +
    "• 03 Bronze — برونزي دافئ\n" +
    "• 05 Brown Pearl — بني لؤلؤي\n" +
    "• 10 Charcoal — فحمي رمادي\n" +
    "• 11 Steel — فولاذي رمادي\n" +
    "• 13 Olive — زيتوني\n" +
    "• 15 Navy — كحلي بحري (درجة هذا الباركود)\n" +
    "• 16 Blue Diamond — أزرق ماسي\n" +
    "• 17 Turquoise — تركواز\n" +
    "• 23 Columbian Emerald — زمردي كولومبي\n" +
    "• 29 Midnight Sky — سماء منتصف الليل\n" +
    "• 33 Deep Emerald Sea — بحر زمردي عميق\n" +
    "• 36 Deep Blue Sea — أزرق بحر عميق\n" +
    "• 37 Magical Purple — بنفسجي سحري\n" +
    "• 39 Midnight Blue Sky — أزرق منتصف الليل\n" +
    "• 44 Winter Purple — بنفسجي شتوي\n" +
    "• 45 Electric Blue — أزرق كهربائي\n" +
    "• 49 Winter Jade — يشم شتوي\n" +
    "• 50 Beige Matte — بيج مطفي\n" +
    "• 51 White Matte — أبيض مطفي\n" +
    "• 52 Plum — برقوقي",
  descriptionEn:
    "Seventeen Super Smooth Waterproof Eyeliner Pencil — a creamy, ultra-smooth waterproof eye pencil that applies without smudging and delivers bold, long-lasting colour for even the most demanding days.\n\n" +
    "• Creamy texture blends easily for precise lining or soft smokey eyes before it sets.\n" +
    "• Enriched with Vitamin E and Jojoba Oil to pamper the eye area and keep the line smooth.\n" +
    "• Suitable for contact-lens wearers — ophthalmologically & dermatologically tested — gluten-free.\n" +
    "• 1.2g — 21 official shades from classic black to vivid colours and soft mattes.\n" +
    "• This barcode is shade 15 Navy — an elegant deep navy for everyday and evening looks.\n\n" +
    "How to use: Line the upper and/or lower lash line. For a smokey effect, blend quickly with a shadow brush before it sets (within seconds).\n\n" +
    "Available shades (official names):\n" +
    "• 01 Black Velvet\n" +
    "• 03 Bronze\n" +
    "• 05 Brown Pearl\n" +
    "• 10 Charcoal\n" +
    "• 11 Steel\n" +
    "• 13 Olive\n" +
    "• 15 Navy (this barcode’s shade)\n" +
    "• 16 Blue Diamond\n" +
    "• 17 Turquoise\n" +
    "• 23 Columbian Emerald\n" +
    "• 29 Midnight Sky\n" +
    "• 33 Deep Emerald Sea\n" +
    "• 36 Deep Blue Sea\n" +
    "• 37 Magical Purple\n" +
    "• 39 Midnight Blue Sky\n" +
    "• 44 Winter Purple\n" +
    "• 45 Electric Blue\n" +
    "• 49 Winter Jade\n" +
    "• 50 Beige Matte\n" +
    "• 51 White Matte\n" +
    "• 52 Plum",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade names + official hex from seventeencosmetics color chips / ProductGroup schema. */
const SHADES: ShadeInput[] = [
  { name: "01 Black Velvet", colorHex: "#000000", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_01_3.jpg`, position: 0, price: SHADE_PRICE },
  { name: "03 Bronze", colorHex: "#563722", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_03_3.jpg`, position: 1, price: SHADE_PRICE },
  { name: "05 Brown Pearl", colorHex: "#432C26", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_05_3.jpg`, position: 2, price: SHADE_PRICE },
  { name: "10 Charcoal", colorHex: "#343539", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_10_3.jpg`, position: 3, price: SHADE_PRICE },
  { name: "11 Steel", colorHex: "#5D5D5D", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_11_3.jpg`, position: 4, price: SHADE_PRICE },
  { name: "13 Olive", colorHex: "#585B3E", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_13_3.jpg`, position: 5, price: SHADE_PRICE },
  { name: "15 Navy", colorHex: "#373B47", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_15_3.jpg`, position: 6, price: SHADE_PRICE },
  { name: "16 Blue Diamond", colorHex: "#3A5C8C", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_16_3.jpg`, position: 7, price: SHADE_PRICE },
  { name: "17 Turquoise", colorHex: "#3B99BF", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_17_3.jpg`, position: 8, price: SHADE_PRICE },
  { name: "23 Columbian Emerald", colorHex: "#668768", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_23_3.jpg`, position: 9, price: SHADE_PRICE },
  { name: "29 Midnight Sky", colorHex: "#323136", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_29_3.jpg`, position: 10, price: SHADE_PRICE },
  { name: "33 Deep Emerald Sea", colorHex: "#203F3C", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_33_3.jpg`, position: 11, price: SHADE_PRICE },
  { name: "36 Deep Blue Sea", colorHex: "#1B2D56", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_36_3.jpg`, position: 12, price: SHADE_PRICE },
  { name: "37 Magical Purple", colorHex: "#634B7F", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_37_3.jpg`, position: 13, price: SHADE_PRICE },
  { name: "39 Midnight Blue Sky", colorHex: "#092E4B", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_39_3.jpg`, position: 14, price: SHADE_PRICE },
  { name: "44 Winter Purple", colorHex: "#3F2445", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_44_3.jpg`, position: 15, price: SHADE_PRICE },
  { name: "45 Electric Blue", colorHex: "#002762", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_45_3.jpg`, position: 16, price: SHADE_PRICE },
  { name: "49 Winter Jade", colorHex: "#126B62", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_49_3.jpg`, position: 17, price: SHADE_PRICE },
  { name: "50 Beige Matte", colorHex: "#F4D1BB", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_50_3.jpg`, position: 18, price: SHADE_PRICE },
  { name: "51 White Matte", colorHex: "#F2EDE9", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_51_3.jpg`, position: 19, price: SHADE_PRICE },
  { name: "52 Plum", colorHex: "#6B254A", imageUrl: `${IMG}/seventeen_supersmooth_eye_pencil_52_3.jpg`, position: 20, price: SHADE_PRICE },
];

/** Fallbacks if primary swatch URL fails. */
const SHADE_FALLBACKS: Record<string, string[]> = {
  "01 Black Velvet": [`${IMG}/seventeen_supersmooth_eye_pencil_01.jpg`, `${IMG25}/black.jpg`, `${IMG}/seventeen_supersmooth_eye_pencil_01_1.jpg`],
  "03 Bronze": [`${IMG}/seventeen_supersmooth_eye_pencil_03.jpg`, `${IMG26}/1.jpg`],
  "05 Brown Pearl": [`${IMG}/seventeen_supersmooth_eye_pencil_05_1.jpg`, `${IMG}/seventeen_supersmooth_eye_pencil_05.jpg`],
  "52 Plum": [`${IMG}/seventeen_supersmooth_eye_pencil_52_1.jpg`, `${IMG}/seventeen_supersmooth_eye_pencil_52.jpg`],
};

const PRODUCT_IMAGES = [
  `${IMG}/seventeen_supersmooth_eye_pencil_15.jpg`,
  `${IMG}/seventeen_supersmooth_eye_pencil_15_1.jpg`,
  `${IMG25}/black.jpg`,
  `${IMG}/seventeen_supersmooth_eye_pencil_01.jpg`,
  `${IMG}/seventeen_supersmooth_eye_pencil_10.jpg`,
  `${IMG}/seventeen_supersmooth_eye_pencil_45.jpg`,
  `${IMG}/seventeen_supersmooth_eye_pencil_50.jpg`,
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
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }> } | Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=50`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""} ${b.nameAr ?? ""}`.toLowerCase().trim();
    return n === "seventeen" || /(^|\s)seventeen(\s|$)/.test(n) || n.includes("seven7een");
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]`);
    return exact.id;
  }
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "سفنتيين",
    brandEn: "Seventeen",
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error("Could not resolve Seventeen brand");
  console.log(`Brand: Seventeen (${resolved.brand.id})${resolved.created ? " [created]" : " [resolve]"}`);
  return resolved.brand.id;
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
    const blob = new Blob([buffer], { type: contentType.startsWith("image/") ? contentType : "image/jpeg" });
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
    await new Promise((r) => setTimeout(r, attempt * 1200));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function uploadWithFallbacks(primary: string, fallbacks: string[], alt: string): Promise<string> {
  const urls = [primary, ...fallbacks];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      return await uploadImage(url, alt);
    } catch (e) {
      lastErr = e;
      console.log(`    retry next url after: ${e instanceof Error ? e.message : e}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`All image URLs failed for ${alt}`);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();
  console.log("");

  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists && check.product?.id) {
    await api(`/products/${check.product.id}`, "DELETE");
    console.log(`deleted existing: ${check.product.nameAr ?? PRODUCT.barcode}\n`);
  }

  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === PRODUCT.slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`deleted orphan slug: ${PRODUCT.slug}`);
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
    price: number;
    originalPrice: number;
  }> = [];

  for (const shade of SHADES) {
    const fallbacks = SHADE_FALLBACKS[shade.name] ?? [`${IMG}/seventeen_supersmooth_eye_pencil_${shade.name.split(" ")[0]}.jpg`];
    const imageId = await uploadWithFallbacks(shade.imageUrl, fallbacks, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price,
      originalPrice: PRODUCT.originalPrice,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      galleryIds.push(await uploadImage(url, "product-gallery"));
      console.log("  ✓ gallery");
    } catch (e) {
      console.log(`  ✗ gallery skip: ${e instanceof Error ? e.message : e}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
    shades?: Array<{ name?: string; barcode?: string | null; colorHex?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  const shadeRows = verify.shades ?? [];
  const withBarcode = shadeRows.filter((s) => s.barcode);
  console.log(`\n✓ ${PRODUCT.nameEn}`);
  console.log(`  AR: ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode} (product only)`);
  console.log(`  Shades: ${shadeRows.length} | with shade barcode: ${withBarcode.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  if (withBarcode.length > 0) throw new Error("Shade barcodes were saved — must be empty");
  if (shadeRows.length !== SHADES.length) throw new Error(`Expected ${SHADES.length} shades, got ${shadeRows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
