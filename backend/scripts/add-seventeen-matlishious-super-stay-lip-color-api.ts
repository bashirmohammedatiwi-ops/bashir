/**
 * Seventeen Matlishious Super Stay Lip Color — extra-matte liquid lipstick 4ml
 * 32 official shades with hex + images (NO shade barcodes).
 * Product barcode: 5201641753538 (shade 03)
 *
 * Sources: seventeencosmetics.com/en/catalogue/matlishious_844/
 * Hex: official color-select__option__hex / ProductGroup schema
 * Images: official matlishious_XX pack/swatch photos
 *
 * Usage: npx tsx scripts/add-seventeen-matlishious-super-stay-lip-color-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG26 = "https://seventeencosmetics.com/media/images/products/2026/03";
const IMG26_06 = "https://seventeencosmetics.com/media/images/products/2026/06";
const IMG26_02 = "https://seventeencosmetics.com/media/images/products/2026/02";
const IMG25 = "https://seventeencosmetics.com/media/images/products/2025/10";
const IMG20 = "https://seventeencosmetics.com/media/images/products/2020/01";

const SHADE_PRICE = 15000;

const PRODUCT = {
  barcode: "5201641753538",
  slug: "seventeen-matlishious-super-stay-lip-color-4ml",
  sku: "SEV-MATLISH-753538",
  price: SHADE_PRICE,
  originalPrice: 17500,
  nameAr: "سفنتيين - أحمر شفاه سائل مات Matlishious Super Stay بملمس موس ثابت 4 مل",
  nameEn: "Seventeen Matlishious Super Stay Lip Color Extra-Matte Mousse Liquid Lipstick 4ml",
  descriptionAr:
    "أحمر شفاه سائل Matlishious Super Stay من سفنتيين — لون غير شفاف ثابت طوال اليوم بملمس موس خفيف وإنهاء مات إضافي دون تجفيف الشفاه.\n\n" +
    "• ميكروسفيرات بأحجام متعددة تمتص الزيوت وتعزّز المظهر المات مع تأثير تمويه ينعّم الخطوط الدقيقة.\n" +
    "• إيلاستوميرات الجيل الجديد تكوّن طبقة حماية تحافظ على مرونة الشفاه وتمنع الجفاف المعتاد مع المنتجات المات.\n" +
    "• مستخلص Alaria Esculenta المرطّب والمضاد للأكسدة يدعم إنتاج الكولاجين والإيلاستين.\n" +
    "• أداة تطبيق دقيقة لتوزيع متساوٍ من وسط الشفاه نحو الخارج.\n" +
    "• 4 مل — 32 درجة رسمية من النيود والوردي إلى الأحمر والبرقوقي والدرجات اللامعة.\n" +
    "• باركود هذا المنتج لدرجة 03 — نيود وردي فاتح يناسب الإطلالات اليومية في السوق العراقي.\n" +
    "• مُختبر جلدياً — خالٍ من الغلوتين.\n\n" +
    "طريقة الاستخدام: من وسط الشفاه نحو الخارج بطبقة رقيقة متساوية. اتركيه يجف، ويمكنكِ إضافة طبقة ثانية.\n\n" +
    "الدرجات المتوفرة (الأرقام الرسمية):\n" +
    "• 50 · 49 — درجات HOT الجديدة\n" +
    "• 01 → 11 · 13 · 14 · 15 · 16 — نيود ووردي وأحمر كلاسيكي\n" +
    "• 28 · 41 · 46 → 48 — وردي وبيربل وفوشيا\n" +
    "• 51 → 60 — نيود دافئ وأحمر عميق ودرجات جديدة",
  descriptionEn:
    "Seventeen Matlishious Super Stay Lip Color — juicy, long-lasting opaque colour with a mousse texture and an extra-matte finish that stays put all day without drying out your lips.\n\n" +
    "• Multi-sized microspheres absorb excess oil, boost the matte effect and blur fine lines for a smooth finish.\n" +
    "• Next-generation elastomers form a protective film that helps prevent the dryness typical of matte lipsticks and keeps lips feeling elastic.\n" +
    "• Hydrating, antioxidant-rich Alaria Esculenta supports elastin and collagen for healthier-looking lips.\n" +
    "• Precision applicator for an even, flawless application every time.\n" +
    "• 4ml — 32 official shades spanning nudes, pinks, reds, purples and shimmer finishes.\n" +
    "• This barcode is shade 03 — a soft pink nude ideal for everyday wear.\n" +
    "• Dermatologically tested — gluten-free.\n\n" +
    "How to use: Start at the centre of the lips and glide outward. Apply a thin even layer, let it dry, then add a second coat if desired.\n\n" +
    "Available shades (official numbers):\n" +
    "• 50 · 49 — HOT new shades\n" +
    "• 01–11 · 13 · 14 · 15 · 16 — nudes, pinks and classic reds\n" +
    "• 28 · 41 · 46–48 — pinks, purples and fuchsia\n" +
    "• 51–60 — warm nudes, deep reds and new tones",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
  fallbacks?: string[];
};

/** Official UI order + official hex chips from seventeencosmetics.com */
const SHADES: ShadeInput[] = [
  { name: "50", colorHex: "#CA8888", imageUrl: `${IMG26}/matlishious_50.jpeg`, position: 0, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_50.jpg`] },
  { name: "49", colorHex: "#C6918B", imageUrl: `${IMG26}/matlishious_49.jpeg`, position: 1, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_49.jpg`] },
  { name: "01", colorHex: "#CA9A96", imageUrl: `${IMG26}/matlishious_01.jpeg`, position: 2, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_01.jpg`] },
  { name: "02", colorHex: "#BC807F", imageUrl: `${IMG26}/matlishious_02.jpeg`, position: 3, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_02.jpg`] },
  { name: "03", colorHex: "#E09F9C", imageUrl: `${IMG26}/matlishious_03.jpeg`, position: 4, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_03.jpg`, `${IMG20}/5201641753538.jpg`] },
  { name: "04", colorHex: "#AE6A61", imageUrl: `${IMG26_02}/matlishious_04.jpg`, position: 5, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_04.jpeg`, `${IMG26}/matlishious_04.jpg`] },
  { name: "05", colorHex: "#9D6B6A", imageUrl: `${IMG26}/matlishious_05.jpeg`, position: 6, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_05.jpg`] },
  { name: "06", colorHex: "#BE5C65", imageUrl: `${IMG26}/matlishious_06.jpeg`, position: 7, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_06.jpg`] },
  { name: "07", colorHex: "#C26F7F", imageUrl: `${IMG26}/matlishious_07.jpeg`, position: 8, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_07.jpg`] },
  { name: "08", colorHex: "#D48999", imageUrl: `${IMG26}/matlishious_08.jpeg`, position: 9, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_08.jpg`] },
  { name: "09", colorHex: "#A06365", imageUrl: `${IMG26}/matlishious_09.jpeg`, position: 10, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_09.jpg`] },
  { name: "10", colorHex: "#931A2E", imageUrl: `${IMG26}/matlishious_10.jpeg`, position: 11, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_10.jpg`] },
  { name: "11", colorHex: "#BE3F4C", imageUrl: `${IMG25}/matlishious_11.png`, position: 12, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_11.jpg`] },
  { name: "13", colorHex: "#831924", imageUrl: `${IMG26}/matlishious_13.jpeg`, position: 13, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_13.jpg`] },
  { name: "14", colorHex: "#A84359", imageUrl: `${IMG26}/matlishious_14.jpeg`, position: 14, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_14.jpg`] },
  { name: "15", colorHex: "#512D35", imageUrl: `${IMG26}/matlishious_15.jpeg`, position: 15, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_15.jpg`] },
  { name: "16", colorHex: "#622729", imageUrl: `${IMG26}/matlishious_16.jpeg`, position: 16, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_16.jpg`] },
  { name: "28", colorHex: "#BE7272", imageUrl: `${IMG26}/matlishious_28.jpeg`, position: 17, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_28.jpg`] },
  { name: "41", colorHex: "#B96079", imageUrl: `${IMG26}/matlishious_41.jpeg`, position: 18, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_41.jpg`] },
  { name: "46", colorHex: "#DF74A5", imageUrl: `${IMG26}/matlishious_46.jpeg`, position: 19, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_46.jpg`] },
  { name: "47", colorHex: "#FE247E", imageUrl: `${IMG26}/matlishious_47.jpeg`, position: 20, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_47.jpg`] },
  { name: "48", colorHex: "#B96EA6", imageUrl: `${IMG26}/matlishious_48.jpeg`, position: 21, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_48.jpg`] },
  { name: "51", colorHex: "#C38091", imageUrl: `${IMG26}/matlishious_51.jpeg`, position: 22, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_51.jpg`] },
  { name: "52", colorHex: "#DC899A", imageUrl: `${IMG26}/matlishious_52.jpeg`, position: 23, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_52.jpg`] },
  { name: "53", colorHex: "#D68689", imageUrl: `${IMG26}/matlishious_53.jpeg`, position: 24, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_53.jpg`] },
  { name: "54", colorHex: "#BB776E", imageUrl: `${IMG26}/matlishious_54.jpeg`, position: 25, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_54.jpg`] },
  { name: "55", colorHex: "#B36A63", imageUrl: `${IMG26}/matlishious_55.jpeg`, position: 26, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_55.jpg`] },
  { name: "56", colorHex: "#7E3D43", imageUrl: `${IMG26}/matlishious_56.jpeg`, position: 27, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_56.jpg`] },
  { name: "57", colorHex: "#9E0655", imageUrl: `${IMG26}/matlishious_57_uva5RnC.jpg`, position: 28, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_57.jpeg`, `${IMG26}/matlishious_57.jpg`] },
  { name: "58", colorHex: "#7F0406", imageUrl: `${IMG26}/matlishious_58.jpeg`, position: 29, price: SHADE_PRICE, fallbacks: [`${IMG26}/matlishious_58.jpg`, `${IMG26}/matlishious_58_1_9Y6ntc7.png`] },
  {
    name: "59",
    colorHex: "#B77578",
    imageUrl: `${IMG26}/Seventeen_matlishious_59_5.jpg`,
    position: 30,
    price: SHADE_PRICE,
    fallbacks: [`${IMG26_06}/matlishious_59_2.png`, `${IMG26}/Seventeen_matlishious_59_2.jpg`],
  },
  {
    name: "60",
    colorHex: "#E9A0B4",
    imageUrl: `${IMG26}/Seventeen_matlishious_60_5.jpg`,
    position: 31,
    price: SHADE_PRICE,
    fallbacks: [`${IMG26_06}/matlishious_60_2.png`, `${IMG26}/Seventeen_matlishious_60_2.jpg`],
  },
];

const PRODUCT_IMAGES = [
  `${IMG20}/5201641753538.jpg`,
  `${IMG26}/matlishious_03.jpeg`,
  `${IMG26}/matlishious_03.jpg`,
  `${IMG26_06}/Matlishious-Lip-Color-Swatches.webp`,
  `${IMG26}/matlishious_01.jpeg`,
  `${IMG26}/matlishious_10.jpeg`,
  `${IMG26}/matlishious_50.jpeg`,
  `${IMG26}/Seventeen_matlishious_60_5.jpg`,
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
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("jpeg") || contentType.includes("jpg")
          ? "jpg"
          : "jpg";
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
    await new Promise((r) => setTimeout(r, attempt * 1000));
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
      console.log(`    retry: ${e instanceof Error ? e.message : e}`);
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
    const imageId = await uploadWithFallbacks(shade.imageUrl, shade.fallbacks ?? [], `shade-${shade.name}`);
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
    await new Promise((r) => setTimeout(r, 250));
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
    shades?: Array<{ name?: string; barcode?: string | null; colorHex?: string }>;
  }>(`/products/${created.id}`);
  const shadeRows = verify.shades ?? [];
  const withBarcode = shadeRows.filter((s) => s.barcode);

  console.log(`\n✓ ${PRODUCT.nameEn}`);
  console.log(`  AR: ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode} (product only — shade 03)`);
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
