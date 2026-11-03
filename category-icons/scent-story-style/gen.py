# Scent Story design generator: HTML templates -> headless Chrome PNG.
# usage: python3 gen.py [name-filter]
import os, sys, subprocess, json, html, re
ROOT = os.path.dirname(os.path.abspath(__file__))
CUT = os.path.join(ROOT, 'cutF'); OUT = os.path.join(ROOT, 'out'); FONTS = os.path.join(ROOT, 'fonts')
os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(ROOT, 'html'), exist_ok=True)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

FONT_CSS = f"""
@font-face{{font-family:Messiri;src:url('file://{FONTS}/ElMessiri[wght].ttf');font-weight:400 700}}
@font-face{{font-family:Tajawal;src:url('file://{FONTS}/Tajawal-Medium.ttf');font-weight:500}}
@font-face{{font-family:Tajawal;src:url('file://{FONTS}/Tajawal-Bold.ttf');font-weight:700}}
@font-face{{font-family:Tajawal;src:url('file://{FONTS}/Tajawal-ExtraBold.ttf');font-weight:800}}
@font-face{{font-family:Cormorant;src:url('file://{FONTS}/CormorantGaramond[wght].ttf');font-weight:300 700}}
@font-face{{font-family:Cinzel;src:url('file://{FONTS}/Cinzel[wght].ttf');font-weight:400 900}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:100%;height:100%;overflow:hidden}}
body{{direction:rtl;font-family:Tajawal,sans-serif;-webkit-font-smoothing:antialiased}}
.kick{{font-family:Cormorant;font-weight:600;letter-spacing:.32em;text-transform:uppercase;direction:ltr;unicode-bidi:isolate}}
.ttl{{font-family:Messiri;font-weight:700;line-height:1.05}}
.sub{{font-family:Tajawal;font-weight:500;line-height:1.35}}
.cta{{display:inline-flex;align-items:center;gap:.5em;font-family:Tajawal;font-weight:800;border-radius:999px}}
.prods{{position:absolute;display:flex;align-items:flex-end;justify-content:center}}
.prods img{{display:block;object-fit:contain;filter:drop-shadow(0 26px 30px rgba(20,8,30,.28)) drop-shadow(0 6px 8px rgba(20,8,30,.18))}}
.floor{{position:absolute;border-radius:50%}}
"""

def P(code): return f"file://{CUT}/{code}.png"

from PIL import Image as _I
_AR = {}
def _ar(c):
    if c not in _AR:
        w, h = _I.open(f"{CUT}/{c}.png").size; _AR[c] = w / h
    return _AR[c]
def prods_html(items, box, gap=-40, maxw=None):
    """items: (code, height). Heights are scaled down together so the group fits maxw."""
    if maxw is None:
        m = re.search(r'width:(\d+)px', box); maxw = int(m.group(1)) if m else 900
    total = sum(_ar(c) * h for c, h in items) + gap * (len(items) - 1)
    k = min(1.0, maxw / total) if total > 0 else 1
    imgs = ''.join(f'<img src="{P(c)}" style="height:{int(h*k)}px;margin:0 {gap*k/2}px">' for c, h in items)
    return f'<div class="prods" style="{box}">{imgs}</div>'

def page(w, h, body, css=''):
    return f"""<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>{FONT_CSS}
body{{width:{w}px;height:{h}px;position:relative}} {css}</style></head><body>{body}</body></html>"""

def render(name, w, h, doc, transparent=False):
    hp = os.path.join(ROOT, 'html', name + '.html'); open(hp, 'w').write(doc)
    out = os.path.join(OUT, name + '.png')
    args = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
            f'--window-size={w},{h}', '--force-device-scale-factor=1', '--virtual-time-budget=4000', f'--screenshot={out}']
    if transparent: args.append('--default-background-color=00000000')
    subprocess.run(args + ['file://' + hp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    print('rendered', name, os.path.exists(out))

# ------------------------------------------------------------------ HEROES 2150x1000
THEMES = {
  'plum':   dict(bg='radial-gradient(1200px 900px at 24% 64%, #FFFFFF 0%, #F1E8F8 42%, #DCC8EE 100%)', ink='#2A1238', sub='#5B4470', acc='#7A4FA8', cta_bg='#2A1238', cta_ink='#F7EEFF', floor='rgba(70,30,100,.20)', glow='rgba(255,255,255,.9)'),
  'blush':  dict(bg='radial-gradient(1100px 900px at 24% 62%, #FFFFFF 0%, #FBE7EE 40%, #F2CDDA 100%)', ink='#3A1530', sub='#6E4560', acc='#B9567F', cta_bg='#3A1530', cta_ink='#FFF4F7', floor='rgba(120,40,80,.18)', glow='rgba(255,255,255,.85)'),
  'ink':    dict(bg='radial-gradient(1100px 900px at 24% 64%, #FFFFFF 0%, #E6EDF4 42%, #C3D2E1 100%)', ink='#0F1E30', sub='#3E5570', acc='#2E557E', cta_bg='#0F1E30', cta_ink='#F1F5FA', floor='rgba(20,40,70,.22)', glow='rgba(255,255,255,.9)'),
  'champ':  dict(bg='radial-gradient(1100px 900px at 24% 64%, #FFFDF8 0%, #F3E7D3 45%, #DEC7A2 100%)', ink='#231A10', sub='#5E4A33', acc='#8A6A3A', cta_bg='#231A10', cta_ink='#F7EEDC', floor='rgba(90,60,20,.20)', glow='rgba(255,255,255,.9)'),
}

def hero(name, theme, kicker, title, sub, cta, items):
    t = THEMES[theme]
    body = f"""
<div style="position:absolute;inset:0;background:{t['bg']}"></div>
<div style="position:absolute;left:120px;top:80px;width:1000px;height:900px;border-radius:50%;background:radial-gradient(closest-side,{t['glow']},transparent)"></div>
<div style="position:absolute;left:170px;top:96px;width:900px;height:880px;border-radius:450px 450px 0 0;border:3px solid {t['acc']};opacity:.5"></div>
<div class="floor" style="left:150px;top:840px;width:940px;height:110px;background:radial-gradient(closest-side,{t['floor']},transparent)"></div>
{prods_html(items, 'left:190px;bottom:120px;width:860px;height:760px', gap=-24)}
<div style="position:absolute;right:110px;top:0;bottom:0;width:960px;display:flex;flex-direction:column;justify-content:center;gap:34px;color:{t['ink']}">
  <div class="kick" style="font-size:44px;color:{t['acc']};text-align:right">{kicker}</div>
  <div class="ttl" style="font-size:156px;white-space:nowrap">{title}</div>
  <div style="width:150px;height:4px;background:{t['acc']};border-radius:4px"></div>
  <div class="sub" style="font-size:58px;color:{t['sub']}">{sub}</div>
  <div><span class="cta" style="font-size:52px;padding:26px 64px;background:{t['cta_bg']};color:{t['cta_ink']}">{cta} <span style="font-size:.9em">←</span></span></div>
</div>"""
    render(name, 2150, 1000, page(2150, 1000, body))

# ------------------------------------------------------------------ TILE 3:4 (900x1200)
def tile(name, bg, ink, acc, kicker, title, sub, items, arch='rgba(255,255,255,.55)'):
    body = f"""
<div style="position:absolute;inset:0;background:{bg}"></div>
<div style="position:absolute;left:110px;right:110px;top:330px;bottom:120px;border-radius:340px 340px 40px 40px;background:{arch}"></div>
<div class="floor" style="left:120px;right:120px;bottom:96px;height:90px;background:radial-gradient(closest-side,rgba(0,0,0,.20),transparent)"></div>
{prods_html(items, 'left:40px;right:40px;bottom:130px;height:760px', gap=-26, maxw=780)}
<div style="position:absolute;top:70px;left:0;right:0;text-align:center;color:{ink}">
  <div class="kick" style="font-size:36px;color:{acc}">{kicker}</div>
  <div class="ttl" style="font-size:128px;margin-top:14px">{title}</div>
  <div class="sub" style="font-size:44px;margin-top:10px;opacity:.85">{sub}</div>
</div>"""
    render(name, 900, 1200, page(900, 1200, body))

# ------------------------------------------------------------------ BRAND POSTER 4:5 (1080x1350)
def poster(name, bg, ink, acc, brand, tagline, items, brand_font='Cinzel', brand_size=104, arch='rgba(255,255,255,.5)'):
    body = f"""
<div style="position:absolute;inset:0;background:{bg}"></div>
<div style="position:absolute;left:150px;right:150px;top:330px;bottom:190px;border-radius:400px 400px 30px 30px;background:{arch}"></div>
<div class="floor" style="left:150px;right:150px;bottom:165px;height:90px;background:radial-gradient(closest-side,rgba(0,0,0,.22),transparent)"></div>
{prods_html(items, 'left:40px;right:40px;bottom:195px;height:820px', gap=-20, maxw=940)}
<div style="position:absolute;top:84px;left:0;right:0;text-align:center;color:{ink}">
  <div style="font-family:{brand_font};font-weight:600;font-size:{brand_size}px;letter-spacing:.12em;direction:ltr">{brand}</div>
  <div style="width:110px;height:3px;background:{acc};margin:26px auto 0;border-radius:3px"></div>
</div>
<div style="position:absolute;bottom:58px;left:0;right:0;text-align:center;color:{ink}">
  <div class="ttl" style="font-size:72px">{tagline}</div>
</div>"""
    render(name, 1080, 1350, page(1080, 1350, body))

# ------------------------------------------------------------------ EDITORIAL 3:2 (1800x1200)
def editorial(name, theme, kicker, title, sub, cta, items):
    t = THEMES[theme]
    body = f"""
<div style="position:absolute;inset:0;background:{t['bg']}"></div>
<div style="position:absolute;left:120px;top:180px;width:820px;height:820px;border-radius:50%;background:radial-gradient(closest-side,{t['glow']},transparent)"></div>
<div style="position:absolute;left:150px;top:230px;width:760px;height:870px;border-radius:380px 380px 0 0;border:3px solid {t['acc']};opacity:.5"></div>
<div class="floor" style="left:90px;top:1010px;width:880px;height:110px;background:radial-gradient(closest-side,{t['floor']},transparent)"></div>
{prods_html(items, 'left:150px;bottom:130px;width:760px;height:760px', gap=-24)}
<div style="position:absolute;right:100px;top:0;bottom:0;width:720px;display:flex;flex-direction:column;justify-content:center;gap:30px;color:{t['ink']}">
  <div class="kick" style="font-size:42px;color:{t['acc']};text-align:right">{kicker}</div>
  <div class="ttl" style="font-size:150px;white-space:nowrap">{title}</div>
  <div style="width:130px;height:4px;background:{t['acc']};border-radius:4px"></div>
  <div class="sub" style="font-size:56px;color:{t['sub']}">{sub}</div>
  <div><span class="cta" style="font-size:50px;padding:24px 60px;background:{t['cta_bg']};color:{t['cta_ink']}">{cta} <span>←</span></span></div>
</div>"""
    render(name, 1800, 1200, page(1800, 1200, body))

# ------------------------------------------------------------------ CATEGORY ICON 1024 transparent
def icon(name, disk, items, ring='rgba(255,255,255,.9)'):
    body = f"""
<div style="position:absolute;left:92px;top:150px;width:840px;height:840px;border-radius:50%;background:{disk};box-shadow:inset 0 0 0 10px {ring}"></div>
<div class="floor" style="left:230px;right:230px;bottom:120px;height:70px;background:radial-gradient(closest-side,rgba(40,10,40,.25),transparent)"></div>
{prods_html(items, 'left:60px;right:60px;bottom:150px;height:840px', gap=-40, maxw=860)}"""
    render(name, 1024, 1024, page(1024, 1024, body, 'html,body{background:transparent}'), transparent=True)

SPECS = []
def add(fn, name, *a, **k): SPECS.append((name, fn, a, k))

# heroes
add(hero, 'hero1_main', 'plum', 'A SCENT STORY', 'حكاية عطر', 'أشهر العطور العالمية الأصلية<br>من أرقى دور العطور', 'تسوّقي الآن',
    [('afabd1f0', 470), ('9cf37e14', 560), ('de423746', 500), ('20f674d1', 560)])
add(hero, 'hero2_her', 'blush', 'FOR HER', 'عطور تُشبهكِ', 'أنوثة تبقى معكِ طوال اليوم<br>Good Girl · La Vie Est Belle · Bloom', 'تسوّقي عطور النساء',
    [('901178c2', 560), ('20f674d1', 640), ('099c7447', 520), ('618aeea0', 500)])
add(hero, 'hero3_him', 'ink', 'FOR HIM', 'حضور لا يُنسى', 'عطور رجالية بتوقيعات عالمية<br>Sauvage · Bleu de Chanel · Eros', 'تسوّق عطور الرجال',
    [('5f3058eb', 500), ('af92e3c2', 560), ('c76549bf', 600), ('2a563e6a', 470)])
add(hero, 'hero4_niche', 'champ', 'NICHE & LUXURY', 'عطور النيش', 'توقيعات نادرة من أرقى الدور<br>Tom Ford · Creed · Parfums de Marly', 'اكتشفي النيش',
    [('a8d3b494', 520), ('f96f644e', 500), ('ebe6dd7b', 600), ('de4223cf', 520)])
# gender tiles
add(tile, 'g_her', 'linear-gradient(180deg,#FBE9EF,#F3D3DF)', '#3A1530', '#B9567F', 'FOR HER', 'لها', 'أنوثة ونعومة', [('a8accf6a', 600), ('618aeea0', 520)])
add(tile, 'g_him', 'linear-gradient(180deg,#E3EAF1,#C9D6E3)', '#13233A', '#5D7896', 'FOR HIM', 'له', 'حضور وثقة', [('2a563e6a', 560), ('bbcc3a3d', 500)])
add(tile, 'g_uni', 'linear-gradient(180deg,#F6EFE3,#E8D9BF)', '#2A2114', '#8A6A3A', 'UNISEX', 'للجنسين', 'عطور تُشارَك', [('a8d3b494', 560), ('de312a42', 560)])
# mist + gifts tiles
add(tile, 't_mist', 'linear-gradient(180deg,#EEF6F1,#D5EADF)', '#14342A', '#3F8A6B', 'BODY & HAIR MIST', 'رذاذ الجسم', 'انتعاش يرافقكِ', [('82fce0a3', 560), ('b9fce3bf', 600), ('f613932d', 560)])
add(tile, 't_gift', 'linear-gradient(180deg,#F7EDE6,#EBD5C6)', '#3A1E14', '#A0623F', 'GIFT SETS', 'أطقم الهدايا', 'هدية جاهزة بلمسة فاخرة', [('9298178b', 380), ('68a661fe', 420)])
# brand posters
B = [
 ('p_chanel', 'linear-gradient(180deg,#FBF8F2,#ECE4D6)', '#111', '#111', 'CHANEL', 'أناقة باريسية خالدة', [('afabd1f0', 560), ('c4baae0c', 640)]),
 ('p_dior', 'linear-gradient(180deg,#FBF1F3,#EED9DF)', '#2B1B22', '#B48A96', 'DIOR', 'سحر لا يُقاوَم', [('de423746', 560), ('af92e3c2', 600)]),
 ('p_ysl', 'linear-gradient(180deg,#F7E4EC,#E7C2D2)', '#1A0A12', '#B0306A', 'YSL', 'جرأة تُشعل الليل', [('9cf37e14', 620), ('c29f12d5', 560)]),
 ('p_armani', 'linear-gradient(180deg,#F2EEF8,#DCD3EA)', '#221A33', '#7A6A9C', 'ARMANI', 'رُقيّ إيطالي', [('d710debc', 560), ('2ba00cbc', 560)]),
 ('p_ch', 'linear-gradient(180deg,#F8E9EC,#E3C3CB)', '#2A1220', '#9E3E5C', 'CAROLINA HERRERA', 'الكعب الأيقوني', [('20f674d1', 640), ('d1e5458e', 600)]),
 ('p_paco', 'linear-gradient(180deg,#FBF4E2,#EBD8A6)', '#2A1F08', '#A07A20', 'RABANNE', 'بريق الذهب', [('f08ff434', 480), ('10e6bed8', 600)]),
 ('p_valentino', 'linear-gradient(180deg,#FCEDF0,#F2D2DA)', '#3A1220', '#C24B6A', 'VALENTINO', 'روح روما', [('618aeea0', 560), ('54e7c18f', 560)]),
 ('p_tomford', 'linear-gradient(180deg,#F4ECDF,#DCCBAF)', '#1A140C', '#8A6A3A', 'TOM FORD', 'فخامة داكنة', [('de4223cf', 600), ('a8d3b494', 600)]),
 ('p_dg', 'linear-gradient(180deg,#EAF4FB,#CFE3F2)', '#0F2A40', '#3E7FB0', 'DOLCE&amp;GABBANA', 'صيف المتوسط', [('1742ffe9', 560), ('9483c9ea', 600)]),
 ('p_gucci', 'linear-gradient(180deg,#F3F2E8,#DEE0CC)', '#1F2615', '#6E7A45', 'GUCCI', 'حديقة من الزهور', [('099c7447', 560), ('2f49947a', 600)]),
]
for n, bg, ink, acc, br, tg, it in B:
    add(poster, n, bg, ink, acc, br, tg, it, brand_size=(64 if len(br) > 14 else 80) if len(br) > 10 else 104,
        arch='rgba(255,255,255,.55)')
# editorials
add(editorial, 'e_her', 'blush', 'FOR HER', 'لها', 'عطور نسائية من أشهر الدور العالمية', 'تسوّقي الآن', [('9cf37e14', 600), ('20f674d1', 680), ('901178c2', 600)])
add(editorial, 'e_him', 'ink', 'FOR HIM', 'له', 'توقيعات رجالية تترك أثراً', 'تسوّق الآن', [('5f3058eb', 560), ('af92e3c2', 620), ('c76549bf', 660)])
add(editorial, 'e_niche', 'champ', 'NICHE', 'النيش', 'عطور نادرة لمن يبحث عن التميّز', 'اكتشفي الآن', [('a8d3b494', 600), ('ebe6dd7b', 680), ('f96f644e', 560)])
# category icons
add(icon, 'i_women', 'radial-gradient(circle at 50% 40%,#FFF4F7,#F3CFDC)', [('20f674d1', 760)])
add(icon, 'i_men', 'radial-gradient(circle at 50% 40%,#EEF3F8,#C8D6E4)', [('af92e3c2', 720)])
add(icon, 'i_unisex', 'radial-gradient(circle at 50% 40%,#FBF6EC,#E6D5B5)', [('de312a42', 760)])
add(icon, 'i_niche', 'radial-gradient(circle at 50% 40%,#F6EFE2,#D9C29A)', [('de4223cf', 740)])
add(icon, 'i_new', 'radial-gradient(circle at 50% 40%,#F5F0FB,#DCCDF0)', [('618aeea0', 720)])
add(icon, 'i_mist', 'radial-gradient(circle at 50% 40%,#F1FAF5,#CDE8DA)', [('b9fce3bf', 760)])
add(icon, 'i_hair', 'radial-gradient(circle at 50% 40%,#FBF1F8,#EBCFE4)', [('f613932d', 760)])
add(icon, 'i_gifts', 'radial-gradient(circle at 50% 40%,#FBF3EC,#EBD3C2)', [('9298178b', 520)])


add(icon, 'i_oud', 'radial-gradient(circle at 50% 40%,#FBF3E6,#E2C79A)', [('489041a8', 760)])
add(icon, 'i_musk', 'radial-gradient(circle at 50% 40%,#F6F1FB,#D9CBEA)', [('c955fa1f', 760)])
add(icon, 'i_mini', 'radial-gradient(circle at 50% 40%,#FDF1F5,#F0CDDA)', [('f5fe167b', 780)])
add(icon, 'i_kids', 'radial-gradient(circle at 50% 40%,#FFF6E8,#F6D7B0)', [('1f738621', 420)])
add(icon, 'i_perfume', 'radial-gradient(circle at 50% 40%,#F7F1FC,#DCC8EE)', [('afabd1f0', 560), ('20f674d1', 700), ('af92e3c2', 600)])

if __name__ == '__main__':
    flt = sys.argv[1] if len(sys.argv) > 1 else ''
    for name, fn, a, k in SPECS:
        if flt in name: fn(name, *a, **k)
