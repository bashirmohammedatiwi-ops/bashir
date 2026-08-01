/**
 * Elixir Blush Me Up Liquid Blusher — 3 separate single-SKU products (201, 202, 203).
 * Sources: e-color.gr (barcodes, images, price), beautycom.gr (descriptions)
 * Usage: npx tsx scripts/add-elixir-blush-me-up-liquid-blusher-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const DESC_AR =
  "بلاش مي أب سائل من إليكسير — روج سائل مبتكر مع إسفنجة مدمجة لتوزيع متساوٍ ونتيجة طبيعية.\n\n" +
  "• تركيبة سائلة سهلة التطبيق والدمج.\n• إسفنجة مدمجة للتطبيق السريع والدقيق.\n• تأثير طبيعي مع إمكانية بناء اللون تدريجياً.\n• خفيف على البشرة وغير دهني.\n• مناسب لجميع أنواع البشرة.\n• 6 مل — صُنع في أوروبا.";

const DESC_EN =
  "Elixir Blush Me Up Liquid Blusher — innovative liquid blush with a built-in sponge for even application and natural results.\n\n" +
  "• Liquid formula, easy to apply and blend.\n• Built-in sponge for quick, precise application.\n• Natural effect with buildable intensity.\n• Lightweight, non-greasy feel.\n• Suitable for all skin types.\n• 6 ml — Made in Europe.";

type ProductInput = {
  barcode: string;
  slug: string;
  shade: string;
  price: number;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5206929019047",
    slug: "elixir-blush-me-up-liquid-blusher-201",
    shade: "201",
    price: 7750,
    imageUrl: "https://e-color.gr/image/catalog/product/14487/88407-201-1.jpg",
  },
  {
    barcode: "5206929019054",
    slug: "elixir-blush-me-up-liquid-blusher-202",
    shade: "202",
    price: 7750,
    imageUrl: "https://e-color.gr/image/catalog/product/14488/88407-202-1.jpg",
  },
  {
    barcode: "5206929019061",
    slug: "elixir-blush-me-up-liquid-blusher-203",
    shade: "203",
    price: 7750,
    imageUrl: "https://e-color.gr/image/catalog/product/14483/88407-203-1.jpg",
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
    brandAr: "إليكسير",
    brandEn: "Elixir",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Elixir brand");
  console.log(`Brand: Elixir (${brandId})${resolved.created ? " [created]" : ""}\n`);
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

  const brandId = await resolveBrandId();
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

    const nameAr = `إليكسير - بلاش مي أب سائل رقم ${p.shade}`;
    const nameEn = `Elixir - Blush Me Up Liquid Blusher ${p.shade}`;

    console.log(`Uploading image for ${p.slug}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId,
      categoryId: MAKEUP,
      subcategoryId: CHEEK,
      tertiaryCategoryId: BLUSH,
      subcategoryIds: [CHEEK],
      tertiaryCategoryIds: [BLUSH],
      nameAr,
      nameEn,
      descriptionAr: DESC_AR,
      descriptionEn: DESC_EN,
      price: p.price,
      originalPrice: p.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    });

    console.log(`✓ ${nameAr}`);
    console.log(`  ID: ${created.id} | ${p.barcode} | ${p.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
