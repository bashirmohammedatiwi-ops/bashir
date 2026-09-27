/**
 * Deborah Dress Me Perfect Loose Powder — 5 shades (00–04).
 * Source: deborahmilano.com + spacenet.tn / miss2l.com (verified names, images)
 * Product barcode: 8009518272628 (00 Universal)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-dress-me-perfect-loose-powder-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const POWDER = "828bbfd2-d611-417a-bdca-0f5424a61171";

const SPACENET = "https://spacenet.tn";
const MISS2L = "https://miss2l.com";

const PRODUCT = {
  barcode: "8009518272628",
  slug: "deborah-dress-me-perfect-loose-powder",
  sku: "DBR-DMP-006594",
  price: 12000,
  nameAr: "ديبورا ميلانو - بودرة سائبة Dress Me Perfect",
  nameEn: "Deborah Milano - Dress Me Perfect Loose Powder",
  descriptionAr:
    "Dress Me Perfect Loose Powder من ديبورا ميلانو — بودرة سائبة خفيفة كالريشة لثبات المكياج وإطلالة ناعمة مطفية.\n\n" +
    "• تُثبت المكياج وتمنح البشرة مظهراً متجانساً وطبيعياً.\n" +
    "• سهلة التطبيق والدمج — تُمتص الزيوت الزائدة بلمسة مطفية كاملة.\n" +
    "• 5 درجات: من Universal الشفاف إلى Banana Bread.\n" +
    "• مع puff applicator.\n" +
    "• 25 g.\n" +
    "• خاضعة للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Dress Me Perfect Loose Powder — featherweight, silky loose powder to set make-up and create a smooth complexion.\n\n" +
    "• Easy to apply and blend for a natural, completely matte finish.\n" +
    "• Absorbs excess oil with microSILICA spheres.\n" +
    "• Five shades from translucent Universal to Banana Bread.\n" +
    "• Includes puff applicator.\n" +
    "• 25 g.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from retailers; hex sampled from powder region of each shade pack image. */
const SHADES: ShadeInput[] = [
  {
    name: "00 Universal",
    colorHex: "#f3e0d6",
    imageUrl: `${SPACENET}/258650-large_default/deborah-poudre-libre-dress-me-perfect-n0-universelle.jpg`,
    position: 0,
  },
  {
    name: "01 Light Pink",
    colorHex: "#f9d5c0",
    imageUrl: `${SPACENET}/258652-large_default/deborah-poudre-libre-dress-me-perfect-n01-light-pink.jpg`,
    position: 1,
  },
  {
    name: "02 Light Beige",
    colorHex: "#e9c7aa",
    imageUrl: `${SPACENET}/258654-large_default/deborah-poudre-libre-dress-me-perfect-n02-light-beige.jpg`,
    position: 2,
  },
  {
    name: "03 Medium Rose",
    colorHex: "#e6c1a9",
    imageUrl: `${SPACENET}/258657-large_default/deborah-poudre-libre-dress-me-perfect-n03-medium-rose.jpg`,
    position: 3,
  },
  {
    name: "04 Banana Bread",
    colorHex: "#f8dcb3",
    imageUrl: `${MISS2L}/9763-large_default/deborah-poudre-libre-dress-me-perfect.jpg`,
    position: 4,
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

  console.log("Uploading shade images (parallel)...");
  const shades = await Promise.all(
    SHADES.map(async (shade) => {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      return {
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      };
    }),
  );

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

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Category: Makeup → Face → Face Powder`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
