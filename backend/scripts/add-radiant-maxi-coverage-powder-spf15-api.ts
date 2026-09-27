/**
 * Radiant Professional Maxi Coverage Powder SPF 15 — all 6 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-maxi-coverage-powder-spf15-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const PRODUCT = {
  slug: "radiant-professional-maxi-coverage-powder-spf15",
  sku: "RAD-MCP-SPF15",
  price: 20000,
  nameAr: "راديانت بروفيشنال - بودرة مضغوطة ماكسي كوفريج بي إف ١٥",
  nameEn: "Radiant Professional - Maxi Coverage Powder SPF 15",
  descriptionAr:
    "بودرة مضغوطة ماكسي كوفريج بي إف ١٥ من راديانت بروفيشنال — تغطية عالية بلمسة مخملية مطفية مع حماية من أشعة الشمس.\n\n" +
    "• بودرة مضغوطة بقوام مخملي ناعم بتقنية ميكرونايزد.\n• تغطية عالية ولمسة مطفية طبيعية.\n• مُعزّزة بمستخلص زهور الرمان وفيتامين سي.\n• تحافظ على مرونة البشرة وتحميها من الجفاف.\n• حماية بي إف ١٥ من الأشعة فوق البنفسجية.\n• خالية من العطور والزيوت والبارابين.\n• تُطبّق مباشرة على بشرة مرطبة أو فوق كريم الأساس بالإسفنجة المرفقة أو فرشاة البودرة.",
  descriptionEn:
    "Radiant Professional Maxi Coverage Powder SPF 15 — compact powder with maximum coverage and a velvet matte finish.\n\n" +
    "• Compact powder with a velvety micronized texture.\n• Maximum coverage with a matte effect.\n• Enriched with pomegranate flower extract and Vitamin C.\n• Boosts skin elasticity and protects from dehydration.\n• SPF 15 protection against harmful UV rays.\n• Fragrance-free, oil-free and paraben-free.\n• Apply on moisturised skin or over liquid foundation with the included sponge or a powder brush.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Alabaster",
    colorHex: "#F9DBC3",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2017/10/maxi-coverage-powder-spf-1_YLXjvEO.jpg",
    position: 0,
  },
  {
    name: "02 Rosy",
    colorHex: "#EDC7B5",
    imageUrl: "https://radiant-professional.com/media/images/products/2017/10/maxi-coverage-powder-spf-2.jpg",
    position: 1,
  },
  {
    name: "03 Beige",
    colorHex: "#D8A491",
    imageUrl: "https://radiant-professional.com/media/images/products/2017/10/maxi-coverage-powder-spf-3.jpg",
    position: 2,
  },
  {
    name: "04 Peachy Beige",
    colorHex: "#ECC9BB",
    imageUrl: "https://radiant-professional.com/media/images/products/2017/10/maxi-coverage-powder-spf-4.jpg",
    position: 3,
  },
  {
    name: "05 Light Tan",
    colorHex: "#D3AB93",
    imageUrl: "https://radiant-professional.com/media/images/products/2017/10/maxi-coverage-powder-spf-5.jpg",
    position: 4,
  },
  {
    name: "06 Medium Tan",
    colorHex: "#D0A089",
    imageUrl: "https://radiant-professional.com/media/images/products/2017/10/maxi-coverage-powder-spf-6.jpg",
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
