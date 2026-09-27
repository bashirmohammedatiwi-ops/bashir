/**
 * Radiant Professional Time Proof Eye Brow Pencil — all 4 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-time-proof-eye-brow-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const IMG_2022 = "https://radiant-professional.com/media/images/products/2022/08";

const PRODUCT = {
  slug: "radiant-professional-time-proof-eye-brow-pencil",
  sku: "RAD-TPEBP",
  price: 7000,
  nameAr: "راديانت بروفيشنال - قلم حواجب تايم بروف",
  nameEn: "Radiant Professional - Time Proof Eye Brow Pencil",
  descriptionAr:
    "قلم حواجب تايم بروف من راديانت بروفيشنال — لتحديد وملء الحواجب بمظهر طبيعي وثبات طويل.\n\n" +
    "• تركيبة ناعمة سهلة التطبيق لرسم شعرات طبيعية.\n• ثبات طويل الأمد ومقاوم للماء.\n• يملأ الفراغات ويحدد شكل الحواجب بدقة.\n• فرشاة مدمجة لتصفيف ودمج اللون.\n• درجات متنوعة تناسب مختلف ألوان الشعر.\n• مختبر جلدياً.\n• صفّفي الحواجب بالفرشاة، ثم ارسمي شعرات صغيرة بقلم الحواجب وادمجي بلطف.",
  descriptionEn:
    "Radiant Professional Time Proof Eye Brow Pencil — soft brow pencil for natural-looking, long-lasting brow definition.\n\n" +
    "• Soft, easy-to-apply formula for precise hair-like strokes.\n• Long-lasting, waterproof wear.\n• Fills gaps and defines brow shape with precision.\n• Integrated brush for shaping and blending.\n• Shade range to suit different hair colours.\n• Dermatologically tested.\n• Brush brows into place, draw hair-like strokes with the pencil, then blend gently.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "01 Black", colorHex: "#0f0f0f", barcode: "5201641697092", imageUrl: `${IMG_2022}/5201641697092_ghdMCC1.jpg`, position: 0 },
  { name: "02 Light Brown", colorHex: "#865c50", barcode: "5201641649978", imageUrl: `${IMG_2022}/5201641649978_jirqFB7.jpg`, position: 1 },
  { name: "03 Grey", colorHex: "#414141", barcode: "5201641649985", imageUrl: `${IMG_2022}/5201641649985_9RvgEGC.jpg`, position: 2 },
  { name: "04 Mocca", colorHex: "#412f2e", barcode: "5201641676134", imageUrl: `${IMG_2022}/5201641676134_gFI1ijY.jpg`, position: 3 },
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
    barcode: string;
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
        barcode: shade.barcode,
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex}) — ${shade.barcode}`);
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
    subcategoryId: EYEBROW,
    tertiaryCategoryId: BROW_PENCIL,
    subcategoryIds: [EYEBROW],
    tertiaryCategoryIds: [BROW_PENCIL],
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
  console.log(`  Category: المكياج → الحواجب → قلم الحواجب`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
