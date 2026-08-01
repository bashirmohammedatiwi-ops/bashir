/**
 * Radiant Professional Natural Fix All Day Matt Makeup SPF 15 — 8 shades.
 * Sources: hondoscenter.com / radiant-professional.com (natural-fix-all-day-matt-make-up_112)
 * Barcodes verified: epharmadora.com, wecare.gr, ofarmakopoiosmou.gr (no rotation)
 * Images: shade number in radiant_natural_fix_* filenames (2023/06, 06 in 2025/07)
 * Usage: npx tsx scripts/add-radiant-natural-fix-all-day-matt-makeup-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const IMG = "https://radiant-professional.com/media/images/products/2023/06";
const IMG_2025 = "https://radiant-professional.com/media/images/products/2025/07";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-natural-fix-all-day-matt-makeup",
  sku: "RAD-NFADMM",
  price: 24900,
  nameAr: "راديانت بروفيشنال - ناتشورال فيكس أول داي مات ميك أب",
  nameEn: "Radiant Professional - Natural Fix All Day Matt Makeup SPF 15",
  descriptionAr:
    "ناتشورال فيكس أول داي مات ميك أب من راديانت بروفيشنال — تغطية عالية جداً بلمسة مطفية طبيعية وثبات طويل.\n\n" +
    "• تغطية عالية مقاومة للانتقال حتى في الحرارة والرطوبة.\n• غني بفيتامين E وبديل نباتي لحمض الهيالورونيك ومسحوق يتحكم باللمعان.\n• يرطّب البشرة ويمنح مظهراً مخملياً طبيعياً.\n• حماية SPF 15 من أشعة الشمس.\n• خالٍ من الزيوت والبارابين ولا يسبب حب الشباب.\n• مثالي للبشرة المختلطة والدهنية وجميع أنواع البشرة.\n• يُطبّق على الوجه بفرشاة أو إسفنجة أو الأصابع ويُوزَّع نحو خط الشعر والرقبة.",
  descriptionEn:
    "Radiant Professional Natural Fix All Day Matt Makeup SPF 15 — very high coverage with a natural matte finish and long-lasting wear.\n\n" +
    "• Transfer-resistant high coverage that stays flawless in heat and humidity.\n• Enriched with Vitamin E, a botanical hyaluronic acid alternative and oil-regulating micropowder.\n• Deeply hydrates while delivering a velvety, natural-looking finish.\n• SPF 15 protection against photoaging.\n• Oil-free, paraben-free and non-acnegenic.\n• Ideal for combination and oily skin, suitable for all skin types.\n• Apply with a brush, sponge or fingers and blend toward the hairline, face contour and neck.",
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
    name: "00 Alabaster",
    colorHex: "#f5e8dc",
    barcode: "5201641718124",
    imageUrl: `${IMG}/radiant_natural_fix_00_1_wOW8bhb.jpg`,
    position: 0,
  },
  {
    name: "01 Rosy",
    colorHex: "#f0d8c8",
    barcode: "5201641718131",
    imageUrl: `${IMG}/radiant_natural_fix_01_1_xiYheiZ.jpg`,
    position: 1,
  },
  {
    name: "02 Caramel",
    colorHex: "#e8c8a8",
    barcode: "5201641718148",
    imageUrl: `${IMG}/radiant_natural_fix_02_1_NyBHbuD.jpg`,
    position: 2,
  },
  {
    name: "03 Beige",
    colorHex: "#e2bea0",
    barcode: "5201641718155",
    imageUrl: `${IMG}/radiant_natural_fix_03_1_GjPcYMa.jpg`,
    position: 3,
  },
  {
    name: "03a Peanut",
    colorHex: "#ddb896",
    barcode: "5201641732731",
    imageUrl: `${IMG}/radiant_natural_fix_03A_2_nHXZbIP.jpg`,
    position: 4,
  },
  {
    name: "04 Peachy Beige",
    colorHex: "#d4ad88",
    barcode: "5201641718162",
    imageUrl: `${IMG}/radiant_natural_fix_04_1_ac5c1jM.jpg`,
    position: 5,
  },
  {
    name: "05 Light Tan",
    colorHex: "#c9976e",
    barcode: "5201641718179",
    imageUrl: `${IMG}/radiant_natural_fix_05_1_tNbJ3CR.jpg`,
    position: 6,
  },
  {
    name: "06 Tan",
    colorHex: "#b08058",
    barcode: "5201641718186",
    imageUrl: `${IMG_2025}/radiant_natural_fix_06_2_MVyHSqg.jpg`,
    position: 7,
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
    tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [FOUNDATION],
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
  console.log(`  Category: المكياج → الوجه → كريم أساس`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
