#!/usr/bin/env node
import { CATEGORIES, perfumeSubs } from '../lib/core/app-categories.js';

const API_BASE = (process.env.API_BASE || 'http://187.127.88.146/api/v1').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alhayaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '000000';
const CATEGORY_ID = CATEGORIES.perfumes;

const BRANDS = {
  lancome: 'bca2c344-538c-4ef1-ae91-9d12f789d8fa',
  montblanc: '1e1ed2f9-5b4d-4502-b0e8-e0db91dadb6b',
  'carolina-herrera': 'caa4e1d5-77d5-4078-8d89-79778c5eb6e1',
  lacoste: '03b516d5-7c67-4b4c-8689-166434300b7e',
  coach: '932595e5-580b-4bee-9cb8-0edcc387bf55',
  jacomo: 'ec7b2702-6279-4335-a75f-edecad0aa5da',
  cacharel: null,
};

function buildDesc({ introEn, introAr, familyEn, familyAr, notesEn, notesAr, characterEn, characterAr, bestEn, bestAr, longEn, longAr, extraEn = [], extraAr = [] }) {
  const bulletsEn = [
    `◆ Scent family: ${familyEn}`,
    `◆ Key notes: ${notesEn}`,
    `◆ Character: ${characterEn}`,
    `◆ Best for: ${bestEn}`,
    `◆ Longevity: ${longEn}`,
    ...extraEn,
  ];
  const bulletsAr = [
    `◆ عائلة العطر: ${familyAr}`,
    `◆ النوتات الرئيسية: ${notesAr}`,
    `◆ الطابع: ${characterAr}`,
    `◆ الأنسب لـ: ${bestAr}`,
    `◆ الثبات: ${longAr}`,
    ...extraAr,
  ];
  return {
    descriptionEn: `${introEn}\n\n${bulletsEn.join('\n')}`,
    descriptionAr: `${introAr}\n\n${bulletsAr.join('\n')}`,
  };
}

function autoScent(nameEn, nameAr, gender = 'women', isUnisex = false) {
  const g = isUnisex ? 'unisex' : gender;
  const families = {
    men: ['Woody aromatic', 'عطري خشبي'],
    women: ['Floral', 'زهري'],
    unisex: ['Oriental woody', 'شرقي خشبي'],
  };
  const [familyEn, familyAr] = families[g] || families.women;
  const bestEn = g === 'unisex' ? 'Evening and collectors' : 'Daily to evening wear';
  const bestAr = g === 'unisex' ? 'المساء وهواة العطور' : 'الاستخدام اليومي والمساء';
  return {
    introEn: `${nameEn} is an elegant fragrance offering refined character and lasting presence.`,
    introAr: `${nameAr.replace(/\s+\d+\s*مل$/, '')} عطر أنيق يقدم طابعاً راقياً وثباتاً مميزاً.`,
    familyEn,
    familyAr,
    notesEn: 'Bergamot, florals, woods, musk',
    notesAr: 'برغموت وزهور وأخشاب ومسك',
    characterEn: 'Elegant, refined and long-lasting',
    characterAr: 'أنيق وراقٍ وطويل الأمد',
    bestEn,
    bestAr,
    longEn: '6–8 hours with moderate to strong sillage',
    longAr: '6–8 ساعات بثبات جيد إلى قوي',
  };
}

function p(barcode, brand, nameEn, nameAr, subs, scent) {
  const { descriptionEn, descriptionAr } = buildDesc(scent);
  return {
    barcode,
    brand,
    brandId: BRANDS[brand],
    nameEn,
    nameAr,
    subcategoryIds: perfumeSubs(subs),
    isNew: !!subs.isNew,
    descriptionEn,
    descriptionAr,
  };
}

const PRODUCTS = [
  p('3614273927321', 'lancome', 'Lancôme Idôle Now Eau de Parfum 100ml', 'لانكوم آيدول ناو أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme Idôle Now Eau de Parfum 100ml', 'لانكوم آيدول ناو أو دو برفوم 100 مل', 'women')),
  p('3614274510133', 'lancome', 'Lancôme Idôle Peach N Roses Eau de Parfum 100ml', 'لانكوم آيدول بيتش آند روزز أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme Idôle Peach N Roses Eau de Parfum 100ml', 'لانكوم آيدول بيتش آند روزز أو دو برفوم 100 مل', 'women')),
  p('3614274299229', 'lancome', 'Lancôme Idôle Power Eau de Parfum Intense 100ml', 'لانكوم آيدول باور أو دو برفوم إنتنس 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme Idôle Power Eau de Parfum Intense 100ml', 'لانكوم آيدول باور أو دو برفوم إنتنس 100 مل', 'women')),
  p('3614274078565', 'lancome', 'Lancôme Idôle Eau de Toilette 100ml', 'لانكوم آيدول أو دو تواليت 100 مل', { gender: 'women' }, autoScent('Lancôme Idôle Eau de Toilette 100ml', 'لانكوم آيدول أو دو تواليت 100 مل', 'women')),
  p('3614273749558', 'lancome', 'Lancôme Idôle Nectar Eau de Parfum 100ml', 'لانكوم آيدول نيكتار أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme Idôle Nectar Eau de Parfum 100ml', 'لانكوم آيدول نيكتار أو دو برفوم 100 مل', 'women')),
  p('3614273069175', 'lancome', 'Lancôme Idôle Le Parfum 100ml', 'لانكوم آيدول لو بارفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme Idôle Le Parfum 100ml', 'لانكوم آيدول لو بارفوم 100 مل', 'women')),
  p('3614272898288', 'lancome', 'Lancôme Maison Jasmin D\'Eau Eau de Parfum 100ml', 'لانكوم ميزون جاسمين دو أو دو برفوم 100 مل', { gender: 'women', isNiche: true }, autoScent('Lancôme Maison Jasmin D\'Eau Eau de Parfum 100ml', 'women')),
  p('3614271220431', 'lancome', 'Lancôme Maison Oud Bouquet Eau de Parfum 100ml', 'لانكوم ميزون عود بوكيه أو دو برفوم 100 مل', { isUnisex: true, isNiche: true }, autoScent('Lancôme Maison Oud Bouquet Eau de Parfum 100ml', 'لانكوم ميزون عود بوكيه أو دو برفوم 100 مل', 'women', true)),
  p('3147758155112', 'lancome', 'Lancôme Poême Eau de Parfum 100ml', 'لانكوم بوإم أو دو برفوم 100 مل', { gender: 'women' }, autoScent('Lancôme Poême Eau de Parfum 100ml', 'لانكوم بوإم أو دو برفوم 100 مل', 'women')),
  p('3614272992054', 'lancome', 'Lancôme La Vie Est Belle Intensement Eau de Parfum 100ml', 'لانكوم لا في إست بيل إنتنسمان أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme La Vie Est Belle Intensement Eau de Parfum 100ml', 'لانكوم لا في إست بيل إنتنسمان أو دو برفوم 100 مل', 'women')),
  p('3614273694797', 'lancome', 'Lancôme La Vie Est Belle Eau de Parfum Refillable 150ml', 'لانكوم لا في إست بيل أو دو برفوم قابل لإعادة التعبئة 150 مل', { gender: 'women' }, autoScent('Lancôme La Vie Est Belle Eau de Parfum Refillable 150ml', 'لانكوم لا في إست بيل أو دو برفوم قابل لإعادة التعبئة 150 مل', 'women')),
  p('3614274169706', 'lancome', 'Lancôme La Vie Est Belle L\'Elixir Eau de Parfum 100ml', 'لانكوم لا في إست بيل لو إليكسير أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme La Vie Est Belle L\'Elixir Eau de Parfum 100ml', 'women')),
  p('3614274397253', 'lancome', 'Lancôme La Vie Est Belle Vanille Nude Eau de Parfum 100ml', 'لانكوم لا في إست بيل فانيليا نود أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme La Vie Est Belle Vanille Nude Eau de Parfum 100ml', 'لانكوم لا في إست بيل فانيليا نود أو دو برفوم 100 مل', 'women')),
  p('3614273924375', 'lancome', 'Lancôme La Vie Est Belle L\'Extrait Eau de Parfum 50ml', 'لانكوم لا في إست بيل لو إكستراء أو دو برفوم 50 مل', { gender: 'women', isNew: true }, autoScent('Lancôme La Vie Est Belle L\'Extrait Eau de Parfum 50ml', 'women')),
  p('3614274104370', 'lancome', 'Lancôme La Vie Est Belle Rose Extraordinaire Eau de Parfum 100ml', 'لانكوم لا في إست بيل روز إكستراوردنار أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme La Vie Est Belle Rose Extraordinaire Eau de Parfum 100ml', 'لانكوم لا في إست بيل روز إكستراوردنار أو دو برفوم 100 مل', 'women')),
  p('3147758029383', 'lancome', 'Lancôme Miracle Eau de Parfum 100ml', 'لانكوم ميراكل أو دو برفوم 100 مل', { gender: 'women' }, autoScent('Lancôme Miracle Eau de Parfum 100ml', 'لانكوم ميراكل أو دو برفوم 100 مل', 'women')),
  p('3147758034929', 'lancome', 'Lancôme Trésor Eau de Parfum 100ml', 'لانكوم ترسور أو دو برفوم 100 مل', { gender: 'women' }, autoScent('Lancôme Trésor Eau de Parfum 100ml', 'لانكوم ترسور أو دو برفوم 100 مل', 'women')),
  p('3614273650397', 'lancome', 'Lancôme Trésor La Nuit Intense Eau de Parfum 50ml', 'لانكوم ترسور لا نوي إنتنس أو دو برفوم 50 مل', { gender: 'women' }, autoScent('Lancôme Trésor La Nuit Intense Eau de Parfum 50ml', 'لانكوم ترسور لا نوي إنتنس أو دو برفوم 50 مل', 'women')),
  p('3614272491069', 'lancome', 'Lancôme La Nuit Trésor Musc Diamant Eau de Parfum 50ml', 'لانكوم لا نوي ترسور مسك ديامان أو دو برفوم 50 مل', { gender: 'women' }, autoScent('Lancôme La Nuit Trésor Musc Diamant Eau de Parfum 50ml', 'لانكوم لا نوي ترسور مسك ديامان أو دو برفوم 50 مل', 'women')),
  p('3614273650403', 'lancome', 'Lancôme La Nuit Trésor Intense Eau de Parfum 100ml', 'لانكوم لا نوي ترسور إنتنس أو دو برفوم 100 مل', { gender: 'women', isNew: true }, autoScent('Lancôme La Nuit Trésor Intense Eau de Parfum 100ml', 'لانكوم لا نوي ترسور إنتنس أو دو برفوم 100 مل', 'women')),
  p('3386460121514', 'montblanc', 'Montblanc Explorer Ultra Blue Eau de Parfum 100ml', 'مون بلان إكسبلور ألترا بلو أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Montblanc Explorer Ultra Blue Eau de Parfum 100ml', 'مون بلان إكسبلور ألترا بلو أو دو برفوم 100 مل', 'men')),
  p('3386460101035', 'montblanc', 'Montblanc Explorer Eau de Parfum 100ml', 'مون بلان إكسبلور أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Montblanc Explorer Eau de Parfum 100ml', 'مون بلان إكسبلور أو دو برفوم 100 مل', 'men')),
  p('3386460135818', 'montblanc', 'Montblanc Explorer Platinum Eau de Parfum 100ml', 'مون بلان إكسبلور بلاتينوم أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Montblanc Explorer Platinum Eau de Parfum 100ml', 'مون بلان إكسبلور بلاتينوم أو دو برفوم 100 مل', 'men')),
  p('3386460058728', 'montblanc', 'Montblanc Emblem Eau de Toilette 100ml', 'مون بلان إمبلم أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Montblanc Emblem Eau de Toilette 100ml', 'مون بلان إمبلم أو دو تواليت 100 مل', 'men')),
  p('3386460028394', 'montblanc', 'Montblanc Individuel Eau de Toilette 75ml', 'مون بلان إنديفيدوئل أو دو تواليت 75 مل', { gender: 'men' }, autoScent('Montblanc Individuel Eau de Toilette 75ml', 'مون بلان إنديفيدوئل أو دو تواليت 75 مل', 'men')),
  p('3386460144230', 'montblanc', 'Montblanc Legend Blue Eau de Parfum 100ml', 'مون بلان لجند بلو أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Montblanc Legend Blue Eau de Parfum 100ml', 'مون بلان لجند بلو أو دو برفوم 100 مل', 'men')),
  p('3386460127950', 'montblanc', 'Montblanc Legend Red Eau de Parfum 100ml', 'مون بلان لجند ريد أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Montblanc Legend Red Eau de Parfum 100ml', 'مون بلان لجند ريد أو دو برفوم 100 مل', 'men')),
  p('3386460074827', 'montblanc', 'Montblanc Legend Spirit Eau de Toilette 100ml', 'مون بلان لجند سبيريت أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Montblanc Legend Spirit Eau de Toilette 100ml', 'مون بلان لجند سبيريت أو دو تواليت 100 مل', 'men')),
  p('3386460087940', 'montblanc', 'Montblanc Legend Night Eau de Parfum 100ml', 'مون بلان لجند نايت أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Montblanc Legend Night Eau de Parfum 100ml', 'مون بلان لجند نايت أو دو برفوم 100 مل', 'men')),
  p('3386460118125', 'montblanc', 'Montblanc Legend Eau de Parfum 100ml', 'مون بلان لجند أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Montblanc Legend Eau de Parfum 100ml', 'مون بلان لجند أو دو برفوم 100 مل', 'men')),
  p('3386460032681', 'montblanc', 'Montblanc Legend Eau de Toilette 100ml', 'مون بلان لجند أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Montblanc Legend Eau de Toilette 100ml', 'مون بلان لجند أو دو تواليت 100 مل', 'men')),
  p('3386460132763', 'montblanc', 'Montblanc Signature Absolue Eau de Parfum 90ml', 'مون بلان سيغنتشر أبسولو أو دو برفوم 90 مل', { gender: 'women', isNew: true }, autoScent('Montblanc Signature Absolue Eau de Parfum 90ml', 'مون بلان سيغنتشر أبسولو أو دو برفوم 90 مل', 'women')),
  p('3386460113588', 'montblanc', 'Montblanc Signature Eau de Parfum 90ml', 'مون بلان سيغنتشر أو دو برفوم 90 مل', { gender: 'women' }, autoScent('Montblanc Signature Eau de Parfum 90ml', 'مون بلان سيغنتشر أو دو برفوم 90 مل', 'women')),
  p('3386460081931', 'montblanc', 'Montblanc Lady Emblem Elixir Eau de Parfum 75ml', 'مون بلان ليدي إمبلم إليكسير أو دو برفوم 75 مل', { gender: 'women' }, autoScent('Montblanc Lady Emblem Elixir Eau de Parfum 75ml', 'مون بلان ليدي إمبلم إليكسير أو دو برفوم 75 مل', 'women')),
  p('3386460028424', 'montblanc', 'Montblanc Femme Individuelle Eau de Toilette 75ml', 'مون بلان فم إنديفيدوئل أو دو تواليت 75 مل', { gender: 'women' }, autoScent('Montblanc Femme Individuelle Eau de Toilette 75ml', 'مون بلان فم إنديفيدوئل أو دو تواليت 75 مل', 'women')),
  p('3386460128391', 'montblanc', 'Montblanc Starwalker Eau de Toilette 75ml', 'مون بلان ستارووكر أو دو تواليت 75 مل', { gender: 'men' }, autoScent('Montblanc Starwalker Eau de Toilette 75ml', 'مون بلان ستارووكر أو دو تواليت 75 مل', 'men')),
  p('3386460032308', 'montblanc', 'Montblanc Presence Cool Eau de Toilette 75ml', 'مون بلان بريزنس كول أو دو تواليت 75 مل', { gender: 'men' }, autoScent('Montblanc Presence Cool Eau de Toilette 75ml', 'مون بلان بريزنس كول أو دو تواليت 75 مل', 'men')),
  p('3386460028356', 'montblanc', 'Montblanc Presence Eau de Toilette 75ml', 'مون بلان بريزنس أو دو تواليت 75 مل', { gender: 'women' }, autoScent('Montblanc Presence Eau de Toilette 75ml', 'مون بلان بريزنس أو دو تواليت 75 مل', 'women')),
  p('3386460060646', 'montblanc', 'Montblanc Legend Pour Femme Special Edition Eau de Toilette 75ml', 'مون بلان لجند بور فم سبيشل إديشن أو دو تواليت 75 مل', { gender: 'women' }, autoScent('Montblanc Legend Pour Femme Special Edition Eau de Toilette 75ml', 'مون بلان لجند بور فم سبيشل إديشن أو دو تواليت 75 مل', 'women')),
  p('3386460078306', 'coach', 'Coach Eau de Parfum 90ml', 'كوتش أو دو برفوم 90 مل', { gender: 'women' }, autoScent('Coach Eau de Parfum 90ml', 'كوتش أو دو برفوم 90 مل', 'women')),
  p('3386460079136', 'coach', 'Coach Eau de Toilette 90ml', 'كوتش أو دو تواليت 90 مل', { gender: 'women' }, autoScent('Coach Eau de Toilette 90ml', 'كوتش أو دو تواليت 90 مل', 'women')),
  p('3386460095341', 'coach', 'Coach Floral Eau de Parfum 90ml', 'كوتش فلورال أو دو برفوم 90 مل', { gender: 'women' }, autoScent('Coach Floral Eau de Parfum 90ml', 'كوتش فلورال أو دو برفوم 90 مل', 'women')),
  p('8411061113851', 'carolina-herrera', 'Carolina Herrera Good Girl Bowtastic Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بوتاستيك أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Bowtastic Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بوتاستيك أو دو برفوم 80 مل', 'women')),
  p('8411061113868', 'carolina-herrera', 'Carolina Herrera Good Girl Blush Bowtastic Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بلاش بوتاستيك أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Blush Bowtastic Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بلاش بوتاستيك أو دو برفوم 80 مل', 'women')),
  p('8411061106228', 'carolina-herrera', 'Carolina Herrera Very Good Girl Elixir Eau de Parfum 80ml', 'كارولينا هيريرا فيري جود غيرل إليكسير أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Very Good Girl Elixir Eau de Parfum 80ml', 'كارولينا هيريرا فيري جود غيرل إليكسير أو دو برفوم 80 مل', 'women')),
  p('8411061995754', 'carolina-herrera', 'Carolina Herrera Very Good Girl Eau de Parfum 80ml', 'كارولينا هيريرا فيري جود غيرل أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera Very Good Girl Eau de Parfum 80ml', 'كارولينا هيريرا فيري جود غيرل أو دو برفوم 80 مل', 'women')),
  p('8411061083659', 'carolina-herrera', 'Carolina Herrera Good Girl Blush Elixir Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بلاش إليكسير أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Blush Elixir Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بلاش إليكسير أو دو برفوم 80 مل', 'women')),
  p('8411061944691', 'carolina-herrera', 'Carolina Herrera Good Girl Dot Drama Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل دوت دراما أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Dot Drama Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل دوت دراما أو دو برفوم 80 مل', 'women')),
  p('8411061962015', 'carolina-herrera', 'Carolina Herrera Good Girl Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera Good Girl Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل أو دو برفوم 80 مل', 'women')),
  p('8411061972151', 'carolina-herrera', 'Carolina Herrera Good Girl Suprême Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل سوبريم أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Suprême Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل سوبريم أو دو برفوم 80 مل', 'women')),
  p('8411061907559', 'carolina-herrera', 'Carolina Herrera Good Girl Fantastic Pink Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل فانتاستيك بينك أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Fantastic Pink Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل فانتاستيك بينك أو دو برفوم 80 مل', 'women')),
  p('8411061093207', 'carolina-herrera', 'Carolina Herrera Good Girl Sparkling Ice Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل سباركلينج آيس أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera Good Girl Sparkling Ice Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل سباركلينج آيس أو دو برفوم 80 مل', 'women')),
  p('8411061995495', 'carolina-herrera', 'Carolina Herrera Good Girl Superstars Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل سوبرستارز أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera Good Girl Superstars Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل سوبرستارز أو دو برفوم 80 مل', 'women')),
  p('8411061045497', 'carolina-herrera', 'Carolina Herrera Good Girl Midnight Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل ميدنايت أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera Good Girl Midnight Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل ميدنايت أو دو برفوم 80 مل', 'women')),
  p('8411061043868', 'carolina-herrera', 'Carolina Herrera 212 NYC Men Eau de Toilette 100ml', 'كارولينا هيريرا 212 نيويورك من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera 212 NYC Men Eau de Toilette 100ml', 'كارولينا هيريرا 212 نيويورك من أو دو تواليت 100 مل', 'men')),
  p('8411061865583', 'carolina-herrera', 'Carolina Herrera 212 Sexy Men Eau de Toilette 100ml', 'كارولينا هيريرا 212 سيكسي من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera 212 Sexy Men Eau de Toilette 100ml', 'كارولينا هيريرا 212 سيكسي من أو دو تواليت 100 مل', 'men')),
  p('8411061723760', 'carolina-herrera', 'Carolina Herrera 212 VIP Men Eau de Toilette 100ml', 'كارولينا هيريرا 212 فيآب من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera 212 VIP Men Eau de Toilette 100ml', 'كارولينا هيريرا 212 فيآب من أو دو تواليت 100 مل', 'men')),
  p('8411061043844', 'carolina-herrera', 'Carolina Herrera 212 VIP Black Men Eau de Parfum 100ml', 'كارولينا هيريرا 212 فيآب بلاك من أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera 212 VIP Black Men Eau de Parfum 100ml', 'كارولينا هيريرا 212 فيآب بلاك من أو دو برفوم 100 مل', 'men')),
  p('8411061056660', 'carolina-herrera', 'Carolina Herrera 212 VIP Black Limited Edition Eau de Parfum 100ml', 'كارولينا هيريرا 212 فيآب بلاك ليمتد إديشن من أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera 212 VIP Black Limited Edition Eau de Parfum 100ml', 'كارولينا هيريرا 212 فيآب بلاك ليمتد إديشن من أو دو برفوم 100 مل', 'men')),
  p('8411061088197', 'carolina-herrera', 'Carolina Herrera 212 VIP Rose Eau de Parfum 80ml', 'كارولينا هيريرا 212 فيآب روز أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera 212 VIP Rose Eau de Parfum 80ml', 'كارولينا هيريرا 212 فيآب روز أو دو برفوم 80 مل', 'women')),
  p('8411061970959', 'carolina-herrera', 'Carolina Herrera 212 VIP Rose Eau de Parfum 80ml', 'كارولينا هيريرا 212 فيآب روز أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera 212 VIP Rose Eau de Parfum 80ml', 'كارولينا هيريرا 212 فيآب روز أو دو برفوم 80 مل', 'women')),
  p('8411061711767', 'carolina-herrera', 'Carolina Herrera 212 VIP Eau de Parfum 80ml', 'كارولينا هيريرا 212 فيآب أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera 212 VIP Eau de Parfum 80ml', 'كارولينا هيريرا 212 فيآب أو دو برفوم 80 مل', 'women')),
  p('8411061071601', 'carolina-herrera', 'Carolina Herrera Chic Eau de Parfum 80ml', 'كارولينا هيريرا شيك أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera Chic Eau de Parfum 80ml', 'كارولينا هيريرا شيك أو دو برفوم 80 مل', 'women')),
  p('8411061994696', 'carolina-herrera', 'Carolina Herrera 212 Heroes Forever Young Eau de Parfum 80ml', 'كارولينا هيريرا 212 هيروز فوريفر يانج أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera 212 Heroes Forever Young Eau de Parfum 80ml', 'كارولينا هيريرا 212 هيروز فوريفر يانج أو دو برفوم 80 مل', 'women')),
  p('8411061077160', 'carolina-herrera', 'Carolina Herrera La Bomba Eau de Parfum 80ml', 'كارولينا هيريرا لا بومبا أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera La Bomba Eau de Parfum 80ml', 'كارولينا هيريرا لا بومبا أو دو برفوم 80 مل', 'women')),
  p('8411061125281', 'carolina-herrera', 'Carolina Herrera Good Girl Velvet Fatale Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل فلفت فتال أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Velvet Fatale Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل فلفت فتال أو دو برفوم 80 مل', 'women')),
  p('8411061954966', 'carolina-herrera', 'Carolina Herrera Chic Men Eau de Toilette 100ml', 'كارولينا هيريرا شيك من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera Chic Men Eau de Toilette 100ml', 'كارولينا هيريرا شيك من أو دو تواليت 100 مل', 'men')),
  p('8411061962954', 'carolina-herrera', 'Carolina Herrera CH Insignia Men Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ إنسينيا من أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Insignia Men Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ إنسينيا من أو دو برفوم 100 مل', 'men')),
  p('8411061951286', 'carolina-herrera', 'Carolina Herrera CH Kings Limited Edition Men Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ كينغز ليمتد إديشن من أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Kings Limited Edition Men Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ كينغز ليمتد إديشن من أو دو برفوم 100 مل', 'men')),
  p('8411061799635', 'carolina-herrera', 'Carolina Herrera CH Men Eau de Toilette 100ml', 'كارولينا هيريرا سي إيچ من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Men Eau de Toilette 100ml', 'كارولينا هيريرا سي إيچ من أو دو تواليت 100 مل', 'men')),
  p('8411061992876', 'carolina-herrera', 'Carolina Herrera CH Men Under The Sea Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من تحت البحر أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Carolina Herrera CH Men Under The Sea Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من تحت البحر أو دو برفوم 100 مل', 'men')),
  p('8411061746196', 'carolina-herrera', 'Carolina Herrera CH Sport Men Eau de Toilette 100ml', 'كارولينا هيريرا سي إيچ سبورت من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Sport Men Eau de Toilette 100ml', 'كارولينا هيريرا سي إيچ سبورت من أو دو تواليت 100 مل', 'men')),
  p('8411061055182', 'carolina-herrera', 'Carolina Herrera CH Passion Men Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ باشن من أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Passion Men Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ باشن من أو دو برفوم 100 مل', 'men')),
  p('8411061125298', 'carolina-herrera', 'Carolina Herrera Good Girl Blush Velvet Fatale Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بلاش فلفت فتال أو دو برفوم 80 مل', { gender: 'women', isNew: true }, autoScent('Carolina Herrera Good Girl Blush Velvet Fatale Eau de Parfum 80ml', 'كارولينا هيريرا جود غيرل بلاش فلفت فتال أو دو برفوم 80 مل', 'women')),
  p('8411061786161', 'carolina-herrera', 'Carolina Herrera CH Men Eau de Toilette 200ml', 'كارولينا هيريرا سي إيچ من أو دو تواليت 200 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Men Eau de Toilette 200ml', 'كارولينا هيريرا سي إيچ من أو دو تواليت 200 مل', 'men')),
  p('8411061665022', 'carolina-herrera', 'Carolina Herrera CH Men Eau de Toilette 100ml', 'كارولينا هيريرا سي إيچ من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Men Eau de Toilette 100ml', 'كارولينا هيريرا سي إيچ من أو دو تواليت 100 مل', 'men')),
  p('8411061991886', 'carolina-herrera', 'Carolina Herrera Bad Boy Le Parfum Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي لو بارفوم أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Carolina Herrera Bad Boy Le Parfum Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي لو بارفوم أو دو برفوم 100 مل', 'men')),
  p('8411061923245', 'carolina-herrera', 'Carolina Herrera Bad Boy Eau de Toilette 100ml', 'كارولينا هيريرا باد بوي أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera Bad Boy Eau de Toilette 100ml', 'كارولينا هيريرا باد بوي أو دو تواليت 100 مل', 'men')),
  p('8411061083772', 'carolina-herrera', 'Carolina Herrera Bad Boy Cobalt Elixir Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي كوبالت إليكسير أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Carolina Herrera Bad Boy Cobalt Elixir Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي كوبالت إليكسير أو دو برفوم 100 مل', 'men')),
  p('8411061106297', 'carolina-herrera', 'Carolina Herrera Bad Boy Elixir Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي إليكسير أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Carolina Herrera Bad Boy Elixir Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي إليكسير أو دو برفوم 100 مل', 'men')),
  p('8411061977033', 'carolina-herrera', 'Carolina Herrera Bad Boy Gold Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي غولد أو دو برفوم 100 مل', { gender: 'men', isNew: true }, autoScent('Carolina Herrera Bad Boy Gold Eau de Parfum 100ml', 'كارولينا هيريرا باد بوي غولد أو دو برفوم 100 مل', 'men')),
  p('8411061789209', 'carolina-herrera', 'Carolina Herrera Amber Desire Eau de Parfum 100ml', 'كارولينا هيريرا أمبر ديزاير أو دو برفوم 100 مل', { isUnisex: true, isNiche: true }, autoScent('Carolina Herrera Amber Desire Eau de Parfum 100ml', 'كارولينا هيريرا أمبر ديزاير أو دو برفوم 100 مل', 'women', true)),
  p('8411061844977', 'carolina-herrera', 'Carolina Herrera Mystery Tobacco Eau de Parfum 100ml', 'كارولينا هيريرا ميستيري توباكو أو دو برفوم 100 مل', { isUnisex: true, isNiche: true }, autoScent('Carolina Herrera Mystery Tobacco Eau de Parfum 100ml', 'كارولينا هيريرا ميستيري توباكو أو دو برفوم 100 مل', 'women', true)),
  p('8411061789179', 'carolina-herrera', 'Carolina Herrera Nightfall Patchouli Eau de Parfum 100ml', 'كارولينا هيريرا نايتفول باتشولي أو دو برفوم 100 مل', { isUnisex: true, isNiche: true }, autoScent('Carolina Herrera Nightfall Patchouli Eau de Parfum 100ml', 'كارولينا هيريرا نايتفول باتشولي أو دو برفوم 100 مل', 'women', true)),
  p('8411061869437', 'carolina-herrera', 'Carolina Herrera Rose Cruise Eau de Toilette 100ml', 'كارولينا هيريرا روز كروز أو دو تواليت 100 مل', { isUnisex: true, isNiche: true }, autoScent('Carolina Herrera Rose Cruise Eau de Toilette 100ml', 'كارولينا هيريرا روز كروز أو دو تواليت 100 مل', 'women', true)),
  p('8411061883983', 'carolina-herrera', 'Carolina Herrera Orange Affair Eau de Toilette 100ml', 'كارولينا هيريرا أورانج أفير أو دو تواليت 100 مل', { isUnisex: true, isNiche: true }, autoScent('Carolina Herrera Orange Affair Eau de Toilette 100ml', 'كارولينا هيريرا أورانج أفير أو دو تواليت 100 مل', 'women', true)),
  p('8411061962985', 'carolina-herrera', 'Carolina Herrera Insignia Women Eau de Parfum 100ml', 'كارولينا هيريرا إنسينيا نسائية أو دو برفوم 100 مل', { gender: 'women' }, autoScent('Carolina Herrera Insignia Women Eau de Parfum 100ml', 'كارولينا هيريرا إنسينيا نسائية أو دو برفوم 100 مل', 'women')),
  p('8411061061602', 'carolina-herrera', 'Carolina Herrera Eau de Parfum 100ml', 'كارولينا هيريرا كارولينا هيريرا أو دو برفوم 100 مل', { gender: 'women' }, autoScent('Carolina Herrera Eau de Parfum 100ml', 'كارولينا هيريرا كارولينا هيريرا أو دو برفوم 100 مل', 'women')),
  p('8411061081600', 'carolina-herrera', 'Carolina Herrera Herrera for Men Eau de Toilette 100ml', 'كارولينا هيريرا هيريرا فور من أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Carolina Herrera Herrera for Men Eau de Toilette 100ml', 'كارولينا هيريرا هيريرا فور من أو دو تواليت 100 مل', 'men')),
  p('8411061607152', 'carolina-herrera', 'Carolina Herrera CH Men Privé Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من بريفيه أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Men Privé Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من بريفيه أو دو برفوم 100 مل', 'men')),
  p('8411061829127', 'carolina-herrera', 'Carolina Herrera CH Pasión for Her Eau de Parfum 80ml', 'كارولينا هيريرا سي إيچ باشن فور هير أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Carolina Herrera CH Pasión for Her Eau de Parfum 80ml', 'كارولينا هيريرا سي إيچ باشن فور هير أو دو برفوم 80 مل', 'women')),
  p('8411061055199', 'carolina-herrera', 'Carolina Herrera CH Men Africa Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من أفريقيا أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Men Africa Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من أفريقيا أو دو برفوم 100 مل', 'men')),
  p('8411061085530', 'carolina-herrera', 'Carolina Herrera CH Men Wild Love Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من وايلد لوف أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Carolina Herrera CH Men Wild Love Eau de Parfum 100ml', 'كارولينا هيريرا سي إيچ من وايلد لوف أو دو برفوم 100 مل', 'men')),
  p('3614228836043', 'lacoste', 'Lacoste L.12.12 Blanc Eau de Parfum 100ml', 'لاكوست ال ١٢ ١٢ بلانك أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Blanc Eau de Parfum 100ml', 'لاكوست ال ١٢ ١٢ بلانك أو دو برفوم 100 مل', 'men')),
  p('3614229825923', 'lacoste', 'Lacoste L.12.12 Bleu Eau de Parfum 100ml', 'لاكوست ال ١٢ ١٢ بلو أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Bleu Eau de Parfum 100ml', 'لاكوست ال ١٢ ١٢ بلو أو دو برفوم 100 مل', 'men')),
  p('737052413174', 'lacoste', 'Lacoste L.12.12 Blanc Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Blanc Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك أو دو تواليت 100 مل', 'men')),
  p('737052662664', 'lacoste', 'Lacoste L.12.12 Noir Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ نوار أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Noir Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ نوار أو دو تواليت 100 مل', 'men')),
  p('737052483214', 'lacoste', 'Lacoste Essential Eau de Toilette 125ml', 'لاكوست إسنشيال أو دو تواليت 125 مل', { gender: 'men' }, autoScent('Lacoste Essential Eau de Toilette 125ml', 'لاكوست إسنشيال أو دو تواليت 125 مل', 'men')),
  p('737052780382', 'lacoste', 'Lacoste L.12.12 Blanc Pure Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك بيور أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Blanc Pure Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك بيور أو دو تواليت 100 مل', 'men')),
  p('3616303459895', 'lacoste', 'Lacoste L.12.12 Blanc Eau Intense Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك أو إنتنس أو دو تواليت 100 مل', { gender: 'men', isNew: true }, autoScent('Lacoste L.12.12 Blanc Eau Intense Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك أو إنتنس أو دو تواليت 100 مل', 'men')),
  p('3616302931781', 'lacoste', 'Lacoste Red Eau de Toilette 125ml', 'لاكوست ريد أو دو تواليت 125 مل', { gender: 'men' }, autoScent('Lacoste Red Eau de Toilette 125ml', 'لاكوست ريد أو دو تواليت 125 مل', 'men')),
  p('3355800001793', 'lacoste', 'Lacoste L.12.12 Blanc Limited Edition Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك ليمتد إديشن أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Blanc Limited Edition Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ بلانك ليمتد إديشن أو دو تواليت 100 مل', 'men')),
  p('3386460165969', 'lacoste', 'Lacoste L.12.12 Rose Eau de Parfum 100ml', 'لاكوست ال ١٢ ١٢ روز أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Rose Eau de Parfum 100ml', 'لاكوست ال ١٢ ١٢ روز أو دو برفوم 100 مل', 'men')),
  p('3386460149334', 'lacoste', 'Lacoste L.12.12 Rose Sparkling Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ روز سباركلينج أو دو تواليت 100 مل', { gender: 'men' }, autoScent('Lacoste L.12.12 Rose Sparkling Eau de Toilette 100ml', 'لاكوست ال ١٢ ١٢ روز سباركلينج أو دو تواليت 100 مل', 'men')),
  p('3616302013357', 'lacoste', 'Lacoste Match Point Eau de Parfum 100ml', 'لاكوست ماتش بوينت أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Lacoste Match Point Eau de Parfum 100ml', 'لاكوست ماتش بوينت أو دو برفوم 100 مل', 'men')),
  p('3607346355091', 'lacoste', 'Lacoste L.12.12 Pour Elle Sparkling Eau de Parfum 80ml', 'لاكوست ال ١٢ ١٢ بور إلل سباركلينج أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Lacoste L.12.12 Pour Elle Sparkling Eau de Parfum 80ml', 'لاكوست ال ١٢ ١٢ بور إلل سباركلينج أو دو برفوم 80 مل', 'women')),
  p('3386460149266', 'lacoste', 'Lacoste L.12.12 Pour Elle Eau de Parfum 80ml', 'لاكوست ال ١٢ ١٢ بور إلل أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Lacoste L.12.12 Pour Elle Eau de Parfum 80ml', 'لاكوست ال ١٢ ١٢ بور إلل أو دو برفوم 80 مل', 'women')),
  p('3386460149440', 'lacoste', 'Lacoste L.12.12 Pour Elle Natural Eau de Parfum 80ml', 'لاكوست ال ١٢ ١٢ بور إلل ناتورال أو دو برفوم 80 مل', { gender: 'women' }, autoScent('Lacoste L.12.12 Pour Elle Natural Eau de Parfum 80ml', 'لاكوست ال ١٢ ١٢ بور إلل ناتورال أو دو برفوم 80 مل', 'women')),
  p('737052949215', 'jacomo', 'Jacomo de Jacomo Eau de Parfum 100ml', 'جاكومو دي جاكومو أو دو برفوم 100 مل', { gender: 'men' }, autoScent('Jacomo de Jacomo Eau de Parfum 100ml', 'جاكومو دي جاكومو أو دو برفوم 100 مل', 'men')),
  p('3360373016358', 'cacharel', 'Cacharel Noa Eau de Toilette 100ml', 'كاشريل نوا أو دو تواليت 100 مل', { gender: 'women' }, autoScent('Cacharel Noa Eau de Toilette 100ml', 'كاشريل نوا أو دو تواليت 100 مل', 'women')),
  p('3605521659767', 'cacharel', 'Cacharel Amor Amor Eau de Toilette 100ml', 'كاشريل آمور آمور أو دو تواليت 100 مل', { gender: 'women' }, autoScent('Cacharel Amor Amor Eau de Toilette 100ml', 'كاشريل آمور آمور أو دو تواليت 100 مل', 'women')),
  p('3360374533205', 'cacharel', 'Cacharel Anaïs Anaïs L\'Original Eau de Toilette 100ml', 'كاشريل أنايس أنايس لأورجينال أو دو تواليت 100 مل', { gender: 'women' }, autoScent('Cacharel Anaïs Anaïs L\'Original Eau de Toilette 100ml', 'women')),
  p('3360373063680', 'cacharel', 'Cacharel Loulou Eau de Toilette 100ml', 'كاشريل لولو أو دو تواليت 100 مل', { gender: 'women' }, autoScent('Cacharel Loulou Eau de Toilette 100ml', 'كاشريل لولو أو دو تواليت 100 مل', 'women')),
];

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || json?.message || res.statusText);
  return json?.data ?? json;
}

async function fetchExistingBarcodes(token) {
  const barcodes = new Set();
  for (let page = 1; page <= 50; page++) {
    const items = await api(`/products?limit=100&page=${page}`, { token });
    if (!items?.length) break;
    for (const item of items) {
      if (item.barcode) barcodes.add(String(item.barcode));
    }
  }
  return barcodes;
}

async function ensureCacharelBrand(token) {
  const brands = await api('/brands?limit=200', { token });
  const existing = (Array.isArray(brands) ? brands : brands?.items || []).find(
    (b) => b.slug === 'cacharel' || b.name === 'Cacharel',
  );
  if (existing) return existing.id;
  const created = await api('/brands', {
    method: 'POST',
    token,
    body: { name: 'Cacharel', slug: 'cacharel' },
  });
  return created.id;
}

async function main() {
  const token = (await api('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })).accessToken;
  BRANDS.cacharel = await ensureCacharelBrand(token);
  console.log(`Cacharel brand: ${BRANDS.cacharel}`);

  const existing = await fetchExistingBarcodes(token);
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const prod of PRODUCTS) {
    if (existing.has(prod.barcode)) {
      skip += 1;
      console.log(`SKIP ${prod.barcode} — already exists`);
      continue;
    }
    const payload = {
      sku: prod.barcode,
      barcode: prod.barcode,
      name: prod.nameAr,
      nameAr: prod.nameAr,
      nameEn: prod.nameEn,
      slug: slugify(`${prod.nameEn}-${prod.barcode}`),
      brandId: prod.brandId || BRANDS[prod.brand],
      categoryId: CATEGORY_ID,
      subcategoryIds: [...new Set(prod.subcategoryIds)],
      description: prod.descriptionAr,
      descriptionAr: prod.descriptionAr,
      descriptionEn: prod.descriptionEn,
      ingredients: '',
      howToUse: '',
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      stock: 0,
      isActive: true,
      isNew: !!prod.isNew,
      imageIds: [],
    };
    try {
      const created = await api('/products', { method: 'POST', token, body: payload });
      ok += 1;
      existing.add(prod.barcode);
      console.log(`OK ${prod.barcode} -> ${created.id}`);
    } catch (err) {
      fail += 1;
      console.error(`FAIL ${prod.barcode}: ${err.message}`);
    }
  }
  console.log(`\nDone: OK=${ok} SKIP=${skip} FAIL=${fail} / ${PRODUCTS.length}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });