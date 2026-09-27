/**
 * Fix duplicate-brand Arabic names from GPT for mixed batch32.
 * Usage: npx tsx scripts/fix-mixed-batch32-names-api.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

function loadEnvFile(): void {
  const envPath = join(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile();

const FIXES: Array<{ id: string; barcode: string; nameAr: string; nameEn: string }> = [
  {
    id: "8ceb0e6a-a628-4dfe-a705-301f558c3b77",
    barcode: "8697711700231",
    nameAr: "بايو بالانس – كريم إزالة علامات التمدد 60 مل",
    nameEn: "Bio Balance Stretch Mark Remover Cream – 60 ml",
  },
  {
    id: "0cfd708d-9e9f-4fd7-8465-bd6c101722da",
    barcode: "8697711700187",
    nameAr: "بايو بالانس – شامبو الألوفيرا العضوي 330 مل",
    nameEn: "Bio Balance Organic Aloe Vera Shampoo – 330 ml",
  },
  {
    id: "9d850b09-db96-4f60-b8ff-d168c2541d12",
    barcode: "8697711700163",
    nameAr: "بايو بالانس – شامبو الرمان العضوي 330 مل",
    nameEn: "Bio Balance Organic Pomegranate Shampoo – 330 ml",
  },
  {
    id: "c53b3851-828f-4bfc-9705-1934d70e4056",
    barcode: "8858842011676",
    nameAr: "كاثي دول – كريم L-Glutathione Magic SPF50 60 مل",
    nameEn: "Cathy Doll L-Glutathione Magic Cream SPF50 – 60 ml",
  },
];

let token = "";

async function login(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string };
  if (!res.ok) throw new Error("Login failed");
  token = json.data?.accessToken ?? json.accessToken ?? "";
}

async function patchProduct(id: string, body: { nameAr: string; nameEn: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { message?: string }).message ?? res.statusText);
  }
}

async function main() {
  await login();
  for (const fix of FIXES) {
    console.log(`PATCH ${fix.barcode}`);
    await patchProduct(fix.id, { nameAr: fix.nameAr, nameEn: fix.nameEn });
    console.log(`  ✓ ${fix.nameAr}`);
  }
  console.log(`Done — ${FIXES.length} names fixed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
