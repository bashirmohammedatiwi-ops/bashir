/**
 * Radiant Professional Natural Fix Extra Coverage Liquid Concealer — all 7 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-natural-fix-extra-coverage-liquid-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const PRODUCT = {
  slug: "radiant-professional-natural-fix-extra-coverage-liquid-concealer",
  sku: "RAD-NFECC",
  price: 19000,
  nameAr: "راديانت بروفيشنال - كونسيلر سائل ناتشورال فيكس إكسترا كوفريج",
  nameEn: "Radiant Professional - Natural Fix Extra Coverage Liquid Concealer",
  descriptionAr:
    "كونسيلر سائل ناتشورال فيكس إكسترا كوفريج من راديانت بروفيشنال — تغطية عالية بلمسة مطفية طبيعية لإخفاء الهالات والانتفاخات والخطوط الدقيقة.\n\n" +
    "• تركيبة سائلة كريمية خفيفة بتغطية عالية وثبات طويل.\n• لمسة مطفية طبيعية مقاومة للماء والعرق.\n• غني بتتراببتيد مضاد للالتهاب وبروفيتامين ب٥ لترطيب منطقة تحت العين.\n• يساعد على تقليل الانتفاخ وإحياء مظهر العين.\n• سبع درجات مصممة لتغطية أغمق الهالات على مختلف درجات البشرة.\n• خالٍ من الغلوتين ومختبر جلدياً وطبياً للعين.\n• يُطبّق قبل أو بعد كريم الأساس بفرشاة أو إسفنجة مكياج.",
  descriptionEn:
    "Radiant Professional Natural Fix Extra Coverage Liquid Concealer — high-coverage liquid concealer with a natural matte finish.\n\n" +
    "• Lightweight creamy texture with high coverage and long wear.\n• Natural matte finish resistant to water and perspiration.\n• Enriched with anti-inflammatory tetrapeptide and Provitamin B5.\n• Helps reduce puffiness and revitalise the under-eye area.\n• Seven shades designed to cover even the darkest under-eye circles.\n• Gluten-free, dermatologically and ophthalmologically tested.\n• Apply before or after foundation with a brush or makeup sponge.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Ivory",
    colorHex: "#debba7",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_07_Vw6SUZK.jpg",
    position: 0,
  },
  {
    name: "02 Warm Beige",
    colorHex: "#e4c0a8",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_01_omgF2dT.jpg",
    position: 1,
  },
  {
    name: "03 Cool Sand",
    colorHex: "#deb9a7",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_02_PIL0GEE.jpg",
    position: 2,
  },
  {
    name: "04 Beige",
    colorHex: "#dbb299",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_03_TDOxtNo.jpg",
    position: 3,
  },
  {
    name: "05 Cool Beige",
    colorHex: "#d4a68a",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_04_ypeZ10D.jpg",
    position: 4,
  },
  {
    name: "06 Light Peach",
    colorHex: "#cc9376",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_05_3yGoGDr.jpg",
    position: 5,
  },
  {
    name: "07 Peach",
    colorHex: "#d2a389",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/radiant_concealer_06_eoPnIs9.jpg",
    position: 6,
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
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      shades.push({
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
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
  console.log(`  Category: المكياج → الوجه → كونسيلر`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
