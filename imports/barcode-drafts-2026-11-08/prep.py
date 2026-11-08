# Build final product images (1600 white, ~84% fill) for every draft in out*.json.
# web → download + whiten/frame; staff_photo → full-res original, isnet cutout, white + soft shadow.
import json, glob, os, sys, subprocess, numpy as np
from PIL import Image, ImageFilter, ImageOps
D = os.path.dirname(os.path.abspath(__file__)); S = 1600; FILL = 0.82
drafts = {x['id']: x for x in json.load(open(f'{D}/drafts.json'))}
items = [y for f in sorted(glob.glob(f'{D}/out*.json')) for y in json.load(open(f))]
def get(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 2000: return dst
    import urllib.request
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36', 'Accept': 'image/*,*/*'})
    open(dst, 'wb').write(urllib.request.urlopen(req, timeout=90).read())
    return dst
def frame(rgba, dst, shadow=True):
    bb = rgba.getbbox(); rgba = rgba.crop(bb)
    w, h = rgba.size; s = min(S * FILL / w, S * FILL / h, 3.0); rgba = rgba.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    can = Image.new('RGBA', (S, S), (255, 255, 255, 255)); x, y = (S - rgba.width) // 2, (S - rgba.height) // 2
    if shadow:
        a = rgba.split()[3]; sh = Image.new('RGBA', rgba.size, (40, 30, 50, 0)); sh.putalpha(a.point(lambda v: int(v * 0.22)))
        sh = sh.resize((rgba.width, max(1, rgba.height // 9))); layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        layer.alpha_composite(sh, (x, min(S - sh.height, y + rgba.height - sh.height // 2))); can.alpha_composite(layer.filter(ImageFilter.GaussianBlur(22)))
    can.alpha_composite(rgba, (x, y)); can.convert('RGB').save(dst, quality=92)
def web_to_rgba(src):
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P') and 'A' in im.convert('RGBA').getbands():
        im = im.convert('RGBA')
        if np.asarray(im)[..., 3].min() < 250: return im
    rgb = im.convert('RGB'); a = np.asarray(rgb).astype(int)
    # near-white background → transparent (flood from border)
    from scipy import ndimage
    near = (a.min(2) >= 238)
    lab, n = ndimage.label(near); edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
    bg = np.isin(lab, edge)
    if bg.mean() < 0.12: return None  # not a white-background packshot → needs cutout
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8)))
    out = rgb.convert('RGBA'); out.putalpha(Image.fromarray(alpha)); return out
sys.path.insert(0, '/work')
from std import segment
def cutout(rgb):
    p = segment(rgb)
    a = np.clip((p - 0.10) / 0.80, 0, 1)
    from scipy import ndimage
    solid = a > 0.5; lab, n = ndimage.label(solid)
    if n:
        sizes = ndimage.sum(solid, lab, range(1, n + 1)); keep = np.isin(lab, np.where(sizes >= sizes.max() * 0.03)[0] + 1)
        a = a * ndimage.binary_dilation(keep, iterations=6)
    out = rgb.convert('RGBA'); out.putalpha(Image.fromarray((a * 255).astype(np.uint8))); return out
plan = {}
only = set(sys.argv[1:])
for it in items:
    did = it['draftId']; k = did[:8]
    if only and k not in only: continue
    out = []
    try:
        if it.get('imageSource') == 'web' and it.get('imageUrls'):
            for j, u in enumerate(it['imageUrls'][:3]):
                try:
                    src = get(u, f'{D}/web/{k}_{j}')
                    rgba = web_to_rgba(src)
                except Exception: continue
                if rgba is None: rgba = cutout(Image.open(src).convert('RGB'))
                dst = f'{D}/final/{k}_{j}.jpg'; frame(rgba, dst, shadow=False); out.append(os.path.basename(dst))
        if not out:
            sp = it.get('staffPhoto') or f'{k}_0.webp'; n = int(sp.rsplit('_', 1)[1].split('.')[0]) if '_' in sp else 0
            url = drafts[did]['imgs'][min(n, len(drafts[did]['imgs']) - 1)].replace('_large.webp', '.webp').replace('http://187.127.88.146', 'https://deemaalhayat.com')
            src = get(url, f'{D}/full/{k}_{n}.webp')
            rgb = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
            if max(rgb.size) > 2400: rgb.thumbnail((2400, 2400), Image.LANCZOS)
            dst = f'{D}/final/{k}_s.jpg'; frame(cutout(rgb), dst, shadow=True); out.append(os.path.basename(dst))
    except Exception as e:
        print('ERR', k, e, flush=True)
    plan[did] = out; print(k, it.get('imageSource'), out, flush=True)
json.dump(plan, open(f'{D}/images.json' if not only else f'{D}/images_part.json', 'w'))
