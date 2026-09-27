/**
 * Deborah Instant Lift Foundation — 7 shades (00, 0, 01–05).
 * Source: deborahmilano.com (verified names, description)
 * Images: deborahmilano.com (9190–9194, 9196), brocard.ua (04 Apricot)
 * Product barcode: 8009518356038 (01 Fair)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-instant-lift-foundation-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";
const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";

const PRODUCT = {
  barcode: "8009518356038",
  slug: "deborah-instant-lift-foundation",
  sku: "DBR-ILF-00105J9",
  price: 19000,
  nameAr: "ديبورا ميلانو - فاونديشن Instant Lift Foundation",
  nameEn: "Deborah Milano - Instant Lift Foundation",
  descriptionAr:
    "فاونديشن Instant Lift Foundation من ديبورا ميلانو — سائل يمنح إشراقاً ومظهراً مرتاحاً ومرفوعاً فوراً.\n\n" +
    "• مساحيق soft focus تعكس الضوء لتجانس مثالي وإخفاء علامات التقدّم في السن.\n" +
    "• غني بالفيتامينات وCentella Asiatica لترطيب البشرة ونعومتها.\n" +
    "• قوام سائل خفيف يناسب جميع أنواع البشرة — ثبات طويل مع SPF 30.\n" +
    "• 7 درجات: Ivory وFair Rose وFair وBeige وSand وApricot وAmber.\n" +
    "• 30 ml — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Instant Lift Foundation — youth-boosting liquid foundation for a radiant, rested, visibly lifted look.\n\n" +
    "• Light-reflecting soft-focus powders give luminous evenness, concealing signs of ageing.\n" +
    "• Formulated with vitamins and Centella Asiatica to hydrate and leave skin smooth and supple.\n" +
    "• Weightless liquid consistency suits all skin tones — long wearing with SPF 30.\n" +
    "• 7 shades: Ivory, Fair Rose, Fair, Beige, Sand, Apricot and Amber.\n" +
    "• 30 ml — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from official shade swatch images. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Ivory",
    colorHex: "#c1a498",
    imageUrl: `${DM}/009190-Fondotinta-Instant-Lift-600x600.jpg`,
    position: 0,
  },
  {
    name: "0 Fair Rose",
    colorHex: "#beaaa1",
    imageUrl: `${DM}/009191-Fondotinta-Instant-Lift-600x600.jpg`,
    position: 1,
  },
  {
    name: "01 Fair",
    colorHex: "#aa9793",
    imageUrl: `${DM}/009192-Fondotinta-Instant-Lift-600x600.jpg`,
    position: 2,
  },
  {
    name: "02 Beige",
    colorHex: "#a68c82",
    imageUrl: `${DM}/009193-Fondotinta-Instant-Lift-600x600.jpg`,
    position: 3,
  },
  {
    name: "03 Sand",
    colorHex: "#978177",
    imageUrl: `${DM}/009194-Fondotinta-Instant-Lift-600x600.jpg`,
    position: 4,
  },
  {
    name: "04 Apricot",
    colorHex: "#a89185",
    imageUrl: `${BROCARD}/8009518356090_1.jpg`,
    position: 5,
  },
  {
    name: "05 Amber",
    colorHex: "#997865",
    imageUrl: `${DM}/009196-Fondotinta-Instant-Lift-600x600.jpg`,
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
