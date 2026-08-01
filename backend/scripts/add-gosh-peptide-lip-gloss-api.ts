/**
 * GOSH Copenhagen Peptide Lip Gloss — 12 shades (001–012).
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5711914204112 (007 Chocolate Mousse)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-peptide-lip-gloss-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914204112",
  slug: "gosh-peptide-lip-gloss",
  sku: "GSH-PLG-204112",
  price: 9500,
  nameAr: "كوش - جلوس شفاه ببتيد Peptide Lip Gloss",
  nameEn: "GOSH Copenhagen - Peptide Lip Gloss",
  descriptionAr:
    "جلوس شفاه ببتيد من كوش — لمعان فائق وترطيب عميق مع مظهر شفاه ممتلئة فوراً.\n\n" +
    "• تركيبة غنية بالببتيدات وحمض الهيالورونيك — تقلّل الخطوط الدقيقة وترطّب طوال اليوم.\n" +
    "• زبدة الشيا تنعّم الشفاه من الداخل.\n" +
    "• لمعان عالي بدون إحساس لزج — ثبات طويل.\n" +
    "• 12 درجة: Diamond وCandy وVintage وTimeless وCherry وBrownie وChocolate Mousse وNougat وCutie Pie وCandy Floss وAntique وRetro Rose.\n" +
    "• خالٍ من العطر — نباتي (Vegan).",
  descriptionEn:
    "GOSH Copenhagen Peptide Lip Gloss — explosive shine with nourishing, plumping care.\n\n" +
    "• Peptide and hyaluronic acid blend reduces fine lines and moisturises all day.\n" +
    "• Shea butter softens lips from within.\n" +
    "• High shine, non-sticky, long-lasting formula for instantly fuller-looking lips.\n" +
    "• 12 shades: Diamond, Candy, Vintage, Timeless, Cherry, Brownie, Chocolate Mousse, Nougat, Cutie Pie, Candy Floss, Antique and Retro Rose.\n" +
    "• Perfume-free and vegan.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official lip-application images. */
const SHADES: ShadeInput[] = [
  {
    name: "001 Diamond",
    colorHex: "#f0c8d0",
    imageUrl: `${CDN}/5711914199975_04e4af2e-5adc-4e0d-a6d6-eb0d24304ab9.jpg`,
    position: 0,
  },
  {
    name: "002 Candy",
    colorHex: "#edacad",
    imageUrl: `${CDN}/5711914200008.jpg`,
    position: 1,
  },
  {
    name: "003 Vintage",
    colorHex: "#d1655e",
    imageUrl: `${CDN}/5711914200039.jpg`,
    position: 2,
  },
  {
    name: "004 Timeless",
    colorHex: "#dea5a4",
    imageUrl: `${CDN}/5711914200060.jpg`,
    position: 3,
  },
  {
    name: "005 Cherry",
    colorHex: "#d05050",
    imageUrl: `${CDN}/5711914200091.jpg`,
    position: 4,
  },
  {
    name: "006 Brownie",
    colorHex: "#9a6848",
    imageUrl: `${CDN}/5711914200121.jpg`,
    position: 5,
  },
  {
    name: "007 Chocolate Mousse",
    colorHex: "#8b5c48",
    imageUrl: `${CDN}/5711914204112_1.jpg`,
    position: 6,
  },
  {
    name: "008 Nougat",
    colorHex: "#c8a080",
    imageUrl: `${CDN}/5711914204167_1.jpg`,
    position: 7,
  },
  {
    name: "009 Cutie Pie",
    colorHex: "#dcac86",
    imageUrl: `${CDN}/5711914203917_1.jpg`,
    position: 8,
  },
  {
    name: "010 Candy Floss",
    colorHex: "#f0b8c8",
    imageUrl: `${CDN}/5711914203962_1.jpg`,
    position: 9,
  },
  {
    name: "011 Antique",
    colorHex: "#ecb790",
    imageUrl: `${CDN}/5711914204013_1.jpg`,
    position: 10,
  },
  {
    name: "012 Retro Rose",
    colorHex: "#e07090",
    imageUrl: `${CDN}/5711914204068_1.jpg`,
    position: 11,
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
    const bc = s.barcode ? ` | barcode: ${s.barcode}` : "";
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${bc}`);
  }
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
