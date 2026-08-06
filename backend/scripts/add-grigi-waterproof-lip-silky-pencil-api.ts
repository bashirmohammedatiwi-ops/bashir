/**
 * Grigi Waterproof Lip Silky Pencil — 33 shades.
 * Sources: grigi.gr (GWLP/glsp images), epharmadora.com (names)
 * Product barcode: 5207042205089 (shade 08 Coral)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-waterproof-lip-silky-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042205089",
  slug: "grigi-waterproof-lip-silky-pencil",
  sku: "GRG-WLSP",
  price: 8500,
  nameAr: "كريجي - قلم شفاه Waterproof Lip Silky Pencil مقاوم للماء",
  nameEn: "Grigi - Waterproof Lip Silky Pencil",
  descriptionAr:
    "قلم شفاه سيلكي مقاوم للماء من كريجي — يحدّد محيط الشفاه بدقة ويمنح لوناً ثابتاً ومشرقاً طوال اليوم.\n\n" +
    "• تركيبة أداء طويل الثبات ومقاومة للماء.\n" +
    "• قلم ثابت وناعم بقوام سيلكي سهل التطبيق والتمديد.\n" +
    "• تغطية متساوية بلون غني يُبرز محيط الشفاه بشكل أنيق.\n" +
    "• مُعزّز بفيتامين E لترطيب الشفاه أثناء الاستخدام.\n" +
    "• 33 درجة: من الأحمر والنبيذي والكرزي إلى النود والبني والمرجاني والفوشيا.\n" +
    "• ارسمي خطاً على محيط الشفاه من المنتصف نحو الزوايا ثم املئي أو ضعي أحمر الشفاه.\n" +
    "• للثبات الأطول، حدّدي الشفاه ثم ضعي طبقة رقيقة من اللون.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Waterproof Lip Silky Pencil — precise lip lining with long-lasting, waterproof colour.\n\n" +
    "• Long-wear waterproof formula.\n" +
    "• Firm yet soft silky texture for smooth, even application.\n" +
    "• Rich colour that defines and enhances the lip contour.\n" +
    "• Enriched with vitamin E to keep lips moisturised.\n" +
    "• 33 shades from red, wine and cherry to nude, brown, coral and fuchsia.\n" +
    "• Line lips from the centre outward, then fill or apply lipstick.\n" +
    "• For extra longevity, line lips then apply a thin colour layer.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / epharmadora.com; hex from glsp _1 swatches or pigment sampling. */
const SHADES: ShadeInput[] = [
  { name: "01 Wine Red", colorHex: "#831d25", imageUrl: `${IMG}/G/W/GWLP-01_3.jpeg`, position: 0 },
  { name: "02 Red", colorHex: "#9f1e21", imageUrl: `${IMG}/G/W/GWLP-02_3.jpeg`, position: 1 },
  { name: "05 Dark Red", colorHex: "#7a1820", imageUrl: `${IMG}/G/W/GWLP-05_3.jpeg`, position: 2 },
  { name: "06 Light Pink Cherry", colorHex: "#e08a96", imageUrl: `${IMG}/G/W/GWLP-06_3.jpeg`, position: 3 },
  { name: "07 Coral", colorHex: "#e06b5a", imageUrl: `${IMG}/G/W/GWLP-07_3.jpeg`, position: 4 },
  { name: "10 Pink Fuchsia", colorHex: "#ab3753", imageUrl: `${IMG}/G/W/GWLP-10_3.jpeg`, position: 5 },
  { name: "11 Brown Mauve", colorHex: "#7a4247", imageUrl: `${IMG}/G/W/GWLP-11_3.jpeg`, position: 6 },
  { name: "12 Caramel", colorHex: "#693f38", imageUrl: `${IMG}/G/W/GWLP-12_3.jpeg`, position: 7 },
  { name: "13 Natural", colorHex: "#c49b8f", imageUrl: `${IMG}/G/W/GWLP-13_3.jpeg`, position: 8 },
  { name: "14 Nude Caramel", colorHex: "#b07d68", imageUrl: `${IMG}/G/W/GWLP-14_3.jpeg`, position: 9 },
  { name: "16 Warm Nude", colorHex: "#c9a090", imageUrl: `${IMG}/g/l/glsp-16.jpeg`, position: 10 },
  { name: "18 Bordeaux", colorHex: "#57353b", imageUrl: `${IMG}/G/W/GWLP-18_3.jpeg`, position: 11 },
  { name: "19 Natural Pink", colorHex: "#a55c73", imageUrl: `${IMG}/g/l/glsp-19.jpeg`, position: 12 },
  { name: "21 Nude Pink Brown", colorHex: "#a9716a", imageUrl: `${IMG}/G/W/GWLP-21_3.jpeg`, position: 13 },
  { name: "22 Dark Nude Pink", colorHex: "#a05f68", imageUrl: `${IMG}/G/W/GWLP-22_3.jpeg`, position: 14 },
  { name: "23 Pink Cherry", colorHex: "#d4566f", imageUrl: `${IMG}/G/W/GWLP-23_3.jpeg`, position: 15 },
  { name: "24 Bright Pink Fuchsia", colorHex: "#d43a72", imageUrl: `${IMG}/G/W/GWLP-24_3.jpeg`, position: 16 },
  { name: "25 Purple", colorHex: "#753b5c", imageUrl: `${IMG}/G/W/GWLP-25_1.jpeg`, position: 17 },
  { name: "26 Dark Brown Bordeaux", colorHex: "#796574", imageUrl: `${IMG}/g/l/glsp-26.jpg`, position: 18 },
  { name: "27 Dark Nude Cherry", colorHex: "#a78896", imageUrl: `${IMG}/g/l/glsp-27.jpg`, position: 19 },
  { name: "28 Red Orange", colorHex: "#b47f80", imageUrl: `${IMG}/g/l/glsp-28.jpg`, position: 20 },
  { name: "29 Dark Red Orange", colorHex: "#b55564", imageUrl: `${IMG}/g/l/glsp-29.jpg`, position: 21 },
  { name: "30 Sweet Dark Pink", colorHex: "#cb929a", imageUrl: `${IMG}/g/l/glsp-30.jpg`, position: 22 },
  {
    name: "31 Magenta",
    colorHex: "#bc5f7c",
    imageUrl: "https://epharmadora.com/mediastream/w640/files/products/7f421b5061f82d3ef95ffaa17b6e30e7.jpg.jpg",
    position: 23,
  },
  { name: "32 Dark Brown", colorHex: "#8a6765", imageUrl: `${IMG}/g/l/glsp-32.jpg`, position: 24 },
  { name: "33 Pink Demure", colorHex: "#a66b69", imageUrl: `${IMG}/g/l/glsp-33.jpg`, position: 25 },
  { name: "34 Nude Mauve", colorHex: "#a77b7a", imageUrl: `${IMG}/g/l/glsp-34.jpg`, position: 26 },
  { name: "35 Dark Nude Mauve", colorHex: "#8a656f", imageUrl: `${IMG}/g/l/glsp-35.jpg`, position: 27 },
  { name: "37 Mocha Mousse", colorHex: "#a67f72", imageUrl: `${IMG}/g/l/glsp-37.jpg`, position: 28 },
  { name: "38 Dark Orange Coral", colorHex: "#dc7979", imageUrl: `${IMG}/g/l/glsp-38.jpg`, position: 29 },
  { name: "39 Frosted Pink", colorHex: "#dd94bd", imageUrl: `${IMG}/g/l/glsp-39.jpg`, position: 30 },
  { name: "40 Frosted Brown", colorHex: "#7e6c62", imageUrl: `${IMG}/g/l/glsp-40.jpg`, position: 31 },
  { name: "41 Dark Chocolate Brown", colorHex: "#7c6762", imageUrl: `${IMG}/g/l/glsp-41.jpg`, position: 32 },
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
    brandAr: "كريجي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
    shades?: Array<{ name: string; barcode?: string; colorHex?: string }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Lip Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
