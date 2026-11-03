# His Elegance (أناقة الرجل): "noir gentleman" designs — stone plinth, light beam, deco frame. HTML → headless Chrome.
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); SC = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(SC, 'beauty'))
from gen_beauty import page, MARK
import gen_beauty
OUT = os.path.join(HERE, 'out'); HTMLD = os.path.join(HERE, 'html'); os.makedirs(OUT, exist_ok=True); os.makedirs(HTMLD, exist_ok=True)
gen_beauty.OUT, gen_beauty.HTML = OUT, HTMLD
render = gen_beauty.render

def P(code): return os.path.join(HERE, 'cut', code + '.png')
def ar(code):
    w, h = Image.open(P(code)).size; return w / h

def row(items, cx, base, gap=-18, maxw=820, reflect=True, shadow='rgba(0,0,0,.55)'):
    items = [(i + (0,))[:3] for i in items]
    tot = sum(ar(c) * h for c, h, _ in items) + gap * (len(items) - 1)
    s = min(1, maxw / tot); x = cx - tot * s / 2; out = []
    for k, (c, h, r) in enumerate(items):
        hh = h * s; w = ar(c) * hh; z = 10 - abs(k - (len(items) - 1) / 2)
        refl = '-webkit-box-reflect:below 0 linear-gradient(transparent 82%,rgba(255,255,255,.20));' if reflect and not r else ''
        out.append(f'<img src="file://{P(c)}" style="position:absolute;left:{x:.0f}px;top:{base - hh:.0f}px;height:{hh:.0f}px;width:{w:.0f}px;'
                   f'transform:rotate({r}deg);transform-origin:50% 100%;z-index:{z:.0f};{refl}'
                   f'filter:drop-shadow(0 26px 30px {shadow}) drop-shadow(0 4px 6px rgba(0,0,0,.25))">')
        x += w + gap * s
    return ''.join(out)

def plinth(cx, base, w, T, depth=70, front=170):
    """stone plinth: perspective top face + front face, gold edge. base = y of the front edge."""
    tw = w * .86
    return (f'<div style="position:absolute;left:{cx - w / 2:.0f}px;top:{base - depth}px;width:{w}px;height:{depth}px;'
            f'clip-path:polygon({(w - tw) / 2:.0f}px 0,{(w + tw) / 2:.0f}px 0,100% 100%,0 100%);background:{T["top"]}"></div>'
            f'<div style="position:absolute;left:{cx - w / 2:.0f}px;top:{base}px;width:{w}px;height:{front}px;background:{T["front"]}"></div>'
            f'<div style="position:absolute;left:{cx - w / 2:.0f}px;top:{base - 1}px;width:{w}px;height:3px;background:{T["gold"]};opacity:.85"></div>'
            f'<div style="position:absolute;left:{cx - w / 2 - 60:.0f}px;top:{base + front - 10}px;width:{w + 120}px;height:60px;border-radius:50%;'
            f'background:radial-gradient(closest-side,rgba(0,0,0,.45),transparent)"></div>')

def beam(T, W, H):
    return (f'<div style="position:absolute;left:-10%;top:-40%;width:55%;height:180%;transform:rotate(24deg);'
            f'background:linear-gradient(90deg,transparent,{T["beam"]} 50%,transparent)"></div>'
            f'<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 30% 40%,transparent 40%,rgba(0,0,0,{T["vig"]}) 100%)"></div>')

def frame(T, inset=34):
    c = T['gold']; L = 70
    corners = ''.join(f'<div style="position:absolute;{v}:{inset}px;{h}:{inset}px;width:{L}px;height:{L}px;'
                      f'border-{v}:3px solid {c};border-{h}:3px solid {c};opacity:.8"></div>' for v in ('top', 'bottom') for h in ('left', 'right'))
    return corners + f'<div style="position:absolute;inset:{inset + 14}px;border:1px solid {c};opacity:.22"></div>'

def rule(T, w=170):
    return (f'<div style="display:flex;align-items:center;gap:12px"><span style="width:{w // 2}px;height:2px;background:{T["gold"]}"></span>'
            f'<span style="width:12px;height:12px;transform:rotate(45deg);background:{T["gold"]}"></span>'
            f'<span style="width:{w // 2}px;height:2px;background:{T["gold"]}"></span></div>')

def cta(T, text, size=42):
    return (f'<span class="cta" style="font-size:{size}px;padding:18px 50px;border:2.5px solid {T["gold"]};color:{T["cta_ink"]};'
            f'background:{T["cta_bg"]}">{text} <span>←</span></span>')

def hero(name, T, mark, kicker, title, sub, cta_txt, items, W=2150, H=1000, cx=560, maxw=880):
    base = 800
    body = f"""<div style="position:absolute;inset:0;background:{T['bg']}"></div>{beam(T, W, H)}
<div style="position:absolute;left:{cx - 520}px;top:60px;width:1040px;height:820px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
{plinth(cx, base, 1000, T)}{row(items, cx, base - 34, maxw=maxw)}{frame(T)}
<div style="position:absolute;right:130px;top:0;bottom:0;width:{W - 1300}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:22px;color:{T['ink']};text-align:right;z-index:20">
  <div class="kick" style="font-size:32px;color:{T['gold']}">{kicker}</div>
  <div>{mark}</div>{rule(T)}
  <div class="ttl" style="font-size:100px;white-space:nowrap;margin-top:4px">{title}</div>
  <div class="sub" style="font-size:44px;color:{T['sub']};white-space:nowrap">{sub}</div>
  <div style="margin-top:12px">{cta(T, cta_txt)}</div>
</div>"""
    render(name, W, H, page(W, H, body))

def wide(name, T, mark, line, items, W=2160, H=800, cx=560):
    base = 640
    body = f"""<div style="position:absolute;inset:0;background:{T['bg']}"></div>{beam(T, W, H)}
<div style="position:absolute;left:{cx - 480}px;top:20px;width:960px;height:700px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
{plinth(cx, base, 940, T, 60, 200)}{row(items, cx, base - 28, maxw=840)}{frame(T, 28)}
<div style="position:absolute;right:130px;top:0;bottom:0;width:{W - 1260}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:24px;color:{T['ink']};z-index:20">
  <div>{mark}</div>{rule(T, 150)}
  <div class="ttl" style="font-size:88px;white-space:nowrap">{line}</div>
</div>"""
    render(name, W, H, page(W, H, body))

def poster(name, T, mark, title, items, W=1080, H=1350, tsize=74):
    base = 1130; cx = W // 2
    body = f"""<div style="position:absolute;inset:0;background:{T['bg']}"></div>{beam(T, W, H)}
<div style="position:absolute;left:{cx - 520}px;top:330px;width:1040px;height:900px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
{plinth(cx, base, 940, T, 66, 260)}{row([(i[0], int(i[1] * 1.22)) + tuple(i[2:]) for i in items], cx, base - 32, maxw=900)}{frame(T, 30)}
<div style="position:absolute;left:70px;right:70px;top:110px;text-align:center;color:{T['ink']};z-index:20">
  <div>{mark}</div><div style="display:flex;justify-content:center;margin:26px 0 24px">{rule(T, 140)}</div>
  <div class="ttl" style="font-size:{tsize}px;white-space:nowrap">{title}</div>
</div>"""
    render(name, W, H, page(W, H, body))

def tile(name, T, label, en, items, S=800):
    base = 600; cx = S // 2
    body = f"""<div style="position:absolute;inset:0;background:{T['bg']}"></div>{beam(T, S, S)}
<div style="position:absolute;left:{cx - 380}px;top:40px;width:760px;height:620px;border-radius:50%;background:radial-gradient(closest-side,{T['glow']},transparent)"></div>
{plinth(cx, base, 640, T, 50, 220)}{row(items, cx, base - 24, maxw=560, reflect=False)}
<div style="position:absolute;left:0;right:0;bottom:0;height:250px;background:linear-gradient(180deg,transparent,{T['fade']} 60%);z-index:25"></div>
{frame(T, 22)}
<div style="position:absolute;right:52px;bottom:48px;text-align:right;color:#fff;z-index:30">
  <div class="kick" style="font-size:28px;color:{T['gold']};letter-spacing:.24em">{en}</div>
  <div class="ttl" style="font-size:78px;white-space:nowrap">{label}</div>
</div>"""
    render(name, S, S, page(S, S, body))

def strip(name, T, title, sub, cta_txt, items, W=2150, H=560):
    base = 470; cx = 500
    body = f"""<div style="position:absolute;inset:0;background:{T['bg']}"></div>{beam(T, W, H)}
{plinth(cx, base, 860, T, 50, 120)}{row(items, cx, base - 24, maxw=780, reflect=False)}{frame(T, 24)}
<div style="position:absolute;right:120px;top:0;bottom:0;width:1000px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:14px;color:{T['ink']};z-index:20">
  <div class="ttl" style="font-size:92px;white-space:nowrap">{title}</div>
  <div class="sub" style="font-size:42px;color:{T['sub']};white-space:nowrap">{sub}</div>
  <div style="margin-top:8px">{cta(T, cta_txt, 36)}</div>
</div>"""
    render(name, W, H, page(W, H, body))

# ---------------------------------------------------------------- themes
def dark(a, b, gold='#C9A66B', glow='rgba(255,236,200,.16)', beam_='rgba(255,240,210,.07)'):
    return dict(bg=f'linear-gradient(120deg,{a} 0%,{b} 60%,{a} 100%)', glow=glow, beam=beam_, vig=.55, gold=gold,
                top=f'linear-gradient(180deg,#3A3633,#23211F)', front='linear-gradient(180deg,#1C1A19,#0B0B0B)',
                ink='#FFFFFF', sub='rgba(255,255,255,.74)', cta_bg='rgba(0,0,0,.25)', cta_ink='#FFFFFF', fade=a)
def light(a, b, gold='#9C7A44'):
    return dict(bg=f'linear-gradient(120deg,{b} 0%,{a} 100%)', glow='rgba(255,255,255,.9)', beam='rgba(255,255,255,.35)', vig=.12, gold=gold,
                top='linear-gradient(180deg,#F7F3EC,#E4DBCD)', front='linear-gradient(180deg,#D8CCBA,#BFAF98)',
                ink='#17140F', sub='#5A5042', cta_bg='#17140F', cta_ink='#FFFFFF', fade='#2A231A')

NAVY = dark('#0B1424', '#1B2C4A')
NOIR = dark('#0B0B0C', '#262422')
COGNAC = dark('#1E0F07', '#4E2A14', gold='#D8AE6E', glow='rgba(255,200,140,.18)')
FOREST = dark('#08130E', '#1B3A2A', gold='#CFAE72', glow='rgba(200,255,220,.10)')
OXBLOOD = dark('#1A070B', '#4A1420', gold='#D9B27A', glow='rgba(255,180,170,.14)')
STEEL = dark('#11161D', '#34404F', gold='#B9C3CF', glow='rgba(220,235,255,.14)', beam_='rgba(220,235,255,.08)')
OCEAN = dark('#06141F', '#0F3A55', gold='#9FD0E6', glow='rgba(160,220,255,.16)', beam_='rgba(200,240,255,.08)')
LINEN = light('#E6DCCB', '#F7F2EA')
ROYAL = dark('#0D0A1F', '#2B2259', gold='#D6B676', glow='rgba(210,200,255,.14)')

def M(t, s=86, c='#FFFFFF', f='Cinzel', w=500, ls='.16em'): return MARK(t, s, c, f, w, ls)

SPECS = []
def add(fn, name, *a, **k): SPECS.append((name, fn, a, k))

# hero carousel -----------------------------------------------------------------
add(hero, 'H_signature', NAVY, M('HIS ELEGANCE', 80), 'GENTLEMAN', 'حضورك يبدأ بعطرك', 'أيقونات العطور الرجالية الأصلية', 'اكتشف العطور',
    [('m20', 470), ('m5', 470), ('m110', 420), ('m187', 470)])
add(hero, 'H_tomford', COGNAC, M('TOM FORD', 96), 'PRIVATE BLEND', 'فخامة بلا مساومة', 'توسكان ليذر وميرّ ميستير وتشامباكا', 'تسوّق توم فورد',
    [('m102', 430), ('m110', 470), ('m112', 430), ('m106', 400)])
add(hero, 'H_pdm', FOREST, M('PARFUMS DE MARLY', 64), 'PARIS', 'فخامة بتوقيع القصور', 'لايتون وهالتان وألتير — حضور ملكي', 'تسوّق بارفيوم دي مارلي',
    [('m237', 470), ('m240', 500), ('m241', 470)])
add(hero, 'H_dior', STEEL, M('DIOR', 120), 'PARIS', 'أيقونة سوفاج', 'سوفاج وفهرنهايت — منعش وجريء', 'تسوّق ديور',
    [('m12', 450), ('m20', 470), ('m16', 480)])
add(hero, 'H_niche', OXBLOOD, M('XERJOFF', 100), 'NICHE · ITALIA', 'فن العطر الإيطالي', 'عطور نيش نادرة بحرفية يدوية', 'تسوّق كسرجوف',
    [('m243', 430), ('m253', 430), ('m246', 400), ('m249', 420)])
add(hero, 'H_care', LINEN, M('GROOMING', 80, '#17140F'), 'DAILY ESSENTIALS', 'عناية يومية للرجل', 'مزيلات عرق وشامبو وعناية بلا عناء', 'تسوّق العناية',
    [('m332', 400), ('m335', 400), ('m501', 400), ('m433', 380), ('m437', 400)])

# marquee strips (houses) ----------------------------------------------------------
add(wide, 'W_chanel', NOIR, M('CHANEL', 92), 'بلو دو شانيل', [('m4', 440), ('m5', 470), ('m3', 440)])
add(wide, 'W_ysl', OXBLOOD, M('YVES SAINT LAURENT', 54), 'سحر الليل', [('m28', 470), ('m31', 470)])
add(wide, 'W_armani', NAVY, M('GIORGIO ARMANI', 62), 'أكوا دي جيو', [('m41', 470), ('m44', 430), ('m48', 440)])
add(wide, 'W_versace', OCEAN, M('VERSACE', 90), 'إيروس الأسطوري', [('m160', 440), ('m164', 440), ('m159', 380)])
add(wide, 'W_paco', ROYAL, M('RABANNE', 92), 'ذهب وانتصار', [('m77', 450), ('m86', 480), ('m79', 480)])
add(wide, 'W_jpg', NAVY, M('JEAN PAUL GAULTIER', 52), 'لو مال الأيقوني', [('m185', 470), ('m187', 480), ('m186', 470)])
add(wide, 'W_montblanc', STEEL, M('MONTBLANC', 84), 'روح المغامرة', [('m313', 440), ('m317', 400), ('m318', 400)])
add(wide, 'W_boss', NOIR, M('BOSS', 110), 'أناقة العمل', [('m218', 470), ('m219', 470)])

# scent families (small tiles inside the featured group) -------------------------------
add(tile, 'F_fresh', OCEAN, 'منعش', 'FRESH', [('m41', 330), ('m143', 300), ('m174', 320)])
add(tile, 'F_woody', COGNAC, 'خشبي', 'WOODY', [('m4', 320), ('m292', 300), ('m199', 300)])
add(tile, 'F_oud', OXBLOOD, 'شرقي وعود', 'OUD', [('m267', 330), ('m253', 320), ('m256', 320)])
add(tile, 'F_leather', NOIR, 'جلدي ودخاني', 'LEATHER', [('m110', 330), ('m258', 330), ('m107', 300)])
add(tile, 'F_citrus', FOREST, 'حمضي', 'CITRUS', [('m106', 320), ('m143', 300), ('m3', 300)])
add(tile, 'F_classic', NAVY, 'كلاسيكي', 'CLASSIC', [('m16', 340), ('m44', 300), ('m304', 320)])

# category tiles (replace old 4-grid) --------------------------------------------------
add(tile, 'K_men', NAVY, 'عطور رجالية', 'FOR HIM', [('m20', 340), ('m5', 340), ('m160', 300)])
add(tile, 'K_unisex', COGNAC, 'عطور للجنسين', 'UNISEX', [('m102', 320), ('m243', 330), ('m263', 320)])
add(tile, 'K_care', STEEL, 'عناية الرجل', 'GROOMING', [('m332', 300), ('m501', 300), ('m433', 280)])
add(tile, 'K_oral', OCEAN, 'الفم والأسنان', 'ORAL CARE', [('m573', 300), ('m543', 320)])

# perfume houses wall (posters) ---------------------------------------------------------
add(poster, 'P_dior', STEEL, M('DIOR', 120), 'سوفاج وفهرنهايت', [('m12', 520), ('m20', 540)])
add(poster, 'P_chanel', NOIR, M('CHANEL', 110), 'بلو دو شانيل', [('m4', 500), ('m3', 480)])
add(poster, 'P_tomford', COGNAC, M('TOM FORD', 100), 'برايفت بليند', [('m110', 500), ('m102', 480), ('m112', 480)])
add(poster, 'P_ysl', OXBLOOD, M('YSL', 130), 'لا نوي دو لوم', [('m28', 540), ('m31', 520)])
add(poster, 'P_armani', NAVY, M('ARMANI', 110), 'أكوا دي جيو وكود', [('m41', 520), ('m48', 500)])
add(poster, 'P_pdm', FOREST, M('PARFUMS DE MARLY', 58), 'فخامة القصور', [('m237', 520), ('m241', 520)])
add(poster, 'P_xerjoff', ROYAL, M('XERJOFF', 104), 'فن العطر الإيطالي', [('m243', 480), ('m249', 480)])
add(poster, 'P_jpg', OCEAN, M('JEAN PAUL GAULTIER', 50), 'أيقونة باريسية', [('m185', 540), ('m188', 540)])
add(poster, 'P_montale', NOIR, M('MONTALE', 104), 'عود فرنسي', [('m280', 500), ('m281', 500)])
add(poster, 'P_mancera', OXBLOOD, M('MANCERA', 104), 'طابع جريء', [('m258', 520), ('m267', 500)])

# occasions (portrait cards) ------------------------------------------------------------
add(poster, 'O_work', NAVY, M('AT WORK', 64, '#C9A66B'), 'عطور العمل', [('m5', 480), ('m318', 440), ('m218', 480)], tsize=96)
add(poster, 'O_night', OXBLOOD, M('NIGHT OUT', 64, '#D9B27A'), 'عطور السهرة', [('m28', 500), ('m187', 520), ('m164', 440)], tsize=96)
add(poster, 'O_summer', OCEAN, M('SUMMER', 64, '#9FD0E6'), 'عطور الصيف', [('m41', 480), ('m143', 460), ('m106', 440)], tsize=96)
add(poster, 'O_winter', COGNAC, M('WINTER', 64, '#D8AE6E'), 'عطور الشتاء', [('m110', 480), ('m20', 500), ('m258', 480)], tsize=96)
add(poster, 'O_gift', ROYAL, M('THE GIFT', 64, '#D6B676'), 'هدية تليق به', [('m4', 460), ('m237', 480), ('m243', 440)], tsize=96)

add(strip, 'S_budget', LINEN, 'عطور رجالية بأقل من ٥٠ ألف', 'اختيارات أصلية بأسعار مدروسة', 'تسوّق الآن',
    [('m59', 360), ('m66', 380), ('m63', 340), ('m95', 360), ('m133', 360)])

# brand rooms ------------------------------------------------------------------------
add(hero, 'R_dior', STEEL, M('DIOR', 120), 'PARIS', 'سوفاج — الأيقونة', 'أو دو تواليت، بارفان وإليكسير', 'تسوّق ديور', [('m12', 470), ('m20', 470), ('m16', 480)])
add(hero, 'R_tomford', NOIR, M('TOM FORD', 96), 'PRIVATE BLEND', 'روائح لا تُنسى', 'نيرولي بورتوفينو وتشيري سموك', 'تسوّق توم فورد', [('m106', 430), ('m107', 430), ('m105', 430) if os.path.exists(P('m105')) else ('m112', 430)])
add(hero, 'R_pdm', FOREST, M('PARFUMS DE MARLY', 64), 'PARIS', 'حضور ملكي', 'عطور فاخرة بتوقيع القصور الفرنسية', 'تسوّق بارفيوم دي مارلي', [('m241', 470), ('m237', 500), ('m240', 470)])
add(hero, 'R_jpg', NAVY, M('JEAN PAUL GAULTIER', 56), 'PARIS', 'أيقونة باريسية', 'لو مال ولو بو — جرأة لا تُنسى', 'تسوّق غوتييه', [('m186', 480), ('m185', 480), ('m188', 480), ('m187', 480)])
add(hero, 'R_xerjoff', ROYAL, M('XERJOFF', 100), 'TORINO', 'فن العطر الإيطالي', 'كازاموراتي وناكسوس وألكسندريا', 'تسوّق كسرجوف', [('m249', 440), ('m243', 440), ('m253', 440)])
add(hero, 'R_versace', OCEAN, M('VERSACE', 96), 'MILANO', 'إيروس الأسطوري', 'إيروس وديلان بلو — قوة وانتعاش', 'تسوّق فيرساتشي', [('m159', 400), ('m160', 450), ('m164', 450)])
add(hero, 'R_paco', ROYAL, M('RABANNE', 100), 'PARIS', 'ذهب وانتصار', 'ون مليون وإنفيكتوس وفانتوم', 'تسوّق رابان', [('m77', 450), ('m86', 480), ('m79', 480)])
add(hero, 'R_amouage', FOREST, M('AMOUAGE', 100), 'OMAN', 'عطور سلطنة عُمان', 'عطور فاخرة بروح الشرق', 'تسوّق أمواج', [('m256', 560)])
add(hero, 'R_mancera', OXBLOOD, M('MANCERA', 100), 'PARIS', 'طابع جريء', 'ريد توباكو وأود فانيل وسيدرات', 'تسوّق مانسيرا', [('m258', 470), ('m267', 470), ('m263', 470)])
add(hero, 'R_montale', NOIR, M('MONTALE', 100), 'PARIS', 'عود فرنسي', 'عطور شرقية بروح باريسية', 'تسوّق مونتال', [('m280', 480), ('m281', 480)])
add(hero, 'R_sospiro', FOREST, M('SOSPIRO', 100), 'ITALIA', 'فخامة إيطالية', 'عطور نيش بزجاجات أيقونية', 'تسوّق سوسبيرو', [('m455', 560)])
add(hero, 'R_care', LINEN, M('GROOMING', 80, '#17140F'), 'FOR MEN', 'عناية الرجل', 'مزيل عرق وشامبو وعناية يومية', 'تسوّق العناية', [('m71', 400), ('m332', 400), ('m433', 380), ('m501', 400)])

if __name__ == '__main__':
    flt = sys.argv[1] if len(sys.argv) > 1 else ''
    for name, fn, a, k in SPECS:
        if flt in name: fn(name, *a, **k)
