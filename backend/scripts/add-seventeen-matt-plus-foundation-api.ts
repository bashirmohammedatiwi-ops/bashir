/**
 * Seventeen Matt Plus Foundation SPF20 — shine-control matte liquid foundation 30ml
 * 6 official shades with names + hex + images (NO shade barcodes).
 * Product barcode: 5201641724088 (shade 03 Natural Beige)
 *
 * Sources: seventeencosmetics.com/en/catalogue/matt-plus-liquid-foundation-spf20_1/
 * Hex: official color-select / ProductGroup schema
 *
 * Usage: npx tsx scripts/add-seventeen-matt-plus-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG26 = "https://seventeencosmetics.com/media/images/products/2026/07";
const IMG24 = "https://seventeencosmetics.com/media/images/products/2024/06";
const IMG19 = "https://seventeencosmetics.com/media/images/products/2019/12";

const SHADE_PRICE = 22000;

const PRODUCT = {
  barcode: "5201641724088",
  slug: "seventeen-matt-plus-foundation-spf20-shine-control-30ml",
  sku: "SEV-MATTPLUS-724088",
  price: SHADE_PRICE,
  originalPrice: 26000,
  nameAr: "سفنتيين - فاونديشن Matt Plus مات للبشرة المختلطة والدهنية بتحكم لمعان SPF20 سعة 30 مل",
  nameEn: "Seventeen Matt Plus Shine Control Foundation SPF20 Matte for Combination & Oily Skin 30ml",
  descriptionAr:
    "فاونديشن Matt Plus Shine Control من سفنتيين — تغطية متوسطة قابلة للبناء بإنهاء مات خفيف يوازن افراز الدهون ويقلّل مظهر المسام والعيوب طوال اليوم.\n\n" +
    "• تركيبة غير دهنية مثالية للبشرة المختلطة والدهنية مع ثبات طويل دون مظهر لامع مزعج.\n" +
    "• غني بالسيراميد وفيتامين C وE لترطيب الحاجز الجلدي وإشراقة متجانسة وحماية مضادة للأكسدة.\n" +
    "• حماية SPF20 ضد أشعة الشمس والشيخوخة الضوئية — مناسبة لأيام العراق الحارة.\n" +
    "• 30 مل — 6 درجات رسمية بأسماء Seventeen.\n" +
    "• باركود هذا المنتج لدرجة 03 Natural Beige — بيج طبيعي يناسب البشرة الفاتحة إلى المتوسطة.\n" +
    "• مُختبر جلدياً — خالٍ من الغلوتين.\n\n" +
    "طريقة الاستخدام: رجّي العبوة جيداً. ضعي كمية صغيرة بفرشاة أو إسفنجة أو الأصابع بحركات دائرية من وسط الوجه نحو الخارج والرقبة.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Light Beige — بيج فاتح\n" +
    "• 02 Rosy Beige — بيج وردي\n" +
    "• 03 Natural Beige — بيج طبيعي (درجة هذا الباركود)\n" +
    "• 04 Medium Beige — بيج متوسط\n" +
    "• 05 Dark Beige — بيج داكن\n" +
    "• 06 Caramel — كراميل دافئ",
  descriptionEn:
    "Seventeen Matt Plus Shine Control Foundation SPF20 — a lightweight foundation with buildable medium coverage for an even-toned, smooth complexion and comfortable matte wear.\n\n" +
    "• Shine Control formula helps balance excess oil and minimize the look of shine, pores and imperfections while letting skin breathe.\n" +
    "• Enriched with Ceramides and Vitamins C & E to support the skin barrier, brightness and antioxidant protection.\n" +
    "• SPF20 protects against UV damage and photoaging — ideal for combination to oily skin and hot climates.\n" +
    "• 30ml — 6 official shades with official Seventeen colour names.\n" +
    "• This barcode is shade 03 Natural Beige — a natural beige for fair to light-medium complexions.\n" +
    "• Dermatologically tested — gluten-free.\n\n" +
    "How to use: Shake well. Apply a small amount with a brush, sponge or fingertips in circular motions from the centre of the face outward toward the neck and contours.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Light Beige\n" +
    "• 02 Rosy Beige\n" +
    "• 03 Natural Beige (this barcode’s shade)\n" +
    "• 04 Medium Beige\n" +
    "• 05 Dark Beige\n" +
    "• 06 Caramel",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
  fallbacks?: string[];
};

/** Official shade names + official hex from seventeencosmetics.com */
const SHADES: ShadeInput[] = [
  {
    name: "01 Light Beige",
    colorHex: "#D3AD9A",
    imageUrl: `${IMG26}/seventeen_matt_plus_01.jpg`,
    position: 0,
    price: SHADE_PRICE,
    fallbacks: [`${IMG24}/seventeen_matt_plus_01_txtr.jpg`, `${IMG24}/5201641724064.jpg`],
  },
  {
    name: "02 Rosy Beige",
    colorHex: "#CC947B",
    imageUrl: `${IMG26}/seventeen_matt_plus_02.jpg`,
    position: 1,
    price: SHADE_PRICE,
    fallbacks: [`${IMG24}/seventeen_matt_plus_02_txtr.jpg`, `${IMG24}/5201641724071.jpg`],
  },
  {
    name: "03 Natural Beige",
    colorHex: "#CDA28F",
    imageUrl: `${IMG26}/seventeen_matt_plus_03.jpg`,
    position: 2,
    price: SHADE_PRICE,
    fallbacks: [`${IMG24}/seventeen_matt_plus_03_txtr.jpg`, `${IMG24}/5201641724088.jpg`],
  },
  {
    name: "04 Medium Beige",
    colorHex: "#B78C6A",
    imageUrl: `${IMG26}/seventeen_matt_plus_04.jpg`,
    position: 3,
    price: SHADE_PRICE,
    fallbacks: [`${IMG24}/seventeen_matt_plus_04_txtr.jpg`, `${IMG24}/5201641724095.jpg`],
  },
  {
    name: "05 Dark Beige",
    colorHex: "#BD8973",
    imageUrl: `${IMG24}/5201641724101.jpg`,
    position: 4,
    price: SHADE_PRICE,
    fallbacks: [`${IMG24}/seventeen_matt_plus_05_txtr.jpg`],
  },
  {
    name: "06 Caramel",
    colorHex: "#C79071",
    imageUrl: `${IMG24}/5201641724118.jpg`,
    position: 5,
    price: SHADE_PRICE,
    fallbacks: [`${IMG24}/seventeen_matt_plus_06_txtr.jpg`],
  },
];

const PRODUCT_IMAGES = [
  `${IMG24}/5201641724088.jpg`,
  `${IMG26}/seventeen_matt_plus_03.jpg`,
  `${IMG24}/seventeen_matt_plus_03_txtr.jpg`,
  `${IMG26}/matte_plus_copy_3.jpg`,
  `${IMG19}/Matt-Plus.jpg`,
  `${IMG26}/seventeen_matt_plus_01.jpg`,
  `${IMG24}/5201641724118.jpg`,
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
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
  console.log(`  Barcode: ${PRODUCT.barcode} (product only — 03 Natural Beige)`);
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
