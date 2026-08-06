/**
 * Seventeen Magic Serum Cooling Roll-on Concealer — 6 official shades, 9ml, no shade barcodes.
 * Sources:
 * - seventeencosmetics.com/en/catalogue/magic-serum-concealer_1337/
 *   (official hex chips, texture swatches, pack photos)
 * - Epharmadora packshots for shades lacking official pack CDN files
 * Product barcode: 5201641019535 (shade 03)
 * Hex: official color-select__option__hex chips
 * Price: aligned to EU 15.50€ / regional ~8.95 JOD → 22,000 IQD
 * Usage: npx tsx scripts/add-seventeen-magic-serum-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const IMG = "https://seventeencosmetics.com/media/images/products";
const IMG_23 = `${IMG}/2023/10`;
const IMG_24 = `${IMG}/2024/07`;
const IMG_25 = `${IMG}/2025/04`;
const EPH = "https://epharmadora.com/mediastream/w640/files/products";

const SHADE_PRICE = 22000;

const PRODUCT = {
  barcode: "5201641019535",
  slug: "seventeen-magic-serum-cooling-roll-on-concealer-9ml",
  sku: "SVN-MSC-019535",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - كونسيلر سيروم Magic Serum Cooling Roll-on مرطب مبرّد للهالات بتغطية متوسطة 9 مل",
  nameEn: "Seventeen - Magic Serum Cooling Roll-on Concealer Hydrating Medium Coverage 9ml",
  descriptionAr:
    "كونسيلر سيروم Magic Serum Cooling Roll-on من سيفينتين — هجين بين سيروم العناية وكونسيلر التغطية: يخفي الهالات والتعب والعيوب بلمسة نديّة طبيعية، مع رأس رول-أون معدني يبرّد ويدلك منطقة تحت العين أثناء التطبيق.\n\n" +
    "• تغطية متوسطة إلى عالية قابلة للبناء بدرجات طبيعية تناسب ألوان البشرة المختلفة.\n" +
    "• قوام خفيف غير دهني يُمتص بسرعة دون تكتّل أو تشقّق في خطوط التعبير حول العين.\n" +
    "• رأس معدني رول-أون يمنح إحساساً منعشاً وتأثيراً مضاداً للانتفاخ مع كل تمريرة.\n" +
    "• غني بزبدة المانجو البري وزبدة الشيا وزيت الخروع للترطيب ومضادات الأكسدة والعناية المضادة للتجاعيد.\n" +
    "• فيغن — خالٍ من الغلوتين والمايكروبلاستيك — مُختبر جلدياً وعينياً.\n" +
    "• حجم 9 مل — 6 درجات رسمية طبيعية.\n\n" +
    "طريقة الاستخدام: رجّي العبوة جيداً قبل الاستخدام، ثم مرّري الرأس المعدني تحت العينين والمناطق التي تحتاج تغطية. ستشعرين ببرودة خفيفة وتدليك لطيف أثناء التطبيق. ادمِجي بأطراف الأصابع إن لزم.\n\n" +
    "الدرجات المتوفرة (الأرقام الرسمية):\n" +
    "• 01 — فاتح جداً دافئ\n" +
    "• 02 — فاتح بيج\n" +
    "• 2A — فاتح متوسط محايد\n" +
    "• 03 — متوسط بيج طبيعي\n" +
    "• 04 — متوسط دافئ حنطي\n" +
    "• 5 — حنطي ذهبي أعمق",
  descriptionEn:
    "Seventeen Magic Serum Cooling Roll-on Concealer — your go-to hybrid serum-concealer. A long-lasting, depuffing formula that covers dark circles, blemishes and tiredness while moisturizing and caring for the under-eye area, with a metallic roll-on tip for a refreshing cool massage on application.\n\n" +
    "• Medium-to-high buildable coverage in natural shades that suit a wide range of skin tones.\n" +
    "• Lightweight, non-oily texture that absorbs quickly without caking or creasing in fine lines.\n" +
    "• Metallic roll-on tip delivers a refreshing, mild massage and helps roll away the look of puffiness.\n" +
    "• Enriched with wild mango butter, shea butter and castor oil for moisturizing, antioxidant and anti-wrinkle care.\n" +
    "• Vegan — gluten-free — microplastics-free — dermatologically and ophthalmologically tested.\n" +
    "• 9ml — 6 official natural shades.\n\n" +
    "How to use: Shake well before use and roll onto the under-eye area and any spots that need coverage. You’ll feel a refreshing cool sensation and a mild massage while applying. Blend with fingertips if needed.\n\n" +
    "Available shades (official codes):\n" +
    "• 01 — very light warm\n" +
    "• 02 — light beige\n" +
    "• 2A — light-medium neutral\n" +
    "• 03 — medium natural beige\n" +
    "• 04 — medium warm\n" +
    "• 5 — deeper golden tan",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade codes; hex from official colour chips; images = official texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01",
    colorHex: "#E7BAA1",
    imageUrl: `${IMG_23}/seventeen_magic_serum_concealer_01_txtr.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02",
    colorHex: "#E0AF93",
    imageUrl: `${IMG_23}/seventeen_magic_serum_concealer_02_txtr.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "2A",
    colorHex: "#DDAF94",
    imageUrl: `${IMG_24}/seventeen_magic_serum_concealer_2A_txtr.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "03",
    colorHex: "#DEAD8F",
    imageUrl: `${IMG_23}/seventeen_magic_serum_concealer_03_txtr.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "04",
    colorHex: "#DA9F7D",
    imageUrl: `${IMG_23}/seventeen_magic_serum_concealer_04_txtr.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "5",
    colorHex: "#D49472",
    imageUrl: `${IMG_24}/seventeen_magic_serum_concealer_05_txtr.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
];

/** Product gallery: barcode shade pack + official packs + swatches + open shots. */
const PRODUCT_IMAGES = [
  `${EPH}/0915670f948b092800347e3710c20006.jpg`,
  `${IMG_23}/seventeen_magic_serum_concealer_01.jpg`,
  `${IMG_24}/seventeen_magic_serum_concealer_02.jpg`,
  `${IMG_23}/seventeen_magic_serum_concealer_02.jpg`,
  `${IMG_23}/seventeen_magic_serum_concealer_02_VZ3BQFf.jpg`,
  `${IMG_23}/seventeen_magic_serum_concealer_02_KlAgkux.jpg`,
  `${IMG_23}/seventeen_magic_serum_concealer_02_HeBw6MT.jpg`,
  `${IMG_25}/swatches_magic_ser_concealer.jpg`,
  `${EPH}/e2ca04c4518d4848e1b403a4c0709beb.jpg`,
  `${EPH}/a5f7fb004bbc3872853de33f66b067a5.jpg`,
  `${EPH}/5bed614b67c43e76e84ecde0f288607d.jpg`,
  `${IMG_23}/seventeen_magic_serum_concealer_03_txtr.jpg`,
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

  console.log("Uploading shade images (official textures)...");
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
    await new Promise((r) => setTimeout(r, 400));
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
    await new Promise((r) => setTimeout(r, 400));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
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
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
