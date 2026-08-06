/**
 * Grigi Matte Lipstick Pro — 28 matte stick shades (4.5 g).
 * Sources: grigi.gr (official names, images), makeupstores.gr (shade names)
 * Product barcode: 5207042030056 (05 Dark Red)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-matte-lipstick-pro-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042030056",
  slug: "grigi-matte-lipstick-pro",
  sku: "GRG-GMLP",
  price: 8500,
  nameAr: "كريجي - أحمر شفاه مطفي Matte Lipstick Pro",
  nameEn: "Grigi - Matte Lipstick Pro",
  descriptionAr:
    "أحمر شفاه مطفي Matte Lipstick Pro من كريجي — تركيبة غنية بلون كامل وتغطية مطفية أنيقة بحجم 4.5 غ.\n\n" +
    "• لون غني ثابت طوال اليوم مع تأثير مطفي مخملي ناعم.\n" +
    "• قوام كريمي مرن ينزلق بسلاسة على الشفاه دون تشقق.\n" +
    "• مُعزّز بفيتامين E لترطيب وحماية الشفاه.\n" +
    "• 28 درجة متنوعة: من النود والمرجاني إلى الأحمر والخمري والبنفسجي.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• للحصول على حواف دقيقة، حدّدي الشفاه بقلم من نفس الدرجة.\n" +
    "• صنع في اليونان.",
  descriptionEn:
    "Grigi Matte Lipstick Pro — rich formula with full coverage and an elegant matte finish in a 4.5 g stick.\n\n" +
    "• Rich long-wearing colour with a soft velvety matte effect.\n" +
    "• Flexible creamy texture glides on smoothly without cracking.\n" +
    "• Enriched with vitamin E to moisturise and protect lips.\n" +
    "• 28 shades from nude and coral to red, berry and purple tones.\n" +
    "• Apply from the centre of the upper lip outward, then repeat on the lower lip.\n" +
    "• For defined edges, line lips with a matching lip pencil.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / makeupstores.gr; hex sampled from official product images. */
const SHADES: ShadeInput[] = [
  { name: "01 Coral", colorHex: "#d45c54", imageUrl: `${IMG}/g/m/gmlpro_01_1.jpg`, position: 0 },
  { name: "03 Classic Red", colorHex: "#cc3434", imageUrl: `${IMG}/g/m/gmlpro_03.jpg`, position: 1 },
  { name: "04 Red", colorHex: "#9c0c14", imageUrl: `${IMG}/g/m/gmlpro_04new.jpg`, position: 2 },
  { name: "05 Dark Red", colorHex: "#b42424", imageUrl: `${IMG}/g/m/gmlpro_05_1.jpg`, position: 3 },
  { name: "06 Dark Pink", colorHex: "#d45464", imageUrl: `${IMG}/g/m/gmlpro_06_1.jpg`, position: 4 },
  { name: "07 Dark Coral Pink", colorHex: "#c46c74", imageUrl: `${IMG}/g/m/gmlpro_07_1.jpg`, position: 5 },
  { name: "08 Light Caramel", colorHex: "#c46c5c", imageUrl: `${IMG}/g/m/gmlpro_08_1.jpg`, position: 6 },
  { name: "09 Light Nude", colorHex: "#cc947c", imageUrl: `${IMG}/g/m/gmlpro_09_1.jpg`, position: 7 },
  { name: "10 Nude Mauve", colorHex: "#b4746c", imageUrl: `${IMG}/g/m/gmlpro_10_1.jpg`, position: 8 },
  { name: "11 Rose Pink", colorHex: "#d47c7c", imageUrl: `${IMG}/g/m/gmlpro_11_1.jpg`, position: 9 },
  { name: "12 Dark Nude Rose", colorHex: "#9c5454", imageUrl: `${IMG}/g/m/gmlpro_12.jpg`, position: 10 },
  { name: "14 Dark Pink", colorHex: "#a45454", imageUrl: `${IMG}/g/m/gmlpro_14_1.jpg`, position: 11 },
  { name: "15 Pink", colorHex: "#d44c84", imageUrl: `${IMG}/g/m/gmlpro_15_1.jpg`, position: 12 },
  { name: "17 Brown Red Berry", colorHex: "#7c2c34", imageUrl: `${IMG}/g/m/gmlpro_17.jpg`, position: 13 },
  { name: "18 Dark Caramel", colorHex: "#9c5454", imageUrl: `${IMG}/g/m/gmlpro_18_1.jpg`, position: 14 },
  { name: "19 Nude Purple Dark", colorHex: "#8c545c", imageUrl: `${IMG}/g/m/gmlpro_19_1.jpg`, position: 15 },
  { name: "20 Brown", colorHex: "#94444c", imageUrl: `${IMG}/g/m/gmlpro_20_1.jpg`, position: 16 },
  { name: "21 Burgundy", colorHex: "#6c2c3c", imageUrl: `${IMG}/g/m/gmlpro_21_1.jpg`, position: 17 },
  { name: "22 Bordeaux", colorHex: "#642c34", imageUrl: `${IMG}/g/m/gmlpro_22.jpg`, position: 18 },
  { name: "23 Dark Aubergine", colorHex: "#5c343c", imageUrl: `${IMG}/g/m/gmlpro_23.jpg`, position: 19 },
  { name: "28 Coral Dark Orange", colorHex: "#b43c44", imageUrl: `${IMG}/g/m/gmlpro_28new.jpg`, position: 20 },
  { name: "29 Red Orange", colorHex: "#cc2c24", imageUrl: `${IMG}/g/m/gmlpro_29_1.jpg`, position: 21 },
  { name: "30 Pink Rose", colorHex: "#d45c6c", imageUrl: `${IMG}/g/m/gmlpro_30.jpg`, position: 22 },
  { name: "31 Pink Fuchsia", colorHex: "#cc244c", imageUrl: `${IMG}/g/m/gmlpro_31_1.jpg`, position: 23 },
  { name: "32 Warm Pink Nude", colorHex: "#ac5c54", imageUrl: `${IMG}/g/m/gmlpro_32.jpg`, position: 24 },
  { name: "33 Purple", colorHex: "#8c4c74", imageUrl: `${IMG}/g/m/gmlpro_33_1.jpg`, position: 25 },
  { name: "34 Plum Mauve", colorHex: "#8c5c6c", imageUrl: `${IMG}/G/M/GML-34_1.jpeg`, position: 26 },
  { name: "35 Warm Nude", colorHex: "#946c64", imageUrl: `${IMG}/G/M/GML-35_1.jpeg`, position: 27 },
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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
