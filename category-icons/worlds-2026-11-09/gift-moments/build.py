# gift-moments (لحظات تُهدى) — renders every banner/room/card/tile/strip. Usage: python3 build.py [group ...]
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT + '/kit'); sys.path.insert(0, HERE)
from kit import set_out, sheet, WM
set_out(HERE + '/out')
from gm import hero, card, tile, strip, ph, bow

GOLD = '#D4B06A'; GOLD_D = '#B8954A'

OPSZ = "font-variation-settings:'opsz' 9"
# ---- wordmarks (house typography approximations) ----
def wm(brand, col, s=1.0):
    m = {
        'chanel': WM('CHANEL', int(64 * s), col, 'Mont', 600, '.32em'),
        'dior': WM('DIOR', int(76 * s), col, 'Bodoni', 600, '.22em', extra=OPSZ),
        'ch': WM('CAROLINA HERRERA', int(46 * s), col, 'Bodoni', 600, '.16em', extra=OPSZ),
        'dg': WM('DOLCE&amp;GABBANA', int(48 * s), col, 'Bodoni', 600, '.10em', extra=OPSZ),
        'cartier': WM('Cartier', int(88 * s), col, 'Play', 500, '.0em', italic=True),
        'burberry': WM('BURBERRY', int(60 * s), col, 'Mont', 700, '.16em'),
        'tf': WM('TOM FORD', int(60 * s), col, 'Mont', 500, '.34em'),
        'lancome': WM('LANCÔME', int(62 * s), col, 'Bodoni', 600, '.2em', extra=OPSZ),
        'armani': WM('GIORGIO ARMANI', int(46 * s), col, 'Mont', 300, '.36em'),
        'ysl': WM('YVES SAINT LAURENT', int(42 * s), col, 'Bodoni', 600, '.2em', extra=OPSZ),
        'valentino': WM('VALENTINO', int(56 * s), col, 'Bodoni', 600, '.28em', extra=OPSZ),
        'rabanne': WM('rabanne', int(70 * s), col, 'Mont', 800, '.02em'),
        'deema': WM('DEEMA GIFTS', int(40 * s), col, 'Jost', 500, '.4em'),
    }
    return m[brand]

# ====================== HEROES (2150x1000) ======================
def heroes():
    hero('h01_chanel', ph('chanel/chanel_holiday26_sled_wide.jpg'), 'left', '#F1F3F6', '#14161C', '#B08A47',
         wm('chanel', '#111'), 'HOLIDAY 2026', 'The Art of Giving', 'هدايا شانيل لموسم الأعياد — أناقة تُهدى', 'تسوّقي شانيل',
         cta_bg='#111', cta_ink='#fff', frac=.62, pos='62% 50%', sub_col='#3A3D45')
    hero('h02_dior', ph('christian-dior/dior_holiday26_anya_giftboxes.jpg'), 'right', '#5B3418', '#FBEBD3', GOLD,
         wm('dior', '#FBEBD3'), 'ATELIER OF DREAMS', 'Dreams, Wrapped', 'عطور ديور… هدايا من ورشة الأحلام', 'تسوّقي ديور',
         frac=.6, pos='40% 50%', sub_col='#F3DCBC')
    hero('h03_ch', ph('carolina-herrera/ch_xmas_couple_gifts_wide.jpg'), 'left', '#0D1A45', '#F6EEDD', GOLD,
         wm('ch', '#F6EEDD'), 'GIFTS FOR TWO', 'Made to Be Gifted', 'لها وله — عطور كارولينا هيريرا للمناسبات', 'تسوّقي الهدايا',
         frac=.6, pos='58% 30%')
    hero('h04_dg', ph('dolce--gabbana/dg_devotion_capri_flowers_wide.jpg'), 'right', '#5E0B12', '#FBEAD8', GOLD,
         wm('dg', '#FBEAD8'), 'DEVOTION · THE GIFT EDIT', 'Dolce Celebrations', 'دولتشي آند غابانا — هدية بروح إيطالية', 'اكتشفي المجموعة',
         frac=.6, pos='45% 50%')
    hero('h05_cartier', ph('cartier/cartier_panthere_vanessa_red_dress.jpg'), 'left', '#12261B', '#F4EBDD', GOLD,
         wm('cartier', '#F4EBDD'), 'LA PANTHÈRE', 'Wild at Heart', 'كارتييه لا بانتير — هدية لا تُنسى', 'تسوّقي كارتييه',
         frac=.5, pos='50% 30%')
    hero('h06_burberry', ph('burberry/bb_her_london_wide.jpg'), 'right', '#F3DADA', '#4A1420', '#A8794A',
         wm('burberry', '#4A1420'), 'BURBERRY HER', 'Love, from London', 'بربري — هدايا بلمسة بريطانية حالمة', 'تسوّقي بربري',
         cta_bg='#4A1420', cta_ink='#fff', frac=.6, pos='50% 60%', sub_col='#6B2A35')
    hero('h07_tomford', ph('tom-ford/tf_ombre_leather_set_golden.jpg'), 'left', '#0E0D0C', '#F2E8D8', GOLD,
         wm('tf', '#F2E8D8'), 'GIFTS FOR HIM', 'A Gift of Distinction', 'توم فورد — عطور فاخرة تليق به', 'تسوّقي توم فورد',
         frac=.52, pos='50% 55%')
    hero('h08_lancome', ph('lancome/la-vie-est-belle-julia-roberts-1.jpg'), 'right', '#E9E1EE', '#3B1F3F', '#9C7A4C',
         wm('lancome', '#3B1F3F'), 'FOR MOM', 'Because Life is Beautiful', 'لأمي… هدية بقدر حبّها', 'هدايا الأم',
         cta_bg='#3B1F3F', cta_ink='#fff', frac=.5, pos='50% 25%', hsize=100, sub_col='#5A3A5E')
    hero('h09_armani', ph('giorgio-armani/si-passione-sara-sampaio-1.jpg'), 'left', '#7A0D12', '#FFF0E6', GOLD,
         wm('armani', '#FFF0E6'), 'SÌ PASSIONE', 'A Gift of Passion', 'جورجيو أرماني — هدية بلون الشغف', 'تسوّقي أرماني',
         frac=.5, pos='50% 40%')


# ====================== BRAND ROOMS (2150x1000) ======================
def rooms():
    hero('r01_chanel', ph('chanel/chanel_gifting_model_boxes.jpg'), 'left', '#F6F3EE', '#141414', '#A88645',
         wm('chanel', '#111'), 'THE CHANEL GIFT ROOM', 'Wrapped in Chanel', 'عطور شانيل الأيقونية — هدية تبقى في الذاكرة', 'تسوّقي شانيل',
         cta_bg='#111', cta_ink='#fff', frac=.5, pos='50% 45%', sub_col='#3b3b3b')
    hero('r02_dior', ph('christian-dior/dior_holiday26_missdior_gifts.jpg'), 'right', '#6A3E1F', '#FBEBD3', GOLD,
         wm('dior', '#FBEBD3'), 'THE DIOR GIFT ROOM', 'Miss Dior, with Love', 'ميس ديور وجادور وسوفاج — هدايا بتوقيع ديور', 'تسوّقي ديور',
         frac=.58, pos='55% 50%', sub_col='#F3DCBC')
    hero('r03_ch', ph('carolina-herrera/ch_xmas_212vip_rose.jpg'), 'left', '#0D1A45', '#F6EEDD', GOLD,
         wm('ch', '#F6EEDD'), 'GOOD GIRL · 212 VIP', 'Sparkle & Give', 'كارولينا هيريرا — هدايا تلمع في كل مناسبة', 'تسوّقي كارولينا هيريرا',
         frac=.5, pos='50% 22%')
    hero('r04_cartier', ph('cartier/cartier_panthere_family_rock.jpg'), 'right', '#12261B', '#F4EBDD', GOLD,
         wm('cartier', '#F4EBDD'), 'THE CARTIER GIFT ROOM', 'The Panthère Family', 'عطور كارتييه — فخامة فرنسية تُهدى', 'تسوّقي كارتييه',
         frac=.5, pos='50% 62%')
    hero('r05_tomford', ph('tom-ford/tf_ombre_leather_black_leather.jpg'), 'left', '#0E0D0C', '#F2E8D8', GOLD,
         wm('tf', '#F2E8D8'), 'THE TOM FORD GIFT ROOM', 'Noir &amp; Ombré Leather', 'توم فورد — عطور جريئة لهدية لا تُنسى', 'تسوّقي توم فورد',
         frac=.5, pos='50% 50%')
    hero('r06_dg', ph('dolce--gabbana/dg_beauty_model_lace.jpg'), 'right', '#5E0B12', '#FBEAD8', GOLD,
         wm('dg', '#FBEAD8'), 'THE D&amp;G GIFT ROOM', 'Love, Gifted', 'دولتشي آند غابانا — أطقم وعطور للحب', 'تسوّقي دولتشي آند غابانا',
         frac=.5, pos='50% 22%')
    hero('r07_forhim', ph('carolina-herrera/ch_xmas_man_212vip.jpg'), 'right', '#0F1830', '#EEF0F5', GOLD,
         wm('deema', '#EEF0F5'), 'GIFT SETS FOR HIM', 'Ready to Gift', 'أطقم رجالية جاهزة للإهداء — من أرقى الدور', 'تسوّقي أطقم له',
         frac=.5, pos='50% 25%')
    hero('r08_burberry', ph('burberry/bb_hero_beach_wide.jpg'), 'left', '#2A1D14', '#F3E7D6', GOLD,
         wm('burberry', '#F3E7D6'), 'BURBERRY HERO', 'For Your Hero', 'بربري هيرو وغوديس — هدايا لهما', 'تسوّقي بربري',
         frac=.58, pos='50% 60%')
    hero('r09_lancome', ph('lancome/la-vie-est-belle-sparkle-stilllife-1.jpg'), 'right', '#232850', '#F1EAF4', '#D8B98A',
         wm('lancome', '#F1EAF4'), 'LA VIE EST BELLE', 'A Beautiful Life', 'لانكوم — ابتسامة في زجاجة عطر', 'تسوّقي لانكوم',
         frac=.5, pos='50% 50%', sub_col='#DCD3E6')
    hero('r10_ysl', ph('yves-saint-laurent/black-opium-over-red-stilllife-1.jpg'), 'left', '#16070A', '#F7E9E4', '#D9A066',
         wm('ysl', '#F7E9E4'), 'BLACK OPIUM OVER RED', 'After Dark, Gifted', 'إيف سان لوران — هدية بنبض الليل', 'تسوّقي إيف سان لوران',
         frac=.5, pos='50% 50%')
    hero('r11_valentino', ph('valentino/born-in-roma-donna-intense-jasmine-stilllife-1.jpg'), 'right', '#3B0A1E', '#FBE8EC', '#E0A9B6',
         wm('valentino', '#FBE8EC'), 'BORN IN ROMA', 'Roman Holiday', 'فالنتينو — هدية بروح روما', 'تسوّقي فالنتينو',
         frac=.5, pos='50% 35%', sub_col='#F3D3DA')
    hero('r12_rabanne', ph('paco-rabanne/1million_golden_oud_gold_light_portrait.jpg'), 'left', '#160F05', '#F6EBD2', GOLD,
         wm('rabanne', '#F6EBD2'), '1 MILLION · INVICTUS', 'Pure Gold', 'رابان — هدية تلمع كالذهب', 'تسوّقي رابان',
         frac=.5, pos='50% 45%')

# ====================== SPOTLIGHT CARDS (1080x1350) ======================
def cards():
    card('c01_chanel', ph('chanel/chanel_holiday26_portrait.jpg'), '#EEF1F5', '#15171C', '#A88645', wm('chanel', '#111', .8),
         'HOLIDAY 2026', 'Snow-Kissed Gifts', 'هدايا شانيل لموسم الأعياد', 'اكتشفي', cta_bg='#111', cta_ink='#fff', pos='50% 12%', sub_col='#3A3D45')
    card('c02_dior', ph('christian-dior/dior_holiday26_star_calendar_tall.jpg'), '#5B3418', '#FBEBD3', GOLD, wm('dior', '#FBEBD3', .85),
         'ATELIER OF DREAMS', 'A Star is Gifted', 'سحر ديور في كل هدية', 'اكتشفي', pos='50% 0%')
    card('c03_ch', ph('carolina-herrera/ch_xmas_karlie_sequin.jpg'), '#0D1A45', '#F6EEDD', GOLD, wm('ch', '#F6EEDD', .8),
         'GOOD GIRL', 'Good Girls Give', 'عطور كارولينا هيريرا', 'اكتشفي', pos='50% 10%')
    card('c04_cartier', ph('cartier/cartier_panthere_vanessa_water.jpg'), '#1B2A26', '#F4EBDD', GOLD, wm('cartier', '#F4EBDD', .85),
         'LA PANTHÈRE', 'Fierce &amp; Feminine', 'كارتييه — أناقة لا تُروَّض', 'اكتشفي', pos='50% 15%')
    card('c05_burberry', ph('burberry/bb_her_model_pink.jpg'), '#F3DADA', '#4A1420', '#A8794A', wm('burberry', '#4A1420', .8),
         'BURBERRY HER', 'Pretty in Pink', 'بربري هير — هدية حالمة', 'اكتشفي', cta_bg='#4A1420', cta_ink='#fff', pos='50% 0%', sub_col='#6B2A35')
    card('c06_tomford', ph('tom-ford/tf_noir_extreme_amber.jpg'), '#120D08', '#F2E8D8', GOLD, wm('tf', '#F2E8D8', .8),
         'NOIR EXTREME', 'Amber After Dark', 'توم فورد — دفء العنبر', 'اكتشفي', pos='50% 40%')
    card('c08_valentino', ph('valentino/born-in-roma-donna-fountain-stilllife-1.jpg'), '#3B0A1E', '#FBE8EC', '#E0A9B6', wm('valentino', '#FBE8EC', .8),
         'BORN IN ROMA', 'Roma, Wrapped', 'فالنتينو — هدية بروح روما', 'اكتشفي', pos='50% 40%')
    card('c09_rabanne', ph('paco-rabanne/1million_edt_model_car_portrait.jpg'), '#0E0C08', '#F6EBD2', GOLD, wm('rabanne', '#F6EBD2', .8),
         '1 MILLION', 'Worth a Million', 'رابان ون مليون — هدية تليق به', 'اكتشفي', pos='50% 20%')
    card('c10_lancome', ph('lancome/la-vie-est-belle-julia-roberts-1.jpg'), '#E9E1EE', '#3B1F3F', '#9C7A4C', wm('lancome', '#3B1F3F', .8),
         'LA VIE EST BELLE', 'Joy, Bottled', 'لانكوم — ابتسامة تُهدى', 'اكتشفي', cta_bg='#3B1F3F', cta_ink='#fff', pos='70% 20%', sub_col='#5A3A5E')

# ====================== TILES (800x800) ======================
def tiles():
    # gift by recipient
    tile('t01_forher', ph('carolina-herrera/ch_xmas_karlie_goodgirl.jpg'), 'هدايا لها', 'FOR HER', scrim='#0D1A45', pos='50% 18%')
    tile('t02_forhim', ph('carolina-herrera/ch_xmas_man_badboy.jpg'), 'هدايا له', 'FOR HIM', scrim='#0B1226', pos='50% 15%')
    tile('t03_formom', ph('giorgio-armani/si-passione-cate-blanchett-1.jpg'), 'هدايا الأم', 'FOR MOM', scrim='#4A0A0E', pos='50% 12%')
    tile('t04_friend', ph('burberry/bb_her_model_pink_wide.jpg'), 'لصديقتي', 'FOR A FRIEND', scrim='#5A2232', pos='42% 40%')
    tile('t05_bride', ph('chanel/chanel_gifting_coco_boxes.jpg'), 'هدايا العروس', 'FOR THE BRIDE', scrim='#3A2A1E', pos='50% 45%')
    tile('t06_treats', ph('dolce--gabbana/dg_holiday_fragrance_trio.jpg'), 'لمسات صغيرة', 'LITTLE TREATS', scrim='#4A070D', pos='50% 50%')
    # by occasion
    tile('o01_birthday', ph('carolina-herrera/ch_xmas_goodgirl_heels_gifts.jpg'), 'عيد ميلاد', 'BIRTHDAY', scrim='#3A0710', pos='50% 50%')
    tile('o02_eid', ph('christian-dior/dior_holiday26_giftbox.jpg'), 'هدايا العيد', 'EID GIFTS', scrim='#3B220E', pos='45% 50%')
    tile('o03_anniversary', ph('carolina-herrera/ch_xmas_story2_tall.jpg'), 'ذكرى الزواج', 'ANNIVERSARY', scrim='#0D1A45', pos='50% 30%')
    # by budget
    tile('b01_25k', ph('catrice/catrice_last-chance_model-red-lips_landscape.jpg'), 'بأقل من 25 ألف', 'GIFTS UNDER', scrim='#4A0A1A', pos='50% 50%', big='25K')
    tile('b02_50k', ph('burberry/bb_goddess_check_scarf.jpg'), 'بأقل من 50 ألف', 'GIFTS UNDER', scrim='#3A2414', pos='50% 50%', big='50K')
    tile('b03_100k', ph('chanel/chanel_gifting_ribbon_wide.jpg'), 'بأقل من 100 ألف', 'GIFTS UNDER', scrim='#1E1E22', pos='35% 50%', big='100K')

# ====================== STRIPS (2150x600) ======================
RIBBON = """<div class="a" style="left:1760px;top:0;width:96px;height:600px;z-index:4;background:linear-gradient(90deg,#8E6A2E,#E9CF8F 30%,#C9A45A 55%,#F3DEA6 75%,#9B7633);box-shadow:0 0 30px rgba(0,0,0,.35)"></div>
<div class="a" style="left:1480px;top:262px;width:670px;height:76px;z-index:4;background:linear-gradient(180deg,#8E6A2E,#E9CF8F 30%,#C9A45A 55%,#F3DEA6 75%,#9B7633);-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%);box-shadow:0 0 30px rgba(0,0,0,.35)"></div>
<svg class="a" style="left:1628px;top:150px;z-index:5" width="360" height="300" viewBox="0 0 360 300">
 <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#F5E2AE"/><stop offset=".45" stop-color="#C9A45A"/><stop offset="1" stop-color="#8E6A2E"/></linearGradient>
 <filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity=".35"/></filter></defs>
 <g filter="url(#s)" fill="url(#g)" stroke="#7E5C25" stroke-width="2">
  <path d="M180 150 C140 60, 40 40, 30 100 C22 150, 110 175, 180 150 Z"/>
  <path d="M180 150 C220 60, 320 40, 330 100 C338 150, 250 175, 180 150 Z"/>
  <path d="M170 160 C150 210, 120 250, 90 290 L120 292 C145 250, 165 215, 182 165 Z"/>
  <path d="M190 160 C210 210, 240 250, 270 290 L240 292 C215 250, 195 215, 178 165 Z"/>
  <ellipse cx="180" cy="152" rx="26" ry="30"/></g></svg>"""

def strips():
    strip('s01_giftwrap', None, 'left', '#5E0B12', '#FBEAD8', GOLD, 'GIFT WRAPPING · MESSAGE CARD', 'Wrapped with Love',
          'نغلّف هديتك ونرفق رسالتك الخاصة', 'اختاري هديتك', extra=RIBBON, hsize=96, text_w=1420,
          note='تغليف هدايا أنيق مع بطاقة برسالتك — 3,000 د.ع فقط')
    strip('s02_under50', ph('dolce--gabbana/dg_holiday_giftbox.jpg'), 'left', '#2E0A10', '#FBEAD8', GOLD, 'GIFTS UNDER 50K',
          'Thoughtful, Not Costly', 'هدايا أصلية بأقل من 50 ألف د.ع', 'تسوّقي الآن', frac=.5, pos='50% 50%',
          note='توصيل مجاني لكل العراق للطلبات فوق 50,000 د.ع')
    strip('s03_original', ph('burberry/bb_goddess_sunset_wide.jpg'), 'right', '#2B170B', '#F6E7D2', GOLD, '100% AUTHENTIC · CASH ON DELIVERY',
          'Genuine. Gift-Ready.', 'أصلية 100٪ • الدفع عند الاستلام', 'تسوّقي الهدايا', frac=.45, pos='40% 55%', fade=380,
          note='توصيل إلى جميع المحافظات العراقية')

GROUPS = {'heroes': heroes, 'rooms': rooms, 'cards': cards, 'tiles': tiles, 'strips': strips}
if __name__ == '__main__':
    for g in (sys.argv[1:] or GROUPS):
        GROUPS[g]()
