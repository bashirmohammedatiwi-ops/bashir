/**
 * GOSH Copenhagen Velvet Touch Lip Liner Waterproof — 13 shades (001–016, gaps 004/006/007).
 * Source: goshcopenhagen.com (verified shade names, descriptions, images)
 * Product barcode: 5711914203511 (001 Nougat Crisp)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-gosh-velvet-touch-lip-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const CDN = "https://goshcopenhagen.com/cdn/shop/files";

const PRODUCT = {
  barcode: "5711914203511",
  slug: "gosh-velvet-touch-lip-liner-waterproof",
  sku: "GSH-VTLL-203511",
  price: 9500,
  nameAr: "كوش - قلم شفاه فيلفيت تاتش مقاوم للماء Velvet Touch Lip Liner Waterproof",
  nameEn: "GOSH Copenhagen - Velvet Touch Lip Liner Waterproof",
  descriptionAr:
    "قلم شفاه فيلفيت تاتش مقاوم للماء من كوش — يحدّد الشفاه بدقة ويمنح لوناً مكثّفاً يدوم طوال اليوم.\n\n" +
    "• صبغة عالية التركيز — لون واضح كقلم تحديد أو كأحمر شفاه.\n" +
    "• مقاوم للماء — بدون ذوبان أو تلطّخ.\n" +
    "• غني بزيت الجوجوبا والبوليمر والشمع — مريح على الشفاه دون جفاف.\n" +
    "• 13 درجة: Nougat Crisp وAntique Rose وLip Blush وFlirty Orange وShy Plum وRose وSummer Tan وNougat وRaisin وAmericano وChocolate Kiss وCherry وThe Red.\n" +
    "• 1.2 g — خالٍ من العطر — نباتي (Vegan) — مناسب للبشرة الحساسة.",
  descriptionEn:
    "GOSH Copenhagen Velvet Touch Lip Liner Waterproof — shapes lips with intense, long-lasting colour.\n\n" +
    "• High colour pigmentation — works as a lip liner or lipstick.\n" +
    "• Waterproof formula — no smudging or bleeding.\n" +
    "• Enriched with Jojoba oil, polymer and wax — comfortable wear without drying lips.\n" +
    "• 13 shades: Nougat Crisp, Antique Rose, Lip Blush, Flirty Orange, Shy Plum, Rose, Summer Tan, Nougat, Raisin, Americano, Chocolate Kiss, Cherry and The Red.\n" +
    "• 1.2 g — Perfume-free — Vegan — Suitable for sensitive skin.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from goshcopenhagen.com; hex sampled from official product images (pigment clusters). */
const SHADES: ShadeInput[] = [
  {
    name: "001 Nougat Crisp",
    colorHex: "#c4a59a",
    imageUrl: `${CDN}/5711914203511_ca5c9580-e6e5-4649-bdf4-97fa9ca9f613.jpg`,
    position: 0,
  },
  {
    name: "002 Antique Rose",
    colorHex: "#b0797d",
    imageUrl: `${CDN}/5711914203580.jpg`,
    position: 1,
  },
  {
    name: "003 Lip Blush",
    colorHex: "#d48a92",
    imageUrl: `${CDN}/5711914210243.jpg`,
    position: 2,
  },
  {
    name: "005 Flirty Orange",
    colorHex: "#e07848",
    imageUrl: `${CDN}/5701278587167.jpg`,
    position: 3,
  },
  {
    name: "008 Shy Plum",
    colorHex: "#9a5c78",
    imageUrl: `${CDN}/5711914210298.jpg`,
    position: 4,
  },
  {
    name: "009 Rose",
    colorHex: "#c46875",
    imageUrl: `${CDN}/5711914203610.jpg`,
    position: 5,
  },
  {
    name: "010 Summer Tan",
    colorHex: "#b88878",
    imageUrl: `${CDN}/5711914210045.jpg`,
    position: 6,
  },
  {
    name: "011 Nougat",
    colorHex: "#c99588",
    imageUrl: `${CDN}/5711914203665.jpg`,
    position: 7,
  },
  {
    name: "012 Raisin",
    colorHex: "#7a3d45",
    imageUrl: `${CDN}/5711914203719.jpg`,
    position: 8,
  },
  {
    name: "013 Americano",
    colorHex: "#6b4540",
    imageUrl: `${CDN}/5711914210090.jpg`,
    position: 9,
  },
  {
    name: "014 Chocolate Kiss",
    colorHex: "#8b6558",
    imageUrl: `${CDN}/5711914210144.jpg`,
    position: 10,
  },
  {
    name: "015 Cherry",
    colorHex: "#b53040",
    imageUrl: `${CDN}/5711914210199.jpg`,
    position: 11,
  },
  {
    name: "016 The Red",
    colorHex: "#c82a2a",
    imageUrl: `${CDN}/5711914203764.jpg`,
    position: 12,
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
