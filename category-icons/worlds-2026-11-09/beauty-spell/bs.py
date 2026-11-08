# Beauty Spell world-specific templates (extends kit.py): refined editorial type system.
# Bodoni Moda italic headlines, hairline accent rule, inset frame, IBM Plex Arabic sub-lines.
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT + '/kit')
import kit
from kit import render, GRAIN, _clear, WM

HERE = os.path.dirname(os.path.abspath(__file__))
PH = HERE + '/photos'

def rgba(hexcol, a):
    h = hexcol.lstrip('#'); h = ''.join(c*2 for c in h) if len(h) == 3 else h; r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f'rgba({r},{g},{b},{a})'

def photo_div(photo, box, pos, fit, z=2, extra=''):
    if box:
        x, y, w, h = box
        geo = f'left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
    else:
        geo = 'inset:0;'
    return f'<div class="a" style="{geo}background:url(\'file://{photo}\') {pos}/{fit} no-repeat;z-index:{z};{extra}"></div>'

def frame(col, inset=34, z=60):
    return f'<div class="a" style="inset:{inset}px;border:1.5px solid {col};z-index:{z};pointer-events:none"></div>'

def cta(text, bg, ink, size=40, pad='21px 50px'):
    return f'<span class="cta" style="font-size:{size}px;padding:{pad};background:{bg};color:{ink}">{text} <span style="font-family:Jost;font-weight:400">←</span></span>'

def ghost(text, ink, size=29):
    return f'<span class="cta" style="font-size:{size}px;padding:15px 30px;border:1.6px solid {rgba(ink,.55)};color:{ink};font-weight:700;background:transparent">{text}</span>'

def hero(name, photo, side, bg, ink, word, kicker, accent, head, sub, cta_text, cbg, cink,
         pos='center', fit='cover', box=None, scrim_w=48, solid_to=None, hsize=150, badge=None,
         frame_col=None, sub_col=None, W=2150, H=1000, blend=380, extra='', photo_extra='', text_w=None, top_note=None):
    """side = where TEXT sits. Full-bleed photo with bg-colour scrim, or box=(x,y,w,h) panel blended into bg."""
    deg = '90deg' if side == 'left' else '270deg'
    if box:
        x, y, w, h = box; edge = x if side == 'left' else W - (x + w)
        a0, a1 = edge / W * 100, (edge + blend) / W * 100
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{bg} 0%,{bg} {a0:.1f}%,{rgba(bg,0)} {a1:.1f}%)"></div>'
        tw = (x if side == 'left' else W - x - w) - 140
    else:
        s0 = solid_to if solid_to is not None else scrim_w - 20
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{bg} 0%,{rgba(bg,.96)} {s0}%,{rgba(bg,0)} {scrim_w + 8}%)"></div>'
        tw = int(W * scrim_w / 100) - 140
    if text_w: tw = text_w
    ps = 'left:128px' if side == 'left' else 'right:128px'
    sc = sub_col or rgba(ink, .78)
    fr = frame(frame_col) if frame_col else ''
    bdg = ghost(badge, ink) if badge else ''
    note = f'<div class="a kick" style="{ps};top:78px;font-size:19px;letter-spacing:.5em;color:{rgba(ink,.55)};z-index:55">{top_note}</div>' if top_note else ''
    body = f"""
<div class="a" style="inset:0;background:{bg}"></div>{photo_div(photo, box, pos, fit, extra=photo_extra)}{scr}{extra}{fr}{note}
<div class="a" style="{ps};top:0;bottom:0;width:{max(tw, 640)}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  <div>{word}</div>
  <div style="width:84px;height:2px;background:{accent};margin:30px 0 24px"></div>
  <div class="kick" style="font-size:24px;letter-spacing:.46em;color:{accent}">{kicker}</div>
  <div style="font-family:Bodoni;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:.98;letter-spacing:-.01em;margin-top:16px;white-space:nowrap">{head}</div>
  <div class="ar" style="font-family:Plex;font-weight:500;font-size:42px;color:{sc};margin-top:26px;white-space:nowrap">{sub}</div>
  <div style="margin-top:44px;display:flex;gap:18px;align-items:center;direction:rtl">{cta(cta_text, cbg, cink)}{bdg}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def card(name, photo, scrim, ink, word, kicker, accent, head, sub, cta_text, cbg, cink, pos='center 25%', fit='cover',
         hsize=104, fade=(34, 66), index=None, W=1080, H=1350, frame_col='rgba(255,255,255,.55)', photo_extra=''):
    body = f"""
<div class="a" style="inset:0;background:{scrim}"></div>{photo_div(photo, None, pos, fit, extra=photo_extra)}
<div class="a" style="inset:0;z-index:3;background:linear-gradient(0deg,{scrim} 0%,{rgba(scrim,.94)} {fade[0]}%,{rgba(scrim,0)} {fade[1]}%)"></div>
{frame(frame_col, 30)}
{f'<div class="a kick" style="left:70px;top:70px;font-size:19px;letter-spacing:.5em;color:#fff;z-index:55;text-shadow:0 1px 8px rgba(0,0,0,.25)">{index}</div>' if index else ''}
<div class="a" style="left:76px;right:70px;bottom:84px;display:flex;flex-direction:column;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  <div>{word}</div>
  <div style="width:64px;height:2px;background:{accent};margin:22px 0 18px"></div>
  <div class="kick" style="font-size:20px;letter-spacing:.42em;color:{accent}">{kicker}</div>
  <div style="font-family:Bodoni;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1;margin-top:10px;white-space:nowrap">{head}</div>
  <div class="ar" style="font-family:Plex;font-weight:500;font-size:35px;color:{rgba(ink,.8)};margin-top:16px;white-space:nowrap">{sub}</div>
  <div style="margin-top:30px;direction:rtl">{cta(cta_text, cbg, cink, 33, '16px 40px')}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def look(name, photo, n, ar, en, tint, pos='center 20%', fit='cover', W=1080, H=1350, ink='#fff', items=''):
    """Looks-of-the-season portrait: full photo, tinted foot, LOOK N° index, Arabic look name + English italic."""
    body = f"""
{photo_div(photo, None, pos, fit)}
<div class="a" style="inset:0;z-index:3;background:linear-gradient(0deg,{rgba(tint,.97)} 0%,{rgba(tint,.86)} 22%,{rgba(tint,0)} 50%)"></div>
<div class="a" style="inset:0;z-index:3;background:linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 18%)"></div>
{frame('rgba(255,255,255,.5)', 30)}
<div class="a kick" style="left:72px;top:74px;font-size:20px;letter-spacing:.5em;color:#fff;z-index:55">LOOK N°{n:02d}</div>
<div class="a kick" style="right:72px;top:74px;font-size:20px;letter-spacing:.5em;color:#fff;z-index:55">AW · 2026</div>
<div class="a" style="left:72px;right:72px;bottom:80px;z-index:50;color:{ink};text-align:right">
  <div style="font-family:Bodoni;font-style:italic;font-weight:500;font-size:58px;line-height:1;direction:ltr;text-align:right">{en}</div>
  <div class="ar" style="font-family:Messiri;font-weight:700;font-size:92px;line-height:1.2;margin-top:8px">{ar}</div>
  <div class="ar" style="font-family:Plex;font-weight:500;font-size:32px;opacity:.88;margin-top:6px">{items}</div>
  <div style="margin-top:28px;direction:rtl;text-align:right">{cta('تسوّقي الإطلالة', '#fff', tint, 32, '15px 38px')}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def tile(name, photo, ar, en, tint='#2a1424', pos='center', fit='cover', S=800):
    body = f"""
{photo_div(photo, None, pos, fit)}
<div class="a" style="inset:0;z-index:3;background:linear-gradient(0deg,{rgba(tint,.86)} 0%,{rgba(tint,.5)} 26%,{rgba(tint,0)} 52%)"></div>
{frame('rgba(255,255,255,.55)', 22)}
<div class="a" style="left:50px;right:50px;bottom:50px;z-index:50;color:#fff;text-align:right">
  <div class="kick" style="font-size:18px;letter-spacing:.5em;opacity:.9;text-align:right">{en}</div>
  <div class="ar" style="font-family:Messiri;font-weight:700;font-size:78px;line-height:1.15;margin-top:6px">{ar}</div>
</div>{GRAIN}"""
    return render(name, S, S, body)

def strip(name, photo, side, bg, ink, kicker, accent, head, sub, cta_text, cbg, cink, pos='center', box=None, hsize=104,
          W=2150, H=600, scrim_w=52, frame_col=None, extra=''):
    deg = '90deg' if side == 'left' else '270deg'
    if box:
        x, y, w, h = box; edge = x if side == 'left' else W - (x + w)
        a0, a1 = edge / W * 100, (edge + 300) / W * 100
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{bg} 0%,{bg} {a0:.1f}%,{rgba(bg,0)} {a1:.1f}%)"></div>'
    else:
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{bg} 0%,{rgba(bg,.95)} {scrim_w-16}%,{rgba(bg,0)} {scrim_w+10}%)"></div>'
    ps = 'left:120px' if side == 'left' else 'right:120px'
    body = f"""
<div class="a" style="inset:0;background:{bg}"></div>{photo_div(photo, box, pos, 'cover') if photo else ''}{scr}{extra}{frame(frame_col, 26) if frame_col else ''}
<div class="a" style="{ps};top:0;bottom:0;width:1250px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  <div class="kick" style="font-size:22px;letter-spacing:.46em;color:{accent}">{kicker}</div>
  <div style="font-family:Bodoni;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1;margin-top:14px;white-space:nowrap">{head}</div>
  <div style="display:flex;align-items:center;gap:28px;margin-top:26px;direction:rtl">
    <div class="ar" style="font-family:Plex;font-weight:500;font-size:38px;color:{rgba(ink,.8)};white-space:nowrap">{sub}</div>
    {cta(cta_text, cbg, cink, 32, '15px 38px')}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

# ---------------- wordmarks ----------------
def wm_huda(c, s=40): return WM('HUDA BEAUTY', s, c, 'Mont', 700, '.32em')
def wm_deborah(c, s=56): return f'<span class="lat" style="display:inline-flex;flex-direction:column;align-items:center;color:{c}"><span style="font-family:Bodoni;font-weight:500;font-size:{s}px;letter-spacing:.2em">DEBORAH</span><span style="font-family:Jost;font-weight:500;font-size:{int(s*.3)}px;letter-spacing:.9em;margin-top:2px;margin-right:-.9em">MILANO</span></span>'
def wm_catrice(c, s=48): return WM('CATRICE', s, c, 'Jost', 600, '.32em')
def wm_essence(c, s=64): return WM('essence', s, c, 'Mont', 800, '-.01em')
def wm_mny(c, s=46): return f'<span class="lat" style="color:{c}"><span style="font-family:Mont;font-weight:800;font-size:{s}px;letter-spacing:.02em">MAYBELLINE</span><span style="font-family:Mont;font-weight:600;font-size:{int(s*.32)}px;letter-spacing:.25em;margin-left:14px">NEW YORK</span></span>'
def wm_astra(c, s=48): return f'<span class="lat" style="color:{c}"><span style="font-family:Mont;font-weight:800;font-size:{s}px;letter-spacing:.22em">ASTRA</span><span style="font-family:Jost;font-weight:500;font-size:{int(s*.33)}px;letter-spacing:.3em;margin-left:16px">MAKE-UP · ITALIA</span></span>'
def wm_mufe(c, s=36): return WM('MAKE UP FOR EVER', s, c, 'Jost', 500, '.36em')
def wm_sheglam(c, s=50): return WM('SHEGLAM', s, c, 'Mont', 800, '.14em')
def wm_nyx(c, s=64): return f'<span class="lat" style="color:{c}"><span style="font-family:Mont;font-weight:900;font-size:{s}px;letter-spacing:.02em">NYX</span><span style="font-family:Mont;font-weight:600;font-size:{int(s*.22)}px;letter-spacing:.2em;margin-left:14px">PROFESSIONAL MAKEUP</span></span>'
def wm_artdeco(c, s=46): return WM('ARTDECO', s, c, 'Corm', 600, '.3em')
def wm_abh(c, s=40): return f'<span class="lat" style="display:inline-flex;flex-direction:column;color:{c}"><span style="font-family:Corm;font-weight:600;font-size:{s}px;letter-spacing:.32em">ANASTASIA</span><span style="font-family:Jost;font-weight:500;font-size:{int(s*.36)}px;letter-spacing:.6em;margin-top:2px">BEVERLY HILLS</span></span>'
def wm_grigi(c, s=56): return WM('GR\\GI', s, c, 'Jost', 400, '.18em')
def wm_rybella(c, s=50): return f'<span class="lat" style="font-family:Mont;font-weight:800;font-size:{s}px;letter-spacing:.06em;color:{c};display:inline-block;transform:scaleY(1.15)">RYBELLA</span>'
