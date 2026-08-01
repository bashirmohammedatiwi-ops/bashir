/**
 * Deborah Hydracolor Shine — 6 shades.
 * Source: deborahmilano.com (verified names, description)
 * Images: lyko.com (shade-specific pack shots)
 * Product barcode: 8009518477474 (No. 2 Rosewood)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-hydracolor-shine-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const LYKO = "https://lyko.com/globalassets/product-images";

const PRODUCT = {
  barcode: "8009518477474",
  slug: "deborah-hydracolor-shine",
  sku: "DBR-HS-1847747",
  price: 8800,
  nameAr: "ديبورا ميلانو - بلسم شفاه Hydracolor Shine",
  nameEn: "Deborah Milano - Hydracolor Shine",
  descriptionAr:
    "بلسم شفاه Hydracolor Shine من ديبورا ميلانو — الأصلي «كريم في عصا» يغذّي ويحمي ويُلوّن الشفاه بلمسة خفيفة.\n\n" +
    "• غني باللآلئ لمظهر لامع متألّق ونتيجة مكياج عصرية.\n" +
    "• تركيبة كريمية غنية مع رائحة الفانيليا الخفيفة.\n" +
    "• SPF 25 لحماية الشفاه من أشعة UVA وUVB.\n" +
    "• 6 درجات: Tiramisu وRosewood وPink Pearl وSummer Bronze وFiesta Red وLight Peach.\n" +
    "• 3.6 g — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Hydracolor Shine — the original “cream in a stick” that nourishes, protects and lightly colours the lips.\n\n" +
    "• Enriched with pearls for a sparkling, shiny, on-trend makeup result.\n" +
    "• Rich creamy formula delicately scented with vanilla.\n" +
    "• SPF 25 helps protect lips from UVA and UVB rays.\n" +
    "• 6 shades: Tiramisu, Rosewood, Pink Pearl, Summer Bronze, Fiesta Red and Light Peach.\n" +
    "• 3.6 g — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com / apohem; hex sampled from lyko shade swatch images. */
const SHADES: ShadeInput[] = [
  {
    name: "No. 1 Tiramisu",
    colorHex: "#a07860",
    imageUrl: `${LYKO}/hydracolor-shine-no.-1-tiramisu-1018-101-0001_1.jpg`,
    position: 0,
  },
  {
    name: "No. 2 Rosewood",
    colorHex: "#c898a0",
    imageUrl: `${LYKO}/hydracolor-shine-no.-2-rosewood-1018-101-0002_1.jpg`,
    position: 1,
  },
  {
    name: "No. 3 Pink Pearl",
    colorHex: "#e8b8c8",
    imageUrl: `${LYKO}/hydracolor-shine-no.-3-pink-pearl-1018-101-0003_1.jpg`,
    position: 2,
  },
  {
    name: "No. 4 Summer Bronze",
    colorHex: "#a85838",
    imageUrl: `${LYKO}/hydracolor-shine-no.-4-summer-bronze-1018-101-0004_1.jpg`,
    position: 3,
  },
  {
    name: "No. 5 Fiesta Red",
    colorHex: "#b83838",
    imageUrl: `${LYKO}/hydracolor-shine-no.-5-fiesta-red-1018-101-0005_1.jpg`,
    position: 4,
  },
  {
    name: "No. 6 Light Peach",
    colorHex: "#d08878",
    imageUrl: `${LYKO}/hydracolor-shine-no.-6-light-peach-1018-101-0006_1.jpg`,
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
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_GLOSS],
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
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
