/**
 * Fix Helia-D 5999569023566 — correct product is Pro Active Vitamin C Face Cream 50ml.
 * Source: helia-d.com catalogue 2025 + official product page.
 * Usage: npx tsx scripts/fix-helia-d-vitamin-c-3566-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BARCODE = "5999569023566";
const IMG = "https://www.helia-d.com/wp-content/uploads";

const FIX = {
  slug: "helia-d-pro-active-vitamin-c-face-cream-50ml",
  sku: "HLD-VCF-023566",
  nameAr: "هيليا-دي برو أكتيف - كريم وجه بفيتامين C 50 مل",
  nameEn: "Helia-D Pro Active Vitamin C Face Cream 50ml",
  descriptionAr:
    "كريم وجه بفيتامين C من هيليا-دي برو أكتيف — تركيبة سريعة الامتصاص للاستخدام اليومي، تساعد على توحيد لون البشرة ومنحها إشراقة طبيعية مع حماية مضادات الأكسدة.\n\n" +
    "• فيتامين C (Ascorbyl Glucoside) لمظهر أكثر إشراقاً وتوحيد لون البشرة.\n" +
    "• مضاد أكسدة قوي يحمي البشرة من العوامل البيئية الضارة.\n" +
    "• جليسرين والألانتoin لترطيب البشرة وتهدئتها.\n" +
    "• لجميع أنواع البشرة — يُطبّق يومياً على الوجه والرقبة بعد التنظيف.\n" +
    "• تركيبة نباتية (Vegan) — مختبر جلدياً.",
  descriptionEn:
    "Helia-D Pro Active Vitamin C Face Cream — fast-absorbing daily face cream with vitamin C for a more even, radiant complexion and antioxidant protection.\n\n" +
    "• Vitamin C (ascorbyl glucoside) helps brighten and even skin tone.\n" +
    "• Strong antioxidant barrier against harmful environmental effects.\n" +
    "• Glycerin and allantoin promote hydration and comfort.\n" +
    "• For all skin types — apply daily on cleansed face and neck.\n" +
    "• Vegan and dermatologically tested.",
  imageUrls: [`${IMG}/2024/09/vit-c-jar-900x900.jpg`, `${IMG}/2024/09/vit-c-jar.jpg`],
};

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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Fixing barcode ${BARCODE} → Vitamin C Face Cream\n`);
  await login();

  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${BARCODE}`,
  );
  if (!check.exists || !check.product?.id) throw new Error(`Product not found: ${BARCODE}`);

  const productId = check.product.id;
  console.log(`Before: ${check.product.nameEn}`);
  console.log(`ID: ${productId}\n`);

  console.log("Uploading images...");
  const imageIds: string[] = [];
  for (let i = 0; i < FIX.imageUrls.length; i++) {
    const imageId = await uploadImage(FIX.imageUrls[i], `vit-c-${i + 1}`);
    imageIds.push(imageId);
    console.log(`  ✓ image ${i + 1}`);
    await new Promise((r) => setTimeout(r, 250));
  }

  await api(`/products/${productId}`, "PATCH", {
    slug: FIX.slug,
    sku: FIX.sku,
    nameAr: FIX.nameAr,
    nameEn: FIX.nameEn,
    descriptionAr: FIX.descriptionAr,
    descriptionEn: FIX.descriptionEn,
    imageIds,
  });

  const verify = await api<{ nameAr?: string; nameEn?: string; slug?: string; images?: unknown[] }>(
    `/products/${productId}`,
  );
  console.log(`\n✓ Fixed:`);
  console.log(`  ${verify.nameAr}`);
  console.log(`  EN: ${verify.nameEn}`);
  console.log(`  Slug: ${verify.slug}`);
  console.log(`  Images: ${verify.images?.length ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
