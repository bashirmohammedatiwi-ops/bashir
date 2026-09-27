/**
 * Radiant Professional Studio Perfect Mascara — 4 shades.
 * Sources: hondoscenter.com / radiant-professional.com (studio-perfect-volume-mascara_244)
 * Barcodes verified: wecare.gr, depozituldecosmetice.ro (radiant data-upc rotated)
 * Images: filename shade number in 2026/02/
 * Usage: npx tsx scripts/add-radiant-studio-perfect-mascara-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";

const IMG = "https://radiant-professional.com/media/images/products/2026/02";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-studio-perfect-mascara",
  sku: "RAD-SPM",
  price: 17000,
  nameAr: "راديانت بروفيشنال - ماسكارا ستوديو بيرفكت",
  nameEn: "Radiant Professional - Studio Perfect Mascara",
  descriptionAr:
    "ماسكارا ستوديو بيرفكت من راديانت بروفيشنال — تعريف طبيعي مع طول وحجم من أول طبقة.\n\n" +
    "• فرشاة سيليكون مصممة خصيصاً لتطبيق سهل وتغطية متساوية.\n• تركيبة بشمع طبيعي من قشر الأرز تغذّي وتحمي الرموش.\n• لون واضح قابل للتطبيق المتدرج دون تكتل.\n• ثبات طويل دون بهتان أو انتقال.\n• خفيفة على الرموش ومختبرة طبياً للعيون.\n• يُطبّق من الزاوية الخارجية نحو الداخل بحركات صاعدة؛ كرّري للمزيد من الكثافة.",
  descriptionEn:
    "Radiant Professional Studio Perfect Mascara — natural definition with length and volume from the first swipe.\n\n" +
    "• Specially designed silicone brush for easy, even application.\n• Formula with natural rice hull wax to condition and protect lashes.\n• Buildable colour payoff without clumping.\n• Long-lasting wear that won't fade or smudge.\n• Lightweight, ophthalmologically tested formula.\n• Apply from the outer corner inward with upward strokes; repeat for more intensity.",
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
    colorHex: "#0a0018",
    barcode: "5201641711392",
    imageUrl: `${IMG}/01_BLACK.jpg`,
    position: 0,
  },
  {
    name: "02 Electric Blue",
    colorHex: "#2c45e2",
    barcode: "5201641718223",
    imageUrl: `${IMG}/02_ELECTRIC_BLUE.jpg`,
    position: 1,
  },
  {
    name: "03 Purple",
    colorHex: "#6c50bf",
    barcode: "5201641719565",
    imageUrl: `${IMG}/03_PURPLE.jpg`,
    position: 2,
  },
  {
    name: "05 Green",
    colorHex: "#44695a",
    barcode: "5201641722350",
    imageUrl: `${IMG}/05_GREEN.jpg`,
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

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: المكياج → العيون → ماسكارا`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
