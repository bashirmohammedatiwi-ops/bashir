/**
 * Radiant Professional Face Illuminator All Over Concealer — 7 shades.
 * Sources: hondoscenter.com / radiant-professional.com (face-illuminator-all-over-concealer_1056)
 * Barcodes verified: wecare.gr, beautyfree.gr (sequential, no rotation)
 * Images: shade number in radiant_face_illuminator_XX_1_* filenames (2025/04)
 * Usage: npx tsx scripts/add-radiant-face-illuminator-all-over-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const IMG = "https://radiant-professional.com/media/images/products/2025/04";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-face-illuminator-all-over-concealer",
  sku: "RAD-FIAOC",
  price: 21000,
  nameAr: "راديانت بروفيشنال - كونسيلر فيس إلوميناتور أول أوفر",
  nameEn: "Radiant Professional - Face Illuminator All Over Concealer",
  descriptionAr:
    "كونسيلر فيس إلوميناتور أول أوفر من راديانت بروفيشنال — كونسيلر سائل مقاوم للماء بتغطية قابلة للتطبيق المتدرج ولمسة متوهجة طبيعية.\n\n" +
    "• تركيبة خفيفة متعددة الاستخدامات للوجه والعينين.\n• غني بحمض الهيالورونيك ومستخلص الخشخاش وزيت الجوجوبا وزبدة الشيا.\n• يخفي العيوب ويقلل الانتفاخ وعلامات التعب مع إضاءة طبيعية.\n• مناسب للكونتور والهايلايت بدمج درجتين فاتحة وداكنة.\n• 83% مكونات طبيعية المنشأ، مقاوم للماء ولا ينتقل أو يتكتل.\n• يُطبّق بالمطبّق المرفق ويُوزَّع بالأصابع أو الإسفنجة أو الفرشاة.",
  descriptionEn:
    "Radiant Professional Face Illuminator All Over Concealer — waterproof moisturizing liquid concealer with buildable coverage and a natural radiant finish.\n\n" +
    "• Multi-tasking lightweight formula for face and eyes.\n• Enriched with hyaluronic acid, poppy plant extract, jojoba oil and shea butter.\n• Conceals imperfections, reduces puffiness and signs of fatigue with a luminous finish.\n• Ideal for contouring and highlighting by combining lighter and darker shades.\n• 83% natural-origin ingredients; waterproof, transfer-resistant and crease-resistant.\n• Apply with the applicator and blend with fingers, a sponge or brush.",
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
    name: "01NC Ivory",
    colorHex: "#f2dcc8",
    barcode: "5201641047545",
    imageUrl: `${IMG}/radiant_face_illuminator_01_1_SGmYaUK.jpg`,
    position: 0,
  },
  {
    name: "02NW Warm Ivory",
    colorHex: "#edd0b8",
    barcode: "5201641047552",
    imageUrl: `${IMG}/radiant_face_illuminator_02_1_Cj5oAgs.jpg`,
    position: 1,
  },
  {
    name: "03N Nude",
    colorHex: "#e4c4a8",
    barcode: "5201641047569",
    imageUrl: `${IMG}/radiant_face_illuminator_03_1_K0lmutL.jpg`,
    position: 2,
  },
  {
    name: "04W Toffee",
    colorHex: "#d9ad8a",
    barcode: "5201641047576",
    imageUrl: `${IMG}/radiant_face_illuminator_04_1_Qui1UJh.jpg`,
    position: 3,
  },
  {
    name: "05NW Squash",
    colorHex: "#d4a07a",
    barcode: "5201641047583",
    imageUrl: `${IMG}/radiant_face_illuminator_05_1_mD4Eu6v.jpg`,
    position: 4,
  },
  {
    name: "06W Caramel",
    colorHex: "#c08a62",
    barcode: "5201641047590",
    imageUrl: `${IMG}/radiant_face_illuminator_06_1_ymcPyIO.jpg`,
    position: 5,
  },
  {
    name: "07NC Cinammon",
    colorHex: "#a8724f",
    barcode: "5201641047606",
    imageUrl: `${IMG}/radiant_face_illuminator_07_1_TWstTzM.jpg`,
    position: 6,
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

async function uploadImage(url: string, alt: string, barcode: string, attempt = 1): Promise<string> {
  const urls = [url, `${IMG_BROCARD}/${barcode}_1.jpg`];
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
  return uploadImage(url, alt, barcode, attempt + 1);
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
    const imageId = await uploadImage(shade.imageUrl, shade.name, shade.barcode);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 600));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
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
  console.log(`  Category: المكياج → الوجه → كونسيلر`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
