/**
 * Fix GPT naming issues for Huda batch18 products.
 * Usage: npx tsx scripts/fix-huda-batch18-names-api.ts
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
    id: "140c234e-b912-4f76-9b78-051eea8125f0",
    barcode: "6294018406167",
    nameAr: "هودا بيوتي – مجموعة Habibti Face & Lip Set رمضان",
    nameEn: "Huda Beauty Habibti Face & Lip Set – Ramadan Kit",
  },
  {
    id: "26a37e71-2135-40e1-bd4d-50ed0741f8e8",
    barcode: "6291107572321",
    nameAr: "هودا بيوتي – آيلاينر سائل Life Liner Quick 'N Easy Mini 0.55 مل",
    nameEn: "Huda Beauty Life Liner Quick 'N Easy Mini Liquid Eyeliner – 0.55 ml",
  },
  {
    id: "87c5b0ca-166d-4784-92df-c06629a89179",
    barcode: "6294018409069",
    nameAr: "هودا بيوتي – مجموعة Habibti Lip & Cheek Best Sellers Bronze Nudes",
    nameEn: "Huda Beauty Habibti Lip & Cheek Best Sellers Kit – Bronze Nudes",
  },
  {
    id: "cc0af204-60c6-4fe5-90f1-0354799b35b4",
    barcode: "6291106036497",
    nameAr: "هودا بيوتي – مجموعة Nude Medium Makeup Gift Set",
    nameEn: "Huda Beauty Nude Medium Makeup Gift Set – 2 Pieces",
  },
  {
    id: "2b822f91-be82-46b5-a130-5272683720a8",
    barcode: "6291106034905",
    nameAr: "هودا بيوتي – رذاذ Glow Coco Hydrating Mist 80 مل",
    nameEn: "Huda Beauty Glow Coco Hydrating Mist – 80 ml",
  },
  {
    id: "ab21b26d-a08c-4d84-ba3f-3824904e099c",
    barcode: "6291106039535",
    nameAr: "هودا بيوتي – مجموعة Get The Look Kit عيون",
    nameEn: "Huda Beauty Get The Look Kit – Eye Set",
  },
  {
    id: "9ab0dfcb-1b4a-4f4d-8d30-125ef6c3d010",
    barcode: "6291106031294",
    nameAr: "هودا بيوتي – باليت هايلايتر Summer Solstice 3D 31.5 غرام",
    nameEn: "Huda Beauty Summer Solstice 3D Highlighter Palette – 31.5 g",
  },
  {
    id: "9f7a5baf-fab8-4adc-a354-746c6bfd7c01",
    barcode: "6291106036442",
    nameAr: "هودا بيوتي – باليت ظلال Naughty Nude Eyeshadow Palette",
    nameEn: "Huda Beauty Naughty Nude Eyeshadow Palette",
  },
  {
    id: "17602b61-375f-45b2-95c6-20643041e29b",
    barcode: "6291106038354",
    nameAr: "هودا بيوتي – باليت ظلال Rose Quartz Eyeshadow Palette",
    nameEn: "Huda Beauty Rose Quartz Eyeshadow Palette",
  },
  {
    id: "5d63db56-f136-4709-9e1e-0cf20ef31ba0",
    barcode: "6291107573458",
    nameAr: "هودا بيوتي – باليت ظلال Empowered Eyeshadow Palette",
    nameEn: "Huda Beauty Empowered Eyeshadow Palette",
  },
  {
    id: "15072248-e552-4796-b158-e358a98df1f3",
    barcode: "6294018403302",
    nameAr: "هودا بيوتي – فاونديشن #FauxFilter Luminous Matte Milkshake 100B 35 مل",
    nameEn: "Huda Beauty #FauxFilter Luminous Matte Foundation – Milkshake 100B – 35 ml",
  },
  {
    id: "e6baffe9-6af0-4e73-aff5-d97a5043a309",
    barcode: "6294018401797",
    nameAr: "هودا بيوتي – ماسكرا 1 Coat Wow! 9 مل",
    nameEn: "Huda Beauty 1 Coat Wow! Mascara – 9 ml",
  },
  {
    id: "b2199b22-ad31-4f59-be1c-ec5631795fc7",
    barcode: "6291106037227",
    nameAr: "هودا بيوتي – بودرة Baby Bake Loose Banana Bread حجم سفر 6.5 غرام",
    nameEn: "Huda Beauty Baby Bake Loose Powder – Banana Bread Travel Size – 6.5 g",
  },
  {
    id: "06e4ff29-0888-4377-94df-c020211628e9",
    barcode: "6291106034509",
    nameAr: "هودا بيوتي – هايلايتر سائل N.Y.M.P.H. Aphrodite 15 مل",
    nameEn: "Huda Beauty N.Y.M.P.H. All Over Highlighter – Aphrodite – 15 ml",
  },
  {
    id: "cde974e5-07f6-4393-bead-0cef025326c5",
    barcode: "6291106034493",
    nameAr: "هودا بيوتي – هايلايتر سائل N.Y.M.P.H. Aphrodite 55 مل",
    nameEn: "Huda Beauty N.Y.M.P.H. All Over Highlighter – Aphrodite – 55 ml",
  },
  {
    id: "590080d2-19c9-4dd6-bf0e-6953bf508244",
    barcode: "6291107573038",
    nameAr: "هودا بيوتي – بلاشر بودرة GloWish Cheeky Vegan Milky Rose 2.2 غرام",
    nameEn: "Huda Beauty GloWish Cheeky Vegan Blush Powder – Milky Rose – 2.2 g",
  },
  {
    id: "61a3593c-e8ed-46e6-905a-12b9561e1686",
    barcode: "6291106038521",
    nameAr: "هودا بيوتي – بلاشر بودرة GloWish Cheeky Vegan Caring Coral 02 2.2 غرام",
    nameEn: "Huda Beauty GloWish Cheeky Vegan Blush Powder – Caring Coral 02 – 2.2 g",
  },
  {
    id: "6f2841c3-5642-4495-8ede-9fe11c754a9c",
    barcode: "6291106031843",
    nameAr: "هودا بيوتي – فرشاة وجه Face Buff & Blend Complexion Brush",
    nameEn: "Huda Beauty Face Buff & Blend Complexion Brush",
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
    await api(`/products/${fix.id}`, "PATCH", {
      nameAr: fix.nameAr,
      nameEn: fix.nameEn,
    });
    console.log(`✓ ${fix.barcode}: ${fix.nameAr}`);
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`Done — ${FIXES.length} names updated`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
