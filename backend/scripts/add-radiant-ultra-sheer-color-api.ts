/**
 * Radiant Professional Ultra Sheer Color — 5 shades.
 * Sources: hondoscenter.com / radiant-professional.com (ultra-sheer-color_1040)
 * Barcodes verified: beautyfree.gr, rouge.com.gr (sequential, no rotation)
 * Images: shade number in radiant_ultra_sheer_X_1_* filenames (2024/11)
 * Usage: npx tsx scripts/add-radiant-ultra-sheer-color-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG = "https://radiant-professional.com/media/images/products/2024/11";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-ultra-sheer-color",
  sku: "RAD-USC",
  price: 18000,
  nameAr: "راديانت بروفيشنال - ألترا شير كولور",
  nameEn: "Radiant Professional - Ultra Sheer Color",
  descriptionAr:
    "ألترا شير كولور من راديانت بروفيشنال — بلاشر سائل مرطّب بلون شفاف ومتوهّج بلمسة ندية طبيعية.\n\n" +
    "• منتج متعدد الاستخدامات للخدود والشفاه والعيون.\n• تركيبة خفيفة غنية بحمض الهيالورونيك و8 مستخلصات نباتية مرطبة.\n• لون شفاف قابل للتطبيق المتدرج مع مظهر طبيعي متجانس.\n• مقاوم للماء والعرق ومناسب لجميع أنواع البشرة.\n• يمنح البشرة مظهراً أكثر نعومة وترطيباً فوراً.\n• يُطبّق بكمية صغيرة باستخدام المطبّق المرفق ويُوزَّع بفرشاة أو إسفنجة أو الأصابع.",
  descriptionEn:
    "Radiant Professional Ultra Sheer Color — hydrating liquid blush for semi-transparent colour, glow and a dewy finish.\n\n" +
    "• Multi-use formula for cheeks, lips and eyes.\n• Lightweight skincare-enriched formula with hyaluronic acid and 8 hydrating plant extracts.\n• Buildable sheer colour with a seamless natural result on every skin tone.\n• Water and sweat resistant, suitable for all skin types.\n• Skin looks immediately more supple and hydrated.\n• Apply a small amount with the doe-foot applicator and blend with a brush, sponge or fingers.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Candy Apple",
    colorHex: "#e85a6a",
    barcode: "5201641039830",
    imageUrl: `${IMG}/radiant_ultra_sheer_1_1_HH6JYrL.jpg`,
    position: 0,
  },
  {
    name: "02 Papaya",
    colorHex: "#f4a08a",
    barcode: "5201641039847",
    imageUrl: `${IMG}/radiant_ultra_sheer_2_1_IlGgGYu.jpg`,
    position: 1,
  },
  {
    name: "03 Lollipop",
    colorHex: "#e0507a",
    barcode: "5201641039854",
    imageUrl: `${IMG}/radiant_ultra_sheer_3_1_lsnhVrJ.jpg`,
    position: 2,
  },
  {
    name: "04 Radish",
    colorHex: "#c94d6a",
    barcode: "5201641039861",
    imageUrl: `${IMG}/radiant_ultra_sheer_4_1_vsKRuES.jpg`,
    position: 3,
  },
  {
    name: "05 Chatney",
    colorHex: "#c76b4a",
    barcode: "5201641039878",
    imageUrl: `${IMG}/radiant_ultra_sheer_5_1_GmlLvoE.jpg`,
    position: 4,
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
    await new Promise((r) => setTimeout(r, 600));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

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
