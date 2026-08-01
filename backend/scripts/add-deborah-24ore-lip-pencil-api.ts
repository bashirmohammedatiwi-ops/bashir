/**
 * Deborah 24Ore Lip Pencil — 12 shades.
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518332797 (14 Nude Taupe)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";

const PRODUCT = {
  barcode: "8009518332797",
  slug: "deborah-24ore-lip-pencil",
  sku: "DBR-24LP-008408",
  price: 9000,
  nameAr: "ديبورا ميلانو - قلم شفاه 24Ore",
  nameEn: "Deborah Milano - 24Ore Lip Pencil",
  descriptionAr:
    "قلم شفاه 24Ore من ديبورا ميلانو — قلم تحديد شفاه بقوام ناعم لرسم دقيق وثبات طويل.\n\n" +
    "• تركيبة كريمية ناعمة بلون غني وواضح.\n" +
    "• يحدد محيط الشفاه بدقة — ثبات استثنائي بدون تلف.\n" +
    "• غني بـ Vitamin E لشفاه ناعمة ومرطبة.\n" +
    "• 12 درجة: Beige وNude وRosewood وBrown وChocolate وPink وFuchsia وRed وBurgundy وPlum وNude Brick وNude Taupe.\n" +
    "• 1.5g.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano 24Ore Lip Pencil — soft lip liner for precise outlining with ultra long-lasting colour.\n\n" +
    "• Soft, creamy texture delivers pure, intense colour.\n" +
    "• Defines lip contour with precision — exceptional hold without smudging.\n" +
    "• Vitamin E-enriched formula keeps lips soft and hydrated.\n" +
    "• 12 shades: Beige, Nude, Rosewood, Brown, Chocolate, Pink, Fuchsia, Red, Burgundy, Plum, Nude Brick and Nude Taupe.\n" +
    "• 1.5 g.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex = pencil-tip pigment (gold barrel excluded). */
const SHADES: ShadeInput[] = [
  { name: "01 Beige", colorHex: "#965442", imageUrl: `${DM}/001735-Matita-labbra-24Ore-600x600.jpg`, position: 0 },
  { name: "02 Nude", colorHex: "#965448", imageUrl: `${DM}/001736-Matita-labbra-24Ore-600x600.jpg`, position: 1 },
  { name: "03 Rosewood", colorHex: "#843c36", imageUrl: `${DM}/001737-Matita-labbra-24Ore-600x600.jpg`, position: 2 },
  { name: "04 Brown", colorHex: "#723630", imageUrl: `${DM}/001738-Matita-labbra-24Ore-600x600.jpg`, position: 3 },
  { name: "05 Chocolate", colorHex: "#5a2a30", imageUrl: `${DM}/001739_Matita_Labbra_24Ore.jpeg`, position: 4 },
  { name: "07 Pink", colorHex: "#ae5460", imageUrl: `${DM}/001741-Matita-labbra-24Ore-600x600.jpg`, position: 5 },
  { name: "08 Fuchsia", colorHex: "#9c3c48", imageUrl: `${DM}/001742-Matita-labbra-24Ore-600x600.jpg`, position: 6 },
  { name: "10 Red", colorHex: "#901e1e", imageUrl: `${DM}/001744-Matita-labbra-24Ore-600x600.jpg`, position: 7 },
  { name: "11 Burgundy", colorHex: "#66303c", imageUrl: `${DM}/001745-Matita-labbra-24Ore-600x600.jpg`, position: 8 },
  { name: "12 Plum", colorHex: "#723036", imageUrl: `${DM}/001746-Matita-labbra-24Ore-600x600.jpg`, position: 9 },
  { name: "13 Nude Brick", colorHex: "#ae544e", imageUrl: `${DM}/008407-Matita-labbra-24Ore-600x600.jpg`, position: 10 },
  { name: "14 Nude Taupe", colorHex: "#964e54", imageUrl: `${DM}/008408-Matita-labbra-24Ore-600x600.jpg`, position: 11 },
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
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
  console.log(`  Category: Makeup → Lips → Lip Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
