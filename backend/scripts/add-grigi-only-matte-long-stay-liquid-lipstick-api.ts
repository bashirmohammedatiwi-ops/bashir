/**
 * Grigi Only Matte Long Stay Power Liquid Lipstick — 25 shades (01–51).
 * Sources: grigi.gr (official names, images, swatch colors)
 * Product barcode: 5207042160012 (shade 01 Red)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-only-matte-long-stay-liquid-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042160012",
  slug: "grigi-only-matte-long-stay-power-liquid-lipstick",
  sku: "GRG-OMLS",
  price: 11500,
  nameAr: "غريغي - روج شفاه سائل Only Matte Long Stay Power",
  nameEn: "Grigi - Only Matte Long Stay Power Liquid Lipstick",
  descriptionAr:
    "روج شفاه سائل مطفي طويل الثبات Only Matte Long Stay Power من غريغي — تركيبة غنية بلون كامل وتغطية مطفية أنيقة.\n\n" +
    "• لون غني ثابت طوال اليوم مع تأثير مطفي ناعم.\n" +
    "• قوام مخملي ينزلق بسلاسة على الشفاه دون تشقق.\n" +
    "• مُعزّز بفيتامين E لترطيب وتجديد الشفاه.\n" +
    "• 25 درجة تبدأ من 01: أحمر، نود، مرجاني، كرزي، بنفسجي والمزيد.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• للحواف الدقيقة، حدّدي الشفاه بقلم من نفس الدرجة.\n" +
    "• صنع في اليونان.",
  descriptionEn:
    "Grigi Only Matte Long Stay Power Liquid Lipstick — rich formula with full coverage and an elegant matte finish.\n\n" +
    "• Rich long-wearing colour with a soft matte effect.\n" +
    "• Velvety texture glides on smoothly without cracking.\n" +
    "• Enriched with vitamin E to moisturise and regenerate lips.\n" +
    "• 25 shades from 01: red, nude, coral, cherry, purple and more.\n" +
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

/** Names from grigi.gr; hex sampled from official swatch/texture images. */
const SHADES: ShadeInput[] = [
  { name: "01 Red", colorHex: "#df4c5a", imageUrl: `${IMG}/G/O/GOMLSPLL-01NP_3.jpeg`, position: 0 },
  { name: "02 Dark Nude Rose", colorHex: "#b67879", imageUrl: `${IMG}/G/O/GOMLSPLL-02NP_3.jpeg`, position: 1 },
  { name: "03 Nude", colorHex: "#cd8a86", imageUrl: `${IMG}/g/o/gomlspll-03np.jpeg`, position: 2 },
  { name: "04 Nude Pink", colorHex: "#c58581", imageUrl: `${IMG}/G/O/GOMLSPLL-04NP_3.jpeg`, position: 3 },
  { name: "05 Nude Purple", colorHex: "#b97580", imageUrl: `${IMG}/G/O/GOMLSPLL-05NP_3.jpeg`, position: 4 },
  { name: "06 Dark Natural Pink", colorHex: "#d27888", imageUrl: `${IMG}/G/O/GOMLSPLL-06NP_3.jpeg`, position: 5 },
  { name: "11 Coral Deep", colorHex: "#bf5757", imageUrl: `${IMG}/g/o/gomlspll-11np.jpg`, position: 6 },
  { name: "15 Dark Nude", colorHex: "#9e7d82", imageUrl: `${IMG}/G/O/GOMLSPLL-15NP_3.jpeg`, position: 7 },
  { name: "17 Cranberry", colorHex: "#885964", imageUrl: `${IMG}/G/O/GOMLSPLL-17NP_3.jpeg`, position: 8 },
  { name: "18 Dark Pink Cherry", colorHex: "#9e6373", imageUrl: `${IMG}/G/O/GOMLSPLL-18NP_3.jpeg`, position: 9 },
  { name: "20 Nude Pink Light", colorHex: "#cc8f88", imageUrl: `${IMG}/G/O/GOMLSPLL-20NP_3.jpeg`, position: 10 },
  { name: "21 Dark Nude Cherry", colorHex: "#a16166", imageUrl: `${IMG}/G/O/GOMLSPLL-21NP_3.jpeg`, position: 11 },
  { name: "25 Dark Cherry", colorHex: "#cc4f65", imageUrl: `${IMG}/G/O/GOMLSPLL-25NP_3.jpeg`, position: 12 },
  { name: "26 Deep Red", colorHex: "#c44a57", imageUrl: `${IMG}/G/O/GOMLSPLL-26NP_3.jpeg`, position: 13 },
  { name: "29 Nude Pink Purple", colorHex: "#a8636a", imageUrl: `${IMG}/G/O/GOMLSPLL-29NP_1.jpeg`, position: 14 },
  { name: "30 Nude Brown", colorHex: "#a0625f", imageUrl: `${IMG}/G/O/GOMLSPLL-30NP_1.jpeg`, position: 15 },
  { name: "31 Dark Nude Brown", colorHex: "#965d5e", imageUrl: `${IMG}/G/O/GOMLSPLL-31NP_1.jpeg`, position: 16 },
  { name: "34 Dark Purple", colorHex: "#8b4e6f", imageUrl: `${IMG}/G/O/GOMLSPLL-34NP_1.jpeg`, position: 17 },
  { name: "37 Dark Pink", colorHex: "#d84a78", imageUrl: `${IMG}/G/O/GOMLSPLL-37NP_1.jpeg`, position: 18 },
  { name: "38 Pink Purple", colorHex: "#cf558a", imageUrl: `${IMG}/G/O/GOMLSPLL-38NP_1.jpeg`, position: 19 },
  { name: "39 Watermelon", colorHex: "#d3435b", imageUrl: `${IMG}/G/O/GOMLSPLL-39NP_1.jpeg`, position: 20 },
  { name: "40 Warm Coral", colorHex: "#cb6a61", imageUrl: `${IMG}/G/O/GOMLSPLL-40NP_1.jpeg`, position: 21 },
  { name: "41 Nude Neutral", colorHex: "#9c6d69", imageUrl: `${IMG}/g/o/gomlspll-41np.jpeg`, position: 22 },
  { name: "48 Fuchsia Pink Intense", colorHex: "#b94f98", imageUrl: `${IMG}/g/o/gomlspll-48np.jpg`, position: 23 },
  { name: "51 Nude Coral Brown", colorHex: "#995a55", imageUrl: `${IMG}/g/o/gomlspll-51np.jpg`, position: 24 },
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
    brandAr: "غريغي",
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
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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

  const verify = await api<{ shades?: Array<{ name: string; barcode?: string; colorHex?: string }> }>(
    `/products/${created.id}`,
  );
  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
