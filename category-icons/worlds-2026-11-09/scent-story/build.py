# scent-story (حكاية عطر) — luxury fragrance hall. Renders heroes, rooms, spotlight cards, tiles, strips.
import sys, os
ROOT = '/private/tmp/claude-502/-Volumes-ADATA-SD810-Projects-full-app-worktrees-puf/a24a93fb-b78e-45ce-b2d4-ece50b1ff8e8/scratchpad/w5'
sys.path.insert(0, ROOT + '/kit')
from kit import *
W5 = ROOT + '/scent-story'; PH = W5 + '/photos/'
set_out(W5 + '/out')
ONLY = set(sys.argv[1:])

def go(name):
    return not ONLY or any(name.startswith(o) for o in ONLY)

GOLD = '#D9B77A'; CREAM = '#F6EEE2'
# fine inset frame for a couture feel
def frame(col='rgba(255,255,255,.28)', inset=34):
    return f'<div class="a" style="inset:{inset}px;border:1.5px solid {col};z-index:40;pointer-events:none"></div>'

# ---------------- wordmarks ----------------
WMS = {
 'dior':   lambda c, s=1: WM('Dior', int(92*s), c, 'Bodoni', 500, '.01em'),
 'chanel': lambda c, s=1: WM('CHANEL', int(58*s), c, 'Jost', 600, '.32em'),
 'ch':     lambda c, s=1: WM('CAROLINA HERRERA', int(44*s), c, 'Marcellus', 400, '.18em'),
 'armani': lambda c, s=1: WM('GIORGIO ARMANI', int(44*s), c, 'Jost', 400, '.36em'),
 'ysl':    lambda c, s=1: WM('YVES SAINT LAURENT', int(40*s), c, 'Jost', 500, '.22em'),
 'lancome':lambda c, s=1: WM('LANCÔME', int(56*s), c, 'Cinzel', 600, '.22em'),
 'valentino': lambda c, s=1: WM('VALENTINO', int(58*s), c, 'Marcellus', 400, '.26em'),
 'tomford':lambda c, s=1: WM('TOM FORD', int(58*s), c, 'Jost', 500, '.3em'),
 'pdm':    lambda c, s=1: WM('PARFUMS de MARLY', int(44*s), c, 'Cinzel', 600, '.12em'),
 'versace':lambda c, s=1: WM('VERSACE', int(62*s), c, 'Cinzel', 700, '.2em'),
 'dg':     lambda c, s=1: WM('DOLCE&amp;GABBANA', int(48*s), c, 'Marcellus', 400, '.1em'),
 'mancera':lambda c, s=1: WM('MANCERA', int(58*s), c, 'Cinzel', 600, '.28em'),
 'prada':  lambda c, s=1: WM('PRADA', int(66*s), c, 'Mont', 800, '.16em'),
 'guerlain':lambda c, s=1: WM('GUERLAIN', int(58*s), c, 'Marcellus', 400, '.24em'),
 'givenchy':lambda c, s=1: WM('GIVENCHY', int(56*s), c, 'Jost', 600, '.3em'),
 'xerjoff':lambda c, s=1: WM('XERJOFF', int(58*s), c, 'Cinzel', 600, '.26em'),
 'montale':lambda c, s=1: WM('MONTALE', int(56*s), c, 'Marcellus', 400, '.3em'),
 'story':  lambda c, s=1: WM('THE SCENT STORY', int(36*s), c, 'Jost', 500, '.42em'),
}

def E(name, photo, wm, side, scrim, ink, kicker, kcol, head, sub, scol, cta, cbg, cink, **k):
    if not go(name): return
    fr = k.pop('frame', 'rgba(255,255,255,.22)')
    extra = k.pop('extra', '') + (frame(fr) if fr else '')
    editorial(name, PH + photo, side, scrim, ink, WMS[wm](ink) if isinstance(wm, str) else wm, kicker, kcol, head, sub, scol, cta, cbg, cink, extra=extra, **k)

# ================= HEROES (2150x1000) =================
E('hero01_dior_jadore', 'christian-dior/jadore-rihanna-hero-1.jpg', 'dior', 'left', 'rgb(34,22,10)', CREAM,
  "J'ADORE · EAU DE PARFUM", GOLD, 'The Absolute<br>Feminine', 'جادور من ديور… ذهبُ الأنوثة في قطرة', '#E9D6B4',
  'تسوّقي ديور', GOLD, '#21150A', pos='right center', scrim_w=50)
E('hero02_ch_goodgirl', 'carolina-herrera/good-girl-karlie-kloss-wide-1.jpg', 'ch', 'right', 'rgb(96,10,22)', '#FFF3EE',
  'GOOD GIRL · EAU DE PARFUM', '#F4B9B9', "It's So Good<br>to Be Bad", 'جرأةٌ وأنوثة على كعبٍ عالٍ', '#F7D5D2',
  'تسوّقي كارولينا هيريرا', '#FFF3EE', '#6E0A18', box=(0, 0, 1260, 1000), pos='left center', hsize=112)
E('hero03_chanel_coco', 'chanel/coco-mademoiselle-model-hero-2.jpg', 'chanel', 'right', 'rgb(58,30,20)', '#FFF1E6',
  'COCO MADEMOISELLE', '#F0C2A0', 'Free. Bold.<br>Mademoiselle', 'أناقةُ شانيل الخالدة… بروحٍ متمرّدة', '#F3D8C4',
  'تسوّقي شانيل', '#FFF1E6', '#3A1E14', pos='left center', scrim_w=48)
E('hero04_armani_si', 'giorgio-armani/si-passione-sara-sampaio-1.jpg', 'armani', 'left', 'rgb(168,18,24)', '#FFF5F2',
  'SÌ PASSIONE · EAU DE PARFUM', '#FFD0C8', 'Say Yes<br>to Passion', 'سي باسيوني… أحمرٌ لا يُنسى من أرماني', '#FFE1DB',
  'تسوّقي أرماني', '#FFF5F2', '#A81218', box=(1000, 0, 1150, 1000), pos='center 12%')
E('hero05_dior_sauvage', 'christian-dior/sauvage-depp-hero-1.jpg', 'dior', 'left', 'rgb(36,22,22)', '#F4ECE6',
  'SAUVAGE · FOR HIM', '#E2A27E', 'Wild at<br>Heart', 'سوفاج من ديور… هديةٌ تليق بحضوره', '#E8D3C6',
  'تسوّقي له', '#E2A27E', '#24160F', pos='right center', scrim_w=50)
E('hero06_ysl_opium', 'yves-saint-laurent/black-opium-zoe-kravitz-city-2.jpg', 'ysl', 'left', 'rgb(5,7,24)', '#F5EEF6',
  'BLACK OPIUM · EAU DE PARFUM', '#E58FB4', 'After Dark,<br>Black Opium', 'قهوة وفانيلا وزهرٌ أبيض… سحرُ الليل', '#E3D4E6',
  'تسوّقي إيف سان لوران', '#E58FB4', '#12081A', box=(1050, 0, 1100, 1000), pos='center 30%')
E('hero07_lancome_lveb', 'lancome/la-vie-est-belle-julia-roberts-1.jpg', 'lancome', 'left', 'rgb(44,50,82)', '#FFFFFF',
  'LA VIE EST BELLE', '#F5C1D3', 'Life is<br>Beautiful', 'لا في إي بيل… ابتسامةٌ تفوح عطراً', '#E3E6F4',
  'تسوّقي لانكوم', '#F5C1D3', '#2C3252', box=(1050, 0, 1100, 1000), pos='center 18%')
E('hero08_valentino_roma', 'valentino/born-in-roma-donna-model-fountain-1.jpg', 'valentino', 'left', 'rgb(206,190,178)', '#3A2420',
  'BORN IN ROMA · DONNA', '#A0503C', 'Born in<br>Roma', 'روحُ روما الحالمة في زجاجةٍ مرصّعة', '#5A3A32',
  'تسوّقي فالنتينو', '#3A2420', '#F4E8DE', box=(1050, 0, 1100, 1000), pos='center 20%', frame='rgba(58,36,32,.25)')
E('hero09_tomford_ombre', 'tom-ford/ombre-leather-stilllife-wide-1.jpg', 'tomford', 'left', 'rgb(206,204,202)', '#141210',
  'PRIVATE BLEND · OMBRÉ LEATHER', '#6B5A48', 'Dark Luxury,<br>Defined', 'توم فورد… فخامةٌ داكنة لا تشبه أحداً', '#3C342C',
  'تسوّقي توم فورد', '#141210', '#EDE6DC', box=(1000, 0, 1150, 1000), pos='right center', frame='rgba(20,18,16,.22)')
E('hero10_niche_pdm', 'parfums-de-marly/valaya-snowy-garden-balloon-hero-1.jpg', 'pdm', 'left', 'rgb(16,26,50)', '#F2F4FA',
  'THE NICHE COLLECTION', GOLD, 'Rare by<br>Nature', 'توقيعاتٌ نادرة من أرقى بيوت النيش', '#D6DEEE',
  'اكتشفي عطور النيش', GOLD, '#101A32', pos='center center', scrim_w=46)

# ================= ROOMS (2150x1000) =================
E('room_dior', 'christian-dior/miss-dior-portman-portrait-1.jpg', 'dior', 'left', 'rgb(236,224,216)', '#3E2A2A',
  'THE HOUSE OF DIOR', '#B0707A', 'Miss Dior,<br>in Bloom', 'من جادور إلى سوفاج… أيقونات دار ديور', '#5E4444',
  'تسوّقي ديور', '#3E2A2A', '#F6ECE6', box=(1050, 0, 1100, 1000), pos='center 22%', frame='rgba(62,42,42,.2)')
E('room_chanel', 'chanel/bleu-de-chanel-elordi-hero-1.jpg', 'chanel', 'left', 'rgb(4,22,44)', '#F2F6FB',
  'BLEU DE CHANEL', '#8FB8E6', 'Unexpected<br>Blue', 'بلو دو شانيل وكوكو وشانس… كلاسيكيات خالدة', '#D2DEEC',
  'تسوّقي شانيل', '#F2F6FB', '#04162C', pos='center 30%', scrim_w=46)
E('room_ch', 'carolina-herrera/la-bomba-vittoria-ceretti-wide-1.jpg', 'ch', 'left', 'rgb(16,24,62)', '#FFF4F2',
  'LA BOMBA · GOOD GIRL · 212', '#F2A3AE', 'Bold is<br>Beautiful', 'عطور كارولينا هيريرا الأكثر طلباً', '#E2E2F2',
  'تسوّقي كارولينا هيريرا', '#E8323F', '#FFFFFF', pos='center 30%', scrim_w=44)
E('room_armani', 'giorgio-armani/acqua-di-gio-parfum-sea-stilllife-1.jpg', 'armani', 'left', 'rgb(206,206,208)', '#16181A',
  'ACQUA DI GIÒ · SÌ · MY WAY', '#4C5A66', 'Born of<br>the Sea', 'أرماني… من نسيم البحر إلى دفء الأنوثة', '#33393E',
  'تسوّقي أرماني', '#16181A', '#EEEEEF', box=(1050, 0, 1100, 1000), pos='center 45%', frame='rgba(22,24,26,.2)')
E('room_ysl', 'yves-saint-laurent/libre-dua-lipa-1.jpg', 'ysl', 'left', 'rgb(16,12,8)', '#F6EEE2',
  'LIBRE · BLACK OPIUM · MYSLF', GOLD, 'Libre,<br>Always', 'إيف سان لوران… حريةٌ بتوقيعٍ باريسي', '#E2D4BE',
  'تسوّقي إيف سان لوران', GOLD, '#100C08', box=(1050, 0, 1100, 1000), pos='center 20%')
E('room_dg', 'dolce--gabbana/k-q-stilllife-desert-wide-1.jpg', 'dg', 'left', 'rgb(226,212,198)', '#2A1C14',
  'K · Q · THE ONE · DEVOTION', '#9C4A32', 'Kings &amp;<br>Queens', 'دولتشي آند غابانا… الفخامة الإيطالية', '#4E3A2E',
  'تسوّقي دولتشي آند غابانا', '#9C1C1C', '#FFFFFF', box=(950, 0, 1200, 1000), pos='85% center', frame='rgba(42,28,20,.2)')
E('room_versace', 'versace/crystal-noir-stilllife-wide-1.jpg', 'versace', 'left', 'rgb(12,11,4)', '#F4EEE0',
  'CRYSTAL NOIR · EROS · BRIGHT CRYSTAL', GOLD, 'Crystal<br>Noir', 'فرساتشي… جرأةٌ إيطالية بلمسةٍ ذهبية', '#DDD2BC',
  'تسوّقي فرساتشي', GOLD, '#0C0B04', box=(820, 0, 1330, 1000), pos='center center', hsize=120)
E('room_tomford', 'tom-ford/black-orchid-stilllife-orchids-1.jpg', 'tomford', 'left', 'rgb(214,212,214)', '#121012',
  'BLACK ORCHID · NOIR · PRIVATE BLEND', '#6E3A5E', 'Black<br>Orchid', 'أوركيد أسود وعطور الخاصة… من توم فورد', '#3A3238',
  'تسوّقي توم فورد', '#121012', '#EEE8EC', box=(1050, 0, 1100, 1000), pos='center center', frame='rgba(18,16,18,.2)')
E('room_lancome', 'lancome/idole-zendaya-1.jpg', 'lancome', 'left', 'rgb(232,214,212)', '#3A2228',
  'IDÔLE · LA VIE EST BELLE', '#B26474', 'Be Your<br>Own Idôle', 'لانكوم… عطور تحتفي بكِ', '#5C3E44',
  'تسوّقي لانكوم', '#3A2228', '#F8ECEA', box=(1050, 0, 1100, 1000), pos='center 20%', frame='rgba(58,34,40,.2)')
E('room_mancera', 'mancera/tonka-cola-amber-splash-still-1.jpg', 'mancera', 'left', 'rgb(30,16,6)', '#F6EAD8',
  'TONKA COLA · ROSES VANILLE · RED TOBACCO', '#E0A35A', 'Bold by<br>Nature', 'مانسيرا… نيش باريسي بحضورٍ لا يُقاوَم', '#E6D2B8',
  'تسوّقي مانسيرا', '#E0A35A', '#1E1006', box=(1050, 0, 1100, 1000), pos='center center')

# ================= SPOTLIGHT CARDS (1080x1350) =================
def C(name, photo, wm, scrim, ink, kicker, kcol, head, sub, scol, cta, cbg, cink, **k):
    if not go(name): return
    card(name, PH + photo, scrim, ink, WMS[wm](ink, .82), kicker, kcol, head, sub, scol, cta, cbg, cink, **k)

C('card01_valentino', 'valentino/born-in-roma-donna-extradose-model-1.jpg', 'valentino', 'rgb(58,22,30)', '#FFF2F4',
  'BORN IN ROMA EXTRADOSE', '#F59AC0', 'Roman Rush', 'جرعةٌ مضاعفة من الأنوثة', '#F3D6DE', 'تسوّقي فالنتينو', '#F59AC0', '#3A1620', pos='center 30%')
C('card02_prada', 'prada/paradoxe-intense-pink-bag-stilllife-1.jpg', 'prada', 'rgb(120,58,54)', '#FFF4F0',
  'PARADOXE INTENSE', '#FFC9B8', 'Never Just One', 'برادا بارادوكس… أنثى بألف وجه', '#FBDCD2', 'تسوّقي برادا', '#FFF4F0', '#783A36', pos='center 30%')
C('card03_chanel', 'chanel/n5-ribbon-stilllife-1.jpg', 'chanel', 'rgb(40,46,60)', '#FFFFFF',
  'N°5 · CHANCE · COCO', '#F2D58A', 'Forever N°5', 'أسطورةُ شانيل منذ ١٩٢١', '#E2E6EE', 'تسوّقي شانيل', '#F2D58A', '#282E3C', pos='center 40%')
C('card04_guerlain', 'guerlain/la-petite-robe-noire-parfum-stilllife-1.jpg', 'guerlain', 'rgb(52,8,32)', '#FFF0F6',
  'LA PETITE ROBE NOIRE', '#F28CC0', 'Parisian Chic', 'غيرلان… دار العطور الفرنسية العريقة', '#F2D2E2', 'تسوّقي غيرلان', '#F28CC0', '#340820', pos='center 40%')
C('card05_givenchy', 'givenchy/linterdit-rouge-ingredients-stilllife-2.jpg', 'givenchy', 'rgb(70,6,10)', '#FFF1EE',
  "L'INTERDIT ROUGE", '#FF9A8A', 'Forbidden Red', 'جيفنشي… الجرأة المحرّمة', '#F6D4CE', 'تسوّقي جيفنشي', '#FFF1EE', '#46060A', pos='center 40%')
C('card06_versace', 'versace/eros-flame-stilllife-ice-portrait-1.jpg', 'versace', 'rgb(40,46,56)', '#FFFFFF',
  'EROS FLAME', '#F2C46A', 'Fire &amp; Ice', 'فرساتشي إيروس… نارٌ تحت الجليد', '#DCE2EA', 'تسوّقي فرساتشي', '#F2C46A', '#282E38', pos='center 40%')
C('card07_pdm', 'parfums-de-marly/althair-exclusif-wood-panel-still-1.jpg', 'pdm', 'rgb(30,16,8)', '#F8EEDE',
  'ALTHAIR · LAYTON · VALAYA', '#E3A868', 'Royal Heritage', 'بارفيوم دي مارلي… إرث فرساي الملكي', '#E8D6BE', 'تسوّقي بارفيوم دي مارلي', '#E3A868', '#1E1008', pos='center 35%')
C('card08_xerjoff', 'xerjoff/casamorati-italica-clouds-still-1.jpg', 'xerjoff', 'rgb(60,24,62)', '#FFF2FA',
  'CASAMORATI · ITALICA', '#F7B6D6', 'Above the Clouds', 'زيرجوف… فخامةُ النيش الإيطالي', '#F0D8EA', 'تسوّقي زيرجوف', '#F7B6D6', '#3C183E', pos='center 35%')
C('card09_montale', 'montale/arabians-model-white-horse-portrait-1.jpg', 'montale', 'rgb(74,58,40)', '#FFF8EE',
  'ARABIANS COLLECTION', '#F0CC8E', 'Desert Gold', 'مونتال… سحرُ العود والصحراء', '#F2E2CA', 'تسوّقي مونتال', '#F0CC8E', '#4A3A28', pos='center 20%')
C('card10_lancome', 'lancome/la-vie-est-belle-very-cherry-julia-roberts-1.jpg', 'lancome', 'rgb(48,10,20)', '#FFF0F2',
  'LA VIE EST BELLE', '#F58BA0', 'Very Cherry', 'لانكوم… لأن الحياة جميلة', '#F2D0D8', 'تسوّقي لانكوم', '#F58BA0', '#300A14', pos='center 20%')

# ================= TILES (800x800) =================
def T(name, photo, ar, en, scrim, pos='center'):
    if go(name): tile(name, PH + photo, ar, en, scrim=scrim, pos=pos)
T('tile_for_her', 'chanel/coco-mademoiselle-pearls-stilllife-1.jpg', 'لها', 'FOR HER', 'rgb(40,20,14)', 'center 35%')
T('tile_for_him', 'christian-dior/sauvage-depp-portrait-2.jpg', 'له', 'FOR HIM', 'rgb(22,18,22)', 'center 30%')
T('tile_unisex', 'tom-ford/oud-wood-stilllife-wood-1.jpg', 'للجنسين', 'UNISEX', 'rgb(18,16,14)', 'center 40%')
T('tile_niche', 'xerjoff/casamorati-1888-clouds-still-1.jpg', 'عطور النيش', 'NICHE', 'rgb(46,18,16)', 'center 35%')
T('fam_floral', 'notes/floral-roses-1.jpg', 'زهري', 'FLORAL', 'rgb(30,8,18)', 'center')
T('fam_amber', 'notes/oriental-amber-tobacco-vanilla-2.jpg', 'عنبري شرقي', 'AMBER · ORIENTAL', 'rgb(40,20,4)', 'center')
T('fam_woody', 'givenchy/gentleman-boisee-moody-stilllife-1.jpg', 'خشبي', 'WOODY', 'rgb(24,16,10)', 'center')
T('fam_fresh', 'notes/fresh-sea-water-3.jpg', 'منعش', 'FRESH · CITRUS', 'rgb(4,50,60)', 'center')
T('fam_gourmand', 'notes/gourmand-cherry-3.jpg', 'حلو · غورماند', 'GOURMAND', 'rgb(46,6,16)', 'center')
T('fam_oud', 'notes/oud-wood-1.jpg', 'عود', 'OUD', 'rgb(14,10,6)', 'center')

# ================= STRIPS (2150x600) =================
def S(name, photo, side, scrim, ink, head, sub, scol, cta, cbg, cink, kicker='', kcol=None, **k):
    if go(name): strip(name, PH + photo, side, scrim, ink, head, sub, scol, cta, cbg, cink, kicker=kicker, kcol=kcol, **k)
S('strip_gifts', 'gifts/carolina-herrera-xmas-couple-red-gifts-hero-1.jpg', 'left', 'rgb(16,26,72)', '#FFF6EC',
  'Wrapped in Luxury', 'أطقم هدايا العطور لكل مناسبة', '#E4E2F0', 'تسوّقي الهدايا', '#D8323C', '#FFFFFF',
  kicker='THE GIFT SETS', kcol=GOLD, box=(1000, 0, 1150, 600), pos='center 30%')
S('strip_budget', 'notes/floral-rose-peony-2.jpg', 'left', 'rgb(70,48,18)', '#FFF6E6',
  'Luxury for Less', 'عطور أصلية بأقل من 60,000 د.ع', '#F2E2C2', 'تسوّقي الآن', '#F6E2B6', '#46300E',
  kicker='UNDER 60,000 IQD', kcol='#F6E2B6', box=(1150, 0, 1000, 600), pos='center center')
S('strip_mists', 'mists/kayali-hair-mist-model-spray-flowing-hair-1.jpg', 'left', 'rgb(80,4,16)', '#FFF0F4',
  'Mist &amp; Glow', 'معطّرات الجسم والشعر', '#F6D2DC', 'تسوّقي الآن', '#FFF0F4', '#50040F',
  kicker='BODY &amp; HAIR MISTS', kcol='#F79AB8', box=(1100, 0, 1050, 600), pos='center 25%')
