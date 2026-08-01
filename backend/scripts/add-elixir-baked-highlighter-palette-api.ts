/**
 * Elixir Baked Highlighter Palette — 776A & 776B as separate products.
 * Source: beautyfree.gr
 * Usage: npx tsx scripts/add-elixir-baked-highlighter-palette-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const POWDER_HIGHLIGHTER = "7480a30f-ed2b-41a8-9349-dd67edb010b6";

const DESC_AR =
  "بودرة هايلايتر مخبوزة من إليكسير — تركيبة مخبوزة فاخرة تمنح لمعاناً مكثفاً بلون غني يُطبَّق بسهولة على أي درجة إشراق.\n\n" +
  "• تركيبة مخبوزة ناعمة كالمخمل.\n• لمعان عالي التصبغ قابل للبناء.\n• يندمج بسلاسة على البشرة.\n• مناسب للخدود وأعلى عظمة الحاجب والأنف.\n• صُنع في أوروبا.";

const DESC_EN =
  "Elixir Baked Highlighter — baked formula that brings intensity to glow and colour to the next level.\n\n" +
  "• Revolutionary velvety baked texture.\n• Highly pigmented radiance with buildable intensity.\n• Blends effortlessly on the skin.\n• Ideal for cheekbones, brow bone and nose bridge.\n• Made in Europe.";

type ProductInput = {
  barcode: string;
  slug: string;
  skuRef: string;
  nameAr: string;
  nameEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5206929010235",
    slug: "elixir-baked-highlighter-palette-776a",
    skuRef: "776A",
    nameAr: "إليكسير - باليت هايلايتر مخبوز رقم 776A",
    nameEn: "Elixir - Baked Highlighter Palette No 776A",
    imageUrls: [
      "https://beautyfree.gr/49374-large_default/5206929010235-elixir-baked-highlighter-palette-776a.jpg",
      "https://beautyfree.gr/49373-large_default/5206929010235-elixir-baked-highlighter-palette-776a.jpg",
    ],
  },
  {
    barcode: "5206929010242",
    slug: "elixir-baked-highlighter-palette-776b",
    skuRef: "776B",
    nameAr: "إليكسير - باليت هايلايتر مخبوز رقم 776B",
    nameEn: "Elixir - Baked Highlighter Palette No 776B",
    imageUrls: [
      "https://beautyfree.gr/49369-large_default/5206929010242-elixir-baked-highlighter-palette-776b.jpg",
      "https://beautyfree.gr/49370-large_default/5206929010242-elixir-baked-highlighter-palette-776b.jpg",
    ],
  },
];

const PRICE = 9950;

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
      categoryId: CATEGORY_ID,
      subcategoryId: HIGHLIGHTER,
      tertiaryCategoryId: POWDER_HIGHLIGHTER,
      subcategoryIds: [HIGHLIGHTER],
      tertiaryCategoryIds: [POWDER_HIGHLIGHTER],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: DESC_AR,
      descriptionEn: DESC_EN,
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
