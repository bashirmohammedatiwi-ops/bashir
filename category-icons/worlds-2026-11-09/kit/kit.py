# Deema world design kit — editorial campaign templates rendered by headless Chrome.
# Usage from a world script:  import sys; sys.path.insert(0, KIT); from kit import *; set_out('/path/to/world/out')
# Every template takes a real campaign/lifestyle PHOTO (official brand imagery) + brand wordmark + English headline + Arabic sub.
import os, subprocess, math
KIT = os.path.dirname(os.path.abspath(__file__)); F = f'{KIT}/fonts'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
OUT = None; HTML = None
def set_out(d):
    global OUT, HTML
    d = os.path.abspath(d); OUT = d; HTML = d + "/_html"; os.makedirs(OUT, exist_ok=True); os.makedirs(HTML, exist_ok=True)

NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
CSS = f"""
@font-face{{font-family:Messiri;src:url('file://{F}/ElMessiri.ttf');font-weight:400 700}}
@font-face{{font-family:Tajawal;src:url('file://{F}/Tajawal-Medium.ttf');font-weight:500}}
@font-face{{font-family:Tajawal;src:url('file://{F}/Tajawal-Bold.ttf');font-weight:700}}
@font-face{{font-family:Tajawal;src:url('file://{F}/Tajawal-ExtraBold.ttf');font-weight:800}}
@font-face{{font-family:Plex;src:url('file://{F}/IBMPlexSansArabic-Medium.ttf');font-weight:500}}
@font-face{{font-family:Plex;src:url('file://{F}/IBMPlexSansArabic-Bold.ttf');font-weight:700}}
@font-face{{font-family:Amiri;src:url('file://{F}/Amiri-Bold.ttf');font-weight:700}}
@font-face{{font-family:Reem;src:url('file://{F}/ReemKufi.ttf');font-weight:400 700}}
@font-face{{font-family:Play;src:url('file://{F}/PlayfairDisplay.ttf');font-weight:400 900;font-style:normal}}
@font-face{{font-family:Play;src:url('file://{F}/PlayfairDisplay-Italic.ttf');font-weight:400 900;font-style:italic}}
@font-face{{font-family:Bodoni;src:url('file://{F}/BodoniModa.ttf');font-weight:400 900;font-style:normal}}
@font-face{{font-family:Bodoni;src:url('file://{F}/BodoniModa-Italic.ttf');font-weight:400 900;font-style:italic}}
[style*="font-family:Bodoni"]{{font-variation-settings:'opsz' 9}}
@font-face{{font-family:Corm;src:url('file://{F}/CormorantGaramond.ttf');font-weight:300 700;font-style:normal}}
@font-face{{font-family:Corm;src:url('file://{F}/CormorantGaramond-Italic.ttf');font-weight:300 700;font-style:italic}}
@font-face{{font-family:Cinzel;src:url('file://{F}/Cinzel.ttf');font-weight:400 900}}
@font-face{{font-family:Jost;src:url('file://{F}/Jost.ttf');font-weight:100 900}}
@font-face{{font-family:Mont;src:url('file://{F}/Montserrat.ttf');font-weight:100 900}}
@font-face{{font-family:Italiana;src:url('file://{F}/Italiana-Regular.ttf')}}
@font-face{{font-family:Marcellus;src:url('file://{F}/Marcellus-Regular.ttf')}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{overflow:hidden;direction:ltr}}
body{{position:relative;overflow:hidden;font-family:Tajawal;-webkit-font-smoothing:antialiased}}
.a{{position:absolute}}
.lat{{direction:ltr;unicode-bidi:isolate;white-space:nowrap}}
.kick{{font-family:Jost;font-weight:500;letter-spacing:.42em;text-transform:uppercase;direction:ltr;unicode-bidi:isolate;white-space:nowrap}}
.ar{{direction:rtl;unicode-bidi:isolate}}
.cta{{display:inline-flex;align-items:center;gap:18px;border-radius:999px;font-family:Tajawal;font-weight:800;white-space:nowrap;direction:rtl}}
.grain{{inset:0;opacity:.06;mix-blend-mode:overlay;z-index:90;background:{NOISE}}}
"""
GRAIN = '<div class="a grain"></div>'

def render(name, w, h, body):
    p = f'{HTML}/{name}.html'
    open(p, 'w').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><style>{CSS} body{{width:{w}px;height:{h}px}}</style></head><body>{body}</body></html>')
    out = f'{OUT}/{name}.png'
    subprocess.run([CHROME, '--headless=new', '--hide-scrollbars', '--allow-file-access-from-files', f'--window-size={w},{h}',
                    '--force-device-scale-factor=1', '--virtual-time-budget=6000', f'--screenshot={out}', f'file://{p}'],
                   check=True, capture_output=True, timeout=240)
    return out

# ---------- wordmarks (use the brand's real-looking typography; adjust per brand) ----------
def WM(text, size, col, font='Mont', weight=800, ls='.08em', italic=False, extra=''):
    st = 'font-style:italic;' if italic else ''
    return f'<span class="lat" style="font-family:{font};font-weight:{weight};font-size:{size}px;letter-spacing:{ls};color:{col};{st}{extra}">{text}</span>'

def _photo(photo, box, pos, fit, filt=''):
    if box:
        x, y, w, h = box
        return f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:url(\'file://{photo}\') {pos}/{fit} no-repeat;z-index:2;{filt}"></div>'
    return f'<div class="a" style="inset:0;background:url(\'file://{photo}\') {pos}/{fit} no-repeat;z-index:2;{filt}"></div>'

def _clear(c):
    return c.replace('rgb(', 'rgba(').replace(')', ',0)')

def editorial(name, photo, side, scrim, ink, word, kicker, kcol, headline, sub, scol, cta, cbg, cink,
              pos='center', fit='cover', box=None, scrim_w=50, hsize=128, hfont='Play', hitalic=True, W=2150, H=1000,
              badge=None, extra='', sub_font='Tajawal'):
    """Full-bleed (or boxed) campaign photo + colour scrim on the text side + editorial type.
    side: 'left'|'right' = where the TEXT sits. box=(x,y,w,h) puts the photo in a panel (split layout) with a soft 360px blend.
    headline: English (use <br> for 2 lines). sub: Arabic. badge: optional small pill text (Arabic) e.g. 'الوكيل الحصري في العراق'."""
    deg = '90deg' if side == 'left' else '270deg'; clr = _clear(scrim)
    if box:
        x, y, w, h = box; edge = x if side == 'left' else W - (x + w)
        a0, a1 = edge / W * 100, (edge + 360) / W * 100
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{scrim} 0%,{scrim} {a0:.1f}%,{clr} {a1:.1f}%)"></div>'
    else:
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{scrim} 0%,{scrim} {scrim_w - 22}%,{clr} {scrim_w + 6}%)"></div>'
    pos_side = 'left:110px' if side == 'left' else 'right:110px'
    tw = int(W * scrim_w / 100) - 150 if not box else (box[0] if side == 'left' else W - box[0] - box[2]) - 150
    hf = f'font-family:{hfont};' + ('font-style:italic;' if hitalic else '')
    bdg = f'<span class="cta" style="font-size:30px;padding:16px 30px;border:2px solid {ink};color:{ink};background:transparent;font-weight:700">{badge}</span>' if badge else ''
    body = f"""
<div class="a" style="inset:0;background:{scrim}"></div>{_photo(photo, box, pos, fit)}{scr}{extra}
<div class="a" style="{pos_side};top:0;bottom:0;width:{max(tw, 600)}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  <div>{word}</div>
  <div class="kick" style="font-size:27px;color:{kcol};margin-top:24px">{kicker}</div>
  <div style="{hf}font-weight:500;font-size:{hsize}px;line-height:1.04;margin-top:12px;white-space:nowrap">{headline}</div>
  <div class="ar" style="font-family:{sub_font};font-weight:500;font-size:43px;color:{scol};margin-top:18px;white-space:nowrap">{sub}</div>
  <div style="margin-top:38px;display:flex;gap:18px;align-items:center;direction:rtl"><span class="cta" style="font-size:41px;padding:21px 52px;background:{cbg};color:{cink}">{cta} <span>←</span></span>{bdg}</div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def card(name, photo, scrim, ink, word, kicker, kcol, headline, sub, scol, cta, cbg, cink, pos='center 25%', fit='cover', hsize=100,
         hfont='Play', hitalic=True, W=1080, H=1350):
    """Portrait 4:5 spotlight card: photo on top, colour fade at the bottom with brand + headline + CTA."""
    clr = _clear(scrim); hf = f'font-family:{hfont};' + ('font-style:italic;' if hitalic else '')
    body = f"""
<div class="a" style="inset:0;background:url('file://{photo}') {pos}/{fit} no-repeat"></div>
<div class="a" style="inset:0;background:linear-gradient(0deg,{scrim} 0%,{scrim} 30%,{clr} 62%)"></div>
<div class="a" style="left:70px;right:70px;bottom:70px;display:flex;flex-direction:column;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  <div>{word}</div>
  <div class="kick" style="font-size:22px;color:{kcol};margin-top:18px">{kicker}</div>
  <div style="{hf}font-weight:500;font-size:{hsize}px;line-height:1.04;margin-top:8px;white-space:nowrap">{headline}</div>
  <div class="ar" style="font-family:Tajawal;font-weight:500;font-size:36px;color:{scol};margin-top:12px;white-space:nowrap">{sub}</div>
  <div style="margin-top:26px;direction:rtl"><span class="cta" style="font-size:34px;padding:17px 44px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def tile(name, photo, label_ar, label_en, ink='#fff', scrim='rgb(20,12,24)', pos='center', fit='cover', S=800, align='bottom'):
    """Square category/look tile: photo + gradient + Arabic label + small English kicker."""
    clr = _clear(scrim)
    body = f"""
<div class="a" style="inset:0;background:url('file://{photo}') {pos}/{fit} no-repeat"></div>
<div class="a" style="inset:0;background:linear-gradient(0deg,{scrim.replace('rgb(', 'rgba(').replace(')', ',.78)')} 0%,{clr} 55%)"></div>
<div class="a" style="left:46px;right:46px;bottom:44px;z-index:50;color:{ink};text-align:right">
  <div class="kick" style="font-size:20px;opacity:.85;text-align:right">{label_en}</div>
  <div class="ar" style="font-family:Messiri;font-weight:700;font-size:74px;line-height:1.15;margin-top:8px">{label_ar}</div>
</div>{GRAIN}"""
    return render(name, S, S, body)

def strip(name, photo, side, scrim, ink, headline, sub, scol, cta, cbg, cink, kicker='', kcol=None, pos='center', box=None, W=2150, H=600, hsize=96):
    """Wide promo strip (3.6:1) — e.g. budget, gift guide, free delivery, new arrivals."""
    deg = '90deg' if side == 'left' else '270deg'; clr = _clear(scrim)
    scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{scrim} 0%,{scrim} 36%,{clr} 62%)"></div>'
    ps = 'left:100px' if side == 'left' else 'right:100px'
    body = f"""
<div class="a" style="inset:0;background:{scrim}"></div>{_photo(photo, box, pos, 'cover')}{scr}
<div class="a" style="{ps};top:0;bottom:0;width:1100px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink};text-align:left">
  {f'<div class="kick" style="font-size:24px;color:{kcol or ink}">{kicker}</div>' if kicker else ''}
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.05;margin-top:8px;white-space:nowrap">{headline}</div>
  <div style="display:flex;align-items:center;gap:26px;margin-top:20px;direction:rtl">
    <div class="ar" style="font-family:Tajawal;font-weight:500;font-size:40px;color:{scol};white-space:nowrap">{sub}</div>
    <span class="cta" style="font-size:34px;padding:16px 40px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def sheet(names, out_name, w=1075, cols=2):
    """Contact sheet (jpg) of rendered pngs for QA."""
    from PIL import Image
    ims = [Image.open(f'{OUT}/{n}.png').convert('RGB') for n in names]
    rows = []
    for im in ims:
        h = round(im.height * w / im.width); rows.append(im.resize((w, h)))
    R = (len(rows) + cols - 1) // cols; H = 0; lines = []
    for r in range(R):
        line = rows[r * cols:(r + 1) * cols]; lh = max(x.height for x in line); lines.append((line, lh)); H += lh + 10
    s = Image.new('RGB', (cols * (w + 10), H), 'white'); y = 0
    for line, lh in lines:
        for i, im in enumerate(line): s.paste(im, (i * (w + 10), y))
        y += lh + 10
    p = f'{OUT}/{out_name}.jpg'; s.save(p, quality=84); return p
