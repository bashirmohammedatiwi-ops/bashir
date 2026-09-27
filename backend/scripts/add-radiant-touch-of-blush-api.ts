/**
 * Radiant Professional Touch of Blush — all 5 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-touch-of-blush-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG_BASE = "https://radiant-professional.com/media/images/products";

const PRODUCT = {
  slug: "radiant-professional-touch-of-blush",
  sku: "RAD-TOB",
  price: 18000,
  nameAr: "راديانت بروفيشنال - ستك بلاشر توتش أوف بلاش",
  nameEn: "Radiant Professional - Touch of Blush Stick",
  descriptionAr:
    "ستك بلاشر توتش أوف بلاش من راديانت بروفيشنال — بلاشر كريمي مرطب بلمسة نصف مطفية يمنح إطلالة طبيعية نضرة ويدوم طويلاً.\n\n" +
    "• تركيبة كريمية خفيفة قابلة للدمج والتطبيق المتدرج.\n• بلاشر متعدد الاستخدامات للخدود والعيون والشفاه.\n• غني بزيت المورينغا وزيت حبة البركة وزبدة المانغو البرية.\n• يحتوي على حمض الهيالورونيك وبوليساكاريد لترطيب البشرة.\n• قوام كريمي غير لزج بلون واضح وثبات عالٍ.\n• علبة ستك عملية مناسبة للتطبيق أثناء التنقل.\n• مقاوم للماء ومختبر جلدياً.\n• يُطبّق بالأصابع أو فرشاة مكياج أو إسفنجة الدمج الاحترافية.",
  descriptionEn:
    "Radiant Professional Touch of Blush — hydrating creamy blush stick for a natural flush with a semi-matte finish.\n\n" +
    "• Lightweight, blendable and buildable formula.\n• Multi-use stick for cheeks, eyes and lips.\n• Enriched with moringa oil, black cumin seed oil and wild mango butter.\n• Contains low molecular weight hyaluronic acid and polysaccharide for moisture.\n• Creamy non-sticky texture with excellent colour payoff and long wear.\n• Practical stick format for on-the-go application.\n• Water resistant and dermatologically tested.\n• Apply with fingers, a makeup brush or a blending sponge.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Cinnamon",
    colorHex: "#fda392",
    imageUrl: `${IMG_BASE}/2023/12/radiant_touch_of_blush_1_5Mz30tJ.jpg`,
    position: 0,
  },
  {
    name: "02 Coral",
    colorHex: "#ff969a",
    imageUrl: `${IMG_BASE}/2023/12/radiant_touch_of_blush_2_FRdRdLe.jpg`,
    position: 1,
  },
  {
    name: "03 Rosy",
    colorHex: "#ffa9b6",
    imageUrl: `${IMG_BASE}/2023/12/radiant_touch_of_blush_3_RitSd7D.jpg`,
    position: 2,
  },
  {
    name: "04 Apple",
    colorHex: "#9f384e",
    imageUrl: `${IMG_BASE}/2024/01/eshop_radiant_touch_of_blush_4_copy_SnAXXfN.jpg`,
    position: 3,
  },
  {
    name: "05 Peach",
    colorHex: "#ff9489",
    imageUrl: `${IMG_BASE}/2023/12/radiant_touch_of_blush_5_740Ftti.jpg`,
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
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — product already exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      shades.push({
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
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

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: المكياج → الخدود → بلاشر`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
