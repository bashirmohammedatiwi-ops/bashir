import { decodeHtml, absUrl, formatAedPrice } from './client.js';

function parseGtmJson(raw = '') {
  try {
    const text = decodeHtml(raw).replace(/&quot;/g, '"');
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr[0] : arr;
  } catch {
    return null;
  }
}

function pickListingPid(tileHtml = '') {
  const pids = [...tileHtml.matchAll(/\bdata-pid="([^"]+)"/gi)].map((m) => m[1]);
  const master = pids.find((id) => /^pm/i.test(id)) || pids.find((id) => /^PM_/.test(id));
  const variant = pids.find((id) => /^\d{6,}$/.test(id));
  return normalizeListingId(master || variant || pids[0] || '');
}

function normalizeListingId(id = '') {
  const raw = String(id || '').trim();
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  return raw;
}

export function parseListingHtml(html = '', { lang = 'ar' } = {}) {
  const text = String(html || '');
  const items = [];
  const seen = new Set();

  const tileRe = /<div class="js-product-tile-container[\s\S]*?(?=<div class="js-product-tile-container|<footer|$)/gi;
  const chunks = text.match(tileRe) || [];

  for (const chunk of chunks) {
    const pid = pickListingPid(chunk);
    if (!pid || seen.has(pid)) continue;

    const gtm = parseGtmJson(chunk.match(/data-gtm-enhancedecommerce-impression="([^"]+)"/i)?.[1] || '');
    const nameAr = decodeHtml(chunk.match(/data-cnstrc-item-name="([^"]+)"/i)?.[1] || '');
    const nameEn = decodeHtml(gtm?.item_name || '');
    const brandAr = decodeHtml(chunk.match(/class="[^"]*product-brand[^"]*"[^>]*>\s*([^<]+)/i)?.[1] || '');
    const brandEn = decodeHtml(gtm?.item_brand || '');
    const price = formatAedPrice({ price: { sales: { value: Number(gtm?.price || chunk.match(/data-cnstrc-item-price="([^"]+)"/i)?.[1] || 0) } } });
    const href = chunk.match(/href="(\/ar\/p\/[^"]+\.html)"/i)?.[1]
      || chunk.match(/href="(\/en\/p\/[^"]+\.html)"/i)?.[1]
      || '';
    const img = absUrl(
      decodeHtml(
        chunk.match(/data-src="([^"]+)"/i)?.[1]
        || chunk.match(/data-srcset="([^"]+)"/i)?.[1]?.split(',')?.map((s) => s.trim().split(/\s+/)[0])?.pop()
        || chunk.match(/src="(https:\/\/[^"]+demandware\.static[^"]+)"/i)?.[1]
        || chunk.match(/src="(https:\/\/[^"]+media-amazon[^"]+|https:\/\/www\.faces\.ae\/dw\/image[^"]+)"/i)?.[1]
        || chunk.match(/src="(\/on\/demandware\.static[^"]+)"/i)?.[1]
        || '',
      ),
    );

    if (!nameAr && !nameEn) continue;
    seen.add(pid);
    items.push({
      id: pid,
      nameAr: nameAr || nameEn,
      nameEn: nameEn || nameAr,
      brandAr: brandAr || brandEn,
      brandEn: brandEn || brandAr,
      thumb: img,
      price,
      shadeCount: null,
      hasOptions: /\bdata-cnstrc-item-variation-id=/i.test(chunk),
      category: decodeHtml(gtm?.item_category || ''),
      sku: gtm?.item_variant || pid,
      barcode: '',
      productUrl: absUrl(href) || `https://www.faces.ae/${lang}/`,
      inStock: gtm?.item_in_stock !== false,
    });
  }

  if (items.length) return items;

  // احتياط — data-pid متفرق
  for (const m of text.matchAll(/data-pid="([^"]+)"[\s\S]{0,2500}?data-cnstrc-item-name="([^"]+)"/gi)) {
    const pid = normalizeListingId(m[1]);
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const gtm = parseGtmJson(m[0].match(/data-gtm-enhancedecommerce-impression="([^"]+)"/i)?.[1] || '');
    items.push({
      id: pid,
      nameAr: decodeHtml(m[2]),
      nameEn: decodeHtml(gtm?.item_name || ''),
      brandAr: decodeHtml(gtm?.item_brand || ''),
      brandEn: decodeHtml(gtm?.item_brand || ''),
      thumb: '',
      price: gtm?.price ? `${gtm.price} درهم` : '',
      shadeCount: null,
      hasOptions: true,
      category: '',
      sku: pid,
      barcode: '',
      productUrl: `https://www.faces.ae/${lang}/`,
      inStock: true,
    });
  }

  return items;
}

export function parseListingTotal(html = '') {
  const text = String(html || '');
  const patterns = [
    /data-result-count="(\d+)"/i,
    /"resultCount"\s*:\s*(\d+)/i,
    /من\s*أصل\s*([\d,]+)/i,
    /of\s+([\d,]+)\s+items/i,
    /(\d+)\s+items\s*</i,
    /من\s*([\d,]+)\s*نتيجة/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return Number(String(m[1]).replace(/,/g, '')) || 0;
  }
  return 0;
}
