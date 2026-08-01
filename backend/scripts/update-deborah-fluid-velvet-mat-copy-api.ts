/**
 * Fix Deborah brand Arabic name to ديبورا + update product copy.
 * Usage: npx tsx scripts/update-deborah-fluid-velvet-mat-copy-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "a1a5557b-d628-46b0-b4be-9f98ae1b80e7";
const BRAND_ID = "03bf1748-150d-47b0-9ffc-8aa13f1142d0";

const COPY = {
  nameAr: "ديبورا ميلانو - أحمر شفاه سائل مخملي مطفي فيلفيت مات",
  nameEn: "Deborah Milano - Fluid Velvet Mat Liquid Lipstick",
  descriptionAr:
    "فيلفيت مات من ديبورا ميلانو — أحمر شفاه سائل عالي الأداء يمنح لوناً غنياً بلمسة مطفية مخملية، مع راحة فائقة وثبات يدوم طوال اليوم.\n\n" +
    "• تركيبة سائلة مطفية فائقة النعومة، بلون نقي ومتجانس.\n" +
    "• مقاوم للانتقال والتلطّخ — ثبات يصل إلى 18 ساعة.\n" +
    "• أداة تطبيق مخملية خاصة توزّع اللون وتحدّد محيط الشفاه بدقة.\n" +
    "• بوليمرات تشكّل طبقة خفيفة ملتصقة؛ صبغات مصغّرة تمنح لوناً كثيفاً موحّداً.\n" +
    "• زيوت مغذّية تُبقي الشفاه مرطبة وناعمة ومخملية.\n" +
    "• 16 درجة متنوعة: من النود الطبيعي إلى الأحمر الجريء والخمري.\n" +
    "• خالي من البارابين — حجم 4.5 غ.\n" +
    "• مناسب للبشرة الحساسة — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Fluid Velvet Mat Liquid Lipstick — a high-performance liquid matte lipstick that delivers rich colour with a sophisticated velvet-matte finish and exceptional comfort.\n\n" +
    "• Supremely soft liquid matte formula with pure, even colour payoff.\n" +
    "• Transfer-proof, smudge-resistant wear tested up to 18 hours.\n" +
    "• Special flocked applicator colours and defines lips precisely in one swipe.\n" +
    "• Film-forming polymers create a lightweight adherent layer; micronized pigments deliver intense, homogeneous colour.\n" +
    "• Nourishing oils keep lips hydrated, soft and velvety.\n" +
    "• 16 shades from natural nudes to bold reds and wine tones.\n" +
    "• Paraben-free — 4.5 g — hypoallergenic.\n" +
    "• Dermatologist tested.",
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

async function main() {
  await login();
  console.log("Logged in.\n");

  const brandBefore = await api<{ name?: string }>(`/brands/${BRAND_ID}`);
  console.log(`Brand before: ${brandBefore.name}`);

  const brand = await api<{ name?: string }>(`/brands/${BRAND_ID}`, "PATCH", { name: "ديبورا" });
  console.log(`Brand after:  ${brand.name}\n`);

  const before = await api<{ nameAr?: string; nameEn?: string }>(`/products/${PRODUCT_ID}`);
  console.log(`Product before: ${before.nameAr}`);

  const updated = await api<{ nameAr?: string; nameEn?: string }>(`/products/${PRODUCT_ID}`, "PATCH", COPY);
  console.log(`Product after:  ${updated.nameAr}`);
  console.log("\n✓ Updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
