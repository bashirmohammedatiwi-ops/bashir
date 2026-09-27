/**
 * Radiant Professional — 2 separate face toner products.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-tonic-lotions-batch-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE_ID = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const TONER = "05028a17-da64-4c66-b25f-73c758acc2f8";

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
    barcode: "5201641723494",
    slug: "radiant-professional-pore-minimizing-tonic-lotion-300ml",
    price: 15000,
    nameAr: "راديانت بروفيشنال - لوشن تونر لتصغير المسام 300 مل",
    nameEn: "Radiant Professional - Pore Minimizing Tonic Lotion 300 ml",
    descriptionAr:
      "لوشن تونر لتصغير المسام من راديانت بروفيشنال — تركيبة مخصصة للبشرة الدهنية والمسام الواضحة لضبط اللمعان وتصغير مظهر المسام.\n\n" +
      "• ينظم إفرازات الدهون ويقلل اللمعان الزائد.\n• يشد المسام ويقلل مظهرها.\n• يوازن درجة حموضة البشرة الطبيعية.\n• يحتوي على بروتينات الخميرة ومستخلص الفطر وماء إكليل الجبل.\n• خالٍ من البارابين والكحول.\n• مناسب للبشرة الدهنية.\n• يُطبّق صباحاً ومساءً بقطنة على وجه وعنق نظيفين ثم يُتابع بكريم النهار أو الليل.",
    descriptionEn:
      "Radiant Professional Pore Minimizing Tonic Lotion — tonic for oily skin and visible pores to balance oiliness without dehydrating.\n\n" +
      "• Balances sebum production and reduces oiliness.\n• Firms and diminishes the appearance of pores.\n• Balances the skin's natural pH.\n• With yeast proteins, mushroom extract and rosemary water.\n• Paraben-free and alcohol-free.\n• Dermatologically tested and gluten-free.\n• Apply morning and evening with a cotton pad on clean face and neck, then follow with your day or night cream.",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/Radiant_pore_minimizing_lotion_big_2.jpg",
  },
  {
    barcode: "5201641723487",
    slug: "radiant-professional-balancing-tonic-lotion-300ml",
    price: 15000,
    nameAr: "راديانت بروفيشنال - لوشن تونر موازن 300 مل",
    nameEn: "Radiant Professional - Balancing Tonic Lotion 300 ml",
    descriptionAr:
      "لوشن تونر موازن من راديانت بروفيشنال — تركيبة مناسبة لجميع أنواع البشرة لتوازن درجة الحموضة وتحسين مستوى الترطيب.\n\n" +
      "• يوازن درجة حموضة البشرة ويُنعشها.\n• يكمّل خطوة التنظيف ويُحسّن امتصاص مكونات الكريم.\n• يحسّن ملمس البشرة ويعزز مخزونها المائي.\n• بتقنية هايدراكونسبت ومستخلص نبات الإمبيراتا سيليندركا.\n• يترك البشرة نظيفة ومنعشة دون إحساس بالدهون.\n• خالٍ من الكحول.\n• يُطبّق صباحاً ومساءً بقطنة على وجه وعنق نظيفين ثم يُتابع بكريم النهار أو الليل.",
    descriptionEn:
      "Radiant Professional Balancing Tonic Lotion — pH-balancing tonic suitable for all skin types.\n\n" +
      "• Balances skin pH and tones the complexion.\n• Completes the cleansing ritual and helps skin absorb face cream actives.\n• Improves skin texture and boosts water reserves.\n• With Hydraconcept technology and Imperata Cylindrica root extract.\n• Leaves skin clean and fresh without oiliness.\n• Alcohol-free, dermatologically tested and gluten-free.\n• Apply morning and evening with a cotton pad on clean face and neck, then follow with your day or night cream.",
    imageUrl:
      "https://radiant-professional.com/media/images/products/2020/10/Radiant_tonic_lotion_big_2.jpg",
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
    brandAr: "راديانت بروفيشنال",
    brandEn: "Radiant Professional",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Radiant Professional brand");
  console.log(`Brand: Radiant Professional (${brandId})${resolved.created ? " [created]" : ""}\n`);
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

    console.log(`Uploading image for ${p.barcode}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId,
      categoryId: CARE_ID,
      subcategoryId: FACE,
      tertiaryCategoryId: TONER,
      subcategoryIds: [FACE],
      tertiaryCategoryIds: [TONER],
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
