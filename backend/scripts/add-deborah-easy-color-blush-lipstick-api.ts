/**
 * Deborah Easy Color Blush & Lipstick — 7 shades (01–07).
 * Source: deborahmilano.com (verified names, images, description)
 * Product barcode: 8009518450569 (01 Pink Crush)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-deborah-easy-color-blush-lipstick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const DM24 = "https://www.deborahmilano.com/en/wp-content/uploads/2024/06";
const DM26 = "https://www.deborahmilano.com/en/wp-content/uploads/2026/01";

const PRODUCT = {
  barcode: "8009518450569",
  slug: "deborah-easy-color-blush-lipstick",
  sku: "DBR-ECL-90500",
  price: 15000,
  nameAr: "ديبورا ميلانو - Easy Color Blush & Lipstick",
  nameEn: "Deborah Milano - Easy Color Blush & Lipstick",
  descriptionAr:
    "Easy Color Blush & Lipstick من ديبورا ميلانو — منتج 2 في 1 للشفاه والخدود.\n\n" +
    "• تركيبة غنية بHyaluronic Acid وزيت اللوز الحلو العضوي.\n" +
    "• قوام مخملي بلون قابل للدمج والبناء وثبات جيد.\n" +
    "• أداة مزدوجة: طرف إسفنجي للخدود وطرف مخملي دقيق للشفاه.\n" +
    "• 7 درجات: من Pink Crush إلى Peach Glow.\n" +
    "• متوفر بدرجات Matte وShimmer.\n" +
    "• خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Easy Color Blush & Lipstick — a two-in-one combo for lips and cheeks.\n\n" +
    "• Formulated with Hyaluronic Acid and organic Sweet Almond Oil.\n" +
    "• Velvety texture with blendable, buildable, long-wearing colour.\n" +
    "• Dual applicator: sponge tip for cheeks and flocked tip for precise lip application.\n" +
    "• 7 shades from Pink Crush to Peach Glow.\n" +
    "• Available in matte and shimmer finishes.\n" +
    "• Dermatologist tested.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from deborahmilano.com select labels; hex sampled from each shade image. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Pink Crush",
    colorHex: "#d88888",
    imageUrl: `${DM24}/MDV002524_EASY-COLOR-blushlipstick_011-600x600.png`,
    position: 0,
  },
  {
    name: "02 Cold Rose",
    colorHex: "#f0a0b0",
    imageUrl: `${DM24}/MDV002624_EASY-COLOR-blushlipstick_02-600x600.png`,
    position: 1,
  },
  {
    name: "03 Rebel Pink",
    colorHex: "#f08098",
    imageUrl: `${DM24}/MDV002724_EASY-COLOR-blushlipstick_03-600x600.png`,
    position: 2,
  },
  {
    name: "04 Peach Dreams",
    colorHex: "#c07870",
    imageUrl: `${DM24}/MDV002824_EASY-COLOR-blushlipstick_04-600x600.png`,
    position: 3,
  },
  {
    name: "05 Rose Glow",
    colorHex: "#d880a8",
    imageUrl: `${DM26}/MDV003226_easy-color_05-600x600.png`,
    position: 4,
  },
  {
    name: "06 Pink Glow",
    colorHex: "#d86880",
    imageUrl: `${DM26}/MDV003326_easy-color_06-600x600.png`,
    position: 5,
  },
  {
    name: "07 Peach Glow",
    colorHex: "#d88880",
    imageUrl: `${DM26}/MDV003426_easy-color_07-600x600.png`,
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
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
