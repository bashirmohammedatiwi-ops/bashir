# Pending barcode drafts → products. Index = row in pending.txt. Identification from staff photos + POS name + barcode lookups.
W, M, U = '1ba9f472-af81-4708-9304-07f3435b6b24', '8dca642a-1194-4101-b5cc-486ca1664e89', 'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a'
PERF, MK, CARE = '975e0e23-edd2-4181-ad6d-ecade6452b95', 'd3c24d19-dde5-41e5-b0a9-bede45393795', '9f99dbf3-15c4-4561-8f53-1499a8743a47'

def P(g):  # perfume category triple
    return (PERF, g, None)

CONC = {'EDP': ('أو دو بارفيوم', 'Eau de Parfum'), 'EDT': ('أو دو تواليت', 'Eau de Toilette'), 'P': ('بارفيوم', 'Parfum'),
        'EX': ('إكستريه دو بارفيوم', 'Extrait de Parfum'), 'PE': ('بارفيوم إليكسير', 'Parfum Elixir'), 'EDPI': ('أو دو بارفيوم إنتنس', 'Eau de Parfum Intense')}
GEN = {W: ('نسائي', "women's"), M: ('رجالي', "men's"), U: ('للجنسين', 'unisex')}

def perfume(brand, brandAr, lineEn, lineAr, conc, ml, g, img, notesAr='', notesEn='', extraAr='', extraEn='', tester=False):
    cA, cE = CONC[conc]; gA, gE = GEN[g]
    t = ' (تستر)' if tester else ''; te = ' (Tester)' if tester else ''
    nameAr = f'عطر {brandAr} {lineAr} {cA} {ml} مل{t}'
    nameEn = f'{brand} {lineEn} {cE} {ml}ml{te}'
    dAr = f'{lineAr} من {brandAr} — عطر {gA} بتركيز {cA}، سعة {ml} مل.'
    dEn = f'{lineEn} by {brand} — a {gE} fragrance, {cE}, {ml} ml.'
    if notesAr: dAr += f'\n\n• المكونات العطرية: {notesAr}.'; dEn += f'\n\n• Notes: {notesEn}.'
    if extraAr: dAr += f'\n• {extraAr}'; dEn += f'\n• {extraEn}'
    if tester: dAr += '\n• نسخة تستر أصلية: نفس العطر بعبوة اختبار بدون علبة فاخرة.'; dEn += '\n• Genuine tester: the same fragrance in tester packaging.'
    dAr += '\n• منتج أصلي 100٪.'; dEn += '\n• 100% authentic.'
    return dict(nameAr=nameAr, nameEn=nameEn, dAr=dAr, dEn=dEn, cat=P(g), img=img)

NEW = {
 1: dict(brand='garnier', nameAr='غارنييه سكن أكتيف بيور أكتيف مرطب مطفي للتحكم بالزيوت - 50 مل', nameEn='Garnier SkinActive Pure Active Matte Control Moisturiser 50ml',
         dAr='مرطب يومي خفيف من غارنييه بيور أكتيف للبشرة الدهنية والمعرضة للشوائب.\n\n• يمنح مظهراً مطفياً يدوم حتى 8 ساعات.\n• قوام خفيف غير دهني يمتص بسرعة.\n• يساعد على التحكم بإفراز الزيوت ولمعان البشرة.\n• يُستخدم صباحاً على بشرة نظيفة.',
         dEn='Lightweight daily moisturiser from Garnier Pure Active for oily, blemish-prone skin.\n\n• Up to 8h matte look.\n• Non-greasy, fast-absorbing texture.\n• Helps control oil and shine.\n• Apply in the morning on clean skin.',
         cat=(CARE, '07661898-571a-4a88-aa6c-76dcdbf53029', '21801439-d0e9-4106-b5e8-dfdd70ffeb8d'), img=['cand/1_0']),
 2: dict(brand='dr-clinic', nameAr='دكتور كلينك سيروم الكافيين لشد وتفتيح محيط العين', nameEn='Dr Clinic Firm & Bright Eye Caffeine Serum',
         dAr='سيروم لمحيط العين من دكتور كلينك بالكافيين وفيتامين C وحمض الهيالورونيك.\n\n• يستهدف الهالات الداكنة وانتفاخ العين.\n• يساعد على شد وإشراقة منطقة تحت العين.\n• يرطّب البشرة الرقيقة حول العين.\n• يُطبّق صباحاً ومساءً بالتربيت الخفيف.',
         dEn='Eye-contour serum from Dr Clinic with caffeine, vitamin C and hyaluronic acid.\n\n• Targets dark circles and puffiness.\n• Helps firm and brighten the under-eye area.\n• Hydrates the delicate eye contour.\n• Pat gently morning and evening.',
         cat=(CARE, '07661898-571a-4a88-aa6c-76dcdbf53029', '09bedca5-0c6c-4a71-9b03-4bf29cecaf53'), img=['rect/d2.png']),
 3: dict(brand='gillette', nameAr='جيليت فيوجن 5 بروجلايد شفرات حلاقة رجالية - 4 شفرات', nameEn='Gillette Fusion5 ProGlide Men\'s Razor Blades - 4 Cartridges',
         dAr='شفرات بديلة أصلية من جيليت فيوجن 5 بروجلايد لحلاقة ناعمة ومريحة.\n\n• 5 شفرات رفيعة لحلاقة قريبة بأقل احتكاك.\n• شريط مرطّب لانزلاق سلس.\n• تناسب جميع مقابض فيوجن 5 وبروجلايد.\n• العبوة تحتوي 4 شفرات.',
         dEn='Genuine Gillette Fusion5 ProGlide replacement cartridges for a smooth, comfortable shave.\n\n• 5 thinner blades for a close shave with less tug.\n• Lubrastrip for a smooth glide.\n• Fits all Fusion5 and ProGlide handles.\n• Pack of 4 cartridges.',
         cat=(CARE, '01300f8f-9b4d-4d15-904c-e045383c9b97', '1a192be8-a3b7-453b-81ae-b840a69227e9'), img=['cand/3_0']),
 5: dict(brand='valentino', **perfume('Valentino', 'فالنتينو', 'Donna Born In Roma Purple Melancholia', 'دونا بورن إن روما بيربل ميلانكوليا', 'EDP', 50, W, ['cand/5_0'],
         extraAr='إصدار من عائلة بورن إن روما بزجاجتها المرصّعة الشهيرة باللون البنفسجي.', extraEn='A Born In Roma edition in the iconic studded bottle, in purple.', tester=True)),
 6: dict(brand='valentino', **perfume('Valentino', 'فالنتينو', 'Vendetta Donna', 'فينديتا دونا', 'EDP', 90, W, ['cand/6_0'],
         extraAr='عطر زهري بلمسة التيوبروز.', extraEn='A floral fragrance with tuberose.')),
 7: dict(brand='valentino', **perfume('Valentino', 'فالنتينو', 'Vendetta Uomo', 'فينديتا أومو', 'EDP', 90, M, ['cand/7_0'],
         extraAr='عطر رجالي دافئ بلمسة الزنجبيل.', extraEn="A warm men's fragrance with ginger.")),
 13: dict(brand='ibraq', **perfume('Ibraq', 'إبراق', 'Diamond Collection', 'دايموند كولكشن', 'EDP', 100, U, ['rect/d13.png'])),
 14: dict(brand='assaf', **perfume('Assaf', 'عساف', 'Frankel Aventus', 'فرانكل أفينتوس', 'EDP', 100, M, ['rect/d14.png'])),
 15: dict(brand='assaf', **perfume('Assaf', 'عساف', 'Frankel Imagination', 'فرانكل إيماجنيشن', 'EDP', 100, M, ['ext/15_0.jpg'])),
 16: dict(brand='assaf', **perfume('Assaf', 'عساف', 'Attacks Blue', 'أتاكس بلو', 'EDP', 125, M, ['ext/16_0.png'])),
 17: dict(brand='dolce--gabbana', **perfume('Dolce & Gabbana', 'دولتشي آند غابانا', 'Light Blue Capri In Love', 'لايت بلو كابري إن لوف', 'EDP', 100, W, ['cand/17_0'],
         notesAr='الياسمين والتفاح', notesEn='jasmine and apple', extraAr='إصدار كابري إن لوف بعلبة الزخارف الزرقاء المستوحاة من جزيرة كابري.', extraEn='Capri In Love edition with blue majolica-inspired packaging.')),
 18: dict(brand='dolce--gabbana', **perfume('Dolce & Gabbana', 'دولتشي آند غابانا', 'Light Blue Capri In Love Pour Homme', 'لايت بلو كابري إن لوف بور هوم', 'EDP', 100, M, ['cand/18_0'],
         extraAr='إصدار كابري إن لوف الرجالي بعلبة الزخارف الزرقاء.', extraEn="The men's Capri In Love edition with blue majolica-inspired packaging.")),
 20: dict(brand='chanel', nameAr='شانيل بودرة بودر يونيفرسيل ليبر السائبة رقم 12 - 30 غ', nameEn='Chanel Poudre Universelle Libre Natural Finish Loose Powder No. 12 30g',
          dAr='بودرة سائبة من شانيل بلمسة نهائية طبيعية تثبّت المكياج وتنعّم البشرة.\n\n• الدرجة 12.\n• قوام ناعم جداً يمنح بشرة مخملية بمظهر طبيعي.\n• تثبّت كريم الأساس وتقلل اللمعان.\n• العبوة 30 غ.',
          dEn='Chanel loose powder with a natural finish that sets make-up and smooths the skin.\n\n• Shade 12.\n• Ultra-fine texture for a velvety, natural look.\n• Sets foundation and reduces shine.\n• 30 g.',
          cat=(MK, '2bbecee1-084d-446c-b4fd-65f769130de9', '828bbfd2-d611-417a-bdca-0f5424a61171'), img=['cand/20_0']),
 22: dict(brand='guess', nameAr='غيس باليت الشفاه نود لوك بوك', nameEn='Guess Lip Nude Look Book',
          dAr='مجموعة ألوان شفاه بدرجات النود من غيس في باليت عملي على شكل كتاب.\n\n• درجات نود متنوعة لإطلالات يومية وسهرات.\n• تصميم مدمج مناسب للحقيبة.\n• مثالية كهدية.',
          dEn='A Guess nude lip collection in a handy book-style palette.\n\n• Assorted nude shades for day and night looks.\n• Compact, travel-friendly design.\n• A great gift.',
          cat=(MK, '56da5b82-c847-4e9b-9cea-cc901236189f', '3b99e300-81d4-4f79-a74e-005f4e037222'), img=['rect/d22.png']),
 23: dict(brand='benefit', nameAr='بنفت مجموعة الحواجب براو ماجيك تريكس من حنان القاضي', nameEn='Benefit Brow Magic Tricks by Hanan Alqadi Set',
          dAr='مجموعة حواجب من بنفت بالتعاون مع خبيرة التجميل حنان القاضي.\n\n• تضم منتجات بنفت لتحديد وتعبئة وتثبيت الحواجب.\n• علبة إصدار خاص بتصميم حنان القاضي.\n• مثالية كهدية لمحبات الحواجب المثالية.',
          dEn="Benefit brow set in collaboration with make-up artist Hanan Alqadi.\n\n• Benefit brow products to define, fill and set.\n• Special-edition box designed with Hanan Alqadi.\n• A perfect gift for brow lovers.",
          cat=(MK, '92ebe64a-9091-4460-9f12-68ecbdf4e1e9', 'd80ee9e0-cf30-4137-9a20-88ea349bf25b'), img=['rect/d23.png']),
 26: dict(brand='burberry', **perfume('Burberry', 'بربري', 'Hero', 'هيرو', 'PE', 60, M, ['cand/26_0'], notesAr='الفانيليا والجلد وخشب الأرز', notesEn='vanilla, leather and cedarwood')),
 32: dict(brand='yves-saint-laurent', **perfume('Yves Saint Laurent', 'إيف سان لوران', 'Black Opium Pink Glaze', 'بلاك أوبيوم بينك غليز', 'EDP', 90, W, ['ext/32_1.png', 'ext/32_0.png'],
          notesAr='الفراولة واليوسفي الأخضر والبرغموت والياسمين وزهر البرتقال والفانيليا والقهوة والبنزوين والعنبر والباتشولي',
          notesEn='strawberry, green mandarin, bergamot, jasmine, orange blossom, vanilla, coffee, benzoin, amber and patchouli', extraAr='الإصدار الأكثر فاكهية ومرحاً في عائلة بلاك أوبيوم.', extraEn='The most playful, fruity take on Black Opium.')),
 33: dict(brand='giorgio-beverly-hills', **perfume('Giorgio Beverly Hills', 'جورجيو بيفرلي هيلز', 'Giorgio Gold', 'جورجيو غولد', 'EDP', 100, W, ['cand/33_3'])),
 35: dict(brand='geparlys', **perfume('Geparlys', 'جيبارليس', 'Yes I Am The Queen Lady', 'يس آي آم ذا كوين ليدي', 'EDP', 100, W, ['rect/d35.png'])),
 37: dict(brand='paco-rabanne', **perfume('Rabanne', 'رابان', 'Olympéa', 'أوليمبيا', 'EDP', 80, W, ['cand/37_4'],
          notesAr='الفانيليا المملّحة واليوسفي الأخضر والياسمين وزنبق الزنجبيل وخشب الصندل', notesEn='salted vanilla, green mandarin, jasmine, ginger lily and sandalwood')),
 39: dict(brand='paco-rabanne', **perfume('Rabanne', 'رابان', '1 Million Night Elixir', 'ون مليون نايت إليكسير', 'PE', 100, M, ['ext/39_1.png', 'ext/39_0.png'],
          notesAr='اليوسفي وشراب القيقب واللابدانوم', notesEn='mandarin, maple syrup and labdanum', extraAr='إصدار محدود بطابع عنبري حلو ودافئ.', extraEn='Limited edition with a warm, ambery-gourmand character.')),
 40: dict(brand='paco-rabanne', **perfume('Rabanne', 'رابان', 'Black XS Potion for Her', 'بلاك إكس إس بوشن فور هير', 'EDT', 80, W, ['cand/40_3'], extraAr='إصدار محدود.', extraEn='Limited edition.')),
 42: dict(brand='elite-moment', **perfume('Elite', 'إيليت', 'Elegant Pour Homme Private Collection', 'إليغانت بور هوم برايفت كولكشن', 'EDP', 100, M, ['rect/d42.png'])),
 44: dict(brand='boss', **perfume('BOSS', 'بوس', 'Femme', 'فيم', 'EDP', 75, W, ['cand/44_0'])),
 45: dict(brand='boss', **perfume('BOSS', 'بوس', 'Ma Vie', 'ما في', 'EDP', 75, W, ['cand/45_0'], notesAr='زهر الصبّار والفريزيا والياسمين وخشب الأرز', notesEn='cactus blossom, freesia, jasmine and cedarwood')),
 46: dict(brand='chopard', **perfume('Chopard', 'شوبارد', 'Noble Cedar', 'نوبل سيدار', 'EDT', 80, U, ['cand/46_3'], extraAr='عطر خشبي يتمحور حول خشب الأرز.', extraEn='A woody fragrance built around cedarwood.')),
 47: dict(brand='geparlys', **perfume('Collection Privée', 'كولكشن بريفيه', 'Bois Noir', 'بوا نوار', 'EDP', 100, M, ['rect/d47.png'])),
 48: dict(brand='glenn-perri', **perfume('Glenn Perri', 'جلين بيري', 'Miss Lover', 'ميس لوفر', 'EDP', 85, W, ['rect/d48.png'])),
 49: dict(brand='banana-republic', **perfume('Banana Republic', 'بانانا ريبابليك', 'M', 'إم', 'EDP', 125, M, ['cand/49_1'])),
 51: dict(brand='bvlgari', **perfume('Bvlgari', 'بولغاري', 'Aqva Pour Homme', 'أكوا بور هوم', 'EDT', 100, M, ['cand/51_1'],
          notesAr='اليوسفي ونبات البوسيدونيا البحري والعنبر المعدني', notesEn='mandarin, posidonia and mineral amber', extraAr='عطر مائي منعش مستوحى من البحر.', extraEn='A fresh aquatic fragrance inspired by the sea.')),
 53: dict(brand='elie-saab', **perfume('Elie Saab', 'إيلي صعب', "L'Homme Intense", 'لوم إنتنس', 'EDPI', 100, M, ['ext/53_1.png', 'ext/53_0.png'],
          extraAr='عطر خشبي جلدي بانتعاش حمضي، بزجاجة قابلة لإعادة التعبئة.', extraEn='Woody-leathery with citrus freshness, in a refillable bottle.')),
 54: dict(brand='mercedes-benz', **perfume('Mercedes-Benz', 'مرسيدس بنز', 'Man Grey', 'مان غراي', 'EDT', 100, M, ['cand/54_2'])),
 55: dict(brand='hermes', **perfume('Hermès', 'هيرمس', "Galop d'Hermès", 'غالوب ديرمس', 'P', 100, W, ['cand/55_1'], notesAr='الجلد والورد', notesEn='leather and rose')),
 56: dict(brand='nobel', **perfume('Nobel', 'نوبل', 'Garnette', 'غارنيت', 'EDP', 100, W, ['rect/d56.png'])),
 57: dict(brand='jaguar', **perfume('Jaguar', 'جاكوار', 'Vision III', 'فيجن 3', 'EDT', 100, M, ['EXISTING:7910567c-77a8-4ab5-a522-c04cce2e9305'], tester=True)),
 58: dict(brand='generic', **perfume('Amour', 'آمور', 'Pour Femme', 'بور فيم', 'EDP', 100, W, ['rect/d58.png'])),
 59: dict(brand='givenchy', **perfume('Givenchy', 'جيفنشي', 'Very Irresistible', 'فيري إيريزيستبل', 'EDP', 75, W, ['cand/59_0'])),
 60: dict(brand='givenchy', **perfume('Givenchy', 'جيفنشي', 'Very Irresistible', 'فيري إيريزيستبل', 'EDT', 80, W, ['cand/60_1'])),
 61: dict(brand='generic', **perfume('DBC', 'دي بي سي', 'Signature Crystal', 'سيغنتشر كريستال', 'EDP', 50, W, ['rect/d61.png'])),
 62: dict(brand='avon', **perfume('Avon', 'آفون', 'Today Tomorrow Always Tomorrow for Him', 'تودي تومورو أولويز تومورو فور هيم', 'EDT', 75, M, ['rect/d62.png'])),
 63: dict(brand='avon', **perfume('Avon', 'آفون', 'Far Away Glamour', 'فار أواي غلامور', 'EDP', 50, W, ['rect/d63.png'])),
 64: dict(brand='avon', **perfume('Avon', 'آفون', 'Far Away', 'فار أواي', 'EDP', 50, W, ['rect/d64.png'])),
 66: dict(brand='viktor--rolf', **perfume('Viktor & Rolf', 'فيكتور آند رولف', 'Bonbon Spring Summer Acidulée', 'بونبون سبرينغ سمر أسيدوليه', 'EDT', 50, W, ['cand/66_1'], extraAr='إصدار ربيع وصيف بنسخة أو دو تواليت أسيدوليه المنعشة.', extraEn='Spring-summer edition, Eau de Toilette Acidulée.')),
 71: dict(brand='avon', **perfume('Avon', 'آفون', 'Perceive', 'بيرسيف', 'EDP', 50, W, ['rect/d71.png'])),
 72: dict(brand='nobel', **perfume('Nobel', 'نوبل', 'Attractivo', 'أتراكتيفو', 'P', 100, M, ['rect/d72.png'])),
 73: dict(brand='prive', **perfume('Privé', 'بريفيه', 'Supreme', 'سوبريم', 'EDP', 100, M, ['rect/d73.png'])),
 75: dict(brand='generic', **perfume('Denzel', 'دنزل', 'Royal Collection VIP Oud', 'رويال كولكشن في آي بي عود', 'P', 100, U, ['rect/d75.png'])),
 77: dict(brand='generic', **perfume('Corner Perfume', 'كورنر', 'Homme Intense Extreme', 'هوم إنتنس إكستريم', 'EDP', 100, M, ['rect/d77.png'])),
 78: dict(brand='generic', **perfume('Corner Perfume', 'كورنر', 'Sauvage Elixir Extreme', 'سوفاج إليكسير إكستريم', 'EDP', 100, M, ['rect/d78.png'])),
 79: dict(brand='generic', **perfume('Corner Perfume', 'كورنر', 'Ombre Nomade Extreme', 'أومبري نوماد إكستريم', 'EDP', 100, U, ['rect/d79.png'])),
 80: dict(brand='generic', **perfume('Corner Perfume', 'كورنر', 'Si Passion Extreme', 'سي باشن إكستريم', 'EDP', 100, W, ['rect/d80.png'])),
 81: dict(brand='elizabeth-arden', **perfume('Elizabeth Arden', 'إليزابيث أردن', 'Splendor', 'سبلندور', 'EDP', 30, W, ['cand/81_0'])),
 82: dict(brand='generic', **perfume('Lord Collection', 'لورد كولكشن', 'Lord Pour Homme', 'لورد بور هوم', 'EDP', 30, M, ['rect/d82.png'])),
 83: dict(brand='mugler', **perfume('Mugler', 'موغلر', 'Angel', 'أنجل', 'EDP', 100, W, ['cand/83_0'], notesAr='الباتشولي والبرالين والفانيليا', notesEn='patchouli, praline and vanilla', extraAr='زجاجة النجمة الأيقونية القابلة لإعادة التعبئة.', extraEn='The iconic refillable star bottle.')),
 84: dict(brand='angel-schlesser', **perfume('Angel Schlesser', 'أنجل شليسر', 'Homme', 'هوم', 'EDT', 125, M, ['cand/84_5'])),
 86: dict(brand='la-fede', **perfume('La Fede', 'لا فيدي', 'Opulence Verde', 'أوبيولنس فيردي', 'EDP', 100, U, ['rect/d86.png'])),
 87: dict(brand='la-fede', **perfume('La Fede', 'لا فيدي', 'Opulence Noir', 'أوبيولنس نوار', 'EDP', 100, U, ['rect/d87.png'])),
 89: dict(brand='khadlaj', **perfume('Khadlaj', 'خدلج', 'Kapus Amber Gold', 'كابوس أمبر غولد', 'EDP', 100, U, ['rect/d89.png'])),
 90: dict(brand='la-fede', **perfume('La Fede', 'لا فيدي', 'Code La Maison', 'كود لا ميزون', 'EX', 100, U, ['rect/d90.png'])),
 91: dict(brand='la-fede', **perfume('La Fede', 'لا فيدي', 'Code Rouge Beauty', 'كود روج بيوتي', 'EX', 100, W, ['rect/d91.png'])),
 92: dict(brand='la-fede', **perfume('La Fede', 'لا فيدي', 'First Lady', 'فيرست ليدي', 'EX', 100, W, ['rect/d92.png'])),
 93: dict(brand='botanicae', **perfume('Botanicae', 'بوتانيكاي', 'Shomal', 'شمال', 'EDP', 100, U, ['cand/93_0'])),
 95: dict(brand='glenn-perri', **perfume('Glenn Perri', 'جلين بيري', 'Relevance', 'ريليفانس', 'EDP', 100, W, ['rect/d95.png'])),
}

# existing products: link the draft barcode / activate / fix
EXISTING = {
 21: dict(kind='addShade', productId='45f8907c-23c4-4513-bb41-291613e8bca0', shadeName='2.0', colorHex='#E2B48F', img='cand/21_1'),
 30: dict(kind='relink', productId='28b1a642-61a6-4dfb-adfa-98ca5f48de5a'),
 41: dict(kind='activate', productId='007eaf4c-2223-4d5e-9ce9-099d8d944374'),
 52: dict(kind='relink', productId='7dee9e9c-523f-4760-aac4-dda0a18e1b26'),
 65: dict(kind='relink', productId='8c9814f3-c8f5-48bd-8867-e72f55ab10bd'),
 74: dict(kind='activate', productId='8e0a1e11-0ce6-4ff7-b83d-c089dcf4475b'),
}
RENAME = {'4840d04e-2948-455c-96b6-318a7c8c76f3': ('عطر دولتشي آند غابانا لايت بلو بور هوم أو دو تواليت 100 مل', 'Dolce & Gabbana Light Blue Pour Homme Eau de Toilette 100ml')}
SKIP_DUP = {24: 'نفس درجة 250G موجودة بباركود آخر (6291106036152)', 36: 'نفس عطر Olympéa Blossom 80 مل موجود (3349668588718)',
            69: 'نفس عطر Kenzo Jeu d\'Amour L\'Elixir 75 مل موجود (3274872323681)', 76: 'Aramis 900 موجود ومخزون الباركودين صفر'}
# crops applied to staff-photo boxes before composing (left, top, right, bottom fractions kept)
CROP = {'d77': (0.36, 0, 1, 0.97), 'd78': (0.12, 0, 1, 1), 'd79': (0, 0.31, 1, 1), 'd58': (0.08, 0, 1, 1), 'd23': (0, 0, 0.93, 0.92), 'd48': (0.06, 0, 1, 1), 'd86': (0.07, 0, 1, 1)}
ROT = {'d79': 90}
