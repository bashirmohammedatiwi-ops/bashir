#!/usr/bin/env node
/** Fix batch-9 meta kinds and English names. */
import { readFileSync, writeFileSync } from 'fs';

const meta = JSON.parse(readFileSync(new URL('../data/sarah-pos-batch9-meta.json', import.meta.url), 'utf8'));

const FIX = {
  '817513019883': { brandEn: 'Cantu', nameEn: 'Cantu Avocado Hydrating Conditioner 400ml', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'conditioner' },
  '3348901473651': { brandEn: 'Dior', nameEn: 'Dior Joy Deodorant Spray 100ml', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant' },
  '769915234060': { brandEn: 'The Ordinary', nameEn: 'The Ordinary Glycolic Acid 7% Toning Solution', kind: 'care', careLeaf: 'care/face-care/cleansers--toners', typeKey: 'toner' },
  '3606000537736': { brandEn: 'CeraVe', nameEn: 'CeraVe Moisturising Lotion Normal to Dry Skin 236ml', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'cream' },
  '3548752189088': { brandEn: 'Make Up For Ever', nameEn: 'Make Up For Ever HD Skin Face Palette Harmony 1', kind: 'makeup', makeupSub: 'face' },
  '6294018405771': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Icy Nude Eyeshadow Palette', kind: 'makeup', makeupSub: 'eyes' },
  '3380810304848': { brandEn: 'Clarins', nameEn: 'Clarins Dry Touch Sun Care Cream SPF50+', kind: 'care', careLeaf: 'care/sun-care/sunscreen', typeKey: 'sunscreen' },
  '3145891209303': { brandEn: 'Chanel', nameEn: 'Chanel Gabrielle Deodorant Spray 100ml', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant' },
  '817513015328': { brandEn: 'Cantu', nameEn: 'Cantu Sulfate-Free Hydrating Cream Conditioner 400ml', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'conditioner' },
  '764302231530': { brandEn: 'Shea Moisture', nameEn: 'Shea Moisture Manuka Honey & Yogurt Shampoo 384ml', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo' },
  '3614274143751': { brandEn: 'Giorgio Armani', nameEn: 'Giorgio Armani Acqua di Gio Elixir Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'men', isNew: true } },
  '3348901653725': { brandEn: 'Dior', nameEn: 'Dior Purple Oud Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women', isNiche: true } },
  '8011003870233': { brandEn: 'Versace', nameEn: 'Versace Pour Homme Eau de Toilette Set 100ml', kind: 'perfume', subs: { gender: 'men' } },
  '8018365070264': { brandEn: 'Versace', nameEn: 'Versace Crystal Noir Eau de Parfum 50ml', kind: 'perfume', subs: { gender: 'women' } },
  '6294018404347': { brandEn: 'Kayali', nameEn: 'Kayali Vanilla Candy Rock Sugar 42 Eau de Parfum 100ml', kind: 'perfume', subs: { gender: 'women', isNiche: true } },
  '8683608071225': { brandEn: 'Nishane', nameEn: 'Nishane Hacivat Extrait de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '8683608070600': { brandEn: 'Nishane', nameEn: 'Nishane Tempfluo Extrait de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '8681008055395': { brandEn: 'Nishane', nameEn: 'Nishane Zenne Extrait de Parfum 50ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3700578526007': { brandEn: 'Parfums de Marly', nameEn: 'Parfums de Marly Sedley Eau de Parfum 125ml', kind: 'perfume', subs: { gender: 'men', isNiche: true } },
  '8436018276168': { brandEn: 'Rosendo Mateu', nameEn: 'Rosendo Mateu No. 1 Eau de Parfum 100ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
};

for (const [bc, fix] of Object.entries(FIX)) {
  if (!meta[bc]) continue;
  Object.assign(meta[bc], fix);
}

writeFileSync(new URL('../data/sarah-pos-batch9-meta.json', import.meta.url).pathname, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Patched', Object.keys(FIX).filter((b) => meta[b]).length, 'of', Object.keys(meta).length);
