/**
 * Seventeen Matte Lasting Lipstick SPF15 — 33 official shades, 3.5g, no shade barcodes.
 * Sources:
 * - seventeencosmetics.com/en/catalogue/matte-lasting-lipstick-spf15_177/
 *   (official hex chips, shade labels, pack PNGs; 85/86 gallery 2026/03)
 * Product barcode: 5201641718773 (shade 02)
 * Hex: official color-select__option__hex chips
 * Price: Vanilla Cosmetics Iraq 17,500 IQD
 * Usage: npx tsx scripts/add-seventeen-matte-lasting-lipstick-spf15-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const IMG = "https://seventeencosmetics.com/media/images/products";
const IMG_25 = `${IMG}/2025/11`;
const IMG_26_03 = `${IMG}/2026/03`;
const IMG_26_06 = `${IMG}/2026/06`;

const SHADE_PRICE = 17500;

const PRODUCT = {
  barcode: "5201641718773",
  slug: "seventeen-matte-lasting-lipstick-spf15-3-5g",
  sku: "SVN-MLLS-718773",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - أحمر شفاه Matte Lasting Lipstick مطفي ثابت مرطب مع SPF15 حجم 3.5 غ",
  nameEn: "Seventeen - Matte Lasting Lipstick SPF15 Long-Wear Matte Hydrating Lipstick 3.5g",
  descriptionAr:
    "أحمر شفاه Matte Lasting Lipstick SPF15 من سيفينتين — لون غني بلمسة مطفية ثابتة طوال اليوم مع ترطيب لا يجفّف الشفاه، بفضل زبدة المانجو البري وزيت الجوجوبا، وحماية شمسية SPF15 تناسب الاستخدام اليومي تحت شمس العراق.\n\n" +
    "• نتيجة مطفية أنيقة ولون غني متساوٍ من أول تمريرة.\n" +
    "• ثبات طويل يقلّل الحاجة لإعادة التطبيق خلال اليوم.\n" +
    "• لا يجفّف الشفاه — مرطّب بـ Wild Mango وJojoba Oil.\n" +
    "• حماية SPF15 من أشعة الشمس.\n" +
    "• خالٍ من الغلوتين — مُختبر جلدياً.\n" +
    "• حجم 3.5 غ — 33 درجة رسمية من النود والوردي إلى الأحمر والجرئ.\n\n" +
    "طريقة الاستخدام: طبّقي أحمر الشفاه على الشفاه من المنتصف نحو الزوايا. لنتيجة أعمق أعيدي طبقة خفيفة. لتحديد أدق استخدمي قلم تحديد مطابق قبل التطبيق.\n\n" +
    "الدرجات المتوفرة (الأسماء/الأرقام الرسمية):\n" +
    "• 01 · 02 · 03 · 04 · 05 · 06 · 09 · 10 · 11 · 15 · 16 · 23 · 29 · 30 · 33 · 35 · 37\n" +
    "• 45 · 46 · 47 · 48 · 57 · 58 · 61 · 75\n" +
    "• 77 Hot Pink · 78 Sunset Orange\n" +
    "• 81 · 82 · 83 · 84 · 85 · 86",
  descriptionEn:
    "Seventeen Matte Lasting Lipstick SPF15 — rich, long-lasting matte colour that won’t dry out your lips, enriched with Wild Mango and Jojoba Oil, plus SPF15 sun protection for comfortable all-day wear.\n\n" +
    "• Elegant matte finish with rich, even colour payoff.\n" +
    "• Long-lasting wear that stays true through the day.\n" +
    "• Won’t dry lips — hydrating Wild Mango & Jojoba Oil care.\n" +
    "• SPF15 sun protection.\n" +
    "• Gluten-free — dermatologically tested.\n" +
    "• 3.5g — 33 official shades from nudes and pinks to reds and bold tones.\n\n" +
    "How to use: Apply on the lips from the centre outward. For a more intense result, reapply a light layer. For sharper definition, outline with a matching lip liner first.\n\n" +
    "Available shades (official codes/names):\n" +
    "• 01 · 02 · 03 · 04 · 05 · 06 · 09 · 10 · 11 · 15 · 16 · 23 · 29 · 30 · 33 · 35 · 37\n" +
    "• 45 · 46 · 47 · 48 · 57 · 58 · 61 · 75\n" +
    "• 77 Hot Pink · 78 Sunset Orange\n" +
    "• 81 · 82 · 83 · 84 · 85 · 86",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official catalogue order; hex from official colour chips; images from official CDN. */
const SHADES: ShadeInput[] = [
  { name: "75", colorHex: "#8A5057", imageUrl: `${IMG_25}/matte_lasting_75.png`, position: 0, price: SHADE_PRICE },
  { name: "10", colorHex: "#C10015", imageUrl: `${IMG_25}/matte_lasting_lipstick_10.png`, position: 1, price: SHADE_PRICE },
  { name: "01", colorHex: "#CA7A71", imageUrl: `${IMG_25}/matte_lasting_01.png`, position: 2, price: SHADE_PRICE },
  { name: "02", colorHex: "#D67275", imageUrl: `${IMG_25}/matte_lasting_02.png`, position: 3, price: SHADE_PRICE },
  { name: "03", colorHex: "#BB5556", imageUrl: `${IMG_25}/matte_lasting_03.png`, position: 4, price: SHADE_PRICE },
  { name: "04", colorHex: "#B33740", imageUrl: `${IMG_25}/matte_lasting_04.png`, position: 5, price: SHADE_PRICE },
  { name: "05", colorHex: "#A72E37", imageUrl: `${IMG_25}/matte_lasting__05.png`, position: 6, price: SHADE_PRICE },
  { name: "06", colorHex: "#EE467A", imageUrl: `${IMG_25}/matte_lasting_06.png`, position: 7, price: SHADE_PRICE },
  { name: "09", colorHex: "#B25E6D", imageUrl: `${IMG_25}/matte_lasting_09.png`, position: 8, price: SHADE_PRICE },
  { name: "11", colorHex: "#B12237", imageUrl: `${IMG_25}/matte_lasting_lipstick_11.png`, position: 9, price: SHADE_PRICE },
  { name: "15", colorHex: "#DF798E", imageUrl: `${IMG_25}/matte_lasting_lipstick_15.png`, position: 10, price: SHADE_PRICE },
  { name: "16", colorHex: "#DC608E", imageUrl: `${IMG_25}/matte_lasting_lipstick_16.png`, position: 11, price: SHADE_PRICE },
  { name: "23", colorHex: "#DD6878", imageUrl: `${IMG_25}/matte_lasting_23.png`, position: 12, price: SHADE_PRICE },
  { name: "29", colorHex: "#7A001C", imageUrl: `${IMG_25}/matte_lasting_lipstick_29.png`, position: 13, price: SHADE_PRICE },
  { name: "30", colorHex: "#EF6F86", imageUrl: `${IMG_25}/matte_lasting_30.png`, position: 14, price: SHADE_PRICE },
  { name: "33", colorHex: "#C6678F", imageUrl: `${IMG_25}/matte_lasting_lipstick_33.png`, position: 15, price: SHADE_PRICE },
  { name: "35", colorHex: "#E78B80", imageUrl: `${IMG_25}/matte_lasting_35.png`, position: 16, price: SHADE_PRICE },
  { name: "37", colorHex: "#A74144", imageUrl: `${IMG_25}/matte_lasting_37.png`, position: 17, price: SHADE_PRICE },
  { name: "45", colorHex: "#D46A6A", imageUrl: `${IMG_25}/matte_lasting_45.png`, position: 18, price: SHADE_PRICE },
  { name: "46", colorHex: "#E59179", imageUrl: `${IMG_25}/matte_lasting_46.png`, position: 19, price: SHADE_PRICE },
  { name: "47", colorHex: "#CE8C98", imageUrl: `${IMG_25}/matte_lasting_lipstick_47.png`, position: 20, price: SHADE_PRICE },
  { name: "48", colorHex: "#D6878B", imageUrl: `${IMG_25}/matte_lasting_48.png`, position: 21, price: SHADE_PRICE },
  { name: "57", colorHex: "#B55040", imageUrl: `${IMG_25}/matte_lasting_57.png`, position: 22, price: SHADE_PRICE },
  { name: "58", colorHex: "#D68A7A", imageUrl: `${IMG_25}/matte_lasting_58.png`, position: 23, price: SHADE_PRICE },
  { name: "61", colorHex: "#A8636A", imageUrl: `${IMG_25}/matte_lasting_61.png`, position: 24, price: SHADE_PRICE },
  { name: "77 Hot Pink", colorHex: "#A4606B", imageUrl: `${IMG_25}/matte_lasting_77.png`, position: 25, price: SHADE_PRICE },
  { name: "78 Sunset Orange", colorHex: "#B35144", imageUrl: `${IMG_25}/matte_lasting_lipstick_78.png`, position: 26, price: SHADE_PRICE },
  { name: "81", colorHex: "#F42969", imageUrl: `${IMG_25}/matte_lasting_81.png`, position: 27, price: SHADE_PRICE },
  { name: "82", colorHex: "#CF2C4D", imageUrl: `${IMG_25}/matte_lasting_lipstick_82.png`, position: 28, price: SHADE_PRICE },
  { name: "83", colorHex: "#7B0733", imageUrl: `${IMG_25}/matte_lasting_lipstick_83_BchWSkM.png`, position: 29, price: SHADE_PRICE },
  { name: "84", colorHex: "#5D1117", imageUrl: `${IMG_25}/matte_lasting_lipstick_84.png`, position: 30, price: SHADE_PRICE },
  { name: "85", colorHex: "#E3474A", imageUrl: `${IMG_26_03}/1_OoTkbJZ.jpg`, position: 31, price: SHADE_PRICE },
  { name: "86", colorHex: "#B07064", imageUrl: `${IMG_26_03}/3_K1Ktx0O.jpg`, position: 32, price: SHADE_PRICE },
];

/** Product gallery: barcode shade + open packs + swatches + new shades. */
const PRODUCT_IMAGES = [
  `${IMG_25}/matte_lasting_02.png`,
  `${IMG_25}/matte_lasting_02_2.png`,
  `${IMG_26_06}/Matt-Lasting-Lipstick-Swatches.png`,
  `${IMG_26_06}/sev_eshop_1200x1200_EN4.jpg`,
  `${IMG_25}/matte_lasting_01.png`,
  `${IMG_25}/matte_lasting_lipstick_10.png`,
  `${IMG_26_03}/1_OoTkbJZ.jpg`,
  `${IMG_26_03}/2_3L1QzN8.jpg`,
  `${IMG_26_03}/3_K1Ktx0O.jpg`,
  `${IMG_26_03}/4_MR5GGJY.jpg`,
  `${IMG_25}/matte_lasting_77.png`,
  `${IMG_25}/matte_lasting_lipstick_78.png`,
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login: ${(json as { message?: string }).message ?? res.statusText}`);
  const data = (json as { data?: { accessToken?: string; token?: string } }).data ?? json;
  token =
    (data as { accessToken?: string }).accessToken ??
    (data as { token?: string }).token ??
    (json as { accessToken?: string }).accessToken ??
    "";
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
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "سيفينتين",
    brandEn: "Seventeen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Seventeen brand");
  console.log(`Brand: Seventeen (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
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
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists && check.product?.id) {
    await api(`/products/${check.product.id}`, "DELETE");
    console.log(`deleted existing: ${check.product.nameAr ?? PRODUCT.barcode}\n`);
  }

  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
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
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price,
      originalPrice: shade.price,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.price} IQD`);
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  const gallerySet = new Set<string>();
  for (const url of PRODUCT_IMAGES) {
    if (gallerySet.has(url)) continue;
    gallerySet.add(url);
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery ${url.split("/").pop()}`);
    } catch (e) {
      console.log(`  ✗ skip ${url.split("/").pop()}: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.price,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string; price?: number }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    barcode?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  if ((verify.shades?.length ?? 0) !== SHADES.length) {
    throw new Error(`Expected ${SHADES.length} shades, got ${verify.shades?.length ?? 0}`);
  }

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length} (no shade barcodes)`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.price ?? "?"} IQD`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
