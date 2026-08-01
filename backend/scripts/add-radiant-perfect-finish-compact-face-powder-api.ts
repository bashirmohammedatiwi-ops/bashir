/**
 * Radiant Professional Perfect Finish Compact Face Powder — all 8 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-perfect-finish-compact-face-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const PRODUCT = {
  slug: "radiant-professional-perfect-finish-compact-face-powder",
  sku: "RAD-PFCFP",
  price: 20000,
  nameAr: "راديانت بروفيشنال - بودرة مضغوطة بيرفكت فينيش للوجه",
  nameEn: "Radiant Professional - Perfect Finish Compact Face Powder",
  descriptionAr:
    "بودرة مضغوطة بيرفكت فينيش للوجه من راديانت بروفيشنال — تغطية متوسطة بلمسة مطفية طبيعية تثبت المكياج وتمنح إطلالة متجانسة.\n\n" +
    "• تغطية متوسطة بلون متساوٍ ولمسة مطفية طبيعية.\n• قوام ناعم لا يسد المسام ويترك البشرة تتنفس.\n• غنية بالنشا لامتصاص اللمعان الزائد.\n• تحتوي على فلاتر يو في ايه / يو في بي للحماية من الشمس.\n• علبة عملية مع مرآة وإسفنجة مرفقة.\n• مناسبة لجميع أنواع البشرة.\n• تُطبّق بعد المرطب أو فوق كريم الأساس بالإسفنجة المرفقة أو فرشاة البودرة.",
  descriptionEn:
    "Radiant Professional Perfect Finish Compact Face Powder — medium-coverage powder with an even colour tone and natural matte finish.\n\n" +
    "• Medium coverage with an even tone and natural matte result.\n• Fine texture that does not clog pores and lets skin breathe.\n• Rich in cornstarch to absorb excess oiliness.\n• Contains UVA/UVB filters for sun protection.\n• Smart compact with mirror and included powder puff.\n• Ideal for all skin types.\n• Apply after moisturiser or over foundation with the included puff or a powder brush.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Porcelain",
    colorHex: "#D8B99D",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641032589_1.jpg",
    position: 0,
  },
  {
    name: "02 Rosy Skin",
    colorHex: "#DDA28B",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641032596_1.jpg",
    position: 1,
  },
  {
    name: "03 Light Tan",
    colorHex: "#C48D6B",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641032602_1.jpg",
    position: 2,
  },
  {
    name: "04 Rosy Beige",
    colorHex: "#CC9163",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641032619_1.jpg",
    position: 3,
  },
  {
    name: "05 Medium Tan",
    colorHex: "#8E6147",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641032626_1.jpg",
    position: 4,
  },
  {
    name: "10 Skin Beige",
    colorHex: "#B17F55",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641658789_1.jpg",
    position: 5,
  },
  {
    name: "11 Natural Tan",
    colorHex: "#CE956C",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641658796_1.jpg",
    position: 6,
  },
  {
    name: "12 Skin Tone",
    colorHex: "#CC9976",
    imageUrl: "https://radiant-professional.com/media/images/products/2025/07/5201641663776_1.jpg",
    position: 7,
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
    tertiaryCategoryId: POWDER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [POWDER],
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
  console.log(`  Category: المكياج → الوجه → بودرة`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
