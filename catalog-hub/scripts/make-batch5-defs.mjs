#!/usr/bin/env node
import { writeFileSync } from 'fs';

const pf = (introEn, introAr, familyEn, familyAr, notesEn, notesAr, charEn, charAr, bestEn, bestAr, longEn, longAr) =>
  ({ introEn, introAr, familyEn, familyAr, notesEn, notesAr, charEn, charAr, bestEn, bestAr, longEn, longAr });
const cf = (introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr, sizeEn, sizeAr) =>
  ({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr, sizeEn, sizeAr });
const mf = (introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr) =>
  ({ introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr });

const P = (brandEn, nameEn, subs, p) => ({ brandEn, nameEn, kind: 'perfume', subs, p });
const C = (brandEn, nameEn, careLeaf, typeKey, c) => ({ brandEn, nameEn, kind: 'care', careLeaf, typeKey, c });
const M = (brandEn, nameEn, makeupSub, m) => ({ brandEn, nameEn, kind: 'makeup', makeupSub, m });

const DEFS = {
  '50064861': C('Vaseline', 'Vaseline Lip Therapy 20g', 'care/face-care/lip-care', 'lip-balm', cf(
    'Vaseline Lip Therapy nourishes dry lips with a classic petrolatum-rich formula that locks in moisture for soft, smooth lips.',
    '\u0645\u0631\u0637\u0628 \u0641\u0627\u0632\u0644\u064a\u0646 \u0644\u0644\u0634\u0641\u0627\u0647 \u064a\u063a\u0630\u064a \u0627\u0644\u0634\u0641\u0627\u0647 \u0627\u0644\u062c\u0627\u0641\u0629 \u0628\u062a\u0631\u0643\u064a\u0628\u0629 \u063a\u0646\u064a\u0629 \u0628\u0627\u0644\u0641\u0627\u0632\u0644\u064a\u0646 \u062a\u062d\u0628\u0633 \u0627\u0644\u0631\u0637\u0648\u0628\u0629 \u0648\u062a\u062a\u0631\u0643 \u0627\u0644\u0634\u0641\u0627\u0647 \u0646\u0627\u0639\u0645\u0629.',
    'Lip care', '\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u0634\u0641\u0627\u0647', 'Lip balm', '\u0645\u0631\u0637\u0628 \u0634\u0641\u0627\u0647',
    ['Deep moisture', 'Soothes dryness', 'Classic trusted formula'], ['\u062a\u0631\u0637\u064a\u0628 \u0639\u0645\u064a\u0642', '\u064a\u0647\u062f\u0626 \u0627\u0644\u062c\u0641\u0627\u0641', '\u062a\u0631\u0643\u064a\u0628\u0629 \u0645\u0648\u062b\u0648\u0642\u0629'],
    'Dry or chapped lips', '\u0627\u0644\u0634\u0641\u0627\u0647 \u0627\u0644\u062c\u0627\u0641\u0629 \u0623\u0648 \u0627\u0644\u0645\u062a\u0634\u0642\u0642\u0629', '20 g', '20 \u062c\u0645')),
  '850035582251': C('Mielle', 'Mielle Rosemary Mint Strengthening Conditioner 355ml', 'care/hair-care/shampoo-conditioners', 'conditioner', cf(
    'Mielle Rosemary Mint Conditioner strengthens and softens hair with biotin and natural oils while leaving a fresh herbal scent.',
    '\u0628\u0644\u0633\u0645 \u0645\u064a\u0644\u064a \u0628\u0625\u0643\u0644\u064a\u0644 \u0627\u0644\u062c\u0628\u0644 \u0648\u0627\u0644\u0646\u0639\u0646\u0627\u0639 \u064a\u0642\u0648\u064a \u0627\u0644\u0634\u0639\u0631 \u0648\u064a\u0644\u064a\u0646\u0647 \u0628\u0627\u0644\u0628\u064a\u0648\u062a\u064a\u0646 \u0648\u0627\u0644\u0632\u064a\u0648\u062a \u0627\u0644\u0637\u0628\u064a\u0639\u064a\u0629 \u0628\u0631\u0627\u0626\u062d\u0629 \u0639\u0634\u0628\u064a\u0629 \u0645\u0646\u0639\u0634\u0629.',
    'Hair care', '\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u0634\u0639\u0631', 'Strengthening conditioner', '\u0628\u0644\u0633\u0645 \u0645\u0642\u0648\u064a',
    ['Strengthens strands', 'Adds softness', 'Fresh rosemary mint scent'], ['\u064a\u0642\u0648\u064a \u0627\u0644\u062e\u0635\u0644\u0627\u062a', '\u0646\u0639\u0648\u0645\u0629 \u0644\u0644\u0634\u0639\u0631', '\u0631\u0627\u0626\u062d\u0629 \u0625\u0643\u0644\u064a\u0644 \u0627\u0644\u062c\u0628\u0644 \u0648\u0627\u0644\u0646\u0639\u0646\u0627\u0639'],
    'Weak or dry hair needing daily conditioning', '\u0627\u0644\u0634\u0639\u0631 \u0627\u0644\u0636\u0639\u064a\u0641 \u0623\u0648 \u0627\u0644\u062c\u0627\u0641', '355 ml', '355 \u0645\u0644')),
  '854102006763': C('Mielle', 'Mielle Rosemary Mint Strengthening Hair Mask 340g', 'care/hair-care/oil--masks', 'hair-mask', cf(
    'Mielle Rosemary Mint Hair Mask delivers intensive nourishment to strengthen hair, reduce breakage, and restore softness.',
    '\u0642\u0646\u0627\u0639 \u0645\u064a\u0644\u064a \u0628\u0631\u0648\u0632\u0645\u0627\u0631\u064a \u0648\u0646\u0639\u0646\u0627\u0639 \u064a\u063a\u0630\u064a \u0627\u0644\u0634\u0639\u0631 \u0628\u0639\u0645\u0642 \u0644\u062a\u0642\u0648\u064a\u062a\u0647 \u0648\u062a\u0642\u0644\u064a\u0644 \u0627\u0644\u062a\u0642\u0635\u064f \u0648\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0627\u0644\u0646\u0639\u0648\u0645\u0629.',
    'Hair care', '\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u0634\u0639\u0631', 'Deep conditioning mask', '\u0642\u0646\u0627\u0639 \u062a\u0631\u0637\u064a\u0628 \u0639\u0645\u064a\u0642',
    ['Intensive repair', 'Strengthens hair', 'Smooth finish'], ['\u0625\u0635\u0644\u0627\u062d \u0645\u0643\u062b\u0641', '\u062a\u0642\u0648\u064a\u0629 \u0627\u0644\u0634\u0639\u0631', '\u0644\u0645\u0633\u0629 \u0646\u0627\u0639\u0645\u0629'],
    'Damaged or brittle hair', '\u0627\u0644\u0634\u0639\u0631 \u0627\u0644\u062a\u0627\u0644\u0641 \u0623\u0648 \u0627\u0644\u0647\u0634', '340 g', '340 \u062c\u0645')),
  '737052351100': P('Hugo Boss', 'Hugo Boss Bottled Eau de Toilette 100ml', { gender: 'men' }, pf(
    'Hugo Boss Bottled is a modern masculine classic blending warm spices and woods for confident everyday elegance.',
    '\u0628\u0648\u062a\u0644\u062f \u0645\u0646 \u0647\u0648\u063a\u0648 \u0628\u0648\u0633 \u0639\u0637\u0631 \u0631\u062c\u0627\u0644\u064a \u0643\u0644\u0627\u0633\u064a\u0643\u064a \u064a\u0645\u0632\u062c \u0627\u0644\u062a\u0648\u0627\u0628\u0644 \u0627\u0644\u062f\u0627\u0641\u0626\u0629 \u0648\u0627\u0644\u0623\u062e\u0634\u0627\u0628 \u0628\u0623\u0646\u0627\u0642\u0629 \u064a\u0648\u0645\u064a\u0629 \u0648\u0627\u062b\u0642\u0629.',
    'Woody spicy', '\u062e\u0634\u0628\u064a \u062d\u0627\u0631', 'Apple, cinnamon, geranium, sandalwood, vanilla, cedar',
    '\u062a\u0641\u0627\u062d\u060c \u0642\u0631\u0641\u0629\u060c \u062c\u064a\u0631\u0627\u0646\u064a\u0648\u0645\u060c \u062e\u0634\u0628 \u0627\u0644\u0635\u0646\u062f\u0644\u060c \u0641\u0627\u0646\u064a\u0644\u0627\u060c \u0623\u0631\u0632',
    'Warm, polished, and versatile', '\u062f\u0627\u0641\u0626 \u0648\u0645\u0635\u0642\u0648\u0644 \u0648\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645',
    'Office, daily wear, and evening occasions', '\u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u064a\u0648\u0645\u064a \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062a',
    '6–8 hours with moderate projection', '6\u20138 \u0633\u0627\u0639\u0627\u062a \u0628\u062b\u0628\u0627\u062a \u0645\u062a\u0648\u0633\u0637')),
  '9314839020742': C('QV', 'QV Moisturising Cream 500g', 'care/skin-and-body-care/body-moisturizer', 'body-cream', cf(
    'QV Moisturising Cream is a dermatologist-tested formula for very dry and sensitive skin, delivering long-lasting hydration without fragrance.',
    '\u0643\u0631\u064a\u0645 \u0643\u064a\u0648 \u0641\u064a \u0627\u0644\u0645\u0631\u0637\u0628 \u062a\u0631\u0643\u064a\u0628\u0629 \u0637\u0628\u064a\u0629 \u0645\u062e\u062a\u0628\u0631\u0629 \u0644\u0644\u0628\u0634\u0631\u0629 \u0634\u062f\u064a\u062f \u0627\u0644\u062c\u0641\u0627\u0641 \u0648\u0627\u0644\u062d\u0633\u0627\u0633\u0629 \u0628\u062a\u0631\u0637\u064a\u0628 \u0637\u0648\u064a\u0644 \u062f\u0648\u0646 \u0639\u0637\u0631.',
    'Derma body care', '\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u062c\u0633\u0645 \u0627\u0644\u0637\u0628\u064a\u0629', 'Moisturising cream', '\u0643\u0631\u064a\u0645 \u0645\u0631\u0637\u0628',
    ['Fragrance-free', 'Long-lasting hydration', 'Suitable for sensitive skin'], ['\u062e\u0627\u0644\u064d \u0645\u0646 \u0627\u0644\u0639\u0637\u0631', '\u062a\u0631\u0637\u064a\u0628 \u0637\u0648\u064a\u0644', '\u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0628\u0634\u0631\u0629 \u0627\u0644\u062d\u0633\u0627\u0633\u0629'],
    'Very dry, sensitive, or eczema-prone skin', '\u0627\u0644\u0628\u0634\u0631\u0629 \u0634\u062f\u064a\u062f \u0627\u0644\u062c\u0641\u0627\u0641 \u0623\u0648 \u0627\u0644\u062d\u0633\u0627\u0633\u0629', '500 g', '500 \u062c\u0645')),
  '8809864766884': C('Beauty of Joseon', 'Beauty of Joseon Matte Sun Stick SPF50+ PA++++ 18g', 'care/sun-care/sunscreen', 'sunscreen', cf(
    'Beauty of Joseon Matte Sun Stick offers portable Korean SPF50+ protection with a non-greasy matte finish ideal for touch-ups.',
    '\u0642\u0644\u0645 \u062d\u0645\u0627\u064a\u0629 \u0628\u064a\u0648\u062a\u064a \u0623\u0648\u0641 \u062c\u0648\u0633\u0648\u0646 \u064a\u0648\u0641\u0631 \u0648\u0627\u0642\u064a \u0634\u0645\u0633 \u0643\u0648\u0631\u064a \u0645\u062d\u0645\u0648\u0644 \u0628\u0645\u0639\u0627\u0645\u0644 50+ \u0628\u0644\u0645\u0633\u0629 \u0645\u0637\u0641\u064a\u0629 \u063a\u064a\u0631 \u062f\u0647\u0646\u064a\u0629 \u0644\u0644\u062a\u062c\u062f\u064a\u062f \u062e\u0644\u0627\u0644 \u0627\u0644\u064a\u0648\u0645.',
    'Korean sun care', '\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0634\u0645\u0633 \u0627\u0644\u0643\u0648\u0631\u064a\u0629', 'Matte sun stick', '\u0642\u0644\u0645 \u0648\u0627\u0642\u064a \u0634\u0645\u0633 \u0645\u0637\u0641\u064a',
    ['SPF50+ PA++++', 'Matte finish', 'Easy reapplication'], ['\u062d\u0645\u0627\u064a\u0629 50+', '\u0644\u0645\u0633\u0629 \u0645\u0637\u0641\u064a\u0629', '\u0633\u0647\u0644 \u0627\u0644\u062a\u062c\u062f\u064a\u062f'],
    'Daily sun protection on face and body', '\u0627\u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u064a\u0648\u0645\u064a\u0629 \u0645\u0646 \u0627\u0644\u0634\u0645\u0633', '18 g', '18 \u062c\u0645')),
  '079625014921': M('Real Techniques', 'Real Techniques Miracle Mini Sponges 4-Pack', 'face', mf(
    'Real Techniques Miracle Mini Sponges blend foundation and concealer seamlessly in hard-to-reach areas with a soft, streak-free finish.',
    '\u0627\u0633\u0641\u0646\u062c \u0631\u064a\u0644 \u062a\u0643\u0646\u064a\u0643\u0633 \u0645\u064a\u0646\u064a \u0645\u064a\u0631\u0643\u0644 \u064a\u062f\u0645\u062c \u0627\u0644\u0623\u0633\u0627\u0633 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064a\u0644\u0631 \u0628\u0633\u0644\u0627\u0633\u0629 \u0641\u064a \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0635\u0639\u0628\u0629 \u0628\u0644\u0645\u0633\u0629 \u0646\u0627\u0639\u0645\u0629 \u062f\u0648\u0646 \u062e\u0637\u0648\u0637.',
    'Mini makeup sponges', '\u0627\u0633\u0641\u0646\u062c \u0645\u0643\u064a\u0627\u062c \u0645\u064a\u0646\u064a',
    ['Precision blending', 'Streak-free finish', 'Travel-friendly size'], ['\u062f\u0645\u062c \u062f\u0642\u064a\u0642', '\u0644\u0645\u0633\u0629 \u062e\u0627\u0644\u064a\u0629 \u0645\u0646 \u0627\u0644\u062e\u0637\u0648\u0637', '\u062d\u062c\u0645 \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0633\u0641\u0631'],
    'Foundation and concealer application', '\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u0623\u0633\u0627\u0633 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064a\u0644\u0631')),
  '3432240506641': P('Cartier', 'Cartier La Panthère Eau de Parfum 100ml', { gender: 'women' }, pf(
    'Cartier La Panthère is a bold feline floral with velvety gardenia and musk that captures sensual elegance and power.',
    '\u0644\u0627 \u0628\u0627\u0646\u062a\u064a\u0631 \u0645\u0646 \u0643\u0627\u0631\u062a\u064a\u064a\u0647 \u0632\u0647\u0631\u064a \u062c\u0631\u064a\u0621 \u064a\u062c\u0645\u0639 \u0632\u0647\u0631\u0627\u064b \u0645\u062e\u0645\u0644\u064a\u0627\u064b \u0645\u0639 \u0627\u0644\u0645\u0633\u0643 \u064a\u0639\u0643\u0633 \u0623\u0646\u0627\u0642\u0629 \u0648\u062d\u0633\u064a\u0629 \u0642\u0648\u064a\u0629.',
    'Floral musky', '\u0632\u0647\u0631\u064a \u0645\u0633\u0643\u064a', 'Dried fruits, gardenia, musk, oakmoss',
    '\u0641\u0648\u0627\u0643\u0647 \u0645\u062c\u0641\u0641\u0629\u060c \u0632\u0647\u0631 \u0623\u0628\u064a\u0636\u060c \u0645\u0633\u0643\u060c \u0637\u062d\u0644\u0628 \u0627\u0644\u0628\u0644\u0648\u0637',
    'Sensual, elegant, and distinctive', '\u062d\u0633\u064a \u0648\u0623\u0646\u064a\u0642 \u0648\u0645\u0645\u064a\u0632',
    'Evening wear and special occasions', '\u0627\u0644\u0633\u0647\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062a \u0627\u0644\u062e\u0627\u0635\u0629',
    '7–9 hours with strong projection', '7\u20139 \u0633\u0627\u0639\u0627\u062a \u0628\u062b\u0628\u0627\u062a \u0642\u0648\u064a')),
};

// Generic perfume builder for remaining entries
function gp(brandEn, nameEn, subs, introEn, introAr, familyEn, familyAr, notesEn, notesAr, charEn, charAr, bestEn, bestAr, longEn, longAr) {
  return P(brandEn, nameEn, subs, pf(introEn, introAr, familyEn, familyAr, notesEn, notesAr, charEn, charAr, bestEn, bestAr, longEn, longAr));
}

const D = DEFS;
const g = gp;
const daily = ['Daily wear and special occasions', '\u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u064a\u0648\u0645\u064a \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062a'];
const long = ['6–10 hours with good longevity', '6\u201310 \u0633\u0627\u0639\u0627\u062a \u0628\u062b\u0628\u0627\u062a \u062c\u064a\u062f'];

Object.assign(D, {
  '3349668579839': g('Paco Rabanne', 'Paco Rabanne 1 Million Parfum 100ml', { gender: 'men' },
    'Paco Rabanne 1 Million Parfum is a rich amber-leather scent with spicy warmth and bold masculine allure.',
    '\u0648\u0627\u0646 \u0645\u0644\u064a\u0648\u0646 \u0628\u0627\u0631\u0641\u064a\u0648\u0645 \u0645\u0646 \u0628\u0627\u0643\u0648 \u0631\u0627\u0628\u0627\u0646 \u0639\u0637\u0631 \u0631\u062c\u0627\u0644\u064a \u0641\u0627\u062e\u0631 \u064a\u0645\u0632\u062c \u0627\u0644\u0639\u0646\u0628\u0631 \u0648\u0627\u0644\u062c\u0644\u062f \u0628\u062c\u0627\u0630\u0628\u064a\u0629 \u062c\u0631\u064a\u0621\u0629.',
    'Amber leather', '\u0639\u0646\u0628\u0631 \u0648\u062c\u0644\u062f', 'Blood mandarin, cinnamon, leather, amber, patchouli',
    '\u0628\u0631\u062a\u0642\u0627\u0644 \u062f\u0645\u0648\u064a\u060c \u0642\u0631\u0641\u0629\u060c \u062c\u0644\u062f\u060c \u0639\u0646\u0628\u0631\u060c \u0628\u0627\u062a\u0634\u0648\u0644\u064a',
    'Bold, luxurious, seductive', '\u062c\u0631\u064a\u0621 \u0648\u0641\u0627\u062e\u0631 \u0648\u0622\u0633\u0631', 'Evenings and special nights', '\u0627\u0644\u0633\u0647\u0631\u0627\u062a \u0648\u0627\u0644\u0644\u064a\u0627\u0644', '8–10 hours with strong projection', '8\u201310 \u0633\u0627\u0639\u0627\u062a \u0628\u062b\u0628\u0627\u062a \u0642\u0648\u064a'),
  '3760294350621': g('The Woods Collection', 'The Woods Collection Natural Bloom Eau de Parfum 100ml', { gender: 'women', isNiche: true },
    'The Woods Collection Natural Bloom is a niche floral woody fragrance celebrating fresh blossoms and elegant natural beauty.',
    '\u0646\u0627\u062a\u0634\u0648\u0631\u0627\u0644 \u0628\u0644\u0648\u0645 \u0645\u0646 \u0630\u0627 \u0648\u0648\u062f\u0632 \u0643\u0648\u0644\u064a\u0643\u0634\u0646 \u0639\u0637\u0631 \u0646\u064a\u0634 \u0632\u0647\u0631\u064a \u062e\u0634\u0628\u064a \u064a\u062d\u062a\u0641\u064a \u0628\u0627\u0644\u0632\u0647\u0648\u0631 \u0627\u0644\u0637\u0627\u0632\u062c\u0629 \u0648\u0627\u0644\u062c\u0645\u0627\u0644 \u0627\u0644\u0637\u0628\u064a\u0639\u064a.',
    'Floral woody', '\u0632\u0647\u0631\u064a \u062e\u0634\u0628\u064a', 'Bergamot, jasmine, rose, cedar, musk',
    '\u062d\u0645\u0636\u064a\u0627\u062a\u060c \uي\u0627\u0633\u0645\u064a\u0646\u060c \u0648\u0631\u062f\u060c \u0623\u0631\u0632\u060c \u0645\u0633\u0643',
    'Fresh, refined, naturally elegant', '\u0645\u0646\u0639\u0634 \u0648\u0623\u0646\u064a\u0642 \u0648\u0637\u0628\u064a\u0639\u064a', ...daily, ...long),
});

writeFileSync(new URL('./batch5-meta-defs.json', import.meta.url), JSON.stringify(D, null, 2));
console.log(Object.keys(D).length);
