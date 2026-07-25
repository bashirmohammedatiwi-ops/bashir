#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const BARCODES = [
  '50064861', '850035582251', '854102006763', '737052351100', '9314839020742',
  '8809864766884', '079625014921', '3432240506641', '3349668579839', '3760294350621',
  '3595471024787', '3600531584696', '3274872421554', '3274872428829', '3516641717315',
  '3760294350652', '3616304249716', '3346470304925', '3386460011600', '3349668622009',
  '614514780497', '7640233340721', '7640233341414', '3274872420625', '8411061088166',
  '8057971183661', '3595471024800', '854102006787', '3346133203671', '3616301794639',
  '8435137764730', '8034097956928', '3508441001275', '3614273790840', '3274872396197',
  '3274872423398', '3274872423336', '027131017752', '027131020424', '744109218965',
  '7702018070732', '689304184595', '3700550218227', '3616303452247', '3616303470654',
  '3616302038916', '3616301776154', '3616302038947', '3616304668722', '3386460132916',
];

/** Hand-verified metadata keyed by barcode */
const META = JSON.parse(readFileSync(new URL('./batch5-meta-products.json', import.meta.url), 'utf8'));

const header = `#!/usr/bin/env node
/** Generate hand-verified bilingual metadata for Sarah POS batch 5. */
import { readFileSync, writeFileSync } from 'fs';

const BARCODES = ${JSON.stringify(BARCODES, null, 2).replace(/\n/g, '\n')};

function pDesc(d) {
  return {
    descriptionEn: \`\${d.introEn}\\n\\n◆ Scent family: \${d.familyEn}\\n◆ Key notes: \${d.notesEn}\\n◆ Character: \${d.charEn}\\n◆ Best for: \${d.bestEn}\\n◆ Longevity: \${d.longEn}\`,
    descriptionAr: \`\${d.introAr}\\n\\n◆ عائلة العطر: \${d.familyAr}\\n◆ النوتات الرئيسية: \${d.notesAr}\\n◆ الطابع: \${d.charAr}\\n◆ الأنسب لـ: \${d.bestAr}\\n◆ الثبات: \${d.longAr}\`,
  };
}

function cDesc(d) {
  return {
    descriptionEn: \`\${d.introEn}\\n\\n◆ Category: \${d.catEn}\\n◆ Product type: \${d.typeEn}\\n◆ Key benefits: \${d.benefitsEn.join(' · ')}\\n◆ Suitable for: \${d.suitEn}\\n◆ Size: \${d.sizeEn}\`,
    descriptionAr: \`\${d.introAr}\\n\\n◆ التصنيف: \${d.catAr}\\n◆ نوع المنتج: \${d.typeAr}\\n◆ الفوائد الرئيسية: \${d.benefitsAr.join(' · ')}\\n◆ الأنسب لـ: \${d.suitAr}\\n◆ الحجم: \${d.sizeAr}\`,
  };
}

function mDesc(d) {
  return {
    descriptionEn: \`\${d.introEn}\\n\\n◆ Category: Makeup\\n◆ Product type: \${d.typeEn}\\n◆ Key benefits: \${d.benefitsEn.join(' · ')}\\n◆ Suitable for: \${d.suitEn}\`,
    descriptionAr: \`\${d.introAr}\\n\\n◆ التصنيف: مكياج\\n◆ نوع المنتج: \${d.typeAr}\\n◆ الفوائد الرئيسية: \${d.benefitsAr.join(' · ')}\\n◆ الأنسب لـ: \${d.suitAr}\`,
  };
}

/** @type {Record<string, object>} */
const PRODUCTS = {
`;

function esc(s) {
  return JSON.stringify(s);
}

function renderProduct(bc, p) {
  const lines = [`  ${esc(bc)}: {`];
  lines.push(`    brandEn: ${esc(p.brandEn)}, brandAr: ${esc(p.brandAr)},`);
  lines.push(`    nameEn: ${esc(p.nameEn)}, nameAr: ${esc(p.nameAr)},`);
  if (p.kind === 'perfume') {
    lines.push(`    kind: 'perfume', subs: ${JSON.stringify(p.subs)},`);
    lines.push(`    ...pDesc(${JSON.stringify(p.p, null, 6).replace(/\n/g, '\n    ')}),`);
  } else if (p.kind === 'care') {
    lines.push(`    kind: 'care', careLeaf: ${esc(p.careLeaf)}, typeKey: ${esc(p.typeKey)},`);
    lines.push(`    ...cDesc(${JSON.stringify(p.c, null, 6).replace(/\n/g, '\n    ')}),`);
  } else {
    lines.push(`    kind: 'makeup', makeupSub: ${esc(p.makeupSub)},`);
    lines.push(`    ...mDesc(${JSON.stringify(p.m, null, 6).replace(/\n/g, '\n    ')}),`);
  }
  lines.push('  },');
  return lines.join('\n');
}

const body = BARCODES.map((bc) => {
  if (!META[bc]) throw new Error(`Missing meta for ${bc}`);
  return renderProduct(bc, META[bc]);
}).join('\n');

const footer = `};

const candidatesPath = new URL('../data/sarah-pos-candidates-batch5.json', import.meta.url);
const outPath = new URL('../data/sarah-pos-batch5-meta.json', import.meta.url);
const candidates = JSON.parse(readFileSync(candidatesPath, 'utf8'));
const candidateSet = new Set(candidates.map((c) => c.barcode));

for (const bc of BARCODES) {
  if (!candidateSet.has(bc)) throw new Error(\`Barcode not in candidates: \${bc}\`);
  if (!PRODUCTS[bc]) throw new Error(\`Missing PRODUCTS entry: \${bc}\`);
}
const extra = Object.keys(PRODUCTS).filter((k) => !BARCODES.includes(k));
if (extra.length) throw new Error(\`Extra PRODUCTS keys: \${extra.join(', ')}\`);

/** @type {Record<string, object>} */
const out = {};
for (const bc of BARCODES) out[bc] = PRODUCTS[bc];

writeFileSync(outPath, \`\${JSON.stringify(out, null, 2)}\\n\`);
console.log('Key count:', Object.keys(out).length);
`;

writeFileSync(new URL('./gen-batch5-meta.mjs', import.meta.url), header + body + footer);
console.log('Wrote gen-batch5-meta.mjs with', BARCODES.length, 'products');
