/**
 * Deborah Il Rossetto — 14 shades.
 * Source: deborahmilano.com (verified names, description)
 * Images: profumeriemallardo.com (all shades)
 * Product barcode: 8009518485752 (800 Natural Brown)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-il-rossetto-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const PRODUCT = {
  barcode: "8009518485752",
  slug: "deborah-il-rossetto",
  sku: "DBR-IR-00103A5",
  price: 10000,
  nameAr: "ديبورا ميلانو - أحمر شفاه Il Rossetto",
  nameEn: "Deborah Milano - Il Rossetto",
  descriptionAr:
    "Il Rossetto من ديبورا ميلانو — أحمر الشفاه الأيقوني بقوام كريمي ناعم ولمعان رطب.\n\n" +
    "• تركيبة غنية بفيتامينات A وC وE لشفاه مرطبة ومشرقة.\n" +
    "• فلاتر UVA وUVB لحماية الشفاه من الشيخوخة المبكرة.\n" +
    "• 14 درجة: Rosso وCherry وFucsia وHot Pink وBaby Rose وNatural Beige وBordeaux وViola وCiclamino وRosa Antico وBrillant وBright Coral وGolden Orange وNatural Brown.\n" +
    "• 4.3 g — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Il Rossetto — the iconic soft, creamy lipstick with a dazzling shiny finish.\n\n" +
    "• Enriched with Vitamins A, C and E for perfectly moisturized lips.\n" +
    "• UVA and UVB filters help protect lips from premature ageing.\n" +
    "• 14 shades: Rosso, Cherry, Fucsia, Hot Pink, Baby Rose, Natural Beige, Bordeaux, Viola, Ciclamino, Rosa Antico, Brillant, Bright Coral, Golden Orange and Natural Brown.\n" +
    "• 4.3 g — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from lipstick bullet region in mallardo shade images. */
const SHADES: ShadeInput[] = [
  {
    name: "Rosso 816",
    colorHex: "#8c0008",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/72073-large_default/deb-il-rossetto-816.jpg",
    position: 0,
  },
  {
    name: "Cherry 601",
    colorHex: "#840014",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/71223-large_default/deb-il-rossetto-601.jpg",
    position: 1,
  },
  {
    name: "Fucsia 534",
    colorHex: "#b22858",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/71220-large_default/deb-il-rossetto-534.jpg",
    position: 2,
  },
  {
    name: "Hot Pink 532",
    colorHex: "#c05060",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/71217-large_default/deb-il-rossetto-532.jpg",
    position: 3,
  },
  {
    name: "Baby Rose 523",
    colorHex: "#a04a4e",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/71214-large_default/deb-il-rossetto-523.jpg",
    position: 4,
  },
  {
    name: "Natural Beige 516",
    colorHex: "#b89088",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71211-large_default/deb-il-rossetto-516.jpg",
    position: 5,
  },
  {
    name: "Bordeaux 807",
    colorHex: "#5c2838",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71208-large_default/deb-il-rossetto-807.jpg",
    position: 6,
  },
  {
    name: "Viola 818",
    colorHex: "#6e4088",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/72076-large_default/deb-il-rossetto-818.jpg",
    position: 7,
  },
  {
    name: "Ciclamino 819",
    colorHex: "#772b33",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/72079-large_default/deb-il-rossetto-819.jpg",
    position: 8,
  },
  {
    name: "Rosa Antico 821",
    colorHex: "#88393f",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/72082-large_default/deb-il-rossetto-821.jpg",
    position: 9,
  },
  {
    name: "Brillant 602",
    colorHex: "#b81828",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/71226-large_default/deb-il-rossetto-602.jpg",
    position: 10,
  },
  {
    name: "Bright Coral 603",
    colorHex: "#c06050",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71229-large_default/deb-il-rossetto-603.jpg",
    position: 11,
  },
  {
    name: "Golden Orange 605",
    colorHex: "#c87858",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71232-large_default/deb-il-rossetto-605.jpg",
    position: 12,
  },
  {
    name: "Natural Brown 800",
    colorHex: "#b13f43",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/71235-large_default/deb-il-rossetto-800.jpg",
    position: 13,
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
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
