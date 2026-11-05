import type { HomeSection, Media, Product, ProductImage, Shade } from "./types";

/**
 * نسخة خفيفة من المنتج لبطاقات القوائم: ما تعرضه البطاقة وتحتاجه السلة والمفضلة فقط.
 * منتجات الرئيسية تصل من الـ API كاملة (وصف بثلاث لغات وكل مقاسات كل الصور ≈ 9KB للمنتج)،
 * و~240 منتجاً كانت تجعل الصفحة ~2MB يحلّلها المتصفح قبل أن تستجيب — فتتجمّد على أجهزة iPhone.
 */
const CARD_SIZES = ["thumb", "small"] as const;

function slimMedia(m: Media | null | undefined): Media | null {
  if (!m) return null;
  const variants: NonNullable<Media["variants"]> = {};
  for (const size of CARD_SIZES) {
    const v = m.variants?.[size];
    const webp = v?.formats?.webp;
    const jpg = v?.formats?.jpg;
    if (webp || jpg) variants[size] = { width: v?.width, formats: webp ? { webp } : { jpg } };
  }
  const out: Media = { id: m.id };
  if (Object.keys(variants).length) out.variants = variants;
  else {
    // لا مقاس صغير: نُبقي ما يلزم mediaUrl لبناء الرابط.
    if (m.url) out.url = m.url;
    if (m.publicUrlBase) out.publicUrlBase = m.publicUrlBase;
    if (m.filename) out.filename = m.filename;
    if (m.originalUrl) out.originalUrl = m.originalUrl;
  }
  return out;
}

function slimImages(images: ProductImage[] | undefined): ProductImage[] {
  return [...(images ?? [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position)
    .slice(0, 2)
    .map((img, i) => ({ id: img.id, position: i, isPrimary: i === 0, media: slimMedia(img.media) }));
}

function slimShade(s: Shade): Shade {
  const out: Shade = { id: s.id, name: s.name, colorHex: s.colorHex, stock: s.stock };
  if (s.colorHexEnd) out.colorHexEnd = s.colorHexEnd;
  if (s.barcode) out.barcode = s.barcode;
  if (s.hasBarcode != null) out.hasBarcode = s.hasBarcode;
  if (s.price != null) out.price = s.price;
  if (s.isActive === false) out.isActive = false;
  return out;
}

export function toCardProduct(p: Product): Product {
  const out: Product = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    isNew: p.isNew,
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
    images: slimImages(p.images),
    shades: (p.shades ?? []).map(slimShade),
  };
  if (p._count?.shades) out._count = { shades: p._count.shades };
  if (p.shadeCount) out.shadeCount = p.shadeCount;
  return out;
}

/** يخفّف منتجات كل أقسام الرئيسية (ومنها أقسام المجموعات المتداخلة). */
export function slimHomeSections(sections: HomeSection[]): HomeSection[] {
  return sections.map((s) => ({
    ...s,
    ...(s.products ? { products: s.products.map(toCardProduct) } : {}),
    ...(s.children ? { children: slimHomeSections(s.children) } : {}),
  }));
}
