/**
 * Avon Anew Platinum Instant Eye Smoother — single product, no shades, no images.
 * Barcode: 5050136192266 (verified via GPT Luna + GravAr/Amazon listings)
 * Usage: npx tsx scripts/add-avon-anew-platinum-instant-eye-smoother-api.ts
 */
const API = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const PASS = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const FACE = "07661898-571a-4a88-aa6c-76dcdbf53029";
const EYE = "09bedca5-0c6c-4a71-9b03-4bf29cecaf53";

const PRODUCT = {
  barcode: "5050136192266",
  slug: "avon-anew-platinum-instant-eye-smoother-15ml",
  sku: "AVN-192266",
  price: 22000,
  originalPrice: 25000,
  nameAr: "أفون أنيو بلاتينيوم – جل فوري لتنعيم وشد محيط العين Instant Eye Smoother 15 مل",
  nameEn: "Avon Anew Platinum Instant Eye Smoother – 15 ml",
  descriptionAr:
    "جل أفون أنيو بلاتينيوم Instant Eye Smoother — عناية فورية لمحيط العين بتركيبة جل خفيفة تشكّل طبقة غير مرئية تشدّ البشرة وتنعّمها خلال ثوانٍ.\n\n" +
    "• يقلّل مظهر أكياس تحت العين والانتفاخ والتجاعيد وخطوط قدم الغراب.\n" +
    "• تأثير شد فوري يدوم طوال اليوم (حتى نحو 8 ساعات حسب الشركة).\n" +
    "• يرطّب محيط العين ويمنح مظهراً أكثر يقظة ونضارة.\n" +
    "• مناسب لجميع أنواع البشرة والأعمار.\n" +
    "• طريقة الاستخدام: ضعي كمية قليلة حول العين واتركيها حتى تشعري بشد خفيف ثم جفّفيها؛ يمكن وضع المكياج بعدها.\n" +
    "• الحجم: 15 مل — أنبوبة واحدة تكفي نحو 120 استخداماً.",
  descriptionEn:
    "Avon Anew Platinum Instant Eye Smoother — a light gel that forms an invisible film to instantly firm and smooth the eye area within seconds.\n\n" +
    "• Helps reduce the look of under-eye bags, puffiness, wrinkles and crow’s feet.\n" +
    "• Instant lifting/smoothing effect that lasts throughout the day (up to about 8 hours per brand claims).\n" +
    "• Moisturizes the eye area for a more awake, radiant look.\n" +
    "• Suitable for all skin types and ages.\n" +
    "• How to use: apply a small amount around the eyes, wait for a slight tightening feel, then let dry; makeup can follow.\n" +
    "• Size: 15 ml — one tube is enough for about 120 applications.",
};

let token = "";

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
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
  const login = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const lj = await login.json();
  token = lj.data?.accessToken ?? lj.accessToken;
  if (!token) throw new Error("Login failed");

  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists && check.product?.id) {
    await api(`/products/${check.product.id}`, "DELETE");
    console.log(`deleted: ${check.product.nameAr ?? check.product.id}`);
  }

  const brand = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "أفون",
    brandEn: "Avon",
    createIfMissing: true,
  });

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId: brand.brand?.id,
    categoryId: CARE,
    subcategoryId: FACE,
    subcategoryIds: [FACE],
    tertiaryCategoryId: EYE,
    tertiaryCategoryIds: [EYE],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds: [],
  });

  const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
  console.log(`✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  console.log(`  Images: placeholder only (${verify.images?.length ?? 0})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
