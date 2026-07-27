const PERF = /parfum|perfume|eau de|edp|edt|edc|cologne|عطر|fragrance|برفيوم/i;
const MAKEUP = /mascara|lipstick|lip gloss|eyeshadow|foundation|concealer|palette|blush|bronzer|highlighter|ماسكر|مكياج|أحمر شفاه|ظلال|بودرة مكياج/i;
const CARE = /care|skin|hair|body|shampoo|conditioner|serum|cream|lotion|cleanser|toner|mask|sunscreen|spf|deodorant|toothpaste|mouthwash|lip balm|عناية|بشرة|شعر|جسم|شامبو|بلسم|كريم|سيروم|غسول|تونر|ماسك|واقي|مزيل عرق|معجون|غسول فم|مرطب/i;

const TYPE_HINTS = [
  { key: 'sunscreen', re: /sun\s*(screen|serum|cream|stick)|spf|واقي شمس/i },
  { key: 'shampoo', re: /shampoo|شامبو/i },
  { key: 'conditioner', re: /conditioner|بلسم/i },
  { key: 'hair-mask', re: /hair\s*mask|ماسك.*شعر/i },
  { key: 'hair-oil', re: /hair\s*oil|زيت.*شعر/i },
  { key: 'serum', re: /serum|سيروم/i },
  { key: 'cleanser', re: /cleanser|face\s*wash|غسول/i },
  { key: 'toner', re: /\btoner\b|تونر/i },
  { key: 'moisturizer', re: /moistur|مرطب/i },
  { key: 'cream', re: /cream|كريم/i },
  { key: 'lotion', re: /lotion|لوشن/i },
  { key: 'body-wash', re: /body\s*wash|shower\s*gel|غسول جسم/i },
  { key: 'deodorant', re: /deodorant|antiperspirant|مزيل عرق/i },
  { key: 'toothpaste', re: /toothpaste|معجون/i },
  { key: 'mouthwash', re: /mouthwash|غسول فم/i },
  { key: 'hand-cream', re: /hand\s*(cream|lotion)|كريم.*يد/i },
  { key: 'eye-cream', re: /eye\s*(cream|gel)|كريم.*عين/i },
  { key: 'face-mask', re: /sheet\s*mask|face\s*mask|ماسك/i },
  { key: 'lip-balm', re: /lip\s*balm|بلسم شفاه/i },
  { key: 'scrub', re: /scrub|exfoliat|مقشر/i },
];

const LEAF_TYPE = [
  [/hair-care\/shampoo/, 'shampoo'],
  [/hair-care\/oil/, 'hair-oil'],
  [/hair-care\/hair-treatment/, 'leave-in'],
  [/hair-care\/hair-styling/, 'hair-spray'],
  [/face-care\/cleansers/, 'cleanser'],
  [/face-care\/face-moisturizer/, 'moisturizer'],
  [/face-care\/eye-care/, 'eye-cream'],
  [/face-care\/face-masks/, 'face-mask'],
  [/face-care\/lip-care/, 'lip-balm'],
  [/face-care\/face-scrubs/, 'scrub'],
  [/sun-care\/sunscreen/, 'sunscreen'],
  [/skin-and-body-care\/deodorant/, 'deodorant'],
  [/skin-and-body-care\/body-cleansers/, 'body-wash'],
  [/skin-and-body-care\/body-moisturizer/, 'body-cream'],
  [/hand-care\/hand-moisturizer/, 'hand-cream'],
  [/mouth.*toothpaste/, 'toothpaste'],
  [/mouth.*mouthwash/, 'mouthwash'],
];

export function isCareLeaf(leaf = '') {
  return String(leaf).startsWith('care/');
}

export function isCareText(text = '') {
  const t = String(text);
  if (PERF.test(t) && !/body|hair|skin|care|deodorant/i.test(t)) return false;
  if (MAKEUP.test(t) && !/remover|micellar|مزيل مكياج/i.test(t)) return false;
  return CARE.test(t);
}

export function isCareCandidate({ leaf = '', nameAr = '', nameEn = '', category = '' } = {}) {
  if (isCareLeaf(leaf)) return true;
  return isCareText(`${nameAr} ${nameEn} ${category}`);
}

export function isCareDetail(detail = {}, leaf = '') {
  if (isCareLeaf(leaf)) return true;
  const text = `${detail.nameAr || ''} ${detail.nameEn || ''} ${detail.category || ''}`;
  return isCareText(text);
}

export function inferCareTypeKey(text = '', leaf = '') {
  for (const [re, key] of LEAF_TYPE) {
    if (re.test(leaf)) return key;
  }
  for (const { key, re } of TYPE_HINTS) {
    if (re.test(text)) return key;
  }
  if (leaf.includes('hair')) return 'shampoo';
  if (leaf.includes('sun')) return 'sunscreen';
  if (leaf.includes('mouth') || leaf.includes('teeth')) return 'toothpaste';
  return 'moisturizer';
}
