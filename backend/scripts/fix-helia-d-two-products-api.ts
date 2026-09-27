/**
 * Fix Helia-D products 5999569023566 & 5999569023801 — accurate details + verified images.
 * Source: helia-d.com official product pages.
 * Usage: npx tsx scripts/fix-helia-d-two-products-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const IMG = "https://www.helia-d.com/wp-content/uploads";

type ProductFix = {
  barcode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const FIXES: ProductFix[] = [
  {
    barcode: "5999569023566",
    nameAr: "هيليا-دي برو أكتيف - كريم وجه بفيتامين C 50 مل",
    nameEn: "Helia-D Pro Active Vitamin C Face Cream 50ml",
    descriptionAr:
      "كريم وجه بفيتامين C من هيليا-دي برو أكتيف — تركيبة سريعة الامتصاص للاستخدام اليومي، تساعد على توحيد لون البشرة ومنحها إشراقة طبيعية مع حماية مضادات الأكسدة.\n\n" +
      "• فيتامين C (Ascorbyl Glucoside) لمظهر أكثر إشراقاً وتوحيد لون البشرة.\n" +
      "• مضاد أكسدة قوي يحمي البشرة من العوامل البيئية الضارة.\n" +
      "• جليسرين وألانتoin لترطيب البشرة وتهدئتها.\n" +
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
  },
  {
    barcode: "5999569023801",
    nameAr: "هيليا-دي هايدراماكس - ماء ميسيلار لإزالة المكياج 400 مل",
    nameEn: "Helia-D Hydramax Micellar Make-up Remover Water 400ml",
    descriptionAr:
      "ماء ميسيلار لإزالة المكياج 400 مل من هيليا-دي هايدراماكس — ينظّف البشرة ويزيل المكياج والشوائب بلطف في خطوة واحدة دون الحاجة للشطف.\n\n" +
      "• يزيل المكياج والشوائب اليومية من الوجه ومنطقة العينين والشفاه.\n" +
      "• تقنية الميسيلات مع بروفيتامين B5 وجليسرين وبيتاين لترطيب البشرة.\n" +
      "• تركيبة خفيفة خالية من العطر — مناسبة لجميع أنواع البشرة حتى الحساسة.\n" +
      "• لا يحتاج شطفاً — للاستخدام صباحاً ومساءً.\n" +
      "• يُطبّق بقطنة على الوجه والعينين والشفاه.",
    descriptionEn:
      "Helia-D Hydramax Micellar Make-up Remover Water 400ml — gentle yet effective micellar water that removes makeup and everyday impurities in one easy step with no rinsing required.\n\n" +
      "• Removes makeup and impurities from face, eyes and lips.\n" +
      "• Micellar technology with provitamin B5, glycerin and betaine to maintain moisture.\n" +
      "• Lightweight, fragrance-free formula — suitable for all skin types, even sensitive.\n" +
      "• No rinse needed — morning and evening use.\n" +
      "• Apply with a cotton pad on face, eyes and lips.",
    imageUrls: [`${IMG}/2024/10/micellas-viz.jpg`],
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function findProductId(barcode: string): Promise<string> {
  const check = await api<{ exists: boolean; product?: { id: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) throw new Error(`Product not found: ${barcode}`);
  return check.product.id;
}

async function fixProduct(fix: ProductFix) {
  const productId = await findProductId(fix.barcode);
  console.log(`\n=== ${fix.barcode} ===`);
  console.log(`  ID: ${productId}`);
  console.log(`  ${fix.nameAr}`);

  console.log("  Uploading images...");
  const imageIds: string[] = [];
  for (let i = 0; i < fix.imageUrls.length; i++) {
    const imageId = await uploadImage(fix.imageUrls[i], `${fix.barcode}-${i + 1}`);
    imageIds.push(imageId);
    console.log(`    ✓ image ${i + 1}`);
    await new Promise((r) => setTimeout(r, 250));
  }

  await api(`/products/${productId}`, "PATCH", {
    nameAr: fix.nameAr,
    nameEn: fix.nameEn,
    descriptionAr: fix.descriptionAr,
    descriptionEn: fix.descriptionEn,
    imageIds,
  });

  const verify = await api<{ nameAr?: string; images?: unknown[] }>(`/products/${productId}`);
  console.log(`  ✓ Updated — ${verify.images?.length ?? 0} image(s)`);
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Fixing ${FIXES.length} Helia-D products...\n`);
  await login();
  console.log("Logged in.");

  for (const fix of FIXES) {
    await fixProduct(fix);
  }

  console.log(`\n✓ Done — fixed ${FIXES.length} products`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
