/**
 * Add accurate EAN barcodes to all Grigi Only Matte Long Stay Power shades.
 * Pattern: 520704216 + 3-digit shade number + EAN-13 check digit.
 * Verified: 01→5207042160012, 12→5207042160128, 19→5207042160197, 46→5207042160463, 49→5207042160494
 * Usage: npx tsx scripts/fix-grigi-only-matte-long-stay-shade-barcodes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "c82948b9-b193-4a4b-bfe6-8d8e895cfa36";
const PREFIX = "520704216";

function ean13CheckDigit(base12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(base12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

function shadeBarcode(shadeNum: number): string {
  const base12 = `${PREFIX}${String(shadeNum).padStart(3, "0")}`;
  return base12 + ean13CheckDigit(base12);
}

function shadeNumber(name: string): number {
  const n = parseInt(name.match(/^(\d+)/)?.[1] ?? "", 10);
  if (!n) throw new Error(`Cannot parse shade number from: ${name}`);
  return n;
}

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

type ExistingShade = {
  name: string;
  barcode?: string;
  colorHex?: string;
  imageId?: string;
  position: number;
  stock?: number;
};

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<{
    id: string;
    nameEn?: string;
    barcode?: string;
    imageIds?: string[];
    shades?: ExistingShade[];
  }>(`/products/${PRODUCT_ID}`);

  const existing = [...(product.shades ?? [])].sort((a, b) => a.position - b.position);
  if (!existing.length) throw new Error("No shades found");

  const barcodes = existing.map((s) => shadeBarcode(shadeNumber(s.name)));
  if (new Set(barcodes).size !== barcodes.length) {
    throw new Error("Duplicate barcodes detected — aborting");
  }

  const shades = existing.map((s, i) => {
    const num = shadeNumber(s.name);
    const barcode = shadeBarcode(num);
    return {
      name: s.name,
      barcode,
      colorHex: s.colorHex,
      imageId: s.imageId,
      position: i,
      stock: s.stock ?? 0,
    };
  });

  const productBarcode = shadeBarcode(1);
  if (product.barcode !== productBarcode) {
    console.log(`Note: product barcode is ${product.barcode ?? "?"} (shade 01 = ${productBarcode})\n`);
  }

  console.log(`Updating ${shades.length} shade barcodes...\n`);
  for (const s of shades) {
    const prev = existing.find((e) => e.name === s.name)?.barcode;
    const mark = prev === s.barcode ? "=" : prev ? "↻" : "+";
    console.log(`  ${mark} ${s.name} → ${s.barcode}`);
  }

  await api(`/products/${PRODUCT_ID}`, "PATCH", { shades });

  const verify = await api<{ shades?: ExistingShade[] }>(`/products/${PRODUCT_ID}`);
  const missing = (verify.shades ?? []).filter((s) => !s.barcode);
  if (missing.length) throw new Error(`${missing.length} shades still missing barcodes`);

  console.log(`\n✓ ${product.nameEn ?? PRODUCT_ID}`);
  console.log(`  Shades with barcodes: ${verify.shades?.length ?? 0}/${shades.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
