/**
 * GOSH Copenhagen Here To Stain Lip Pen — 5 shades (002–010).
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5711914212100 (010 Berry Stain)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-here-to-stain-lip-pen-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914212100",
  slug: "gosh-here-to-stain-lip-pen",
  sku: "GSH-HTS-212100",
  price: 8500,
  nameAr: "كوش - قلم تينت شفاه هير تو ستين Here To Stain Lip Pen",
  nameEn: "GOSH Copenhagen - Here To Stain Lip Pen",
  descriptionAr:
    "قلم تينت شفاه هير تو ستين من كوش — لون شفاه طازج وثابت طوال اليوم بدون جفاف.\n\n" +
    "• تركيبة خفيفة وعالية التصبغ — من تينت طبيعي إلى لون مكثّف.\n" +
    "• مقاوم للتلطّخ والنقل — ثبات طويل.\n" +
    "• مكونات مرطّبة لراحة الشفاه.\n" +
    "• يُستخدم وحده أو مع أحمر الشفاه أو الجلوس.\n" +
    "• 5 درجات: Candy Stain وMocha Stain وCoffee Stain وRuby Stain وBerry Stain.\n" +
    "• 1 ml — خالٍ من العطر — نباتي (Vegan).",
  descriptionEn:
    "GOSH Copenhagen Here To Stain Lip Pen — lightweight, pigmented stain pen for fresh, juicy colour that lasts all day.\n\n" +
    "• Buildable formula from subtle tint to saturated colour.\n" +
    "• Smudge-proof, transfer-resistant, long-lasting wear.\n" +
    "• Moisturising ingredients for comfortable lips.\n" +
    "• Wear alone or layer with lipstick or lip gloss.\n" +
    "• 5 shades: Candy Stain, Mocha Stain, Coffee Stain, Ruby Stain and Berry Stain.\n" +
    "• 1 ml — Perfume-free and vegan.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official product images. */
const SHADES: ShadeInput[] = [
  {
    name: "002 Candy Stain",
    colorHex: "#e09993",
    imageUrl: `${CDN}/5711914212155_1_6a035094-798d-4660-bfa8-8b767acaf0e4.jpg`,
    position: 0,
  },
  {
    name: "004 Mocha Stain",
    colorHex: "#a87868",
    imageUrl: `${CDN}/5711914212155_2_7d83eeb3-163c-4cf5-9af2-9a33dac5768f.jpg`,
    position: 1,
  },
  {
    name: "006 Coffee Stain",
    colorHex: "#8b5a50",
    imageUrl: `${CDN}/5711914212209_1.jpg`,
    position: 2,
  },
  {
    name: "008 Ruby Stain",
    colorHex: "#c04858",
    imageUrl: `${CDN}/5711914212254_1.jpg`,
    position: 3,
  },
  {
    name: "010 Berry Stain",
    colorHex: "#b04a58",
    imageUrl: `${CDN}/5711914212100_1.jpg`,
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
