/**
 * Add missing Seventeen Matt Plus Foundation shade 00 Light Porcelain.
 * Preserves existing shade barcodes — does NOT delete them.
 * New shade has NO barcode (catalog rule).
 *
 * Product: 12657020-a2fe-4067-bcd3-6d9c08bf3db3
 * Source: myoras.com (00 Light Porcelain pack photo)
 * Usage: npx tsx scripts/add-seventeen-matt-plus-00-shade-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "12657020-a2fe-4067-bcd3-6d9c08bf3db3";

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
};

/** Name from retailers (myoras/brandvip); hex sampled from pack photo. */
const NEW_SHADES: ShadeInput[] = [
  {
    name: "00 Light Porcelain",
    colorHex: "#D5B8A9",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0625/2537/4676/files/Seventeen-MattPlusFoundation00LightPorcelain.png?v=1689164531",
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
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

type ExistingShade = {
  id?: string;
  name: string;
  barcode?: string | null;
  colorHex?: string;
  imageId?: string;
  image?: { id?: string };
  position: number;
  stock?: number;
};

type Product = {
  id: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  images?: Array<{ mediaId?: string; id?: string }>;
  shades?: ExistingShade[];
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function shadeNum(name: string) {
  return parseInt(name.match(/^(\d+)/)?.[1] ?? "999", 10);
}

function productImageIds(product: Product): string[] {
  return (product.images ?? [])
    .map((img) => img.mediaId ?? img.id)
    .filter((id): id is string => Boolean(id));
}

function alreadyHas(existingNames: Set<string>, shadeName: string) {
  if (existingNames.has(normalizeName(shadeName))) return true;
  const num = shadeName.match(/^(\d+)/)?.[1];
  if (!num) return false;
  for (const n of existingNames) {
    if (n === num || n.startsWith(`${num} `)) return true;
  }
  return false;
}

function patchDescriptions(product: Product, totalShades: number) {
  let descriptionAr = product.descriptionAr ?? "";
  let descriptionEn = product.descriptionEn ?? "";

  if (!/00 Light Porcelain|• 00 /.test(descriptionAr)) {
    descriptionAr = descriptionAr
      .replace(/\d+ درجات/, `${totalShades} درجات`)
      .replace(
        "• 01 Light Beige — بيج فاتح\n",
        "• 00 Light Porcelain — بورسلين فاتح جداً\n• 01 Light Beige — بيج فاتح\n",
      );
  }
  if (!/00 Light Porcelain|• 00 /.test(descriptionEn)) {
    descriptionEn = descriptionEn
      .replace(/\d+ official shades/, `${totalShades} official shades`)
      .replace("• 01 Light Beige\n", "• 00 Light Porcelain\n• 01 Light Beige\n");
  }
  return { descriptionAr, descriptionEn };
}

async function main() {
  // Use hex from CLI arg or embedded final value
  const hexArg = process.env.SHADE_HEX;
  if (hexArg) NEW_SHADES[0].colorHex = hexArg;

  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`New shades: ${NEW_SHADES.map((s) => `${s.name} ${s.colorHex}`).join(", ")}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingShades = product.shades ?? [];
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));

  console.log(`Current shades: ${existingShades.length}`);
  const barcodesBefore = existingShades
    .filter((s) => s.barcode)
    .map((s) => `${s.name}=${s.barcode}`);
  console.log(`Existing shade barcodes to preserve (${barcodesBefore.length}):`);
  for (const b of barcodesBefore) console.log(`  ${b}`);
  console.log();

  const toAdd = NEW_SHADES.filter((s) => !alreadyHas(existingNames, s.name));
  if (!toAdd.length) {
    console.log("All requested shades already exist — nothing to add.");
    return;
  }

  console.log("Uploading shade images...");
  const uploaded: Array<{ name: string; colorHex: string; imageId: string }> = [];
  for (const shade of toAdd) {
    const imageId = await uploadImage(shade.imageUrl, `matt-plus-${shade.name}`);
    uploaded.push({ name: shade.name, colorHex: shade.colorHex, imageId });
    console.log(`  ✓ ${shade.name} (${shade.colorHex}) → ${imageId}`);
    await new Promise((r) => setTimeout(r, 800));
  }

  const merged: ExistingShade[] = [
    ...existingShades.map((s) => ({
      ...s,
      imageId: s.imageId ?? s.image?.id,
    })),
    ...uploaded.map((s) => ({
      name: s.name,
      colorHex: s.colorHex,
      imageId: s.imageId,
      position: 0,
      stock: 0,
      barcode: null as string | null,
    })),
  ];

  merged.sort((a, b) => shadeNum(a.name) - shadeNum(b.name));

  const shades = merged.map((s, i) => {
    const row: {
      name: string;
      colorHex: string;
      imageId: string;
      position: number;
      stock: number;
      barcode?: string;
    } = {
      name: s.name,
      colorHex: s.colorHex ?? "#CCCCCC",
      imageId: (s.imageId ?? s.image?.id)!,
      position: i,
      stock: s.stock ?? 0,
    };
    if (s.barcode) row.barcode = s.barcode;
    return row;
  });

  for (const s of shades) {
    if (!s.imageId) throw new Error(`Missing imageId for shade ${s.name}`);
  }

  const imageIds = [...new Set([...productImageIds(product), ...uploaded.map((s) => s.imageId)])];
  const { descriptionAr, descriptionEn } = patchDescriptions(product, shades.length);

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    shades,
    imageIds,
    descriptionAr,
    descriptionEn,
  });

  const after = await api<Product>(`/products/${PRODUCT_ID}`);
  const barcodesAfter = (after.shades ?? [])
    .filter((s) => s.barcode)
    .map((s) => `${s.name}=${s.barcode}`);

  console.log(`\n✓ Updated: ${after.nameEn ?? PRODUCT_ID}`);
  console.log(`  Total shades: ${(after.shades ?? []).length}`);
  console.log(`  Added: ${uploaded.map((s) => s.name).join(", ")}`);
  console.log(`  Barcodes before: ${barcodesBefore.length}`);
  console.log(`  Barcodes after:  ${barcodesAfter.length}`);

  const lost = barcodesBefore.filter((b) => !barcodesAfter.includes(b));
  if (lost.length) {
    console.error(`\n⚠ WARNING — barcodes lost: ${lost.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("\n✓ All existing shade barcodes preserved.");
  }

  for (const s of [...(after.shades ?? [])].sort((a, b) => a.position - b.position)) {
    const mark = uploaded.some((u) => u.name === s.name) ? " ← NEW" : "";
    console.log(
      `  ${String(s.position).padStart(2)} ${s.name.padEnd(22)} ${s.colorHex ?? ""}  ${s.barcode ?? "—"}${mark}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
