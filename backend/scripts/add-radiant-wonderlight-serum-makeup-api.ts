/**
 * Radiant Professional Wonderlight Serum Makeup SPF 20 — 6 shades.
 * Sources: hondoscenter.com / radiant-professional.com (wonderlight-serum-make-up_122)
 * Barcodes verified: wecare.gr, epharmadora.com, brocard.ua (sequential, no rotation)
 * Images: shade number in radiant_wonderlight_XX_* filenames (2023/06); 02 uses 2026/02 barcode image
 * Usage: npx tsx scripts/add-radiant-wonderlight-serum-makeup-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG = "https://radiant-professional.com/media/images/products/2023/06";
const IMG_2026 = "https://radiant-professional.com/media/images/products/2026/02";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-wonderlight-serum-makeup",
  sku: "RAD-WSM",
  price: 26500,
  nameAr: "راديانت بروفيشنال - وندرلايت سيروم ميك أب",
  nameEn: "Radiant Professional - Wonderlight Serum Makeup SPF 20",
  descriptionAr:
    "وندرلايت سيروم ميك أب من راديانت بروفيشنال — كريم أساس سيروم ثوري بتغطية متوسطة ولمسة متوهجة وشبابية.\n\n" +
    "• يجمع بين تغطية كريم الأساس وترطيب السيروم في تركيبة واحدة.\n• غني بزهرة البورسلين و Matrixyl 3000 و Aquaxyl للترطيب ومكافحة التجاعيد.\n• لمسة متوهجة طبيعية مع حماية SPF 20 طوال العام.\n• خالٍ من الزيوت ولا يسد المسام، مناسب لجميع أنواع البشرة.\n• ثبات طويل مع إحساس خفيف ومريح طوال اليوم.\n• يُطبّق على الوجه بفرشاة أو إسفنجة أو الأصابع ويُوزَّع نحو خط الشعر والرقبة.",
  descriptionEn:
    "Radiant Professional Wonderlight Serum Makeup SPF 20 — revolutionary serum-skincare foundation with medium coverage and a radiant, youthful finish.\n\n" +
    "• Combines foundation coverage with intensive serum hydration in one formula.\n• Enriched with Porcelain Flower, Matrixyl 3000 and Aquaxyl for hydration and anti-ageing benefits.\n• Radiant finish with year-round SPF 20 protection.\n• Oil-free, non-comedogenic, suitable for all skin types including oily skin.\n• Long-lasting wear with a lightweight, comfortable feel all day.\n• Apply with a brush, sponge or fingers and blend toward the hairline, face contour and neck.",
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
    name: "01 Porcelain Beige",
    colorHex: "#f0dcc8",
    barcode: "5201641724422",
    imageUrl: `${IMG}/radiant_wonderlight_01_1_LLvTiCK.jpg`,
    position: 0,
  },
  {
    name: "02 Cream Beige",
    colorHex: "#ecd0b5",
    barcode: "5201641724439",
    imageUrl: `${IMG_2026}/5201641724439_1.jpg`,
    position: 1,
  },
  {
    name: "03 Natural Beige",
    colorHex: "#e2c4a5",
    barcode: "5201641724446",
    imageUrl: `${IMG}/radiant_wonderlight_03_1_QPrL36f.jpg`,
    position: 2,
  },
  {
    name: "04 Honey Beige",
    colorHex: "#d9b08a",
    barcode: "5201641724453",
    imageUrl: `${IMG}/radiant_wonderlight_04_2.jpg`,
    position: 3,
  },
  {
    name: "05 Tan Beige",
    colorHex: "#c9976e",
    barcode: "5201641724460",
    imageUrl: `${IMG}/radiant_wonderlight_05_1_WaLq4uw.jpg`,
    position: 4,
  },
  {
    name: "06 Dark Beige",
    colorHex: "#b08058",
    barcode: "5201641724477",
    imageUrl: `${IMG}/radiant_wonderlight_06_1_8rftoIg.jpg`,
    position: 5,
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
    subcategoryId: FACE,
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
  console.log(`  Category: المكياج → الوجه → كريم أساس`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
