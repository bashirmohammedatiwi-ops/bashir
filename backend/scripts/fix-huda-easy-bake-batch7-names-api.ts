/**
 * Fix GPT naming for Huda Easy Bake batch7 (double dash + curated names).
 * Usage: npx tsx scripts/fix-huda-easy-bake-batch7-names-api.ts
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
    id: "cdc113f4-2090-4673-a4bc-99f5bb9637b2",
    barcode: "6291106032253",
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Sugar Cookie 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Sugar Cookie – 20 g",
  },
  {
    id: "d3cc7c1d-835d-4e7d-b2b4-6eced02144d0",
    barcode: "6291106032260",
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Cupcake 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Cupcake – 20 g",
  },
  {
    id: "24d70b2a-a406-49d9-b8aa-9053bef0d9ee",
    barcode: "6291106032277",
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Pound Cake 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Pound Cake – 20 g",
  },
  {
    id: "06ab693c-b365-4aac-95ef-7173c16de29d",
    barcode: "6294018406501",
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Ube Birthday Cake 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Ube Birthday Cake – 20 g",
  },
  {
    id: "f620ccfd-e2ec-4c26-b1e3-5d591e9142b5",
    barcode: "6294018402725",
    nameAr: "هودا بيوتي – بودرة Easy Bake السائبة Peach Pie 20 غ",
    nameEn: "Huda Beauty Easy Bake Loose Baking & Setting Powder – Peach Pie – 20 g",
  },
  {
    id: "6b63b6b7-01a4-4372-9d28-e396aff079c0",
    barcode: "6294018408550",
    nameAr: "هودا بيوتي – بودرة Easy Bake Duo السائبة Cherry Peach 2×6.5 غ",
    nameEn: "Huda Beauty Easy Bake Duo Loose Baking & Setting Powder – Cherry Peach – 2×6.5 g",
  },
  {
    id: "ac824758-d161-49a4-ba93-34c2c791c940",
    barcode: "6294018408567",
    nameAr: "هودا بيوتي – بودرة Easy Bake Duo السائبة Pink Pumpkin 2×6.5 غ",
    nameEn: "Huda Beauty Easy Bake Duo Loose Baking & Setting Powder – Pink Pumpkin – 2×6.5 g",
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
  if (!res.ok) throw new Error(`Login failed HTTP ${res.status}`);
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
  for (const fix of FIXES) {
    await api(`/products/${fix.id}`, "PATCH", { nameAr: fix.nameAr, nameEn: fix.nameEn });
    console.log(`✓ ${fix.barcode}: ${fix.nameAr}`);
  }
  console.log(`Done — patched ${FIXES.length} products`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
