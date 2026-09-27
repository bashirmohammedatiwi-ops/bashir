/**
 * Radiant Professional Brow Definer Fix & Color Waterproof — all 5 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Barcodes verified: epharmadora.com, ofarmakopoiosmou.gr, beautymania.ro, dumyah.com
 * (radiant site had rotated barcodes vs shade names)
 * Usage: npx tsx scripts/add-radiant-brow-definer-fix-color-waterproof-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const IMG = "https://radiant-professional.com/media/images/products/2022/08";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-brow-definer-fix-color-waterproof",
  sku: "RAD-BDFCW",
  price: 13000,
  nameAr: "راديانت بروفيشنال - ماسكارا حواجب ديفاينر فيكس آند كولر مقاومة للماء",
  nameEn: "Radiant Professional - Brow Definer Fix & Color Waterproof",
  descriptionAr:
    "ماسكارا حواجب ديفاينر فيكس آند كولر المقاومة للماء من راديانت بروفيشنال — لشكل مثالي ولون طبيعي يدوم طوال اليوم.\n\n" +
    "• ماسكارا حواجب مقاومة للماء بملمس بودري طبيعي.\n• تمنح الحواجب شكلاً مثالياً ولوناً ثابتاً طوال اليوم.\n• تغطي الشعر الأبيض وتملأ الفراغات بدقة.\n• تركيبة فريدة بشمع الراتنج والبوليمر — لا تنتقل ولا تتلطخ.\n• فرشاة دقيقة تغطي أصغر الشعيرات.\n• مختبر جلدياً.\n• وزّعي المنتج على الحواجب ثم مشّطيها؛ استخدمي الجانب الرفيع عند الطرف الخارجي.",
  descriptionEn:
    "Radiant Professional Brow Definer Fix & Color Waterproof — waterproof brow mascara for perfect shape and natural all-day colour.\n\n" +
    "• Waterproof brow mascara with a natural, powdery matte finish.\n• Gives brows perfect shape and long-lasting colour.\n• Covers grey hairs and fills gaps with precision.\n• Unique Resin Wax and Polymer formula — non-transfer, waterproof wear.\n• Precision brush covers even the smallest hairs.\n• Dermatologically tested.\n• Dust onto brows then comb through; use the thinner side at the outer tail.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

/** Barcodes verified per shade (not radiant data-upc). Images: radiant filename = barcode. */
const SHADES: ShadeInput[] = [
  {
    name: "01A Blond",
    colorHex: "#6d5a4b",
    barcode: "5201641737910",
    imageUrl: `${IMG}/5201641737910_ROiSgCP.jpg`,
    position: 0,
  },
  {
    name: "02 Dark Blond",
    colorHex: "#6b584d",
    barcode: "5201641728284",
    imageUrl: `${IMG}/5201641728284_BNe1kjy.jpg`,
    position: 1,
  },
  {
    name: "03 Red Brown",
    colorHex: "#4a2d20",
    barcode: "5201641728291",
    imageUrl: `${IMG}/5201641728291_sCYmars.jpg`,
    position: 2,
  },
  {
    name: "04 Dark Brown",
    colorHex: "#3c3428",
    barcode: "5201641728307",
    imageUrl: `${IMG}/5201641728307_MQTGiAH.jpg`,
    position: 3,
  },
  {
    name: "08 Noir Brown",
    colorHex: "#282423",
    barcode: "5201641733899",
    imageUrl: `${IMG}/5201641733899_bL7LEjU.jpg`,
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
  const urls = [url];
  const barcode = alt.match(/\d{13}/)?.[0];
  if (barcode) urls.push(`${IMG_BROCARD}/${barcode}_1.jpg`);

  let lastErr: unknown;
  for (const u of urls) {
    try {
      const res = await fetch(u, {
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
      lastErr = err;
    }
  }
  if (attempt >= 4) throw lastErr;
  await new Promise((r) => setTimeout(r, attempt * 1500));
  return uploadImage(url, alt, attempt + 1);
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
    const imageId = await uploadImage(shade.imageUrl, `${shade.barcode}-${shade.name}`);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex}) — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 600));
  }

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
