#!/usr/bin/env node
/** Build scripts/care-batch140-map.json — 140 barcode product map */
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'care-batch140-map.json');

const BR = {
  nashi: ['Nashi Argan', 'ناشي أرغان'],
  hb: ['Hairburst', 'هيربيرست'],
  lp: ["L'Oréal Professionnel", 'لورéal Professionnel'],
  ks: ['Kérastase', 'كerastase'],
  ev: ["L'Oréal Paris Elvive", 'لورéal Paris Elvive'],
  gn: ['Garnier Ultra Doux', 'غarnier Ultra Doux'],
  ele: ['ELEBVA', 'إليبva'],
  nook: ['NOOK', 'نوok'],
};

const SC = 'care-hair-care-shampoo-conditioners';
const OM = 'care-hair-care-oil-masks';
const ST = 'care-hair-care-hair-styling';
const TR = 'care-hair-care-hair-treatment';
const CL = 'care-hair-care-hair-coloring';
const AC = 'care-hair-care-hair-brushes-accessories';

/** @type {[string,string,string,string,string,string,string?,boolean?][]} */
const ROWS = [
  // Nashi Argan (24)
  ['8025026275616', 'nashi', 'Nashi Argan Try Me Discovery Set 5 pcs', 'مجموعة تجربة ناشi أrغان 5 قطع', 'hair-oil', '5 pcs', TR],
  ['8025026277399', 'nashi', 'Nashi Argan Essential Energy Conditioner 150ml', 'بلسم ناشi أrغان الطاقة الأساسية 150 مل', 'conditioner', '150'],
  ['8025026274800', 'nashi', 'Nashi Argan Armonia Scalp Scrub 150ml', 'مقشر فروة الرأس ناشi أrغان أرمونيا 150 مل', 'hair-mask', '150', TR],
  ['8025026280832', 'nashi', 'Nashi Argan Blondy Joy Conditioner 150ml', 'بلسم ناشi أrغان بلوندي جوy 150 مل', 'conditioner', '150'],
  ['8025026008962', 'nashi', 'Nashi Argan Armonia Shampoo 1000ml', 'شامبو ناشi أrغان أرمونيا 1000 مل', 'shampoo', '1000'],
  ['8025026281488', 'nashi', 'Nashi Argan Classic Shampoo 1000ml', 'شامبو ناشi أrغان كلاسيك 1000 مل', 'shampoo', '1000'],
  ['8025026281495', 'nashi', 'Nashi Argan Classic Conditioner 1000ml', 'بلسم ناشi أrغان كلاسيك 1000 مل', 'conditioner', '1000'],
  ['8025026008672', 'nashi', 'Nashi Argan Filler Therapy Restorative Conditioner 1000ml', 'بلسم ناشi أrغان فيller ثيرapy الم restorative 1000 مل', 'conditioner', '1000'],
  ['8025026277863', 'nashi', 'Nashi Argan Deep Infusion Mask 150ml', 'قناع ناشi أrغان ديب إnfusion 150 مل', 'hair-mask', '150'],
  ['8025026272028', 'nashi', 'Nashi Argan Love Hair Mist 20ml', 'رذاذ ناشi أrغان love hair mist 20 مل', 'leave-in', '20', ST],
  ['8025026007521', 'nashi', 'Nashi Argan Oil 30ml', 'زيت ناشi أrغان 30 مل', 'hair-oil', '30'],
  ['8025026278266', 'nashi', 'Nashi Argan Instant Hydrating Styling Mask 150ml', 'قnaع ناشi أrغان instant hydrating styling 150 مل', 'hair-mask', '150'],
  ['8025026273766', 'nashi', 'Nashi Argan Shampoo 200ml', 'شامبو ناشi أrغان 200 مل', 'shampoo', '200'],
  ['8025026274596', 'nashi', 'Nashi Argan Classic Conditioner 200ml', 'بلسم ناشi أrغان كلاسيك 200 مل', 'conditioner', '200'],
  ['8025026274565', 'nashi', 'Nashi Argan Classic Conditioner 500ml', 'بلسم ناشi أrغان كلاسيك 500 مل', 'conditioner', '500'],
  ['8025026273810', 'nashi', 'Nashi Argan Hydra Therapy Shampoo 500ml', 'شامبو ناشi أrغان هيدra ثيرapy 500 مل', 'shampoo', '500'],
  ['8025026281662', 'nashi', 'Nashi Argan Essential Energy Conditioner 500ml', 'بلسم ناشi أrغان الطاقة الأساسية 500 مل', 'conditioner', '500'],
  ['8025026271977', 'nashi', 'Nashi Argan Filler Therapy Lifting Mask 100ml', 'قnaع ناشi أrغان فيller ثيرapy lifting 100 مل', 'hair-mask', '100'],
  ['8025026277412', 'nashi', 'Nashi Argan Repair & Shine Serum 100ml', 'سيروم ناشi أrغان repair & shine 100 مل', 'leave-in', '100', TR],
  ['8025026008313', 'nashi', 'Nashi Argan Oil 100ml', 'زيت ناشi أrغان 100 مل', 'hair-oil', '100'],
  ['8025026008474', 'nashi', 'Nashi Argan Oil Vials Display 24 x 8ml', 'زيت ناشi أrغان أمبولات 24 × 8 مل', 'hair-oil', '24×8'],
  ['8025026270536', 'nashi', 'Nashi Argan Armonia Shampoo 250ml', 'شامبو ناشi أrغان أرمونيا 250 مل', 'shampoo', '250'],
  ['8025026280825', 'nashi', 'Nashi Argan Blondy Joy Conditioner 250ml', 'بلسم ناشi أrغان بلوندي جوy 250 مل', 'conditioner', '250'],
  ['8025026271984', 'nashi', 'Nashi Argan Filler Therapy Restorative Shampoo 250ml', 'شامبو ناشi أrغان فيller ثierapy restorative 250 مل', 'shampoo', '250'],

  // Hairburst (9)
  ['5060743580639', 'hb', 'Hairburst Scalp Massage Brush', 'فرشاة تدليك فروة الرأس هيرbيرst', 'leave-in', '1 pc', AC],
  ['5060743580950', 'hb', 'Hairburst Conditioner for Dry & Damaged Hair 350ml', 'بلسم هيرbيرst للشعر الجاف والتالف 350 مل', 'conditioner', '350'],
  ['5060743580943', 'hb', 'Hairburst Shampoo for Dry & Damaged Hair 350ml', 'شامبو هيرbيرst للشعر الجاف والتالف 350 مل', 'shampoo', '350'],
  ['5060743580912', 'hb', 'Hairburst Conditioner for Oily Hair 350ml', 'بلسم هيرbيرst للشعر الدهني 350 مل', 'conditioner', '350'],
  ['5060743580905', 'hb', 'Hairburst Shampoo for Oily Hair 350ml', 'شامبو هيرbيرst للشعر الدهني 350 مل', 'shampoo', '350'],
  ['5060743580936', 'hb', 'Hairburst Longer & Stronger Conditioner 350ml', 'بلسم هيرbيرst للشعر الأطول والأقوى 350 مل', 'conditioner', '350'],
  ['5060743580929', 'hb', 'Hairburst Shampoo for Curly Hair 350ml', 'شامبو هيرbيرst للشعر المجعد 350 مل', 'shampoo', '350'],
  ['5060743580783', 'hb', 'Hairburst Dry Shampoo 200ml', 'شامبو جاف هيرbيرst 200 مل', 'hair-spray', '200', ST],
  ['5060743580714', 'hb', 'Hairburst Derma Scalp Roller', 'رولer derma لفروة الرأس هيرbيرst', 'leave-in', '1 pc', AC],

  // L'Oreal Professionnel (32)
  ['3474637188207', 'lp', 'Serie Expert Absolut Repair Molecular Shampoo 1500ml', 'شامpo لورéal Professionnel absolut repair molecular 1500 مل', 'shampoo', '1500'],
  ['3474636975570', 'lp', 'Serie Expert Silver Clarifying Shampoo 1500ml', 'شامpo لورéal Professionnel silver 1500 مل', 'shampoo', '1500'],
  ['3474636975976', 'lp', 'Serie Expert Vitamino Color Shampoo 1500ml', 'شامpo لورéal Professionnel vitamino color 1500 مل', 'shampoo', '1500'],
  ['3474636975938', 'lp', 'Serie Expert Absolut Repair Shampoo 1500ml', 'شامpo لورéal Professionnel absolut repair 1500 مل', 'shampoo', '1500'],
  ['3474636975556', 'lp', 'Serie Expert Volumetry Shampoo 1500ml', 'شامpo لورéal Professionnel volumetry 1500 مل', 'shampoo', '1500'],
  ['30160668', 'lp', 'Serie Expert Metal Detox Shampoo 1500ml', 'شامpo لورéal Professionnel metal detox 1500 مل', 'shampoo', '1500'],
  ['3474636975587', 'lp', 'Serie Expert Sensi Balance Shampoo 1500ml', 'شامpo لورéal Professionnel sensi balance 1500 مل', 'shampoo', '1500'],
  ['3474637090531', 'lp', 'Serie Expert Scalp Advanced Anti-Oiliness Mask 250ml', 'قnaع لورéal Professionnel للفروة الدهنية 250 مل', 'hair-mask', '250'],
  ['3474636976072', 'lp', 'Serie Expert Pro Longer Mask 250ml', 'قnaع لورéal Professionnel pro longer 250 مل', 'hair-mask', '250'],
  ['3474636975921', 'lp', 'Serie Expert Absolut Repair Shampoo 500ml', 'شامpo لورéal Professionnel absolut repair 500 مل', 'shampoo', '500'],
  ['3474636974429', 'lp', 'Serie Expert Pro Longer Shampoo 300ml', 'شامpo لورéal Professionnel pro longer 300 مل', 'shampoo', '300'],
  ['3474636975396', 'lp', 'Serie Expert Pro Longer Mask 500ml', 'قnaع لورéal Professionnel pro longer 500 مل', 'hair-mask', '500'],
  ['3474636977307', 'lp', 'Serie Expert Pro Longer Ends Filler Cream 150ml', 'كريم لورéal Professionnel pro longer 150 مل', 'leave-in', '150', TR],
  ['3474636976119', 'lp', 'Serie Expert Pro Longer Conditioner 200ml', 'بلسم لورéal Professionnel pro longer 200 مل', 'conditioner', '200'],
  ['3474636975952', 'lp', 'Serie Expert Vitamino Color Shampoo 500ml', 'شامpo لورéal Professionnel vitamino color 500 مل', 'shampoo', '500'],
  ['3474636202447', 'lp', 'Serie Expert Vitamino Color Fresh Feel Masque 500ml', 'قnaع لورéal Professionnel vitamino color 500 مل', 'hair-mask', '500'],
  ['3474637069155', 'lp', 'Serie Expert Curl Expression Cream 250ml', 'كريم لورéal Professionnel curl expression 250 مل', 'leave-in', '250', ST],
  ['3474636975679', 'lp', 'Serie Expert Vitamino Color Mask 500ml', 'قnaع لورéal Professionnel vitamino color mask 500 مل', 'hair-mask', '500'],
  ['3474636975297', 'lp', 'Serie Expert Inforcer Mask 250ml', 'قnaع لورéal Professionnel inforcer 250 مل', 'hair-mask', '250'],
  ['3474636975211', 'lp', 'Serie Expert Inforcer Conditioner 200ml', 'بلسم لورéal Professionnel inforcer 200 مل', 'conditioner', '200'],
  ['3474637072483', 'lp', 'Serie Expert Curl Expression Shampoo 500ml', 'شامpo لورéal Professionnel curl expression 500 مل', 'shampoo', '500'],
  ['3474637069162', 'lp', 'Serie Expert Curl Expression Mask 500ml', 'قnaع لورéal Professionnel curl expression 500 مل', 'hair-mask', '500'],
  ['3474637268435', 'lp', 'Serie Expert Vitamino Color Spectrum Glass Shine Serum 50ml', 'مصل لورéal Professionnel spectrum glass shine 50 مل', 'leave-in', '50', ST],
  ['3474637090609', 'lp', 'Serie Expert Mythic Oil 50ml', 'زيت لورéal Professionnel mythic oil 50 مل', 'hair-oil', '50'],
  ['3474637268510', 'lp', 'Serie Expert Vitamino Color Spectrum Shampoo 300ml', 'شامpo لورéal Professionnel vitamino color spectrum 300 مل', 'shampoo', '300'],
  ['3474637268381', 'lp', 'Serie Expert Vitamino Color Spectrum Purple Shampoo 300ml', 'شامpo لورéal Professionnel spectrum purple 300 مل', 'shampoo', '300'],
  ['3474637268206', 'lp', 'Serie Expert Vitamino Color Spectrum Green Shampoo 300ml', 'شامpo لورéal Professionnel spectrum green 300 مل', 'shampoo', '300'],
  ['3474637268459', 'lp', 'Serie Expert Vitamino Color Spectrum Mask 250ml', 'قnaع لورéal Professionnel vitamino color spectrum 250 مل', 'hair-mask', '250'],
  ['3474636974269', 'lp', 'Serie Expert Silver Shampoo 500ml', 'شامpo لورéal Professionnel silver 500 مل', 'shampoo', '500'],
  ['3474637269012', 'lp', 'Serie Expert Vitamino Color Spectrum Conditioner 200ml', 'بلسم لورéal Professionnel vitamino color spectrum 200 مل', 'conditioner', '200'],
  ['3474636976133', 'lp', 'Serie Expert Silver Conditioner 200ml', 'بلسم لورéal Professionnel silver 200 مل', 'conditioner', '200'],
  ['3474636693214', 'lp', 'Serie Expert Pro Source Chamomile Shampoo 1500ml', 'شامpo لورéal Professionnel pro source chamomile 1500 مل', 'shampoo', '1500'],
];

// PART2 appended below
