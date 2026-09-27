/**
 * Update Seventeen Silky Shadow Base — attach shade barcodes from Iraqi POS + official EANs.
 *
 * User-supplied barcodes mapped via POS inventory names:
 *   5201641723562 → 100
 *   5201641712016 → 101
 *   5201641712023 → 102
 *   5201641712054 → 105
 *   5201641723579 → 109 (also product barcode)
 *   5201641725658 → 110
 *
 * Official CDN EANs (not in user list, kept for full line):
 *   5201641712030 → 103
 *   5201641712047 → 104
 *   5201641725665 → 111
 *
 * Excluded from this product (other Silky Shadow lines / unrelated):
 *   5201641711859 → 202 (Satin)
 *   5201641711866 → 203 (Satin)
 *   5201641714027 → 408 (Pearl)
 *   5201641711989 → 03 (other line)
 *
 * Usage: npx tsx scripts/update-seventeen-silky-shadow-base-shade-barcodes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "617bd3cc-8b8f-49f1-91ab-0ae16d243e39";
const PRODUCT_BARCODE = "5201641723579";

const IMG = "https://seventeencosmetics.com/media/images/products";
const IMG_22 = `${IMG}/2022/12`;
const IMG_25 = `${IMG}/2025/04`;
const ELRYAN =
  "https://www.elryan.com/img/600/600/resize/catalog/product/d/c/dca853f3-f00e-41d8-928f-9afc5384ba60-63938.jpg";

const PRICE = 10125;
const ORIGINAL = 11250;
const DISCOUNT = 10;

type ShadeSpec = {
  name: string;
  barcode: string;
  colorHex: string;
  imageUrl?: string;
  stock: number;
};

/** Full Silky Shadow Base line: Iraqi POS shades 100/109 + official 101–105/110/111 */
const SHADES: ShadeSpec[] = [
  {
    name: "100",
    barcode: "5201641723562",
    colorHex: "#F0E6DC",
    imageUrl: ELRYAN,
    stock: 2,
  },
  {
    name: "101",
    barcode: "5201641712016",
    colorHex: "#F5F4F9",
    imageUrl: `${IMG_22}/5201641712016_P_1_yOCcO6K.jpg`,
    stock: 2,
  },
  {
    name: "102",
    barcode: "5201641712023",
    colorHex: "#F6D6BF",
    imageUrl: `${IMG_22}/5201641712023_P_1.jpg`,
    stock: 2,
  },
  {
    name: "103",
    barcode: "5201641712030",
    colorHex: "#E7CFB5",
    imageUrl: `${IMG_22}/5201641712030_P_1.jpg`,
    stock: 0,
  },
  {
    name: "104",
    barcode: "5201641712047",
    colorHex: "#E5C7AF",
    imageUrl: `${IMG_22}/5201641712047_P_1.jpg`,
    stock: 0,
  },
  {
    name: "105",
    barcode: "5201641712054",
    colorHex: "#A0907C",
    imageUrl: `${IMG_22}/5201641712054_P_1.jpg`,
    stock: 2,
  },
  {
    name: "109",
    barcode: "5201641723579",
    colorHex: "#C4A992",
    imageUrl: `${IMG_25}/silky_shadow_base_copy.jpg`,
    stock: 2,
  },
  {
    name: "110",
    barcode: "5201641725658",
    colorHex: "#DBC8B5",
    imageUrl: `${IMG_22}/5201641725658_P_1.jpg`,
    stock: 2,
  },
  {
    name: "111",
    barcode: "5201641725665",
    colorHex: "#A6867E",
    imageUrl: `${IMG_22}/5201641725665_P_1.jpg`,
    stock: 0,
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login: ${(json as { message?: string }).message ?? res.statusText}`);
  const data = (json as { data?: { accessToken?: string; token?: string } }).data ?? json;
  token =
    (data as { accessToken?: string }).accessToken ??
    (data as { token?: string }).token ??
    (json as { accessToken?: string }).accessToken ??
    "";
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
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

type Product = {
  id: string;
  barcode?: string | null;
  images?: Array<{ mediaId: string }>;
  shades?: Array<{
    name: string;
    colorHex: string;
    barcode?: string | null;
    imageId?: string | null;
    price?: number;
    originalPrice?: number;
    discountPercent?: number;
    stock?: number;
  }>;
};

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`Shades to set: ${SHADES.length} (with barcodes)\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingByName = new Map((product.shades ?? []).map((s) => [s.name, s]));

  console.log("Preparing shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
    price: number;
    originalPrice: number;
    discountPercent: number;
  }> = [];

  for (let i = 0; i < SHADES.length; i++) {
    const spec = SHADES[i]!;
    const existing = existingByName.get(spec.name);
    let imageId = existing?.imageId ?? undefined;

    if (!imageId && spec.imageUrl) {
      imageId = await uploadImage(spec.imageUrl, `ssb-${spec.name}`);
      console.log(`  ✓ uploaded ${spec.name}`);
      await new Promise((r) => setTimeout(r, 400));
    } else if (imageId) {
      console.log(`  · reuse image ${spec.name}`);
    } else if (spec.imageUrl) {
      imageId = await uploadImage(spec.imageUrl, `ssb-${spec.name}`);
      console.log(`  ✓ uploaded ${spec.name}`);
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!imageId) throw new Error(`No image for shade ${spec.name}`);

    shades.push({
      name: spec.name,
      colorHex: existing?.colorHex || spec.colorHex,
      barcode: spec.barcode,
      imageId,
      position: i,
      stock: spec.stock,
      price: PRICE,
      originalPrice: ORIGINAL,
      discountPercent: DISCOUNT,
    });
    console.log(`  → ${spec.name}  ${spec.barcode}  stock=${spec.stock}`);
  }

  const imageIds = [
    ...new Set([
      ...(product.images ?? []).map((i) => i.mediaId),
      ...shades.map((s) => s.imageId),
    ]),
  ];

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    barcode: PRODUCT_BARCODE,
    shades,
    imageIds,
  });

  const verify = await api<Product>(`/products/${PRODUCT_ID}`);
  const list = verify.shades ?? [];
  const missing = list.filter((s) => !s.barcode);
  if (missing.length) {
    throw new Error(`Missing barcodes on: ${missing.map((s) => s.name).join(", ")}`);
  }

  console.log(`\n✓ Updated Silky Shadow Base`);
  console.log(`  Product barcode: ${verify.barcode}`);
  console.log(`  Shades: ${list.length}`);
  for (const s of list) {
    console.log(`    ${s.name} → ${s.barcode} | ${s.colorHex} | ${s.price} IQD | stock ${s.stock}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
