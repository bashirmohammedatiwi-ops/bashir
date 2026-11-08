# Apply image fixes from fix_out_*.json: web → download + frame; photo → crop/rotate full-res staff photo, cutout, frame.
import json, glob, os, sys
sys.argv = [sys.argv[0]]  # prep.py reads argv as key filter
exec(open('/dr2/prep.py').read().split('plan = {}')[0])
BOX = set('56a348f0 892ab3c1 1c5fbede 8300a46c f28b85b6 0a5d6abd 3e379c2d 82d57357 57514068 2fab4811 813dcdbc 7815b847 c8c580a5 ced01a84 739070b4 4ba765a3 dec23f78 9527479a a946dcad cf030f5c 1d30f65b 7a8272e5 f4941e67 5ae9dcf2 742be886'.split())
def boxshot(im, dst):
    # photographed product kept as a clean rectangle on white with a soft drop shadow (no AI cutout)
    w, h = im.size; s = min(S * 0.80 / w, S * 0.80 / h); im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    can = Image.new('RGB', (S, S), 'white'); x, y = (S - im.width) // 2, (S - im.height) // 2
    sh = Image.new('L', (S, S), 0); sh.paste(60, (x + 14, y + 22, x + im.width + 14, y + im.height + 22)); sh = sh.filter(ImageFilter.GaussianBlur(26))
    can.paste(Image.new('RGB', (S, S), (120, 115, 125)), (0, 0), sh)
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=max(6, im.width // 60), fill=255)
    can.paste(im, (x, y), m); can.save(dst, quality=92)
from PIL import ImageDraw
fixes = [y for f in sorted(glob.glob('/dr2/fix_out_*.json')) for y in json.load(open(f))]
byk = {d[:8]: d for d in drafts}
images = json.load(open('/dr2/images.json'))
for fx in fixes:
    k = fx['key']; did = byk[k]
    try:
        if fx['mode'] == 'web':
            src = get(fx['url'], f'/dr2/web/{k}_fix')
            rgba = web_to_rgba(src)
            if rgba is None: rgba = cutout(Image.open(src).convert('RGB'))
            dst = f'/dr2/final/{k}_f.jpg'; frame(rgba, dst, shadow=False)
        elif fx['mode'] == 'photo':
            n = int(fx['photo'].rsplit('_', 1)[1].split('.')[0])
            url = drafts[did]['imgs'][n].replace('_large.webp', '.webp').replace('http://187.127.88.146', 'https://deemaalhayat.com')
            src = get(url, f'/dr2/full/{k}_{n}.webp')
            im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
            l, t, r, b = fx.get('crop') or [0, 0, 1, 1]; W, H = im.size
            im = im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
            if fx.get('rotate'): im = im.rotate(fx['rotate'], expand=True, resample=Image.BICUBIC, fillcolor=(255, 255, 255))
            if max(im.size) > 2400: im.thumbnail((2400, 2400), Image.LANCZOS)
            dst = f'/dr2/final/{k}_f.jpg'
            if k in BOX: boxshot(im, dst)
            else: frame(cutout(im), dst, shadow=True)
        else:
            print('keep', k); continue
        images[did] = [os.path.basename(dst)]; print('fixed', k, fx['mode'], flush=True)
    except Exception as e:
        print('ERR', k, e, flush=True)
json.dump(images, open('/dr2/images.json', 'w'))
