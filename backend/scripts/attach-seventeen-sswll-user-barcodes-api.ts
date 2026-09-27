/**
 * Attach user stock barcodes to Seventeen Super Smooth Waterproof Lip Liner shades.
 * Product already has all 28 shades — this only sets barcodes on matching shades.
 * Preserves existing shade barcodes/imageIds; does not delete anything.
 *
 * Product: 0d370aa6-bdcf-4f5d-848f-bd1c74ee36bd
 * Usage: npx tsx scripts/attach-seventeen-sswll-user-barcodes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "0d370aa6-bdcf-4f5d-848f-bd1c74ee36bd";

/** User-provided EANs → official shade names (myoras + epharmadora + cashmere) */
const BARCODE_BY_SHADE: Record<string, string> = {
  "05 Peachy": "5201641689547",
  "07 Light Cranberry": "5201641689561",
  "08 Cranberry": "5201641689578",
  "09 Fuchsia": "5201641689585",
  "10 Tomato": "5201641689592",
  "12 Rosy Plum": "5201641689615",
  "14 Pure Red": "5201641689639",
  "15 Blood Red": "5201641689646",
  "27 Red": "5201641725436",
  "31 Cool Pink": "5201641730164",
  "36 Super Nude": "5201641742341",
};

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

type Shade = {
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
  nameAr?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  images?: Array<{ mediaId?: string; id?: string }>;
  shades?: Shade[];
};

function productImageIds(product: Product): string[] {
  return (product.images ?? [])
    .map((img) => img.mediaId ?? img.id)
    .filter((id): id is string => Boolean(id));
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`Barcodes to attach: ${Object.keys(BARCODE_BY_SHADE).length}\n`);

  await login();
  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existing = [...(product.shades ?? [])].sort((a, b) => a.position - b.position);

  console.log(`Current shades: ${existing.length}`);
  const barcodesBefore = existing.filter((s) => s.barcode).map((s) => `${s.name}=${s.barcode}`);
  console.log(`Existing shade barcodes before: ${barcodesBefore.length || "(none)"}`);

  const byName = new Map(existing.map((s) => [s.name, s]));
  const missingNames: string[] = [];
  for (const name of Object.keys(BARCODE_BY_SHADE)) {
    if (!byName.has(name)) missingNames.push(name);
  }
  if (missingNames.length) {
    throw new Error(`Shades missing on product: ${missingNames.join(", ")}`);
  }

  // Verify all 11 user barcodes will be applied
  const userBarcodes = new Set(Object.values(BARCODE_BY_SHADE));
  console.log(`User barcodes: ${[...userBarcodes].sort().join(", ")}\n`);

  let attached = 0;
  const shades = existing.map((s, i) => {
    const imageId = s.imageId ?? s.image?.id;
    if (!imageId) throw new Error(`Missing imageId for ${s.name}`);
    const mapped = BARCODE_BY_SHADE[s.name];
    const barcode = mapped ?? s.barcode ?? undefined;
    if (mapped && s.barcode && s.barcode !== mapped) {
      console.log(`  ↻ ${s.name}: ${s.barcode} → ${mapped}`);
    } else if (mapped && !s.barcode) {
      console.log(`  + ${s.name} → ${mapped}`);
      attached += 1;
    }
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
      imageId,
      position: i,
      stock: s.stock ?? 0,
    };
    if (barcode) row.barcode = barcode;
    return row;
  });

  // Fix Arabic brand spelling to سفنتيين + keep bilingual copy accurate
  const nameAr =
    "سفنتيين - قلم تحديد شفاه Super Smooth Waterproof ناعم مقاوم للماء بفيتامين E وزيت الجوجوبا 1.14 غ";
  const nameEn =
    "Seventeen Super Smooth Waterproof Lip Liner Pencil with Vitamin E & Jojoba Oil 1.14g";

  let descriptionAr = product.descriptionAr ?? "";
  let descriptionEn = product.descriptionEn ?? "";
  descriptionAr = descriptionAr.replace(/سفنتين/g, "سفنتيين");
  if (!/5201641689547|باركودات التدرجات/.test(descriptionAr)) {
    // light touch — ensure shade count mentioned
    descriptionAr = descriptionAr.replace(/\d+ درجة/, "28 درجة");
  }
  descriptionEn = descriptionEn.replace(/\d+ shades/, "28 shades");

  const imageIds = productImageIds(product);

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    shades,
    imageIds,
  });

  const after = await api<Product>(`/products/${PRODUCT_ID}`);
  const barcodesAfter = (after.shades ?? [])
    .filter((s) => s.barcode)
    .map((s) => `${s.name}=${s.barcode}`);

  console.log(`\n✓ Updated: ${after.nameEn}`);
  console.log(`  nameAr: ${after.nameAr}`);
  console.log(`  Total shades: ${(after.shades ?? []).length}`);
  console.log(`  Newly attached barcodes: ${attached}`);
  console.log(`  Shade barcodes after: ${barcodesAfter.length}`);

  // Verify all user barcodes present
  const afterSet = new Set((after.shades ?? []).map((s) => s.barcode).filter(Boolean));
  const missingBc = [...userBarcodes].filter((b) => !afterSet.has(b));
  if (missingBc.length) {
    console.error(`⚠ Missing barcodes after patch: ${missingBc.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("✓ All 11 user barcodes present on shades.");
  }

  // Preserve any barcodes that existed before (none expected)
  const lost = barcodesBefore.filter((b) => !barcodesAfter.includes(b));
  if (lost.length) {
    console.error(`⚠ Lost previous barcodes: ${lost.join(", ")}`);
    process.exitCode = 1;
  }

  console.log("\nUser barcode mapping:");
  for (const [name, bc] of Object.entries(BARCODE_BY_SHADE)) {
    const s = (after.shades ?? []).find((x) => x.name === name);
    console.log(`  ${bc} → ${name} (${s?.colorHex}) ${s?.barcode === bc ? "OK" : "FAIL"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
