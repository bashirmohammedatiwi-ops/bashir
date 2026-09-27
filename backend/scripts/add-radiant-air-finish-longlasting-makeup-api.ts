/**
 * Radiant Professional Air Finish Longlasting Makeup SPF 20 — 6 shades.
 * Sources: hondoscenter.com / radiant-professional.com (air-finish-long-lasting-make-up_100)
 * Barcodes verified: wecare.gr, epharmadora.com, listex.info (sequential, no rotation)
 * Images: shade number in Radiant_Air_Finish_XX_* filenames (2023/03)
 * Usage: npx tsx scripts/add-radiant-air-finish-longlasting-makeup-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG = "https://radiant-professional.com/media/images/products/2023/03";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-air-finish-longlasting-makeup",
  sku: "RAD-AFLM",
  price: 24000,
  nameAr: "راديانت بروفيشنال - كريم أساس إير فينش طويل الثبات",
  nameEn: "Radiant Professional - Air Finish Longlasting Makeup SPF 20",
  descriptionAr:
    "كريم أساس إير فينش طويل الثبات من راديانت بروفيشنال — تغطية متوسطة بلمسة نصف مطفية خفيفة ومريحة طوال اليوم.\n\n" +
    "• تركيبة سائلة مرطبة خفيفة لا تتكتل ولا تثقل البشرة.\n• لمسة نصف مطفية طبيعية مع ثبات طويل.\n• غني بفيتامين E للترطيب والحماية المضادة للأكسدة.\n• حماية SPF 20 من أشعة الشمس طوال العام.\n• خالٍ من الزيوت، مثالي للبشرة العادية والجافة.\n• خالٍ من الغلوتين وغير مختبر على الحيوانات.\n• يُطبّق على الوجه بفرشاة أو إسفنجة أو الأصابع ويُوزَّع نحو خط الشعر والرقبة.",
  descriptionEn:
    "Radiant Professional Air Finish Longlasting Makeup SPF 20 — hydrating liquid foundation with medium coverage and a comfortable semi-matte finish.\n\n" +
    "• Lightweight texture that applies smoothly without creasing or weighing skin down.\n• Semi-matte finish with long-lasting comfortable wear.\n• Enriched with Vitamin E for hydration and antioxidant protection.\n• SPF 20 for year-round protection against photoaging.\n• Non-oily, ideal for normal and dry skin.\n• Gluten-free and cruelty-free.\n• Apply with a brush, sponge or fingers and blend toward the hairline, face contour and neck.",
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
    name: "01 Pure Ivory",
    colorHex: "#f0d5c4",
    barcode: "5201641665541",
    imageUrl: `${IMG}/Radiant_Air_Finish_01_DY1iJLh.jpg`,
    position: 0,
  },
  {
    name: "02 Rosy Beige",
    colorHex: "#e8c4ad",
    barcode: "5201641665558",
    imageUrl: `${IMG}/Radiant_Air_Finish_02_lABWRBr.jpg`,
    position: 1,
  },
  {
    name: "03 Skin Tone",
    colorHex: "#ddb396",
    barcode: "5201641665565",
    imageUrl: `${IMG}/Radiant_Air_Finish_03_hHJmY1c.jpg`,
    position: 2,
  },
  {
    name: "04 Light Tan",
    colorHex: "#d4a882",
    barcode: "5201641665572",
    imageUrl: `${IMG}/Radiant_Air_Finish_04_psMEu3q.jpg`,
    position: 3,
  },
  {
    name: "05 Medium Tan",
    colorHex: "#c9956e",
    barcode: "5201641665589",
    imageUrl: `${IMG}/Radiant_Air_Finish_05_auH4eal.jpg`,
    position: 4,
  },
  {
    name: "06 Teraccotta",
    colorHex: "#b87d5a",
    barcode: "5201641665596",
    imageUrl: `${IMG}/Radiant_Air_Finish_06_nX4DbaN.jpg`,
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
