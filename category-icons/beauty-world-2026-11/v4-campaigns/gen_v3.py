# Beauty Spell v3 — editorial brand campaigns (2150x1000 heroes). HTML -> headless Chrome.
import os, sys, subprocess, math
HERE = os.path.dirname(os.path.abspath(__file__))
OLD = '/private/tmp/claude-502/-Volumes-ADATA-SD810-Projects-full-app-worktrees-puf/7182e1b7-8063-4300-9d1f-6536cf8c6e1e/scratchpad'
FONTS = f'{OLD}/fonts'; BEAUTY = f'{OLD}/beauty'
LG = f'{HERE}/lgcut'; CAT = f'{HERE}/cat/img'; PROD = os.path.dirname(HERE) + '/insta/prod/cut'
OUT = f'{HERE}/out'; HTML = f'{HERE}/html'
for d in (OUT, HTML): os.makedirs(d, exist_ok=True)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

CSS0 = f"""
@font-face{{font-family:Messiri;src:url('file://{FONTS}/ElMessiri[wght].ttf');font-weight:400 700}}
@font-face{{font-family:Tajawal;src:url('file://{FONTS}/Tajawal-Medium.ttf');font-weight:500}}
@font-face{{font-family:Tajawal;src:url('file://{FONTS}/Tajawal-Bold.ttf');font-weight:700}}
@font-face{{font-family:Tajawal;src:url('file://{FONTS}/Tajawal-ExtraBold.ttf');font-weight:800}}
@font-face{{font-family:Amiri;src:url('file://{FONTS}/Amiri-Bold.ttf');font-weight:700}}
@font-face{{font-family:Reem;src:url('file://{FONTS}/ReemKufi[wght].ttf');font-weight:400 700}}
@font-face{{font-family:Corm;src:url('file://{FONTS}/CormorantGaramond[wght].ttf');font-weight:300 700}}
@font-face{{font-family:Play;src:url('file://{FONTS}/PlayfairDisplay[wght].ttf');font-weight:400 900}}
@font-face{{font-family:Cinzel;src:url('file://{FONTS}/Cinzel[wght].ttf');font-weight:400 900}}
@font-face{{font-family:Jost;src:url('file://{FONTS}/Jost.ttf');font-weight:100 900}}
@font-face{{font-family:Mont;src:url('file://{FONTS}/Montserrat.ttf');font-weight:100 900}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{overflow:hidden;direction:ltr}}
body{{position:relative;overflow:hidden;font-family:Tajawal;direction:rtl;-webkit-font-smoothing:antialiased}}
.a{{position:absolute}}
.grain{{inset:0;opacity:.06;mix-blend-mode:overlay;z-index:90;background:GRAINURL}}
.lat{{direction:ltr;unicode-bidi:isolate;white-space:nowrap}}
.kick{{font-family:Jost;font-weight:500;letter-spacing:.42em;text-transform:uppercase;direction:ltr;unicode-bidi:isolate;white-space:nowrap}}
.cta{{display:inline-flex;align-items:center;gap:18px;border-radius:999px;font-family:Tajawal;font-weight:800;white-space:nowrap}}
.pill{{display:inline-flex;align-items:center;gap:12px;border-radius:999px;font-family:Tajawal;font-weight:700;white-space:nowrap}}
"""
NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
CSS = CSS0.replace('GRAINURL', NOISE)
GRAIN = '<div class="a grain"></div>'

def render(name, w, h, body, scale=1):
    p = f'{HTML}/{name}.html'
    open(p, 'w').write(f'<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>{CSS} body{{width:{w}px;height:{h}px}}</style></head><body>{body}</body></html>')
    out = f'{OUT}/{name}.png'
    subprocess.run([CHROME, '--headless=new', '--hide-scrollbars', '--allow-file-access-from-files', f'--window-size={w},{h}',
                    f'--force-device-scale-factor={scale}', '--virtual-time-budget=5000', f'--screenshot={out}', f'file://{p}'],
                   check=True, capture_output=True, timeout=180)
    print('rendered', name)
    return out

def img(src, x, y, h, rot=0, z=5, shadow=True, extra=''):
    sh = 'filter:drop-shadow(0 30px 34px rgba(0,0,0,.35)) drop-shadow(0 6px 8px rgba(0,0,0,.18));' if shadow else ''
    return f'<img class="a" src="file://{src}" style="left:{x}px;top:{y}px;height:{h}px;transform:rotate({rot}deg);transform-origin:50% 100%;z-index:{z};{sh}{extra}">'

def sparkles(pts, col='#fff'):
    return ''.join(f'<div class="a" style="left:{x}px;top:{y}px;width:{r}px;height:{r}px;background:{col};z-index:30;'
                   f'clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%);opacity:{o}"></div>' for x, y, r, o in pts)

RYB_WORD = lambda size, col: f'<span class="lat" style="font-family:Mont;font-weight:800;font-size:{size}px;letter-spacing:.06em;color:{col};display:inline-block;transform:scaleY(1.15)">RYBELLA</span>'
GRIGI_WORD = lambda size, col: f'<span class="lat" style="font-family:Jost;font-weight:400;font-size:{size}px;letter-spacing:.16em;color:{col}">GR\\GI</span>'

# ------------------------------------------------------------------ 1. RYBELLA — campaign photo, editorial
RYB = f'{HERE}/ryb'
def hero_rybella():
    W, H = 2150, 1000
    body = f"""
<div class="a" style="inset:0;background:linear-gradient(90deg,#eceef2 0%,#e6e8ed 40%,#e3e6ec 100%)"></div>
<img class="a" src="file://{RYB}/ryb-news-shades-lipstick.webp" style="right:0;top:0;height:1000px">
<div class="a" style="left:0;top:0;width:900px;height:1000px;background:linear-gradient(90deg,#eceef2 55%,rgba(236,238,242,0))"></div>
<div class="a" style="left:120px;top:0;bottom:0;width:1000px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;direction:ltr;text-align:left">
  <div class="kick" style="font-size:28px;color:#e2007a">Italian Beauty · New Shades</div>
  <div style="margin-top:30px">{RYB_WORD(64, '#141414')}</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:150px;line-height:1.02;color:#1b1418;margin-top:18px;white-space:nowrap">Nude,<br>redefined.</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:44px;color:#5b4c55;margin-top:22px;direction:rtl">درجات نود جديدة · أحمر شفاه وقلم وغلوس</div>
  <div style="display:flex;gap:20px;align-items:center;margin-top:40px;direction:rtl">
    <span class="cta" style="font-size:42px;padding:22px 54px;background:#e2007a;color:#fff">تسوّقي ريبيلا <span>←</span></span>
    <span class="pill" style="font-size:30px;padding:16px 30px;border:2px solid #1b1418;color:#1b1418">الوكيل الحصري في العراق</span>
  </div>
</div>{GRAIN}"""
    return render('h1_rybella', W, H, body)

# ------------------------------------------------------------------ 2. GRIGI — Black & Berry editorial
def hero_grigi():
    W, H = 2150, 1000
    body = f"""
<div class="a" style="inset:0;background:url('file://{CAT}/aw24_p02_6.jpeg') center/cover"></div>
<div class="a" style="inset:0;background:linear-gradient(90deg,rgba(40,4,14,.0) 0%,rgba(60,6,22,.35) 45%,rgba(70,8,26,.78) 100%)"></div>
<div class="a" style="left:0;top:0;width:900px;height:1000px;overflow:hidden;z-index:10">
  <img src="file://{CAT}/aw24_p01_2536.jpeg" style="position:absolute;left:-70px;top:-150px;height:1500px">
  <div class="a" style="inset:0;background:linear-gradient(90deg,rgba(0,0,0,0) 70%,rgba(95,10,32,.95) 100%)"></div>
</div>
<div class="a" style="left:880px;top:90px;width:2px;height:820px;background:linear-gradient(transparent,rgba(255,220,230,.6),transparent);z-index:12"></div>
<div class="a" style="right:110px;top:0;bottom:0;width:980px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right;z-index:50;color:#fff">
  <div style="margin-top:0">{GRIGI_WORD(92, '#fff')}</div>
  <div class="kick" style="font-size:28px;color:#ffc9d6;margin-top:26px">Fall · Winter Collection</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:138px;line-height:1.04;margin-top:14px;white-space:nowrap;direction:ltr">Black &amp; Berry</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:46px;color:#ffdbe4;margin-top:16px">شفاه بلون التوت · مات برو يدوم طوال اليوم</div>
  <div style="display:flex;gap:22px;align-items:center;margin-top:46px">
    <span class="cta" style="font-size:44px;padding:24px 58px;background:#fff;color:#6d0c26">تسوّقي كريجي <span>←</span></span>
    <span class="pill" style="font-size:32px;padding:18px 34px;border:2px solid rgba(255,255,255,.55);color:#fff">الوكيل الحصري في العراق</span>
  </div>
</div>
{img(f'{BEAUTY}/gcut/g110.png', 640, 850, 120, -8, 39, False)}
{img(f'{BEAUTY}/gcut/g88.png', 760, 590, 380, -6, 40)}
{GRAIN}"""
    return render('h2_grigi', W, H, body)

if __name__ == '__main__':
    which = sys.argv[1:] or ['rybella', 'grigi']
    for w in which: globals()['hero_' + w]()

# ------------------------------------------------------------------ 3+. brand campaigns (macro still-life, editorial type)
BP = f'{HERE}/bp/cut'
def brand_hero(name, bg, glow, word, kicker, kcol, headline, hcol, sub, scol, cta, cbg, cink, items, floor='rgba(0,0,0,.18)'):
    """items: (file, x, y, h, rot, z) in px on the 2150x1000 canvas."""
    W, H = 2150, 1000
    prods = ''.join(
        f'<img class="a" src="file://{BP}/{f}.png" style="left:{x}px;top:{y}px;height:{h}px;transform:rotate({r}deg);z-index:{z};'
        f'filter:drop-shadow(0 40px 40px {floor}) drop-shadow(0 8px 10px rgba(0,0,0,.14))">' for f, x, y, h, r, z in items)
    body = f"""
<div class="a" style="inset:0;background:{bg}"></div>
<div class="a" style="left:1050px;top:-250px;width:1300px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,{glow},transparent)"></div>
{prods}
<div class="a" style="left:120px;top:0;bottom:0;width:980px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;direction:ltr;text-align:left">
  <div>{word}</div>
  <div class="kick" style="font-size:27px;color:{kcol};margin-top:26px">{kicker}</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:136px;line-height:1.02;color:{hcol};margin-top:14px;white-space:nowrap">{headline}</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:44px;color:{scol};margin-top:22px;direction:rtl;white-space:nowrap">{sub}</div>
  <div style="margin-top:40px;direction:rtl"><span class="cta" style="font-size:42px;padding:22px 54px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def WM(text, size, col, font='Mont', weight=800, ls='.08em', case='none'):
    return f'<span class="lat" style="font-family:{font};font-weight:{weight};font-size:{size}px;letter-spacing:{ls};color:{col};text-transform:{case}">{text}</span>'

def hero_huda():
    return brand_hero('h3_huda', 'linear-gradient(120deg,#f6ece2 0%,#efdcc8 55%,#e6c7a6 100%)', 'rgba(255,240,220,.9)',
        WM('HUDA BEAUTY', 56, '#2a1a12', weight=700, ls='.22em'), 'Dubai · Obsessions Palettes', '#a8653a',
        'Obsessed<br>with color.', '#2a1a12', 'باليتات هدى بيوتي الأيقونية بألوان لا تُنسى', '#6b5444',
        'تسوّقي هدى بيوتي', '#2a1a12', '#f6ece2',
        [('huda-beauty_49', 1180, 60, 470, -10, 6), ('huda-beauty_45', 1560, 40, 470, 8, 7),
         ('huda-beauty_43', 1260, 470, 500, 6, 9), ('huda-beauty_47', 1660, 470, 480, -7, 8)])

def hero_mufe():
    return brand_hero('h4_mufe', 'linear-gradient(120deg,#151515 0%,#232323 60%,#2e2a28 100%)', 'rgba(255,255,255,.14)',
        WM('MAKE UP FOR EVER', 46, '#fff', font='Jost', weight=500, ls='.3em'), 'Professional Paris', '#d9c2a6',
        'Skin,<br>in HD.', '#fff', 'كريم أساس HD Skin بلمسة لا تُرى', '#cfc6be',
        'تسوّقي ميك أب فور إيفر', '#fff', '#111',
        [('make-up-for-ever_71', 1260, 120, 820, -6, 8), ('make-up-for-ever_73', 1800, 210, 700, 7, 7),
         ('make-up-for-ever_76', 1140, 640, 330, -14, 9)], floor='rgba(0,0,0,.6)')

def hero_catrice():
    return brand_hero('h5_catrice', 'linear-gradient(120deg,#f4eefa 0%,#ead9f3 55%,#dcc6ee 100%)', 'rgba(255,255,255,.85)',
        WM('CATRICE', 64, '#2b1e3a', weight=800, ls='.14em'), 'Cosmetics · Germany', '#8a5fb5',
        'Beauty,<br>your rules.', '#2b1e3a', 'غلوس فيلر، كريم أساس HD وموس الشفاه', '#5d4a70',
        'تسوّقي كاتريس', '#2b1e3a', '#fff',
        [('catrice_28', 1240, 150, 760, -4, 8), ('catrice_27', 1620, 80, 820, 6, 9), ('catrice_30', 1880, 200, 720, 12, 7)])

def hero_sheglam():
    return brand_hero('h6_sheglam', 'linear-gradient(120deg,#fff1f4 0%,#ffdfe8 55%,#ffc9d9 100%)', 'rgba(255,255,255,.9)',
        WM('SHEGLAM', 64, '#3a1424', weight=800, ls='.12em'), 'Color Bloom · Liquid Blush', '#d0457a',
        'Bloom<br>in color.', '#3a1424', 'بلاشر سائل بلمسة مخملية ولون يدوم', '#7a4a5c',
        'تسوّقي شيغلام', '#d0457a', '#fff',
        [('sheglam_117', 1150, 150, 620, -6, 8), ('sheglam_116', 1640, 90, 760, 6, 7), ('sheglam_109', 1480, 590, 380, -4, 9)])

def hero_essence():
    return brand_hero('h7_essence', 'linear-gradient(120deg,#e9fbf6 0%,#cdf3ea 50%,#b5ece2 100%)', 'rgba(255,255,255,.85)',
        WM('essence', 70, '#0e3b38', font='Jost', weight=700, ls='.02em'), 'Lash Princess · Bestseller', '#e2147a',
        'Lashes<br>that rule.', '#0e3b38', 'ماسكارا لاش برينسيس الشهيرة بتأثير الرموش الصناعية', '#356662',
        'تسوّقي إيسنس', '#e2147a', '#fff',
        [('essence_31', 1300, 60, 880, -8, 8), ('essence_32', 1640, 100, 840, 5, 9), ('essence_36', 1900, 160, 780, 14, 7)])

def hero_nyx():
    return brand_hero('h8_nyx', 'linear-gradient(120deg,#1d0f1a 0%,#3a1030 55%,#5b1446 100%)', 'rgba(255,90,170,.35)',
        WM('NYX', 96, '#fff', weight=900, ls='.04em') + '<span class="lat" style="font-family:Mont;font-weight:600;font-size:22px;letter-spacing:.3em;color:#ffb8da;margin-left:18px">PROFESSIONAL MAKEUP</span>',
        'Buttermelt · Butter Gloss', '#ff7ab8', 'Melt into<br>color.', '#fff', 'بلاشر بترميلت وغلوس بتر الناعم', '#f0cde0',
        'تسوّقي نيكس', '#ff3d9a', '#fff',
        [('nyx_88', 1220, 160, 560, -10, 8), ('nyx_95', 1640, 120, 560, 8, 7), ('nyx_90', 1560, 380, 600, -8, 9)], floor='rgba(0,0,0,.5)')

def fit(items, right):
    """scale a product cluster (anchored at its left edge) so nothing crosses x=right."""
    from PIL import Image
    def path(f): return f if f.startswith('/') else f'{BP}/{f}.png'
    def box(f, x, y, h, r):
        w0, h0 = Image.open(path(f)).size; w = h * w0 / h0; a = math.radians(abs(r))
        bw = w * math.cos(a) + h * math.sin(a); return x + w / 2 - bw / 2, x + w / 2 + bw / 2
    L = min(box(f, x, y, h, r)[0] for f, x, y, h, r, z in items); R = max(box(f, x, y, h, r)[1] for f, x, y, h, r, z in items)
    if R <= right: return items
    k = (right - max(L, 0)) / (R - max(L, 0)); x0 = max(L, 0)
    return [(f, x0 + (x - x0) * k, y + h * (1 - k) * 0.55, h * k, r, z) for f, x, y, h, r, z in items]

# ------------------------------------------------------------------ brand rooms (2150x1000, mirrored: visual left, text right)
def room(name, bg, glow, word, kicker, kcol, headline, hcol, sub, scol, cta, cbg, cink, items, floor='rgba(0,0,0,.18)', extra=''):
    W, H = 2150, 1000
    items = fit(items, 1070)
    prods = ''.join(
        f'<img class="a" src="file://{f if f.startswith("/") else BP + "/" + f + ".png"}" style="left:{x}px;top:{y}px;height:{h}px;transform:rotate({r}deg);z-index:{z};'
        f'filter:drop-shadow(0 40px 40px {floor}) drop-shadow(0 8px 10px rgba(0,0,0,.14))">' for f, x, y, h, r, z in items)
    body = f"""
<div class="a" style="inset:0;background:{bg}"></div>
<div class="a" style="left:-200px;top:-250px;width:1300px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,{glow},transparent)"></div>
{extra}{prods}
<div class="a" style="left:1150px;top:0;bottom:0;width:900px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;direction:ltr;text-align:left">
  <div>{word}</div>
  <div class="kick" style="font-size:26px;color:{kcol};margin-top:24px">{kicker}</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:124px;line-height:1.03;color:{hcol};margin-top:12px;white-space:nowrap">{headline}</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:42px;color:{scol};margin-top:20px;direction:rtl;white-space:nowrap">{sub}</div>
  <div style="margin-top:36px;direction:rtl"><span class="cta" style="font-size:40px;padding:20px 50px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def room_rybella():
    sw = f'<img class="a" src="file://{LG}/swatch.png" style="left:70px;top:80px;height:840px;border-radius:36px;z-index:4;filter:drop-shadow(0 30px 40px rgba(60,10,40,.25))">'
    return room('r_rybella', 'linear-gradient(120deg,#f7eef2 0%,#f1e1e9 100%)', 'rgba(255,255,255,.9)',
        RYB_WORD(58, '#141414'), 'Lip Glitch · 10 Shades', '#e2007a', 'Shine that<br>glitches.', '#1b1418',
        'أحمر شفاه ليب غليتش بلمعة هولوغرافية', '#5b4c55', 'اكتشفي ليب غليتش', '#e2007a', '#fff',
        [(f'{LG}/g05_bul.png', 820, 120, 760, 14, 8), (f'{LG}/g10_bul.png', 960, 200, 700, 22, 7), (f'{LG}/g05_cap.png', 700, 330, 620, 0, 9)], extra=sw)

def room_grigi():
    W, H = 2150, 1000
    body = f"""
<div class="a" style="inset:0;background:url('file://{CAT}/ss25_p02_32.jpeg') center/cover"></div>
<div class="a" style="inset:0;background:linear-gradient(270deg,rgba(150,40,40,.0) 0%,rgba(170,60,60,.25) 50%,rgba(150,50,50,.7) 100%)"></div>
<div class="a" style="right:0;top:0;width:900px;height:1000px;overflow:hidden;z-index:10">
  <img src="file://{CAT}/ss25_p01_3391.jpeg" style="position:absolute;right:-60px;top:-120px;height:1300px">
  <div class="a" style="inset:0;background:linear-gradient(270deg,rgba(0,0,0,0) 70%,rgba(200,90,85,.95) 100%)"></div>
</div>
<div class="a" style="left:110px;top:0;bottom:0;width:1050px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:#fff;direction:ltr;text-align:left">
  <div>{GRIGI_WORD(86, '#fff')}</div>
  <div class="kick" style="font-size:27px;color:#ffe2dc;margin-top:24px">Spring · Summer Collection</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:132px;line-height:1.04;margin-top:12px;white-space:nowrap">Coral crush.</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:44px;color:#fff1ee;margin-top:16px;direction:rtl;white-space:nowrap">ألوان مرجانية مشرقة لإطلالة صيفية</div>
  <div style="margin-top:40px;direction:rtl"><span class="cta" style="font-size:42px;padding:22px 54px;background:#fff;color:#b5413c">تسوّقي كريجي <span>←</span></span></div>
</div>{GRAIN}"""
    return render('r_grigi', W, H, body)

def room_huda():
    return room('r_huda', 'linear-gradient(120deg,#2a1a12 0%,#3b2418 100%)', 'rgba(230,170,110,.35)',
        WM('HUDA BEAUTY', 50, '#f3dcc4', weight=700, ls='.22em'), 'Empowered · Lip Blush', '#e0a46a', 'Empowered<br>beauty.', '#fff',
        'باليت Empowered وتنت الشفاه والخدود', '#e8d3c0', 'تسوّقي هدى بيوتي', '#f3dcc4', '#2a1a12',
        [('huda-beauty_42', 90, 220, 520, -8, 7), ('huda-beauty_46', 650, 130, 760, 6, 8), ('huda-beauty_44', 860, 230, 680, 14, 6)], floor='rgba(0,0,0,.5)')

def room_mufe():
    return room('r_mufe', 'linear-gradient(120deg,#f3efe9 0%,#e9e1d6 100%)', 'rgba(255,255,255,.9)',
        WM('MAKE UP FOR EVER', 42, '#141414', font='Jost', weight=500, ls='.3em'), 'HD Skin Face Palette', '#a67c52', 'Sculpt<br>like a pro.', '#141414',
        'باليت HD Skin للكونتور والإضاءة', '#5c5248', 'تسوّقي ميك أب فور إيفر', '#141414', '#fff',
        [('make-up-for-ever_68', 80, 300, 430, -10, 8), ('make-up-for-ever_69', 520, 150, 640, 8, 9), ('make-up-for-ever_75', 160, 650, 300, 6, 10)])

def room_catrice():
    return room('r_catrice', 'linear-gradient(120deg,#fdf3ec 0%,#f6e3d6 100%)', 'rgba(255,255,255,.9)',
        WM('CATRICE', 58, '#2b1e3a', weight=800, ls='.14em'), 'True Skin · Camouflage', '#c46b4e', 'Flawless,<br>every day.', '#2b1e3a',
        'كونسيلر True Skin وكامفلاج عالي التغطية', '#6d5a50', 'تسوّقي كاتريس', '#2b1e3a', '#fff',
        [('catrice_21', 260, 90, 820, -6, 8), ('catrice_29', 560, 120, 800, 6, 9), ('catrice_22', 820, 200, 720, 12, 7)])

def room_sheglam():
    return room('r_sheglam', 'linear-gradient(120deg,#fbe9ef 0%,#f6d6e1 100%)', 'rgba(255,255,255,.9)',
        WM('SHEGLAM', 58, '#3a1424', weight=800, ls='.12em'), 'Skin Focus · Glam Liner', '#d0457a', 'Glam,<br>effortlessly.', '#3a1424',
        'بودرة Skin Focus وآيلاينر جل يدوم', '#7a4a5c', 'تسوّقي شيغلام', '#d0457a', '#fff',
        [('sheglam_110', 70, 470, 330, -6, 9), ('sheglam_109', 330, 170, 600, 6, 8), ('sheglam_112', 760, 140, 760, 10, 7)])

def room_essence():
    return room('r_essence', 'linear-gradient(120deg,#ffeef6 0%,#ffd9ea 100%)', 'rgba(255,255,255,.9)',
        WM('essence', 64, '#5a0f36', font='Jost', weight=700, ls='.02em'), 'Get Big · I Love Extreme', '#e2147a', 'Big lashes,<br>big love.', '#5a0f36',
        'ماسكارات إيسنس بأسعار تحبينها', '#7d4a63', 'تسوّقي إيسنس', '#e2147a', '#fff',
        [('essence_34', 200, 80, 840, -10, 8), ('essence_35', 480, 110, 820, 2, 9), ('essence_37', 760, 150, 780, 12, 7)])

def room_nyx():
    return room('r_nyx', 'linear-gradient(120deg,#eef0ff 0%,#dfe3fb 100%)', 'rgba(255,255,255,.9)',
        WM('NYX', 86, '#1b1c3a', weight=900, ls='.04em'), 'The Face Glue · Angel Veil', '#3d4bd6', 'Glued to<br>perfection.', '#1b1c3a',
        'برايمر وسبراي تثبيت لمكياج يدوم', '#4d5070', 'تسوّقي نيكس', '#3d4bd6', '#fff',
        [('nyx_92', 160, 90, 820, -8, 8), ('nyx_93', 520, 110, 800, 4, 9), ('nyx_96', 760, 300, 600, 10, 7)])

def room_maybelline():
    return room('r_maybelline', 'linear-gradient(120deg,#fff0ef 0%,#ffdcd9 100%)', 'rgba(255,255,255,.9)',
        WM('MAYBELLINE', 56, '#1a1a1a', weight=800, ls='.08em') + '<span class="lat" style="font-family:Mont;font-weight:600;font-size:22px;letter-spacing:.3em;color:#1a1a1a;margin-left:14px">NEW YORK</span>',
        'Super Stay · Lifter Gloss', '#d62b4d', 'Stay all day.', '#1a1a1a',
        'سوبر ستاي فينيل إنك وليفتر غلوس', '#6a4a4a', 'تسوّقي ميبيلين', '#1a1a1a', '#fff',
        [('maybelline_79', 160, 90, 820, -8, 8), ('maybelline_85', 480, 130, 780, 4, 9), ('maybelline_83', 760, 160, 760, 12, 7)])

def room_astra():
    return room('r_astra', 'linear-gradient(120deg,#f8efe8 0%,#efdfd2 100%)', 'rgba(255,255,255,.9)',
        WM('ASTRA', 64, '#3b1e1a', weight=800, ls='.2em'), 'Make-up · Italia', '#b0473c', 'Italian<br>lip love.', '#3b1e1a',
        'أحمر شفاه ومحددات شفاه أسترا الإيطالية', '#6d4f48', 'تسوّقي أسترا', '#b0473c', '#fff',
        [('astra_16', 160, 160, 760, -6, 8), ('astra_18', 520, 130, 780, 6, 9), ('astra_15', 820, 200, 720, 12, 7)])

def room_artdeco():
    return room('r_artdeco', 'linear-gradient(120deg,#f1ecf6 0%,#e3daee 100%)', 'rgba(255,255,255,.9)',
        WM('ARTDECO', 60, '#2a1f3a', font='Cinzel', weight=700, ls='.16em'), 'Germany · Since 1985', '#9b5fa3', 'Color,<br>crafted.', '#2a1f3a',
        'بلاشر ستيك وليب فلويد بلمسة مات', '#5d4f6c', 'تسوّقي آرتديكو', '#2a1f3a', '#fff',
        [('artdeco_06', 160, 140, 780, -6, 8), ('artdeco_01', 560, 110, 820, 6, 9), ('artdeco_09', 820, 200, 720, 12, 7)])

# ------------------------------------------------------------------ v4 editorial: real campaign photo + brand scrim + editorial type
def editorial(name, photo, text_side, scrim, ink, word, kicker, kcol, headline, sub, scol, cta, cbg, cink,
              fit='cover', pos='center', W=2150, H=1000, photo_box=None, scrim_w=58, hsize=128, extra=''):
    """photo full-bleed (or in photo_box=(x,y,w,h)), soft scrim on the text side, text block in the calm side.
    text_side: 'left' | 'right'. scrim: css colour (rgb) used for the gradient."""
    if photo_box:
        x, y, w, h = photo_box
        ph = f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:url(\'file://{photo}\') {pos}/{fit} no-repeat;z-index:2"></div>'
    else:
        ph = f'<div class="a" style="inset:0;background:url(\'file://{photo}\') {pos}/{fit} no-repeat;z-index:2"></div>'
    deg = '90deg' if text_side == 'left' else '270deg'
    clear = scrim.replace("rgb(", "rgba(").replace(")", ",0)")
    if photo_box:  # split layout: solid colour up to the photo edge, then a soft 360px blend into the photo
        x, y, w, h = photo_box
        edge = x if text_side == 'left' else W - (x + w)
        a0, a1 = edge / W * 100, (edge + 360) / W * 100
        scr = f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{scrim} 0%,{scrim} {a0:.1f}%,{clear} {a1:.1f}%)"></div>'
    else:
        scr = (f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{scrim} 0%,{scrim} {scrim_w - 22}%,'
               f'{clear} {scrim_w + 6}%)"></div>')
    side = 'left:110px' if text_side == 'left' else 'right:110px'
    body = f"""
<div class="a" style="inset:0;background:{scrim}"></div>{ph}{scr}{extra}
<div class="a" style="{side};top:0;bottom:0;width:{int(W * scrim_w / 100) - 150}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;color:{ink};direction:ltr;text-align:left">
  <div>{word}</div>
  <div class="kick" style="font-size:27px;color:{kcol};margin-top:24px">{kicker}</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.04;margin-top:12px;white-space:nowrap">{headline}</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:43px;color:{scol};margin-top:18px;direction:rtl;white-space:nowrap">{sub}</div>
  <div style="margin-top:38px;direction:rtl"><span class="cta" style="font-size:41px;padding:21px 52px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W, H, body)

CP = f'{HERE}/camp'
def v4_catrice_hero():
    return editorial('h5_catrice', f'{CP}/catrice/catrice_hd-liquid-coverage_model_portrait.jpg', 'left', 'rgb(236,231,226)', '#1d1a1a',
        WM('CATRICE', 60, '#1d1a1a', weight=800, ls='.14em'), 'HD Liquid Coverage', '#9a6b4f', 'Coverage<br>that lasts.',
        'كريم أساس HD بتغطية عالية تدوم ٢٤ ساعة', '#5b514c', 'تسوّقي كاتريس', '#1d1a1a', '#fff',
        photo_box=(1150, 0, 1000, 1000), pos='center 30%', scrim_w=56)
def v4_catrice_room():
    return editorial('r_catrice', f'{CP}/catrice/catrice_filler-supreme_gloss_closeup.jpg', 'right', 'rgb(246,214,200)', '#3a1a16',
        WM('CATRICE', 56, '#3a1a16', weight=800, ls='.14em'), 'Filler Supreme · Lip Gloss', '#c4523f', 'Fuller,<br>glossier.',
        'غلوس فيلر سوبريم بلمعة زجاجية', '#6d4a40', 'تسوّقي كاتريس', '#c4523f', '#fff',
        photo_box=(0, 0, 1080, 1000), pos='center', scrim_w=55)
def v4_essence_hero():
    return editorial('h7_essence', f'{CP}/essence/essence_mascara_model-applying_landscape.jpg', 'left', 'rgb(246,190,206)', '#3b0f26',
        WM('essence', 70, '#3b0f26', font='Jost', weight=700, ls='.02em'), 'Mascara · Lash Princess', '#c4155f', 'Lashes<br>that rule.',
        'ماسكارات إيسنس الشهيرة بتأثير الرموش الكثيفة', '#6b3a50', 'تسوّقي إيسنس', '#c4155f', '#fff',
        pos='right center', scrim_w=58)
def v4_essence_room():
    return editorial('r_essence', f'{CP}/essence/essence_lash-princess_lineup_glitter.jpg', 'right', 'rgb(250,224,234)', '#3b0f26',
        WM('essence', 64, '#3b0f26', font='Jost', weight=700, ls='.02em'), 'Lash Princess · Bestseller', '#c4155f', 'Born to<br>be royal.',
        'لاش برينسيس بتأثير الرموش الصناعية', '#6b3a50', 'تسوّقي إيسنس', '#c4155f', '#fff',
        photo_box=(0, 0, 1080, 1000), pos='center 40%', scrim_w=55)
def v4_sheglam_hero():
    return editorial('h6_sheglam', f'{CP}/sheglam/sheglam_lip-pen_three-models_hero_landscape.jpg', 'left', 'rgb(250,232,226)', '#3a1424',
        WM('SHEGLAM', 62, '#3a1424', weight=800, ls='.12em'), 'Glam for every face', '#c9416f', 'Glam,<br>together.',
        'مكياج شيغلام الرائج بألوان تناسب كل بشرة', '#7a4a5c', 'تسوّقي شيغلام', '#c9416f', '#fff',
        pos='right center', scrim_w=52)
def v4_sheglam_room():
    return editorial('r_sheglam', f'{CP}/sheglam/sheglam_color-bloom_liquid-blush_art.jpg', 'right', 'rgb(252,228,224)', '#3a1424',
        WM('SHEGLAM', 58, '#3a1424', weight=800, ls='.12em'), 'Color Bloom · Liquid Blush', '#c9416f', 'Bloom<br>in color.',
        'بلاشر كولور بلوم السائل بلمسة مخملية', '#7a4a5c', 'تسوّقي شيغلام', '#c9416f', '#fff',
        photo_box=(0, 0, 1080, 1000), pos='center', scrim_w=55)
def v4_huda_hero():
    return editorial('h3_huda', f'{CP}/huda-beauty/huda_hero_brush_landscape.jpg', 'left', 'rgb(252,240,241)', '#2a1a14',
        WM('HUDA BEAUTY', 54, '#2a1a14', weight=700, ls='.22em'), 'Dubai · Since 2013', '#b0655a', 'Beauty,<br>by Huda.',
        'منتجات هدى بيوتي الأصلية', '#6e5149', 'تسوّقي هدى بيوتي', '#2a1a14', '#fff',
        pos='right center', scrim_w=40, hsize=118)
def v4_huda_room():
    return editorial('r_huda', f'{CP}/huda-beauty/huda_empowered_model.jpg', 'right', 'rgb(38,22,16)', '#fff',
        WM('HUDA BEAUTY', 50, '#f3dcc4', weight=700, ls='.22em'), 'Empowered Palette', '#e3b07a', 'Empowered.',
        'باليت Empowered بدرجات ذهبية وبنية ساحرة', '#e8d3c0', 'تسوّقي هدى بيوتي', '#f3dcc4', '#2a1a12',
        photo_box=(0, 0, 1080, 1000), pos='center 35%', scrim_w=55)
def v4_maybelline_room():
    return editorial('r_maybelline', f'{CP}/maybelline/mny_matte-ink_shot-caller_red-lips_sq.jpg', 'left', 'rgb(246,236,232)', '#1a1a1a',
        WM('MAYBELLINE', 54, '#1a1a1a', weight=800, ls='.08em') + '<span class="lat" style="font-family:Mont;font-weight:600;font-size:21px;letter-spacing:.3em;color:#1a1a1a;margin-left:14px">NEW YORK</span>',
        'Super Stay Matte Ink', '#c8102e', 'Stay all day.', 'أحمر شفاه سائل مات يدوم حتى ١٦ ساعة', '#5e4a46', 'تسوّقي ميبيلين', '#c8102e', '#fff',
        photo_box=(1150, 0, 1000, 1000), pos='center', scrim_w=56)
def v4_astra_room():
    return editorial('r_astra', f'{CP}/astra/astra_lip-bondage_red-rope-lips_4x5.jpg', 'right', 'rgb(122,14,18)', '#fff',
        WM('ASTRA', 60, '#fff', weight=800, ls='.2em') + '<span class="lat" style="font-family:Jost;font-weight:500;font-size:22px;letter-spacing:.3em;color:#ffc9c2;margin-left:14px">MAKE-UP · ITALIA</span>',
        'Lip Bondage · Vinyl Lips', '#ffb3a8', 'Bound<br>to shine.', 'أحمر شفاه فينيل بلمعة لامعة تدوم', '#ffdcd6', 'تسوّقي أسترا', '#fff', '#7a0e12',
        photo_box=(0, 0, 1080, 1000), pos='center 40%', scrim_w=55)
def v4_artdeco_room():
    return editorial('r_artdeco', f'{CP}/artdeco/artdeco_blusher_carnations-model_2x1.jpg', 'left', 'rgb(240,238,244)', '#2a1f3a',
        WM('ARTDECO', 58, '#2a1f3a', font='Cinzel', weight=700, ls='.16em'), 'Blusher · Germany', '#b0517a', 'In full<br>bloom.',
        'بلاشر آرتديكو بلمسة وردية طبيعية', '#5d4f6c', 'تسوّقي آرتديكو', '#2a1f3a', '#fff',
        pos='right center', scrim_w=44)

# ------------------------------------------------------------------ spotlight cards (1080x1350 portrait)
def card(name, photo, pos, scrim, ink, word, kicker, kcol, headline, sub, scol, cta, cbg, cink, fit='cover', hsize=104):
    W, H = 1080, 1350
    clear = scrim.replace('rgb(', 'rgba(').replace(')', ',0)')
    body = f"""
<div class="a" style="inset:0;background:url('file://{photo}') {pos}/{fit} no-repeat"></div>
<div class="a" style="inset:0;background:linear-gradient(0deg,{scrim} 0%,{scrim} 30%,{clear} 62%)"></div>
<div class="a" style="left:70px;right:70px;bottom:70px;display:flex;flex-direction:column;align-items:flex-start;z-index:50;color:{ink};direction:ltr;text-align:left">
  <div>{word}</div>
  <div class="kick" style="font-size:22px;color:{kcol};margin-top:18px">{kicker}</div>
  <div style="font-family:Play;font-style:italic;font-weight:500;font-size:{hsize}px;line-height:1.04;margin-top:8px;white-space:nowrap">{headline}</div>
  <div style="font-family:Tajawal;font-weight:500;font-size:36px;color:{scol};margin-top:12px;direction:rtl;white-space:nowrap">{sub}</div>
  <div style="margin-top:26px;direction:rtl"><span class="cta" style="font-size:34px;padding:17px 44px;background:{cbg};color:{cink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W, H, body)

def cards():
    out = []
    out.append(card('c_rybella', f'{RYB}/ryb-news-shades-lipstick.webp', '78% center', 'rgb(234,236,241)', '#141414', RYB_WORD(44, '#141414'),
        'Italian Beauty', '#e2007a', 'Nude,<br>redefined.', 'الوكيل الحصري في العراق', '#5b4c55', 'تسوّقي ريبيلا', '#e2007a', '#fff'))
    out.append(card('c_grigi', f'{CAT}/aw24_p01_2536.jpeg', 'center 20%', 'rgb(98,10,34)', '#fff', GRIGI_WORD(60, '#fff'),
        'Fall · Winter', '#ffc9d6', 'Black &amp; Berry', 'الوكيل الحصري في العراق', '#ffdbe4', 'تسوّقي كريجي', '#fff', '#6d0c26', hsize=92))
    out.append(card('c_huda', f'{CP}/huda-beauty/huda_blush_filter_beauty.jpg', 'center 25%', 'rgb(250,236,236)', '#2a1a14', WM('HUDA BEAUTY', 34, '#2a1a14', weight=700, ls='.22em'),
        'Blush Filter', '#b0655a', 'Flushed<br>&amp; filtered.', 'بلاشر فلتر السائل بلمسة طبيعية', '#6e5149', 'تسوّقي هدى بيوتي', '#2a1a14', '#fff'))
    out.append(card('c_catrice', f'{CP}/catrice/catrice_hd-liquid-coverage_model_portrait.jpg', 'center 20%', 'rgb(232,226,220)', '#1d1a1a', WM('CATRICE', 40, '#1d1a1a', weight=800, ls='.14em'),
        'HD Liquid Coverage', '#9a6b4f', 'Coverage<br>that lasts.', 'كريم أساس بتغطية عالية', '#5b514c', 'تسوّقي كاتريس', '#1d1a1a', '#fff'))
    out.append(card('c_essence', f'{CP}/essence/essence_mascara_model-applying_landscape.jpg', '78% center', 'rgb(244,186,204)', '#3b0f26', WM('essence', 48, '#3b0f26', font='Jost', weight=700, ls='.02em'),
        'Mascara', '#c4155f', 'Lashes<br>that rule.', 'ماسكارات إيسنس الشهيرة', '#6b3a50', 'تسوّقي إيسنس', '#c4155f', '#fff'))
    out.append(card('c_sheglam', f'{CP}/sheglam/sheglam_color-bloom_liquid-blush_art.jpg', 'center 30%', 'rgb(250,226,222)', '#3a1424', WM('SHEGLAM', 40, '#3a1424', weight=800, ls='.12em'),
        'Color Bloom', '#c9416f', 'Bloom<br>in color.', 'بلاشر سائل بلمسة مخملية', '#7a4a5c', 'تسوّقي شيغلام', '#c9416f', '#fff'))
    out.append(card('c_maybelline', f'{CP}/maybelline/mny_matte-ink_seductress_model_portrait.jpg', 'center 20%', 'rgb(246,240,238)', '#1a1a1a', WM('MAYBELLINE', 38, '#1a1a1a', weight=800, ls='.08em'),
        'Super Stay Matte Ink', '#c8102e', 'Stay<br>all day.', 'أحمر شفاه سائل يدوم طويلاً', '#5e4a46', 'تسوّقي ميبيلين', '#c8102e', '#fff'))
    out.append(card('c_astra', f'{CP}/astra/astra_lip-creamynal_model-red_4x5.jpg', 'center 20%', 'rgb(150,18,30)', '#fff', WM('ASTRA', 44, '#fff', weight=800, ls='.2em'),
        'Make-up · Italia', '#ffb3a8', 'Italian<br>red.', 'أحمر شفاه كريمي إيطالي', '#ffdcd6', 'تسوّقي أسترا', '#fff', '#96121e'))
    out.append(card('c_artdeco', f'{CP}/artdeco/artdeco_bronzer_model_sq.jpg', 'center 25%', 'rgb(236,232,238)', '#2a1f3a', WM('ARTDECO', 42, '#2a1f3a', font='Cinzel', weight=700, ls='.16em'),
        'Germany · Since 1985', '#9b5fa3', 'Sun-kissed<br>glow.', 'بلاشر وبرونزر آرتديكو', '#5d4f6c', 'تسوّقي آرتديكو', '#2a1f3a', '#fff'))
    return out
def v4_nyx_hero():
    return editorial('h8_nyx', f'{CP}/nyx/nyx_buttermelt_bronzer_model.jpg', 'left', 'rgb(232,112,46)', '#fff',
        WM('NYX', 92, '#fff', weight=900, ls='.04em') + '<span class="lat" style="font-family:Mont;font-weight:600;font-size:21px;letter-spacing:.3em;color:#ffe0c8;margin-left:16px">PROFESSIONAL MAKEUP</span>',
        'Buttermelt Bronzer', '#ffe0c8', 'Melt into<br>glow.', 'برونزر بترميلت بلمسة دافئة ناعمة', '#fff1e6', 'تسوّقي نيكس', '#fff', '#c4541c',
        photo_box=(1150, 0, 1000, 1000), pos='center 30%', scrim_w=56)
def v4_nyx_room():
    return editorial('r_nyx', f'{CP}/nyx/nyx_butter_gloss_model_crop.jpg', 'right', 'rgb(160,140,196)', '#fff',
        WM('NYX', 86, '#fff', weight=900, ls='.04em'), 'Butter Gloss', '#f3e8ff', 'Butter<br>me up.', 'غلوس بتر الناعم غير اللزج', '#f6f0ff', 'تسوّقي نيكس', '#fff', '#5e4a8c',
        photo_box=(0, 0, 1080, 1000), pos='center 40%', scrim_w=55)
def v4_mufe_hero():
    return editorial('h4_mufe', f'{CP}/make-up-for-ever/mufe_lip_campaign_duo_models.jpg', 'left', 'rgb(232,222,236)', '#141414',
        WM('MAKE UP FOR EVER', 42, '#141414', font='Jost', weight=500, ls='.3em'), 'Professional · Paris', '#a65a86', 'Made<br>to last.',
        'مكياج احترافي من باريس', '#5a4c5c', 'تسوّقي ميك أب فور إيفر', '#141414', '#fff',
        photo_box=(1150, 0, 1000, 1000), pos='center', scrim_w=56)
def v4_rybella_room():
    return editorial('r_rybella', f'{RYB}/ryb-bb-cream.webp', 'left', 'rgb(250,244,242)', '#141414',
        RYB_WORD(56, '#141414'), 'Shade Y Love · BB Cream', '#e2007a', 'Skin,<br>simplified.', 'كريم BB بحماية SPF 50 من ريبيلا', '#5b4c55',
        'تسوّقي ريبيلا', '#e2007a', '#fff', pos='right center', scrim_w=44)
def card_extra():
    card('c_nyx', f'{CP}/nyx/nyx_buttermelt_bronzer_model.jpg', 'center 25%', 'rgb(228,108,44)', '#fff', WM('NYX', 52, '#fff', weight=900, ls='.04em'),
        'Buttermelt', '#ffe0c8', 'Melt into<br>glow.', 'برونزر وبلاشر بترميلت', '#fff1e6', 'تسوّقي نيكس', '#fff', '#c4541c')
    card('c_mufe', f'{CP}/make-up-for-ever/mufe_lip_campaign_duo_models.jpg', 'center 30%', 'rgb(226,214,232)', '#141414', WM('MAKE UP FOR EVER', 28, '#141414', font='Jost', weight=500, ls='.3em'),
        'Professional · Paris', '#a65a86', 'Made<br>to last.', 'مكياج احترافي من باريس', '#5a4c5c', 'تسوّقي ميك أب فور إيفر', '#141414', '#fff')
