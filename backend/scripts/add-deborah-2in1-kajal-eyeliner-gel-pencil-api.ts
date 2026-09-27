/**
 * Deborah 2-in-1 Kajal & Eyeliner Gel Pencil — 8 shades.
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518222562 (01 Black)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-2in1-kajal-eyeliner-gel-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";
const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";

const PRODUCT = {
  barcode: "8009518222562",
  slug: "deborah-2in1-kajal-eyeliner-gel-pencil",
  sku: "DBR-KJ2-004693",
  price: 10500,
  nameAr: "ديبورا ميلانو - قلم كحل 2-in-1 Kajal & Eyeliner Gel Pencil",
  nameEn: "Deborah Milano - 2-in-1 Kajal & Eyeliner Gel Pencil",
  descriptionAr:
    "قلم كحل وجل آيلاينر 2-in-1 من ديبورا ميلانو — تركيبة جل كريمية غنية بالصبغة للعيون.\n\n" +
    "• يُستخدم كآيلاينر لرسم خط دقيق أو ككحل داخل خط الرموش.\n" +
    "• ثبات حتى 16 ساعة كآيلاينر و8 ساعات ككحل.\n" +
    "• مقاوم للماء ولا يتلف — يتحمل الحرارة العالية.\n" +
    "• قابل للشحذ بأي براية تجميل.\n" +
    "• 8 درجات: Black وGrey وBlue وGreen وBrown وButter وDeep Blue وLight Green.\n" +
    "• 1.4g.\n" +
    "• خاضع للاختبار الجلدي واختبار العيون.",
  descriptionEn:
    "Deborah Milano 2-in-1 Kajal & Eyeliner Gel Pencil — gel-effect creamy pencil with high-pigment colour for dramatic eye looks.\n\n" +
    "• Use as eyeliner for precise lines or as kajal inside the lash line.\n" +
    "• Up to 16 hours wear as eyeliner and 8 hours as kajal.\n" +
    "• Waterproof, transfer-proof and heat-resistant.\n" +
    "• Can be sharpened with any cosmetic sharpener.\n" +
    "• 8 shades: Black, Grey, Blue, Green, Brown, Butter, Deep Blue and Light Green.\n" +
    "• 1.4 g.\n" +
    "• Dermatologist and ophthalmologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from pencil-tip pigment (gold barrel + white bg excluded). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Black",
    colorHex: "#1f1f1f",
    imageUrl: `${DM}/004693-Matita-2in1-Gel-Kajal_Eyeliner-600x600.jpg`,
    position: 0,
  },
  {
    name: "02 Grey",
    colorHex: "#35373c",
    imageUrl: `${DM}/004718-Matita-2in1-Gel-Kajal_Eyeliner-600x600.jpg`,
    position: 1,
  },
  {
    name: "03 Blue",
    colorHex: "#2b2f72",
    imageUrl: `${DM}/004719-Matita-2in1-Gel-Kajal_Eyeliner-600x600.jpg`,
    position: 2,
  },
  {
    name: "04 Green",
    colorHex: "#00463d",
    imageUrl: `${BROCARD}/8009518223262_1.jpg`,
    position: 3,
  },
  {
    name: "05 Brown",
    colorHex: "#422f28",
    imageUrl: `${DM}/004721-Matita-2in1-Gel-Kajal_Eyeliner-600x600.jpg`,
    position: 4,
  },
  {
    name: "06 Butter",
    colorHex: "#d0b090",
    imageUrl: `${BROCARD}/8009518223309_1.jpg`,
    position: 5,
  },
  {
    name: "09 Deep Blue",
    colorHex: "#2b3459",
    imageUrl: `${DM}/007502-Matita-2in1-Gel-Kajal_Eyeliner-600x600.jpg`,
    position: 6,
  },
  {
    name: "11 Light Green",
    colorHex: "#2f664e",
    imageUrl: `${DM}/007504-Matita-2in1-Gel-Kajal_Eyeliner-600x600.jpg`,
    position: 7,
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
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = shades.map((s) => s.imageId);

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
  console.log(`  Category: Makeup → Eyes → Eye Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
