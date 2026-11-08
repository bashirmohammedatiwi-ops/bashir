# care-rituals (طقوس العناية) — world redesign renders. Run: python3 build.py [name-filter]
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT + '/kit')
from kit import *
from concurrent.futures import ThreadPoolExecutor
W5 = ROOT + '/care-rituals'
set_out(W5 + '/out')
P = W5 + '/photos'
FILTER = sys.argv[1] if len(sys.argv) > 1 else ''

def ph(rel): return f'{P}/{rel}'

def frame(col='rgba(255,255,255,.55)', inset=30, z=40):
    """Hairline inner frame — a quiet luxury detail."""
    return f'<div class="a" style="inset:{inset}px;border:1.5px solid {col};border-radius:4px;z-index:{z};pointer-events:none"></div>'

def rule(col, side='left', top=None):
    return ''

JOBS = []
def job(name, fn, *a, **k):
    if FILTER and FILTER not in name: return
    JOBS.append((name, fn, a, k))

# ---------- shared tokens ----------
DEEP = '#10241C'         # world ink (deep spruce)
ACC = '#1F8A70'          # world accent
CTA_DARK = '#10241C'

# =====================================================================
# HERO CAROUSEL (2150x1000)
# =====================================================================
# 1 — EVOLUDERM (exclusive) : official evoluderm.com hair-mask model, pink set, text right
job('hero_evoluderm', editorial, ph('evoluderm/evoluderm_hair_mask_application_model_1920x1080.jpg'), 'right',
    'rgb(246,226,226)', '#3B1F1A',
    WM('Evoluderm', 92, '#3B1F1A', font='Mont', weight=700, ls='.01em'),
    'Made in France', '#B0574A',
    'The French<br>Hair Ritual', 'أقنعة وشامبو بحجم لتر — من فرنسا إليكِ', '#5A3A33',
    'تسوّقي إيفولوديرم', '#3B1F1A', '#FFF4EF', pos='left center', scrim_w=46, hsize=124,
    badge='الوكيل الحصري في العراق', extra=frame('rgba(59,31,26,.18)'))

# 2 — LA ROCHE-POSAY Anthelios : beach model with sunscreen, photo panel right
job('hero_lrp', editorial, ph('lrp/lrp_sun_model_hat_sunscreen-face_beach_2400x1601.jpg'), 'left',
    'rgb(236,243,248)', '#0B2E59',
    WM('LA ROCHE-POSAY', 58, '#0B2E59', font='Mont', weight=600, ls='.16em'),
    'Anthelios UVMune 400 · SPF50+', '#2C7BC0',
    'Sun, Without<br>Compromise', 'حماية عالية من شمس العراق بملمس خفيف', '#2D4664',
    'تسوّقي لاروش بوزيه', '#0B2E59', '#fff', box=(820, 0, 1330, 1000), pos='42% center', hsize=118,
    extra=frame('rgba(11,46,89,.14)'))

# 3 — CERAVE : foaming cleanser model, white studio
job('hero_cerave', editorial, ph('cerave/cerave_foaming-cleanser_model_foam_1416x1060.jpg'), 'left',
    'rgb(250,251,252)', '#0A3D78',
    WM('CeraVe', 92, '#0A5BA8', font='Mont', weight=700, ls='0'),
    'Developed with dermatologists', '#3A86C8',
    'Cleanse Like a<br>Dermatologist', 'غسول بالسيراميدات الثلاثة يحترم حاجز البشرة', '#3C5370',
    'تسوّقي سيرافي', '#0A5BA8', '#fff', box=(880, 0, 1270, 1000), pos='center center', hsize=112,
    extra=frame('rgba(10,61,120,.12)'))

# 4 — GARNIER Vitamin C : smiling model with serum, sunny yellow
job('hero_garnier', editorial, ph('garnier/garnier_vitamin_c_serum_model_smile_1920x1920.jpg'), 'left',
    'rgb(250,225,96)', '#2A2206',
    WM('GARNIER', 78, '#1F6B2C', font='Mont', weight=800, ls='.06em'),
    'Vitamin C Brightening Serum', '#9A5A00',
    'Bright Side,<br>Every Day', 'سيروم فيتامين سي لإشراقة وتوحيد اللون', '#4A3C08',
    'تسوّقي غارنييه', '#1F6B2C', '#fff', box=(930, 0, 1220, 1000), pos='center 22%', hsize=124,
    extra=frame('rgba(42,34,6,.14)'))

# 5 — L'ORÉAL PARIS Revitalift : model applying filler cream, lilac
job('hero_loreal', editorial, ph('loreal-paris/loreal_revitalift_filler_cream_model_applying_1920x1080.jpg'), 'right',
    'rgb(232,230,243)', '#211A3A',
    WM("L'ORÉAL PARIS", 58, '#211A3A', font='Mont', weight=600, ls='.16em'),
    'Revitalift Filler', '#6B5BB5',
    'Plump. Smooth.<br>Glow.', 'هيالورونيك لبشرة ممتلئة ونضرة كل يوم', '#4A4266',
    'تسوّقي لوريال باريس', '#211A3A', '#fff', box=(0, 0, 1300, 1000), pos='18% center', hsize=96,
    extra=frame('rgba(33,26,58,.14)'))

# 6 — ELVIVE Glycolic Gloss : glossy hair model, pink
job('hero_elvive', editorial, ph('elvive/elvive_glycolic_gloss_model_shiny_hair_pink_1920x864.jpg'), 'left',
    'rgb(243,214,226)', '#3A1027',
    WM("L'ORÉAL PARIS · ELVIVE", 46, '#3A1027', font='Mont', weight=600, ls='.16em'),
    'Glycolic Gloss', '#B03C78',
    'Mirror-Shine<br>Hair', 'لمعان المرآة لشعر ناعم وصحي', '#5E2A45',
    'تسوّقي إلفيف', '#3A1027', '#fff', pos='right center', scrim_w=46, hsize=128,
    extra=frame('rgba(58,16,39,.14)'))

# 7 — K-BEAUTY (Beauty of Joseon) : propolis serum + honeycomb
job('hero_kbeauty', editorial, ph('beauty-of-joseon/boj_glow_serum_propolis_honeycomb_banner_3840x1800.jpg'), 'left',
    'rgb(246,239,222)', '#3A2A0E',
    WM('K-BEAUTY ROOM', 44, '#3A2A0E', font='Jost', weight=500, ls='.34em'),
    'Beauty of Joseon · Anua · COSRX', '#A8761C',
    'Seoul Glow', 'روتين كوري لطيف لبشرة زجاجية مشرقة', '#5B4A2A',
    'تسوّقي العناية الكورية', '#3A2A0E', '#FFF6E3', pos='right center', scrim_w=44, hsize=140,
    extra=frame('rgba(58,42,14,.14)'))

# 8 — EUCERIN Anti-Pigment
job('hero_eucerin', editorial, ph('eucerin/eucerin_anti-pigment_model_curly_2400x1602.jpg'), 'left',
    'rgb(236,236,236)', '#231A1C',
    WM('Eucerin', 84, '#B01E2E', font='Play', weight=700, ls='0'),
    'Anti-Pigment · Thiamidol', '#B01E2E',
    'Even Tone,<br>Visibly', 'لتخفيف البقع الداكنة وتوحيد لون البشرة', '#4A4244',
    'تسوّقي يوسيرين', '#231A1C', '#fff', box=(760, 0, 1390, 1000), pos='60% center', hsize=122,
    extra=frame('rgba(35,26,28,.12)'))

# 9 — THE ORDINARY
job('hero_ordinary', editorial, ph('the-ordinary/the-ordinary_niacinamide-ha_droppers_plinth_2400x1173.jpg'), 'left',
    'rgb(229,229,228)', '#1C1C1C',
    WM('The Ordinary.', 70, '#1C1C1C', font='Mont', weight=500, ls='-.01em'),
    'Clinical formulations with integrity', '#6B6B6B',
    'Clinical.<br>Honest.', 'تركيبات علمية واضحة بأسعار عادلة', '#4A4A4A',
    'تسوّقي ذا أورديناري', '#1C1C1C', '#fff', pos='right center', scrim_w=44, hsize=128,
    extra=frame('rgba(28,28,28,.12)'))

# =====================================================================
# ROOMS (SECTION_GROUP banners 2150x1000, bannerAspect 2.15)
# =====================================================================
job('room_evoluderm', editorial, ph('evoluderm/evoluderm_argan_divin_marrakech_terrace_1900x1100.jpg'), 'left',
    'rgb(255,241,226)', '#3B1F1A',
    WM('Evoluderm', 92, '#3B1F1A', font='Mont', weight=700, ls='.01em'),
    'Made in France', '#B0574A',
    'Le Rituel<br>Evoluderm', 'أكثر من 140 منتجاً للشعر والجسم والوجه', '#5A3A33',
    'اكتشفي التشكيلة', '#B5452C', '#fff', box=(880, 0, 1270, 1000), pos='center 60%', hsize=124,
    badge='الوكيل الحصري في العراق', extra=frame('rgba(59,31,26,.16)'))

job('room_face', editorial, ph('revuele/revuele_model_serum_dropper_smile_1800x1200.jpg'), 'left',
    'rgb(251,242,238)', '#4A1E12',
    WM('FACE CARE', 44, '#8E3B27', font='Jost', weight=500, ls='.34em'),
    'Cleanse · Treat · Moisturise · Protect', '#B4705C',
    'Skin,<br>Simplified', 'روتين بشرة صحية بخطوات واضحة', '#6A3A2C',
    'تسوّقي العناية بالوجه', '#8E3B27', '#fff', box=(860, 0, 1290, 1000), pos='62% center', hsize=128,
    extra=frame('rgba(142,59,39,.16)'))

job('room_hair', editorial, ph('kerastase/kerastase_genesis_model_flowing_hair_red_landscape_1920x1080.jpg'), 'left',
    'rgb(255,255,255)', '#2A1838',
    WM('HAIR CARE', 44, '#55306B', font='Jost', weight=500, ls='.34em'),
    'Kérastase · Elvive · Pantene', '#8B62A3',
    'Hair,<br>Elevated', 'عناية بمستوى الصالون لشعر صحي', '#55306B',
    'تسوّقي العناية بالشعر', '#55306B', '#fff', box=(900, 0, 1250, 1000), pos='72% center', hsize=128,
    extra=frame('rgba(85,48,107,.14)'))

job('room_body', editorial, ph('nivea/nivea_body_lotion_on_leg_cosy_2806x3508.jpg'), 'left',
    'rgb(250,244,236)', '#3A2414',
    WM('BODY CARE', 44, '#6E4527', font='Jost', weight=500, ls='.34em'),
    'Lotions · Butters · Oils · Scrubs', '#A37A57',
    'Soft-Skin<br>Rituals', 'ترطيب يدوم ونعومة تشعرين بها', '#6E4527',
    'تسوّقي العناية بالجسم', '#6E4527', '#fff', box=(960, 0, 1190, 1000), pos='center 55%', hsize=128,
    extra=frame('rgba(110,69,39,.16)'))

job('room_sun', editorial, ph('vichy/vichy_capital-soleil-uv-aqua_model_in-sea_1920x1920.jpg'), 'left',
    'rgb(252,246,230)', '#3D2604',
    WM('SUN CARE · SPF 50+', 44, '#8A4F06', font='Jost', weight=500, ls='.30em'),
    'La Roche-Posay · Vichy · Bioderma', '#B07A2A',
    'Sun Care,<br>All Year', 'حماية يومية عالية من شمس العراق', '#7A4D10',
    'تسوّقي واقي الشمس', '#8A4F06', '#fff', box=(900, 0, 1250, 1000), pos='center 28%', hsize=128,
    extra=frame('rgba(138,79,6,.16)'))

job('room_korean', editorial, ph('beauty-of-joseon/boj_green_plum_cleanser_mint_foam_banner_3840x1800.jpg'), 'left',
    'rgb(226,236,232)', '#123D2E',
    WM('K-BEAUTY', 44, '#22604A', font='Jost', weight=500, ls='.34em'),
    'Anua · COSRX · Beauty of Joseon · medicube', '#4E8A72',
    'The Korean<br>Care Room', 'خطوات لطيفة لبشرة زجاجية مشرقة', '#2E5A49',
    'تسوّقي العناية الكورية', '#22604A', '#fff', pos='right center', scrim_w=46, hsize=124,
    extra=frame('rgba(34,96,74,.16)'))

job('room_derma', editorial, ph('avene/avene_derm-exam_model_skin-closeup_2080x1200.jpg'), 'right',
    'rgb(240,245,249)', '#14304A',
    WM('DERMO-COSMETICS', 42, '#24496B', font='Jost', weight=500, ls='.30em'),
    'La Roche-Posay · CeraVe · Avène', '#5A7FA3',
    'Dermatologist<br>Approved', 'عناية طبية لطيفة للبشرة الحساسة', '#24496B',
    'تسوّقي العناية الطبية', '#24496B', '#fff', pos='left center', scrim_w=52, hsize=112,
    extra=frame('rgba(36,73,107,.16)'))

job('room_garnier', editorial, ph('garnier/garnier_micellar_water_pink_splash_banner_1872x920.jpg'), 'right',
    'rgb(250,226,238)', '#3A0F26',
    WM('GARNIER', 78, '#1F6B2C', font='Mont', weight=800, ls='.06em'),
    'Micellar Cleansing Water', '#C2407E',
    'Clean Skin,<br>One Swipe', 'ماء ميسيلار ينظّف ويزيل المكياج بلطف', '#5E2442',
    'تسوّقي غارنييه', '#1F6B2C', '#fff', pos='left center', scrim_w=46, hsize=124,
    extra=frame('rgba(58,15,38,.14)'))

job('room_elvive', editorial, ph('elvive/elvive_model_glossy_brunette_waves_amber_1920x864.jpg'), 'right',
    'rgb(214,158,96)', '#2A1405',
    WM("L'ORÉAL PARIS · ELVIVE", 46, '#2A1405', font='Mont', weight=600, ls='.16em'),
    'Extraordinary Oil · Bond Repair', '#6B3A12',
    'Glossy Waves', 'زيوت وعلاجات تعيد للشعر نعومته ولمعانه', '#4A2A10',
    'تسوّقي إلفيف', '#2A1405', '#FBEBD8', pos='left center', scrim_w=46, hsize=128,
    extra=frame('rgba(42,20,5,.18)'))

job('room_revuele', editorial, ph('revuele/revuele_exosome_green_stilllife_glass_spheres_1920x1080.jpg'), 'left',
    'rgb(18,96,72)', '#F2FBF6',
    WM('REVUELE', 64, '#F2FBF6', font='Mont', weight=700, ls='.22em'),
    'Exosome · PDRN · Ceramide', '#9FE0C4',
    'Science of<br>Renewal', 'سيرومات متطورة بأسعار في المتناول', '#D6F0E4',
    'تسوّقي ريفويل', '#F2FBF6', '#0F4D3A', pos='right center', scrim_w=44, hsize=124,
    extra=frame('rgba(242,251,246,.22)'))

# =====================================================================
# SPOTLIGHT CARDS (1080x1350)
# =====================================================================
C = [
 ('card_evoluderm', 'evoluderm/evoluderm_keratine_liquide_long_hair_2304x2304.jpg', 'rgb(70,40,28)', '#FFF4EF', WM('Evoluderm', 64, '#FFF4EF', font='Mont', weight=700, ls='.01em'), 'Exclusive in Iraq', '#F2C2A8', 'Liquid Keratin', 'لمعان ونعومة من فرنسا', '#F7DCCF', 'تسوّقي الآن', '#FFF4EF', '#46281C', 'center 30%'),
 ('card_lrp', 'lrp/lrp_sun_model_hat_sunscreen-face_beach_2400x1601.jpg', 'rgb(12,46,86)', '#fff', WM('LA ROCHE-POSAY', 40, '#fff', font='Mont', weight=600, ls='.16em'), 'Anthelios SPF50+', '#9CCBF2', 'Sun Shield', 'حماية يومية لكل أنواع البشرة', '#D3E5F5', 'تسوّقي الآن', '#fff', '#0C2E56', '45% center'),
 ('card_garnier', 'garnier/garnier_vitamin_c_serum_dropper_stilllife_1920x1569.jpg', 'rgb(64,52,6)', '#fff', WM('GARNIER', 56, '#fff', font='Mont', weight=800, ls='.06em'), 'Vitamin C', '#FFE07A', 'Daily Radiance', 'إشراقة فيتامين سي كل يوم', '#F5EBC2', 'تسوّقي الآن', '#FFE07A', '#2A2206', '60% 20%'),
 ('card_boj', 'beauty-of-joseon/boj_glow_serum_trio_stilllife_portrait_2160x3000.jpg', 'rgb(74,52,22)', '#fff', WM('BEAUTY OF JOSEON', 38, '#fff', font='Jost', weight=500, ls='.22em'), 'Glow Serum · Propolis', '#F2CF8A', 'Honey Glow', 'سيروم البروبوليس لإشراقة كورية', '#F2E4CC', 'تسوّقي الآن', '#fff', '#4A3416', 'center 30%'),
 ('card_anua', 'anua/anua_retinol_line_lilac_stilllife_1600x1800.jpg', 'rgb(58,44,96)', '#fff', WM('ANUA', 60, '#fff', font='Jost', weight=500, ls='.32em'), 'K-Beauty Bestseller', '#CDBDF5', 'Gentle Renewal', 'تجديد لطيف بخطوات كورية', '#E2DAF7', 'تسوّقي الآن', '#fff', '#3A2C60', 'center 20%'),
 ('card_nivea', 'nivea/nivea_q10_serum_in_hand_sky_2807x3508.jpg', 'rgb(16,44,98)', '#fff', WM('NIVEA', 60, '#fff', font='Mont', weight=800, ls='.08em'), 'Q10 Anti-Age', '#A9C8F5', 'Firm & Fresh', 'عناية ألمانية موثوقة منذ أجيال', '#D3E2F8', 'تسوّقي الآن', '#fff', '#102C62', 'center 25%'),
 ('card_kerastase', 'kerastase/kerastase_chronologiste_oil_model_hair_1547x1920.jpg', 'rgb(30,20,16)', '#fff', WM('KÉRASTASE', 52, '#fff', font='Cinzel', weight=600, ls='.18em'), 'Paris · Salon Care', '#D9B98A', 'Hair Couture', 'عناية الصالون الفاخرة في بيتكِ', '#E8DCCB', 'تسوّقي الآن', '#D9B98A', '#1E1410', 'center 25%'),
 ('card_ordinary', 'the-ordinary/the-ordinary_glycolic-toner_model_pour-cotton_1600x1600.jpg', 'rgb(40,40,40)', '#fff', WM('The Ordinary.', 50, '#fff', font='Mont', weight=500, ls='0'), 'Glycolic Acid 7%', '#C9C9C9', 'Smooth Reset', 'تقشير لطيف لملمس أنعم', '#E2E2E2', 'تسوّقي الآن', '#fff', '#282828', '62% center'),
 ('card_eucerin', 'eucerin/eucerin_cream-dab_cheek_model_2000x2000.jpg', 'rgb(120,20,32)', '#fff', WM('Eucerin', 60, '#fff', font='Play', weight=700, ls='0'), 'Dermatological Skincare', '#F5B5BC', 'Skin Science', 'علم البشرة لنتائج ملموسة', '#F7D6DA', 'تسوّقي الآن', '#fff', '#78141F', '30% center'),
 ('card_vichy', 'vichy/vichy_capital-soleil_model_sunlit-skin_portrait_1536x1920.jpg', 'rgb(44,70,98)', '#fff', WM('VICHY', 58, '#fff', font='Mont', weight=700, ls='.24em'), 'Capital Soleil', '#BFD9F0', 'Sunlit Skin', 'حماية من الشمس وعناية فرنسية', '#DCE9F5', 'تسوّقي الآن', '#fff', '#2C4662', 'center 20%'),
 ('card_elvive', 'elvive/elvive_glycolic_gloss_shampoo_light_beam_1536x1920.jpg', 'rgb(96,40,70)', '#fff', WM('ELVIVE', 56, '#fff', font='Mont', weight=700, ls='.2em'), "L'Oréal Paris", '#F7C2DD', 'Glass Hair', 'شامبو اللمعان بحمض الغلايكوليك', '#F5DCE8', 'تسوّقي الآن', '#fff', '#602846', 'center 25%'),
 ('card_lierac', 'sun/lierac_sunissime_model_selftan_serum_sky_1200x1200.jpg', 'rgb(40,74,104)', '#fff', WM('LIERAC', 56, '#fff', font='Mont', weight=600, ls='.3em'), 'Paris · Sunissime', '#BCD9EE', 'Golden Hour', 'إشراقة مشمسة بلمسة باريسية', '#DCEAF4', 'تسوّقي الآن', '#fff', '#284A68', '30% center'),
]
for (n, f, scr, ink, w, k, kc, h, s, sc, cta, cb, ci, pos) in C:
    job(n, card, ph(f), scr, ink, w, k, kc, h, s, sc, cta, cb, ci, pos=pos, hsize=96)

# =====================================================================
# TILES (800x800)
# =====================================================================
T = [
 # category tiles (Shop by need)
 ('tile_face', 'revuele/revuele_model_cream_swipe_shoulder_1800x1200.jpg', 'العناية بالوجه', 'Face', 'rgb(60,30,22)', '60% center'),
 ('tile_hair', 'pantene/pantene_long_glossy_brunette_back_1020x1020.jpg', 'العناية بالشعر', 'Hair', 'rgb(40,28,24)', 'center'),
 ('tile_body', 'evoluderm/evoluderm_body_cream_shoulder_model_1920x1080.jpg', 'العناية بالجسم', 'Body', 'rgb(70,40,26)', '40% center'),
 ('tile_sun', 'sun/lierac_sunissime_oil_on_tanned_leg_2000x2000.jpg', 'الوقاية من الشمس', 'Sun', 'rgb(70,34,10)', 'center'),
 ('tile_derma', 'avene/avene_derm-exam_model_skin-closeup_2080x1200.jpg', 'العناية الطبية', 'Derma', 'rgb(28,44,62)', '22% center'),
 ('tile_korean', 'beauty-of-joseon/boj_relief_sun_two_models_cheek_swatch_1600x1600.jpg', 'العناية الكورية', 'K-Beauty', 'rgb(40,46,40)', 'center 30%'),
 ('tile_hands', 'hands-feet/clarins_hand_cream_dab_on_hand_back_2000x2000.jpg', 'العناية باليدين', 'Hands', 'rgb(60,40,40)', 'center'),
 ('tile_feet', 'hands-feet/drscholls_bare_feet_in_sea_waves_1720x2150.jpg', 'العناية بالقدم', 'Feet', 'rgb(20,36,48)', 'center 40%'),
 # routine tiles
 ('tile_r_cleanse', 'nivea/nivea_face_water_splash_model_sky_2807x3508.jpg', 'التنظيف', 'Step 1 · Cleanse', 'rgb(16,40,70)', 'center 45%'),
 ('tile_r_treat', 'nivea/nivea_serum_drop_texture_aqua_2807x3508.jpg', 'العلاج', 'Step 2 · Treat', 'rgb(14,60,76)', 'center 30%'),
 ('tile_r_moist', 'derma-misc/filorga_time_filler_cream_swipe_texture_1400x1400.jpg', 'الترطيب', 'Step 3 · Moisturise', 'rgb(70,58,52)', 'center'),
 ('tile_r_protect', 'sun/clarins_sunscreen_stroke_on_shoulder_2000x2000.jpg', 'الحماية', 'Step 4 · Protect', 'rgb(80,40,20)', 'center'),
 # concern tiles
 ('tile_c_acne', 'bioderma/bioderma_sebium_foam_face-closeup_1024x1024.jpg', 'حب الشباب', 'Acne & Blemishes', 'rgb(40,50,44)', 'center'),
 ('tile_c_spots', 'garnier/garnier_vitamin_c_serum_dropper_stilllife_1920x1569.jpg', 'البقع الداكنة', 'Dark Spots', 'rgb(90,50,0)', 'center'),
 ('tile_c_dry', 'neutrogena/neutrogena_hydroboost_watergel_jars_on_water_2400x2400.jpg', 'الجفاف', 'Dryness', 'rgb(16,46,80)', '60% center'),
 ('tile_c_age', 'derma-misc/clarins_double_serum_mature_model_smile_2000x2000.jpg', 'علامات التقدّم بالعمر', 'Ageing', 'rgb(50,40,40)', '60% center'),
 ('tile_c_hairfall', 'kerastase/kerastase_genesis_ingredient_tubes_serum_drops_1080x1920.jpg', 'تساقط الشعر', 'Hair Fall', 'rgb(70,20,20)', 'center 45%'),
]
for (n, f, ar, en, scr, pos) in T:
    job(n, tile, ph(f), ar, en, scrim=scr, pos=pos)

# =====================================================================
# STRIPS (2150x600)
# =====================================================================
job('strip_sun', strip, ph('lrp/lrp_anthelios-uvmune400_waterdrops_strip_1920x585.jpg'), 'left', 'rgb(16,44,92)', '#fff',
    'The Sun-Care Edit', 'حماية عالية لكل أنواع البشرة', '#CFE0F5', 'تسوّقي واقي الشمس', '#fff', '#10305C',
    kicker='La Roche-Posay · Vichy · Bioderma', kcol='#8FC0F0', pos='18% center', box=(1060, 0, 1090, 600), hsize=98)
job('strip_budget', strip, ph('garnier/garnier_micellar_water_range_rainbow_light_1920x1070.jpg'), 'left', 'rgb(244,246,248)', DEEP,
    'Care Under 15,000 IQD', 'عناية أصلية بأسعار لطيفة', '#3E5A50', 'تسوّقي الآن', ACC, '#fff',
    kicker='Smart picks · 100% authentic', kcol=ACC, pos='right 40%', box=(1120, 0, 1030, 600), hsize=96)
job('strip_delivery', strip, ph('garnier/garnier_hyaluronic_gel_water_texture_1920x791.jpg'), 'left', 'rgb(14,64,58)', '#F2FBF8',
    '100% Authentic Care', 'توصيل مجاني فوق 50,000 د.ع • الدفع عند الاستلام', '#CDEDE3', 'تسوّقي الآن', '#F2FBF8', '#0E403A',
    kicker='Delivered to every Iraqi governorate', kcol='#8FE0C8', pos='right center', hsize=96)

if __name__ == '__main__':
    def run(j):
        n, fn, a, k = j
        fn(n, *a, **k); return n
    with ThreadPoolExecutor(6) as ex:
        for n in ex.map(run, JOBS): print('ok', n)
