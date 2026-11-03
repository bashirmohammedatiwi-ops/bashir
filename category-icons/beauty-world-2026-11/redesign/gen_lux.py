# Beauty Spell "stage" designs: podium + spotlight + reflection. HTML → headless Chrome.
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from gen_beauty import C, render, page, MARK, GRIGI, RYB

def ar(code):
    w, h = Image.open(C(code)).size; return w / h

def row(items, cx, base, gap=-30, maxw=760, reflect=True, shadow='rgba(0,0,0,.30)'):
    """items: (code, height[, rot]) standing on y=base (px from top), centred on cx; scaled to fit maxw."""
    items = [(i + (0,))[:3] for i in items]
    tot = sum(ar(c) * h for c, h, _ in items) + gap * (len(items) - 1)
    s = min(1, maxw / tot); x = cx - tot * s / 2; out = []
    for k, (c, h, r) in enumerate(items):
        hh = h * s; w = ar(c) * hh
        z = 10 - abs(k - (len(items) - 1) / 2)
        refl = ('-webkit-box-reflect:below -2px linear-gradient(transparent 78%,rgba(255,255,255,.22));' if reflect and not r else '')
        out.append(f'<img src="file://{C(c)}" style="position:absolute;left:{x:.0f}px;top:{base - hh:.0f}px;height:{hh:.0f}px;width:{w:.0f}px;'
                   f'transform:rotate({r}deg);transform-origin:50% 100%;z-index:{z:.0f};{refl}'
                   f'filter:drop-shadow(0 22px 26px {shadow}) drop-shadow(0 4px 6px rgba(0,0,0,.12))">')
        x += w + gap * s
    return ''.join(out)

def podium(cx, top, w1, w2, t1, t2, side1, side2, rim):
    """two-tier cylinder podium. top = y of upper tier's top ellipse centre."""
    e2, e1 = int(w2 * .13), int(w1 * .13); h2 = 96; y1 = top + h2
    def tier(w, e, y, h, t, s):
        return (f'<div style="position:absolute;left:{cx - w / 2:.0f}px;top:{y}px;width:{w}px;height:{h}px;background:{s}"></div>'
                f'<div style="position:absolute;left:{cx - w / 2:.0f}px;top:{y + h - e / 2:.0f}px;width:{w}px;height:{e}px;border-radius:50%;background:{s}"></div>'
                f'<div style="position:absolute;left:{cx - w / 2:.0f}px;top:{y - e / 2:.0f}px;width:{w}px;height:{e}px;border-radius:50%;background:{t};box-shadow:inset 0 0 0 3px {rim}"></div>')
    return tier(w1, e1, y1, 400, t1, side1) + tier(w2, e2, top, h2, t2, side2)

def sparkles(pts, col):
    return ''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{r}px;height:{r}px;background:{col};'
                   f'clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);opacity:.9"></div>' for x, y, r in pts)

def stage(name, T, mark, kicker, title, sub, cta, items, W=2150, H=1000, cx=560, maxw=820):
    maxw = min(maxw, 940)
    """T: theme dict bg, glow, ring, t1,t2,side1,side2,rim, ink, sub_ink, acc, cta_bg, cta_ink, spark"""
    top = 742
    body = f"""
<div style="position:absolute;inset:0;background:{T['bg']}"></div>
<div style="position:absolute;left:{cx - 620}px;top:-180px;width:1240px;height:1240px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
<div style="position:absolute;left:{cx - 400}px;top:90px;width:800px;height:800px;border-radius:50%;border:3px solid {T['ring']};opacity:.65"></div>
<div style="position:absolute;left:{cx - 372}px;top:118px;width:744px;height:744px;border-radius:50%;border:1px solid {T['ring']};opacity:.35"></div>
{sparkles([(cx - 470, 170, 46), (cx + 400, 250, 30), (cx + 330, 120, 18), (cx - 380, 560, 22)], T['spark'])}
{podium(cx, top, 1060, 780, T['t1'], T['t2'], T['side1'], T['side2'], T['rim'])}
{row(items, cx, top + 8, maxw=maxw)}
<div style="position:absolute;right:120px;top:0;bottom:0;width:{W - 1300}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:24px;color:{T['ink']};text-align:right;z-index:20">
  <div class="kick" style="font-size:34px;color:{T['acc']}">{kicker}</div>
  <div>{mark}</div>
  <div style="width:130px;height:4px;border-radius:4px;background:{T['acc']}"></div>
  <div class="ttl" style="font-size:104px;white-space:nowrap">{title}</div>
  <div class="sub" style="font-size:46px;color:{T['sub_ink']};white-space:nowrap">{sub}</div>
  <div style="margin-top:10px"><span class="cta" style="font-size:44px;padding:22px 56px;background:{T['cta_bg']};color:{T['cta_ink']}">{cta} <span>←</span></span></div>
</div>"""
    render(name, W, H, page(W, H, body))

def card(name, T, mark, title, sub, items, W=1080, H=1350):
    """portrait editorial card: text on top, podium at bottom."""
    cx = W // 2; top = 1120
    body = f"""
<div style="position:absolute;inset:0;background:{T['bg']}"></div>
<div style="position:absolute;left:{cx - 560}px;top:380px;width:1120px;height:1120px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
<div style="position:absolute;left:{cx - 380}px;top:420px;width:760px;height:760px;border-radius:50%;border:3px solid {T['ring']};opacity:.6"></div>
{sparkles([(cx - 420, 560, 38), (cx + 360, 640, 24), (cx + 300, 500, 16)], T['spark'])}
{podium(cx, top, 900, 640, T['t1'], T['t2'], T['side1'], T['side2'], T['rim'])}
{row(items, cx, top + 8, maxw=900)}
<div style="position:absolute;left:60px;right:60px;top:90px;text-align:center;color:{T['ink']};z-index:20">
  <div>{mark}</div>
  <div style="width:110px;height:4px;border-radius:4px;background:{T['acc']};margin:26px auto 30px"></div>
  <div class="ttl" style="font-size:96px;white-space:nowrap">{title}</div>
  <div class="sub" style="font-size:44px;color:{T['sub_ink']};margin-top:22px;white-space:nowrap">{sub}</div>
</div>"""
    render(name, W, H, page(W, H, body))

def tile(name, T, label, en, items, S=800):
    """square jewel tile for the 'shop by look' grid, label at the bottom."""
    cx = S // 2; top = 560
    body = f"""
<div style="position:absolute;inset:0;background:{T['bg']}"></div>
<div style="position:absolute;left:{cx - 420}px;top:-60px;width:840px;height:840px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
<div style="position:absolute;left:{cx - 250}px;top:70px;width:500px;height:500px;border-radius:50%;border:2px solid {T['ring']};opacity:.6"></div>
{sparkles([(cx - 300, 110, 30), (cx + 250, 180, 20)], T['spark'])}
{podium(cx, top, 620, 440, T['t1'], T['t2'], T['side1'], T['side2'], T['rim'])}
{row(items, cx, top + 6, maxw=520, reflect=False)}
<div style="position:absolute;left:0;right:0;bottom:0;height:230px;background:linear-gradient(180deg,transparent,{T['fade']} 55%);z-index:25"></div>
<div style="position:absolute;right:46px;bottom:40px;text-align:right;color:#fff;z-index:30">
  <div class="kick" style="font-size:30px;color:{T['acc']};letter-spacing:.2em">{en}</div>
  <div class="ttl" style="font-size:84px">{label}</div>
</div>"""
    render(name, S, S, page(S, S, body))

def strip(name, T, title, sub, cta, items, W=2150, H=560):
    """short full-width strip: products on a low podium left, text right."""
    cx = 520; top = 440
    body = f"""
<div style="position:absolute;inset:0;background:{T['bg']}"></div>
<div style="position:absolute;left:{cx - 520}px;top:-300px;width:1040px;height:1040px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
{sparkles([(cx - 420, 90, 34), (cx + 380, 70, 22), (1180, 420, 18)], T['spark'])}
{podium(cx, top, 860, 640, T['t1'], T['t2'], T['side1'], T['side2'], T['rim'])}
{row(items, cx, top + 6, maxw=760, reflect=False)}
<div style="position:absolute;right:110px;top:0;bottom:0;width:980px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:16px;color:{T['ink']};z-index:20">
  <div class="ttl" style="font-size:100px;white-space:nowrap">{title}</div>
  <div class="sub" style="font-size:44px;color:{T['sub_ink']};white-space:nowrap">{sub}</div>
  <div style="margin-top:6px"><span class="cta" style="font-size:38px;padding:16px 46px;background:{T['cta_bg']};color:{T['cta_ink']}">{cta} <span>←</span></span></div>
</div>"""
    render(name, W, H, page(W, H, body))

# ---------------------------------------------------------------- themes
def theme(dark, base, light, glow, ring='#D6B27A', acc=None, spark=None, fade=None):
    if dark:
        return dict(bg=f'linear-gradient(115deg,{base} 0%,{light} 55%,{base} 100%)', glow=glow, ring=ring,
                    t1='linear-gradient(180deg,#F4E6D6,#D9C2AA)', t2='linear-gradient(180deg,#FFF6EC,#EADBC8)',
                    side1='linear-gradient(90deg,#B9A08A,#E6D3BF 45%,#A88E78)', side2='linear-gradient(90deg,#CDB59E,#F3E4D3 45%,#BBA28B)',
                    rim='rgba(255,255,255,.55)', ink='#FFFFFF', sub_ink='rgba(255,255,255,.78)', acc=acc or ring,
                    cta_bg=acc or ring, cta_ink=base, spark=spark or ring, fade=fade or base)
    return dict(bg=f'linear-gradient(115deg,{light} 0%,{base} 100%)', glow=glow, ring=ring,
                t1='linear-gradient(180deg,#FFFFFF,#F1E6EA)', t2='linear-gradient(180deg,#FFFFFF,#F7F0F2)',
                side1='linear-gradient(90deg,#E2D2D8,#FFFFFF 45%,#D9C8CF)', side2='linear-gradient(90deg,#EBDFE3,#FFFFFF 45%,#E2D5DA)',
                rim='rgba(255,255,255,.9)', ink='#2A1420', sub_ink='#6A4A58', acc=acc or ring,
                cta_bg='#2A1420', cta_ink='#FFFFFF', spark=spark or ring, fade=fade or '#2A1420')

HUDA = theme(True, '#2B0F17', '#5A1E2B', 'rgba(255,190,170,.30)', acc='#E7B98A')
HUDA2 = theme(True, '#2A1A12', '#5B3A26', 'rgba(255,214,170,.30)', acc='#E9C08F')
MUFE = theme(True, '#121212', '#2F2B29', 'rgba(255,236,214,.24)', ring='#CDB89A', acc='#E2CFB4')
MUFE2 = theme(False, '#E6DBCF', '#FBF7F2', 'rgba(255,255,255,.95)', ring='#B79C7E', acc='#8C6E52')
SHEG = theme(False, '#F4C3D3', '#FFF0F5', 'rgba(255,255,255,.95)', ring='#E58AA8', acc='#C2416C')
SHEG2 = theme(False, '#F1D2C2', '#FFF5EE', 'rgba(255,255,255,.95)', ring='#D49A7A', acc='#A85A3A')
ASTRA = theme(False, '#F2C8CC', '#FFF3F2', 'rgba(255,255,255,.95)', ring='#D98A93', acc='#B23A4A')
MAYB = theme(False, '#F0BFC9', '#FFF1F4', 'rgba(255,255,255,.95)', ring='#D67C93', acc='#B0284F')
NYX = theme(True, '#161218', '#3A1E3A', 'rgba(255,90,170,.28)', ring='#F05AA6', acc='#FF7FBF', spark='#FF9ACB')
ARTD = theme(False, '#DCCFE6', '#F8F4FB', 'rgba(255,255,255,.95)', ring='#A68BC2', acc='#6E4B92')
GOLD = theme(True, '#1A1416', '#3A2A2C', 'rgba(255,214,170,.26)', acc='#E2C08F')
GRG = theme(True, '#24141E', '#4A2A3C', 'rgba(232,180,200,.30)', ring='#E8B4C8', acc='#F0C2D4')

SPECS = []
def add(fn, name, *a, **k): SPECS.append((name, fn, a, k))

M = lambda t, s=88, c='#F2D7B0', f='Cinzel', w=500, ls='.18em': MARK(t, s, c, f, w, ls)

# hero carousel (new) ----------------------------------------------------------------
add(stage, 'L_huda', HUDA, M('HUDA BEAUTY', 92, '#F4DCC0'), 'DUBAI', 'ألوان لا تُنسى', 'باليتات وأحمر شفاه بدرجات فاخرة', 'تسوّقي هدى بيوتي',
    [('o121', 330, -4), ('o157', 470), ('o124', 450), ('o129', 380)], maxw=1060)
add(stage, 'L_mufe', MUFE, M('MAKE UP FOR EVER', 64, '#EFE2D0', 'Jost', 600, '.16em'), 'PARIS · PRO', 'بشرة HD بلا عيوب', 'كريم أساس وبودرة بثبات احترافي', 'تسوّقي ميك أب فور إيفر',
    [('o222', 420), ('o221', 470), ('o224', 360), ('o223', 380)], maxw=1060)
add(stage, 'L_sheglam', SHEG, M('SHEGLAM', 104, '#4A1430', 'Mont', 800, '.04em'), 'MAKE-UP', 'وردي بلمسة ناعمة', 'بلاشر سائل وأحمر شفاه للإطلالة اليومية', 'تسوّقي شيغلام',
    [('o267', 440), ('o271', 470), ('o287', 440)], maxw=1060)

# brand rooms (banner on top of each brand group) -------------------------------------
add(stage, 'R_huda', HUDA2, M('HUDA BEAUTY', 92, '#F4DCC0'), 'DUBAI', 'بشرة مخملية', 'كونسيلر وبودرة وبرونزر للمسة مثالية', 'تسوّقي هدى بيوتي',
    [('o141', 430), ('o125', 320), ('o167', 420), ('o162', 400)], maxw=1060)
add(stage, 'R_sheglam', SHEG2, M('SHEGLAM', 104, '#3E1A10', 'Mont', 800, '.04em'), 'MAKE-UP', 'دفء الألوان الترابية', 'ظلال وكحل وكريم أساس بأسعار لطيفة', 'تسوّقي شيغلام',
    [('o279', 360, -3), ('o268', 400), ('o316', 460), ('o309', 420)], maxw=1060)
add(stage, 'R_astra', ASTRA, M('ASTRA', 108, '#3A1420'), 'MADE IN ITALY', 'لمسة إيطالية', 'خدود وشفاه وبشرة بلمسة طبيعية', 'تسوّقي أسترا',
    [('o65', 300), ('o66', 420), ('o106', 440), ('o75', 420), ('o84', 300, 4)], maxw=1060)
add(stage, 'R_mufe', MUFE2, M('MAKE UP FOR EVER', 64, '#1A1A1A', 'Jost', 600, '.16em'), 'PARIS · PRO', 'ألوان المحترفين', 'باليتات وبلاشر وهايلايتر بثبات طويل', 'تسوّقي ميك أب فور إيفر',
    [('o219', 330, -3), ('o227', 300), ('o226', 300)], maxw=1060)
add(stage, 'R_maybelline', MAYB, M('MAYBELLINE', 92, '#3B1420', 'Mont', 700, '.06em'), 'NEW YORK', 'شفاه تدوم طويلاً', 'سوبر ستاي ولِفتر غلوس بألوان جذابة', 'تسوّقي ميبيلين',
    [('o241', 440), ('o240', 430), ('o237', 470), ('o235', 430), ('o247', 420)], maxw=1060)
add(stage, 'R_nyx', NYX, M('NYX', 140, '#FFFFFF', 'Mont', 900, '.12em'), 'PROFESSIONAL MAKEUP', 'ألوان مرحة وجريئة', 'بلاشر وبرونزر وملمعات بملمس زبدي', 'تسوّقي نيكس',
    [('o252', 330, -5), ('o250', 440), ('o256', 330, 5)], maxw=1060)
add(stage, 'R_artdeco', ARTD, M('ARTDECO', 96, '#2C1A3E'), 'GERMANY', 'أناقة ألمانية', 'بلاشر وأحمر شفاه وماسكارا بألوان راقية', 'تسوّقي آرتديكو',
    [('o42', 260), ('o3', 420), ('o38', 430), ('o25', 440)], maxw=1060)

# "إطلالات الموسم" portrait cards ---------------------------------------------------------
add(card, 'C_night', HUDA, M('NIGHT OUT', 54, '#E7B98A'), 'سهرة جريئة', 'شفاه حمراء وظلال لامعة', [('g88', 560), ('o128', 400, -4), ('o157', 560)])
add(card, 'C_soft', SHEG, M('SOFT GLAM', 54, '#C2416C'), 'إطلالة يومية ناعمة', 'خدود وردية ولمعة خفيفة', [('o287', 540), ('ra391ca01', 300), ('o66', 520)])
add(card, 'C_smoky', GOLD, M('SMOKY EYES', 54, '#E2C08F'), 'عيون دخانية', 'ظلال وكحل وماسكارا', [('g116', 380, -4), ('o268', 520), ('r8791b981', 560)])
add(card, 'C_glow', MUFE2, M('GLOW SKIN', 54, '#8C6E52'), 'بشرة نديّة', 'كريم أساس وبودرة وهايلايتر', [('o221', 580), ('g83', 360), ('o226', 320)])
add(card, 'C_bride', ARTD, M('BRIDAL', 54, '#6E4B92'), 'إطلالة العروس', 'ثبات طوال اليوم بلمسة ناعمة', [('o106', 560), ('rl_cassi', 560), ('o154', 380, 3)])

# shop-by-look grid replacement (jewel tiles) ----------------------------------------------
add(tile, 'T_lips', theme(True, '#3A0E18', '#7A1F33', 'rgba(255,160,170,.32)', acc='#F2B8B0'), 'الشفاه', 'LIPS', [('g88', 360), ('o237', 380), ('rl_scarlet', 360)])
add(tile, 'T_eyes', theme(True, '#141A33', '#2E3B6B', 'rgba(170,190,255,.30)', ring='#9FB2F0', acc='#C9D4FF'), 'العيون', 'EYES', [('o154', 260, 0), ('o268', 330), ('r8791b981', 340)])
add(tile, 'T_face', theme(True, '#2A1C14', '#5A3F2E', 'rgba(255,220,190,.30)', acc='#EBC9A4'), 'الوجه', 'FACE', [('o222', 360), ('g83', 230), ('o141', 360)])
add(tile, 'T_cheeks', theme(True, '#3A1626', '#7A3050', 'rgba(255,170,200,.32)', ring='#F2A6C2', acc='#FFC4D9'), 'الخدود', 'CHEEKS', [('o287', 340), ('o65', 220)])
add(tile, 'T_brows', theme(True, '#1E1A16', '#4A3E33', 'rgba(240,215,180,.28)', acc='#E6CDA8'), 'الحواجب', 'BROWS', [('o236', 360), ('o72', 380), ('o254', 330)])
add(tile, 'T_glow', theme(True, '#2A2212', '#5E4A22', 'rgba(255,230,160,.34)', ring='#E9CF8A', acc='#F6E0A6'), 'الإشراقة', 'GLOW', [('o226', 230), ('o29', 260)])

# short strip under the new ad group ----------------------------------------------------
add(strip, 'S_budget', theme(False, '#F6D6DE', '#FFF4F7', 'rgba(255,255,255,.95)', ring='#E58AA8', acc='#C2416C'),
    'مكياج بأقل من ١٠ آلاف', 'أحمر شفاه وماسكارا وبلاشر من أشهر البراندات', 'تسوّقي الآن',
    [('o237', 330), ('rd09a5f40', 250), ('o66', 300), ('r8791b981', 330), ('o235', 300)])

if __name__ == '__main__':
    flt = sys.argv[1] if len(sys.argv) > 1 else ''
    for name, fn, a, k in SPECS:
        if flt in name: fn(name, *a, **k)
