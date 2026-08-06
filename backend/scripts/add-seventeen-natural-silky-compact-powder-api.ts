/**
 * Seventeen Natural Silky Compact Powder SPF15 — 8 official shades, 12g, no shade barcodes.
 * Sources:
 * - seventeencosmetics.com/en/catalogue/natural-silky-compact-powder_76/
 *   (official shade names, hex chips, pack photos 2024/06)
 * Product barcode: 5201641695722 (shade 04 Rosy Beige)
 * Hex: official color-select__option__hex / schema.org colour
 * Price: Alshaheera Iraq ~23,000 IQD
 * Usage: npx tsx scripts/add-seventeen-natural-silky-compact-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const OFF = "https://seventeencosmetics.com/media/images/products/2024/06";

const SHADE_PRICE = 23000;

const PRODUCT = {
  barcode: "5201641695722",
  slug: "seventeen-natural-silky-compact-powder-spf15-12g",
  sku: "SVN-NSCP-695722",
  price: SHADE_PRICE,
  nameAr: "سيفينتين - باودر مدمجة Natural Silky Compact Powder حريرية مطفية بتغطية كاملة SPF15 حجم 12 غ",
  nameEn: "Seventeen - Natural Silky Compact Powder SPF15 Full Coverage Velvet Matte 12g",
  descriptionAr:
    "باودر مدمجة Natural Silky Compact Powder SPF15 من سيفينتين — تقنية ميكرونية فائقة النعومة تمنح تغطية مطفية كاملة بمظهر مخملي حريري، مع فيتامين E وترطيب وحماية شمسية SPF15 تناسب الاستخدام اليومي تحت شمس العراق.\n\n" +
    "• تغطية كاملة تخفي العيوب والتبقّعات وتوحّد لون البشرة.\n" +
    "• ملمس حريري ميكروني سهل التوزيع بمظهر مخملي مطفي أنيق.\n" +
    "• تثبّت المكياج لساعات أطول وتقلّل اللمعان خلال اليوم.\n" +
    "• فيتامين E يحمي من الجفاف والتلوث البيئي ويرطّب البشرة.\n" +
    "• حماية SPF15 من أشعة الشمس.\n" +
    "• مناسبة لجميع أنواع البشرة — خالية من الغلوتين — مختبرة جلدياً.\n" +
    "• حجم 12 غ — 8 درجات رسمية تتكيّف مع ألوان البشرة المختلفة.\n\n" +
    "طريقة الاستخدام: وزّعيها بالتساوي على الوجه فوق الكريم أو الفاونديشن بالإسفنجة المرفقة، وأعيدي التطبيق على المناطق التي تحتاج تغطية أعلى. ادمِجي نحو الرقبة وخط الشعر لمظهر طبيعي.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Translucide — شفاف فاتح\n" +
    "• 02 Natural — طبيعي\n" +
    "• 03 Caramel — كراميل\n" +
    "• 04 Rosy Beige — بيج وردي\n" +
    "• 05 Toffee — توفي\n" +
    "• 06 Porcelain — بورسلين\n" +
    "• 07 Ivory — عاجي\n" +
    "• 08 Beige — بيج",
  descriptionEn:
    "Seventeen Natural Silky Compact Powder SPF15 — a micronised compact powder that protects from daily sun damage while delivering full matte coverage with a velvet-silky look. Enriched with Vitamin E to help hydrate skin and guard against city pollution, so makeup lasts longer with a smooth, even finish.\n\n" +
    "• Full coverage that softens imperfections and evens skin tone.\n" +
    "• Ultra-fine micronised texture for a silky, velvet-matte result.\n" +
    "• Helps makeup last longer and keeps shine under control.\n" +
    "• Vitamin E supports hydration and environmental protection.\n" +
    "• SPF15 sun protection.\n" +
    "• Suitable for all skin types — gluten free — dermatologically tested.\n" +
    "• 12g — 8 official shades that adapt to a wide range of skin tones.\n\n" +
    "How to use: Apply evenly on the face over your base cream or foundation with the sponge. Re-apply where more coverage is needed. Blend towards the neck, face and hairline for a natural finish.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Translucide\n" +
    "• 02 Natural\n" +
    "• 03 Caramel\n" +
    "• 04 Rosy Beige\n" +
    "• 05 Toffee\n" +
    "• 06 Porcelain\n" +
    "• 07 Ivory\n" +
    "• 08 Beige",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  price: number;
};

/** Official shade names; hex from official colour chips; pack photos *_2.jpg. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Translucide",
    colorHex: "#DCBA9F",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_1_2.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "02 Natural",
    colorHex: "#DDB091",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_2_2.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "03 Caramel",
    colorHex: "#D6B290",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_3_2.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "04 Rosy Beige",
    colorHex: "#D3A782",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_4_2.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "05 Toffee",
    colorHex: "#DAB28E",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_5_2.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "06 Porcelain",
    colorHex: "#DFC4A9",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_6_2.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "07 Ivory",
    colorHex: "#E2BE9A",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_7_2.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
  {
    name: "08 Beige",
    colorHex: "#D6B196",
    imageUrl: `${OFF}/seventeen_natural_silky_compact_powder_8_2.jpg`,
    position: 7,
    price: SHADE_PRICE,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/seventeen_natural_silky_compact_powder_4_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_1_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_2_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_3_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_5_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_6_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_7_2.jpg`,
  `${OFF}/seventeen_natural_silky_compact_powder_8_2.jpg`,
  "https://epharmadora.com/mediastream/w640/files/products/edb0eefa049569572ec1ac24a3f4e64d.jpg",
  "https://epharmadora.com/mediastream/w640/files/products/87900bab2ee4b806f94232ad4cf2a304.jpg",
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
    tertiaryCategoryId: POWDER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [POWDER],
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
  console.log(`  Category: Makeup → Face → Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
