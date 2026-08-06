/**
 * Grigi Max Blush On — 23 shades.
 * Sources: grigi.gr (official names, images, swatch colors), epharmadora.com (shades 02, 08)
 * Product barcode: 5207042060046 (shade 04 Peach)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-max-blush-on-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042060046",
  slug: "grigi-max-blush-on",
  sku: "GRG-GMBO",
  price: 8500,
  nameAr: "كريجي - بلاشر بودرة Max Blush On للخدود",
  nameEn: "Grigi - Max Blush On Powder Blush",
  descriptionAr:
    "بلاشر بودرة Max Blush On من كريجي — إطلالة طبيعية مشرقة بقوام خفيف يندمج بسلاسة ويثبت طوال اليوم.\n\n" +
    "• تركيبة خفيفة بقوام مرن يُطبَّق بسهولة ونعومة على البشرة.\n" +
    "• لون غني قابل للبناء من لمسة خفيفة إلى إشراقة واضحة.\n" +
    "• ثبات طويل يمنح راحة واستقراراً للمكياج.\n" +
    "• مُعزّز بفيتامين E لحماية البشرة وترطيبها.\n" +
    "• 25 درجة: وردي، خوخي، نود، مرجاني، بني، فوشيا والمزيد.\n" +
    "• حجم ماكسي 9 غرام — صُنع في اليونان.",
  descriptionEn:
    "Grigi Max Blush On Powder Blush — natural, luminous colour with a lightweight formula that blends effortlessly and lasts all day.\n\n" +
    "• Lightweight formula with an ultra-elastic texture for smooth, even application.\n" +
    "• Buildable pigment from a soft wash to a vibrant flush of colour.\n" +
    "• Long-wearing comfort and makeup stability throughout the day.\n" +
    "• Enriched with vitamin E to nourish and protect the skin.\n" +
    "• 25 shades: pink, peach, nude, coral, brown, fuchsia and more.\n" +
    "• Maxi 9 g size — Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / epharmadora.com; hex from pan-centre sampling or official texture swatches. */
const SHADES: ShadeInput[] = [
  { name: "01 Pink", colorHex: "#a26e66", imageUrl: `${IMG}/g/m/gmxbl-01.jpeg`, position: 0 },
  {
    name: "02 Light Pink",
    colorHex: "#dda0a8",
    imageUrl: "https://epharmadora.com/mediastream/w640/files/products/394eaf16c78c1608c45f92eae1f76710.jpeg.jpg",
    position: 1,
  },
  { name: "03 Pink Peach", colorHex: "#c07b79", imageUrl: `${IMG}/G/M/GMXBL-03_3.jpeg`, position: 2 },
  { name: "04 Peach", colorHex: "#d1786f", imageUrl: `${IMG}/G/M/GMXBL-04_3.jpeg`, position: 3 },
  { name: "05 Nude Light", colorHex: "#b9857f", imageUrl: `${IMG}/G/M/GMXBL-05_3.jpeg`, position: 4 },
  { name: "06 Brown Cinnamon", colorHex: "#b17769", imageUrl: `${IMG}/G/M/GMXBL-06_3.jpeg`, position: 5 },
  { name: "07 Brown", colorHex: "#a7786a", imageUrl: `${IMG}/G/M/GMXBL-07_3.jpeg`, position: 6 },
  {
    name: "08 Pearl Brown",
    colorHex: "#b59a8f",
    imageUrl: "https://epharmadora.com/mediastream/w640/files/products/29bdfcf0471e276cdd30cb231009f0f0.jpeg.jpg",
    position: 7,
  },
  { name: "09 Purple Pink", colorHex: "#ad7179", imageUrl: `${IMG}/G/M/GMXBL-09_3.jpeg`, position: 8 },
  { name: "10 Light Rose Brown", colorHex: "#a97c6a", imageUrl: `${IMG}/G/M/GMXBL-10_3.jpeg`, position: 9 },
  { name: "11 Dark Coral", colorHex: "#b47166", imageUrl: `${IMG}/G/M/GMXBL-11_7.jpeg`, position: 10 },
  { name: "12 Nude", colorHex: "#b17b74", imageUrl: `${IMG}/G/M/GMXBL-12_3.jpeg`, position: 11 },
  { name: "13 Nude Pearl Pink", colorHex: "#ae7271", imageUrl: `${IMG}/G/M/GMXBL-13_3.jpeg`, position: 12 },
  { name: "14 Dusty Pearl Brown", colorHex: "#af7f69", imageUrl: `${IMG}/G/M/GMXBL-14_3.jpeg`, position: 13 },
  { name: "15 Bronze Brown", colorHex: "#aa7167", imageUrl: `${IMG}/G/M/GMXBL-15_3.jpeg`, position: 14 },
  { name: "16 Nude Brown", colorHex: "#aa7364", imageUrl: `${IMG}/G/M/GMXBL-16_3.jpeg`, position: 15 },
  { name: "17 Pink Fuchsia", colorHex: "#c8727f", imageUrl: `${IMG}/G/M/GMXBL-17_3.jpeg`, position: 16 },
  { name: "18 Girly Pink", colorHex: "#e17b96", imageUrl: `${IMG}/G/M/GMXBL-18_3.jpeg`, position: 17 },
  { name: "19 Taupe", colorHex: "#9d7a6a", imageUrl: `${IMG}/G/M/GMXBL-19_3.jpeg`, position: 18 },
  { name: "20 Chocolate Pearl Brown", colorHex: "#a26d65", imageUrl: `${IMG}/G/M/GMXBL-20_3.jpeg`, position: 19 },
  { name: "21 Matte Brown", colorHex: "#a18070", imageUrl: `${IMG}/g/m/gmxbl-21.jpg`, position: 20 },
  { name: "22 Matte Orange", colorHex: "#bc776b", imageUrl: `${IMG}/g/m/gmxbl-22.jpg`, position: 21 },
  { name: "23 Golden Brown", colorHex: "#9e8170", imageUrl: `${IMG}/g/m/gmxbl-23.jpg`, position: 22 },
  { name: "24 Pearl Coral", colorHex: "#b47675", imageUrl: `${IMG}/g/m/gmxbl-24.jpg`, position: 23 },
  { name: "28 Bright Rose", colorHex: "#ce9c99", imageUrl: `${IMG}/g/m/gmxbl-28.jpg`, position: 24 },
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
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
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
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
