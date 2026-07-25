#!/usr/bin/env node
/** Apply verified English names; Arabic from Sarah store listings. */
import { readFileSync, writeFileSync } from 'fs';

const PRODUCTS_FILE = new URL('../data/sarah-pos-import-products.json', import.meta.url).pathname;
const CANDIDATES_FILE = new URL('../data/sarah-pos-candidates.json', import.meta.url).pathname;
const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
const byBc = new Map(JSON.parse(readFileSync(CANDIDATES_FILE, 'utf8')).map((c) => [c.barcode, c]));

const EN = {
  '7640233341025': { brandEn: 'Elie Saab', nameEn: 'Elie Saab Le Parfum Intense Eau de Parfum 90ml' },
  '3439600056969': { brandEn: 'Mugler', nameEn: 'Mugler Alien Eau de Parfum 90ml' },
  '3454960022522': { brandEn: 'Lalique', nameEn: 'Lalique Encre Noire Eau de Toilette 100ml' },
  '8052464897032': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Uomo Eau de Toilette 100ml' },
  '8052464897759': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Sweet Ferocious Eau de Parfum 75ml' },
  '30166967': { brandEn: 'Maybelline', nameEn: 'Maybelline Lash Sensational Sky High Mascara' },
  '3616304175893': { brandEn: 'Gucci', nameEn: 'Gucci Guilty Elixir Pour Homme Eau de Parfum 60ml' },
  '8011003825745': { brandEn: 'Versace', nameEn: 'Versace Pour Homme Dylan Blue Eau de Toilette 100ml' },
  '3760294350591': { brandEn: 'The Woods Collection', nameEn: 'The Woods Collection Twilight Eau de Parfum 100ml' },
  '3423473053958': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez Narciso Eau de Parfum Ambrée 90ml' },
  '3386461515732': { brandEn: 'Lanvin', nameEn: 'Lanvin Homme Eau de Toilette 100ml' },
  '3700134409829': { brandEn: 'Geparlys', nameEn: 'Geparlys Yes I Am The King Eau de Toilette 100ml' },
  '8052464898206': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Paradiso Rosa Eau de Parfum 75ml' },
  '7640111505631': { brandEn: 'Bentley', nameEn: 'Bentley For Men Azure Eau de Toilette 100ml' },
  '3423222080969': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez All Of Me Eau de Parfum 90ml' },
  '8054754403282': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana K Eau de Parfum 100ml' },
  '8057971182053': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana L\'Imperatrice Eau de Toilette 100ml' },
  '3423222121297': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez For Her Eau de Parfum Intense 100ml' },
  '088300139507': { brandEn: 'Calvin Klein', nameEn: 'Calvin Klein Eternity Moment Eau de Parfum 100ml' },
  '3614273760164': { brandEn: 'Prada', nameEn: 'Prada Paradoxe Eau de Parfum 90ml' },
  '3614274305401': { brandEn: 'Prada', nameEn: 'Prada Paradoxe Radical Essence Parfum 90ml' },
  '3614274000597': { brandEn: 'Prada', nameEn: 'Prada Paradoxe Virtual Flower Eau de Parfum 90ml' },
  '8057971183739': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana Devotion Eau de Parfum 100ml' },
  '8033488154967': { brandEn: 'Xerjoff', nameEn: 'Xerjoff Alexandria II Eau de Parfum 100ml' },
  '3346130009603': { brandEn: 'Hermès', nameEn: 'Hermès Terre d\'Hermès Eau de Toilette 100ml' },
  '3614273261401': { brandEn: 'Valentino', nameEn: 'Valentino Donna Born In Roma Yellow Dream Eau de Parfum 100ml' },
  '3423478819153': { brandEn: 'Narciso Rodriguez', nameEn: 'Narciso Rodriguez For Her Santal Musc Intense Eau de Parfum 100ml' },
  '3432240506726': { brandEn: 'Cartier', nameEn: 'Cartier Declaration Parfum 100ml' },
  '3607347733508': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Paradiso Eau de Parfum 75ml' },
  '3360374533205': { brandEn: 'Cacharel', nameEn: 'Cacharel Anaïs Anaïs Eau de Toilette 100ml' },
  '020714999346': { brandEn: 'Clinique', nameEn: 'Clinique Aromatics Elixir Eau de Parfum 100ml' },
  '3349668645206': { brandEn: 'Paco Rabanne', nameEn: 'Paco Rabanne Million Gold Parfum 90ml' },
  '8435415113960': { brandEn: 'Jean Paul Gaultier', nameEn: 'Jean Paul Gaultier Scandal Elixir Parfum 80ml' },
  '3274872447561': { brandEn: 'Givenchy', nameEn: 'Givenchy Irresistible Rose Velvet Eau de Parfum 80ml' },
  '783320419461': { brandEn: 'Bvlgari', nameEn: 'Bvlgari Man Rain Essence Eau de Parfum 100ml' },
  '7640177360366': { brandEn: 'Chopard', nameEn: 'Chopard Black Incense Malaki Eau de Parfum 80ml' },
  '3360373016358': { brandEn: 'Cacharel', nameEn: 'Cacharel Noa Eau de Toilette 100ml' },
  '3614272761445': { brandEn: 'Valentino', nameEn: 'Valentino Donna Born In Roma Eau de Parfum 100ml' },
  '8435137749607': { brandEn: 'Prada', nameEn: 'Prada L\'Homme Eau de Toilette 100ml' },
  '6294018408550': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Easy Bake Duo Loose Powder Cherry Peach' },
  '8011003895755': { brandEn: 'Versace', nameEn: 'Versace Eros Najim Pour Homme Parfum 100ml' },
  '3432240515377': { brandEn: 'Cartier', nameEn: 'Cartier La Panthère Elixir Eau de Parfum 100ml' },
  '3349668630264': { brandEn: 'Paco Rabanne', nameEn: 'Paco Rabanne Million Gold For Her Eau de Parfum 90ml' },
  '3614273961707': { brandEn: 'Prada', nameEn: 'Prada Paradoxe Intense Eau de Parfum 90ml' },
  '7640111500902': { brandEn: 'Lalique', nameEn: 'Lalique Encre Noire Sport Eau de Toilette 100ml' },
  '8057971188680': { brandEn: 'Dolce & Gabbana', nameEn: 'Dolce & Gabbana The One Gold Eau de Parfum Intense 75ml' },
  '3616302022472': { brandEn: 'Gucci', nameEn: 'Gucci Flora Gorgeous Gardenia Eau de Parfum 100ml' },
  '3614222793496': { brandEn: 'Roberto Cavalli', nameEn: 'Roberto Cavalli Paradiso Assoluto Eau de Parfum 75ml' },
  '3614274172997': { brandEn: 'Prada', nameEn: 'Prada Paradigme Eau de Parfum 100ml' },
  '8435415102346': { brandEn: 'Jean Paul Gaultier', nameEn: 'Jean Paul Gaultier Le Male Elixir Absolu Parfum Intense 125ml' },
};

function extractArabicBrand(raw = '') {
  const parts = String(raw).split(/\s+/).filter((p) => /[\u0600-\u06FF]/.test(p));
  return parts.join(' ').trim() || String(raw).trim();
}

for (const p of products) {
  const src = byBc.get(p.barcode);
  const en = EN[p.barcode];
  if (en) {
    p.brandEn = en.brandEn;
    p.nameEn = en.nameEn;
  }
  if (src?.nameAr) p.nameAr = String(src.nameAr).replace(/^عطر\s+/, '').trim();
  if (src?.brandAr) p.brandAr = extractArabicBrand(src.brandAr) || p.brandEn;
}

writeFileSync(PRODUCTS_FILE, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Polished ${products.length} products`);
