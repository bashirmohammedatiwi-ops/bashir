import { cacheGet, cacheSet } from '../../core/cache.js';
import { splitBilingualText } from '../../core/bilingual.js';
import { BEAUTY_ROOT_NODE } from './client.js';

const DEFAULT_TTL = 10 * 60 * 1000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MARKET = {
  com: {
    host: 'www.amazon.com',
    currency: 'USD',
    lang: 'en-US,en;q=0.9',
  },
  ae: {
    host: 'www.amazon.ae',
    currency: 'AED',
    lang: 'ar-AE,ar;q=0.9,en;q=0.8',
  },
};

function decodeHtml(s = '') {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url, { lang = 'en-US,en;q=0.9', ttl = DEFAULT_TTL / 2, cacheKey = '' } = {}) {
  const key = cacheKey || `amazon:html:${url}`;
  const cached = cacheGet(key, ttl);
  if (cached) return cached;

  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': lang,
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(18_000),
  });

  const html = await res.text();
  if (!res.ok) throw new Error(`Amazon HTTP ${res.status}`);
  if (/enter the characters you see|type the characters|robot check|automated access/i.test(html)) {
    throw new Error('Amazon حظر الطلب مؤقتاً (captcha) — أعد المحاولة بعد قليل');
  }

  cacheSet(key, html);
  return html;
}

function categoryBrowseKeyword(categoryId = '') {
  const map = {
    '3760911': 'beauty',
    '11058281': 'makeup',
    '11060451': 'skincare',
    '11057241': 'hair care',
    '11056381': 'perfume',
    '3777891': 'beauty tools',
    '3778591': 'mens grooming',
    '11062741': 'nail polish',
    '10677469011': 'oral care',
    '3777331': 'bath body',
    '11058331': 'eyeshadow',
    '11058691': 'lipstick',
    '11059831': 'foundation',
  };
  return map[String(categoryId)] || 'beauty';
}

function searchUrl({ host, query, categoryId, page = 1 }) {
  const q = encodeURIComponent(query || categoryBrowseKeyword(categoryId));
  const node = encodeURIComponent(String(categoryId || BEAUTY_ROOT_NODE));
  const p = Math.max(1, Math.min(20, Number(page) || 1));
  // i=beauty يقيّد النتائج لقسم الجمال على amazon.com
  return `https://${host}/s?k=${q}&i=beauty&rh=n%3A${node}&page=${p}`;
}

function parseSearchCards(html = '') {
  const parts = html.split('data-component-type="s-search-result"');
  const items = [];
  const seen = new Set();

  for (let i = 1; i < parts.length; i++) {
    const prev = parts[i - 1];
    const chunk = parts[i].slice(0, 8000);
    const asin = prev.match(/data-asin="([A-Z0-9]{10})"/)?.[1]
      || chunk.match(/data-asin="([A-Z0-9]{10})"/)?.[1];
    if (!asin || seen.has(asin)) continue;
    seen.add(asin);

    const titleRaw =
      chunk.match(/<h2[^>]*>[\s\S]*?<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([^<]{3,300})<\/span>/)?.[1]
      || chunk.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([^<]{8,300})<\/span>/)?.[1]
      || chunk.match(/alt="([^"]{8,300})"/)?.[1]
      || '';
    const title = decodeHtml(titleRaw);
    if (!title || title.length < 4) continue;

    const img = chunk.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/)?.[1]
      || chunk.match(/src="(https:\/\/[^"]*images-amazon[^"]+)"/)?.[1]
      || '';

    const whole = (chunk.match(/a-price-whole">([^<]+)/)?.[1] || '').replace(/[^\d]/g, '');
    const frac = (chunk.match(/a-price-fraction">([^<]+)/)?.[1] || '').replace(/[^\d]/g, '');
    const symbol = decodeHtml(chunk.match(/a-price-symbol">([^<]+)/)?.[1] || '');
    const offscreen = decodeHtml(chunk.match(/a-price[^>]*>[\s\S]*?a-offscreen">([^<]+)/)?.[1] || '');
    let price = offscreen;
    if (!price && whole) {
      price = `${symbol || '$'}${whole}${frac ? `.${frac}` : ''}`;
    }

    items.push({
      id: asin,
      asin,
      nameEn: title,
      nameAr: title,
      brandAr: '',
      brandEn: '',
      thumb: img.replace(/\._AC_UL\d+_/, '._AC_UL500_').replace(/\._SL\d+_/, '._SL500_'),
      price,
      sku: asin,
      barcode: '',
      category: 'Beauty',
      shadeCount: 1,
      hasOptions: false,
      productUrl: `https://www.amazon.com/dp/${asin}`,
      inStock: true,
      source: 'scrape',
    });
  }

  return items;
}

function colorHexGuess(label = '') {
  const map = {
    black: '#111111', white: '#f5f5f5', red: '#c62828', pink: '#e91e63', nude: '#d2a679',
    brown: '#6d4c41', beige: '#d7ccc8', coral: '#ff7043', rose: '#ec407a', plum: '#7b1fa2',
    berry: '#ad1457', wine: '#880e4f', cherry: '#b71c1c', peach: '#ffab91', gold: '#c9a227',
  };
  const key = String(label || '').toLowerCase();
  for (const [name, hex] of Object.entries(map)) {
    if (key.includes(name)) return hex;
  }
  return '';
}

function parseVariations(html = '') {
  const shades = [];
  const seen = new Set();

  // dimensionValuesDisplayData: {"ASIN":["Color","Size"],...}
  const dimMatch = html.match(/dimensionValuesDisplayData"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/);
  if (dimMatch?.[1]) {
    try {
      const obj = JSON.parse(dimMatch[1]);
      for (const [asin, dims] of Object.entries(obj)) {
        if (!/^[A-Z0-9]{10}$/.test(asin) || seen.has(asin)) continue;
        seen.add(asin);
        const label = Array.isArray(dims) ? dims.filter(Boolean).join(' / ') : String(dims || asin);
        shades.push({
          id: asin,
          nameAr: label,
          nameEn: label,
          sku: asin,
          barcode: '',
          image: '',
          price: '',
          inStock: true,
          colorHex: colorHexGuess(label),
          optionGroup: 'التدرج',
        });
      }
    } catch { /* ignore */ }
  }

  // fallback: color_name map
  if (!shades.length) {
    const colorMatch = html.match(/"color_name"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/);
    if (colorMatch?.[1]) {
      try {
        const obj = JSON.parse(colorMatch[1]);
        for (const [label, path] of Object.entries(obj)) {
          const asin = String(path).match(/\/dp\/([A-Z0-9]{10})/)?.[1];
          if (!asin || seen.has(asin)) continue;
          seen.add(asin);
          shades.push({
            id: asin,
            nameAr: label,
            nameEn: label,
            sku: asin,
            barcode: '',
            image: '',
            price: '',
            inStock: true,
            colorHex: colorHexGuess(label),
            optionGroup: 'اللون',
          });
        }
      } catch { /* ignore */ }
    }
  }

  return shades.slice(0, 80);
}

function parseDetailHtml(html = '', asin = '') {
  const title = decodeHtml(
    html.match(/id="productTitle"[^>]*>([^<]+)/)?.[1]
    || html.match(/"title"\s*:\s*"([^"]{5,300})"/)?.[1]
    || '',
  );
  if (!title) return null;

  const brand = decodeHtml(
    html.match(/id="bylineInfo"[^>]*>([^<]+)/)?.[1]
    || html.match(/"brand"\s*:\s*"([^"]+)"/)?.[1]
    || html.match(/id="brand"[^>]*>([^<]+)/)?.[1]
    || '',
  ).replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '').replace(/^Brand:\s*/i, '');

  const price = decodeHtml(
    html.match(/class="a-price[^"]*"[^>]*>[\s\S]*?a-offscreen">([^<]+)/)?.[1]
    || html.match(/"priceAmount"\s*:\s*([0-9.]+)/)?.[1]
    || html.match(/a-price-whole">([^<]+)/)?.[1]
    || '',
  );

  const img = html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/)?.[1]
    || html.match(/"large"\s*:\s*"(https:[^"]+)"/)?.[1]
    || html.match(/id="landingImage"[^>]+src="(https:[^"]+)"/)?.[1]
    || '';

  const images = [...html.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/g)]
    .map((m) => m[1])
    .filter(Boolean);
  const uniqImages = [...new Set([img, ...images].filter(Boolean))].slice(0, 12);

  const featureBlocks = [...html.matchAll(/class="a-unordered-list a-vertical a-spacing-mini"[\s\S]*?<\/ul>/g)];
  const features = featureBlocks
    .flatMap((block) => [...block[0].matchAll(/<span[^>]*class="a-list-item"[^>]*>([^<]{10,300})<\/span>/g)])
    .map((m) => decodeHtml(m[1]))
    .filter(Boolean)
    .slice(0, 8);

  const barcode = html.match(/"ean"\s*:\s*"?(\d{8,14})"?/i)?.[1]
    || html.match(/"upc"\s*:\s*"?(\d{8,14})"?/i)?.[1]
    || html.match(/>\s*EAN\s*<[\s\S]{0,80}?>(\d{8,14})</i)?.[1]
    || html.match(/>\s*UPC\s*<[\s\S]{0,80}?>(\d{8,14})</i)?.[1]
    || '';

  const shades = parseVariations(html);
  const split = splitBilingualText(title, { mode: 'name' });

  return {
    id: asin,
    parentAsin: asin,
    sku: asin,
    barcode,
    nameAr: split?.ar || title,
    nameEn: split?.en || title,
    brandAr: brand,
    brandEn: brand,
    descriptionAr: features.join(' • '),
    descriptionEn: features.join(' • '),
    thumb: (uniqImages[0] || '').replace(/\._SL\d+_/, '._SL500_'),
    images: uniqImages,
    price: price.includes('$') || price.includes('AED') || /[^\d.]/.test(price)
      ? price
      : (price ? `$${price}` : ''),
    category: 'Beauty',
    productUrl: `https://www.amazon.com/dp/${asin}`,
    inStock: true,
    shades: shades.length
      ? shades
      : [{
        id: '0',
        nameAr: split?.ar || title,
        nameEn: split?.en || title,
        sku: asin,
        barcode,
        image: uniqImages[0] || '',
        price: price || '',
        inStock: true,
        colorHex: '',
        optionGroup: '',
      }],
    shadeCount: shades.length || 1,
    hasOptions: shades.length > 1,
    manufacturer: brand,
    manufacturerEn: brand,
    source: 'scrape',
  };
}

/** بحث/تصفح Beauty عبر صفحات Amazon HTML — بدون مفاتيح */
export async function scrapeSearchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const q = String(query || '').trim() || categoryBrowseKeyword(categoryId);
  const node = String(categoryId || BEAUTY_ROOT_NODE);
  const pageNum = Math.max(1, Math.min(20, Number(page) || 1));
  const pageSize = Math.max(1, Math.min(48, Number(limit) || 30));

  const url = searchUrl({
    host: MARKET.com.host,
    query: q,
    categoryId: node,
    page: pageNum,
  });

  const html = await fetchHtml(url, {
    lang: MARKET.com.lang,
    cacheKey: `amazon:scrape:search:${node}:${q}:${pageNum}`,
  });

  let items = parseSearchCards(html);

  // إن كانت النتائج ضعيفة، جرّب amazon.ae
  if (items.length < 4) {
    try {
      const aeUrl = `https://${MARKET.ae.host}/s?k=${encodeURIComponent(q)}&page=${pageNum}`;
      const aeHtml = await fetchHtml(aeUrl, {
        lang: MARKET.ae.lang,
        cacheKey: `amazon:scrape:ae:${q}:${pageNum}`,
      });
      const aeItems = parseSearchCards(aeHtml).map((p) => ({
        ...p,
        productUrl: `https://www.amazon.ae/dp/${p.id}`,
      }));
      if (aeItems.length > items.length) items = aeItems;
    } catch { /* ignore */ }
  }

  items = items.slice(0, pageSize);
  return {
    items,
    page: pageNum,
    pageSize,
    total: items.length + (items.length >= 16 ? pageNum * pageSize + 1 : pageNum * pageSize),
    hasMore: items.length >= 12 && pageNum < 20,
    source: 'scrape',
  };
}

export async function scrapeProductDetail(id, { light = false } = {}) {
  const asin = String(id || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) return null;

  const cacheKey = `amazon:scrape:detail:${asin}:${light ? 'l' : 'f'}`;
  const cached = cacheGet(cacheKey, DEFAULT_TTL);
  if (cached) return cached;

  const url = `https://${MARKET.com.host}/dp/${asin}`;
  const html = await fetchHtml(url, {
    lang: MARKET.com.lang,
    cacheKey: `amazon:scrape:dp:${asin}`,
    ttl: DEFAULT_TTL,
  });

  let detail = parseDetailHtml(html, asin);
  if (!detail) return null;

  // عنوان عربي من amazon.ae إن أمكن
  if (!light) {
    try {
      await sleep(200);
      const aeHtml = await fetchHtml(`https://${MARKET.ae.host}/dp/${asin}`, {
        lang: MARKET.ae.lang,
        cacheKey: `amazon:scrape:dp-ae:${asin}`,
        ttl: DEFAULT_TTL,
      });
      const arTitle = decodeHtml(aeHtml.match(/id="productTitle"[^>]*>([^<]+)/)?.[1] || '');
      if (arTitle && /[\u0600-\u06FF]/.test(arTitle)) {
        detail = { ...detail, nameAr: arTitle };
      }
    } catch { /* اختياري */ }
  }

  cacheSet(cacheKey, detail);
  return detail;
}

export async function scrapeBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  const data = await scrapeSearchProducts(digits, { page: 1, limit: 10, categoryId: BEAUTY_ROOT_NODE });
  const exact = [];
  for (const item of data.items.slice(0, 5)) {
    try {
      const detail = await scrapeProductDetail(item.id, { light: true });
      if (detail?.barcode && detail.barcode === digits) {
        exact.push({ ...detail, barcode: digits, matchType: 'ean' });
      } else {
        exact.push({ ...item, barcode: digits, matchType: 'keyword' });
      }
      if (exact.length >= 3) break;
      await sleep(250);
    } catch {
      exact.push({ ...item, barcode: digits, matchType: 'keyword' });
    }
  }
  return exact;
}

export { categoryBrowseKeyword };
