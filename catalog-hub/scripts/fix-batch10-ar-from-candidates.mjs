#!/usr/bin/env node
/** Rebuild batch-8 Arabic names from Sarah candidate data with brand prefix. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch10-meta.json', import.meta.url), 'utf8'));
const cands = JSON.parse(readFileSync(new URL('../data/sarah-pos-candidates-batch10.json', import.meta.url), 'utf8'));
const byBc = new Map(cands.map((c) => [c.barcode, c]));

const BRAND_AR = {
  'Carmex': 'كارمكس', 'Cantu': 'كانتو', 'CeraVe': 'سيرافي', 'Vichy': 'فيشي', 'NYX': 'نيكس',
  'The Balm': 'ذا بالم', 'Make Up For Ever': 'ميك أب فور إيفر', 'Shea Moisture': 'شيا مويستشر',
  'Jaguar': 'جaguar', 'Eucerin': 'يوسirين', 'Inglot': 'إinglot', 'Givenchy': 'جivenchy',
  'La Roche-Posay': 'la roche-posay', 'Huda Beauty': 'هuda beauty', 'Paco Rabanne': 'paco rabanne',
  'Rochas': 'rochas', 'Cacharel': 'cacharel', 'Dunhill': 'dunhill',
  'The Woods Collection': 'the woods collection', 'DKNY': 'dkny', 'Gucci': 'gucci', 'Vertus': 'vertus',
  'Essence': 'essence', 'Chanel': 'chanel', 'Nina Ricci': 'nina ricci', 'Geparlys': 'غابرليس',
  'Clarins': 'clarins', 'Benefit': 'benefit', 'Lalique': 'lalique', 'Giorgio Beverly Hills': 'giorgio beverly hills',
};

const TYPO = { 'جبفنشي': 'جivenchy' };

function extractArabicWords(s = '') {
  return String(s).match(/[\u0600-\u06FF]+/g) || [];
}

function brandArFrom(row, brandEn) {
  const words = extractArabicWords(row?.brandAr);
  if (words.length) return words.slice(0, 4).join(' ');
  const nameWords = extractArabicWords(String(row?.nameAr || '').replace(/^عطر\s*/, ''));
  if (nameWords.length >= 2) return nameWords.slice(0, 2).join(' ');
  if (nameWords.length === 1) return nameWords[0];
  return BRAND_AR[brandEn] || brandEn;
}

function cleanProductAr(raw = '', brandAr = '') {
  let n = String(raw)
    .replace(/^عطر\s*/i, '')
    .replace(/كرتون[\s\S]*$/i, '')
    .replace(/بدون[\s\S]*$/i, '')
    .trim();
  n = n.replace(/(\d)\s*ML\b/gi, '$1 مل').replace(/(\d)\s*مل\b/g, '$1 مل');
  if (brandAr) {
    const esc = brandAr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    n = n.replace(new RegExp(`^${esc}\\s*[-–]?\\s*`), '').trim();
    for (const w of brandAr.split(/\s+/)) {
      n = n.replace(new RegExp(`^${w}\\s*`), '').trim();
    }
  }
  n = n.replace(/\bVol\.?\s*(\d+)/gi, 'الإصدار $1');
  n = n.replace(/\bSPF\s*(\d+)/gi, 'SPF$1');
  return n;
}

for (const [bc, m] of Object.entries(meta)) {
  const row = byBc.get(bc);
  const brandAr = brandArFrom(row, m.brandEn);
  const productAr = cleanProductAr(row?.nameAr || m.nameAr, brandAr);
  m.brandAr = TYPO[brandAr] || brandAr;
  m.nameAr = productAr ? `${m.brandAr} - ${productAr}` : m.brandAr;
  if (m.descriptionAr?.includes('—')) {
    m.descriptionAr = m.descriptionAr.replace(/^[^\n—]+/, m.nameAr);
  }
}

writeFileSync(new URL('../data/sarah-pos-batch10-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
let bad = 0;
for (const m of Object.values(meta)) {
  if (!m.nameAr.startsWith(m.brandAr)) bad++;
}
console.log('Updated AR names, prefix mismatches:', bad);
