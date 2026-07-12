import {
  decodeHtml,
  stripHtml,
  absUrl,
  extractBarcode,
  formatIqdPrice,
} from './client.js';
import { splitBilingualText } from '../../core/bilingual.js';

export const BEAUTYWAY_PER_PAGE = 12;

const PRODUCT_ITEM_RE = /<div class="product_item[\s\S]*?<\/figure>\s*<\/div>/gi;

function slugFromHref(href = '') {
  const path = String(href || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/(ar|en)\//, '/').replace(/^\/+/, '');
  if (!path || path.startsWith('shop') || path.startsWith('node/')) return '';
  return path.split('?')[0].replace(/\/$/, '');
}

function barcodeFromImageUrl(url = '') {
  const file = String(url || '').split('/').pop()?.split('?')[0] || '';
  const m = file.match(/^(\d{8,14})\./);
  return m ? extractBarcode(m[1]) : '';
}

function splitTitleParts(raw = '') {
  const text = decodeHtml(String(raw || '').replace(/<br\s*\/?>/gi, '\n'));
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const arLine = lines.find((l) => /[\u0600-\u06FF]/.test(l));
  const enLine = lines.find((l) => /[A-Za-z]/.test(l) && !/[\u0600-\u06FF]/.test(l));
  if (arLine || enLine) {
    return {
      nameAr: arLine || enLine || lines[0] || '',
      nameEn: enLine || arLine || lines[0] || '',
    };
  }
  const bi = splitBilingualText(text, { mode: 'name' });
  return { nameAr: bi.ar || bi.en, nameEn: bi.en || bi.ar };
}

function parseListingItem(chunk = '') {
  const href = absUrl(chunk.match(/href="([^"]+)"/i)?.[1] || '');
  const titleHtml = chunk.match(/<a[^>]*class="color_dark"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || '';
  const names = splitTitleParts(titleHtml);
  const priceRaw = decodeHtml(
    chunk.match(/product_shop_p[\s\S]*?<span[^>]*direction:ltr[^>]*>([\d,]+)<\/span>/i)?.[1]
    || chunk.match(/product_shop_p[\s\S]*?<span[^>]*>([\d,]+)<\/span>/i)?.[1]
    || '',
  );
  const thumb = absUrl(
    chunk.match(/data-src="([^"]+)"/i)?.[1]
    || chunk.match(/data-lazy-src="([^"]+)"/i)?.[1]
    || chunk.match(/<img[^>]+src="([^"]+)"/i)?.[1]
    || '',
  );
  const nodeId = String(chunk.match(/product_id="(\d+)"/i)?.[1] || '').trim();
  const slug = slugFromHref(href);
  const id = nodeId || slug;
  const barcode = extractBarcode(chunk.match(/product_barcode="([^"]+)"/i)?.[1] || '')
    || barcodeFromImageUrl(thumb);
  if (!id || !href) return null;

  return {
    id,
    href,
    nameAr: names.nameAr || names.nameEn,
    nameEn: names.nameEn || names.nameAr,
    price: formatIqdPrice(priceRaw),
    thumb,
    barcode,
    shadeCount: 0,
    hasOptions: false,
    inStock: true,
  };
}

export function parseListingHtml(html = '') {
  const items = [];
  const seen = new Set();
  for (const chunk of String(html || '').match(PRODUCT_ITEM_RE) || []) {
    const item = parseListingItem(chunk);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

export function parseListingTotal(html = '') {
  const text = String(html || '');
  const parsed = parseListingHtml(text).length;
  const last = text.match(/pager-last[\s\S]*?page=(\d+)/i)?.[1];
  if (last != null) {
    const pages = Number(last) + 1;
    const countOnPage = parsed || BEAUTYWAY_PER_PAGE;
    return pages * countOnPage;
  }
  return parsed;
}

function parseDetailTitle(html = '') {
  const h2 = decodeHtml(html.match(/<h2[^>]*class="[^"]*color_dark[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '');
  if (!h2) return splitBilingualText('');
  if (h2.includes(' - ')) {
    const [ar, en] = h2.split(' - ').map((s) => s.trim());
    return { ar: ar || en, en: en || ar };
  }
  return splitBilingualText(h2, { mode: 'name' });
}

function parseTableValue(html = '', labels = []) {
  for (const label of labels) {
    const re = new RegExp(`<td[^>]*>\\s*${label}\\s*</td>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i');
    const m = html.match(re);
    if (m) return stripHtml(m[1]);
  }
  return '';
}

export function parseProductDetailHtml(html = '', { lang = 'ar', fallbackId = '' } = {}) {
  const text = String(html || '');
  const names = parseDetailTitle(text);
  const nodeId = text.match(/og:url" content="[^"]*\/node\/(\d+)/i)?.[1]
    || text.match(/product_id="(\d+)"/i)?.[1]
    || String(fallbackId || '');
  const barcode = extractBarcode(
    text.match(/id="barcode"[^>]*>([^<]+)/i)?.[1]
    || text.match(/product_barcode="([^"]+)"/i)?.[1]
    || '',
  );
  const brand = parseTableValue(text, ['الماركة', 'Brand', 'ماركة'])
    || stripHtml(text.match(/shop\?[^"]*brand=\d+[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || '');
  const brandNames = splitBilingualText(brand, { mode: 'name' });
  const priceRaw = parseTableValue(text, ['السعر', 'Price'])
    || decodeHtml(text.match(/product_shop_p[\s\S]*?<span[^>]*>([\d,]+)<\/span>/i)?.[1] || '');
  const ogImage = absUrl(text.match(/og:image" content="([^"]+)"/i)?.[1] || '');
  const slugPath = text.match(/<link rel="canonical" href="https:\/\/www\.beautyway-iq\.com(?:\/en)?\/([^"]+)"/i)?.[1]
    || '';

  const productSection = text.split(/منتجات مشابهة|Similar products|related products/i)[0] || text;
  const images = [];
  if (ogImage) images.push(ogImage);
  for (const src of productSection.matchAll(/<img[^>]+(?:data-src|src)="(https:\/\/www\.beautyway-iq\.com\/files\/[^"?]+)/gi)) {
    const url = absUrl(src[1]);
    if (url && !/\/flag_|beautyway\.png|favicon/i.test(url)) images.push(url);
  }
  const uniqueImages = [...new Set(images.map((u) => absUrl(u)))];

  return {
    id: String(nodeId || '').trim(),
    slug: slugPath.replace(/^node\//, ''),
    nameAr: names.ar || names.en,
    nameEn: names.en || names.ar,
    brandAr: brandNames.ar || brandNames.en || brand,
    brandEn: brandNames.en || brandNames.ar || brand,
    price: formatIqdPrice(priceRaw),
    thumb: uniqueImages[0] || '',
    images: uniqueImages,
    barcode,
    shades: [],
    shadeCount: 0,
    hasOptions: false,
    inStock: !/نفدت الكمية|out of stock/i.test(text),
    productUrl: absUrl(slugPath ? `/${slugPath}` : `/node/${nodeId}`),
    lang,
  };
}

export function parseCategorySidebar(html = '') {
  const leaves = [];
  const re = /<a href="https:\/\/www\.beautyway-iq\.com(?:\/en)?\/shop\?category=(\d+)"[^>]*><b>([^<]+)<\/b>/gi;
  for (const m of String(html || '').matchAll(re)) {
    const id = m[1];
    const label = decodeHtml(m[2]);
    if (!id || id === '0') continue;
    leaves.push({ id, label });
  }
  return leaves;
}
