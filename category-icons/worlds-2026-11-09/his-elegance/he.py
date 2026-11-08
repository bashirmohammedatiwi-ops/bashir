# His Elegance — "noir gentleman" luxury campaign templates (extends kit.render; same output sizes as kit)
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT + '/kit')
import kit
kit.CSS += 'body{font-optical-sizing:none}'
from kit import render, GRAIN, set_out, sheet
P = os.path.dirname(os.path.abspath(__file__)) + '/photos/'

GOLD = '#C9A96A'; IVORY = '#F3EDE2'; MUTED = 'rgba(243,237,226,.78)'

def rgba(hexc, a):
    h = hexc.lstrip('#'); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f'rgba({r},{g},{b},{a})'

# brand wordmarks (typographic approximations, never logos)
def W(brand, size=58, col=IVORY):
    s = {
      'chanel':   ('CHANEL', 'Jost', 500, '.32em', False),
      'dior':     ('DIOR', 'Bodoni', 500, '.16em', False),
      'tomford':  ('TOM FORD', 'Mont', 500, '.34em', False),
      'rabanne':  ('rabanne', 'Jost', 600, '.06em', False),
      'armani':   ('GIORGIO ARMANI', 'Corm', 600, '.28em', False),
      'emporio':  ('EMPORIO ARMANI', 'Corm', 600, '.26em', False),
      'creed':    ('CREED', 'Cinzel', 700, '.24em', False),
      'montblanc':('MONTBLANC', 'Mont', 600, '.26em', False),
      'boss':     ('BOSS', 'Mont', 800, '.22em', False),
      'versace':  ('VERSACE', 'Cinzel', 600, '.3em', False),
      'ysl':      ('YVES SAINT LAURENT', 'Corm', 700, '.16em', False),
      'azzaro':   ('AZZARO', 'Mont', 300, '.5em', False),
      'valentino':('VALENTINO', 'Corm', 700, '.24em', False),
      'jpg':      ('JEAN PAUL GAULTIER', 'Jost', 500, '.2em', False),
      'pdm':      ('PARFUMS de MARLY', 'Cinzel', 600, '.16em', False),
      'xerjoff':  ('XERJOFF', 'Cinzel', 600, '.32em', False),
      'amouage':  ('AMOUAGE', 'Cinzel', 500, '.34em', False),
      'mancera':  ('MANCERA', 'Corm', 700, '.3em', False),
      'montale':  ('MONTALE', 'Cinzel', 600, '.32em', False),
      'prada':    ('PRADA', 'Mont', 800, '.16em', False),
      'ch':       ('CAROLINA HERRERA', 'Corm', 700, '.18em', False),
      'his':      ('HIS ELEGANCE', 'Cinzel', 600, '.3em', False),
      'groom':    ('THE GROOMING ROOM', 'Cinzel', 600, '.22em', False),
      'gift':     ('THE GIFT EDIT', 'Cinzel', 600, '.26em', False),
    }[brand]
    t, f, w, ls, it = s
    return kit.WM(t, size, col, font=f, weight=w, ls=ls, italic=it)

def _corners(x, y, w, h, col, L=46, inset=0):
    st = f'position:absolute;width:{L}px;height:{L}px;border-color:{col};border-style:solid;z-index:40'
    return (f'<div style="{st};left:{x}px;top:{y}px;border-width:2px 0 0 2px"></div>'
            f'<div style="{st};left:{x+w-L}px;top:{y}px;border-width:2px 2px 0 0"></div>'
            f'<div style="{st};left:{x}px;top:{y+h-L}px;border-width:0 0 2px 2px"></div>'
            f'<div style="{st};left:{x+w-L}px;top:{y+h-L}px;border-width:0 2px 2px 0"></div>')

def _textblock(word, kicker, head, sub, cta, ink, gold, sub_col, hsize, cta_style, align='flex-start', subsize=50, ctasize=40):
    if cta_style == 'solid':
        c = f'background:{gold};color:#0E0F12'
    else:
        c = f'border:2.5px solid {gold};color:{ink};background:{rgba("#000000",0) }'
    return f"""
  <div>{word}</div>
  <div style="display:flex;align-items:center;gap:22px;margin-top:30px"><span style="display:block;width:70px;height:2px;background:{gold}"></span>
    <span class="kick" style="font-size:25px;color:{gold}">{kicker}</span></div>
  <div style="font-family:Bodoni;font-style:italic;font-weight:600;font-size:{hsize}px;line-height:1.02;margin-top:22px;white-space:nowrap;color:{ink};letter-spacing:-.005em">{head}</div>
  <div class="ar" style="font-family:Plex;font-weight:500;font-size:{subsize}px;color:{sub_col};margin-top:24px;white-space:nowrap">{sub}</div>
  <div style="margin-top:44px;display:flex;direction:rtl"><span class="cta" style="font-size:{ctasize}px;padding:20px 50px;{c}">{cta} <span>←</span></span></div>"""

def banner(name, photo, word, kicker, head, sub, cta, layout='split', side='left', bg='#0B1220', ink=IVORY, gold=GOLD,
           sub_col=None, pos='center', panel=1100, hsize=112, cta_style='outline', scrim_to=56, scrim_a=1.0, fit='cover',
           W_=2150, H_=1000, extra='', filt='', subsize=50, corners=True):
    """side = where the TEXT sits. layout 'split' = photo panel on the other side (hard edge + gold hairline);
    'bleed' = full-bleed photo + gradient scrim from the text side."""
    sub_col = sub_col or (MUTED if ink == IVORY else rgba(ink, .8))
    ph = f"url('file://{P}{photo}') {pos}/{fit} no-repeat"
    if layout == 'split':
        px = W_ - panel if side == 'left' else 0
        tx0, tw = (0, W_ - panel) if side == 'left' else (panel, W_ - panel)
        media = (f'<div class="a" style="left:{px}px;top:0;width:{panel}px;height:{H_}px;background:{ph};z-index:2;{filt}"></div>'
                 f'<div class="a" style="left:{px if side=="left" else panel-3}px;top:0;width:3px;height:{H_}px;background:{gold};opacity:.85;z-index:5"></div>')
        # soft inner vignette on the panel edge for depth
        deg = '90deg' if side == 'left' else '270deg'
        media += f'<div class="a" style="left:{px}px;top:0;width:{panel}px;height:{H_}px;z-index:3;background:linear-gradient({deg},{rgba(bg,.35)} 0%,{rgba(bg,0)} 18%)"></div>'
    else:
        tx0, tw = (0, int(W_ * scrim_to / 100)) if side == 'left' else (W_ - int(W_ * scrim_to / 100), int(W_ * scrim_to / 100))
        deg = '90deg' if side == 'left' else '270deg'
        media = (f'<div class="a" style="inset:0;background:{ph};z-index:2;{filt}"></div>'
                 f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{rgba(bg,scrim_a)} 0%,{rgba(bg,scrim_a*.92)} {scrim_to-26}%,{rgba(bg,0)} {scrim_to+8}%)"></div>')
    pad = 120
    cn = _corners(tx0 + 44, 44, tw - 88, H_ - 88, rgba(gold, .55)) if corners else ''
    body = f"""<div class="a" style="inset:0;background:{bg}"></div>{media}{extra}{cn}
<div class="a" style="left:{tx0 + pad}px;top:0;bottom:0;width:{tw - pad - 70}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;text-align:left">
{_textblock(word, kicker, head, sub, cta, ink, gold, sub_col, hsize, cta_style, subsize=subsize)}
</div>{GRAIN}"""
    return render(name, W_, H_, body)

def card(name, photo, word, kicker, head, sub, cta, bg='#0B1220', ink=IVORY, gold=GOLD, pos='center 20%', hsize=92, fade=(28, 60), fit='cover', filt=''):
    body = f"""<div class="a" style="inset:0;background:url('file://{P}{photo}') {pos}/{fit} no-repeat;{filt}"></div>
<div class="a" style="inset:0;background:linear-gradient(0deg,{rgba(bg,1)} 0%,{rgba(bg,.96)} {fade[0]}%,{rgba(bg,0)} {fade[1]}%)"></div>
<div class="a" style="inset:30px;border:1.5px solid {rgba(gold,.5)};z-index:40"></div>
<div class="a" style="left:76px;right:76px;bottom:84px;display:flex;flex-direction:column;align-items:flex-start;z-index:50;text-align:left">
  <div>{word}</div>
  <div style="display:flex;align-items:center;gap:16px;margin-top:20px"><span style="display:block;width:50px;height:2px;background:{gold}"></span><span class="kick" style="font-size:20px;color:{gold}">{kicker}</span></div>
  <div style="font-family:Bodoni;font-style:italic;font-weight:600;font-size:{hsize}px;line-height:1.02;margin-top:12px;white-space:nowrap;color:{ink}">{head}</div>
  <div class="ar" style="font-family:Plex;font-weight:500;font-size:38px;color:{MUTED if ink==IVORY else rgba(ink,.8)};margin-top:14px;white-space:nowrap">{sub}</div>
  <div style="margin-top:30px;direction:rtl"><span class="cta" style="font-size:34px;padding:16px 42px;border:2.5px solid {gold};color:{ink}">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, 1080, 1350, body)

def tile(name, photo, ar, en, bg='#0B1220', gold=GOLD, pos='center', fit='cover', filt=''):
    body = f"""<div class="a" style="inset:0;background:url('file://{P}{photo}') {pos}/{fit} no-repeat;{filt}"></div>
<div class="a" style="inset:0;background:linear-gradient(0deg,{rgba(bg,.92)} 0%,{rgba(bg,.55)} 28%,{rgba(bg,0)} 55%)"></div>
<div class="a" style="inset:22px;border:1.5px solid {rgba(gold,.55)};z-index:40"></div>
<div class="a" style="left:56px;right:56px;bottom:58px;z-index:50;text-align:right">
  <div style="display:flex;justify-content:flex-end;align-items:center;gap:14px"><span class="kick" style="font-size:19px;color:{gold}">{en}</span><span style="display:block;width:40px;height:2px;background:{gold}"></span></div>
  <div class="ar" style="font-family:Messiri;font-weight:700;font-size:70px;line-height:1.15;margin-top:6px;color:{IVORY}">{ar}</div>
</div>{GRAIN}"""
    return render(name, 800, 800, body)

def strip(name, photo, kicker, head, sub, cta, side='left', bg='#0B1220', ink=IVORY, gold=GOLD, pos='center', panel=900, hsize=90, fit='cover', layout='split'):
    W_, H_ = 2150, 600
    ph = f"url('file://{P}{photo}') {pos}/{fit} no-repeat"
    if layout == 'split':
        px = W_ - panel if side == 'left' else 0
        tx0, tw = (0, W_ - panel) if side == 'left' else (panel, W_ - panel)
        media = (f'<div class="a" style="left:{px}px;top:0;width:{panel}px;height:{H_}px;background:{ph};z-index:2"></div>'
                 f'<div class="a" style="left:{px if side=="left" else panel-3}px;top:0;width:3px;height:{H_}px;background:{gold};opacity:.85;z-index:5"></div>')
    else:
        tx0, tw = (0, 1250) if side == 'left' else (900, 1250)
        deg = '90deg' if side == 'left' else '270deg'
        media = (f'<div class="a" style="inset:0;background:{ph};z-index:2"></div>'
                 f'<div class="a" style="inset:0;z-index:3;background:linear-gradient({deg},{rgba(bg,1)} 0%,{rgba(bg,.94)} 40%,{rgba(bg,0)} 66%)"></div>')
    sc = MUTED if ink == IVORY else rgba(ink, .8)
    body = f"""<div class="a" style="inset:0;background:{bg}"></div>{media}{_corners(tx0+34, 34, tw-68, H_-68, rgba(gold,.55), L=36)}
<div class="a" style="left:{tx0+104}px;top:0;bottom:0;width:{tw-150}px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;z-index:50;text-align:left">
  <div style="display:flex;align-items:center;gap:20px"><span style="display:block;width:60px;height:2px;background:{gold}"></span><span class="kick" style="font-size:23px;color:{gold}">{kicker}</span></div>
  <div style="font-family:Bodoni;font-style:italic;font-weight:600;font-size:{hsize}px;line-height:1.04;margin-top:14px;white-space:nowrap;color:{ink}">{head}</div>
  <div style="display:flex;align-items:center;gap:30px;margin-top:22px;direction:rtl">
    <div class="ar" style="font-family:Plex;font-weight:500;font-size:42px;color:{sc};white-space:nowrap">{sub}</div>
    <span class="cta" style="font-size:34px;padding:15px 40px;background:{gold};color:#0E0F12">{cta} <span>←</span></span></div>
</div>{GRAIN}"""
    return render(name, W_, H_, body)
