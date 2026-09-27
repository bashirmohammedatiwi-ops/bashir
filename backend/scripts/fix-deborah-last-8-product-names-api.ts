/**
 * Fix English + Arabic names for the last 8 Deborah products (nameEn was null on API).
 * Usage: npx tsx scripts/fix-deborah-last-8-product-names-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

/** Arabic: Iraqi-market type + official English line name. English: global Deborah Milano format. */
const PRODUCTS = [
  {
    id: "f3b86247-ad18-47cb-8639-61ea5ff2651a",
    barcode: "8009518459470",
    nameAr: "ديبورا ميلانو - فاونديشن Skin Booster Mat",
    nameEn: "Deborah Milano - Skin Booster Mat Foundation",
  },
  {
    id: "d5269b0b-c949-4a6f-9012-622ecb5ab237",
    barcode: "8009518414394",
    nameAr: "ديبورا ميلانو - فاونديشن Skin Booster Serum",
    nameEn: "Deborah Milano - Skin Booster Serum Foundation",
  },
  {
    id: "a5c18f00-0975-4637-9a23-efe4a7e57163",
    barcode: "8009518415421",
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume With Ceramides Black",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara With Ceramides Black",
  },
  {
    id: "bd681587-4b1c-4fe6-a259-3375c395b214",
    barcode: "8009518475098",
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume With Ceramides Chocolate Brown",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara With Ceramides Chocolate Brown",
  },
  {
    id: "8a9f10b8-8298-4838-9a2a-9a6623908379",
    barcode: "8009518475074",
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume With Ceramides Electric Blue",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara With Ceramides Electric Blue",
  },
  {
    id: "73fd83b3-a7ab-494c-b9b3-44dbcc72cfda",
    barcode: "8009518468625",
    nameAr: "ديبورا ميلانو - ماسكارا Extraordinary 5-in-1 Blue Navy",
    nameEn: "Deborah Milano - Extraordinary 5-in-1 Mascara Blue Navy",
  },
  {
    id: "ad69b826-69a3-4ee0-b1f4-45729a545d9d",
    barcode: "8009518207989",
    nameAr: "ديبورا ميلانو - ماسكارا Extraordinary 5-in-1 Black",
    nameEn: "Deborah Milano - Extraordinary 5-in-1 Mascara Black",
  },
  {
    id: "c02a6b95-19a8-4fbf-9f85-862170e0c6de",
    barcode: "8009518374148",
    nameAr: "ديبورا ميلانو - ماسكارا 24Ore Instant Maxi Volume Pomegranate Oil & Keratin Black",
    nameEn: "Deborah Milano - 24Ore Instant Maxi Volume Mascara Pomegranate Oil & Keratin Black",
  },
] as const;

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

async function main() {
  await login();
  console.log(`API: ${API_BASE}\n`);

  for (const p of PRODUCTS) {
    const current = await api<{ nameAr?: string; nameEn?: string }>(`/products/${p.id}`);
    const needsPatch = current.nameAr !== p.nameAr || current.nameEn !== p.nameEn;
    if (!needsPatch) {
      console.log(`skip ${p.barcode} — already correct`);
      continue;
    }

    await api(`/products/${p.id}`, "PATCH", {
      nameAr: p.nameAr,
      nameEn: p.nameEn,
    });

    console.log(`✓ ${p.barcode}`);
    console.log(`  AR: ${p.nameAr}`);
    console.log(`  EN: ${p.nameEn}\n`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
