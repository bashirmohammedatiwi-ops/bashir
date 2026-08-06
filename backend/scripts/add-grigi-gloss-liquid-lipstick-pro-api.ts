/**
 * Grigi Gloss Liquid Lipstick PRO — 8 shades (401–411).
 * Sources: grigi.gr (official names, swatch images, color descriptions)
 * Product barcode: 5207042211271
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-grigi-gloss-liquid-lipstick-pro-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIQUID_LIPSTICK = "b53dd3be-ae16-47a4-a306-238f2060b8d8";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042211271",
  slug: "grigi-gloss-liquid-lipstick-pro",
  sku: "GRG-GLLP",
  price: 7500,
  nameAr: "كريجي - روج شفاه سائل Gloss Liquid Lipstick PRO بلمعان احترافي",
  nameEn: "Grigi - Gloss Liquid Lipstick PRO",
  descriptionAr:
    "روج شفاه سائل Gloss Liquid Lipstick PRO من كريجي — تركيبة غنية بلون كامل ولمسة نهائية لامعة أنيقة.\n\n" +
    "• لون غني ثابت طوال اليوم مع تأثير لامع ناعم — درجات Vinyl وLuminous.\n" +
    "• قوام سائل مرن ينزلق بسلاسة على الشفاه دون تشقق أو تجمع.\n" +
    "• مُعزّز بفيتامين E لترطيب وتجديد الشفاه.\n" +
    "• 8 درجات: Dusty Pink، Salmon Pink، Chocolate، Luminous Nude Beige، Vinyl Dark Cherry، Vinyl Dark Nude Brown، Peach Fuzz وIcy Pink.\n" +
    "• مناسب للإطلالات اليومية والسهرات — نود، وردي، خوخي، بني وكرزي.\n" +
    "• طبّقي من منتصف الشفة العليا نحو الزوايا ثم كرّري على الشفة السفلى.\n" +
    "• للحواف الدقيقة، حدّدي الشفاه بقلم من نفس الدرجة.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Gloss Liquid Lipstick PRO — rich liquid formula with full colour payoff and an elegant glossy finish.\n\n" +
    "• Rich long-wearing colour with a soft luminous effect — Vinyl and Luminous shade finishes.\n" +
    "• Flexible liquid texture glides on smoothly without cracking or clumping.\n" +
    "• Enriched with vitamin E to moisturise and regenerate lips.\n" +
    "• 8 shades: Dusty Pink, Salmon Pink, Chocolate, Luminous Nude Beige, Vinyl Dark Cherry, Vinyl Dark Nude Brown, Peach Fuzz and Icy Pink.\n" +
    "• Perfect for everyday and evening looks — nude, pink, peach, brown and cherry tones.\n" +
    "• Apply from the centre of the upper lip outward, then repeat on the lower lip.\n" +
    "• For defined edges, line lips with a matching lip pencil.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr; hex sampled from official swatch images. */
const SHADES: ShadeInput[] = [
  {
    name: "401 Dusty Pink",
    colorHex: "#bb9695",
    imageUrl: `${IMG}/g/l/gllpt__401.jpg`,
    position: 0,
  },
  {
    name: "402 Salmon Pink",
    colorHex: "#c3988c",
    imageUrl: `${IMG}/g/l/gllpt__402.jpg`,
    position: 1,
  },
  {
    name: "403 Chocolate",
    colorHex: "#926a59",
    imageUrl: `${IMG}/g/l/gllpt__403.jpg`,
    position: 2,
  },
  {
    name: "405 Luminous Nude Beige",
    colorHex: "#aa7c6b",
    imageUrl: `${IMG}/g/l/gllpt__405.jpg`,
    position: 3,
  },
  {
    name: "406 Vinyl Dark Cherry",
    colorHex: "#723359",
    imageUrl: `${IMG}/g/l/gllpt__406.jpg`,
    position: 4,
  },
  {
    name: "408 Vinyl Dark Nude Brown",
    colorHex: "#773f40",
    imageUrl: `${IMG}/g/l/gllpt__408.jpg`,
    position: 5,
  },
  {
    name: "410 Peach Fuzz",
    colorHex: "#c3957d",
    imageUrl: `${IMG}/g/l/gllpt__410large.jpg`,
    position: 6,
  },
  {
    name: "411 Icy Pink",
    colorHex: "#e8c4c9",
    imageUrl: `${IMG}/g/l/gllpt__411_1.jpg`,
    position: 7,
  },
];

/** Product gallery from grigi.gr swatch range. */
const PRODUCT_IMAGES = [
  `${IMG}/g/l/gllpt__401.jpg`,
  `${IMG}/g/l/gllpt__402.jpg`,
  `${IMG}/g/l/gllpt__405.jpg`,
  `${IMG}/g/l/gllpt__406.jpg`,
  `${IMG}/g/l/gllpt__408.jpg`,
  `${IMG}/g/l/gllpt__410large.jpg`,
  `${IMG}/g/l/gllpt__411_1.jpg`,
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
    brandAr: "كريجي",
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
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
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
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

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

  const verify = await api<{
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    barcode?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Lips → Liquid Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
