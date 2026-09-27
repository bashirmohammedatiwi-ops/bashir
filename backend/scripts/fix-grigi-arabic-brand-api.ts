/**
 * Fix Grigi Arabic branding: غريغي → كريجي in nameAr and descriptionAr only.
 * Usage: npx tsx scripts/fix-grigi-arabic-brand-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const GRIGI_BRAND_ID = "0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4";
const WRONG = "غريغي";
const CORRECT = "كريجي";

function fixArabic(text?: string | null): string | undefined {
  if (!text) return text ?? undefined;
  if (!text.includes(WRONG)) return text;
  return text.replaceAll(WRONG, CORRECT);
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

type ProductRow = {
  id: string;
  nameAr?: string;
  descriptionAr?: string;
  barcode?: string;
};

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
  await login();
  console.log("Logged in.\n");

  const products = await fetchAllGrigiProducts();
  console.log(`Grigi products: ${products.length}\n`);

  let fixed = 0;
  let skipped = 0;
  for (const p of products) {
    const existingFull = await api<{ nameAr?: string; descriptionAr?: string; nameEn?: string; descriptionEn?: string }>(
      `/products/${p.id}`,
    );
    const nameAr = fixArabic(existingFull.nameAr ?? p.nameAr);
    const descriptionAr = fixArabic(existingFull.descriptionAr ?? p.descriptionAr);
    const changed = nameAr !== existingFull.nameAr || descriptionAr !== existingFull.descriptionAr;
    if (!changed) {
      skipped += 1;
      continue;
    }

    await api(`/products/${p.id}`, "PATCH", {
      ...(nameAr !== existingFull.nameAr ? { nameAr } : {}),
      ...(descriptionAr !== existingFull.descriptionAr ? { descriptionAr } : {}),
      // API clears nameEn/descriptionEn on partial name/description patch — preserve them.
      ...(existingFull.nameEn ? { nameEn: existingFull.nameEn } : {}),
      ...(existingFull.descriptionEn ? { descriptionEn: existingFull.descriptionEn } : {}),
    });
    console.log(`✓ ${p.barcode ?? p.id}`);
    if (nameAr !== p.nameAr) console.log(`  name: ${nameAr}`);
    fixed += 1;
  }

  console.log(`\nDone — fixed: ${fixed} | unchanged: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
