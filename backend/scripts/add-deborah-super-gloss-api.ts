/**
 * Deborah SuperGloss — 9 shades (01–09, incl. 07 Brick Red from deborahmilano.com).
 * Sources: profumeriemallardo.com (verified primary image per shade page) + deborahmilano.com (07 + names)
 * Product barcode: 8009518324532 (01 Transparent)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-super-gloss-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const DM = "https://www.deborahmilano.com/en/wp-content/uploads/2021/01";

const PRODUCT = {
  barcode: "8009518324532",
  slug: "deborah-super-gloss",
  sku: "DBR-SG-90500",
  price: 8800,
  nameAr: "ديبورا ميلانو - جلوس شفاه SuperGloss",
  nameEn: "Deborah Milano - SuperGloss Lip Gloss",
  descriptionAr:
    "SuperGloss من ديبورا ميلانو — جلوس شفاه فائق اللمعان بلون غني وتأثير ثلاثي الأبعاد فوري.\n\n" +
    "• تركيبة جلّية تمنح الشفاه نعومة وترطيباً دون إحساس لزج.\n" +
    "• كرات حمض الهيالورونيك لترطيب مكثّف وفوري.\n" +
    "• تأثير حجم فوري وملمس ناعم يلتف بالشفاه.\n" +
    "• 9 درجات: من Transparent إلى Pearly Red وBrown Rose.\n" +
    "• زيت بذور الرمان و4.5 غ.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano SuperGloss — sensationally shiny lip gloss with intense colour and an instant 3D effect.\n\n" +
    "• Gel formula leaves lips soft, smooth and lusciously hydrated without a sticky feel.\n" +
    "• Hyaluronic Acid spheres for instant, intense hydration.\n" +
    "• Instant volume effect with a soft, enveloping texture.\n" +
    "• 9 shades from Transparent to Pearly Red and Brown Rose.\n" +
    "• Pomegranate seed oil — 4.5 g.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Verified Mallardo primary images (lowest shop id per shade page) + hex sampled from same image. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Transparent",
    colorHex: "#e8e0f0",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71009-large_default/deb-super-gloss-01.jpg",
    position: 0,
  },
  {
    name: "02 Pearly Rose",
    colorHex: "#e0a0b0",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71013-large_default/deb-super-gloss-02.jpg",
    position: 1,
  },
  {
    name: "03 Pink",
    colorHex: "#c898a8",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/71017-large_default/deb-super-gloss-03.jpg",
    position: 2,
  },
  {
    name: "04 Pearly Cherry",
    colorHex: "#c05068",
    imageUrl: "https://cdn-3-profumeriemallardo.server.it/shop/71021-large_default/deb-super-gloss-04.jpg",
    position: 3,
  },
  {
    name: "05 Pearly Coral",
    colorHex: "#e88890",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/71025-large_default/deb-super-gloss-05.jpg",
    position: 4,
  },
  {
    name: "06 Pearly Red",
    colorHex: "#b84050",
    imageUrl: "https://cdn-1-profumeriemallardo.server.it/shop/71029-large_default/deb-super-gloss-06.jpg",
    position: 5,
  },
  {
    name: "07 Brick Red",
    colorHex: "#a84858",
    imageUrl: `${DM}/008118-SUPER-GLOSS.jpg`,
    position: 6,
  },
  {
    name: "08 Pearly Chestnut",
    colorHex: "#a87868",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71037-large_default/deb-super-gloss-08.jpg",
    position: 7,
  },
  {
    name: "09 Brown Rose",
    colorHex: "#986870",
    imageUrl: "https://cdn-2-profumeriemallardo.server.it/shop/71041-large_default/deb-super-gloss-09.jpg",
    position: 8,
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
    brandAr: "ديبورا",
    brandEn: "Deborah Milano",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Deborah Milano brand");
  console.log(`Brand: Deborah Milano (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists) {
    console.log(`skip ${PRODUCT.barcode} — exists | ${check.product?.nameAr ?? "?"}`);
    return;
  }

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — slug exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images (parallel)...");
  const shades = await Promise.all(
    SHADES.map(async (shade) => {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
      return {
        name: shade.name,
        colorHex: shade.colorHex,
        imageId,
        position: shade.position,
        stock: 0,
      };
    }),
  );

  shades.sort((a, b) => a.position - b.position);
  const imageIds = shades.map((s) => s.imageId);

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_GLOSS],
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

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
