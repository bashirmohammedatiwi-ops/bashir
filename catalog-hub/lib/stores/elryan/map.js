import {
  absImage,
  extractBarcodeFromSku,
  formatIqdPrice,
  productUrl,
} from './client.js';
import { splitBilingualText } from '../../core/bilingual.js';

function stripHtml(html = '') {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function brandOf(src = {}) {
  return String(src.brand_details?.title || '').trim();
}

function categoryLabel(src = {}) {
  const cats = Array.isArray(src.category) ? src.category : [];
  if (!cats.length) return '';
  // أعمق قسم أولاً
  const sorted = [...cats].sort((a, b) => Number(b.category_id || 0) - Number(a.category_id || 0));
  return String(sorted[0]?.name || '').trim();
}

function primaryImage(src = {}) {
  return absImage(src.image || src.thumbnail || src.small_image || src.media_gallery?.[0]?.image);
}

function galleryImages(src = {}) {
  const fromGallery = (src.media_gallery || [])
    .map((g) => absImage(g.image || g.file))
    .filter(Boolean);
  const primary = primaryImage(src);
  return [...new Set([primary, ...fromGallery].filter(Boolean))];
}

/** دمج سجل عربي + إنجليزي لنفس معرّف المنتج */
export function mergeBilingualSources(arSrc = null, enSrc = null) {
  if (!arSrc && !enSrc) return null;
  const primary = arSrc || enSrc;

  const nameAr = String(arSrc?.name || '').trim();
  const nameEn = String(enSrc?.name || '').trim();
  // إن وُجدت لغة واحدة فقط، استخدم bilingual split كاحتياطي خفيف
  const split = (!nameAr || !nameEn) ? splitBilingualText(primary.name, { mode: 'name' }) : null;

  const descAr = stripHtml(arSrc?.description || arSrc?.short_description || '');
  const descEn = stripHtml(enSrc?.description || enSrc?.short_description || '');

  const brandAr = brandOf(arSrc || {});
  const brandEn = brandOf(enSrc || {}) || brandAr;

  return {
    id: String(primary.id),
    sku: String(primary.sku || ''),
    barcode: extractBarcodeFromSku(primary.sku),
    nameAr: nameAr || split?.ar || '',
    nameEn: nameEn || split?.en || '',
    brandAr: brandAr || brandEn,
    brandEn: brandEn || brandAr,
    descriptionAr: descAr,
    descriptionEn: descEn,
    thumb: primaryImage(arSrc || primary) || primaryImage(enSrc || {}),
    images: galleryImages(arSrc || primary),
    price: formatIqdPrice(primary),
    category: categoryLabel(arSrc || primary),
    productUrl: productUrl(primary.url_path, arSrc ? 'ar' : 'en'),
    productUrlEn: productUrl((enSrc || primary).url_path, 'en'),
    shadeCount: Array.isArray(primary.configurable_children) && primary.configurable_children.length
      ? primary.configurable_children.length
      : 1,
    hasOptions: Array.isArray(primary.configurable_children) && primary.configurable_children.length > 0,
    inStock: primary.stock?.is_in_stock !== false,
    typeId: primary.type_id || 'simple',
  };
}

export function mapListProduct(arSrc = null, enSrc = null) {
  const merged = mergeBilingualSources(arSrc, enSrc);
  if (!merged) return null;
  return {
    id: merged.id,
    nameAr: merged.nameAr || merged.nameEn,
    nameEn: merged.nameEn,
    brandAr: merged.brandAr,
    brandEn: merged.brandEn,
    thumb: merged.thumb,
    price: merged.price,
    shadeCount: merged.shadeCount,
    hasOptions: merged.hasOptions,
    category: merged.category,
    sku: merged.sku,
    barcode: merged.barcode,
    productUrl: merged.productUrl,
    inStock: merged.inStock,
  };
}

export function mapDetailProduct(arSrc = null, enSrc = null) {
  const merged = mergeBilingualSources(arSrc, enSrc);
  if (!merged) return null;

  const nameAr = merged.nameAr || merged.nameEn;
  const nameEn = merged.nameEn || merged.nameAr;

  const shades = [{
    id: '0',
    nameAr,
    nameEn,
    sku: merged.sku || merged.id,
    barcode: merged.barcode,
    image: merged.thumb,
    price: merged.price,
    inStock: merged.inStock,
    optionGroup: '',
  }];

  const children = arSrc?.configurable_children || enSrc?.configurable_children || [];
  if (children.length) {
    return {
      ...merged,
      nameAr,
      nameEn,
      shades: children.map((child, i) => ({
        id: String(child.id || i),
        nameAr: String(child.name || child.sku || `خيار ${i + 1}`).trim(),
        nameEn: String(child.name || '').trim(),
        sku: String(child.sku || ''),
        barcode: extractBarcodeFromSku(child.sku),
        image: absImage(child.image || child.thumbnail) || merged.thumb,
        price: formatIqdPrice(child) || merged.price,
        inStock: child.stock?.is_in_stock !== false,
        optionGroup: '',
      })),
      shadeCount: children.length,
      hasOptions: true,
      manufacturer: merged.brandAr,
      manufacturerEn: merged.brandEn,
    };
  }

  return {
    ...merged,
    nameAr,
    nameEn,
    shades,
    shadeCount: 1,
    manufacturer: merged.brandAr,
    manufacturerEn: merged.brandEn,
  };
}

export function mapCategoryNode(src = {}, children = []) {
  const id = String(src.id || '');
  const name = String(src.name || '').trim();
  return {
    id,
    slug: String(src.url_key || src.slug || id),
    name,
    nameEn: name,
    level: Number(src.level || 1),
    isLeaf: children.length === 0,
    children,
    productCount: Number(src.product_count || src.children_count || 0) || null,
    path: name,
  };
}
