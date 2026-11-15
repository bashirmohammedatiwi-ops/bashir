# care-rituals — weekly offer ads (2026-11-15). Run: python3 build.py [name-filter]
# Clean clinical-luxe: soft studio scrim + official campaign photo + Bodoni % numeral with hairline rule.
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE + '/_tools')
from kit import *
from concurrent.futures import ThreadPoolExecutor
set_out(HERE + '/out')
P = HERE + '/photos'
FILTER = sys.argv[1] if len(sys.argv) > 1 else ''
def ph(rel): return f'{P}/{rel}'

def frame(col, inset=30):
    return f'<div class="a" style="inset:{inset}px;border:1.5px solid {col};border-radius:4px;z-index:40;pointer-events:none"></div>'

def pct_block(num, upto, ink, acc, size, off_size, label=''):
    """Big Bodoni numeral + italic 'off'; optional 'UP TO' small caps above, label under 'off'."""
    top = f'<div class="kick" style="font-size:{int(off_size*.30)}px;letter-spacing:.42em;color:{acc};margin-bottom:{int(size*.10)}px">Up to</div>' if upto else ''
    lab = f'<div class="kick" style="font-size:{int(off_size*.27)}px;letter-spacing:.34em;color:{acc};margin-top:{int(off_size*.16)}px">{label}</div>' if label else ''
    return f'''{top}<div style="display:flex;align-items:flex-end;gap:{int(size*.07)}px;direction:ltr">
  <div class="lat" style="font-family:Bodoni;font-weight:500;font-size:{size}px;line-height:.78;color:{ink};letter-spacing:-.02em">{num}<span style="font-size:.52em;vertical-align:.70em;margin-left:.04em">%</span></div>
  <div style="display:flex;flex-direction:column;align-items:flex-start;padding-bottom:{int(size*.035)}px">
    <div class="lat" style="font-family:Bodoni;font-style:italic;font-weight:400;font-size:{off_size}px;line-height:.9;color:{ink}">off</div>{lab}</div>
</div>'''

def offer_hero(name, photo, scrim, ink, acc, word, kicker, num, upto, label, headline, sub, scol, cta, cbg, cink,
               box=None, pos='center', scrim_w=48, extra='', W=2150, H=1000):
    clr = scrim.replace('rgb(', 'rgba(').replace(')', ',0)')
    if box:
        x, y, w, h = box; a0, a1 = x / W * 100, (x + 380) / W * 100
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient(90deg,{scrim} 0%,{scrim} {a0:.1f}%,{clr} {a1:.1f}%)"></div>'
        ph_ = f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:url(\'file://{photo}\') {pos}/cover no-repeat;z-index:2"></div>'
    else:
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient(90deg,{scrim} 0%,{scrim} {scrim_w - 20}%,{clr} {scrim_w + 8}%)"></div>'
        ph_ = f'<div class="a" style="inset:0;background:url(\'file://{photo}\') {pos}/cover no-repeat;z-index:2"></div>'
    body = f'''
<div class="a" style="inset:0;background:{scrim}"></div>{ph_}{scr}{extra}
<div class="a" style="left:120px;top:0;bottom:0;width:880px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink}">
  <div>{word}</div>
  <div class="kick" style="font-size:24px;color:{acc};margin-top:20px">{kicker}</div>
  <div style="margin-top:40px">{pct_block(num, upto, ink, acc, 270, 96, label)}</div>
  <div style="width:560px;height:1.5px;background:{ink};opacity:.55;margin-top:36px"></div>
  <div class="lat" style="font-family:Play;font-style:italic;font-weight:500;font-size:66px;line-height:1.05;margin-top:26px">{headline}</div>
  <div class="ar" style="font-family:Tajawal;font-weight:500;font-size:41px;color:{scol};margin-top:16px;white-space:nowrap">{sub}</div>
  <div style="margin-top:36px;direction:rtl"><span class="cta" style="font-size:39px;padding:20px 50px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}'''
    return render(name, W, H, body)

def offer_card(name, photo, panel, ink, acc, word, kicker, num, upto, label, sub, scol, cta, cbg, cink,
               pos='center', ph_h=860, fade=260, extra='', size='cover', W=1080, H=1350):
    clr = panel.replace('rgb(', 'rgba(').replace(')', ',0)')
    body = f'''
<div class="a" style="inset:0;background:{panel}"></div>
<div class="a" style="left:0;top:0;width:{W}px;height:{ph_h}px;background:url('file://{photo}') {pos}/{size} no-repeat;z-index:2"></div>
<div class="a" style="left:0;width:{W}px;top:{ph_h - fade}px;height:{fade + 2}px;z-index:3;background:linear-gradient(180deg,{clr} 0%,{panel} 100%)"></div>{extra}
<div class="a" style="left:76px;right:76px;bottom:74px;display:flex;flex-direction:column;align-items:flex-start;z-index:50;color:{ink}">
  <div>{word}</div>
  <div class="kick" style="font-size:20px;color:{acc};margin-top:14px">{kicker}</div>
  <div style="margin-top:30px">{pct_block(num, upto, ink, acc, 210, 76, label)}</div>
  <div style="width:420px;height:1.5px;background:{ink};opacity:.5;margin-top:28px"></div>
  <div class="ar" style="font-family:Tajawal;font-weight:500;font-size:37px;color:{scol};margin-top:22px;white-space:nowrap">{sub}</div>
  <div style="margin-top:26px;direction:rtl"><span class="cta" style="font-size:33px;padding:16px 42px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}'''
    return render(name, W, H, body)

JOBS = []
def job(name, fn, *a, **k):
    if FILTER and FILTER not in name: return
    JOBS.append((name, fn, a, k))

CTA = 'تسوّقي العرض'

# ---------- 1 CENTELLA (SKIN1004 Madagascar Centella) — up to 20% ----------
C_INK, C_ACC = '#33281C', '#9A7348'
C_WM = '<div style="display:flex;flex-direction:column;align-items:flex-start">' + \
       WM('MADAGASCAR', 20, C_INK, font='Mont', weight=500, ls='.52em') + \
       WM('CENTELLA', 70, C_INK, font='Mont', weight=700, ls='.16em', extra='line-height:1;margin-top:8px') + '</div>'
job('offer_hero_centella', offer_hero, ph('centella/skin1004_centella_light-cleansing-oil_model_beige_2880x2433.jpg'),
    'rgb(216,207,196)', C_INK, C_ACC, C_WM, 'SKIN1004 · Limited-time offer', '20', True, '',
    'Calm, Clean, Centella', 'خصم حتى ٢٠٪ على منتجات سنتيلا مدغشقر', '#5A4A38',
    CTA, C_INK, '#F6EFE6', box=(820, 0, 1330, 1000), pos='center 75%', extra=frame('rgba(51,40,28,.16)'))
job('offer_card_centella', offer_card, ph('centella/skin1004_centella_tone-brightening-gel-foam_model_white_2880x2433.jpg'),
    'rgb(224,231,232)', '#1F2E33', '#5E7A80',
    '<div style="display:flex;flex-direction:column;align-items:flex-start">' + WM('MADAGASCAR', 16, '#1F2E33', font='Mont', weight=500, ls='.52em') +
    WM('CENTELLA', 54, '#1F2E33', font='Mont', weight=700, ls='.16em', extra='line-height:1;margin-top:6px') + '</div>',
    'SKIN1004 · Offer of the week', '20', True, '',
    'خصم حتى ٢٠٪ على سنتيلا مدغشقر', '#3E5257', CTA, '#1F2E33', '#fff', pos='right top', ph_h=760, size='auto 760px', fade=200,
    extra='<div class="a" style="left:0;top:0;width:330px;height:760px;z-index:3;background:linear-gradient(90deg,rgb(224,231,232) 0%,rgb(224,231,232) 55%,rgba(224,231,232,0) 100%)"></div>')

# ---------- 2 AXIS-Y — 20% on everything ----------
A_INK, A_ACC = '#123F2C', '#1E8A55'
A_WM = WM('AXIS-Y', 66, A_INK, font='Jost', weight=400, ls='.42em')
job('offer_hero_axisy', offer_hero, ph('axis-y/axisy_vegan-collagen-eye-serum_model_1200x1500.jpg'),
    'rgb(244,248,245)', A_INK, A_ACC, A_WM, 'Climate-inspired K-beauty · Offer', '20', False, 'EVERYTHING',
    'Glow, Gently Inspired', 'خصم ٢٠٪ على كل منتجات أكسيس واي', '#3F5E50',
    CTA, A_INK, '#fff', box=(1000, 0, 1150, 1000), pos='center 40%', extra=frame('rgba(18,63,44,.14)'))
job('offer_card_axisy', offer_card, ph('axis-y/axisy_artichoke-ampoule_stilllife_1200x1500.jpg'),
    'rgb(232,226,218)', A_INK, A_ACC, WM('AXIS-Y', 50, A_INK, font='Jost', weight=400, ls='.42em'),
    'Offer of the week', '20', False, 'EVERYTHING',
    'خصم ٢٠٪ على كل منتجات أكسيس واي', '#3F5E50', CTA, A_INK, '#fff', pos='center 74%', ph_h=840, fade=200)

# ---------- 3 EUCERIN — up to 15% ----------
E_INK, E_RED = '#231A1C', '#B01E2E'
job('offer_hero_eucerin', offer_hero, ph('eucerin/eucerin_model_white-shirt_smile_3508x2339.jpg'),
    'rgb(234,234,234)', E_INK, E_RED, WM('Eucerin', 84, E_RED, font='Play', weight=700, ls='0'),
    'Dermatological skincare · Offer', '15', True, '',
    'Proven Skin Science', 'خصم حتى ١٥٪ على منتجات يوسيرين', '#4A4244',
    CTA, E_INK, '#fff', box=(720, 0, 1430, 1000), pos='center 30%', extra=frame('rgba(35,26,28,.12)'))
job('offer_card_eucerin', offer_card, ph('eucerin/eucerin_anti-pigment-serum_in-hand_pink_1146x1710.jpg'),
    'rgb(238,217,214)', E_INK, E_RED, WM('Eucerin', 64, E_RED, font='Play', weight=700, ls='0'),
    'Anti-Pigment · Offer of the week', '15', True, '',
    'خصم حتى ١٥٪ على يوسيرين', '#5A3E40', CTA, E_RED, '#fff', pos='center 38%', ph_h=730, fade=300)

if __name__ == '__main__':
    def run(j):
        n, fn, a, k = j; fn(n, *a, **k); return n
    with ThreadPoolExecutor(6) as ex:
        for n in ex.map(run, JOBS): print('ok', n)
