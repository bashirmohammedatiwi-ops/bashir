/** تطبيع أسماء البراندات للمطابقة وإزالة التكرار */

const AR_BRAND_ALIASES = {
  شانيل: 'chanel',
  ديور: 'dior',
  'إيف سان لوران': 'yves saint laurent',
  'ايف سان لوران': 'yves saint laurent',
  لانكوم: 'lancome',
  ماك: 'mac',
  'ماك كوزمتكس': 'mac',
  'ميك اب فور ايفر': 'make up for ever',
  'ميك اب فور إيفر': 'make up for ever',
  نارس: 'nars',
  كلينيك: 'clinique',
  'فور ايفر': 'forever',
  'فور إيفر': 'forever',
  'شارلوت تيلبري': 'charlotte tilbury',
  'شارلوت تلبري': 'charlotte tilbury',
  'بوبي براون': 'bobbi brown',
  'توم فورد': 'tom ford',
  جيفنشي: 'givenchy',
  غوتشي: 'gucci',
  برادا: 'prada',
  هيرميس: 'hermes',
  فالنتينو: 'valentino',
  بربري: 'burberry',
  ارماني: 'armani',
  'أرماني': 'armani',
  'كارولينا هيريرا': 'carolina herrera',
};

const EN_BRAND_ALIASES = {
  'm a c': 'mac',
  'm.a.c': 'mac',
  'mac cosmetics': 'mac',
  'yves saint laurent beaute': 'yves saint laurent',
  'ysl': 'yves saint laurent',
  'estee lauder': 'estee lauder',
  'estée lauder': 'estee lauder',
  'make up for ever': 'make up for ever',
  'makeup forever': 'make up for ever',
  'charlotte tilbury': 'charlotte tilbury',
  'the ordinary': 'the ordinary',
  'la roche posay': 'la roche posay',
  'l oreal': 'loreal',
  "l'oreal": 'loreal',
  'loreal paris': 'loreal',
};

export function normalizeBrandKey(name = '') {
  let key = String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[''`´]/g, '')
    .replace(/[.&]/g, ' ')
    .replace(/\b(the|and|co|company|ltd|inc|llc|gmbh|paris|london|uae|ae)\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!key) return '';

  if (AR_BRAND_ALIASES[key]) return AR_BRAND_ALIASES[key];
  if (EN_BRAND_ALIASES[key]) return EN_BRAND_ALIASES[key];

  // إزالة كلمات تجميل شائعة في نهاية الاسم
  key = key
    .replace(/\b(beauty|cosmetics|makeup|skincare|fragrance|perfume|parfum)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return EN_BRAND_ALIASES[key] || key;
}

export function brandMatchKeys(...names) {
  const keys = new Set();
  for (const name of names) {
    const key = normalizeBrandKey(name);
    if (key && key !== 'no brand' && key !== 'nobrand' && key !== 'unknown') {
      keys.add(key);
    }
  }
  return [...keys];
}

export function preferBrandDisplayName(nameAr = '', nameEn = '') {
  const ar = String(nameAr || '').trim();
  const en = String(nameEn || '').trim();
  if (en && /[A-Za-z]/.test(en)) return en;
  if (ar && /[A-Za-z]/.test(ar)) return ar;
  return ar || en;
}
