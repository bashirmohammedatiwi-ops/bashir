/**
 * GOSH Copenhagen Matte Eye Liner — 19 shades (001–019).
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5711914171704 (001 Dover White)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-matte-eye-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914171704",
  slug: "gosh-matte-eye-liner",
  sku: "GSH-MEL-171704",
  price: 9000,
  nameAr: "كوش - قلم كحل عيون مات Matte Eye Liner",
  nameEn: "GOSH Copenhagen - Matte Eye Liner",
  descriptionAr:
    "قلم كحل عيون مات من كوش — تركيبة كريمية ناعمة بلون مكثّف لتحديد العيون بدقة أو تأثير درامي.\n\n" +
    "• ألوان مات عالية الصبغة من أول stroke.\n" +
    "• مقاوم للماء وضد التلطّخ — ثبات طويل.\n" +
    "• قابل للاستخدام على خط الرموش أو داخل العين (waterline).\n" +
    "• يُستخدم كآيلاينر أو كاجل.\n" +
    "• 19 درجة: Dover White وMatt Black وGrey وMocha وMole وOcean Mist وCaribbean وCrazy Blue وMidnight Blue وBlack Violet وAlligator وForest Green وNude وChocolate Brown وMahogany وTrue Violet وClassic Grey وOlive Green وDusty Violet.\n" +
    "• 1.2 g — خالٍ من العطر والبارابين — نباتي (Vegan) — AllergyCertified.",
  descriptionEn:
    "GOSH Copenhagen Matte Eye Liner — creamy, highly pigmented matte pencil for sharp definition or dramatic eye looks.\n\n" +
    "• Intense matte colour payoff from the first stroke.\n" +
    "• Waterproof, smudge-proof, long-lasting wear.\n" +
    "• Suitable for lash line and waterline application.\n" +
    "• Works as eyeliner or kajal.\n" +
    "• 19 shades: Dover White, Matt Black, Grey, Mocha, Mole, Ocean Mist, Caribbean, Crazy Blue, Midnight Blue, Black Violet, Alligator, Forest Green, Nude, Chocolate Brown, Mahogany, True Violet, Classic Grey, Olive Green and Dusty Violet.\n" +
    "• 1.2 g — Fragrance-free, paraben-free, vegan, AllergyCertified.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex from official swatch/product images. */
const SHADES: ShadeInput[] = [
  {
    name: "001 Dover White",
    colorHex: "#e8e4dc",
    imageUrl: `${CDN}/001_dover_white_029fd701-f459-48c7-95cb-bcd329c00d0b.jpg`,
    position: 0,
  },
  {
    name: "002 Matt Black",
    colorHex: "#1a1a1a",
    imageUrl: `${CDN}/002_matt_black.jpg`,
    position: 1,
  },
  {
    name: "003 Grey",
    colorHex: "#4b4c52",
    imageUrl: `${CDN}/003_grey.jpg`,
    position: 2,
  },
  {
    name: "004 Mocha",
    colorHex: "#8b6f62",
    imageUrl: `${CDN}/5711914171704_3_4.jpg`,
    position: 3,
  },
  {
    name: "005 Mole",
    colorHex: "#6e5a52",
    imageUrl: `${CDN}/005_mole_1.jpg`,
    position: 4,
  },
  {
    name: "006 Ocean Mist",
    colorHex: "#6a7fa8",
    imageUrl: `${CDN}/006_ocean_mist.jpg`,
    position: 5,
  },
  {
    name: "007 Caribbean",
    colorHex: "#2d8fd4",
    imageUrl: `${CDN}/007_caribbean.jpg`,
    position: 6,
  },
  {
    name: "008 Crazy Blue",
    colorHex: "#4a55c8",
    imageUrl: `${CDN}/008_crazy_blue.jpg`,
    position: 7,
  },
  {
    name: "009 Midnight Blue",
    colorHex: "#2a2d42",
    imageUrl: `${CDN}/009_midnight_blue.jpg`,
    position: 8,
  },
  {
    name: "010 Black Violet",
    colorHex: "#3d2e3f",
    imageUrl: `${CDN}/010_black_violet.jpg`,
    position: 9,
  },
  {
    name: "011 Alligator",
    colorHex: "#4a6b52",
    imageUrl: `${CDN}/011_alligator.jpg`,
    position: 10,
  },
  {
    name: "012 Forest Green",
    colorHex: "#2d5e4a",
    imageUrl: `${CDN}/012_forest_green.jpg`,
    position: 11,
  },
  {
    name: "013 Nude",
    colorHex: "#c9b5a8",
    imageUrl: `${CDN}/013_nude.jpg`,
    position: 12,
  },
  {
    name: "014 Chocolate Brown",
    colorHex: "#5c4338",
    imageUrl: `${CDN}/014_chocolate_brown.jpg`,
    position: 13,
  },
  {
    name: "015 Mahogany",
    colorHex: "#6b3d38",
    imageUrl: `${CDN}/015_mahogany.jpg`,
    position: 14,
  },
  {
    name: "016 True Violet",
    colorHex: "#6b4a72",
    imageUrl: `${CDN}/016_true_violet.jpg`,
    position: 15,
  },
  {
    name: "017 Classic Grey",
    colorHex: "#586160",
    imageUrl: `${CDN}/017_classic_grey.jpg`,
    position: 16,
  },
  {
    name: "018 Olive Green",
    colorHex: "#4a5c3a",
    imageUrl: `${CDN}/018_olive_green.jpg`,
    position: 17,
  },
  {
    name: "019 Dusty Violet",
    colorHex: "#73576e",
    imageUrl: `${CDN}/019_dusty_violet.jpg`,
    position: 18,
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
    brandAr: "كوش",
    brandEn: "GOSH Copenhagen",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve GOSH Copenhagen brand");
  console.log(`Brand: GOSH Copenhagen (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    const bc = s.barcode ? ` | barcode: ${s.barcode}` : "";
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${bc}`);
  }
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
