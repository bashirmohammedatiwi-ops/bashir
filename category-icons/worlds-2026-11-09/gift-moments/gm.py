# gift-moments design variants on top of the w5 kit (same canvas sizes).
# Language: "gift card" — solid jewel-tone panel + campaign photo, hairline gold frame, centred type,
# a line-art satin bow between the English headline and the Arabic line, pill CTA.
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT + '/kit')
from kit import render, WM, GRAIN, set_out  # noqa: F401

P = os.path.dirname(os.path.abspath(__file__)) + '/photos'

def ph(rel):
    p = f'{P}/{rel}'
    assert os.path.exists(p), p
    return p

def rgba(hexc, a):
    h = hexc.lstrip('#'); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f'rgba({r},{g},{b},{a})'

# shrink any .fit element (font-size) until it fits inside data-max px
FIT = '''<script>document.fonts.ready.then(()=>{document.querySelectorAll('.fit').forEach(e=>{const m=+e.dataset.max;let f=parseFloat(getComputedStyle(e).fontSize);while(e.scrollWidth>m&&f>20){f-=2;e.style.fontSize=f+'px';}});});</script>'''

def bow(col, w=150, op=1):
    """Line-art satin bow flanked by hairlines (the world's signature ornament)."""
    return f'''<div style="display:flex;align-items:center;justify-content:center;gap:22px;opacity:{op}">
  <span style="display:block;width:{w}px;height:1.5px;background:linear-gradient(90deg,transparent,{col})"></span>
  <svg width="64" height="34" viewBox="0 0 64 34" fill="none" stroke="{col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 15 C24 3, 9 2, 7 9 C5 16, 18 19, 32 15 Z"/>
    <path d="M32 15 C40 3, 55 2, 57 9 C59 16, 46 19, 32 15 Z"/>
    <path d="M30 17 C27 23, 22 28, 17 32"/><path d="M34 17 C37 23, 42 28, 47 32"/>
    <ellipse cx="32" cy="15.5" rx="3.2" ry="3.6" fill="{col}"/>
  </svg>
  <span style="display:block;width:{w}px;height:1.5px;background:linear-gradient(270deg,transparent,{col})"></span>
</div>'''

def frame(col, inset=34, op=.55, r=0):
    return f'<div class="a" style="inset:{inset}px;border:1.5px solid {rgba(col, op)};border-radius:{r}px;z-index:60;pointer-events:none"></div>'

def hero(name, photo, side, bg, ink, gold, word, kicker, headline, sub, cta, cta_bg=None, cta_ink=None,
         frac=.58, pos='center', size='cover', hsize=118, sub_col=None, fade=280, W=2150, H=1000, badge=None,
         photo_filter='', extra='', hfont='Play', kick_col=None, text_shift=0, sub_size=47):
    """side = where the TEXT panel sits ('left'|'right'). frac = share of width given to the photo."""
    pw = int(W * frac); tw = W - pw
    if side == 'left':
        px = tw; fade_css = f'left:{px}px;width:{fade}px;background:linear-gradient(90deg,{bg},{rgba(bg, 0)})'
    else:
        px = 0; fade_css = f'left:{pw - fade}px;width:{fade}px;background:linear-gradient(270deg,{bg},{rgba(bg, 0)})'
    tx = 0 if side == 'left' else pw
    cta_bg = cta_bg or gold; cta_ink = cta_ink or bg; sub_col = sub_col or ink; kick_col = kick_col or gold
    bdg = (f'<div class="ar" style="margin-top:26px;font-family:Tajawal;font-weight:700;font-size:28px;color:{gold};letter-spacing:0">{badge}</div>' if badge else '')
    body = f'''
<div class="a" style="inset:0;background:{bg}"></div>
<div class="a" style="left:{px}px;top:0;width:{pw}px;height:{H}px;background:url('file://{photo}') {pos}/{size} no-repeat;z-index:2;{photo_filter}"></div>
<div class="a" style="top:0;height:{H}px;{fade_css};z-index:3"></div>{extra}
<div class="a" style="left:{tx + text_shift}px;top:0;width:{tw}px;height:{H}px;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:{ink}">
  <div>{word}</div>
  <div class="kick" style="font-size:24px;color:{kick_col};margin-top:26px">{kicker}</div>
  <div class="fit" data-max="{tw - 190}" style="font-family:{hfont};font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.02;margin-top:14px;white-space:nowrap;letter-spacing:-.01em">{headline}</div>
  <div style="margin-top:26px">{bow(gold, 120)}</div>
  <div class="ar fit" data-max="{tw - 190}" style="font-family:Tajawal;font-weight:500;font-size:{sub_size}px;color:{sub_col};margin-top:22px;white-space:nowrap">{sub}</div>
  <div style="margin-top:36px;direction:rtl"><span class="cta" style="font-size:41px;padding:21px 56px;background:{cta_bg};color:{cta_ink}">{cta} <span>←</span></span></div>
  {bdg}
</div>{frame(gold)}{GRAIN}{FIT}'''
    return render(name, W, H, body)

def card(name, photo, bg, ink, gold, word, kicker, headline, sub, cta, pos='center 20%', size='cover', panel=430, hsize=82,
         cta_bg=None, cta_ink=None, W=1080, H=1350, sub_col=None):
    """Portrait 4:5 spotlight card: photo above, solid panel below joined by a soft fade, centred type."""
    cta_bg = cta_bg or gold; cta_ink = cta_ink or bg; sub_col = sub_col or ink
    body = f'''
<div class="a" style="inset:0;background:{bg}"></div>
<div class="a" style="left:0;top:0;width:{W}px;height:{H - panel + 60}px;background:url('file://{photo}') {pos}/{size} no-repeat"></div>
<div class="a" style="left:0;width:{W}px;top:{H - panel - 120}px;height:{120 + 60}px;background:linear-gradient(0deg,{bg} 33%,{rgba(bg, 0)})"></div>
<div class="a" style="left:0;right:0;bottom:0;height:{panel}px;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:62px;text-align:center;color:{ink}">
  <div>{word}</div>
  <div class="kick" style="font-size:19px;color:{gold};margin-top:16px">{kicker}</div>
  <div class="fit" data-max="{W - 140}" style="font-family:Play;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.04;margin-top:8px;white-space:nowrap">{headline}</div>
  <div class="ar fit" data-max="{W - 140}" style="font-family:Tajawal;font-weight:500;font-size:41px;color:{sub_col};margin-top:12px;white-space:nowrap">{sub}</div>
  <div style="margin-top:24px;direction:rtl"><span class="cta" style="font-size:36px;padding:16px 44px;background:{cta_bg};color:{cta_ink}">{cta} <span>←</span></span></div>
</div>{frame(gold, 26, .6)}{GRAIN}{FIT}'''
    return render(name, W, H, body)

def tile(name, photo, label_ar, label_en, scrim='#2A0C14', gold='#D9B56A', pos='center', size='cover', S=800, big=None, big_font='Bodoni', sub_ar=None):
    """Square tile: photo + deep scrim at the bottom + centred Arabic label (+ optional big numeral)."""
    bigh = (f'<div class="lat" style="font-family:{big_font};font-weight:500;font-size:150px;line-height:.9;color:#fff;font-variation-settings:&quot;opsz&quot; 9">{big}</div>' if big else '')
    subh = (f'<div class="ar" style="font-family:Tajawal;font-weight:500;font-size:28px;color:rgba(255,255,255,.88);margin-top:6px">{sub_ar}</div>' if sub_ar else '')
    body = f'''
<div class="a" style="inset:0;background:url('file://{photo}') {pos}/{size} no-repeat"></div>
<div class="a" style="inset:0;background:linear-gradient(0deg,{rgba(scrim, .92)} 0%,{rgba(scrim, .55)} 30%,{rgba(scrim, 0)} 58%)"></div>
<div class="a" style="left:40px;right:40px;bottom:58px;z-index:50;color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center">
  {bigh}
  <div class="kick" style="font-size:18px;color:{gold};margin-top:10px">{label_en}</div>
  <div class="ar fit" data-max="{S - 110}" style="font-family:Messiri;font-weight:700;font-size:66px;line-height:1.2;margin-top:4px;white-space:nowrap">{label_ar}</div>{subh}
</div>{frame(gold, 22, .7)}{GRAIN}{FIT}'''
    return render(name, S, S, body)

def strip(name, photo, side, bg, ink, gold, kicker, headline, sub, cta, frac=.5, pos='center', size='cover', fade=260,
          W=2150, H=600, hsize=88, cta_bg=None, cta_ink=None, extra='', sub_col=None, note=None, text_w=None):
    pw = int(W * frac); tw = W - pw
    if photo:
        if side == 'left':
            px = tw; fcss = f'left:{px}px;width:{fade}px;background:linear-gradient(90deg,{bg},{rgba(bg, 0)})'
        else:
            px = 0; fcss = f'left:{pw - fade}px;width:{fade}px;background:linear-gradient(270deg,{bg},{rgba(bg, 0)})'
        pht = f'''<div class="a" style="left:{px}px;top:0;width:{pw}px;height:{H}px;background:url('file://{photo}') {pos}/{size} no-repeat;z-index:2"></div>
<div class="a" style="top:0;height:{H}px;{fcss};z-index:3"></div>'''
    else:
        pht = ''; tw = text_w or W; pw = 0
    tx = 0 if side == 'left' else pw
    cta_bg = cta_bg or gold; cta_ink = cta_ink or bg; sub_col = sub_col or ink
    nt = f'<div class="ar" style="font-family:Tajawal;font-weight:500;font-size:33px;color:{gold};margin-top:18px;white-space:nowrap">{note}</div>' if note else ''
    body = f'''
<div class="a" style="inset:0;background:{bg}"></div>{pht}{extra}
<div class="a" style="left:{tx}px;top:0;width:{tw}px;height:{H}px;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:{ink}">
  <div class="kick" style="font-size:22px;color:{gold}">{kicker}</div>
  <div class="fit" data-max="{tw - 160}" style="font-family:Play;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.04;margin-top:10px;white-space:nowrap">{headline}</div>
  <div style="display:flex;align-items:center;gap:30px;margin-top:22px;direction:rtl">
    <div class="ar fit" data-max="{tw - 560}" style="font-family:Tajawal;font-weight:500;font-size:44px;color:{sub_col};white-space:nowrap">{sub}</div>
    <span class="cta" style="font-size:38px;padding:17px 46px;background:{cta_bg};color:{cta_ink}">{cta} <span>←</span></span></div>{nt}
</div>{frame(gold, 24, .55)}{GRAIN}{FIT}'''
    return render(name, W, H, body)
