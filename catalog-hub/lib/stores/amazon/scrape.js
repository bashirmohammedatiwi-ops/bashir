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

/**
 * توحيد صور أمازون — يزيل قصّ CR/SS الصغير الذي يظهر مكبراً بشكل غريب،
 * ويعيد رابط عرض كامل بخلفية بيضاء (_AC_SL).
 */
export function normalizeAmazonImageUrl(url = '', size = 500) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  const dim = Math.max(200, Math.min(1500, Number(size) || 500));

  const id = raw.match(/\/images\/I\/([A-Za-z0-9%+-]+)/i)?.[1]
    || raw.match(/\/I\/([A-Za-z0-9%+-]+)\./i)?.[1];
  if (id) {
    const cleanId = id.replace(/\._[^.]+$/, '');
    return `https://m.media-amazon.com/images/I/${cleanId}._AC_SL${dim}_.jpg`;
  }

  return raw
    .replace(/\._(?:AC_)?(?:US|SS|SX|SY|UX|UY|CR|UL|SL)\d+(?:,\d+)*(?:_CR[,\d]+)?_/gi, `._AC_SL${dim}_`)
    .replace(/\._SL\d+_/g, `._AC_SL${dim}_`);
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

/** تخمين لون فقط عندما يكون الاسم لوناً بسيطاً واضحاً — لا تُخمّن أسماء التدرجات التسويقية */
function colorHexGuess(label = '') {
  const key = String(label || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s/-]+/g, ' ').trim();
  if (!key || key.length > 28) return '';

  const exact = {
    black: '#111111', 'أسود': '#111111', 'اسود': '#111111',
    white: '#f5f5f5', 'أبيض': '#f5f5f5', 'ابيض': '#f5f5f5',
    red: '#c62828', 'أحمر': '#c62828', 'احمر': '#c62828',
    pink: '#e91e63', 'وردي': '#e91e63',
    nude: '#d2a679', brown: '#6d4c41', 'بني': '#6d4c41',
    beige: '#d7ccc8', coral: '#ff7043', rose: '#ec407a',
    plum: '#7b1fa2', berry: '#ad1457', wine: '#880e4f',
    cherry: '#b71c1c', peach: '#ffab91', gold: '#c9a227',
    'ذهبي': '#c9a227', clear: '#eeeeee', transparent: '#eeeeee',
    'black/brown': '#3e2723', 'black-brown': '#3e2723',
  };
  if (exact[key]) return exact[key];

  // كلمة لون واحدة فقط (مثل "Black" أو "أسود") — ليس "Black Honey"
  const tokens = key.split(/[\s/-]+/).filter(Boolean);
  if (tokens.length === 1 && exact[tokens[0]]) return exact[tokens[0]];
  return '';
}

function cleanShadeLabel(label = '') {
  return decodeHtml(String(label || ''))
    .replace(/\\+/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/\s*[-–—]\s*$/g, '')
    .replace(/\s*\d+(\.\d+)?\s*(fl\.?\s*oz|ml|g|oz).*$/i, '')
    .replace(/\s*\(pack of \d+\)/i, '')
    .replace(/\s*\(عبوة من[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const JUNK_SHADE_NAMES = /^(square|round|oval|rectangle|default|select|choose|n\/a|none|null|undefined|color|colour|shade|size|style)$/i;

function isUsableShadeName(value = '') {
  const v = cleanShadeLabel(value);
  if (!v || v.length < 2 || v.length > 60) return false;
  if (JUNK_SHADE_NAMES.test(v)) return false;
  if (/^[A-Z0-9]{10}$/.test(v)) return false; // ASIN
  return true;
}

/** استخرج اسم اللون المختار من صفحة التدرج */
function extractSelectedColorName(html = '') {
  const candidates = [];

  const selected = html.match(
    /"selected_variations"\s*:\s*\{[^}]{0,300}"color_name"\s*:\s*"([^"]+)"/i,
  )?.[1];
  if (selected) candidates.push(selected);

  const twisterText =
    html.match(/id="inline-twister-expanded-dimension-text-color_name"[^>]*>\s*([^<]{1,80})/i)?.[1]
    || html.match(/id="variation_color_name"[\s\S]{0,500}?class="selection"[^>]*>\s*([^<]{1,80})/i)?.[1];
  if (twisterText) candidates.push(twisterText);

  // من جدول المواصفات فقط (لا تأخذ display_string العام — غالباً SQUARE/شكل السواتش)
  const rows = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi)];
  for (const m of rows) {
    const key = decodeHtml(m[1].replace(/<[^>]+>/g, '')).trim();
    const val = decodeHtml(m[2].replace(/<[^>]+>/g, '')).trim();
    if (/^(color|colour|shade|لون|اللون)$/i.test(key)) candidates.push(val);
  }

  for (const raw of candidates) {
    const clean = cleanShadeLabel(raw);
    if (isUsableShadeName(clean)) return clean;
  }
  return '';
}

/** لون السواتش من CSS إن وُجد على صفحة المنتج */
function extractSwatchHexFromHtml(html = '', shadeLabel = '') {
  const label = String(shadeLabel || '').trim();
  if (label) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const near = html.match(new RegExp(
      `${esc}[\\s\\S]{0,240}?background(?:-color)?\\s*:\\s*(#[0-9a-fA-F]{3,8})`,
      'i',
    ))?.[1];
    if (near) return near.length === 4
      ? `#${near[1]}${near[1]}${near[2]}${near[2]}${near[3]}${near[3]}`
      : near;
  }

  // twister swatch style
  const swatch = html.match(
    /(?:twister|swatch)[^>]{0,120}style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i,
  )?.[1];
  if (swatch) {
    return swatch.length === 4
      ? `#${swatch[1]}${swatch[1]}${swatch[2]}${swatch[2]}${swatch[3]}${swatch[3]}`
      : swatch;
  }
  return '';
}

function hasArabic(text = '') {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function hasLatin(text = '') {
  return /[A-Za-z]/.test(String(text || ''));
}

function uniqBarcodes(candidates = []) {
  const out = new Set();
  for (const raw of candidates) {
    const text = String(raw || '');
    // خلية أمازون قد تحتوي عدة UPC مفصولة بمسافة: "883542158732 020714952976"
    const parts = text.match(/\d{8,14}/g) || [];
    const list = parts.length
      ? parts
      : (() => {
        const digits = text.replace(/\D/g, '');
        return digits.length >= 8 && digits.length <= 14 ? [digits] : [];
      })();

    for (const d of list) {
      if (d.length < 8 || d.length > 14) continue;
      // تجاهل أرقام غير قياسية (11 رقم) إلا إن كانت جزءاً من UPC معروف
      if (d.length === 9 || d.length === 10 || d.length === 11) continue;
      out.add(d);
      // أضف أيضاً الشكل المعياري UPC-12 من GTIN-14 المبطّن
      if (d.length === 14 && d.startsWith('00')) out.add(d.slice(2));
      if (d.length === 13 && d.startsWith('0')) out.add(d.slice(1));
    }
  }
  return [...out];
}

function pickBestBarcode(candidates = []) {
  const uniq = uniqBarcodes(candidates);
  if (!uniq.length) return '';
  // فضّل UPC-12 ثم EAN-13، وتجنّب GTIN-14 المبطّن بأصفار إن وُجد الأصل
  const score = (d) => {
    if (d.length === 12) return 300;
    if (d.length === 13) return 280;
    if (d.length === 14 && d.startsWith('0')) return 100;
    if (d.length === 8) return 80;
    return 50 + d.length;
  };
  return [...uniq].sort((a, b) => score(b) - score(a) || a.localeCompare(b))[0];
}

/** كل الباركودات الظاهرة في صفحة المنتج (قد يكون أكثر من UPC) */
export function extractAllBarcodesFromDetailHtml(html = '') {
  const found = [];

  for (const re of [
    /"ean"\s*:\s*"?(\d{8,14})"?/gi,
    /"upc"\s*:\s*"?(\d{8,14})"?/gi,
    /"gtin(?:13|12|14)?"\s*:\s*"?(\d{8,14})"?/gi,
    /"isbn"\s*:\s*"?(\d{8,14})"?/gi,
  ]) {
    for (const m of html.matchAll(re)) found.push(m[1]);
  }

  const rows = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi)];
  for (const m of rows) {
    const key = decodeHtml(m[1].replace(/<[^>]+>/g, ''));
    const cell = decodeHtml(m[2].replace(/<[^>]+>/g, ''));
    if (/upc|ean|gtin|isbn|باركود|الباركود/i.test(key)) {
      found.push(cell); // قد يحتوي عدة أرقام
    }
  }

  for (const m of html.matchAll(
    /(?:EAN|UPC|GTIN|ISBN|باركود)\s*[:：]?\s*<\/?(?:span|td|th|li|b)?[^>]*>\s*([^<]{8,80})/gi,
  )) {
    found.push(m[1]);
  }
  for (const m of html.matchAll(/>\s*(?:EAN|UPC|GTIN|ISBN)\s*<[\s\S]{0,200}?>([^<]{8,80})</gi)) {
    found.push(m[1]);
  }
  for (const m of html.matchAll(/\b(?:UPC|EAN|GTIN)\b[^0-9]{0,40}([\d\s]{8,40})/gi)) {
    found.push(m[1]);
  }

  // صفوف product details بقيم متعددة
  for (const m of html.matchAll(
    /(?:prodDetAttrValue|voyager-ns-desktop-table-value)[^>]*>\s*([\d\s]{8,40})\s*</gi,
  )) {
    found.push(m[1]);
  }

  return uniqBarcodes(found);
}

function extractBarcodeFromDetailHtml(html = '') {
  return pickBestBarcode(extractAllBarcodesFromDetailHtml(html));
}

function barcodeMatches(target = '', candidates = []) {
  const wanted = new Set();
  const push = (v) => {
    const d = String(v || '').replace(/\D/g, '');
    if (d.length < 8) return;
    wanted.add(d);
    wanted.add(d.replace(/^0+/, '') || d);
    if (d.length === 12) wanted.add(`0${d}`);
    if (d.length === 13 && d.startsWith('0')) wanted.add(d.slice(1));
  };
  push(target);
  for (const c of candidates) {
    const d = String(c || '').replace(/\D/g, '');
    if (!d) continue;
    if (wanted.has(d) || wanted.has(d.replace(/^0+/, '') || d)) return true;
    if (d.length === 12 && wanted.has(`0${d}`)) return true;
    if (d.length === 13 && d.startsWith('0') && wanted.has(d.slice(1))) return true;
  }
  return false;
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
      thumb: normalizeAmazonImageUrl(img, 500),
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

function putShade(byAsin, asin, patch = {}) {
  const id = String(asin || '').toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(id)) return;
  const prev = byAsin.get(id) || {
    id,
    nameAr: '',
    nameEn: '',
    sku: id,
    barcode: '',
    image: '',
    price: '',
    inStock: true,
    colorHex: '',
    optionGroup: 'التدرج',
  };
  const name = cleanShadeLabel(patch.nameEn || patch.nameAr || '');
  byAsin.set(id, {
    ...prev,
    ...patch,
    id,
    sku: id,
    nameEn: (name && hasLatin(name) ? name : '') || prev.nameEn || name,
    nameAr: (name && hasArabic(name) ? name : '') || prev.nameAr || name || prev.nameEn,
    image: normalizeAmazonImageUrl(patch.image || prev.image || '', 500),
    colorHex: patch.colorHex || prev.colorHex || '',
    optionGroup: patch.optionGroup || prev.optionGroup || 'التدرج',
  });
}

function decodeDataAState(raw = '') {
  try {
    const text = String(raw || '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mergeEmbeddedTwisterJson(html = '') {
  const colorToAsin = {};
  const colorImages = {};
  const variationValues = {};
  const dimToAsin = {};
  const dims = {};
  const asinVariationValues = {};
  const displayLabels = {};

  const mergeObj = (target, src) => {
    if (!src || typeof src !== 'object') return;
    Object.assign(target, src);
  };

  const absorb = (obj = {}) => {
    mergeObj(colorToAsin, obj.colorToAsin);
    mergeObj(colorImages, obj.colorImages);
    mergeObj(variationValues, obj.variationValues);
    mergeObj(dimToAsin, obj.dimensionToAsinMap);
    mergeObj(dims, obj.dimensionValuesDisplayData);
    mergeObj(asinVariationValues, obj.asinVariationValues);
    mergeObj(displayLabels, obj.variationDisplayLabels);
  };

  absorb({ colorToAsin: extractJsonObject(html, '"colorToAsin":') });
  absorb({ colorImages: extractJsonObject(html, '"colorImages":') });
  absorb({ variationValues: extractJsonObject(html, '"variationValues":') });
  absorb({ dimensionToAsinMap: extractJsonObject(html, '"dimensionToAsinMap":') });
  absorb({ dimensionValuesDisplayData: extractJsonObject(html, '"dimensionValuesDisplayData":') });
  absorb({ asinVariationValues: extractJsonObject(html, '"asinVariationValues":') });
  absorb({ variationDisplayLabels: extractJsonObject(html, '"variationDisplayLabels":') });

  for (const m of html.matchAll(/data-a-state="([^"]+)"/g)) {
    absorb(decodeDataAState(m[1]));
  }

  // كتل JSON إضافية داخل السكربت
  for (const marker of ['"colorToAsin":', '"colorImages":', '"variationValues":']) {
    let pos = 0;
    while (pos < html.length) {
      const idx = html.indexOf(marker, pos);
      if (idx < 0) break;
      const obj = extractJsonObject(html.slice(idx), marker);
      if (marker.includes('colorToAsin')) mergeObj(colorToAsin, obj);
      else if (marker.includes('colorImages')) mergeObj(colorImages, obj);
      else if (marker.includes('variationValues')) mergeObj(variationValues, obj);
      pos = idx + marker.length;
    }
  }

  return { colorToAsin, colorImages, variationValues, dimToAsin, dims, asinVariationValues, displayLabels };
}

function detectColorDimensionKey(variationValues = {}, displayLabels = {}) {
  const keys = Object.keys(variationValues);
  for (const key of keys) {
    const label = String(displayLabels[key] || key).toLowerCase();
    if (/color|colour|shade|لون/i.test(label) || /color_name|colour_name/i.test(key)) {
      return key;
    }
  }
  for (const key of keys) {
    if (/size|scent|style|pattern|count|quantity/i.test(key)) continue;
    const vals = variationValues[key];
    if (Array.isArray(vals) && vals.length > 1) return key;
  }
  return keys.find((k) => Array.isArray(variationValues[k]) && variationValues[k].length > 1) || keys[0] || 'color_name';
}

function colorImageForLabel(colorImages = {}, label = '') {
  const clean = cleanShadeLabel(label);
  const direct = colorImages[label] || colorImages[clean];
  const pick = (entry) => {
    const imgs = Array.isArray(entry) ? entry : (entry ? [entry] : []);
    const first = imgs[0] || {};
    return first.hiRes || first.large || first.thumb || first.main?.['500'] || first.main || '';
  };
  if (direct) return pick(direct);
  for (const [key, entry] of Object.entries(colorImages)) {
    if (cleanShadeLabel(key) === clean) return pick(entry);
  }
  return '';
}

function parseTwisterHtmlSwatches(html = '', byAsin) {
  const blocks = [
    html.match(/id="variation_color_name"[\s\S]{0,25000}?<\/ul>/i)?.[0] || '',
    html.match(/id="inline-twister-dim-values-container"[\s\S]{0,25000}?<\/ul>/i)?.[0] || '',
    html.match(/id="tp-inline-twister-dim-values-container"[\s\S]{0,25000}?<\/ul>/i)?.[0] || '',
    html.match(/class="[^"]*twister[^"]*"[\s\S]{0,25000}/i)?.[0] || '',
  ].filter(Boolean);

  const seen = new Set();
  for (const block of blocks) {
    for (const m of block.matchAll(/<li\b[^>]*data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)<\/li>/gi)) {
      const asin = m[1];
      const inner = m[2];
      if (seen.has(asin)) continue;
      seen.add(asin);
      const label = cleanShadeLabel(
        inner.match(/(?:title|aria-label|alt)="([^"]{1,80})"/i)?.[1]
        || inner.match(/class="[^"]*swatch-title[^"]*"[^>]*>\s*([^<]{1,80})/i)?.[1]
        || '',
      );
      const img = inner.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i)?.[1]
        || inner.match(/src="(https:\/\/[^"]*images-amazon[^"]+)"/i)?.[1]
        || '';
      if (!isUsableShadeName(label) && !img) continue;
      putShade(byAsin, asin, {
        nameEn: label,
        nameAr: label,
        image: img,
        colorHex: img ? '' : colorHexGuess(label),
      });
    }

    for (const m of block.matchAll(/data-asin="([A-Z0-9]{10})"[^>]{0,500}?(?:title|aria-label|alt)="([^"]{1,80})"/gi)) {
      const label = cleanShadeLabel(m[2]);
      if (!isUsableShadeName(label)) continue;
      if (/click to select|اختر|select/i.test(label)) continue;
      putShade(byAsin, m[1], {
        nameEn: label,
        nameAr: label,
        colorHex: colorHexGuess(label),
      });
    }
    for (const m of block.matchAll(/(?:title|aria-label|alt)="([^"]{1,80})"[^>]{0,500}?data-asin="([A-Z0-9]{10})"/gi)) {
      const label = cleanShadeLabel(m[1]);
      if (!isUsableShadeName(label)) continue;
      putShade(byAsin, m[2], {
        nameEn: label,
        nameAr: label,
        colorHex: colorHexGuess(label),
      });
    }
  }
}

function parseShadesFromHtml(html = '') {
  const {
    colorToAsin,
    colorImages,
    variationValues,
    dimToAsin,
    dims,
    asinVariationValues,
    displayLabels,
  } = mergeEmbeddedTwisterJson(html);

  const byAsin = new Map();
  const colorKey = detectColorDimensionKey(variationValues, displayLabels);
  const colorNames = variationValues[colorKey] || variationValues.color_name || variationValues.color || [];
  const colorDimIndex = Math.max(0, Object.keys(variationValues).indexOf(colorKey));

  for (const [label, info] of Object.entries(colorToAsin)) {
    const asin = String(info?.asin || info || '').toUpperCase();
    const clean = cleanShadeLabel(label);
    const image = colorImageForLabel(colorImages, label);
    putShade(byAsin, asin, {
      nameEn: clean,
      nameAr: clean,
      image,
      colorHex: image ? '' : colorHexGuess(clean),
      optionGroup: 'التدرج',
    });
  }

  for (const [label, entry] of Object.entries(colorImages)) {
    const clean = cleanShadeLabel(label);
    if (!clean) continue;
    let asin = String(colorToAsin[label]?.asin || colorToAsin[label] || '').toUpperCase();
    if (!asin) {
      for (const [candidateAsin, dimsArr] of Object.entries(dims)) {
        const dimsLabel = Array.isArray(dimsArr)
          ? cleanShadeLabel(dimsArr.filter(Boolean).join(' / '))
          : cleanShadeLabel(dimsArr);
        if (dimsLabel === clean || dimsLabel.endsWith(` / ${clean}`) || dimsLabel.startsWith(`${clean} /`)) {
          asin = String(candidateAsin).toUpperCase();
          break;
        }
      }
    }
    if (!asin) continue;
    const image = colorImageForLabel(colorImages, label);
    putShade(byAsin, asin, {
      nameEn: clean,
      nameAr: clean,
      image,
      colorHex: image ? '' : colorHexGuess(clean),
      optionGroup: 'التدرج',
    });
  }

  for (const [asin, dimsArr] of Object.entries(dims)) {
    const label = Array.isArray(dimsArr)
      ? cleanShadeLabel(dimsArr.filter(Boolean).join(' / '))
      : cleanShadeLabel(dimsArr);
    const image = colorImageForLabel(colorImages, label);
    putShade(byAsin, asin, {
      nameEn: label,
      nameAr: label,
      image,
      colorHex: image ? '' : colorHexGuess(label),
    });
  }

  if (Array.isArray(colorNames) && colorNames.length && Object.keys(dimToAsin).length) {
    const seenColors = new Set();
    for (const [key, asin] of Object.entries(dimToAsin)) {
      const parts = String(key).split('_').map((n) => Number(n));
      const colorIdx = parts[colorDimIndex];
      if (!Number.isFinite(colorIdx)) continue;
      const label = cleanShadeLabel(colorNames[colorIdx] || '');
      if (!label) continue;
      const dedupeKey = label.toLowerCase();
      if (seenColors.has(dedupeKey)) continue;
      seenColors.add(dedupeKey);
      const image = colorImageForLabel(colorImages, label);
      putShade(byAsin, asin, {
        nameEn: label,
        nameAr: label,
        image,
        colorHex: image ? '' : colorHexGuess(label),
      });
    }
  }

  for (const [asin, info] of Object.entries(asinVariationValues)) {
    const label = cleanShadeLabel(
      info?.color_name
      || info?.Color
      || info?.[colorKey]
      || (Array.isArray(info?.dimensions) ? info.dimensions.join(' / ') : '')
      || '',
    );
    const image = colorImageForLabel(colorImages, label);
    putShade(byAsin, asin, {
      nameEn: label,
      nameAr: label,
      image,
      colorHex: image ? '' : colorHexGuess(label),
    });
  }

  if (!byAsin.size) {
    const colorName = extractJsonObject(html, '"color_name":') || {};
    for (const [label, path] of Object.entries(colorName)) {
      const asin = String(path).match(/\/dp\/([A-Z0-9]{10})/)?.[1];
      const clean = cleanShadeLabel(label);
      putShade(byAsin, asin, {
        nameEn: clean,
        nameAr: clean,
        colorHex: colorHexGuess(clean),
        optionGroup: 'اللون',
      });
    }
  }

  // HTML twister — دائماً كمصدر إضافي (ليس فقط عند غياب JSON)
  parseTwisterHtmlSwatches(html, byAsin);

  for (const m of html.matchAll(
    /data-asin="([A-Z0-9]{10})"[^>]{0,400}?(?:title|aria-label|alt)="([^"]{1,80})"/gi,
  )) {
    const label = cleanShadeLabel(m[2]);
    if (!isUsableShadeName(label)) continue;
    if (/click to select|اختر|select/i.test(label)) continue;
    putShade(byAsin, m[1], {
      nameEn: label,
      nameAr: label,
      colorHex: colorHexGuess(label),
    });
  }

  return [...byAsin.values()];
}

const JUNK_DESC_LINE_RE = /^(الشركة المصنعة|العلامة التجارية(?: للمنتج)?|وزن المنتج|فئة المنتج|رقم الموديل|ASIN|Manufacturer|Brand|Item Weight|Product Dimensions|Best Sellers Rank|Date First Available|Is Discontinued|Customer Reviews)\b/i;

function stripHtmlToText(chunk = '') {
  return decodeHtml(
    String(chunk || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|div|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' '),
  )
    .replace(/#productDescription\b[\s\S]{0,500}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isJunkDescriptionLine(line = '') {
  const t = String(line || '').trim();
  if (!t || t.length < 18) return true;
  if (JUNK_DESC_LINE_RE.test(t)) return true;
  if (/(وزن المنتج|فئة المنتج|الشركة المصنعة|العلامة التجارية للمنتج)/i.test(t) && t.length < 80) {
    return true;
  }
  if (/^[\d.,\s]+$/.test(t)) return true;
  // سطر مواصفات قصير بنقطتين فقط (مثل "الوزن: 3g")
  if (/^[^:]{2,40}:\s*.{1,60}$/.test(t) && t.length < 70 && !/[.!?…]/.test(t)) return true;
  return false;
}

function extractFeatureBullets(html = '') {
  const block =
    html.match(/id="feature-bullets"[\s\S]{0,12000}?<\/div>/i)?.[0]
    || html.match(/id="featurebullets_feature_div"[\s\S]{0,12000}?<\/div>/i)?.[0]
    || '';

  const fromBlock = [...block.matchAll(/<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
    .map((m) => stripHtmlToText(m[1]))
    .filter((t) => !isJunkDescriptionLine(t) && !/see more product details|رؤية المزيد/i.test(t));

  if (fromBlock.length) return [...new Set(fromBlock)].slice(0, 10);

  // احتياطي: قوائم المميزات العامة
  const featureBlocks = [...html.matchAll(/class="a-unordered-list a-vertical a-spacing-mini"[\s\S]*?<\/ul>/g)];
  return [...new Set(
    featureBlocks
      .flatMap((b) => [...b[0].matchAll(/<span[^>]*class="a-list-item"[^>]*>([\s\S]*?)<\/span>/g)])
      .map((m) => stripHtmlToText(m[1]))
      .filter((t) => !isJunkDescriptionLine(t)),
  )].slice(0, 10);
}

function extractProductDescriptionText(html = '') {
  // كتلة وصف المنتج — غالباً أغنى من feature-bullets في amazon.ae
  const section =
    html.match(/id="productDescription_feature_div"[\s\S]{0,12000}/i)?.[0]
    || html.match(/id="productDescription"[^>]*>[\s\S]{0,8000}/i)?.[0]
    || '';
  if (!section) return '';

  const paras = [...section.matchAll(/<(?:p|span|li)[^>]*>([\s\S]*?)<\/(?:p|span|li)>/gi)]
    .map((m) => stripHtmlToText(m[1]))
    .map((t) => t.replace(/^(وصف المنتج|Product Description)\s*/i, '').trim())
    .filter((t) => t.length >= 40 && !isJunkDescriptionLine(t) && !/^[{};.#]/.test(t));

  let text = paras.sort((a, b) => b.length - a.length)[0] || '';
  if (!text) {
    text = stripHtmlToText(section)
      .replace(/^(وصف المنتج|Product Description)\s*/i, '')
      .replace(/\s*\{[^}]{0,300}\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (text.length < 40 || isJunkDescriptionLine(text)) return '';
  return text.slice(0, 2000);
}

function extractAplusText(html = '', { preferArabic = false } = {}) {
  const chunk =
    html.match(/id="aplus(?:_feature_div)?"[\s\S]{0,20000}/i)?.[0]
    || html.match(/class="aplus-v2"[\s\S]{0,20000}/i)?.[0]
    || '';
  if (!chunk) return '';
  const paras = [...chunk.matchAll(/<(?:p|h[2-4]|li)[^>]*>([\s\S]*?)<\/(?:p|h[2-4]|li)>/gi)]
    .map((m) => stripHtmlToText(m[1]))
    .filter((t) => t.length >= 30 && !isJunkDescriptionLine(t));
  const filtered = paras.filter((t) => (preferArabic ? hasArabic(t) : hasLatin(t)));
  const picked = (filtered.length ? filtered : paras).slice(0, 6);
  return picked.join(' • ').slice(0, 2000);
}

function buildLocaleDescription(html = '', { arabic = false } = {}) {
  const bullets = extractFeatureBullets(html);
  const productDesc = extractProductDescriptionText(html);
  const aplus = extractAplusText(html, { preferArabic: arabic });

  const bulletText = bullets.join(' • ');
  const langOk = (t) => (arabic ? hasArabic(t) : hasLatin(t));

  const bulletScore = bullets.length >= 2 && langOk(bulletText)
    ? bullets.length * 20 + Math.min(bulletText.length, 500) / 8
    : 0;
  const descScore = productDesc && langOk(productDesc)
    ? 90 + Math.min(productDesc.length, 600) / 6
    : 0;
  const aplusScore = aplus && langOk(aplus)
    ? 50 + Math.min(aplus.length, 400) / 10
    : 0;

  // للعربي: وصف المنتج غالباً أفضل من bullets المواصفات على .ae
  if (arabic) {
    if (descScore >= 90) return productDesc;
    if (bulletScore >= 80) return bulletText;
    if (descScore > 0) return productDesc;
    if (aplusScore > 0) return aplus;
    if (bulletScore > 0) return bulletText;
    return '';
  }

  if (bulletScore >= 70) return bulletText;
  if (descScore >= 60) return productDesc;
  if (bulletText && langOk(bulletText)) return bulletText;
  if (productDesc && langOk(productDesc)) return productDesc;
  if (aplus) return aplus;
  return bulletText || productDesc || '';
}

function pickBilingualDescription(aeDesc = '', enDesc = '', saDesc = '') {
  const arCandidates = [aeDesc, saDesc].filter((d) => d && hasArabic(d));
  const enCandidates = [enDesc].filter((d) => d && hasLatin(d));

  // أفضل وصف عربي = الأطول غير المواصفاتي
  const descriptionAr = arCandidates.sort((a, b) => b.length - a.length)[0] || '';
  const descriptionEn = enCandidates.sort((a, b) => b.length - a.length)[0] || '';

  return {
    descriptionAr,
    descriptionEn,
    // لا تملأ العربي بالإنجليزي — أبقِ الحقل فارغاً إن لم يتوفر عربي حقيقي
  };
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

  // فضّل large/landing على hiRes — hiRes أحياناً قصّة مقرّبة لنص العبوة
  const img = html.match(/id="landingImage"[^>]+(?:data-old-hires|data-a-dynamic-image|src)="(https:[^"]+)"/)?.[1]
    || html.match(/"large"\s*:\s*"(https:[^"]+)"/)?.[1]
    || html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/)?.[1]
    || html.match(/id="landingImage"[^>]+src="(https:[^"]+)"/)?.[1]
    || '';

  const images = [
    img,
    ...[...html.matchAll(/"large"\s*:\s*"(https:[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/g)].map((m) => m[1]),
  ].filter(Boolean);
  const uniqImages = [...new Set(images.map((u) => normalizeAmazonImageUrl(u, 1000)).filter(Boolean))].slice(0, 24);

  const isAr = hasArabic(title) || /amazon\.(ae|sa)/i.test(marketHost);
  const description = buildLocaleDescription(html, { arabic: isAr });

  const barcodes = extractAllBarcodesFromDetailHtml(html);
  const barcode = pickBestBarcode(barcodes);
  const shades = parseShadesFromHtml(html);

  return {
    id: asin,
    parentAsin: asin,
    sku: asin,
    barcode,
    barcodes,
    nameAr: isAr ? title : '',
    nameEn: isAr ? '' : title,
    brandAr: brand,
    brandEn: brand,
    descriptionAr: isAr ? description : '',
    descriptionEn: isAr ? '' : description,
    thumb: normalizeAmazonImageUrl(uniqImages[0] || '', 500),
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

async function enrichShadeDetails(shades = [], { deadline = 0, concurrency = 10, max = 120 } = {}) {
  // أبقِ كل التدرجات — أثْرِ باركود/اسم لون/سعر لكل درجة ضمن المهلة
  const out = shades.map((s) => ({ ...s }));
  const limit = Math.min(out.length, max);

  // فضّل الدرجات بلا باركود أولاً
  const order = out
    .map((s, index) => ({ index, missing: !s.barcode }))
    .sort((a, b) => Number(b.missing) - Number(a.missing))
    .map((x) => x.index)
    .slice(0, limit);

  for (let i = 0; i < order.length; i += concurrency) {
    if (deadline && Date.now() > deadline) break;
    const chunkIdx = order.slice(i, i + concurrency);
    const parts = await Promise.all(chunkIdx.map(async (index) => {
      const shade = out[index];
      const cacheKey = `amazon:shade:v5:${shade.id}`;
      const cached = cacheGet(cacheKey, DETAIL_TTL);
      if (cached) return { index, ...cached };

      try {
        let html = '';
        const marketsToTry = ['ae', 'com', 'sa'];
        let barcode = '';

        for (const mid of marketsToTry) {
          try {
            const pageHtml = await fetchMarketHtml(mid, `https://${MARKETS[mid].host}/dp/${shade.id}`, {
              ttl: DETAIL_TTL,
              cacheKey: `amazon:dp:${mid}:${shade.id}`,
            });
            if (!html) html = pageHtml;
            const found = extractBarcodeFromDetailHtml(pageHtml);
            if (found) {
              barcode = found;
              html = pageHtml;
              break;
            }
            // احتفظ بأول HTML صالح لاستخراج الاسم/السعر حتى لو بلا باركود
          } catch {
            continue;
          }
        }
        if (!html) return { index };

        const price = decodeHtml(
          html.match(/class="a-price[^"]*"[^>]*>[\s\S]*?a-offscreen">([^<]+)/)?.[1] || '',
        );
        const thumb = html.match(/"hiRes"\s*:\s*"(https:[^"]+)"/)?.[1]
          || html.match(/"large"\s*:\s*"(https:[^"]+)"/)?.[1]
          || '';
        const colorName = extractSelectedColorName(html);
        const existingName = shade.nameEn || shade.nameAr || '';
        // لا تستبدل اسماً جيداً من twister بقيمة ضعيفة/فارغة
        const keepExisting = isUsableShadeName(existingName) && !/^\d+$/.test(existingName);
        const nextName = (!keepExisting && colorName) ? colorName : '';
        const swatchHex = extractSwatchHexFromHtml(html, colorName || existingName);
        const guessed = colorHexGuess(colorName || existingName);
        const image = normalizeAmazonImageUrl(shade.image || thumb || '', 500);

        const patch = {
          barcode,
          price: price || shade.price || '',
          image,
          colorHex: swatchHex || shade.colorHex || (!image ? guessed : '') || '',
          nameEn: (nextName && hasLatin(nextName) ? nextName : '') || shade.nameEn || '',
          nameAr: (nextName && hasArabic(nextName) ? nextName : '') || shade.nameAr || '',
        };
        if (!patch.nameEn && patch.nameAr && hasLatin(patch.nameAr)) patch.nameEn = patch.nameAr;
        if (!patch.nameAr && patch.nameEn) patch.nameAr = patch.nameEn;

        cacheSet(cacheKey, patch);
        return { index, ...patch };
      } catch {
        return { index };
      }
    }));

    for (const p of parts) {
      if (p.index == null) continue;
      const prev = out[p.index];
      out[p.index] = {
        ...prev,
        barcode: p.barcode || prev.barcode || '',
        price: p.price || prev.price || '',
        image: p.image || prev.image || '',
        colorHex: p.colorHex || prev.colorHex || '',
        nameEn: p.nameEn || prev.nameEn || '',
        nameAr: p.nameAr || prev.nameAr || '',
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

  const cacheKey = `amazon:detail:v13:${asin}:${light ? 'l' : 'f'}`;
  const cached = cacheGet(cacheKey, DETAIL_TTL);
  if (cached) return cached;

  // اجلب ae + com بالتوازي، وsa عند الحاجة للوصف/العنوان العربي
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

  const aeHtml = settled[0].status === 'fulfilled' ? settled[0].value : '';
  const comHtml = settled[1].status === 'fulfilled' ? settled[1].value : '';

  let saHtml = '';
  const aeTitleAr = hasArabic(aeHtml.match(/id="productTitle"[^>]*>([^<]+)/)?.[1] || '');
  const aeDescPreview = aeHtml ? buildLocaleDescription(aeHtml, { arabic: true }) : '';
  const needSa = !aeHtml || !aeTitleAr || !hasArabic(aeDescPreview) || aeDescPreview.length < 80;
  if (needSa) {
    try {
      saHtml = await fetchMarketHtml('sa', `https://${MARKETS.sa.host}/dp/${asin}`, {
        ttl: DETAIL_TTL,
        cacheKey: `amazon:dp:sa:${asin}`,
      });
    } catch { /* اختياري */ }
  }

  if (!aeHtml && !comHtml && !saHtml) return null;

  const ae = aeHtml ? parseDetailCore(aeHtml, asin, MARKETS.ae.host) : null;
  const sa = saHtml ? parseDetailCore(saHtml, asin, MARKETS.sa.host) : null;
  const en = comHtml ? parseDetailCore(comHtml, asin, MARKETS.com.host) : null;
  const primary = en || ae || sa;
  if (!primary) return null;

  let shades = mergeShadeLocales(en?.shades || [], [...(ae?.shades || []), ...(sa?.shades || [])]);
  if (shades.length > 1) {
    const children = shades.filter((s) => String(s.id) !== asin);
    if (children.length) shades = children;
  }
  if (!shades.length) {
    shades = [{
      id: asin,
      nameAr: ae?.nameAr || sa?.nameAr || primary.nameEn || primary.nameAr,
      nameEn: en?.nameEn || primary.nameEn || primary.nameAr,
      sku: asin,
      barcode: primary.barcode || ae?.barcode || sa?.barcode || '',
      image: primary.thumb,
      price: primary.price || ae?.price || sa?.price || '',
      inStock: true,
      colorHex: '',
      optionGroup: '',
    }];
  }

  // إثراء التدرجات: باركود + اسم اللون + سعر (عند الاستيراد الكامل)
  // مهم: إن فشل الإثراء نُبقي قائمة التدرجات كما هي (أسماء/صور) بدل إسقاطها
  if (!light && shades.length > 1) {
    const before = shades;
    try {
      const budgetMs = shades.length > 40 ? 60_000 : shades.length > 15 ? 40_000 : 28_000;
      const deadline = Date.now() + budgetMs;
      shades = await enrichShadeDetails(shades, {
        deadline,
        concurrency: shades.length > 40 ? 12 : 10,
        max: shades.length,
      });
      // جولة ثانية للتدرجات التي بقيت بلا باركود
      const stillMissing = shades.filter((s) => !s.barcode).length;
      if (stillMissing > 0 && Date.now() < deadline) {
        shades = await enrichShadeDetails(shades, {
          deadline,
          concurrency: 6,
          max: shades.length,
        });
      }
      if (!shades?.length) shades = before;
    } catch {
      shades = before;
    }
  } else if (shades.length === 1) {
    shades[0].barcode = shades[0].barcode || primary.barcode || ae?.barcode || '';
    shades[0].price = shades[0].price || primary.price || ae?.price || '';
    if (!shades[0].colorHex) {
      shades[0].colorHex = colorHexGuess(shades[0].nameEn || shades[0].nameAr) || '';
    }
  }

  // نظّف أسماء التدرجات التالفة (مثل SQUARE) واملأ الناقص من العنوان إن أمكن
  shades = shades.map((s) => {
    let nameEn = cleanShadeLabel(s.nameEn || '');
    let nameAr = cleanShadeLabel(s.nameAr || '');
    if (!isUsableShadeName(nameEn)) nameEn = '';
    if (!isUsableShadeName(nameAr)) nameAr = '';
    if (!nameEn && !nameAr) {
      const fromTitle = String(primary.nameEn || primary.nameAr || '').match(
        /(?:-|–|—|:)\s*([A-Za-z0-9][A-Za-z0-9 /-]{1,40})$/,
      )?.[1];
      if (fromTitle && isUsableShadeName(fromTitle)) nameEn = cleanShadeLabel(fromTitle);
    }
    const finalEn = nameEn || nameAr || s.id;
    const finalAr = nameAr || nameEn || s.id;
    return {
      ...s,
      nameEn: finalEn,
      nameAr: finalAr,
      // لا تُبقِ hex مُخمَّناً ضعيفاً إن وُجدت صورة — الواجهة تستخرج اللون الحقيقي
      colorHex: s.colorHex || '',
    };
  });

  const nameAr = (ae?.nameAr && hasArabic(ae.nameAr) ? ae.nameAr : '')
    || (sa?.nameAr && hasArabic(sa.nameAr) ? sa.nameAr : '')
    || (hasArabic(primary.nameAr) ? primary.nameAr : '')
    || ae?.nameAr
    || sa?.nameAr
    || primary.nameAr
    || primary.nameEn;
  const nameEn = (en?.nameEn && hasLatin(en.nameEn) ? en.nameEn : '')
    || (hasLatin(primary.nameEn) ? primary.nameEn : '')
    || en?.nameEn
    || primary.nameEn
    || nameAr;

  const { descriptionAr, descriptionEn } = pickBilingualDescription(
    ae?.descriptionAr || '',
    en?.descriptionEn || '',
    sa?.descriptionAr || '',
  );

  const barcodes = uniqBarcodes([
    ...(en?.barcodes || []),
    ...(ae?.barcodes || []),
    ...(sa?.barcodes || []),
    en?.barcode,
    ae?.barcode,
    sa?.barcode,
    ...shades.map((s) => s.barcode),
  ]);

  const detail = {
    id: asin,
    parentAsin: asin,
    sku: asin,
    barcode: pickBestBarcode(barcodes) || primary.barcode || ae?.barcode || sa?.barcode || shades.find((s) => s.barcode)?.barcode || '',
    barcodes,
    nameAr,
    nameEn,
    brandAr: ae?.brandAr || sa?.brandAr || en?.brandAr || '',
    brandEn: en?.brandEn || ae?.brandEn || sa?.brandEn || '',
    descriptionAr,
    descriptionEn,
    thumb: en?.thumb || ae?.thumb || sa?.thumb || '',
    images: [...new Set([...(en?.images || []), ...(ae?.images || []), ...(sa?.images || [])])].slice(0, 24),
    price: en?.price || ae?.price || sa?.price || '',
    category: 'Beauty',
    productUrl: `https://www.amazon.com/dp/${asin}`,
    productUrlAr: `https://www.amazon.ae/dp/${asin}`,
    inStock: true,
    shades,
    shadeCount: shades.length,
    hasOptions: shades.length > 1,
    manufacturer: ae?.brandAr || sa?.brandAr || en?.brandAr || '',
    manufacturerEn: en?.brandEn || ae?.brandEn || sa?.brandEn || '',
    source: 'scrape',
  };

  cacheSet(cacheKey, detail);
  return detail;
}

export async function scrapeBarcode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length < 8) return [];

  // جرّب المتغيرات (مع/بدون صفر بادئ)
  const queries = [...new Set([
    digits,
    digits.length === 12 ? `0${digits}` : '',
    digits.length === 13 && digits.startsWith('0') ? digits.slice(1) : '',
  ].filter(Boolean))];

  let items = [];
  let softBlocked = false;
  for (const q of queries) {
    const data = await scrapeSearchProducts(q, { page: 1, limit: 12, categoryId: BEAUTY_ROOT_NODE });
    if (data.softBlocked) softBlocked = true;
    if (data.items?.length) {
      items = data.items;
      break;
    }
  }
  if (!items.length) {
    return softBlocked ? [] : [];
  }

  const hits = [];
  // light فقط أثناء البحث — أسرع ولا يتجاوز مهلة الواجهة؛ التدرجات تُثري عند فتح المنتج
  for (const item of items.slice(0, 5)) {
    try {
      const detail = await scrapeProductDetail(item.id, { light: true });
      if (!detail) {
        hits.push({ ...item, barcode: digits, matchType: 'keyword' });
        continue;
      }

      const candidates = [
        ...(detail.barcodes || []),
        detail.barcode,
        ...(detail.shades || []).map((s) => s.barcode),
      ];
      const shadeHit = (detail.shades || []).find((s) => barcodeMatches(digits, [s.barcode]));
      const exact = barcodeMatches(digits, candidates) || Boolean(shadeHit);

      if (exact) {
        hits.push({
          ...detail,
          barcode: digits,
          barcodes: uniqBarcodes([...candidates, digits]),
          shadeName: shadeHit?.nameAr || shadeHit?.nameEn || '',
          matchType: 'ean',
          shadeCount: detail.shadeCount,
        });
        break; // مطابقة دقيقة — كافية للبحث
      }

      hits.push({
        id: detail.id,
        nameAr: detail.nameAr,
        nameEn: detail.nameEn,
        brandAr: detail.brandAr,
        thumb: detail.thumb,
        price: detail.price,
        barcode: digits,
        barcodes: uniqBarcodes(candidates),
        matchType: 'keyword',
        shadeCount: detail.shadeCount,
      });
      await sleep(120);
    } catch {
      hits.push({ ...item, barcode: digits, matchType: 'keyword' });
    }
  }

  const exact = hits.filter((h) => h.matchType === 'ean');
  const out = exact.length ? exact : hits.slice(0, 3);
  return out.map((h) => ({
    ...h,
    thumb: normalizeAmazonImageUrl(h.thumb || '', 500),
    images: (h.images || []).map((u) => normalizeAmazonImageUrl(u, 1000)).filter(Boolean),
  }));
}

export function amazonScrapeStatus() {
  return {
    blocked: isBlocked(),
    cooldownMs: Math.max(0, captchaUntil - Date.now()),
  };
}

export { categoryBrowseKeyword };
