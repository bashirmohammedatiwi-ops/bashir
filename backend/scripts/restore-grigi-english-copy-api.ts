/**
 * Restore Grigi nameEn + descriptionEn wiped by partial PATCH (fix-grigi-arabic-brand-api).
 * Source: add-grigi-*.ts scripts (original English copy).
 * Usage: npx tsx scripts/restore-grigi-english-copy-api.ts
 */
import fs from "node:fs";
import path from "node:path";

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const GRIGI_BRAND_ID = "0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4";

type Copy = { nameEn: string; descriptionEn: string };

function extractFromFile(filePath: string): Map<string, Copy> {
  const map = new Map<string, Copy>();
  const src = fs.readFileSync(filePath, "utf8");

  // Single PRODUCT = { barcode, nameEn, descriptionEn }
  const productMatch = src.match(
    /const PRODUCT\s*=\s*\{[\s\S]*?barcode:\s*"(\d{13})"[\s\S]*?nameEn:\s*"([^"]+)"[\s\S]*?descriptionEn:\s*\n?\s*([\s\S]*?),\s*\n\};/,
  );
  if (productMatch) {
    const [, barcode, nameEn, descBlock] = productMatch;
    const descriptionEn = evalDesc(descBlock);
    if (descriptionEn) map.set(barcode, { nameEn, descriptionEn });
  }

  // PRODUCTS array entries
  const entryRe =
    /barcode:\s*"(\d{13})"[\s\S]*?nameEn:\s*"([^"]+)"[\s\S]*?descriptionEn:\s*\n?\s*([\s\S]*?)(?=,\s*\n\s*(?:categoryId|barcode:|}\s*,\s*\{|\];))/g;
  for (const m of src.matchAll(entryRe)) {
    const [, barcode, nameEn, descBlock] = m;
    const descriptionEn = evalDesc(descBlock);
    if (descriptionEn) map.set(barcode, { nameEn, descriptionEn });
  }

  return map;
}

function evalDesc(block: string): string {
  const trimmed = block.trim();
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed.replace(/\n\s*\+\s*"/g, "").replace(/"\s*\+/g, ""));
    } catch {
      // fall through
    }
  }
  const parts = [...trimmed.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  if (parts.length) return parts.join("");
  return trimmed.replace(/^\(|\)[,;]?$/g, "").replace(/^"|"$/g, "");
}

function loadAllCopy(): Map<string, Copy> {
  const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  const files = fs.readdirSync(dir).filter((f) => f.startsWith("add-grigi") && f.endsWith(".ts"));
  const merged = new Map<string, Copy>();
  for (const f of files) {
    for (const [k, v] of extractFromFile(path.join(dir, f))) merged.set(k, v);
  }
  return merged;
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

type ProductRow = { id: string; barcode?: string; nameEn?: string; descriptionEn?: string };

async function fetchAllGrigiProducts(): Promise<ProductRow[]> {
  const rows: ProductRow[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await api<{ data?: ProductRow[]; meta?: { totalPages?: number } } | ProductRow[]>(
      `/products?brandId=${GRIGI_BRAND_ID}&status=all&limit=100&page=${page}`,
    );
    const batch = Array.isArray(result) ? result : (result.data ?? []);
    rows.push(...batch);
    const totalPages = Array.isArray(result) ? 1 : (result.meta?.totalPages ?? 1);
    if (page >= totalPages || !batch.length) break;
  }
  return rows;
}

async function main() {
  const copyByBarcode = loadAllCopy();
  console.log(`Loaded English copy for ${copyByBarcode.size} products from scripts.\n`);

  await login();
  const products = await fetchAllGrigiProducts();
  console.log(`Grigi products in API: ${products.length}\n`);

  let restored = 0;
  let missing = 0;
  for (const p of products) {
    const bc = p.barcode ?? "";
    const copy = copyByBarcode.get(bc);
    if (!copy) {
      console.log(`? no script copy for ${bc}`);
      missing += 1;
      continue;
    }
    if (p.nameEn === copy.nameEn && p.descriptionEn === copy.descriptionEn) {
      continue;
    }

    await api(`/products/${p.id}`, "PATCH", {
      nameEn: copy.nameEn,
      descriptionEn: copy.descriptionEn,
    });
    console.log(`✓ ${bc}`);
    console.log(`  EN: ${copy.nameEn}`);
    restored += 1;
  }

  console.log(`\nDone — restored: ${restored} | no script copy: ${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
