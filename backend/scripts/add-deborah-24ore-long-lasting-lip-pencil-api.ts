/**
 * Deborah 24Ore Long Lasting Lip Pencil — 8 shades (01–08).
 * Source: deborahmilano.com (verified names, description)
 * Images: brocard.ua (all shades)
 * Product barcode: 8009518300758 (06 Brown)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-24ore-long-lasting-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const BROCARD = "https://www.brocard.ua/media/catalog/product/8/0";

const PRODUCT = {
  barcode: "8009518300758",
  slug: "deborah-24ore-long-lasting-lip-pencil",
  sku: "DBR-24LLP-300758",
  price: 9500,
  nameAr: "ديبورا ميلانو - قلم شفاه 24Ore Long Lasting Lip Pencil",
  nameEn: "Deborah Milano - 24Ore Long Lasting Lip Pencil",
  descriptionAr:
    "قلم شفاه 24Ore Long Lasting Lip Pencil من ديبورا ميلانو — قلم retractable فائق النعومة لتحديد الشفاه بدقة.\n\n" +
    "• تركيبة غنية بالصبغة بلون مكثّف وثبات طويل.\n" +
    "• مقاوم للنقل (No Transfer) — بدون تلطّخ أو ذوبان.\n" +
    "• رأس retractable لسهولة التطبيق بدون الحاجة لمبراة.\n" +
    "• 8 درجات: Dark Red وVivid Red وViolet Raisin وPink Cyclamen وAntique Rose وBrown وPink Granadine وNude Rose.\n" +
    "• 0.4 g — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano 24Ore Long Lasting Lip Pencil — ultra-soft, easy-gliding retractable lip pencil for perfect lip definition.\n\n" +
    "• Pigment-rich formula delivers intense, long-lasting colour.\n" +
    "• Transfer-proof — no smudging or bleeding.\n" +
    "• Retractable tip ensures effortless application with no sharpener needed.\n" +
    "• 8 shades: Dark Red, Vivid Red, Violet Raisin, Pink Cyclamen, Antique Rose, Brown, Pink Granadine and Nude Rose.\n" +
    "• 0.4 g — Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com; hex sampled from brocard shade pack shots (saturated pigment clusters). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Dark Red",
    colorHex: "#482a30",
    imageUrl: `${BROCARD}/8009518300482_1.jpg`,
    position: 0,
  },
  {
    name: "02 Vivid Red",
    colorHex: "#72181e",
    imageUrl: `${BROCARD}/8009518300505_1.jpg`,
    position: 1,
  },
  {
    name: "03 Violet Raisin",
    colorHex: "#601824",
    imageUrl: `${BROCARD}/8009518300529_1.jpg`,
    position: 2,
  },
  {
    name: "04 Pink Cyclamen",
    colorHex: "#b42a42",
    imageUrl: `${BROCARD}/8009518300710_1.jpg`,
    position: 3,
  },
  {
    name: "05 Antique Rose",
    colorHex: "#b44e54",
    imageUrl: `${BROCARD}/8009518300734_1.jpg`,
    position: 4,
  },
  {
    name: "06 Brown",
    colorHex: "#723636",
    imageUrl: `${BROCARD}/8009518300758_1.jpg`,
    position: 5,
  },
  {
    name: "07 Pink Granadine",
    colorHex: "#a83c4e",
    imageUrl: `${BROCARD}/8009518300772_1.jpg`,
    position: 6,
  },
  {
    name: "08 Nude Rose",
    colorHex: "#906060",
    imageUrl: `${BROCARD}/8009518300796_1.jpg`,
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
  console.log(`  Category: Makeup → Lips → Lip Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
