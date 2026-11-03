# Beauty Spell (سحر الجمال) round 3: GRIGI + RYBELLA first. HTML → headless Chrome.
import os, sys, subprocess
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, ROOT)
from gen import FONT_CSS, CHROME
FONTS = os.path.join(ROOT, 'fonts'); OUT = os.path.join(HERE, 'out'); HTML = os.path.join(HERE, 'html'); PREP = os.path.join(HERE, 'prep')
for d in (OUT, HTML, PREP): os.makedirs(d, exist_ok=True)
EXTRA = f"""
@font-face{{font-family:Jost;src:url('file://{FONTS}/Jost.ttf');font-weight:100 900}}
@font-face{{font-family:Mont;src:url('file://{FONTS}/Montserrat.ttf');font-weight:100 900}}
.grigi{{font-family:Jost;font-weight:400;letter-spacing:.1em;direction:ltr;unicode-bidi:isolate;white-space:nowrap}}
.ryb{{font-family:Mont;font-weight:800;letter-spacing:.02em;direction:ltr;unicode-bidi:isolate;white-space:nowrap;transform:scaleY(1.12);display:inline-block}}
.badge{{display:inline-flex;align-items:center;gap:.45em;font-family:Tajawal;font-weight:800;border-radius:999px;white-space:nowrap}}
"""

def C(code):
    """cut-out path: g### (grigi site) or r######## (rybella)."""
    d = {'g': 'gcut', 'o': 'ocut'}.get(code[0], 'rcut')
    return os.path.join(HERE, d, code + '.png')

def ar(code):
    w, h = Image.open(C(code)).size; return w / h

def img(code, h, x, bottom, rot=0, z=1, shadow='rgba(0,0,0,.28)', w=None):
    wd = w or int(ar(code) * h)
    return (f'<img src="file://{C(code)}" style="position:absolute;left:{x}px;bottom:{bottom}px;height:{h}px;width:{wd}px;'
            f'transform:rotate({rot}deg);transform-origin:50% 100%;z-index:{z};'
            f'filter:drop-shadow(0 26px 30px {shadow}) drop-shadow(0 6px 8px rgba(0,0,0,.14))">')

def flat(code, h, x, y, rot=0, z=0, op=1):
    """swatch/texture: no shadow, positioned from top."""
    return (f'<img src="file://{C(code)}" style="position:absolute;left:{x}px;top:{y}px;height:{h}px;'
            f'transform:rotate({rot}deg);z-index:{z};opacity:{op}">')

def page(w, h, body, css=''):
    return f"""<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>{FONT_CSS}{EXTRA}
body{{width:{w}px;height:{h}px;position:relative}} {css}</style></head><body>{body}</body></html>"""

def render(name, w, h, doc):
    hp = os.path.join(HTML, name + '.html'); open(hp, 'w').write(doc)
    out = os.path.join(OUT, name + '.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--window-size={w},{h}', '--force-device-scale-factor=1', '--virtual-time-budget=4000',
                    f'--screenshot={out}', 'file://' + hp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    print('rendered', name, os.path.exists(out))

def photo(src, box, height, name):
    """crop a campaign photo, upscale to `height` with Lanczos + light sharpening."""
    im = Image.open(os.path.join(HERE, 'grsite', src)).convert('RGB').crop(box)
    s = height / im.height
    im = im.resize((round(im.width * s), height), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    p = os.path.join(PREP, name + '.png'); im.save(p); return p, im.width

def MARK(text, size, color, font='Cinzel', weight=500, ls='.18em'):
    return (f'<span style="font-family:{font};font-weight:{weight};letter-spacing:{ls};font-size:{size}px;color:{color};'
            f'direction:ltr;unicode-bidi:isolate;white-space:nowrap">{text}</span>')

def GRIGI(size, color):
    return f'<span class="grigi" style="font-size:{size}px;color:{color}">GR\\GI</span>'

def RYB(size, color):
    return f'<span class="ryb" style="font-size:{size}px;color:{color}">RYBELLA</span>'

# ------------------------------------------------------------------ HERO with campaign model 2150x1000
def hero_model(name, src, box, model_side, bg, ink, sub_ink, acc, title, sub, cta, cta_bg, cta_ink, prods=''):
    p, pw = photo(src, box, 1000, name)
    if model_side == 'right':
        ph = f'<img src="file://{p}" style="position:absolute;right:0;top:0;height:1000px">'
        fade = f'<div style="position:absolute;right:{pw - 150}px;top:0;width:150px;height:1000px;background:linear-gradient(90deg,{bg},transparent)"></div>'
        txt = 'left:120px;'
    else:
        ph = f'<img src="file://{p}" style="position:absolute;left:0;top:0;height:1000px">'
        fade = f'<div style="position:absolute;left:{pw - 150}px;top:0;width:150px;height:1000px;background:linear-gradient(270deg,{bg},transparent)"></div>'
        txt = 'right:120px;'
    body = f"""
<div style="position:absolute;inset:0;background:{bg}"></div>{ph}{fade}{prods}
<div style="position:absolute;{txt}top:0;bottom:0;width:{min(980, 2150 - pw - 140)}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:26px;color:{ink};text-align:right;z-index:5">
  <div>{GRIGI(118, ink)}</div>
  <div class="badge" style="font-size:38px;padding:12px 30px;border:2px solid {acc};color:{acc}">الوكيل الحصري في العراق</div>
  <div class="ttl" style="font-size:118px;white-space:nowrap;margin-top:6px">{title}</div>
  <div class="sub" style="font-size:50px;color:{sub_ink};white-space:nowrap">{sub}</div>
  <div style="margin-top:8px"><span class="cta" style="font-size:46px;padding:22px 56px;background:{cta_bg};color:{cta_ink}">{cta} <span>←</span></span></div>
</div>"""
    render(name, 2150, 1000, page(2150, 1000, body))

# ------------------------------------------------------------------ HERO / SPOTLIGHT with products 2150x1000
def hero_products(name, bg, ink, sub_ink, acc, mark, title, sub, cta, cta_bg, cta_ink, items, deco='', badge=True, kicker=''):
    body = f"""
<div style="position:absolute;inset:0;background:{bg}"></div>{deco}{items}
<div style="position:absolute;right:120px;top:0;bottom:0;width:920px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:24px;color:{ink};text-align:right;z-index:5">
  <div>{mark}</div>
  {f'<div class="kick" style="font-size:36px;color:{acc}">{kicker}</div>' if kicker else ''}
  {f'<div class="badge" style="font-size:36px;padding:12px 30px;border:2px solid {acc};color:{acc}">الوكيل الحصري في العراق</div>' if badge else ''}
  <div class="ttl" style="font-size:112px;white-space:nowrap;margin-top:4px">{title}</div>
  <div class="sub" style="font-size:50px;color:{sub_ink}">{sub}</div>
  <div style="margin-top:8px"><span class="cta" style="font-size:44px;padding:22px 54px;background:{cta_bg};color:{cta_ink}">{cta} <span>←</span></span></div>
</div>"""
    render(name, 2150, 1000, page(2150, 1000, body))

# ------------------------------------------------------------------ WIDE STRIP 2160x800 (marquee)
def wide(name, bg, ink, acc, mark, line, items, deco=''):
    body = f"""
<div style="position:absolute;inset:0;background:{bg}"></div>{deco}{items}
<div style="position:absolute;right:110px;top:0;bottom:0;width:820px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:22px;color:{ink};z-index:5">
  <div>{mark}</div>
  <div style="width:120px;height:4px;background:{acc};border-radius:4px"></div>
  <div class="ttl" style="font-size:92px;white-space:nowrap">{line}</div>
</div>"""
    render(name, 2160, 800, page(2160, 800, body))

# ------------------------------------------------------------------ MINI TILE 600x600
def mini(name, bg, ink, word, brand_mark, items):
    body = f"""
<div style="position:absolute;inset:0;background:{bg}"></div>
<div style="position:absolute;left:70px;top:150px;width:460px;height:460px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.6),transparent)"></div>
{items}
<div style="position:absolute;top:34px;left:20px;right:20px;text-align:center;color:{ink};z-index:5">
  <div class="ttl" style="font-size:66px">{word}</div>
  {f'<div style="margin-top:6px;opacity:.8">{brand_mark}</div>' if brand_mark else ''}
</div>"""
    render(name, 600, 600, page(600, 600, body))

# ------------------------------------------------------------------ EXCLUSIVE STRIP 2150x672
def exclusive(name):
    body = f"""
<div style="position:absolute;inset:0;background:linear-gradient(90deg,#17121A,#2A1E2C 50%,#17121A)"></div>
<div style="position:absolute;left:0;right:0;top:40px;height:2px;background:#C9A66B;opacity:.55"></div>
<div style="position:absolute;left:0;right:0;bottom:40px;height:2px;background:#C9A66B;opacity:.55"></div>
{img('g88', 400, 80, 80, -8, 2)}{img('g121', 350, 270, 80, 6, 1)}
{img('rl_scarlet', 420, 1720, 70, 4, 2, w=None)}
<div style="position:absolute;left:540px;right:470px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px;color:#F6EBD8">
  <div class="kick" style="font-size:36px;color:#C9A66B;letter-spacing:.4em">EXCLUSIVE DISTRIBUTOR</div>
  <div style="display:flex;align-items:center;gap:56px">{GRIGI(96, '#FFFFFF')}<span style="width:2px;height:80px;background:#C9A66B"></span>{RYB(90, '#FFFFFF')}</div>
  <div class="ttl" style="font-size:54px;white-space:nowrap">وكيلكم الحصري لكريجي وريبيلا في العراق</div>
</div>"""
    render(name, 2150, 672, page(2150, 672, body))

SPECS = []
def add(fn, name, *a, **k): SPECS.append((name, fn, a, k))

# heroes ---------------------------------------------------------------------------------------
add(hero_model, 'h_grigi_berry', 'Winter_25.jpg', (735, 0, 1283, 425), 'right', '#D8D5DC', '#1E1A22', '#4A4350', '#8E1F3A',
    'شفاه بلون التوت', 'أحمر شفاه مات برو يدوم طوال اليوم', 'تسوّقي كريجي', '#1E1A22', '#F4EEF5',
    )
add(hero_model, 'h_grigi_blue', 'Winter_25_blue.jpg', (90, 0, 610, 425), 'left', '#2A344D', '#FFFFFF', '#C9D2E6', '#E8B4C8',
    'عيون آسرة', 'آيلاينر وماسكارا برو مقاومة للماء', 'تسوّقي العيون', '#E8B4C8', '#1B2133',
    )
add(hero_model, 'h_grigi_cinnamon', 'Winter_25_cinnamon.jpg', (590, 0, 1120, 425), 'right', '#AFAFAF', '#1B1918', '#3B3633', '#7A2A1C',
    'دفء القرفة', 'ظلال وأحمر شفاه بألوان الموسم', 'اكتشفي الألوان', '#1B1918', '#F2ECE6',
    )
ryb_deco = ('<div style="position:absolute;left:80px;top:90px;width:1000px;height:1000px;border-radius:50%;'
            'background:radial-gradient(closest-side,rgba(255,255,255,.75),transparent)"></div>')
add(hero_products, 'h_rybella', 'linear-gradient(120deg,#F8E4E8 0%,#EFC9D2 100%)', '#3A1424', '#6B3E50', '#B23A5E',
    RYB(120, '#3A1424'), 'جمال إيطالي', 'صُنع في إيطاليا بألوان لا تنتهي', 'تسوّقي ريبيلا', '#3A1424', '#FBEFF3',
    img('r4c09cea9', 360, 90, 110, -8, 1) + img('rl_scarlet', 540, 380, 90, -10, 3) + img('rl_cassi', 500, 590, 90, 6, 2)
    + img('rd09a5f40', 380, 840, 90, 8, 1), deco=ryb_deco)

# spotlights (inside brand groups) -------------------------------------------------------------
add(hero_products, 's_grigi', 'linear-gradient(120deg,#3B2433 0%,#1F141C 100%)', '#FFFFFF', '#E3CFDA', '#E8B4C8',
    GRIGI(110, '#FFFFFF'), 'ظلال بألوان ساحرة', 'باليتات برو وبريميوم — ألوان غنية تدوم', 'تسوّقي الظلال', '#E8B4C8', '#24161F',
    flat('g167', 330, 120, 560, -10, 0, .95) + img('g116', 360, 140, 330, -5, 2, 'rgba(0,0,0,.45)') + img('g173', 250, 560, 110, 4, 3, 'rgba(0,0,0,.45)')
    + img('g160', 230, 160, 90, -3, 4, 'rgba(0,0,0,.45)'),
    deco='<div style="position:absolute;left:40px;top:60px;width:1020px;height:1020px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,180,200,.28),transparent)"></div>')
add(hero_products, 's_rybella', 'linear-gradient(120deg,#F6EDE4 0%,#E9D6C4 100%)', '#2E2018', '#5E4A3C', '#A66A44',
    RYB(110, '#2E2018'), 'بشرة إيطالية مثالية', 'كريم أساس وبودرة وبلاشر بلمسة طبيعية', 'تسوّقي الوجه', '#2E2018', '#F8F0E8',
    img('r86b96542', 600, 120, 80, -12, 2) + img('r4c09cea9', 380, 470, 80, 0, 3) + img('ra391ca01', 340, 760, 80, 6, 2)
    + img('r0576f98d', 300, 560, 360, -4, 1), deco=ryb_deco.replace('.75', '.6'))

# marquee strips -----------------------------------------------------------------------------
add(wide, 'w_grigi_lips', 'linear-gradient(90deg,#F4D9E1,#FBEFF3 60%,#F4D9E1)', '#3A1424', '#B23A5E', GRIGI(96, '#3A1424'), 'شفاه لا تُقاوَم',
    flat('g52', 470, 40, 120, -8, 0) + img('g88', 520, 470, 70, -6, 2) + img('g121', 470, 700, 70, 6, 3) + img('g105', 470, 940, 70, 10, 1))
add(wide, 'w_grigi_eyes', 'linear-gradient(90deg,#2B2233,#463650 60%,#2B2233)', '#FFFFFF', '#E8B4C8', GRIGI(96, '#FFFFFF'), 'ظلال بألوان ساحرة',
    img('g116', 420, 90, 140, -6, 2, 'rgba(0,0,0,.5)') + img('g171', 230, 640, 90, 4, 3, 'rgba(0,0,0,.5)') + flat('g179', 300, 600, 60, -8, 0, .9))
add(wide, 'w_rybella_lips', 'linear-gradient(90deg,#F2E2D8,#FBF4EE 60%,#F2E2D8)', '#3A1F18', '#A84A3A', RYB(96, '#3A1F18'), 'أحمر شفاه إيطالي',
    img('rl_scarlet', 540, 170, 60, -12, 2) + img('rl_artemisia', 480, 470, 60, 0, 3) + img('rl_ruby', 500, 820, 60, 12, 1))
add(wide, 'w_grigi_face', 'linear-gradient(90deg,#EADCCB,#F7EFE5 60%,#EADCCB)', '#2B2018', '#9C6B44', GRIGI(96, '#2B2018'), 'بشرة مخملية',
    img('g83', 400, 70, 120, 0, 2) + img('g183', 340, 500, 120, 6, 3) + img('g35', 420, 790, 90, 4, 1))
add(wide, 'w_rybella_color', 'linear-gradient(90deg,#E3E7F4,#F5F6FB 60%,#E3E7F4)', '#1C2240', '#4B5BA8', RYB(96, '#1C2240'), 'ألوان بلا حدود',
    img('r1284b090', 440, 80, 120, -6, 2) + img('rd09a5f40', 430, 620, 80, 6, 3) + img('r92237fc6', 460, 880, 80, -4, 2))

# mini tiles -------------------------------------------------------------------------------------
add(mini, 'm_lips', '#F2D3DC', '#3A1424', 'أحمر الشفاه', '', img('g88', 330, 110, 30, -8, 2) + img('o124', 330, 300, 30, 6, 1))
add(mini, 'm_eyes', '#DCD3EA', '#2A1F3A', 'ظلال العيون', '', img('o154', 380, 95, 25, 0, 2))
add(mini, 'm_powder', '#EFE1D2', '#3A2618', 'البودرة', '', img('g83', 230, 30, 50, -4, 2) + img('o221', 290, 330, 30, 4, 1))
add(mini, 'm_blush', '#F6D9D2', '#4A1E18', 'البلاشر', '', img('o287', 290, 40, 30, -3, 2) + img('ra391ca01', 170, 345, 40, 4, 1))
add(mini, 'm_mascara', '#D7DCE8', '#1C2236', 'الماسكارا', '', img('r8791b981', 360, 150, 30, -16, 2) + img('o25', 340, 330, 30, 8, 1))
add(mini, 'm_nails', '#F5D2DC', '#4A1428', 'طلاء الأظافر', '', img('rd09a5f40', 330, 140, 30, -6, 2) + img('r92237fc6', 310, 330, 30, 6, 1))

# other brands — marquee strips ---------------------------------------------------------------
add(wide, 'w_huda', 'linear-gradient(90deg,#2A1418,#4A2229 60%,#2A1418)', '#FFFFFF', '#D9A46A', MARK('HUDA BEAUTY', 78, '#F2D7B0'), 'ألوان جريئة بلا حدود',
    img('o128', 470, 70, 130, -6, 2, 'rgba(0,0,0,.5)') + img('o124', 470, 600, 80, 6, 3, 'rgba(0,0,0,.5)') + img('o136', 420, 860, 80, 10, 1, 'rgba(0,0,0,.5)'))
add(wide, 'w_sheglam', 'linear-gradient(90deg,#F7D7E2,#FDEEF3 60%,#F7D7E2)', '#4A1430', '#D2577F', MARK('SHEGLAM', 92, '#4A1430', 'Mont', 800, '.04em'), 'لمسة وردية ناعمة',
    img('o287', 480, 60, 100, -6, 2) + img('o271', 460, 470, 80, 4, 3) + img('o263', 230, 800, 80, 0, 1))
add(wide, 'w_mufe', 'linear-gradient(90deg,#E9E2DA,#F6F2EE 60%,#E9E2DA)', '#1A1A1A', '#8C7A68', MARK('MAKE UP FOR EVER', 64, '#1A1A1A', 'Jost', 600, '.14em'), 'بشرة بلا عيوب',
    img('o221', 520, 90, 80, -4, 2) + img('o222', 500, 520, 70, 5, 3) + img('o227', 260, 720, 70, 0, 1))
add(wide, 'w_maybelline', 'linear-gradient(90deg,#F3D3D6,#FBEDEE 60%,#F3D3D6)', '#3B1420', '#C0405E', MARK('MAYBELLINE', 86, '#3B1420', 'Mont', 700, '.06em'), 'شفاه تدوم طويلاً',
    img('o237', 560, 120, 60, -10, 2) + img('o243', 540, 400, 60, 2, 3) + img('o235', 500, 700, 60, 12, 1))
add(wide, 'w_nyx', 'linear-gradient(90deg,#1B1B1F,#2E2A33 60%,#1B1B1F)', '#FFFFFF', '#F05AA6', MARK('NYX', 120, '#FFFFFF', 'Mont', 900, '.12em'), 'ألوان مرحة وجريئة',
    img('o252', 400, 60, 170, -8, 2, 'rgba(0,0,0,.55)') + img('o256', 400, 430, 110, 6, 3, 'rgba(0,0,0,.55)') + img('o250', 470, 820, 80, 8, 1, 'rgba(0,0,0,.55)'))

add(exclusive, 'x_exclusive')

if __name__ == '__main__':
    flt = sys.argv[1] if len(sys.argv) > 1 else ''
    for name, fn, a, k in SPECS:
        if flt in name: fn(name, *a, **k)

# ------------------------------------------------------------------ BRAND POSTER 1080x1350 (matches «براندات تعشقينها»)
def poster_model(name, src, box, tagline):
    p, pw = photo(src, box, 1350, name)
    body = f"""
<div style="position:absolute;inset:0;background:#2A344D"></div>
<img src="file://{p}" style="position:absolute;left:{(1080 - pw) // 2}px;top:0;height:1350px">
<div style="position:absolute;left:0;right:0;bottom:0;height:640px;background:linear-gradient(180deg,transparent,rgba(30,24,40,.86))"></div>
<div style="position:absolute;left:0;right:0;bottom:120px;text-align:center;color:#fff">
  <div>{GRIGI(112, '#FFFFFF')}</div>
  <div style="width:100px;height:3px;background:#E8B4C8;margin:26px auto 22px"></div>
  <div class="ttl" style="font-size:66px">{tagline}</div>
  <div class="sub" style="font-size:42px;margin-top:22px;opacity:.9">اكتشفي ←</div>
</div>"""
    render(name, 1080, 1350, page(1080, 1350, body))

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'poster':
    poster_model('p_grigi', 'Winter_25_blue.jpg', (92, 0, 432, 425), 'جمال يوناني احترافي')
