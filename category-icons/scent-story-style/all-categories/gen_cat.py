# Category icons in the approved scent-story style: 1024 transparent, pastel disk + white ring + real packshot(s).
# usage: python3 gen_cat.py [index ...]
import os, sys, json, colorsys, subprocess, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
from gen import page, CHROME
from picks import PICKS

CUT = os.path.join(HERE, 'cut'); ROT = os.path.join(HERE, 'cutR'); OUT = os.path.join(HERE, 'icons'); HTML = os.path.join(HERE, 'html')
for d in (ROT, OUT, HTML): os.makedirs(d, exist_ok=True)
ranked = json.load(open(os.path.join(HERE, 'ranked.json'))); order = json.load(open(os.path.join(HERE, 'order.json')))
OVERRIDE_TINT = json.load(open(os.path.join(HERE, 'tints.json'))) if os.path.exists(os.path.join(HERE, 'tints.json')) else {}

def src(row, j, rot):
    pid = ranked[order[row]][j]['pid'][:12]
    p = os.path.join(CUT, pid + '.png')
    if not rot: return p
    q = os.path.join(ROT, f'{pid}_{rot}.png')
    if not os.path.exists(q):
        im = Image.open(p).convert('RGBA').rotate(rot, resample=Image.BICUBIC, expand=True)
        bb = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
        im.crop(bb).save(q)
    return q

def hue_of(paths):
    """Dominant hue of the product pixels (circular mean over saturated, opaque pixels)."""
    xs, ys, ws = [], [], []
    for p in paths:
        a = np.asarray(Image.open(p).convert('RGBA').resize((160, 160))).reshape(-1, 4).astype(float) / 255
        m = a[:, 3] > .8
        for r, g, b in a[m][:, :3][::3]:
            h, l, s = colorsys.rgb_to_hls(r, g, b)
            w = s * (1 - abs(2 * l - 1))           # chroma: ignore whites/blacks/greys
            if w < .18: continue
            xs.append(np.cos(2 * np.pi * h) * w); ys.append(np.sin(2 * np.pi * h) * w); ws.append(w)
    if sum(ws) < 30: return None                    # neutral product → champagne
    return (np.arctan2(sum(ys), sum(xs)) / (2 * np.pi)) % 1

def hexc(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h, l, s); return '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))

def disk_for(hue):
    if hue is None: return 'radial-gradient(circle at 50% 40%,#FBF6EC,#E6D5B5)'
    return f'radial-gradient(circle at 50% 40%,{hexc(hue, .975, .7)},{hexc(hue, .85, .52)})'

def prods(items, maxw=860, gap=-40):
    ar = [Image.open(p).size for p, _ in items]
    total = sum(w / h * hh for (w, h), (_, hh) in zip(ar, items)) + gap * (len(items) - 1)
    k = min(1.0, maxw / total) if total > 0 else 1
    imgs = ''.join(f'<img src="file://{p}" style="height:{int(hh * k)}px;margin:0 {gap * k / 2}px">' for p, hh in items)
    return f'<div class="prods" style="left:60px;right:60px;bottom:150px;height:840px">{imgs}</div>'

def icon(idx):
    items = [(src(r, j, rot), h) for r, j, h, rot in PICKS[idx]]
    cid = order[idx]
    disk = OVERRIDE_TINT.get(str(idx)) or disk_for(hue_of([p for p, _ in items]))
    body = f"""
<div style="position:absolute;left:92px;top:150px;width:840px;height:840px;border-radius:50%;background:{disk};box-shadow:inset 0 0 0 10px rgba(255,255,255,.9)"></div>
<div class="floor" style="left:230px;right:230px;bottom:120px;height:70px;background:radial-gradient(closest-side,rgba(40,10,40,.25),transparent)"></div>
{prods(items, gap=-40 if len(items) > 1 else 0)}"""
    doc = page(1024, 1024, body, 'html,body{background:transparent}')
    hp = os.path.join(HTML, f'{idx:03d}.html'); open(hp, 'w').write(doc)
    out = os.path.join(OUT, f'{idx:03d}_{cid}.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    '--window-size=1024,1024', '--force-device-scale-factor=1', '--virtual-time-budget=3000',
                    '--default-background-color=00000000', f'--screenshot={out}', 'file://' + hp],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    return out

if __name__ == '__main__':
    want = [int(a) for a in sys.argv[1:]] or sorted(PICKS)
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(6) as ex:
        for o in ex.map(icon, want): pass
    print('rendered', len(want))
