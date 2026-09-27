/**
 * Grigi Matte Pro Liquid Lipstick — 20 shades with barcodes, swatch colors & images.
 * Sources: grigi.gr (official), epharmadora.com
 * Product barcode: 5207042314293 (429 Vivid Coral Pink)
 * Usage: npx tsx scripts/add-grigi-matte-pro-liquid-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042314293",
  slug: "grigi-matte-pro-liquid-lipstick",
  sku: "GRG-MLP",
  price: 12500,
  nameAr: "غريغي - روج شفاه سائل مطفي Matte Pro",
  nameEn: "Grigi - Matte Pro Liquid Lipstick",
  descriptionAr:
    "روج شفاه سائل مطفي Matte Pro من غريغي — تركيبة مرنة سهلة التطبيق بلمسة نهائية مطفية أنيقة.\n\n" +
    "• لون غني ثابت طوال اليوم بتأثير مطفي ناعم.\n" +
    "• مُعزّز بفيتامين E لترطيب وتجديد شفاه ناعمة.\n" +
    "• قوام مرن يُطبّق بسلاسة دون تشقق.\n" +
    "• 20 درجة: من الأحمر الكلاسيكي إلى النود والمرجاني والتوت.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• للحصول على حواف دقيقة، حدّدي الشفاه بقلم من نفس الدرجة.\n" +
    "• صنع في اليونان.",
  descriptionEn:
    "Grigi Matte Pro Liquid Lipstick — flexible, easy-to-apply formula with an elegant matte finish.\n\n" +
    "• Rich long-wearing colour with a soft matte effect.\n" +
    "• Enriched with vitamin E to moisturise and regenerate lips.\n" +
    "• Elastic texture glides on smoothly without cracking.\n" +
    "• 20 shades from classic red to nude, coral and berry tones.\n" +
    "• Apply from the centre of the upper lip outward, then repeat on the lower lip.\n" +
    "• For defined edges, line lips with a matching lip pencil.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr; hex sampled from official swatch/texture images. */
const SHADES: ShadeInput[] = [
  {
    name: "401 Red",
    colorHex: "#c05055",
    barcode: "5207042314019",
    imageUrl: `${IMG}/G/M/GMPLL-401_1.jpeg`,
    position: 0,
  },
  {
    name: "402 Dark Red",
    colorHex: "#a65559",
    barcode: "5207042314026",
    imageUrl: `${IMG}/G/M/GMPLL-402_1.jpeg`,
    position: 1,
  },
  {
    name: "403 Nude Purple",
    colorHex: "#a97b7e",
    barcode: "5207042314033",
    imageUrl: `${IMG}/G/M/GMPLL-403_1.jpeg`,
    position: 2,
  },
  {
    name: "404 Nude Brown",
    colorHex: "#b57e74",
    barcode: "5207042314040",
    imageUrl: `${IMG}/G/M/GMPLL-404_1.jpeg`,
    position: 3,
  },
  {
    name: "406 Metallic Pink Purple",
    colorHex: "#cc8995",
    barcode: "5207042314064",
    imageUrl: `${IMG}/G/M/GMPLL-406_1.jpeg`,
    position: 4,
  },
  {
    name: "410 Cranberry Lumi",
    colorHex: "#e06381",
    barcode: "5207042314101",
    imageUrl: `${IMG}/G/M/GMPLL-410_1.jpeg`,
    position: 5,
  },
  {
    name: "411 Metallic Nude Pink",
    colorHex: "#df969c",
    barcode: "5207042314118",
    imageUrl: `${IMG}/G/M/GMPLL-411_1.jpeg`,
    position: 6,
  },
  {
    name: "412 Nude Light",
    colorHex: "#b48682",
    barcode: "5207042314125",
    imageUrl: `${IMG}/G/M/GMPLL-412_1.jpeg`,
    position: 7,
  },
  {
    name: "413 Nude Pink",
    colorHex: "#c1777e",
    barcode: "5207042314132",
    imageUrl: `${IMG}/G/M/GMPLL-413_1.jpeg`,
    position: 8,
  },
  {
    name: "414 Nude Peach",
    colorHex: "#c46e73",
    barcode: "5207042314149",
    imageUrl: `${IMG}/g/m/gmpll-414_1.jpg`,
    position: 9,
  },
  {
    name: "415 Pink Coral",
    colorHex: "#ef808a",
    barcode: "5207042314156",
    imageUrl: `${IMG}/g/m/gmpll-415_1.jpg`,
    position: 10,
  },
  {
    name: "416 Cinnamon Lumi",
    colorHex: "#c95b55",
    barcode: "5207042314163",
    imageUrl: `${IMG}/g/m/gmpll-416.jpeg`,
    position: 11,
  },
  {
    name: "417 Nude Caramel",
    colorHex: "#c37d70",
    barcode: "5207042314170",
    imageUrl: `${IMG}/g/m/gmpll-417.jpeg`,
    position: 12,
  },
  {
    name: "418 Red Brown Dark",
    colorHex: "#a45453",
    barcode: "5207042314187",
    imageUrl: `${IMG}/g/m/gmpll-418.jpeg`,
    position: 13,
  },
  {
    name: "419 Milk Chocolate",
    colorHex: "#9e756f",
    barcode: "5207042314194",
    imageUrl: `${IMG}/g/m/gmpll-419_1.jpg`,
    position: 14,
  },
  {
    name: "423 Metallic Dark Nude Pink",
    colorHex: "#9f5964",
    barcode: "5207042314231",
    imageUrl: `${IMG}/g/m/gmpll-423.jpg`,
    position: 15,
  },
  {
    name: "425 Light Nude Pink",
    colorHex: "#cca89a",
    barcode: "5207042314255",
    imageUrl: `${IMG}/g/m/gmpll-425.jpg`,
    position: 16,
  },
  {
    name: "426 Nude Pink Brown",
    colorHex: "#ab7373",
    barcode: "5207042314262",
    imageUrl: `${IMG}/g/m/gmpll-426.jpg`,
    position: 17,
  },
  {
    name: "429 Vivid Coral Pink",
    colorHex: "#d36e6a",
    barcode: "5207042314293",
    imageUrl: `${IMG}/g/m/gmpll-429.jpg`,
    position: 18,
  },
  {
    name: "431 Milky Pink",
    colorHex: "#ed7dab",
    barcode: "5207042314316",
    imageUrl: `${IMG}/g/m/gmpll_431_l.jpg`,
    position: 19,
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
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIQUID_LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIQUID_LIPSTICK],
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

  const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
