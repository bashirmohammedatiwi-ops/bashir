import { cacheGet, cacheSet } from '../../core/cache.js';
import { splitBilingualText } from '../../core/bilingual.js';
import { BEAUTY_ROOT_NODE } from './client.js';

const DEFAULT_TTL = 12 * 60 * 1000;
const DETAIL_TTL = 20 * 60 * 1000;

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];

const MARKETS = {
  ae: {
    id: 'ae',
    host: 'www.amazon.ae',
    lang: 'ar-AE,ar;q=0.9,en;q=0.8',
    cookie: 'i18n-prefs=AED; lc-acbae=ar_AE',
  },
  sa: {
    id: 'sa',
    host: 'www.amazon.sa',
    lang: 'ar-SA,ar;q=0.9,en;q=0.8',
    cookie: 'i18n-prefs=SAR; lc-acbsa=ar_AE',
  },
  com: {
    id: 'com',
    host: 'www.amazon.com',
    lang: 'en-US,en;q=0.9',
    cookie: 'i18n-prefs=USD; lc-main=en_US',
  },
};

let uaIndex = 0;
let captchaUntil = 0;

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

function nextUa() {
  uaIndex = (uaIndex + 1) % USER_AGENTS.length;
  return USER_AGENTS[uaIndex];
}

function isCaptchaHtml(html = '') {
  return /enter the characters you see|type the characters|robot check|automated access|validateCaptcha|opfcaptcha/i.test(html);
}

function isBlocked() {
  return Date.now() < captchaUntil;
}

function markCaptcha(ms = 75_000) {
  captchaUntil = Math.max(captchaUntil, Date.now() + ms);
}

/** استخراج كائن JSON متداخل بأمان من HTML أمازون */
function extractJsonObject(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = start + marker.length;
  while (i < html.length && /\s/.test(html[i])) i += 1;
  if (html[i] !== '{') return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  const from = i;
  for (; i < html.length; i += 1) {
    const ch = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(from, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function fetchHtmlOnce(url, market) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': nextUa(),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': market.lang,
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      Cookie: market.cookie || '',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(14_000),
  });
  const html = await res.text();
  if (!res.ok) {
    const err = new Error(`Amazon HTTP ${res.status}`);
    err.code = 'HTTP';
    throw err;
  }
  if (isCaptchaHtml(html)) {
    const err = new Error('captcha');
    err.code = 'CAPTCHA';
    throw err;
  }
  return html;
}

async function fetchMarketHtml(marketId, url, { ttl = DEFAULT_TTL / 2, cacheKey = '' } = {}) {
  const market = MARKETS[marketId];
  if (!market) throw new Error(`سوق غير معروف: ${marketId}`);
  const key = cacheKey || `amazon:html:${marketId}:${url}`;
  const cached = cacheGet(key, ttl);
  if (cached) return cached;

  if (isBlocked()) {
    const err = new Error('Amazon cooldown');
    err.code = 'COOLDOWN';
    throw err;
  }

  try {
    const html = await fetchHtmlOnce(url, market);
    cacheSet(key, html);
    return html;
  } catch (err) {
    if (err?.code === 'CAPTCHA') markCaptcha(75_000);
    throw err;
  }
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

function searchUrl(market, { query, categoryId, page = 1 }) {
  const q = encodeURIComponent(query || categoryBrowseKeyword(categoryId));
  const p = Math.max(1, Math.min(20, Number(page) || 1));
  if (market.id === 'com') {
    const node = encodeURIComponent(String(categoryId || BEAUTY_ROOT_NODE));
    return `https://${market.host}/s?k=${q}&i=beauty&rh=n%3A${node}&page=${p}`;
  }
  return `https://${market.host}/s?k=${q}&page=${p}`;
}

function colorHexGuess(label = '') {
  const map = {
    black: '#111111', white: '#f5f5f5', red: '#c62828', pink: '#e91e63', nude: '#d2a679',
    brown: '#6d4c41', beige: '#d7ccc8', coral: '#ff7043', rose: '#ec407a', plum: '#7b1fa2',
    berry: '#ad1457', wine: '#880e4f', cherry: '#b71c1c', peach: '#ffab91', gold: '#c9a227',
    amazonian: '#6d4c41', artist: '#c62828', lover: '#e91e63', pioneer: '#ad1457',
  };
  const key = String(label || '').toLowerCase();
  for (const [name, hex] of Object.entries(map)) {
    if (key.includes(name)) return hex;
  }
  return '';
}

function cleanShadeLabel(label = '') {
  return decodeHtml(label)
    .replace(/\s*\d+(\.\d+)?\s*(fl\.?\s*oz|ml|g|oz).*$/i, '')
    .replace(/\s*\(pack of \d+\)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasArabic(text = '') {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function hasLatin(text = '') {
  return /[A-Za-z]/.test(String(text || ''));
}

function extractBarcodeFromDetailHtml(html = '') {
  const direct = html.match(/"ean"\s*:\s*"?(\d{8,14})"?/i)?.[1]
    || html.match(/"upc"\s*:\s*"?(\d{8,14})"?/i)?.[1]
    || html.match(/"gtin"?\s*:\s*"?(\d{8,14})"?/i)?.[1];
  if (direct) return direct;

  const rows = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi)];
  for (const m of rows) {
    const key = decodeHtml(m[1].replace(/<[^>]+>/g, ''));
    const digits = String(m[2].replace(/<[^>]+>/g, '')).replace(/\D/g, '');
    if (/^(UPC|EAN|GTIN|ISBN)/i.test(key) && digits.length >= 8 && digits.length <= 14) {
      return digits;
    }
  }

  const li = html.match(/>\s*(?:EAN|UPC|GTIN)\s*<[\s\S]{0,120}?>(\d{8,14})</i)?.[1];
  return li || '';
}

function parseSearchCards(html = '', marketHost = 'www.amazon.com', lang = 'en') {
  const parts = html.split('data-component-type="s-search-result"');
  const items = [];
  const seen = new Set();

  for (let i = 1; i < parts.length; i += 1) {
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
    const title = decodeHtml(titleRaw)
      .replace(/^(Sponsored|الإعلان المدعوم|مُموَّل|ممول)\s*[-–—:]?\s*/i, '')
      .trim();
    if (!title || title.length < 4) continue;
    // تخطّى بطاقات الإعلان إن بقي وسمها في العنوان
    if (/^(Sponsored|الإعلان المدعوم)/i.test(titleRaw)) continue;

    const img = chunk.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/)?.[1]
      || chunk.match(/src="(https:\/\/[^"]*images-amazon[^"]+)"/)?.[1]
      || '';

    const whole = (chunk.match(/a-price-whole">([^<]+)/)?.[1] || '').replace(/[^\d]/g, '');
    const frac = (chunk.match(/a-price-fraction">([^<]+)/)?.[1] || '').replace(/[^\d]/g, '');
    const symbol = decodeHtml(chunk.match(/a-price-symbol">([^<]+)/)?.[1] || '');
    const offscreen = decodeHtml(chunk.match(/a-price[^>]*>[\s\S]*?a-offscreen">([^<]+)/)?.[1] || '');
    let price = offscreen;
    if (!price && whole) price = `${symbol || ''}${whole}${frac ? `.${frac}` : ''}`.trim();

    const isAr = lang === 'ar' || /[\u0600-\u06FF]/.test(title);
    items.push({
      id: asin,
      asin,
      nameAr: isAr ? title : '',
      nameEn: isAr ? '' : title,
      brandAr: '',
      brandEn: '',
      thumb: img.replace(/\._AC_UL\d+_/, '._AC_UL500_').replace(/\._SL\d+_/, '._SL500_'),
      price,
      sku: asin,
      barcode: '',
      category: 'Beauty',
      shadeCount: null,
      hasOptions: false,
      productUrl: `https://${marketHost}/dp/${asin}`,
      inStock: true,
      source: 'scrape',
    });
  }
  return items;
}

function mergeListLocales(arItems = [], enItems = []) {
  const map = new Map();

  for (const item of enItems) {
    map.set(item.id, {
      ...item,
      nameEn: hasLatin(item.nameEn) ? item.nameEn : (hasLatin(item.nameAr) ? item.nameAr : item.nameEn),
      nameAr: hasArabic(item.nameAr) ? item.nameAr : '',
    });
  }

  for (const item of arItems) {
    const prev = map.get(item.id);
    const arTitle = hasArabic(item.nameAr) ? item.nameAr : (hasArabic(item.nameEn) ? item.nameEn : '');
    const enTitle = hasLatin(item.nameEn) ? item.nameEn : (hasLatin(item.nameAr) ? item.nameAr : '');
    if (prev) {
      map.set(item.id, {
        ...prev,
        nameAr: arTitle || prev.nameAr,
        nameEn: prev.nameEn || enTitle,
        thumb: prev.thumb || item.thumb,
        price: item.price || prev.price,
        productUrl: prev.productUrl || item.productUrl,
      });
    } else {
      map.set(item.id, {
        ...item,
        nameAr: arTitle || item.nameAr || '',
        nameEn: enTitle || item.nameEn || item.nameAr || '',
      });
    }
  }

  // فضّل المنتجات المشتركة بين السوقين (أدق)، ثم الباقي
  const both = [];
  const only = [];
  const enIds = new Set(enItems.map((i) => i.id));
  const arIds = new Set(arItems.map((i) => i.id));
  for (const p of map.values()) {
    const row = {
      ...p,
      nameAr: p.nameAr || p.nameEn,
      nameEn: p.nameEn || p.nameAr,
    };
    if (enIds.has(p.id) && arIds.has(p.id)) both.push(row);
    else only.push(row);
  }
  return [...both, ...only];
}

function parseShadesFromHtml(html = '') {
  const colorToAsin = extractJsonObject(html, '"colorToAsin":') || {};
  const colorImages = extractJsonObject(html, '"colorImages":') || {};
  const dims = extractJsonObject(html, '"dimensionValuesDisplayData":') || {};

  const byAsin = new Map();

  for (const [label, info] of Object.entries(colorToAsin)) {
    const asin = String(info?.asin || info || '').toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(asin)) continue;
    const imgs = colorImages[label] || [];
    const image = imgs[0]?.hiRes || imgs[0]?.large || imgs[0]?.thumb || '';
    const clean = cleanShadeLabel(label);
    byAsin.set(asin, {
      id: asin,
      nameAr: clean,
      nameEn: clean,
      sku: asin,
      barcode: '',
      image: String(image).replace(/\._SL\d+_/, '._SL500_'),
      price: '',
      inStock: true,
      colorHex: colorHexGuess(clean),
      optionGroup: 'التدرج',
    });
  }

  for (const [asin, dimsArr] of Object.entries(dims)) {
    if (!/^[A-Z0-9]{10}$/.test(asin)) continue;
    const label = Array.isArray(dimsArr) ? cleanShadeLabel(dimsArr.filter(Boolean).join(' / ')) : cleanShadeLabel(dimsArr);
    const prev = byAsin.get(asin);
    if (prev) {
      if (label && label.length > 1) {
        prev.nameEn = label;
        if (!/[\u0600-\u06FF]/.test(prev.nameAr)) prev.nameAr = label;
      }
    } else {
      byAsin.set(asin, {
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
  }

  // fallback color_name map
  if (!byAsin.size) {
    const colorName = extractJsonObject(html, '"color_name":') || {};
    for (const [label, path] of Object.entries(colorName)) {
      const asin = String(path).match(/\/dp\/([A-Z0-9]{10})/)?.[1];
      if (!asin) continue;
      const clean = cleanShadeLabel(label);
      byAsin.set(asin, {
        id: asin,
        nameAr: clean,
        nameEn: clean,
        sku: asin,
        barcode: '',
        image: '',
        price: '',
        inStock: true,
        colorHex: colorHexGuess(clean),
        optionGroup: 'اللون',
      });
    }
  }

  return [...byAsin.values()];
}

function parseDetailCore(html = '', asin = '', marketHost = 'www.amazon.com') {
  const title = decodeHtml(
    html.match(/id="productTitle"[^>]*>([^<]+)/)?.[1]
    || html.match(/"title"\s*:\s*"([^"]{5,300})"/)?.[1]
    || '',
  );
  if (!title) return null;

  const brand = decodeHtml(
    html.match(/id="bylineInfo"[^>]*>([^<]+)/)?.[1]
    || html.match(/"brand"\s*:\s*"([^"]+)"/)?.[1]
    || '',
  ).replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '').replace(/^Brand:\s*/i, '')
    .replace(/^العلامة التجارية:\s*/i, '');

  const price = decodeHtml(
    html.match(/class="a-price[^"]*"[^>]*>[\s\S]*?a-offscreen">([^<]+)/)?.[1]
    || html.match(/a-price-whole">([^<]+)/)?.[1]
    || '',
  );

  const img = html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/)?.[1]
    || html.match(/"large"\s*:\s*"(https:[^"]+)"/)?.[1]
    || html.match(/id="landingImage"[^>]+src="(https:[^"]+)"/)?.[1]
    || '';

  const images = [...html.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/g)].map((m) => m[1]).filter(Boolean);
  const uniqImages = [...new Set([img, ...images].filter(Boolean))].slice(0, 12);

  const featureBlocks = [...html.matchAll(/class="a-unordered-list a-vertical a-spacing-mini"[\s\S]*?<\/ul>/g)];
  const features = featureBlocks
    .flatMap((block) => [...block[0].matchAll(/<span[^>]*class="a-list-item"[^>]*>([^<]{10,300})<\/span>/g)])
    .map((m) => decodeHtml(m[1]))
    .filter(Boolean)
    .slice(0, 8);

  const barcode = extractBarcodeFromDetailHtml(html);
  const shades = parseShadesFromHtml(html);
  const isAr = hasArabic(title);

  return {
    id: asin,
    parentAsin: asin,
    sku: asin,
    barcode,
    nameAr: isAr ? title : '',
    nameEn: isAr ? '' : title,
    brandAr: brand,
    brandEn: brand,
    descriptionAr: isAr ? features.join(' • ') : '',
    descriptionEn: isAr ? '' : features.join(' • '),
    thumb: (uniqImages[0] || '').replace(/\._SL\d+_/, '._SL500_'),
    images: uniqImages,
    price,
    category: 'Beauty',
    productUrl: `https://${marketHost}/dp/${asin}`,
    inStock: true,
    shades,
    source: 'scrape',
  };
}

function mergeShadeLocales(enShades = [], arShades = []) {
  const byId = new Map();

  const put = (s, preferLang) => {
    const prev = byId.get(s.id) || {
      id: s.id,
      nameAr: '',
      nameEn: '',
      sku: s.sku || s.id,
      barcode: '',
      image: '',
      price: '',
      inStock: true,
      colorHex: s.colorHex || '',
      optionGroup: s.optionGroup || 'التدرج',
    };

    const ar = hasArabic(s.nameAr) ? s.nameAr : (hasArabic(s.nameEn) ? s.nameEn : '');
    const en = hasLatin(s.nameEn) ? s.nameEn : (hasLatin(s.nameAr) ? s.nameAr : '');

    byId.set(s.id, {
      ...prev,
      nameAr: ar || prev.nameAr,
      nameEn: en || prev.nameEn,
      image: prev.image || s.image || '',
      barcode: prev.barcode || s.barcode || '',
      price: prev.price || s.price || '',
      colorHex: prev.colorHex || s.colorHex || colorHexGuess(en || ar),
      optionGroup: prev.optionGroup || s.optionGroup || 'التدرج',
      _prefer: preferLang,
    });
  };

  for (const s of enShades) put(s, 'en');
  for (const s of arShades) put(s, 'ar');

  return [...byId.values()].map((s) => ({
    id: s.id,
    nameAr: s.nameAr || s.nameEn,
    nameEn: s.nameEn || s.nameAr,
    sku: s.sku || s.id,
    barcode: s.barcode || '',
    image: s.image || '',
    price: s.price || '',
    inStock: true,
    colorHex: s.colorHex || '',
    optionGroup: s.optionGroup || 'التدرج',
  }));
}

async function enrichShadeDetails(shades = [], { deadline = 0, concurrency = 8, max = 80 } = {}) {
  // أبقِ كل التدرجات — أثْرِ أول N فقط (باركود/سعر) دون حذف الباقي
  const out = shades.map((s) => ({ ...s }));
  const limit = Math.min(out.length, max);

  for (let i = 0; i < limit; i += concurrency) {
    if (deadline && Date.now() > deadline) break;
    const chunk = out.slice(i, Math.min(i + concurrency, limit));
    const parts = await Promise.all(chunk.map(async (shade, idx) => {
      const index = i + idx;
      const cacheKey = `amazon:shade:v2:${shade.id}`;
      const cached = cacheGet(cacheKey, DETAIL_TTL);
      if (cached) return { index, ...cached };

      try {
        let html = '';
        try {
          html = await fetchMarketHtml('ae', `https://${MARKETS.ae.host}/dp/${shade.id}`, {
            ttl: DETAIL_TTL,
            cacheKey: `amazon:dp:ae:${shade.id}`,
          });
        } catch {
          html = await fetchMarketHtml('com', `https://${MARKETS.com.host}/dp/${shade.id}`, {
            ttl: DETAIL_TTL,
            cacheKey: `amazon:dp:com:${shade.id}`,
          });
        }
        const barcode = extractBarcodeFromDetailHtml(html);
        const price = decodeHtml(
          html.match(/class="a-price[^"]*"[^>]*>[\s\S]*?a-offscreen">([^<]+)/)?.[1] || '',
        );
        const thumb = html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/)?.[1]
          || html.match(/"large"\s*:\s*"(https:[^"]+)"/)?.[1]
          || '';
        const patch = {
          barcode,
          price: price || shade.price || '',
          image: shade.image || thumb.replace(/\._SL\d+_/, '._SL500_') || '',
        };
        cacheSet(cacheKey, patch);
        return { index, ...patch };
      } catch {
        return { index };
      }
    }));

    for (const p of parts) {
      if (p.index == null) continue;
      out[p.index] = {
        ...out[p.index],
        barcode: p.barcode || out[p.index].barcode || '',
        price: p.price || out[p.index].price || '',
        image: p.image || out[p.index].image || '',
      };
    }
  }

  return out;
}

async function searchOneMarket(marketId, query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const market = MARKETS[marketId];
  const q = String(query || '').trim() || categoryBrowseKeyword(categoryId);
  const pageNum = Math.max(1, Math.min(20, Number(page) || 1));
  const url = searchUrl(market, { query: q, categoryId, page: pageNum });
  const html = await fetchMarketHtml(marketId, url, {
    cacheKey: `amazon:search:${marketId}:${categoryId || 'root'}:${q}:${pageNum}`,
  });
  const lang = marketId === 'com' ? 'en' : 'ar';
  return parseSearchCards(html, market.host, lang).slice(0, limit);
}

/** بحث ثنائي اللغة سريع: ae/sa (عربي) + com (إنجليزي) بالتوازي */
export async function scrapeSearchProducts(query, { page = 1, limit = 30, categoryId = '' } = {}) {
  const q = String(query || '').trim() || categoryBrowseKeyword(categoryId);
  const node = String(categoryId || BEAUTY_ROOT_NODE);
  const pageNum = Math.max(1, Math.min(20, Number(page) || 1));
  const pageSize = Math.max(1, Math.min(48, Number(limit) || 30));

  try {
    const settled = await Promise.allSettled([
      searchOneMarket('ae', q, { page: pageNum, limit: pageSize, categoryId: node }),
      searchOneMarket('sa', q, { page: pageNum, limit: pageSize, categoryId: node }),
      searchOneMarket('com', q, { page: pageNum, limit: pageSize, categoryId: node }),
    ]);

    const aeItems = settled[0].status === 'fulfilled' ? settled[0].value : [];
    const saItems = settled[1].status === 'fulfilled' ? settled[1].value : [];
    const enItems = settled[2].status === 'fulfilled' ? settled[2].value : [];
    const arItems = aeItems.length >= saItems.length ? aeItems : saItems;
    // ادمج السوقين العربيين أيضاً
    const arMerged = mergeListLocales(aeItems, saItems);

    if (!arMerged.length && !enItems.length && !arItems.length) {
      const blocked = settled.some((s) => s.status === 'rejected' && /captcha|cooldown/i.test(s.reason?.code || s.reason?.message || ''));
      return {
        items: [],
        page: pageNum,
        pageSize,
        total: 0,
        hasMore: false,
        source: 'scrape',
        softBlocked: blocked,
        message: blocked ? 'Amazon مؤقتاً محدود — يُعرض الفهرس المحلي إن وُجد' : undefined,
      };
    }

    const items = mergeListLocales(arMerged.length ? arMerged : arItems, enItems).slice(0, pageSize);
    const markets = [
      aeItems.length ? 'ae' : '',
      saItems.length ? 'sa' : '',
      enItems.length ? 'com' : '',
    ].filter(Boolean).join('+');

    return {
      items,
      page: pageNum,
      pageSize,
      total: items.length + (items.length >= 16 ? pageNum * pageSize + 1 : pageNum * pageSize),
      hasMore: items.length >= 12 && pageNum < 20,
      source: 'scrape',
      market: markets || 'none',
    };
  } catch (err) {
    if (err?.code === 'CAPTCHA' || err?.code === 'COOLDOWN') {
      return {
        items: [],
        page: pageNum,
        pageSize,
        total: 0,
        hasMore: false,
        source: 'scrape',
        softBlocked: true,
        message: 'Amazon مؤقتاً محدود — يُعرض الفهرس المحلي إن وُجد',
      };
    }
    throw err;
  }
}

export async function scrapeProductDetail(id, { light = false } = {}) {
  const asin = String(id || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) return null;

  const cacheKey = `amazon:detail:v3:${asin}:${light ? 'l' : 'f'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  const settled = await Promise.allSettled([
    fetchMarketHtml('ae', `https://${MARKETS.ae.host}/dp/${asin}`, {
      ttl: DETAIL_TTL,
      cacheKey: `amazon:dp:ae:${asin}`,
    }),
    fetchMarketHtml('com', `https://${MARKETS.com.host}/dp/${asin}`, {
      ttl: DETAIL_TTL,
      cacheKey: `amazon:dp:com:${asin}`,
    }),
  ]);

  let aeHtml = settled[0].status === 'fulfilled' ? settled[0].value : '';
  const comHtml = settled[1].status === 'fulfilled' ? settled[1].value : '';

  // إن فشل ae أو بلا عنوان عربي — جرّب sa
  if (!aeHtml || !hasArabic(aeHtml.match(/id="productTitle"[^>]*>([^<]+)/)?.[1] || '')) {
    try {
      const saHtml = await fetchMarketHtml('sa', `https://${MARKETS.sa.host}/dp/${asin}`, {
        ttl: DETAIL_TTL,
        cacheKey: `amazon:dp:sa:${asin}`,
      });
      if (hasArabic(saHtml.match(/id="productTitle"[^>]*>([^<]+)/)?.[1] || '')) {
        aeHtml = saHtml;
      } else if (!aeHtml) {
        aeHtml = saHtml;
      }
    } catch { /* اختياري */ }
  }

  if (!aeHtml && !comHtml) return null;

  const ae = aeHtml ? parseDetailCore(aeHtml, asin, MARKETS.ae.host) : null;
  const en = comHtml ? parseDetailCore(comHtml, asin, MARKETS.com.host) : null;
  const primary = en || ae;
  if (!primary) return null;

  let shades = mergeShadeLocales(en?.shades || [], ae?.shades || []);
  if (!shades.length) {
    shades = [{
      id: asin,
      nameAr: ae?.nameAr || primary.nameEn || primary.nameAr,
      nameEn: en?.nameEn || primary.nameEn || primary.nameAr,
      sku: asin,
      barcode: primary.barcode || ae?.barcode || '',
      image: primary.thumb,
      price: primary.price || ae?.price || '',
      inStock: true,
      colorHex: '',
      optionGroup: '',
    }];
  }

  // إثراء التدرجات: باركود + سعر (عند الاستيراد الكامل) — دون حذف أي درجة
  if (!light && shades.length > 1) {
    const deadline = Date.now() + 14_000;
    shades = await enrichShadeDetails(shades, {
      deadline,
      concurrency: 8,
      max: shades.length,
    });
  } else if (shades.length === 1) {
    shades[0].barcode = shades[0].barcode || primary.barcode || ae?.barcode || '';
    shades[0].price = shades[0].price || primary.price || ae?.price || '';
  }

  const nameAr = (ae?.nameAr && hasArabic(ae.nameAr) ? ae.nameAr : '')
    || (hasArabic(primary.nameAr) ? primary.nameAr : '')
    || ae?.nameAr
    || primary.nameAr
    || primary.nameEn;
  const nameEn = (en?.nameEn && hasLatin(en.nameEn) ? en.nameEn : '')
    || (hasLatin(primary.nameEn) ? primary.nameEn : '')
    || en?.nameEn
    || primary.nameEn
    || nameAr;

  const detail = {
    id: asin,
    parentAsin: asin,
    sku: asin,
    barcode: primary.barcode || ae?.barcode || shades.find((s) => s.barcode)?.barcode || '',
    nameAr,
    nameEn,
    brandAr: ae?.brandAr || en?.brandAr || '',
    brandEn: en?.brandEn || ae?.brandEn || '',
    descriptionAr: ae?.descriptionAr || en?.descriptionEn || '',
    descriptionEn: en?.descriptionEn || ae?.descriptionAr || '',
    thumb: en?.thumb || ae?.thumb || '',
    images: [...new Set([...(en?.images || []), ...(ae?.images || [])])].slice(0, 12),
    price: en?.price || ae?.price || '',
    category: 'Beauty',
    productUrl: `https://www.amazon.com/dp/${asin}`,
    productUrlAr: `https://www.amazon.ae/dp/${asin}`,
    inStock: true,
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1,
    manufacturer: ae?.brandAr || en?.brandAr || '',
    manufacturerEn: en?.brandEn || ae?.brandEn || '',
    source: 'scrape',
  };

  cacheSet(cacheKey, detail);
  return detail;
}

export async function scrapeBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  const data = await scrapeSearchProducts(digits, { page: 1, limit: 12, categoryId: BEAUTY_ROOT_NODE });
  if (data.softBlocked || !data.items?.length) return [];

  const hits = [];
  for (const item of data.items.slice(0, 6)) {
    try {
      const detail = await scrapeProductDetail(item.id, { light: false });
      if (!detail) {
        hits.push({ ...item, barcode: digits, matchType: 'keyword' });
        continue;
      }
      const shadeHit = detail.shades?.find((s) => s.barcode === digits);
      if (detail.barcode === digits || shadeHit) {
        hits.push({
          ...detail,
          barcode: digits,
          shadeName: shadeHit?.nameAr || shadeHit?.nameEn || '',
          matchType: 'ean',
          shadeCount: detail.shadeCount,
        });
      } else {
        hits.push({
          id: detail.id,
          nameAr: detail.nameAr,
          nameEn: detail.nameEn,
          brandAr: detail.brandAr,
          thumb: detail.thumb,
          price: detail.price,
          barcode: digits,
          matchType: 'keyword',
          shadeCount: detail.shadeCount,
        });
      }
      if (hits.some((h) => h.matchType === 'ean')) break;
      await sleep(200);
    } catch {
      hits.push({ ...item, barcode: digits, matchType: 'keyword' });
    }
  }

  const exact = hits.filter((h) => h.matchType === 'ean');
  return exact.length ? exact : hits.slice(0, 3);
}

export function amazonScrapeStatus() {
  return {
    blocked: isBlocked(),
    cooldownMs: Math.max(0, captchaUntil - Date.now()),
  };
}

export { categoryBrowseKeyword };
