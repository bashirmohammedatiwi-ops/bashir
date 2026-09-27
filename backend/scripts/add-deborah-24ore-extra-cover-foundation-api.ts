/**
 * Deborah 24Ore Extra Cover Foundation — 7 shades (00, 0, 01–05).
 * Source: deborahmilano.com (verified names, description)
 * Images: brocard.ua (00–02), byleijtens.com (03–05)
 * Product barcode: 8009518333909 (0 Fair Rose)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-extra-cover-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";
const BYLEIJTENS = "https://byleijtens.com/cdn/shop/files";

const PRODUCT = {
  barcode: "8009518333909",
  slug: "deborah-24ore-extra-cover-foundation",
  sku: "DBR-ECF-00105J7",
  price: 19000,
  nameAr: "ديبورا ميلانو - فاونديشن 24Ore Extra Cover Foundation",
  nameEn: "Deborah Milano - 24Ore Extra Cover Foundation",
  descriptionAr:
    "فاونديشن 24Ore Extra Cover Foundation من ديبورا ميلانو — فونديشن وكونسيلر سائل بتغطية عالية.\n\n" +
    "• قوام كريمي يُنعّم البشرة ويُقلّل مظهر المسام والعيوب.\n" +
    "• طرف إسفنجي دقيق لتطبيق موضّع أو تغطية كاملة.\n" +
    "• ثبات طويل مع SPF 20 — خاضع للاختبار الجلدي.\n" +
    "• 7 درجات: Ivory وFair Rose وFair وBeige وSand وApricot وAmber.\n" +
    "• 30 ml.",
  descriptionEn:
    "Deborah Milano 24Ore Extra Cover Foundation — full-cover liquid concealer foundation.\n\n" +
    "• Creamy texture perfects the complexion, minimising pores and blemishes.\n" +
    "• Sponge tip allows absolute precision on critical areas or all-over coverage.\n" +
    "• Long wearing with SPF 20 — Dermatologist tested.\n" +
    "• 7 shades: Ivory, Fair Rose, Fair, Beige, Sand, Apricot and Amber.\n" +
    "• 30 ml.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from shade swatch regions in product images. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Ivory",
    colorHex: "#efc7ad",
    imageUrl: `${BROCARD}/8009518333886_1.jpg`,
    position: 0,
  },
  {
    name: "0 Fair Rose",
    colorHex: "#fec9aa",
    imageUrl: `${BROCARD}/8009518333909_1.jpg`,
    position: 1,
  },
  {
    name: "01 Fair",
    colorHex: "#f2c4b4",
    imageUrl: `${BROCARD}/8009518333923_1.jpg`,
    position: 2,
  },
  {
    name: "02 Beige",
    colorHex: "#f6c6af",
    imageUrl: `${BROCARD}/8009518333947_1.jpg`,
    position: 3,
  },
  {
    name: "03 Sand",
    colorHex: "#eecfba",
    imageUrl: `${BYLEIJTENS}/Deborah_Milano_24Ore_Extra_Cover_Foundation_03_Sand.jpg`,
    position: 4,
  },
  {
    name: "04 Apricot",
    colorHex: "#d6c9c3",
    imageUrl: `${BYLEIJTENS}/Deborah_Milano_24Ore_Extra_Cover_Foundation_04_Apricot.jpg`,
    position: 5,
  },
  {
    name: "05 Amber",
    colorHex: "#d3c2ba",
    imageUrl: `${BYLEIJTENS}/Deborah_Milano_24Ore_Extra_Cover_Foundation_05_Amber.jpg`,
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
  console.log(`  Category: Makeup → Face → Foundation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
