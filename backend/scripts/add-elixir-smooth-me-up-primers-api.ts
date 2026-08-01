/**
 * Elixir Smooth Me Up Primer — 2 separate single-SKU products.
 * Sources: elixirmakeup.gr (images), e-color.gr (barcodes, descriptions)
 * Usage: npx tsx scripts/add-elixir-smooth-me-up-primers-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";

const IMG = "https://elixirmakeup.gr/wp-content/uploads/2025/01";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5206929019245",
    slug: "elixir-smooth-me-up-primer-hydrating-440",
    price: 8000,
    nameAr: "إليكسير - برايمر سموث مي أب مرطّب 440 - 30 مل",
    nameEn: "Elixir - Smooth Me Up Primer Hydrating 440 30ml",
    descriptionAr:
      "برايمر سموث مي أب المرطّب من إليكسير — قاعدة مثالية تبدأ بالترطيب.\n\n" +
      "• تركيبة مرطّبة مخملية لمظهر ناعم ومريح.\n• ينعّم البشرة ويقلّل ظهور المسام.\n• يُنعّش البشرة ويمنحها إشراقة.\n• مثالي للبشرة العادية إلى الجافة.\n• يطيل ثبات المكياج.\n• 30 مل — لون Nude شفاف.",
    descriptionEn:
      "Elixir Smooth Me Up Primer Hydrating 440 30ml — the perfect base starts with hydration.\n\n" +
      "• Moisturizing, silky texture for a comfortable feel.\n• Smooths the skin and reduces the appearance of pores.\n• Brightens and revitalizes the skin.\n• Ideal for normal to dry skin.\n• Enhances makeup longevity.\n• 30 ml — translucent Nude shade.",
    imageUrl: `${IMG}/0C8A8140.jpg`,
  },
  {
    barcode: "5206929019252",
    slug: "elixir-smooth-me-up-primer-nourishing-441",
    price: 10000,
    nameAr: "إليكسير - برايمر سموث مي أب مغذّي 441 - 30 مل",
    nameEn: "Elixir - Smooth Me Up Primer Nourishing 441 30ml",
    descriptionAr:
      "برايمر سموث مي أب المغذّي من إليكسير — قاعدة مثالية بتركيبة جيل.\n\n" +
      "• تركيبة جel تمتص فوراً على البشرة.\n• ينعّم المسام وخطوط التعبير الدقيقة.\n• لمسة مطفية مع ضبط للزيوت.\n• مثالي لجميع أنواع البشرة.\n• يطيل ثبات المكياج.\n• 30 مل — لون Nude شفاف.",
    descriptionEn:
      "Elixir Smooth Me Up Primer Nourishing 441 30ml — the perfect base starts with Elixir's gel primer.\n\n" +
      "• Gel formula that absorbs instantly.\n• Smooths pores and fine lines.\n• Matte finish with oil control.\n• Ideal for all skin types.\n• Prolongs makeup wear.\n• 30 ml — translucent Nude shade.",
    imageUrl: `${IMG}/0C8A8142.jpg`,
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
    console.log(`--- ${p.nameEn} ---`);

    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${p.barcode}`,
    );
    if (check.exists) {
      console.log(`skip ${p.barcode} — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(p.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((row) => row.slug === p.slug)) {
      console.log(`skip ${p.barcode} — slug exists (${p.slug})\n`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId,
      categoryId: CATEGORY_ID,
      subcategoryId: FACE,
      tertiaryCategoryId: FACE_PRIMER,
      subcategoryIds: [FACE],
      tertiaryCategoryIds: [FACE_PRIMER],
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      price: p.price,
      originalPrice: p.price,
      stock: 0,
      isActive: true,
      imageIds: [imageId],
    });

    console.log(`✓ ${p.nameAr}`);
    console.log(`  ID: ${created.id}`);
    console.log(`  Barcode: ${p.barcode}`);
    console.log(`  Price: ${p.price} IQD`);
    console.log(`  Category: Makeup → Face → Primer\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`Done — added: ${added} | skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
