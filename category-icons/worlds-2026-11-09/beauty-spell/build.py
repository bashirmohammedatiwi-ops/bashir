# Beauty Spell (سحر الجمال) — w5 redesign build. Usage: python3 build.py [heroes|rooms|cards|looks|tiles|strips|all] [name-filter]
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT + '/kit'); sys.path.insert(0, HERE)
import kit; kit.set_out(HERE + '/out')
from bs import *

P = lambda p: f'{PH}/{p}'
EXCL = 'الوكيل الحصري في العراق'

# ======================= HEROES (2150x1000) =======================
def heroes():
    yield 'h03_huda', lambda n: hero(n, P('huda-beauty/huda_empowered_model-gold-eyes_port.jpg'), 'left', '#1b110c', '#f4e7d4',
        wm_huda('#f4e7d4'), 'Empowered · Eyeshadow Palette', '#d4a85f', 'Empowered.', 'باليت إمباورد — ذهبٌ ونحاس بلمسة ساحرة',
        'تسوّقي هدى بيوتي', '#d4a85f', '#1b110c', box=(930, 0, 1220, 1000), pos='center 38%', frame_col='rgba(212,168,95,.35)', hsize=160)
    yield 'h04_deborah', lambda n: hero(n, P('deborah/deborah_campaign_model-plum-look_landscape.jpg'), 'right', '#e7dbe4', '#2b1430',
        wm_deborah('#2b1430'), 'Italian colour · Plum edit', '#8a3a7c', 'Made in<br>Milano.', 'ديبورا ميلانو — ألوان إيطالية تدوم طويلاً',
        'تسوّقي ديبورا', '#2b1430', '#fff', box=(0, 0, 1300, 1000), pos='32% 30%', hsize=150, frame_col='rgba(43,20,48,.18)')
    yield 'h05_catrice', lambda n: hero(n, P('catrice/catrice_last-chance_model-red-lips_landscape.jpg'), 'left', '#ece6df', '#221a17',
        wm_catrice('#221a17'), 'Endless Matte · Lips', '#b2322a', 'Bold,<br>by nature.', 'أحمر شفاه إندلس مات — لونٌ جريء وثبات طويل',
        'تسوّقي كاتريس', '#221a17', '#fff', pos='right 30%', scrim_w=46, hsize=150, frame_col='rgba(34,26,23,.16)')
    yield 'h06_essence', lambda n: hero(n, P('essence/essence_i-love-extreme_model-pink-kiss_landscape.jpg'), 'left', '#f2b8cf', '#3a0d24',
        wm_essence('#3a0d24'), 'I ♥ Extreme · Mascara', '#c21d6b', 'Volume,<br>extreme.', 'ماسكارا آي لوف إكستريم — كثافة لا تُقاوَم',
        'تسوّقي إيسنس', '#c21d6b', '#fff', box=(860, 0, 1290, 1000), blend=300, pos='right 22%', hsize=150, frame_col='rgba(58,13,36,.15)')
    yield 'h07_maybelline', lambda n: hero(n, P('maybelline/maybelline_lifter-gloss_model-pink-sunglasses_square.jpg'), 'left', '#f3dfe6', '#1d1418',
        wm_mny('#1d1418'), 'Lips · Eyes · Face', '#d0225f', 'New York,<br>in colour.', 'ميبيلين نيويورك — مكياج يواكب يومكِ',
        'تسوّقي ميبيلين', '#d0225f', '#fff', box=(1000, 0, 1150, 1000), pos='center 30%', frame_col='rgba(29,20,24,.15)', hsize=140)
    yield 'h08_mufe', lambda n: hero(n, P('make-up-for-ever/mufe_hdskin-blushglow_model-pink-cheeks_sq.jpg'), 'left', '#f1e3e2', '#1a1414',
        wm_mufe('#1a1414'), 'HD Skin · Artist Blush', '#b0436a', 'Skin, by<br>artists.', 'ميك أب فور إيفر — مكياج المحترفين من باريس',
        'تسوّقي ميك أب فور إيفر', '#1a1414', '#fff', box=(1040, 0, 1110, 1000), pos='center 40%', frame_col='rgba(26,20,20,.14)', hsize=150)
    yield 'h09_astra', lambda n: hero(n, P('astra/astra_winter-glitter-campaign_model-snow_landscape.jpg'), 'left', '#cfc8e6', '#241c3d',
        wm_astra('#241c3d'), 'Glitter Snowland · Holiday', '#7a4fb5', 'Winter,<br>glittered.', 'أسترا الإيطالية — بريقٌ يليق بليالي الشتاء',
        'تسوّقي أسترا', '#241c3d', '#fff', pos='70% 30%', scrim_w=42, hsize=150, frame_col='rgba(36,28,61,.15)')
    yield 'h10_sheglam', lambda n: hero(n, P('sheglam/sheglam_liquidfam_bottles-stilllife_sq.jpg'), 'left', '#f3dccf', '#3b1f17',
        wm_sheglam('#3b1f17'), 'Liquid Glow · Face', '#c0583f', 'Bloom,<br>beautifully.', 'شيغلام — توهّجٌ طبيعي بلمسة واحدة',
        'تسوّقي شيغلام', '#3b1f17', '#fff', box=(1020, 0, 1130, 1000), pos='center 55%', frame_col='rgba(59,31,23,.14)', hsize=150)


# ======================= BRAND ROOMS (2150x1000) =======================
def rooms():
    yield 'r_grigi', lambda n: hero(n, P('grigi/grigi_ss25_model-coral-smile_port.jpg'), 'left', '#d8726a', '#fff8f3',
        wm_grigi('#fff8f3'), 'Spring · Summer Collection', '#ffe0d2', 'Made in<br>Greece.', 'كريجي — مكياج يوناني بجودة احترافية',
        'تسوّقي كريجي', '#fff8f3', '#a8423b', box=(1407, 0, 743, 1000), blend=200, pos='center top', badge=EXCL, frame_col='rgba(255,248,243,.35)', hsize=150,
        extra=f'<div class="a" style="left:780px;top:0;width:700px;height:1000px;z-index:4;background:url(\'file://{P("grigi/grigi_ss25_texture-coral-splash_port.jpg")}\') center/cover;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 45%,#000 62%,transparent 100%)"></div>')
    yield 'r_maybelline', lambda n: hero(n, P('maybelline/maybelline_lifter-gloss_model-honey-glossy-lips_square.jpg'), 'left', '#f1e4d8', '#22160f',
        wm_mny('#22160f'), 'Super Stay · Lips', '#b5532a', 'Shine,<br>on repeat.', 'ميبيلين نيويورك — ألوان شفاه بثبات طويل',
        'تسوّقي ميبيلين', '#22160f', '#fff', box=(1086, 0, 1064, 1000), pos='center 20%', frame_col='rgba(34,22,15,.14)', hsize=150)
    yield 'r_deborah', lambda n: hero(n, P('deborah/deborah_2in1-gel-kajal_model-applying-liner_portrait.jpg'), 'left', '#e3e1e3', '#1e1820',
        wm_deborah('#1e1820'), '2in1 Gel Kajal & Eyeliner', '#7b3b6e', 'Eyes,<br>defined.', 'قلم كحل وآيلاينر جل ٢ في ١ من ديبورا',
        'تسوّقي ديبورا', '#1e1820', '#fff', box=(1050, 0, 1100, 1000), pos='center 22%', frame_col='rgba(30,24,32,.15)', hsize=150)
    yield 'r_huda', lambda n: hero(n, P('huda-beauty/huda_bronzefilter_huda-banner_land.jpg'), 'left', '#fbe9e8', '#2a1714',
        wm_huda('#2a1714'), 'Dubai · Since 2013', '#b4573f', 'Created<br>by Huda.', 'منتجات هدى بيوتي الأصلية — من دبي إليكِ',
        'تسوّقي هدى بيوتي', '#2a1714', '#fff', pos='right center', scrim_w=44, frame_col='rgba(42,23,20,.14)', hsize=150)
    yield 'r_catrice', lambda n: hero(n, P('catrice/catrice_hd-liquid-coverage_model-foundation_portrait.jpg'), 'left', '#e6e1dc', '#1d1a18',
        wm_catrice('#1d1a18'), 'HD Liquid Coverage', '#9a6a4a', 'Coverage,<br>perfected.', 'كريم أساس HD — تغطية عالية بلمسة خفيفة',
        'تسوّقي كاتريس', '#1d1a18', '#fff', box=(1080, 0, 1070, 1000), pos='center 18%', frame_col='rgba(29,26,24,.14)', hsize=150)
    yield 'r_sheglam', lambda n: hero(n, P('sheglam/sheglam_colorbloom_blush-sponge-stilllife_sq.jpg'), 'left', '#fbe3e3', '#3a1820',
        wm_sheglam('#3a1820'), 'Color Bloom · Liquid Blush', '#c9496b', 'Flushed<br>&amp; fabulous.', 'بلاشر كولور بلوم — الأكثر طلباً من شيغلام',
        'تسوّقي شيغلام', '#c9496b', '#fff', box=(1100, 0, 1050, 1000), pos='center 45%', frame_col='rgba(58,24,32,.14)', hsize=140)
    yield 'r_essence', lambda n: hero(n, P('essence/essence_lash-princess_model-applying-mascara_landscape.jpg'), 'left', '#f8cbbf', '#3a1420',
        wm_essence('#3a1420'), 'Lash Princess · Mascara', '#c8325f', 'Born to<br>be royal.', 'ماسكارا لاش برينسس — رموش بتأثير الرموش الصناعية',
        'تسوّقي إيسنس', '#c8325f', '#fff', box=(900, 0, 1250, 1000), blend=320, pos='right 30%', frame_col='rgba(58,20,32,.14)', hsize=150)
    yield 'r_astra', lambda n: hero(n, P('astra/astra_lip-bondage_vinyl-lips-closeup_portrait.jpg'), 'left', '#ecd9cf', '#2a1610',
        wm_astra('#2a1610'), 'Lip Bondage · Vinyl Lips', '#a8563a', 'Vinyl,<br>unbound.', 'أحمر شفاه ليب بوندج — لمعان فينيل يدوم',
        'تسوّقي أسترا', '#2a1610', '#fff', box=(1100, 0, 1050, 1000), pos='center 45%', frame_col='rgba(42,22,16,.14)', hsize=150)
    yield 'r_mufe', lambda n: hero(n, P('make-up-for-ever/mufe_hdskin-palette_brush-stilllife_sq.jpg'), 'left', '#efe1d8', '#1c1412',
        wm_mufe('#1c1412'), 'HD Skin · Face Palette', '#a5523c', "The artist's<br>palette.", 'باليت HD Skin — كونتور وبلاشر وإضاءة في علبة واحدة',
        'تسوّقي ميك أب فور إيفر', '#1c1412', '#fff', box=(1110, 0, 1040, 1000), pos='center 40%', frame_col='rgba(28,20,18,.14)', hsize=140)
    yield 'r_nyx', lambda n: hero(n, P('nyx/nyx_buttermelt-highlighter_model-glow_sq.jpg'), 'left', '#bfe3df', '#10302d',
        wm_nyx('#10302d'), 'Buttermelt · Highlighter', '#13756c', 'Melt into<br>glow.', 'هايلايتر بترميلت من نيكس — توهّج ناعم',
        'تسوّقي نيكس', '#10302d', '#fff', box=(1060, 0, 1090, 1000), pos='center 30%', frame_col='rgba(16,48,45,.15)', hsize=150)
    yield 'r_artdeco', lambda n: hero(n, P('artdeco/artdeco_eyeshadow_model-beauty-box_square.jpg'), 'left', '#e9e6e6', '#1e1a1c',
        wm_artdeco('#1e1a1c'), 'Beauty Box · Germany', '#a24d5d', 'Play with<br>colour.', 'آرتديكو الألمانية — ظلال وبلاشر بجودة احترافية',
        'تسوّقي آرتديكو', '#1e1a1c', '#fff', box=(1100, 0, 1050, 1000), pos='center 30%', frame_col='rgba(30,26,28,.14)', hsize=150)

# ======================= SPOTLIGHT CARDS (1080x1350) =======================
def cards():
    yield 'c_grigi', lambda n: card(n, P('grigi/grigi_aw2425_model-berry-lips_port.jpg'), '#5a0f22', '#fff', wm_grigi('#fff', 50),
        'Fall for Black &amp; Berry', '#f2b7c3', 'Black &amp; Berry.', 'أحمر شفاه سائل مطفي بلون التوت', 'تسوّقي كريجي', '#fff', '#5a0f22', pos='center 20%', hsize=96)
    yield 'c_huda', lambda n: card(n, P('huda-beauty/huda_empowered_model-deep-skin_port.jpg'), '#140c08', '#f4e7d4', wm_huda('#f4e7d4', 34),
        'Empowered Palette', '#d4a85f', 'Empowered.', 'باليت إمباورد من هدى بيوتي', 'تسوّقي هدى بيوتي', '#d4a85f', '#140c08', pos='center 20%')
    yield 'c_maybelline', lambda n: card(n, P('maybelline/maybelline_lifter-gloss_model-pink-sunglasses_square.jpg'), '#c41d5a', '#fff', wm_mny('#fff', 40),
        'New York', '#ffd1e0', 'In colour.', 'ميبيلين — مكياج يواكب يومكِ', 'تسوّقي ميبيلين', '#fff', '#c41d5a', pos='center 30%')
    yield 'c_deborah', lambda n: card(n, P('deborah/deborah_red-lipstick_model-roses-red-lips_portrait.jpg'), '#7d1024', '#fff', wm_deborah('#fff', 46),
        'Milano Red · Lips', '#ffc9cf', 'Milano red.', 'أحمر شفاه ميلانو ريد المطفي', 'تسوّقي ديبورا', '#fff', '#7d1024', pos='center 15%')
    yield 'c_catrice', lambda n: card(n, P('catrice/catrice_lip-gloss_lips-closeup_landscape.jpg'), '#7a3434', '#fff', wm_catrice('#fff', 40),
        'Filler Supreme · Gloss', '#ffd2c8', 'Fuller, glossier.', 'غلوس فيلر سوبريم بلمعة زجاجية', 'تسوّقي كاتريس', '#fff', '#7a3434', pos='62% center', hsize=92)
    yield 'c_essence', lambda n: card(n, P('essence/essence_lash-princess_model-pink-room_portrait.jpg'), '#b82a5c', '#fff', wm_essence('#fff', 54),
        'Lash Princess', '#ffd3e2', 'Lash royalty.', 'ماسكارا لاش برينسس الشهيرة', 'تسوّقي إيسنس', '#fff', '#b82a5c', pos='center 12%')
    yield 'c_sheglam', lambda n: card(n, P('sheglam/sheglam_colorbloom_blush-sponge-stilllife_sq.jpg'), '#b9465f', '#fff', wm_sheglam('#fff', 44),
        'Color Bloom', '#ffd6de', 'In full bloom.', 'بلاشر كولور بلوم السائل', 'تسوّقي شيغلام', '#fff', '#b9465f', pos='center 30%')
    yield 'c_mufe', lambda n: card(n, P('make-up-for-ever/mufe_hdskin-blushglow_model-deep-glow_sq.jpg'), '#24110f', '#fff', wm_mufe('#fff', 30),
        'Professional · Paris', '#f0b9a8', 'Made to last.', 'مكياج المحترفين من باريس', 'تسوّقي ميك أب فور إيفر', '#fff', '#24110f', pos='center 20%')
    yield 'c_nyx', lambda n: card(n, P('nyx/nyx_faceglue-spray_model-holding_sq.jpg'), '#3b2a63', '#fff', wm_nyx('#fff', 56),
        'The Face Glue · Setting Spray', '#d9ccff', 'Locked in.', 'بخاخ تثبيت المكياج ذا فيس غلو', 'تسوّقي نيكس', '#fff', '#3b2a63', pos='40% center')
    yield 'c_astra', lambda n: card(n, P('astra/astra_light-therapy_model-glow-blush_portrait.jpg'), '#8c3c4a', '#fff', wm_astra('#fff', 40),
        'Light Therapy', '#ffd0d6', 'Lit from within.', 'هايلايتر لايت ثيرابي السائل', 'تسوّقي أسترا', '#fff', '#8c3c4a', pos='center 20%')
    yield 'c_abh', lambda n: card(n, P('anastasia-beverly-hills/abh_blushtrio_model-pink_sq.jpg'), '#6b4a45', '#fff', wm_abh('#fff', 38),
        'Beverly Hills · New in', '#f6d2c6', 'Soft glam.', 'وصل حديثاً — أنستازيا بيفرلي هيلز', 'تسوّقي أنستازيا', '#fff', '#6b4a45', pos='center 20%')

# ======================= LOOKS (1080x1350) =======================
def looks():
    L = P('looks/')
    yield 'l1_night', lambda n: look(n, P('deborah/deborah_lipstick_model-roses-berry-lips_portrait.jpg'), 1, 'سهرة جريئة', 'Night glam', '#5a0f22', 'center 10%', items='شفاه بلون التوت · عيون لامعة')
    yield 'l2_soft', lambda n: look(n, L + 'look_soft-nude_huda-beauty.jpg', 2, 'نود ناعم', 'Soft nude', '#8a5b4c', 'center 18%', items='بشرة نضرة · شفاه نود')
    yield 'l3_smoky', lambda n: look(n, L + 'look_smoky-eye_huda-beauty.jpg', 3, 'عيون دخانية', 'Smoky eyes', '#2d1a26', 'center 15%', items='ظلال دخانية · آيلاينر · ماسكارا')
    yield 'l4_glow', lambda n: look(n, L + 'look_dewy-glow_astra.jpg', 4, 'بشرة مضيئة', 'Dewy glow', '#7c4a52', 'center 15%', items='هايلايتر · بلاشر · غلوس')
    yield 'l5_bride', lambda n: look(n, L + 'look_bridal-romantic_huda-beauty.jpg', 5, 'إطلالة العروس', 'Bridal romance', '#6e5a62', 'center 18%', items='ثبات طوال اليوم · لمسة رومانسية')

# ======================= SHOP-BY TILES (800x800) =======================
def tiles():
    T = P('tiles/')
    yield 't_lips', lambda n: tile(n, T + 'tile_lips_huda-beauty_1.jpg', 'الشفاه', 'Lips', '#5c0c16', 'center 45%')
    yield 't_eyes', lambda n: tile(n, T + 'tile_eyes_huda-beauty_1.jpg', 'العيون', 'Eyes', '#3a2414', 'center 40%')
    yield 't_face', lambda n: tile(n, T + 'tile_face_astra_2.jpg', 'البشرة', 'Face', '#4a2a1e', 'center 35%')
    yield 't_cheeks', lambda n: tile(n, T + 'tile_cheeks_huda-beauty_1.jpg', 'الخدود', 'Cheeks', '#5a2230', 'center 25%')
    yield 't_brows', lambda n: tile(n, T + 'tile_brows_anastasia-beverly-hills_1.jpg', 'الحواجب', 'Brows', '#2c2220', 'center 30%')
    yield 't_glow', lambda n: tile(n, T + 'tile_highlighter_huda-beauty_2.jpg', 'الهايلايتر', 'Highlighter', '#4a3020', 'center 35%')
    yield 't_lashes', lambda n: tile(n, P('artdeco/artdeco_mascara_lash-closeup_square.jpg'), 'الماسكارا', 'Mascara', '#2a1e1c', 'center 40%')
    yield 't_nails', lambda n: tile(n, T + 'tile_nails_revolution_1.jpg', 'الأظافر', 'Nails', '#1f3a4a', 'center 40%')
    yield 't_brushes', lambda n: tile(n, T + 'tile_brushes_huda-beauty_1.jpg', 'الفرش والأدوات', 'Brushes &amp; tools', '#4a3626', 'center 40%')

# ======================= STRIPS (2150x600) =======================
def strips():
    yield 's_budget', lambda n: strip(n, P('catrice/catrice_hd-coverage-camouflage_stilllife_square.jpg'), 'left', '#f3e3e6', '#2a1424',
        'Beauty under 10,000 IQD', '#b0306a', 'Little luxuries.', 'مكياج بأقل من ١٠ آلاف دينار', 'تسوّقي الآن', '#2a1424', '#fff',
        box=(1250, 0, 900, 600), pos='center 40%', frame_col='rgba(42,20,36,.14)')
    yield 's_delivery', lambda n: strip(n, P('deborah/deborah_easy-blush_stilllife-cloche_portrait.jpg'), 'left', '#2a1424', '#fbeff4',
        '100% Original · Cash on delivery', '#e3a6c4', 'Delivered to your door.', 'توصيل مجاني فوق ٥٠ ألف دينار — لكل المحافظات', 'تسوّقي المكياج', '#fbeff4', '#2a1424',
        box=(1250, 0, 900, 600), pos='center 88%', frame_col='rgba(251,239,244,.25)', hsize=96)

# ======================= RUN =======================
def run(groups, flt=None):
    names = []
    for g in groups:
        for n, f in g():
            if flt and flt not in n: continue
            f(n); names.append(n); print('rendered', n, flush=True)
    return names

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'; flt = sys.argv[2] if len(sys.argv) > 2 else None
    G = {'heroes': [heroes], 'rooms': [rooms], 'cards': [cards], 'looks': [looks], 'tiles': [tiles], 'strips': [strips]}
    gs = sum(G.values(), []) if what == 'all' else G[what]
    run(gs, flt)
