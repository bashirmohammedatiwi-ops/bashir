/**
 * Grigi Luminous Liquid Concealer Pro — 3 shades (31, 32, 33).
 * Sources: grigi.gr (images, names), beautytown.gr / aromaoneirou.gr (barcodes)
 * Product barcode: 5207042240325 (shade 32 Dark Nude Beige)
 * Usage: npx tsx scripts/add-grigi-luminous-liquid-concealer-pro-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT = {
  barcode: "5207042240325",
  slug: "grigi-luminous-liquid-concealer-pro",
  sku: "GRG-LLCP",
  price: 10500,
  nameAr: "غريغي - كونسيلر سائل مضيء Luminous Liquid Concealer Pro",
  nameEn: "Grigi - Luminous Liquid Concealer Pro",
  descriptionAr:
    "كونسيلر سائل مضيء Luminous Liquid Concealer Pro من غريغي — يُخفي الهالات السوداء والعيوب ويمنح إشراقة فورية للبشرة.\n\n" +
    "• تركيبة خفيفة سهلة التطبيق بأداة مدمجة — لا تُثقل تحت العين.\n" +
    "• ميكرو بيغمنتات عاكسة تُحسّن مظهر البشرة وتُضيء منطقة تحت العين فوراً.\n" +
    "• يُخفي التصبغات والاحمرار والهالات بلمسة طبيعية ناعمة.\n" +
    "• يصلح أيضاً كهايلايتر سائل لإبراز عظمة الوجنتين وجسر الأنف.\n" +
    "• 3 درجات نود بيج: 31 فاتح، 33 متوسط، 32 داكن — تناسب جميع ألوان البشرة.\n" +
    "• حجم 10 غرام — صُنع في اليونان.",
  descriptionEn:
    "Grigi Luminous Liquid Concealer Pro — covers dark circles and imperfections while instantly brightening the complexion.\n\n" +
    "• Lightweight formula with built-in applicator — never heavy under the eyes.\n" +
    "• Reflecting micro-pigments improve skin appearance and deliver instant radiance.\n" +
    "• Conceals pigmentation, redness and dark circles with a soft, natural finish.\n" +
    "• Doubles as a liquid highlighter for cheekbones and the bridge of the nose.\n" +
    "• 3 nude beige shades: 31 Light, 33 Medium and 32 Dark — for every skin tone.\n" +
    "• 10 g — Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

/** Names from grigi.gr; barcodes from beautytown.gr / aromaoneirou.gr; hex from texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "31 Light Nude Beige",
    colorHex: "#d1b38f",
    barcode: "5207042240318",
    imageUrl: `${IMG}/g/u/gupclc-31newn.jpg`,
    position: 0,
  },
  {
    name: "32 Dark Nude Beige",
    colorHex: "#c29c81",
    barcode: "5207042240325",
    imageUrl: `${IMG}/g/u/gupclc-32newn.jpg`,
    position: 1,
  },
  {
    name: "33 Medium Nude Beige",
    colorHex: "#d6b395",
    barcode: "5207042240332",
    imageUrl: `${IMG}/g/u/gupclc-33newn.jpg`,
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
    brandAr: "غريغي",
    brandEn: "Grigi",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Grigi brand");
  console.log(`Brand: Grigi (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
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

  const verify = await api<{ shades?: Array<{ name: string; colorHex?: string; barcode?: string }> }>(
    `/products/${created.id}`,
  );

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.barcode ?? "no barcode"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
