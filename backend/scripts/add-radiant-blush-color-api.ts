/**
 * Radiant Professional Blush Color — all 18 shades on radiant catalogue.
 * Sources: hondoscenter.com / radiant-professional.com
 * Barcodes: forward-rotate fix verified epharmadora.com, wecare.gr
 * Images: radiant filename shade number (not radiant data-item-image)
 * Usage: npx tsx scripts/add-radiant-blush-color-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG = "https://radiant-professional.com/media/images/products/2021/10";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-blush-color",
  sku: "RAD-BC",
  price: 16000,
  nameAr: "راديانت بروفيشنال - بلاشر كولور",
  nameEn: "Radiant Professional - Blush Color",
  descriptionAr:
    "بلاشر كولور من راديانت بروفيشنال — أحمر خدود بودرة بتركيبة ثابتة ومجموعة واسعة من الدرجات المطفية واللؤلؤية.\n\n" +
    "• تركيبة طويلة الثبات لإطلالة ناعمة طبيعية أو لون حيوي.\n• درجات مات ولؤلؤية تناسب جميع أنواع البشرة.\n• لون واضح قابل للدمج والتطبيق المتدرج.\n• يُطبّق بفرشاة البلاشر بحركات صاعدة على عظمة الخد ثم باتجاه الأذن.\n• مختبر جلدياً وخالٍ من الغلوتين.",
  descriptionEn:
    "Radiant Professional Blush Color — long-wearing pressed powder blush in matte and pearly shades.\n\n" +
    "• Long-lasting formula for a soft natural flush or vivid colour.\n• Wide range of matte and pearly shades for all skin types.\n• Buildable, blendable colour payoff.\n• Apply with a blush brush in upward strokes on the apples of the cheeks, blending toward the ear.\n• Dermatologically tested and gluten free.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

/** Verified barcodes (epharmadora/wecare); images matched to shade number in filename. */
const SHADES: ShadeInput[] = [
  { name: "102 Apple Brown", colorHex: "#a76548", barcode: "5201641033777", imageUrl: `${IMG}/radiant_blush_color_102_fxH6CHN.jpg`, position: 0 },
  { name: "107 Pink Rose", colorHex: "#d8adad", barcode: "5201641641224", imageUrl: `${IMG}/radiant_blush_color_107_59gZnnm.jpg`, position: 1 },
  { name: "109 Shimmering Sand", colorHex: "#b17b69", barcode: "5201641641248", imageUrl: `${IMG}/radiant_blush_color_109_f8FWlWO.jpg`, position: 2 },
  { name: "111 Plum", colorHex: "#bf707a", barcode: "5201641645802", imageUrl: `${IMG}/radiant_blush_color_111_jHvdnUU.jpg`, position: 3 },
  { name: "112 Apricot", colorHex: "#c17a6a", barcode: "5201641648599", imageUrl: `${IMG}/radiant_blush_color_112_I75Py8F.jpg`, position: 4 },
  { name: "113 Winter Plum", colorHex: "#b46f69", barcode: "5201641648605", imageUrl: `${IMG}/radiant_blush_color_113_8Tvvdn3.jpg`, position: 5 },
  { name: "116 Rose", colorHex: "#bf9092", barcode: "5201641657874", imageUrl: `${IMG}/radiant_blush_color_116_RKdlenw.jpg`, position: 6 },
  { name: "117 Rosy Apricot", colorHex: "#e08987", barcode: "5201641657881", imageUrl: `${IMG}/radiant_blush_color_117_pS5sfYS.jpg`, position: 7 },
  { name: "119 Red Earth", colorHex: "#c16d4d", barcode: "5201641666302", imageUrl: `${IMG}/radiant_blush_color_119_e4BYfG0.jpg`, position: 8 },
  { name: "120 Apple Rose", colorHex: "#d87e73", barcode: "5201641668719", imageUrl: `${IMG}/radiant_blush_color_120_PVujBpn.jpg`, position: 9 },
  { name: "121 Winter Rose", colorHex: "#b65e6b", barcode: "5201641668726", imageUrl: `${IMG}/radiant_blush_color_121_kXBiwbi.jpg`, position: 10 },
  { name: "123 Ceramic Brown", colorHex: "#b26352", barcode: "5201641678534", imageUrl: `${IMG}/radiant_blush_color_123_rOv7Ak4.jpg`, position: 11 },
  { name: "127 Pearly Apricot", colorHex: "#d77c6b", barcode: "5201641684696", imageUrl: `${IMG}/radiant_blush_color_127_ZhFsQ64.jpg`, position: 12 },
  { name: "129 Pearly Peach", colorHex: "#e0886d", barcode: "5201641698037", imageUrl: `${IMG}/radiant_blush_color_129_BkDWa0C.jpg`, position: 13 },
  { name: "135 Pearly Bronze", colorHex: "#9f785a", barcode: "5201641714263", imageUrl: `${IMG}/radiant_blush_color_135_YGUSWkH.jpg`, position: 14 },
  { name: "136 Blush Color", colorHex: "#c0647e", barcode: "5201641731819", imageUrl: `${IMG}/radiant_blush_color_136_yOUSJmZ.jpg`, position: 15 },
  { name: "138 Brilliant Rose", colorHex: "#e57c83", barcode: "5201641739983", imageUrl: `${IMG}/radiant_blush_color_138_aR3kIek.jpg`, position: 16 },
  { name: "139 Pomegranate", colorHex: "#c3555e", barcode: "5201641739990", imageUrl: `${IMG}/radiant_blush_color_139_PdP7ROU.jpg`, position: 17 },
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
    brandAr: "راديانت بروفيشنال",
    brandEn: "Radiant Professional",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Radiant Professional brand");
  console.log(`Brand: Radiant Professional (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

async function uploadImage(url: string, alt: string, barcode: string, attempt = 1): Promise<string> {
  const urls = [url, `${IMG_BROCARD}/${barcode}_1.jpg`];
  let lastErr: unknown;
  for (const u of urls) {
    try {
      const res = await fetch(u, {
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
      lastErr = err;
    }
  }
  if (attempt >= 4) throw lastErr;
  await new Promise((r) => setTimeout(r, attempt * 1500));
  return uploadImage(url, alt, barcode, attempt + 1);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — product already exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name, shade.barcode);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];
  if (imageIds.length !== shades.length) {
    console.warn(`Warning: ${imageIds.length} unique images for ${shades.length} shades`);
  }

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
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

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: المكياج → الخدود → بلاشر`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
