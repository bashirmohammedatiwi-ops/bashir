/**
 * Seventeen Matte Brow Powder All Day Wear — 5 official shades, 1g, no shade barcodes.
 * Sources:
 * - seventeencosmetics.com (Matte Brow Powder / All Day Wear; official 03 open pack + hex chip #703F21)
 * - Epharmadora packshots for shades 01–05
 * Product barcode: 5201641733318 (shade 02 Dark Brown)
 * Hex: applicator-tip trimmed-mean from packshots; 03 uses official colour chip
 * Price: Alshaheera Iraq 21,500 IQD
 * Usage: npx tsx scripts/add-seventeen-matte-brow-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const OFF = "https://seventeencosmetics.com/media/images/products/2024/12";
const EPH = "https://epharmadora.com/mediastream/w640/files/products";

const SHADE_PRICE = 21500;

const PRODUCT = {
  barcode: "5201641733318",
  slug: "seventeen-matte-brow-powder-all-day-wear-1g",
  sku: "SVN-MBP-733318",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - بودرة حواجب Matte Brow Powder مطفية تدوم طوال اليوم مع رأس إسفنجي 1 غ",
  nameEn: "Seventeen - Matte Brow Powder All Day Wear with Sponge Tip Applicator 1g",
  descriptionAr:
    "بودرة حواجب Matte Brow Powder All Day Wear من سيفينتين — بودرة مطفية ناعمة تملأ الفراغات وتشكّل الحاجب بدقة بمظهر طبيعي كثيف يثبت طوال اليوم، مع رأس إسفنجي مدمج للتطبيق السهل والمضبوط.\n\n" +
    "• لمسة مطفية طبيعية بدون لمعان — تملأ وتحدّد الحواجب بمظهر مرتّب.\n" +
    "• رأس إسفنجي دقيق مدمج في الغطاء لتوزيع كمية مناسبة ودمج سلس.\n" +
    "• ثبات طوال اليوم (All Day Wear) يناسب الروتين اليومي والجو العراقي.\n" +
    "• قوام بودرة ناعم سهل البناء من إطلالة خفيفة إلى أوضح حسب الرغبة.\n" +
    "• حجم 1 غ — 5 درجات رسمية من الأسود إلى الأشقر.\n\n" +
    "طريقة الاستخدام: أزيلي الغطاء واستخدمي الرأس الإسفنجي لالتقاط كمية صغيرة من البودرة، ثم ارسمي بضربات خفيفة باتجاه نمو الشعيرات لملء الفراغات وتشكيل القوس. أضيفي طبقات خفيفة حتى الكثافة المطلوبة.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Black — أسود\n" +
    "• 02 Dark Brown — بني غامق\n" +
    "• 03 Red Brown — بني محمر\n" +
    "• 04 Medium Brown — بني متوسط\n" +
    "• 05 Blond — أشقر",
  descriptionEn:
    "Seventeen Matte Brow Powder All Day Wear — a soft matte brow powder that fills gaps and shapes brows with a natural, defined finish that lasts all day, paired with a built-in sponge-tip applicator for precise, effortless application.\n\n" +
    "• Natural matte finish — fills and defines brows without shine.\n" +
    "• Built-in sponge tip in the cap for controlled pickup and seamless blending.\n" +
    "• All Day Wear formula for everyday hold.\n" +
    "• Soft, buildable powder from a soft fill to a more defined look.\n" +
    "• 1g — 5 official shades from Black to Blond.\n\n" +
    "How to use: Unscrew the cap and use the sponge tip to pick up a small amount of powder. Apply in light strokes following hair growth to fill sparse areas and shape the arch. Build in thin layers until you reach the desired intensity.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Black\n" +
    "• 02 Dark Brown\n" +
    "• 03 Red Brown\n" +
    "• 04 Medium Brown\n" +
    "• 05 Blond",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade names; hex from tip pigment (03 = official colour chip #703F21). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Black",
    colorHex: "#2A2B2B",
    imageUrl: `${EPH}/c24386cda8acc8afcdb2d7b783a27d87.jpg.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02 Dark Brown",
    colorHex: "#4C3F3B",
    imageUrl: `${EPH}/a1219f9c40f7c220c2ee89b95588f6fe.jpg.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "03 Red Brown",
    colorHex: "#703F21",
    imageUrl: `${EPH}/576b6281cf38c681c98b9a0c16bfb4d4.jpg.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "04 Medium Brown",
    colorHex: "#53403B",
    imageUrl: `${EPH}/edd2f1ffcc90007f489aa12cdeae2d37.jpg.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "05 Blond",
    colorHex: "#5E504C",
    imageUrl: `${EPH}/32094ba00292db190151acfb065d6a67.jpg.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
];

/** Product gallery: official open pack + per-shade packshots (02 first = barcode shade). */
const PRODUCT_IMAGES = [
  `${EPH}/a1219f9c40f7c220c2ee89b95588f6fe.jpg.jpg`,
  `${OFF}/seventeen_matte_brow_powder_03_1.jpg`,
  `${OFF}/seventeen_matte_brow_powder_03_2.jpg`,
  `${EPH}/c24386cda8acc8afcdb2d7b783a27d87.jpg.jpg`,
  `${EPH}/576b6281cf38c681c98b9a0c16bfb4d4.jpg.jpg`,
  `${EPH}/edd2f1ffcc90007f489aa12cdeae2d37.jpg.jpg`,
  `${EPH}/32094ba00292db190151acfb065d6a67.jpg.jpg`,
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
    await new Promise((r) => setTimeout(r, 450));
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
    await new Promise((r) => setTimeout(r, 450));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [BROW_PENCIL],
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
  console.log(`  Category: Makeup → Eyebrow → Brow Pencil`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
