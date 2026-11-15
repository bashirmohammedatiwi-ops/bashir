# usage: python3 -I dl.py <outdir> <urls-file>   -> downloads, keeps >=700px, writes <outdir>/_sheet.jpg with index labels
import sys, os, hashlib, subprocess
from PIL import Image, ImageDraw
out, lst = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
urls = [l.strip() for l in open(lst) if l.strip() and not l.startswith('#')]
for u in urls:
    base = os.path.basename(u.split('?')[0])[:60]; h = hashlib.md5(u.encode()).hexdigest()[:6]
    p = f'{out}/{h}_{base}'
    if not os.path.exists(p):
        r = subprocess.run(['curl', '-sfL', '--max-time', '60', '-A', UA, '-o', p, u])
        if r.returncode: print('FAIL', u); continue
    try:
        im = Image.open(p); w, hh = im.size
        if min(w, hh) < int(os.environ.get("MINPX", 600)): os.remove(p); print('small', w, hh, base); continue
    except Exception as e:
        print('bad', u, e); os.path.exists(p) and os.remove(p); continue
files = sorted(f for f in os.listdir(out) if not f.startswith('_'))
if not files: sys.exit()
T = 300; cols = 6; rows = (len(files) + cols - 1) // cols
s = Image.new('RGB', (cols * T, rows * (T + 22)), 'white'); d = ImageDraw.Draw(s)
for i, f in enumerate(files):
    try: im = Image.open(f'{out}/{f}').convert('RGB')
    except Exception: continue
    sz = im.size; im.thumbnail((T, T)); x, y = (i % cols) * T, (i // cols) * (T + 22)
    s.paste(im, (x + (T - im.width) // 2, y)); d.text((x + 4, y + T + 4), f'{i} {sz[0]}x{sz[1]} {f[:28]}', fill='black')
s.save(f'{out}/_sheet.jpg', quality=80)
for i, f in enumerate(files): print(i, f)
