/**
 * Grigi Premium Mascara Pro — 5 shades.
 * Sources: grigi.gr (images, names), beautyfree.gr (barcodes)
 * Product barcode: 5207042130176 (Mermaid Blue)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-premium-mascara-pro-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042130176",
  slug: "grigi-premium-mascara-pro",
  sku: "GRG-PMP",
  price: 10000,
  nameAr: "كريجي - ماسكارا Premium Mascara Pro للطول والحجم والتعريف",
  nameEn: "Grigi - Premium Mascara Pro",
  descriptionAr:
    "ماسكارا Premium Mascara Pro من كريجي — تركيبة فاخرة مُغذّاة بمسحوق الألماس وألياف لتعريف مثالي للرموش.\n\n" +
    "• طول وحجم وتعريف واضح مع فصل ممتاز بين الرموش.\n" +
    "• فرشاة مُصمّمة خصيصاً لنتيجة مُحكمة من أول طبقة.\n" +
    "• تركيبة مُغنّاة بمسحوق الألماس وألياف لرموش أكثر كثافة.\n" +
    "• نباتية (Vegan Friendly) — مناسبة للاستخدام اليومي.\n" +
    "• 5 درجات: Black أسود كلاسيكي، Mermaid Blue أزرق حورية، Purple بنفسجي، Brown بني، Plum برقوقي.\n" +
    "• ضعي الماسكارا من جذور الرموش نحو الأطراف بحركات متموّجة.\n" +
    "• كرّري الطبقات للحصول على مزيد من الحجم والكثافة.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Premium Mascara Pro — premium formula enriched with diamond powder and fibres for perfectly defined lashes.\n\n" +
    "• Length, volume and definition with excellent lash separation.\n" +
    "• Specially shaped brush for a polished result from the first coat.\n" +
    "• Enriched with diamond powder and fibres for fuller-looking lashes.\n" +
    "• Vegan friendly — suitable for everyday wear.\n" +
    "• 5 shades: Black, Mermaid Blue, Purple, Brown and Plum.\n" +
    "• Apply from lash roots to tips in a zigzag motion.\n" +
    "• Layer for extra volume and intensity.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr / beautyfree.gr; hex sampled from pre_mascara swatch images. */
const SHADES: ShadeInput[] = [
  {
    name: "Black",
    colorHex: "#393939",
    imageUrl:
      "https://beautyfree.gr/79883-large_default/5207042130169-grigi-premium-mascara-pro-black-length-volume-and-definition.jpg",
    position: 0,
  },
  {
    name: "Mermaid Blue",
    colorHex: "#343576",
    imageUrl: `${IMG}/p/r/pre_mascara_pro_blue.jpg`,
    position: 1,
  },
  {
    name: "Purple",
    colorHex: "#57427c",
    imageUrl: `${IMG}/p/r/pre_mascara_pro_purple.jpg`,
    position: 2,
  },
  {
    name: "Brown",
    colorHex: "#554233",
    imageUrl: `${IMG}/p/r/pre_mascara_pro_brown.jpg`,
    position: 3,
  },
  {
    name: "Plum",
    colorHex: "#553f50",
    imageUrl: `${IMG}/p/r/pre_mascara_pro_plum.jpg`,
    position: 4,
  },
];

/** Extra product gallery images. */
const PRODUCT_IMAGES = [
  "https://beautyfree.gr/54818-large_default/5207042130176-grigi-premium-mascara-pro-mermaid-blue.jpg",
  `${IMG}/p/r/pre_mascara_pro_purple.jpg`,
  `${IMG}/p/r/pre_mascara_pro_plum.jpg`,
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

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [MASCARA],
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
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    barcode?: string;
    images?: unknown[];
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyes → Mascara`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
