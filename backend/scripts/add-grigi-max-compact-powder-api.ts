/**
 * Grigi Max Compact Powder — 7 shades (02, 03, 04, 05, 12, 13, 14).
 * Sources: grigi.gr (images, names), epharmadora.com / boboconcept.bg (barcodes)
 * Product barcode: 5207042050146 (shade 14 Medium Beige)
 * Usage: npx tsx scripts/add-grigi-max-compact-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042050146",
  slug: "grigi-max-compact-powder",
  sku: "GRG-GMCP",
  price: 9500,
  nameAr: "غريغي - بودرة وجه مضغوطة Max Compact Powder",
  nameEn: "Grigi - Max Compact Powder",
  descriptionAr:
    "بودرة وجه مضغوطة Max Compact Powder من غريغي — تغطية ناعمة بلمسة مخملية وإطلالة مشرقة طبيعية.\n\n" +
    "• تُطبَّق بسهولة وتوزيع مثالي على الوجه دون تكتلات.\n" +
    "• قوام مخملي ناعم يُخفّي الخطوط الدقيقة ويملأ المسام والعيوب الصغيرة.\n" +
    "• تُثبّت المكياج وتتحكم باللمعان لإطلالة فاتحة ونظيفة.\n" +
    "• قاعدة ممتازة يمكن البناء عليها بمنتجات مكياج أخرى.\n" +
    "• 7 درجات: 02 و03 و04 و05 و12 و13 و14 — تناسب جميع ألوان البشرة.\n" +
    "• حجم 20 غرام مع مرآة مدمجة — صُنع في اليونان.",
  descriptionEn:
    "Grigi Max Compact Powder — soft coverage with a velvety touch and a naturally radiant finish.\n\n" +
    "• Applies easily and blends evenly without caking.\n" +
    "• Velvety texture blurs fine lines and fills pores and minor imperfections.\n" +
    "• Sets makeup and controls shine for a fresh, luminous look.\n" +
    "• An excellent base to layer with other makeup products.\n" +
    "• 7 shades: 02, 03, 04, 05, 12, 13 and 14 — for every skin tone.\n" +
    "• 20 g with built-in mirror — Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr; barcodes from epharmadora.com / boboconcept.bg; hex from product images. */
const SHADES: ShadeInput[] = [
  {
    name: "02 Pink Ivory",
    colorHex: "#baa696",
    barcode: "5207042050023",
    imageUrl: `${IMG}/G/M/GMXCP-02_3.jpeg`,
    position: 0,
  },
  {
    name: "03 Ivory",
    colorHex: "#b4a293",
    barcode: "5207042050030",
    imageUrl: `${IMG}/g/m/gmxcp-03_1.jpeg`,
    position: 1,
  },
  {
    name: "04 Pink Beige",
    colorHex: "#af9a8c",
    barcode: "5207042050047",
    imageUrl: `${IMG}/G/M/GMXCP-04_3.jpeg`,
    position: 2,
  },
  {
    name: "05 Dark Beige",
    colorHex: "#ae9a89",
    barcode: "5207042050054",
    imageUrl: `${IMG}/G/M/GMXCP-05_3.jpeg`,
    position: 3,
  },
  {
    name: "12 Beige Neutral Gold",
    colorHex: "#c3ae92",
    barcode: "5207042050122",
    imageUrl: `${IMG}/g/m/gmcp_package_012.jpg`,
    position: 4,
  },
  {
    name: "13 Peachy Neutral Gold",
    colorHex: "#b99f8c",
    barcode: "5207042050139",
    imageUrl: `${IMG}/g/m/gmcp_package_013.jpg`,
    position: 5,
  },
  {
    name: "14 Medium Beige",
    colorHex: "#bd9a88",
    barcode: "5207042050146",
    imageUrl: `${IMG}/g/m/gmcp_package_014.jpg`,
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
    brandAr: "غريغي",
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
  console.log(`Shades: ${SHADES.length}\n`);
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
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
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

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string; barcode?: string }> }>(
    `/products/${created.id}`,
  );

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.barcode ?? "no barcode"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Face → Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
