/**
 * Radiant Professional Lineproof Eye Liner — all 4 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-lineproof-eye-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const IMG_BASE = "https://radiant-professional.com/media/images/products";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-lineproof-eye-liner",
  sku: "RAD-LPEL",
  price: 21000,
  nameAr: "راديانت بروفيشنال - آيلاينر لاين بروف للعيون",
  nameEn: "Radiant Professional - Lineproof Eye Liner",
  descriptionAr:
    "آيلاينر لاين بروف للعيون من راديانت بروفيشنال — قلم سائل مقاوم للماء برأس دقيق لتحديد العيون بسهولة وثبات طوال اليوم.\n\n" +
    "• شكل قلم عملي يسهّل رسم خط العيون بدقة.\n• لون غني وثبات طويل ومقاوم للماء.\n• يجف بسرعة ولا يترك فراغات.\n• نظام إنك تانك يوفر كثافة لون متسقة بضربة واحدة.\n• درجات من الأسود إلى الأزرق والشوكولاتة.\n• رجّي جيداً قبل الاستخدام.\n• يُزال بمزيل مكياج العيون والشفاه.",
  descriptionEn:
    "Radiant Professional Lineproof Eye Liner — waterproof liquid eyeliner with a soft, fine marker tip for easy, long-lasting definition.\n\n" +
    "• Practical pen shape makes eyeliner application easier than ever.\n• Intense colour with waterproof, long-lasting wear.\n• Dries fast and leaves no gaps.\n• Ink Tank System delivers consistent colour intensity in one stroke.\n• Shades from classic black to blue and chocolate.\n• Shake well before use.\n• Easily removed with Eye & Lip Makeup Remover.",
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
    name: "01 Black",
    colorHex: "#000000",
    barcode: "5201641747155",
    imageUrl: `${IMG_BASE}/2025/10/lineproof-eyeliner-black.webp`,
    position: 0,
  },
  {
    name: "05 Blue",
    colorHex: "#355c94",
    barcode: "5201641021835",
    imageUrl: `${IMG_BASE}/2023/10/radiant_lineproof_eye_liner_05__blue_2_aIJhLO7.jpg`,
    position: 1,
  },
  {
    name: "06 Chocolate",
    colorHex: "#6c4835",
    barcode: "5201641021842",
    imageUrl: `${IMG_BASE}/2023/10/radiant_lineproof_eye_liner_06__chocolate_2_AZVceeT.jpg`,
    position: 2,
  },
  {
    name: "07 Sky Blue",
    colorHex: "#70b1e9",
    barcode: "5201641021866",
    imageUrl: `${IMG_BASE}/2024/03/radiant_lineproof_eye_liner_07_sky_blue_2_YXQ4Z4a.jpg`,
    position: 3,
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
    const urls = [
      shade.imageUrl,
      `${IMG_BROCARD}/${shade.barcode}_1.jpg`,
    ];
    let imageId: string | null = null;
    let lastErr: unknown;
    for (const imageUrl of urls) {
      try {
        imageId = await uploadImage(imageUrl, shade.name);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!imageId) {
      console.log(`  ✗ ${shade.name}: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
      continue;
    }
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex}) — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 700));
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
  console.log(`  Category: المكياج → العيون → آيلاينر العيون`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
