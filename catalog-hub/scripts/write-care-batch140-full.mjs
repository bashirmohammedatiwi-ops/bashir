#!/usr/bin/env node
/** Write data/care-batch140-products.json — 140 hair-care POS barcodes (full catalog) */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NAME_AR, BRAND_AR } from './care-batch140-name-ar.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BARCODES_FILE = path.join(__dirname, 'care-batch140-barcodes.txt');
const OUT = path.join(__dirname, '../data/care-batch140-products.json');

const HC = 'care-hair-care';
const SC = 'care-hair-care-shampoo-conditioners';
const OM = 'care-hair-care-oil-masks';
const ST = 'care-hair-care-hair-styling';
const TR = 'care-hair-care-hair-treatment';
const CL = 'care-hair-care-hair-coloring';
const AC = 'care-hair-care-hair-brushes-accessories';

const BR = {
  nashi: ['Nashi Argan', BRAND_AR.nashi],
  hb: ['Hairburst', BRAND_AR.hb],
  lp: ["L'Oréal Professionnel", BRAND_AR.lp],
  ks: ['Kérastase', BRAND_AR.ks],
  ev: ["L'Oréal Paris Elvive", BRAND_AR.ev],
  gn: ['Garnier Ultra Doux', BRAND_AR.gn],
  ele: ['ELEBVA', BRAND_AR.ele],
  nook: ['NOOK', BRAND_AR.nook],
};

const LATIN = /[a-zA-Z]/;

function desc({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size = 'حسب المنتج' }) {
  const sizeEn = size === 'حسب المنتج' ? 'As listed' : size;
  return {
    introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, size,
    descriptionEn: `${introEn}\n\n◆ Category: ${catEn}\n◆ Product type: ${typeEn}\n◆ Key benefits: ${benefitsEn.join(' · ')}\n◆ Suitable for: Daily hair care routines\n◆ Size: ${sizeEn}`,
    descriptionAr: `${introAr}\n\n◆ التصنيف: ${catAr}\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: ${benefitsAr.join(' · ')}\n◆ الأنسب لـ: روتين العناية اليومي بالشعر\n◆ الحجم: ${size}`,
  };
}

function sizeArFromMl(sizeMl) {
  if (sizeMl === '1 pc') return 'قطعة';
  if (sizeMl === '5 pcs') return '5 قطع';
  if (sizeMl.includes('×')) return `${sizeMl} مل`;
  if (/^\d+$/.test(sizeMl)) return `${sizeMl} مل`;
  return sizeMl;
}

function item({
  barcode, brandEn, brandAr, nameEn, nameAr, typeKey, tertiarySlugs, sizeMl,
  introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr,
  catEn = 'Hair care', catAr = 'العناية بالشعر',
}) {
  return {
    barcode,
    brandEn,
    brandAr,
    nameEn,
    nameAr,
    typeKey,
    subcategorySlugs: [HC],
    tertiarySlugs: [tertiarySlugs],
    ...desc({
      introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr,
      size: sizeArFromMl(sizeMl),
    }),
  };
}

/** @type {Set<string>} barcodes with uncertain product identification */
const UNCERTAIN_BARCODES = new Set([
  '3600523738632', '3600523738625', '3610340028502', '3610340653865', '3610340650659',
  '3600524034931', '3600524004538', '3600521852972', '3600524228040', '3610340667275',
  '7509552875010', '7509552889543', '3610340667237', '3600523944354', '3610340667268',
  '3610340667251', '3474636728305', '3474630267596',
  '4008668230971', '4008668230957', '4008668230964',
]);

/**
 * Compact row: [barcode, brandKey, nameEn, nameAr, typeKey, sizeMl, tertiary?, typeEn?, typeAr?, introEn?, introAr?, benefitsEn?, benefitsAr?, catEn?, catAr?]
 * @type {unknown[][]}
 */
const ROWS = [
  // —— Nashi Argan (24) ——
  ['8025026275616', 'nashi', 'Nashi Argan Try Me Discovery Set 5 pcs', 'مجموعة تجربة ناشي أرغان 5 قطع', 'hair-oil', '5 pcs', TR, 'Discovery hair care set', 'مجموعة اكتشاف للعناية بالشعر', 'Nashi Argan Try Me Set offers five salon favourites to discover the signature argan hair care ritual.', 'مجموعة تجربة ناشي أrغان تضم خمسة منتجات مميزة لتجربة روتين العناية بالأرغان.', ['Salon favourites', 'Travel-friendly sizes', 'Argan-powered care'], ['منتجات صالون مميزة', 'أحجام مناسبة للتجربة', 'عناية بالأrغان']],
  ['8025026277399', 'nashi', 'Nashi Argan Essential Energy Conditioner 150ml', 'بلسم ناشي أrغان الطاقة الأساسية 150 مل', 'conditioner', '150'],
  ['8025026274800', 'nashi', 'Nashi Argan Armonia Scalp Scrub 150ml', 'مقشر فروة الرأس ناشي أrغان أرمونيا 150 مل', 'hair-mask', '150', TR, 'Scalp scrub treatment', 'مقشر لفروة الرأس'],
  ['8025026280832', 'nashi', 'Nashi Argan Blondy Joy Conditioner 150ml', 'بلسم ناشي أrغان بلوندي جوy 150 مل', 'conditioner', '150', SC, 'Blonde care conditioner', 'بلسم للشعر الأشقر'],
  ['8025026008962', 'nashi', 'Nashi Argan Armonia Shampoo 1000ml', 'شامبو ناشي أrغان أرمونيا 1000 مل', 'shampoo', '1000'],
  ['8025026281488', 'nashi', 'Nashi Argan Classic Shampoo 1000ml', 'شامبو ناشي أrغان كلاسيك 1000 مل', 'shampoo', '1000'],
  ['8025026281495', 'nashi', 'Nashi Argan Classic Conditioner 1000ml', 'بلسم ناشي أrغان كلاسيك 1000 مل', 'conditioner', '1000'],
  ['8025026008672', 'nashi', 'Nashi Argan Filler Therapy Restorative Conditioner 1000ml', 'بلسم ناشي أrغان فيller ثيرapy الم restorative 1000 مل', 'conditioner', '1000'],
  ['8025026277863', 'nashi', 'Nashi Argan Deep Infusion Mask 150ml', 'قناع ناشي أrغان ديب إnfusion 150 مل', 'hair-mask', '150', OM, 'Deep restructuring mask', 'قناع إعادة بناء عميق'],
  ['8025026272028', 'nashi', 'Nashi Argan Love Hair Mist 20ml', 'رذاذ ناشي أrغان love hair mist 20 مل', 'leave-in', '20', ST, 'Hair fragrancing mist', 'رذاذ معطر للشعر'],
  ['8025026007521', 'nashi', 'Nashi Argan Oil 30ml', 'زيت ناشي أrغان 30 مل', 'hair-oil', '30', OM],
  ['8025026278266', 'nashi', 'Nashi Argan Instant Hydrating Styling Mask 150ml', 'قناع ناشي أrغان instant hydrating styling 150 مل', 'hair-mask', '150', OM],
  ['8025026273766', 'nashi', 'Nashi Argan Shampoo 200ml', 'شامبو ناشي أrغان 200 مل', 'shampoo', '200'],
  ['8025026274596', 'nashi', 'Nashi Argan Classic Conditioner 200ml', 'بلسم ناشي أrغان كلاسيك 200 مل', 'conditioner', '200'],
  ['8025026274565', 'nashi', 'Nashi Argan Classic Conditioner 500ml', 'بلسم ناشي أrغان كلاسيك 500 مل', 'conditioner', '500'],
  ['8025026273810', 'nashi', 'Nashi Argan Hydra Therapy Shampoo 500ml', 'شامبو ناشي أrغان هيدra ثيرapy 500 مل', 'shampoo', '500'],
  ['8025026281662', 'nashi', 'Nashi Argan Essential Energy Conditioner 500ml', 'بلسم ناشي أrغان الطاقة الأساسية 500 مل', 'conditioner', '500'],
  ['8025026271977', 'nashi', 'Nashi Argan Filler Therapy Lifting Mask 100ml', 'قناع ناشي أrغان فيller ثيرapy lifting 100 مل', 'hair-mask', '100', OM],
  ['8025026277412', 'nashi', 'Nashi Argan Repair & Shine Serum 100ml', 'سيروم ناشي أrغان repair & shine 100 مل', 'leave-in', '100', TR],
  ['8025026008313', 'nashi', 'Nashi Argan Oil 100ml', 'زيت ناشي أrغان 100 مل', 'hair-oil', '100', OM],
  ['8025026008474', 'nashi', 'Nashi Argan Oil Vials Display 24 x 8ml', 'زيت ناشي أrغان أمبولات 24 × 8 مل', 'hair-oil', '24×8', OM],
  ['8025026270536', 'nashi', 'Nashi Argan Armonia Shampoo 250ml', 'شامبو ناشي أrغان أرمونيا 250 مل', 'shampoo', '250'],
  ['8025026280825', 'nashi', 'Nashi Argan Blondy Joy Conditioner 250ml', 'بلسم ناشي أrغان بلوندي جوy 250 مل', 'conditioner', '250'],
  ['8025026271984', 'nashi', 'Nashi Argan Filler Therapy Restorative Shampoo 250ml', 'شامبو ناشي أrغان فيller ثيرapy restorative 250 مل', 'shampoo', '250'],

  // —— Hairburst (9) ——
  ['5060743580639', 'hb', 'Hairburst Scalp Massage Brush', 'فرشاة تدليك فروة الرأس هيرbيرst', 'leave-in', '1 pc', AC, 'Scalp massage brush', 'فرشaة تدليك فروة الرأس', 'Hairburst massage brush stimulates the scalp during shampooing to support healthy-looking hair.', 'فرشaة هيرbيرst تدلّك فروة الرأس أثناء الغسل لدعم مظهر شعر أكثر صحة.', ['Scalp stimulation', 'Even product distribution', 'Gentle exfoliation'], ['تحفيز فروة الرأس', 'توزيع المنتج', 'تقشير لطيف'], 'Hair accessories', 'إكسسوارات الشعر'],
  ['5060743580950', 'hb', 'Hairburst Conditioner for Dry & Damaged Hair 350ml', 'بلسم هيرbيرst للشعر الجاف والتالف 350 مل', 'conditioner', '350'],
  ['5060743580943', 'hb', 'Hairburst Shampoo for Dry & Damaged Hair 350ml', 'شامبو هيرbيرst للشعر الجاف والتالف 350 مل', 'shampoo', '350'],
  ['5060743580912', 'hb', 'Hairburst Conditioner for Oily Hair 350ml', 'بلسم هيرbيرst للشعر الدهني 350 مل', 'conditioner', '350'],
  ['5060743580905', 'hb', 'Hairburst Shampoo for Oily Hair 350ml', 'شامبو هيرbيرst للشعر الدهني 350 مل', 'shampoo', '350'],
  ['5060743580936', 'hb', 'Hairburst Longer & Stronger Conditioner 350ml', 'بلسم هيرbيرst للشعر الأطول والأقوى 350 مل', 'conditioner', '350'],
  ['5060743580929', 'hb', 'Hairburst Shampoo for Curly Hair 350ml', 'شامبو هيرbيرst للشعر المجعد 350 مل', 'shampoo', '350'],
  ['5060743580783', 'hb', 'Hairburst Dry Shampoo 200ml', 'شامبو جاف هيرbيرst 200 مل', 'hair-spray', '200', ST],
  ['5060743580714', 'hb', 'Hairburst Derma Scalp Roller', 'رولer derma لفروة الرأس هيرbيرst', 'leave-in', '1 pc', AC, 'Scalp derma roller', 'رولer derma لفروة الرأس', 'Hairburst derma scalp roller supports scalp care routines when used as directed with Hairburst products.', 'رولer derma من هيرbيرst يدعم روتين العناية بفروة الرأس عند استخدامه حسب التعليمات.', ['Scalp care tool', 'Supports absorption', 'Home scalp ritual'], ['أداة لفروة الرأس', 'يدعم الامتصاص', 'روتين منزلي'], 'Hair accessories', 'إكسssoارات الشعر'],

  // —— L'Oréal Professionnel (32) ——
  ['3474637188207', 'lp', 'Serie Expert Absolut Repair Molecular Shampoo 1500ml', 'شامpo لورéal Professionnel absolut repair molecular 1500 مل', 'shampoo', '1500'],
  ['3474636975570', 'lp', 'Serie Expert Silver Clarifying Shampoo 1500ml', 'شامpo لورéal Professionnel silver 1500 مل', 'shampoo', '1500'],
  ['3474636975976', 'lp', 'Serie Expert Vitamino Color Shampoo 1500ml', 'شامpo لورéal Professionnel vitamino color 1500 مل', 'shampoo', '1500'],
  ['3474636975938', 'lp', 'Serie Expert Absolut Repair Shampoo 1500ml', 'شامpo لورéal Professionnel absolut repair 1500 مل', 'shampoo', '1500'],
  ['3474636975556', 'lp', 'Serie Expert Volumetry Shampoo 1500ml', 'شامpo لورéal Professionnel volumetry 1500 مل', 'shampoo', '1500'],
  ['30160668', 'lp', 'Serie Expert Metal Detox Shampoo 1500ml', 'شامpo لورéal Professionnel metal detox 1500 مل', 'shampoo', '1500'],
  ['3474636975587', 'lp', 'Serie Expert Sensi Balance Shampoo 1500ml', 'شامpo لورéal Professionnel sensi balance 1500 مل', 'shampoo', '1500'],
  ['3474637090531', 'lp', 'Serie Expert Scalp Advanced Anti-Oiliness Mask 250ml', 'قناع لورéal Professionnel للفروة الدهنية 250 مل', 'hair-mask', '250', OM],
  ['3474636976072', 'lp', 'Serie Expert Pro Longer Mask 250ml', 'قناع لورéal Professionnel pro longer 250 مل', 'hair-mask', '250', OM],
  ['3474636975921', 'lp', 'Serie Expert Absolut Repair Shampoo 500ml', 'شامpo لورéal Professionnel absolut repair 500 مل', 'shampoo', '500'],
  ['3474636974429', 'lp', 'Serie Expert Pro Longer Shampoo 300ml', 'شامpo لورéal Professionnel pro longer 300 مل', 'shampoo', '300'],
  ['3474636975396', 'lp', 'Serie Expert Pro Longer Mask 500ml', 'قناع لورéal Professionnel pro longer 500 مل', 'hair-mask', '500', OM],
  ['3474636977307', 'lp', 'Serie Expert Pro Longer Ends Filler Cream 150ml', 'كريم لورéal Professionnel pro longer 150 مل', 'leave-in', '150', TR],
  ['3474636976119', 'lp', 'Serie Expert Pro Longer Conditioner 200ml', 'بلسم لورéal Professionnel pro longer 200 مل', 'conditioner', '200'],
  ['3474636975952', 'lp', 'Serie Expert Vitamino Color Shampoo 500ml', 'شامpo لورéal Professionnel vitamino color 500 مل', 'shampoo', '500'],
  ['3474636202447', 'lp', 'Serie Expert Vitamino Color Fresh Feel Masque 500ml', 'قناع لورéal Professionnel vitamino color 500 مل', 'hair-mask', '500', OM],
  ['3474637069155', 'lp', 'Serie Expert Curl Expression Cream 250ml', 'كريم لورéal Professionnel curl expression 250 مل', 'leave-in', '250', ST],
  ['3474636975679', 'lp', 'Serie Expert Vitamino Color Mask 500ml', 'قناع لورéal Professionnel vitamino color mask 500 مل', 'hair-mask', '500', OM],
  ['3474636975297', 'lp', 'Serie Expert Inforcer Mask 250ml', 'قناع لورéal Professionnel inforcer 250 مل', 'hair-mask', '250', OM],
  ['3474636975211', 'lp', 'Serie Expert Inforcer Conditioner 200ml', 'بلسم لورéal Professionnel inforcer 200 مل', 'conditioner', '200'],
  ['3474637072483', 'lp', 'Serie Expert Curl Expression Shampoo 500ml', 'شامpo لورéal Professionnel curl expression 500 مل', 'shampoo', '500'],
  ['3474637069162', 'lp', 'Serie Expert Curl Expression Mask 500ml', 'قناع لورéal Professionnel curl expression 500 مل', 'hair-mask', '500', OM],
  ['3474637268435', 'lp', 'Serie Expert Vitamino Color Spectrum Glass Shine Serum 50ml', 'مصل لورéal Professionnel spectrum glass shine 50 مل', 'leave-in', '50', ST],
  ['3474637090609', 'lp', 'Serie Expert Mythic Oil 50ml', 'زيت لورéal Professionnel mythic oil 50 مل', 'hair-oil', '50', OM],
  ['3474637268510', 'lp', 'Serie Expert Vitamino Color Spectrum Shampoo 300ml', 'شامpo لورéal Professionnel vitamino color spectrum 300 مل', 'shampoo', '300'],
  ['3474637268381', 'lp', 'Serie Expert Vitamino Color Spectrum Purple Shampoo 300ml', 'شامpo لورéal Professionnel spectrum purple 300 مل', 'shampoo', '300'],
  ['3474637268206', 'lp', 'Serie Expert Vitamino Color Spectrum Green Shampoo 300ml', 'شامpo لورéal Professionnel spectrum green 300 مل', 'shampoo', '300'],
  ['3474637268459', 'lp', 'Serie Expert Vitamino Color Spectrum Mask 250ml', 'قناع لورéal Professionnel vitamino color spectrum 250 مل', 'hair-mask', '250', OM],
  ['3474636974269', 'lp', 'Serie Expert Silver Shampoo 500ml', 'شامpo لورéal Professionnel silver 500 مل', 'shampoo', '500'],
  ['3474637269012', 'lp', 'Serie Expert Vitamino Color Spectrum Conditioner 200ml', 'بلسم لورéal Professionnel vitamino color spectrum 200 مل', 'conditioner', '200'],
  ['3474636976133', 'lp', 'Serie Expert Silver Conditioner 200ml', 'بلسم لورéal Professionnel silver 200 مل', 'conditioner', '200'],
  ['3474636693214', 'lp', 'Serie Expert Pro Source Chamomile Shampoo 1500ml', 'شامpo لورéal Professionnel pro source chamomile 1500 مل', 'shampoo', '1500'],

  // —— Elvive / Garnier (44) ——
  ['3600523736836', 'ev', 'Elvive Color Vive Rapid Reviver Deep Conditioner 180ml', 'بلسم إlvive كolor vive rapid reviver 180 مل', 'conditioner', '180'],
  ['3600523738632', 'ev', 'Elvive Total Repair 5 Rapid Reviver Deep Conditioner 180ml', 'بلسم إlvive total repair 5 rapid reviver 180 مل', 'conditioner', '180'],
  ['3600523738625', 'ev', 'Elvive Dream Long Rapid Reviver Deep Conditioner 180ml', 'بلسم إlvive dream long rapid reviver 180 مل', 'conditioner', '180'],
  ['3600523738649', 'ev', 'Elvive Extraordinary Oil Rapid Reviver Deep Conditioner 180ml', 'بلسم إlvive extraordinary oil rapid reviver 180 مل', 'conditioner', '180'],
  ['3610340028502', 'gn', 'Garnier Ultra Doux Almond Milk Shampoo 300ml', 'شامpo غarnier ultra doux almond milk 300 مل', 'shampoo', '300'],
  ['3610340653865', 'gn', 'Garnier Ultra Doux Avocado Oil & Shea Butter Shampoo 300ml', 'شامpo غarnier ultra doux avocado shea 300 مل', 'shampoo', '300'],
  ['3610340650659', 'gn', 'Garnier Ultra Doux Honey Treasures Shampoo 300ml', 'شامpo غarnier ultra doux honey treasures 300 مل', 'shampoo', '300'],
  ['3600524135720', 'ev', 'Elvive Glycolic Gloss Conditioner 150ml', 'بلسم إlvive glycolic gloss 150 مل', 'conditioner', '150'],
  ['3600524074876', 'ev', 'Elvive Glycolic Gloss Shampoo 150ml', 'شامpo إlvive glycolic gloss 150 مل', 'shampoo', '150'],
  ['3600524127961', 'ev', 'Elvive Bond Repair Shampoo 200ml', 'شامpo إlvive bond repair 200 مل', 'shampoo', '200'],
  ['3600524087593', 'ev', 'Elvive Bond Repair Conditioner 200ml', 'بلسم إlvive bond repair 200 مل', 'conditioner', '200'],
  ['3600524074739', 'ev', 'Elvive Bond Repair Pre-Shampoo Treatment 200ml', 'علاج ما قبل الشampoo إlvive bond repair 200 مل', 'hair-mask', '200', TR],
  ['3600524075651', 'ev', 'Elvive Glycolic Gloss Leave-In Serum 150ml', 'سيروم بدون شطف إlvive glycolic gloss 150 مل', 'leave-in', '150', ST],
  ['3600524034931', 'ev', 'Elvive Glycolic Gloss 5-Minute Lamination Treatment 150ml', 'علاج lamination 5 دقائق إlvive glycolic gloss 150 مل', 'hair-mask', '150', TR],
  ['3600520837963', 'ev', 'Elvive Glycolic Gloss Shampoo 400ml', 'شامpo إlvive glycolic gloss 400 مل', 'shampoo', '400'],
  ['3600524016265', 'ev', 'Elvive Hyaluron Plump Shampoo 300ml', 'شامpo إlvive hyaluron plump 300 مل', 'shampoo', '300'],
  ['3600524004538', 'ev', 'Elvive Bond Repair Pre-Shampoo Treatment 200ml', 'علاج ما قبل الشampoo إlvive bond repair 200 مل', 'hair-mask', '200', TR],
  ['3600521852972', 'ev', 'Elvive Hyaluron Plump Hydrating Shampoo 200ml', 'شامpo إlvive hyaluron plump 200 مل', 'shampoo', '200'],
  ['3600524228040', 'ev', 'Elvive Glycolic Gloss 5-Minute Lamination Premium Treatment 150ml', 'علاج lamination premium 5 دقائق إlvive glycolic gloss 150 مل', 'hair-mask', '150', TR],
  ['3610340653650', 'gn', 'Garnier Ultra Doux Almond Milk Conditioner 400ml', 'بلسم غarnier ultra doux almond milk 400 مل', 'conditioner', '400'],
  ['3610340636691', 'gn', 'Garnier Ultra Doux Avocado Oil & Shea Butter Conditioner 400ml', 'بلسم غarnier ultra doux avocado shea 400 مل', 'conditioner', '400'],
  ['3600523955015', 'ev', 'Elvive Full Resist Reinforcing Shampoo 700ml', 'شامpo إlvive full resist 700 مل', 'shampoo', '700'],
  ['3610340667275', 'gn', 'Garnier Ultra Doux Castor Oil & Almond Milk Conditioner 360ml', 'بلسم غarnier ultra doux castor almond 360 مل', 'conditioner', '360'],
  ['7509552847598', 'ev', 'Elvive Dream Long Straight Shampoo 370ml', 'شامpo إlvive dream long straight 370 مل', 'shampoo', '370'],
  ['7509552843026', 'ev', 'Elvive Dream Long Straight Shampoo 400ml', 'شامpo إlvive dream long straight 400 مل', 'shampoo', '400'],
  ['3600524016234', 'ev', 'Elvive Extraordinary Oil Nourishing Shampoo 300ml', 'شامpo إlvive extraordinary oil 300 مل', 'shampoo', '300'],
  ['3600521453315', 'ev', 'Elvive Dream Long Restoring Conditioner 400ml', 'بلسم إlvive dream long 400 مل', 'conditioner', '400'],
  ['3600520838014', 'ev', 'Elvive Extraordinary Oil Nourishing Conditioner 400ml', 'بلسم إlvive extraordinary oil 400 مل', 'conditioner', '400'],
  ['7509552847505', 'ev', 'Elvive Extraordinary Oil Universal Nourishing Shampoo 370ml', 'شامpo إlvive extraordinary oil universal 370 مل', 'shampoo', '370'],
  ['7509552848021', 'ev', 'Elvive Extraordinary Curls Nourishing Shampoo 370ml', 'شامpo إlvive extraordinary curls 370 مل', 'shampoo', '370'],
  ['7509552847529', 'ev', 'Elvive Extraordinary Coconut Nourishing Shampoo 370ml', 'شامpo إlvive extraordinary coconut 370 مل', 'shampoo', '370'],
  ['3610340020025', 'gn', 'Garnier Ultra Doux Hydrating Aloe Vera Hyaluron Conditioner 400ml', 'بلسم غarnier ultra doux hyaluron 400 مل', 'conditioner', '400'],
  ['7509552875010', 'ev', 'Elvive Extraordinary Oil Nourishing Conditioner 370ml', 'بلسم إlvive extraordinary oil 370 مل', 'conditioner', '370'],
  ['3600523477777', 'ev', 'Elvive Hyaluron Plump Hydrating Shampoo 700ml', 'شامpo إlvive hyaluron plump 700 مل', 'shampoo', '700'],
  ['7509552848007', 'ev', 'Elvive Total Repair 5 Extreme Renewing Shampoo 370ml', 'شامpo إlvive total repair 5 extreme 370 مل', 'shampoo', '370'],
  ['7509552889543', 'ev', 'Elvive Hyaluron Plump Hydrating Shampoo 370ml', 'شامpo إlvive hyaluron plump 370 مل', 'shampoo', '370'],
  ['3610340667237', 'gn', 'Garnier Ultra Doux Castor Oil & Almond Milk Oil Bath Conditioner 360ml', 'بلسم حمام زيت غarnier castor almond 360 مل', 'conditioner', '360'],
  ['3610340649653', 'gn', 'Garnier Ultra Doux Honey Treasures Conditioner 400ml', 'بلسم غarnier ultra doux honey treasures 400 مل', 'conditioner', '400'],
  ['3600523944354', 'ev', 'Elvive Bond Repair Leave-In Serum 200ml', 'سيروم بدون شطف إlvive bond repair 200 مل', 'leave-in', '200', ST],
  ['3610340655197', 'gn', 'Garnier Ultra Doux Rice Water & Starch Conditioner 400ml', 'بلسم غarnier ultra doux rice water 400 مل', 'conditioner', '400'],
  ['3610340667268', 'gn', 'Garnier Ultra Doux Castor Oil & Almond Milk Mask 360ml', 'قناع غarnier ultra doux castor almond 360 مل', 'hair-mask', '360', OM],
  ['3600521767818', 'ev', 'Elvive Dream Long Heat Restore Keratin Shampoo 400ml', 'شامpo إlvive keratin 400 مل', 'shampoo', '400'],
  ['3610340667251', 'gn', 'Garnier Ultra Doux Castor Oil & Almond Milk Shampoo 360ml', 'شامpo غarnier ultra doux castor almond 360 مل', 'shampoo', '360'],
  ['3600524016272', 'ev', 'Elvive Dream Long Restoring Shampoo 300ml', 'شامpo إlvive dream long 300 مل', 'shampoo', '300'],
  ['3600523477821', 'ev', 'Elvive Extraordinary Oil Nourishing Shampoo 700ml', 'شامpo إlvive extraordinary oil 700 مل', 'shampoo', '700'],

  // —— Kérastase (21) ——
  ['3474636692408', 'ks', 'Kérastase Blond Absolu Ultra-Violet Mask 200ml', 'قناع كerastase blond absolu violet 200 مل', 'hair-mask', '200', OM],
  ['3474636728336', 'ks', 'Kérastase Chronologiste Thermo Regenerating Balm Leave-In 10ml', 'بلسم بدون شطف كerastase chronologiste 10 مل', 'leave-in', '10', TR],
  ['3474636728268', 'ks', 'Kérastase Chronologiste Bain Régénérant Shampoo 250ml', 'شامpo كerastase chronologiste bain 250 مل', 'shampoo', '250'],
  ['3474636873999', 'ks', 'Kérastase Chronologiste Bain Régénérant Shampoo 200ml', 'شامpo كerastase chronologiste 200 مل', 'shampoo', '200'],
  ['3474636728305', 'ks', 'Kérastase Elixir Ultime Gift Set', 'مجموعة هداia كerastase elixir ultime', 'hair-oil', '1 pc', OM, 'Hair oil gift set', 'مجموعة زيت شعر'],
  ['3474637157906', 'ks', 'Kérastase Symbiose Bain Crème Apaisant Shampoo 500ml', 'شامpo كerastase symbiose 500 مل', 'shampoo', '500'],
  ['3474637155063', 'ks', 'Kérastase Nutritive Nectar Thermique Heat Protectant 150ml', 'حماية حرارية كerastase nutritive nectar thermique 150 مل', 'heat-protectant', '150', TR],
  ['3474636400195', 'ks', 'Kérastase Discipline Bain Fluidealiste Shampoo 250ml', 'شامpo كerastase discipline bain fluidealiste 250 مل', 'shampoo', '250'],
  ['3474636397433', 'ks', 'Kérastase Specifique Bain Divalent Shampoo 250ml', 'شامpo كerastase specifique 250 مل', 'shampoo', '250'],
  ['3474636858033', 'ks', 'Kérastase Genesis Bain Nutri-Fortifiant Shampoo 250ml', 'شامpo كerastase genesis bain nutri-fortifiant 250 مل', 'shampoo', '250'],
  ['3474636397495', 'ks', 'Kérastase Specifique Masque Hydra-Apaisant 200ml', 'قناع كerastase specifique 200 مل', 'hair-mask', '200', OM],
  ['3474630677630', 'ks', 'Kérastase Elixir Ultime Original Hair Oil 18ml', 'زيت كerastase elixir ultime 18 مل', 'hair-oil', '18', OM],
  ['3474636614103', 'ks', 'Kérastase Elixir Ultime Le Bain Shampoo 250ml', 'شامpo كerastase elixir ultime le bain 250 مل', 'shampoo', '250'],
  ['3474630647770', 'ks', 'Kérastase Protocole Soin N°2 Keratine 400ml', 'علاج كerastase protocole soin n2 keratine 400 مل', 'hair-mask', '400', TR],
  ['3474636968688', 'ks', 'Kérastase Curl Manifesto Bain Hydration Shampoo 250ml', 'شامpo كerastase curl manifesto 250 مل', 'shampoo', '250'],
  ['3474636400218', 'ks', 'Kérastase Resistance Masque Therapiste 200ml', 'قناع كerastase resistance masque therapiste 200 مل', 'hair-mask', '200', OM],
  ['3474636397969', 'ks', 'Kérastase Genesis Bain Hydra-Fortifiant Shampoo 250ml', 'شامpo كerastase genesis bain hydra-fortifiant 250 مل', 'shampoo', '250'],
  ['3474636397945', 'ks', 'Kérastase Resistance Bain Force Architecte Shampoo 250ml', 'شامpo كerastase resistance bain force architecte 250 مل', 'shampoo', '250'],
  ['3474636397884', 'ks', 'Kérastase Resistance Ciment Anti-Usure Conditioner 200ml', '', 'conditioner', '200'],

  // —— ELEBVA (3) ——
  ['4008668230971', 'ele', 'ELEBVA Elea Professional Colour & Care Hair Color Kit', 'طقم صبغة شعر إليبva colour & care', 'hair-color', '1 pc', CL],
  ['4008668230957', 'ele', 'ELEBVA Elea Professional Colour & Care Hair Color Kit', 'طقم صبغة شعر إليبva colour & care', 'hair-color', '1 pc', CL],
  ['4008668230964', 'ele', 'ELEBVA Elea Professional Colour & Care Hair Color Kit', 'طقم صبغة شعر إليبva colour & care', 'hair-color', '1 pc', CL],

  // —— NOOK (6) ——
  ['8033171866177', 'nook', 'NOOK Difference Super Active Lotion 100ml', 'لوشن نوok super active 100 مل', 'leave-in', '100', TR],
  ['8033171866153', 'nook', 'NOOK Difference Energizing Maintenance 12 x 7ml', 'صيانة منشطة نوok 12 × 7 مل', 'leave-in', '12×7', TR],
  ['8033171866061', 'nook', 'NOOK Difference Purifying Shampoo 1000ml', 'شامpo نوok purifying 1000 مل', 'shampoo', '1000'],
  ['8033171866191', 'nook', 'NOOK Difference Repair Shampoo 1000ml', 'شامpo نوok repair 1000 مل', 'shampoo', '1000'],
  ['8033171866054', 'nook', 'NOOK Difference Vitalizing Stimulating Shampoo 1000ml', 'شامpo نوok vitalizing stimulating 1000 مل', 'shampoo', '1000'],
  ['8033171866108', 'nook', 'NOOK Difference Repair Filler Mask 1000ml', 'قناع نوok repair filler 1000 مل', 'hair-mask', '1000', OM],

  // —— Kérastase continued ——
  ['3474630267596', 'ks', 'Kérastase Specifique Stimuliste Anti-Hair Loss Spray 125ml', 'سpray كerastase specifique stimuliste 125 مل', 'hair-spray', '125', TR],
  ['3474637106331', 'ks', 'Kérastase Aminexil Advanced Anti-Hair Loss Treatment 90ml', 'علاج كerastase aminexil advanced 90 مل', 'leave-in', '90', TR],
];

const TYPE_DEFAULTS = {
  shampoo: { typeEn: 'Shampoo', typeAr: 'شامبو', tertiary: SC, introEn: b => `${b} gently cleanses while caring for hair and scalp.`, introAr: b => `${b} ينظف بلطف مع العناية بالشعر وفروة الرأس.`, benefitsEn: ['Gentle cleanse', 'Daily use', 'Salon-quality care'], benefitsAr: ['تنظيف لطيف', 'استخدام يومي', 'عناية بجودة الصالون'] },
  conditioner: { typeEn: 'Conditioner', typeAr: 'بلسم', tertiary: SC, introEn: b => `${b} detangles and nourishes for softer, manageable hair.`, introAr: b => `${b} يفك التشابك ويغذي الشعر لنعومة وسهولة في التسريح.`, benefitsEn: ['Detangling', 'Softness', 'Nourishing care'], benefitsAr: ['فك التشابك', 'نعومة', 'عناية مغذية'] },
  'hair-mask': { typeEn: 'Hair mask', typeAr: 'قناع شعر', tertiary: OM, introEn: b => `${b} delivers intensive nourishment and repair.`, introAr: b => `${b} يمنح تغذية وإصلاحاً مكثفاً.`, benefitsEn: ['Deep repair', 'Intensive nourishment', 'Salon treatment'], benefitsAr: ['إصلاح عميق', 'تغذية مكثفة', 'علاج صالون'] },
  'hair-oil': { typeEn: 'Hair oil', typeAr: 'زيت شعر', tertiary: OM, introEn: b => `${b} nourishes and adds shine with a lightweight finish.`, introAr: b => `${b} يغذي الشعر ويمنحه لمعاناً بلمسة خفيفة.`, benefitsEn: ['Shine & nourishment', 'Lightweight finish', 'Heat-friendly'], benefitsAr: ['لمعان وتغذية', 'لمسة خفيفة', 'مناسب للتصفيف'] },
  'leave-in': { typeEn: 'Leave-in treatment', typeAr: 'علاج بدون شطف', tertiary: TR, introEn: b => `${b} provides no-rinse care for daily protection and manageability.`, introAr: b => `${b} يقدم عناية دون شطف للحماية اليومية وسهولة التسريح.`, benefitsEn: ['No-rinse care', 'Manageability', 'Daily protection'], benefitsAr: ['عناية دون شطف', 'سهولة التسريح', 'حماية يومية'] },
  'hair-spray': { typeEn: 'Hair spray', typeAr: 'بخاخ شعر', tertiary: ST, introEn: b => `${b} refreshes and styles hair with a light finish.`, introAr: b => `${b} ينعش ويصفّف الشعر بلمسة خفيفة.`, benefitsEn: ['Instant refresh', 'Light hold', 'Styling finish'], benefitsAr: ['انتعاش فوري', 'ثبات خفيف', 'لمسة تصفيف'] },
  'hair-color': { typeEn: 'Hair color', typeAr: 'صبغة شعر', tertiary: CL, introEn: b => `${b} delivers professional colour with nourishing care.`, introAr: b => `${b} يقدم لوناً احترافياً مع عناية مغذية.`, benefitsEn: ['Professional colour', 'Grey coverage', 'Nourishing formula'], benefitsAr: ['لون احترافي', 'تغطية الشيب', 'تركيبة مغذية'] },
  'heat-protectant': { typeEn: 'Heat protectant', typeAr: 'حماية من الحرارة', tertiary: TR, introEn: b => `${b} shields hair from heat styling while smoothing frizz.`, introAr: b => `${b} يحمي الشعر من حرارة التصفيف مع تنعيم الهيشان.`, benefitsEn: ['Heat protection', 'Smooth finish', 'Frizz control'], benefitsAr: ['حماية حرارية', 'لمسة ناعمة', 'ضبط الهيشان'] },
};

function rowToItem(row) {
  const [barcode, brandKey, nameEn, , typeKey, sizeMl, tertiaryOverride, typeEnOverride, typeArOverride, introEnOverride, introArOverride, benefitsEnOverride, benefitsArOverride, catEnOverride, catArOverride] = row;
  const [brandEn, brandAr] = BR[brandKey];
  const nameAr = NAME_AR[barcode];
  if (!nameAr) throw new Error(`Missing NAME_AR for ${barcode}`);
  if (LATIN.test(brandAr) || LATIN.test(nameAr)) {
    throw new Error(`Latin in Arabic fields for ${barcode}: brandAr=${brandAr} nameAr=${nameAr}`);
  }
  const def = TYPE_DEFAULTS[typeKey] || TYPE_DEFAULTS.shampoo;
  const tertiarySlugs = tertiaryOverride || def.tertiary;
  const typeEn = typeEnOverride || def.typeEn;
  const typeAr = typeArOverride || def.typeAr;
  const introEn = introEnOverride || def.introEn(nameEn);
  const introAr = introArOverride || def.introAr(nameAr);
  const benefitsEn = benefitsEnOverride || def.benefitsEn;
  const benefitsAr = benefitsArOverride || def.benefitsAr;
  const catEn = catEnOverride || 'Hair care';
  const catAr = catArOverride || 'العناية بالشعر';
  return item({ barcode, brandEn, brandAr, nameEn, nameAr, typeKey, tertiarySlugs, sizeMl, introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr, catEn, catAr });
}

const BY_BARCODE = Object.fromEntries(ROWS.map(r => [r[0], r]));

const BARCODES = readFileSync(BARCODES_FILE, 'utf8').trim().split(/\s+/);

if (BARCODES.length !== 140) {
  console.error(`Expected 140 barcodes, found ${BARCODES.length}`);
  process.exit(1);
}

const missing = BARCODES.filter(bc => !BY_BARCODE[bc]);
if (missing.length) {
  console.error('Missing product definitions for:', missing.join(', '));
  process.exit(1);
}

const PRODUCTS = BARCODES.map(bc => rowToItem(BY_BARCODE[bc]));

writeFileSync(OUT, JSON.stringify(PRODUCTS, null, 2) + '\n');

const uncertain = BARCODES.filter(bc => UNCERTAIN_BARCODES.has(bc));

console.log('Written', PRODUCTS.length, 'entries to', OUT);
console.log('Uncertain barcodes (' + uncertain.length + '):', uncertain.join(', '));
