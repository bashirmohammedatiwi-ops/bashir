# Beauty Spell — weekly OFFER ads (2026-11-15). Extends ../../beauty-spell/bs.py (which imports ../kit/kit.py).
# Usage: python3 offers.py [heroes|cards|all] [name-filter]
import os, sys, json, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__)); W5 = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, W5 + '/kit'); sys.path.insert(0, W5 + '/beauty-spell')
import kit; kit.set_out(HERE + '/out')
from bs import rgba, photo_div, frame, cta, ghost, render, GRAIN, WM, wm_huda, wm_deborah, wm_essence, wm_artdeco, wm_grigi, wm_rybella

PH = HERE + '/photos'
P = lambda p: f'{PH}/{p}'
EXCL = 'الوكيل الحصري في العراق'
CTA = 'تسوّقي العرض'

def numeral(pct, ink, accent, size=300, upto=False, tail='OFF EVERYTHING', tail_col=None):
    """Big Bodoni % numeral. upto -> small-caps 'UP TO' line above the figure (reads: UP TO 50% OFF)."""
    tc = tail_col or accent
    up = (f'<div class="kick" style="font-size:{int(size*.1)}px;letter-spacing:.5em;color:{accent};margin:0 0 {int(size*.07)}px {int(size*.02)}px">UP&nbsp;TO</div>'
          if upto else '')
    return f'''<div class="lat" style="display:flex;flex-direction:column;align-items:flex-start;color:{ink}">{up}<div style="display:flex;align-items:flex-start">
  <div style="font-family:Bodoni;font-weight:500;font-size:{size}px;line-height:.78;letter-spacing:-.035em;font-variation-settings:'opsz' 9">{pct}</div>
  <div style="display:flex;flex-direction:column;align-items:flex-start;margin-left:{int(size*.04)}px;padding-top:{int(size*.035)}px">
    <div style="font-family:Bodoni;font-weight:500;font-size:{int(size*.42)}px;line-height:.8;font-variation-settings:'opsz' 9">%</div>
    <div style="width:{int(size*.3)}px;height:1.6px;background:{accent};margin:{int(size*.06)}px 0 {int(size*.05)}px"></div>
    <div class="kick" style="font-size:{int(size*.085)}px;letter-spacing:.36em;color:{tc};line-height:1.5">{tail.replace(' ', '<br>')}</div>
  </div></div></div>'''

def offer_hero(name, photo, side, bg, ink, word, accent, pct, head, sub, cbg, cink, upto=False, tail='OFF EVERYTHING',
               pos='center', fit='cover', box=None, blend=380, badge=None, frame_col=None, nsize=300, hsize=78,
               kicker='LIMITED TIME · OFFER', extra='', photo_extra='', W=2150, H=1000):
    """Offer hero: campaign photo panel (box) blended into bg; text column with wordmark, rule+kicker, big % numeral,
    English italic headline, Arabic sub, CTA + optional exclusive badge."""
    deg = '90deg' if side == 'left' else '270deg'
    if box:
        x, y, w, h = box; edge = x if side == 'left' else W - (x + w)
        a0, a1 = edge / W * 100, (edge + blend) / W * 100
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{bg} 0%,{bg} {a0:.1f}%,{rgba(bg,0)} {a1:.1f}%)"></div>'
    else:
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{bg} 0%,{rgba(bg,.96)} 30%,{rgba(bg,0)} 52%)"></div>'
    ps = 'left:128px' if side == 'left' else 'right:128px'
    body = f"""
<div class="a" style="inset:0;background:{bg}"></div>{photo_div(photo, box, pos, fit, extra=photo_extra)}{scr}{extra}{frame(frame_col) if frame_col else ''}
<div class="a" style="{ps};top:0;bottom:0;width:900px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  <div>{word}</div>
  <div style="display:flex;align-items:center;gap:22px;margin:30px 0 40px"><div style="width:84px;height:2px;background:{accent}"></div>
    <div class="kick" style="font-size:23px;letter-spacing:.46em;color:{accent}">{kicker}</div></div>
  {numeral(pct, ink, accent, nsize, upto, tail)}
  <div style="font-family:Bodoni;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1;margin-top:34px;white-space:nowrap">{head}</div>
  <div class="ar" style="font-family:Plex;font-weight:500;font-size:42px;color:{rgba(ink,.8)};margin-top:20px;white-space:nowrap">{sub}</div>
  <div style="margin-top:38px;display:flex;gap:18px;align-items:center;direction:rtl">{cta(CTA, cbg, cink)}{ghost(badge, ink) if badge else ''}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def offer_card(name, photo, scrim, ink, word, accent, pct, head, sub, cbg, cink, upto=False, tail='OFF EVERYTHING',
               pos='center 25%', fit='cover', fade=(30, 52), nsize=210, hsize=52, frame_col='rgba(255,255,255,.55)',
               kicker='LIMITED TIME', photo_extra='', extra='', W=1080, H=1350):
    """Portrait 4:5 offer card: photo fills the top ~62%; compact foot: brand + kicker, hairline,
    [big numeral | 2-line italic headline + Arabic], CTA. head uses <br> for its line break."""
    body = f"""
<div class="a" style="inset:0;background:{scrim}"></div>{photo_div(photo, None, pos, fit, extra=photo_extra)}{extra}
<div class="a" style="inset:0;z-index:3;background:linear-gradient(0deg,{scrim} 0%,{rgba(scrim,.96)} {fade[0]}%,{rgba(scrim,0)} {fade[1]}%)"></div>
{frame(frame_col, 30)}
<div class="a" style="left:76px;right:72px;bottom:80px;z-index:50;color:{ink};text-align:left">
  <div style="display:flex;align-items:flex-end;justify-content:space-between">
    <div>{word}</div>
    <div class="kick" style="font-size:18px;letter-spacing:.44em;color:{accent};margin-bottom:6px">{kicker}</div></div>
  <div style="width:100%;height:1.5px;background:{rgba(ink,.4)};margin:22px 0 30px"></div>
  <div style="display:flex;align-items:flex-end;gap:44px">
    {numeral(pct, ink, accent, nsize, upto, tail)}
    <div style="padding-bottom:2px">
      <div style="font-family:Bodoni;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.04;white-space:nowrap">{head}</div>
      <div class="ar" style="font-family:Plex;font-weight:500;font-size:29px;color:{rgba(ink,.85)};margin-top:14px;white-space:nowrap;text-align:left">{sub}</div>
    </div></div>
  <div style="margin-top:30px;direction:rtl;text-align:right">{cta(CTA, cbg, cink, 32, '15px 40px')}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

# ======================= BRANDS (carousel order) =======================
# key, Arabic name, brandId, pct, upto
BRANDS = [
    ('rybella', 'ريبيلا', '1b83af76-aa9e-4808-b3a8-85ded4e88675', 40, False),
    ('grigi', 'كريجي', '0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4', 50, False),
    ('huda', 'هدى بيوتي', 'cae7565f-0e4c-4eec-b75c-84a210be0dfc', 25, True),
    ('artdeco', 'آرتديكو', '035854fa-41b8-4e06-a7ad-19b09cfea003', 50, False),
    ('essence', 'إيسنس', '9c5204f9-10be-484a-8e65-23b3ad53bb3c', 50, True),
    ('deborah', 'ديبورا ميلانو', '03bf1748-150d-47b0-9ffc-8aa13f1142d0', 50, True),
]

def heroes():
    yield 'oh1_rybella', lambda n: offer_hero(n, P('rybella/rybella-makeup-make-up-category-header-1920x1000-1.jpg'), 'left', '#8cc8da', '#0f2236',
        wm_rybella('#0f2236', 54), '#d4157a', '40', 'Italian colour, for less.', 'خصم ٤٠٪ على كل منتجات ريبيلا', '#d4157a', '#fff',
        box=(230, 0, 1920, 1000), blend=420, pos='center', badge=EXCL, frame_col='rgba(255,255,255,.4)', hsize=74)
    yield 'oh2_grigi', lambda n: offer_hero(n, P('grigi/grigi_aw24_model-berry-lips_port.jpg'), 'left', '#1a0a10', '#fbeef1',
        wm_grigi('#fbeef1', 60), '#e48aa2', '50', 'Greek glamour, half price.', 'خصم ٥٠٪ على كل منتجات كريجي', '#fbeef1', '#6a0f2a',
        box=(1330, 0, 820, 1000), blend=200, pos='center 30%', badge=EXCL, frame_col='rgba(251,238,241,.22)',
        extra=f'<div class="a" style="left:820px;top:0;width:700px;height:1000px;z-index:4;background:url(\'file://{P("grigi/grigi_aw24_texture-berry-splash_port.jpg")}\') center/cover;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 38%,#000 84%,transparent 100%)"></div><div class="a" style="left:1290px;top:0;width:220px;height:1000px;z-index:4;background:linear-gradient(90deg,rgba(80,12,34,.0) 0%,rgba(80,12,34,.55) 45%,rgba(80,12,34,0) 100%)"></div>',
        photo_extra='filter:brightness(.97)')
    yield 'oh3_huda', lambda n: offer_hero(n, P('huda/huda_snatchgo_model-compact-pink_port.webp'), 'left', '#f6dbe6', '#2a0f1e', wm_huda('#2a0f1e', 40),
        '#c2185b', '25', 'Snatched, for less.', 'خصم حتى ٢٥٪ على منتجات هدى بيوتي', '#2a0f1e', '#fff', upto=True, tail='OFF SELECTED',
        box=(1040, 0, 1110, 1000), pos='center 46%', frame_col='rgba(42,15,30,.14)')
    yield 'oh4_artdeco', lambda n: offer_hero(n, P('artdeco/artdeco_relaunch26_model-blazer-palette_sq.jpg'), 'left', '#f0eeec', '#1b1718', wm_artdeco('#1b1718', 50),
        '#9c3b4e', '50', 'German artistry, half price.', 'خصم ٥٠٪ على كل منتجات آرتديكو', '#1b1718', '#fff',
        box=(1050, 0, 1100, 1000), pos='center 20%', frame_col='rgba(27,23,24,.14)')
    yield 'oh5_essence', lambda n: offer_hero(n, P('essence/essence_mascara-finder_model-curly-pink_land.jpg'), 'left', '#f7c6d6', '#3a0d24', wm_essence('#3a0d24', 68),
        '#c21d6b', '50', 'Lash love, for less.', 'خصم حتى ٥٠٪ على منتجات إيسنس', '#c21d6b', '#fff', upto=True, tail='OFF SELECTED',
        box=(900, 0, 1250, 1000), blend=320, pos='62% 30%', frame_col='rgba(58,13,36,.14)')
    yield 'oh6_deborah', lambda n: offer_hero(n, P('deborah/deborah_labbra_model-cafe-lipstick_port.jpg'), 'left', '#ece4dc', '#1f1a24', wm_deborah('#1f1a24', 58),
        '#9b2f45', '50', 'La dolce vita, for less.', 'خصم حتى ٥٠٪ على منتجات ديبورا ميلانو', '#1f1a24', '#fff', upto=True, tail='OFF SELECTED',
        box=(1080, 0, 1070, 1000), blend=470, pos='center 22%', frame_col='rgba(31,26,36,.14)')

def cards():
    yield 'oc1_rybella', lambda n: offer_card(n, P('rybella/rybella-makeup-home-category-face-2000x2000-1.jpg'), '#123049', '#fff', wm_rybella('#fff', 46), '#ff8cc4',
        '40', 'Italian colour,<br>for less.', 'خصم ٤٠٪ على كل منتجات ريبيلا', '#ff4fa3', '#fff', tail='OFF', fit='1080px auto', pos='center top', fade=(28, 44))
    yield 'oc2_grigi', lambda n: offer_card(n, P('grigi/grigi_ss25_model-coral-smile_port.jpg'), '#b84a45', '#fff', wm_grigi('#fff', 54), '#ffe0d6',
        '50', 'Greek glamour,<br>half price.', 'خصم ٥٠٪ على كل منتجات كريجي', '#fff', '#a8423b', tail='OFF', pos='center 10%')
    yield 'oc3_huda', lambda n: offer_card(n, P('huda/huda_snatched-baddies_model-baking-pink_port.webp'), '#3a1028', '#fff', wm_huda('#fff', 32), '#ffb3d1',
        '25', 'Snatched,<br>for less.', 'خصم حتى ٢٥٪ على منتجات هدى بيوتي', '#fff', '#3a1028', tail='OFF', upto=True, pos='center 18%')
    yield 'oc4_artdeco', lambda n: offer_card(n, P('artdeco/artdeco_bronzing_model-pearls_sq.jpg'), '#3b2524', '#fff', wm_artdeco('#fff', 44), '#f0c2b0',
        '50', 'German artistry,<br>half price.', 'خصم ٥٠٪ على كل منتجات آرتديكو', '#fff', '#3b2524', tail='OFF', pos='center 15%')
    yield 'oc5_essence', lambda n: offer_card(n, P('essence/essence_foundation-finder_model-headband_land.jpg'), '#c2346f', '#fff', wm_essence('#fff', 58), '#ffd3e2',
        '50', 'Pretty playful,<br>for less.', 'خصم حتى ٥٠٪ على منتجات إيسنس', '#fff', '#c2346f', tail='OFF', upto=True, pos='34% 20%')
    yield 'oc6_deborah', lambda n: offer_card(n, P('deborah/deborah_occhi_model-flowers_sq.jpg'), '#6b2149', '#fff', wm_deborah('#fff', 48), '#ffc9e4',
        '50', 'La dolce vita,<br>for less.', 'خصم حتى ٥٠٪ على منتجات ديبورا ميلانو', '#fff', '#6b2149', tail='OFF', upto=True, fit='1080px auto', pos='center top', fade=(30, 50))

def run(groups, flt=None):
    names = []
    for g in groups:
        for n, f in g():
            if flt and flt not in n: continue
            f(n); names.append(n); print('rendered', n, flush=True)
    return names

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'; flt = sys.argv[2] if len(sys.argv) > 2 else None
    G = {'heroes': [heroes], 'cards': [cards]}
    run(sum(G.values(), []) if what == 'all' else G[what], flt)
