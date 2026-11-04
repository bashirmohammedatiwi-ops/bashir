# Product image standardiser: classify each image, then (for studio packshots) whiten the background
# and re-frame the product on a square white canvas at a consistent fill.
import sys, os, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

S = 1600          # output canvas
FILL = 0.84       # product's longest side / canvas
MAX_UP = 2.6      # never upscale more than this

def analyse(rgb):
    a = np.asarray(rgb).astype(np.int16)
    h, w, _ = a.shape
    b = max(4, int(min(h, w) * 0.015))
    border = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    bg = np.median(border, 0)
    dev = np.abs(border - bg).max(1)
    uniform = float((dev <= 14).mean())           # share of border pixels close to the bg colour
    return a, bg, uniform

def bg_mask(a, bg, tol):
    """pixels near bg colour that are connected to the image border."""
    near = np.abs(a - bg).max(2) <= tol
    lab, n = ndimage.label(near)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    edge = edge[edge > 0]
    return np.isin(lab, edge)

def process(path, out, primary):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); base = Image.new('RGBA', im.size, (255, 255, 255, 255)); base.alpha_composite(im); im = base
    rgb = im.convert('RGB')
    a, bg, uniform = analyse(rgb)
    light = float(bg.min())
    spread = float(bg.max() - bg.min())
    info = dict(bg=[int(x) for x in bg], uniform=round(uniform, 3), w=rgb.width, h=rgb.height)
    # studio packshot: almost the whole border is one flat colour
    if uniform < 0.93:
        return dict(info, action='skip', reason='busy-background')
    if light < 150 and not primary:
        return dict(info, action='skip', reason='dark-background')
    if light < 90:
        return dict(info, action='skip', reason='dark-background')
    neutral = spread <= 12
    if not (light >= 200 and (neutral or light >= 238)):
        if not primary or light < 200:
            return dict(info, action='skip', reason='coloured-background')
    is_white = light >= 251 and spread <= 4
    # secondary images on a tinted backdrop are designed graphics: leave them as they are
    if not primary and not is_white:
        return dict(info, action='skip', reason='secondary-tinted')
    tol = 10 if is_white else 16 if light >= 200 else 22
    bgm = bg_mask(a, bg, tol)
    fg = ~bgm
    fg = ndimage.binary_opening(fg, iterations=2)
    lab, n = ndimage.label(fg)
    if n == 0:
        return dict(info, action='skip', reason='empty')
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    keep = np.isin(lab, np.where(sizes >= max(60, fg.size * 0.0004))[0] + 1)
    if keep.sum() < fg.size * 0.004:
        return dict(info, action='skip', reason='tiny-object')
    big = int((sizes >= max(60, fg.size * 0.0004)).sum())
    ys, xs = np.where(keep)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cover = (x1 - x0) * (y1 - y0) / fg.size
    fill_now = max((x1 - x0) / rgb.width, (y1 - y0) / rgb.height)
    cx = ((x0 + x1) / 2) / rgb.width; cy = ((y0 + y1) / 2) / rgb.height
    square = abs(rgb.width - rgb.height) <= 2
    density = keep.sum() / max(1, (x1 - x0) * (y1 - y0))
    info.update(fill=round(fill_now, 3), cx=round(cx, 3), cy=round(cy, 3), cover=round(cover, 3), density=round(float(density), 3), parts=big)
    if density < 0.12 and big >= 25:
        return dict(info, action='skip', reason='text-graphic')
    if is_white and square and 0.78 <= fill_now <= 0.90 and abs(cx - 0.5) < 0.04 and abs(cy - 0.5) < 0.04:
        return dict(info, action='keep', reason='already-standard')
    # whiten background with a feathered mask (product pixels untouched)
    m = Image.fromarray((bgm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    white = Image.new('RGB', rgb.size, (255, 255, 255))
    clean = Image.composite(white, rgb, m)
    c = frame(clean, (x0, y0, x1, y1), out)
    return dict(info, action='process', reason='white' if is_white else 'tinted-bg', **c)

def frame(clean, box, out):
    """crop the product box and centre it on a square white canvas at FILL; small sources get a smaller canvas
    so the product is never shown smaller than it was."""
    x0, y0, x1, y1 = box
    pad = int(max(x1 - x0, y1 - y0) * 0.01)
    crop = clean.crop((max(0, x0 - pad), max(0, y0 - pad), min(clean.width, x1 + pad), min(clean.height, y1 + pad)))
    cw, ch = crop.size
    s = min(S * FILL / max(cw, ch), MAX_UP)
    nw, nh = max(1, round(cw * s)), max(1, round(ch * s))
    C = max(800, min(S, round(max(nw, nh) / FILL)))
    if max(nw, nh) > C:
        k = C / max(nw, nh); nw, nh = max(1, round(nw * k)), max(1, round(nh * k)); s *= k
    crop = crop.resize((nw, nh), Image.LANCZOS)
    if s > 1.25:
        crop = crop.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
    can = Image.new('RGB', (C, C), (255, 255, 255))
    can.paste(crop, ((C - nw) // 2, (C - nh) // 2))
    can.save(out, quality=92)
    return dict(scale=round(s, 2), canvas=C)

_SESS = None
def segment(rgb):
    """isnet-general-use foreground probability (0..1) at the image size."""
    global _SESS
    import onnxruntime as ort
    if _SESS is None:
        o = ort.SessionOptions(); o.intra_op_num_threads = 1; o.inter_op_num_threads = 1
        _SESS = ort.InferenceSession('/work/models/isnet-general-use.onnx', o, providers=['CPUExecutionProvider'])
    im = np.asarray(rgb.resize((1024, 1024), Image.LANCZOS)).astype(np.float32)
    im = im / max(im.max(), 1e-6) - 0.5
    x = im.transpose(2, 0, 1)[None].astype(np.float32)
    p = _SESS.run(None, {_SESS.get_inputs()[0].name: x})[0][0, 0]
    p = (p - p.min()) / max(p.max() - p.min(), 1e-6)
    return np.asarray(Image.fromarray((p * 255).astype(np.uint8)).resize(rgb.size, Image.LANCZOS)).astype(np.float32) / 255

def process_seg(path, out):
    """primary packshot on a light gradient / vignette backdrop: cut the product out and put it on white."""
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); base = Image.new('RGBA', im.size, (255, 255, 255, 255)); base.alpha_composite(im); im = base
    rgb = im.convert('RGB')
    a, bg, uniform = analyse(rgb)
    info = dict(bg=[int(x) for x in bg], uniform=round(uniform, 3), w=rgb.width, h=rgb.height)
    if bg.min() < 200:
        return dict(info, action='skip', reason='busy-background')
    p = segment(rgb)
    alpha = np.clip((p - 0.08) / 0.84, 0, 1)
    solid = alpha > 0.5
    cover = float(solid.mean())
    lab, n = ndimage.label(solid)
    if n == 0 or cover < 0.03:
        return dict(info, action='skip', reason='seg-empty', seg_cover=round(cover, 3))
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    keep = np.isin(lab, np.where(sizes >= sizes.max() * 0.02)[0] + 1)
    ys, xs = np.where(keep)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    edge = float(np.concatenate([keep[0], keep[-1], keep[:, 0], keep[:, -1]]).mean())
    info.update(seg_cover=round(cover, 3), edge=round(edge, 3), fill=round(max((x1 - x0) / rgb.width, (y1 - y0) / rgb.height), 3))
    if cover > 0.80 or edge > 0.12:
        return dict(info, action='skip', reason='seg-fills-frame')
    m = Image.fromarray((alpha * 255).astype(np.uint8))
    clean = Image.composite(rgb, Image.new('RGB', rgb.size, (255, 255, 255)), m)
    c = frame(clean, (x0, y0, x1, y1), out)
    return dict(info, action='process', reason='segmented', **c)

if __name__ == '__main__':
    src, dst, primary = sys.argv[1], sys.argv[2], sys.argv[3] == '1'
    print(json.dumps(process(src, dst, primary)))
