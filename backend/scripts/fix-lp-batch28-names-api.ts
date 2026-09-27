/**
 * Fix Arabic name typos on LP batch28 products.
 * Usage: npx tsx scripts/fix-lp-batch28-names-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BR = "\u0644\u0648\u0631\u064A\u0627\u0644 \u0628\u0631\u0648\u0641\u0634\u0646\u0627\u0644 \u0633\u064A\u0631 \u0625\u0643\u0633\u0628\u064A\u0631\u062A";
const MASK = "\u0642\u0646\u0627\u0639";
const SH = "\u0634\u0627\u0645\u0628\u0648";

const FIXES: Record<string, string> = {
  "3474636975297": `${BR} - ${MASK} Inforcer \u0636\u062F \u0627\u0644\u062A\u0642\u0635\u0641 250 \u0645\u0644`,
  "3474636976072": `${BR} - ${MASK} Pro Longer \u0644\u0644\u0634\u0639\u0631 \u0627\u0644\u0637\u0648\u064A\u0644 250 \u0645\u0644`,
  "3474637069162": `${BR} - ${MASK} Curl Expression 500 \u0645\u0644`,
  "3474636975396": `${BR} - ${MASK} Pro Longer 500 \u0645\u0644`,
  "3474636975679": `${BR} - ${MASK} Vitamino Color 500 \u0645\u0644`,
  "3474637268510": `${BR} - ${SH} Vitamino Color Spectrum 300 \u0645\u0644`,
  "3474637268381": `${BR} - ${SH} Vitamino Color Spectrum Purple 300 \u0645\u0644`,
  "3474636975952": `${BR} - ${SH} Vitamino Color 500 \u0645\u0644`,
  "3474636975921": `${BR} - ${SH} Absolut Repair 500 \u0645\u0644`,
};

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string } };
  token = json.data?.accessToken ?? "";
}

async function main() {
  await login();
  for (const [barcode, nameAr] of Object.entries(FIXES)) {
    const check = await fetch(`${API_BASE}/products/barcode-check?barcode=${barcode}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    const payload = (check as { data?: { product?: { id: string } } }).data ?? check;
    const id = payload.product?.id;
    if (!id) {
      console.log(`${barcode}: not found`);
      continue;
    }
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ nameAr }),
    });
    if (!res.ok) {
      console.log(`${barcode}: PATCH failed ${res.status}`);
      continue;
    }
    console.log(`✓ ${barcode}: ${nameAr}`);
  }
}

main().catch(console.error);
