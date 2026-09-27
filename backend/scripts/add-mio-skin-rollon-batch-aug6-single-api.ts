/**
 * MIO SKIN Whitening Roll-On batch – 13 separate SKUs (NO shades, NO images).
 * Usage: npx tsx scripts/add-mio-skin-rollon-batch-aug6-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CARE = "9f99dbf3-15c4-4561-8f53-1499a8743a47";
const BODY = "23aaaa07-91ee-4937-847e-d7866a9e937a";
const DEODORANT = "9464c921-9650-421f-8e2b-6a172f7524c5";

type BrandKey = "mioskin";

type ProductDef = {
  barcode: string;
  brandKey: BrandKey;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

const BRANDS: Record<BrandKey, { brandAr: string; brandEn: string; prefix: string }> = {
  mioskin: { brandAr: "ميو سكين", brandEn: "MIO SKIN", prefix: "MIO" },
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5287002943060",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق آيلاند سبيريت 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Island Spirit 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر آيلاند سبيريت لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Island Spirit scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943015",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق بلووم بيري 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Bloom Berry 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر بلووم بيري لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Bloom Berry scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943039",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق برايت داون 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Bright Dawn 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر برايت داون لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Bright Dawn scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943046",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق كوكو دريمز 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Coco Dreams 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر كوكو دريمز لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Coco Dreams scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943121",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق وايلد غرين 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Wild Green 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر وايلد غرين لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Wild Green scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943084",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق بلوسوم تشيك 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Blossom Chic 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر بلوسوم تشيك لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Blossom Chic scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943053",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق بلو أوشن 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Blue Ocean 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر بلو أوشن لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Blue Ocean scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943077",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق خالي من العطر 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Fragrance Free 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• خالي من العطر مناسب للبشرة الحساسة أو من تفضل بدون عطر إضافي.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Fragrance-free formula for sensitive skin or when you prefer no added scent.",
  },
  {
    barcode: "5287002943091",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق عود فيوشن 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Oud Fusion 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر عود فيوشن لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Oud Fusion scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943107",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق روز فانيلا 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Rose Vanilla 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر روز فانيلا لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Rose Vanilla scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943138",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق ستورمي ديزاير 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Stormy Desire 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر ستورمي ديزاير لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Stormy Desire scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943145",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق سترونغ باودري 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Strong Powdery 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر سترونغ باودري لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Strong Powdery scent for a fresh, confident feel.",
  },
  {
    barcode: "5287002943152",
    brandKey: "mioskin",
    price: 10000,
    originalPrice: 11500,
    categoryId: CARE,
    subcategoryId: BODY,
    tertiaryCategoryId: DEODORANT,
    nameAr: "ميو سكين رول أون مبيض مضاد تعرق وايلد ليك 60 مل",
    nameEn: "MIO SKIN - Whitening Roll-On Deodorant Wild Lake 60ml",
    descriptionAr: "ميو سكين رول أون مبيض مضاد تعرق بتركيبة كريم مرطب للعناية اليومية تحت الإبط.\n• حماية مضادة للتعرق تصل إلى 24 ساعة من العرق والرائحة.\n• كريم مرطب يريح البشرة؛ مع الاستخدام المنتظم يساعد على تفتيح وتنعيم لون تحت الإبط.\n• يُطبّق على تحت الإبط نظيف وجاف ويُترك ليجف قبل اللبس.\n• عطر وايلد ليك لإحساس منعش وثقة طوال اليوم.",
    descriptionEn: "MIO SKIN Whitening Roll-On Deodorant / Antiperspirant with a moisturizing cream formula for daily underarm care.\n• Up to 24-hour antiperspirant protection against sweat and odour.\n• Moisturizing cream texture helps comfort skin; with regular use may help brighten and even underarm tone.\n• Apply to clean, dry underarms; allow to dry before dressing.\n• Wild Lake scent for a fresh, confident feel.",
  },
];

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

async function resolveBrandId(key: BrandKey): Promise<string> {
  const b = BRANDS[key];
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: b.brandAr,
    brandEn: b.brandEn,
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error(`Brand resolve failed: ${b.brandEn}`);
  console.log(`Brand: ${b.brandEn} / ${b.brandAr} (${resolved.brand.id})${resolved.created ? " [created]" : ""}`);
  return resolved.brand.id;
}

async function deleteIfExists(barcode: string): Promise<void> {
  const check = await api<{ exists: boolean; product?: { id: string; nameEn?: string } }>(
    `/products/barcode-check?barcode=${encodeURIComponent(barcode)}`,
  );
  if (!check.exists || !check.product?.id) return;
  console.log(`  deleting existing: ${check.product.id} (${check.product.nameEn ?? ""})`);
  await api(`/products/${check.product.id}`, "DELETE");
}

function slugify(nameEn: string, barcode: string): string {
  const base = nameEn
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${barcode.slice(-6)}`;
}

async function createProduct(product: ProductDef, brandId: string): Promise<{ id: string }> {
  const brand = BRANDS[product.brandKey];
  const payload: Record<string, unknown> = {
    sku: `${brand.prefix}-${product.barcode.slice(-6)}`,
    barcode: product.barcode,
    slug: slugify(product.nameEn, product.barcode),
    brandId,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    subcategoryIds: [product.subcategoryId],
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price,
    originalPrice: product.originalPrice ?? product.price,
    stock: 0,
    isActive: true,
    imageIds: [] as string[],
  };
  if (product.tertiaryCategoryId) {
    payload.tertiaryCategoryId = product.tertiaryCategoryId;
    payload.tertiaryCategoryIds = [product.tertiaryCategoryId];
  }
  return api<{ id: string }>("/products", "POST", payload);
}

async function processProduct(
  product: ProductDef,
  brandId: string,
): Promise<{ barcode: string; id: string; nameEn: string }> {
  await deleteIfExists(product.barcode);
  const created = await createProduct(product, brandId);
  const verify = await api<{ shades?: unknown[] }>(`/products/${created.id}`);
  if ((verify.shades?.length ?? 0) > 0) throw new Error(`Product ${product.barcode} unexpectedly has shades`);
  return { barcode: product.barcode, id: created.id, nameEn: product.nameEn };
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} separate SKUs (no shades, no images)\n`);
  await login();
  console.log("Logged in.\n");

  const needed = new Set(PRODUCTS.map((p) => p.brandKey));
  const brandIds: Partial<Record<BrandKey, string>> = {};
  for (const key of needed) brandIds[key] = await resolveBrandId(key);
  console.log("");

  const results: Array<{ barcode: string; id: string; nameEn: string }> = [];
  const failures: Array<{ barcode: string; error: string }> = [];

  for (const product of PRODUCTS) {
    const brandId = brandIds[product.brandKey]!;
    console.log(`--- ${product.barcode} | ${product.nameEn} ---`);
    try {
      const result = await processProduct(product, brandId);
      console.log(`  ✓ ID ${result.id} | ${product.price} IQD\n`);
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ FAILED: ${msg} — retrying once...`);
      try {
        await new Promise((r) => setTimeout(r, 800));
        const result = await processProduct(product, brandId);
        console.log(`  ✓ RETRY OK ID ${result.id} | ${product.price} IQD\n`);
        results.push(result);
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        console.log(`  ✗ RETRY FAILED: ${retryMsg}\n`);
        failures.push({ barcode: product.barcode, error: retryMsg });
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone — added ${results.length}, failed ${failures.length} / ${PRODUCTS.length}\n`);
  console.log("barcode → product ID → nameEn");
  console.log("─".repeat(100));
  for (const r of results) {
    console.log(`${r.barcode} → ${r.id} → ${r.nameEn}`);
  }
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`${f.barcode}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
