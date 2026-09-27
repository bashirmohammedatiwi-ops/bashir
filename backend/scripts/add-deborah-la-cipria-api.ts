/**
 * Deborah La Cipria — 6 shades (24, 29, 30, 33, 34, 40).
 * Source: deborahmilano.com (verified names, description)
 * Images: brocard.ua (24–33), profumeriailmiomondo.com (34), pedrettiprofumi.it (40)
 * Product barcode: 8009518122275 (30)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-la-cipria-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";

const PRODUCT = {
  barcode: "8009518122275",
  slug: "deborah-la-cipria",
  sku: "DBR-LC-0010624",
  price: 10000,
  nameAr: "ديبورا ميلانو - بودرة La Cipria",
  nameEn: "Deborah Milano - La Cipria",
  descriptionAr:
    "بودرة La Cipria من ديبورا ميلانو — بودرة وجه خفيفة كالحرير تمنح إطلالة مطفية متجانسة.\n\n" +
    "• تركيبة شفافة وناعمة تُثبت المكياج وتُطيل ثباته.\n" +
    "• تُوحّد لون البشرة بملمس غير مرئي حتى بعد عدة لمسات.\n" +
    "• 6 درجات: 24 و29 و30 و33 و34 و40.\n" +
    "• مع إسفنجة/أداة تطبيق.\n" +
    "• 13 g — خاضعة للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano La Cipria — sheer, silky smooth, weightless face powder.\n\n" +
    "• Mattifying formula creates a flawlessly even finish, setting make-up for a long-lasting effect.\n" +
    "• Lightweight texture stays invisible after numerous touch-ups for a natural, smooth complexion.\n" +
    "• Six shades: 24, 29, 30, 33, 34 and 40.\n" +
    "• Includes puff applicator.\n" +
    "• 13 g — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Shade numbers from deborahmilano.com; hex sampled from powder region of each shade image. */
const SHADES: ShadeInput[] = [
  {
    name: "24",
    colorHex: "#e8b080",
    imageUrl: `${BROCARD}/8009518122237_1.jpg`,
    position: 0,
  },
  {
    name: "29",
    colorHex: "#e8b888",
    imageUrl: `${BROCARD}/8009518122268_1.jpg`,
    position: 1,
  },
  {
    name: "30",
    colorHex: "#f0c898",
    imageUrl: `${BROCARD}/8009518122275_1.jpg`,
    position: 2,
  },
  {
    name: "33",
    colorHex: "#c8a070",
    imageUrl: `${BROCARD}/8009518122282_1.jpg`,
    position: 3,
  },
  {
    name: "34",
    colorHex: "#b88870",
    imageUrl:
      "https://www.profumeriailmiomondo.com/2160/deborah-la-cipria-n34-13g-cipria-opacizzante-effetto-naturale-made-in-italy-8009518122299.jpg",
    position: 4,
  },
  {
    name: "40",
    colorHex: "#c8a888",
    imageUrl: "https://www.pedrettiprofumi.it/221351-large_default/deborah-la-cipria-40.jpg",
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
    brandAr: "ديبورا",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  console.log(`Brand: Deborah Milano (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
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
  const shades = [];
  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    await new Promise((r) => setTimeout(r, 300));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = shades.map((s) => s.imageId);

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
    console.log(`    - ${s.name} | ${s.colorHex ?? "?"} | barcode: ${s.barcode ?? "none"}`);
  }
  console.log(`  Category: Makeup → Face → Face Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
