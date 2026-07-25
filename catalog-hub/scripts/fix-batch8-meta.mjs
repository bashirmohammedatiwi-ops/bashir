#!/usr/bin/env node
/** Apply manual fixes to batch-8 meta — kinds, brands, Arabic names. */
import { readFileSync, writeFileSync } from 'fs';

const META_PATH = new URL('../data/sarah-pos-batch8-meta.json', import.meta.url).pathname;
const meta = JSON.parse(readFileSync(META_PATH, 'utf8'));

function pDesc(nameEn, nameAr) {
  return {
    descriptionEn: `${nameEn} is a refined fragrance with elegant character and lasting presence.\n\n◆ Scent family: Eau de parfum\n◆ Key notes: Bergamot, florals, amber, woods, musk\n◆ Character: Elegant and long-lasting\n◆ Best for: Daily to evening wear\n◆ Longevity: 6–10 hours with good projection`,
    descriptionAr: `${nameAr} — عطر راقٍ يتميز بطابع أنيق وثبات جيد.\n\n◆ عائلة العطر: عطر فاخر\n◆ النوتات الرئيسية: نوتات زهرية وخشبية وعنبرية\n◆ الطابع: أنيق وثابت\n◆ الأنسب لـ: الاستخدام اليومي والمناسبات\n◆ الثبات: 6–10 ساعات`,
  };
}
function cDesc(nameEn, nameAr, typeAr, size) {
  return {
    descriptionEn: `${nameEn} supports daily care with a trusted formula for regular use.\n\n◆ Category: Skincare\n◆ Product type: ${typeAr}\n◆ Key benefits: Daily care · Trusted formula · Regular use\n◆ Suitable for: Daily care routines\n◆ Size: ${size}`,
    descriptionAr: `${nameAr} — منتج عناية يومي بتركيبة موثوقة.\n\n◆ التصنيف: العناية\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: عناية يومية · تركيبة موثوقة · للاستخدام المنتظم\n◆ الأنسب لـ: الروتين اليومي\n◆ الحجم: ${size}`,
  };
}
function mDesc(nameEn, nameAr, typeAr) {
  return {
    descriptionEn: `${nameEn} delivers reliable makeup performance for everyday looks.\n\n◆ Category: Makeup\n◆ Product type: ${typeAr}\n◆ Key benefits: Easy application · Buildable result · Everyday wear\n◆ Suitable for: Daily makeup`,
    descriptionAr: `${nameAr} — منتج مكياج عملي لإطلالات يومية.\n\n◆ التصنيف: مكياج\n◆ نوع المنتج: ${typeAr}\n◆ الفوائد الرئيسية: سهل التطبيق · تغطية قابلة للبناء · للاستخدام اليومي\n◆ الأنسب لـ: إطلالات يومية`,
  };
}

const FIX = {
  '083078009649': { brandEn: 'Carmex', nameEn: 'Carmex Lip Balm Variety Pack 3x1', brandAr: 'كارمكس', nameAr: 'كارمكس - مجموعة مرطب الشفاه بنكهات متعددة', kind: 'care', careLeaf: 'care/face-care/face-moisturizer', typeKey: 'lip-balm', ...cDesc('Carmex Lip Balm Variety Pack 3x1', 'كارمكس - مجموعة مرطب الشفاه بنكهات متعددة', 'مرطب شفاه', '—') },
  '856017000010': { brandEn: 'Cantu', nameEn: 'Cantu Shea Butter Moisturizing Shampoo 400ml', brandAr: 'كانتو', nameAr: 'كانتو - شامبو مرطب بزبدة الشيا 400 مل', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo', ...cDesc('Cantu Shea Butter Moisturizing Shampoo 400ml', 'كانتو - شامبو مرطب بزبدة الشيا 400 مل', 'شامبو', '400 ml') },
  '3337875597197': { brandEn: 'CeraVe', nameEn: 'CeraVe Foaming Facial Cleanser 236ml', brandAr: 'سيرافي', nameAr: 'سيرافي - غسول رغوي للبشرة الدهنية 236 مل', kind: 'care', careLeaf: 'care/face-care/cleansers--toners', typeKey: 'cleanser', ...cDesc('CeraVe Foaming Facial Cleanser 236ml', 'سيرافي - غسول رغوي للبشرة الدهنية 236 مل', 'غسول', '236 ml') },
  '3337871322595': { brandEn: 'Vichy', nameEn: 'Vichy Deodorant Roll-On Sensitive Skin 40ml', brandAr: 'فيشي', nameAr: 'فيشي - رول أون مزيل عرق للبشرة الحساسة 40 مل', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant', ...cDesc('Vichy Deodorant Roll-On Sensitive Skin 40ml', 'فيشي - رول أون مزيل عرق للبشرة الحساسة 40 مل', 'مزيل عرق', '40 ml') },
  '3337871310868': { brandEn: 'Vichy', nameEn: 'Vichy 48H Intensive Anti-Perspirant Roll-On 50ml', brandAr: 'فيشي', nameAr: 'فيشي - مزيل عرق مكثف 48 ساعة رول 50 مل', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant', ...cDesc('Vichy 48H Intensive Anti-Perspirant Roll-On 50ml', 'فيشي - مزيل عرق مكثف 48 ساعة رول 50 مل', 'مزيل عرق', '50 ml') },
  '800897003777': { brandEn: 'NYX', nameEn: 'NYX The Brow Glue Clear Brow Mascara', brandAr: 'نيكس', nameAr: 'نيكس - ماسكارا حواجب شفافة', kind: 'makeup', makeupSub: 'eyes', ...mDesc('NYX The Brow Glue Clear Brow Mascara', 'نيكس - ماسكارا حواجب شفافة', 'مكياج العيون') },
  '3337871320362': { brandEn: 'Vichy', nameEn: 'Vichy 72H Anti-Perspirant Deodorant 50ml', brandAr: 'فيشي', nameAr: 'فيشي - مضاد للروائح 72 ساعة 50 مل', kind: 'care', careLeaf: 'care/skin-and-body-care/deodorant', typeKey: 'deodorant', ...cDesc('Vichy 72H Anti-Perspirant Deodorant 50ml', 'فيشي - مضاد للروائح 72 ساعة 50 مل', 'مزيل عرق', '50 ml') },
  '681619818219': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.12', brandAr: 'ذا بالم', nameAr: 'ذا بالم - طقم أحمر شفاه ميني ميت مات هيوز الإصدار 12', kind: 'makeup', makeupSub: 'lips', ...mDesc('The Balm Meet Matt Hughes Mini Lip Set Vol.12', 'ذا بالم - طقم أحمر شفاه ميني ميت مات هيوز الإصدار 12', 'مكياج الشفاه') },
  '3548752189095': { brandEn: 'Make Up For Ever', nameEn: 'Make Up For Ever HD Skin Face Palette Harmony 2', brandAr: 'ميك أب فور إيفر', nameAr: 'ميك أب فور إيفر - باليت وجه إتش دي سكن هارموني 2', kind: 'makeup', makeupSub: 'face', ...mDesc('Make Up For Ever HD Skin Face Palette Harmony 2', 'ميك أب فور إيفر - باليت وجه إتش دي سكن هارموني 2', 'مكياج الوجه') },
  '764302204176': { brandEn: 'Shea Moisture', nameEn: 'Shea Moisture Daily Hydration Shampoo Coconut Oil 384ml', brandAr: 'شيا مويستشر', nameAr: 'شيا مويستشر - شامبو مرطب يومي بزيت جوز الهند 384 مل', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo', ...cDesc('Shea Moisture Daily Hydration Shampoo Coconut Oil 384ml', 'شيا مويستشر - شامبو مرطب يومي بزيت جوز الهند 384 مل', 'شامبو', '384 ml') },
  '764302215837': { brandEn: 'Shea Moisture', nameEn: 'Shea Moisture Coconut & Hibiscus Curl Enhancing Smoothie 384ml', brandAr: 'شيا مويستشر', nameAr: 'شيا مويستشر - كريم تنعيم تجعيد جوز الهند والكركديه 384 مل', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', ...cDesc('Shea Moisture Coconut & Hibiscus Curl Enhancing Smoothie 384ml', 'شيا مويستشر - كريم تنعيم تجعيد جوز الهند والكركديه 384 مل', 'علاج شعر', '384 ml') },
  '856017000126': { brandEn: 'Cantu', nameEn: 'Cantu Shea Butter Leave-In Conditioning Cream 453g', brandAr: 'كانتو', nameAr: 'كانتو - كريم بلسم بدون شطف بزبدة الشيا 453 جم', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'conditioner', ...cDesc('Cantu Shea Butter Leave-In Conditioning Cream 453g', 'كانتو - كريم بلسم بدون شطف بزبدة الشيا 453 جم', 'بلسم', '453 g') },
  '764302290209': { brandEn: 'Shea Moisture', nameEn: 'Shea Moisture Jamaican Black Castor Oil Strengthen & Restore Shampoo', brandAr: 'شيا مويستشر', nameAr: 'شيا مويستشر - شامبو تقوية وإصلاح بزيت الخروع الجamaيكي', kind: 'care', careLeaf: 'care/hair-care/shampoo-conditioners', typeKey: 'shampoo', ...cDesc('Shea Moisture Jamaican Black Castor Oil Strengthen & Restore Shampoo', 'شيا مويستشر - شامبو تقوية وإصلاح بزيت الخروع الجamaيكي', 'شامبو', '—') },
  '681619818271': { brandEn: 'The Balm', nameEn: 'The Balm Meet Matt Hughes Mini Lip Set Vol.14', brandAr: 'ذا بالم', nameAr: 'ذا بالم - طقم أحمر شفاه ميني ميت مات هيوز الإصدار 14', kind: 'makeup', makeupSub: 'lips', ...mDesc('The Balm Meet Matt Hughes Mini Lip Set Vol.14', 'ذا بالم - طقم أحمر شفاه ميني ميت مات هيوز الإصدار 14', 'مكياج الشفاه') },
  '3562700361005': { brandEn: 'Jaguar', nameEn: 'Jaguar Green Men Eau de Toilette 100ml', brandAr: 'جاكuar', nameAr: 'جaguar - جرين مen أو دو توalet 100 مل', kind: 'perfume', subs: { gender: 'men' } },
  '3562700373084': { brandEn: 'Jaguar', nameEn: 'Jaguar Classic Blue Eau de Toilette 100ml', brandAr: 'جaguar', nameAr: 'جaguar - كلاسيك بlu أو دو توalet 100 مل', kind: 'perfume', subs: { gender: 'men' } },
  '072140000219': { brandEn: 'Eucerin', nameEn: 'Eucerin Original Healing Cream 454g', brandAr: 'يوسirين', nameAr: 'يوسirين - كريم الشفاء الأصلي 454 جم', kind: 'care', careLeaf: 'care/skin-and-body-care/body-moisturizer', typeKey: 'cream', ...cDesc('Eucerin Original Healing Cream 454g', 'يوسirين - كريم الشفاء الأصلي 454 جم', 'كريم', '454 g') },
  '5907587149687': { brandEn: 'Inglot', nameEn: 'Inglot AMC Gel Eye Liner 68', brandAr: 'إinglot', nameAr: 'إinglot - آيلاiner جel AMC رقم 68', kind: 'makeup', makeupSub: 'eyes', ...mDesc('Inglot AMC Gel Eye Liner 68', 'إinglot - آيلاiner جel AMC رقم 68', 'مكياج العيون') },
  '817513015311': { brandEn: 'Cantu', nameEn: 'Cantu Moisturizing Curl Activator Cream 400ml', brandAr: 'كانتو', nameAr: 'كانتو - كريم منشط تجعيد مرطب 400 مل', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', ...cDesc('Cantu Moisturizing Curl Activator Cream 400ml', 'كانتو - كريم منشط تجعيد مرطب 400 مل', 'علاج شعر', '400 ml') },
  '3274872428058': { brandEn: 'Givenchy', nameEn: "Givenchy L'Interdit Rouge Eau de Parfum 80ml", brandAr: 'جivenchy', nameAr: 'جivenchy - لan interdit rouge أو duo parfum 80 ml', kind: 'perfume', subs: { gender: 'women', isNew: true } },
  '3337875797719': { brandEn: 'La Roche-Posay', nameEn: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ 50ml', brandAr: 'la roche-posay', nameAr: 'la roche-posay - واقي شمس anthelios uvmune 400 invisible fluid SPF50+ 50 ml', kind: 'care', careLeaf: 'care/sun-care/sunscreen', typeKey: 'sunscreen', ...cDesc('La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ 50ml', 'la roche-posay - واقي شمس anthelios uvmune 400 invisible fluid SPF50+ 50 ml', 'واقي شمس', '50 ml') },
  '3274872441057': { brandEn: 'Givenchy', nameEn: 'Givenchy Gentleman Eau de Parfum Boisee 100ml', brandAr: 'جivenchy', nameAr: 'جivenchy - gentleman boisee أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'men' } },
  '6291106038354': { brandEn: 'Huda Beauty', nameEn: 'Huda Beauty Rose Quartz Eyeshadow Palette', brandAr: 'huda beauty', nameAr: 'huda beauty - باليت ظلal rose quartz', kind: 'makeup', makeupSub: 'eyes', ...mDesc('Huda Beauty Rose Quartz Eyeshadow Palette', 'huda beauty - باليت ظلal rose quartz', 'مكياج العيون') },
  '3349668582297': { brandEn: 'Paco Rabanne', nameEn: 'Paco Rabanne Phantom Eau de Toilette 100ml', brandAr: 'paco rabanne', nameAr: 'paco rabanne - phantom أو duo toilette 100 ml', kind: 'perfume', subs: { gender: 'men', isNew: true } },
  '3386460078573': { brandEn: 'Rochas', nameEn: 'Rochas Madame Rochas Eau de Toilette 100ml', brandAr: 'rochas', nameAr: 'rochas - madame rochas أو duo toilette 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '3274872439078': { brandEn: 'Givenchy', nameEn: 'Givenchy Reserve Privee Eau de Parfum 100ml', brandAr: 'جivenchy', nameAr: 'جivenchy - reserve privee أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'men', isNiche: true } },
  '3360373063680': { brandEn: 'Cacharel', nameEn: 'Cacharel Amor Amor Eau de Toilette 100ml', brandAr: 'cacharel', nameAr: 'cacharel - amor amor أو duo toilette 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '085715806352': { brandEn: 'Dunhill', nameEn: 'Dunhill Icon Racing Blue Eau de Parfum 100ml', brandAr: 'dunhill', nameAr: 'dunhill - icon racing blue أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'men' } },
  '3760294350669': { brandEn: 'The Woods Collection', nameEn: 'The Woods Collection Natural Dusk Eau de Parfum 100ml', brandAr: 'the woods collection', nameAr: 'the woods collection - natural dusk أو duo parfum 100 ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '022548237564': { brandEn: 'DKNY', nameEn: 'DKNY Be Delicious Eau de Parfum 100ml', brandAr: 'dkny', nameAr: 'dkny - be delicious أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '3614229461312': { brandEn: 'Gucci', nameEn: 'Gucci Bloom Profumo Di Fiori Eau de Parfum 100ml', brandAr: 'gucci', nameAr: 'gucci - bloom profumo di fiori أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '3612345679642': { brandEn: 'Vertus', nameEn: 'Vertus Sole Patchouli Eau de Parfum 100ml', brandAr: 'vertus', nameAr: 'vertus - sole patchouli أو duo parfum 100 ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '3760294350713': { brandEn: 'The Woods Collection', nameEn: 'The Woods Collection Panorama Eau de Parfum 100ml', brandAr: 'the woods collection', nameAr: 'the woods collection - panorama أو duo parfum 100 ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '4250338487516': { brandEn: 'Essence', nameEn: 'Essence I Love Extreme Volume Mascara', brandAr: 'essence', nameAr: 'essence - i love extreme volume mascara', kind: 'makeup', makeupSub: 'eyes', ...mDesc('Essence I Love Extreme Volume Mascara', 'essence - i love extreme volume mascara', 'مكياج العيون') },
  '3606000537743': { brandEn: 'CeraVe', nameEn: 'CeraVe Hydrating Facial Cleanser 355ml', brandAr: 'سيرافي', nameAr: 'سيرافي - غسول مرطب للوجه 355 مل', kind: 'care', careLeaf: 'care/face-care/cleansers--toners', typeKey: 'cleanser', ...cDesc('CeraVe Hydrating Facial Cleanser 355ml', 'سيرافي - غسول مرطب للوجه 355 مل', 'غسول', '355 ml') },
  '3349668588732': { brandEn: 'Paco Rabanne', nameEn: 'Paco Rabanne Invictus Victory Eau de Parfum Extreme 100ml', brandAr: 'paco rabanne', nameAr: 'paco rabanne - invictus victory extrême أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'men', isNew: true } },
  '3145891297201': { brandEn: 'Chanel', nameEn: 'Chanel Allure Sensuelle Eau de Parfum 50ml', brandAr: 'chanel', nameAr: 'chanel - allure sensuelle أو duo parfum 50 ml', kind: 'perfume', subs: { gender: 'women' } },
  '3137370357476': { brandEn: 'Nina Ricci', nameEn: 'Nina Ricci Nina Eau de Toilette 80ml', brandAr: 'nina ricci', nameAr: 'nina ricci - nina أو duo toilette 80 ml', kind: 'perfume', subs: { gender: 'women' } },
  '3145891125306': { brandEn: 'Chanel', nameEn: 'Chanel Allure Eau de Parfum 100ml', brandAr: 'chanel', nameAr: 'chanel - allure أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '817513010040': { brandEn: 'Cantu', nameEn: 'Cantu Deep Treatment Masque 340g', brandAr: 'كانتو', nameAr: 'كانتو - ماسك علاج عميق 340 جم', kind: 'care', careLeaf: 'care/hair-care/hair-treatment', typeKey: 'hair-treatment', ...cDesc('Cantu Deep Treatment Masque 340g', 'كانتو - ماسك علاج عميق 340 جم', 'علاج شعر', '340 g') },
  '7640111493723': { brandEn: 'Jaguar', nameEn: 'Jaguar Classic Gold Eau de Toilette 100ml', brandAr: 'jaguar', nameAr: 'jaguar - classic gold أو duo toilette 100 ml', kind: 'perfume', subs: { gender: 'men' } },
  '3700134402233': { brandEn: 'Geparlys', nameEn: 'Geparlys Infinite Pleasure Eau de Parfum 100ml', brandAr: 'غابرليس', nameAr: 'غابرليس - infinite pleasure أو duo parfum 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '3337875549530': { brandEn: 'La Roche-Posay', nameEn: 'La Roche-Posay Anthelios Anti-Shine Sunscreen Spray SPF50+ 75ml', brandAr: 'la roche-posay', nameAr: 'la roche-posay - anthelios anti-shine spray SPF50+ 75 ml', kind: 'care', careLeaf: 'care/sun-care/sunscreen', typeKey: 'sunscreen', ...cDesc('La Roche-Posay Anthelios Anti-Shine Sunscreen Spray SPF50+ 75ml', 'la roche-posay - anthelios anti-shine spray SPF50+ 75 ml', 'واقي شمس', '75 ml') },
  '3380810424072': { brandEn: 'Clarins', nameEn: 'Clarins UV Plus SPF50+ Rose Multi-Protection Sunscreen 30ml', brandAr: 'clarins', nameAr: 'clarins - uv plus SPF50+ rose 30 ml', kind: 'care', careLeaf: 'care/sun-care/sunscreen', typeKey: 'sunscreen', ...cDesc('Clarins UV Plus SPF50+ Rose Multi-Protection Sunscreen 30ml', 'clarins - uv plus SPF50+ rose 30 ml', 'واقي شمس', '30 ml') },
  '3760294350645': { brandEn: 'The Woods Collection', nameEn: 'The Woods Collection Natural Secret Eau de Parfum 100ml', brandAr: 'the woods collection', nameAr: 'the woods collection - natural secret أو duo parfum 100 ml', kind: 'perfume', subs: { isUnisex: true, isNiche: true } },
  '817513015700': { brandEn: 'Cantu', nameEn: 'Cantu Wave Whip Curling Mousse 248ml', brandAr: 'كانتو', nameAr: 'كانتو - موس تجعيد wave whip 248 ml', kind: 'care', careLeaf: 'care/hair-care/hair-styling', typeKey: 'hair-treatment', ...cDesc('Cantu Wave Whip Curling Mousse 248ml', 'كانتو - موس تجعيد wave whip 248 ml', 'تصفيف شعر', '248 ml') },
  '3274870002168': { brandEn: 'Givenchy', nameEn: 'Givenchy Xeryus Eau de Toilette 100ml', brandAr: 'givenchy', nameAr: 'givenchy - xeryus أو duo toilette 100 ml', kind: 'perfume', subs: { gender: 'men' } },
  '602004070432': { brandEn: 'Benefit', nameEn: 'Benefit Benetint Rose Tinted Lip & Cheek Stain 10ml', brandAr: 'benefit', nameAr: 'benefit - benetint rose tinted lip 10 ml', kind: 'makeup', makeupSub: 'lips', ...mDesc('Benefit Benetint Rose Tinted Lip & Cheek Stain 10ml', 'benefit - benetint rose tinted lip 10 ml', 'مكياج الشفاه') },
  '3454960014664': { brandEn: 'Lalique', nameEn: 'Lalique Eau de Parfum 100ml', brandAr: 'lalique', nameAr: 'lalique - eau de parfum 100 ml', kind: 'perfume', subs: { gender: 'women' } },
  '716393009581': { brandEn: 'Giorgio Beverly Hills', nameEn: 'Giorgio Beverly Hills Eau de Toilette 90ml', brandAr: 'giorgio beverly hills', nameAr: 'giorgio beverly hills - eau de toilette 90 ml', kind: 'perfume', subs: { gender: 'women' } },
};

for (const [bc, fix] of Object.entries(FIX)) {
  if (!meta[bc]) continue;
  Object.assign(meta[bc], fix);
  if (fix.kind === 'perfume' && !fix.descriptionEn) {
    Object.assign(meta[bc], pDesc(fix.nameEn, fix.nameAr));
  }
}

writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
console.log('Fixed', Object.keys(FIX).length, 'entries');
