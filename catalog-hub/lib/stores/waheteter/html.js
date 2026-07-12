import { absImage, formatWaheteterPrice, productUrl, stripHtml, variantBarcode } from './client.js';
import { resolveBilingualName } from '../../core/bilingual.js';

const PRODUCT_CARD_RE = /<div class="[^"]*product-grid-item[^"]*"[^>]*data-id="(\d+)"[\s\S]*?(?=<div class="[^"]*product-grid-item|$)/gi;

function parsePriceFromHtml(chunk = '') {
  const raw = chunk.match(/woocommerce-Price-amount amount[^>]*>([\s\S]*?)<\/span>/i)?.[1] || '';
  const digits = String(raw).replace(/<[^>]+>/g, '').replace(/[^\d.]/g, '');
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n.toLocaleString('ar-LY')} د.ل`;
}

function parseSearchCard(chunk = '', id = '') {
  const slug = chunk.match(/href="https:\/\/waheteter\.com\/product\/([^"/]+)\//i)?.[1] || '';
  const name = chunk.match(/aria-label="([^"]+)"/i)?.[1]
    || chunk.match(/class="[^"]*wd-entities-title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)/i)?.[1]
    || '';
  const thumb = chunk.match(/<img[^>]+src="([^"]+uploads[^"]+)"/i)?.[1] || '';
  const price = parsePriceFromHtml(chunk);
  const names = resolveBilingualName(stripHtml(name));
  if (!id) return null;

  return {
    id: String(id),
    slug,
    nameAr: names.ar || names.en || stripHtml(name),
    nameEn: names.en || names.ar || stripHtml(name),
    thumb: absImage(thumb),
    price,
    productUrl: productUrl(slug, id),
    inStock: !/out-of-stock/.test(chunk),
    hasOptions: /product-type-variable/.test(chunk),
    shadeCount: /product-type-variable/.test(chunk) ? 2 : 1,
  };
}

export function parseSearchHtml(html = '') {
  const items = [];
  const seen = new Set();
  for (const match of String(html || '').matchAll(PRODUCT_CARD_RE)) {
    const id = String(match[1] || '').trim();
    if (!id || seen.has(id)) continue;
    const item = parseSearchCard(match[0], id);
    if (!item) continue;
    seen.add(id);
    items.push(item);
  }
  return items;
}

export function parseProductPageHtml(html = '', { slug = '', id = '' } = {}) {
  const page = String(html || '');
  const productId = String(
    page.match(/data-product_id="(\d+)"/i)?.[1]
    || page.match(/"product_id":(\d+)/i)?.[1]
    || id
    || '',
  ).trim();
  const productSlug = slug || page.match(/property="og:url" content="https:\/\/waheteter\.com\/product\/([^"/]+)\//i)?.[1] || '';
  const title = stripHtml(page.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const shortDesc = stripHtml(page.match(/class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '');
  const names = resolveBilingualName(title, shortDesc);
  const description = stripHtml(page.match(/id="tab-description"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)?.[1] || '');
  const images = [...page.matchAll(/data-large_image="([^"]+)"/gi)].map((m) => absImage(m[1]));
  if (!images.length) {
    const og = page.match(/property="og:image" content="([^"]+)"/i)?.[1];
    if (og) images.push(absImage(og));
  }

  const variationsRaw = page.match(/data-product_variations="([^"]+)"/i)?.[1]
    || page.match(/data-product_variations='([^']+)'/i)?.[1];
  const shades = [];
  if (variationsRaw) {
    try {
      const decoded = variationsRaw
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'");
      const variations = JSON.parse(decoded);
      for (const v of variations) {
        const label = Object.values(v.attributes || {}).join(' · ') || String(v.variation_description || '').trim();
        const namesShade = resolveBilingualName(label);
        shades.push({
          id: String(v.variation_id || v.id || shades.length),
          nameAr: namesShade.ar || label,
          nameEn: namesShade.en || label,
          sku: String(v.sku || '').trim(),
          barcode: variantBarcode({ sku: v.sku }),
          image: absImage(v.image?.full_src || v.image?.src || v.image?.url),
          price: Number(v.display_price) > 0 ? `${Number(v.display_price).toLocaleString('ar-LY')} د.ل` : '',
          inStock: v.is_in_stock !== false,
          optionGroup: 'الحجم',
        });
      }
    } catch {
      // ignore malformed JSON
    }
  }

  const thumb = images[0] || shades[0]?.image || '';
  const primary = shades[0] || {
    id: '0',
    nameAr: names.ar,
    nameEn: names.en,
    sku: productId,
    barcode: '',
    image: thumb,
    price: shades[0]?.price || '',
    inStock: true,
    optionGroup: '',
  };

  return {
    id: productId,
    slug: productSlug,
    nameAr: names.ar || title,
    nameEn: names.en || shortDesc || title,
    descriptionAr: description || shortDesc,
    descriptionEn: shortDesc || description,
    thumb,
    images: images.length ? images : [thumb].filter(Boolean),
    shades,
    barcode: primary.barcode,
    productUrl: productUrl(productSlug, productId),
    price: primary.price || parsePriceFromHtml(page),
    hasOptions: shades.length > 1,
    shadeCount: shades.length || 1,
    inStock: shades.some((s) => s.inStock) || !/out-of-stock/.test(page),
  };
}

export function htmlSearchHasBarcode(html = '', digits = '') {
  return String(html || '').includes(String(digits || ''));
}
