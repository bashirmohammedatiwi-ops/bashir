#!/usr/bin/env node
/** Polish batch2 — EN names, AR names from data file, clean Arabic descriptions. */
import { readFileSync, writeFileSync } from 'fs';

import { CATEGORIES } from '../lib/core/app-categories.js';

const PERFUMES = CATEGORIES.perfumes;
const PRODUCTS = new URL('../data/sarah-pos-import-products-batch2.json', import.meta.url).pathname;
const AR_NAMES = new URL('../data/sarah-pos-batch2-ar-names.json', import.meta.url).pathname;
const products = JSON.parse(readFileSync(PRODUCTS, 'utf8'));
const arNames = JSON.parse(readFileSync(AR_NAMES, 'utf8'));

const EN = {
  '7702018334919': { brandEn: 'Gillette Venus', nameEn: 'Gillette Venus Breeze Razor Cartridges 2-Pack' },
  '3701129812792': { brandEn: 'Bioderma', nameEn: 'Bioderma Sébium Cleansing Foaming Gel 200ml' },
  '7640177360335': { brandEn: 'Chopard', nameEn: 'Chopard Happy Spirit Eau de Parfum 75ml' },
  '3423478840652': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez Narciso Poudrée Eau de Parfum 90ml' },
  '30152434': { brandEn: 'Maybelline', nameEn: 'Maybelline Lash Sensational Sky High Primer Mascara' },
  '8057971187829': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana Q Eau de Parfum Intense 100ml' },
  '3607342306134': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Sheer Beauty Eau de Toilette 100ml' },
  '8011003804566': { brandEn: 'Versace', nameEn: 'Versace Yellow Diamond Eau de Toilette 90ml' },
  '3423478515956': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez Pure Musc For Her Eau de Parfum 100ml' },
  '887167393271': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Advanced Night Repair Eye Gel-Creme 15ml' },
  '3423470890020': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez For Her Eau de Toilette 100ml' },
  '5057566138222': { brandEn: 'Makeup Revolution', nameEn: 'Makeup Revolution Reloaded Eyeshadow Palette' },
  '5057566099448': { brandEn: 'Makeup Revolution', nameEn: 'Makeup Revolution Reloaded Iconic 3.0 Eyeshadow Palette' },
  '8011003861224': { brandEn: 'Versace', nameEn: 'Versace Eros Eau de Parfum 100ml' },
  '8005610328256': { brandEn: 'Gucci', nameEn: 'Gucci Intense Oud Eau de Parfum 90ml' },
  '8005610524177': { brandEn: 'Gucci', nameEn: 'Gucci Guilty Absolute Pour Femme Eau de Parfum 90ml' },
  '3614227758162': { brandEn: 'Gucci', nameEn: 'Gucci Guilty Eau de Parfum Pour Femme 90ml' },
  '3380810149678': { brandEn: 'Clarins', nameEn: 'Clarins Double Serum Anti-Aging Concentrate 50ml' },
  '8056669925941': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana The One Eau de Parfum Intense 75ml' },
  '8056860214660': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Uomo Verde Assoluto Eau de Parfum 75ml' },
  '3614274626872': { brandEn: 'Valentino', nameEn: 'Valentino Uomo Born In Roma Purple Melancholia Eau de Toilette 100ml' },
  '3614274626858': { brandEn: 'Valentino', nameEn: 'Valentino Donna Born In Roma Purple Melancholia Eau de Parfum 100ml' },
  '614514331033': { brandEn: 'Rasasi', nameEn: 'Rasasi Hawas Black Eau de Parfum 100ml' },
  '3614274337341': { brandEn: 'Valentino', nameEn: 'Valentino Uomo Born In Roma Ivory Eau de Toilette 100ml' },
  '3700578502223': { brandEn: 'Parfum de Marly', nameEn: 'Parfum de Marly Layton Exclusif Parfum 125ml' },
  '3346130009566': { brandEn: 'Hermès', nameEn: 'Hermès Twilly d\'Hermès Poivrée Eau de Parfum 85ml' },
  '8436018276205': { brandEn: 'Rosendo Mateu', nameEn: 'Rosendo Mateu No. 5 Eau de Parfum 100ml' },
  '3607342635876': { brandEn: 'Chloé', nameEn: 'Chloé Love Story Eau de Parfum 75ml' },
  '3346470116375': { brandEn: 'Guerlain', nameEn: 'Guerlain Santal Royal Eau de Parfum 125ml' },
  '8052464896905': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Florence Eau de Parfum 75ml' },
  '3616306110885': { brandEn: 'Chloé', nameEn: 'Chloé Signature Le Parfum 100ml' },
  '3614273672054': { brandEn: 'Valentino', nameEn: 'Valentino Donna Born In Roma Coral Fantasy Eau de Parfum 100ml' },
  '614514331064': { brandEn: 'Rasasi', nameEn: 'Rasasi Hawas Kobra Eau de Parfum 100ml' },
  '614514331057': { brandEn: 'Rasasi', nameEn: 'Rasasi Hawas Elixir Eau de Parfum 100ml' },
  '8056669925859': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana The One For Men Eau de Parfum 100ml' },
  '3616305275745': { brandEn: 'Gucci', nameEn: 'Gucci Flora Gorgeous Gardenia Intense Eau de Parfum 100ml' },
  '3346470148260': { brandEn: 'Guerlain', nameEn: 'Guerlain Absolues Allegoria Oud Essentiel Eau de Parfum 125ml' },
  '3423222108281': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez All Of Me Intense Eau de Parfum 90ml' },
  '3614273790826': { brandEn: 'Valentino', nameEn: 'Valentino Uomo Born In Roma Intense Eau de Parfum 100ml' },
  '3616303470791': { brandEn: 'Gucci', nameEn: 'Gucci Flora Gorgeous Magnolia Eau de Parfum 100ml' },
  '3346130010265': { brandEn: 'Hermès', nameEn: 'Hermès Eau des Merveilles Eau de Toilette 100ml' },
  '3614270659706': { brandEn: 'Viktor & Rolf', nameEn: 'Viktor & Rolf Spicebomb Extreme Eau de Parfum 90ml' },
  '783320421709': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Le Gemme Tygar Eau de Parfum 125ml' },
  '3386460102926': { brandEn: 'Rochas', nameEn: 'Rochas Moustache Eau de Parfum 125ml' },
  '027131006534': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Knowing Eau de Parfum 75ml' },
  '3607345730738': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Paradiso Azzuro Eau de Parfum 75ml' },
  '027131019817': { brandEn: 'Estée Lauder', nameEn: 'Estée Lauder Private Collection Eau de Parfum 50ml' },
  '3614274337365': { brandEn: 'Valentino', nameEn: 'Valentino Donna Born In Roma Ivory Eau de Parfum 100ml' },
  '3145891406801': { brandEn: 'Chanel', nameEn: 'Chanel N°1 Red Camellia Revitalizing Fragrance 100ml' },
  '8052464898077': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Uomo Verde Assoluto Eau de Parfum 100ml' },
};

/** Arabic description overrides for care/makeup — loaded from JSON */
const DESC_AR = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch2-desc-ar.json', import.meta.url), 'utf8'));

function perfumeDescAr(nameAr) {
  return `${nameAr} — عطر راقٍ يتميز بطابع أنيق وثبات جيد.\n\n◆ عائلة العطر: عطر فاخر\n◆ النوتات الرئيسية: نوتات زهرية وخشبية وعنبرية\n◆ الطابع: أنيق وثابت\n◆ الأنسب لـ: الاستخدام اليومي والمناسبات\n◆ الثبات: 6–10 ساعات`;
}

for (const p of products) {
  const en = EN[p.barcode];
  const ar = arNames[p.barcode];
  if (en) { p.brandEn = en.brandEn; p.nameEn = en.nameEn; }
  if (ar) { p.brandAr = ar.brandAr || p.brandEn; p.nameAr = ar.nameAr; }
  if (DESC_AR[p.barcode]) {
    p.descriptionAr = DESC_AR[p.barcode];
  } else if (p.categoryId === PERFUMES) {
    p.descriptionAr = perfumeDescAr(p.nameAr);
  }
}

writeFileSync(PRODUCTS, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Polished ${products.length} batch2 products`);
