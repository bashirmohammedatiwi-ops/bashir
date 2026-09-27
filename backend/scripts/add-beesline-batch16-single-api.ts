/**
 * Beesline — 16 separate single-SKU products (no shades, with images).
 * Source: beesline.com (verified names, prices, images)
 * Skipped: 12 barcodes not found on beesline.com (see list at bottom)
 * Usage: npx tsx scripts/add-beesline-batch16-single-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

type ProductDef = {
  barcode: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  subcategoryId: string;
  tertiaryCategoryId?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrls: string[];
};

const PRODUCTS: ProductDef[] = [
  {
    barcode: "5281018087008",
    slug: "beesline-whitening-facial-soap-redberry",
    sku: "BEE-087008",
    price: 8000,
    originalPrice: 8000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - صابونة تفتيح الوجه بالتوت البري",
    nameEn: "Beesline - Whitening Facial Soap - Redberry",
    descriptionAr: "صابونة طبيعية بالغليسرين غنية بالعسل ومستخلص التوت البري. تنظف بعمق وترطب وتفتّح لون البشرة وتوحّد لونها. مناسبة للبشرة العادية والجافة والحساسة.",
    descriptionEn: "A natural glycerin soap bar enriched with honey and redberry extract. Deeply cleanses, moisturizes and brightens the complexion while evening out skin tone. Suitable for normal, dry and sensitive skin.",
    imageUrls: ["https://beesline.com/cdn/shop/files/whitening_facial_soap_redberry.webp?v=1769002100&width=1200","https://beesline.com/cdn/shop/files/whitening_facial_soap_redberry.webp?v=1769002100&width=1946"],
  },
  {
    barcode: "5281018003220",
    slug: "beesline-whitening-sensitive-zone-soap",
    sku: "BEE-003220",
    price: 9000,
    originalPrice: 9000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "23aaaa07-91ee-4937-847e-d7866a9e937a",
    
    nameAr: "بيزلاين - صابونة تفتيح المناطق الحساسة",
    nameEn: "Beesline - Whitening Sensitive Zone Soap",
    descriptionAr: "صابونة تفتيح لطيفة للمناطق الحساسة. بمكونات طبيعية تنظف وتفتّح وتوحّد لون البشرة في المناطق الدقيقة.",
    descriptionEn: "A gentle whitening soap for sensitive areas. Formulated with natural ingredients to cleanse, brighten and even skin tone in delicate zones.",
    imageUrls: ["https://beesline.com/cdn/shop/files/whitening_sensitive_zone_soap.webp?v=1769002133&width=1200","https://beesline.com/cdn/shop/files/whitening_sensitive_zone_soap.webp?v=1769002133&width=1946"],
  },
  {
    barcode: "5281018010006",
    slug: "beesline-honey-soap",
    sku: "BEE-010006",
    price: 6000,
    originalPrice: 6000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - صابونة العسل المرطبة",
    nameEn: "Beesline - Honey Soap",
    descriptionAr: "صابونة مرطبة بالعسل النقي. تغذي وتنعم البشرة مع تنظيف يومي لطيف للوجه والجسم.",
    descriptionEn: "A moisturizing soap bar with pure honey. Nourishes and softens skin while providing gentle daily cleansing for face and body.",
    imageUrls: ["https://beesline.com/cdn/shop/files/honey_moisturizing_soap.webp?v=1769424291&width=1200","https://beesline.com/cdn/shop/files/honey_moisturizing_soap.webp?v=1769424291&width=1946"],
  },
  {
    barcode: "5281018003114",
    slug: "beesline-whitening-facial-exfoliating-soap",
    sku: "BEE-003114",
    price: 8000,
    originalPrice: 8000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - صابونة تفتيح الوجه المقشرة",
    nameEn: "Beesline - Whitening Facial Exfoliating Soap",
    descriptionAr: "صابونة تقشير وتفتيح بجزيئات طبيعية. تزيل خلايا الجلد الميتة وتنظف المسام وتكشف عن بشرة أكثر إشراقاً ونعومة.",
    descriptionEn: "An exfoliating whitening soap with natural beads. Removes dead skin cells, unclogs pores and reveals brighter, smoother skin.",
    imageUrls: ["https://beesline.com/cdn/shop/files/whitening_facial_exfoliating_soap.webp?v=1769002097&width=1200","https://beesline.com/cdn/shop/files/whitening_facial_exfoliating_soap.webp?v=1769002097&width=1946"],
  },
  {
    barcode: "5281018086995",
    slug: "beesline-whitening-facial-soap-jouri-rose",
    sku: "BEE-086995",
    price: 8000,
    originalPrice: 8000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - صابونة تفتيح الوجه بالورد الجوري",
    nameEn: "Beesline - Whitening Facial Soap - Jouri Rose",
    descriptionAr: "صابونة تفتيح للوجه بمستخلص الورد الجوري. تنظف وتفتّح وتعطر البشرة برائحة زهرية رقيقة.",
    descriptionEn: "A whitening facial soap with Damask rose extract. Cleanses, brightens and perfumes the skin with a delicate floral scent.",
    imageUrls: ["https://beesline.com/cdn/shop/files/whitening_facial_soap_jouri_rose.webp?v=1769002097&width=1200","https://beesline.com/cdn/shop/files/whitening_facial_soap_jouri_rose.webp?v=1769002097&width=1946"],
  },
  {
    barcode: "5281018087015",
    slug: "beesline-whitening-facial-soap-papaya",
    sku: "BEE-087015",
    price: 8000,
    originalPrice: 8000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - صابونة تفتيح الوجه بالبابايا",
    nameEn: "Beesline - Whitening Facial Soap - Papaya",
    descriptionAr: "صابونة تفتيح للوجه بمستخلص البابايا. تقشر بلطف وتفتّح البقع الداكنة وتوحّد لون البشرة لمظهر مشرق.",
    descriptionEn: "A whitening facial soap with papaya extract. Gently exfoliates, brightens dark spots and evens skin tone for a radiant complexion.",
    imageUrls: ["https://beesline.com/cdn/shop/files/whitening_facial_soap_papaya.webp?v=1769002097&width=1200","https://beesline.com/cdn/shop/files/whitening_facial_soap_papaya.webp?v=1769002097&width=1946"],
  },
  {
    barcode: "5281018004036",
    slug: "beesline-facial-purifying-soap",
    sku: "BEE-004036",
    price: 8000,
    originalPrice: 8000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - صابونة تنقية الوجه",
    nameEn: "Beesline - Facial Purifying Soap",
    descriptionAr: "صابونة تنقية للبشرة الدهنية والمعرضة لحب الشباب. تنظف المسام بعمق وتتحكم في الزهم الزائد وتساعد على منع ظهور البثور.",
    descriptionEn: "A purifying soap for oily and acne-prone skin. Deeply cleanses pores, controls excess sebum and helps prevent breakouts.",
    imageUrls: ["https://beesline.com/cdn/shop/files/facial_purifying_soap.webp?v=1769001959&width=1200","https://beesline.com/cdn/shop/files/facial_purifying_soap.webp?v=1769001959&width=1946"],
  },
  {
    barcode: "5281018000212",
    slug: "beesline-corn-remover-solution",
    sku: "BEE-000212",
    price: 9000,
    originalPrice: 9000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "23aaaa07-91ee-4937-847e-d7866a9e937a",
    
    nameAr: "بيزلاين - محلول إزالة مسامير القدم",
    nameEn: "Beesline - Corn Remover Solution",
    descriptionAr: "محلول موجه لتنعيم وإزالة مسامير القدم والكالس. يساعد على استعادة بشرة ناعمة وصحية.",
    descriptionEn: "A targeted solution to soften and remove corns and calluses on feet. Helps restore smooth, healthy skin.",
    imageUrls: ["https://beesline.com/cdn/shop/files/corn_remover_solution.webp?v=1769004278&width=1200","https://beesline.com/cdn/shop/files/corn_remover_solution.webp?v=1769004278&width=1946"],
  },
  {
    barcode: "5281018000267",
    slug: "beesline-feet-heels-repair-kit",
    sku: "BEE-000267",
    price: 18000,
    originalPrice: 18000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "23aaaa07-91ee-4937-847e-d7866a9e937a",
    
    nameAr: "بيزلاين - طقم إصلاح القدمين والكعبين",
    nameEn: "Beesline - Feet & Heels Repair Kit",
    descriptionAr: "طقم إصلاح كامل للقدمين والكعبين الجافين والمتشققين. ينعم ويرطب ويصلح البشرة الخشنة.",
    descriptionEn: "A complete repair kit for dry, cracked feet and heels. Softens, moisturizes and repairs rough skin.",
    imageUrls: ["https://beesline.com/cdn/shop/files/feet_heels_kit.webp?v=1769004291&width=1200","https://beesline.com/cdn/shop/files/feet_heels_kit.webp?v=1769004291&width=1946"],
  },
  {
    barcode: "5281018710951",
    slug: "beesline-instant-bright-5in1-cleanser",
    sku: "BEE-710951",
    price: 25000,
    originalPrice: 25000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - غسول الإشراق الفوري 5 في 1",
    nameEn: "Beesline - Instant Bright 5in1 Cleanser",
    descriptionAr: "غسول تفتيح 5 في 1 ينظف ويقشر ويفتّح ويوحّد اللون وينعش البشرة.",
    descriptionEn: "A 5-in-1 brightening cleanser that cleanses, exfoliates, brightens, evens tone and refreshes the skin.",
    imageUrls: ["https://beesline.com/cdn/shop/files/instant_bright_5in1_cleanser.webp?v=1769001981&width=1200","https://beesline.com/cdn/shop/files/instant_bright_5in1_cleanser.webp?v=1769001981&width=1946"],
  },
  {
    barcode: "5281018711088",
    slug: "beesline-instant-bright-day-cream",
    sku: "BEE-711088",
    price: 32000,
    originalPrice: 32000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "21801439-d0e9-4106-b5e8-dfdd70ffeb8d",
    nameAr: "بيزلاين - كريم النهار للإشراق الفوري",
    nameEn: "Beesline - Instant Bright Day Cream",
    descriptionAr: "كريم نهاري مفتح يوحّد لون البشرة ويقلل البقع الداكنة ويوفر ترطيباً يومياً مع حماية من الشمس.",
    descriptionEn: "A brightening day cream that evens skin tone, reduces dark spots and provides daily hydration with SPF protection.",
    imageUrls: ["https://beesline.com/cdn/shop/files/instant_bright_day_cream.webp?v=1769001982&width=1200","https://beesline.com/cdn/shop/files/instant_bright_day_cream.webp?v=1769001982&width=1946"],
  },
  {
    barcode: "5281018002988",
    slug: "beesline-sensifresh-intimate-deo",
    sku: "BEE-002988",
    price: 18000,
    originalPrice: 18000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "23aaaa07-91ee-4937-847e-d7866a9e937a",
    
    nameAr: "بيزلاين - مزيل عرق للمناطق الحساسة",
    nameEn: "Beesline - Sensifresh Intimate Deo",
    descriptionAr: "مزيل عرق لطيف للمناطق الحساسة يوفر انتعاشاً يدوم طويلاً وحماية من الروائح.",
    descriptionEn: "A gentle intimate deodorant that provides long-lasting freshness and odor protection for sensitive areas.",
    imageUrls: ["https://beesline.com/cdn/shop/files/sensifresh_whitening_sensitive_zone_deodorant.webp?v=1769002057&width=1200","https://beesline.com/cdn/shop/files/sensifresh_whitening_sensitive_zone_deodorant.webp?v=1769002057&width=1946"],
  },
  {
    barcode: "5281018007068",
    slug: "beesline-hygienic-wash",
    sku: "BEE-007068",
    price: 16000,
    originalPrice: 16000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "23aaaa07-91ee-4937-847e-d7866a9e937a",
    
    nameAr: "بيزلاين - غسول صحي للمناطق الحساسة",
    nameEn: "Beesline - Hygienic Wash",
    descriptionAr: "غسول صحي يومي لطيف للمناطق الحساسة. يحافظ على توازن الحموضة الطبيعي ويوفر شعوراً بالانتعاش.",
    descriptionEn: "A gentle daily hygienic wash for intimate areas. Maintains natural pH balance and provides a feeling of freshness.",
    imageUrls: ["https://beesline.com/cdn/shop/files/feminine_hygienic_wash.webp?v=1769001979&width=1200","https://beesline.com/cdn/shop/files/feminine_hygienic_wash.webp?v=1769001979&width=1946"],
  },
  {
    barcode: "5281018003244",
    slug: "beesline-whitening-intimate-wash",
    sku: "BEE-003244",
    price: 20000,
    originalPrice: 20000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "23aaaa07-91ee-4937-847e-d7866a9e937a",
    
    nameAr: "بيزلاين - غسول تفتيح للمناطق الحساسة",
    nameEn: "Beesline - Whitening Intimate Wash",
    descriptionAr: "غسول تفتيح للمناطق الحساسة ينظف بلطف ويفتّح ويوحّد لون البشرة في المناطق الدقيقة.",
    descriptionEn: "A whitening intimate wash that gently cleanses, brightens and evens skin tone in sensitive areas.",
    imageUrls: ["https://beesline.com/cdn/shop/files/whitening_intimate_wash.webp?v=1769002101&width=1200","https://beesline.com/cdn/shop/files/whitening_intimate_wash.webp?v=1769002101&width=1946"],
  },
  {
    barcode: "5281018711071",
    slug: "beesline-instant-bright-micellar-water",
    sku: "BEE-711071",
    price: 20000,
    originalPrice: 20000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - ماء ميسيلار للإشراق الفوري",
    nameEn: "Beesline - Instant Bright Micellar Water",
    descriptionAr: "ماء ميسيلار مفتح يزيل المكياج وينظف ويفتّح البشرة في خطوة واحدة.",
    descriptionEn: "A brightening micellar water that removes makeup, cleanses and brightens the skin in one step.",
    imageUrls: ["https://beesline.com/cdn/shop/files/instant_bright_micellar_water.webp?v=1769001988&width=1200","https://beesline.com/cdn/shop/files/instant_bright_micellar_water.webp?v=1769001988&width=1946"],
  },
  {
    barcode: "5281018093085",
    slug: "beesline-3in1-micellar-cleansing-water-rose-400ml",
    sku: "BEE-093085",
    price: 12000,
    originalPrice: 12000,
    categoryId: "9f99dbf3-15c4-4561-8f53-1499a8743a47",
    subcategoryId: "07661898-571a-4a88-aa6c-76dcdbf53029",
    tertiaryCategoryId: "05028a17-da64-4c66-b25f-73c758acc2f8",
    nameAr: "بيزلاين - ماء ميسيلار 3 في 1 بالورد 400 مل",
    nameEn: "Beesline - 3in1 Micellar Cleansing Water - Rose 400ml",
    descriptionAr: "ماء ميسيلار 3 في 1 بمستخلص الورد. ينظف ويزيل المكياج وينعش البشرة. مناسب للوجه والعينين.",
    descriptionEn: "A 3-in-1 micellar water with rose extract. Cleanses, removes makeup and tones the skin. Suitable for face and eyes.",
    imageUrls: ["https://beesline.com/cdn/shop/files/3in1_micellar_cleansing_water_rose_400ml.webp?v=1769002024&width=1200","https://beesline.com/cdn/shop/files/3in1_micellar_cleansing_water_rose_400ml.webp?v=1769002024&width=1946"],
  }
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  token = (json as { data?: { accessToken?: string }; accessToken?: string }).data?.accessToken ??
    (json as { accessToken?: string }).accessToken ?? "";
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

async function resolveBrand(): Promise<string> {
  const resolved = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", {
    brandAr: "بيزلاين",
    brandEn: "Beesline",
    createIfMissing: true,
  });
  const id = resolved.brand?.id;
  if (!id) throw new Error("Could not resolve Beesline brand");
  return id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1024) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) throw new Error(`not an image (${contentType || "unknown"})`);

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Products: ${PRODUCTS.length} (no shades, with images)\n`);
  await login();
  const brandId = await resolveBrand();
  console.log(`Brand: Beesline (${brandId})\n`);

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    console.log(`--- ${product.barcode} ---`);
    const check = await api<{ exists: boolean; product?: { nameAr?: string } }>(
      `/products/barcode-check?barcode=${product.barcode}`,
    );
    if (check.exists) {
      console.log(`  skip — exists | ${check.product?.nameAr ?? "?"}\n`);
      skipped += 1;
      continue;
    }

    const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
      `/products?search=${encodeURIComponent(product.slug)}&status=all&limit=5`,
    );
    const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
    if (rows.some((p) => p.slug === product.slug)) {
      console.log(`  skip — slug exists (${product.slug})\n`);
      skipped += 1;
      continue;
    }

    console.log(`  uploading images...`);
    const imageIds: string[] = [];
    for (let i = 0; i < product.imageUrls.length; i++) {
      try {
        imageIds.push(await uploadImage(product.imageUrls[i], `${product.slug}-${i + 1}`));
      } catch (err) {
        console.log(`  image ${i + 1} failed: ${(err as Error).message}`);
      }
    }
    if (!imageIds.length) throw new Error(`No images uploaded for ${product.barcode}`);

    const created = await api<{ id: string }>("/products", "POST", {
      sku: product.sku,
      barcode: product.barcode,
      slug: product.slug,
      brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      ...(product.tertiaryCategoryId ? { tertiaryCategoryId: product.tertiaryCategoryId } : {}),
      subcategoryIds: [product.subcategoryId],
      tertiaryCategoryIds: product.tertiaryCategoryId ? [product.tertiaryCategoryId] : [],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: 0,
      isActive: true,
      imageIds,
    });

    console.log(`  ✓ ${product.nameAr}`);
    console.log(`    EN: ${product.nameEn}`);
    console.log(`    ID: ${created.id} | images: ${imageIds.length} | ${product.price} IQD\n`);
    added += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done — added: ${added}/${PRODUCTS.length} | skipped: ${skipped}`);
  console.log(`\nSkipped barcodes (not found on beesline.com):`);
  console.log(`5281018951569, 5281018953310, 5281018717264, 5281018717288, 5281018717240,`);
  console.log(`5281018087619, 5281018715383, 5281018715437, 5281018715406, 5281018715390,`);
  console.log(`5281018881330, 5281018035054`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
