/**
 * Elixir Face Primers — 4 separate single-SKU products.
 * Sources: beautyfree.gr, elixirmakeup.gr, profilshop.gr
 * Usage: npx tsx scripts/add-elixir-face-primers-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FACE_PRIMER = "d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b";

const ELIXIR_IMG = "https://elixirmakeup.gr/wp-content/uploads/2022/09";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5206929500323",
    slug: "elixir-face-primer-multifunctional-834-30ml",
    price: 7950,
    nameAr: "إليكسير - برايمر وجه متعدد الوظائف رقم 834 - 30 مل",
    nameEn: "Elixir - Face Primer Multifunctional No 834 30ml",
    descriptionAr:
      "برايمر وجه متعدد الوظائف من إليكسير — قاعدة مكياج ثورية تجمع بين الترطيب وتجديد البشرة.\n\n" +
      "• تركيبة متعددة الوظائف لقاعدة مثالية قبل المكياج.\n• يُرطّب البشرة ويمنحها إحساساً ناعماً كالمخمل.\n• ينعّم مظهر البشرة ويحسّن ثبات المكياج.\n• مناسب لجميع أنواع البشرة.\n• 30 مل — صُنع في أوروبا.",
    descriptionEn:
      "Elixir Face Primer Multifunctional No 834 — revolutionary multifunctional base for hydration and skin renewal.\n\n" +
      "• All-in-one primer prepares skin for flawless makeup.\n• Moisturizes and leaves a velvety-soft feel.\n• Smooths the complexion and improves makeup wear.\n• Suitable for all skin types.\n• 30 ml — Made in Europe.",
    imageUrls: [
      "https://beautyfree.gr/46628-large_default/5206929500323-elixir-face-primer-multifunctional-no-834.jpg",
    ],
  },
  {
    barcode: "5206929500330",
    slug: "elixir-face-primer-nourishing-effect-854-30ml",
    price: 7950,
    nameAr: "إليكسير - برايمر وجه بتأثير مغذٍّ رقم 854 - 30 مل",
    nameEn: "Elixir - Face Primer Nourishing Effect No 854 30ml",
    descriptionAr:
      "برايمر وجه بتأثير مغذٍّ من إليكسير — قاعدة مكياج تغذّي البشرة وتحارب علامات التعب.\n\n" +
      "• تركيبة مغذّية بخصائص مضادة للشيخوخة.\n• يمنح ترطيباً إضافياً ولمسة كالحرير.\n• مثالي للبشرة العادية إلى الجافة.\n• يُمهّد البشرة ويطيل ثبات المكياج.\n• 30 مل — صُنع في أوروبا.",
    descriptionEn:
      "Elixir Face Primer Nourishing Effect No 854 — nourishing makeup base with anti-aging care.\n\n" +
      "• Nourishing formula with anti-aging properties.\n• Extra hydration and a silky, velvety finish.\n• Ideal for normal to dry skin.\n• Preps skin and extends makeup wear.\n• 30 ml — Made in Europe.",
    imageUrls: [
      "https://beautyfree.gr/46629-large_default/5206929500330-elixirface-primer-nourishing-effect-no-854.jpg",
      `${ELIXIR_IMG}/854.jpg`,
    ],
  },
  {
    barcode: "5206929335970",
    slug: "elixir-face-primer-brightening-glow-30ml",
    price: 7950,
    nameAr: "إليكسير - برايمر وجه للإشراق والتألق 30 مل",
    nameEn: "Elixir - Face Primer Brightening & Glow 30ml",
    descriptionAr:
      "برايمر وجه للإشراق والتألق من إليكسير — يُضيء البشرة ويُنعّشها ويرطّبها بعمق بلمسة مخملية.\n\n" +
      "• تركيبة جيل تتحول إلى قاعدة مرطّبة منعشة على البشرة.\n• اللون الوردي يتحول إلى لمسة ذهبية لامعة خفيفة.\n• يمنح إشراقاً طبيعياً وثباتاً للمكياج طوال اليوم.\n• مناسب لجميع أنواع البشرة.\n• 30 مل — خالٍ من البارابين والغلوتين — صُنع في أوروبا.",
    descriptionEn:
      "Elixir Face Primer Brightening & Glow — illuminates, revitalizes and deeply hydrates for a velvety feel.\n\n" +
      "• Gel texture transforms into a refreshing, moisturizing base.\n• Pink tone shifts to a subtle gold shimmer on skin.\n• Natural radiance with all-day makeup longevity.\n• Suitable for all skin types.\n• 30 ml — Paraben-free, gluten-free — Made in Europe.",
    imageUrls: [
      "https://beautyfree.gr/18729-large_default/elixir-face-primer-brightening-30ml.jpg",
      `${ELIXIR_IMG}/879.jpg`,
    ],
  },
  {
    barcode: "5206929335963",
    slug: "elixir-face-primer-makeup-extending-matte-859-30ml",
    price: 7400,
    nameAr: "إليكسير - برايمر وجه لإطالة ثبات المكياج مطفي رقم 859 - 30 مل",
    nameEn: "Elixir - Face Primer Makeup Extending Matte No 859 30ml",
    descriptionAr:
      "برايمر وجه لإطالة ثبات المكياج من إليكسير — قاعدة مطفية تجعل المكياج أكثر ثباتاً من أي وقت.\n\n" +
      "• تركيبة خفيفة قائمة على الماء بخصائص مرطّبة.\n• يُقلّل ظهور المسام ويُطيل ثبات المكياج بشكل طبيعي.\n• لمسة مطفية — خالٍ من الزيوت.\n• خصائص مضادة للشيخوخة — خالٍ من البارابين والغلوتين.\n• مناسب لجميع أنواع البشرة — 30 مل — صُنع في أوروبا.",
    descriptionEn:
      "Elixir Face Primer Makeup Extending Matte No 859 — matte water-based base for longer-lasting makeup.\n\n" +
      "• Lightweight, airy texture with moisturizing properties.\n• Blurs pores and naturally extends makeup wear.\n• Matte finish — oil-free formula.\n• Anti-aging care — paraben-free, gluten-free, dermatologically tested.\n• Suitable for all skin types — 30 ml — Made in Europe.",
    imageUrls: [
      `${ELIXIR_IMG}/859.jpg`,
      "https://www.profilshop.gr/images/detailed/228/2671.jpg",
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

    console.log(`Uploading images for ${p.slug}...`);
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
      imageIds,
    });

    console.log(`✓ ${p.nameAr}`);
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
