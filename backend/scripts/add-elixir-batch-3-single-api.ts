/**
 * Elixir — 3 separate single-SKU products.
 * Sources: beautyfree.gr + elixirmakeup.gr
 * Usage: npx tsx scripts/add-elixir-batch-3-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const MAKEUP_SPRAY = "afb26abb-e48f-4ced-8863-2c3ba1333505";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const MASCARA = "e1032b57-c1af-49e3-a408-130468f22736";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

type ProductInput = {
  barcode: string;
  slug: string;
  price: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
};

const PRODUCTS: ProductInput[] = [
  {
    barcode: "5206929016602",
    slug: "elixir-setting-spray-matte-finish-429",
    price: 7950,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: MAKEUP_SPRAY,
    nameAr: "إليكسير - سبراي تثبيت مكياج مات فينش رقم 429",
    nameEn: "Elixir - Setting Spray Matte Finish 429",
    descriptionAr:
      "سبراي تثبيت مكياج بلمسة مطفية من إليكسير — حليفك لإطلالة مثالية وثابتة طوال اليوم.\n\n" +
      "• يثبّت المكياج ويحميه من التلاشي.\n• ينعم البشرة ويمنحها لمسة نهائية مطفية.\n• يناسب جميع أنواع البشرة.\n• صُنع في أوروبا.",
    descriptionEn:
      "Elixir Setting Spray Matte Finish 429 — your ally for flawless, long-lasting makeup all day.\n\n" +
      "• Sets and protects makeup from fading.\n• Mattifying finish for a smooth, refined look.\n• Suitable for all skin types.\n• Made in Europe.",
    imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/429.jpg",
  },
  {
    barcode: "5206929334911",
    slug: "elixir-mascara-ilash-black",
    price: 5950,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: MASCARA,
    nameAr: "إليكسير - ماسكارا آي لاش بلاك",
    nameEn: "Elixir - Mascara iLash Black",
    descriptionAr:
      "ماسكارا آي لاش بلاك من إليكسير — فرشاة سيليكون مع تركيبة كريمية لتعزيز حجم الرموش بلمعان أسود عميق.\n\n" +
      "• فرشاة سيليكون جديدة لتوزيع متساوٍ.\n• تركيبة كريمية تعزّز حجم الرموش.\n• طبقة لامعة من الأسود العميق.\n• صُنع في أوروبا.",
    descriptionEn:
      "Elixir Mascara iLash Black — silicone brush with a creamy formula to boost lash volume with a deep black glossy coat.\n\n" +
      "• New silicone brush for even application.\n• Creamy formula boosts lash volume.\n• Deep black radiant finish.\n• Made in Europe.",
    imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/934.jpg",
  },
  {
    barcode: "5206929335741",
    slug: "elixir-eyeliner-pen-ultra-soft",
    price: 5950,
    categoryId: MAKEUP,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    nameAr: "إليكسير - قلم كحل الترا سوفت",
    nameEn: "Elixir - Eyeliner Pen Ultra Soft",
    descriptionAr:
      "قلم كحل ألترا سوفت من إليكسير — قلم كحل مقاوم للماء برأس رفيع للتحكم الدقيق ونتيجة جذابة.\n\n" +
      "• رأس رفيع للتحكم الكامل.\n• تركيبة ألترا سوفت ناعمة وسهلة التطبيق.\n• مقاوم للماء وثبات طويل.\n• صُنع في أوروبا.",
    descriptionEn:
      "Elixir Eyeliner Pen Ultra Soft — waterproof precision pen with a fine tip for controlled, captivating eye definition.\n\n" +
      "• Fine tip for full control.\n• Ultra soft formula glides on smoothly.\n• Waterproof, long-lasting wear.\n• Made in Europe.",
    imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/933.jpg",
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

    console.log(`Uploading image for ${p.slug}...`);
    const imageId = await uploadImage(p.imageUrl, p.slug);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: p.barcode,
      barcode: p.barcode,
      slug: p.slug,
      brandId,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      tertiaryCategoryId: p.tertiaryCategoryId,
      subcategoryIds: [p.subcategoryId],
      tertiaryCategoryIds: [p.tertiaryCategoryId],
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
