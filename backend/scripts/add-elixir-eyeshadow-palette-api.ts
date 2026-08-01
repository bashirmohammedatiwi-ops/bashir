/**
 * Elixir Eyeshadow Palette — 872A (Pink Bloom) & 872C (Dizzy Fuchsia) as separate products.
 * Source: beautyfree.gr
 * Usage: npx tsx scripts/add-elixir-eyeshadow-palette-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYESHADOW = "07f14763-7a8b-4646-a057-8748e2b18bd4";

const PRICE = 8950;

type ProductInput = {
  barcode: string;
  slug: string;
  skuRef: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5206929500460",
    slug: "elixir-eyeshadow-palette-872a-pink-bloom",
    skuRef: "872A",
    nameAr: "إليكسير - باليت ظلال عيون 15 لون 872A بينك بلوم",
    nameEn: "Elixir - Eyeshadow Palette 15 Clrs 872A Pink Bloom",
    descriptionAr:
      "باليت ظلال عيون بينك بلوم من إليكسير — 15 لوناً مطفياً ولامعاً بدرجات الوردي لإطلالات ناعمة وجريئة.\n\n" +
      "• 15 لوناً مطفياً وإيريديسنت بدرجات الوردي.\n• تركيبة ناعمة وسهلة الدمج والبناء.\n• مثالية لإطلالات يومية ومسائية.\n• صُنع في أوروبا.",
    descriptionEn:
      "Elixir Pink Bloom Eyeshadow Palette — 15 matte and iridescent pink shades for unique, eye-catching looks.\n\n" +
      "• 15 matte and iridescent pink tones.\n• Soft, blendable, buildable formula.\n• Ideal for day and evening eye looks.\n• Made in Europe.",
    imageUrls: [
      "https://beautyfree.gr/43047-large_default/elixir-eyeshadow-palette-15-clrs-872a.jpg",
      "https://beautyfree.gr/43048-large_default/elixir-eyeshadow-palette-15-clrs-872a.jpg",
    ],
  },
  {
    barcode: "5206929500484",
    slug: "elixir-eyeshadow-palette-872c-dizzy-fuchsia",
    skuRef: "872C",
    nameAr: "إليكسير - باليت ظلال عيون 15 لون 872C ديزي فوشيا",
    nameEn: "Elixir - Eyeshadow Palette 15 Clrs 872C Dizzy Fuchsia",
    descriptionAr:
      "باليت ظلال عيون ديزي فوشيا من إليكسير — 15 لوناً مطفياً ولامعاً بدرجات الفوشيا لإطلالات جريئة ومذهلة.\n\n" +
      "• 15 لوناً مطفياً وإيريديسنت بدرجات الفوشيا.\n• تركيبة ناعمة وسهلة الدمج والبناء.\n• مثالية لإطلالات نارية وجذابة.\n• صُنع في أوروبا.",
    descriptionEn:
      "Elixir Dizzy Fuchsia Eyeshadow Palette — 15 matte and iridescent fuchsia shades for bold, breathtaking eye looks.\n\n" +
      "• 15 matte and iridescent fuchsia tones.\n• Soft, blendable, buildable formula.\n• Perfect for bold, statement eye makeup.\n• Made in Europe.",
    imageUrls: [
      "https://beautyfree.gr/43051-large_default/elixir-eyeshadow-palette-15-clrs-872c.jpg",
      "https://beautyfree.gr/42613-large_default/elixir-eyeshadow-palette-15-clrs-872c.jpg",
    ],
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
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length}\n`);
  await login();
  console.log("Logged in.\n");

  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "إليكسير",
    brandEn: "Elixir",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Elixir brand");
  console.log(`Brand: ${brandId}${resolved.created ? " (created)" : ""}\n`);

  let added = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(p.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((row) => row.slug === p.slug)) {
      console.log(`skip ${p.barcode} — slug exists (${p.slug})`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading images for ${p.skuRef}...`);
    const imageIds: string[] = [];
    for (let i = 0; i < p.imageUrls.length; i++) {
      const id = await uploadImage(p.imageUrls[i], `${p.slug}-${i + 1}`);
      imageIds.push(id);
    }

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId,
      categoryId: MAKEUP,
      subcategoryId: EYES,
      tertiaryCategoryId: EYESHADOW,
      subcategoryIds: [EYES],
      tertiaryCategoryIds: [EYESHADOW],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: PRICE,
      originalPrice: PRICE,
      stock: 0,
      isActive: true,
      imageIds,
    });

    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${PRICE} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
