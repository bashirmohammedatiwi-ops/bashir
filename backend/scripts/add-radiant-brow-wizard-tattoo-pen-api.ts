/**
 * Radiant Professional Brow Wizard Tattoo Pen — all 3 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-brow-wizard-tattoo-pen-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYEBROW = "92ebe64a-9091-4460-9f12-68ecbdf4e1e9";
const BROW_PENCIL = "b1db1ac0-66ff-4912-8072-0c07e3fffda3";

const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-brow-wizard-tattoo-pen",
  sku: "RAD-BWTP",
  price: 22000,
  nameAr: "راديانت بروفيشنال - قلم حواجب براون ويزارد تاتو",
  nameEn: "Radiant Professional - Brow Wizard Tattoo Pen",
  descriptionAr:
    "قلم حواجب براون ويزارد تاتو من راديانت بروفيشنال — قلم سائل برأس دقيق لتحديد وملء الحواجب بمظهر طبيعي يدوم طوال اليوم.\n\n" +
    "• قلم تاتو دقيق برأس مرن يشبه الفرشاة لرسم شعرات طبيعية.\n• يحدد ويملأ ويصبغ الحواجب بدقة.\n• ثبات طويل لمظهر حواجب مثالية طوال اليوم.\n• فرشاة مدمجة لتصفيف الحواجب.\n• درجات تناسب مختلف ألوان الشعر.\n• رجّي جيداً قبل الاستخدام.\n• صفّفي الحواجب بالفرشاة، ثم حددي واملئي الحواجب بضربة واحدة.",
  descriptionEn:
    "Radiant Professional Brow Wizard Tattoo Pen — precision liquid brow marker with a fine flexible tip for natural all-day definition.\n\n" +
    "• Precision tattoo pen with a liquid, brush-like flexible tip.\n• Defines, colours and fills brows with detailed strokes.\n• Long-lasting wear for perfectly shaped brows all day.\n• Integrated spoolie for combing and shaping.\n• Shades to suit different hair colours.\n• Shake well before use.\n• Comb brows with the spoolie, then outline and fill with one stroke.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Light Brown",
    colorHex: "#c2b197",
    barcode: "5201641018828",
    imageUrl: "https://radiant-professional.com/media/images/products/2023/03/radiant_brow_wizard_01_light_brown_lfRPOVk.jpeg",
    position: 0,
  },
  {
    name: "02 Natural Brown",
    colorHex: "#cba47b",
    barcode: "5201641018835",
    imageUrl: "https://radiant-professional.com/media/images/products/2023/03/radiant_brow_wizard_02_natural_brown_IppvgzW.jpeg",
    position: 1,
  },
  {
    name: "03 Dark Brown",
    colorHex: "#a18766",
    barcode: "5201641019078",
    imageUrl: "https://radiant-professional.com/media/images/products/2022/07/radiant_brow_wizard_03_dark_brown.jpg",
    position: 2,
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
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const urls = [shade.imageUrl, `${IMG_BROCARD}/${shade.barcode}_1.jpg`];
    let imageId: string | null = null;
    let lastErr: unknown;
    for (const imageUrl of urls) {
      try {
        imageId = await uploadImage(imageUrl, shade.name);
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!imageId) {
      console.log(`  ✗ ${shade.name}: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
      continue;
    }
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
