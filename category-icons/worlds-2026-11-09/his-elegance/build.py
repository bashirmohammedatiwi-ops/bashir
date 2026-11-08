import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT + '/kit'); sys.path.insert(0, HERE)
from he import *
set_out(HERE + '/out')
only = set(sys.argv[1:])
def go(n): return not only or n in only or n[:1] + '*' in only

LIGHT_INK = '#16130F'
# ---------------- HEROES (2150x1000) ----------------
H = [
 ('h01_chanel', dict(photo='chanel/bleu_de_chanel_elordi_city_landscape.jpg', word=W('chanel'), kicker='Bleu de Chanel', head='Free in Blue',
   sub='أناقة بلا قيود — بلو دو شانيل', cta='تسوّق شانيل', layout='bleed', bg='#081426', pos='center 30%', scrim_to=50, hsize=124)),
 ('h02_dior', dict(photo='dior/sauvage_edp_sunset_rocks_square.jpg', word=W('dior'), kicker='Sauvage', head='Wild at Heart',
   sub='سوفاج — قوّة الطبيعة في عطر', cta='تسوّق ديور', bg='#0A1428', pos='center 60%', cta_style='solid', hsize=124)),
 ('h03_tomford', dict(photo='tom-ford/ombre_leather_collection_ribbon_landscape.jpg', word=W('tomford', col=LIGHT_INK), kicker='Ombré Leather',
   head='Leather, Redefined', sub='أومبري ليذر — جلدٌ وظلالٌ وفخامة', cta='تسوّق توم فورد', bg='#D2CEC8', ink=LIGHT_INK,
   gold='#8A6A3A', pos='68% center', panel=1150, hsize=92)),
 ('h04_rabanne', dict(photo='rabanne/invictus_elixir_model_storm_landscape.jpg', word=W('rabanne', 66), kicker='Invictus Elixir', head='Born to Win',
   sub='إنفيكتوس — عطر الأبطال', cta='تسوّق رابان', layout='bleed', bg='#161C22', pos='70% 30%', scrim_to=46, hsize=100)),
 ('h05_emporio', dict(photo='armani/stronger_with_you_duo_amber_glow_square.jpg', word=W('emporio', 50), kicker='Stronger With You',
   head='Intensely Yours', sub='سترونغر ويذ يو — دفءٌ لا يُقاوَم', cta='تسوّق أرماني', bg='#1C0E07', hsize=108, cta_style='solid')),
 ('h06_boss', dict(photo='hugo-boss/bottled_absolu_parfum_trio_driftwood_smoke_square.jpg', word=W('boss', 70), kicker='Boss Bottled',
   head='Bottled. Elevated.', sub='بوس بوتلد — توقيع الرجل الواثق', cta='تسوّق هوغو بوس', bg='#120E0A', side='right', hsize=112)),
 ('h07_versace', dict(photo='versace/eros_edt_blue_reflection_square.jpg', word=W('versace'), kicker='Eros', head='Eros, Unleashed',
   sub='فيرساتشي إيروس — شغفٌ بروحٍ إغريقية', cta='تسوّق فيرساتشي', bg='#061A2E', pos='center 40%', hsize=118, cta_style='solid')),
 ('h08_montblanc', dict(photo='montblanc/legend_blue_edp_wood_slats_landscape.jpg', word=W('montblanc'), kicker='Legend', head='Become a Legend',
   sub='مونت بلانك ليجند — حضورٌ لا يُنسى', cta='تسوّق مونت بلانك', bg='#080C16', pos='right center', panel=1150, hsize=108)),
 ('h09_creed', dict(photo='creed/atelier_flacons_wood_table_landscape.jpg', word=W('creed', 66), kicker='Since 1760', head='Heritage, Bottled',
   sub='كريد — إرثٌ عريق منذ ١٧٦٠', cta='تسوّق كريد', side='right', bg='#150E08', pos='left center', panel=1100, hsize=104)),
 ('h10_grooming', dict(photo='gillette/gillette-razor-profile-dark-hero.jpg', word=W('groom', 50), kicker='Shave · Care · Fresh', head='Sharp. Clean. Ready.',
   sub='عناية الرجل اليومية بأفضل الماركات', cta='تسوّق العناية', layout='bleed', bg='#09090A', pos='right center', scrim_to=48, hsize=96)),
]
# ---------------- BRAND ROOMS (2150x1000) ----------------
R = [
 ('r_dior', dict(photo='dior/sauvage_extrait_hands_rings_square.jpg', word=W('dior'), kicker='Eau de Parfum · Parfum · Elixir', head='Sauvage, Always',
   sub='سوفاج وفهرنهايت — أيقونات ديور الرجالية', cta='تسوّق ديور', bg='#0B0D12', hsize=112)),
 ('r_chanel', dict(photo='chanel/bleu_de_chanel_edp_night_city_portrait.jpg', word=W('chanel'), kicker='Bleu · Allure · Égoïste', head='Bleu de Chanel',
   sub='بلو دو شانيل وأليور أوم وإيغويست', cta='تسوّق شانيل', bg='#071226', pos='center 48%', side='right', hsize=116)),
 ('r_tomford', dict(photo='tom-ford/tobacco_vanille_parfum_tobacco_leaf_square.jpg', word=W('tomford'), kicker='Private Blend', head='Private Blend',
   sub='عطور توم فورد الخاصة — فخامة بلا مساومة', cta='تسوّق توم فورد', bg='#1A0F07', hsize=116, cta_style='solid')),
 ('r_armani', dict(photo='armani/code_parfum_hand_navy_suit_square.jpg', word=W('armani', 50), kicker="Acqua di Giò · Code",
   head='The Armani Man', sub='أرماني — من أكوا دي جيو إلى كود', cta='تسوّق أرماني', bg='#0A1220', side='right', hsize=102)),
 ('r_rabanne', dict(photo='rabanne/1million_black_vanilla_stilllife_landscape.jpg', word=W('rabanne', 66, LIGHT_INK), kicker='1 Million · Invictus · Phantom',
   head='Pure Gold Energy', sub='رابان — عطور الذهب والانتصار', cta='تسوّق رابان', bg='#DCD6CC', ink=LIGHT_INK, gold='#8A6A3A',
   pos='center', hsize=104)),
 ('r_boss', dict(photo='hugo-boss/bottled_absolu_driftwood_gold_square.jpg', word=W('boss', 70), kicker='Bottled · The Scent · Hugo', head='Bottled Absolu',
   sub='هوغو بوس — عطور الرجل العصري', cta='تسوّق هوغو بوس', bg='#120D08', hsize=116, cta_style='solid')),
 ('r_versace', dict(photo='versace/eros_najim_amber_studio_square.jpg', word=W('versace'), kicker='Eros · Dylan Blue · Pour Homme', head='Eros Najim',
   sub='إيروس وديلان بلو — حضورٌ أسطوري', cta='تسوّق فيرساتشي', bg='#1A0E05', side='right', pos='center 60%', hsize=120)),
 ('r_pdm', dict(photo='pdm/althair_exclusif_warm_interior_square.jpg', word=W('pdm', 52), kicker='Layton · Althaïr · Kalan', head='Royal by Nature',
   sub='بارفيوم دي مارلي — فخامة بتوقيع القصور', cta='تسوّق بارفيوم دي مارلي', bg='#1C0F07', pos='center 45%', hsize=112)),
 ('r_ysl', dict(photo='ysl/myslf_le_parfum_black_mirrors_square.jpg', word=W('ysl', 50), kicker="MYSLF · Y · L'Homme", head='MYSLF Le Parfum',
   sub='إيف سان لوران — جرأة باريسية معاصرة', cta='تسوّق إيف سان لوران', bg='#0A0A0B', side='right', hsize=102)),
 ('r_montblanc', dict(photo='montblanc/legend_elixir_silver_sculpture_square.jpg', word=W('montblanc', col=LIGHT_INK), kicker='Legend · Explorer · Emblem',
   head='Legend Elixir', sub='مونت بلانك — أناقة كلاسيكية بسعر ذكي', cta='تسوّق مونت بلانك', bg='#D3D3D1', ink=LIGHT_INK, gold='#8A6A3A', hsize=120)),
 ('r_azzaro', dict(photo='azzaro/most_wanted_intense_wood_sunset_square.jpg', word=W('azzaro', 54), kicker='Wanted · Chrome', head='The Most Wanted',
   sub='أزارو — جاذبية دافئة لا تُقاوَم', cta='تسوّق أزارو', bg='#140C08', side='right', hsize=104, cta_style='solid')),
 ('r_valentino', dict(photo='valentino/born_in_roma_uomo_tattoo_hands_square.jpg', word=W('valentino'), kicker='Uomo · Intense · Extradose', head='Born in Roma',
   sub='فالنتينو — روح روما في عطر', cta='تسوّق فالنتينو', bg='#0B0A0C', panel=1000, hsize=120)),
 ('r_jpg', dict(photo='jpg/le_male_le_parfum_model_water_square.jpg', word=W('jpg', 46), kicker='Le Parfum · Elixir · In Blue', head='Le Male',
   sub='جان بول غوتييه — رجولة بطابعٍ جريء', cta='تسوّق جان بول غوتييه', bg='#140D06', side='right', hsize=130)),
 ('r_xerjoff', dict(photo='xerjoff/torino_collection_dark_blue_landscape.jpg', word=W('xerjoff'), kicker='Torino · Naxos · Alexandria', head='Italian Craft',
   sub='كسرجوف — فن العطر الإيطالي الفاخر', cta='تسوّق كسرجوف', bg='#050B1C', hsize=120, cta_style='solid')),
 ('r_amouage', dict(photo='amouage/reflection_man_starry_night_square.jpg', word=W('amouage'), kicker='Reflection · Interlude', head='Omani Grandeur',
   sub='أمواج — فخامة العطور العُمانية', cta='تسوّق أمواج', bg='#08080A', side='right', pos='30% center', hsize=116)),
 ('r_mancera', dict(photo='mancera/red_tobacco_smoke_leaves_square.jpg', word=W('mancera'), kicker='Red Tobacco · Tonka Cola', head='Bold by Design',
   sub='مانسيرا — عطور نيش بثباتٍ استثنائي', cta='تسوّق مانسيرا', bg='#1C0608', panel=1000, hsize=116)),
 ('r_montale', dict(photo='montale/oud_wood_sunlight_landscape.jpg', word=W('montale'), kicker='Arabians Tonka · Louban', head='Oud, Unveiled',
   sub='مونتال — سحر العود بلمسة فرنسية', cta='تسوّق مونتال', layout='bleed', side='right', bg='#130A04', pos='center 60%', scrim_to=50, hsize=120)),
 ('r_groom', dict(photo='gillette/gillette-shaving-foam-bathroom-blue-tiles.jpg', word=W('groom', 50), kicker="Gillette · Nivea Men · L'Oréal Men",
   head='The Daily Ritual', sub='حلاقة ومزيلات عرق وعناية يومية', cta='تسوّق العناية', bg='#0E1A26', pos='center 35%', hsize=116, cta_style='solid')),
]
# ---------------- SPOTLIGHT CARDS (1080x1350) ----------------
C = [
 ('c01_dior', 'christian-dior', dict(photo='dior/sauvage_model_desert_portrait_square.jpg', word=W('dior', 50), kicker='The Icon', head='Sauvage', sub='عطر الرجل الجريء', cta='اكتشف ديور', bg='#0D0F16', pos='65% 20%')),
 ('c02_chanel', 'chanel', dict(photo='chanel/bleu_de_chanel_elordi_bottle_portrait.jpg', word=W('chanel', 46), kicker='Eau de Parfum', head='Bleu de Chanel', sub='أناقة الأزرق الخالدة', cta='اكتشف شانيل', bg='#06101F', pos='center 10%')),
 ('c03_armani', 'giorgio-armani', dict(photo='armani/code_parfum_regejean_page_portrait.jpg', word=W('armani', 40), kicker='Code Parfum', head='Armani Code', sub='جاذبية الرجل الهادئ', cta='اكتشف أرماني', bg='#0A1220', pos='center 15%')),
 ('c04_rabanne', 'paco-rabanne', dict(photo='rabanne/1million_edt_model_car_portrait.jpg', word=W('rabanne', 56), kicker='1 Million', head='Made of Gold', sub='عطر الذهب الأشهر', cta='اكتشف رابان', bg='#0A0A0B', pos='center 0%', fade=(26, 52))),
 ('c05_jpg', 'jean-paul-gaultier', dict(photo='jpg/le_male_in_blue_model_square.jpg', word=W('jpg', 38), kicker='Le Male in Blue', head='Le Male', sub='الكلاسيكية بلمسة بحرية', cta='اكتشف غوتييه', bg='#0B1630', pos='60% 20%')),
 ('c06_azzaro', 'azzaro', dict(photo='azzaro/most_wanted_model_square.jpg', word=W('azzaro', 44), kicker='Parfum', head='Most Wanted', sub='دفء الكراميل والخشب', cta='اكتشف أزارو', bg='#160E09', pos='40% 20%')),
 ('c07_ysl', 'yves-saint-laurent', dict(photo='ysl/y_edp_model_portrait_square.jpg', word=W('ysl', 38), kicker='Eau de Parfum', head='Y for Bold', sub='جرأة الحلم والطموح', cta='اكتشف إيف سان لوران', bg='#0B0D12', pos='60% 10%')),
 ('c08_ch', 'carolina-herrera', dict(photo='carolina-herrera/212_men_model_cream_portrait.jpg', word=W('ch', 38), kicker='212 Men', head='212 Men', sub='روح نيويورك الحرّة', cta='اكتشف كارولينا هيريرا', bg='#1A1612', pos='center 0%')),
 ('c09_prada', 'prada', dict(photo='prada/paradigme_le_parfum_hand_green_square.jpg', word=W('prada', 56), kicker='Paradigme', head='Paradigme', sub='الأناقة الإيطالية الجديدة', cta='اكتشف برادا', bg='#0D1A10', pos='center 20%')),
 ('c10_creed', 'creed', dict(photo='creed/aventus_stone_relief_square.jpg', word=W('creed', 54), kicker='Aventus', head='Aventus', sub='أسطورة العطور الرجالية', cta='اكتشف كريد', bg='#2A2118', pos='center 30%')),
 ('c11_valentino', 'valentino', dict(photo='valentino/born_in_roma_green_stravaganza_hand_square.jpg', word=W('valentino', 50), kicker='Green Stravaganza', head='Born in Roma', sub='روما بلمسة عصرية', cta='اكتشف فالنتينو', bg='#06200E', pos='60% 20%')),
 ('c12_montblanc', 'montblanc', dict(photo='montblanc/explorer_ultra_blue_linen_lifestyle_portrait.jpg', word=W('montblanc', 50), kicker='Explorer', head='Explorer', sub='روح المغامرة والسفر', cta='اكتشف مونت بلانك', bg='#1A1712', pos='center 30%')),
]
# ---------------- TILES (800x800) ----------------
T = [
 ('t_perf', 'tom-ford/tuscan_leather_leather_saffron_square.jpg', 'عطور رجالية', "Men's Fragrance", 'center', '#120A05'),
 ('t_unisex', 'mancera/french_riviera_rock_sea_square.jpg', 'عطور للجنسين', 'Unisex', 'center 40%', '#0B1A2A'),
 ('t_care', 'gillette/gillette-razor-in-hand-bathroom-mirror.jpg', 'عناية الرجل', 'Grooming', 'center', '#0E1A26'),
 ('t_body', 'nivea-men/nivea-men-body-cream-shoulder-texture.jpg', 'العناية بالجسم', 'Body Care', 'center 40%', '#1A120C'),
 ('t_oral', 'oral/oral-man-brushing-teeth-marble-bathroom-mirror.jpg', 'عناية الفم', 'Oral Care', '80% center', '#141820'),
 ('t_gifts', 'occasion-gifting/montblanc-holiday-wrapped-gift-boxes-red.jpg', 'هدايا رجالية', 'Gift Sets', 'center', '#2A0A08'),
 ('o_office', 'occasion-office/office-navy-suit-pocket-square-watch-unsplash.jpg', 'عطور العمل', 'Office', 'center 30%', '#0A1220'),
 ('o_evening', 'occasion-evening/evening-tuxedo-cufflink-gold-watch-unsplash.jpg', 'عطور السهرة', 'Evening', '60% center', '#0A0A0B'),
 ('o_sport', 'occasion-sport/sport-beach-sprint-sunset-motion-unsplash.jpg', 'عطور منعشة ورياضية', 'Sport & Fresh', '42% center', '#1A1008'),
 ('o_winter', 'pdm/herod_snow_square.jpg', 'عطور الشتاء', 'Winter', 'center', '#08101E'),
 ('o_gift', 'carolina-herrera/bad_boy_cobalt_model_holiday_portrait.jpg', 'هدية تليق به', 'Gifting', 'center 25%', '#0A1430'),
]
# ---------------- STRIPS (2150x600) ----------------
S = [
 ('s_gifts', dict(photo='occasion-gifting/montblanc-holiday-fragrance-set-record-player.jpg', kicker="Men's Gift Sets", head='The Gift Edit',
   sub='مجموعات هدايا فاخرة جاهزة للإهداء', cta='تسوّق الهدايا', bg='#2A0A08', panel=1000)),
 ('s_budget', dict(photo='hugo-boss/bottled_parfum_watch_wallet_lifestyle_square.jpg', kicker='Smart Luxury', head='Icons Under 50K',
   sub='عطور رجالية أصلية بأقل من ٥٠ ألف', cta='تسوّق الآن', bg='#121212', pos='center 70%', panel=950)),
 ('s_trust', dict(photo='tom-ford/oud_wood_parfum_liquid_metal_square.jpg', kicker='Free delivery over 50,000 IQD', head='100% Original',
   sub='توصيل مجاني لكل المحافظات فوق ٥٠ ألف', cta='تسوّق العطور', bg='#0C0D10', side='right', panel=800)),
]

for n, kw in H:
    if go(n): banner(n, **kw)
for n, kw in R:
    if go(n): banner(n, **kw)
for n, _, kw in C:
    if go(n): card(n, **kw)
for n, ph, ar, en, pos, bg in T:
    if go(n): tile(n, ph, ar, en, bg=bg, pos=pos)
for n, kw in S:
    if go(n): strip(n, **kw)

if not only:
    sheet([n for n, _ in H], 'sheet_heroes'); sheet([n for n, _ in R], 'sheet_rooms')
    sheet([n for n, _, _ in C], 'sheet_cards', w=540, cols=4); sheet([t[0] for t in T] , 'sheet_tiles', w=520, cols=4)
    sheet([n for n, _ in S], 'sheet_strips', w=1075, cols=1)
    from PIL import Image
    os.makedirs(HERE + '/img', exist_ok=True)
    for f in sorted(os.listdir(HERE + '/out')):
        if f.endswith('.png'):
            im = Image.open(f'{HERE}/out/{f}').convert('RGB'); p = f'{HERE}/img/{f[:-4]}.jpg'; q = 90
            im.save(p, quality=q, optimize=True)
            while os.path.getsize(p) > 1.5e6 and q > 70: q -= 4; im.save(p, quality=q, optimize=True)
