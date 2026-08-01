/**
 * Deborah Super Vinyl No Transfer Shake Lipstick — 10 shades (01–10).
 * Sources: profumeriemallardo.com + deborahmilano.com (shade names, images, description)
 * Product barcode: 8009518442120 (Rose 01)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-super-vinyl-no-transfer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const DM_IMG = "https://www.deborahmilano.com/en/wp-content/uploads";

const PRODUCT = {
  barcode: "8009518442120",
  slug: "deborah-super-vinyl-no-transfer-shake-lipstick",
  sku: "DBR-SVN-90500",
  price: 11550,
  nameAr: "ديبورا ميلانو - أحمر شفاه Super Vinyl No Transfer Shake",
  nameEn: "Deborah Milano - Super Vinyl No Transfer Shake Lipstick",
  descriptionAr:
    "Super Vinyl No Transfer Shake Lipstick من ديبورا ميلانو — روژ سائل فائق اللمعان بمظهر فينيلي يدوم حتى 16 ساعة.\n\n" +
    "• لون ساطع بلمعة مرآة وتغطية كاملة من أول طبقة.\n" +
    "• تركيبة No Transfer مقاومة للانتقال والتلفّ.\n" +
    "• فيلم مرن لامع يلتصق بالشفاه طوال اليوم.\n" +
    "• قوام فائق السيولة خفيف وسهل التمديد.\n" +
    "• لون مكثّف مقاوم للماء مع لمسة نهائية لامعة.\n" +
    "• 10 درجات: من Rose وCaramel إلى Marsala وSO 90s.\n" +
    "• يُرجّ جيداً لمدة 10 ثوانٍ على الأقل قبل الاستخدام.\n" +
    "• يُطبّق طبقة رقيقة ويُترك ليجفّ ثوانٍ مع فصل الشفتين قليلاً.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Super Vinyl No Transfer Shake Lipstick — ultra-glossy vinyl-effect liquid lipstick with up to 16-hour wear.\n\n" +
    "• Brilliant mirror-shine colour with full coverage from the first swipe.\n" +
    "• No Transfer formula for a smudge-proof look.\n" +
    "• Flexible glossy film that adheres comfortably to lips all day.\n" +
    "• Ultra-fluid, lightweight texture that glides on easily.\n" +
    "• Intense water-resistant colour with an impeccable glossy finish.\n" +
    "• 10 shades from Rose and Caramel to Marsala and SO 90s.\n" +
    "• Shake well for at least 10 seconds before use.\n" +
    "• Apply a thin layer and let dry for a few seconds with lips slightly parted.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Rose",
    colorHex: "#a04850",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/181636-large_default/deb-rs-super-vinyl-01.jpg",
    position: 0,
  },
  {
    name: "02 Caramel",
    colorHex: "#904840",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/181638-large_default/deb-rs-super-vinyl-02.jpg",
    position: 1,
  },
  {
    name: "03 Cherry Pink",
    colorHex: "#a81848",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/181640-large_default/deb-rs-super-vinyl-03.jpg",
    position: 2,
  },
  {
    name: "04 Signature Red",
    colorHex: "#a81820",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/181642-large_default/deb-rs-super-vinyl-04.jpg",
    position: 3,
  },
  {
    name: "05 Ruby Red",
    colorHex: "#801818",
    imageUrl: `${DM_IMG}/2024/02/MDV017123_SUPER-VINYL-shake-lipstick_05-600x600.png`,
    position: 4,
  },
  {
    name: "06 Winery",
    colorHex: "#681028",
    imageUrl: `${DM_IMG}/2024/02/MDV017223_SUPER-VINYL-shake-lipstick_06-600x600.png`,
    position: 5,
  },
  {
    name: "07 Rosewood",
    colorHex: "#984048",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193580-large_default/deb-rs-super-vinyl-07.jpg",
    position: 6,
  },
  {
    name: "08 Orchid Pink",
    colorHex: "#b85880",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/193582-large_default/deb-rs-super-vinyl-08.jpg",
    position: 7,
  },
  {
    name: "09 SO 90s",
    colorHex: "#984038",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193584-large_default/deb-rs-super-vinyl-09.jpg",
    position: 8,
  },
  {
    name: "10 Marsala",
    colorHex: "#801810",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/193586-large_default/deb-rs-super-vinyl-10.jpg",
    position: 9,
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
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "ديبورا",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  console.log(`Brand: Deborah Milano (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
  console.log(`Shades: ${SHADES.length}\n`);
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
    console.log(`  ✓ ${shade.name}`);
    await new Promise((r) => setTimeout(r, 600));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
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

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
