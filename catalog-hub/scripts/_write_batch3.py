#!/usr/bin/env python3
"""Generate import-barcodes-batch-3.mjs — exactly 113 products."""

OUT = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/import-barcodes-batch-3.mjs"

HEADER = r'''#!/usr/bin/env node
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

function autoScent(nameEn, gender = 'women', isUnisex = false) {
  const g = isUnisex ? 'unisex' : gender;
  const families = {
    men: ['Woody aromatic', 'عطري خشبي'],
    women: ['Floral', 'زهري'],
    unisex: ['Oriental woody', 'شرقي خشبي'],
  };
  const [familyEn, familyAr] = families[g] || families.women;
  const bestEn = g === 'unisex' ? 'Evening and special occasions' : 'Daily to evening wear';
  const bestAr = g === 'unisex' ? 'المساء والمناسبات الخاصة' : 'الاستخدام اليومي والمساء';
  return {
    introEn: `${nameEn} is an elegant fragrance offering refined character and lasting presence.`,
    introAr: `${nameEn.split(/\\s+\\d+ml/)[0]} عطر أنيق يقدم طابعاً راقياً وثباتاً مميزاً.`,
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
'''

FOOTER = r'''];
'''

# (barcode, brand, nameEn, nameAr, subs_json_keys, use_auto_scent, custom_scent_or_none)
# subs as dict
RAW = []

def add(bc, brand, en, ar, subs, auto=True, custom=None):
    RAW.append((bc, brand, en, ar, subs, auto, custom))

# ── LANCÔME (20) ──
add("3614273927321","lancome","Lancôme Idôle Now Eau de Parfum 100ml","لانكوم آيدول ناو أو دو برفوم 100 مل",{"gender":"women","isNew":True},False,{"introEn":"Idôle Now celebrates the present moment with a luminous rose-iris signature and sparkling modern femininity.","introAr":"آيدول ناو يحتفي باللحظة الحالية بتوقيع ورد-سوسن مشرق وأنوثة عصرية متألقة.","familyEn":"Floral woody musk","familyAr":"زهري خشبي مسكي","notesEn":"Rose, iris, bergamot, pear, jasmine, vanilla, musk","notesAr":"ورد وسوسن وبرغموت وكمثرى وجاسمين وفانيليا ومسك","characterEn":"Fresh, radiant, optimistic and effortlessly chic","characterAr":"منعش ومشرق ومتفائل وأنيق بلا مجهود","bestEn":"Daily wear, spring and signature femininity","bestAr":"الاستخدام اليومي والربيع والأنوثة المميزة","longEn":"7–9 hours with moderate to strong sillage","longAr":"7–9 ساعات بثبات جيد إلى قوي"})
add("3614274510133","lancome","Lancôme Idôle Peach N Roses Eau de Parfum 100ml","لانكوم آيدول بيتش آند روزز أو دو برفوم 100 مل",{"gender":"women","isNew":True},False,{"introEn":"Idôle Peach N Roses blends juicy peach with velvety roses for a playful, sun-kissed flanker.","introAr":"آيدول بيتش آند روزز يمزج الخوخ العصيري بالورود المخملية لإصدار مرح ومشمس.","familyEn":"Floral fruity","familyAr":"زهري فاكهي","notesEn":"Peach, rose, bergamot, jasmine, sandalwood, musk","notesAr":"خوخ وورد وبرغموت وجاسمين وصندل ومسك","characterEn":"Juicy, romantic, warm and delightfully feminine","characterAr":"عصيري ورومانسي ودافئ وأنثوي بشكل رائع","bestEn":"Day wear, dates and warm seasons","bestAr":"النهار والمواعيد والفصول الدافئة","longEn":"6–8 hours with moderate projection","longAr":"6–8 ساعات بثبات متوسط"})
add("3614274299229","lancome","Lancôme Idôle Power Eau de Parfum Intense 100ml","لانكوم آيدول باور أو دو برفوم إنتنس 100 مل",{"gender":"women","isNew":True},False,{"introEn":"Idôle Power Intense amplifies the Idôle rose with deeper woods and bolder lasting power.","introAr":"آيدول باور إنتنس يعزز ورد آيدول بأخشاب أعمق وثبات أجرأ.","familyEn":"Floral woody","familyAr":"زهري خشبي","notesEn":"Rose, iris, patchouli, cedarwood, vanilla, musk","notesAr":"ورد وسوسن وباتشولي وأرز وفانيليا ومسك","characterEn":"Powerful, confident, elegant and intensely feminine","characterAr":"قوي وواثق وأنيق وأنثوي بشكل مكثف","bestEn":"Evening, office leadership and statement wear","bestAr":"المساء والقيادة المهنية والإطلالات المميزة","longEn":"8–10 hours with strong sillage","longAr":"8–10 ساعات بثبات قوي"})
add("3614274078565","lancome","Lancôme Idôle Eau de Toilette 100ml","لانكوم آيدول أو دو تواليت 100 مل",{"gender":"women"},False,{"introEn":"The original Idôle EDT offers a lighter rose-jasmine-chypre expression of modern empowered femininity.","introAr":"آيدول أو دو تواليت الأصلي يقدم تعبيراً أخف من الورد والجاسمين والشيبري للأنوثة العصرية الواثقة.","familyEn":"Floral chypre","familyAr":"زهري شيبري","notesEn":"Pear, bergamot, rose, jasmine, white musk, patchouli, vanilla","notesAr":"كمثرى وبرغموت وورد وجاسمين ومسك أبيض وباتشولي وفانيليا","characterEn":"Clean, luminous, aspirational and universally flattering","characterAr":"نظيف ومشرق وملهم وجذاب للجميع","bestEn":"Daily wear, office and all seasons","bestAr":"الاستخدام اليومي والعمل وكل الفصول","longEn":"5–7 hours with moderate projection","longAr":"5–7 ساعات بثبات متوسط"})
add("3614273749558","lancome","Lancôme Idôle Nectar Eau de Parfum 100ml","لانكوم آيدول نectar أو دو برfوم 100 مل",{"gender":"women","isNew":True})

print(len(RAW))
